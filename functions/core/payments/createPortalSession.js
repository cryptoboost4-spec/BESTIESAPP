const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(functions.config().stripe?.secret_key);
const { checkUserRateLimit } = require('../../utils/rateLimiting');
const { retryApiCall } = require('../../utils/retry');

const db = admin.firestore();
const APP_URL = functions.config().app?.url || 'https://bestiesapp.web.app';

// Create Stripe Customer Portal Session for managing subscriptions
exports.createPortalSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const userId = context.auth.uid;

  // Rate limiting: 5 portal sessions per hour per user
  const rateLimit = await checkUserRateLimit(
    userId,
    'createPortalSession',
    { count: 5, window: 60 * 60 * 1000 }, // 5 per hour
    'portal_sessions'
  );

  if (!rateLimit.allowed) {
    const resetIn = Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000);
    throw new functions.https.HttpsError(
      'resource-exhausted',
      `Rate limit exceeded. Maximum 5 portal sessions per hour. Try again in ${resetIn} seconds.`,
      {
        limit: rateLimit.limit,
        count: rateLimit.count,
        resetAt: rateLimit.resetAt.toISOString(),
      }
    );
  }

  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();
  const customerId = userData.stripeCustomerId;

  if (!customerId) {
    throw new functions.https.HttpsError('failed-precondition', 'No active subscription');
  }

  try {
    const session = await retryApiCall(
      async () => {
        return await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${APP_URL}/settings`,
        });
      },
      { operationName: 'Create Stripe portal session' }
    );

    // Track this portal session for rate limiting
    await db.collection('portal_sessions').add({
      userId,
      sessionId: session.id,
      createdAt: admin.firestore.Timestamp.now(),
    });

    return { success: true, url: session.url };
  } catch (error) {
    functions.logger.error('Portal session error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create portal session');
  }
});
