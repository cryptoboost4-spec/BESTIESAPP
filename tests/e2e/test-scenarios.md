# End-to-End Test Scenarios

This document contains manual test scenarios for critical user flows. Use this as a checklist when testing the app.

## 🎯 Critical Path Tests

### 1. New User Onboarding Flow
**Goal**: Verify new users can sign up and complete onboarding

**Steps**:
1. Open app in incognito browser
2. Click "Sign Up"
3. Sign up with Google account
4. Complete onboarding steps:
   - Add display name
   - Add profile picture
   - Add phone number (optional)
5. Verify redirected to home page
6. Verify user document created in Firestore
7. Verify badges document created

**Expected Results**:
- ✅ User can complete all onboarding steps
- ✅ User document has all required fields
- ✅ User can access home page after onboarding

---

### 2. Bestie Connection Flow
**Goal**: Verify users can add and connect with besties

**Steps**:
1. User A: Go to Besties page
2. User A: Click "Add Bestie"
3. User A: Enter User B's phone number
4. User A: Send bestie request
5. User B: Receive notification/email
6. User B: Accept bestie request
7. Verify both users see each other as besties
8. Verify bestie celebration modal appears

**Expected Results**:
- ✅ Bestie request is sent successfully
- ✅ User B receives notification
- ✅ Bestie relationship is created when accepted
- ✅ Both users can see each other in besties list

---

### 3. Check-in Creation and Completion Flow
**Goal**: Verify check-ins work end-to-end

**Steps**:
1. User A: Go to Create Check-in page
2. User A: Select location
3. User A: Set duration (30 minutes)
4. User A: Select besties to notify
5. User A: Create check-in
6. Verify check-in appears on home page
7. Wait for timer to count down (or manually complete)
8. User A: Click "I'm Safe" button
9. Verify check-in marked as completed
10. Verify besties receive completion notification

**Expected Results**:
- ✅ Check-in is created successfully
- ✅ Check-in appears in active check-ins
- ✅ Timer counts down correctly
- ✅ Check-in can be completed
- ✅ Besties are notified

---

### 4. Emergency SOS Flow
**Goal**: Verify emergency SOS works correctly

**Steps**:
1. User A: Go to home page
2. User A: Click Emergency SOS button
3. User A: Confirm SOS trigger
4. Verify SOS is created in Firestore
5. Verify all besties receive emergency notifications
6. Verify SOS appears in alerts for besties
7. Bestie B: Acknowledge alert
8. Verify alert is acknowledged

**Expected Results**:
- ✅ SOS is triggered successfully
- ✅ All besties receive notifications (push, email, SMS if enabled)
- ✅ SOS appears in alerts
- ✅ Besties can acknowledge alerts
- ✅ Rate limiting works (max 3 per hour)

---

### 5. Check-in Alert Flow
**Goal**: Verify expired check-ins trigger alerts

**Steps**:
1. User A: Create check-in with 1 minute duration
2. User A: Select besties
3. Wait for check-in to expire (or manually trigger)
4. Verify check-in status changes to "alerted"
5. Verify besties receive alert notifications
6. Verify alert appears in alerts collection
7. Bestie B: Acknowledge alert
8. Verify alert response is tracked

**Expected Results**:
- ✅ Expired check-ins trigger alerts
- ✅ Besties receive notifications
- ✅ Alerts are created in Firestore
- ✅ Besties can acknowledge alerts
- ✅ Alert responses are tracked

---

## 🔒 Security Tests

### 6. Firestore Security Rules
**Goal**: Verify security rules work correctly

**Steps**:
1. User A: Try to read User B's profile (non-bestie)
   - Expected: Should fail
2. User A: Add User B as bestie
3. User A: Try to read User B's profile again
   - Expected: Should succeed
4. User A: Try to update User B's profile
   - Expected: Should fail
5. User A: Create check-in with privacy "Circle Only"
6. User B (not in circle): Try to read check-in
   - Expected: Should fail
7. User C (in circle): Try to read check-in
   - Expected: Should succeed

**Expected Results**:
- ✅ Users can only read their own data or bestie data
- ✅ Users cannot update other users' data
- ✅ Privacy settings are enforced correctly

---

## ⚡ Performance Tests

### 7. Rate Limiting
**Goal**: Verify rate limiting prevents abuse

**Steps**:
1. User A: Trigger SOS (1st time)
   - Expected: Should succeed
2. User A: Trigger SOS (2nd time within hour)
   - Expected: Should succeed with warning
3. User A: Trigger SOS (3rd time within hour)
   - Expected: Should succeed
4. User A: Trigger SOS (4th time within hour)
   - Expected: Should fail with rate limit error

**Expected Results**:
- ✅ Rate limiting works correctly
- ✅ Error messages are clear
- ✅ Limits reset after time window

---

## 🐛 Edge Case Tests

### 8. Error Handling
**Goal**: Verify app handles errors gracefully

**Steps**:
1. Disconnect internet
2. Try to create check-in
   - Expected: Should show offline message
3. Reconnect internet
4. Try to create check-in again
   - Expected: Should work
5. Try to create check-in with invalid data
   - Expected: Should show validation error
6. Try to access non-existent check-in
   - Expected: Should show "not found" message

**Expected Results**:
- ✅ App handles offline state
- ✅ Validation errors are clear
- ✅ Error messages are user-friendly

---

## 📊 Data Integrity Tests

### 9. Denormalization
**Goal**: Verify bestieUserIds are denormalized correctly

**Steps**:
1. User A: Create check-in
2. Check Firestore: Verify check-in has `bestieUserIds` field
3. User A: Add new bestie
4. User A: Create new check-in
5. Verify new check-in has updated `bestieUserIds`

**Expected Results**:
- ✅ New check-ins have `bestieUserIds` field
- ✅ Field contains correct bestie IDs
- ✅ Security rules can use denormalized field

---

## 🎨 UI/UX Tests

### 10. Responsive Design
**Goal**: Verify app works on all screen sizes

**Steps**:
1. Test on mobile (375px width)
2. Test on tablet (768px width)
3. Test on desktop (1920px width)
4. Verify all features work on each size
5. Verify navigation works on mobile
6. Verify modals display correctly

**Expected Results**:
- ✅ App is responsive
- ✅ All features accessible on mobile
- ✅ UI elements don't overlap
- ✅ Touch targets are large enough

---

## 📝 Test Results Template

For each test scenario, record:

- **Date**: ___________
- **Tester**: ___________
- **Environment**: Production / Staging / Local
- **Browser**: ___________
- **Result**: ✅ Pass / ❌ Fail
- **Notes**: ___________

---

## 🚨 Critical Bugs to Watch For

- [ ] Permission errors after phone verification
- [ ] Check-ins not creating in Firestore
- [ ] Alerts not sending to besties
- [ ] Rate limiting not working
- [ ] Security rules blocking legitimate access
- [ ] Data not denormalizing correctly
- [ ] Console errors in browser
- [ ] Functions failing silently

---

*Last Updated: 2025-01-27*

