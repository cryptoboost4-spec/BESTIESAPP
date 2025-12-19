const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * Scheduled function to update connection scores for all users
 * Runs daily to cache connection strength calculations
 */
async function updateConnectionScores() {
  try {
    functions.logger.info('Starting connection score update...');

    // Get all users (in batches to avoid memory issues)
    const usersSnapshot = await db.collection('users')
      .limit(500) // Process 500 users at a time
      .get();

    if (usersSnapshot.empty) {
      functions.logger.info('No users found');
      return { processed: 0 };
    }

    let processed = 0;
    const updatePromises = [];

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      // Get user's besties
      const bestieIds = userData.bestieUserIds || [];
      if (bestieIds.length === 0) {
        continue; // Skip users with no besties
      }

      // Calculate connection score for each bestie
      const connectionScores = {};
      let highestScore = 0;
      let strongestBestieId = null;
      let strongestBestieName = null;

      for (const bestieId of bestieIds) {
        try {
          // Use existing connection strength algorithm
          // For now, we'll use a simplified calculation
          // In production, you'd import and use the actual algorithm from frontend/src/services/connectionStrength.js
          
          // Get bestie data
          const bestieDoc = await db.collection('users').doc(bestieId).get();
          if (!bestieDoc.exists()) continue;

          const bestieData = bestieDoc.data();

          // Calculate connection score (simplified version)
          // In production, use the full algorithm from connectionStrength.js
          let score = 0;

          // Check if in featured circle (20 points)
          const userFeaturedCircle = userData.featuredCircle || [];
          const bestieFeaturedCircle = bestieData.featuredCircle || [];
          if (userFeaturedCircle.includes(bestieId) && bestieFeaturedCircle.includes(userId)) {
            score += 20;
          } else if (userFeaturedCircle.includes(bestieId) || bestieFeaturedCircle.includes(userId)) {
            score += 12;
          }

          // Check recent interactions (15 points for recency)
          const interactionsQuery = await db.collection('interactions')
            .where('userId', '==', userId)
            .where('bestieId', '==', bestieId)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();

          if (!interactionsQuery.empty) {
            const lastInteraction = interactionsQuery.docs[0].data();
            const lastInteractionTime = lastInteraction.createdAt?.toMillis() || 0;
            const daysSince = (Date.now() - lastInteractionTime) / (1000 * 60 * 60 * 24);
            
            if (daysSince < 1) score += 15;
            else if (daysSince < 3) score += 12;
            else if (daysSince < 7) score += 8;
            else if (daysSince < 30) score += 4;
          }

          // Check alert responses (35 points - most important)
          const alertResponsesQuery = await db.collection('alert_responses')
            .where('responderId', '==', userId)
            .where('userId', '==', bestieId)
            .limit(10)
            .get();

          if (!alertResponsesQuery.empty) {
            let totalResponseTime = 0;
            let count = 0;
            alertResponsesQuery.forEach(doc => {
              const data = doc.data();
              if (data.responseTime) {
                totalResponseTime += data.responseTime;
                count++;
              }
            });

            if (count > 0) {
              const avgResponseTime = totalResponseTime / count;
              // Response time scoring (35 points max)
              if (avgResponseTime < 300) score += 20; // < 5 min
              else if (avgResponseTime < 900) score += 17; // < 15 min
              else if (avgResponseTime < 1800) score += 12; // < 30 min
              else score += 8; // > 30 min

              // Reliability bonus (15 points)
              if (count >= 5) score += 15;
              else if (count >= 3) score += 10;
              else if (count >= 1) score += 5;
            }
          }

          // Check-in frequency (25 points)
          const checkInsQuery = await db.collection('checkins')
            .where('userId', '==', userId)
            .where('bestieIds', 'array-contains', bestieId)
            .limit(100)
            .get();

          const checkInCount = checkInsQuery.size;
          if (checkInCount >= 20) score += 25;
          else if (checkInCount >= 10) score += 18;
          else if (checkInCount >= 5) score += 12;
          else if (checkInCount >= 1) score += 6;

          // Duration bonus (5 points)
          const relationshipStart = userData.createdAt?.toMillis() || Date.now();
          const daysSinceStart = (Date.now() - relationshipStart) / (1000 * 60 * 60 * 24);
          if (daysSinceStart >= 365) score += 5;
          else if (daysSinceStart >= 180) score += 4;
          else if (daysSinceStart >= 90) score += 3;
          else if (daysSinceStart >= 30) score += 2;

          // Cap at 100
          score = Math.min(100, score);

          connectionScores[bestieId] = score;

          // Track strongest connection
          if (score > highestScore) {
            highestScore = score;
            strongestBestieId = bestieId;
            strongestBestieName = bestieData.displayName || 'Bestie';
          }
        } catch (error) {
          functions.logger.warn(`Error calculating score for bestie ${bestieId}:`, error);
          // Continue with other besties
        }
      }

      // Update user document with cached scores
      if (Object.keys(connectionScores).length > 0) {
        const updateData = {
          'stats.connectionScores': connectionScores
        };

        if (strongestBestieId) {
          updateData['stats.strongestConnection'] = {
            bestieId: strongestBestieId,
            bestieName: strongestBestieName,
            score: highestScore
          };
        }

        updatePromises.push(
          userDoc.ref.update(updateData).catch(error => {
            functions.logger.error(`Error updating scores for user ${userId}:`, error);
          })
        );

        processed++;
      }
    }

    // Wait for all updates to complete
    await Promise.all(updatePromises);

    functions.logger.info(`Connection scores updated for ${processed} users`);
    return { processed };
  } catch (error) {
    functions.logger.error('Error in updateConnectionScores:', error);
    throw error;
  }
}

module.exports = updateConnectionScores;

