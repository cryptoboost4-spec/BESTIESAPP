# SMS Escalation & Notification System - Implementation Specification

## 🎯 Overview

Implement a **smart SMS escalation system** that sends SMS alerts to besties **one at a time** rather than all at once, to conserve SMS credits while ensuring someone responds.

### **Current Behavior (Problem):**
- When check-in expires or emergency SOS triggered → SMS sent to **ALL besties simultaneously**
- If user has 5 besties → uses 5 SMS credits at once
- Wasteful if first bestie would have responded

### **New Behavior (Solution):**
- **Free channels** (Telegram, Messenger, Email, Push) → sent to **ALL besties immediately**
- **SMS** → sent to **one bestie at a time** with **escalation logic**:
  1. Send SMS to **Bestie #1**
  2. Wait **5 minutes**
  3. Check if anyone has **viewed/responded** to the alert
  4. If NO response → Send SMS to **Bestie #2**
  5. Repeat until someone responds or all besties contacted

### **Benefits:**
- ✅ Conserves SMS credits (average 1-2 SMS instead of 5)
- ✅ Still ensures alerts get through
- ✅ Free channels reach everyone immediately
- ✅ SMS acts as escalating backup

---

## ⚠️ Critical Requirements

1. **FREE CHANNELS ALWAYS BROADCAST:** All besties get Telegram/Messenger/Email/Push immediately
2. **SMS ESCALATES:** Only send SMS to one bestie at a time
3. **5-MINUTE INTERVALS:** Wait 5 minutes between SMS escalations
4. **RESPONSE DETECTION:** Track if anyone viewed alert or took action in app
5. **CREDIT EFFICIENT:** Only use as many SMS credits as needed to get a response
6. **PRIORITY ORDER:** Send to besties in priority order (featured circle first)
7. **NO BREAKING CHANGES:** Existing alerts/notifications continue to work
8. **EMERGENCY EXCEPTION:** Emergency SOS can optionally send to all (configurable)

---

## 📊 Database Schema Changes

### **File:** `DATABASE_SCHEMA.md`

### **New Collection:** `sms_escalation_queue`

```javascript
sms_escalation_queue/{queueId}
{
  // Alert details
  alertId: string,              // checkinId or sosId
  alertType: 'check_in' | 'emergency_sos' | 'duress_code',
  userId: string,               // Who triggered the alert

  // Message content
  message: string,              // SMS message to send
  shortMessage: string,         // Short version (under 160 chars)

  // Escalation queue
  bestieQueue: [                // Array of bestie IDs in priority order
    'bestieId1',
    'bestieId2',
    'bestieId3'
  ],
  currentBestieIndex: 0,        // Which bestie we're currently escalating to

  // Timing
  createdAt: Timestamp,
  nextEscalationAt: Timestamp,  // When to send next SMS (createdAt + 5 mins)
  lastEscalationAt: Timestamp | null,

  // Status tracking
  status: 'pending' | 'escalating' | 'responded' | 'completed' | 'cancelled',
  responseDetectedAt: Timestamp | null,
  respondedBy: string | null,   // userId who responded

  // SMS tracking
  smsSentTo: [                  // Array of bestie IDs who received SMS
    {
      bestieId: string,
      sentAt: Timestamp,
      twilioSid: string,
      creditUsed: boolean
    }
  ],
  totalSmsUsed: 0,              // Total SMS credits used for this alert

  // Metadata
  completedAt: Timestamp | null,
  cancelReason: string | null
}
```

### **New Collection:** `alert_responses` (track who viewed/responded)

```javascript
alert_responses/{responseId}
{
  alertId: string,              // checkinId or sosId
  alertType: 'check_in' | 'emergency_sos',
  userId: string,               // Who responded (bestie)

  // Response type
  responseType: 'viewed' | 'acknowledged' | 'replied' | 'action_taken',

  // Details
  viewedAt: Timestamp | null,
  acknowledgedAt: Timestamp | null,
  repliedAt: Timestamp | null,
  replyMessage: string | null,

  // Context
  channel: 'in_app' | 'telegram' | 'messenger' | 'sms' | 'email',
  deviceInfo: string | null,

  createdAt: Timestamp
}
```

### **Update existing users/{userId}:**

```javascript
// Add bestie priority settings
bestiePriority: [              // Ordered list of bestie IDs for SMS escalation
  'bestieId1',                 // Highest priority (featured circle)
  'bestieId2',
  'bestieId3'
],

// SMS escalation preferences (NEW)
smsEscalationSettings: {
  enabled: true,               // Use escalation vs. broadcast
  intervalMinutes: 5,          // Minutes to wait between escalations
  emergencyBroadcast: false,   // Send to all immediately for SOS (override escalation)
  maxEscalations: 10           // Stop after this many besties (prevent infinite loop)
}
```

---

## 🔧 Backend Implementation

### **1. Escalation Queue Manager**

**File:** `functions/utils/smsEscalation.js` (NEW FILE)

```javascript
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { sendSMSAlert } = require('./notifications');

const db = admin.firestore();

/**
 * Create escalation queue for an alert
 * Determines priority order of besties and schedules first SMS
 */
async function createEscalationQueue(alertData) {
  const { alertId, alertType, userId, bestieIds, message, shortMessage } = alertData;

  // Get user's bestie priority order
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();
  const bestiePriority = userData.bestiePriority || [];
  const escalationSettings = userData.smsEscalationSettings || {
    enabled: true,
    intervalMinutes: 5,
    emergencyBroadcast: false,
    maxEscalations: 10
  };

  // Check if we should use escalation or broadcast
  const shouldEscalate = escalationSettings.enabled &&
                        !(alertType === 'emergency_sos' && escalationSettings.emergencyBroadcast);

  if (!shouldEscalate) {
    // Broadcast mode - send to all besties immediately
    return { mode: 'broadcast', bestieIds };
  }

  // Build priority-sorted bestie queue
  const bestieQueue = sortBestiesByPriority(bestieIds, bestiePriority, userData.featuredCircle);

  // Create escalation queue document
  const queueRef = await db.collection('sms_escalation_queue').add({
    alertId,
    alertType,
    userId,
    message,
    shortMessage,
    bestieQueue,
    currentBestieIndex: 0,
    createdAt: admin.firestore.Timestamp.now(),
    nextEscalationAt: admin.firestore.Timestamp.now(), // Send first SMS immediately
    lastEscalationAt: null,
    status: 'pending',
    responseDetectedAt: null,
    respondedBy: null,
    smsSentTo: [],
    totalSmsUsed: 0,
    completedAt: null,
    cancelReason: null
  });

  functions.logger.info('Created SMS escalation queue', {
    queueId: queueRef.id,
    alertId,
    bestieCount: bestieQueue.length
  });

  return { mode: 'escalation', queueId: queueRef.id };
}

/**
 * Sort besties by priority for escalation
 * Priority order: Featured circle → Manual priority → Alphabetical
 */
function sortBestiesByPriority(bestieIds, bestiePriority, featuredCircle) {
  return bestieIds.sort((a, b) => {
    // Featured circle first
    const aInCircle = featuredCircle?.includes(a);
    const bInCircle = featuredCircle?.includes(b);
    if (aInCircle && !bInCircle) return -1;
    if (!aInCircle && bInCircle) return 1;

    // Then by manual priority
    const aPriority = bestiePriority.indexOf(a);
    const bPriority = bestiePriority.indexOf(b);
    if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;
    if (aPriority !== -1) return -1;
    if (bPriority !== -1) return 1;

    // Finally alphabetical by ID
    return a.localeCompare(b);
  });
}

/**
 * Process escalation queue - send next SMS if needed
 * Called by cron job every minute
 */
async function processEscalationQueue(queueId) {
  const queueRef = db.collection('sms_escalation_queue').doc(queueId);

  return db.runTransaction(async (transaction) => {
    const queueDoc = await transaction.get(queueRef);

    if (!queueDoc.exists) {
      throw new Error('Queue not found');
    }

    const queue = queueDoc.data();

    // Check if queue is still active
    if (queue.status !== 'pending' && queue.status !== 'escalating') {
      return { action: 'skip', reason: `Queue status: ${queue.status}` };
    }

    // Check if someone responded
    const hasResponse = await checkForResponse(queue.alertId, queue.alertType);
    if (hasResponse.responded) {
      transaction.update(queueRef, {
        status: 'responded',
        responseDetectedAt: admin.firestore.Timestamp.now(),
        respondedBy: hasResponse.responderId,
        completedAt: admin.firestore.Timestamp.now()
      });

      return {
        action: 'completed',
        reason: 'Response detected',
        responderId: hasResponse.responderId
      };
    }

    // Check if it's time for next escalation
    const now = Date.now();
    const nextEscalationTime = queue.nextEscalationAt.toMillis();

    if (now < nextEscalationTime) {
      return { action: 'wait', reason: 'Not time yet', waitMs: nextEscalationTime - now };
    }

    // Check if we've exhausted the queue
    if (queue.currentBestieIndex >= queue.bestieQueue.length) {
      transaction.update(queueRef, {
        status: 'completed',
        completedAt: admin.firestore.Timestamp.now(),
        cancelReason: 'All besties contacted, no response'
      });

      return { action: 'exhausted', reason: 'No more besties to contact' };
    }

    // Send SMS to next bestie
    const bestieId = queue.bestieQueue[queue.currentBestieIndex];
    const bestieDoc = await db.collection('users').doc(bestieId).get();
    const bestieData = bestieDoc.data();

    // Check if bestie has SMS enabled and phone number
    if (!bestieData.phoneNumber || !bestieData.notificationPreferences?.sms) {
      // Skip this bestie, move to next
      transaction.update(queueRef, {
        currentBestieIndex: queue.currentBestieIndex + 1,
        lastEscalationAt: admin.firestore.Timestamp.now()
      });

      return {
        action: 'skip_bestie',
        reason: 'No SMS enabled or phone number',
        bestieId
      };
    }

    // Send the SMS
    let smsResult;
    try {
      smsResult = await sendSMSAlert(bestieData.phoneNumber, queue.shortMessage, {
        userId: queue.userId,
        recipientId: bestieId,
        alertType: queue.alertType,
        checkinId: queue.alertType === 'check_in' ? queue.alertId : null,
        sosId: queue.alertType === 'emergency_sos' ? queue.alertId : null
      });

      // Update queue with SMS sent info
      transaction.update(queueRef, {
        status: 'escalating',
        currentBestieIndex: queue.currentBestieIndex + 1,
        lastEscalationAt: admin.firestore.Timestamp.now(),
        nextEscalationAt: admin.firestore.Timestamp.fromDate(
          new Date(now + 5 * 60 * 1000)  // Next escalation in 5 minutes
        ),
        smsSentTo: admin.firestore.FieldValue.arrayUnion({
          bestieId,
          sentAt: admin.firestore.Timestamp.now(),
          twilioSid: smsResult.sid,
          creditUsed: true
        }),
        totalSmsUsed: admin.firestore.FieldValue.increment(1)
      });

      return {
        action: 'sms_sent',
        bestieId,
        twilioSid: smsResult.sid,
        nextEscalationIn: '5 minutes'
      };

    } catch (error) {
      // SMS failed - log and skip to next bestie
      functions.logger.error('SMS escalation failed', {
        queueId,
        bestieId,
        error: error.message
      });

      transaction.update(queueRef, {
        currentBestieIndex: queue.currentBestieIndex + 1,
        lastEscalationAt: admin.firestore.Timestamp.now()
      });

      return {
        action: 'sms_failed',
        bestieId,
        error: error.message
      };
    }
  });
}

/**
 * Check if anyone has responded to the alert
 * Returns: { responded: boolean, responderId: string | null }
 */
async function checkForResponse(alertId, alertType) {
  // Check alert_responses collection
  const responsesSnapshot = await db.collection('alert_responses')
    .where('alertId', '==', alertId)
    .where('alertType', '==', alertType)
    .where('responseType', 'in', ['viewed', 'acknowledged', 'replied', 'action_taken'])
    .limit(1)
    .get();

  if (!responsesSnapshot.empty) {
    const response = responsesSnapshot.docs[0].data();
    return {
      responded: true,
      responderId: response.userId,
      responseType: response.responseType
    };
  }

  // Also check if alert status changed (e.g., check-in completed)
  if (alertType === 'check_in') {
    const checkinDoc = await db.collection('checkins').doc(alertId).get();
    const checkinData = checkinDoc.data();

    if (checkinData?.status === 'completed' || checkinData?.status === 'safe') {
      return {
        responded: true,
        responderId: checkinData.completedBy || null,
        responseType: 'action_taken'
      };
    }
  }

  return { responded: false, responderId: null };
}

/**
 * Cancel escalation queue (e.g., if alert is manually cancelled)
 */
async function cancelEscalationQueue(alertId, reason) {
  const queueSnapshot = await db.collection('sms_escalation_queue')
    .where('alertId', '==', alertId)
    .where('status', 'in', ['pending', 'escalating'])
    .get();

  const batch = db.batch();

  queueSnapshot.forEach(doc => {
    batch.update(doc.ref, {
      status: 'cancelled',
      cancelReason: reason,
      completedAt: admin.firestore.Timestamp.now()
    });
  });

  await batch.commit();

  return { cancelled: queueSnapshot.size };
}

module.exports = {
  createEscalationQueue,
  processEscalationQueue,
  checkForResponse,
  cancelEscalationQueue,
  sortBestiesByPriority
};
```

---

### **2. Response Tracking Functions**

**File:** `functions/utils/responseTracking.js` (NEW FILE)

```javascript
const admin = require('firebase-admin');
const db = admin.firestore();

/**
 * Record that a user viewed an alert
 * Called when user opens alert notification or views in app
 */
async function recordAlertView(userId, alertId, alertType, channel = 'in_app') {
  // Check if already recorded
  const existingSnapshot = await db.collection('alert_responses')
    .where('alertId', '==', alertId)
    .where('userId', '==', userId)
    .where('responseType', '==', 'viewed')
    .limit(1)
    .get();

  if (!existingSnapshot.empty) {
    return { recorded: false, reason: 'Already recorded' };
  }

  // Record the view
  await db.collection('alert_responses').add({
    alertId,
    alertType,
    userId,
    responseType: 'viewed',
    viewedAt: admin.firestore.Timestamp.now(),
    acknowledgedAt: null,
    repliedAt: null,
    replyMessage: null,
    channel,
    deviceInfo: null,
    createdAt: admin.firestore.Timestamp.now()
  });

  return { recorded: true };
}

/**
 * Record that a user acknowledged an alert
 * Called when user clicks "I'm safe" or similar action
 */
async function recordAlertAcknowledgement(userId, alertId, alertType) {
  await db.collection('alert_responses').add({
    alertId,
    alertType,
    userId,
    responseType: 'acknowledged',
    viewedAt: admin.firestore.Timestamp.now(),
    acknowledgedAt: admin.firestore.Timestamp.now(),
    repliedAt: null,
    replyMessage: null,
    channel: 'in_app',
    deviceInfo: null,
    createdAt: admin.firestore.Timestamp.now()
  });

  return { recorded: true };
}

/**
 * Record that a user replied to an alert
 */
async function recordAlertReply(userId, alertId, alertType, replyMessage, channel = 'in_app') {
  await db.collection('alert_responses').add({
    alertId,
    alertType,
    userId,
    responseType: 'replied',
    viewedAt: admin.firestore.Timestamp.now(),
    acknowledgedAt: null,
    repliedAt: admin.firestore.Timestamp.now(),
    replyMessage,
    channel,
    deviceInfo: null,
    createdAt: admin.firestore.Timestamp.now()
  });

  return { recorded: true };
}

module.exports = {
  recordAlertView,
  recordAlertAcknowledgement,
  recordAlertReply
};
```

---

### **3. Update Check-In Alert System**

**File:** `functions/index.js` - Update `scheduledSMS` processor

**Current location:** Around line 1027-1160

**Changes:**

```javascript
// BEFORE: Send SMS to all besties immediately
for (const bestieId of bestieIds) {
  const bestieDoc = await db.collection('users').doc(bestieId).get();
  if (!bestieDoc.exists) continue;

  const bestieData = bestieDoc.data();

  if (bestieData?.phoneNumber &&
      bestieData?.notificationPreferences?.sms &&
      bestieData?.smsSubscription?.active) {
    await sendSMSAlert(bestieData.phoneNumber, smsMessage, {
      userId: checkinData.userId,
      recipientId: bestieId,
      alertType: 'check_in',
      checkinId: checkinId
    });
  }
}

// AFTER: Create escalation queue instead
const { createEscalationQueue } = require('./utils/smsEscalation');

const escalationResult = await createEscalationQueue({
  alertId: checkinId,
  alertType: 'check_in',
  userId: checkinData.userId,
  bestieIds: bestieIds,
  message: fullMessage,
  shortMessage: smsMessage
});

if (escalationResult.mode === 'broadcast') {
  // User opted for broadcast mode - send to all
  for (const bestieId of bestieIds) {
    // ... existing SMS send logic
  }
} else if (escalationResult.mode === 'escalation') {
  functions.logger.info('SMS escalation queue created', {
    queueId: escalationResult.queueId,
    checkinId
  });
  // Escalation will be handled by cron job
}
```

---

### **4. Create Escalation Processor Cron Job**

**File:** `functions/index.js` (add to exports)

```javascript
/**
 * Process SMS escalation queues
 * Runs every minute to check for pending escalations
 */
exports.processSmsEscalations = functions.pubsub
  .schedule('* * * * *')  // Every minute
  .timeZone('UTC')
  .onRun(async (context) => {
    const { processEscalationQueue } = require('./utils/smsEscalation');

    // Get all active escalation queues that need processing
    const now = admin.firestore.Timestamp.now();

    const queuesSnapshot = await db.collection('sms_escalation_queue')
      .where('status', 'in', ['pending', 'escalating'])
      .where('nextEscalationAt', '<=', now)
      .limit(50)  // Process max 50 per minute
      .get();

    if (queuesSnapshot.empty) {
      return null;
    }

    functions.logger.info('Processing SMS escalation queues', {
      count: queuesSnapshot.size
    });

    // Process each queue
    const results = await Promise.allSettled(
      queuesSnapshot.docs.map(doc => processEscalationQueue(doc.id))
    );

    // Log results
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    functions.logger.info('SMS escalation processing complete', {
      total: queuesSnapshot.size,
      successful,
      failed
    });

    return { processed: queuesSnapshot.size, successful, failed };
  });
```

---

### **5. Update Emergency SOS Trigger**

**File:** `functions/core/emergency/triggerEmergencySOS.js`

**Around line 277-284**

**Add escalation option:**

```javascript
// After sending free channel notifications to all besties...

// Check if user wants SMS broadcast or escalation for emergencies
const userDoc = await db.collection('users').doc(userId).get();
const userData = userDoc.data();
const emergencyBroadcast = userData.smsEscalationSettings?.emergencyBroadcast || false;

if (emergencyBroadcast) {
  // Send SMS to all besties immediately (current behavior)
  for (const bestieId of bestieIds) {
    // ... existing SMS send logic
  }
} else {
  // Use escalation queue
  const { createEscalationQueue } = require('../../utils/smsEscalation');

  await createEscalationQueue({
    alertId: sosRef.id,
    alertType: 'emergency_sos',
    userId: userId,
    bestieIds: bestieIds,
    message: fullAlertMessage,
    shortMessage: shortAlertMessage
  });
}
```

---

### **6. Frontend Response Tracking**

**File:** `frontend/src/components/alerts/AlertNotification.jsx` (or wherever alerts are displayed)

**Add tracking when user views alert:**

```javascript
import { doc, addDoc, collection } from 'firebase/firestore';
import { db } from '../../services/firebase';

const AlertNotification = ({ alert, currentUser }) => {
  useEffect(() => {
    // Track alert view when component mounts
    const trackView = async () => {
      if (!alert || !currentUser) return;

      try {
        await addDoc(collection(db, 'alert_responses'), {
          alertId: alert.id,
          alertType: alert.type,  // 'check_in' or 'emergency_sos'
          userId: currentUser.uid,
          responseType: 'viewed',
          viewedAt: new Date(),
          acknowledgedAt: null,
          repliedAt: null,
          replyMessage: null,
          channel: 'in_app',
          deviceInfo: navigator.userAgent,
          createdAt: new Date()
        });
      } catch (error) {
        console.error('Error tracking alert view:', error);
      }
    };

    trackView();
  }, [alert, currentUser]);

  // ... rest of component
};
```

**Add tracking when user acknowledges:**

```javascript
const handleAcknowledge = async () => {
  try {
    // Complete the check-in or SOS
    await completeCheckIn(alert.id);

    // Track acknowledgement
    await addDoc(collection(db, 'alert_responses'), {
      alertId: alert.id,
      alertType: alert.type,
      userId: currentUser.uid,
      responseType: 'acknowledged',
      viewedAt: new Date(),
      acknowledgedAt: new Date(),
      repliedAt: null,
      replyMessage: null,
      channel: 'in_app',
      deviceInfo: navigator.userAgent,
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
  }
};
```

---

### **7. Settings UI for Escalation Preferences**

**File:** `frontend/src/pages/SettingsPage.jsx`

**Add SMS escalation settings section:**

```jsx
<div className="card p-6 mb-6">
  <h3 className="text-lg font-display text-text-primary mb-3">
    SMS Escalation Settings
  </h3>

  <div className="space-y-4">
    {/* Enable/Disable Escalation */}
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-text-primary">Smart SMS Escalation</p>
        <p className="text-sm text-text-secondary">
          Send SMS to one bestie at a time to save credits
        </p>
      </div>
      <button
        onClick={() => toggleEscalationSetting('enabled')}
        className={`toggle ${escalationSettings.enabled ? 'active' : ''}`}
      >
        {escalationSettings.enabled ? 'On' : 'Off'}
      </button>
    </div>

    {/* Emergency Broadcast Option */}
    {escalationSettings.enabled && (
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-text-primary">Emergency Broadcast</p>
          <p className="text-sm text-text-secondary">
            Send to all besties immediately for emergency SOS
          </p>
        </div>
        <button
          onClick={() => toggleEscalationSetting('emergencyBroadcast')}
          className={`toggle ${escalationSettings.emergencyBroadcast ? 'active' : ''}`}
        >
          {escalationSettings.emergencyBroadcast ? 'On' : 'Off'}
        </button>
      </div>
    )}

    {/* Escalation Interval */}
    {escalationSettings.enabled && (
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Wait time between escalations
        </label>
        <select
          value={escalationSettings.intervalMinutes}
          onChange={(e) => updateEscalationInterval(Number(e.target.value))}
          className="select"
        >
          <option value={3}>3 minutes</option>
          <option value={5}>5 minutes</option>
          <option value={10}>10 minutes</option>
          <option value={15}>15 minutes</option>
        </select>
      </div>
    )}

    {/* Info Box */}
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
      <p className="text-sm text-blue-800 dark:text-blue-200">
        <strong>How it works:</strong> Free channels (Telegram, Email) go to all besties instantly.
        SMS is sent to one bestie at a time, waiting for a response before contacting the next.
        This saves credits while ensuring someone responds.
      </p>
    </div>
  </div>
</div>
```

---

## 🧪 Testing Requirements

### **Backend Tests**

**File:** `functions/utils/__tests__/smsEscalation.test.js`

Test cases:
1. ✅ `sortBestiesByPriority` orders correctly (featured circle → priority → alphabetical)
2. ✅ `createEscalationQueue` creates queue with correct data
3. ✅ `processEscalationQueue` sends SMS to first bestie
4. ✅ `processEscalationQueue` waits 5 minutes before next escalation
5. ✅ `processEscalationQueue` skips besties without SMS enabled
6. ✅ `processEscalationQueue` stops when response detected
7. ✅ `processEscalationQueue` completes when all besties contacted
8. ✅ `checkForResponse` detects alert_responses correctly
9. ✅ `checkForResponse` detects check-in completion
10. ✅ `cancelEscalationQueue` cancels active queues

### **Integration Tests**

1. ✅ Full escalation flow: Create queue → Process → Response → Complete
2. ✅ No response flow: Create queue → Process all besties → Complete
3. ✅ Response tracking: View alert → Check queue stops
4. ✅ Broadcast mode: Emergency with emergencyBroadcast=true sends to all
5. ✅ SMS credit usage: Verify credits deducted only for sent SMS

### **Manual Testing Checklist**

- [ ] Create check-in with 5 besties, only 1 has SMS enabled
- [ ] Verify free channels sent to all immediately
- [ ] Verify SMS sent to first bestie only
- [ ] Wait 5 minutes, verify no second SMS (because first bestie responded)
- [ ] Create check-in, don't respond, verify SMS escalates every 5 mins
- [ ] Verify escalation stops after someone views alert
- [ ] Test emergency SOS with broadcast mode
- [ ] Test emergency SOS with escalation mode
- [ ] Verify settings UI updates escalation preferences
- [ ] Check sms_escalation_queue collection populated correctly
- [ ] Check alert_responses collection tracks views

---

## 🚀 Deployment Checklist

### **Pre-Deployment**

1. **Update DATABASE_SCHEMA.md:**
   - [ ] Add `sms_escalation_queue` collection
   - [ ] Add `alert_responses` collection
   - [ ] Add `bestiePriority` and `smsEscalationSettings` to users

2. **Dependencies:**
   - [ ] No new npm packages required (uses existing Firebase/Twilio)

3. **Test in development:**
   - [ ] Run all unit tests: `cd functions && npm test`
   - [ ] Test escalation queue processing locally
   - [ ] Test response tracking

### **Deployment Steps**

```bash
# 1. Deploy Firebase Functions (backend)
cd functions
npm install
npm test
cd ..
firebase deploy --only functions

# 2. Deploy Frontend
git add .
git commit -m "Implement SMS escalation notification system"
git push origin [your-branch]

# Frontend will auto-deploy via git preview
```

### **Post-Deployment**

1. **Verify Cron Job:**
   - [ ] Check Cloud Scheduler in GCP console
   - [ ] Verify `processSmsEscalations` scheduled for every minute
   - [ ] Test manual trigger to ensure it works

2. **Database Migration:**

   Run this script to add default escalation settings to existing users:

   ```javascript
   const admin = require('firebase-admin');
   const db = admin.firestore();

   async function migrateUsers() {
     const usersSnapshot = await db.collection('users').get();

     for (const doc of usersSnapshot.docs) {
       const data = doc.data();

       // Skip if already has escalation settings
       if (data.smsEscalationSettings) continue;

       // Initialize with defaults
       await doc.ref.update({
         smsEscalationSettings: {
           enabled: true,
           intervalMinutes: 5,
           emergencyBroadcast: false,
           maxEscalations: 10
         },
         bestiePriority: data.featuredCircle || []  // Initialize from featured circle
       });
     }
   }

   migrateUsers();
   ```

3. **Monitor:**
   - [ ] Check Cloud Functions logs for escalation processing
   - [ ] Monitor `sms_escalation_queue` collection
   - [ ] Monitor `alert_responses` collection
   - [ ] Check SMS credit usage vs. before (should decrease)

---

## 📊 Success Metrics

After deployment, track these metrics:

1. **SMS Efficiency:**
   - Average SMS per alert (before vs. after)
   - Target: Reduce from 3-5 SMS to 1-2 SMS per alert

2. **Response Rate:**
   - % of alerts that get response after first SMS
   - % of alerts that require escalation
   - Average escalations per alert

3. **Response Time:**
   - Average time to first response
   - Ensure escalation doesn't significantly delay responses

4. **Cost Savings:**
   - Total SMS credits used per month (before vs. after)
   - Target: 50-70% reduction in SMS usage

---

## 🔄 Integration with Existing SMS Credit System

This system integrates seamlessly with the SMS credit system already implemented:

1. **Credit Deduction:** Still uses `sendSMSAlert()` which checks credits and deducts
2. **Rate Limiting:** Still enforces 5 SMS/hour limit
3. **Emergency Override:** Still allows 1 free SMS for SOS
4. **Audit Trail:** Still logs to `sms_usage` collection

**Changes:**
- SMS now sent one-at-a-time instead of broadcast
- Credits used more efficiently (1-2 per alert vs. 5)
- All existing credit logic remains unchanged

---

## ⚠️ Edge Cases & Considerations

### **1. All Besties Have No SMS**
- Queue created but no SMS sent
- Escalation completes immediately
- Only free channels notified

### **2. User Has 0 Credits Mid-Escalation**
- First SMS may send (if had 1 credit)
- Subsequent escalations fail with `INSUFFICIENT_SMS_CREDITS`
- Queue continues but skips SMS-only besties

### **3. Alert Cancelled Mid-Escalation**
- Call `cancelEscalationQueue()` when check-in completed
- Prevents wasting credits on resolved alerts

### **4. Multiple Alerts from Same User**
- Each alert gets its own queue
- Queues process independently
- Rate limiting still applies globally (5 SMS/hour total)

### **5. Bestie Responds on Different Channel**
- Response detection works across all channels
- Viewing alert in-app stops SMS escalation
- Telegram/Messenger responses also tracked

---

## 🎯 Summary for Implementation

**Goal:** Send SMS to besties one-at-a-time with 5-minute intervals to conserve credits

**Key Files to Create:**
- `functions/utils/smsEscalation.js` - Queue management
- `functions/utils/responseTracking.js` - Response detection
- `functions/utils/__tests__/smsEscalation.test.js` - Tests

**Key Files to Modify:**
- `functions/index.js` - Add cron job, update check-in alerts
- `functions/core/emergency/triggerEmergencySOS.js` - Add escalation option
- `frontend/src/pages/SettingsPage.jsx` - Add escalation settings UI
- `frontend/src/components/alerts/AlertNotification.jsx` - Add response tracking

**New Collections:**
- `sms_escalation_queue` - Escalation queue management
- `alert_responses` - Track who viewed/responded

**Critical Logic:**
1. Create queue with priority-sorted besties
2. Cron job processes queue every minute
3. Send SMS to next bestie if no response
4. Track responses to stop escalation
5. Complete queue when responded or exhausted

**Testing:**
- Unit tests for queue logic
- Integration tests for full flow
- Manual testing with real alerts

**Deployment:**
- Deploy backend functions
- Deploy frontend
- Add cron job to Cloud Scheduler
- Run migration for existing users

---

END OF SPECIFICATION
