const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(functions.config().sendgrid.api_key);

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
        console.log('Test push notification sent successfully');
      } catch (pushError) {
        console.error('Push notification failed:', pushError.message);
      }
    }

    // Send Email if requested
    if (requestedChannels.email && userData.email && userData.notificationPreferences?.email) {
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

    // Send SMS if requested
    if (requestedChannels.sms && userData.phoneNumber && userData.notificationPreferences?.sms) {
      try {
        const twilio = require('twilio');
        const twilioClient = twilio(
          functions.config().twilio.account_sid,
          functions.config().twilio.auth_token
        );

        await twilioClient.messages.create({
          from: functions.config().twilio.phone_number,
          to: userData.phoneNumber,
          body: '✅ Test Alert - Your SMS notifications are working! You\'ll receive safety alerts via text message. - Besties App 💜'
        });

        channelsTested.sms = true;
        console.log('Test SMS sent successfully');
      } catch (smsError) {
        console.error('SMS notification failed:', smsError.message);
      }
    }

    // Send WhatsApp if requested
    if (requestedChannels.whatsapp && userData.phoneNumber && userData.notificationPreferences?.whatsapp) {
      try {
        const twilio = require('twilio');
        const twilioClient = twilio(
          functions.config().twilio.account_sid,
          functions.config().twilio.auth_token
        );

        await twilioClient.messages.create({
          from: `whatsapp:${functions.config().twilio.phone_number}`,
          to: `whatsapp:${userData.phoneNumber}`,
          body: '✅ Test Alert - Your WhatsApp notifications are working perfectly! You\'ll receive safety alerts here. - Besties App 💜'
        });

        channelsTested.whatsapp = true;
        console.log('Test WhatsApp sent successfully');
      } catch (whatsappError) {
        console.error('WhatsApp notification failed:', whatsappError.message);
      }
    }

    // Send Telegram if requested
    if (requestedChannels.telegram && userData.telegramChatId && userData.notificationPreferences?.telegram) {
      try {
        const axios = require('axios');
        const botToken = functions.config().telegram.bot_token;

        await axios.post(
          `https://api.telegram.org/bot${botToken}/sendMessage`,
          {
            chat_id: userData.telegramChatId,
            text: '✅ <b>Test Alert Success!</b>\n\nYour Telegram notifications are working perfectly! You\'ll receive safety alerts here when your besties need help. 💜',
            parse_mode: 'HTML'
          }
        );

        channelsTested.telegram = true;
        console.log('Test Telegram sent successfully');
      } catch (telegramError) {
        console.error('Telegram notification failed:', telegramError.message);
      }
    }

    // Check if at least one channel was tested
    const anyTested = Object.values(channelsTested).some(val => val === true);
    if (!anyTested) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'No notification channels enabled. Please enable push notifications or email notifications in settings.'
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
    console.error('Error sending test alert:', error);
    if (error.code === 'failed-precondition') {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to send test alert: ' + error.message);
  }
});
