# User Statistics & Analytics Audit Report

**Date**: 2025-11-21
**Auditor**: Claude AI
**Purpose**: Comprehensive audit of all user-side statistics to verify proper data flow and Firebase writes

---

## Executive Summary

This audit identified **3 CRITICAL DOUBLE-COUNTING ISSUES** in user statistics that cause inflated numbers. The stats are being incremented both in callable functions AND in Firestore triggers, resulting in 2x the actual values.

### Critical Issues Found:
1. ✅ **totalCheckIns** - Working correctly (single source)
2. ❌ **completedCheckIns** - DOUBLE COUNTED
3. ❌ **alertedCheckIns** - DOUBLE COUNTED
4. ❌ **totalBesties** - DOUBLE COUNTED
5. ✅ **Donation stats** - Working correctly
6. ⚠️ **Badge progress display** - Shows wrong values (uses double-counted stats)

---

## Detailed Stat-by-Stat Analysis

### 1. Check-In Statistics

#### **stats.totalCheckIns** ✅ CORRECT
- **What it tracks**: Total number of check-ins created by user
- **How it's calculated**: Incremented when a new check-in document is created
- **Firebase write location**: `users/{userId}/stats.totalCheckIns`
- **Source code**: `/home/user/BESTIESAPP/functions/index.js:314-316`
  ```javascript
  exports.onCheckInCreated = functions.firestore
    .document('checkins/{checkInId}')
    .onCreate(async (snap, context) => {
      await db.collection('users').doc(checkIn.userId).update({
        'stats.totalCheckIns': admin.firestore.FieldValue.increment(1)
      });
    });
  ```
- **Verification**: ✅ Single source of truth (Firestore trigger only)
- **Data integrity**: CORRECT

---

#### **stats.completedCheckIns** ❌ DOUBLE COUNTED
- **What it tracks**: Number of check-ins marked as "safe"
- **How it's SUPPOSED to work**: Increment by 1 when check-in status changes to 'completed'
- **ACTUAL behavior**: Incremented TWICE

**Problem - Two Sources Writing Same Stat:**

1. **Source 1** - `completeCheckIn` callable function (`index.js:105`)
   ```javascript
   exports.completeCheckIn = functions.https.onCall(async (data, context) => {
     await checkInRef.update({
       status: 'completed',
       completedAt: admin.firestore.Timestamp.now(),
     });

     // ❌ INCREMENTS HERE
     await updateUserStats(context.auth.uid, 'checkInCompleted');
   });
   ```

2. **Source 2** - `onCheckInCountUpdate` Firestore trigger (`index.js:337-341`)
   ```javascript
   exports.onCheckInCountUpdate = functions.firestore
     .document('checkins/{checkInId}')
     .onUpdate(async (change, context) => {
       if (newData.status === 'completed' && oldData.status !== 'completed') {
         // ❌ INCREMENTS AGAIN HERE
         await userRef.update({
           'stats.completedCheckIns': admin.firestore.FieldValue.increment(1)
         });
       }
     });
   ```

**Impact**: Every completed check-in increments the counter TWICE
**Fix Required**: Remove increment from either callable function OR trigger (recommend keeping trigger only)

---

#### **stats.alertedCheckIns** ❌ DOUBLE COUNTED
- **What it tracks**: Number of check-ins that triggered safety alerts
- **How it's SUPPOSED to work**: Increment by 1 when check-in expires without being completed
- **ACTUAL behavior**: Incremented TWICE

**Problem - Two Sources Writing Same Stat:**

1. **Source 1** - `checkExpiredCheckIns` scheduled function (`index.js:46`)
   ```javascript
   exports.checkExpiredCheckIns = functions.pubsub
     .schedule('every 1 minutes')
     .onRun(async (context) => {
       await doc.ref.update({
         status: 'alerted',
         alertedAt: now,
       });

       // ❌ INCREMENTS HERE
       await updateUserStats(checkIn.userId, 'checkInAlerted');
     });
   ```

2. **Source 2** - `onCheckInCountUpdate` Firestore trigger (`index.js:373-376`)
   ```javascript
   if (newData.status === 'alerted' && oldData.status !== 'alerted') {
     // ❌ INCREMENTS AGAIN HERE
     await userRef.update({
       'stats.alertedCheckIns': admin.firestore.FieldValue.increment(1)
     });
   }
   ```

**Impact**: Every alerted check-in increments the counter TWICE
**Fix Required**: Remove increment from either scheduled function OR trigger (recommend keeping trigger only)

---

### 2. Bestie Statistics

#### **stats.totalBesties** ❌ DOUBLE COUNTED
- **What it tracks**: Total number of accepted bestie connections
- **How it's SUPPOSED to work**: Increment by 1 for both users when a bestie request is accepted
- **ACTUAL behavior**: Incremented TWICE for each user

**Problem - Two Sources Writing Same Stat:**

1. **Source 1** - `acceptBestieRequest` callable function (`index.js:275-276`)
   ```javascript
   exports.acceptBestieRequest = functions.https.onCall(async (data, context) => {
     await bestieRef.update({
       status: 'accepted',
       acceptedAt: admin.firestore.Timestamp.now(),
     });

     // ❌ INCREMENTS HERE for both users
     await updateUserStats(bestie.data().requesterId, 'bestieAdded');
     await updateUserStats(context.auth.uid, 'bestieAdded');
   });
   ```

2. **Source 2** - `onBestieCountUpdate` Firestore trigger (`index.js:409-416`)
   ```javascript
   exports.onBestieCountUpdate = functions.firestore
     .document('besties/{bestieId}')
     .onUpdate(async (change, context) => {
       if (newData.status === 'accepted' && oldData.status !== 'accepted') {
         // ❌ INCREMENTS AGAIN HERE for both users
         await db.collection('users').doc(newData.requesterId).update({
           'stats.totalBesties': admin.firestore.FieldValue.increment(1)
         });
         await db.collection('users').doc(newData.recipientId).update({
           'stats.totalBesties': admin.firestore.FieldValue.increment(1)
         });
       }
     });
   ```

**Impact**: Every accepted bestie increments the counter TWICE for BOTH users
**Fix Required**: Remove increment from either callable function OR trigger (recommend keeping trigger only)

---

### 3. Donation & Subscription Statistics ✅ CORRECT

#### **donationStats.totalDonated**
- **What it tracks**: Cumulative donations from user
- **How it's calculated**: Updated via Stripe webhook when payment succeeds
- **Firebase write location**: `users/{userId}/donationStats.totalDonated`
- **Source code**: `/home/user/BESTIESAPP/functions/index.js:1046-1058`
  ```javascript
  const amount = session.amount_total / 100;
  const currentTotal = userDoc.data()?.donationStats?.totalDonated || 0;

  await userRef.update({
    'donationStats.totalDonated': currentTotal + amount,
  });
  ```
- **Verification**: ✅ Single source (Stripe webhook)
- **Data integrity**: CORRECT

#### **smsSubscription.active**
- **What it tracks**: Whether user has active SMS subscription
- **How it's calculated**: Set to true/false via Stripe webhook
- **Firebase write location**: `users/{userId}/smsSubscription.active`
- **Source code**:
  - Activated: `index.js:1036-1041` (checkout.session.completed)
  - Deactivated: `index.js:1079-1083` (customer.subscription.deleted)
- **Verification**: ✅ Single source (Stripe webhook)
- **Data integrity**: CORRECT

---

### 4. User Initialization ✅ CORRECT

#### **onUserCreated** - Initial Stats Setup
- **When**: User account is created (Firebase Auth trigger)
- **What it does**: Initializes user document with all stat counters at 0
- **Source code**: `/home/user/BESTIESAPP/functions/index.js:512-518`
  ```javascript
  stats: {
    totalCheckIns: 0,
    completedCheckIns: 0,
    alertedCheckIns: 0,
    totalBesties: 0,
    joinedAt: admin.firestore.Timestamp.now()
  }
  ```
- **Verification**: ✅ Properly initializes all stats
- **Data integrity**: CORRECT

---

## Badge System Analysis

### Badge Calculation Logic ✅ CORRECT (Source of Truth)
- **File**: `/home/user/BESTIESAPP/functions/utils/badges.js`
- **How badges are earned**: Calculated by querying Firestore collections directly
- **Badge types tracked**:
  1. Guardian badges - `countGuardianBesties()` - counts from besties collection
  2. Bestie badges - `countTotalBesties()` - counts from besties collection
  3. Check-in badges - `countCompletedCheckIns()` - counts from checkins collection
  4. Donation badges - uses `userData.donationStats.totalDonated`
  5. Subscriber badge - uses `userData.smsSubscription.active`

**Badge calculations are CORRECT** because they query the source collections, not the cached stats.

### Badge Progress Display ⚠️ SHOWS WRONG VALUES
- **File**: `/home/user/BESTIESAPP/frontend/src/pages/BadgesPage.jsx`
- **Problem**: Progress bars use `userData.stats.completedCheckIns` and `userData.stats.totalBesties`
- **Impact**: Progress shown to users is 2x actual progress
- **Example**:
  - Real completed check-ins: 5
  - Stored in `stats.completedCheckIns`: 10 (due to double-counting)
  - Badge earned at: 10 check-ins (correctly calculated from collection)
  - Progress shown: "10 / 10" (100%) - WRONG, should be "5 / 10" (50%)

---

## Analytics Cache System

### Real-time Analytics Cache ✅ CORRECT
- **Collection**: `analytics_cache/realtime`
- **Purpose**: Fast dashboard stats without querying entire collections
- **Updated by**: Firestore triggers on document changes
- **Used by**: `/home/user/BESTIESAPP/frontend/src/pages/DevAnalyticsPage.jsx`

**Cache increments are CORRECT** because they're updated by the same triggers that have the source of truth.

However, if user stats are ever used for analytics calculations, those would be wrong.

---

## Frontend Stat Usage Analysis

### 1. Check-In History Page ✅ QUERIES COLLECTIONS
- **File**: `/home/user/BESTIESAPP/frontend/src/pages/CheckInHistoryPage.jsx`
- **Data source**: Queries `checkins` collection directly
- **Stats shown**: Uses `userData.stats` for summary counts
- **Impact**: Summary counts at top of page are WRONG (2x actual)

### 2. Badges Page ⚠️ USES CACHED STATS
- **File**: `/home/user/BESTIESAPP/frontend/src/pages/BadgesPage.jsx`
- **Data source**: Uses `userData.stats.completedCheckIns` and `userData.stats.totalBesties`
- **Impact**: Progress bars show WRONG values (2x actual)

### 3. Profile Page ✅ QUERIES COLLECTIONS
- **File**: `/home/user/BESTIESAPP/frontend/src/pages/ProfilePage.jsx`
- **Data source**: Queries collections directly for bestie count, check-in stats
- **Impact**: Profile stats are CORRECT

### 4. Dev Analytics Dashboard ✅ QUERIES COLLECTIONS
- **File**: `/home/user/BESTIESAPP/frontend/src/pages/DevAnalyticsPage.jsx`
- **Data source**: Queries all collections directly
- **Impact**: All analytics are CORRECT

---

## Data Flow Verification

### Check-In Creation Flow ✅
```
User creates check-in
  ↓
Frontend writes to checkins/{id}
  ↓
onCheckInCreated trigger fires
  ↓
users/{userId}/stats.totalCheckIns += 1 ✅
  ↓
analytics_cache/realtime.totalCheckIns += 1 ✅
```

### Check-In Completion Flow ❌
```
User clicks "I'm Safe"
  ↓
completeCheckIn() callable function
  ↓
Updates checkins/{id}.status = 'completed'
  ↓
❌ updateUserStats() increments completedCheckIns +1
  ↓
onCheckInCountUpdate trigger fires
  ↓
❌ Trigger increments completedCheckIns +1 AGAIN
  ↓
Result: stats.completedCheckIns += 2 (WRONG!)
```

### Check-In Alert Flow ❌
```
Cron job runs every minute
  ↓
checkExpiredCheckIns() finds expired check-ins
  ↓
Updates checkins/{id}.status = 'alerted'
  ↓
❌ updateUserStats() increments alertedCheckIns +1
  ↓
onCheckInCountUpdate trigger fires
  ↓
❌ Trigger increments alertedCheckIns +1 AGAIN
  ↓
Result: stats.alertedCheckIns += 2 (WRONG!)
```

### Bestie Acceptance Flow ❌
```
User accepts bestie request
  ↓
acceptBestieRequest() callable function
  ↓
Updates besties/{id}.status = 'accepted'
  ↓
❌ updateUserStats() increments totalBesties +1 for BOTH users
  ↓
onBestieCountUpdate trigger fires
  ↓
❌ Trigger increments totalBesties +1 for BOTH users AGAIN
  ↓
Result: Both users get stats.totalBesties += 2 (WRONG!)
```

---

## Recommendations

### Priority 1: Fix Double-Counting (CRITICAL)

**Option A: Keep Triggers, Remove Callable Function Updates (RECOMMENDED)**
- Remove `updateUserStats()` calls from:
  - `completeCheckIn()` function (line 105)
  - `checkExpiredCheckIns()` function (line 46)
  - `acceptBestieRequest()` function (lines 275-276)
- Keep all Firestore triggers as single source of truth
- **Pros**: Triggers are more reliable, can't be bypassed
- **Cons**: None

**Option B: Keep Callable Functions, Remove Trigger Updates**
- Remove increment logic from `onCheckInCountUpdate` and `onBestieCountUpdate`
- Keep `updateUserStats()` calls in callable functions
- **Pros**: Explicit control in callable functions
- **Cons**: Could be bypassed if check-in is updated directly in Firestore

### Priority 2: Data Migration (REQUIRED)

After fixing the code, ALL existing user stats need to be corrected:

```javascript
// Pseudo-code for migration
for each user:
  realCompletedCheckIns = count(checkins where userId=user AND status='completed')
  realAlertedCheckIns = count(checkins where userId=user AND status='alerted')
  realTotalBesties = count(besties where (requesterId=user OR recipientId=user) AND status='accepted')

  update users/{userId}:
    stats.completedCheckIns = realCompletedCheckIns
    stats.alertedCheckIns = realAlertedCheckIns
    stats.totalBesties = realTotalBesties
```

### Priority 3: Add Data Validation

Add a Cloud Function to periodically verify stats match collection counts:
```javascript
exports.validateUserStats = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async () => {
    // Compare cached stats vs actual collection counts
    // Log discrepancies for investigation
  });
```

---

## Testing Checklist

After implementing fixes:

- [ ] Create new check-in and verify totalCheckIns increments by 1 (not 2)
- [ ] Complete check-in and verify completedCheckIns increments by 1 (not 2)
- [ ] Let check-in expire and verify alertedCheckIns increments by 1 (not 2)
- [ ] Accept bestie request and verify both users' totalBesties increment by 1 (not 2)
- [ ] Verify badge progress bars show correct percentages
- [ ] Verify Check-In History page summary shows correct counts
- [ ] Run data migration script and verify all user stats are corrected
- [ ] Monitor Firestore writes to ensure no duplicate increments

---

## Summary Table

| Stat | Status | Issue | Fix Required |
|------|--------|-------|--------------|
| `stats.totalCheckIns` | ✅ Correct | None | None |
| `stats.completedCheckIns` | ❌ Wrong | Double counted (2x) | Remove callable function increment |
| `stats.alertedCheckIns` | ❌ Wrong | Double counted (2x) | Remove callable function increment |
| `stats.totalBesties` | ❌ Wrong | Double counted (2x) | Remove callable function increment |
| `donationStats.totalDonated` | ✅ Correct | None | None |
| `smsSubscription.active` | ✅ Correct | None | None |
| Badge calculations | ✅ Correct | None | None |
| Badge progress display | ⚠️ Wrong | Uses wrong stats | Will auto-fix after stat correction |

---

## Files Requiring Changes

1. `/home/user/BESTIESAPP/functions/index.js`
   - Line 105: Remove `updateUserStats()` call from `completeCheckIn()`
   - Line 46: Remove `updateUserStats()` call from `checkExpiredCheckIns()`
   - Lines 275-276: Remove `updateUserStats()` calls from `acceptBestieRequest()`

2. **New file needed**: `/home/user/BESTIESAPP/functions/migrations/fixUserStats.js`
   - Migration script to recalculate all user stats from source collections

---

**End of Audit Report**
