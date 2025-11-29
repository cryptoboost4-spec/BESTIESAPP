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

  const { amount, type } = data; // type: 'donation' or 'subscription'

  if (!amount || !type) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing amount or type');
  }

  // Validate amount - only allow specific values
  const validAmounts = type === 'subscription' ? [1] : [1, 5, 10];
  if (!validAmounts.includes(amount)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      type === 'subscription'
        ? 'SMS subscription must be $1/month'
        : 'Donation amount must be $1, $5, or $10 per month'
    );
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

    // Create checkout session (with retry)
    const session = await retryApiCall(
      async () => {
        return await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: type === 'subscription' ? 'subscription' : 'subscription', // Both are subscriptions
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: type === 'subscription' ? 'SMS Alerts Subscription' : 'Besties Support',
              description: type === 'subscription'
                ? 'Monthly SMS alerts for safety check-ins'
                : 'Help keep Besties free for everyone',
            },
            unit_amount: amount * 100, // Convert to cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${APP_URL}/subscription-success`,
      cancel_url: `${APP_URL}/subscription-cancel`,
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
