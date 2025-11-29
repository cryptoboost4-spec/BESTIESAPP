const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * Normalize phone number to E.164 format
 * Admin-only function to migrate existing phone numbers
 */
exports.migratePhoneNumbers = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  // Check admin status
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!userDoc.exists || !userDoc.data().isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  try {
    const usersSnapshot = await db.collection('users').get();
    let migratedCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const phoneNumber = userData.phoneNumber;

      if (!phoneNumber) {
        skippedCount++;
        continue;
      }

      // Skip if already in E.164 format
      if (phoneNumber.startsWith('+') && /^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
        skippedCount++;
        continue;
      }

      try {
        let e164Phone = '';

        // Remove all non-digits
        const digitsOnly = phoneNumber.replace(/\D/g, '');

        // Detect format and convert
        if (phoneNumber.startsWith('04') || phoneNumber.startsWith('4')) {
          // Australian mobile number
          const withoutLeadingZero = digitsOnly.startsWith('0') ? digitsOnly.slice(1) : digitsOnly;
          e164Phone = `+61${withoutLeadingZero}`;
        } else if (digitsOnly.length === 10) {
          // Assume US/Canada
          e164Phone = `+1${digitsOnly}`;
        } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
          // US/Canada with leading 1
          e164Phone = `+${digitsOnly}`;
        } else if (digitsOnly.length === 9) {
          // Could be Australian without leading 0
          e164Phone = `+61${digitsOnly}`;
        } else {
          // Unknown format, add +1 as default
          e164Phone = `+1${digitsOnly}`;
        }

        // Validate E.164 format
        if (!/^\+[1-9]\d{1,14}$/.test(e164Phone)) {
          errors.push({ userId: userDoc.id, oldPhone: phoneNumber, reason: 'Invalid E.164 after conversion' });
          continue;
        }

        // Update the user document
        await userDoc.ref.update({
          phoneNumber: e164Phone,
          phoneNumberMigrated: true,
          phoneNumberMigratedAt: admin.firestore.Timestamp.now(),
        });

        migratedCount++;
      } catch (error) {
        functions.logger.error(`Error migrating phone for user ${userDoc.id}:`, error);
        errors.push({ userId: userDoc.id, oldPhone: phoneNumber, error: error.message });
      }
    }

    return {
      success: true,
      migratedCount,
      skippedCount,
      totalUsers: usersSnapshot.size,
      errors: errors.length > 0 ? errors : null,
    };
  } catch (error) {
    functions.logger.error('Error in phone migration:', error);
    throw new functions.https.HttpsError('internal', 'Migration failed');
  }
});
