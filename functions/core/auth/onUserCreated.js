const admin = require('firebase-admin');

/**
 * Trigger: When a new user signs up
 * Creates user document in Firestore with default settings
 */
async function onUserCreated(user) {
  try {
    const userId = user.uid;
    const email = user.email;
    const displayName = user.displayName || email?.split('@')[0] || 'User';
    const photoURL = user.photoURL;

    // Create user document
    await admin.firestore().collection('users').doc(userId).set({
      uid: userId,
      email: email,
      displayName: displayName,
      photoURL: photoURL || null,
      phoneNumber: user.phoneNumber || null,
      
      // Default notification preferences
      notificationPreferences: {
        whatsapp: false,
        sms: false,
        facebook: false,
        email: true
      },
      
      // Default settings
      settings: {
        defaultBesties: [],
        dataRetention: 24, // hours
        holdData: false
      },
      
      // SMS subscription status
      smsSubscription: {
        active: false,
        plan: null,
        startedAt: null
      },
      
      // Donation status
      donationStats: {
        isActive: false,
        totalDonated: 0,
        monthlyAmount: 0,
        startedAt: null
      },
      
      // Stats
      stats: {
        totalCheckIns: 0,
        completedCheckIns: 0,
        totalBesties: 0,
        joinedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      
      // Profile
      profile: {
        featuredBadges: [],
        bio: null
      },
      
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Initialize badges document
    await admin.firestore().collection('badges').doc(userId).set({
      userId: userId,
      badges: [],
      stats: {
        guardianCount: 0,
        bestiesCount: 0,
        donationTotal: 0,
        checkinCount: 0
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('User created successfully:', userId);
    
    return { success: true, userId };
    
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

module.exports = onUserCreated;
