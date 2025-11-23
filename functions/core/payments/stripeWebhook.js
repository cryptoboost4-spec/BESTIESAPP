const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(functions.config().stripe.secret_key);
const { updateUserBadges } = require('../../utils/badges');

const db = admin.firestore();

// Webhook to handle Stripe events
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = functions.config().stripe.webhook_secret;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Idempotency check - prevent double processing of same event
  const eventRef = db.collection('webhook_events').doc(event.id);
  const existingEvent = await eventRef.get();

  if (existingEvent.exists) {
    console.log(`Webhook event ${event.id} already processed, skipping`);
    return res.status(200).json({ received: true, message: 'Event already processed' });
  }

  // Store event to prevent reprocessing
  await eventRef.set({
    type: event.type,
    processedAt: admin.firestore.Timestamp.now(),
    data: event.data.object,
  });

  // Handle the event
  try {
    switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const firebaseUID = session.metadata.firebaseUID;
      const type = session.metadata.type;

      if (type === 'subscription') {
        // Activate SMS subscription
        await db.collection('users').doc(firebaseUID).update({
          'smsSubscription.active': true,
          'smsSubscription.stripeSubscriptionId': session.subscription,
          'smsSubscription.startedAt': admin.firestore.Timestamp.now(),
        });

        // Update badges to award subscriber badge
        await updateUserBadges(firebaseUID);
      } else if (type === 'donation') {
        // Track donation
        const amount = session.amount_total / 100;
        const userRef = db.collection('users').doc(firebaseUID);
        const userDoc = await userRef.get();
        const currentTotal = userDoc.data()?.donationStats?.totalDonated || 0;

        await userRef.update({
          'donationStats.isActive': true,
          'donationStats.monthlyAmount': amount,
          'donationStats.totalDonated': currentTotal + amount,
          'donationStats.stripeSubscriptionId': session.subscription,
          'donationStats.lastDonation': admin.firestore.Timestamp.now(),
        });

        // Update badges to check for donor badges
        await updateUserBadges(firebaseUID);
      }
      break;

    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      const customer = subscription.customer;

      // Find user by Stripe customer ID
      const usersSnapshot = await db.collection('users')
        .where('stripeCustomerId', '==', customer)
        .get();

      if (!usersSnapshot.empty) {
        const userDoc = usersSnapshot.docs[0];
        const userData = userDoc.data();

        // Check which subscription was cancelled
        if (userData.smsSubscription?.stripeSubscriptionId === subscription.id) {
          await userDoc.ref.update({
            'smsSubscription.active': false,
            'smsSubscription.cancelledAt': admin.firestore.Timestamp.now(),
          });

          // Update badges to remove subscriber badge
          await updateUserBadges(userDoc.id);
        } else if (userData.donationStats?.stripeSubscriptionId === subscription.id) {
          await userDoc.ref.update({
            'donationStats.isActive': false,
            'donationStats.cancelledAt': admin.firestore.Timestamp.now(),
          });

          // Update badges in case they lost a donor tier
          await updateUserBadges(userDoc.id);
        }
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

    // Mark event as successfully processed
    await eventRef.update({ success: true });
    res.json({ received: true });

  } catch (error) {
    // Mark event as failed for debugging
    await eventRef.update({
      success: false,
      error: error.message,
      errorStack: error.stack
    });
    console.error('Webhook processing error:', error);
    // Still return 200 to prevent Stripe from retrying
    // (we logged the error for manual investigation)
    res.status(200).json({ received: true, error: 'Processing failed but logged' });
  }
});
