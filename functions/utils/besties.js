/**
 * Bestie query utilities
 * Provides standardized functions for querying bestie relationships
 */

const admin = require('firebase-admin');
const db = admin.firestore();

/**
 * Get all bestie IDs for a user (both directions)
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @param {boolean} options.favoritesOnly - Only return favorite besties (in circle)
 * @param {boolean} options.acceptedOnly - Only return accepted besties (default: true)
 * @returns {Promise<string[]>} Array of bestie user IDs
 */
async function getUserBestieIds(userId, options = {}) {
  const { favoritesOnly = false, acceptedOnly = true } = options;
  
  const bestieIds = new Set();
  
  // Query where user is requester
  let query1 = db.collection('besties')
    .where('requesterId', '==', userId);
  
  if (acceptedOnly) {
    query1 = query1.where('status', '==', 'accepted');
  }
  
  if (favoritesOnly) {
    query1 = query1.where('isFavorite', '==', true);
  }
  
  const besties1 = await query1.get();
  besties1.forEach(doc => {
    bestieIds.add(doc.data().recipientId);
  });
  
  // Query where user is recipient
  let query2 = db.collection('besties')
    .where('recipientId', '==', userId);
  
  if (acceptedOnly) {
    query2 = query2.where('status', '==', 'accepted');
  }
  
  if (favoritesOnly) {
    query2 = query2.where('isFavorite', '==', true);
  }
  
  const besties2 = await query2.get();
  besties2.forEach(doc => {
    bestieIds.add(doc.data().requesterId);
  });
  
  return Array.from(bestieIds);
}

/**
 * Get all bestie documents for a user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of bestie documents with IDs
 */
async function getUserBesties(userId, options = {}) {
  const bestieIds = await getUserBestieIds(userId, options);
  
  if (bestieIds.length === 0) {
    return [];
  }
  
  // Batch fetch user documents (Firestore 'in' operator limit is 10)
  const BATCH_SIZE = 10;
  const besties = [];
  
  for (let i = 0; i < bestieIds.length; i += BATCH_SIZE) {
    const batch = bestieIds.slice(i, i + BATCH_SIZE);
    const userPromises = batch.map(bestieId => 
      db.collection('users').doc(bestieId).get()
    );
    const userDocs = await Promise.all(userPromises);
    
    userDocs.forEach((userDoc, index) => {
      if (userDoc.exists()) {
        besties.push({
          id: batch[index],
          ...userDoc.data()
        });
      }
    });
  }
  
  return besties;
}

/**
 * Check if two users are besties
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {Promise<boolean>} True if they are besties
 */
async function isBestie(userId1, userId2) {
  // Check both directions
  const [bestie1, bestie2] = await Promise.all([
    db.collection('besties')
      .where('requesterId', '==', userId1)
      .where('recipientId', '==', userId2)
      .where('status', '==', 'accepted')
      .limit(1)
      .get(),
    db.collection('besties')
      .where('requesterId', '==', userId2)
      .where('recipientId', '==', userId1)
      .where('status', '==', 'accepted')
      .limit(1)
      .get()
  ]);
  
  return !bestie1.empty || !bestie2.empty;
}

module.exports = {
  getUserBestieIds,
  getUserBesties,
  isBestie,
};

