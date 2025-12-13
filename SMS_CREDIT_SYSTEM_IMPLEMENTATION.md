# SMS Credit System - Complete Implementation Specification

## 🎯 Overview

Transform the SMS notification system from subscription-based (unlimited SMS for $1/month) to a **credit-based system**:
- **Base Plan:** $2/month = 15 SMS credits (renews on subscription anniversary)
- **Extra Credits:** $1.50 = 15 additional SMS credits (only for active subscribers)
- **Free Credits:** 5 SMS credits for promotional purposes (1-month expiration)
- **1 Credit = 1 SMS message sent to 1 person**

## ⚠️ Critical Requirements

1. **SAFETY FIRST:** If user has 0 credits and only SMS-enabled besties, BLOCK check-in creation entirely
2. **NO BREAKING CHANGES:** All existing functionality must continue to work
3. **ATOMIC OPERATIONS:** Credit deduction must be transactional with SMS sending
4. **AUDIT TRAIL:** Track every SMS sent in separate collection
5. **STRIPE INTEGRATION:** Support both recurring subscriptions and one-time payments

---

## 📊 Database Schema Changes

### **File:** `DATABASE_SCHEMA.md`

**Add to users/{userId} document:**

```javascript
smsCredits: {
  // Credit balances (separate tracking)
  balance: 0,              // Total available credits (calculated field)
  freeCredits: 0,          // Promotional credits (expire after 1 month)
  subscriptionCredits: 0,  // From $2/month plan (expire on renewal)
  extraCredits: 0,         // From $1.50 purchases (expire on sub renewal)

  // Expiration tracking
  freeCreditsGrantedAt: Timestamp | null,     // When free credits were granted
  freeCreditsExpireAt: Timestamp | null,      // Free credits expire 1 month after grant
  subscriptionRenewsAt: Timestamp | null,     // When subscription credits refresh

  // Usage statistics
  totalUsed: 0,            // Lifetime SMS count
  currentCycleUsed: 0,     // SMS sent this billing cycle
  lastUsedAt: Timestamp | null,

  // Extra credit purchases (array of purchases)
  extraPurchases: [
    {
      creditsGranted: 15,
      pricePaid: 1.50,
      purchasedAt: Timestamp,
      expiresAt: Timestamp,  // Expires on next subscription renewal
      creditsRemaining: 10   // Track usage per purchase
    }
  ]
}

// Keep existing smsSubscription object (for Stripe management)
smsSubscription: {
  active: boolean,
  plan: 'sms_monthly_2' | null,  // Update plan name
  startedAt: Timestamp | null,
  stripeSubscriptionId: string | null,
  cancelledAt: Timestamp | null
}
```

### **New Collection:** `sms_usage` (audit trail)

```javascript
sms_usage/{docId}
{
  userId: string,           // Who sent the alert
  recipientId: string,      // Who received the SMS
  alertType: 'check_in' | 'emergency_sos' | 'duress_code',
  checkinId: string | null,
  sosId: string | null,

  // Credit tracking
  creditType: 'free' | 'subscription' | 'extra',  // Which pool was used
  creditsDeducted: 1,
  balanceAfter: number,

  // SMS details
  phoneNumber: string,      // Recipient phone (for debugging)
  twilioMessageSid: string | null,  // Twilio message ID
  sentAt: Timestamp,

  // Status
  status: 'sent' | 'failed' | 'deduction_failed',
  errorMessage: string | null
}
```

---

## 🔧 Backend Implementation

### **1. Core SMS Credit Functions**

**File:** `functions/utils/smsCredits.js` (NEW FILE)

Create helper functions for credit management:

```javascript
/**
 * Calculate total available credits from all sources
 * Checks expiration dates and returns only valid credits
 */
async function getAvailableCredits(userId)

/**
 * Deduct 1 credit from user's balance
 * Priority: Oldest credits first (by expiration date)
 * Returns: { success: boolean, creditType: string, newBalance: number }
 */
async function deductCredit(userId, alertType, recipientId)

/**
 * Grant free promotional credits
 * Sets freeCredits and expiration (1 month from now)
 */
async function grantFreeCredits(userId, amount)

/**
 * Refresh subscription credits on renewal
 * Called by cron job on subscription anniversary
 */
async function refreshSubscriptionCredits(userId)

/**
 * Add extra purchased credits
 * Called by Stripe webhook on one-time payment
 * Expiration = next subscription renewal date
 */
async function addExtraCredits(userId, amount, expiresAt)

/**
 * Expire old credits
 * Called by daily cron job
 */
async function expireOldCredits()
```

**Implementation Details:**

1. **getAvailableCredits:**
   - Check `freeCreditsExpireAt` - if expired, set `freeCredits = 0`
   - Check `subscriptionRenewsAt` - if passed and not renewed, set `subscriptionCredits = 0`
   - Loop through `extraPurchases`, remove expired ones
   - Calculate: `balance = freeCredits + subscriptionCredits + sum(extraPurchases.creditsRemaining)`

2. **deductCredit (CRITICAL - Must be atomic):**
   - Use Firestore transaction to ensure atomicity
   - Determine which credit pool to use (oldest expiration first):
     - If `freeCreditsExpireAt` is oldest → deduct from `freeCredits`
     - Else if `subscriptionRenewsAt` is oldest → deduct from `subscriptionCredits`
     - Else deduct from oldest `extraPurchases` entry
   - Update relevant field: `freeCredits--` or `subscriptionCredits--` or `extraPurchases[i].creditsRemaining--`
   - Increment `totalUsed` and `currentCycleUsed`
   - Set `lastUsedAt = now()`
   - Return new balance and credit type used

3. **Error Handling in deductCredit:**
   - If transaction fails, retry up to 3 times with exponential backoff (1s, 2s, 4s)
   - If still fails, log to `admin_alerts` collection for manual review
   - Return `{ success: false, error: 'message' }`

---

### **2. Modify SMS Sending Function**

**File:** `functions/utils/notifications.js`

**Function:** `sendSMSAlert(phoneNumber, message)`

**Current location:** Line 54-66

**Changes needed:**

```javascript
// BEFORE (current):
async function sendSMSAlert(phoneNumber, message) {
  const { client, phone } = getTwilioClient();
  return retryApiCall(
    async () => {
      return await client.messages.create({
        body: message,
        from: phone,
        to: phoneNumber,
      });
    },
    { operationName: `SMS to ${phoneNumber}` }
  );
}

// AFTER (new):
async function sendSMSAlert(phoneNumber, message, metadata = {}) {
  const { userId, recipientId, alertType, checkinId = null, sosId = null } = metadata;

  // STEP 1: Check if recipient requires credit deduction
  // (Only deduct if sending to a user who has SMS as notification channel)
  if (!userId || !recipientId) {
    throw new Error('SMS metadata required: userId and recipientId');
  }

  // STEP 2: Check available credits BEFORE sending
  const { getAvailableCredits } = require('./smsCredits');
  const availableCredits = await getAvailableCredits(userId);

  if (availableCredits < 1) {
    throw new Error('INSUFFICIENT_SMS_CREDITS');
  }

  // STEP 3: Send SMS via Twilio
  const { client, phone } = getTwilioClient();
  let twilioResponse;

  try {
    twilioResponse = await retryApiCall(
      async () => {
        return await client.messages.create({
          body: message,
          from: phone,
          to: phoneNumber,
        });
      },
      { operationName: `SMS to ${phoneNumber}` }
    );
  } catch (smsError) {
    functions.logger.error('Twilio SMS send failed:', smsError);
    throw smsError; // Don't deduct credit if SMS failed
  }

  // STEP 4: Deduct credit AFTER successful send
  const { deductCredit } = require('./smsCredits');
  const deductResult = await deductCredit(userId, alertType, recipientId);

  // STEP 5: Log to audit trail
  const auditData = {
    userId,
    recipientId,
    alertType,
    checkinId,
    sosId,
    creditType: deductResult.success ? deductResult.creditType : null,
    creditsDeducted: deductResult.success ? 1 : 0,
    balanceAfter: deductResult.success ? deductResult.newBalance : availableCredits,
    phoneNumber,
    twilioMessageSid: twilioResponse.sid,
    sentAt: admin.firestore.Timestamp.now(),
    status: deductResult.success ? 'sent' : 'deduction_failed',
    errorMessage: deductResult.success ? null : deductResult.error
  };

  await db.collection('sms_usage').add(auditData);

  // STEP 6: If deduction failed, alert admin
  if (!deductResult.success) {
    await db.collection('admin_alerts').add({
      type: 'sms_credit_deduction_failed',
      userId,
      recipientId,
      twilioMessageSid: twilioResponse.sid,
      error: deductResult.error,
      timestamp: admin.firestore.Timestamp.now(),
      resolved: false
    });

    functions.logger.error('Credit deduction failed but SMS sent:', {
      userId,
      twilioSid: twilioResponse.sid,
      error: deductResult.error
    });
  }

  return twilioResponse;
}
```

**Update all callsites of sendSMSAlert:**

1. **File:** `functions/index.js` (Line 1125 - scheduledSMS processor)
2. **File:** `functions/utils/notifications.js` (Lines 316, 322 - sendAlertToBesties)
3. **File:** `functions/core/emergency/triggerEmergencySOS.js` (Line 279)
4. **File:** `functions/core/emergency/onDuressCodeUsed.js` (Line 76)

**For each callsite, add metadata:**

```javascript
// Example for check-in alerts (functions/index.js:1125):
await sendSMSAlert(bestieData.phoneNumber, smsMessage, {
  userId: checkinData.userId,
  recipientId: bestieId,
  alertType: 'check_in',
  checkinId: checkinId
});

// Example for emergency SOS (triggerEmergencySOS.js:279):
await sendSMSAlert(bestieData.phoneNumber, shortAlertMessage, {
  userId: userId,
  recipientId: bestieId,
  alertType: 'emergency_sos',
  sosId: sosRef.id
});
```

**IMPORTANT:** Remove the old credit check `bestieData?.smsSubscription?.active` from all locations. Replace with new credit check inside `sendSMSAlert()`.

---

### **3. Update Stripe Checkout Session**

**File:** `functions/core/payments/createCheckoutSession.js`

**Current:** Only supports `amount: 1, type: 'subscription'`

**Changes needed:**

1. **Update valid amounts (Line 46-54):**

```javascript
// BEFORE:
const validAmounts = type === 'subscription' ? [1] : [1, 5, 10];
if (!validAmounts.includes(amount)) {
  throw new functions.https.HttpsError(
    'invalid-argument',
    type === 'subscription'
      ? 'SMS subscription must be $1/month'
      : 'Donation amount must be $1, $5, or $10 per month'
  );
}

// AFTER:
const validAmounts = type === 'subscription'
  ? [2]  // Only $2/month for SMS subscription
  : type === 'sms_extra'
    ? [1.50]  // Only $1.50 for extra SMS credits
    : [1, 5, 10];  // Donation amounts

if (!validAmounts.includes(amount)) {
  throw new functions.https.HttpsError(
    'invalid-argument',
    type === 'subscription'
      ? 'SMS subscription must be $2/month'
      : type === 'sms_extra'
        ? 'Extra SMS credits must be $1.50'
        : 'Donation amount must be $1, $5, or $10 per month'
  );
}

// Extra validation: Only active subscribers can buy extra credits
if (type === 'sms_extra') {
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  const userData = userDoc.data();

  if (!userData?.smsSubscription?.active) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'You must have an active SMS subscription to purchase extra credits'
    );
  }
}
```

2. **Update checkout session creation (Line 85-113):**

```javascript
// Determine mode based on type
const sessionMode = type === 'sms_extra' ? 'payment' : 'subscription';

// Product description
let productName, productDescription;
if (type === 'subscription') {
  productName = 'SMS Credits Subscription';
  productDescription = '15 SMS credits per month for safety check-ins';
} else if (type === 'sms_extra') {
  productName = 'Extra SMS Credits';
  productDescription = '15 additional SMS credits (expires on subscription renewal)';
} else {
  productName = 'Besties Support';
  productDescription = 'Help keep Besties free for everyone';
}

const session = await stripe.checkout.sessions.create({
  customer: customerId,
  payment_method_types: ['card'],
  mode: sessionMode,  // 'payment' for one-time, 'subscription' for recurring
  line_items: [
    {
      price_data: {
        currency: 'usd',
        product_data: {
          name: productName,
          description: productDescription,
        },
        unit_amount: amount * 100,
        recurring: sessionMode === 'subscription' ? {
          interval: 'month',
        } : undefined,  // No recurring for one-time payments
      },
      quantity: 1,
    },
  ],
  success_url: `${APP_URL}/subscription-success`,
  cancel_url: `${APP_URL}/settings`,
  metadata: {
    firebaseUID: context.auth.uid,
    type: type,
  },
});
```

---

### **4. Update Stripe Webhook Handler**

**File:** `functions/core/payments/stripeWebhook.js`

**Changes needed:**

1. **Handle subscription checkout (Line 46-54):**

```javascript
case 'checkout.session.completed':
  const session = event.data.object;
  const firebaseUID = session.metadata.firebaseUID;
  const type = session.metadata.type;

  if (type === 'subscription') {
    // Calculate subscription renewal date (1 month from now)
    const renewsAt = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)  // 30 days
    );

    // Activate SMS subscription and grant 15 credits
    await db.collection('users').doc(firebaseUID).update({
      'smsSubscription.active': true,
      'smsSubscription.plan': 'sms_monthly_2',
      'smsSubscription.stripeSubscriptionId': session.subscription,
      'smsSubscription.startedAt': admin.firestore.Timestamp.now(),

      // Grant initial 15 credits
      'smsCredits.subscriptionCredits': 15,
      'smsCredits.subscriptionRenewsAt': renewsAt,
      'smsCredits.balance': admin.firestore.FieldValue.increment(15),
      'smsCredits.currentCycleUsed': 0  // Reset cycle counter
    });

    // Update badges
    await updateUserBadges(firebaseUID);

  } else if (type === 'sms_extra') {
    // Handle extra credit purchase (one-time payment)
    const userRef = db.collection('users').doc(firebaseUID);
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    // Get expiration date (user's next subscription renewal)
    const expiresAt = userData.smsCredits?.subscriptionRenewsAt ||
                      admin.firestore.Timestamp.fromDate(
                        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                      );

    // Add to extraPurchases array
    const newPurchase = {
      creditsGranted: 15,
      pricePaid: 1.50,
      purchasedAt: admin.firestore.Timestamp.now(),
      expiresAt: expiresAt,
      creditsRemaining: 15
    };

    await userRef.update({
      'smsCredits.extraPurchases': admin.firestore.FieldValue.arrayUnion(newPurchase),
      'smsCredits.extraCredits': admin.firestore.FieldValue.increment(15),
      'smsCredits.balance': admin.firestore.FieldValue.increment(15)
    });

  } else if (type === 'donation') {
    // Existing donation logic (keep as-is)
    // ...
  }
  break;
```

2. **Handle subscription renewal (NEW CASE):**

```javascript
case 'invoice.payment_succeeded':
  const invoice = event.data.object;

  // Check if this is a subscription renewal (not first payment)
  if (invoice.billing_reason === 'subscription_cycle') {
    const subscriptionId = invoice.subscription;

    // Find user by subscription ID
    const usersSnapshot = await db.collection('users')
      .where('smsSubscription.stripeSubscriptionId', '==', subscriptionId)
      .get();

    if (!usersSnapshot.empty) {
      const userDoc = usersSnapshot.docs[0];
      const userId = userDoc.id;

      // Refresh subscription credits (call helper function)
      const { refreshSubscriptionCredits } = require('../../utils/smsCredits');
      await refreshSubscriptionCredits(userId);

      functions.logger.info('Subscription credits refreshed', { userId });
    }
  }
  break;
```

3. **Handle subscription cancellation (Line 76-107):**

```javascript
case 'customer.subscription.deleted':
  const subscription = event.data.object;
  const customer = subscription.customer;

  const usersSnapshot = await db.collection('users')
    .where('stripeCustomerId', '==', customer)
    .get();

  if (!usersSnapshot.empty) {
    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();

    if (userData.smsSubscription?.stripeSubscriptionId === subscription.id) {
      await userDoc.ref.update({
        'smsSubscription.active': false,
        'smsSubscription.cancelledAt': admin.firestore.Timestamp.now(),

        // DO NOT clear extra credits - they remain valid until expiration
        // Only stop refreshing subscriptionCredits on next renewal
      });

      await updateUserBadges(userDoc.id);
    } else if (userData.donationStats?.stripeSubscriptionId === subscription.id) {
      // Existing donation cancellation logic (keep as-is)
      // ...
    }
  }
  break;
```

---

### **5. Create Cron Jobs**

**File:** `functions/index.js` (add to exports)

**A) Daily Credit Expiration Job:**

```javascript
/**
 * Runs daily at 2am UTC
 * Expires old free credits and extra purchased credits
 */
exports.expireOldSmsCredits = functions.pubsub
  .schedule('0 2 * * *')  // 2am daily
  .timeZone('UTC')
  .onRun(async (context) => {
    const { expireOldCredits } = require('./utils/smsCredits');
    await expireOldCredits();
    return null;
  });
```

**B) Hourly Low Balance Alerts:**

```javascript
/**
 * Runs every hour
 * Alerts users with low credit balance (< 5 credits)
 */
exports.sendLowCreditAlerts = functions.pubsub
  .schedule('0 * * * *')  // Every hour
  .timeZone('UTC')
  .onRun(async (context) => {
    const usersSnapshot = await db.collection('users')
      .where('smsSubscription.active', '==', true)
      .get();

    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;

      // Get available credits
      const { getAvailableCredits } = require('./utils/smsCredits');
      const balance = await getAvailableCredits(userId);

      // Check if low balance and hasn't been alerted recently
      const lastAlerted = userData.smsCredits?.lastLowBalanceAlert?.toMillis() || 0;

      if (balance < 5 && balance > 0 && (now - lastAlerted) > ONE_DAY) {
        // Send in-app notification
        await db.collection('notifications').add({
          userId: userId,
          type: 'low_sms_credits',
          title: '⚠️ Low SMS Credits',
          message: `You have ${balance} SMS credits remaining. Buy more to stay protected.`,
          actionUrl: '/settings',
          createdAt: admin.firestore.Timestamp.now(),
          read: false
        });

        // Update last alerted timestamp
        await userDoc.ref.update({
          'smsCredits.lastLowBalanceAlert': admin.firestore.Timestamp.now()
        });
      }
    }

    return null;
  });
```

---

### **6. Admin Function to Grant Free Credits**

**File:** `functions/core/admin/grantFreeCredits.js` (NEW FILE)

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { grantFreeCredits } = require('../../utils/smsCredits');

const db = admin.firestore();

/**
 * Admin-only function to grant free SMS credits
 * Usage: Call from Firebase console with { userId: 'abc123', amount: 5 }
 */
exports.grantFreeSmsCredits = functions.https.onCall(async (data, context) => {
  // Check if caller is admin
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const callerDoc = await db.collection('users').doc(context.auth.uid).get();
  const isAdmin = callerDoc.data()?.isAdmin === true;

  if (!isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  const { userId, amount } = data;

  if (!userId || !amount || amount <= 0 || amount > 100) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Must provide userId and amount (1-100)'
    );
  }

  // Grant credits
  await grantFreeCredits(userId, amount);

  // Log admin action
  await db.collection('admin_actions').add({
    adminId: context.auth.uid,
    action: 'grant_free_sms_credits',
    targetUserId: userId,
    amount: amount,
    timestamp: admin.firestore.Timestamp.now()
  });

  functions.logger.info('Free SMS credits granted', {
    adminId: context.auth.uid,
    userId,
    amount
  });

  return { success: true, message: `Granted ${amount} free SMS credits to ${userId}` };
});
```

**Export in functions/index.js:**

```javascript
const { grantFreeSmsCredits } = require('./core/admin/grantFreeCredits');
exports.grantFreeSmsCredits = grantFreeSmsCredits;
```

---

## 🎨 Frontend Implementation

### **1. Update Premium SMS Section**

**File:** `frontend/src/components/settings/PremiumSMSSection.jsx`

**Replace entire component:**

```jsx
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import apiService from '../../services/api';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

const PremiumSMSSection = ({ userData, currentUser, loading, setLoading, navigate }) => {
  const [credits, setCredits] = useState(null);
  const [loadingCredits, setLoadingCredits] = useState(true);

  // Load credit balance on mount
  useEffect(() => {
    const loadCredits = async () => {
      if (!currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const smsCredits = data.smsCredits || {};

          // Calculate total balance (frontend display only)
          const balance = (smsCredits.freeCredits || 0) +
                         (smsCredits.subscriptionCredits || 0) +
                         (smsCredits.extraCredits || 0);

          setCredits({
            balance,
            free: smsCredits.freeCredits || 0,
            subscription: smsCredits.subscriptionCredits || 0,
            extra: smsCredits.extraCredits || 0,
            freeExpiresAt: smsCredits.freeCreditsExpireAt,
            renewsAt: smsCredits.subscriptionRenewsAt
          });
        }
      } catch (error) {
        console.error('Error loading SMS credits:', error);
      } finally {
        setLoadingCredits(false);
      }
    };

    loadCredits();

    // Refresh credits every 30 seconds
    const interval = setInterval(loadCredits, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const result = await apiService.createCheckoutSession({
        amount: 2,
        type: 'subscription'
      });

      if (result.data && result.data.url) {
        window.location.href = result.data.url;
      } else {
        toast.error('Failed to start subscription');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error(error.message || 'Failed to start subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyExtra = async () => {
    setLoading(true);
    try {
      const result = await apiService.createCheckoutSession({
        amount: 1.50,
        type: 'sms_extra'
      });

      if (result.data && result.data.url) {
        window.location.href = result.data.url;
      } else {
        toast.error('Failed to purchase extra credits');
      }
    } catch (error) {
      console.error('Extra credits error:', error);

      // Show helpful error message
      if (error.message?.includes('active SMS subscription')) {
        toast.error('You need an active $2/month subscription first');
      } else {
        toast.error(error.message || 'Failed to purchase extra credits');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const result = await apiService.createPortalSession();
      if (result.data && result.data.url) {
        window.location.href = result.data.url;
      } else {
        toast.error('Failed to open subscription portal');
      }
    } catch (error) {
      console.error('Portal session error:', error);
      toast.error('Failed to open subscription portal');
    } finally {
      setLoading(false);
    }
  };

  // Helper to format expiration date
  const formatExpiration = (timestamp) => {
    if (!timestamp) return null;
    const date = timestamp.toDate();
    const days = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} day${days > 1 ? 's' : ''}` : 'expired';
  };

  // No subscription - show subscribe option
  if (!userData?.smsSubscription?.active) {
    return (
      <div className="card p-6 mb-6 bg-gradient-secondary dark:from-purple-900/30 dark:to-pink-900/30">
        <h2 className="text-xl font-display text-text-primary mb-2">SMS Credit System</h2>
        <p className="text-text-secondary mb-4">
          Get 15 SMS credits per month for just $2/month
        </p>

        {/* Show free credits if user has any */}
        {!loadingCredits && credits && credits.free > 0 && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-300 dark:border-green-600">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              🎉 You have {credits.free} free SMS credits!
            </p>
            {credits.freeExpiresAt && (
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                Expires in {formatExpiration(credits.freeExpiresAt)}
              </p>
            )}
          </div>
        )}

        <ul className="text-sm text-text-secondary mb-4 space-y-1">
          <li>✓ 15 SMS credits per month</li>
          <li>✓ Credits refresh on your subscription anniversary</li>
          <li>✓ Buy extra credits for $1.50 (15 more credits)</li>
          <li>✓ 1 credit = 1 SMS alert to 1 bestie</li>
        </ul>

        <div className="flex gap-3">
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="btn btn-primary flex-1"
          >
            {loading ? 'Loading...' : 'Subscribe for $2/month'}
          </button>
          <button
            onClick={() => navigate('/about')}
            className="btn btn-secondary"
          >
            Learn More
          </button>
        </div>
      </div>
    );
  }

  // Has subscription - show credit balance and management
  return (
    <div className="card p-6 mb-6 bg-green-50 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-600">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-display text-text-primary mb-1">
            ✅ SMS Credits Active
          </h2>
          <p className="text-sm text-text-secondary">
            $2/month subscription
          </p>
        </div>

        {/* Credit Balance Display */}
        {!loadingCredits && credits && (
          <div className="text-right">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {credits.balance}
            </div>
            <div className="text-xs text-text-secondary">
              credits remaining
            </div>
          </div>
        )}
      </div>

      {/* Credit Breakdown (optional tooltip) */}
      {!loadingCredits && credits && (credits.free > 0 || credits.extra > 0) && (
        <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-medium text-text-secondary mb-2">Credit Breakdown:</p>
          <div className="space-y-1 text-xs">
            {credits.subscription > 0 && (
              <div className="flex justify-between">
                <span className="text-text-secondary">Subscription credits:</span>
                <span className="font-medium text-text-primary">{credits.subscription}</span>
              </div>
            )}
            {credits.extra > 0 && (
              <div className="flex justify-between">
                <span className="text-text-secondary">Extra purchased:</span>
                <span className="font-medium text-text-primary">{credits.extra}</span>
              </div>
            )}
            {credits.free > 0 && (
              <div className="flex justify-between">
                <span className="text-text-secondary">Free promotional:</span>
                <span className="font-medium text-text-primary">{credits.free}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expiration warning */}
      {credits && credits.renewsAt && (
        <p className="text-xs text-text-secondary mb-4">
          Credits refresh in {formatExpiration(credits.renewsAt)}
        </p>
      )}

      {/* Low balance warning */}
      {credits && credits.balance < 5 && credits.balance > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-300 dark:border-yellow-600">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            ⚠️ Low on credits! Consider buying more.
          </p>
        </div>
      )}

      {/* Zero balance warning */}
      {credits && credits.balance === 0 && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-300 dark:border-red-600">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            ❌ No credits remaining! Buy extra credits to send SMS alerts.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleBuyExtra}
          disabled={loading}
          className="btn btn-primary flex-1"
        >
          {loading ? 'Loading...' : 'Buy 15 More Credits ($1.50)'}
        </button>
        <button
          onClick={handleManageSubscription}
          disabled={loading}
          className="btn btn-secondary"
        >
          Manage Subscription
        </button>
      </div>
    </div>
  );
};

export default PremiumSMSSection;
```

**Update component usage in SettingsPage.jsx:**

Pass `currentUser` prop:
```jsx
<PremiumSMSSection
  userData={userData}
  currentUser={currentUser}
  handleSMSSubscription={handleSMSSubscription}
  loading={loading}
  setLoading={setLoading}
  navigate={navigate}
/>
```

---

### **2. Remove Old "5 per week" Logic**

**File:** `frontend/src/pages/SettingsPage.jsx`

**Remove these sections:**

1. **Remove smsWeeklyCount state (Line ~103-120):**

```javascript
// DELETE THIS ENTIRE BLOCK:
useEffect(() => {
  const loadSmsCount = async () => {
    if (!currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setSmsWeeklyCount(data.smsWeeklyCount || 0);
      }
    } catch (error) {
      console.error('Error loading SMS count:', error);
    }
  };

  loadSmsCount();
}, [currentUser]);
```

2. **Remove weekly limit check in toggleNotification (Line ~136-139):**

```javascript
// DELETE THIS:
if (!currentValue && smsWeeklyCount >= 5) {
  toast.error('You\'ve reached the weekly limit of 5 SMS alerts. Limit resets every Monday.', { duration: 6000 });
  return;
}
```

3. **Add NEW credit check in toggleNotification (replace above):**

```javascript
// ADD THIS instead:
if (type === 'sms') {
  const currentValue = userData?.notificationPreferences?.sms || false;

  // If enabling for the first time
  if (!currentValue && !userData?.hasSeenSMSPopup) {
    setShowSMSPopup(true);
    return;
  }

  // NEW: Check if user has credits
  if (!currentValue) {
    // Fetch current credit balance
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    const smsCredits = userDoc.data()?.smsCredits || {};
    const balance = (smsCredits.freeCredits || 0) +
                   (smsCredits.subscriptionCredits || 0) +
                   (smsCredits.extraCredits || 0);

    if (balance < 1) {
      toast.error('You have no SMS credits. Purchase credits in Settings to enable SMS alerts.', {
        duration: 6000
      });
      return;
    }
  }
}
```

---

### **3. Block Check-in Creation if No Valid Notification Channels**

**File:** `frontend/src/pages/CheckInPage.jsx` (or wherever check-in creation happens)

**Add validation before creating check-in:**

```javascript
const validateNotificationChannels = async () => {
  // Get selected besties' notification preferences
  const bestieRefs = selectedBesties.map(id => doc(db, 'users', id));
  const bestieSnaps = await Promise.all(bestieRefs.map(ref => getDoc(ref)));

  let hasValidChannel = false;
  let allOnlySMS = true;

  for (const snap of bestieSnaps) {
    if (!snap.exists()) continue;

    const bestieData = snap.data();
    const prefs = bestieData.notificationPreferences || {};

    // Check if bestie has any free channel enabled
    if (prefs.telegram || prefs.email || prefs.facebook) {
      hasValidChannel = true;
      allOnlySMS = false;
      break;
    }

    // If bestie has SMS enabled, check if we have credits
    if (prefs.sms) {
      // Check user's credit balance
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const smsCredits = userDoc.data()?.smsCredits || {};
      const balance = (smsCredits.freeCredits || 0) +
                     (smsCredits.subscriptionCredits || 0) +
                     (smsCredits.extraCredits || 0);

      if (balance >= selectedBesties.length) {
        hasValidChannel = true;
      }
    }
  }

  // If all besties only have SMS and user has no credits, block
  if (allOnlySMS && !hasValidChannel) {
    // Show detailed error modal
    setShowNoChannelModal(true);
    return false;
  }

  return true;
};

// Call before creating check-in:
const handleCreateCheckIn = async () => {
  const isValid = await validateNotificationChannels();
  if (!isValid) return;

  // Continue with check-in creation...
};
```

**Create modal component:**

```jsx
{showNoChannelModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
      <h3 className="text-xl font-bold text-text-primary mb-3">
        ❌ Cannot Create Check-In
      </h3>
      <p className="text-text-secondary mb-4">
        Your selected besties only have SMS notifications enabled, but you have no SMS credits remaining.
      </p>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-4">
        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-3">
          Choose one of these options:
        </p>
        <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
          <li>• Purchase SMS credits ($2/month for 15 credits)</li>
          <li>• Ask your besties to enable free channels (Telegram, Email)</li>
          <li>• Add a bestie who has Telegram or Email enabled</li>
        </ul>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => {
            setShowNoChannelModal(false);
            navigate('/settings');
          }}
          className="btn btn-primary flex-1"
        >
          Buy SMS Credits
        </button>
        <button
          onClick={() => setShowNoChannelModal(false)}
          className="btn btn-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
```

---

### **4. Update SMS Popup (First-Time Enable)**

**File:** `frontend/src/pages/SettingsPage.jsx`

Find the `showSMSPopup` modal and update messaging:

```jsx
<div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
  <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
    📱 About SMS Alerts
  </h3>
  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
    <li>• SMS alerts cost 1 credit per message per bestie</li>
    <li>• Subscribe for $2/month to get 15 credits</li>
    <li>• Free channels (Telegram, Email) are always free</li>
    <li>• SMS is a fallback when free channels fail</li>
  </ul>
</div>
```

---

### **5. Add API Service Methods**

**File:** `frontend/src/services/api.js`

Already has `createCheckoutSession` - no changes needed! The existing function supports the new `type: 'sms_extra'` parameter.

---

## 🧪 Testing Requirements

### **Backend Tests**

Create test file: `functions/utils/__tests__/smsCredits.test.js`

Test cases:
1. ✅ getAvailableCredits calculates correctly
2. ✅ getAvailableCredits respects expiration dates
3. ✅ deductCredit uses oldest credits first
4. ✅ deductCredit is atomic (transaction test)
5. ✅ deductCredit fails gracefully if insufficient credits
6. ✅ grantFreeCredits sets correct expiration
7. ✅ refreshSubscriptionCredits resets balance to 15
8. ✅ expireOldCredits removes expired free credits
9. ✅ addExtraCredits adds to extraPurchases array

### **Integration Tests**

1. ✅ sendSMSAlert deducts credit after send
2. ✅ sendSMSAlert throws error if insufficient credits
3. ✅ sendSMSAlert logs to sms_usage collection
4. ✅ sendSMSAlert creates admin alert if deduction fails
5. ✅ Stripe webhook grants credits on subscription
6. ✅ Stripe webhook grants extra credits on one-time payment
7. ✅ Cron job refreshes credits correctly

### **Manual Testing Checklist**

- [ ] Subscribe to $2/month plan → receives 15 credits
- [ ] Send SMS alert → credit deducted, balance updates
- [ ] Send SMS with 0 credits → error thrown, SMS not sent
- [ ] Buy extra credits ($1.50) → balance increases by 15
- [ ] Buy extra credits without subscription → error
- [ ] Cancel subscription → extra credits remain
- [ ] Free credits expire after 1 month
- [ ] Subscription credits refresh on anniversary
- [ ] Low balance alert appears at < 5 credits
- [ ] Cannot enable SMS toggle with 0 credits
- [ ] Cannot create check-in with 0 credits + SMS-only besties
- [ ] Admin can grant free credits

---

## 🚀 Deployment Checklist

### **Pre-Deployment**

1. **Update DATABASE_SCHEMA.md:**
   - [ ] Add `smsCredits` object documentation
   - [ ] Document `sms_usage` collection

2. **Update environment variables (if needed):**
   ```bash
   # No new env vars needed - using existing Stripe keys
   ```

3. **Create Stripe Products/Prices:**
   - [ ] Create new product: "SMS Credits Subscription - $2/month"
   - [ ] Note down price ID (or use dynamic price creation)

4. **Test in development:**
   - [ ] Run all unit tests: `cd functions && npm test`
   - [ ] Test Stripe integration in test mode
   - [ ] Test credit deduction with test Twilio account

### **Deployment Steps**

**⚠️ IMPORTANT: Deploy backend AND frontend together**

```bash
# 1. Deploy Firebase Functions (backend)
cd functions
npm install  # Install any new dependencies
npm test     # Run tests
cd ..
firebase deploy --only functions

# 2. Deploy Frontend (automatic on git push)
git add .
git commit -m "Implement SMS credit system"
git push origin claude/sms-credit-brainstorm-01Fcb4R6dgkeCZTQDrUFXhj5

# Frontend will auto-deploy via git preview
```

### **Post-Deployment**

1. **Update Stripe Webhook:**
   - [ ] Go to Stripe Dashboard → Webhooks
   - [ ] Update webhook endpoint URL to your new function URL
   - [ ] Ensure these events are selected:
     - `checkout.session.completed`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded` ← **NEW - add this!**
   - [ ] Copy webhook signing secret
   - [ ] Update Firebase config: `firebase functions:config:set stripe.webhook_secret="whsec_..."`
   - [ ] Redeploy functions: `firebase deploy --only functions`

2. **Verify Cron Jobs:**
   - [ ] Check Cloud Scheduler in GCP console
   - [ ] Verify `expireOldSmsCredits` scheduled for 2am UTC daily
   - [ ] Verify `sendLowCreditAlerts` scheduled hourly
   - [ ] Test manual trigger to ensure they work

3. **Database Migration (Existing Users):**

   Run this script from Firebase console to initialize existing users:

   ```javascript
   // Initialize smsCredits for existing users
   const admin = require('firebase-admin');
   const db = admin.firestore();

   async function migrateUsers() {
     const usersSnapshot = await db.collection('users').get();

     for (const doc of usersSnapshot.docs) {
       const data = doc.data();

       // Skip if already has smsCredits
       if (data.smsCredits) continue;

       await doc.ref.update({
         smsCredits: {
           balance: 0,
           freeCredits: 0,
           subscriptionCredits: 0,
           extraCredits: 0,
           totalUsed: 0,
           currentCycleUsed: 0,
           extraPurchases: []
         }
       });
     }
   }

   migrateUsers();
   ```

4. **Grant Free Credits to First 100 Users (Optional):**

   ```javascript
   // From Firebase console, call grantFreeSmsCredits function
   const functions = require('firebase-functions');

   // Get first 100 users by creation date
   const usersSnapshot = await db.collection('users')
     .orderBy('createdAt', 'asc')
     .limit(100)
     .get();

   // Grant 5 free credits to each
   for (const userDoc of usersSnapshot.docs) {
     await functions.httpsCallable('grantFreeSmsCredits')({
       userId: userDoc.id,
       amount: 5
     });
   }
   ```

5. **Monitor for Issues:**
   - [ ] Check Cloud Functions logs for errors
   - [ ] Monitor `admin_alerts` collection for credit deduction failures
   - [ ] Check Stripe dashboard for failed payments
   - [ ] Monitor `sms_usage` collection for unexpected patterns

---

## 📝 Stripe Configuration Steps

### **What You Need to Do in Stripe Dashboard:**

1. **Add New Webhook Event:**
   - Go to: Developers → Webhooks → [Your webhook]
   - Click "Add events"
   - Search for and add: `invoice.payment_succeeded`
   - This is needed to detect subscription renewals and refresh credits

2. **Optional: Create Products (or use dynamic prices):**
   The code uses dynamic price creation, so this is optional. But if you want predefined products:

   - Product 1: "SMS Credits Subscription"
     - Price: $2.00 / month
     - Recurring

   - Product 2: "Extra SMS Credits"
     - Price: $1.50
     - One-time payment

3. **Test in Stripe Test Mode First:**
   - Use test card: `4242 4242 4242 4242`
   - Test subscription purchase → verify credits granted
   - Test extra credit purchase → verify credits added
   - Test subscription renewal → verify credits refreshed

4. **Enable Stripe Customer Portal (for managing subscriptions):**
   - Go to: Settings → Customer Portal
   - Enable portal
   - Configure cancellation options (immediate vs. end of period)

---

## ⚠️ Breaking Changes & Migration Notes

### **Changes That Affect Existing Users:**

1. **SMS Toggle Behavior:**
   - **BEFORE:** Could enable SMS if `smsWeeklyCount < 5`
   - **AFTER:** Can only enable if `smsCredits.balance > 0`
   - **Impact:** Users without subscription will see error when trying to enable SMS

2. **Check-in Creation:**
   - **NEW:** Blocks check-in if no valid notification channels
   - **Impact:** Users with 0 credits and SMS-only besties cannot create check-ins
   - **Mitigation:** Clear error message with 3 options (buy credits, ask besties to enable free channels, add new bestie)

3. **Pricing Change:**
   - **BEFORE:** $1/month unlimited SMS (for testers only)
   - **AFTER:** $2/month for 15 credits
   - **Impact:** None (no existing paid users)

### **Backwards Compatibility:**

✅ **Safe:**
- All existing check-ins continue to work
- All existing besties relationships intact
- All existing notification preferences preserved
- Old `smsWeeklyCount` field can remain (unused)
- Old `smsSubscription.active` still used for Stripe management

❌ **Not Backwards Compatible:**
- Cannot use old subscription model (but none exist)
- SMS sending now requires credits (immediate enforcement)

---

## 🐛 Troubleshooting Guide

### **Issue: SMS sent but credit not deducted**

1. Check `admin_alerts` collection for deduction failures
2. Check `sms_usage` collection, look for `status: 'deduction_failed'`
3. Manually adjust user's credit balance if needed
4. Check Cloud Functions logs for transaction errors

### **Issue: User purchased credits but balance not updated**

1. Check Stripe webhook events - was it received?
2. Check `webhook_events` collection - was it processed?
3. Check for errors in webhook processing logs
4. If webhook failed, manually grant credits using `grantFreeSmsCredits` function

### **Issue: Credits expired incorrectly**

1. Check user's `freeCreditsExpireAt` timestamp
2. Check `subscriptionRenewsAt` timestamp
3. Check cron job logs for `expireOldSmsCredits`
4. Manually restore credits if incorrect expiration

### **Issue: Cannot create check-in (false negative)**

1. Verify user actually has valid notification channels
2. Check if credit balance calculation is correct
3. Check if besties have free channels enabled
4. Clear browser cache (may be reading stale user data)

---

## 📊 Success Metrics

After deployment, monitor these metrics:

1. **Revenue:**
   - Monthly recurring revenue from $2 subscriptions
   - One-time revenue from $1.50 extra credit purchases
   - Average credits purchased per user

2. **Usage:**
   - Average credits used per user per month
   - Percentage of users hitting 15-credit limit
   - Conversion rate: free users → paid subscribers

3. **SMS Cost:**
   - Total Twilio spend per month
   - Cost per SMS (should be ~$0.0075)
   - Profit margin (revenue - SMS cost)

4. **User Behavior:**
   - How many users buy extra credits?
   - Average extra credit packs purchased per user
   - Subscription cancellation rate

---

## ✅ Final Checklist Before Giving to Cursor

- [ ] All file paths are correct for this codebase
- [ ] All function names match existing code
- [ ] All database fields match DATABASE_SCHEMA.md
- [ ] Stripe integration matches existing pattern
- [ ] Error handling is comprehensive
- [ ] No breaking changes to existing features
- [ ] Frontend/backend stay in sync
- [ ] Testing requirements are clear
- [ ] Deployment steps are detailed
- [ ] Rollback plan exists (can revert git commit)

---

## 🎯 Summary for Cursor

**Goal:** Implement credit-based SMS system ($2/month = 15 credits, $1.50 = 15 extra credits)

**Key Files to Modify:**
- `functions/utils/notifications.js` - Add credit check/deduction to sendSMSAlert
- `functions/core/payments/createCheckoutSession.js` - Support new pricing
- `functions/core/payments/stripeWebhook.js` - Grant credits on payment
- `frontend/src/components/settings/PremiumSMSSection.jsx` - Show credit balance
- `frontend/src/pages/SettingsPage.jsx` - Remove old limits, add credit checks
- `frontend/src/pages/CheckInPage.jsx` - Block creation if no valid channels

**New Files to Create:**
- `functions/utils/smsCredits.js` - Credit management helpers
- `functions/core/admin/grantFreeCredits.js` - Admin function

**Critical Requirements:**
1. Atomic credit deduction (use Firestore transactions)
2. Block check-in if 0 credits + SMS-only besties
3. Audit trail in `sms_usage` collection
4. Retry logic if deduction fails
5. Support both subscription and one-time payments in Stripe

**Testing:**
- Unit tests for credit functions
- Integration tests for SMS sending
- Manual test all user flows

**Deployment:**
- Deploy backend + frontend together
- Update Stripe webhook with `invoice.payment_succeeded` event
- Run database migration for existing users
- Grant free credits to first 100 users (optional)

---

END OF SPECIFICATION
