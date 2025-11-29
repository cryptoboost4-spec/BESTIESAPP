const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

// Track when check-ins status changes (completed/alerted)
exports.onCheckInCountUpdate = functions.firestore
  .document('checkins/{checkInId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    const userRef = db.collection('users').doc(newData.userId);
    const cacheRef = db.collection('analytics_cache').doc('realtime');

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

      const count = await db.collection('checkins')
        .where('userId', '==', newData.userId)
        .where('status', '==', 'completed')
        .count()
        .get();

      const total = count.data()?.count || 0;
      const badgesRef = db.collection('badges').doc(newData.userId);
      const badgesDoc = await badgesRef.get();
      const badges = badgesDoc.exists ? badgesDoc.data().badges || [] : [];

      if (total >= 5 && !badges.includes('safety_starter')) badges.push('safety_starter');
      if (total >= 25 && !badges.includes('safety_pro')) badges.push('safety_pro');
      if (total >= 50 && !badges.includes('safety_master')) badges.push('safety_master');

      if (badgesDoc.exists) {
        await badgesRef.update({ badges });
      } else {
        await badgesRef.set({ userId: newData.userId, badges, createdAt: admin.firestore.Timestamp.now() });
      }

      // Update streak tracking
      const userDoc = await userRef.get();
      const userData = userDoc.data();
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Get all completed check-ins from today
      const todayCheckIns = await db.collection('checkins')
        .where('userId', '==', newData.userId)
        .where('status', '==', 'completed')
        .where('completedAt', '>=', admin.firestore.Timestamp.fromDate(today))
        .get();

      // Only update streak if this is the first completion today
      if (todayCheckIns.size === 1) {
        // Get yesterday's date range
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayEnd = new Date(yesterday);
        yesterdayEnd.setDate(yesterdayEnd.getDate() + 1);

        // Check if user completed a check-in yesterday
        const yesterdayCheckIns = await db.collection('checkins')
          .where('userId', '==', newData.userId)
          .where('status', '==', 'completed')
          .where('completedAt', '>=', admin.firestore.Timestamp.fromDate(yesterday))
          .where('completedAt', '<', admin.firestore.Timestamp.fromDate(yesterdayEnd))
          .get();

        let newStreak = 1;
        if (yesterdayCheckIns.size > 0) {
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

        // Award streak badge if 7+ days
        if (newStreak >= 7 && !badges.includes('streak_master')) {
          badges.push('streak_master');
          if (badgesDoc.exists) {
            await badgesRef.update({ badges });
          } else {
            await badgesRef.set({ userId: newData.userId, badges, createdAt: admin.firestore.Timestamp.now() });
          }
        }
      }
    }

    // Update stats when status changes to 'alerted'
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
