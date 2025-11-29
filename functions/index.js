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
  const message = `🚨 <b>SAFETY ALERT</b> 🚨\n\n<b>${alertData.userName}</b> needs help!\n\n📍 Location: ${alertData.location}\n⏰ Started: ${alertData.startTime}\n\nThey haven't checked in safely. Please reach out!`;
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
exports.onCheckInCountUpdate = onCheckInCountUpdate;

exports.sendCheckInReminders = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    return await sendCheckInRemindersLogic();
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