const functions = require('firebase-functions');
const admin = require('firebase-admin');
const twilio = require('twilio');
const { updateUserBadges } = require('./utils/badges');

admin.initializeApp();
const db = admin.firestore();

// App URL configuration (defaults to web.app for local development)
const APP_URL = functions.config().app?.url || 'https://bestiesapp.web.app';

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

      // Stats are updated by onCheckInCountUpdate trigger - no need to update here
      // (Removed duplicate increment to fix double-counting bug)

      alerts.push(sendAlertToBesties(doc.id, checkIn));
      await logAlertEvent(doc.id, checkIn);
    }

    await Promise.all(alerts);

    console.log(`Processed ${checkInsSnapshot.size} expired check-ins`);
    return null;
  });

// Check for cascading alert escalation every minute
exports.checkCascadingAlertEscalation = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    const oneMinuteAgo = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 60 * 1000)
    );

    // Find alerted check-ins with current notified bestie that haven't been acknowledged in 1 minute
    const checkInsSnapshot = await db.collection('checkins')
      .where('status', '==', 'alerted')
      .where('currentNotifiedBestie', '!=', null)
      .where('currentNotificationSentAt', '<=', oneMinuteAgo)
      .get();

    const escalations = [];

    for (const doc of checkInsSnapshot.docs) {
      const checkIn = doc.data();
      const checkInId = doc.id;

      // Check if current bestie has acknowledged
      const acknowledgedBy = checkIn.acknowledgedBy || [];
      if (acknowledgedBy.includes(checkIn.currentNotifiedBestie)) {
        // Current bestie acknowledged, stop escalation
        await doc.ref.update({
          currentNotifiedBestie: null,
          currentNotificationSentAt: null,
        });
        continue;
      }

      // Find next bestie to notify
      const notifiedHistory = checkIn.notifiedBestieHistory || [];
      const allBesties = checkIn.bestieIds || [];
      const remainingBesties = allBesties.filter(id => !notifiedHistory.includes(id));

      if (remainingBesties.length === 0) {
        // All besties have been notified, stop escalation
        console.log(`All besties notified for check-in ${checkInId}, no more escalation`);
        await doc.ref.update({
          currentNotifiedBestie: null,
          currentNotificationSentAt: null,
        });
        continue;
      }

      // Escalate to next bestie
      const nextBestieId = remainingBesties[0];

      await doc.ref.update({
        currentNotifiedBestie: nextBestieId,
        currentNotificationSentAt: now,
        notifiedBestieHistory: admin.firestore.FieldValue.arrayUnion(nextBestieId),
      });

      // Send notification to next bestie
      const userDoc = await db.collection('users').doc(checkIn.userId).get();
      const userData = userDoc.data();

      escalations.push(sendCascadingAlert(checkInId, checkIn, nextBestieId, userData));

      console.log(`Escalated check-in ${checkInId} to bestie ${nextBestieId} (${notifiedHistory.length + 1}/${allBesties.length})`);
    }

    await Promise.all(escalations);

    console.log(`Processed ${checkInsSnapshot.size} check-ins for escalation, escalated ${escalations.length}`);
    return null;
  });

// Acknowledge alert (bestie has viewed the alert)
exports.acknowledgeAlert = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { checkInId } = data;

  if (!checkInId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing checkInId');
  }

  const checkInRef = db.collection('checkins').doc(checkInId);
  const checkIn = await checkInRef.get();

  if (!checkIn.exists) {
    throw new functions.https.HttpsError('not-found', 'Check-in not found');
  }

  const checkInData = checkIn.data();

  // Verify that the user is one of the besties for this check-in
  if (!checkInData.bestieIds || !checkInData.bestieIds.includes(context.auth.uid)) {
    throw new functions.https.HttpsError('permission-denied', 'You are not authorized to acknowledge this alert');
  }

  // Add user to acknowledgedBy array if not already there
  const acknowledgedBy = checkInData.acknowledgedBy || [];
  if (!acknowledgedBy.includes(context.auth.uid)) {
    await checkInRef.update({
      acknowledgedBy: admin.firestore.FieldValue.arrayUnion(context.auth.uid),
    });

    // Track alert response for connection strength
    const responseTime = Date.now() - checkInData.alertedAt.toMillis();
    await db.collection('alert_responses').add({
      userId: checkInData.userId,
      responderId: context.auth.uid,
      checkInId: checkInId,
      responseTime: responseTime, // Time in milliseconds
      timestamp: admin.firestore.Timestamp.now(),
    });

    console.log(`User ${context.auth.uid} acknowledged alert for check-in ${checkInId} (response time: ${Math.round(responseTime / 1000)}s)`);
  }

  return { success: true };
});

// Extend check-in
exports.extendCheckIn = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { checkInId, additionalMinutes } = data;

  // Validate additionalMinutes - only allow the button values
  const validExtensions = [15, 30, 60];
  if (!validExtensions.includes(additionalMinutes)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Extension must be 15, 30, or 60 minutes'
    );
  }

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

  // Stats are updated by onCheckInCountUpdate trigger - no need to update here
  // (Removed duplicate increment to fix double-counting bug)

  return { success: true };
});

// REMOVED: Duplicate definition - see line 314 for the active trigger

// Send alerts to besties using cascading notification system
async function sendAlertToBesties(checkInId, checkIn) {
  const userDoc = await db.collection('users').doc(checkIn.userId).get();
  const userData = userDoc.data();

  // Initialize cascading alert - notify first bestie only
  if (checkIn.bestieIds.length === 0) {
    console.log('No besties to notify for check-in:', checkInId);
    return;
  }

  const firstBestieId = checkIn.bestieIds[0];

  // Update check-in with cascading alert fields
  await db.collection('checkins').doc(checkInId).update({
    currentNotifiedBestie: firstBestieId,
    currentNotificationSentAt: admin.firestore.Timestamp.now(),
    notifiedBestieHistory: [firstBestieId],
    acknowledgedBy: [],
  });

  // Send notification to first bestie
  await sendCascadingAlert(checkInId, checkIn, firstBestieId, userData);

  console.log(`Cascading alert initialized for check-in ${checkInId}, notified: ${firstBestieId}`);
}

// Send notification to a specific bestie (cascading alert)
async function sendCascadingAlert(checkInId, checkIn, bestieId, userData) {
  const bestieDoc = await db.collection('users').doc(bestieId).get();

  if (!bestieDoc.exists) {
    console.log(`Bestie ${bestieId} not found`);
    return;
  }

  const bestieData = bestieDoc.data();

  // Sanitize display name to prevent spam flags (remove repeated characters)
  const cleanName = ((userData && userData.displayName) || 'Your friend')
    .toString()
    .replace(/(.)\1{2,}/g, '$1$1') // Max 2 repeated chars
    .trim()
    .substring(0, 30); // Max 30 chars for name

  // Full message for WhatsApp/Email (free/cheap)
  const fullMessage = `🚨 SAFETY ALERT: ${cleanName} hasn't checked in from ${checkIn.location}. They were expected back ${Math.round((Date.now() - checkIn.alertTime.toMillis()) / 60000)} minutes ago. Please check on them!`;

  // ULTRA SHORT message for SMS (MUST be under 160 chars for single segment)
  // Conversational format to avoid spam filters - NO URLs, NO excessive emojis
  const shortMessage = `Hey, ${cleanName} hasn't checked in yet. Please check Besties app - they might need help.`;

  const notificationsSent = [];

  try {
    // Send push notification if user has FCM token (ALWAYS try first)
    if (bestieData.fcmToken && bestieData.notificationsEnabled) {
      try {
        await sendPushNotification(
          bestieData.fcmToken,
          '🚨 Check-in Alert',
          `${cleanName} hasn't checked in yet. They might need help.`,
          {
            type: 'check_in_alert',
            checkInId: checkInId,
            userId: userData.uid || checkIn.userId,
          }
        );
        notificationsSent.push('Push');
      } catch (pushError) {
        console.log('Push notification failed:', pushError.message);
        // Continue with other notification methods
      }
    }

    // Try WhatsApp first (free - use full message)
    if (bestieData.notifications?.whatsapp && bestieData.phoneNumber) {
      try {
        await sendWhatsAppAlert(bestieData.phoneNumber, fullMessage);
        notificationsSent.push('WhatsApp');
      } catch (whatsappError) {
        console.log('WhatsApp failed, trying SMS...');
        // Fallback to SMS (expensive - use short message)
        if (bestieData.notificationPreferences?.sms && bestieData.phoneNumber) {
          await sendSMSAlert(bestieData.phoneNumber, shortMessage);
          notificationsSent.push('SMS');
        }
      }
    } else if (bestieData.notificationPreferences?.sms && bestieData.phoneNumber) {
      // SMS only (expensive - use short message)
      await sendSMSAlert(bestieData.phoneNumber, shortMessage);
      notificationsSent.push('SMS');
    }

    // Send email if enabled (cheap - use full message)
    if (bestieData.email && bestieData.notificationPreferences?.email) {
      await sendEmailAlert(bestieData.email, fullMessage, checkIn);
      notificationsSent.push('Email');
    }

    // Create in-app notification (ALWAYS - regardless of other settings)
    await db.collection('notifications').add({
      userId: bestieId,
      type: 'check_in_alert',
      title: '🚨 Check-in Alert',
      message: `${userData.displayName} hasn't checked in yet. They might need help.`,
      checkInId,
      createdAt: admin.firestore.Timestamp.now(),
      read: false,
    });
    notificationsSent.push('In-app');

    console.log(`Alert sent to ${bestieId} via: ${notificationsSent.join(', ')}`);
  } catch (error) {
    console.error(`Failed to notify bestie ${bestieId}:`, error);
  }
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

async function sendPushNotification(fcmToken, title, body, data = {}) {
  // Construct the push notification payload
  const message = {
    token: fcmToken,
    notification: {
      title,
      body,
    },
    data: {
      ...data,
      click_action: 'FLUTTER_NOTIFICATION_CLICK', // For Flutter apps
    },
    webpush: {
      fcmOptions: {
        link: APP_URL, // Open the app when notification is clicked
      },
      notification: {
        title,
        body,
        icon: '/logo192.png',
        badge: '/logo192.png',
        requireInteraction: true,
        tag: 'check-in-alert',
      },
    },
  };

  try {
    await admin.messaging().send(message);
    console.log(`Push notification sent to token: ${fcmToken.substring(0, 20)}...`);
  } catch (error) {
    // Token might be invalid or expired
    console.error('Error sending push notification:', error.message);
    throw error;
  }
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
    `${userData.displayName} wants you to be their Safety Bestie on Besties! Join now: ${APP_URL}?invite=${context.auth.uid}`;
  
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

  // Stats are updated by onBestieCountUpdate trigger - no need to update here
  // (Removed duplicate increment to fix double-counting bug)

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

    // Increment total check-in count in user stats
    await db.collection('users').doc(checkIn.userId).update({
      'stats.totalCheckIns': admin.firestore.FieldValue.increment(1)
    });

    // Update analytics cache (real-time global stats)
    const cacheRef = db.collection('analytics_cache').doc('realtime');
    await cacheRef.set({
      totalCheckIns: admin.firestore.FieldValue.increment(1),
      activeCheckIns: admin.firestore.FieldValue.increment(1),
      lastUpdated: admin.firestore.Timestamp.now(),
    }, { merge: true });
  });

// Track when check-ins status changes (completed/alerted)
exports.onCheckInCountUpdate = functions.firestore
  .document('checkins/{checkInId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    const userRef = db.collection('users').doc(newData.userId);
    const cacheRef = db.collection('analytics_cache').doc('realtime');

    // Update stats when status changes to 'completed'
    if (newData.status === 'completed' && oldData.status !== 'completed') {
      // Increment completed count in user stats
      await userRef.update({
        'stats.completedCheckIns': admin.firestore.FieldValue.increment(1)
      });

      // Update analytics cache
      await cacheRef.set({
        completedCheckIns: admin.firestore.FieldValue.increment(1),
        activeCheckIns: admin.firestore.FieldValue.increment(-1),
        lastUpdated: admin.firestore.Timestamp.now(),
      }, { merge: true });

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

      // Update streak tracking
      const userDoc = await userRef.get();
      const userData = userDoc.data();
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Get all completed check-ins from today
      const todayCheckIns = await db.collection('checkins')
        .where('userId', '==', newData.userId)
        .where('status', '==', 'completed')
        .where('completedAt', '>=', admin.firestore.Timestamp.fromDate(today))
        .get();

      // Only update streak if this is the first completion today
      if (todayCheckIns.size === 1) {
        // Get yesterday's date range
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayEnd = new Date(yesterday);
        yesterdayEnd.setDate(yesterdayEnd.getDate() + 1);

        // Check if user completed a check-in yesterday
        const yesterdayCheckIns = await db.collection('checkins')
          .where('userId', '==', newData.userId)
          .where('status', '==', 'completed')
          .where('completedAt', '>=', admin.firestore.Timestamp.fromDate(yesterday))
          .where('completedAt', '<', admin.firestore.Timestamp.fromDate(yesterdayEnd))
          .get();

        let newStreak = 1;
        if (yesterdayCheckIns.size > 0) {
          // Consecutive day - increment streak
          newStreak = (userData.stats?.currentStreak || 0) + 1;
        }

        // Update longest streak if current streak is higher
        const longestStreak = userData.stats?.longestStreak || 0;
        const newLongestStreak = Math.max(newStreak, longestStreak);

        await userRef.update({
          'stats.currentStreak': newStreak,
          'stats.longestStreak': newLongestStreak
        });

        // Award streak badge if 7+ days
        if (newStreak >= 7 && !badges.includes('streak_master')) {
          badges.push('streak_master');
          if (badgesDoc.exists) {
            await badgesRef.update({ badges });
          } else {
            await badgesRef.set({ userId: newData.userId, badges, createdAt: admin.firestore.Timestamp.now() });
          }
        }
      }
    }

    // Update stats when status changes to 'alerted'
    if (newData.status === 'alerted' && oldData.status !== 'alerted') {
      await userRef.update({
        'stats.alertedCheckIns': admin.firestore.FieldValue.increment(1)
      });

      // Update analytics cache
      await cacheRef.set({
        alertedCheckIns: admin.firestore.FieldValue.increment(1),
        activeCheckIns: admin.firestore.FieldValue.increment(-1),
        lastUpdated: admin.firestore.Timestamp.now(),
      }, { merge: true });
    }
  });

// Track when new bestie requests are created
exports.onBestieCreated = functions.firestore
  .document('besties/{bestieId}')
  .onCreate(async (snap, context) => {
    const bestie = snap.data();

    // Update analytics cache
    const cacheRef = db.collection('analytics_cache').doc('realtime');
    await cacheRef.set({
      totalBesties: admin.firestore.FieldValue.increment(1),
      pendingBesties: bestie.status === 'pending' ? admin.firestore.FieldValue.increment(1) : admin.firestore.FieldValue.increment(0),
      lastUpdated: admin.firestore.Timestamp.now(),
    }, { merge: true });
  });

exports.onBestieCountUpdate = functions.firestore
  .document('besties/{bestieId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    const cacheRef = db.collection('analytics_cache').doc('realtime');

    if (newData.status === 'accepted' && oldData.status !== 'accepted') {
      // Increment totalBesties for both users
      await db.collection('users').doc(newData.requesterId).update({
        'stats.totalBesties': admin.firestore.FieldValue.increment(1)
      });
      await db.collection('users').doc(newData.recipientId).update({
        'stats.totalBesties': admin.firestore.FieldValue.increment(1)
      });

      // Add to bestieUserIds AND featuredCircle arrays for both users
      await db.collection('users').doc(newData.requesterId).update({
        bestieUserIds: admin.firestore.FieldValue.arrayUnion(newData.recipientId),
        featuredCircle: admin.firestore.FieldValue.arrayUnion(newData.recipientId)
      });
      await db.collection('users').doc(newData.recipientId).update({
        bestieUserIds: admin.firestore.FieldValue.arrayUnion(newData.requesterId),
        featuredCircle: admin.firestore.FieldValue.arrayUnion(newData.requesterId)
      });

      // Update analytics cache: pending → accepted
      await cacheRef.set({
        acceptedBesties: admin.firestore.FieldValue.increment(1),
        pendingBesties: admin.firestore.FieldValue.increment(-1),
        lastUpdated: admin.firestore.Timestamp.now(),
      }, { merge: true });

      await awardBestieBadge(newData.requesterId);
      await awardBestieBadge(newData.recipientId);
    }

    // Handle declined/cancelled besties
    if ((newData.status === 'declined' || newData.status === 'cancelled') &&
        oldData.status === 'pending') {
      await cacheRef.set({
        pendingBesties: admin.firestore.FieldValue.increment(-1),
        totalBesties: admin.firestore.FieldValue.increment(-1),
        lastUpdated: admin.firestore.Timestamp.now(),
      }, { merge: true });
    }
  });

// Handle when bestie is created with accepted status (e.g., via invite link)
exports.onBestieCreated = functions.firestore
  .document('besties/{bestieId}')
  .onCreate(async (snap, context) => {
    const bestie = snap.data();
    const cacheRef = db.collection('analytics_cache').doc('realtime');

    // Only process if created directly as accepted (e.g., invite link flow)
    if (bestie.status === 'accepted' && bestie.requesterId && bestie.recipientId) {
      // Increment totalBesties for both users
      await db.collection('users').doc(bestie.requesterId).update({
        'stats.totalBesties': admin.firestore.FieldValue.increment(1)
      });
      await db.collection('users').doc(bestie.recipientId).update({
        'stats.totalBesties': admin.firestore.FieldValue.increment(1)
      });

      // Add to bestieUserIds AND featuredCircle arrays for both users
      // This is CRITICAL - without this, besties can't view each other's profiles
      await db.collection('users').doc(bestie.requesterId).update({
        bestieUserIds: admin.firestore.FieldValue.arrayUnion(bestie.recipientId),
        featuredCircle: admin.firestore.FieldValue.arrayUnion(bestie.recipientId)
      });
      await db.collection('users').doc(bestie.recipientId).update({
        bestieUserIds: admin.firestore.FieldValue.arrayUnion(bestie.requesterId),
        featuredCircle: admin.firestore.FieldValue.arrayUnion(bestie.requesterId)
      });

      // Update analytics cache: new accepted bestie
      await cacheRef.set({
        totalBesties: admin.firestore.FieldValue.increment(1),
        acceptedBesties: admin.firestore.FieldValue.increment(1),
        lastUpdated: admin.firestore.Timestamp.now(),
      }, { merge: true });

      // Award badges
      await awardBestieBadge(bestie.requesterId);
      await awardBestieBadge(bestie.recipientId);
    } else if (bestie.status === 'pending') {
      // Update analytics cache: new pending bestie
      await cacheRef.set({
        totalBesties: admin.firestore.FieldValue.increment(1),
        pendingBesties: admin.firestore.FieldValue.increment(1),
        lastUpdated: admin.firestore.Timestamp.now(),
      }, { merge: true });
    }
  });

// Remove from bestieUserIds and featuredCircle when bestie relationship is deleted
exports.onBestieDeleted = functions.firestore
  .document('besties/{bestieId}')
  .onDelete(async (snap, context) => {
    const bestie = snap.data();

    // Only remove if the relationship was accepted
    if (bestie.status === 'accepted' && bestie.requesterId && bestie.recipientId) {
      // Remove from both users' bestieUserIds and featuredCircle arrays
      // AND decrement their totalBesties counter
      await db.collection('users').doc(bestie.requesterId).update({
        bestieUserIds: admin.firestore.FieldValue.arrayRemove(bestie.recipientId),
        featuredCircle: admin.firestore.FieldValue.arrayRemove(bestie.recipientId),
        'stats.totalBesties': admin.firestore.FieldValue.increment(-1)
      });
      await db.collection('users').doc(bestie.recipientId).update({
        bestieUserIds: admin.firestore.FieldValue.arrayRemove(bestie.requesterId),
        featuredCircle: admin.firestore.FieldValue.arrayRemove(bestie.requesterId),
        'stats.totalBesties': admin.firestore.FieldValue.increment(-1)
      });

      // Update analytics cache
      const cacheRef = db.collection('analytics_cache').doc('realtime');
      await cacheRef.set({
        totalBesties: admin.firestore.FieldValue.increment(-1),
        acceptedBesties: admin.firestore.FieldValue.increment(-1),
        lastUpdated: admin.firestore.Timestamp.now(),
      }, { merge: true });
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

// Track when new users sign up (Firebase Auth trigger)
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
  // Update analytics cache
  const cacheRef = db.collection('analytics_cache').doc('realtime');
  await cacheRef.set({
    totalUsers: admin.firestore.FieldValue.increment(1),
    lastUpdated: admin.firestore.Timestamp.now(),
  }, { merge: true });

  // Initialize user document (moved from core/auth/onUserCreated.js)
  await db.collection('users').doc(user.uid).set({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email?.split('@')[0] || 'User',
    photoURL: user.photoURL || null,
    phoneNumber: user.phoneNumber || null,

    notificationPreferences: {
      whatsapp: false,
      sms: false,
      facebook: false,
      email: true
    },

    settings: {
      defaultBesties: [],
      dataRetention: 168, // 7 days in hours
      holdData: false
    },

    smsSubscription: {
      active: false,
      plan: null,
      startedAt: null
    },

    donationStats: {
      isActive: false,
      totalDonated: 0,
      monthlyAmount: 0,
      startedAt: null
    },

    stats: {
      totalCheckIns: 0,
      completedCheckIns: 0,
      alertedCheckIns: 0,
      totalBesties: 0,
      joinedAt: admin.firestore.Timestamp.now()
    },

    profile: {
      featuredBadges: [],
      bio: null
    },

    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    onboardingCompleted: false,
    featuredCircle: []
  });

  // Initialize badges document
  await db.collection('badges').doc(user.uid).set({
    userId: user.uid,
    badges: [],
    stats: {
      guardianCount: 0,
      bestiesCount: 0,
      donationTotal: 0,
      checkinCount: 0
    },
    createdAt: admin.firestore.Timestamp.now()
  });

  console.log('User created successfully:', user.uid);
});

// ========================================
// DURESS CODE HANDLER
// ========================================

// Monitor alerts collection for duress code usage
exports.onDuressCodeUsed = functions.firestore
  .document('alerts/{alertId}')
  .onCreate(async (snap, context) => {
    const alert = snap.data();

    // Only handle duress code alerts (check internal flag, not public type)
    if (!alert._internal_duress) {
      return null;
    }

    console.log('🚨 DURESS CODE DETECTED:', alert.userId);

    // Get user data
    const userDoc = await db.collection('users').doc(alert.userId).get();
    if (!userDoc.exists) {
      console.error('User not found for duress alert:', alert.userId);
      return null;
    }

    const userData = userDoc.data();

    // Get all besties in user's circle (favorites)
    const besties1 = await db.collection('besties')
      .where('requesterId', '==', alert.userId)
      .where('status', '==', 'accepted')
      .where('isFavorite', '==', true)
      .get();

    const besties2 = await db.collection('besties')
      .where('recipientId', '==', alert.userId)
      .where('status', '==', 'accepted')
      .where('isFavorite', '==', true)
      .get();

    const bestieIds = [];
    besties1.forEach(doc => bestieIds.push(doc.data().recipientId));
    besties2.forEach(doc => bestieIds.push(doc.data().requesterId));

    if (bestieIds.length === 0) {
      console.log('No circle besties found for duress alert');
      return null;
    }

    // Critical message - make it clear this is a duress situation
    const fullMessage = `🚨🚨 DURESS CODE ALERT 🚨🚨\n\n${userData.displayName} used their DURESS CODE.\n\nThis means they are in DANGER and were FORCED to cancel a check-in.\n\nLocation: ${alert.location}\n\nACT IMMEDIATELY - Contact authorities if you cannot reach them!`;

    const shortMessage = `🚨 DURESS: ${userData.displayName} is in danger! Location: ${alert.location}. Call police!`;

    // Send critical alerts to all circle besties
    const notifications = bestieIds.map(async (bestieId) => {
      const bestieDoc = await db.collection('users').doc(bestieId).get();
      if (!bestieDoc.exists) return;

      const bestieData = bestieDoc.data();

      try {
        // Send ALL notification types for duress - this is critical
        if (bestieData.phoneNumber) {
          // WhatsApp (free, use full message)
          try {
            await sendWhatsAppAlert(bestieData.phoneNumber, fullMessage);
          } catch (error) {
            console.log('WhatsApp failed for duress alert');
          }

          // SMS (expensive but critical - use short message)
          try {
            await sendSMSAlert(bestieData.phoneNumber, shortMessage);
          } catch (error) {
            console.log('SMS failed for duress alert');
          }
        }

        // Email (use full message)
        if (bestieData.email) {
          await sendEmailAlert(bestieData.email, fullMessage, {
            location: alert.location,
            alertTime: alert.timestamp,
          });
        }

        // Push notification (if enabled)
        if (bestieData.fcmToken && bestieData.notificationsEnabled) {
          await admin.messaging().send({
            token: bestieData.fcmToken,
            notification: {
              title: '🚨 DURESS CODE ALERT',
              body: `${userData.displayName} is in danger! Check now!`,
            },
            data: {
              type: 'critical_alert',
              userId: alert.userId,
              location: alert.location,
            },
          });
        }

        // Log notification (use generic type to hide duress nature)
        await db.collection('notifications').add({
          userId: bestieId,
          type: 'critical_alert',
          alertId: context.params.alertId,
          message: fullMessage,
          sentAt: admin.firestore.Timestamp.now(),
          read: false,
          priority: 'critical',
        });

      } catch (error) {
        console.error(`Failed to send duress alert to ${bestieId}:`, error);
      }
    });

    await Promise.all(notifications);

    console.log(`Duress alert sent to ${bestieIds.length} circle besties`);
    return null;
  });

// ========================================
// EMERGENCY SOS
// ========================================

exports.triggerEmergencySOS = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { location, isReversePIN } = data;

  // Rate limiting: 3 SOS per hour
  const oneHourAgo = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() - 60 * 60 * 1000)
  );

  const recentSosCount = await db.collection('emergency_sos')
    .where('userId', '==', context.auth.uid)
    .where('createdAt', '>=', oneHourAgo)
    .count()
    .get();

  const sosCount = recentSosCount.data().count;

  // Warn after 2nd use
  if (sosCount === 2) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Warning: You have triggered SOS twice in the last hour. You have 1 more use remaining before hitting the hourly limit.'
    );
  }

  // Block after 3rd use
  if (sosCount >= 3) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'SOS limit reached: Maximum 3 emergency SOS calls per hour. Please wait before triggering again.'
    );
  }

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

  // Sanitize display name to prevent spam flags
  const cleanName = ((userData && userData.displayName) || 'Your friend')
    .toString()
    .replace(/(.)\1{2,}/g, '$1$1') // Max 2 repeated chars
    .trim()
    .substring(0, 30); // Max 30 chars for name

  // Full message for WhatsApp/Email
  const fullAlertMessage = isReversePIN
    ? `🚨 SILENT EMERGENCY: ${cleanName} triggered reverse PIN. Location: ${location || 'Unknown'}. Covert distress signal.`
    : `🆘 EMERGENCY: ${cleanName} triggered SOS! Location: ${location || 'Unknown'}. Help immediately!`;

  // Short message for SMS (NO URLS - they trigger spam filters)
  const shortAlertMessage = isReversePIN
    ? `URGENT: ${cleanName} sent a silent alert. Check Besties app immediately.`
    : `EMERGENCY: ${cleanName} needs help NOW! Location: ${location || 'Unknown'}. Check Besties app!`;

  const notifications = bestieIds.map(async (bestieId) => {
    const bestieDoc = await db.collection('users').doc(bestieId).get();
    if (!bestieDoc.exists) return;

    const bestieData = bestieDoc.data();
    const notificationsSent = [];

    try {
      // Try push notification first (ALWAYS try - it's fast and free)
      if (bestieData.fcmToken && bestieData.notificationsEnabled) {
        try {
          const pushTitle = isReversePIN ? '🚨 Silent Emergency Alert' : '🆘 EMERGENCY SOS';
          const pushBody = isReversePIN
            ? `${cleanName} triggered reverse PIN. Check app immediately.`
            : `${cleanName} needs help NOW! Location: ${location || 'Unknown'}`;

          await sendPushNotification(
            bestieData.fcmToken,
            pushTitle,
            pushBody,
            {
              type: 'emergency_sos',
              sosId: sosRef.id,
              userId: context.auth.uid,
              isReversePIN: isReversePIN || false,
            }
          );
          notificationsSent.push('Push');
        } catch (pushError) {
          console.log('Push notification failed for SOS:', pushError.message);
        }
      }

      // Send SMS and WhatsApp if phone number available
      if (bestieData.phoneNumber) {
        // SMS is expensive - use short message
        await sendSMSAlert(bestieData.phoneNumber, shortAlertMessage);
        notificationsSent.push('SMS');
        // WhatsApp is free - use full message
        await sendWhatsAppAlert(bestieData.phoneNumber, fullAlertMessage);
        notificationsSent.push('WhatsApp');
      }

      // Send email if enabled
      if (bestieData.email && bestieData.notificationPreferences?.email) {
        await sendEmailAlert(bestieData.email, fullAlertMessage, {
          location: location || 'Unknown',
          alertTime: admin.firestore.Timestamp.now(),
        });
        notificationsSent.push('Email');
      }

      // Create in-app notification (ALWAYS - regardless of other settings)
      await db.collection('notifications').add({
        userId: bestieId,
        type: 'emergency_sos',
        title: isReversePIN ? '🚨 Silent Emergency' : '🆘 EMERGENCY SOS',
        message: fullAlertMessage,
        sosId: sosRef.id,
        createdAt: admin.firestore.Timestamp.now(),
        read: false,
      });
      notificationsSent.push('In-app');

      console.log(`SOS sent to ${bestieId} via: ${notificationsSent.join(', ')}`);
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

// Update user streaks daily
exports.updateDailyStreaks = functions.pubsub
  .schedule('0 1 * * *') // Run daily at 1 AM
  .timeZone('America/New_York')
  .onRun(async (context) => {
    console.log('📊 Starting daily streak update...');

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    // Get all users
    const usersSnapshot = await db.collection('users').get();
    const updatePromises = [];

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      const lastActive = userData.lastActive?.toDate();

      if (!lastActive) {
        // User has never been active, skip
        continue;
      }

      const currentStreak = userData.stats?.currentStreak || 0;
      const longestStreak = userData.stats?.longestStreak || 0;
      const daysActive = userData.stats?.daysActive || 0;

      // Check if user was active yesterday
      const wasActiveYesterday = lastActive >= yesterday && lastActive <= yesterdayEnd;

      let newStreak = currentStreak;
      let newLongestStreak = longestStreak;
      let newDaysActive = daysActive;

      if (wasActiveYesterday) {
        // User was active yesterday - increment streak
        newStreak = currentStreak + 1;
        newDaysActive = daysActive + 1;

        // Update longest streak if current exceeds it
        if (newStreak > longestStreak) {
          newLongestStreak = newStreak;
        }
      } else {
        // User was not active yesterday - check if streak should break
        const daysSinceActive = Math.floor((now - lastActive) / (1000 * 60 * 60 * 24));

        if (daysSinceActive > 1) {
          // Missed more than 1 day - reset streak
          newStreak = 0;
        }
        // If daysSinceActive === 1, we're still within grace period (today), keep streak
      }

      // Only update if values changed
      if (
        newStreak !== currentStreak ||
        newLongestStreak !== longestStreak ||
        newDaysActive !== daysActive
      ) {
        updatePromises.push(
          userDoc.ref.update({
            'stats.currentStreak': newStreak,
            'stats.longestStreak': newLongestStreak,
            'stats.daysActive': newDaysActive,
          })
        );
      }
    }

    await Promise.all(updatePromises);

    console.log(`✅ Updated streaks for ${updatePromises.length} users`);
    return null;
  });

/**
 * Rebuild Analytics Cache - Admin Only
 * Recalculates all analytics from raw data if cache gets out of sync
 * Call this to initialize the cache or fix discrepancies
 */
exports.rebuildAnalyticsCache = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  // Check admin status
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!userDoc.exists || !userDoc.data().isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  console.log('🔄 Rebuilding analytics cache from raw data...');

  try {
    // Count total users
    const usersCount = await db.collection('users').count().get();
    const totalUsers = usersCount.data().count;

    // Count check-ins by status
    const [totalCheckInsCount, activeCheckInsCount, completedCheckInsCount, alertedCheckInsCount] = await Promise.all([
      db.collection('checkins').count().get(),
      db.collection('checkins').where('status', '==', 'active').count().get(),
      db.collection('checkins').where('status', '==', 'completed').count().get(),
      db.collection('checkins').where('status', '==', 'alerted').count().get(),
    ]);

    // Count besties by status
    const [totalBestiesCount, pendingBestiesCount, acceptedBestiesCount] = await Promise.all([
      db.collection('besties').count().get(),
      db.collection('besties').where('status', '==', 'pending').count().get(),
      db.collection('besties').where('status', '==', 'accepted').count().get(),
    ]);

    // Calculate revenue stats (need to scan users for this)
    const usersSnapshot = await db.collection('users').get();
    let smsSubscribers = 0;
    let donorsActive = 0;
    let totalDonations = 0;

    usersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.smsSubscription?.active) smsSubscribers++;
      if (data.donationStats?.isActive) donorsActive++;
      if (data.donationStats?.totalDonated) totalDonations += data.donationStats.totalDonated;
    });

    // Count templates and badges
    const [templatesCount, badgesCount] = await Promise.all([
      db.collection('templates').count().get(),
      db.collection('badges').count().get(),
    ]);

    // Build the cache document
    const cacheData = {
      // User stats
      totalUsers,

      // Check-in stats
      totalCheckIns: totalCheckInsCount.data().count,
      activeCheckIns: activeCheckInsCount.data().count,
      completedCheckIns: completedCheckInsCount.data().count,
      alertedCheckIns: alertedCheckInsCount.data().count,

      // Bestie stats
      totalBesties: totalBestiesCount.data().count,
      pendingBesties: pendingBestiesCount.data().count,
      acceptedBesties: acceptedBestiesCount.data().count,

      // Revenue stats
      smsSubscribers,
      donorsActive,
      totalDonations,

      // Engagement stats
      totalTemplates: templatesCount.data().count,
      totalBadges: badgesCount.data().count,

      // Metadata
      lastUpdated: admin.firestore.Timestamp.now(),
      lastRebuild: admin.firestore.Timestamp.now(),
      rebuiltBy: context.auth.uid,
    };

    // Write to analytics_cache
    await db.collection('analytics_cache').doc('realtime').set(cacheData);

    console.log('✅ Analytics cache rebuilt successfully');
    console.log('Cache data:', cacheData);

    return {
      success: true,
      cache: cacheData,
      message: 'Analytics cache rebuilt successfully',
    };
  } catch (error) {
    console.error('❌ Error rebuilding analytics cache:', error);
    throw new functions.https.HttpsError('internal', 'Failed to rebuild cache: ' + error.message);
  }
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
      return_url: `${APP_URL}/settings`,
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
                link: APP_URL,
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
          <a href="${APP_URL}/error-dashboard"
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
    const sevenDaysAgo = admin.firestore.Timestamp.fromDate(
      new Date(now.toDate().getTime() - 7 * 24 * 60 * 60 * 1000)
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
          .where('createdAt', '<', sevenDaysAgo)
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
          .where('createdAt', '<', sevenDaysAgo)
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
// BIRTHDAY NOTIFICATIONS
// ========================================

// Check for birthdays and notify besties daily at midnight
exports.checkBirthdays = functions.pubsub
  .schedule('0 0 * * *') // Run daily at midnight
  .timeZone('America/New_York')
  .onRun(async (context) => {
    console.log('🎂 Starting birthday check...');

    const today = new Date();
    const todayMonth = today.getMonth() + 1; // JavaScript months are 0-indexed
    const todayDay = today.getDate();

    try {
      // Get all users
      const usersSnapshot = await db.collection('users').get();

      let birthdayCount = 0;
      let notificationsSent = 0;

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;

        // Check if user has a birthdate set
        if (!userData?.profile?.birthdate) {
          continue;
        }

        // Parse birthdate (format: YYYY-MM-DD)
        const birthdate = new Date(userData.profile.birthdate);
        const birthMonth = birthdate.getMonth() + 1;
        const birthDay = birthdate.getDate();

        // Check if today is their birthday
        if (birthMonth === todayMonth && birthDay === todayDay) {
          console.log(`🎉 Birthday found: ${userData.displayName} (${userId})`);
          birthdayCount++;

          // Get all besties for this user
          const bestiesQuery1 = await db.collection('besties')
            .where('requesterId', '==', userId)
            .where('status', '==', 'accepted')
            .get();

          const bestiesQuery2 = await db.collection('besties')
            .where('recipientId', '==', userId)
            .where('status', '==', 'accepted')
            .get();

          const bestieIds = new Set();

          bestiesQuery1.forEach(doc => {
            bestieIds.add(doc.data().recipientId);
          });

          bestiesQuery2.forEach(doc => {
            bestieIds.add(doc.data().requesterId);
          });

          console.log(`Found ${bestieIds.size} besties for ${userData.displayName}`);

          // Send notification to each bestie
          for (const bestieId of bestieIds) {
            try {
              const bestieDoc = await db.collection('users').doc(bestieId).get();

              if (!bestieDoc.exists) {
                continue;
              }

              const bestieData = bestieDoc.data();
              const birthdayName = userData.displayName || 'Your bestie';

              // Send push notification if available
              if (bestieData.fcmToken && bestieData.notificationsEnabled) {
                const message = {
                  notification: {
                    title: `🎂 ${birthdayName}'s Birthday!`,
                    body: `It's ${birthdayName}'s birthday today! Send them some love 💕`,
                  },
                  data: {
                    type: 'birthday',
                    userId: userId,
                    userName: userData.displayName || 'Your bestie',
                  },
                  token: bestieData.fcmToken,
                };

                await admin.messaging().send(message);
                notificationsSent++;
              }

              // Send email notification
              if (bestieData.email) {
                try {
                  await sgMail.send({
                    to: bestieData.email,
                    from: 'notifications@bestiesapp.com',
                    subject: `🎂 ${birthdayName}'s Birthday!`,
                    html: `
                      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #FF6B9D;">🎂 Birthday Reminder!</h1>
                        <p style="font-size: 16px;">
                          It's <strong>${birthdayName}'s</strong> birthday today!
                        </p>
                        <p style="font-size: 16px;">
                          Send them some birthday love 💕
                        </p>
                        <a href="${APP_URL}/user/${userId}"
                           style="display: inline-block; background: #FF6B9D; color: white;
                                  padding: 12px 24px; text-decoration: none; border-radius: 8px;
                                  margin-top: 16px;">
                          View Their Profile
                        </a>
                      </div>
                    `,
                  });
                  notificationsSent++;
                } catch (emailError) {
                  console.error('Failed to send birthday email:', emailError);
                }
              }

            } catch (notifError) {
              console.error(`Failed to notify bestie ${bestieId}:`, notifError);
            }
          }
        }
      }

      console.log(`🎂 Birthday check complete: ${birthdayCount} birthdays, ${notificationsSent} notifications sent`);

      return {
        success: true,
        birthdayCount,
        notificationsSent,
      };
    } catch (error) {
      console.error('Error during birthday check:', error);
      return { success: false, error: error.message };
    }
  });

// ========================================
// TEST ALERT FUNCTION
// ========================================

// Send test alert to verify notification setup (PUSH ONLY to save costs)
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
    const channelsTested = {
      push: false,
      email: false,
      whatsapp: false,
      sms: false,
    };

    // Try to send Push Notification first
    if (userData.fcmToken && userData.notificationsEnabled) {
      try {
        const pushMessage = {
          notification: {
            title: '✅ Test Alert Success!',
            body: 'Your push notifications are working correctly!',
          },
          data: {
            type: 'test_alert',
            message: 'Push notifications working! 💜'
          },
          webpush: {
            fcmOptions: {
              link: APP_URL,
            },
            notification: {
              title: '✅ Test Alert Success!',
              body: 'Your push notifications are working correctly!',
              icon: '/logo192.png',
              badge: '/logo192.png',
              requireInteraction: true,
              tag: 'test-alert',
            },
          },
          token: userData.fcmToken,
        };

        await admin.messaging().send(pushMessage);
        channelsTested.push = true;
        console.log('Test push notification sent successfully');
      } catch (pushError) {
        console.error('Push notification failed:', pushError.message);
        // Continue to try email
      }
    }

    // Also send Email if enabled (cheap to test)
    if (userData.email && userData.notificationPreferences?.email) {
      try {
        const emailMessage = {
          to: userData.email,
          from: 'alerts@bestiesapp.com',
          subject: '✅ Test Alert - Your Notifications Are Working!',
          text: 'Your email notifications are set up correctly! You\'ll receive alerts via email when your besties need help.',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #FF6B9D;">✅ Test Alert Success!</h2>
              <p>Your email notifications are working perfectly! 💜</p>
              <p>You'll receive alerts via email when your besties need help or when you miss a check-in.</p>
              <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <strong>What this means:</strong><br>
                ✉️ Email alerts are active<br>
                📱 You'll be notified for check-in alerts<br>
                🚨 Safety alerts will reach you instantly
              </div>
            </div>
          `,
        };
        await sgMail.send(emailMessage);
        channelsTested.email = true;
        console.log('Test email sent successfully');
      } catch (emailError) {
        console.error('Email notification failed:', emailError.message);
      }
    }

    // Check if at least one channel was tested
    if (!channelsTested.push && !channelsTested.email) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'No notification channels enabled. Please enable push notifications or email notifications in settings.'
      );
    }

    return {
      success: true,
      message: 'Test alert sent successfully',
      channels: channelsTested,
      note: 'SMS and WhatsApp are not tested to save costs, but use the same backend system. If email works, they will work too!'
    };
  } catch (error) {
    console.error('Error sending test alert:', error);
    if (error.code === 'failed-precondition') {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to send test alert: ' + error.message);
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

// ========================================
// DATA MIGRATION: Fix Double-Counted Stats
// ========================================

/**
 * Fix double-counted user stats (Admin only)
 * Recalculates stats.completedCheckIns, stats.alertedCheckIns, and stats.totalBesties
 * from source collections to fix the double-counting bug.
 */
exports.fixDoubleCountedStats = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  // Check admin status
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!userDoc.exists || !userDoc.data().isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  console.log('🔄 Starting data migration to fix double-counted stats...');

  try {
    const { fixDoubleCountedStats } = require('./migrations/fixDoubleCountedStats');
    const result = await fixDoubleCountedStats();

    return {
      success: true,
      message: 'Stats migration completed successfully',
      ...result,
    };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw new functions.https.HttpsError('internal', 'Migration failed: ' + error.message);
  }
});

// ========================================
// BACKFILL FUNCTIONS
// ========================================

// One-time backfill to populate bestieUserIds for existing besties
const { backfillBestieUserIds } = require('./backfillBestieUserIds');
exports.backfillBestieUserIds = functions.https.onCall(async (data, context) => {
  // Require admin privileges for security
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  // Check if user is admin
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!userDoc.exists || !userDoc.data().isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Must be admin to run backfill');
  }

  console.log(`🔧 Backfill triggered by admin: ${context.auth.uid}`);

  try {
    const result = await backfillBestieUserIds();
    return {
      success: true,
      message: 'Backfill completed successfully',
      ...result
    };
  } catch (error) {
    console.error('❌ Backfill failed:', error);
    throw new functions.https.HttpsError('internal', 'Backfill failed: ' + error.message);
  }
});

// ========================================
// CONNECTION STRENGTH TRACKING
// ========================================

// Track interactions for connection strength calculations
// Triggered when posts/check-ins reactions and comments are created
exports.trackReaction = functions.firestore
  .document('posts/{postId}/reactions/{reactionId}')
  .onCreate(async (snap, context) => {
    const reaction = snap.data();
    const postId = context.params.postId;

    // Get post to find owner
    const postDoc = await db.collection('posts').doc(postId).get();
    if (!postDoc.exists) return null;

    const postData = postDoc.data();
    const postOwnerId = postData.userId;
    const reactorId = reaction.userId;

    // Don't track if reacting to own post
    if (postOwnerId === reactorId) return null;

    // Track interaction
    await db.collection('interactions').add({
      userId: postOwnerId,
      bestieId: reactorId,
      type: 'post_reaction',
      postId: postId,
      createdAt: admin.firestore.Timestamp.now(),
    });

    console.log(`Tracked reaction interaction: ${reactorId} → ${postOwnerId}`);
    return null;
  });

// Track check-in reactions
exports.trackCheckInReaction = functions.firestore
  .document('checkins/{checkInId}/reactions/{reactionId}')
  .onCreate(async (snap, context) => {
    const reaction = snap.data();
    const checkInId = context.params.checkInId;

    // Get check-in to find owner
    const checkInDoc = await db.collection('checkins').doc(checkInId).get();
    if (!checkInDoc.exists) return null;

    const checkInData = checkInDoc.data();
    const checkInOwnerId = checkInData.userId;
    const reactorId = reaction.userId;

    // Don't track if reacting to own check-in
    if (checkInOwnerId === reactorId) return null;

    // Track interaction
    await db.collection('interactions').add({
      userId: checkInOwnerId,
      bestieId: reactorId,
      type: 'checkin_reaction',
      checkInId: checkInId,
      createdAt: admin.firestore.Timestamp.now(),
    });

    console.log(`Tracked check-in reaction: ${reactorId} → ${checkInOwnerId}`);
    return null;
  });

// Track comments on posts
exports.trackPostComment = functions.firestore
  .document('posts/{postId}/comments/{commentId}')
  .onCreate(async (snap, context) => {
    const comment = snap.data();
    const postId = context.params.postId;

    // Get post to find owner
    const postDoc = await db.collection('posts').doc(postId).get();
    if (!postDoc.exists) return null;

    const postData = postDoc.data();
    const postOwnerId = postData.userId;
    const commenterId = comment.userId;

    // Don't track if commenting on own post
    if (postOwnerId === commenterId) return null;

    // Track interaction
    await db.collection('interactions').add({
      userId: postOwnerId,
      bestieId: commenterId,
      type: 'post_comment',
      postId: postId,
      createdAt: admin.firestore.Timestamp.now(),
    });

    console.log(`Tracked comment interaction: ${commenterId} → ${postOwnerId}`);
    return null;
  });

// Track comments on check-ins
exports.trackCheckInComment = functions.firestore
  .document('checkins/{checkInId}/comments/{commentId}')
  .onCreate(async (snap, context) => {
    const comment = snap.data();
    const checkInId = context.params.checkInId;

    // Get check-in to find owner
    const checkInDoc = await db.collection('checkins').doc(checkInId).get();
    if (!checkInDoc.exists) return null;

    const checkInData = checkInDoc.data();
    const checkInOwnerId = checkInData.userId;
    const commenterId = comment.userId;

    // Don't track if commenting on own check-in
    if (checkInOwnerId === commenterId) return null;

    // Track interaction
    await db.collection('interactions').add({
      userId: checkInOwnerId,
      bestieId: commenterId,
      type: 'checkin_comment',
      checkInId: checkInId,
      createdAt: admin.firestore.Timestamp.now(),
    });

    console.log(`Tracked check-in comment: ${commenterId} → ${checkInOwnerId}`);
    return null;
  });

// ========================================
// MILESTONE CELEBRATIONS
// ========================================

// Check for milestones daily at 1 AM
exports.generateMilestones = functions.pubsub
  .schedule('0 1 * * *') // Run daily at 1:00 AM
  .timeZone('America/New_York')
  .onRun(async (context) => {
    console.log('🎉 Starting milestone generation...');

    let milestonesCreated = 0;

    try {
      // Get all accepted bestie relationships
      const bestiesSnapshot = await db.collection('besties')
        .where('status', '==', 'accepted')
        .get();

      console.log(`Checking ${bestiesSnapshot.size} bestie relationships for milestones`);

      for (const bestieDoc of bestiesSnapshot.docs) {
        const bestieData = bestieDoc.data();
        const userId1 = bestieData.requesterId;
        const userId2 = bestieData.recipientId;

        // Check days in circle milestone (7, 30, 100, 365 days)
        if (bestieData.acceptedAt) {
          const daysTogether = Math.floor(
            (Date.now() - bestieData.acceptedAt.toMillis()) / (24 * 60 * 60 * 1000)
          );

          const milestones = [7, 30, 100, 365];
          if (milestones.includes(daysTogether)) {
            // Create milestone for both users
            const user1Doc = await db.collection('users').doc(userId1).get();
            const user2Doc = await db.collection('users').doc(userId2).get();

            if (user1Doc.exists && user2Doc.exists) {
              await db.collection('circle_milestones').add({
                userId: userId1,
                bestieId: userId2,
                bestieName: user2Doc.data().displayName,
                type: 'days_in_circle',
                value: daysTogether,
                createdAt: admin.firestore.Timestamp.now(),
                celebrated: false,
              });

              await db.collection('circle_milestones').add({
                userId: userId2,
                bestieId: userId1,
                bestieName: user1Doc.data().displayName,
                type: 'days_in_circle',
                value: daysTogether,
                createdAt: admin.firestore.Timestamp.now(),
                celebrated: false,
              });

              milestonesCreated += 2;
              console.log(`Created ${daysTogether} days milestone for ${userId1} & ${userId2}`);
            }
          }
        }

        // Check shared check-ins milestone (5, 10, 25, 50)
        const sharedCheckIns1 = await db.collection('checkins')
          .where('userId', '==', userId1)
          .where('bestieIds', 'array-contains', userId2)
          .where('status', '==', 'completed')
          .count()
          .get();

        const sharedCheckIns2 = await db.collection('checkins')
          .where('userId', '==', userId2)
          .where('bestieIds', 'array-contains', userId1)
          .where('status', '==', 'completed')
          .count()
          .get();

        const totalShared = sharedCheckIns1.data().count + sharedCheckIns2.data().count;
        const checkInMilestones = [5, 10, 25, 50];

        if (checkInMilestones.includes(totalShared)) {
          // Check if milestone already exists
          const existing = await db.collection('circle_milestones')
            .where('userId', '==', userId1)
            .where('bestieId', '==', userId2)
            .where('type', '==', 'check_ins_together')
            .where('value', '==', totalShared)
            .get();

          if (existing.empty) {
            const user1Doc = await db.collection('users').doc(userId1).get();
            const user2Doc = await db.collection('users').doc(userId2).get();

            if (user1Doc.exists && user2Doc.exists) {
              await db.collection('circle_milestones').add({
                userId: userId1,
                bestieId: userId2,
                bestieName: user2Doc.data().displayName,
                type: 'check_ins_together',
                value: totalShared,
                createdAt: admin.firestore.Timestamp.now(),
                celebrated: false,
              });

              await db.collection('circle_milestones').add({
                userId: userId2,
                bestieId: userId1,
                bestieName: user1Doc.data().displayName,
                type: 'check_ins_together',
                value: totalShared,
                createdAt: admin.firestore.Timestamp.now(),
                celebrated: false,
              });

              milestonesCreated += 2;
              console.log(`Created ${totalShared} check-ins milestone for ${userId1} & ${userId2}`);
            }
          }
        }
      }

      // Check individual alert response milestones (5, 10, 25, 50 responses)
      const usersSnapshot = await db.collection('users').get();

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;

        const alertResponses = await db.collection('alert_responses')
          .where('responderId', '==', userId)
          .count()
          .get();

        const responseCount = alertResponses.data().count;
        const responseMilestones = [5, 10, 25, 50];

        if (responseMilestones.includes(responseCount)) {
          // Check if milestone already exists
          const existing = await db.collection('circle_milestones')
            .where('userId', '==', userId)
            .where('type', '==', 'alerts_responded')
            .where('value', '==', responseCount)
            .get();

          if (existing.empty) {
            await db.collection('circle_milestones').add({
              userId: userId,
              type: 'alerts_responded',
              value: responseCount,
              createdAt: admin.firestore.Timestamp.now(),
              celebrated: false,
            });

            milestonesCreated++;
            console.log(`Created ${responseCount} alerts responded milestone for ${userId}`);
          }
        }
      }

      console.log(`🎉 Milestone generation complete: ${milestonesCreated} milestones created`);

      return {
        success: true,
        milestonesCreated,
      };
    } catch (error) {
      console.error('Error generating milestones:', error);
      return { success: false, error: error.message };
    }
  });

module.exports = exports;
