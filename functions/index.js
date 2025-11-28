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
        const refParam = webhookEvent.referral?.ref || webhookEvent.postback?.referral?.ref;
        
        if (refParam) {
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
            
            // Send personalized confirmation
            await sendMessengerMessage(
              senderPSID, 
              `Hey ${profile.name}! ${userName} told us you'd reach out. You're now connected as their safety contact for the next 20 hours. 💜\n\nYou'll get alerts if they need help!`
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
