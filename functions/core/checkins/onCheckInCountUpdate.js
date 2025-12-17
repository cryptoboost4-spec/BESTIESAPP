const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { updateUserBadges } = require('../../utils/badges');

const db = admin.firestore();

// Track when check-ins status changes (completed/alerted)
exports.onCheckInCountUpdate = functions.firestore
  .document('checkins/{checkInId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    const userRef = db.collection('users').doc(newData.userId);
    const cacheRef = db.collection('analytics_cache').doc('realtime');

    // Skip stats updates for test check-ins
    if (newData.isTest === true) {
      return;
    }

    // Update stats when status changes to 'completed'
    if (newData.status === 'completed' && oldData.status !== 'completed') {
      // Increment completed count in user stats
      await userRef.update({
        'stats.completedCheckIns': admin.firestore.FieldValue.increment(1)
      });

      // Update analytics cache
      await cacheRef.set({
        completedCheckIns: admin.firestore.FieldValue.increment(1),
        activeCheckIns: admin.firestore.FieldValue.increment(-1),
        lastUpdated: admin.firestore.Timestamp.now(),
      }, { merge: true });

      // Update streak tracking
      const userDoc = await userRef.get();
      const userData = userDoc.data();
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Get all completed check-ins from today
      const todayCheckInsSnapshot = await db.collection('checkins')
        .where('userId', '==', newData.userId)
        .where('status', '==', 'completed')
        .where('completedAt', '>=', admin.firestore.Timestamp.fromDate(today))
        .get();
      
      // Filter out test check-ins for streak calculation
      const todayCheckIns = todayCheckInsSnapshot.docs.filter(doc => !doc.data().isTest);

      // Only update streak if this is the first completion today
      if (todayCheckIns.length === 1) {
        // Get yesterday's date range
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayEnd = new Date(yesterday);
        yesterdayEnd.setDate(yesterdayEnd.getDate() + 1);

        // Check if user completed a check-in yesterday
        const yesterdayCheckInsSnapshot = await db.collection('checkins')
          .where('userId', '==', newData.userId)
          .where('status', '==', 'completed')
          .where('completedAt', '>=', admin.firestore.Timestamp.fromDate(yesterday))
          .where('completedAt', '<', admin.firestore.Timestamp.fromDate(yesterdayEnd))
          .get();
        
        // Filter out test check-ins for streak calculation
        const yesterdayCheckIns = yesterdayCheckInsSnapshot.docs.filter(doc => !doc.data().isTest);

        let newStreak = 1;
        if (yesterdayCheckIns.length > 0) {
          // Consecutive day - increment streak
          newStreak = (userData.stats?.currentStreak || 0) + 1;
        }

        // Update longest streak if current streak is higher
        const longestStreak = userData.stats?.longestStreak || 0;
        const newLongestStreak = Math.max(newStreak, longestStreak);

        await userRef.update({
          'stats.currentStreak': newStreak,
          'stats.longestStreak': newLongestStreak
        });
      }

      // Update all badges based on new stats
      await updateUserBadges(newData.userId);
    }

    // Update stats when status changes to 'alerted'
    // Note: isTest check already done at top of function
    if (newData.status === 'alerted' && oldData.status !== 'alerted') {
      await userRef.update({
        'stats.alertedCheckIns': admin.firestore.FieldValue.increment(1)
      });

      // Update analytics cache
      await cacheRef.set({
        alertedCheckIns: admin.firestore.FieldValue.increment(1),
        activeCheckIns: admin.firestore.FieldValue.increment(-1),
        lastUpdated: admin.firestore.Timestamp.now(),
      }, { merge: true });
    }
  });
