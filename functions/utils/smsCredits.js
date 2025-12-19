const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { zonedTimeToUtc, utcToZonedTime } = require('date-fns-tz');

const db = admin.firestore();

/**
 * Calculate total available credits from all sources
 * Checks expiration dates and returns only valid credits
 */
async function getAvailableCredits(userId) {
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    return 0;
  }

  const userData = userDoc.data();
  const smsCredits = userData.smsCredits || {};
  const now = Date.now();

  // Check free credits expiration
  let freeCredits = smsCredits.freeCredits || 0;
  const freeExpiresAt = smsCredits.freeCreditsExpireAt?.toMillis();
  if (freeExpiresAt && now > freeExpiresAt) {
    freeCredits = 0;
    // Update document to clear expired credits
    await userRef.update({
      'smsCredits.freeCredits': 0
    });
  }

  // Check subscription credits expiration
  let subscriptionCredits = smsCredits.subscriptionCredits || 0;
  const subscriptionRenewsAt = smsCredits.subscriptionRenewsAt?.toMillis();
  if (subscriptionRenewsAt && now > subscriptionRenewsAt) {
    // Credits expired but subscription might still be active
    // Don't clear here - let refreshSubscriptionCredits handle it
    subscriptionCredits = Math.max(0, subscriptionCredits);
  }

  // Check extra purchased credits
  let extraCredits = 0;
  const extraPurchases = smsCredits.extraPurchases || [];
  const validPurchases = extraPurchases.filter(purchase => {
    const expiresAt = purchase.expiresAt?.toMillis();
    return expiresAt && now < expiresAt && purchase.creditsRemaining > 0;
  });

  extraCredits = validPurchases.reduce((sum, purchase) => {
    return sum + (purchase.creditsRemaining || 0);
  }, 0);

  // Calculate total balance
  const balance = freeCredits + subscriptionCredits + extraCredits;

  return balance;
}

/**
 * Deduct 1 credit from user's balance
 * Priority: Oldest credits first (by expiration date)
 * Returns: { success: boolean, creditType: string, newBalance: number, error?: string }
 */
async function deductCredit(userId, alertType, recipientId) {
  const userRef = db.collection('users').doc(userId);

  // Use transaction to ensure atomicity
  let retries = 3;
  let lastError = null;

  while (retries > 0) {
    try {
      const result = await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
          throw new Error('User not found');
        }

        const userData = userDoc.data();
        const smsCredits = userData.smsCredits || {};
        const now = Date.now();

        // Get available credits
        let freeCredits = smsCredits.freeCredits || 0;
        const freeExpiresAt = smsCredits.freeCreditsExpireAt?.toMillis();
        if (freeExpiresAt && now > freeExpiresAt) {
          freeCredits = 0;
        }

        let subscriptionCredits = smsCredits.subscriptionCredits || 0;
        const subscriptionRenewsAt = smsCredits.subscriptionRenewsAt?.toMillis();
        if (subscriptionRenewsAt && now > subscriptionRenewsAt) {
          subscriptionCredits = Math.max(0, subscriptionCredits);
        }

        const extraPurchases = smsCredits.extraPurchases || [];
        const validPurchases = extraPurchases
          .map((purchase, index) => ({
            ...purchase,
            index,
            expiresAt: purchase.expiresAt?.toMillis()
          }))
          .filter(p => p.expiresAt && now < p.expiresAt && p.creditsRemaining > 0)
          .sort((a, b) => a.expiresAt - b.expiresAt); // Oldest first

        // Determine which credit pool to use (oldest expiration first)
        let creditType = null;
        let newBalance = 0;

        // Priority: Free credits (oldest expiration) → Subscription → Extra (oldest purchase)
        const freeExpires = freeExpiresAt || Infinity;
        const subExpires = subscriptionRenewsAt || Infinity;
        const extraExpires = validPurchases.length > 0 ? validPurchases[0].expiresAt : Infinity;

        const oldestExpiration = Math.min(freeExpires, subExpires, extraExpires);

        if (oldestExpiration === freeExpires && freeCredits > 0) {
          // Deduct from free credits
          creditType = 'free';
          freeCredits--;
          transaction.update(userRef, {
            'smsCredits.freeCredits': admin.firestore.FieldValue.increment(-1),
            'smsCredits.balance': admin.firestore.FieldValue.increment(-1),
            'smsCredits.totalUsed': admin.firestore.FieldValue.increment(1),
            'smsCredits.currentCycleUsed': admin.firestore.FieldValue.increment(1),
            'smsCredits.lastUsedAt': admin.firestore.Timestamp.now()
          });
        } else if (oldestExpiration === subExpires && subscriptionCredits > 0) {
          // Deduct from subscription credits
          creditType = 'subscription';
          subscriptionCredits--;
          transaction.update(userRef, {
            'smsCredits.subscriptionCredits': admin.firestore.FieldValue.increment(-1),
            'smsCredits.balance': admin.firestore.FieldValue.increment(-1),
            'smsCredits.totalUsed': admin.firestore.FieldValue.increment(1),
            'smsCredits.currentCycleUsed': admin.firestore.FieldValue.increment(1),
            'smsCredits.lastUsedAt': admin.firestore.Timestamp.now()
          });
        } else if (validPurchases.length > 0 && validPurchases[0].creditsRemaining > 0) {
          // Deduct from oldest extra purchase
          creditType = 'extra';
          const purchaseIndex = validPurchases[0].index;
          const currentPurchases = [...extraPurchases];
          currentPurchases[purchaseIndex].creditsRemaining--;

          transaction.update(userRef, {
            'smsCredits.extraPurchases': currentPurchases,
            'smsCredits.extraCredits': admin.firestore.FieldValue.increment(-1),
            'smsCredits.balance': admin.firestore.FieldValue.increment(-1),
            'smsCredits.totalUsed': admin.firestore.FieldValue.increment(1),
            'smsCredits.currentCycleUsed': admin.firestore.FieldValue.increment(1),
            'smsCredits.lastUsedAt': admin.firestore.Timestamp.now()
          });
        } else {
          throw new Error('INSUFFICIENT_SMS_CREDITS');
        }

        // Calculate new balance
        const remainingFree = freeCredits - (creditType === 'free' ? 1 : 0);
        const remainingSub = subscriptionCredits - (creditType === 'subscription' ? 1 : 0);
        const remainingExtra = validPurchases.reduce((sum, p) => {
          if (creditType === 'extra' && p.index === validPurchases[0].index) {
            return sum + (p.creditsRemaining - 1);
          }
          return sum + p.creditsRemaining;
        }, 0);

        newBalance = remainingFree + remainingSub + remainingExtra;

        return { success: true, creditType, newBalance };
      });

      return result;
    } catch (error) {
      lastError = error;
      retries--;
      if (retries > 0) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, 3 - retries) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed - log to admin_alerts
  await db.collection('admin_alerts').add({
    type: 'sms_credit_deduction_failed',
    userId,
    recipientId,
    alertType,
    error: lastError.message,
    timestamp: admin.firestore.Timestamp.now(),
    resolved: false
  });

  return {
    success: false,
    error: lastError.message,
    creditType: null,
    newBalance: 0
  };
}

/**
 * Grant free promotional credits
 * Sets freeCredits and expiration (1 month from now)
 */
async function grantFreeCredits(userId, amount) {
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new Error('User not found');
  }

  const now = Date.now();
  const oneMonthFromNow = new Date(now + 30 * 24 * 60 * 60 * 1000);

  const currentData = userDoc.data();
  const currentFreeCredits = currentData.smsCredits?.freeCredits || 0;
  const currentExpiresAt = currentData.smsCredits?.freeCreditsExpireAt?.toMillis();

  // If existing free credits haven't expired, add to them
  // Otherwise, set new expiration
  const newExpiresAt = (currentExpiresAt && currentExpiresAt > now)
    ? admin.firestore.Timestamp.fromMillis(currentExpiresAt)
    : admin.firestore.Timestamp.fromDate(oneMonthFromNow);

  await userRef.update({
    'smsCredits.freeCredits': admin.firestore.FieldValue.increment(amount),
    'smsCredits.freeCreditsGrantedAt': admin.firestore.Timestamp.now(),
    'smsCredits.freeCreditsExpireAt': newExpiresAt,
    'smsCredits.balance': admin.firestore.FieldValue.increment(amount)
  });

  functions.logger.info('Free SMS credits granted', { userId, amount });
}

/**
 * Refresh subscription credits on renewal
 * Called by cron job on subscription anniversary (timezone-aware)
 * Uses user's timezone to calculate midnight on anniversary
 */
async function refreshSubscriptionCredits(userId) {
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new Error('User not found');
  }

  const userData = userDoc.data();
  const smsSubscription = userData.smsSubscription || {};
  const timezone = userData.timezone || 'UTC';

  if (!smsSubscription.active) {
    functions.logger.warn('Cannot refresh credits for inactive subscription', { userId });
    return;
  }

  const startedAt = smsSubscription.startedAt?.toDate();
  if (!startedAt) {
    functions.logger.warn('No subscription start date found', { userId });
    return;
  }

  // Calculate next renewal date (1 month from now, at midnight in user's timezone)
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  // Get midnight in user's timezone for next month
  const zonedDate = utcToZonedTime(nextMonth, timezone);
  zonedDate.setHours(0, 0, 0, 0);
  const midnightInTimezone = zonedTimeToUtc(zonedDate, timezone);

  await userRef.update({
    'smsCredits.subscriptionCredits': 15,
    'smsCredits.subscriptionRenewsAt': admin.firestore.Timestamp.fromDate(midnightInTimezone),
    'smsCredits.currentCycleUsed': 0,
    'smsCredits.balance': admin.firestore.FieldValue.increment(15)
  });

  functions.logger.info('Subscription credits refreshed', { userId, timezone, nextRenewal: midnightInTimezone });
}

/**
 * Add extra purchased credits
 * Called by Stripe webhook on one-time payment
 * Expiration = next subscription renewal date
 */
async function addExtraCredits(userId, amount, expiresAt) {
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new Error('User not found');
  }

  const newPurchase = {
    creditsGranted: amount,
    pricePaid: 1.50,
    purchasedAt: admin.firestore.Timestamp.now(),
    expiresAt: expiresAt,
    creditsRemaining: amount
  };

  const currentPurchases = userDoc.data().smsCredits?.extraPurchases || [];

  await userRef.update({
    'smsCredits.extraPurchases': admin.firestore.FieldValue.arrayUnion(newPurchase),
    'smsCredits.extraCredits': admin.firestore.FieldValue.increment(amount),
    'smsCredits.balance': admin.firestore.FieldValue.increment(amount)
  });

  functions.logger.info('Extra SMS credits added', { userId, amount });
}

/**
 * Expire old credits
 * Called by daily cron job
 */
async function expireOldCredits() {
  const now = Date.now();
  const usersSnapshot = await db.collection('users')
    .where('smsSubscription.active', '==', true)
    .get();

  let expiredCount = 0;

  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    const smsCredits = userData.smsCredits || {};
    let needsUpdate = false;
    const updates = {};

    // Check free credits expiration
    const freeExpiresAt = smsCredits.freeCreditsExpireAt?.toMillis();
    if (freeExpiresAt && now > freeExpiresAt && smsCredits.freeCredits > 0) {
      updates['smsCredits.freeCredits'] = 0;
      needsUpdate = true;
    }

    // Check subscription credits expiration (should be handled by refreshSubscriptionCredits, but double-check)
    const subscriptionRenewsAt = smsCredits.subscriptionRenewsAt?.toMillis();
    if (subscriptionRenewsAt && now > subscriptionRenewsAt && smsCredits.subscriptionCredits > 0) {
      // Don't clear here - let refreshSubscriptionCredits handle it on renewal
      // But we can log it
      functions.logger.warn('Subscription credits expired but not refreshed', {
        userId: userDoc.id,
        renewsAt: subscriptionRenewsAt
      });
    }

    // Check extra purchases expiration
    const extraPurchases = smsCredits.extraPurchases || [];
    const validPurchases = extraPurchases.filter(purchase => {
      const expiresAt = purchase.expiresAt?.toMillis();
      return expiresAt && now < expiresAt;
    });

    if (validPurchases.length !== extraPurchases.length) {
      updates['smsCredits.extraPurchases'] = validPurchases;
      needsUpdate = true;
    }

    if (needsUpdate) {
      await userDoc.ref.update(updates);
      expiredCount++;
    }
  }

  functions.logger.info('Expired old SMS credits', { usersUpdated: expiredCount });
  return expiredCount;
}

module.exports = {
  getAvailableCredits,
  deductCredit,
  grantFreeCredits,
  refreshSubscriptionCredits,
  addExtraCredits,
  expireOldCredits
};






