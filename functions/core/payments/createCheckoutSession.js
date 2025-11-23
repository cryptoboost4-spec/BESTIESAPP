const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(functions.config().stripe.secret_key);

const db = admin.firestore();
const APP_URL = functions.config().app?.url || 'https://bestiesapp.web.app';

// Create Stripe Checkout Session for donations/subscriptions
exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
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
      const customer = await stripe.customers.create({
        email: userData.email,
        metadata: {
          firebaseUID: context.auth.uid,
        },
      });
      customerId = customer.id;

      await db.collection('users').doc(context.auth.uid).update({
        stripeCustomerId: customerId,
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
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

    return { success: true, url: session.url, sessionId: session.id };
  } catch (error) {
    console.error('Stripe checkout error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create checkout session');
  }
});
