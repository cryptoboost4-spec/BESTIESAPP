const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

// Track when new users sign up (Firebase Auth trigger)
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
  // Update analytics cache
  const cacheRef = db.collection('analytics_cache').doc('realtime');
  await cacheRef.set({
    totalUsers: admin.firestore.FieldValue.increment(1),
    lastUpdated: admin.firestore.Timestamp.now(),
  }, { merge: true });

  // Initialize user document (moved from core/auth/onUserCreated.js)
  await db.collection('users').doc(user.uid).set({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email?.split('@')[0] || 'User',
    photoURL: user.photoURL || null,
    phoneNumber: user.phoneNumber || null,

    notificationPreferences: {
      whatsapp: false,
      sms: false,
      facebook: false,
      email: true
    },

    settings: {
      defaultBesties: [],
      dataRetention: 168, // 7 days in hours
      holdData: false
    },

    smsSubscription: {
      active: false,
      plan: null,
      startedAt: null
    },

    donationStats: {
      isActive: false,
      totalDonated: 0,
      monthlyAmount: 0,
      startedAt: null
    },

    stats: {
      totalCheckIns: 0,
      completedCheckIns: 0,
      alertedCheckIns: 0,
      totalBesties: 0,
      joinedAt: admin.firestore.Timestamp.now()
    },

    profile: {
      featuredBadges: [],
      bio: null
    },

    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    onboardingCompleted: false,
    featuredCircle: []
  });

  // Initialize badges document
  await db.collection('badges').doc(user.uid).set({
    userId: user.uid,
    badges: [],
    stats: {
      guardianCount: 0,
      bestiesCount: 0,
      donationTotal: 0,
      checkinCount: 0
    },
    createdAt: admin.firestore.Timestamp.now()
  });

  functions.logger.info('User created successfully:', user.uid);
});
