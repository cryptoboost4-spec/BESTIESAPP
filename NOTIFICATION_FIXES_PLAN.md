# Notification System Fixes for Launch

## 1. Hide WhatsApp Toggle
**File:** `frontend/src/components/settings/NotificationSettings.jsx`
- Remove or comment out the WhatsApp toggle section entirely
- WhatsApp is not implemented yet

## 2. Auto-Delete Old Notifications (30 days)
**File:** `functions/core/maintenance/cleanupOldData.js`
- Add deletion of notifications older than 30 days
- Query: `notifications` collection where `createdAt < 30 days ago`
- Delete matching documents in batches

## 3. Fix Birthday Notification Timezone
**File:** `functions/core/notifications/checkBirthdays.js`
- Currently hardcoded to midnight ET
- Change to use each user's timezone from their profile
- Send at 9:00 AM in user's local timezone instead of midnight
- If user has no timezone set, default to midnight UTC

## 4. Add Exponential Backoff to Cascading Alerts
**File:** `functions/core/checkins/checkCascadingAlertEscalation.js`
- Currently escalates every 1 minute
- Change to: 1min → 3min → 5min → 10min → 15min intervals
- Store `escalationLevel` in check-in doc to track timing
- Calculate next alert time based on level

## 5. Add Missing Notification Navigation Handlers
**File:** `frontend/src/components/FloatingNotificationBell.jsx`
- Add cases for these notification types:
  - `checkin_reminder` → navigate to check-ins page
  - `checkin_urgent` → navigate to check-ins page
  - `checkin_reaction` → navigate to specific check-in
  - `attention_response` → navigate to bestie's profile

## 6. Auto-Delete Expired Messenger Contacts
**File:** `functions/core/maintenance/cleanupOldData.js`
- Add query for expired messenger contacts
- Query: `messengerContacts` where `expiresAt < now`
- Delete in batches (same pattern as check-ins)
- Log count of deleted contacts
