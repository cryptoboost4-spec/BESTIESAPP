# Besties App - Database Schema Documentation

> **Last Updated:** 2025-11-19
> **Purpose:** This document defines the exact field names and structure for all Firestore collections to prevent naming inconsistencies.

---

## 📋 Table of Contents
1. [Users Collection](#users-collection)
2. [Besties Collection](#besties-collection)
3. [Check-ins Collection](#check-ins-collection)
4. [Badges Collection](#badges-collection)
5. [Templates Collection](#templates-collection)
6. [Alerts Collection](#alerts-collection)
7. [Notifications Collection](#notifications-collection)
8. [Emergency SOS Collection](#emergency-sos-collection)
9. [Bestie Celebrations Collection](#bestie-celebrations-collection)
10. [Interactions Collection](#interactions-collection)
11. [Alert Responses Collection](#alert-responses-collection)
12. [Circle Milestones Collection](#circle-milestones-collection)
13. [Analytics Collections](#analytics-collections)

---

## Users Collection
**Collection Path:** `users/{userId}`

### Core Fields
| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `uid` | string | ✅ | User's Firebase Auth UID |
| `email` | string | ✅ | User's email address |
| `displayName` | string | ✅ | User's display name |
| `photoURL` | string \| null | ❌ | User's profile photo URL |
| `phoneNumber` | string \| null | ❌ | User's phone number (E.164 format preferred) |
| `createdAt` | Timestamp | ✅ | Account creation timestamp |
| `updatedAt` | Timestamp | ✅ | Last update timestamp |
| `lastActive` | Timestamp | ❌ | Last activity timestamp |
| `onboardingCompleted` | boolean | ✅ | Whether user completed onboarding |
| `featuredCircle` | array[string] | ✅ | Array of USER IDs (not bestie doc IDs) for top 5 besties |
| `notificationsEnabled` | boolean | ❌ | Push notifications enabled |
| `isAdmin` | boolean | ❌ | Admin flag for special permissions |
| `hasSeenSMSPopup` | boolean | ❌ | Whether user has seen SMS alert popup |
| `smsWeeklyCount` | number | ❌ | SMS alerts used this week (resets Monday) |

### Nested: notificationPreferences
| Field Name | Type | Default | Description |
|------------|------|---------|-------------|
| `whatsapp` | boolean | `false` | WhatsApp notifications enabled |
| `sms` | boolean | `false` | SMS notifications enabled |
| `facebook` | boolean | `false` | Facebook Messenger notifications enabled |
| `email` | boolean | `true` | Email notifications enabled |

### Nested: settings
| Field Name | Type | Default | Description |
|------------|------|---------|-------------|
| `defaultBesties` | array[string] | `[]` | Default bestie IDs for quick check-ins |
| `dataRetention` | number | `24` | Hours to retain data |
| `holdData` | boolean | `false` | Keep data indefinitely |

### Nested: privacySettings
| Field Name | Type | Default | Description |
|------------|------|---------|-------------|
| `showStatsToBesties` | boolean | `true` | Allow besties to see stats |
| `showCheckInsToBesties` | boolean | `true` | Allow besties to see check-ins (legacy - being replaced with `checkInVisibility`) |
| `checkInVisibility` | string | `"all_besties"` | **NEW:** Check-in visibility: `"all_besties"` \| `"circle"` \| `"alerts_only"` |

### Nested: smsSubscription
| Field Name | Type | Default | Description |
|------------|------|---------|-------------|
| `active` | boolean | `false` | Premium SMS subscription active |
| `plan` | string \| null | `null` | Subscription plan name |
| `startedAt` | Timestamp \| null | `null` | Subscription start date |

### Nested: donationStats
| Field Name | Type | Default | Description |
|------------|------|---------|-------------|
| `isActive` | boolean | `false` | Active donor |
| `totalDonated` | number | `0` | Total amount donated (USD) |
| `monthlyAmount` | number | `0` | Monthly donation amount |
| `startedAt` | Timestamp \| null | `null` | First donation date |

### Nested: stats
| Field Name | Type | Default | Description |
|------------|------|---------|-------------|
| `totalCheckIns` | number | `0` | Total check-ins created |
| `completedCheckIns` | number | `0` | Successfully completed check-ins |
| `alertedCheckIns` | number | `0` | Check-ins that triggered alerts |
| `totalBesties` | number | `0` | Total accepted besties |
| `currentStreak` | number | `0` | Current consecutive days with check-ins |
| `longestStreak` | number | `0` | Longest consecutive days with check-ins achieved |
| `joinedAt` | Timestamp | ✅ | Account creation timestamp |

### Nested: profile
| Field Name | Type | Default | Description |
|------------|------|---------|-------------|
| `featuredBadges` | array[string] | `[]` | Badge IDs to display on profile |
| `bio` | string \| null | `null` | User bio/description |

### Nested: requestAttention (optional)
| Field Name | Type | Description |
|------------|------|-------------|
| `active` | boolean | Request attention is active |
| `tag` | string | Tag/category for attention request |
| `note` | string | Additional note |
| `timestamp` | Timestamp | When attention was requested |

---

## Besties Collection
**Collection Path:** `besties/{bestieId}`

> **Important:** Document IDs are auto-generated by Firestore, NOT `uid1_uid2` format.

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `requesterId` | string | ✅ | UID of user who sent bestie request |
| `requesterName` | string | ✅ | Display name of requester |
| `requesterPhone` | string | ✅ | Phone/email of requester |
| `recipientId` | string \| null | ✅ | UID of recipient (null if invited user not signed up) |
| `recipientName` | string | ✅ | Display name of recipient |
| `recipientPhone` | string | ✅ | Phone/email of recipient |
| `status` | string | ✅ | Status: `"pending"` \| `"accepted"` \| `"declined"` \| `"invited"` \| `"cancelled"` |
| `personalMessage` | string \| null | ❌ | Optional message with request |
| `createdAt` | Timestamp | ✅ | When request was created |
| `updatedAt` | Timestamp | ✅ | Last update timestamp |
| `acceptedAt` | Timestamp \| null | ❌ | When request was accepted |
| `isFavorite` | boolean | ❌ | **Legacy field** - no longer used (replaced by `featuredCircle` array) |

---

## Check-ins Collection
**Collection Path:** `checkins/{checkInId}`

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `userId` | string | ✅ | UID of user who created check-in |
| `location` | string | ✅ | Location description/address |
| `duration` | number | ✅ | Duration in minutes (15-180) |
| `alertTime` | Timestamp | ✅ | When alert should trigger |
| `bestieIds` | array[string] | ✅ | USER IDs of besties to alert (1-5 people) |
| `notes` | string \| null | ❌ | Optional notes about check-in |
| `meetingWith` | string \| null | ❌ | Who user is meeting with |
| `photoURLs` | array[string] | ❌ | Array of photo URLs |
| `status` | string | ✅ | Status: `"active"` \| `"completed"` \| `"alerted"` \| `"false_alarm"` |
| `createdAt` | Timestamp | ✅ | When check-in was created |
| `lastUpdate` | Timestamp | ✅ | Last status update |
| `completedAt` | Timestamp \| null | ❌ | When check-in was completed |
| `alertedAt` | Timestamp \| null | ❌ | When alert was triggered |
| `privacyLevel` | string | ❌ | **NEW:** Privacy setting: `"all_besties"` \| `"circle"` \| `"alerts_only"` (defaults to `"all_besties"` if missing) |
| `circleSnapshot` | array[string] | ❌ | **NEW:** Snapshot of featuredCircle USER IDs at time of creation (for `"circle"` privacy) |

---

## Badges Collection
**Collection Path:** `badges/{userId}`

> **Note:** Document ID matches user's UID

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `userId` | string | ✅ | User's UID |
| `badges` | array[object] | ✅ | Array of badge objects |
| `stats` | object | ✅ | Badge-related stats |
| `createdAt` | Timestamp | ✅ | Document creation timestamp |

### Badge Object Structure
| Field Name | Type | Description |
|------------|------|-------------|
| `id` | string | Badge identifier |
| `name` | string | Badge display name |
| `description` | string | Badge description |
| `earnedAt` | Timestamp | When badge was earned |
| `category` | string | Badge category |

### Nested: stats
| Field Name | Type | Default | Description |
|------------|------|---------|-------------|
| `guardianCount` | number | `0` | Times user was a guardian |
| `bestiesCount` | number | `0` | Total besties |
| `donationTotal` | number | `0` | Total donations |
| `checkinCount` | number | `0` | Total check-ins |

---

## Templates Collection
**Collection Path:** `templates/{templateId}`

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `userId` | string | ✅ | UID of template owner |
| `name` | string | ✅ | Template name |
| `location` | string | ✅ | Saved location |
| `duration` | number | ✅ | Saved duration (minutes) |
| `bestieIds` | array[string] | ✅ | Saved bestie IDs |
| `notes` | string \| null | ❌ | Saved notes |
| `createdAt` | Timestamp | ✅ | Template creation timestamp |

---

## Alerts Collection
**Collection Path:** `alerts/{alertId}`

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `checkInId` | string | ✅ | Associated check-in ID |
| `userId` | string | ✅ | UID of user who missed check-in |
| `location` | string | ✅ | Location from check-in |
| `notifiedBesties` | array[string] | ✅ | USER IDs of besties who were notified |
| `status` | string | ✅ | Status: `"active"` \| `"resolved"` |
| `createdAt` | Timestamp | ✅ | Alert creation timestamp |

---

## Notifications Collection
**Collection Path:** `notifications/{notificationId}`

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `userId` | string | ✅ | UID of user receiving notification |
| `type` | string | ✅ | Type: `"safety_alert"` \| `"bestie_request"` \| etc. |
| `checkInId` | string \| null | ❌ | Associated check-in ID (if applicable) |
| `message` | string | ✅ | Notification message |
| `sentAt` | Timestamp | ✅ | When notification was sent |
| `read` | boolean | ✅ | Whether notification has been read |

---

## Emergency SOS Collection
**Collection Path:** `emergency_sos/{sosId}`

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `userId` | string | ✅ | UID of user who triggered SOS |
| `location` | string | ✅ | User's location |
| `isReversePIN` | boolean | ✅ | Whether this was a reverse PIN (silent distress) |
| `notifiedBesties` | array[string] | ✅ | USER IDs of besties who were notified |
| `status` | string | ✅ | Status: `"active"` \| `"resolved"` |
| `createdAt` | Timestamp | ✅ | SOS trigger timestamp |

---

## Bestie Celebrations Collection
**Collection Path:** `bestie_celebrations/{celebrationId}`

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `userId` | string | ✅ | UID of user receiving celebration |
| `bestieId` | string | ✅ | UID of new bestie |
| `bestieName` | string | ✅ | Display name of new bestie |
| `bestiePhotoURL` | string \| null | ❌ | Photo URL of new bestie |
| `seen` | boolean | ✅ | Whether celebration has been shown |
| `createdAt` | Timestamp | ✅ | Celebration creation timestamp |

---

## Interactions Collection
**Collection Path:** `interactions/{interactionId}`

> **Purpose:** Tracks all meaningful interactions between besties to calculate connection strength and provide insights.

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `userId` | string | ✅ | UID of user who initiated the interaction |
| `bestieId` | string | ✅ | UID of the bestie they interacted with |
| `type` | string | ✅ | Interaction type: `"alert_response"` \| `"circle_check"` \| `"profile_view"` \| `"attention_response"` \| `"check_in_together"` |
| `checkInId` | string \| null | ❌ | Related check-in ID (if applicable) |
| `alertId` | string \| null | ❌ | Related alert ID (if applicable) |
| `metadata` | object | ❌ | Additional context about the interaction |
| `createdAt` | Timestamp | ✅ | When interaction occurred |

### Metadata Object (varies by type)
**For `alert_response`:**
- `responseTime` (number): Seconds from alert to response
- `action` (string): `"acknowledged"` \| `"called"` \| `"texted"`

**For `check_in_together`:**
- `isGuardian` (boolean): Whether they were a guardian for this check-in

**For `circle_check`:**
- `circleHealth` (number): Circle health score at time of check

---

## Alert Responses Collection
**Collection Path:** `alert_responses/{responseId}`

> **Purpose:** Tracks who responds to alerts and how quickly - critical for connection strength calculations.

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `alertId` | string | ✅ | Alert or check-in ID that was responded to |
| `alertType` | string | ✅ | Type: `"checkin"` \| `"sos"` |
| `userId` | string | ✅ | UID of person in danger |
| `responderId` | string | ✅ | UID of bestie who responded |
| `responseType` | string | ✅ | Response: `"acknowledged"` \| `"called"` \| `"on_my_way"` \| `"contacted_them"` |
| `responseTime` | number | ✅ | Seconds from alert creation to response |
| `note` | string \| null | ❌ | Optional note from responder |
| `createdAt` | Timestamp | ✅ | When response was recorded |

---

## Circle Milestones Collection
**Collection Path:** `circle_milestones/{milestoneId}`

> **Purpose:** Tracks and celebrates important moments in bestie relationships.

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `userId` | string | ✅ | UID of user who earned the milestone |
| `bestieId` | string | ✅ | UID of the bestie (for relationship milestones) |
| `type` | string | ✅ | Milestone type: `"days_in_circle"` \| `"check_ins_together"` \| `"alerts_responded"` \| `"streak"` |
| `value` | number | ✅ | Milestone value (e.g., 30 days, 100 check-ins) |
| `celebrated` | boolean | ✅ | Whether user has seen the celebration |
| `createdAt` | Timestamp | ✅ | When milestone was achieved |

### Milestone Types
- `days_in_circle`: Bestie has been in featured circle for X days (30, 100, 365)
- `check_ins_together`: User and bestie have done X check-ins together (10, 50, 100)
- `alerts_responded`: Bestie has responded to X alerts (5, 20, 50)
- `streak`: User has checked their circle for X consecutive days (7, 30, 100)

---

## Analytics Collections

### analytics_cache
**Collection Path:** `analytics_cache/{cacheId}`

| Field Name | Type | Description |
|------------|------|-------------|
| `totalUsers` | number | Total registered users |
| `totalCheckIns` | number | Total check-ins created |
| `totalBesties` | number | Total bestie relationships |
| `lastUpdated` | Timestamp | Last cache update |

### errors
**Collection Path:** `errors/{errorId}`

| Field Name | Type | Description |
|------------|------|-------------|
| `userId` | string | UID of user who experienced error |
| `error` | string | Error message |
| `stack` | string | Error stack trace |
| `context` | object | Additional context |
| `createdAt` | Timestamp | Error timestamp |

### performance
**Collection Path:** `performance/{perfId}`

| Field Name | Type | Description |
|------------|------|-------------|
| `userId` | string | UID of user |
| `action` | string | Action being measured |
| `duration` | number | Duration in milliseconds |
| `createdAt` | Timestamp | Measurement timestamp |

### user_actions
**Collection Path:** `user_actions/{actionId}`

| Field Name | Type | Description |
|------------|------|-------------|
| `userId` | string | UID of user |
| `action` | string | Action performed |
| `metadata` | object | Additional action data |
| `createdAt` | Timestamp | Action timestamp |

### funnel_events
**Collection Path:** `funnel_events/{eventId}`

| Field Name | Type | Description |
|------------|------|-------------|
| `userId` | string | UID of user |
| `funnel` | string | Funnel name |
| `step` | string | Step name |
| `metadata` | object | Additional step data |
| `createdAt` | Timestamp | Event timestamp |

---

## 🚨 Important Notes

### ID Field Naming Convention
- **USER IDs:** Always use `userId`, `requesterId`, `recipientId`, `bestieId` for Firebase Auth UIDs
- **DOCUMENT IDs:** These are auto-generated by Firestore and accessed via `doc.id` in code
- **NEVER** use `id` field in documents (except in nested objects like badge.id)

### Array Field Naming
- **USER ID arrays:** `bestieIds`, `notifiedBesties`, `featuredCircle`, `circleSnapshot`
- Always use plural form with "Ids" suffix (NOT "IDs")

### Timestamp Fields
- **Creation:** Always use `createdAt`
- **Updates:** Use `updatedAt` or `lastUpdate` (be consistent per collection)
- **Specific events:** Use descriptive names like `acceptedAt`, `completedAt`, `alertedAt`

### Status Fields
- Always use lowercase with underscores: `"pending"`, `"accepted"`, `"false_alarm"`
- Document all possible values in this schema

### Privacy & Settings
- Privacy settings go in `users/{userId}/privacySettings`
- App settings go in `users/{userId}/settings`
- Notification preferences go in `users/{userId}/notificationPreferences`

---

## 📝 Changelog

### 2025-11-21
- Added `currentStreak` and `longestStreak` fields to users.stats
- **Added NEW COLLECTIONS for Living Circle experience:**
  - `interactions` collection - tracks all meaningful bestie interactions
  - `alert_responses` collection - tracks who responds to alerts and how quickly
  - `circle_milestones` collection - celebrates important relationship moments
- These collections enable real connection strength calculations based on actual behavior

### 2025-11-19
- Initial schema documentation created
- Added `privacyLevel` and `circleSnapshot` fields to check-ins collection
- Added `checkInVisibility` field to users.privacySettings
- Documented legacy `isFavorite` field in besties collection
- Documented legacy `showCheckInsToBesties` in privacySettings

---

## 🔧 When Adding New Fields

1. **Update this document FIRST** before implementing
2. Choose field names that match existing patterns
3. Document the type, whether it's required, and default value
4. Add to the changelog at the bottom
5. Consider backward compatibility with existing data

---

*This document should be the source of truth for all database field names.*
