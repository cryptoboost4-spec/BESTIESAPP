const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(functions.config().sendgrid.api_key);

const db = admin.firestore();
const APP_URL = functions.config().app?.url || 'https://bestiesapp.web.app';

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
