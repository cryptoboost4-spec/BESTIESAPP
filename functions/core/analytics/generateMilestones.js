const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

// Check for milestones daily at 1 AM
exports.generateMilestones = functions.pubsub
  .schedule('0 1 * * *') // Run daily at 1:00 AM
  .timeZone('America/New_York')
  .onRun(async (context) => {
    functions.logger.info('🎉 Starting milestone generation...');

    let milestonesCreated = 0;

    try {
      // Get all accepted bestie relationships
      const bestiesSnapshot = await db.collection('besties')
        .where('status', '==', 'accepted')
        .get();

      functions.logger.info(`Checking ${bestiesSnapshot.size} bestie relationships for milestones`);

      for (const bestieDoc of bestiesSnapshot.docs) {
        const bestieData = bestieDoc.data();
        const userId1 = bestieData.requesterId;
        const userId2 = bestieData.recipientId;

        // Check days in circle milestone (7, 30, 100, 365 days)
        if (bestieData.acceptedAt) {
          const daysTogether = Math.floor(
            (Date.now() - bestieData.acceptedAt.toMillis()) / (24 * 60 * 60 * 1000)
          );

          const milestones = [7, 30, 100, 365];
          if (milestones.includes(daysTogether)) {
            // Create milestone for both users
            const user1Doc = await db.collection('users').doc(userId1).get();
            const user2Doc = await db.collection('users').doc(userId2).get();

            if (user1Doc.exists && user2Doc.exists) {
              await db.collection('circle_milestones').add({
                userId: userId1,
                bestieId: userId2,
                bestieName: user2Doc.data().displayName,
                type: 'days_in_circle',
                value: daysTogether,
                createdAt: admin.firestore.Timestamp.now(),
                celebrated: false,
              });

              await db.collection('circle_milestones').add({
                userId: userId2,
                bestieId: userId1,
                bestieName: user1Doc.data().displayName,
                type: 'days_in_circle',
                value: daysTogether,
                createdAt: admin.firestore.Timestamp.now(),
                celebrated: false,
              });

              milestonesCreated += 2;
              functions.logger.info(`Created ${daysTogether} days milestone for ${userId1} & ${userId2}`);
            }
          }
        }

        // Check shared check-ins milestone (5, 10, 25, 50)
        const sharedCheckIns1 = await db.collection('checkins')
          .where('userId', '==', userId1)
          .where('bestieIds', 'array-contains', userId2)
          .where('status', '==', 'completed')
          .count()
          .get();

        const sharedCheckIns2 = await db.collection('checkins')
          .where('userId', '==', userId2)
          .where('bestieIds', 'array-contains', userId1)
          .where('status', '==', 'completed')
          .count()
          .get();

        const totalShared = (sharedCheckIns1.data()?.count || 0) + (sharedCheckIns2.data()?.count || 0);
        const checkInMilestones = [5, 10, 25, 50];

        if (checkInMilestones.includes(totalShared)) {
          // Check if milestone already exists
          const existing = await db.collection('circle_milestones')
            .where('userId', '==', userId1)
            .where('bestieId', '==', userId2)
            .where('type', '==', 'check_ins_together')
            .where('value', '==', totalShared)
            .get();

          if (existing.empty) {
            const user1Doc = await db.collection('users').doc(userId1).get();
            const user2Doc = await db.collection('users').doc(userId2).get();

            if (user1Doc.exists && user2Doc.exists) {
              await db.collection('circle_milestones').add({
                userId: userId1,
                bestieId: userId2,
                bestieName: user2Doc.data().displayName,
                type: 'check_ins_together',
                value: totalShared,
                createdAt: admin.firestore.Timestamp.now(),
                celebrated: false,
              });

              await db.collection('circle_milestones').add({
                userId: userId2,
                bestieId: userId1,
                bestieName: user1Doc.data().displayName,
                type: 'check_ins_together',
                value: totalShared,
                createdAt: admin.firestore.Timestamp.now(),
                celebrated: false,
              });

              milestonesCreated += 2;
              functions.logger.info(`Created ${totalShared} check-ins milestone for ${userId1} & ${userId2}`);
            }
          }
        }
      }

      // Check individual alert response milestones (5, 10, 25, 50 responses)
      // Use pagination to prevent unbounded reads
      const BATCH_SIZE = 1000;
      let lastDoc = null;

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
          const userId = userDoc.id;

          const alertResponses = await db.collection('alert_responses')
            .where('responderId', '==', userId)
            .count()
            .get();

          const responseCount = alertResponses.data()?.count || 0;
          const responseMilestones = [5, 10, 25, 50];

          if (responseMilestones.includes(responseCount)) {
            // Check if milestone already exists
            const existing = await db.collection('circle_milestones')
              .where('userId', '==', userId)
              .where('type', '==', 'alerts_responded')
              .where('value', '==', responseCount)
              .get();

            if (existing.empty) {
              await db.collection('circle_milestones').add({
                userId: userId,
                type: 'alerts_responded',
                value: responseCount,
                createdAt: admin.firestore.Timestamp.now(),
                celebrated: false,
              });

              milestonesCreated++;
              functions.logger.info(`Created ${responseCount} alerts responded milestone for ${userId}`);
            }
          }
        }

        lastDoc = usersSnapshot.docs[usersSnapshot.docs.length - 1];

        // If we got fewer than BATCH_SIZE, we're done
        if (usersSnapshot.size < BATCH_SIZE) {
          break;
        }
      }

      functions.logger.info(`🎉 Milestone generation complete: ${milestonesCreated} milestones created`);

      return {
        success: true,
        milestonesCreated,
      };
    } catch (error) {
      functions.logger.error('Error generating milestones:', error);
      return { success: false, error: error.message };
    }
  });
