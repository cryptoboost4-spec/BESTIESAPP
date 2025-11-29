# 🔥 Firebase Analytics Setup Instructions

Firebase Analytics has been integrated into the codebase. Follow these steps to complete the setup:

## ✅ What's Already Done

1. **Code Integration:**
   - Added `getAnalytics` and `logEvent` imports in `frontend/src/services/firebase.js`
   - Created `logAnalyticsEvent` helper function
   - Analytics only initializes in browser (not SSR)

## 📋 Setup Steps

### 1. Install Firebase Analytics Package

If not already installed, run:
```bash
cd frontend
npm install firebase
```

Firebase Analytics is included in the main `firebase` package.

### 2. Enable Analytics in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on **Analytics** in the left sidebar
4. Click **Get Started** (if not already enabled)
5. Follow the setup wizard

### 3. Configure Analytics in Firebase Console

1. Go to **Analytics** → **Events**
2. Review default events (automatically tracked):
   - `page_view` - Page views
   - `first_open` - First app open
   - `app_update` - App updates
   - `session_start` - Session starts

### 4. Add Custom Events (Optional)

You can add custom events in the Firebase Console:
- Go to **Analytics** → **Events**
- Click **Create Event**
- Define event names and parameters

### 5. Test Analytics

1. Open your app in the browser
2. Open browser DevTools → Console
3. Check for any analytics errors
4. Go to Firebase Console → **Analytics** → **Events** → **Realtime**
5. You should see events appearing in real-time

## 📊 Using Analytics in Code

### Basic Usage

```javascript
import { logAnalyticsEvent } from '../services/firebase';

// Log a custom event
logAnalyticsEvent('button_click', {
  button_name: 'create_checkin',
  page: 'home'
});

// Log a page view
logAnalyticsEvent('page_view', {
  page_title: 'Home Page',
  page_path: '/'
});
```

### Recommended Events to Track

Add these throughout your app:

**User Actions:**
- `checkin_created` - When user creates a check-in
- `checkin_completed` - When user marks check-in as safe
- `bestie_added` - When user adds a bestie
- `badge_earned` - When user earns a badge
- `sos_triggered` - When user triggers SOS

**Navigation:**
- `page_view` - Page views (already automatic)
- `button_click` - Button clicks
- `link_click` - Link clicks

**Engagement:**
- `post_created` - When user creates a post
- `comment_added` - When user adds a comment
- `reaction_added` - When user adds a reaction

**Errors:**
- `error_occurred` - When errors happen

## 🔍 Viewing Analytics Data

1. **Real-time Data:**
   - Firebase Console → **Analytics** → **Events** → **Realtime**
   - Shows events from last 30 minutes

2. **Historical Data:**
   - Firebase Console → **Analytics** → **Events**
   - Shows all events over time
   - Can take 24-48 hours to fully populate

3. **User Properties:**
   - Firebase Console → **Analytics** → **User Properties**
   - Track user attributes (e.g., subscription status, bestie count)

## ⚠️ Important Notes

1. **Privacy:**
   - Analytics respects user privacy settings
   - No personally identifiable information is collected by default
   - Review Firebase Analytics privacy settings

2. **Data Delay:**
   - Real-time events appear immediately
   - Historical reports can take 24-48 hours

3. **Browser Support:**
   - Analytics only works in browsers (not SSR)
   - Code automatically checks for browser environment

4. **Testing:**
   - Use Firebase Console → **Analytics** → **DebugView** for testing
   - Enable debug mode in development

## 🚀 Next Steps

1. Add `logAnalyticsEvent` calls throughout your app for key actions
2. Set up custom events in Firebase Console
3. Create dashboards for important metrics
4. Set up alerts for important events

## 📚 Resources

- [Firebase Analytics Documentation](https://firebase.google.com/docs/analytics)
- [Analytics Events Reference](https://firebase.google.com/docs/reference/js/analytics)
- [Best Practices](https://firebase.google.com/docs/analytics/best-practices)

