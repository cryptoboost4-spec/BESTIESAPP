import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { notificationService } from './notificationService';

/**
 * Check if user's profile is 100% complete
 * @param {object} userData - User data from Firestore
 * @param {object} currentUser - Firebase auth user
 * @param {number} bestiesCount - Number of accepted besties
 * @returns {boolean} - True if profile is 100% complete
 */
export const isProfileComplete = (userData, currentUser, bestiesCount) => {
  const hasEmail = !!currentUser?.email;
  const hasPhone = !!userData?.phoneNumber;
  const hasPhoto = !!userData?.photoURL;
  const hasBio = !!userData?.profile?.bio;
  const hasBesties = bestiesCount >= 5;

  return hasEmail && hasPhone && hasPhoto && hasBio && hasBesties;
};

/**
 * Award the Profile Perfectionist badge when profile is 100% complete
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - True if badge was awarded (first time), false if already had it
 */
export const awardProfileCompletionBadge = async (userId) => {
  try {
    const BADGE_ID = 'profile_perfectionist';
    const badgeDoc = await getDoc(doc(db, 'badges', userId));

    // Check if user already has this badge
    if (badgeDoc.exists()) {
      const existingBadges = badgeDoc.data().badges || [];
      const alreadyHasBadge = existingBadges.some(b => b.id === BADGE_ID);

      if (alreadyHasBadge) {
        return false; // Already has the badge, don't celebrate again
      }

      // Add the badge
      await updateDoc(doc(db, 'badges', userId), {
        badges: arrayUnion({
          id: BADGE_ID,
          name: 'Profile Perfectionist',
          description: 'Completed your full profile - ready to connect!',
          icon: '⭐',
          earnedAt: new Date(),
          category: 'profile'
        })
      });
    } else {
      // Create badges document with the profile completion badge
      await setDoc(doc(db, 'badges', userId), {
        badges: [{
          id: BADGE_ID,
          name: 'Profile Perfectionist',
          description: 'Completed your full profile - ready to connect!',
          icon: '⭐',
          earnedAt: new Date(),
          category: 'profile'
        }]
      });
    }

    // Send notification
    await notificationService.notifyBadgeEarned(
      userId,
      'Profile Perfectionist',
      'You completed your entire profile! You\'re all set to stay safe with your besties.'
    );

    return true; // Badge was awarded for the first time
  } catch (error) {
    console.error('Error awarding profile completion badge:', error);
    return false;
  }
};

/**
 * Check and award badge if profile becomes complete
 * This should be called after profile updates
 * @param {string} userId - User ID
 * @param {object} userData - Updated user data
 * @param {object} currentUser - Firebase auth user
 * @param {number} bestiesCount - Number of accepted besties
 * @returns {Promise<boolean>} - True if badge was awarded (trigger celebration!)
 */
export const checkAndAwardProfileCompletion = async (userId, userData, currentUser, bestiesCount) => {
  const profileComplete = isProfileComplete(userData, currentUser, bestiesCount);

  if (profileComplete) {
    const wasAwarded = await awardProfileCompletionBadge(userId);
    return wasAwarded; // Return true only if it's the first time
  }

  return false;
};

const profileCompletionService = {
  isProfileComplete,
  awardProfileCompletionBadge,
  checkAndAwardProfileCompletion
};

export default profileCompletionService;
