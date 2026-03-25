const admin = require('firebase-admin');
const { sendBulkNotifications, formatCheckInAlert } = require('../../utils/messaging');

/**
 * Scheduled function: Runs every minute
 * Checks for expired check-ins and alerts besties
 */
async function checkExpiredCheckIns(config) {
  try {
    const now = admin.firestore.Timestamp.now();
    const db = admin.firestore();

    let totalProcessed = 0;
    let lastDoc = null;
    const BATCH_SIZE = 100;

    // Process in batches to avoid unbounded reads
    while (true) {
      let query = db.collection('checkins')
        .where('status', '==', 'active')
        .where('alertTime', '<=', now)
        .orderBy('alertTime', 'asc')
        .limit(BATCH_SIZE);

      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const expiredSnapshot = await query.get();

      if (expiredSnapshot.empty) {
        break;
      }

      const functions = require('firebase-functions');
      functions.logger.info(`Processing batch of ${expiredSnapshot.size} expired check-ins`);

      // Process each expired check-in in this batch
      const promises = expiredSnapshot.docs.map(async (doc) => {
        try {
          const checkinId = doc.id;
          const checkinData = doc.data();
          
          if (!checkinData || !checkinData.userId) {
            functions.logger.error('Invalid check-in data:', checkinId);
            return;
          }
          
          // Check if already alerted (prevent duplicate processing)
          if (checkinData.status === 'alerted') {
            functions.logger.info(`Check-in ${checkinId} already alerted, skipping`);
            return;
          }
          
          const userId = checkinData.userId;
        // Get user data
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();

        if (!userData) {
          functions.logger.error('User not found for check-in:', checkinId);
          return;
        }
        
        // Store userDocData for later use (avoid duplicate fetch)
        const userDocData = userData;

        // Format alert message
        const message = formatCheckInAlert(
          userData.displayName,
          checkinData.location,
          checkinData.notes
        );

        // ===== FACEBOOK MESSENGER ALERTS =====
        // Check if messenger alerts were already sent (prevent duplicates)
        if (checkinData.messengerAlertSent) {
          functions.logger.info(`Messenger alerts already sent for check-in ${checkinId}, skipping`);
        } else if (checkinData.messengerContactIds && checkinData.messengerContactIds.length > 0) {
          try {
            const messengerContactsSnapshot = await db.collection('messengerContacts')
              .where(admin.firestore.FieldPath.documentId(), 'in', checkinData.messengerContactIds)
              .get();
            
            let allSendsSucceeded = true;
            for (const contactDoc of messengerContactsSnapshot.docs) {
              const contact = contactDoc.data();
              const now = Date.now();
              const expiresAt = contact.expiresAt;
              
              // Check if contact is still active (has valid expiration)
              if (expiresAt && expiresAt.toMillis && now < expiresAt.toMillis()) {
                // Import sendMessengerAlert from utils (fixes circular dependency)
                const { sendMessengerAlert } = require('../../utils/checkInNotifications');
                const { retryApiCall } = require('../../utils/retry');
                try {
                  await retryApiCall(
                    () => sendMessengerAlert(contact.messengerPSID, {
                      userName: userData.displayName,
                      location: checkinData.location?.address || checkinData.location || 'Unknown',
                      startTime: checkinData.createdAt.toDate().toLocaleString(),
                      notes: checkinData.notes,
                      photoURLs: checkinData.photoURLs || []
                    }),
                    { maxRetries: 3, operationName: `Messenger alert to ${contact.name}` }
                  );
                  functions.logger.info(`✅ Sent messenger alert to ${contact.name} (${contact.messengerPSID})`);
                } catch (contactError) {
                  functions.logger.error(`Failed to send messenger alert to ${contact.name}:`, contactError);
                  allSendsSucceeded = false;
                }
              } else {
                functions.logger.debug(`⏰ Messenger contact ${contact.name} expired, skipping`);
              }
            }
            
            // Only set flag if all sends succeeded
            if (allSendsSucceeded) {
              await db.collection('checkins').doc(checkinId).update({
                messengerAlertSent: true,
                messengerAlertSentAt: admin.firestore.FieldValue.serverTimestamp()
              });
            }
          } catch (messengerError) {
            functions.logger.error('Error sending messenger alerts:', messengerError);
            // Don't set flag if failed - allows retry on next run
            // Don't fail the whole function if messenger fails
          }
        }
        // ===== END FACEBOOK MESSENGER ALERTS =====

        // Filter out the user from bestie list (user shouldn't receive bestie alert message)
        const bestiesToNotify = (checkinData.bestieIds || []).filter(bestieId => bestieId !== userId);
        
        // Send push notifications and other alerts
        const { sendPushNotification } = require('../../utils/notifications');
        
        // 1. Send push notification to USER (check-in creator)
        // userDocData already fetched above
        if (userDocData?.fcmToken && userDocData?.notificationsEnabled) {
          try {
            await sendPushNotification(
              userDocData.fcmToken,
              '⚠️ You Missed Your Check-In!',
              'Your timer expired! Mark yourself as safe to let your besties know you\'re okay.',
              {
                type: 'missed_checkin',
                checkinId: checkinId,
                isUserAlert: true,
                timestamp: Date.now().toString()
              }
            );
            functions.logger.info(`✅ Push notification sent to user ${userId}`);
          } catch (pushError) {
            functions.logger.error(`Failed to send push notification to user:`, pushError);
          }
        }
        
        // 2. Send push notifications to BESTIES
        let bestieDocs = null;
        if (bestiesToNotify.length > 0) {
          bestieDocs = await db.getAll(...bestiesToNotify.map(id => db.collection('users').doc(id)));
          for (const bestieDoc of bestieDocs) {
            if (!bestieDoc.exists) continue;
            const bestieData = bestieDoc.data();
            if (bestieData?.fcmToken && bestieData?.notificationsEnabled) {
              try {
                await sendPushNotification(
                  bestieData.fcmToken,
                  '🚨 SAFETY ALERT',
                  `${userData.displayName} needs help! They didn't check in on time.`,
                  {
                    type: 'bestie_alert',
                    checkinId: checkinId,
                    alertedUserId: userId,
                    userName: userData.displayName,
                    timestamp: Date.now().toString()
                  }
                );
                functions.logger.info(`✅ Push notification sent to bestie ${bestieDoc.id}`);
              } catch (pushError) {
                functions.logger.error(`Failed to send push notification to bestie ${bestieDoc.id}:`, pushError);
              }
            }
          }
        }
        
        // 3. Send other notifications (Telegram, SMS, WhatsApp, etc.) to besties
        if (bestiesToNotify.length > 0) {
          functions.logger.info('Processing Telegram alerts', {
            checkinId,
            bestieIds: bestiesToNotify,
            timestamp: new Date().toISOString()
          });
          
          // Debug: Check each bestie's Telegram status before sending (reuse bestieDocs if already fetched)
          if (!bestieDocs) {
            bestieDocs = await db.getAll(...bestiesToNotify.map(id => db.collection('users').doc(id)));
          }
          for (const bestieDoc of bestieDocs) {
            if (!bestieDoc.exists) continue;
            const bestieData = bestieDoc.data();
            functions.logger.info('Checking bestie Telegram', {
              bestieId: bestieDoc.id,
              hasTelegramChatId: !!bestieData?.telegramChatId,
              telegramChatId: bestieData?.telegramChatId || null,
              telegramPreference: bestieData?.notificationPreferences?.telegram,
              fullPreferences: bestieData?.notificationPreferences || {}
            });
            
            if (bestieData?.telegramChatId && bestieData?.notificationPreferences?.telegram) {
              functions.logger.info('Bestie has Telegram enabled - will attempt send via sendBulkNotifications', {
                bestieId: bestieDoc.id,
                chatId: bestieData.telegramChatId
              });
            } else {
              functions.logger.info('Telegram alert will be skipped', {
                bestieId: bestieDoc.id,
                reason: !bestieData?.telegramChatId ? 'No chat ID' : 'Telegram disabled in preferences'
              });
            }
          }
          
          await sendBulkNotifications(
            bestiesToNotify,
            message,
            config,
            {
              type: 'checkin_alert',
              checkinId,
              userId,
              location: checkinData.location,
              notes: checkinData.notes,
              photoURLs: checkinData.photoURLs || [],
              lastUpdate: checkinData.lastUpdate,
              userName: userData.displayName,
              startTime: checkinData.createdAt.toDate().toLocaleString()
            }
          );
        }
        
        // 4. Send other notifications to user (Telegram, SMS, WhatsApp if enabled)
        const userMessage = "You missed your check-in! Go and check in immediately to let your besties know you're safe.";
        await sendBulkNotifications(
          [userId],
          userMessage,
          config,
          {
            type: 'checkin_alert_user',
            checkinId,
            userId,
            location: checkinData.location,
            notes: checkinData.notes,
            photoURLs: checkinData.photoURLs || [],
            userName: userData.displayName,
            startTime: checkinData.createdAt.toDate().toLocaleString()
          }
        );

        // Update check-in status
        await db.collection('checkins').doc(checkinId).update({
          status: 'alerted',
          alertedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          viewedBy: [] // Initialize viewedBy array
        });
        


        // Log analytics
        await db.collection('analytics').add({
          event: 'checkin_alert_triggered',
          userId,
          checkinId,
          bestieCount: checkinData.bestieIds.length,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

          const functions = require('firebase-functions');
          functions.logger.info('Alert sent for check-in:', checkinId);
        } catch (error) {
          const functions = require('firebase-functions');
          functions.logger.error('Error processing expired check-in:', doc.id, error);
          // Continue processing other check-ins even if one fails
        }
      });

      await Promise.all(promises);
      totalProcessed += expiredSnapshot.size;

      // If we got fewer than BATCH_SIZE, we're done
      if (expiredSnapshot.size < BATCH_SIZE) {
        break;
      }

      // Set lastDoc for next iteration
      lastDoc = expiredSnapshot.docs[expiredSnapshot.docs.length - 1];
    }

    const functions = require('firebase-functions');
    if (totalProcessed === 0) {
      functions.logger.info('No expired check-ins found');
    } else {
      functions.logger.info(`Processed ${totalProcessed} expired check-ins total`);
    }

    return {
      success: true,
      count: totalProcessed
    };

  } catch (error) {
    const functions = require('firebase-functions');
    functions.logger.error('Error checking expired check-ins:', error);
    throw error;
  }
}

module.exports = checkExpiredCheckIns;
