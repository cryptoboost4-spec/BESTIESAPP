const functions = require('firebase-functions');
const admin = require('firebase-admin');
const twilio = require('twilio');

admin.initializeApp();
const db = admin.firestore();

// Twilio setup
const twilioClient = twilio(
  functions.config().twilio.account_sid,
  functions.config().twilio.auth_token
);
const twilioPhone = functions.config().twilio.phone_number;

// SendGrid setup for email
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(functions.config().sendgrid.api_key);

// ========================================
// CHECK-IN FUNCTIONS
// ========================================

// Monitor check-ins every minute (CRON)
exports.checkExpiredCheckIns = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();

    const checkInsSnapshot = await db.collection('checkins')
      .where('status', '==', 'active')
      .where('alertTime', '<=', now)
      .get();

    const alerts = [];

    for (const doc of checkInsSnapshot.docs) {
      const checkIn = doc.data();

      await doc.ref.update({
        status: 'alerted',
        alertedAt: now,
      });

      // Update user stats
      await updateUserStats(checkIn.userId, 'checkInAlerted');

      alerts.push(sendAlertToBesties(doc.id, checkIn));
      await logAlertEvent(doc.id, checkIn);
    }

    await Promise.all(alerts);

    console.log(`Processed ${checkInsSnapshot.size} expired check-ins`);
    return null;
  });

// Extend check-in
exports.extendCheckIn = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  
  const { checkInId, additionalMinutes } = data;
  
  const checkInRef = db.collection('checkins').doc(checkInId);
  const checkIn = await checkInRef.get();
  
  if (!checkIn.exists || checkIn.data().userId !== context.auth.uid) {
    throw new functions.https.HttpsError('permission-denied', 'Invalid check-in');
  }
  
  const currentAlertTime = checkIn.data().alertTime.toDate();
  const newAlertTime = new Date(currentAlertTime.getTime() + additionalMinutes * 60000);
  
  await checkInRef.update({
    alertTime: admin.firestore.Timestamp.fromDate(newAlertTime),
    duration: checkIn.data().duration + additionalMinutes,
    lastUpdate: admin.firestore.Timestamp.now(),
  });
  
  return { success: true, newAlertTime: newAlertTime.toISOString() };
});

// Complete check-in
exports.completeCheckIn = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { checkInId } = data;

  const checkInRef = db.collection('checkins').doc(checkInId);
  const checkIn = await checkInRef.get();

  if (!checkIn.exists || checkIn.data().userId !== context.auth.uid) {
    throw new functions.https.HttpsError('permission-denied', 'Invalid check-in');
  }

  await checkInRef.update({
    status: 'completed',
    completedAt: admin.firestore.Timestamp.now(),
  });

  await updateUserStats(context.auth.uid, 'checkInCompleted');

  return { success: true };
});

// Firestore trigger: When a check-in is created, increment totalCheckIns
exports.onCheckInCreated = functions.firestore
  .document('checkins/{checkInId}')
  .onCreate(async (snap, context) => {
    const checkIn = snap.data();
    await updateUserStats(checkIn.userId, 'checkInCreated');
  });

// Send alerts to besties
async function sendAlertToBesties(checkInId, checkIn) {
  const userDoc = await db.collection('users').doc(checkIn.userId).get();
  const userData = userDoc.data();

  // Full message for WhatsApp/Email (free/cheap)
  const fullMessage = `🚨 SAFETY ALERT: ${userData.displayName} hasn't checked in from ${checkIn.location}. They were expected back ${Math.round((Date.now() - checkIn.alertTime.toMillis()) / 60000)} minutes ago. Please check on them!`;

  // Short message for SMS (expensive - keep under 160 chars)
  const shortMessage = `🚨 ${userData.displayName} missed check-in. View: https://bestiesapp.web.app/alert/${checkInId}`;

  const bestiePromises = checkIn.bestieIds.map(async (bestieId) => {
    const bestieDoc = await db.collection('users').doc(bestieId).get();

    if (!bestieDoc.exists) return;

    const bestieData = bestieDoc.data();

    try {
      // Try WhatsApp first (free - use full message)
      if (bestieData.notifications?.whatsapp && bestieData.phoneNumber) {
        try {
          await sendWhatsAppAlert(bestieData.phoneNumber, fullMessage);
        } catch (whatsappError) {
          console.log('WhatsApp failed, trying SMS...');
          // Fallback to SMS (expensive - use short message)
          if (bestieData.smsSubscription?.active) {
            await sendSMSAlert(bestieData.phoneNumber, shortMessage);
          }
        }
      } else if (bestieData.smsSubscription?.active && bestieData.phoneNumber) {
        // SMS only (expensive - use short message)
        await sendSMSAlert(bestieData.phoneNumber, shortMessage);
      }

      // Send email if enabled (cheap - use full message)
      if (bestieData.email && bestieData.notificationPreferences?.email) {
        await sendEmailAlert(bestieData.email, fullMessage, checkIn);
      }

      await db.collection('notifications').add({
        userId: bestieId,
        type: 'safety_alert',
        checkInId,
        message: fullMessage,
        sentAt: admin.firestore.Timestamp.now(),
        read: false,
      });
      
    } catch (error) {
      console.error(`Failed to notify bestie ${bestieId}:`, error);
    }
  });
  
  await Promise.all(bestiePromises);
}

async function logAlertEvent(checkInId, checkIn) {
  await db.collection('alerts').add({
    checkInId,
    userId: checkIn.userId,
    location: checkIn.location,
    notifiedBesties: checkIn.bestieIds,
    createdAt: admin.firestore.Timestamp.now(),
    status: 'active',
  });
}

// ========================================
// NOTIFICATION FUNCTIONS
// ========================================

async function sendSMSAlert(phoneNumber, message) {
  await twilioClient.messages.create({
    body: message,
    from: twilioPhone,
    to: phoneNumber,
  });
}

async function sendWhatsAppAlert(phoneNumber, message) {
  await twilioClient.messages.create({
    body: message,
    from: `whatsapp:${twilioPhone}`,
    to: `whatsapp:${phoneNumber}`,
  });
}

async function sendEmailAlert(email, message, checkIn) {
  const msg = {
    to: email,
    from: 'alerts@bestiesapp.com',
    subject: '🚨 Safety Alert from Besties',
    text: message,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF6B9D;">🚨 Safety Alert</h2>
        <p>${message}</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <strong>Location:</strong> ${checkIn.location}<br>
          <strong>Expected back:</strong> ${new Date(checkIn.alertTime.toMillis()).toLocaleString()}
        </div>
      </div>
    `,
  };
  
  await sgMail.send(msg);
}

// ========================================
// BESTIE FUNCTIONS
// ========================================

exports.sendBestieInvite = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  
  const { recipientPhone, message } = data;
  
  // Rate limiting
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const invitesCount = await db.collection('besties')
    .where('requesterId', '==', context.auth.uid)
    .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(today))
    .count()
    .get();
  
  if (invitesCount.data().count >= 20) {
    throw new functions.https.HttpsError('resource-exhausted', 'Daily invite limit reached');
  }
  
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  const userData = userDoc.data();
  
  const inviteMessage = message || 
    `${userData.displayName} wants you to be their Safety Bestie on Besties! Join now: https://bestiesapp.web.app?invite=${context.auth.uid}`;
  
  await sendSMSAlert(recipientPhone, inviteMessage);
  return { success: true };
});

exports.acceptBestieRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  
  const { bestieId } = data;
  
  const bestieRef = db.collection('besties').doc(bestieId);
  const bestie = await bestieRef.get();
  
  if (!bestie.exists || bestie.data().recipientId !== context.auth.uid) {
    throw new functions.https.HttpsError('permission-denied', 'Invalid request');
  }
  
  await bestieRef.update({
    status: 'accepted',
    acceptedAt: admin.firestore.Timestamp.now(),
  });
  
  await updateUserStats(bestie.data().requesterId, 'bestieAdded');
  await updateUserStats(context.auth.uid, 'bestieAdded');
  
  return { success: true };
});

exports.declineBestieRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  
  const { bestieId } = data;
  
  const bestieRef = db.collection('besties').doc(bestieId);
  const bestie = await bestieRef.get();
  
  if (!bestie.exists || bestie.data().recipientId !== context.auth.uid) {
    throw new functions.https.HttpsError('permission-denied', 'Invalid request');
  }
  
  await bestieRef.update({
    status: 'declined',
    declinedAt: admin.firestore.Timestamp.now(),
  });
  
  return { success: true };
});

// ========================================
// BADGE FUNCTIONS & STATS TRACKING
// ========================================

// Track when check-ins are created
exports.onCheckInCreated = functions.firestore
  .document('checkins/{checkInId}')
  .onCreate(async (snap, context) => {
    const checkIn = snap.data();
    // Increment total check-in count
    await db.collection('users').doc(checkIn.userId).update({
      'stats.totalCheckIns': admin.firestore.FieldValue.increment(1)
    });
  });

// Track when check-ins status changes (completed/alerted)
exports.onCheckInCountUpdate = functions.firestore
  .document('checkins/{checkInId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    const userRef = db.collection('users').doc(newData.userId);

    // Update stats when status changes to 'completed'
    if (newData.status === 'completed' && oldData.status !== 'completed') {
      // Increment completed count in user stats
      await userRef.update({
        'stats.completedCheckIns': admin.firestore.FieldValue.increment(1)
      });

      const count = await db.collection('checkins')
        .where('userId', '==', newData.userId)
        .where('status', '==', 'completed')
        .count()
        .get();

      const total = count.data().count;
      const badgesRef = db.collection('badges').doc(newData.userId);
      const badgesDoc = await badgesRef.get();
      const badges = badgesDoc.exists ? badgesDoc.data().badges || [] : [];

      if (total >= 5 && !badges.includes('safety_starter')) badges.push('safety_starter');
      if (total >= 25 && !badges.includes('safety_pro')) badges.push('safety_pro');
      if (total >= 50 && !badges.includes('safety_master')) badges.push('safety_master');

      if (badgesDoc.exists) {
        await badgesRef.update({ badges });
      } else {
        await badgesRef.set({ userId: newData.userId, badges, createdAt: admin.firestore.Timestamp.now() });
      }
    }

    // Update stats when status changes to 'alerted'
    if (newData.status === 'alerted' && oldData.status !== 'alerted') {
      await userRef.update({
        'stats.alertedCheckIns': admin.firestore.FieldValue.increment(1)
      });
    }
  });

exports.onBestieCountUpdate = functions.firestore
  .document('besties/{bestieId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();

    if (newData.status === 'accepted' && oldData.status !== 'accepted') {
      // Increment totalBesties for both users
      await db.collection('users').doc(newData.requesterId).update({
        'stats.totalBesties': admin.firestore.FieldValue.increment(1)
      });
      await db.collection('users').doc(newData.recipientId).update({
        'stats.totalBesties': admin.firestore.FieldValue.increment(1)
      });

      await awardBestieBadge(newData.requesterId);
      await awardBestieBadge(newData.recipientId);
    }
  });

async function awardBestieBadge(userId) {
  const count1 = await db.collection('besties')
    .where('requesterId', '==', userId)
    .where('status', '==', 'accepted')
    .count()
    .get();
  
  const count2 = await db.collection('besties')
    .where('recipientId', '==', userId)
    .where('status', '==', 'accepted')
    .count()
    .get();
  
  const total = count1.data().count + count2.data().count;
  const badgesRef = db.collection('badges').doc(userId);
  const badgesDoc = await badgesRef.get();
  const badges = badgesDoc.exists ? badgesDoc.data().badges || [] : [];
  
  if (total >= 3 && !badges.includes('friend_squad')) badges.push('friend_squad');
  if (total >= 5 && !badges.includes('safety_circle')) badges.push('safety_circle');
  if (total >= 10 && !badges.includes('safety_network')) badges.push('safety_network');
  
  if (badgesDoc.exists) {
    await badgesRef.update({ badges });
  } else {
    await badgesRef.set({ userId, badges, createdAt: admin.firestore.Timestamp.now() });
  }
}

// ========================================
// EMERGENCY SOS
// ========================================

exports.triggerEmergencySOS = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  
  const { location, isReversePIN } = data;
  
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  const userData = userDoc.data();
  
  const besties1 = await db.collection('besties')
    .where('requesterId', '==', context.auth.uid)
    .where('status', '==', 'accepted')
    .get();
  
  const besties2 = await db.collection('besties')
    .where('recipientId', '==', context.auth.uid)
    .where('status', '==', 'accepted')
    .get();
  
  const bestieIds = [];
  besties1.forEach(doc => bestieIds.push(doc.data().recipientId));
  besties2.forEach(doc => bestieIds.push(doc.data().requesterId));
  
  const sosRef = await db.collection('emergency_sos').add({
    userId: context.auth.uid,
    location: location || 'Unknown',
    isReversePIN: isReversePIN || false,
    notifiedBesties: bestieIds,
    status: 'active',
    createdAt: admin.firestore.Timestamp.now(),
  });
  
  // Full message for WhatsApp/Email
  const fullAlertMessage = isReversePIN
    ? `🚨 SILENT EMERGENCY: ${userData.displayName} triggered reverse PIN. Location: ${location || 'Unknown'}. Covert distress signal.`
    : `🆘 EMERGENCY: ${userData.displayName} triggered SOS! Location: ${location || 'Unknown'}. Help immediately!`;

  // Short message for SMS (expensive)
  const shortAlertMessage = isReversePIN
    ? `🚨 ${userData.displayName} reverse PIN. View: https://bestiesapp.web.app/alert/${sosRef.id}`
    : `🆘 ${userData.displayName} SOS! View: https://bestiesapp.web.app/alert/${sosRef.id}`;

  const notifications = bestieIds.map(async (bestieId) => {
    const bestieDoc = await db.collection('users').doc(bestieId).get();
    if (!bestieDoc.exists) return;

    const bestieData = bestieDoc.data();

    try {
      if (bestieData.phoneNumber) {
        // SMS is expensive - use short message
        await sendSMSAlert(bestieData.phoneNumber, shortAlertMessage);
        // WhatsApp is free - use full message
        await sendWhatsAppAlert(bestieData.phoneNumber, fullAlertMessage);
      }
      if (bestieData.email && bestieData.notificationPreferences?.email) {
        await sendEmailAlert(bestieData.email, fullAlertMessage, {
          location: location || 'Unknown',
          alertTime: admin.firestore.Timestamp.now(),
        });
      }
    } catch (error) {
      console.error(`Failed SOS to ${bestieId}:`, error);
    }
  });
  
  await Promise.all(notifications);
  
  return { success: true, sosId: sosRef.id };
});

// ========================================
// STATS & ANALYTICS
// ========================================

async function updateUserStats(userId, statType) {
  const userRef = db.collection('users').doc(userId);

  const updates = {
    lastActive: admin.firestore.Timestamp.now(),
  };

  if (statType === 'checkInCreated') {
    updates['stats.totalCheckIns'] = admin.firestore.FieldValue.increment(1);
  } else if (statType === 'checkInCompleted') {
    updates['stats.completedCheckIns'] = admin.firestore.FieldValue.increment(1);
  } else if (statType === 'checkInAlerted') {
    updates['stats.alertedCheckIns'] = admin.firestore.FieldValue.increment(1);
  } else if (statType === 'bestieAdded') {
    updates['stats.totalBesties'] = admin.firestore.FieldValue.increment(1);
  }

  await userRef.update(updates);
}

exports.dailyAnalyticsAggregation = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkInsSnapshot = await db.collection('checkins')
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(yesterday))
      .where('createdAt', '<', admin.firestore.Timestamp.fromDate(today))
      .get();

    const stats = {
      date: admin.firestore.Timestamp.fromDate(yesterday),
      totalCheckIns: checkInsSnapshot.size,
      completedCheckIns: 0,
      alertedCheckIns: 0,
    };

    checkInsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.status === 'completed') stats.completedCheckIns++;
      if (data.status === 'alerted') stats.alertedCheckIns++;
    });

    await db.collection('daily_stats').add(stats);

    return null;
  });

// ========================================
// STRIPE PAYMENT FUNCTIONS
// ========================================

const stripe = require('stripe')(functions.config().stripe.secret_key);

// Create Stripe Checkout Session for donations/subscriptions
exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { amount, type } = data; // type: 'donation' or 'subscription'

  if (!amount || !type) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing amount or type');
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
      success_url: `https://bestiesapp.web.app/?payment=success`,
      cancel_url: `https://bestiesapp.web.app/?payment=cancelled`,
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

// Create Stripe Customer Portal Session for managing subscriptions
exports.createPortalSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  const userData = userDoc.data();
  const customerId = userData.stripeCustomerId;

  if (!customerId) {
    throw new functions.https.HttpsError('failed-precondition', 'No active subscription');
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: 'https://bestiesapp.web.app/settings',
    });

    return { success: true, url: session.url };
  } catch (error) {
    console.error('Portal session error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create portal session');
  }
});

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

  // Handle the event
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
        } else if (userData.donationStats?.stripeSubscriptionId === subscription.id) {
          await userDoc.ref.update({
            'donationStats.isActive': false,
            'donationStats.cancelledAt': admin.firestore.Timestamp.now(),
          });
        }
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// ========================================
// PUSH NOTIFICATIONS
// ========================================

// Send push notification reminders for upcoming check-in expirations
// Runs every minute and sends notifications 5 minutes before expiration
exports.sendCheckInReminders = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    const fiveMinutesFromNow = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 5 * 60 * 1000)
    );
    const sixMinutesFromNow = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 6 * 60 * 1000)
    );

    try {
      // Find check-ins expiring in 5-6 minutes that haven't been reminded yet
      const checkInsSnapshot = await db.collection('checkins')
        .where('status', '==', 'active')
        .where('alertTime', '>=', fiveMinutesFromNow)
        .where('alertTime', '<=', sixMinutesFromNow)
        .get();

      console.log(`Found ${checkInsSnapshot.size} check-ins to remind about`);

      const notifications = [];

      for (const doc of checkInsSnapshot.docs) {
        const checkIn = doc.data();

        // Skip if already reminded
        if (checkIn.reminderSent) {
          continue;
        }

        // Get user document to check if notifications are enabled
        const userDoc = await db.collection('users').doc(checkIn.userId).get();

        if (!userDoc.exists) {
          continue;
        }

        const userData = userDoc.data();

        // Check if push notifications are enabled and user has FCM token
        if (userData.notificationsEnabled && userData.fcmToken) {
          const message = {
            token: userData.fcmToken,
            notification: {
              title: '⏰ Check-In Reminder',
              body: `Your check-in at ${checkIn.location} expires in 5 minutes!`,
              icon: '/logo192.png',
            },
            data: {
              type: 'check-in-reminder',
              checkInId: doc.id,
              location: checkIn.location,
            },
            webpush: {
              fcmOptions: {
                link: 'https://bestiesapp.web.app/',
              },
              notification: {
                badge: '/logo192.png',
                requireInteraction: true,
                actions: [
                  {
                    action: 'complete',
                    title: "I'm Safe!",
                  },
                  {
                    action: 'extend',
                    title: 'Extend Time',
                  }
                ]
              }
            }
          };

          notifications.push(
            admin.messaging().send(message)
              .then(() => {
                console.log(`Sent reminder to user ${checkIn.userId} for check-in ${doc.id}`);
                // Mark as reminded
                return doc.ref.update({ reminderSent: true });
              })
              .catch((error) => {
                console.error(`Failed to send notification to ${checkIn.userId}:`, error);
                // If token is invalid, remove it
                if (error.code === 'messaging/invalid-registration-token' ||
                    error.code === 'messaging/registration-token-not-registered') {
                  return userDoc.ref.update({
                    fcmToken: null,
                    notificationsEnabled: false,
                  });
                }
              })
          );
        }
      }

      await Promise.all(notifications);

      console.log(`Sent ${notifications.length} push notification reminders`);
      return null;
    } catch (error) {
      console.error('Error sending check-in reminders:', error);
      return null;
    }
  });

// ========================================
// ERROR MONITORING AND ALERTS
// ========================================

// Monitor critical errors and send email alerts to admin
// Only alerts on SITE ISSUES (affecting multiple users or core functionality)
// Not individual user errors
exports.monitorCriticalErrors = functions.firestore
  .document('errors/{errorId}')
  .onCreate(async (snapshot, context) => {
    const error = snapshot.data();

    // First check: Is this error type critical at all?
    const isCriticalType =
      error.type === 'uncaught_error' ||
      error.type === 'unhandled_promise' ||
      error.message?.includes('verification failed') ||
      error.message?.includes('Check-in was not saved') ||
      error.message?.includes('Firebase') ||
      error.message?.includes('Database') ||
      error.message?.includes('Function') ||
      error.code === 'permission-denied' ||
      error.code === 'unavailable';

    if (!isCriticalType) {
      return null; // Not a critical error type
    }

    // Second check: Is this a SITE ISSUE or just a single user problem?
    // Look for same error in last 5 minutes from multiple users
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const recentErrorsQuery = await db.collection('errors')
      .where('message', '==', error.message)
      .where('timestamp', '>=', fiveMinutesAgo)
      .get();

    const uniqueUsers = new Set();
    recentErrorsQuery.forEach(doc => {
      const errorData = doc.data();
      if (errorData.userId) {
        uniqueUsers.add(errorData.userId);
      }
    });

    // Only alert if multiple users (2+) have same error, OR if it's a database/firebase error
    const isSystemError =
      error.message?.includes('Firebase') ||
      error.message?.includes('Database') ||
      error.code === 'unavailable' ||
      error.code === 'permission-denied';

    const affectsMultipleUsers = uniqueUsers.size >= 2;

    if (!isSystemError && !affectsMultipleUsers) {
      console.log('Single user error, not alerting admin:', error.message);
      return null; // Single user error, don't alert
    }

    console.log(`SITE ISSUE detected: ${error.message} (affects ${uniqueUsers.size} users)`);

    // Send email alert to admin
    const adminEmail = functions.config().admin?.email || 'admin@bestiesapp.com';

    const alertType = isSystemError ? 'SYSTEM ERROR' : `SITE ISSUE (${uniqueUsers.size} users affected)`;

    const msg = {
      to: adminEmail,
      from: 'alerts@bestiesapp.com',
      subject: `🚨 ${alertType} - ${error.type}`,
      html: `
        <h2 style="color: #dc2626;">${alertType}</h2>

        <div style="background: #fee2e2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
          <strong>Error Message:</strong><br/>
          ${error.message}
        </div>

        ${affectsMultipleUsers ? `
          <div style="background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <strong>⚠️ This error has affected ${uniqueUsers.size} users in the last 5 minutes</strong>
          </div>
        ` : ''}

        <h3>Details:</h3>
        <ul>
          <li><strong>Type:</strong> ${error.type}</li>
          <li><strong>Severity:</strong> ${isSystemError ? 'System Error' : 'Multiple Users Affected'}</li>
          <li><strong>User ID:</strong> ${error.userId || 'Anonymous'}</li>
          <li><strong>Session ID:</strong> ${error.sessionId}</li>
          <li><strong>URL:</strong> ${error.url}</li>
          <li><strong>Timestamp:</strong> ${new Date(error.timestamp).toISOString()}</li>
          ${error.filename ? `<li><strong>File:</strong> ${error.filename}:${error.lineno}:${error.colno}</li>` : ''}
        </ul>

        ${error.stack ? `
          <h3>Stack Trace:</h3>
          <pre style="background: #f3f4f6; padding: 15px; border-radius: 8px; overflow-x: auto;">
${error.stack}
          </pre>
        ` : ''}

        ${error.details ? `
          <h3>Additional Details:</h3>
          <pre style="background: #f3f4f6; padding: 15px; border-radius: 8px; overflow-x: auto;">
${JSON.stringify(error.details, null, 2)}
          </pre>
        ` : ''}

        <hr style="margin: 30px 0;"/>

        <p>
          <a href="https://bestiesapp.web.app/error-dashboard"
             style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
            View Error Dashboard
          </a>
        </p>

        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          This is an automated alert from Besties Error Monitoring System.
        </p>
      `,
    };

    try {
      await sgMail.send(msg);
      console.log('Critical error alert sent to admin');
    } catch (emailError) {
      console.error('Failed to send email alert:', emailError);
    }

    return null;
  });

// Dynamic share card generator
const { generateShareCard } = require('./shareCard');
exports.generateShareCard = generateShareCard;

// ========================================
// DATA RETENTION CLEANUP
// ========================================

// Clean up old data based on user preferences
exports.cleanupOldData = functions.pubsub
  .schedule('0 3 * * *') // Run daily at 3:00 AM
  .timeZone('America/New_York')
  .onRun(async (context) => {
    console.log('Starting data cleanup...');

    const now = admin.firestore.Timestamp.now();
    const twentyFourHoursAgo = admin.firestore.Timestamp.fromDate(
      new Date(now.toDate().getTime() - 24 * 60 * 60 * 1000)
    );

    let deletedCheckIns = 0;
    let deletedSOS = 0;
    let deletedPhotos = 0;

    try {
      // Get all users who DON'T have holdData enabled
      const usersSnapshot = await db.collection('users')
        .where('settings.holdData', '!=', true)
        .get();

      const userIds = usersSnapshot.docs.map(doc => doc.id);

      // Add users without settings field at all
      const usersWithoutSettings = await db.collection('users')
        .where('settings', '==', null)
        .get();

      userIds.push(...usersWithoutSettings.docs.map(doc => doc.id));

      console.log(`Found ${userIds.length} users without data retention enabled`);

      // Delete old check-ins
      for (const userId of userIds) {
        const oldCheckIns = await db.collection('checkins')
          .where('userId', '==', userId)
          .where('createdAt', '<', twentyFourHoursAgo)
          .get();

        for (const doc of oldCheckIns.docs) {
          const checkInData = doc.data();

          // Delete associated photo if exists
          if (checkInData.photoURL) {
            try {
              // Extract storage path from URL
              const photoPath = checkInData.photoURL.split('/o/')[1]?.split('?')[0];
              if (photoPath) {
                const decodedPath = decodeURIComponent(photoPath);
                await admin.storage().bucket().file(decodedPath).delete();
                deletedPhotos++;
              }
            } catch (photoError) {
              console.error('Error deleting photo:', photoError);
            }
          }

          await doc.ref.delete();
          deletedCheckIns++;
        }

        // Delete old emergency SOS
        const oldSOS = await db.collection('emergency_sos')
          .where('userId', '==', userId)
          .where('createdAt', '<', twentyFourHoursAgo)
          .get();

        for (const doc of oldSOS.docs) {
          await doc.ref.delete();
          deletedSOS++;
        }
      }

      console.log(`Cleanup complete: ${deletedCheckIns} check-ins, ${deletedSOS} SOS, ${deletedPhotos} photos deleted`);

      return {
        success: true,
        deletedCheckIns,
        deletedSOS,
        deletedPhotos,
      };
    } catch (error) {
      console.error('Error during cleanup:', error);
      return { success: false, error: error.message };
    }
  });

// ========================================
// TEST ALERT FUNCTION
// ========================================

// Send test alert to verify notification setup (EMAIL ONLY to save SMS costs)
exports.sendTestAlert = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;

  try {
    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    const notifications = [];

    // Send Email ONLY (SMS/WhatsApp use the same backend system, so if email works, they work too)
    if (userData.email && userData.notificationPreferences?.email) {
      const emailMsg = {
        to: userData.email,
        from: 'alerts@bestiesapp.web.app',
        subject: '✅ Test Alert - Besties',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #7c3aed;">✅ Test Alert Success!</h2>
            <p>Hi ${userData.displayName},</p>
            <p>This is a test notification to confirm your email alerts are working correctly.</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Your Notification Channels:</h3>
              <ul style="margin: 10px 0;">
                <li>${userData.notificationPreferences?.email ? '✅' : '❌'} Email</li>
                <li>${userData.notificationPreferences?.whatsapp ? '✅' : '❌'} WhatsApp / SMS</li>
                <li>${userData.notificationsEnabled ? '✅' : '❌'} Push Notifications</li>
              </ul>
              <p style="background: #fff3cd; padding: 10px; border-radius: 5px; font-size: 14px; margin-top: 15px;">
                <strong>Note:</strong> We only test email to save SMS costs. WhatsApp and SMS use the same delivery system,
                so if your email works, they will work too during real alerts!
              </p>
            </div>
            <p>If you received this, your email notifications are set up correctly! 💜</p>
          </div>
        `,
      };
      notifications.push(sgMail.send(emailMsg));
    }

    // Send Push Notification (free, so we can test it)
    if (userData.fcmToken && userData.notificationsEnabled) {
      const pushMessage = {
        notification: {
          title: '✅ Test Alert - Besties',
          body: 'Your push notifications are working! This is a test alert.',
        },
        token: userData.fcmToken,
      };
      notifications.push(admin.messaging().send(pushMessage));
    }

    // Wait for all notifications to send
    await Promise.all(notifications);

    return {
      success: true,
      message: 'Test alerts sent successfully',
      channels: {
        email: userData.notificationPreferences?.email && userData.email,
        whatsapp: false, // Not tested to save costs
        push: userData.notificationsEnabled && userData.fcmToken,
      },
    };
  } catch (error) {
    console.error('Error sending test alert:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send test alert');
  }
});

// ========================================
// PHONE NUMBER MIGRATION
// ========================================

/**
 * Normalize phone number to E.164 format
 * Admin-only function to migrate existing phone numbers
 */
exports.migratePhoneNumbers = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  // Check admin status
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!userDoc.exists || !userDoc.data().isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  try {
    const usersSnapshot = await db.collection('users').get();
    let migratedCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const phoneNumber = userData.phoneNumber;

      if (!phoneNumber) {
        skippedCount++;
        continue;
      }

      // Skip if already in E.164 format
      if (phoneNumber.startsWith('+') && /^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
        skippedCount++;
        continue;
      }

      try {
        let e164Phone = '';

        // Remove all non-digits
        const digitsOnly = phoneNumber.replace(/\D/g, '');

        // Detect format and convert
        if (phoneNumber.startsWith('04') || phoneNumber.startsWith('4')) {
          // Australian mobile number
          const withoutLeadingZero = digitsOnly.startsWith('0') ? digitsOnly.slice(1) : digitsOnly;
          e164Phone = `+61${withoutLeadingZero}`;
        } else if (digitsOnly.length === 10) {
          // Assume US/Canada
          e164Phone = `+1${digitsOnly}`;
        } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
          // US/Canada with leading 1
          e164Phone = `+${digitsOnly}`;
        } else if (digitsOnly.length === 9) {
          // Could be Australian without leading 0
          e164Phone = `+61${digitsOnly}`;
        } else {
          // Unknown format, add +1 as default
          e164Phone = `+1${digitsOnly}`;
        }

        // Validate E.164 format
        if (!/^\+[1-9]\d{1,14}$/.test(e164Phone)) {
          errors.push({ userId: userDoc.id, oldPhone: phoneNumber, reason: 'Invalid E.164 after conversion' });
          continue;
        }

        // Update the user document
        await userDoc.ref.update({
          phoneNumber: e164Phone,
          phoneNumberMigrated: true,
          phoneNumberMigratedAt: admin.firestore.Timestamp.now(),
        });

        migratedCount++;
      } catch (error) {
        console.error(`Error migrating phone for user ${userDoc.id}:`, error);
        errors.push({ userId: userDoc.id, oldPhone: phoneNumber, error: error.message });
      }
    }

    return {
      success: true,
      migratedCount,
      skippedCount,
      totalUsers: usersSnapshot.size,
      errors: errors.length > 0 ? errors : null,
    };
  } catch (error) {
    console.error('Error in phone migration:', error);
    throw new functions.https.HttpsError('internal', 'Migration failed');
  }
});

module.exports = exports;
