import { db } from './firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';

/**
 * Connection Energy Service
 *
 * Calculates connection energy between besties based on actual behavior:
 * - Alert response times (how quickly they show up)
 * - Circle stories engagement (viewing, reactions)
 * - Featured circle inclusion
 * - Recent interaction recency
 *
 * Returns a score from 0-100 where:
 * - 90-100: Unbreakable 🔥 (ultimate connection)
 * - 70-89: Powerful ⚡ (incredible bond)
 * - 50-69: Strong 💪 (solid connection)
 * - 30-49: Growing 🔆 (building momentum)
 * - 0-29: Spark 🌱 (just starting)
 */

const ONE_DAY = 24 * 60 * 60 * 1000;
const ONE_WEEK = 7 * ONE_DAY;
const ONE_MONTH = 30 * ONE_DAY;

/**
 * Calculate comprehensive connection strength between two users
 */
export const calculateConnectionStrength = async (userId, bestieId) => {
  try {
    const scores = {
      alertResponse: 0,      // 50 points - most important
      storyEngagement: 0,    // 25 points - viewing/reacting to stories
      featuredCircle: 0,     // 15 points
      recency: 0,            // 10 points
    };

    // Run all calculations in parallel for speed
    const [
      alertResponseScore,
      storyEngagementScore,
      featuredCircleScore,
      recencyScore,
    ] = await Promise.all([
      calculateAlertResponseScore(userId, bestieId),
      calculateStoryEngagementScore(userId, bestieId),
      calculateFeaturedCircleScore(userId, bestieId),
      calculateRecencyScore(userId, bestieId),
    ]);

    scores.alertResponse = alertResponseScore;
    scores.storyEngagement = storyEngagementScore;
    scores.featuredCircle = featuredCircleScore;
    scores.recency = recencyScore;

    const totalScore = Math.round(
      scores.alertResponse +
      scores.storyEngagement +
      scores.featuredCircle +
      scores.recency
    );

    return {
      total: Math.min(100, totalScore),
      breakdown: scores,
      level: getConnectionLevel(totalScore),
    };
  } catch (error) {
    console.error('Error calculating connection energy:', error);
    return {
      total: 0,
      breakdown: {},
      level: 'spark',
    };
  }
};

/**
 * Alert Response Score (0-50 points)
 * The most important metric - do they show up when you need them?
 */
const calculateAlertResponseScore = async (userId, bestieId) => {
  try {
    // Get all alert responses where bestieId responded to userId's alerts
    const responsesQuery = query(
      collection(db, 'alert_responses'),
      where('userId', '==', userId),
      where('responderId', '==', bestieId)
    );
    const responsesSnap = await getDocs(responsesQuery);

    if (responsesSnap.empty) {
      return 0; // No history yet - that's okay, we're just starting
    }

    const responses = responsesSnap.docs.map(doc => doc.data());

    // Calculate average response time (in minutes)
    const avgResponseTime = responses.reduce((sum, r) => sum + r.responseTime, 0) / responses.length / 60;

    // Score based on response time (0-35 points)
    let timeScore = 0;
    if (avgResponseTime < 5) timeScore = 35;        // < 5 min: instant
    else if (avgResponseTime < 15) timeScore = 30;  // < 15 min: very fast
    else if (avgResponseTime < 30) timeScore = 25;  // < 30 min: fast
    else if (avgResponseTime < 60) timeScore = 18;  // < 1 hour: decent
    else if (avgResponseTime < 180) timeScore = 10; // < 3 hours: slow
    else timeScore = 5;                             // > 3 hours: very slow

    // Bonus for response count (0-15 points for reliability)
    const reliabilityScore = Math.min(15, responses.length * 2);

    return timeScore + reliabilityScore;
  } catch (error) {
    console.error('Error calculating alert response score:', error);
    return 0;
  }
};

/**
 * Story Engagement Score (0-25 points)
 * Do they view and react to each other's circle stories?
 *
 * NOTE: This feature is not yet implemented. Returns 0 for now.
 * Will be enabled when Circle Stories feature is launched.
 */
const calculateStoryEngagementScore = async (userId, bestieId) => {
  // TODO: Implement when Circle Stories feature is ready
  // For now, return 0 so we don't query non-existent collections
  return 0;

  /* Future implementation:
  try {
    const oneMonthAgo = Timestamp.fromDate(new Date(Date.now() - 30 * ONE_DAY));

    const viewsQuery = query(
      collection(db, 'circle_story_views'),
      where('storyOwnerId', '==', userId),
      where('viewerId', '==', bestieId),
      where('viewedAt', '>=', oneMonthAgo)
    );
    const viewsSnap = await getDocs(viewsQuery);

    const reverseViewsQuery = query(
      collection(db, 'circle_story_views'),
      where('storyOwnerId', '==', bestieId),
      where('viewerId', '==', userId),
      where('viewedAt', '>=', oneMonthAgo)
    );
    const reverseViewsSnap = await getDocs(reverseViewsQuery);

    const reactionsQuery = query(
      collection(db, 'circle_story_reactions'),
      where('storyOwnerId', '==', userId),
      where('reactorId', '==', bestieId),
      where('createdAt', '>=', oneMonthAgo)
    );
    const reactionsSnap = await getDocs(reactionsQuery);

    const reverseReactionsQuery = query(
      collection(db, 'circle_story_reactions'),
      where('storyOwnerId', '==', bestieId),
      where('reactorId', '==', userId),
      where('createdAt', '>=', oneMonthAgo)
    );
    const reverseReactionsSnap = await getDocs(reverseReactionsQuery);

    const totalViews = viewsSnap.size + reverseViewsSnap.size;
    const totalReactions = reactionsSnap.size + reverseReactionsSnap.size;

    let viewScore = Math.min(10, totalViews);
    let reactionScore = Math.min(15, totalReactions * 2);

    return viewScore + reactionScore;
  } catch (error) {
    console.error('Error calculating story engagement score:', error);
    return 0;
  }
  */
};

/**
 * Featured Circle Score (0-15 points)
 * Are they in each other's top 5?
 */
const calculateFeaturedCircleScore = async (userId, bestieId) => {
  try {
    const [userDoc, bestieDoc] = await Promise.all([
      getDoc(doc(db, 'users', userId)),
      getDoc(doc(db, 'users', bestieId))
    ]);

    const userCircle = userDoc.exists() ? (userDoc.data().featuredCircle || []) : [];
    const bestieCircle = bestieDoc.exists() ? (bestieDoc.data().featuredCircle || []) : [];

    const inUserCircle = userCircle.includes(bestieId);
    const inBestieCircle = bestieCircle.includes(userId);

    // Scoring (0-15 points)
    if (inUserCircle && inBestieCircle) return 15; // Mutual top 5 - best case
    if (inUserCircle) return 9; // In your top 5
    if (inBestieCircle) return 8; // You're in their top 5
    return 0;
  } catch (error) {
    console.error('Error calculating featured circle score:', error);
    return 0;
  }
};

/**
 * Recency Score (0-10 points)
 * How recently have they interacted?
 */
const calculateRecencyScore = async (userId, bestieId) => {
  try {
    // Get most recent interaction of any type
    const interactionsQuery = query(
      collection(db, 'interactions'),
      where('userId', '==', userId),
      where('bestieId', '==', bestieId),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const interactionsSnap = await getDocs(interactionsQuery);

    // Also check reverse direction
    const reverseQuery = query(
      collection(db, 'interactions'),
      where('userId', '==', bestieId),
      where('bestieId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const reverseSnap = await getDocs(reverseQuery);

    // Get most recent from either direction
    let lastInteraction = null;

    if (!interactionsSnap.empty) {
      lastInteraction = interactionsSnap.docs[0].data().createdAt;
    }

    if (!reverseSnap.empty) {
      const reverseDate = reverseSnap.docs[0].data().createdAt;
      if (!lastInteraction || reverseDate.toMillis() > lastInteraction.toMillis()) {
        lastInteraction = reverseDate;
      }
    }

    if (!lastInteraction) return 0;

    const daysSince = (Date.now() - lastInteraction.toMillis()) / ONE_DAY;

    // Score based on recency (0-10 points)
    if (daysSince < 1) return 10;      // Today - perfect
    if (daysSince < 3) return 8;       // Last 3 days - great
    if (daysSince < 7) return 6;       // This week - good
    if (daysSince < 14) return 4;      // Last 2 weeks - okay
    if (daysSince < 30) return 2;      // This month - getting stale
    return 0;                           // Over a month - needs attention
  } catch (error) {
    console.error('Error calculating recency score:', error);
    return 0;
  }
};

/**
 * Get connection level description
 */
const getConnectionLevel = (score) => {
  if (score >= 90) return 'unbreakable';
  if (score >= 70) return 'powerful';
  if (score >= 50) return 'strong';
  if (score >= 30) return 'growing';
  return 'spark';
};

/**
 * Get connection level color for UI
 */
export const getConnectionColor = (score) => {
  if (score >= 90) return '#10b981'; // green - unbreakable
  if (score >= 70) return '#3b82f6'; // blue - powerful
  if (score >= 50) return '#8b5cf6'; // purple - strong
  if (score >= 30) return '#f59e0b'; // orange - growing
  return '#ec4899'; // pink - spark (new connections!)
};

/**
 * Get connection level emoji
 */
export const getConnectionEmoji = (score) => {
  if (score >= 90) return '🔥';
  if (score >= 70) return '⚡';
  if (score >= 50) return '💪';
  if (score >= 30) return '🔆';
  return '🌱';
};

/**
 * Calculate Circle Health Score (0-100)
 * Overall health of the entire featured circle
 */
export const calculateCircleHealth = async (userId) => {
  try {
    // Get user's featured circle
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return { score: 0, insights: [] };

    const featuredCircle = userDoc.data().featuredCircle || [];

    if (featuredCircle.length === 0) {
      return {
        score: 0,
        insights: ['Add besties to your circle to start building connections'],
      };
    }

    // Calculate connection strength with each circle member
    const connectionPromises = featuredCircle.map(bestieId =>
      calculateConnectionStrength(userId, bestieId)
    );
    const connections = await Promise.all(connectionPromises);

    // Average connection strength
    const avgStrength = connections.reduce((sum, c) => sum + c.total, 0) / connections.length;

    // Penalties and bonuses
    let finalScore = avgStrength;

    // Penalty for incomplete circle (not having 5 besties)
    if (featuredCircle.length < 5) {
      finalScore *= (featuredCircle.length / 5);
    }

    // Generate insights
    const insights = generateCircleInsights(userId, connections, featuredCircle);

    return {
      score: Math.round(finalScore),
      avgConnectionStrength: Math.round(avgStrength),
      circleSize: featuredCircle.length,
      connections,
      insights,
    };
  } catch (error) {
    console.error('Error calculating circle health:', error);
    return { score: 0, insights: ['Error calculating circle health'] };
  }
};

/**
 * Generate actionable insights about circle health
 */
const generateCircleInsights = (userId, connections, featuredCircle) => {
  const insights = [];

  // Check for growing connections that could use more attention
  const growingConnections = connections.filter(c => c.total < 30);
  if (growingConnections.length > 0) {
    insights.push({
      type: 'tip',
      message: `${growingConnections.length} connection${growingConnections.length > 1 ? 's are' : ' is'} just getting started - keep building!`,
      action: 'reach_out',
    });
  }

  // Check for incomplete circle
  if (featuredCircle.length < 5) {
    insights.push({
      type: 'info',
      message: `Add ${5 - featuredCircle.length} more ${featuredCircle.length === 4 ? 'bestie' : 'besties'} to unlock full circle power`,
      action: 'add_besties',
    });
  }

  // Check for lack of recent interactions
  const staleConnections = connections.filter(c => c.breakdown.recency < 4);
  if (staleConnections.length > 0) {
    insights.push({
      type: 'tip',
      message: `${staleConnections.length} connection${staleConnections.length > 1 ? 's could' : ' could'} use some love - reach out today!`,
      action: 'post_story',
    });
  }

  // Celebrate powerful/unbreakable circle
  if (connections.every(c => c.total >= 70) && featuredCircle.length === 5) {
    insights.push({
      type: 'success',
      message: 'Your circle is unstoppable! This is what real connection looks like 🔥',
      action: null,
    });
  }

  return insights;
};

/**
 * Get last interaction time with a bestie
 */
export const getLastInteraction = async (userId, bestieId) => {
  try {
    // Check interactions collection
    const interactionsQuery = query(
      collection(db, 'interactions'),
      where('userId', '==', userId),
      where('bestieId', '==', bestieId),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const snap = await getDocs(interactionsQuery);

    if (!snap.empty) {
      return snap.docs[0].data().createdAt;
    }

    // Fallback: check check-ins
    const checkInQuery = query(
      collection(db, 'checkins'),
      where('userId', '==', userId),
      where('bestieIds', 'array-contains', bestieId),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const checkInSnap = await getDocs(checkInQuery);

    if (!checkInSnap.empty) {
      return checkInSnap.docs[0].data().createdAt;
    }

    return null;
  } catch (error) {
    console.error('Error getting last interaction:', error);
    return null;
  }
};

/**
 * Format time ago string
 */
export const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Never';

  const ms = Date.now() - timestamp.toMillis();
  const minutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(ms / ONE_DAY);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};
