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
 * Connection Strength Service
 *
 * Calculates real connection strength between besties based on actual behavior:
 * - Alert response times
 * - Check-in selection frequency
 * - Featured circle inclusion
 * - Relationship duration
 * - Recent interaction recency
 *
 * Returns a score from 0-100 where:
 * - 90-100: Incredible connection (always there when needed)
 * - 70-89: Strong connection (consistently supportive)
 * - 50-69: Good connection (reliable but room for growth)
 * - 30-49: Developing connection (occasional interaction)
 * - 0-29: Weak connection (rarely interact)
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
      alertResponse: 0,      // 35 points - most important
      checkInFrequency: 0,   // 25 points
      featuredCircle: 0,     // 20 points
      recency: 0,            // 15 points
      duration: 0,           // 5 points
    };

    // Run all calculations in parallel for speed
    const [
      alertResponseScore,
      checkInFrequencyScore,
      featuredCircleScore,
      recencyScore,
      durationScore,
    ] = await Promise.all([
      calculateAlertResponseScore(userId, bestieId),
      calculateCheckInFrequencyScore(userId, bestieId),
      calculateFeaturedCircleScore(userId, bestieId),
      calculateRecencyScore(userId, bestieId),
      calculateDurationScore(userId, bestieId),
    ]);

    scores.alertResponse = alertResponseScore;
    scores.checkInFrequency = checkInFrequencyScore;
    scores.featuredCircle = featuredCircleScore;
    scores.recency = recencyScore;
    scores.duration = durationScore;

    const totalScore = Math.round(
      scores.alertResponse +
      scores.checkInFrequency +
      scores.featuredCircle +
      scores.recency +
      scores.duration
    );

    return {
      total: Math.min(100, totalScore),
      breakdown: scores,
      level: getConnectionLevel(totalScore),
    };
  } catch (error) {
    console.error('Error calculating connection strength:', error);
    return {
      total: 0,
      breakdown: {},
      level: 'unknown',
    };
  }
};

/**
 * Alert Response Score (0-35 points)
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
      // No alerts yet - check if they've been in check-ins together as a proxy
      const interactionsQuery = query(
        collection(db, 'interactions'),
        where('userId', '==', userId),
        where('bestieId', '==', bestieId),
        where('type', '==', 'check_in_together')
      );
      const interactionsSnap = await getDocs(interactionsQuery);

      // Give some credit for being selected as guardian
      return Math.min(15, interactionsSnap.size * 3);
    }

    const responses = responsesSnap.docs.map(doc => doc.data());

    // Calculate average response time (in minutes)
    const avgResponseTime = responses.reduce((sum, r) => sum + r.responseTime, 0) / responses.length / 60;

    // Score based on response time
    let timeScore = 0;
    if (avgResponseTime < 5) timeScore = 20;        // < 5 min: instant
    else if (avgResponseTime < 15) timeScore = 17;  // < 15 min: very fast
    else if (avgResponseTime < 30) timeScore = 14;  // < 30 min: fast
    else if (avgResponseTime < 60) timeScore = 10;  // < 1 hour: decent
    else if (avgResponseTime < 180) timeScore = 5;  // < 3 hours: slow
    else timeScore = 2;                             // > 3 hours: very slow

    // Bonus for response count (reliability)
    const reliabilityScore = Math.min(15, responses.length * 2);

    return timeScore + reliabilityScore;
  } catch (error) {
    console.error('Error calculating alert response score:', error);
    return 0;
  }
};

/**
 * Check-In Frequency Score (0-25 points)
 * How often do they include each other in check-ins?
 */
const calculateCheckInFrequencyScore = async (userId, bestieId) => {
  try {
    // Get check-ins where userId selected bestieId as guardian (last 90 days)
    const threeMonthsAgo = Timestamp.fromDate(new Date(Date.now() - 90 * ONE_DAY));

    const checkInsQuery = query(
      collection(db, 'checkins'),
      where('userId', '==', userId),
      where('bestieIds', 'array-contains', bestieId),
      where('createdAt', '>=', threeMonthsAgo)
    );
    const checkInsSnap = await getDocs(checkInsQuery);

    // Get reverse direction (bestieId selecting userId)
    const reverseCheckInsQuery = query(
      collection(db, 'checkins'),
      where('userId', '==', bestieId),
      where('bestieIds', 'array-contains', userId),
      where('createdAt', '>=', threeMonthsAgo)
    );
    const reverseCheckInsSnap = await getDocs(reverseCheckInsQuery);

    const userSelections = checkInsSnap.size;
    const bestieSelections = reverseCheckInsSnap.size;

    // Bidirectional is better - give bonus for mutual selection
    const totalSelections = userSelections + bestieSelections;
    const mutualBonus = Math.min(userSelections, bestieSelections) > 0 ? 5 : 0;

    // Score based on frequency
    let frequencyScore = 0;
    if (totalSelections >= 20) frequencyScore = 15;
    else if (totalSelections >= 10) frequencyScore = 12;
    else if (totalSelections >= 5) frequencyScore = 8;
    else if (totalSelections >= 2) frequencyScore = 5;
    else if (totalSelections >= 1) frequencyScore = 2;

    return frequencyScore + mutualBonus + Math.min(5, totalSelections);
  } catch (error) {
    console.error('Error calculating check-in frequency score:', error);
    return 0;
  }
};

/**
 * Featured Circle Score (0-20 points)
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

    // Scoring
    if (inUserCircle && inBestieCircle) return 20; // Mutual top 5
    if (inUserCircle) return 12; // In your top 5
    if (inBestieCircle) return 10; // You're in their top 5
    return 0;
  } catch (error) {
    console.error('Error calculating featured circle score:', error);
    return 0;
  }
};

/**
 * Recency Score (0-15 points)
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

    // If no interactions tracked yet, check most recent check-in together
    if (!lastInteraction) {
      const checkInQuery = query(
        collection(db, 'checkins'),
        where('userId', '==', userId),
        where('bestieIds', 'array-contains', bestieId),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      const checkInSnap = await getDocs(checkInQuery);

      if (!checkInSnap.empty) {
        lastInteraction = checkInSnap.docs[0].data().createdAt;
      }
    }

    if (!lastInteraction) return 0;

    const daysSince = (Date.now() - lastInteraction.toMillis()) / ONE_DAY;

    // Score based on recency
    if (daysSince < 1) return 15;      // Today
    if (daysSince < 3) return 12;      // Last 3 days
    if (daysSince < 7) return 9;       // This week
    if (daysSince < 14) return 6;      // Last 2 weeks
    if (daysSince < 30) return 3;      // This month
    return 1;                           // Over a month
  } catch (error) {
    console.error('Error calculating recency score:', error);
    return 0;
  }
};

/**
 * Duration Score (0-5 points)
 * How long have they been besties?
 */
const calculateDurationScore = async (userId, bestieId) => {
  try {
    // Find the bestie relationship
    const [requesterQuery, recipientQuery] = await Promise.all([
      getDocs(
        query(
          collection(db, 'besties'),
          where('requesterId', '==', userId),
          where('recipientId', '==', bestieId),
          where('status', '==', 'accepted')
        )
      ),
      getDocs(
        query(
          collection(db, 'besties'),
          where('requesterId', '==', bestieId),
          where('recipientId', '==', userId),
          where('status', '==', 'accepted')
        )
      ),
    ]);

    const bestieDoc = !requesterQuery.empty
      ? requesterQuery.docs[0]
      : !recipientQuery.empty
      ? recipientQuery.docs[0]
      : null;

    if (!bestieDoc) return 0;

    const acceptedAt = bestieDoc.data().acceptedAt;
    if (!acceptedAt) return 0;

    const daysTogether = (Date.now() - acceptedAt.toMillis()) / ONE_DAY;

    // Score based on duration
    if (daysTogether >= 365) return 5;  // 1+ year
    if (daysTogether >= 180) return 4;  // 6+ months
    if (daysTogether >= 90) return 3;   // 3+ months
    if (daysTogether >= 30) return 2;   // 1+ month
    if (daysTogether >= 7) return 1;    // 1+ week
    return 0;
  } catch (error) {
    console.error('Error calculating duration score:', error);
    return 0;
  }
};

/**
 * Get connection level description
 */
const getConnectionLevel = (score) => {
  if (score >= 90) return 'incredible';
  if (score >= 70) return 'strong';
  if (score >= 50) return 'good';
  if (score >= 30) return 'developing';
  return 'weak';
};

/**
 * Get connection level color for UI
 */
export const getConnectionColor = (score) => {
  if (score >= 90) return '#10b981'; // green
  if (score >= 70) return '#3b82f6'; // blue
  if (score >= 50) return '#f59e0b'; // orange
  if (score >= 30) return '#f97316'; // deep orange
  return '#94a3b8'; // gray
};

/**
 * Get connection level emoji
 */
export const getConnectionEmoji = (score) => {
  if (score >= 90) return '🔥';
  if (score >= 70) return '💪';
  if (score >= 50) return '👍';
  if (score >= 30) return '🌱';
  return '💤';
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

  // Check for weak connections
  const weakConnections = connections.filter(c => c.total < 30);
  if (weakConnections.length > 0) {
    insights.push({
      type: 'warning',
      message: `${weakConnections.length} connection${weakConnections.length > 1 ? 's' : ''} need attention`,
      action: 'reach_out',
    });
  }

  // Check for incomplete circle
  if (featuredCircle.length < 5) {
    insights.push({
      type: 'info',
      message: `Add ${5 - featuredCircle.length} more ${featuredCircle.length === 4 ? 'bestie' : 'besties'} to complete your circle`,
      action: 'add_besties',
    });
  }

  // Check for lack of recent interactions
  const staleConnections = connections.filter(c => c.breakdown.recency < 6);
  if (staleConnections.length > 0) {
    insights.push({
      type: 'tip',
      message: `${staleConnections.length} connection${staleConnections.length > 1 ? 's' : ''} haven't been active recently`,
      action: 'circle_check',
    });
  }

  // Celebrate strong circle
  if (connections.every(c => c.total >= 70) && featuredCircle.length === 5) {
    insights.push({
      type: 'success',
      message: 'Your circle is thriving! Keep up the great connections 🎉',
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
