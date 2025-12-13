const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(functions.config().stripe?.secret_key);
const { updateUserBadges } = require('../../utils/badges');
const { logAuditEvent, AuditEventType } = require('../../utils/auditLogger');

const db = admin.firestore();

// Webhook to handle Stripe events
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = functions.config().stripe?.webhook_secret;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    functions.logger.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Idempotency check - prevent double processing of same event
  const eventRef = db.collection('webhook_events').doc(event.id);
  const existingEvent = await eventRef.get();

  if (existingEvent.exists) {
    functions.logger.info(`Webhook event ${event.id} already processed, skipping`);
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
        // Get user data for timezone
        const userRef = db.collection('users').doc(firebaseUID);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        const timezone = userData?.timezone || 'UTC';

        // Calculate subscription renewal date (1 month from now, at midnight in user's timezone)
        const { zonedTimeToUtc, utcToZonedTime } = require('date-fns-tz');
        const now = new Date();
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        // Get midnight in user's timezone for next month
        const zonedDate = utcToZonedTime(nextMonth, timezone);
        zonedDate.setHours(0, 0, 0, 0);
        const midnightInTimezone = zonedTimeToUtc(zonedDate, timezone);

        const renewsAt = admin.firestore.Timestamp.fromDate(midnightInTimezone);

        // Activate SMS subscription and grant 15 credits
        await userRef.update({
          'smsSubscription.active': true,
          'smsSubscription.plan': 'sms_monthly_2',
          'smsSubscription.stripeSubscriptionId': session.subscription,
          'smsSubscription.startedAt': admin.firestore.Timestamp.now(),

          // Grant initial 15 credits
          'smsCredits.subscriptionCredits': 15,
          'smsCredits.subscriptionRenewsAt': renewsAt,
          'smsCredits.balance': admin.firestore.FieldValue.increment(15),
          'smsCredits.currentCycleUsed': 0  // Reset cycle counter
        });

        // Update badges to award subscriber badge
        await updateUserBadges(firebaseUID);

        // Audit log
        await logAuditEvent(
          AuditEventType.PAYMENT_COMPLETED,
          firebaseUID,
          {
            type: 'subscription',
            subscriptionId: session.subscription,
            amount: session.amount_total,
          },
          'info'
        );
      } else if (type === 'sms_extra') {
        // Handle extra credit purchase (one-time payment)
        const userRef = db.collection('users').doc(firebaseUID);
        const userDoc = await userRef.get();
        const userData = userDoc.data();

        // Get expiration date (user's next subscription renewal)
        const expiresAt = userData.smsCredits?.subscriptionRenewsAt ||
                          admin.firestore.Timestamp.fromDate(
                            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                          );

        // Add to extraPurchases array
        const { addExtraCredits } = require('../../utils/smsCredits');
        await addExtraCredits(firebaseUID, 15, expiresAt);

        functions.logger.info('Extra SMS credits purchased', { userId: firebaseUID });
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

    case 'invoice.payment_succeeded':
      const invoice = event.data.object;

      // Check if this is a subscription renewal (not first payment)
      if (invoice.billing_reason === 'subscription_cycle') {
        const subscriptionId = invoice.subscription;

        // Find user by subscription ID
        const usersSnapshot = await db.collection('users')
          .where('smsSubscription.stripeSubscriptionId', '==', subscriptionId)
          .get();

        if (!usersSnapshot.empty) {
          const userDoc = usersSnapshot.docs[0];
          const userId = userDoc.id;

          // Refresh subscription credits (call helper function)
          const { refreshSubscriptionCredits } = require('../../utils/smsCredits');
          await refreshSubscriptionCredits(userId);

          functions.logger.info('Subscription credits refreshed', { userId });
        }
      }
      break;

    case 'invoice.payment_failed':
      const failedInvoice = event.data.object;
      const subscriptionId = failedInvoice.subscription;

      // Find user by subscription ID
      const failedUsersSnapshot = await db.collection('users')
        .where('smsSubscription.stripeSubscriptionId', '==', subscriptionId)
        .get();

      if (!failedUsersSnapshot.empty) {
        const userDoc = failedUsersSnapshot.docs[0];
        const userId = userDoc.id;
        const userData = userDoc.data();

        // Get retry count from metadata
        const retryCount = failedInvoice.attempt_count || 1;
        const maxRetries = 3;

        if (retryCount >= maxRetries) {
          // Final retry failed - suspend service
          await userDoc.ref.update({
            'smsSubscription.paymentFailed': true,
            'smsSubscription.paymentFailedAt': admin.firestore.Timestamp.now(),
            'smsSubscription.gracePeriodEnds': admin.firestore.Timestamp.fromDate(
              new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)  // 7 day grace period
            )
          });

          // Send in-app notification
          await db.collection('notifications').add({
            userId: userId,
            type: 'payment_failed',
            title: '⚠️ Payment Failed',
            message: 'Your SMS subscription payment failed. Please update your payment method within 7 days to avoid service interruption.',
            actionUrl: '/settings',
            createdAt: admin.firestore.Timestamp.now(),
            read: false,
            priority: 'high'
          });

          functions.logger.warn('SMS subscription payment failed (max retries)', {
            userId,
            subscriptionId,
            retryCount
          });
        } else {
          // Still retrying - send warning notification
          await db.collection('notifications').add({
            userId: userId,
            type: 'payment_retry',
            title: '⚠️ Payment Retry',
            message: `We'll retry your payment soon. Please ensure your payment method is valid. (Attempt ${retryCount}/${maxRetries})`,
            actionUrl: '/settings',
            createdAt: admin.firestore.Timestamp.now(),
            read: false
          });

          functions.logger.info('SMS subscription payment retry', {
            userId,
            subscriptionId,
            retryCount
          });
        }
      }
      break;

    case 'invoice.payment_action_required':
      const actionInvoice = event.data.object;
      const actionSubscriptionId = actionInvoice.subscription;

      // Find user and notify them to complete 3D Secure
      const actionUsersSnapshot = await db.collection('users')
        .where('smsSubscription.stripeSubscriptionId', '==', actionSubscriptionId)
        .get();

      if (!actionUsersSnapshot.empty) {
        const userDoc = actionUsersSnapshot.docs[0];
        const userId = userDoc.id;

        await db.collection('notifications').add({
          userId: userId,
          type: 'payment_action_required',
          title: '⚠️ Payment Action Required',
          message: 'Your bank requires additional verification. Please complete the payment to continue your SMS subscription.',
          actionUrl: actionInvoice.hosted_invoice_url,  // Stripe hosted page for 3DS
          createdAt: admin.firestore.Timestamp.now(),
          read: false,
          priority: 'high'
        });
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

            // DO NOT clear extra credits - they remain valid until expiration
            // Only stop refreshing subscriptionCredits on next renewal
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
      functions.logger.warn(`Unhandled event type ${event.type}`);
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
    functions.logger.error('Webhook processing error:', error);
    // Still return 200 to prevent Stripe from retrying
    // (we logged the error for manual investigation)
    res.status(200).json({ received: true, error: 'Processing failed but logged' });
  }
});
