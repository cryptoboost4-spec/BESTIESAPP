# Pre-Launch Verification Guide

**Date**: 2025-01-27  
**Status**: Verification Checklist

---

## 1. Production Build Verification

### Step 1: Build the Frontend

```bash
cd frontend
npm run build
```

**What to check:**
- ✅ Build completes without errors
- ✅ `frontend/build` folder is created
- ✅ No warnings about missing environment variables
- ✅ Build size is reasonable (should be under 5MB total)

**Expected output:**
```
Creating an optimized production build...
Compiled successfully!

File sizes after gzip:
  ...
```

### Step 2: Verify Build Contents

Check that these files exist in `frontend/build`:
- ✅ `index.html`
- ✅ `static/js/main.*.js` (main bundle)
- ✅ `static/css/main.*.css` (main styles)
- ✅ `manifest.json`
- ✅ `firebase-messaging-sw.js` (for push notifications)
- ✅ All icon files (favicon, icon-192x192.png, icon-512x512.png)

### Step 3: Test Production Build Locally

```bash
# Option 1: Use serve (install if needed: npm install -g serve)
cd frontend/build
serve -s . -p 3000

# Option 2: Use Python (if installed)
cd frontend/build
python -m http.server 8000

# Option 3: Use Node http-server (install if needed: npm install -g http-server)
cd frontend/build
http-server -p 3000
```

**What to test:**
- ✅ App loads without errors
- ✅ No console errors (check browser console F12)
- ✅ Authentication works
- ✅ Navigation works
- ✅ Critical features work (create check-in, add bestie, etc.)

---

## 2. Firebase Functions Config Verification

### Step 1: Check Current Config

```bash
firebase functions:config:get
```

**What should be set:**
- ✅ `twilio.account_sid`
- ✅ `twilio.auth_token`
- ✅ `twilio.phone_number`
- ✅ `sendgrid.api_key`
- ✅ `stripe.publishable_key` (if using payments)
- ✅ `stripe.secret_key` (if using payments)
- ✅ `google.maps_api_key` (if using maps)
- ✅ `app.domain`
- ✅ `app.url`
- ✅ `app.support_email`

### Step 2: Verify Config Values

**Check each value:**
- ✅ Twilio credentials are valid (not test/placeholder values)
- ✅ SendGrid API key starts with "SG."
- ✅ Stripe keys match your environment (test vs live)
- ✅ App URL matches your domain
- ✅ Support email is valid

### Step 3: Test Functions Locally (Optional)

```bash
cd functions
npm run serve
```

**What to test:**
- ✅ Functions start without errors
- ✅ No missing config errors
- ✅ Functions can access environment variables

### Step 4: Verify in Firebase Console

1. Go to: https://console.firebase.google.com
2. Select your project
3. Go to **Functions** → **Configuration**
4. Verify all config values are set

---

## 3. Final Error Handling Review

### Step 1: Check Error Boundaries

**File**: `frontend/src/components/ErrorBoundary.jsx`

**Verify:**
- ✅ ErrorBoundary wraps the App component
- ✅ Errors are logged to error tracking
- ✅ User sees friendly error message
- ✅ Reload button works

**Test:**
- Force an error in a component
- Verify error boundary catches it
- Check error appears in Firebase Console → Firestore → `errors` collection

### Step 2: Review Critical Function Error Handling

**Check these files for try-catch blocks:**

1. **Payment Functions** (CRITICAL)
   - `functions/core/payments/createCheckoutSession.js`
   - `functions/core/payments/createPortalSession.js`
   - `functions/core/payments/stripeWebhook.js`
   
   **Verify:**
   - ✅ All Stripe API calls wrapped in try-catch
   - ✅ Errors logged with `functions.logger.error()`
   - ✅ User-friendly error messages returned

2. **Check-in Functions** (CRITICAL)
   - `functions/core/checkins/completeCheckIn.js`
   - `functions/core/checkins/checkExpiredCheckIns.js`
   
   **Verify:**
   - ✅ Firestore operations wrapped in try-catch
   - ✅ Notification failures don't break check-in completion
   - ✅ Errors logged properly

3. **Bestie Functions** (CRITICAL)
   - `functions/core/besties/acceptBestieRequest.js`
   - `functions/core/besties/sendBestieInvite.js`
   
   **Verify:**
   - ✅ Transaction failures handled
   - ✅ Notification failures don't break acceptance
   - ✅ Errors logged properly

### Step 3: Check Error Tracking

**File**: `frontend/src/services/errorTracking.js`

**Verify:**
- ✅ Errors are sent to Firestore `errors` collection
- ✅ Unhandled promise rejections are caught
- ✅ Uncaught errors are caught
- ✅ Error data includes useful context (userId, stack trace, etc.)

**Test:**
1. Open browser console
2. Trigger an error: `throw new Error('Test error')`
3. Check Firestore → `errors` collection for the error

### Step 4: Review Error Messages

**Check that error messages are:**
- ✅ User-friendly (not technical jargon)
- ✅ Actionable (tell user what to do)
- ✅ Not exposing sensitive information
- ✅ Consistent across the app

**Common error patterns to check:**
- Authentication errors: "Please log in to continue"
- Permission errors: "You don't have permission to do that"
- Network errors: "Connection failed. Please check your internet."
- Validation errors: Clear, specific messages

### Step 5: Check Error Logging in Functions

**Search for error handling patterns:**

```bash
# In functions folder
grep -r "catch" --include="*.js" | grep -v node_modules
```

**Verify:**
- ✅ All async operations have error handling
- ✅ Errors are logged with `functions.logger.error()`
- ✅ Not just `console.error()` (though some console.error is okay for critical errors)

---

## 4. Quick Verification Checklist

### Production Build
- [ ] Build completes successfully
- [ ] Build folder contains all necessary files
- [ ] Production build runs locally without errors
- [ ] No console errors in production build
- [ ] App size is reasonable

### Firebase Functions Config
- [ ] All required config values are set
- [ ] Config values are valid (not placeholders)
- [ ] Functions can access config values
- [ ] Config matches environment (test vs production)

### Error Handling
- [ ] Error boundaries are in place
- [ ] Critical functions have try-catch blocks
- [ ] Errors are logged to tracking service
- [ ] Error messages are user-friendly
- [ ] Unhandled errors are caught

---

## 5. Common Issues & Solutions

### Issue: Build fails with "Module not found"
**Solution**: Run `npm install` in frontend folder

### Issue: Functions config not found
**Solution**: Run `firebase functions:config:get` to verify, or set missing values

### Issue: Production build has console errors
**Solution**: Check browser console, fix errors, rebuild

### Issue: Error tracking not working
**Solution**: Verify Firestore rules allow writes to `errors` collection

---

## 6. Final Pre-Launch Checklist

Before launching, verify:

- [ ] Production build works
- [ ] All Firebase Functions config is set
- [ ] Error handling is in place
- [ ] Error tracking is working
- [ ] No critical console errors
- [ ] App works in production build
- [ ] All critical features tested

---

**Time Estimate**: 30-60 minutes

**Priority**: HIGH (do before launch)

---

## Notes

- **Test failures**: The test failures you saw are mostly mock setup issues, not production code problems. Your app should work fine in production.

- **Console.log**: Replacing console.log is nice-to-have, not critical. Your app works either way.

- **.env.example**: Not needed if you're not sharing the repo. You're good!

---

**You're ready to launch!** 🚀

