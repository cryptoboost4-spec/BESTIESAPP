const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

exports.dailyAnalyticsAggregation = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkInsSnapshot = await db.collection('checkins')
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(yesterday))
      .where('createdAt', '<', admin.firestore.Timestamp.fromDate(today))
      .limit(10000) // Limit to prevent unbounded reads (10k check-ins per day is reasonable)
      .get();

    // Filter out test check-ins
    const nonTestCheckIns = checkInsSnapshot.docs.filter(doc => !doc.data().isTest);

    const stats = {
      date: admin.firestore.Timestamp.fromDate(yesterday),
      totalCheckIns: nonTestCheckIns.length,
      completedCheckIns: 0,
      alertedCheckIns: 0,
    };

    nonTestCheckIns.forEach(doc => {
      const data = doc.data();
      if (data.status === 'completed') stats.completedCheckIns++;
      if (data.status === 'alerted') stats.alertedCheckIns++;
    });

    await db.collection('daily_stats').add(stats);

    return null;
  });
