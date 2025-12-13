const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(functions.config().stripe?.secret_key);
const { checkUserRateLimit, RATE_LIMITS } = require('../../utils/rateLimiting');
const { retryApiCall } = require('../../utils/retry');

const db = admin.firestore();
const APP_URL = functions.config().app?.url || 'https://bestiesapp.web.app';

// Create Stripe Checkout Session for donations/subscriptions
exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const userId = context.auth.uid;

  // Rate limiting: 10 checkout sessions per hour per user
  const rateLimit = await checkUserRateLimit(
    userId,
    'createCheckoutSession',
    { count: 10, window: 60 * 60 * 1000 }, // 10 per hour
    'checkout_sessions'
  );

  if (!rateLimit.allowed) {
    const resetIn = Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000);
    throw new functions.https.HttpsError(
      'resource-exhausted',
      `Rate limit exceeded. Maximum 10 checkout sessions per hour. Try again in ${resetIn} seconds.`,
      {
        limit: rateLimit.limit,
        count: rateLimit.count,
        resetAt: rateLimit.resetAt.toISOString(),
      }
    );
  }

  const { amount, type } = data; // type: 'donation', 'subscription', or 'sms_extra'

  if (!amount || !type) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing amount or type');
  }

  // Validate amount - only allow specific values
  const validAmounts = type === 'subscription'
    ? [2]  // Only $2/month for SMS subscription
    : type === 'sms_extra'
      ? [1.50]  // Only $1.50 for extra SMS credits
      : [1, 5, 10];  // Donation amounts

  if (!validAmounts.includes(amount)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      type === 'subscription'
        ? 'SMS subscription must be $2/month'
        : type === 'sms_extra'
          ? 'Extra SMS credits must be $1.50'
          : 'Donation amount must be $1, $5, or $10 per month'
    );
  }

  // Extra validation: Only active subscribers can buy extra credits
  if (type === 'sms_extra') {
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const userData = userDoc.data();

    if (!userData?.smsSubscription?.active) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'You must have an active SMS subscription to purchase extra credits'
      );
    }
  }

  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  const userData = userDoc.data();

  try {
    // Create or get Stripe customer
    let customerId = userData.stripeCustomerId;

    if (!customerId) {
      const customer = await retryApiCall(
        async () => {
          return await stripe.customers.create({
            email: userData.email,
            metadata: {
              firebaseUID: context.auth.uid,
            },
          });
        },
        { operationName: 'Create Stripe customer' }
      );
      customerId = customer.id;

      await db.collection('users').doc(context.auth.uid).update({
        stripeCustomerId: customerId,
      });
    }

    // Determine mode based on type
    const sessionMode = type === 'sms_extra' ? 'payment' : 'subscription';

    // Product description
    let productName, productDescription;
    if (type === 'subscription') {
      productName = 'SMS Credits Subscription';
      productDescription = '15 SMS credits per month for safety check-ins';
    } else if (type === 'sms_extra') {
      productName = 'Extra SMS Credits';
      productDescription = '15 additional SMS credits (expires on subscription renewal)';
    } else {
      productName = 'Besties Support';
      productDescription = 'Help keep Besties free for everyone';
    }

    // Create checkout session (with retry)
    const session = await retryApiCall(
      async () => {
        return await stripe.checkout.sessions.create({
          customer: customerId,
          payment_method_types: ['card'],
          mode: sessionMode,  // 'payment' for one-time, 'subscription' for recurring
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: productName,
                  description: productDescription,
                },
                unit_amount: amount * 100, // Convert to cents
                recurring: sessionMode === 'subscription' ? {
                  interval: 'month',
                } : undefined,  // No recurring for one-time payments
              },
              quantity: 1,
            },
          ],
          success_url: `${APP_URL}/subscription-success`,
          cancel_url: `${APP_URL}/settings`,
          metadata: {
            firebaseUID: context.auth.uid,
            type: type,
          },
        });
      },
      { operationName: 'Create Stripe checkout session' }
    );

    // Track this checkout session for rate limiting
    await db.collection('checkout_sessions').add({
      userId,
      sessionId: session.id,
      type: type,
      amount: amount,
      createdAt: admin.firestore.Timestamp.now(),
    });

    return { success: true, url: session.url, sessionId: session.id };
  } catch (error) {
    functions.logger.error('Stripe checkout error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create checkout session');
  }
});
