# 🔒 COMPREHENSIVE SECURITY FIX INSTRUCTIONS
## BESTIES APP - Complete Vulnerability Remediation Guide

**Priority Level: CRITICAL - Complete ALL fixes before public launch**

---

## 📋 TABLE OF CONTENTS

1. [Prerequisites & Setup](#prerequisites--setup)
2. [Critical Fixes (Week 1 - DO FIRST)](#critical-fixes-week-1---do-first)
3. [High Priority Fixes (Week 2)](#high-priority-fixes-week-2)
4. [Medium Priority Fixes (Week 3-4)](#medium-priority-fixes-week-3-4)
5. [Testing & Verification](#testing--verification)
6. [Post-Fix Monitoring](#post-fix-monitoring)

---

## PREREQUISITES & SETUP

### Required Access
- Firebase Console access (admin role)
- GitHub/Git repository write access
- Node.js 20+ installed
- Firebase CLI installed: `npm install -g firebase-tools`

### Before You Start
1. **Create a backup branch:**
   ```bash
   cd /home/user/BESTIESAPP
   git checkout -b security-fixes-backup
   git push -u origin security-fixes-backup
   ```

2. **Work on the security branch:**
   ```bash
   git checkout claude/security-audit-01RobzXWKePkZLJwUgvyaMg1
   ```

3. **Test environment setup:**
   - Ensure you have a Firebase test project (DO NOT test on production)
   - Set up Firebase emulators: `firebase emulators:start`

---

## CRITICAL FIXES (WEEK 1 - DO FIRST)

### ✅ FIX #1: CHECK-IN PHOTO ACCESS CONTROL (CRITICAL)
**Vulnerability:** Any authenticated user can access ALL check-in photos
**File:** `/home/user/BESTIESAPP/storage.rules`
**Lines:** 26-34

#### Current Code (VULNERABLE):
```javascript
// Check-in media (photos/videos)
match /checkin-photos/{userId}/{fileName} {
  allow read: if isAuthenticated();  // ❌ TOO PERMISSIVE
  allow write: if isAuthenticated()
    && isOwner(userId)
    && (isImage() || isVideo())
    && isUnder10MB();
  allow delete: if isAuthenticated() && isOwner(userId);
}
```

#### Fixed Code:
```javascript
// Check-in media (photos/videos)
match /checkin-photos/{userId}/{fileName} {
  // Only the owner OR their besties can view check-in photos
  allow read: if isAuthenticated() && (
    isOwner(userId) ||
    // Check if viewer is in the owner's bestieUserIds
    (exists(/databases/$(database)/documents/users/$(userId)) &&
     get(/databases/$(database)/documents/users/$(userId)).data.bestieUserIds != null &&
     request.auth.uid in get(/databases/$(database)/documents/users/$(userId)).data.bestieUserIds)
  );

  allow write: if isAuthenticated()
    && isOwner(userId)
    && (isImage() || isVideo())
    && isUnder10MB();

  allow delete: if isAuthenticated() && isOwner(userId);
}
```

#### What This Fixes:
- Prevents unauthorized users from accessing check-in photos
- Only owner and their besties can view photos
- Blocks scraping attacks

#### Verification:
```bash
# Deploy storage rules
firebase deploy --only storage

# Test with Firebase Console:
# 1. Create test user A and user B (not besties)
# 2. User A uploads check-in photo
# 3. Try to access as User B - should FAIL
# 4. Make them besties
# 5. Try to access as User B - should SUCCEED
```

---

### ✅ FIX #2: PROFILE PICTURE ACCESS CONTROL (CRITICAL)
**Vulnerability:** Profile pictures are PUBLIC (no authentication required)
**File:** `/home/user/BESTIESAPP/storage.rules`
**Lines:** 50-57

#### Current Code (VULNERABLE):
```javascript
match /profile-pictures/{userId}/{fileName} {
  allow read: if true; // ❌ PUBLIC - ANYONE CAN ACCESS
  allow write: if isAuthenticated()
    && isOwner(userId)
    && isImage()
    && isUnder2MB();
  allow delete: if isAuthenticated() && isOwner(userId);
}
```

#### Fixed Code:
```javascript
match /profile-pictures/{userId}/{fileName} {
  // Require authentication to view profile pictures
  allow read: if isAuthenticated();

  allow write: if isAuthenticated()
    && isOwner(userId)
    && isImage()
    && isUnder2MB();

  allow delete: if isAuthenticated() && isOwner(userId);
}
```

#### What This Fixes:
- Prevents anonymous scraping of profile pictures
- Requires login to view any profile
- Stops mass data harvesting

#### Verification:
```bash
firebase deploy --only storage

# Test:
# 1. Log out completely
# 2. Try to access profile picture URL directly - should FAIL (401)
# 3. Log in as any user
# 4. Try to access profile picture - should SUCCEED
```

---

### ✅ FIX #3: UPDATE VULNERABLE DEPENDENCIES (CRITICAL)
**Vulnerability:** Multiple high-severity CVEs in dependencies
**Files:** `/home/user/BESTIESAPP/functions/package.json` and `/home/user/BESTIESAPP/frontend/package.json`

#### Backend Dependencies Fix:

```bash
cd /home/user/BESTIESAPP/functions

# Update vulnerable packages
npm update axios --save
npm update node-forge --save
npm update jws --save

# Run audit fix (non-breaking first)
npm audit fix

# Check remaining vulnerabilities
npm audit

# If high/critical remain, force update (test thoroughly after):
npm audit fix --force

# Verify all functions still work
npm test
```

#### Frontend Dependencies Fix:

```bash
cd /home/user/BESTIESAPP/frontend

# Update Firebase SDK
npm update firebase --save

# Fix undici vulnerabilities (via Firebase update above)
npm audit fix

# Check for breaking changes
npm audit

# DO NOT force update react-scripts (will break app)
# Those are dev dependencies with low risk in production

# Test build
npm run build

# Test app
npm start
```

#### Critical Package Updates Needed:

**In `/functions/package.json`**, update to:
```json
{
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^4.5.0",
    "twilio": "^4.20.0",
    "@sendgrid/mail": "^8.1.3",
    "stripe": "^14.10.0",
    "node-fetch": "^2.7.0",
    "axios": "^1.7.9"
  }
}
```

**Note on @sendgrid/mail:** Version 8.x may have breaking changes. After update, test email sending:
```bash
# Check the SendGrid utility file
# File: /home/user/BESTIESAPP/functions/utils/messaging.js
# Verify email sending still works with v8 API
```

#### What This Fixes:
- axios CSRF, DoS, SSRF vulnerabilities
- node-forge ASN.1 parsing vulnerabilities
- jws HMAC signature verification issues
- Firebase undici vulnerabilities

#### Verification:
```bash
# Both frontend and functions
npm audit

# Should see: "found 0 vulnerabilities" or only LOW severity

# Test critical functions:
cd /home/user/BESTIESAPP/functions
npm test

# Deploy and test in staging environment
firebase use <staging-project>
firebase deploy --only functions
```

---

### ✅ FIX #4: IMPLEMENT AUDIT LOGGING (CRITICAL)
**Vulnerability:** No logging for security events = no incident detection
**Create new file:** `/home/user/BESTIESAPP/functions/utils/auditLogger.js`

#### New Audit Logger Utility:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * Audit Logger - Centralized security event logging
 * Logs all security-critical operations for incident response
 */

const AuditEventType = {
  // Authentication events
  LOGIN_SUCCESS: 'auth.login.success',
  LOGIN_FAILURE: 'auth.login.failure',
  LOGOUT: 'auth.logout',
  PASSWORD_RESET: 'auth.password_reset',

  // Emergency events
  SOS_TRIGGERED: 'emergency.sos.triggered',
  SOS_REVERSED: 'emergency.sos.reversed',
  DURESS_CODE_USED: 'emergency.duress_code.used',

  // Account events
  ACCOUNT_CREATED: 'account.created',
  ACCOUNT_DELETED: 'account.deleted',
  ACCOUNT_SUSPENDED: 'account.suspended',

  // Data access
  ADMIN_ACCESS: 'admin.access',
  BULK_DATA_EXPORT: 'data.bulk_export',
  SENSITIVE_DATA_ACCESS: 'data.sensitive_access',

  // Payment events
  PAYMENT_INITIATED: 'payment.initiated',
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_FAILED: 'payment.failed',

  // Security events
  RATE_LIMIT_EXCEEDED: 'security.rate_limit_exceeded',
  UNAUTHORIZED_ACCESS: 'security.unauthorized_access',
  SUSPICIOUS_ACTIVITY: 'security.suspicious_activity',
};

/**
 * Log an audit event
 * @param {string} eventType - Type from AuditEventType
 * @param {string} userId - User ID (or null for anonymous)
 * @param {Object} details - Additional event details
 * @param {string} severity - 'info' | 'warning' | 'critical'
 */
async function logAuditEvent(eventType, userId, details = {}, severity = 'info') {
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const auditEntry = {
    eventType,
    userId: userId || null,
    timestamp,
    severity,
    details,
    // Add context
    functionName: process.env.FUNCTION_NAME || 'unknown',
    projectId: process.env.GCLOUD_PROJECT || 'unknown',
  };

  try {
    // Write to audit_logs collection
    await admin.firestore()
      .collection('audit_logs')
      .add(auditEntry);

    // Also log to Cloud Logging for alerting
    if (severity === 'critical') {
      functions.logger.error('CRITICAL AUDIT EVENT', auditEntry);
    } else if (severity === 'warning') {
      functions.logger.warn('Audit Event', auditEntry);
    } else {
      functions.logger.info('Audit Event', auditEntry);
    }

  } catch (error) {
    // Never let audit logging failure break the main function
    functions.logger.error('Failed to write audit log', {
      error: error.message,
      eventType,
      userId,
    });
  }
}

/**
 * Audit middleware for Cloud Functions
 * Wraps a function to automatically log entry/exit
 */
function withAudit(eventType, func) {
  return async (data, context) => {
    const userId = context.auth?.uid || null;
    const startTime = Date.now();

    await logAuditEvent(eventType, userId, {
      action: 'function_called',
      data: sanitizeForLog(data),
    }, 'info');

    try {
      const result = await func(data, context);

      await logAuditEvent(eventType, userId, {
        action: 'function_completed',
        duration_ms: Date.now() - startTime,
      }, 'info');

      return result;
    } catch (error) {
      await logAuditEvent(eventType, userId, {
        action: 'function_failed',
        error: error.message,
        duration_ms: Date.now() - startTime,
      }, 'warning');

      throw error;
    }
  };
}

/**
 * Sanitize data for logging (remove sensitive fields)
 */
function sanitizeForLog(data) {
  if (!data || typeof data !== 'object') return data;

  const sanitized = { ...data };
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'phoneNumber', 'email'];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

module.exports = {
  AuditEventType,
  logAuditEvent,
  withAudit,
};
```

#### Update Firestore Rules for Audit Logs:

**File:** `/home/user/BESTIESAPP/firestore.rules`
**Add at the end (before the final closing brace):**

```javascript
    // Audit logs collection
    // Write: Cloud Functions only (no direct user writes)
    // Read: Admins only
    match /audit_logs/{logId} {
      allow read: if isAdmin();
      allow write: if false; // Only Cloud Functions via Admin SDK
    }
```

#### Add Audit Logging to Critical Functions:

**File 1:** `/home/user/BESTIESAPP/functions/core/emergency/triggerEmergencySOS.js`
**Add at the top:**
```javascript
const { logAuditEvent, AuditEventType } = require('../../utils/auditLogger');
```

**Add after line 68 (after SOS is created):**
```javascript
// Audit log the SOS event
await logAuditEvent(
  AuditEventType.SOS_TRIGGERED,
  userId,
  {
    emergencyId: emergencyRef.id,
    location: location || 'Unknown',
    notifiedBestieCount: notifiedBesties.length,
    isReversePIN: isReversePIN || false,
  },
  'critical' // This is critical severity
);
```

**File 2:** `/home/user/BESTIESAPP/functions/core/payments/stripeWebhook.js`
**Add at the top:**
```javascript
const { logAuditEvent, AuditEventType } = require('../../utils/auditLogger');
```

**Add after successful payment (around line 45):**
```javascript
await logAuditEvent(
  AuditEventType.PAYMENT_COMPLETED,
  userId,
  {
    amount: session.amount_total,
    currency: session.currency,
    subscriptionId: subscription.id,
  },
  'info'
);
```

**File 3:** `/home/user/BESTIESAPP/functions/index.js` (for user deletion)
**Find the user deletion logic and add:**
```javascript
const { logAuditEvent, AuditEventType } = require('./utils/auditLogger');

// Before deleting user
await logAuditEvent(
  AuditEventType.ACCOUNT_DELETED,
  userId,
  { reason: 'user_requested' },
  'warning'
);
```

**File 4:** Update rate limiting to log violations
**File:** `/home/user/BESTIESAPP/functions/utils/rateLimiting.js`
**Add after line 1:**
```javascript
const { logAuditEvent, AuditEventType } = require('./auditLogger');
```

**Replace the throw statement (around line 130) with:**
```javascript
// Log rate limit violation
await logAuditEvent(
  AuditEventType.RATE_LIMIT_EXCEEDED,
  userId,
  {
    operation: operationName,
    limit: limit,
    window: window,
    attempts: currentCount,
  },
  'warning'
);

throw new functions.https.HttpsError(
  'resource-exhausted',
  `Rate limit exceeded for ${operationName}. Try again later.`,
  { retryAfter: window }
);
```

#### What This Fixes:
- Enables incident detection and response
- Provides forensic audit trail
- Required for compliance (GDPR, SOC2)
- Alerts on suspicious patterns

#### Verification:
```bash
# Deploy functions
firebase deploy --only functions

# Trigger test events:
# 1. Create test SOS
# 2. Complete a test payment
# 3. Exceed rate limit

# Check logs in Firebase Console:
# Firestore > audit_logs collection
# Should see entries for each event

# Set up alerts in Cloud Logging:
# Filter: severity >= WARNING AND jsonPayload.eventType =~ "security.*"
```

---

### ✅ FIX #5: ADD FILE CONTENT SCANNING (CRITICAL)
**Vulnerability:** No malware/XSS scanning on file uploads
**Solution:** Add Cloud Function to scan uploads using Cloud Storage virus scanning

#### Option A: Enable Cloud Storage Virus Scanning (Recommended)

**Setup Steps:**
1. Go to Google Cloud Console (not Firebase Console)
2. Navigate to Cloud Storage
3. Enable "Cloud Storage for Firebase" API
4. Set up virus scanning:

```bash
# Install gcloud CLI if not already installed
# https://cloud.google.com/sdk/docs/install

# Set project
gcloud config set project YOUR_PROJECT_ID

# Enable Cloud Storage scanning
gcloud services enable file.googleapis.com

# Note: Virus scanning is automatic but requires billing enabled
# Costs ~$0.025 per GB scanned
```

#### Option B: Manual SVG/XSS Scanning (Immediate Fix)

**Create file:** `/home/user/BESTIESAPP/functions/core/storage/scanUploadedFile.js`

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { logAuditEvent, AuditEventType } = require('../../utils/auditLogger');

/**
 * Scan uploaded files for malicious content
 * Triggers on file upload to sensitive paths
 */
exports.scanUploadedFile = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name;
  const contentType = object.contentType;
  const bucket = admin.storage().bucket(object.bucket);
  const file = bucket.file(filePath);

  // Only scan image files
  if (!contentType || !contentType.startsWith('image/')) {
    return null;
  }

  // Check if SVG (high risk for XSS)
  if (contentType === 'image/svg+xml') {
    functions.logger.info('Scanning SVG file for XSS', { filePath });

    try {
      const [fileContent] = await file.download();
      const svgContent = fileContent.toString('utf-8');

      // Check for dangerous SVG content
      const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i, // Event handlers like onclick, onload
        /<iframe/i,
        /eval\(/i,
        /document\./i,
        /window\./i,
      ];

      let isMalicious = false;
      for (const pattern of dangerousPatterns) {
        if (pattern.test(svgContent)) {
          isMalicious = true;
          functions.logger.error('MALICIOUS SVG DETECTED', {
            filePath,
            pattern: pattern.toString(),
          });
          break;
        }
      }

      if (isMalicious) {
        // Extract userId from path (checkin-photos/{userId}/{fileName})
        const pathParts = filePath.split('/');
        const userId = pathParts.length > 1 ? pathParts[1] : 'unknown';

        // Log security event
        await logAuditEvent(
          AuditEventType.SUSPICIOUS_ACTIVITY,
          userId,
          {
            action: 'malicious_file_upload',
            filePath,
            contentType,
            reason: 'SVG contains potentially malicious content',
          },
          'critical'
        );

        // Delete the malicious file
        await file.delete();

        functions.logger.warn('Deleted malicious SVG', { filePath });

        // Optionally: Suspend user account or notify admins
        // await suspendUser(userId, 'Uploaded malicious content');

        return null;
      }
    } catch (error) {
      functions.logger.error('Error scanning SVG', {
        error: error.message,
        filePath,
      });
    }
  }

  // Check file size (defense in depth)
  const maxSizes = {
    'profile-pictures': 2 * 1024 * 1024, // 2MB
    'checkin-photos': 10 * 1024 * 1024, // 10MB
    'posts': 10 * 1024 * 1024, // 10MB
  };

  for (const [pathPrefix, maxSize] of Object.entries(maxSizes)) {
    if (filePath.startsWith(pathPrefix) && object.size > maxSize) {
      functions.logger.warn('File exceeds size limit', {
        filePath,
        size: object.size,
        maxSize,
      });
      await file.delete();
      break;
    }
  }

  return null;
});
```

**Add to exports in `/home/user/BESTIESAPP/functions/index.js`:**
```javascript
// Storage security
const { scanUploadedFile } = require('./core/storage/scanUploadedFile');
exports.scanUploadedFile = scanUploadedFile;
```

#### Option C: Strip EXIF Data (Privacy Fix)

**Create file:** `/home/user/BESTIESAPP/functions/core/storage/stripExifData.js`

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { spawn } = require('child-process-promise');
const path = require('path');
const os = require('os');
const fs = require('fs');

/**
 * Strip EXIF metadata from uploaded images
 * Removes GPS coordinates, camera info, etc.
 */
exports.stripExifData = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name;
  const contentType = object.contentType;

  // Only process images (skip videos)
  if (!contentType || !contentType.startsWith('image/') || contentType === 'image/svg+xml') {
    return null;
  }

  // Skip if already processed
  if (object.metadata && object.metadata.exifStripped === 'true') {
    return null;
  }

  const bucket = admin.storage().bucket(object.bucket);
  const fileName = path.basename(filePath);
  const tempFilePath = path.join(os.tmpdir(), fileName);
  const file = bucket.file(filePath);

  try {
    // Download file
    await file.download({ destination: tempFilePath });

    functions.logger.info('Stripping EXIF data', { filePath });

    // Use ImageMagick to strip EXIF (install via package.json)
    // Alternative: Use 'exiftool' or 'sharp' npm package
    await spawn('convert', [tempFilePath, '-strip', tempFilePath]);

    // Upload stripped file back
    await bucket.upload(tempFilePath, {
      destination: filePath,
      metadata: {
        contentType: contentType,
        metadata: {
          exifStripped: 'true', // Prevent re-processing
        },
      },
    });

    functions.logger.info('EXIF data stripped successfully', { filePath });

  } catch (error) {
    functions.logger.error('Error stripping EXIF data', {
      error: error.message,
      filePath,
    });
  } finally {
    // Clean up temp file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }

  return null;
});
```

**Note:** EXIF stripping requires ImageMagick installed in Cloud Functions environment.

**Simpler alternative using Sharp (recommended):**

```bash
cd /home/user/BESTIESAPP/functions
npm install sharp --save
```

**Replace the convert command with:**
```javascript
const sharp = require('sharp');

// Instead of spawn('convert'...)
await sharp(tempFilePath)
  .rotate() // Auto-rotate based on EXIF
  .withMetadata({
    exif: {}, // Remove all EXIF
  })
  .toFile(tempFilePath + '.stripped');

// Rename stripped file
fs.renameSync(tempFilePath + '.stripped', tempFilePath);
```

#### What This Fixes:
- Prevents malicious SVG/XSS attacks
- Removes GPS data from photos (privacy)
- Detects oversized files that bypass frontend validation
- Logs suspicious uploads

#### Verification:
```bash
# Deploy functions
firebase deploy --only functions

# Test malicious SVG upload:
# Create file test-xss.svg:
cat > /tmp/test-xss.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg">
  <script>alert('XSS')</script>
</svg>
EOF

# Upload via app and check if deleted
# Check Cloud Functions logs - should see "MALICIOUS SVG DETECTED"
```

---

### ✅ FIX #6: EMERGENCY SOS RATE LIMIT (CRITICAL)
**Vulnerability:** Rate limit errors fall back to permissive default
**File:** `/home/user/BESTIESAPP/functions/core/emergency/triggerEmergencySOS.js`
**Lines:** 68-75 (approximate)

#### Find This Code Pattern:
```javascript
// Check rate limit
try {
  await checkRateLimit(userId, 'sos', 3, 3600);
} catch (error) {
  // If rate limit check fails, allow it to proceed
  functions.logger.warn('Rate limit check failed, allowing SOS', error);
}
```

#### Replace With (Fail Closed):
```javascript
// Check rate limit - FAIL CLOSED on error
try {
  await checkRateLimit(userId, 'sos', 3, 3600);
} catch (error) {
  if (error.code === 'resource-exhausted') {
    // This is an intentional rate limit - re-throw
    throw error;
  }

  // If rate limit check itself fails (infrastructure issue),
  // FAIL CLOSED - deny the request for security
  functions.logger.error('Rate limit check failed - DENYING REQUEST', {
    userId,
    error: error.message,
  });

  await logAuditEvent(
    AuditEventType.SUSPICIOUS_ACTIVITY,
    userId,
    {
      action: 'rate_limit_check_failure',
      operation: 'emergency_sos',
      error: error.message,
    },
    'critical'
  );

  throw new functions.https.HttpsError(
    'internal',
    'Unable to verify rate limit. Please try again in a few seconds.',
    { retryable: true }
  );
}
```

#### What This Fixes:
- Prevents SOS spam via race conditions
- Fails securely when infrastructure has issues
- Prevents SMS/notification quota exhaustion

#### Verification:
```bash
# Deploy
firebase deploy --only functions

# Test:
# 1. Trigger 3 SOS events rapidly (should succeed)
# 2. Trigger 4th SOS (should fail with rate limit error)
# 3. Wait 1 hour
# 4. Trigger SOS again (should succeed)

# Check audit logs for rate limit violations
```

---

## HIGH PRIORITY FIXES (WEEK 2)

### ✅ FIX #7: ADD INPUT LENGTH LIMITS (HIGH)
**Vulnerability:** No server-side length validation on text fields
**File:** `/home/user/BESTIESAPP/functions/utils/validation.js`

#### Add New Validation Function:
```javascript
/**
 * Validate text field with length limits
 * @param {string} value - Text to validate
 * @param {string} fieldName - Field name for error messages
 * @param {number} maxLength - Maximum allowed length
 * @param {number} minLength - Minimum allowed length (optional)
 */
function validateText(value, fieldName, maxLength, minLength = 0) {
  if (typeof value !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `${fieldName} must be a string`
    );
  }

  if (value.length < minLength) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `${fieldName} must be at least ${minLength} characters`
    );
  }

  if (value.length > maxLength) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `${fieldName} must be at most ${maxLength} characters`
    );
  }

  return value.trim();
}

module.exports.validateText = validateText;
```

#### Update Check-in Creation to Use Validation:

**File:** `/home/user/BESTIESAPP/functions/core/checkins/createCheckIn.js` (or similar)

**Add validation for all text fields:**
```javascript
const { validateText } = require('../../utils/validation');

// Inside the function, after extracting data:
const location = validateText(data.location, 'location', 500, 1); // Max 500 chars
const notes = data.notes ? validateText(data.notes, 'notes', 2000, 0) : null; // Max 2000 chars
```

#### Add to All User Input Fields:

**Find and update these locations:**

1. **User display names** - Max 50 chars
2. **Check-in notes** - Max 2000 chars
3. **Check-in locations** - Max 500 chars
4. **Emergency SOS messages** - Max 500 chars
5. **Post content** - Max 5000 chars
6. **Comment text** - Max 1000 chars

**Pattern to apply everywhere:**
```javascript
const userInput = validateText(data.userInput, 'fieldName', MAX_LENGTH);
```

#### What This Fixes:
- Prevents database bloat
- Prevents DoS via memory exhaustion
- Enforces consistent data quality

#### Verification:
```bash
# Deploy
firebase deploy --only functions

# Test:
# Try to create check-in with 10,000 character location
# Should fail with "location must be at most 500 characters"
```

---

### ✅ FIX #8: ENABLE DDoS PROTECTION (HIGH)
**Vulnerability:** No infrastructure-level rate limiting
**Solution:** Enable Cloud Armor (requires Google Cloud Console)

#### Step 1: Enable Cloud Armor
```bash
# In terminal with gcloud CLI
gcloud services enable compute.googleapis.com
gcloud services enable cloudarmor.googleapis.com
```

#### Step 2: Create Security Policy

**Via gcloud CLI:**
```bash
# Create policy
gcloud compute security-policies create besties-ddos-protection \
  --description "DDoS protection for BESTIES app"

# Add rate limiting rule (100 requests per minute per IP)
gcloud compute security-policies rules create 1000 \
  --security-policy besties-ddos-protection \
  --expression "true" \
  --action "rate-based-ban" \
  --rate-limit-threshold-count 100 \
  --rate-limit-threshold-interval-sec 60 \
  --ban-duration-sec 600 \
  --conform-action allow \
  --exceed-action deny-403

# Add geo-blocking rule (optional - block high-risk countries)
gcloud compute security-policies rules create 2000 \
  --security-policy besties-ddos-protection \
  --expression "origin.region_code in ['CN', 'RU', 'KP']" \
  --action deny-403 \
  --description "Block high-risk countries"

# Allow legitimate traffic
gcloud compute security-policies rules create 3000 \
  --security-policy besties-ddos-protection \
  --expression "true" \
  --action allow \
  --description "Allow all other traffic"
```

#### Step 3: Apply to Firebase Hosting

**Note:** Cloud Armor requires Firebase Hosting on Blaze (pay-as-you-go) plan

**File:** `/home/user/BESTIESAPP/firebase.json`

**Update hosting configuration:**
```json
{
  "hosting": [
    {
      "target": "app",
      "public": "frontend/build",
      "rewrites": [
        {
          "source": "**",
          "destination": "/index.html"
        }
      ],
      "headers": [
        {
          "source": "**",
          "headers": [
            {
              "key": "X-Content-Type-Options",
              "value": "nosniff"
            },
            {
              "key": "X-Frame-Options",
              "value": "DENY"
            },
            {
              "key": "X-XSS-Protection",
              "value": "1; mode=block"
            },
            {
              "key": "Referrer-Policy",
              "value": "strict-origin-when-cross-origin"
            },
            {
              "key": "Permissions-Policy",
              "value": "geolocation=(self), microphone=(self), camera=(self)"
            }
          ]
        }
      ]
    }
  ]
}
```

#### Step 4: Monitor DDoS Activity

**Set up Cloud Logging alert:**
```bash
# Create log-based metric for DDoS events
gcloud logging metrics create ddos-blocks \
  --description "Count of blocked DDoS requests" \
  --log-filter 'resource.type="http_load_balancer" AND jsonPayload.enforcedSecurityPolicy.name="besties-ddos-protection"'

# Create alert policy (requires Cloud Monitoring)
# Do this in Cloud Console > Monitoring > Alerting
```

#### What This Fixes:
- Prevents volumetric DDoS attacks
- Rate limits per IP address
- Blocks malicious traffic before it reaches your app
- Reduces Cloud Functions costs

#### Verification:
```bash
# Deploy hosting config
firebase deploy --only hosting

# Test rate limiting:
# Use a tool like 'ab' (Apache Bench) or 'hey'
ab -n 1000 -c 100 https://YOUR-APP.web.app/

# Check Cloud Armor logs in Google Cloud Console
# Should see blocks after ~100 requests from same IP
```

**Note:** Cloud Armor has costs (~$5-10/month base + $0.50 per million requests)

---

### ✅ FIX #9: IMPLEMENT MFA (MEDIUM-HIGH)
**Vulnerability:** No multi-factor authentication for admin accounts
**Solution:** Enable Firebase Authentication MFA

#### Step 1: Enable MFA in Firebase Console

1. Go to Firebase Console > Authentication > Settings
2. Enable "Multi-factor authentication"
3. Select SMS as verification method (uses Twilio already configured)

#### Step 2: Update Frontend Auth Context

**File:** `/home/user/BESTIESAPP/frontend/src/contexts/AuthContext.jsx`

**Add MFA enrollment function:**
```javascript
// Add to AuthContext
const enrollMFA = async () => {
  try {
    const user = auth.currentUser;

    if (!user) {
      throw new Error('No user logged in');
    }

    // Get multi-factor session
    const session = await user.multiFactor.getSession();

    // Set up phone auth provider
    const phoneAuthProvider = new PhoneAuthProvider(auth);
    const phoneInfoOptions = {
      phoneNumber: user.phoneNumber, // Use existing phone number
      session
    };

    // Send verification code
    const verificationId = await phoneAuthProvider.verifyPhoneNumber(
      phoneInfoOptions,
      window.recaptchaVerifier
    );

    return verificationId;

  } catch (error) {
    console.error('Error enrolling MFA:', error);
    throw error;
  }
};

// Add to context value
return (
  <AuthContext.Provider value={{
    ...existingValues,
    enrollMFA,
  }}>
    {children}
  </AuthContext.Provider>
);
```

#### Step 3: Create MFA Enrollment Page

**Create file:** `/home/user/BESTIESAPP/frontend/src/pages/MFAEnrollPage.jsx`

```javascript
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PhoneMultiFactorGenerator } from 'firebase/auth';

function MFAEnrollPage() {
  const { user, enrollMFA } = useAuth();
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleEnrollStart = async () => {
    setLoading(true);
    try {
      const id = await enrollMFA();
      setVerificationId(id);
      toast.success('Verification code sent to your phone');
    } catch (error) {
      toast.error('Failed to start MFA enrollment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);

      await user.multiFactor.enroll(multiFactorAssertion, 'Phone Number');

      toast.success('MFA enabled successfully!');
      // Redirect to settings or dashboard
    } catch (error) {
      toast.error('Failed to verify code: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mfa-enroll-container">
      <h1>Enable Two-Factor Authentication</h1>

      {!verificationId ? (
        <button onClick={handleEnrollStart} disabled={loading}>
          Send Verification Code
        </button>
      ) : (
        <div>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="Enter 6-digit code"
            maxLength={6}
          />
          <button onClick={handleVerify} disabled={loading}>
            Verify & Enable MFA
          </button>
        </div>
      )}
    </div>
  );
}

export default MFAEnrollPage;
```

#### Step 4: Require MFA for Admin Accounts

**File:** `/home/user/BESTIESAPP/functions/utils/validation.js`

**Add admin MFA check:**
```javascript
/**
 * Require admin authentication with MFA
 */
async function requireAdminWithMFA(context) {
  const userId = requireAuth(context);

  // Check if user is admin
  const userDoc = await admin.firestore().collection('users').doc(userId).get();

  if (!userDoc.exists || !userDoc.data().isAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Admin access required'
    );
  }

  // Check if MFA is enrolled
  const user = await admin.auth().getUser(userId);

  if (!user.multiFactor || user.multiFactor.enrolledFactors.length === 0) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'MFA enrollment required for admin accounts'
    );
  }

  // Verify MFA was recently verified (within last 5 minutes)
  const lastMFAVerification = context.auth.token.mfa_verified_at;
  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 300;

  if (!lastMFAVerification || lastMFAVerification < fiveMinutesAgo) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Recent MFA verification required'
    );
  }

  return userId;
}

module.exports.requireAdminWithMFA = requireAdminWithMFA;
```

**Update admin functions to use new validation:**
```javascript
// In admin Cloud Functions
const { requireAdminWithMFA } = require('../../utils/validation');

exports.someAdminFunction = functions.https.onCall(async (data, context) => {
  const adminId = await requireAdminWithMFA(context); // Instead of requireAuth

  // Admin logic here
});
```

#### What This Fixes:
- Protects admin accounts from credential compromise
- Adds second factor for sensitive operations
- Required for SOC2/compliance

#### Verification:
```bash
# Deploy
firebase deploy --only functions,hosting

# Test:
# 1. Log in as admin user
# 2. Navigate to /mfa-enroll
# 3. Complete enrollment
# 4. Log out and log back in
# 5. Should prompt for MFA code
# 6. Try admin function - should work
# 7. Try admin function from regular user - should fail
```

---

## MEDIUM PRIORITY FIXES (WEEK 3-4)

### ✅ FIX #10: ADD CONTENT SECURITY POLICY (MEDIUM)
**Vulnerability:** No CSP headers = XSS risk
**File:** `/home/user/BESTIESAPP/firebase.json`

**Already added in Fix #8 above, but here's a more comprehensive CSP:**

```json
{
  "hosting": [
    {
      "target": "app",
      "public": "frontend/build",
      "headers": [
        {
          "source": "**",
          "headers": [
            {
              "key": "Content-Security-Policy",
              "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.firebaseapp.com https://*.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self';"
            },
            {
              "key": "X-Content-Type-Options",
              "value": "nosniff"
            },
            {
              "key": "X-Frame-Options",
              "value": "DENY"
            },
            {
              "key": "X-XSS-Protection",
              "value": "1; mode=block"
            },
            {
              "key": "Strict-Transport-Security",
              "value": "max-age=31536000; includeSubDomains; preload"
            },
            {
              "key": "Referrer-Policy",
              "value": "strict-origin-when-cross-origin"
            },
            {
              "key": "Permissions-Policy",
              "value": "geolocation=(self), microphone=(self), camera=(self), payment=(self)"
            }
          ]
        }
      ]
    }
  ]
}
```

**Deploy:**
```bash
firebase deploy --only hosting
```

---

### ✅ FIX #11: SECRET ROTATION SCHEDULE (MEDIUM)
**Vulnerability:** No secret rotation policy
**Solution:** Implement rotation procedures

**Create file:** `/home/user/BESTIESAPP/SECRET_ROTATION_SCHEDULE.md`

```markdown
# Secret Rotation Schedule

## Rotation Frequency

| Secret | Rotation Frequency | Last Rotated | Next Rotation |
|--------|-------------------|--------------|---------------|
| Twilio Auth Token | 90 days | YYYY-MM-DD | YYYY-MM-DD |
| SendGrid API Key | 90 days | YYYY-MM-DD | YYYY-MM-DD |
| Stripe Secret Key | 90 days | YYYY-MM-DD | YYYY-MM-DD |
| Stripe Webhook Secret | 180 days | YYYY-MM-DD | YYYY-MM-DD |
| Facebook Page Token | 60 days | YYYY-MM-DD | YYYY-MM-DD |
| Telegram Bot Token | 90 days | YYYY-MM-DD | YYYY-MM-DD |
| Firebase Service Account | 365 days | YYYY-MM-DD | YYYY-MM-DD |

## Rotation Procedures

### Twilio Auth Token

1. Log in to Twilio Console
2. Navigate to Account > API Keys & Tokens
3. Generate new Auth Token
4. Update Firebase Functions config:
   ```bash
   firebase functions:config:set twilio.auth_token="NEW_TOKEN"
   ```
5. Deploy functions:
   ```bash
   firebase deploy --only functions
   ```
6. Test SMS sending functionality
7. Revoke old token in Twilio Console
8. Update this document with rotation date

### SendGrid API Key

1. Log in to SendGrid Console
2. Navigate to Settings > API Keys
3. Create new API key with same permissions
4. Update Firebase Functions config:
   ```bash
   firebase functions:config:set sendgrid.api_key="NEW_KEY"
   ```
5. Deploy and test email sending
6. Delete old API key
7. Update rotation date

### Stripe Keys

1. Log in to Stripe Dashboard
2. Navigate to Developers > API Keys
3. Roll the secret key (or create new restricted key)
4. Update Firebase config:
   ```bash
   firebase functions:config:set stripe.secret_key="NEW_KEY"
   ```
5. For webhook secret:
   - Create new webhook endpoint with new secret
   - Update config
   - Deploy
   - Delete old webhook endpoint
6. Test payment flow end-to-end
7. Update rotation date

### Emergency Rotation

If a secret is compromised:
1. Immediately generate new secret
2. Deploy to production
3. Revoke old secret
4. Review audit logs for unauthorized usage
5. Notify affected users if necessary
6. Document incident

## Automated Rotation (Future)

Consider implementing:
- Google Secret Manager with automatic rotation
- Cloud Scheduler to remind of rotation dates
- Automated testing after rotation
```

**Set calendar reminders:**
```bash
# Create calendar events for each rotation date
# Use Google Calendar, Outlook, or project management tool
```

---

### ✅ FIX #12: FIX ADMIN ROLE CHECK (MEDIUM)
**Vulnerability:** Admin check uses expensive Firestore get() calls
**File:** `/home/user/BESTIESAPP/firestore.rules`
**Solution:** Use Firebase custom claims

#### Step 1: Set Admin Custom Claim

**Create Cloud Function:** `/home/user/BESTIESAPP/functions/admin/setAdminClaim.js`

```javascript
const functions = require('firebase-functions');
const admin = require('admin-admin');
const { logAuditEvent, AuditEventType } = require('../utils/auditLogger');

/**
 * Set admin custom claim on user
 * ONLY callable by existing admins
 */
exports.setAdminClaim = functions.https.onCall(async (data, context) => {
  // Must be called by existing admin
  const callerId = context.auth?.uid;
  if (!callerId) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const callerToken = await admin.auth().getUser(callerId);
  if (!callerToken.customClaims?.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Must be admin');
  }

  const { userId, isAdmin } = data;

  // Validate input
  if (!userId || typeof userId !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'userId required');
  }

  if (typeof isAdmin !== 'boolean') {
    throw new functions.https.HttpsError('invalid-argument', 'isAdmin must be boolean');
  }

  try {
    // Set custom claim
    await admin.auth().setCustomUserClaims(userId, {
      admin: isAdmin,
    });

    // Also update Firestore for consistency
    await admin.firestore().collection('users').doc(userId).update({
      isAdmin: isAdmin,
      adminUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      adminUpdatedBy: callerId,
    });

    // Audit log
    await logAuditEvent(
      isAdmin ? AuditEventType.ADMIN_ACCESS : 'admin.removed',
      userId,
      {
        action: isAdmin ? 'admin_granted' : 'admin_revoked',
        grantedBy: callerId,
      },
      'critical'
    );

    functions.logger.info(`Admin claim ${isAdmin ? 'granted' : 'revoked'}`, {
      userId,
      by: callerId,
    });

    return { success: true };

  } catch (error) {
    functions.logger.error('Error setting admin claim', error);
    throw new functions.https.HttpsError('internal', 'Failed to set admin claim');
  }
});
```

**Export in `/home/user/BESTIESAPP/functions/index.js`:**
```javascript
const { setAdminClaim } = require('./admin/setAdminClaim');
exports.setAdminClaim = setAdminClaim;
```

#### Step 2: Update Security Rules

**File:** `/home/user/BESTIESAPP/firestore.rules`

**Replace this:**
```javascript
function isAdmin() {
  return isSignedIn() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
}
```

**With this:**
```javascript
function isAdmin() {
  return isSignedIn() && request.auth.token.admin == true;
}
```

**Benefits:**
- No more expensive get() calls
- Instant admin check (reads from JWT token)
- Reduces Firestore costs
- Faster rules evaluation

#### Step 3: Migrate Existing Admins

**Create migration script:** `/home/user/BESTIESAPP/functions/admin/migrateAdmins.js`

```javascript
const admin = require('firebase-admin');
const functions = require('firebase-functions');

/**
 * One-time migration: Set custom claims for existing admins
 * Run manually via: firebase functions:shell
 * Then call: migrateAdmins()
 */
exports.migrateAdmins = functions.https.onRequest(async (req, res) => {
  // SECURITY: Restrict to local only or require secret
  if (req.method !== 'POST' || req.headers['x-migration-secret'] !== 'YOUR_SECRET_HERE') {
    res.status(403).send('Forbidden');
    return;
  }

  try {
    // Find all admin users
    const adminsSnapshot = await admin.firestore()
      .collection('users')
      .where('isAdmin', '==', true)
      .get();

    const migrations = [];

    for (const doc of adminsSnapshot.docs) {
      const userId = doc.id;

      // Set custom claim
      migrations.push(
        admin.auth().setCustomUserClaims(userId, { admin: true })
      );

      functions.logger.info('Migrated admin', { userId });
    }

    await Promise.all(migrations);

    res.status(200).json({
      success: true,
      count: migrations.length,
    });

  } catch (error) {
    functions.logger.error('Migration failed', error);
    res.status(500).json({ error: error.message });
  }
});
```

**Run migration:**
```bash
# Deploy migration function
firebase deploy --only functions:migrateAdmins

# Run migration
curl -X POST \
  -H "x-migration-secret: YOUR_SECRET_HERE" \
  https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/migrateAdmins

# Check logs
firebase functions:log --only migrateAdmins
```

#### What This Fixes:
- Reduces Firestore read costs (get() calls are expensive)
- Improves security rules performance
- Reduces latency

#### Verification:
```bash
# Deploy all changes
firebase deploy --only functions,firestore

# Test admin access:
# 1. Log in as admin user
# 2. Check Firebase Auth console - should see custom claim
# 3. Try admin operation - should work
# 4. Log in as regular user
# 5. Try admin operation - should fail immediately (no get() call)
```

---

### ✅ FIX #13: DISPLAY NAME VALIDATION (MEDIUM)
**Vulnerability:** No uniqueness check = impersonation risk
**Files:** User creation functions

**Option A: Add @username suffix (recommended - simpler)**

**File:** `/home/user/BESTIESAPP/functions/core/auth/onUserCreated.js` (or wherever user creation happens)

```javascript
/**
 * Generate unique username from display name
 */
function generateUniqueUsername(displayName, userId) {
  // Sanitize display name
  const sanitized = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove special chars
    .substring(0, 20); // Max 20 chars

  // Add unique suffix from userId (first 6 chars)
  const suffix = userId.substring(0, 6);

  return `${sanitized}_${suffix}`;
}

// In onUserCreated trigger:
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
  const userId = user.uid;
  const displayName = user.displayName || 'User';
  const username = generateUniqueUsername(displayName, userId);

  await admin.firestore().collection('users').doc(userId).set({
    displayName: displayName,
    username: username, // Unique identifier
    email: user.email,
    phoneNumber: user.phoneNumber,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
});
```

**Update frontend to display usernames:**
```javascript
// Show: "Display Name (@username_abc123)"
<span>{user.displayName} (@{user.username})</span>
```

**Option B: Enforce unique display names (harder - requires index)**

Not recommended due to race conditions and user experience issues.

---

## TESTING & VERIFICATION

### Security Testing Checklist

#### Authentication & Authorization
- [ ] Non-authenticated users cannot access protected resources
- [ ] Users cannot access other users' check-in photos
- [ ] Users cannot access other users' profile data
- [ ] Admin functions require admin role
- [ ] MFA enrollment works correctly
- [ ] MFA verification required for admin actions

#### Input Validation
- [ ] Long text inputs are rejected (>max length)
- [ ] Invalid phone numbers are rejected
- [ ] Invalid email addresses are rejected
- [ ] SQL injection attempts fail (N/A for Firestore but test anyway)
- [ ] XSS payloads are sanitized

#### File Upload Security
- [ ] Malicious SVG files are detected and deleted
- [ ] Files over size limit are rejected
- [ ] EXIF data is stripped from photos
- [ ] Non-image files cannot be uploaded as images

#### Rate Limiting
- [ ] Emergency SOS rate limit works (3 per hour)
- [ ] Rate limit errors do NOT bypass limit
- [ ] Audit logs record rate limit violations
- [ ] DDoS protection blocks excessive requests

#### Audit Logging
- [ ] SOS events are logged
- [ ] Payment events are logged
- [ ] Admin actions are logged
- [ ] Account deletions are logged
- [ ] Rate limit violations are logged
- [ ] Logs contain sufficient detail for forensics
- [ ] Sensitive data is redacted in logs

#### Dependencies
- [ ] `npm audit` shows 0 high/critical vulnerabilities (frontend)
- [ ] `npm audit` shows 0 high/critical vulnerabilities (backend)
- [ ] All packages are up to date

#### Headers & Configuration
- [ ] CSP header is present and restrictive
- [ ] X-Frame-Options header prevents clickjacking
- [ ] HSTS header enforces HTTPS
- [ ] Storage rules are restrictive
- [ ] Firestore rules are restrictive

### Automated Security Tests

**Create file:** `/home/user/BESTIESAPP/tests/security.test.js`

```javascript
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const fs = require('fs');

describe('Security Rules Tests', () => {
  let testEnv;
  let alice;
  let bob;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-besties-app',
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8'),
      },
      storage: {
        rules: fs.readFileSync('storage.rules', 'utf8'),
      },
    });

    alice = testEnv.authenticatedContext('alice');
    bob = testEnv.authenticatedContext('bob');
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  test('User cannot read other user profile', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('users').doc('bob').set({
        displayName: 'Bob',
        bestieUserIds: [],
      });
    });

    // Alice tries to read Bob's profile (not besties)
    await assertFails(
      alice.firestore().collection('users').doc('bob').get()
    );
  });

  test('User can read bestie profile', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('users').doc('alice').set({
        displayName: 'Alice',
        bestieUserIds: ['bob'],
      });
      await context.firestore().collection('users').doc('bob').set({
        displayName: 'Bob',
        bestieUserIds: ['alice'],
      });
    });

    // Alice reads Bob's profile (they're besties)
    await assertSucceeds(
      alice.firestore().collection('users').doc('bob').get()
    );
  });

  test('User cannot escalate to admin', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('users').doc('alice').set({
        displayName: 'Alice',
        isAdmin: false,
      });
    });

    // Alice tries to make herself admin
    await assertFails(
      alice.firestore().collection('users').doc('alice').update({
        isAdmin: true,
      })
    );
  });

  test('User cannot access other user check-in photos', async () => {
    // Bob tries to read Alice's check-in photo
    await assertFails(
      bob.storage().ref('checkin-photos/alice/photo.jpg').getDownloadURL()
    );
  });

  test('User can access own check-in photos', async () => {
    // Alice reads her own photo
    await assertSucceeds(
      alice.storage().ref('checkin-photos/alice/photo.jpg').getDownloadURL()
    );
  });
});
```

**Run tests:**
```bash
cd /home/user/BESTIESAPP
npm install --save-dev @firebase/rules-unit-testing
npm test
```

---

## POST-FIX MONITORING

### Set Up Security Alerts

**Create Cloud Logging alerts for:**

1. **Critical Audit Events**
```
jsonPayload.severity="critical"
```

2. **Rate Limit Violations**
```
jsonPayload.eventType="security.rate_limit_exceeded"
```

3. **Malicious File Uploads**
```
textPayload=~"MALICIOUS SVG DETECTED"
```

4. **Failed Authentication Attempts**
```
resource.type="cloud_function"
AND textPayload=~"unauthenticated"
```

5. **Admin Actions**
```
jsonPayload.eventType=~"admin.*"
```

**Set up in Google Cloud Console:**
1. Go to Logging > Logs-based Metrics
2. Create metrics for each filter above
3. Go to Monitoring > Alerting
4. Create alert policies for each metric
5. Set notification channels (email, Slack, PagerDuty)

### Regular Security Reviews

**Weekly:**
- Review audit logs for suspicious activity
- Check npm audit for new vulnerabilities
- Monitor rate limit violations

**Monthly:**
- Rotate non-critical secrets (if not automated)
- Review access controls and permissions
- Test backup/restore procedures
- Review DDoS blocks in Cloud Armor

**Quarterly:**
- Update all dependencies
- Security penetration testing
- Review and update security policies
- Conduct security training

---

## FINAL DEPLOYMENT CHECKLIST

Before deploying to production:

### Pre-Deployment
- [ ] All critical fixes (#1-6) completed
- [ ] All high-priority fixes (#7-9) completed
- [ ] All tests passing
- [ ] npm audit shows 0 high/critical vulnerabilities
- [ ] Security rules tested in emulator
- [ ] Audit logging verified working
- [ ] MFA tested for admin accounts
- [ ] File upload security tested
- [ ] Rate limiting tested
- [ ] DDoS protection enabled

### Deployment
```bash
# 1. Deploy Firestore rules
firebase deploy --only firestore

# 2. Deploy Storage rules
firebase deploy --only storage

# 3. Deploy Cloud Functions
firebase deploy --only functions

# 4. Deploy Hosting (with headers)
firebase deploy --only hosting

# 5. Verify deployment
firebase functions:log --only scanUploadedFile,logAuditEvent
```

### Post-Deployment
- [ ] Test authentication flow
- [ ] Test file uploads
- [ ] Test emergency SOS
- [ ] Test rate limiting
- [ ] Verify audit logs being written
- [ ] Check Cloud Armor dashboard
- [ ] Set up monitoring alerts
- [ ] Enable Firebase Performance Monitoring
- [ ] Enable Firebase Crashlytics

### Security Monitoring
- [ ] Cloud Logging alerts configured
- [ ] Uptime monitoring enabled
- [ ] Error tracking enabled
- [ ] Audit log review scheduled
- [ ] Incident response plan documented
- [ ] Security contact email published (security@bestiesapp.xyz)

---

## INCIDENT RESPONSE PLAN

If a security breach is detected:

### Immediate Actions (0-1 hour)
1. **Contain the breach:**
   - Disable affected user accounts
   - Revoke compromised API keys
   - Block malicious IP addresses in Cloud Armor

2. **Assess the damage:**
   - Review audit logs
   - Identify compromised data
   - Determine breach scope

3. **Notify stakeholders:**
   - Inform engineering team
   - Alert management
   - Prepare user communication

### Short-term Actions (1-24 hours)
1. **Patch the vulnerability:**
   - Deploy security fixes
   - Test thoroughly
   - Deploy to production

2. **Rotate all secrets:**
   - Follow secret rotation procedures
   - Update all API keys
   - Revoke old credentials

3. **Document the incident:**
   - Timeline of events
   - Root cause analysis
   - Remediation steps taken

### Long-term Actions (1-7 days)
1. **User notification:**
   - Email affected users
   - Provide remediation steps
   - Offer support

2. **Regulatory compliance:**
   - GDPR breach notification (if EU users affected)
   - CCPA compliance (if CA users affected)
   - Document all actions

3. **Post-mortem:**
   - Conduct team review
   - Update security procedures
   - Implement preventive measures

---

## ADDITIONAL RESOURCES

### Security Tools
- **Firebase Security Rules Validator:** https://firebase.google.com/docs/rules/unit-tests
- **npm audit:** Built into npm (npm audit)
- **Snyk:** https://snyk.io/ (automated dependency scanning)
- **OWASP ZAP:** https://www.zaproxy.org/ (penetration testing)
- **Burp Suite:** https://portswigger.net/burp (security testing)

### Documentation
- **OWASP Top 10:** https://owasp.org/www-project-top-ten/
- **Firebase Security Checklist:** https://firebase.google.com/support/guides/security-checklist
- **Google Cloud Security:** https://cloud.google.com/security/best-practices

### Compliance
- **GDPR:** https://gdpr.eu/
- **CCPA:** https://oag.ca.gov/privacy/ccpa
- **SOC2:** https://www.aicpa.org/interestareas/frc/assuranceadvisoryservices/soc2

---

## ESTIMATED TIMELINE

**Week 1 (Critical):** 20-30 hours
- Fix #1: Storage rules (2 hours)
- Fix #2: Profile picture access (1 hour)
- Fix #3: Dependency updates (4 hours)
- Fix #4: Audit logging (8 hours)
- Fix #5: File scanning (6 hours)
- Fix #6: Rate limit fix (2 hours)
- Testing (5 hours)

**Week 2 (High):** 15-20 hours
- Fix #7: Input validation (4 hours)
- Fix #8: DDoS protection (6 hours)
- Fix #9: MFA implementation (8 hours)
- Testing (3 hours)

**Week 3-4 (Medium):** 10-15 hours
- Fix #10: CSP headers (2 hours)
- Fix #11: Secret rotation (3 hours)
- Fix #12: Admin claims (4 hours)
- Fix #13: Display names (2 hours)
- Final testing (4 hours)

**Total: 45-65 hours of development work**

---

## CONTACT & SUPPORT

**Questions about these fixes?**
- Document any issues encountered
- Test thoroughly in staging environment first
- Never deploy directly to production without testing

**Security concerns?**
- Email: security@bestiesapp.xyz (create this!)
- Audit logs location: Firestore > audit_logs collection
- Cloud Logging: Google Cloud Console > Logging

---

## VERSION HISTORY

- v1.0 (2025-12-12): Initial security fix instructions
- Next update: After implementation (document any deviations or issues)

---

**REMEMBER:** Security is not a one-time fix. It's an ongoing process. Schedule regular security reviews and stay updated on new vulnerabilities.

**PRIORITY:** Complete ALL critical fixes (1-6) before any public launch or marketing.

Good luck! 🔒
