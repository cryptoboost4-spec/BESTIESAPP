const admin = require('firebase-admin');

// Badge tier definitions
const BADGE_TIERS = {
  guardian: [
    { id: 'guardian_1', name: 'Helper', requirement: 1, icon: '🛡️' },
    { id: 'guardian_5', name: 'Protector', requirement: 5, icon: '🛡️✨' },
    { id: 'guardian_10', name: 'Guardian', requirement: 10, icon: '🛡️⭐' },
    { id: 'guardian_25', name: 'Guardian Angel', requirement: 25, icon: '👼' },
    { id: 'guardian_50', name: 'Safety Queen', requirement: 50, icon: '👑' }
  ],
  besties: [
    { id: 'besties_5', name: 'Friend Circle', requirement: 5, icon: '💜' },
    { id: 'besties_10', name: 'Squad Goals', requirement: 10, icon: '💜✨' },
    { id: 'besties_20', name: 'Community Leader', requirement: 20, icon: '💜⭐' }
  ],
  subscriber: [
    { id: 'subscriber_active', name: 'SMS Supporter', requirement: 1, icon: '⭐💝' }
  ],
  donor: [
    { id: 'donor_10', name: 'Donor', requirement: 10, icon: '💝' },
    { id: 'donor_25', name: 'Champion', requirement: 25, icon: '💝✨' },
    { id: 'donor_50', name: 'Hero', requirement: 50, icon: '💝⭐' },
    { id: 'donor_100', name: 'Legend', requirement: 100, icon: '👑💝' }
  ],
  checkins: [
    { id: 'checkin_10', name: 'Safety First', requirement: 10, icon: '✅' },
    { id: 'checkin_50', name: 'Safety Pro', requirement: 50, icon: '✅⭐' },
    { id: 'checkin_100', name: 'Safety Master', requirement: 100, icon: '👑✅' }
  ]
};

/**
 * Calculate and update user's badges
 */
async function updateUserBadges(userId) {
  try {
    const db = admin.firestore();
    
    // Get user stats
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData) {
      console.error('User not found:', userId);
      return;
    }

    // Count stats
    const stats = {
      // Guardian: How many people added this user as emergency contact
      guardianCount: await countGuardianBesties(userId),
      // Besties: Total besties this user has
      bestiesCount: await countTotalBesties(userId),
      // Subscriber: Active SMS subscription
      hasActiveSubscription: userData.smsSubscription?.active || false,
      // Donations: Total amount donated
      donationTotal: userData.donationStats?.totalDonated || 0,
      // Check-ins: Completed check-ins
      checkinCount: await countCompletedCheckIns(userId)
    };

    // Calculate earned badges
    const earnedBadges = [];

    // Guardian badges
    for (const badge of BADGE_TIERS.guardian) {
      if (stats.guardianCount >= badge.requirement) {
        earnedBadges.push({ ...badge, category: 'guardian', earnedAt: new Date() });
      }
    }

    // Bestie badges
    for (const badge of BADGE_TIERS.besties) {
      if (stats.bestiesCount >= badge.requirement) {
        earnedBadges.push({ ...badge, category: 'besties', earnedAt: new Date() });
      }
    }

    // Subscriber badge (for active SMS subscription)
    if (stats.hasActiveSubscription) {
      for (const badge of BADGE_TIERS.subscriber) {
        earnedBadges.push({ ...badge, category: 'subscriber', earnedAt: new Date() });
      }
    }

    // Donor badges
    for (const badge of BADGE_TIERS.donor) {
      if (stats.donationTotal >= badge.requirement) {
        earnedBadges.push({ ...badge, category: 'donor', earnedAt: new Date() });
      }
    }

    // Check-in badges
    for (const badge of BADGE_TIERS.checkins) {
      if (stats.checkinCount >= badge.requirement) {
        earnedBadges.push({ ...badge, category: 'checkins', earnedAt: new Date() });
      }
    }

    // Update badges document
    await db.collection('badges').doc(userId).set({
      userId,
      badges: earnedBadges,
      stats,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`Updated badges for user ${userId}:`, earnedBadges.length);
    
    return earnedBadges;

  } catch (error) {
    console.error('Error updating badges:', error);
    throw error;
  }
}

/**
 * Count how many people added this user as their emergency contact
 */
async function countGuardianBesties(userId) {
  const snapshot = await admin.firestore()
    .collection('besties')
    .where('recipientId', '==', userId)
    .where('status', '==', 'accepted')
    .get();
  return snapshot.size;
}

/**
 * Count total besties (both added and who added them)
 */
async function countTotalBesties(userId) {
  const [requesterSnapshot, recipientSnapshot] = await Promise.all([
    admin.firestore()
      .collection('besties')
      .where('requesterId', '==', userId)
      .where('status', '==', 'accepted')
      .get(),
    admin.firestore()
      .collection('besties')
      .where('recipientId', '==', userId)
      .where('status', '==', 'accepted')
      .get()
  ]);
  
  return requesterSnapshot.size + recipientSnapshot.size;
}

/**
 * Count completed check-ins
 */
async function countCompletedCheckIns(userId) {
  const snapshot = await admin.firestore()
    .collection('checkins')
    .where('userId', '==', userId)
    .where('status', '==', 'completed')
    .get();
  return snapshot.size;
}

/**
 * Check if user just earned a new badge
 */
async function checkForNewBadge(userId, previousCount, category) {
  const relevantTiers = BADGE_TIERS[category];
  if (!relevantTiers) return null;

  for (const badge of relevantTiers) {
    if (previousCount < badge.requirement && previousCount + 1 >= badge.requirement) {
      return badge;
    }
  }
  return null;
}

module.exports = {
  updateUserBadges,
  checkForNewBadge,
  BADGE_TIERS
};
