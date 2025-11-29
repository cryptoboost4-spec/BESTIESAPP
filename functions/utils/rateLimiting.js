/**
 * Rate limiting utility for Cloud Functions
 * Provides standardized rate limiting using Firestore to track request counts
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * Rate limit configuration
 */
const RATE_LIMITS = {
  // Emergency functions
  SOS_PER_HOUR: { count: 3, window: 60 * 60 * 1000 }, // 3 per hour
  
  // Bestie functions
  BESTIE_INVITES_PER_DAY: { count: 20, window: 24 * 60 * 60 * 1000 }, // 20 per day
  BESTIE_REQUESTS_PER_HOUR: { count: 10, window: 60 * 60 * 1000 }, // 10 per hour
  
  // Check-in functions
  CHECKINS_PER_HOUR: { count: 30, window: 60 * 60 * 1000 }, // 30 per hour
  CHECKIN_EXTENSIONS_PER_HOUR: { count: 10, window: 60 * 60 * 1000 }, // 10 per hour
  
  // General functions
  FUNCTION_CALLS_PER_MINUTE: { count: 60, window: 60 * 1000 }, // 60 per minute
  FUNCTION_CALLS_PER_HOUR: { count: 200, window: 60 * 60 * 1000 }, // 200 per hour
};

/**
 * Check rate limit for a user-based function
 * @param {string} userId - User ID
 * @param {string} functionName - Name of the function (for tracking)
 * @param {Object} limit - Limit configuration { count, window }
 * @param {string} collectionName - Optional: collection to query (defaults to function name)
 * @param {string} userIdField - Optional: field name for userId (defaults to 'userId')
 * @param {string} timestampField - Optional: field name for timestamp (defaults to 'createdAt')
 * @returns {Promise<{allowed: boolean, count: number, limit: number, resetAt: Date}>}
 */
async function checkUserRateLimit(
  userId,
  functionName,
  limit,
  collectionName = null,
  userIdField = 'userId',
  timestampField = 'createdAt'
) {
  const collection = collectionName || functionName;
  const windowStart = new Date(Date.now() - limit.window);
  
  // Query for recent requests
  const recentRequests = await db.collection(collection)
    .where(userIdField, '==', userId)
    .where(timestampField, '>=', admin.firestore.Timestamp.fromDate(windowStart))
    .get();
  
  const count = recentRequests.size;
  const resetAt = new Date(Date.now() + limit.window);
  
  return {
    allowed: count < limit.count,
    count,
    limit: limit.count,
    resetAt,
    remaining: Math.max(0, limit.count - count),
  };
}

/**
 * Check rate limit using a dedicated rate_limits collection (for IP-based or general limiting)
 * @param {string} identifier - User ID, IP address, or other identifier
 * @param {string} functionName - Name of the function
 * @param {Object} limit - Limit configuration { count, window }
 * @returns {Promise<{allowed: boolean, count: number, limit: number, resetAt: Date}>}
 */
async function checkRateLimit(identifier, functionName, limit) {
  const rateLimitKey = `${functionName}_${identifier}`;
  const rateLimitRef = db.collection('rate_limits').doc(rateLimitKey);
  
  const now = Date.now();
  const windowStart = now - limit.window;
  
  const rateLimitDoc = await rateLimitRef.get();
  
  if (!rateLimitDoc.exists) {
    // First request - create rate limit document
    await rateLimitRef.set({
      count: 1,
      firstRequest: admin.firestore.Timestamp.now(),
      lastRequest: admin.firestore.Timestamp.now(),
    });
    
    return {
      allowed: true,
      count: 1,
      limit: limit.count,
      resetAt: new Date(now + limit.window),
      remaining: limit.count - 1,
    };
  }
  
  const data = rateLimitDoc.data();
  const firstRequestTime = data.firstRequest.toMillis();
  
  // Check if window has expired
  if (firstRequestTime < windowStart) {
    // Window expired - reset
    await rateLimitRef.set({
      count: 1,
      firstRequest: admin.firestore.Timestamp.now(),
      lastRequest: admin.firestore.Timestamp.now(),
    });
    
    return {
      allowed: true,
      count: 1,
      limit: limit.count,
      resetAt: new Date(now + limit.window),
      remaining: limit.count - 1,
    };
  }
  
  // Window still active - increment count
  const newCount = data.count + 1;
  await rateLimitRef.update({
    count: newCount,
    lastRequest: admin.firestore.Timestamp.now(),
  });
  
  const resetAt = new Date(firstRequestTime + limit.window);
  
  return {
    allowed: newCount <= limit.count,
    count: newCount,
    limit: limit.count,
    resetAt,
    remaining: Math.max(0, limit.count - newCount),
  };
}

/**
 * Middleware function to enforce rate limiting on a Cloud Function
 * @param {string} functionName - Name of the function
 * @param {Object} limit - Limit configuration
 * @param {Function} getIdentifier - Function to get identifier (userId, IP, etc.)
 * @param {string} collectionName - Optional: collection to query
 * @param {string} userIdField - Optional: field name for userId
 * @param {string} timestampField - Optional: field name for timestamp
 * @returns {Function} Middleware function
 */
function rateLimitMiddleware(
  functionName,
  limit,
  getIdentifier = null,
  collectionName = null,
  userIdField = 'userId',
  timestampField = 'createdAt'
) {
  return async (data, context) => {
    let identifier;
    
    if (getIdentifier) {
      identifier = getIdentifier(data, context);
    } else if (context && context.auth) {
      identifier = context.auth.uid;
    } else {
      // For HTTP requests, try to get IP
      identifier = context?.rawRequest?.ip || 
                   context?.rawRequest?.headers?.['x-forwarded-for'] || 
                   'anonymous';
    }
    
    let rateLimitResult;
    
    if (collectionName) {
      // Use collection-based rate limiting (for user-based functions)
      rateLimitResult = await checkUserRateLimit(
        identifier,
        functionName,
        limit,
        collectionName,
        userIdField,
        timestampField
      );
    } else {
      // Use rate_limits collection
      rateLimitResult = await checkRateLimit(identifier, functionName, limit);
    }
    
    if (!rateLimitResult.allowed) {
      const resetIn = Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 1000);
      throw new functions.https.HttpsError(
        'resource-exhausted',
        `Rate limit exceeded. Limit: ${rateLimitResult.limit} per ${Math.ceil(limit.window / 1000 / 60)} minutes. Try again in ${resetIn} seconds.`,
        {
          limit: rateLimitResult.limit,
          count: rateLimitResult.count,
          resetAt: rateLimitResult.resetAt.toISOString(),
        }
      );
    }
    
    return rateLimitResult;
  };
}

/**
 * Helper to get IP address from HTTP request
 */
function getClientIP(req) {
  return req?.ip || 
         req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || 
         req?.connection?.remoteAddress || 
         'unknown';
}

module.exports = {
  RATE_LIMITS,
  checkUserRateLimit,
  checkRateLimit,
  rateLimitMiddleware,
  getClientIP,
};

