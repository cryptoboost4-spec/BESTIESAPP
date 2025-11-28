const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(functions.config().sendgrid.api_key);

const db = admin.firestore();
const APP_URL = functions.config().app?.url || 'https://bestiesapp.web.app';

// Check for birthdays and notify besties daily at midnight
exports.checkBirthdays = functions.pubsub
  .schedule('0 0 * * *') // Run daily at midnight
  .timeZone('America/New_York')
  .onRun(async (context) => {
    console.log('🎂 Starting birthday check...');

    const today = new Date();
    const todayMonth = today.getMonth() + 1; // JavaScript months are 0-indexed
    const todayDay = today.getDate();

    try {
      // Get all users
      const usersSnapshot = await db.collection('users').get();

      let birthdayCount = 0;
      let notificationsSent = 0;

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
          console.log(`🎉 Birthday found: ${userData.displayName} (${userId})`);
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

          console.log(`Found ${bestieIds.size} besties for ${userData.displayName}`);

          // Send notification to each bestie
          for (const bestieId of bestieIds) {
            try {
              const bestieDoc = await db.collection('users').doc(bestieId).get();

              if (!bestieDoc.exists) {
                continue;
              }

              const bestieData = bestieDoc.data();
              const birthdayName = userData.displayName || 'Your bestie';

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
                  await sgMail.send({
                    to: bestieData.email,
                    from: 'notifications@bestiesapp.com',
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
                  console.error('Failed to send birthday email:', emailError);
                }
              }

            } catch (notifError) {
              console.error(`Failed to notify bestie ${bestieId}:`, notifError);
            }
          }
        }
      }

      console.log(`🎂 Birthday check complete: ${birthdayCount} birthdays, ${notificationsSent} notifications sent`);

      return {
        success: true,
        birthdayCount,
        notificationsSent,
      };
    } catch (error) {
      console.error('Error during birthday check:', error);
      return { success: false, error: error.message };
    }
  });
