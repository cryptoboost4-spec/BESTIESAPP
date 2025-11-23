const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

// Track when check-ins are created
exports.onCheckInCreated = functions.firestore
  .document('checkins/{checkInId}')
  .onCreate(async (snap, context) => {
    const checkIn = snap.data();

    // Increment total check-in count in user stats
    await db.collection('users').doc(checkIn.userId).update({
      'stats.totalCheckIns': admin.firestore.FieldValue.increment(1)
    });

    // Update analytics cache (real-time global stats)
    const cacheRef = db.collection('analytics_cache').doc('realtime');
    await cacheRef.set({
      totalCheckIns: admin.firestore.FieldValue.increment(1),
      activeCheckIns: admin.firestore.FieldValue.increment(1),
      lastUpdated: admin.firestore.Timestamp.now(),
    }, { merge: true });
  });
