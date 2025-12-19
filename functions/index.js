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
// MESSAGE FUNCTIONS
// ========================================
const { onMessageCreated } = require('./core/messages/onMessageCreated');

// ========================================
// CIRCLE CHECK-IN FUNCTIONS
// ========================================
const { onCircleCheckInCreated } = require('./core/circleCheckin/onCircleCheckInCreated');

// ========================================
// CHALLENGE FUNCTIONS
// ========================================
const { onChallengeCompleted } = require('./core/challenges/onChallengeCompleted');

// ========================================
// SAFETY PACT FUNCTIONS
// ========================================
const { onPactActivated } = require('./core/pact/onPactActivated');

// ========================================
// CHALLENGE TRACKING FUNCTIONS (NEW)
// ========================================
const challengeTracking = require('./challengeTracking');

// ========================================
// SCHEDULED FUNCTIONS
// ========================================
const updateConnectionScoresLogic = require('./scheduled/updateConnectionScores');
const expireChallengesLogic = require('./scheduled/expireChallenges');

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

// Facebook Graph API version - v24.0 is the latest version (December 2024)
const FB_API_VERSION = 'v24.0';

// Helper: Get Facebook Profile with detailed error logging
async function getFacebookProfile(psid) {
  const pageToken = functions.config().facebook?.page_token;

  if (!pageToken) {
    functions.logger.error('❌ FACEBOOK PAGE TOKEN NOT CONFIGURED - check firebase functions:config:get');
    return null;
  }

  // Try first_name,last_name,profile_pic FIRST (preferred format per Facebook User Profile API docs)
  // All fields require Business Asset User Profile Access feature
  let apiUrl = `https://graph.facebook.com/${FB_API_VERSION}/${psid}?fields=first_name,last_name,profile_pic&access_token=${pageToken}`;

  functions.logger.info(`📡 Fetching Facebook profile for PSID: ${psid}`, {
    psid,
    apiVersion: FB_API_VERSION,
    url: apiUrl.replace(pageToken, '***TOKEN***'),
    fields: 'first_name,last_name,profile_pic',
    note: 'Using first_name,last_name,profile_pic (preferred format per Facebook docs)'
  });

  try {
    const response = await axios.get(apiUrl);

    if (response.data && (response.data.first_name || response.data.last_name)) {
      // Combine first_name and last_name into full name
      const fullName = [response.data.first_name, response.data.last_name].filter(Boolean).join(' ') || 'Friend';
      const profileData = {
        name: fullName,
        profile_pic: response.data.profile_pic || null
      };

      functions.logger.info(`✅ Profile fetch SUCCESS for PSID ${psid}`, {
        psid,
        name: profileData.name,
        hasProfilePic: !!profileData.profile_pic
      });
      return profileData;
    } else {
      // Fallback 1: Try name,picture (alternative format)
      functions.logger.info(`🔄 Trying fallback 1: name,picture for PSID ${psid}`);
      const fallback1Url = `https://graph.facebook.com/${FB_API_VERSION}/${psid}?fields=name,picture&access_token=${pageToken}`;
      const fallback1Response = await axios.get(fallback1Url);

      if (fallback1Response.data && fallback1Response.data.name) {
        // Business Asset User Profile Access returns 'name' and 'picture'
        // 'picture' is an object with 'data.url', need to extract the URL
        const profileData = {
          name: fallback1Response.data.name,
          profile_pic: fallback1Response.data.picture?.data?.url || fallback1Response.data.picture || null
        };
        functions.logger.info(`✅ Profile fetch SUCCESS (fallback 1 - name,picture) for PSID ${psid}`, {
          psid,
          name: profileData.name,
          hasProfilePic: !!profileData.profile_pic
        });
        return profileData;
      } else {
        // Fallback 2: Try just 'name' and 'profile_pic' (alternative format)
        functions.logger.info(`🔄 Trying fallback 2: name,profile_pic for PSID ${psid}`);
        const fallback2Url = `https://graph.facebook.com/${FB_API_VERSION}/${psid}?fields=name,profile_pic&access_token=${pageToken}`;
        const fallback2Response = await axios.get(fallback2Url);

        if (fallback2Response.data && fallback2Response.data.name) {
          functions.logger.info(`✅ Profile fetch SUCCESS (fallback 2) for PSID ${psid}`, {
            psid,
            name: fallback2Response.data.name
          });
          return fallback2Response.data;
        } else {
          functions.logger.warn(`⚠️ Profile fetch returned empty data for PSID ${psid}`, {
            psid,
            firstLastResponse: response.data,
            namePictureResponse: fallback1Response.data,
            nameProfilePicResponse: fallback2Response.data
          });
          return null;
        }
      }
    }
  } catch (error) {
    // Detailed error logging for diagnosis
    const errorDetails = {
      psid,
      apiVersion: FB_API_VERSION,
      httpStatus: error.response?.status,
      httpStatusText: error.response?.statusText,
      fbErrorCode: error.response?.data?.error?.code,
      fbErrorSubcode: error.response?.data?.error?.error_subcode,
      fbErrorType: error.response?.data?.error?.type,
      fbErrorMessage: error.response?.data?.error?.message,
      fbTraceId: error.response?.data?.error?.fbtrace_id
    };

    // Specific error messages based on error code
    if (error.response?.data?.error?.code === 100) {
      if (error.response?.data?.error?.error_subcode === 33) {
        functions.logger.error(`❌ PERMISSION ERROR (100/33) for PSID ${psid} - This usually means:
          1. App needs Advanced Access for Business Asset User Profile Access (Standard Access only works for testers) OR
          2. User hasn't opted in (hasn't sent a message/replied) OR
          3. User has restricted profile access
          Solution: Request Advanced Access for Business Asset User Profile Access in App Review`, errorDetails);
      } else {
        functions.logger.error(`❌ API ERROR (code 100) for PSID ${psid}`, errorDetails);
      }
    } else if (error.response?.data?.error?.code === 3) {
      functions.logger.error(`❌ CAPABILITY ERROR (3) for PSID ${psid} - Application does not have the capability to make this API call.
          This means: App needs Advanced Access for Business Asset User Profile Access.
          Standard Access only works for developers/testers. Request Advanced Access in App Review.`, errorDetails);
    } else if (error.response?.data?.error?.code === 190) {
      functions.logger.error(`❌ TOKEN ERROR (190) for PSID ${psid} - Token is invalid or expired. Regenerate page token.`, errorDetails);
    } else if (error.response?.data?.error?.code === 10) {
      functions.logger.error(`❌ PERMISSION DENIED (10) for PSID ${psid} - App doesn't have required permissions`, errorDetails);
    } else if (error.response?.data?.error?.code === 2018218) {
      functions.logger.warn(`⚠️ PROFILE UNAVAILABLE (2018218) for PSID ${psid} - No profile available for this user (phone-number-only account)`, errorDetails);
    } else {
      functions.logger.error(`❌ UNKNOWN ERROR fetching profile for PSID ${psid}`, {
        ...errorDetails,
        fullError: error.response?.data?.error || error.message
      });
    }

    return null;
  }
}

// Helper: Send Messenger Message with error handling
async function sendMessengerMessage(psid, text) {
  const pageToken = functions.config().facebook?.page_token;

  if (!pageToken) {
    functions.logger.error('❌ Cannot send message - page token not configured');
    throw new Error('Facebook page token not configured');
  }

  try {
    await axios.post(
      `https://graph.facebook.com/${FB_API_VERSION}/me/messages?access_token=${pageToken}`,
      {
        recipient: { id: psid },
        message: { text: text }
      }
    );
    functions.logger.info(`✅ Message sent to PSID ${psid}`, { psid, textLength: text.length });
  } catch (error) {
    functions.logger.error(`❌ Failed to send message to PSID ${psid}`, {
      psid,
      httpStatus: error.response?.status,
      fbErrorCode: error.response?.data?.error?.code,
      fbErrorMessage: error.response?.data?.error?.message
    });
    throw error;
  }
}

// Helper: Send Messenger Message with Quick Replies
async function sendMessengerMessageWithQuickReplies(psid, text, quickReplies) {
  const pageToken = functions.config().facebook?.page_token;

  if (!pageToken) {
    functions.logger.error('❌ Cannot send message - page token not configured');
    throw new Error('Facebook page token not configured');
  }

  try {
    await axios.post(
      `https://graph.facebook.com/${FB_API_VERSION}/me/messages?access_token=${pageToken}`,
      {
        recipient: { id: psid },
        message: {
          text: text,
          quick_replies: quickReplies
        }
      }
    );
    functions.logger.info(`✅ Quick reply message sent to PSID ${psid}`, { psid });
  } catch (error) {
    functions.logger.error(`❌ Failed to send quick reply message to PSID ${psid}`, {
      psid,
      httpStatus: error.response?.status,
      fbErrorCode: error.response?.data?.error?.code,
      fbErrorMessage: error.response?.data?.error?.message
    });
    throw error;
  }
}

// Facebook Messenger Webhook
exports.messengerWebhook = functions.https.onRequest(async (req, res) => {
  // Verification (GET request from Facebook)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const verifyToken = functions.config().facebook?.verify_token;

    functions.logger.info('🔐 Webhook verification request received', {
      mode,
      tokenReceived: !!token,
      tokenConfigured: !!verifyToken,
      challenge: challenge?.substring(0, 10) + '...'
    });

    if (!verifyToken) {
      functions.logger.error('❌ Facebook verify_token not configured in Firebase');
      return res.sendStatus(500);
    }

    if (mode === 'subscribe' && token === verifyToken) {
      functions.logger.info('✅ Webhook verification SUCCESS');
      return res.status(200).send(challenge);
    }

    functions.logger.warn('❌ Webhook verification FAILED - token mismatch');
    return res.sendStatus(403);
  }

  // Handle incoming webhook events (POST request)
  if (req.method === 'POST') {
    const body = req.body;

    functions.logger.info('📩 Webhook POST received', {
      object: body.object,
      entryCount: body.entry?.length
    });

    if (body.object === 'page') {
      for (const entry of body.entry) {
        // Safety check for messaging array
        if (!entry.messaging || entry.messaging.length === 0) {
          functions.logger.warn('⚠️ Entry has no messaging array', { entry });
          continue;
        }

        const webhookEvent = entry.messaging[0];
        const senderPSID = webhookEvent.sender.id;

        // Determine event type for logging
        const eventType = webhookEvent.message?.quick_reply ? 'quick_reply' :
          webhookEvent.referral ? 'referral' :
            webhookEvent.postback?.referral ? 'postback_referral' :
              webhookEvent.message ? 'message' : 'unknown';

        functions.logger.info(`📨 Processing ${eventType} event`, {
          senderPSID,
          eventType,
          hasReferral: !!(webhookEvent.referral?.ref || webhookEvent.postback?.referral?.ref)
        });

        // Handle messages with referral (new user clicking m.me link)
        const refParam = webhookEvent.referral?.ref || webhookEvent.postback?.referral?.ref;

        // Handle quick reply responses
        if (webhookEvent.message?.quick_reply) {
          const payload = webhookEvent.message.quick_reply.payload;
          functions.logger.info(`🔘 Quick reply received: ${payload}`, { senderPSID, payload });

          try {
            if (payload === 'CONFIRM_YES') {
              // User confirmed - NOW fetch their profile (better permission context)
              functions.logger.info(`✅ User confirmed! Fetching profile now...`, { senderPSID });

              // Find the contact that's awaiting confirmation
              const contactsRef = admin.firestore().collection('messengerContacts');
              const pendingContactQuery = await contactsRef
                .where('messengerPSID', '==', senderPSID)
                .where('awaitingConfirmation', '==', true)
                .limit(1)
                .get();

              if (!pendingContactQuery.empty) {
                const contactDoc = pendingContactQuery.docs[0];
                const contactData = contactDoc.data();
                const userId = contactData.userId;

                // NOW fetch profile (should work with approved permissions)
                const profile = await getFacebookProfile(senderPSID);

                if (profile && profile.name) {
                  // SUCCESS: Got profile data
                  const contactName = profile.name;
                  const contactPhotoURL = profile.profile_pic || null;

                  // Get user's data for personalized message
                  const userDoc = await admin.firestore().collection('users').doc(userId).get();
                  const userName = userDoc.exists ? (userDoc.data().displayName || 'Your friend') : 'Your friend';

                  // Update contact with real profile data
                  await contactDoc.ref.update({
                    name: contactName,
                    photoURL: contactPhotoURL,
                    awaitingConfirmation: false,
                    pendingProfile: false
                  });

                  functions.logger.info(`✅ Profile fetched on confirmation!`, {
                    docId: contactDoc.id,
                    userId,
                    senderPSID,
                    name: contactName,
                    hasPhoto: !!contactPhotoURL
                  });

                  // Send personalized confirmation
                  await sendMessengerMessage(
                    senderPSID,
                    `Awesome ${contactName}! You're all set up to get notifications for the next 20 hours. If you have any questions, feel free to ask. 💜`
                  );
                } else {
                  // Profile fetch still failed - use fallback
                  functions.logger.warn(`⚠️ Profile fetch failed even on confirmation, using fallback name`, {
                    userId,
                    senderPSID,
                    docId: contactDoc.id
                  });

                  // Update with generic name so contact still shows
                  await contactDoc.ref.update({
                    name: 'Emergency Contact',
                    awaitingConfirmation: false,
                    pendingProfile: false
                  });

                  await sendMessengerMessage(
                    senderPSID,
                    `Awesome! You're all set up to get notifications for the next 20 hours. If you have any questions, feel free to ask. 💜`
                  );
                }
              } else {
                // No pending contact found - just send confirmation
                functions.logger.warn(`⚠️ CONFIRM_YES received but no pending contact found`, { senderPSID });
                await sendMessengerMessage(
                  senderPSID,
                  `Awesome! You're all set up to get notifications for the next 20 hours. If you have any questions, feel free to ask. 💜`
                );
              }
            } else if (payload === 'CONFIRM_NO') {
              // Check if this is from a contact awaiting confirmation
              const contactsRef = admin.firestore().collection('messengerContacts');
              const awaitingConfirmationQuery = await contactsRef
                .where('messengerPSID', '==', senderPSID)
                .where('awaitingConfirmation', '==', true)
                .limit(1)
                .get();

              if (!awaitingConfirmationQuery.empty) {
                const contactDoc = awaitingConfirmationQuery.docs[0];

                // DON'T delete - just mark as declined
                await contactDoc.ref.update({
                  awaitingConfirmation: false,
                  declined: true
                });
                functions.logger.info(`❌ User declined setup`, {
                  senderPSID,
                  docId: contactDoc.id
                });
              }

              await sendMessengerMessage(
                senderPSID,
                `No worries! If you change your mind, just send us a message anytime. 👍`
              );
            }
          } catch (error) {
            functions.logger.error('❌ Error handling quick reply', {
              senderPSID,
              payload,
              error: error.message,
              stack: error.stack
            });
            // Try to send a fallback message
            try {
              await sendMessengerMessage(
                senderPSID,
                `Thanks for your response! We're setting things up. 💜`
              );
            } catch (msgError) {
              functions.logger.error('❌ Failed to send fallback message', { error: msgError.message });
            }
          }
        }
        // Handle new contact registration via m.me link
        // NEW FLOW: Don't fetch profile on referral, wait for user to click Yes
        else if (refParam) {
          const userId = refParam;
          functions.logger.info(`🔗 Referral link clicked - userId: ${userId}`, { senderPSID, userId });

          try {
            // Get user's data for personalized message
            const userDoc = await admin.firestore().collection('users').doc(userId).get();
            const userName = userDoc.exists ? (userDoc.data().displayName || 'Your friend') : 'Your friend';

            // Prepare contact data - NO profile fetch yet, wait for confirmation
            const contactsRef = admin.firestore().collection('messengerContacts');
            const existingQuery = await contactsRef
              .where('userId', '==', userId)
              .where('messengerPSID', '==', senderPSID)
              .get();

            const now = admin.firestore.Timestamp.now();
            const expiresAt = admin.firestore.Timestamp.fromMillis(
              Date.now() + (20 * 60 * 60 * 1000) // 20 hours
            );

            // Create contact with awaitingConfirmation flag (no name yet)
            const contactData = {
              userId: userId,
              messengerPSID: senderPSID,
              name: null, // Will be set when they confirm
              photoURL: null, // Will be set when they confirm
              awaitingConfirmation: true, // Flag to indicate waiting for Yes click
              connectedAt: now,
              expiresAt: expiresAt
            };

            // Create or update contact
            if (existingQuery.empty) {
              const docRef = await contactsRef.add(contactData);
              functions.logger.info(`✅ Created new messenger contact (awaiting confirmation)`, {
                docId: docRef.id,
                userId,
                senderPSID
              });
            } else {
              await contactsRef.doc(existingQuery.docs[0].id).update({
                awaitingConfirmation: true, // Reset to awaiting if they reconnect
                connectedAt: now,
                expiresAt: expiresAt
              });
              functions.logger.info(`✅ Updated existing messenger contact (awaiting confirmation)`, {
                docId: existingQuery.docs[0].id,
                userId,
                senderPSID
              });
            }

            // Send generic greeting with Yes/No buttons (no profile fetch yet)
            await sendMessengerMessage(
              senderPSID,
              `Hi there! ${userName} said you'd be in touch.`
            );

            // Wait a moment for natural conversation flow
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Send confirmation message with Yes/No options
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
            functions.logger.error('❌ Error processing referral event', {
              userId,
              senderPSID,
              error: error.message,
              stack: error.stack
            });
            // Try to send a generic error message
            try {
              await sendMessengerMessage(
                senderPSID,
                `Hi! Thanks for reaching out. We're setting things up for you. 💜`
              );
            } catch (msgError) {
              functions.logger.error('❌ Failed to send fallback message', { error: msgError.message });
            }
          }
        }
        // Handle regular message events (user sent a message - for fallback flow)
        else if (webhookEvent.message && !webhookEvent.message.quick_reply) {
          functions.logger.info(`💬 Regular message received from PSID ${senderPSID}`);

          try {
            // Check if this is from a user with pending profile (fallback flow)
            const contactsRef = admin.firestore().collection('messengerContacts');
            const pendingContactQuery = await contactsRef
              .where('messengerPSID', '==', senderPSID)
              .where('pendingProfile', '==', true)
              .limit(1)
              .get();

            if (!pendingContactQuery.empty) {
              // This is a message from a user who needs profile completion
              const contactDoc = pendingContactQuery.docs[0];
              const contactData = contactDoc.data();
              const userId = contactData.userId;

              functions.logger.info(`🔄 Attempting profile fetch for pending contact`, {
                userId,
                senderPSID,
                docId: contactDoc.id
              });

              // Try to get profile now that user has sent a message
              const profile = await getFacebookProfile(senderPSID);

              if (profile && profile.name) {
                // SUCCESS: We got profile data
                const contactName = profile.name;
                const contactPhotoURL = profile.profile_pic || null;

                // Get user's data for personalized message
                const userDoc = await admin.firestore().collection('users').doc(userId).get();
                const userName = userDoc.exists ? (userDoc.data().displayName || 'Your friend') : 'Your friend';

                // Update contact with real profile data
                await contactDoc.ref.update({
                  name: contactName,
                  photoURL: contactPhotoURL,
                  pendingProfile: false
                });

                functions.logger.info(`✅ Updated pending contact with profile`, {
                  docId: contactDoc.id,
                  userId,
                  senderPSID,
                  name: contactName
                });

                // Send personalized greeting
                await sendMessengerMessage(
                  senderPSID,
                  `Hi ${contactName}! ${userName} said you'd reach out.`
                );

                // Wait a moment for natural conversation flow
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Send confirmation message with Yes/No options
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
              } else {
                // Profile fetch still failed
                functions.logger.warn(`⚠️ Profile fetch failed again for pending contact`, {
                  userId,
                  senderPSID,
                  docId: contactDoc.id
                });
                await sendMessengerMessage(
                  senderPSID,
                  `Hi! Thanks for connecting. If you have a link sent to you by someone, go and click it to try again!`
                );
                // Mark as not pending anymore to avoid repeated attempts
                await contactDoc.ref.update({ pendingProfile: false });
              }
            }
            // If no pending contact found, this is just a regular message - no action needed
          } catch (error) {
            functions.logger.error('❌ Error processing message event', {
              senderPSID,
              error: error.message,
              stack: error.stack
            });
          }
        }
      }
      return res.status(200).send('EVENT_RECEIVED');
    }

    functions.logger.warn('⚠️ Received non-page webhook object', { object: body.object });
    return res.sendStatus(404);
  }

  // Handle other HTTP methods
  functions.logger.warn('⚠️ Received unexpected HTTP method', { method: req.method });
  return res.sendStatus(405);
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
    try {
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
              bestieData?.notificationPreferences?.sms) {

              try {
                await sendSMSAlert(bestieData.phoneNumber, smsMessage, {
                  userId: checkinData.userId,
                  recipientId: bestieId,
                  alertType: 'check_in',
                  checkinId: checkinId
                });
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
    } catch (error) {
      functions.logger.error('sendScheduledSMS error:', {
        error: error.message,
        stack: error.stack,
        code: error.code
      });
      return null;
    }
  });

/**
 * Runs daily at 2am UTC
 * Expires old free credits and extra purchased credits
 */
exports.expireOldSmsCredits = functions.pubsub
  .schedule('0 2 * * *')  // 2am daily
  .timeZone('UTC')
  .onRun(async (context) => {
    const { expireOldCredits } = require('./utils/smsCredits');
    await expireOldCredits();
    return null;
  });

/**
 * Runs every hour
 * Alerts users with low credit balance (< 5 credits)
 */
exports.sendLowCreditAlerts = functions.pubsub
  .schedule('0 * * * *')  // Every hour
  .timeZone('UTC')
  .onRun(async (context) => {
    const db = admin.firestore();
    const { getAvailableCredits } = require('./utils/smsCredits');

    const usersSnapshot = await db.collection('users')
      .where('smsSubscription.active', '==', true)
      .get();

    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;

      // Get available credits
      const balance = await getAvailableCredits(userId);

      // Check if low balance and hasn't been alerted recently
      const lastAlerted = userData.smsCredits?.lastLowBalanceAlert?.toMillis() || 0;

      if (balance < 5 && balance > 0 && (now - lastAlerted) > ONE_DAY) {
        // Send in-app notification
        await db.collection('notifications').add({
          userId: userId,
          type: 'low_sms_credits',
          title: '⚠️ Low SMS Credits',
          message: `You have ${balance} SMS credits remaining. Buy more to stay protected.`,
          actionUrl: '/settings',
          createdAt: admin.firestore.Timestamp.now(),
          read: false
        });

        // Update last alerted timestamp
        await userDoc.ref.update({
          'smsCredits.lastLowBalanceAlert': admin.firestore.Timestamp.now()
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

// Messages
exports.onMessageCreated = onMessageCreated;

// Circle Check-Ins
exports.onCircleCheckInCreated = onCircleCheckInCreated;

// Challenges
exports.onChallengeCompleted = onChallengeCompleted;

// Challenge Tracking (NEW)
exports.updateChallengeProgressOnCheckIn = challengeTracking.updateChallengeProgressOnCheckIn;
exports.updateChallengeProgressOnCircleCheckIn = challengeTracking.updateChallengeProgressOnCircleCheckIn;
exports.updateChallengeProgressOnMessage = challengeTracking.updateChallengeProgressOnMessage;
exports.updatePactHonorOnCheckIn = challengeTracking.updatePactHonorOnCheckIn;

// Safety Pacts
exports.onPactActivated = onPactActivated;

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

// Connection Score Caching (runs daily)
exports.updateConnectionScores = functions.pubsub
  .schedule('every day 03:00')
  .timeZone('Australia/Brisbane')
  .onRun(async (context) => {
    return await updateConnectionScoresLogic();
  });

// Expire Challenges (runs daily)
exports.expireChallenges = functions.pubsub
  .schedule('every day 04:00')
  .timeZone('Australia/Brisbane')
  .onRun(async (context) => {
    return await expireChallengesLogic();
  });

// Payments
exports.createCheckoutSession = createCheckoutSession;
exports.createPortalSession = createPortalSession;
exports.stripeWebhook = stripeWebhook;

// Admin
const { grantFreeSmsCredits } = require('./core/admin/grantFreeCredits');
exports.grantFreeSmsCredits = grantFreeSmsCredits;

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