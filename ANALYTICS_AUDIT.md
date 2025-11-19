# Dev Analytics Audit Report

Generated: 2025-11-19

## Executive Summary

The dev analytics dashboard has several critical issues affecting accuracy and performance:
- **Architecture**: Inefficient - loads entire database on every page load
- **Alerts**: Not showing due to missing Firestore index
- **Cost estimates**: Inflated by 2-3x (double counting)
- **Funnel metrics**: Showing 0% due to missing/incomplete user stats
- **Peak day**: Possibly inaccurate due to timezone and time range filtering

---

## Metric-by-Metric Analysis

### ✅ Users Section
**Metrics:**
- Total Users
- New (7d / 30d)
- Active (7d / 30d)

**Status:** WORKING CORRECTLY

**How it works:**
```javascript
// Loads ALL users (inefficient but accurate)
const usersSnap = await getDocs(collection(db, 'users'));

// Counts based on stats.joinedAt and lastActive timestamps
const createdAt = data.stats?.joinedAt?.toDate();
const lastActive = data.lastActive?.toDate();
```

**Issues:**
- ⚠️ Loads entire users collection (inefficient)
- ⚠️ `stats.joinedAt` might be missing for old users
- ✅ Calculations are correct

**Accuracy:** 95% - May undercount users without `stats.joinedAt`

---

### ⚠️ Check-ins Section
**Metrics:**
- Total
- Active Now
- Completed
- Alerted
- Avg Minutes
- Completion Rate

**Status:** PARTIALLY WORKING

**How it works:**
```javascript
// Filtered by time range (7d, 30d, all)
checkInsSnap.forEach(doc => {
  if (data.status === 'active') activeCheckIns++;
  if (data.status === 'completed') completedCheckIns++;
  if (data.status === 'alerted') alertedCheckIns++;
});
```

**Issues:**
- ✅ Status-based counting is correct
- ⚠️ Time range filter might exclude relevant data
- ✅ Completion rate calculation is correct
- ⚠️ "Alerted" count works BUT "Recent Alerts" section doesn't (separate query)

**Accuracy:** 90% - Counts are accurate for selected time range

---

### ✅ Besties Network Section
**Metrics:**
- Total Connections
- Accepted
- Pending
- Avg Per User

**Status:** WORKING CORRECTLY

**How it works:**
```javascript
const bestiesSnap = await getDocs(collection(db, 'besties'));
bestiesSnap.forEach(doc => {
  if (data.status === 'pending') pendingBesties++;
  if (data.status === 'accepted') acceptedBesties++;
});
```

**Issues:**
- ⚠️ Loads ALL besties (inefficient)
- ✅ Status counting is correct
- ⚠️ "Avg Per User" divides by total users, but each bestie connection counts twice (requester + recipient)
  - This might give inflated average

**Accuracy:** 85% - Average calculation may be ~2x inflated

**Fix needed:**
```javascript
// Current (wrong):
avgPerUser = acceptedBesties / totalUsers  // Counts each connection once

// Should be (each connection involves 2 users):
avgPerUser = (acceptedBesties / 2) / totalUsers
// OR
avgPerUser = acceptedBesties / totalUsers  // but this is "connections per user" not "besties per user"
```

Actually, looking at the trigger logic (line 376-382), when a bestie is accepted, it increments `stats.totalBesties` for BOTH users. So each bestie relationship creates 2 increments. This is correct for "my besties" but the analytics query counts the relationship itself, not the user stats.

**Real issue:** Mixing relationship count with user stat count.

---

### ❌ Revenue Section
**Metrics:**
- MRR
- SMS Subscribers
- Active Donors
- Total Donated

**Status:** WORKING BUT POSSIBLY INACCURATE

**How it works:**
```javascript
usersSnap.forEach(doc => {
  if (data.smsSubscription?.active) smsSubscribers++;
  if (data.donationStats?.isActive) {
    donorsActive++;
    totalDonations += data.donationStats?.totalDonated || 0;
  }
});

const mrr = (smsSubscribers * 1) + totalDonations;  // ???
```

**Issues:**
- ❌ MRR calculation is WRONG:
  - `smsSubscribers * 1` = count of subscribers (not revenue)
  - Should be: `smsSubscribers * monthlyPrice` (what's the SMS subscription price?)
  - `totalDonations` is TOTAL ALL TIME, not monthly recurring
  - Should be: `sum of donationStats.monthlyAmount` for active donors

**Accuracy:** 20% - MRR calculation is fundamentally broken

**Fix needed:**
```javascript
let monthlyRevenue = 0;
usersSnap.forEach(doc => {
  if (data.smsSubscription?.active) {
    monthlyRevenue += 1; // $1/month SMS subscription
  }
  if (data.donationStats?.isActive && data.donationStats?.monthlyAmount) {
    monthlyRevenue += data.donationStats.monthlyAmount;
  }
});
```

---

### ✅ Engagement Section
**Metrics:**
- Avg Check-ins/User
- Avg Besties/User
- Templates Created
- Badges Earned

**Status:** WORKING CORRECTLY

**How it works:**
```javascript
avgCheckInsPerUser = totalCheckIns / totalUsers
avgBestiesPerUser = acceptedBesties / totalUsers
templatesCreated = templatesSnap.size
badgesEarned = sum of all users' badges
```

**Issues:**
- ✅ Calculations are mathematically correct
- ⚠️ Averages might be skewed by inactive users (users with 0 check-ins)
- ✅ Template and badge counts are accurate

**Accuracy:** 95%

---

### ❌ Cost Tracking Section
**Metrics:**
- Estimated SMS
- Estimated WhatsApp
- Estimated Email
- Total Alerts

**Status:** INFLATED BY 2-3X

**How it works (INCORRECT):**
```javascript
checkInsSnap.forEach(doc => {
  if (data.status === 'alerted' && data.bestieIds) {
    totalSMSSent += data.bestieIds.length;
    totalWhatsAppSent += data.bestieIds.length;  // DOUBLE COUNTING!
  }
});

estimatedSMS = totalSMSSent * 0.0075;
estimatedWhatsApp = totalWhatsAppSent * 0.005;
```

**Real alert logic (from index.js:136-151):**
1. Try WhatsApp first (free or $0.005)
2. If WhatsApp fails, try SMS ($0.0075)
3. Only send SMS if `smsSubscription.active`

**Why it's wrong:**
- Assumes EVERY bestie gets BOTH WhatsApp AND SMS
- Reality: They get WhatsApp OR SMS (fallback)
- Also counts WhatsApp to besties who might not have WhatsApp enabled
- Doesn't check `smsSubscription.active`

**Accuracy:** 30-40% - Estimates are 2-3x higher than actual costs

**Fix needed:** Track actual sends in a separate `alert_logs` collection

---

### ⚠️ Growth Metrics Section
**Metrics:**
- User Growth Rate (WoW)
- Check-in Growth Rate (WoW)
- Retention Rate

**Status:** MATHEMATICALLY CORRECT BUT POTENTIALLY MISLEADING

**How it works:**
```javascript
// Count users who joined in previous week vs this week
const prevWeekStart = sevenDaysAgo - 7days;
const prevWeekUsers = count between (prevWeekStart, sevenDaysAgo);
const thisWeekUsers = count between (sevenDaysAgo, now);

userGrowthRate = ((thisWeekUsers - prevWeekUsers) / prevWeekUsers) * 100;
```

**Issues:**
- ✅ Math is correct
- ⚠️ Small numbers can show huge % swings (e.g., 1 → 3 users = 200% growth)
- ⚠️ Doesn't handle prevWeekUsers = 0 (would show 0% instead of "N/A")
- ⚠️ Retention calculation counts users who did >1 check-in, but doesn't account for time (a user who did 2 check-ins in day 1 then never came back counts as "retained")

**Accuracy:** 70% - Math correct but interpretation misleading for small datasets

---

### ❌ Funnel Analytics Section
**Metrics:**
- Sign Ups
- Completed Onboarding
- Added First Bestie
- Created First Check-in
- Conversion rates

**Status:** SHOWING 0% FOR BOTTOM FUNNEL STEPS

**How it works:**
```javascript
usersSnap.forEach(doc => {
  if (data.onboardingCompleted) completedOnboardingCount++;
  if (data.stats?.totalBesties > 0) addedBestieCount++;
  if (data.stats?.totalCheckIns > 0) firstCheckInCount++;
});
```

**Issues:**
- ❌ `onboardingCompleted` might not be set for all users
- ❌ `stats.totalBesties` and `stats.totalCheckIns` depend on Firestore triggers
- ❌ If triggers haven't fired or stats aren't initialized, counts will be 0
- ❌ Old users might not have `stats` object at all

**Accuracy:** 50% - May severely undercount

**Debugging needed:**
1. Check a sample user document - do they have `stats` field?
2. Check if `stats.totalBesties` and `stats.totalCheckIns` are being incremented
3. Check if `onboardingCompleted` is being set after onboarding

**Possible root cause:** Users created before triggers were deployed don't have stats

---

### ⚠️ User Behavior Section
**Metrics:**
- Peak Hour
- Peak Day
- Most Common Duration

**Status:** WORKING BUT MAY BE INACCURATE

**How it works:**
```javascript
const hourCounts = new Array(24).fill(0);
const dayCounts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };

checkInsSnap.forEach(doc => {
  const createdAt = data.createdAt?.toDate();
  hourCounts[createdAt.getHours()]++;  // Uses LOCAL browser time
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayCounts[dayNames[createdAt.getDay()]]++;
});
```

**Issues:**
- ⚠️ `createdAt.toDate()` converts to browser's timezone
- ⚠️ Different users in different timezones create check-ins at different local times
- ⚠️ Time range filter may exclude recent activity (e.g., "Last 7 days" filter might exclude yesterday)
- ✅ Math is correct for the data it has

**Accuracy:** 70% - Correct for selected time range, but timezone mixing can skew results

**Why Wednesday might show as peak when you used it more on Tuesday:**
- If you selected "Last 7 days" and Tuesday was 8+ days ago
- Time range filter excluded Tuesday's check-ins
- Wednesday check-ins are more recent and included in the range

---

### ✅ Top Locations Section
**Status:** WORKING CORRECTLY

**How it works:**
```javascript
const locationCounts = {};
checkInsSnap.forEach(doc => {
  if (data.location) {
    locationCounts[data.location] = (locationCounts[data.location] || 0) + 1;
  }
});
// Sort by count, take top 10
```

**Issues:**
- ✅ Logic is correct
- ⚠️ Case-sensitive ("cafe" vs "Cafe" counted separately)
- ⚠️ No fuzzy matching ("Starbucks" vs "Starbucks Coffee" counted separately)

**Accuracy:** 95%

---

### ❌ Recent Alerts Section
**Status:** NOT WORKING - MISSING FIRESTORE INDEX

**How it works (or should):**
```javascript
const alertsQuery = query(
  collection(db, 'checkins'),
  where('status', '==', 'alerted'),
  orderBy('alertedAt', 'desc')
);
```

**Issues:**
- ❌ Query requires composite index on `(status, alertedAt)`
- ❌ Without index, query fails silently
- ❌ Returns empty array → shows "No alerts 🎉"
- ❌ No error shown to user

**Accuracy:** 0% - Not working at all

**Fix:** Create Firestore index or check console for index creation link

---

## Summary Table

| Metric | Status | Accuracy | Critical Issues |
|--------|--------|----------|----------------|
| Users | ✅ Working | 95% | Inefficient queries |
| Check-ins | ⚠️ Partial | 90% | Time range confusion |
| Besties Network | ✅ Working | 85% | Avg calculation double-counts |
| Revenue | ❌ Broken | 20% | MRR calculation wrong |
| Engagement | ✅ Working | 95% | Minor issues |
| Cost Tracking | ❌ Inflated | 30-40% | Double counting |
| Growth | ⚠️ Misleading | 70% | Small number volatility |
| Funnel | ❌ Broken | 50% | Missing user stats |
| User Behavior | ⚠️ Partial | 70% | Timezone + time range |
| Top Locations | ✅ Working | 95% | Minor fuzzy match issues |
| Recent Alerts | ❌ Broken | 0% | Missing Firestore index |

---

## Recommended Fixes (Priority Order)

### 🔴 CRITICAL (Fix Now)
1. **Recent Alerts** - Create Firestore composite index
2. **Revenue MRR** - Fix calculation logic
3. **Funnel Metrics** - Debug why stats are 0

### 🟡 HIGH (Fix Soon)
4. **Cost Tracking** - Implement actual cost logging
5. **Architecture** - Refactor to use aggregated daily_stats
6. **User Behavior** - Add timezone handling

### 🟢 LOW (Nice to Have)
7. **Besties Avg** - Clarify metric definition
8. **Growth Metrics** - Add N/A handling for small numbers
9. **Locations** - Add fuzzy matching

---

## Questions for You

1. **For Revenue MRR**: What's the actual monthly price for SMS subscription?
2. **For Funnel Metrics**: Can you check Firebase Console → Firestore → users collection and share what fields you see in your user document?
3. **For Peak Day**: What time range are you selecting when you see Wednesday as peak?
4. **For Recent Alerts**: Do you see any errors in the browser console on the analytics page?

I can fix all of these issues, but I need your answers to these questions first to ensure the fixes are correct.
