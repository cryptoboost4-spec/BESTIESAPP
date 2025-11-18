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

// Send alerts to besties
async function sendAlertToBesties(checkInId, checkIn) {
  const userDoc = await db.collection('users').doc(checkIn.userId).get();
  const userData = userDoc.data();
  
  const alertMessage = `🚨 SAFETY ALERT: ${userData.displayName} hasn't checked in from ${checkIn.location}. They were expected back ${Math.round((Date.now() - checkIn.alertTime.toMillis()) / 60000)} minutes ago. Please check on them!`;
  
  const bestiePromises = checkIn.bestieIds.map(async (bestieId) => {
    const bestieDoc = await db.collection('users').doc(bestieId).get();
    
    if (!bestieDoc.exists) return;
    
    const bestieData = bestieDoc.data();
    
    try {
      // Try WhatsApp first
      if (bestieData.notifications?.whatsapp && bestieData.phoneNumber) {
        try {
          await sendWhatsAppAlert(bestieData.phoneNumber, alertMessage);
        } catch (whatsappError) {
          console.log('WhatsApp failed, trying SMS...');
          // Fallback to SMS
          if (bestieData.smsSubscription?.active) {
            await sendSMSAlert(bestieData.phoneNumber, alertMessage);
          }
        }
      } else if (bestieData.smsSubscription?.active && bestieData.phoneNumber) {
        await sendSMSAlert(bestieData.phoneNumber, alertMessage);
      }
      
      // Always send email as backup
      if (bestieData.email) {
        await sendEmailAlert(bestieData.email, alertMessage, checkIn);
      }
      
      await db.collection('notifications').add({
        userId: bestieId,
        type: 'safety_alert',
        checkInId,
        message: alertMessage,
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
// BADGE FUNCTIONS
// ========================================

exports.onCheckInCountUpdate = functions.firestore
  .document('checkins/{checkInId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();

    // Only award badges when status changes to 'completed'
    if (newData.status === 'completed' && oldData.status !== 'completed') {
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
  });

exports.onBestieCountUpdate = functions.firestore
  .document('besties/{bestieId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    
    if (newData.status === 'accepted' && oldData.status !== 'accepted') {
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
  
  const alertMessage = isReversePIN
    ? `🚨 SILENT EMERGENCY: ${userData.displayName} triggered reverse PIN. Location: ${location || 'Unknown'}. Covert distress signal.`
    : `🆘 EMERGENCY: ${userData.displayName} triggered SOS! Location: ${location || 'Unknown'}. Help immediately!`;
  
  const notifications = bestieIds.map(async (bestieId) => {
    const bestieDoc = await db.collection('users').doc(bestieId).get();
    if (!bestieDoc.exists) return;
    
    const bestieData = bestieDoc.data();
    
    try {
      if (bestieData.phoneNumber) {
        await sendSMSAlert(bestieData.phoneNumber, alertMessage);
        await sendWhatsAppAlert(bestieData.phoneNumber, alertMessage);
      }
      if (bestieData.email) {
        await sendEmailAlert(bestieData.email, alertMessage, {
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
  
  if (statType === 'checkInCompleted') {
    updates['stats.totalCheckIns'] = admin.firestore.FieldValue.increment(1);
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

module.exports = exports;
