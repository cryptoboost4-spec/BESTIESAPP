# 📬 Comprehensive Notification System Documentation

## Table of Contents
1. [Complete Notification List](#complete-notification-list)
2. [SMS Fallback System](#sms-fallback-system)
3. [Notification Architecture](#notification-architecture)
4. [Channel Priority & Fallback Logic](#channel-priority--fallback-logic)
5. [Issues & Broken Parts](#issues--broken-parts)
6. [Areas Needing Attention](#areas-needing-attention)
7. [Questions & Clarifications](#questions--clarifications)

---

## Complete Notification List

### 🆘 Emergency Notifications

#### 1. Emergency SOS Alert
- **Type:** `emergency_sos`
- **Trigger:** User clicks SOS button and completes 5-second countdown
- **Sent To:** 
  - All besties in user's circle (`isFavorite=true`) with notifications enabled
  - All active Facebook Messenger contacts
- **Channels:** Push → Telegram → Messenger → WhatsApp → Email → SMS → In-app
- **Message (Full):** `🆘 EMERGENCY: [Name] triggered SOS! Location: [location]. Help immediately!`
- **Message (Short/SMS):** `EMERGENCY: [Name] needs help NOW! Location: [location]. Check Besties app!`
- **Reverse PIN Variant:** `🚨 SILENT EMERGENCY: [Name] triggered reverse PIN. Location: [location]. Covert distress signal.`
- **Code Location:** `functions/core/emergency/triggerEmergencySOS.js`
- **Special Features:**
  - Emergency override: SMS sent even at 0 credits (creates negative balance)
  - Rate limited: 3 SOS per hour per user
  - Always creates in-app notification regardless of settings
  - Tracks notification status in `notification_status` collection

#### 2. Duress Code Alert
- **Type:** `critical_alert` (internal flag: `_internal_duress`)
- **Trigger:** User enters duress code to cancel a check-in
- **Sent To:** All circle besties (`isFavorite=true`, `acceptedOnly=true`)
- **Channels:** Push → WhatsApp → SMS → Email → In-app
- **Message (Full):** `🚨🚨 DURESS CODE ALERT 🚨🚨\n\n[Name] used their DURESS CODE.\n\nThis means they are in DANGER and were FORCED to cancel a check-in.\n\nLocation: [location]\n\nACT IMMEDIATELY - Contact authorities if you cannot reach them!`
- **Message (Short/SMS):** `🚨 DURESS: [Name] is in danger! Location: [location]. Call police!`
- **Code Location:** `functions/core/emergency/onDuressCodeUsed.js`
- **Special Features:**
  - Treated as `emergency_sos` for SMS credit override
  - Sent via ALL available channels (critical priority)
  - Uses generic `critical_alert` type in notifications to hide duress nature

---

### ✅ Check-in Notifications

#### 3. Check-in Created
- **Type:** `checkInCreated`
- **Trigger:** User creates a new check-in
- **Sent To:** Selected besties (`bestieIds` array) + selected messenger contacts
- **Channels:** Push → Telegram → Email → Messenger → In-app
- **Message:** `👀 [Name] just started a check-in - they're at [location] for the next [duration] mins. Keep an eye out!`
- **Code Location:** `functions/utils/checkInNotifications.js` → `notifyBestiesAboutCheckIn()`
- **Special Features:**
  - Only sent via FREE channels (no SMS)
  - Messenger contacts notified once (not per bestie to avoid duplicates)
  - Can be toggled via `NOTIFICATION_CONFIG.checkInCreated`

#### 4. Check-in Extended
- **Type:** `checkInExtended`
- **Trigger:** User extends an active check-in
- **Sent To:** Selected besties + selected messenger contacts
- **Channels:** Push → Telegram → Email → Messenger → In-app
- **Message:** `⏱️ [Name] extended their check-in by [extension] minutes. New end time: [newEndTime]`
- **Code Location:** `functions/utils/checkInNotifications.js` → `notifyBestiesAboutCheckIn()`
- **Special Features:**
  - Only sent via FREE channels (no SMS)
  - Messenger contacts notified once

#### 5. Check-in Completed
- **Type:** `checkInCompleted`
- **Trigger:** User marks check-in as "I'm Safe"
- **Sent To:** Selected besties (NOT messenger contacts - too much spam)
- **Channels:** Push → Telegram → In-app
- **Message:** `✅ [Name] checked in safely! All good 💜`
- **Code Location:** `functions/utils/checkInNotifications.js` → `notifyBestiesAboutCheckIn()`
- **Special Features:**
  - Only sent via FREE channels (no SMS, no email, no messenger)

#### 6. Check-in Alert (Missed/Expired)
- **Type:** `check_in_alert`
- **Trigger:** Check-in expires without being completed
- **Sent To:** Selected besties (cascading - one at a time with exponential backoff)
- **Channels:** Push → Telegram → Messenger → WhatsApp → Email → SMS → In-app
- **Message (Full):** `🚨 SAFETY ALERT: [Name] hasn't checked in from [location]. They were expected back [X] minutes ago. Please check on them!`
- **Message (Short/SMS):** `Hey, [Name] hasn't checked in yet. Please check Besties app - they might need help.`
- **Code Location:** `functions/utils/notifications.js` → `sendCascadingAlert()`
- **Cascading Logic:**
  - First bestie notified immediately
  - Escalation intervals: [60s, 180s, 300s, 600s, 900s] (1min, 3min, 5min, 10min, 15min)
  - Next bestie notified if previous doesn't acknowledge
  - Tracks in `currentNotifiedBestie`, `escalationLevel`, `notifiedBestieHistory`
- **Special Features:**
  - SMS only used if free channels (Telegram, Messenger, WhatsApp) fail
  - SMS requires credits (1 credit per SMS)
  - Creates in-app notification always
  - Tracks notification status in `notification_status` collection

#### 7. Check-in Reminder (5 minutes before)
- **Type:** `checkin_reminder`
- **Trigger:** 5 minutes before check-in expires (scheduled function runs every minute)
- **Sent To:** Check-in owner (the user who created the check-in)
- **Channels:** Push → In-app
- **Message:** `⏰ Your check-in at [location] expires in 5 minutes!`
- **Code Location:** `functions/core/checkins/sendCheckInReminders.js`
- **Special Features:**
  - Only sent once per check-in (`reminderSent` flag)
  - Includes action buttons: "I'm Safe!" and "Extend Time"
  - Only sent if user has `notificationsEnabled` and `fcmToken`

#### 8. Check-in Urgent Reminder (1 minute before)
- **Type:** `checkin_urgent`
- **Trigger:** 1 minute before check-in expires
- **Sent To:** Check-in owner
- **Channels:** Push → In-app
- **Message:** `🚨 URGENT: Your check-in expires in 1 minute!`
- **Code Location:** `functions/core/checkins/sendCheckInReminders.js` (NOTE: Code shows only 5-minute reminder - 1-minute may not be implemented)
- **Status:** ⚠️ **POTENTIALLY MISSING** - Listed in NOTIFICATIONS_LIST.md but not found in code

---

### 💜 Bestie Notifications

#### 9. Bestie Request Received
- **Type:** `bestie_request`
- **Trigger:** Someone sends you a bestie request
- **Sent To:** Request recipient
- **Channels:** Push → In-app
- **Message:** `💜 [Name] wants to be your bestie!`
- **Code Location:** `functions/core/besties/sendBestieInvite.js` (likely)
- **Action:** Navigates to `/besties` page

#### 10. Bestie Request Accepted
- **Type:** `bestie_accepted`
- **Trigger:** Someone accepts your bestie request
- **Sent To:** Request sender
- **Channels:** Push → In-app
- **Message:** `🎉 [Name] accepted your bestie request!`
- **Code Location:** `functions/core/besties/acceptBestieRequest.js` (likely)
- **Action:** Navigates to `/besties` page

---

### 🏆 Achievement Notifications

#### 11. Badge Earned
- **Type:** `badge_earned`
- **Trigger:** User earns a new badge
- **Sent To:** Badge owner
- **Channels:** Push → In-app
- **Message:** `🏆 Badge Earned! You earned the [Badge Name] badge! [icon]`
- **Code Location:** `functions/core/badges/onBadgeEarned.js`
- **Action:** Navigates to `/profile` page, scrolls to badges section

---

### 💬 Social Notifications

#### 12. Post Comment
- **Type:** `post_comment`
- **Trigger:** Someone comments on your post
- **Sent To:** Post owner
- **Channels:** Push → In-app
- **Message:** `💬 [Name] commented on your post`
- **Code Location:** `functions/core/social/trackPostComment.js`
- **Action:** Navigates to `/besties` page, opens comment modal

#### 13. Check-in Reaction
- **Type:** `checkin_reaction`
- **Trigger:** Someone reacts to your check-in
- **Sent To:** Check-in owner
- **Channels:** Push → In-app
- **Message:** `💜 [Name] reacted to your check-in`
- **Code Location:** `functions/core/checkins/trackCheckInReaction.js`
- **Action:** Navigates to `/besties` page

#### 14. Attention Response
- **Type:** `attention_response`
- **Trigger:** Someone clicks "Reach Out" on your "needs attention" request
- **Sent To:** User who requested attention
- **Channels:** In-app only
- **Message:** `💜 [Name] saw you needed support and is reaching out!`
- **Code Location:** `functions/core/users/onUserRequestAttention.js` (likely)
- **Action:** Navigates to `/besties` page

---

### 🎂 Special Event Notifications

#### 15. Birthday Notification
- **Type:** `birthday`
- **Trigger:** Daily cron job (runs every 15 minutes) detects user's birthday
- **Sent To:** All besties of the birthday user
- **Channels:** Push → Email → In-app
- **Message (Push):** `🎂 [Name]'s Birthday! It's [Name]'s birthday today! Send them some love 💕`
- **Message (Email):** HTML email with birthday reminder
- **Code Location:** `functions/core/notifications/checkBirthdays.js`
- **Special Features:**
  - Only sent at 9:00-9:14 AM in bestie's local timezone
  - Requires user to have `profile.birthdate` set
  - Checks all accepted besties (both directions)

---

### 💰 Payment & Subscription Notifications

#### 16. Payment Failed
- **Type:** `payment_failed`
- **Trigger:** Stripe webhook `invoice.payment_failed` after 3 retry attempts
- **Sent To:** Subscription owner
- **Channels:** In-app only
- **Message:** `⚠️ Payment Failed - Your SMS subscription payment failed. Please update your payment method within 7 days to avoid service interruption.`
- **Code Location:** `functions/core/payments/stripeWebhook.js`
- **Special Features:**
  - Sets 7-day grace period
  - High priority notification
  - Links to `/settings` page

#### 17. Payment Retry
- **Type:** `payment_retry`
- **Trigger:** Stripe webhook `invoice.payment_failed` before max retries (attempts 1-2)
- **Sent To:** Subscription owner
- **Channels:** In-app only
- **Message:** `⚠️ Payment Retry - We'll retry your payment soon. Please ensure your payment method is valid. (Attempt [X]/3)`
- **Code Location:** `functions/core/payments/stripeWebhook.js`

#### 18. Payment Action Required
- **Type:** `payment_action_required`
- **Trigger:** Stripe webhook `invoice.payment_action_required` (3D Secure verification needed)
- **Sent To:** Subscription owner
- **Channels:** In-app only
- **Message:** `⚠️ Payment Action Required - Your bank requires additional verification. Please complete the payment to continue your SMS subscription.`
- **Code Location:** `functions/core/payments/stripeWebhook.js`
- **Special Features:**
  - Links to Stripe hosted invoice URL for 3DS completion
  - High priority notification

#### 19. Low SMS Credits
- **Type:** `low_sms_credits`
- **Trigger:** Hourly cron job detects user has < 5 credits remaining
- **Sent To:** Subscription owner
- **Channels:** In-app only
- **Message:** `⚠️ Low SMS Credits - You have [X] SMS credits remaining. Buy more to stay protected.`
- **Code Location:** `functions/index.js` (scheduled function)
- **Special Features:**
  - Only sent once per day (tracks `lastLowBalanceAlert`)
  - Only for active subscribers
  - Links to `/settings` page

---

### 💬 Message Notifications

#### 20. Bestie Message
- **Type:** `bestie_message`
- **Trigger:** New message created in `bestie_messages` collection
- **Sent To:** Message recipient
- **Channels:** Push → In-app
- **Message:** `💬 New Message - [Sender] sent you a message: "[message preview...]"`
- **Code Location:** `functions/core/messages/onMessageCreated.js`
- **Special Features:**
  - Rate limited: 1 message per day per bestie pair
  - Includes deep link: `besties://messages?senderId=[id]&messageId=[id]`
  - Creates interaction record for connection strength tracking

---

### 🎯 Challenge & Pact Notifications

#### 21. Challenge Completed
- **Type:** `challenge_completed`
- **Trigger:** User completes a challenge with their bestie
- **Sent To:** Both challenge participants
- **Channels:** Push → In-app
- **Message:** `🎉 Challenge Completed! You and [Bestie] completed [Challenge Name]!`
- **Code Location:** `functions/core/challenges/onChallengeCompleted.js`
- **Special Features:**
  - Sent to both users in the challenge
  - Includes challenge details and rewards

#### 22. Pact Activated
- **Type:** `pact_activated`
- **Trigger:** Safety pact is activated between besties
- **Sent To:** Both pact participants
- **Channels:** Push → In-app
- **Message:** `🤝 Safety Pact Activated! You and [Bestie] have activated a safety pact.`
- **Code Location:** `functions/core/pact/onPactActivated.js`
- **Special Features:**
  - Sent to both users in the pact

---

### 🔵 Circle Check-in Notifications

#### 23. Circle Check-in Created
- **Type:** `circle_checkin`
- **Trigger:** User creates a circle check-in (group check-in)
- **Sent To:** Circle members
- **Channels:** Push → In-app
- **Message:** `🔵 [Name] started a circle check-in!`
- **Code Location:** `functions/core/circleCheckin/onCircleCheckInCreated.js`
- **Special Features:**
  - Different from regular check-ins (group activity)
  - Updates challenge progress for `circle_checkins` metric

---

## SMS Fallback System

### Overview
The SMS fallback system is a **credit-based, paid notification channel** that serves as a last resort when free channels (Push, Telegram, Messenger, WhatsApp, Email) fail or are unavailable.

### Key Components

#### 1. Credit System (`functions/utils/smsCredits.js`)

**Credit Types:**
- **Free Credits:** Promotional credits (expire after 1 month)
- **Subscription Credits:** From $2/month plan (15 credits, renew on subscription anniversary)
- **Extra Credits:** From $1.50 purchases (15 credits, expire on subscription renewal)

**Credit Management:**
- `getAvailableCredits(userId)` - Calculates total available credits (checks expiration)
- `deductCredit(userId, alertType, recipientId)` - Atomically deducts 1 credit (uses oldest credits first)
- `grantFreeCredits(userId, amount)` - Grants promotional credits
- `refreshSubscriptionCredits(userId)` - Refreshes subscription credits on renewal (timezone-aware)
- `addExtraCredits(userId, amount, expiresAt)` - Adds purchased credits
- `expireOldCredits()` - Daily cron job to expire old credits

**Credit Deduction Priority:**
1. Free credits (oldest expiration first)
2. Subscription credits
3. Extra purchased credits (oldest purchase first)

#### 2. SMS Sending Function (`functions/utils/notifications.js` → `sendSMSAlert()`)

**Process Flow:**
```
1. Validate metadata (userId, recipientId required)
2. Check hourly rate limit (max 5 SMS per hour)
3. Check available credits
4. Emergency override check (for emergency_sos only)
5. Send SMS via Twilio (with retry logic)
6. Update hourly rate limit counter
7. Deduct credit (atomic transaction)
8. Log to audit trail (sms_usage collection)
9. Create admin alert if deduction fails
```

**Rate Limiting:**
- Maximum 5 SMS per hour per user
- Tracks in `smsCredits.hourlyCount` and `smsCredits.hourlyResetAt`
- Throws `RATE_LIMIT_EXCEEDED` error if exceeded

**Emergency Override:**
- For `alertType === 'emergency_sos'` only
- Allows SMS even at 0 credits
- Creates negative balance
- Logs to `admin_alerts` collection
- Tracks in `smsCredits.emergencyOverrideUsed`

**Credit Deduction:**
- Atomic Firestore transaction (retries up to 3 times with exponential backoff)
- Deducts from oldest credits first (by expiration date)
- Updates `smsCredits.balance`, `smsCredits.totalUsed`, `smsCredits.currentCycleUsed`
- Returns `{ success, creditType, newBalance }` or `{ success: false, error }`

**Audit Trail:**
- Every SMS logged to `sms_usage` collection with:
  - `userId`, `recipientId`, `alertType`, `checkinId`, `sosId`
  - `creditType`, `creditsDeducted`, `balanceAfter`
  - `phoneNumber`, `twilioMessageSid`, `sentAt`
  - `status`, `errorMessage`, `isEmergencyOverride`

#### 3. SMS Fallback Logic in Notifications

**Check-in Alerts (`sendCascadingAlert()`):**
```
Priority Order:
1. Push (always tried first)
2. Telegram (if enabled)
3. Messenger (if active contact)
4. WhatsApp (if Telegram/Messenger failed)
5. Email (always tried if enabled)
6. SMS (ONLY if free channels failed AND user has credits)
7. In-app (always created)
```

**Emergency SOS (`triggerEmergencySOS()`):**
```
Priority Order:
1. Push (always tried first)
2. Telegram (if enabled)
3. Messenger (if active contact)
4. WhatsApp (if Telegram/Messenger failed)
5. Email (if enabled)
6. SMS (ONLY if free channels failed, but emergency override allows at 0 credits)
7. In-app (always created)
```

**Duress Code (`onDuressCodeUsed()`):**
```
Priority Order:
1. WhatsApp (if phone number available)
2. SMS (if enabled, emergency override applies)
3. Email (if email available)
4. Push (if FCM token available)
5. In-app (always created)
```

### SMS Credit Requirements

**To Send SMS:**
1. User must have `notificationPreferences.sms === true`
2. User must have `phoneNumber` set
3. User must have available credits (OR emergency override for SOS)
4. User must not exceed hourly rate limit (5 SMS/hour)

**Credit Costs:**
- 1 credit = 1 SMS message to 1 recipient
- Emergency SOS: Free (emergency override) but creates negative balance
- Check-in alerts: 1 credit per bestie (only if free channels fail)
- Duress code: 1 credit per bestie (emergency override applies)

### SMS Subscription System

**Base Plan:**
- $2/month = 15 SMS credits
- Credits refresh on subscription anniversary (midnight in user's timezone)
- Managed via Stripe subscription

**Extra Credits:**
- $1.50 = 15 additional credits
- Only available to active subscribers
- Expires on next subscription renewal date

**Free Credits:**
- Promotional credits (typically 5 credits)
- Expire after 1 month
- Granted via admin function `grantFreeSmsCredits()`

### SMS Usage Tracking

**Collections:**
- `sms_usage` - Audit trail of every SMS sent
- `admin_alerts` - Alerts for credit deduction failures and emergency overrides
- `users/{userId}.smsCredits` - Credit balances and usage stats

**Metrics Tracked:**
- `totalUsed` - Lifetime SMS count
- `currentCycleUsed` - SMS sent this billing cycle
- `hourlyCount` - SMS sent in current hour
- `emergencyOverrideUsed` - Emergency SMS sent at negative balance
- `lastUsedAt` - Timestamp of last SMS sent

---

## Notification Architecture

### Channel Priority System

**Universal Priority Order:**
1. **Push Notifications** (Firebase Cloud Messaging)
   - Always tried first (fast, free, reliable)
   - Requires `fcmToken` and `notificationsEnabled`
   - Falls back silently if fails

2. **Telegram** (Free)
   - Requires `notificationPreferences.telegram === true` and `telegramChatId`
   - Uses Telegram Bot API
   - Falls back silently if fails

3. **Facebook Messenger** (Free)
   - Requires active `messengerContacts` with valid `expiresAt`
   - Uses Facebook Graph API v24.0
   - Falls back silently if fails

4. **WhatsApp** (Free via Twilio)
   - Requires `phoneNumber` and `notificationPreferences.whatsapp === true`
   - Uses Twilio WhatsApp API
   - Falls back silently if fails

5. **Email** (Free via SendGrid)
   - Requires `email` and `notificationPreferences.email === true`
   - Uses SendGrid API
   - Falls back silently if fails

6. **SMS** (Paid via Twilio)
   - Requires `phoneNumber`, `notificationPreferences.sms === true`, and available credits
   - Uses Twilio SMS API
   - Only used if free channels failed (except emergency SOS)
   - Throws error if insufficient credits (except emergency override)

7. **In-app** (Always)
   - Always created in `notifications` collection
   - Regardless of other channel settings
   - User can view in notification bell

### Notification Flow Patterns

#### Pattern 1: Try All Channels (Emergency)
```
For each bestie:
  Try Push → Try Telegram → Try Messenger → Try WhatsApp → Try Email → Try SMS → Create In-app
  Continue even if channels fail (best effort)
```

#### Pattern 2: Free Channels Only (Regular Updates)
```
For each bestie:
  Try Push → Try Telegram → Try Email → Create In-app
  Skip SMS (too expensive for non-critical updates)
```

#### Pattern 3: Cascading Alert (Check-in Expired)
```
For first bestie:
  Try Push → Try Telegram → Try Messenger → Try WhatsApp → Try Email → Try SMS → Create In-app
  
Wait for acknowledgment or escalation timeout (60s, 180s, 300s, 600s, 900s)
If not acknowledged, notify next bestie with same channel priority
```

### Notification Status Tracking

**Collection:** `notification_status`
- Tracks success/failure of notification attempts
- Fields: `userId`, `bestieId`, `type`, `status`, `channels`, `channelsSucceeded`, `channelsFailed`, `timestamp`
- Used for user feedback and debugging

**Status Values:**
- `success` - At least one channel succeeded
- `partial` - Some channels succeeded, some failed
- `failed` - All channels failed

---

## Channel Priority & Fallback Logic

### Detailed Channel Logic

#### Push Notifications
- **Provider:** Firebase Cloud Messaging (FCM)
- **Cost:** Free
- **Reliability:** High (but requires app to be installed and permissions granted)
- **Fallback:** Silent (continues to next channel)
- **Code:** `functions/utils/notifications.js` → `sendPushNotification()`
- **Requirements:**
  - `fcmToken` must be set (obtained from frontend)
  - `notificationsEnabled === true`
  - Browser/app must have notification permissions

#### Telegram
- **Provider:** Telegram Bot API
- **Cost:** Free
- **Reliability:** High
- **Fallback:** Silent (continues to next channel)
- **Code:** `functions/utils/checkInNotifications.js` → `sendTelegramNotification()`
- **Requirements:**
  - `notificationPreferences.telegram === true`
  - `telegramChatId` must be set (obtained from Telegram bot connection)
  - Bot token configured in Firebase Functions config

#### Facebook Messenger
- **Provider:** Facebook Graph API v24.0
- **Cost:** Free
- **Reliability:** Medium (requires active session, expires after 24 hours)
- **Fallback:** Silent (continues to next channel)
- **Code:** `functions/utils/checkInNotifications.js` → `sendMessengerMessage()`
- **Requirements:**
  - Active `messengerContacts` document with `expiresAt > now`
  - `messengerPSID` must be set
  - Page token configured in Firebase Functions config
- **Note:** Contacts expire after 24 hours, must be re-authenticated

#### WhatsApp
- **Provider:** Twilio WhatsApp API
- **Cost:** Free (Twilio sandbox or approved WhatsApp Business account)
- **Reliability:** High
- **Fallback:** Silent (continues to next channel)
- **Code:** `functions/utils/notifications.js` → `sendWhatsAppAlert()`
- **Requirements:**
  - `phoneNumber` must be set
  - `notificationPreferences.whatsapp === true` (NOTE: Code checks `notifications.whatsapp` in some places - inconsistency)
  - Twilio WhatsApp number configured

#### Email
- **Provider:** SendGrid
- **Cost:** Free (within SendGrid free tier limits)
- **Reliability:** High
- **Fallback:** Silent (continues to next channel)
- **Code:** `functions/utils/notifications.js` → `sendEmailAlert()`
- **Requirements:**
  - `email` must be set
  - `notificationPreferences.email === true`
  - SendGrid API key configured

#### SMS
- **Provider:** Twilio SMS API
- **Cost:** Paid (~$0.0075 per SMS, requires credits)
- **Reliability:** Very High
- **Fallback:** Throws error if insufficient credits (except emergency override)
- **Code:** `functions/utils/notifications.js` → `sendSMSAlert()`
- **Requirements:**
  - `phoneNumber` must be set
  - `notificationPreferences.sms === true`
  - Available credits > 0 (OR emergency override for SOS)
  - Hourly rate limit not exceeded (5 SMS/hour)
- **Special Cases:**
  - Emergency SOS: Override allows SMS at 0 credits (creates negative balance)
  - Check-in alerts: Only used if free channels failed
  - Duress code: Emergency override applies

#### In-app
- **Provider:** Firestore `notifications` collection
- **Cost:** Free
- **Reliability:** Always succeeds (database write)
- **Fallback:** None (always created)
- **Code:** Various (creates document in `notifications` collection)
- **Requirements:** None (always created)

---

## Issues & Broken Parts

### 🔴 Critical Issues

#### 1. **Inconsistent WhatsApp Preference Check**
**Location:** `functions/utils/notifications.js` line 459
**Issue:** Code checks `bestieData.notifications?.whatsapp` but should check `bestieData.notificationPreferences?.whatsapp`
**Impact:** WhatsApp notifications may not send even when enabled
**Fix Needed:** Change `notifications.whatsapp` to `notificationPreferences.whatsapp`

#### 2. **Missing 1-Minute Check-in Reminder**
**Location:** `functions/core/checkins/sendCheckInReminders.js`
**Issue:** Code only implements 5-minute reminder, but `NOTIFICATIONS_LIST.md` lists 1-minute urgent reminder
**Impact:** Users don't get final warning before check-in expires
**Status:** ⚠️ **MISSING IMPLEMENTATION**

#### 3. **Duplicate Notification Status Tracking**
**Location:** `functions/utils/notifications.js` lines 498-506 and 540-546
**Issue:** `notificationStatus` object is declared twice (lines 369-377 and 498-506)
**Impact:** Potential confusion, second declaration overwrites first
**Fix Needed:** Remove duplicate declaration

#### 4. **Facebook Messenger Not Fully Implemented**
**Location:** `functions/utils/messaging.js` line 74
**Issue:** Comment says "TODO: Implement Facebook Messenger when account is unblocked"
**Impact:** Messenger notifications may not work in some code paths
**Status:** ⚠️ **PARTIALLY IMPLEMENTED** (works in check-in notifications but not in messaging.js)

### 🟡 Medium Issues

#### 5. **No Error Handling for Missing Telegram Bot Token**
**Location:** `functions/utils/checkInNotifications.js` line 180
**Issue:** Throws error but doesn't log to notification status
**Impact:** Failures are silent, user doesn't know why Telegram didn't work
**Fix Needed:** Add error tracking to notification status

#### 6. **Email Notification Not Sent for Check-in Completed**
**Location:** `functions/utils/checkInNotifications.js` line 120
**Issue:** Comment says "Skip for completed (too much spam)" but email is free
**Impact:** Users who prefer email don't get notified of check-in completion
**Status:** ⚠️ **INTENTIONAL BUT QUESTIONABLE**

#### 7. **SMS Rate Limit Calculation May Be Incorrect**
**Location:** `functions/utils/notifications.js` line 82
**Issue:** Uses `hourlyResetAt - now` but if `now > hourlyResetAt`, minutes remaining would be negative
**Impact:** Error message may show negative minutes
**Fix Needed:** Add check for `now > hourlyResetAt` before calculating minutes

#### 8. **Cascading Alert Doesn't Check Bestie Notification Preferences**
**Location:** `functions/utils/notifications.js` line 344
**Issue:** `sendCascadingAlert()` doesn't check if bestie has notifications enabled before sending
**Impact:** May send notifications to besties who have disabled notifications
**Fix Needed:** Add `bestieData.notificationsEnabled` check

### 🟢 Minor Issues

#### 9. **Inconsistent Message Formatting**
**Location:** Various
**Issue:** Some notifications use emojis, some don't. Some use full messages, some use short.
**Impact:** Inconsistent user experience
**Status:** ⚠️ **COSMETIC**

#### 10. **No Retry Logic for Telegram**
**Location:** `functions/utils/checkInNotifications.js` line 89
**Issue:** Uses `retryApiCall()` but Telegram API calls may fail due to rate limits
**Impact:** Telegram notifications may fail silently
**Status:** ⚠️ **ALREADY HAS RETRY** (via retryApiCall wrapper)

#### 11. **Birthday Notification Time Window Too Narrow**
**Location:** `functions/core/notifications/checkBirthdays.js` line 126
**Issue:** Only sends between 9:00-9:14 AM (15-minute window)
**Impact:** If cron job runs at wrong time, birthday notifications may be missed
**Status:** ⚠️ **DESIGN DECISION** (intentional to avoid spam)

---

## Areas Needing Attention

### 🔧 Code Quality

1. **Inconsistent Naming:**
   - Some places use `notifications.whatsapp`, others use `notificationPreferences.whatsapp`
   - Some places use `checkInCreated`, others use `checkin_reminder` (inconsistent casing)

2. **Error Handling:**
   - Some notification failures are logged but not tracked in `notification_status`
   - Emergency SOS doesn't always track partial failures properly

3. **Code Duplication:**
   - Notification sending logic is duplicated across multiple files
   - Could benefit from a unified notification service

### 📊 Monitoring & Analytics

1. **Notification Success Rates:**
   - No centralized tracking of channel success rates
   - Hard to identify which channels are most reliable

2. **SMS Credit Usage:**
   - No alerts when users are running low on credits (except hourly cron)
   - No dashboard to view SMS usage patterns

3. **Failed Notification Tracking:**
   - `notification_status` collection exists but may not be used consistently
   - No alerts for repeated notification failures

### 🚀 Performance

1. **Batch Operations:**
   - Some notification functions fetch besties one at a time (N+1 queries)
   - Emergency SOS now uses batch fetching (good!), but check-in notifications may still have N+1

2. **Rate Limiting:**
   - SMS has rate limiting, but other channels don't
   - Could benefit from rate limiting for all channels to prevent abuse

3. **Cascading Alert Efficiency:**
   - Cascading alerts wait for timeouts, but don't actively check for acknowledgments
   - Could be more efficient with real-time acknowledgment checking

### 🔒 Security & Privacy

1. **Phone Number Validation:**
   - No validation that phone numbers are in correct format before sending SMS
   - Could lead to failed sends and wasted credits

2. **Rate Limit Bypass:**
   - SMS rate limit is per-user, but could be bypassed by creating multiple accounts
   - No IP-based rate limiting

3. **Emergency Override Abuse:**
   - Emergency override allows SMS at 0 credits, but no verification it's actually an emergency
   - Could be abused to send free SMS

---

## Questions & Clarifications

### 🤔 Implementation Questions

1. **1-Minute Reminder:**
   - Is the 1-minute urgent reminder intentionally not implemented, or was it forgotten?
   - Should it be added to `sendCheckInReminders.js`?

2. **WhatsApp Preference Field:**
   - Which is correct: `notifications.whatsapp` or `notificationPreferences.whatsapp`?
   - Need to standardize across all code

3. **Email for Check-in Completed:**
   - Why is email skipped for check-in completed notifications?
   - Should this be changed to allow email notifications?

4. **Cascading Alert Acknowledgment:**
   - How does the system know if a bestie "acknowledged" an alert?
   - Is there a UI action that marks alerts as acknowledged?

5. **Facebook Messenger Expiration:**
   - Messenger contacts expire after 24 hours - is this intentional?
   - Should users be notified when their Messenger connection is about to expire?

6. **SMS Credit Emergency Override:**
   - Should there be a limit on how many emergency override SMS a user can send?
   - Currently unlimited (just creates negative balance)

7. **Notification Status Collection:**
   - Is `notification_status` collection actively used by the frontend?
   - Should failed notifications trigger user-facing alerts?

8. **Birthday Notification Timing:**
   - Why only send between 9:00-9:14 AM?
   - Should this be configurable per user?

9. **Circle Check-in Notifications:**
   - Are circle check-in notifications fully implemented?
   - Do they follow the same channel priority as regular check-ins?

10. **Bestie Message Rate Limiting:**
    - Rate limit is 1 message per day per bestie pair - is this per sender or per pair?
    - Code shows it's per sender (senderId → recipientId), so both users can send 1 message each per day?

### 📝 Documentation Questions

1. **Notification Types:**
   - Are there any notification types not documented in `NOTIFICATIONS_LIST.md`?
   - Should we add the payment and message notifications to that list?

2. **Channel Priority:**
   - Is the channel priority order documented anywhere for developers?
   - Should this be in a developer guide?

3. **SMS Credit System:**
   - Is the SMS credit system fully documented for users?
   - Should there be in-app help explaining how credits work?

---

## Summary

### Total Notifications: 23 Types
- Emergency: 2
- Check-in: 6
- Bestie: 2
- Achievement: 1
- Social: 3
- Special Events: 1
- Payment: 4
- Messages: 1
- Challenges/Pacts: 2
- Circle Check-ins: 1

### Channel Usage:
- **Push:** 20/23 notifications
- **Telegram:** 6/23 notifications
- **Messenger:** 4/23 notifications
- **WhatsApp:** 3/23 notifications
- **Email:** 5/23 notifications
- **SMS:** 3/23 notifications (with fallback logic)
- **In-app:** 23/23 notifications (always)

### Critical Fixes Needed:
1. Fix WhatsApp preference field inconsistency
2. Implement 1-minute check-in reminder
3. Fix duplicate notification status declaration
4. Add bestie notification preference check to cascading alerts

### Areas for Improvement:
1. Standardize notification field naming
2. Add centralized notification success rate tracking
3. Improve error handling and user feedback
4. Add rate limiting for all channels
5. Document notification system for developers

---

**Last Updated:** [Current Date]
**Document Version:** 1.0
**Maintained By:** Development Team



