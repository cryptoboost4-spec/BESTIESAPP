const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * Rebuild Analytics Cache - Admin Only
 * Recalculates all analytics from raw data if cache gets out of sync
 * Call this to initialize the cache or fix discrepancies
 */
exports.rebuildAnalyticsCache = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  // Check admin status
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!userDoc.exists || !userDoc.data().isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  functions.logger.info('🔄 Rebuilding analytics cache from raw data...');

  try {
    // Count total users
    const usersCount = await db.collection('users').count().get();
    const totalUsers = usersCount.data()?.count || 0;

    // Count check-ins by status
    const [totalCheckInsCount, activeCheckInsCount, completedCheckInsCount, alertedCheckInsCount] = await Promise.all([
      db.collection('checkins').count().get(),
      db.collection('checkins').where('status', '==', 'active').count().get(),
      db.collection('checkins').where('status', '==', 'completed').count().get(),
      db.collection('checkins').where('status', '==', 'alerted').count().get(),
    ]);

    // Count besties by status
    const [totalBestiesCount, pendingBestiesCount, acceptedBestiesCount] = await Promise.all([
      db.collection('besties').count().get(),
      db.collection('besties').where('status', '==', 'pending').count().get(),
      db.collection('besties').where('status', '==', 'accepted').count().get(),
    ]);

    // Calculate revenue stats (need to scan users for this)
    // Use pagination to prevent unbounded reads
    const BATCH_SIZE = 1000;
    let lastDoc = null;
    let smsSubscribers = 0;
    let donorsActive = 0;
    let totalDonations = 0;

    while (true) {
      let usersQuery = db.collection('users').limit(BATCH_SIZE);
      if (lastDoc) {
        usersQuery = usersQuery.startAfter(lastDoc);
      }

      const usersSnapshot = await usersQuery.get();

      if (usersSnapshot.empty) {
        break;
      }

      usersSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.smsSubscription?.active) smsSubscribers++;
        if (data.donationStats?.isActive) donorsActive++;
        if (data.donationStats?.totalDonated) totalDonations += data.donationStats.totalDonated;
      });

      lastDoc = usersSnapshot.docs[usersSnapshot.docs.length - 1];

      // If we got fewer than BATCH_SIZE, we're done
      if (usersSnapshot.size < BATCH_SIZE) {
        break;
      }
    }

    // Count templates and badges
    const [templatesCount, badgesCount] = await Promise.all([
      db.collection('templates').count().get(),
      db.collection('badges').count().get(),
    ]);

    // Build the cache document
    const cacheData = {
      // User stats
      totalUsers,

      // Check-in stats
      totalCheckIns: totalCheckInsCount.data()?.count || 0,
      activeCheckIns: activeCheckInsCount.data()?.count || 0,
      completedCheckIns: completedCheckInsCount.data()?.count || 0,
      alertedCheckIns: alertedCheckInsCount.data()?.count || 0,

      // Bestie stats
      totalBesties: totalBestiesCount.data()?.count || 0,
      pendingBesties: pendingBestiesCount.data()?.count || 0,
      acceptedBesties: acceptedBestiesCount.data()?.count || 0,

      // Revenue stats
      smsSubscribers,
      donorsActive,
      totalDonations,

      // Engagement stats
      totalTemplates: templatesCount.data()?.count || 0,
      totalBadges: badgesCount.data()?.count || 0,

      // Metadata
      lastUpdated: admin.firestore.Timestamp.now(),
      lastRebuild: admin.firestore.Timestamp.now(),
      rebuiltBy: context.auth.uid,
    };

    // Write to analytics_cache
    await db.collection('analytics_cache').doc('realtime').set(cacheData);

    functions.logger.info('✅ Analytics cache rebuilt successfully', { cacheData });

    return {
      success: true,
      cache: cacheData,
      message: 'Analytics cache rebuilt successfully',
    };
  } catch (error) {
    functions.logger.error('❌ Error rebuilding analytics cache:', error);
    throw new functions.https.HttpsError('internal', 'Failed to rebuild cache: ' + error.message);
  }
});
