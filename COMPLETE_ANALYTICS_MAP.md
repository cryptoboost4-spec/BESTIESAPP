# 📊 Complete Analytics Events Map

All analytics events have been added throughout the app. Here's the complete list:

## ✅ Check-in Events

### `checkin_created`
- **When:** User creates a new check-in
- **Parameters:**
  - `duration` - Check-in duration in minutes
  - `besties_count` - Number of besties selected
  - `messenger_contacts_count` - Number of messenger contacts
  - `has_photos` - Boolean if photos were added
  - `has_notes` - Boolean if notes were added
- **Location:** `CreateCheckInPage.jsx`

### `checkin_completed`
- **When:** User marks check-in as safe
- **Parameters:**
  - `duration` - Actual duration
  - `was_extended` - Boolean if check-in was extended
- **Location:** `CheckInCard.jsx`

### `checkin_reaction_added`
- **When:** User reacts to a check-in
- **Parameters:**
  - `emoji` - Reaction emoji (💜, 😮‍💨, 🎉)
  - `checkin_id` - Check-in ID
- **Location:** `BestiesPage.jsx`

### `checkin_comment_added`
- **When:** User comments on a check-in
- **Parameters:**
  - `checkin_id` - Check-in ID
  - `comment_length` - Length of comment text
- **Location:** `BestiesPage.jsx`

## ✅ Bestie Events

### `bestie_request_accepted`
- **When:** User accepts a bestie request
- **Parameters:**
  - `method` - Always 'accept'
- **Location:** `BestieRequestCard.jsx`

## ✅ Post Events

### `post_created`
- **When:** User creates a post
- **Parameters:**
  - `has_photo` - Boolean if post has photo
  - `has_text` - Boolean if post has text
  - `text_length` - Length of text
- **Location:** `CreatePostModal.jsx`

### `post_reaction_added`
- **When:** User reacts to a post
- **Parameters:**
  - `reaction_type` - Type of reaction (heart, laugh, fire)
  - `post_id` - Post ID
- **Location:** `PostReactions.jsx`

### `post_comment_added`
- **When:** User comments on a post
- **Parameters:**
  - `post_id` - Post ID
  - `comment_length` - Length of comment text
- **Location:** `PostComments.jsx`

## ✅ Badge Events

### `badge_earned_viewed`
- **When:** User views a badge notification
- **Parameters:**
  - `badge_id` - Badge ID
- **Location:** `FloatingNotificationBell.jsx`
- **Note:** Badge earned is tracked in backend (`onBadgeEarned.js`)

## ✅ Emergency Events

### `sos_triggered`
- **When:** User triggers SOS button
- **Parameters:**
  - `is_reverse_pin` - Boolean if reverse PIN was used
  - `has_location` - Boolean if location was available
- **Location:** `EmergencySOSButton.jsx`

## ✅ Profile Events

### `profile_updated`
- **When:** User updates their profile
- **Parameters:**
  - `has_photo` - Boolean if profile photo was updated
  - `has_bio` - Boolean if bio was added/updated
  - `has_birthdate` - Boolean if birthdate was added/updated
- **Location:** `EditProfilePage.jsx`

### `onboarding_completed`
- **When:** User completes onboarding
- **Parameters:**
  - `has_besties` - Boolean if user has besties
- **Location:** `OnboardingPage.jsx`

## ✅ Settings Events

### `notification_setting_changed`
- **When:** User enables/disables a notification type
- **Parameters:**
  - `notification_type` - Type of notification (sms, telegram, push, etc.)
  - `enabled` - Boolean if enabled or disabled
- **Location:** `SettingsPage.jsx`

### `data_retention_changed`
- **When:** User changes data retention setting
- **Parameters:**
  - `hold_data` - Boolean if data should be kept indefinitely
- **Location:** `SettingsPage.jsx`

## ✅ Location Events

### `location_favorite_added`
- **When:** User adds a favorite location
- **Parameters:**
  - `total_favorites` - Total number of favorite locations
- **Location:** `LocationFavoritesPage.jsx`

## ✅ Check-in Extension Events

### `checkin_extended`
- **When:** User extends a check-in duration
- **Parameters:**
  - `minutes_added` - Number of minutes added
  - `checkin_id` - Check-in ID
- **Location:** `CheckInCard.jsx`

## 🎯 Default Events (Automatic)

These are tracked automatically by Firebase Analytics:
- `page_view` - Page views (tracked via `errorTracker.trackPageView()`)
- `session_start` - User sessions
- `first_open` - First app open
- `app_update` - App updates

## 📍 Where to View Analytics

1. **Realtime Events (Live):**
   - Firebase Console → **Analytics** → **Events** → **Realtime** tab
   - Shows events from last 30 minutes
   - Updates in real-time

2. **Historical Data (Reports):**
   - Firebase Console → **Analytics** → **Dashboard**
   - Shows all analytics data over time
   - Takes 24-48 hours to fully populate

3. **Event Details:**
   - Firebase Console → **Analytics** → **Events**
   - See all tracked events and their parameters

## ✅ Status

**All analytics events are now implemented!** They will start tracking once:
1. Analytics is enabled in Firebase Console (see `FIREBASE_ANALYTICS_COMPLETE_SETUP.md`)
2. Users interact with the app

## 📝 Notes

- All events use `logAnalyticsEvent()` helper function
- Events are only logged in browser (not SSR)
- Events respect user privacy settings
- No personally identifiable information is collected

