# 🔄 Data Migration Checklist

## What Needs to Be Migrated

After fixing the double-counting bug, **ALL existing user stats need to be recalculated** from the source collections because they currently contain inflated (2x) values.

---

## 📊 Stats That Need Migration

### 1. ❌ `stats.completedCheckIns`
- **Current value**: 2x actual (every completed check-in was counted twice)
- **Source of truth**: `checkins` collection where `status === 'completed'`
- **Fix**: Count all completed check-ins for each user and update the stat

### 2. ❌ `stats.alertedCheckIns`
- **Current value**: 2x actual (every missed check-in was counted twice)
- **Source of truth**: `checkins` collection where `status === 'alerted'`
- **Fix**: Count all alerted check-ins for each user and update the stat

### 3. ❌ `stats.totalBesties`
- **Current value**: 2x actual (every accepted bestie was counted twice for both users)
- **Source of truth**: `besties` collection where `status === 'accepted'` (count both directions)
- **Fix**: Count all accepted besties (requester + recipient) for each user and update the stat

### 4. ✅ `stats.totalCheckIns` - NO MIGRATION NEEDED
- **Status**: Already correct (was never double-counted)
- **Action**: None

### 5. ✅ `donationStats.totalDonated` - NO MIGRATION NEEDED
- **Status**: Already correct (single source from Stripe webhook)
- **Action**: None

### 6. ✅ `smsSubscription.active` - NO MIGRATION NEEDED
- **Status**: Already correct (single source from Stripe webhook)
- **Action**: None

---

## 🚀 Migration Steps

### Step 1: Deploy Code Fixes ✅ (Already Done)
The following bugs have been fixed:
- ✅ Removed duplicate increment in `completeCheckIn()`
- ✅ Removed duplicate increment in `checkExpiredCheckIns()`
- ✅ Removed duplicate increment in `acceptBestieRequest()`

### Step 2: Deploy Cloud Functions
```bash
cd functions
firebase deploy --only functions
```

This will deploy:
- ✅ Bug fixes (no more double-counting)
- ✅ New migration function: `fixDoubleCountedStats`

### Step 3: Run Data Migration

**Option A: Via Firebase Console (Recommended)**
1. Log into your app as an admin user
2. Open browser console
3. Run:
   ```javascript
   const functions = firebase.functions();
   const migrate = functions.httpsCallable('fixDoubleCountedStats');
   migrate().then(result => {
     console.log('Migration complete:', result.data);
   }).catch(error => {
     console.error('Migration failed:', error);
   });
   ```

**Option B: Via Node.js Script**
```bash
cd functions
node migrations/fixDoubleCountedStats.js
```

### Step 4: Verify Migration Results

Check the console output for:
- ✅ Total users processed
- ✅ Number of users updated
- ✅ Number already correct
- ✅ Any errors encountered

Example output:
```
📊 MIGRATION SUMMARY
============================================================
Total users processed: 150
✅ Successfully updated: 120
⏭️  Already correct: 28
❌ Errors: 2
```

### Step 5: Spot Check User Stats

Manually verify a few users to ensure stats are correct:

**Example User Check:**
```javascript
// Get user stats
const userDoc = await firebase.firestore()
  .collection('users')
  .doc('USER_ID')
  .get();

console.log('User stats:', userDoc.data().stats);

// Count actual completed check-ins
const completedCheckIns = await firebase.firestore()
  .collection('checkins')
  .where('userId', '==', 'USER_ID')
  .where('status', '==', 'completed')
  .get();

console.log('Actual completed check-ins:', completedCheckIns.size);
console.log('Stored stat:', userDoc.data().stats.completedCheckIns);
// These should now match!
```

---

## 🎯 Expected Impact

### Before Migration (Broken)
```javascript
{
  stats: {
    completedCheckIns: 20,  // ❌ 2x actual (really 10)
    alertedCheckIns: 4,     // ❌ 2x actual (really 2)
    totalBesties: 12,       // ❌ 2x actual (really 6)
    totalCheckIns: 25       // ✅ Correct
  }
}
```

### After Migration (Fixed)
```javascript
{
  stats: {
    completedCheckIns: 10,  // ✅ Correct
    alertedCheckIns: 2,     // ✅ Correct
    totalBesties: 6,        // ✅ Correct
    totalCheckIns: 25,      // ✅ Correct
    migratedAt: Timestamp   // Added by migration
  }
}
```

---

## 📱 Affected UI Components

These pages will show **correct values** after migration:

### 1. ✅ Check-In History Page (`/checkins`)
- **Before**: Summary showed 2x actual counts
- **After**: Shows real completed/alerted counts

### 2. ✅ Badges Page (`/badges`)
- **Before**: Progress bars showed 2x actual progress
- **After**: Shows real progress toward badge requirements

### 3. ✅ Profile Page (`/profile`)
- **Before**: Some stats displayed incorrectly
- **After**: All stats accurate

### 4. ✅ Dev Analytics Dashboard (`/dev-analytics`)
- **Note**: Already queries collections directly, but any stat-based calculations will be fixed

---

## ⚠️ Important Notes

### Migration is Idempotent
- ✅ Safe to run multiple times
- ✅ Only updates users whose stats are incorrect
- ✅ Skips users with already-correct stats

### No Downtime Required
- ✅ Can run migration while app is live
- ✅ New stats will be calculated correctly going forward
- ✅ Migration fixes historical data

### Admin Access Required
- ❌ Only users with `isAdmin: true` can run migration
- ✅ Prevents accidental/malicious execution

### What About New Activity During Migration?
- ✅ New check-ins/besties created during migration will be correct
- ✅ Migration only recalculates from source collections at time of execution
- ✅ Firestore triggers ensure new activity increments correctly (only once)

---

## 🧪 Testing After Migration

### Test New Check-In Completion
1. Create a check-in
2. Complete it
3. Verify `stats.completedCheckIns` incremented by **1** (not 2)

### Test New Bestie Acceptance
1. Send a bestie request
2. Accept it
3. Verify both users' `stats.totalBesties` incremented by **1** (not 2)

### Test Check-In Expiration
1. Create a check-in with 1-minute duration
2. Wait for it to expire
3. Verify `stats.alertedCheckIns` incremented by **1** (not 2)

### Verify Badge Progress
1. Check `/badges` page
2. Verify progress percentages make sense
3. Complete a check-in and verify progress updates correctly

---

## 🔍 Rollback Plan

If migration causes issues:

### Option 1: Re-run Migration
- Migration is idempotent
- Will recalculate from source collections again
- Safe to run multiple times

### Option 2: Manual Stat Correction
For a specific user:
```javascript
const userId = 'USER_ID';

// Count real values
const completed = await db.collection('checkins')
  .where('userId', '==', userId)
  .where('status', '==', 'completed')
  .count().get();

const alerted = await db.collection('checkins')
  .where('userId', '==', userId)
  .where('status', '==', 'alerted')
  .count().get();

const besties1 = await db.collection('besties')
  .where('requesterId', '==', userId)
  .where('status', '==', 'accepted')
  .count().get();

const besties2 = await db.collection('besties')
  .where('recipientId', '==', userId)
  .where('status', '==', 'accepted')
  .count().get();

// Update user
await db.collection('users').doc(userId).update({
  'stats.completedCheckIns': completed.data().count,
  'stats.alertedCheckIns': alerted.data().count,
  'stats.totalBesties': besties1.data().count + besties2.data().count,
});
```

---

## 📋 Migration Completion Checklist

Before marking migration as complete:

- [ ] Code deployed to Firebase Functions
- [ ] Migration function executed successfully
- [ ] Migration summary shows 0 errors
- [ ] Spot-checked 5+ users with correct stats
- [ ] Tested new check-in completion (increments by 1)
- [ ] Tested new bestie acceptance (increments by 1)
- [ ] Badge progress shows correct percentages
- [ ] Check-in history summary shows correct counts
- [ ] No console errors in frontend
- [ ] Documented migration completion date in team notes

---

## 📞 Support

If you encounter issues during migration:

1. Check migration logs for error messages
2. Verify admin access is granted
3. Ensure all Cloud Functions deployed successfully
4. Review `USER_STATS_AUDIT.md` for detailed analysis

---

**Migration Script Location**: `/functions/migrations/fixDoubleCountedStats.js`

**Cloud Function**: `fixDoubleCountedStats` (admin-only callable)

**Documentation**: See `USER_STATS_AUDIT.md` for full technical analysis
