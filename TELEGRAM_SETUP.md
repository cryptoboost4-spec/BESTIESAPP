# Telegram Integration Setup Guide

This guide will walk you through setting up Telegram integration for Besties Safety app to enable free, unlimited emergency alerts via Telegram.

## Overview

The Telegram integration allows users to:
- Share a personal Telegram bot link with emergency contacts
- Contacts connect by clicking the link and pressing START in the bot
- Contacts stay connected for 20 hours (auto-expiry for privacy)
- Send unlimited safety alerts via Telegram (completely free)
- No phone number sharing required

---

## Prerequisites

- Firebase project with Cloud Functions deployed
- Telegram account
- Access to Firebase Console
- Node.js and Firebase CLI installed

---

## Step 1: Create a Telegram Bot

1. **Open Telegram** and search for `@BotFather`

2. **Start a chat** with BotFather and send the command:
   ```
   /newbot
   ```

3. **Choose a name** for your bot (e.g., "Besties Safety")

4. **Choose a username** for your bot (must end in 'bot', e.g., "BestiesSafetyBot")
   - This username will be used in your deep links
   - Save this username - you'll need it later

5. **Save the Bot Token** that BotFather provides
   - It looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`
   - Keep this token secure - you'll need it for the next step

6. **(Optional) Set a profile picture and description**:
   ```
   /setuserpic
   /setdescription
   ```

---

## Step 2: Configure Firebase Functions

1. **Set the Telegram bot token** in Firebase Functions config:
   ```bash
   firebase functions:config:set telegram.bot_token="YOUR_BOT_TOKEN_HERE"
   ```
   Replace `YOUR_BOT_TOKEN_HERE` with the token from BotFather.

2. **Verify the configuration** was saved:
   ```bash
   firebase functions:config:get
   ```
   You should see:
   ```json
   {
     "telegram": {
       "bot_token": "YOUR_BOT_TOKEN_HERE"
     }
   }
   ```

---

## Step 3: Update Frontend Configuration

1. **Open** `frontend/src/config/telegram.js`

2. **Update the bot username** to match your bot:
   ```javascript
   export const TELEGRAM_CONFIG = {
     botUsername: 'BestiesSafetyBot', // <- Change this to your bot's username
     getLinkForUser: (userId) => `https://t.me/BestiesSafetyBot?start=${userId}`, // <- Update here too
     contactExpiryHours: 20,
     contactExpiryMs: 20 * 60 * 60 * 1000
   };
   ```

---

## Step 4: Deploy Cloud Functions

1. **Deploy your functions** to Firebase:
   ```bash
   cd functions
   npm install  # If you haven't already
   cd ..
   firebase deploy --only functions
   ```

2. **Wait for deployment** to complete and note the webhook URL:
   - It will be something like:
     `https://us-central1-YOUR-PROJECT.cloudfunctions.net/telegramWebhook`

3. **If deployment fails**, check:
   - Firebase Functions config is set correctly
   - You're logged into the correct Firebase project
   - Your billing is enabled (required for external API calls)

---

## Step 5: Set the Telegram Webhook

1. **Set your webhook URL** so Telegram sends updates to your function:
   ```bash
   curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook?url=https://us-central1-YOUR-PROJECT.cloudfunctions.net/telegramWebhook"
   ```

   Replace:
   - `YOUR_BOT_TOKEN` with your actual bot token
   - `YOUR-PROJECT` with your Firebase project ID

2. **Verify the webhook** is set correctly:
   ```bash
   curl "https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo"
   ```

   You should see:
   ```json
   {
     "ok": true,
     "result": {
       "url": "https://us-central1-YOUR-PROJECT.cloudfunctions.net/telegramWebhook",
       "has_custom_certificate": false,
       "pending_update_count": 0
     }
   }
   ```

---

## Step 6: Deploy Firestore Security Rules

1. **Deploy the updated security rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Verify in Firebase Console**:
   - Go to Firestore Database → Rules
   - Confirm you see the `telegramContacts` collection rules

---

## Step 7: Deploy Frontend

1. **Build and deploy your frontend**:
   ```bash
   cd frontend
   npm run build
   firebase deploy --only hosting
   ```

2. **Verify the deployment**:
   - Visit your app URL
   - Go to Settings → should see "Telegram Alerts" section
   - Your personal Telegram link should be displayed

---

## Step 8: Test the Integration

### Test 1: Connect a Contact

1. **Log into your app** and go to Settings
2. **Copy your personal Telegram link** (should look like `https://t.me/BestiesSafetyBot?start=USER_ID_HERE`)
3. **Open the link** in Telegram (or send it to a test user)
4. **Press START** in the bot chat
5. **Verify**:
   - Bot sends a greeting message
   - Bot asks for confirmation with Yes/No buttons
   - Contact appears in "Connected Telegram Contacts" in Settings
   - Contact shows time remaining (should be ~20 hours)

### Test 2: Create a Check-in

1. **Create a new check-in** from the app
2. **Verify**:
   - "Telegram Contacts (Optional)" section appears
   - Your connected contact is listed
   - You can select the contact

### Test 3: Send an Alert

1. **Create a check-in** with a Telegram contact selected and duration of 1 minute
2. **Wait for the check-in to expire** (1 minute)
3. **Verify**:
   - Check Firebase Functions logs: `firebase functions:log`
   - Look for "✅ Sent telegram alert to..." message
   - Contact receives alert message in Telegram
   - Alert includes user's name, location, and time

---

## Troubleshooting

### Bot doesn't respond to /start

**Check:**
- Webhook is set correctly: `curl "https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo"`
- Cloud Function is deployed: Check Firebase Console → Functions
- Bot token is configured: `firebase functions:config:get`
- Check function logs: `firebase functions:log --only telegramWebhook`

### Contact doesn't appear in app

**Check:**
- Firestore security rules are deployed
- Check Firestore collection `telegramContacts` for the document
- Check browser console for errors
- Verify user is logged in

### Alerts not being sent

**Check:**
- Check-in has `telegramContactIds` array in Firestore
- Contact hasn't expired (check `expiresAt` timestamp)
- Function logs show the alert attempt: `firebase functions:log --only checkExpiredCheckIns`
- Telegram bot token is valid

### "Failed to set webhook" error

**Possible causes:**
- Cloud Function URL is incorrect
- Cloud Function hasn't finished deploying
- Webhook URL must be HTTPS (http:// won't work)

**Fix:**
1. Verify function is deployed: Check Firebase Console
2. Test function directly: Visit the URL in a browser (should return nothing, but not 404)
3. Try setting webhook again

---

## Feature Configuration

### Enable/Disable Telegram Alerts

**In `frontend/src/config/features.js`:**
```javascript
export const FEATURES = {
  // ...
  telegramAlerts: true,  // Set to false to disable
};
```

### Change Contact Expiry Time

**In `frontend/src/config/telegram.js`:**
```javascript
export const TELEGRAM_CONFIG = {
  contactExpiryHours: 20,  // Change to desired hours
  contactExpiryMs: 20 * 60 * 60 * 1000  // Update this to match
};
```

**Also update in `functions/index.js` line ~327:**
```javascript
const expiresAt = admin.firestore.Timestamp.fromMillis(
  Date.now() + (20 * 60 * 60 * 1000) // Update this value
);
```

---

## Architecture Overview

### How It Works

1. **User shares link**: `https://t.me/BotUsername?start=USER_ID`
2. **Contact clicks link**: Opens Telegram with the bot
3. **Contact presses START**: Telegram sends update to webhook
4. **Webhook processes**:
   - Extracts `USER_ID` from the `/start` command
   - Gets contact's Telegram info (name, username, chat_id)
   - Creates document in `telegramContacts` collection
   - Sends greeting and confirmation messages
5. **User creates check-in**: Selects Telegram contacts alongside SMS besties
6. **Alert triggers**:
   - `checkExpiredCheckIns` function runs every minute
   - Finds expired check-ins
   - Fetches Telegram contacts that haven't expired
   - Sends alert via Telegram API
7. **Contact receives alert**: Gets formatted message with location and time

### Key Files

**Backend:**
- `functions/index.js` (lines 254-425) - Telegram webhook and helpers
- `functions/core/checkins/checkExpiredCheckIns.js` (lines 82-113) - Alert sending
- `firestore.rules` (lines 287-291) - Security rules

**Frontend:**
- `frontend/src/config/telegram.js` - Bot configuration
- `frontend/src/components/settings/TelegramLinkDisplay.jsx` - Share link UI
- `frontend/src/components/settings/TelegramContactsList.jsx` - List connected contacts
- `frontend/src/components/checkin/TelegramContactSelector.jsx` - Select contacts for check-in
- `frontend/src/pages/CreateCheckInPage.jsx` - Check-in creation with Telegram
- `frontend/src/pages/SettingsPage.jsx` - Settings UI
- `frontend/src/config/features.js` - Feature flag

**Database:**
- `telegramContacts/{contactId}`:
  ```javascript
  {
    userId: string,           // Owner's user ID
    telegramUserId: string,   // Telegram user ID
    chatId: string,          // Telegram chat ID (for sending messages)
    firstName: string,       // Contact's first name
    username: string,        // @username (nullable)
    connectedAt: Timestamp,  // When they connected
    expiresAt: Timestamp     // When connection expires (20 hours)
  }
  ```

- `checkins/{checkInId}`:
  ```javascript
  {
    // ... existing fields
    telegramContactIds: array[string]  // Array of telegramContacts document IDs
  }
  ```

---

## Cost Considerations

- **Telegram API**: Completely free, no limits
- **Firebase Functions**: Pay per invocation (see Firebase pricing)
  - Webhook invocations: ~1 per contact connection
  - Alert sending: ~1 per alert per contact
- **Firestore**: Pay per read/write (see Firebase pricing)
  - Document writes: 1 per contact connection, 1 per check-in
  - Document reads: 1 per check-in creation, N per alert (N = number of contacts)

**Compared to SMS**: Telegram is 100% free with no per-message costs!

---

## Security & Privacy

- **Bot token**: Stored securely in Firebase Functions config (never exposed to client)
- **Webhook**: Only accepts POST requests from Telegram servers
- **User data**: Telegram contacts can only be read by their owner (Firestore rules)
- **Auto-expiry**: Contacts expire after 20 hours for privacy
- **No phone numbers**: Telegram doesn't require sharing phone numbers

---

## Next Steps

1. **Test thoroughly** with multiple users
2. **Monitor Firebase logs** for any errors
3. **Set up alerts** for failed function invocations
4. **Consider**: Adding privacy policy link in bot messages
5. **Consider**: Adding rate limiting to prevent abuse

---

## Support

If you encounter issues:

1. **Check Firebase Functions logs**: `firebase functions:log`
2. **Check Telegram webhook info**: `curl "https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo"`
3. **Check Firestore data**: Look at `telegramContacts` collection in Firebase Console
4. **Test bot directly**: Send `/start` command to your bot in Telegram

---

## Maintenance

**Weekly:**
- Review Firebase Functions logs for errors
- Check Firestore usage (reads/writes)

**Monthly:**
- Review connected contacts count
- Monitor alert success rate
- Check for expired contacts that should be cleaned up

**As Needed:**
- Update bot description/picture for branding
- Adjust contact expiry time based on user feedback
- Add additional bot commands (e.g., `/help`, `/status`)

---

## Congratulations!

Your Telegram integration is now set up and ready to provide free, unlimited safety alerts to your users! 🎉

For questions or improvements, please refer to the Telegram Bot API documentation: https://core.telegram.org/bots/api
