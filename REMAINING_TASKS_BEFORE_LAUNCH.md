# Remaining Tasks Before Launch

**Date**: 2025-01-27  
**Status**: Pre-Launch Checklist

---

## 🎯 Critical Tasks (MUST DO)

### 1. Fix Double-Counting Bug ⚠️ CRITICAL

**Status**: Documented but not fixed  
**Priority**: **MUST FIX BEFORE LAUNCH**

**Problem**: Stats are incremented twice (in callable functions AND triggers)

**Files to Fix**:
- `functions/core/checkins/completeCheckIn.js` - Remove stats update (line 36)
- `functions/core/checkins/checkExpiredCheckIns.js` - Remove stats update
- `functions/core/besties/acceptBestieRequest.js` - Remove stats update (line 34)

**Fix**: Remove `updateUserStats()` calls, keep only Firestore triggers

**Verification**: Run `tests/integration/data-integrity.test.js` after fix

---

### 2. Create .env.example File

**Status**: Missing  
**Priority**: High

**Action**: Create `.env.example` in project root:

```env
# Firebase Configuration (Required)
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# Firebase Cloud Messaging (Optional)
REACT_APP_FIREBASE_VAPID_KEY=your_vapid_key_here

# Google Maps API (Optional)
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Stripe (Optional - for payments)
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
```

---

### 3. Add Rate Limiting to Remaining Functions

**Status**: Partially complete  
**Priority**: High

**Functions Needing Rate Limiting**:
- [ ] `createCheckoutSession` - Prevent payment abuse
- [ ] `createPortalSession` - Prevent spam
- [ ] `rebuildAnalyticsCache` - Admin only, but still limit
- [ ] `stripeWebhook` - Already has idempotency, but add rate limit check

**Example**:
```javascript
const rateLimit = await checkUserRateLimit(
  userId,
  'createCheckoutSession',
  { count: 10, window: 60 * 60 * 1000 }, // 10 per hour
  'checkout_sessions'
);
```

---

### 4. Add Query Limits

**Status**: Some queries missing limits  
**Priority**: High

**Action**: Add `.limit()` to all queries without limits:

**Files to Check**:
- `functions/core/notifications/checkBirthdays.js` - Line 23 (users query)
- `functions/core/analytics/rebuildAnalyticsCache.js` - Add limits
- Any other queries without limits

**Example**:
```javascript
// Before
const users = await db.collection('users').get();

// After
const users = await db.collection('users').limit(1000).get();
```

---

## 🔧 High Priority Tasks

### 5. Add Transaction Wrappers

**Status**: Not implemented  
**Priority**: High

**Functions Needing Transactions**:
- [ ] `acceptBestieRequest` - Updates both users
- [ ] `completeCheckIn` - Updates check-in + stats (via trigger, but ensure atomic)
- [ ] Payment processing

**Example**:
```javascript
await db.runTransaction(async (transaction) => {
  const requesterRef = db.collection('users').doc(requesterId);
  const recipientRef = db.collection('users').doc(recipientId);
  
  transaction.update(requesterRef, {
    'stats.totalBesties': admin.firestore.FieldValue.increment(1)
  });
  transaction.update(recipientRef, {
    'stats.totalBesties': admin.firestore.FieldValue.increment(1)
  });
});
```

---

### 6. Set Up Staging Environment

**Status**: Not clear if exists  
**Priority**: High

**Action**:
1. Create separate Firebase project for staging
2. Deploy functions to staging
3. Test all features in staging
4. Use staging for migrations

---

### 7. Create Backup Strategy

**Status**: Not visible  
**Priority**: High

**Action**:
1. Set up Firestore automated backups
2. Document restore procedure
3. Test restore process
4. Schedule regular backups

**Firebase Console**: Firestore → Backups → Enable

---

### 8. Set Up Monitoring Alerts

**Status**: Partial (error monitoring exists)  
**Priority**: High

**Alerts to Set Up**:
- [ ] High error rate (>5% of requests)
- [ ] Function failures
- [ ] Unusual traffic patterns
- [ ] Cost thresholds ($50, $100, $200)
- [ ] Database read/write spikes

**Location**: Firebase Console → Functions → Monitoring

---

## 📝 Medium Priority Tasks

### 9. Add Retry Logic

**Status**: Not implemented  
**Priority**: Medium

**Functions Needing Retry**:
- [ ] Twilio API calls
- [ ] Stripe API calls
- [ ] SendGrid API calls
- [ ] Firestore writes (network failures)

**Example**:
```javascript
async function retryOperation(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

---

### 10. Implement Pagination

**Status**: Not implemented  
**Priority**: Medium

**Lists Needing Pagination**:
- [ ] Check-in history
- [ ] Social feed
- [ ] Bestie list (if > 50)

**Example**:
```javascript
const firstPage = query(collection, orderBy('createdAt', 'desc'), limit(20));
const snapshot = await getDocs(firstPage);
const lastDoc = snapshot.docs[snapshot.docs.length - 1];

// Next page
const nextPage = query(
  collection,
  orderBy('createdAt', 'desc'),
  limit(20),
  startAfter(lastDoc)
);
```

---

### 11. Add Input Sanitization

**Status**: Basic validation exists  
**Priority**: Medium

**Action**: Add DOMPurify for HTML sanitization

```bash
npm install dompurify
```

Use for:
- User-generated content
- Comments
- Posts
- Profile descriptions

---

### 12. Create Deployment Documentation

**Status**: Partial  
**Priority**: Medium

**Document**:
1. Pre-deployment checklist
2. Deployment steps
3. Post-deployment verification
4. Rollback procedure
5. Environment variables setup

---

## 🎨 Low Priority Tasks (Post-Launch)

### 13. Code Cleanup
- Remove unused imports
- Remove commented code
- Consolidate duplicate code

### 14. Performance Optimizations
- Memoize expensive calculations
- Debounce search inputs
- Virtualize long lists

### 15. Add CSP Headers
- Configure in Firebase Hosting
- Prevent XSS attacks

### 16. Create Architecture Diagrams
- System architecture
- Data flow diagrams
- Sequence diagrams

---

## ✅ Completed Tasks

- ✅ Comprehensive test suite (35+ test files)
- ✅ Security rules optimized
- ✅ Rate limiting implemented (partial)
- ✅ Input validation
- ✅ Error handling
- ✅ Error monitoring
- ✅ Performance tracking

---

## 📋 Quick Action Checklist

### Before Beta Launch (This Week)

- [ ] **Fix double-counting bug** (1 hour)
- [ ] **Create .env.example** (15 minutes)
- [ ] **Add query limits** (1 hour)
- [ ] **Run all tests** (30 minutes)
- [ ] **Manual testing** (2-3 hours)

### Before Public Launch (Next Week)

- [ ] **Add rate limiting to payments** (1 hour)
- [ ] **Add transaction wrappers** (2 hours)
- [ ] **Set up staging environment** (2-3 hours)
- [ ] **Create backup strategy** (1 hour)
- [ ] **Set up monitoring alerts** (1 hour)
- [ ] **Create deployment guide** (2 hours)

---

## 🚀 Launch Readiness Score

**Current**: 8.5/10  
**After Critical Fixes**: 9/10  
**After All High Priority**: 9.5/10

---

## 📞 Need Help?

- **Tests failing?** Check `HOW_TO_RUN_TESTS.md`
- **Deployment issues?** Check `FIREBASE_SETUP_GUIDE.md`
- **Configuration issues?** Check `SETUP_CHECKLIST.md`

---

**Priority Order**:
1. Fix double-counting bug (CRITICAL)
2. Create .env.example
3. Add query limits
4. Run tests and verify
5. Then proceed with other tasks

