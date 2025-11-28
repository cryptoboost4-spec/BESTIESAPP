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
    `https://graph.facebook.com/v18.0/${psid}?fields=name,profile_pic&access_token=${functions.config().facebook.page_token}`
  );
  return response.data;
}

// Helper: Send Messenger Message
async function sendMessengerMessage(psid, text) {
  await axios.post(
    `https://graph.facebook.com/v18.0/me/messages?access_token=${functions.config().facebook.page_token}`,
    {
      recipient: { id: psid },
      message: { text: text }
    }
  );
}

// Helper: Send Messenger Message with Quick Replies
async function sendMessengerMessageWithQuickReplies(psid, text, quickReplies) {
  await axios.post(
    `https://graph.facebook.com/v18.0/me/messages?access_token=${functions.config().facebook.page_token}`,
    {
      recipient: { id: psid },
      message: {
        text: text,
        quick_replies: quickReplies
      }
    }
  );
}

// Helper: Send Messenger Message with Buttons
async function sendMessengerMessageWithButtons(psid, text, buttons) {
  await axios.post(
    `https://graph.facebook.com/v18.0/me/messages?access_token=${functions.config().facebook.page_token}`,
    {
      recipient: { id: psid },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            text: text,
            buttons: buttons
          }
        }
      }
    }
  );
}

// Helper: Extract first name from full name
function getFirstName(fullName) {
  if (!fullName) return 'there';
  return fullName.split(' ')[0];
}

// Send Messenger Alert
async function sendMessengerAlert(psid, alertData) {
  const message = `🚨 SAFETY ALERT 🚨\n\n${alertData.userName} needs help!\n\n📍 Location: ${alertData.location}\n⏰ Started: ${alertData.startTime}\n\nThey haven't checked in safely. Please reach out!`;
  await sendMessengerMessage(psid, message);
}

// Facebook Messenger Webhook
exports.messengerWebhook = functions.https.onRequest(async (req, res) => {
  // Verification
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    if (mode === 'subscribe' && token === 'besties_verify_abc123') {
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
              // Send confirmation message
              await sendMessengerMessage(
                senderPSID,
                `Awesome! You're all set up to get notifications for the next 20 hours. 💜`
              );

              // Wait 1 second then send follow page prompt with button
              await new Promise(resolve => setTimeout(resolve, 1000));

              await sendMessengerMessageWithButtons(
                senderPSID,
                `Make sure you like our page to get notifications!`,
                [
                  {
                    type: 'web_url',
                    url: 'https://www.facebook.com/besties.safety',
                    title: '👍 Like Our Page'
                  }
                ]
              );

              // Wait 2 seconds then send FAQ options
              await new Promise(resolve => setTimeout(resolve, 2000));

              await sendMessengerMessageWithQuickReplies(
                senderPSID,
                `Have any questions?`,
                [
                  {
                    content_type: 'text',
                    title: '❓ How does this work?',
                    payload: 'FAQ_HOW'
                  },
                  {
                    content_type: 'text',
                    title: '⏰ What happens after 20h?',
                    payload: 'FAQ_EXPIRY'
                  },
                  {
                    content_type: 'text',
                    title: '🔔 Change notifications',
                    payload: 'FAQ_NOTIFICATIONS'
                  },
                  {
                    content_type: 'text',
                    title: '📧 Other question',
                    payload: 'FAQ_OTHER'
                  }
                ]
              );
            } else if (payload === 'CONFIRM_NO') {
              await sendMessengerMessage(
                senderPSID,
                `No worries! If you change your mind, just send us a message anytime. 👍`
              );
            } else if (payload === 'FAQ_HOW') {
              await sendMessengerMessage(
                senderPSID,
                `You're connected as a safety contact! When your friend creates a check-in, they can select you to be notified. If they don't check in safely within their time window, you'll get an emergency alert with their location. 🚨`
              );
            } else if (payload === 'FAQ_EXPIRY') {
              await sendMessengerMessage(
                senderPSID,
                `After 20 hours, your connection expires for privacy. To reconnect, just click the link again or send any message! You'll get a fresh 20-hour window. ⏰`
              );
            } else if (payload === 'FAQ_NOTIFICATIONS') {
              await sendMessengerMessage(
                senderPSID,
                `To only receive emergency alerts (not regular check-in updates), reply with the text: ONLY EMERGENCY\n\nYou'll only get urgent safety alerts when your friend needs help. 🔔`
              );
            } else if (payload === 'FAQ_OTHER') {
              await sendMessengerMessage(
                senderPSID,
                `For other questions, please email us at:\n📧 bestiesapp.xyz@gmail.com\n\nWe'll get back to you as soon as possible!`
              );
            }
          } catch (error) {
            console.error('Error handling quick reply:', error);
          }
        }
        // Handle text messages (including ONLY EMERGENCY preference)
        else if (webhookEvent.message?.text) {
          const messageText = webhookEvent.message.text.trim().toUpperCase();

          try {
            // Handle "ONLY EMERGENCY" preference
            if (messageText === 'ONLY EMERGENCY') {
              // Update contact preference in Firestore
              const contactsRef = admin.firestore().collection('messengerContacts');
              const contactQuery = await contactsRef
                .where('messengerPSID', '==', senderPSID)
                .get();

              if (!contactQuery.empty) {
                const contactDoc = contactQuery.docs[0];
                await contactsRef.doc(contactDoc.id).update({
                  notificationPreference: 'emergency_only'
                });

                await sendMessengerMessage(
                  senderPSID,
                  `✅ Notification preference updated!\n\nYou'll now only receive emergency alerts when your friend needs help. You won't get regular check-in notifications.\n\nTo receive all updates again, reply: ALL NOTIFICATIONS`
                );
              } else {
                await sendMessengerMessage(
                  senderPSID,
                  `It looks like you're not connected as a safety contact yet. Please click the link your friend sent you first!`
                );
              }
            }
            // Handle "ALL NOTIFICATIONS" to switch back
            else if (messageText === 'ALL NOTIFICATIONS') {
              const contactsRef = admin.firestore().collection('messengerContacts');
              const contactQuery = await contactsRef
                .where('messengerPSID', '==', senderPSID)
                .get();

              if (!contactQuery.empty) {
                const contactDoc = contactQuery.docs[0];
                await contactsRef.doc(contactDoc.id).update({
                  notificationPreference: 'all'
                });

                await sendMessengerMessage(
                  senderPSID,
                  `✅ Notification preference updated!\n\nYou'll now receive all check-in updates and emergency alerts. To switch back to emergency-only, reply: ONLY EMERGENCY`
                );
              }
            }
            // Auto-reply for other messages
            else if (!refParam) {
              await sendMessengerMessageWithQuickReplies(
                senderPSID,
                `Thanks for reaching out! This is an automated safety bot. 💜\n\nHow can I help you?`,
                [
                  {
                    content_type: 'text',
                    title: '❓ How does this work?',
                    payload: 'FAQ_HOW'
                  },
                  {
                    content_type: 'text',
                    title: '🔔 Change notifications',
                    payload: 'FAQ_NOTIFICATIONS'
                  },
                  {
                    content_type: 'text',
                    title: '📧 Contact support',
                    payload: 'FAQ_OTHER'
                  }
                ]
              );
            }
          } catch (error) {
            console.error('Error handling text message:', error);
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
              expiresAt: expiresAt,
              notificationPreference: 'all' // Default to all notifications
            };

            if (existingQuery.empty) {
              await contactsRef.add(contactData);
            } else {
              await contactsRef.doc(existingQuery.docs[0].id).update({
                connectedAt: now,
                expiresAt: expiresAt,
                notificationPreference: 'all' // Reset to all when reconnecting
              });
            }

            // Get first name only
            const firstName = getFirstName(profile.name);

            // Send first message: greeting with first name only
            await sendMessengerMessage(
              senderPSID,
              `Hi ${firstName}! ${userName} told us we should be expecting a message from you.`
            );

            // Wait 5 seconds for natural conversation flow
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Send second message: confirmation with Yes/No options
            await sendMessengerMessageWithQuickReplies(
              senderPSID,
              `We'll keep an eye out for them while they're out. If something doesn't look right, we'll get in touch with you straight away.\n\n💡 Tip: Reply "ONLY EMERGENCY" anytime to only get urgent alerts.\n\nSound good?`,
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
            console.error('Error processing messenger message:', error);
          }
        }
      }
      return res.status(200).send('EVENT_RECEIVED');
    }
    return res.sendStatus(404);
  }
});

exports.sendMessengerAlert = sendMessengerAlert;

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
exports.trackReaction = trackReaction;
exports.trackPostComment = trackPostComment;
exports.generateShareCard = generateShareCard;

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
