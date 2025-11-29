const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');
const EMAIL_CONFIG = require('../../utils/emailConfig');

// Lazy SendGrid initialization
let sendGridInitialized = false;

function initializeSendGrid() {
  if (!sendGridInitialized) {
    const apiKey = functions.config().sendgrid?.api_key;
    if (!apiKey) {
      throw new Error('SendGrid API key not configured. Please set sendgrid.api_key in Firebase Functions config.');
    }
    sgMail.setApiKey(apiKey);
    sendGridInitialized = true;
  }
}

const db = admin.firestore();
const APP_URL = functions.config().app?.url || 'https://bestiesapp.web.app';

// Send test alert to verify notification setup
// Accepts: { channels: { email: bool, push: bool, sms: bool, whatsapp: bool, telegram: bool } }
exports.sendTestAlert = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const requestedChannels = data?.channels || { email: true, push: true };

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
      telegram: false,
    };

    // Send Push Notification if requested
    if (requestedChannels.push && userData.fcmToken && userData.notificationsEnabled) {
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
        functions.logger.info('Test push notification sent successfully');
      } catch (pushError) {
        functions.logger.error('Push notification failed:', pushError.message);
      }
    }

    // Send Email if requested
    if (requestedChannels.email && userData.email && userData.notificationPreferences?.email) {
      try {
        initializeSendGrid();
        const emailMessage = {
          to: userData.email,
          from: EMAIL_CONFIG.ALERTS,
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
        functions.logger.info('Test email sent successfully');
      } catch (emailError) {
        functions.logger.error('Email notification failed:', emailError.message);
      }
    }

    // Send SMS if requested
    if (requestedChannels.sms && userData.phoneNumber && userData.notificationPreferences?.sms) {
      try {
        const twilio = require('twilio');
        const accountSid = functions.config().twilio?.account_sid;
        const authToken = functions.config().twilio?.auth_token;
        const phoneNumber = functions.config().twilio?.phone_number;
        
        if (!accountSid || !authToken || !phoneNumber) {
          functions.logger.error('Twilio not configured');
          throw new Error('Twilio not configured');
        }
        
        const twilioClient = twilio(accountSid, authToken);

        await twilioClient.messages.create({
          from: phoneNumber,
          to: userData.phoneNumber,
          body: '✅ Test Alert - Your SMS notifications are working! You\'ll receive safety alerts via text message. - Besties App 💜'
        });

        channelsTested.sms = true;
        functions.logger.info('Test SMS sent successfully');
      } catch (smsError) {
        functions.logger.error('SMS notification failed:', smsError.message);
        // Don't throw - let other channels still work
      }
    }

    // Send WhatsApp if requested
    if (requestedChannels.whatsapp && userData.phoneNumber && userData.notificationPreferences?.whatsapp) {
      try {
        const twilio = require('twilio');
        const twilioClient = twilio(
          functions.config().twilio?.account_sid,
          functions.config().twilio?.auth_token
        );

        await twilioClient.messages.create({
          from: `whatsapp:${functions.config().twilio?.phone_number}`,
          to: `whatsapp:${userData.phoneNumber}`,
          body: '✅ Test Alert - Your WhatsApp notifications are working perfectly! You\'ll receive safety alerts here. - Besties App 💜'
        });

        channelsTested.whatsapp = true;
        functions.logger.info('Test WhatsApp sent successfully');
      } catch (whatsappError) {
        functions.logger.error('WhatsApp notification failed:', whatsappError.message);
      }
    }

    // Send Telegram if requested
    if (requestedChannels.telegram && userData.telegramChatId && userData.notificationPreferences?.telegram) {
      try {
        const axios = require('axios');
        const botToken = functions.config().telegram?.bot_token;
        
        if (!botToken) {
          functions.logger.error('Telegram bot token not configured');
          throw new Error('Telegram bot token not configured');
        }

        await axios.post(
          `https://api.telegram.org/bot${botToken}/sendMessage`,
          {
            chat_id: userData.telegramChatId,
            text: '✅ <b>Test Alert Success!</b>\n\nYour Telegram notifications are working perfectly! You\'ll receive safety alerts here when your besties need help. 💜',
            parse_mode: 'HTML'
          }
        );

        channelsTested.telegram = true;
        functions.logger.info('Test Telegram sent successfully');
      } catch (telegramError) {
        functions.logger.error('Telegram notification failed:', telegramError.message);
        // Don't throw - let other channels still work
      }
    }

    // Check if at least one channel was tested
    const anyTested = Object.values(channelsTested).some(val => val === true);
    if (!anyTested) {
      const enabledChannels = [];
      if (userData.fcmToken && userData.notificationsEnabled) enabledChannels.push('push');
      if (userData.telegramChatId && userData.notificationPreferences?.telegram) enabledChannels.push('telegram');
      if (userData.phoneNumber && userData.notificationPreferences?.sms) enabledChannels.push('sms');
      
      throw new functions.https.HttpsError(
        'failed-precondition',
        `No notification channels enabled. Please enable push notifications, telegram, or SMS in settings.${enabledChannels.length > 0 ? ` You have ${enabledChannels.join(', ')} enabled but didn't select them for testing.` : ''}`
      );
    }

    const testedChannelNames = Object.keys(channelsTested).filter(key => channelsTested[key]);

    return {
      success: true,
      message: 'Test alert sent successfully',
      channels: channelsTested,
      testedChannels: testedChannelNames,
      note: testedChannelNames.length > 0 ? `Successfully tested: ${testedChannelNames.join(', ')}` : 'No channels tested'
    };
  } catch (error) {
    functions.logger.error('Error sending test alert:', error);
    if (error.code === 'failed-precondition') {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to send test alert: ' + error.message);
  }
});
