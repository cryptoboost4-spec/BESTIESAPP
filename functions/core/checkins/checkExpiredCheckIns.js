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

        // Format alert message
        const message = formatCheckInAlert(
          userData.displayName,
          checkinData.location,
          checkinData.notes
        );

        // ===== FACEBOOK MESSENGER ALERTS =====
        // Load messenger contacts for this check-in
        if (checkinData.messengerContactIds && checkinData.messengerContactIds.length > 0) {
          try {
            const messengerContactsSnapshot = await db.collection('messengerContacts')
              .where(admin.firestore.FieldPath.documentId(), 'in', checkinData.messengerContactIds)
              .get();
            
            for (const contactDoc of messengerContactsSnapshot.docs) {
              const contact = contactDoc.data();
              const now = Date.now();
              const expiresAt = contact.expiresAt;
              
              // Check if contact is still active (has valid expiration)
              if (expiresAt && expiresAt.toMillis && now < expiresAt.toMillis()) {
                // Import sendMessengerAlert from utils (fixes circular dependency)
                const { sendMessengerAlert } = require('../../utils/checkInNotifications');
                await sendMessengerAlert(contact.messengerPSID, {
                  userName: userData.displayName,
                  location: checkinData.location?.address || checkinData.location || 'Unknown',
                  startTime: checkinData.createdAt.toDate().toLocaleString()
                });
                functions.logger.info(`✅ Sent messenger alert to ${contact.name} (${contact.messengerPSID})`);
              } else {
                functions.logger.debug(`⏰ Messenger contact ${contact.name} expired, skipping`);
              }
            }
          } catch (messengerError) {
            functions.logger.error('Error sending messenger alerts:', messengerError);
            // Don't fail the whole function if messenger fails
          }
        }
        // ===== END FACEBOOK MESSENGER ALERTS =====

        // Send alerts to all besties (this handles Telegram, SMS, WhatsApp, etc. - no duplicates)
        // NOTE: sendBulkNotifications already handles Telegram, so we don't send it separately here
        await sendBulkNotifications(
          checkinData.bestieIds,
          message,
          config,
          {
            type: 'checkin_alert',
            checkinId,
            userId,
            location: checkinData.location,
            notes: checkinData.notes,
            lastUpdate: checkinData.lastUpdate,
            userName: userData.displayName,
            startTime: checkinData.createdAt.toDate().toLocaleString()
          }
        );

        // Update check-in status
        await db.collection('checkins').doc(checkinId).update({
          status: 'alerted',
          alertedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
