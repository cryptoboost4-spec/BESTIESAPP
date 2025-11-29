const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

// Update user streaks daily
exports.updateDailyStreaks = functions.pubsub
  .schedule('0 1 * * *') // Run daily at 1 AM
  .timeZone('America/New_York')
  .onRun(async (context) => {
    functions.logger.info('📊 Starting daily streak update...');

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    // Get all users with pagination to prevent unbounded reads
    const BATCH_SIZE = 1000;
    let lastDoc = null;
    const updatePromises = [];

    while (true) {
      let usersQuery = db.collection('users').limit(BATCH_SIZE);
      if (lastDoc) {
        usersQuery = usersQuery.startAfter(lastDoc);
      }

      const usersSnapshot = await usersQuery.get();

      if (usersSnapshot.empty) {
        break;
      }

      const batchUpdatePromises = [];

      for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      const lastActive = userData.lastActive?.toDate();

      if (!lastActive) {
        // User has never been active, skip
        continue;
      }

      const currentStreak = userData.stats?.currentStreak || 0;
      const longestStreak = userData.stats?.longestStreak || 0;
      const daysActive = userData.stats?.daysActive || 0;

      // Check if user was active yesterday
      const wasActiveYesterday = lastActive >= yesterday && lastActive <= yesterdayEnd;

      let newStreak = currentStreak;
      let newLongestStreak = longestStreak;
      let newDaysActive = daysActive;

      if (wasActiveYesterday) {
        // User was active yesterday - increment streak
        newStreak = currentStreak + 1;
        newDaysActive = daysActive + 1;

        // Update longest streak if current exceeds it
        if (newStreak > longestStreak) {
          newLongestStreak = newStreak;
        }
      } else {
        // User was not active yesterday - check if streak should break
        const daysSinceActive = Math.floor((now - lastActive) / (1000 * 60 * 60 * 24));

        if (daysSinceActive > 1) {
          // Missed more than 1 day - reset streak
          newStreak = 0;
        }
        // If daysSinceActive === 1, we're still within grace period (today), keep streak
      }

      // Only update if values changed
      if (
        newStreak !== currentStreak ||
        newLongestStreak !== longestStreak ||
        newDaysActive !== daysActive
      ) {
        batchUpdatePromises.push(
          userDoc.ref.update({
            'stats.currentStreak': newStreak,
            'stats.longestStreak': newLongestStreak,
            'stats.daysActive': newDaysActive,
          })
        );
      }
      }

      // Add batch promises to main array
      updatePromises.push(...batchUpdatePromises);

      lastDoc = usersSnapshot.docs[usersSnapshot.docs.length - 1];

      // If we got fewer than BATCH_SIZE, we're done
      if (usersSnapshot.size < BATCH_SIZE) {
        break;
      }
    }

    await Promise.all(updatePromises);

    functions.logger.info(`✅ Updated streaks for ${updatePromises.length} users`);
    return null;
  });
