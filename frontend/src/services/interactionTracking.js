import { db } from './firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

/**
 * Interaction Tracking Service
 *
 * Tracks interactions between users for Living Circle metrics:
 * - Alert responses (for "Show Up Factor")
 * - Check-in interactions (for "Staying Current")
 * - Profile views (for "Staying Current")
 */

/**
 * Log an alert response
 * Called when a bestie views or responds to an alert
 */
export const logAlertResponse = async (alertCheckInId, userId, responderId) => {
  try {
    // Check if response already exists (avoid duplicates)
    const existingQuery = query(
      collection(db, 'alert_responses'),
      where('checkInId', '==', alertCheckInId),
      where('responderId', '==', responderId)
    );
    const existingSnap = await getDocs(existingQuery);

    if (!existingSnap.empty) {
      // Already logged this response
      return;
    }

    // Calculate response time from alert creation
    const checkInDoc = await getDocs(query(
      collection(db, 'checkins'),
      where('__name__', '==', alertCheckInId)
    ));

    if (checkInDoc.empty) return;

    const checkInData = checkInDoc.docs[0].data();
    const alertTime = checkInData.alertedAt || checkInData.alertTime;

    if (!alertTime) return;

    const responseTime = Date.now() - alertTime.toMillis(); // milliseconds

    // Create alert response record
    await addDoc(collection(db, 'alert_responses'), {
      checkInId: alertCheckInId,
      userId: userId, // Person who created the check-in
      responderId: responderId, // Person who responded
      responseTime: responseTime, // Time in milliseconds
      respondedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });

    console.log(`Alert response logged: ${responderId} responded to ${userId}'s alert in ${Math.round(responseTime / 1000)}s`);

    // Also log as a general interaction
    await logInteraction(userId, responderId, 'alert_response');
  } catch (error) {
    console.error('Error logging alert response:', error);
  }
};

/**
 * Log a general interaction between users
 * Called for check-ins, profile views, etc.
 */
export const logInteraction = async (userId, bestieId, type = 'general') => {
  try {
    await addDoc(collection(db, 'interactions'), {
      userId: userId,
      bestieId: bestieId,
      type: type, // 'check_in', 'profile_view', 'alert_response', 'general'
      createdAt: serverTimestamp(),
    });

    console.log(`Interaction logged: ${userId} <-> ${bestieId} (${type})`);
  } catch (error) {
    console.error('Error logging interaction:', error);
  }
};

/**
 * Log check-in interaction
 * Called when a check-in is created with besties
 */
export const logCheckInInteraction = async (userId, bestieIds) => {
  try {
    // Log interaction with each bestie
    const promises = bestieIds.map(bestieId =>
      logInteraction(userId, bestieId, 'check_in')
    );
    await Promise.all(promises);
  } catch (error) {
    console.error('Error logging check-in interactions:', error);
  }
};

/**
 * Log profile view interaction
 * Called when someone views another user's profile
 */
export const logProfileView = async (viewerId, profileOwnerId) => {
  try {
    // Don't log if viewing own profile
    if (viewerId === profileOwnerId) return;

    await logInteraction(profileOwnerId, viewerId, 'profile_view');
  } catch (error) {
    console.error('Error logging profile view:', error);
  }
};

/**
 * Increment emergency contact selection counter
 * Called when someone is selected as emergency contact in a check-in
 */
export const incrementEmergencyContactCount = async (bestieId) => {
  try {
    const userRef = doc(db, 'users', bestieId);

    // Get current count
    const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', bestieId)));
    if (userDoc.empty) return;

    const userData = userDoc.docs[0].data();
    const currentCount = userData.stats?.timesSelectedAsEmergencyContact || 0;

    // Increment
    await updateDoc(userRef, {
      'stats.timesSelectedAsEmergencyContact': currentCount + 1,
    });

    console.log(`Emergency contact count incremented for ${bestieId}: ${currentCount + 1}`);
  } catch (error) {
    console.error('Error incrementing emergency contact count:', error);
  }
};

export default {
  logAlertResponse,
  logInteraction,
  logCheckInInteraction,
  logProfileView,
  incrementEmergencyContactCount,
};
