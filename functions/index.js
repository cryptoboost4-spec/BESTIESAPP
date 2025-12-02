const admin = require('firebase-admin');
const functions = require('firebase-functions');
const axios = require('axios');

// Initialize Firebase Admin SDK
admin.initializeApp();

// ========================================
// CHECK-IN FUNCTIONS - Import logic
// ========================================
const checkExpiredCheckInsLogic = require('./core/checkins/checkExpiredCheckIns');
const checkCascadingAlertEscalationLogic = require('./core/checkins/checkCascadingAlertEscalation');
const { acknowledgeAlert } = require('./core/checkins/acknowledgeAlert');
const { extendCheckIn } = require('./core/checkins/extendCheckIn');
const { completeCheckIn } = require('./core/checkins/completeCheckIn');
const { onCheckInCreated } = require('./core/checkins/onCheckInCreated');
const { onCheckInCountUpdate } = require('./core/checkins/onCheckInCountUpdate');
const sendCheckInRemindersLogic = require('./core/checkins/sendCheckInReminders');
const { trackCheckInReaction } = require('./core/checkins/trackCheckInReaction');
const { trackCheckInComment } = require('./core/checkins/trackCheckInComment');

// ========================================
// BESTIE FUNCTIONS
// ========================================
const { sendBestieInvite } = require('./core/besties/sendBestieInvite');
const { acceptBestieRequest } = require('./core/besties/acceptBestieRequest');
const { declineBestieRequest } = require('./core/besties/declineBestieRequest');
const { onBestieCountUpdate } = require('./core/besties/onBestieCountUpdate');
const { onBestieCreated } = require('./core/besties/onBestieCreated');
const { onBestieDeleted } = require('./core/besties/onBestieDeleted');

// ========================================
// USER FUNCTIONS
// ========================================
const { onUserCreated } = require('./core/users/onUserCreated');
const { onUserRequestAttention } = require('./core/users/onUserRequestAttention');

// ========================================
// BADGE FUNCTIONS
// ========================================
const { onBadgeEarned } = require('./core/badges/onBadgeEarned');

// ========================================
// EMERGENCY FUNCTIONS
// ========================================
const { onDuressCodeUsed } = require('./core/emergency/onDuressCodeUsed');
const { triggerEmergencySOS } = require('./core/emergency/triggerEmergencySOS');

// ========================================
// ANALYTICS FUNCTIONS
// ========================================
const dailyAnalyticsAggregationLogic = require('./core/analytics/dailyAnalyticsAggregation');
const updateDailyStreaksLogic = require('./core/analytics/updateDailyStreaks');
const { rebuildAnalyticsCache } = require('./core/analytics/rebuildAnalyticsCache');
const generateMilestonesLogic = require('./core/analytics/generateMilestones');

// ========================================
// PAYMENT FUNCTIONS
// ========================================
const { createCheckoutSession } = require('./core/payments/createCheckoutSession');
const { createPortalSession } = require('./core/payments/createPortalSession');
const { stripeWebhook } = require('./core/payments/stripeWebhook');

// ========================================
// MONITORING FUNCTIONS
// ========================================
const { monitorCriticalErrors } = require('./core/monitoring/monitorCriticalErrors');

// ========================================
// SOCIAL FUNCTIONS
// ========================================
const { trackReaction } = require('./core/social/trackReaction');
const { trackPostComment } = require('./core/social/trackPostComment');
const { generateShareCard } = require('./core/social/generateShareCard');

// ========================================
// NOTIFICATION FUNCTIONS
// ========================================
const checkBirthdaysLogic = require('./core/notifications/checkBirthdays');

// ========================================
// MAINTENANCE FUNCTIONS
// ========================================
const cleanupOldDataLogic = require('./core/maintenance/cleanupOldData');
const { sendTestAlert } = require('./core/maintenance/sendTestAlert');
const { migratePhoneNumbers } = require('./core/maintenance/migratePhoneNumbers');
const { fixDoubleCountedStats } = require('./core/maintenance/fixDoubleCountedStats');
const { backfillBestieUserIds } = require('./core/maintenance/backfillBestieUserIds');

// ========================================
// FACEBOOK MESSENGER INTEGRATION
// ========================================

// Helper: Get Facebook Profile
async function getFacebookProfile(psid) {
  const response = await axios.get(
    `https://graph.facebook.com/v18.0/${psid}?fields=name,profile_pic&access_token=${functions.config().facebook?.page_token}`
  );
  return response.data;
}

// Helper: Send Messenger Message
async function sendMessengerMessage(psid, text) {
  await axios.post(
    `https://graph.facebook.com/v18.0/me/messages?access_token=${functions.config().facebook?.page_token}`,
    {
      recipient: { id: psid },
      message: { text: text }
    }
  );
}

// Helper: Send Messenger Message with Quick Replies
async function sendMessengerMessageWithQuickReplies(psid, text, quickReplies) {
  await axios.post(
    `https://graph.facebook.com/v18.0/me/messages?access_token=${functions.config().facebook?.page_token}`,
    {
      recipient: { id: psid },
      message: {
        text: text,
        quick_replies: quickReplies
      }
    }
  );
}

// Facebook Messenger Webhook
exports.messengerWebhook = functions.https.onRequest(async (req, res) => {
  // Verification
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const verifyToken = functions.config().facebook?.verify_token;
    
    if (!verifyToken) {
      functions.logger.error('Facebook verify_token not configured');
      return res.sendStatus(500);
    }
    
    if (mode === 'subscribe' && token === verifyToken) {
      return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
  }
  
  // Handle incoming messages
  if (req.method === 'POST') {
    const body = req.body;

    if (body.object === 'page') {
      for (const entry of body.entry) {
        const webhookEvent = entry.messaging[0];
        const senderPSID = webhookEvent.sender.id;

        // Handle messages with referral (new user clicking m.me link)
        const refParam = webhookEvent.referral?.ref || webhookEvent.postback?.referral?.ref;

        // Handle quick reply responses
        if (webhookEvent.message?.quick_reply) {
          const payload = webhookEvent.message.quick_reply.payload;

          try {
            if (payload === 'CONFIRM_YES') {
              await sendMessengerMessage(
                senderPSID,
                `Awesome! You're all set up to get notifications for the next 20 hours. If you have any questions, feel free to ask. 💜`
              );
            } else if (payload === 'CONFIRM_NO') {
              await sendMessengerMessage(
                senderPSID,
                `No worries! If you change your mind, just send us a message anytime. 👍`
              );
            }
          } catch (error) {
            functions.logger.error('Error handling quick reply:', error);
          }
        }
        // Handle new contact registration via m.me link
        else if (refParam) {
          const userId = refParam;

          try {
            // Get sender's FB profile
            const profile = await getFacebookProfile(senderPSID);

            // Get user's data
            const userDoc = await admin.firestore().collection('users').doc(userId).get();
            const userName = userDoc.exists ? (userDoc.data().displayName || 'Your friend') : 'Your friend';

            // Create/update messenger contact
            const contactsRef = admin.firestore().collection('messengerContacts');
            const existingQuery = await contactsRef
              .where('userId', '==', userId)
              .where('messengerPSID', '==', senderPSID)
              .get();

            const now = admin.firestore.Timestamp.now();
            const expiresAt = admin.firestore.Timestamp.fromMillis(
              Date.now() + (20 * 60 * 60 * 1000)
            );

            const contactData = {
              userId: userId,
              messengerPSID: senderPSID,
              name: profile.name,
              photoURL: profile.profile_pic,
              connectedAt: now,
              expiresAt: expiresAt
            };

            if (existingQuery.empty) {
              await contactsRef.add(contactData);
            } else {
              await contactsRef.doc(existingQuery.docs[0].id).update({
                connectedAt: now,
                expiresAt: expiresAt
              });
            }

            // Send first message: greeting
            await sendMessengerMessage(
              senderPSID,
              `Hi ${profile.name}! ${userName} said you'd reach out.`
            );

            // Wait a moment for natural conversation flow
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Send second message: confirmation with Yes/No options
            await sendMessengerMessageWithQuickReplies(
              senderPSID,
              `We'll keep an eye out for them while they're out. If something doesn't look right, we'll get in touch with you straight away. Sound good?`,
              [
                {
                  content_type: 'text',
                  title: '👍 Yes',
                  payload: 'CONFIRM_YES'
                },
                {
                  content_type: 'text',
                  title: '👎 No',
                  payload: 'CONFIRM_NO'
                }
              ]
            );
          } catch (error) {
            functions.logger.error('Error processing messenger message:', error);
          }
        }
      }
      return res.status(200).send('EVENT_RECEIVED');
    }
    return res.sendStatus(404);
  }
});

// sendMessengerAlert moved to utils/checkInNotifications.js to fix circular dependency

// ========================================
// TELEGRAM INTEGRATION
// ========================================

// Helper: Send Telegram Message
async function sendTelegramMessage(chatId, text, options = {}) {
  const botToken = functions.config().telegram?.bot_token;
  await axios.post(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      chat_id: chatId,
      text: text,
      parse_mode: options.parse_mode || 'HTML',
      ...options
    }
  );
}

// Send Telegram Alert
async function sendTelegramAlert(chatId, alertData) {
  let message = `🚨 <b>SAFETY ALERT</b> 🚨\n<b>${alertData.userName}</b> needs help!\n\n`;
  
  // Add time (no date)
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-AU', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  message += `⏰ Alert triggered: ${timeString}\n`;
  
  // Add location
  if (alertData.location && alertData.location !== 'No location set') {
    const locationText = typeof alertData.location === 'object' ? alertData.location.address : alertData.location;
    message += `📍 Location: ${locationText}\n`;
  }
  
  // Add notes
  if (alertData.notes) {
    message += `📝 Notes: "${alertData.notes}"\n`;
  }
  
  // Mention photos but DON'T send them
  if (alertData.photoURLs && alertData.photoURLs.length > 0) {
    message += `\n📷 ${alertData.userName} included ${alertData.photoURLs.length} photo(s) - view in the Besties app for important context.\n`;
  }
  
  message += `\nIf you can help, respond immediately or check the Besties app!`;
  
  // Send text-only message (no photos)
  await sendTelegramMessage(chatId, message);
}

// Telegram Webhook
exports.telegramWebhook = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.sendStatus(405);
    }

    const update = req.body;

    // Handle /start command
    if (update.message && update.message.text && update.message.text.startsWith('/start')) {
      const chatId = update.message.chat.id;
      const userId = update.message.text.split(' ')[1]; // /start userId
      const username = update.message.from.username || null;
      const firstName = update.message.from.first_name || 'there';

      if (!userId) {
        await sendTelegramMessage(
          chatId,
          '❌ Invalid link. Please use the link from your Besties app settings.'
        );
        return res.sendStatus(200);
      }

      try {
        // Get user's data
        const userDoc = await admin.firestore().collection('users').doc(userId).get();

        if (!userDoc.exists) {
          await sendTelegramMessage(
            chatId,
            '❌ User not found. Please make sure you\'re using the correct link from the app.'
          );
          return res.sendStatus(200);
        }

        const userData = userDoc.data();

        // Store Telegram chat ID on user document
        await admin.firestore().collection('users').doc(userId).update({
          telegramChatId: chatId.toString(),
          telegramUsername: username,
          telegramConnectedAt: admin.firestore.FieldValue.serverTimestamp(),
          'notificationPreferences.telegram': true
        });

        // Send confirmation message
        await sendTelegramMessage(
          chatId,
          `✅ <b>Connected!</b>\n\nHi ${firstName}! Your Telegram is now connected to Besties.\n\nYou'll receive safety alerts here when your besties need help. Stay safe! 💜`
        );

        functions.logger.info(`✅ Telegram connected for user ${userId} (chat: ${chatId})`);
      } catch (error) {
        functions.logger.error('Error connecting Telegram:', error);
        await sendTelegramMessage(
          chatId,
          '❌ Something went wrong. Please try again or contact support.'
        );
      }
    }
    // Handle /disconnect command
    else if (update.message && update.message.text === '/disconnect') {
      const chatId = update.message.chat.id;

      try {
        // Find user with this chat ID
        const usersSnapshot = await admin.firestore().collection('users')
          .where('telegramChatId', '==', chatId.toString())
          .get();

        if (usersSnapshot.empty) {
          await sendTelegramMessage(
            chatId,
            '❌ No connected account found.'
          );
          return res.sendStatus(200);
        }

        // Disconnect Telegram
        await admin.firestore().collection('users').doc(usersSnapshot.docs[0].id).update({
          telegramChatId: admin.firestore.FieldValue.delete(),
          telegramUsername: admin.firestore.FieldValue.delete(),
          telegramConnectedAt: admin.firestore.FieldValue.delete(),
          'notificationPreferences.telegram': false
        });

        await sendTelegramMessage(
          chatId,
          '✅ <b>Disconnected</b>\n\nYour Telegram has been disconnected from Besties. You won\'t receive alerts here anymore.'
        );

        functions.logger.info(`✅ Telegram disconnected for chat ${chatId}`);
      } catch (error) {
        functions.logger.error('Error disconnecting Telegram:', error);
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    functions.logger.error('Telegram webhook error:', error);
    return res.sendStatus(500);
  }
});

exports.sendTelegramAlert = sendTelegramAlert;

// ========================================
// EXPORTS - Scheduled functions need wrappers
// ========================================

// Check-ins (scheduled functions need pubsub wrapper)
exports.checkExpiredCheckIns = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    return await checkExpiredCheckInsLogic(functions.config());
  });

exports.checkCascadingAlertEscalation = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    return await checkCascadingAlertEscalationLogic();
  });

exports.acknowledgeAlert = acknowledgeAlert;
exports.extendCheckIn = extendCheckIn;
exports.completeCheckIn = completeCheckIn;
exports.onCheckInCreated = onCheckInCreated;

// Mark check-in as safe (for expired check-ins)
exports.markCheckInSafe = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  
  const { checkinId } = data;
  const userId = context.auth.uid;
  const db = admin.firestore();
  
  try {
    const checkinRef = db.collection('checkins').doc(checkinId);
    const checkinDoc = await checkinRef.get();
    
    if (!checkinDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Check-in not found');
    }
    
    const checkinData = checkinDoc.data();
    
    // Verify this user created the check-in
    if (checkinData.userId !== userId) {
      throw new functions.https.HttpsError('permission-denied', 'Not your check-in');
    }
    
    // Verify check-in is actually alerted
    if (checkinData.status !== 'alerted') {
      throw new functions.https.HttpsError('failed-precondition', 'Check-in is not in alerted state');
    }
    
    // Update to completed (marked safe after alert)
    await checkinRef.update({
      status: 'completed',
      markedSafeAt: admin.firestore.FieldValue.serverTimestamp(),
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdate: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Get user name
    const userDoc = await db.collection('users').doc(userId).get();
    const userName = userDoc.data()?.displayName || 'User';
    
    // Notify besties that user is safe
    const { sendPushNotification } = require('./utils/notifications');
    const { sendBulkNotifications } = require('./utils/messaging');
    const config = functions.config();
    
    // Send push notifications
    if (checkinData.bestieIds && checkinData.bestieIds.length > 0) {
      const bestieDocs = await db.getAll(...checkinData.bestieIds.map(id => db.collection('users').doc(id)));
      for (const bestieDoc of bestieDocs) {
        if (!bestieDoc.exists) continue;
        const bestieData = bestieDoc.data();
        if (bestieData?.fcmToken && bestieData?.notificationsEnabled) {
          try {
            await sendPushNotification(
              bestieData.fcmToken,
              '✅ All Clear',
              `${userName} marked themselves as safe!`,
              {
                type: 'marked_safe',
                checkinId: checkinId,
                userId: userId,
                timestamp: Date.now().toString()
              }
            );
          } catch (pushError) {
            functions.logger.error(`Failed to send push notification to bestie ${bestieDoc.id}:`, pushError);
          }
        }
      }
      
      // Send other notifications (Telegram, SMS, etc.)
      const safeMessage = `✅ ${userName} marked themselves as safe! All clear.`;
      await sendBulkNotifications(
        checkinData.bestieIds,
        safeMessage,
        config,
        {
          type: 'marked_safe',
          checkinId: checkinId,
          userId: userId,
          userName: userName
        }
      );
    }
    
    functions.logger.info('Check-in marked safe', { checkinId, userId });
    
    return { success: true };
  } catch (error) {
    functions.logger.error('Error marking check-in safe:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to mark safe');
  }
});

// Mark alert as viewed by bestie
exports.markAlertViewed = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  
  const { checkinId } = data;
  const userId = context.auth.uid;
  const db = admin.firestore();
  
  try {
    const checkinRef = db.collection('checkins').doc(checkinId);
    const checkinDoc = await checkinRef.get();
    
    if (!checkinDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Check-in not found');
    }
    
    const checkinData = checkinDoc.data();
    
    // Verify user is a bestie for this check-in
    if (!checkinData.bestieIds || !checkinData.bestieIds.includes(userId)) {
      throw new functions.https.HttpsError('permission-denied', 'Not a selected bestie');
    }
    
    // Add user to viewedBy array if not already there
    await checkinRef.update({
      viewedBy: admin.firestore.FieldValue.arrayUnion(userId),
      lastUpdate: admin.firestore.FieldValue.serverTimestamp()
    });
    
    functions.logger.info('Alert marked as viewed', { checkinId, userId });
    
    return { success: true };
  } catch (error) {
    functions.logger.error('Error marking alert viewed:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to mark viewed');
  }
});
exports.onCheckInCountUpdate = onCheckInCountUpdate;

exports.sendCheckInReminders = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    return await sendCheckInRemindersLogic(functions.config());
  });

// Send scheduled SMS (5-minute delay for alerts)
exports.sendScheduledSMS = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();
    
    // Query pending SMS that are due
    const dueSnapshot = await db.collection('scheduledSMS')
      .where('status', '==', 'pending')
      .where('scheduledFor', '<=', now)
      .limit(50)
      .get();
    
    if (dueSnapshot.empty) {
      return null;
    }
    
    const { sendSMSAlert } = require('./utils/notifications');
    
    for (const doc of dueSnapshot.docs) {
      const smsData = doc.data();
      const { checkinId, bestieIds } = smsData;
      
      try {
        // Get check-in current state
        const checkinDoc = await db.collection('checkins').doc(checkinId).get();
        
        if (!checkinDoc.exists) {
          // Check-in deleted, mark SMS as cancelled
          await doc.ref.update({ status: 'cancelled' });
          continue;
        }
        
        const checkinData = checkinDoc.data();
        
        // Check if alert is still active
        if (checkinData.status !== 'alerted') {
          // User marked safe or completed, cancel SMS
          await doc.ref.update({ status: 'cancelled' });
          functions.logger.info('SMS cancelled - check-in no longer alerted', { checkinId });
          continue;
        }
        
        // Check if any bestie has viewed the alert
        const viewedBy = checkinData.viewedBy || [];
        if (viewedBy.length > 0) {
          // At least one bestie viewed it, cancel SMS
          await doc.ref.update({ status: 'cancelled' });
          functions.logger.info('SMS cancelled - alert viewed by besties', { 
            checkinId, 
            viewedCount: viewedBy.length 
          });
          continue;
        }
        
        // Get user data for message
        const userDoc = await db.collection('users').doc(checkinData.userId).get();
        const userData = userDoc.data();
        const userName = userData?.displayName || 'User';
        const location = checkinData.location?.address || checkinData.location || 'Unknown';
        const notes = checkinData.notes || '';
        
        const timeString = new Date().toLocaleTimeString('en-AU', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
        
        // Construct SMS message (keep under 160 chars)
        let smsMessage = `🚨 ${userName} needs help! ${timeString}`;
        
        if (location && location !== 'No location set') {
          const shortLocation = location.substring(0, 30); // Truncate if too long
          smsMessage += ` @ ${shortLocation}`;
        }
        
        if (notes) {
          const shortNotes = notes.substring(0, 40); // Truncate if too long
          smsMessage += `. "${shortNotes}"`;
        }
        
        smsMessage += `. Check Besties app now!`;
        
        // Send to each bestie with SMS enabled
        let smsSent = 0;
        for (const bestieId of bestieIds) {
          const bestieDoc = await db.collection('users').doc(bestieId).get();
          if (!bestieDoc.exists) continue;
          
          const bestieData = bestieDoc.data();
          
          // Check if bestie has SMS enabled and phone number
          if (bestieData?.phoneNumber && 
              bestieData?.notificationPreferences?.sms && 
              bestieData?.smsSubscription?.active) {
            
            try {
              await sendSMSAlert(bestieData.phoneNumber, smsMessage);
              smsSent++;
              functions.logger.info('SMS sent', { 
                checkinId, 
                bestieId,
                phone: bestieData.phoneNumber 
              });
            } catch (error) {
              functions.logger.error('Failed to send SMS', {
                checkinId,
                bestieId,
                error: error.message
              });
            }
          }
        }
        
        // Mark as sent
        await doc.ref.update({ 
          status: 'sent',
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          recipientCount: smsSent
        });
        
        functions.logger.info('Scheduled SMS completed', { 
          checkinId, 
          smsSent 
        });
        
      } catch (error) {
        functions.logger.error('Error processing scheduled SMS', {
          checkinId,
          error: error.message
        });
        
        // Mark as failed
        await doc.ref.update({ 
          status: 'failed',
          error: error.message 
        });
      }
    }
    
    return null;
  });

exports.trackCheckInReaction = trackCheckInReaction;
exports.trackCheckInComment = trackCheckInComment;

// Besties
exports.sendBestieInvite = sendBestieInvite;
exports.acceptBestieRequest = acceptBestieRequest;
exports.declineBestieRequest = declineBestieRequest;
exports.onBestieCountUpdate = onBestieCountUpdate;
exports.onBestieCreated = onBestieCreated;
exports.onBestieDeleted = onBestieDeleted;

// Users
exports.onUserCreated = onUserCreated;
exports.onUserRequestAttention = onUserRequestAttention;

// Badges
exports.onBadgeEarned = onBadgeEarned;

// Emergency
exports.onDuressCodeUsed = onDuressCodeUsed;
exports.triggerEmergencySOS = triggerEmergencySOS;

// Analytics (scheduled functions need pubsub wrapper)
exports.dailyAnalyticsAggregation = functions.pubsub
  .schedule('every day 00:00')
  .timeZone('Australia/Brisbane')
  .onRun(async (context) => {
    return await dailyAnalyticsAggregationLogic();
  });

exports.updateDailyStreaks = functions.pubsub
  .schedule('every day 00:00')
  .timeZone('Australia/Brisbane')
  .onRun(async (context) => {
    return await updateDailyStreaksLogic();
  });

exports.rebuildAnalyticsCache = rebuildAnalyticsCache;

exports.generateMilestones = functions.pubsub
  .schedule('every day 02:00')
  .timeZone('Australia/Brisbane')
  .onRun(async (context) => {
    return await generateMilestonesLogic();
  });

// Payments
exports.createCheckoutSession = createCheckoutSession;
exports.createPortalSession = createPortalSession;
exports.stripeWebhook = stripeWebhook;

// Monitoring
exports.monitorCriticalErrors = monitorCriticalErrors;

// Social
const { onPostCreated } = require('./core/social/onPostCreated');
exports.trackReaction = trackReaction;
exports.trackPostComment = trackPostComment;
exports.generateShareCard = generateShareCard;
exports.onPostCreated = onPostCreated;

// Notifications (scheduled)
exports.checkBirthdays = functions.pubsub
  .schedule('every day 09:00')
  .timeZone('Australia/Brisbane')
  .onRun(async (context) => {
    return await checkBirthdaysLogic();
  });

// Maintenance (scheduled)
exports.cleanupOldData = functions.pubsub
  .schedule('every day 03:00')
  .timeZone('Australia/Brisbane')
  .onRun(async (context) => {
    return await cleanupOldDataLogic();
  });

exports.sendTestAlert = sendTestAlert;
exports.migratePhoneNumbers = migratePhoneNumbers;
exports.fixDoubleCountedStats = fixDoubleCountedStats;
exports.backfillBestieUserIds = backfillBestieUserIds;

// Migrations
const { denormalizeBestieUserIds } = require('./migrations/denormalizeBestieUserIds');
exports.denormalizeBestieUserIds = denormalizeBestieUserIds;