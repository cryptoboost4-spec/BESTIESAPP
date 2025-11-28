const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

const db = admin.firestore();

// Helper: Send Messenger notification
async function sendMessengerNotification(psid, text, config) {
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${config.facebook.page_token}`,
      {
        recipient: { id: psid },
        message: { text: text }
      }
    );
  } catch (error) {
    console.error('Error sending Messenger notification:', error);
  }
}

// Complete check-in
exports.completeCheckIn = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { checkInId } = data;

  const checkInRef = db.collection('checkins').doc(checkInId);
  const checkIn = await checkInRef.get();

  if (!checkIn.exists || checkIn.data().userId !== context.auth.uid) {
    throw new functions.https.HttpsError('permission-denied', 'Invalid check-in');
  }

  const checkInData = checkIn.data();

  await checkInRef.update({
    status: 'completed',
    completedAt: admin.firestore.Timestamp.now(),
  });

  // Get user data for notification
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  const userData = userDoc.data();
  const userName = userData?.displayName || 'Your friend';

  // Send completion notifications to Messenger contacts
  if (checkInData.messengerContactIds && checkInData.messengerContactIds.length > 0) {
    const config = functions.config();

    try {
      const messengerContactsSnapshot = await db.collection('messengerContacts')
        .where(admin.firestore.FieldPath.documentId(), 'in', checkInData.messengerContactIds)
        .get();

      const now = Date.now();

      for (const contactDoc of messengerContactsSnapshot.docs) {
        const contact = contactDoc.data();

        // Check if contact is still valid (not expired)
        if (contact.expiresAt?.toMillis() > now) {
          // Only send if preference is 'all' (not emergency_only)
          if (!contact.notificationPreference || contact.notificationPreference === 'all') {
            const message = `✅ ${userName} checked in safely!\n\nThey're okay and completed their check-in. 💜`;
            await sendMessengerNotification(contact.messengerPSID, message, config);
            console.log(`✅ Sent completion notification to ${contact.name} via Messenger`);
          }
        }
      }
    } catch (error) {
      console.error('Error sending Messenger completion notifications:', error);
      // Don't fail the whole function if messenger fails
    }
  }

  // Stats are updated by onCheckInCountUpdate trigger - no need to update here
  // (Removed duplicate increment to fix double-counting bug)

  return { success: true };
});
