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

// Check for birthdays and notify besties daily at 9 AM in their local timezone
exports.checkBirthdays = functions.pubsub
  .schedule('*/15 * * * *') // Run every 15 minutes to catch 9 AM across all timezones
  .timeZone('UTC')
  .onRun(async (context) => {
    functions.logger.info('🎂 Starting birthday check...');

    const now = new Date();
    const todayMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
    const todayDay = now.getDate();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();

    try {
      // Get all users with pagination to prevent unbounded reads
      const BATCH_SIZE = 1000;
      let lastDoc = null;
      let usersProcessed = 0;

      let birthdayCount = 0;
      let notificationsSent = 0;

      // Process users in batches to prevent unbounded reads
      while (true) {
        let usersQuery = db.collection('users').limit(BATCH_SIZE);
        if (lastDoc) {
          usersQuery = usersQuery.startAfter(lastDoc);
        }

        const usersSnapshot = await usersQuery.get();

        if (usersSnapshot.empty) {
          break;
        }

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
            functions.logger.info(`🎉 Birthday found: ${userData.displayName} (${userId})`);
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

            functions.logger.debug(`Found ${bestieIds.size} besties for ${userData.displayName}`);

            // Send notification to each bestie
            for (const bestieId of bestieIds) {
              try {
                const bestieDoc = await db.collection('users').doc(bestieId).get();

                if (!bestieDoc.exists) {
                  continue;
                }

                const bestieData = bestieDoc.data();
                const birthdayName = userData.displayName || 'Your bestie';

                // Check if it's 9 AM in the bestie's timezone
                const bestieTimezone = bestieData.timezone || 'UTC';
                const now = new Date();
                const formatter = new Intl.DateTimeFormat('en-US', {
                  timeZone: bestieTimezone,
                  hour: 'numeric',
                  minute: 'numeric',
                  hour12: false
                });
                const parts = formatter.formatToParts(now);
                const bestieHour = parseInt(parts.find(p => p.type === 'hour').value);
                const bestieMinute = parseInt(parts.find(p => p.type === 'minute').value);

                // Only send if it's 9:00-9:14 AM in their timezone (15-minute window)
                if (bestieHour !== 9 || bestieMinute >= 15) {
                  continue;
                }

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
                  initializeSendGrid();
                  await sgMail.send({
                    to: bestieData.email,
                    from: EMAIL_CONFIG.NOTIFICATIONS,
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
                    functions.logger.error('Failed to send birthday email:', emailError);
                  }
                }

              } catch (notifError) {
                functions.logger.error(`Failed to notify bestie ${bestieId}:`, notifError);
              }
            }
          }
        }

        usersProcessed += usersSnapshot.size;
        lastDoc = usersSnapshot.docs[usersSnapshot.docs.length - 1];

        // If we got fewer than BATCH_SIZE, we're done
        if (usersSnapshot.size < BATCH_SIZE) {
          break;
        }
      }

      functions.logger.info(`🎂 Birthday check complete: ${birthdayCount} birthdays, ${notificationsSent} notifications sent, ${usersProcessed} users processed`);

      return {
        success: true,
        birthdayCount,
        notificationsSent,
      };
    } catch (error) {
      functions.logger.error('Error during birthday check:', error);
      return { success: false, error: error.message };
    }
  });
