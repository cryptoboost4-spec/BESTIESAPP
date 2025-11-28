# Telegram Integration Setup Guide

Quick setup guide for adding Telegram bot integration to Besties Safety app.

## What You Need

1. **Telegram Bot Token** - Get this from @BotFather
2. **Firebase Project** - Your existing Firebase project
3. **Bot Username**: `@bestiesappbot`

---

## Step 1: Create/Configure Your Telegram Bot

1. Open Telegram and search for `@BotFather`
2. If you haven't created the bot yet:
   - Send `/newbot`
   - Name: "Besties App"
   - Username: "bestiesappbot"
   - Save the bot token that BotFather gives you
3. If the bot already exists:
   - Send `/mybots` to @BotFather
   - Select your bot
   - Go to "API Token" to view/regenerate the token

---

## Step 2: Add Bot Token to Firebase

Add your Telegram bot token to Firebase Functions configuration:

```bash
firebase functions:config:set telegram.bot_token="YOUR_BOT_TOKEN_HERE"
```

Replace `YOUR_BOT_TOKEN_HERE` with the actual token from BotFather (looks like `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`).

**Verify it was saved:**
```bash
firebase functions:config:get
```

---

## Step 3: Set the Telegram Webhook

**What is a webhook?**
Adding the bot token to Firebase just stores it - it doesn't tell Telegram where to send messages. The webhook is the URL where Telegram will send updates when someone interacts with your bot.

**After GitHub deploys your functions**, you need to tell Telegram the webhook URL:

```bash
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook?url=https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net/telegramWebhook"
```

Replace:
- `YOUR_BOT_TOKEN` - Your bot token from Step 1
- `YOUR-PROJECT-ID` - Your Firebase project ID (e.g., `besties-prod` or `besties-dev`)

**Example:**
```bash
curl -X POST "https://api.telegram.org/bot123456789:ABCdefGHI/setWebhook?url=https://us-central1-besties-prod.cloudfunctions.net/telegramWebhook"
```

**Verify webhook is set:**
```bash
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo"
```

You should see:
```json
{
  "ok": true,
  "result": {
    "url": "https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net/telegramWebhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

---

## Step 4: Push to GitHub

Since you're using GitHub for deployment:

```bash
git add -A
git commit -m "Add Telegram integration"
git push
```

GitHub will automatically:
- Deploy Cloud Functions (including `telegramWebhook`)
- Deploy Firestore rules (for `telegramContacts` collection)
- Build and deploy frontend

**Wait for deployment to complete** before setting the webhook (Step 3).

---

## Step 5: Test It

1. **Log into your app** → Go to Settings
2. **Find "Telegram Alerts"** section
3. **Copy your personal link** (should be `https://t.me/bestiesappbot?start=YOUR_USER_ID`)
4. **Open the link** in Telegram
5. **Press START**
6. **Verify:**
   - Bot sends greeting: "Hi [Name]! [Your Name] said you'd reach out."
   - Bot asks for confirmation with Yes/No buttons
   - Contact appears in app under "Connected Telegram Contacts"
   - Shows "Connected [date]"

7. **Create a test check-in:**
   - Set duration to 1 minute
   - Select your Telegram contact
   - Submit
   - Wait 1 minute
   - **Verify alert is sent** to Telegram

---

## How It Works

### User Flow
1. User shares link: `https://t.me/bestiesappbot?start=USER_ID`
2. Contact clicks → Opens bot in Telegram
3. Contact presses START
4. Telegram sends update to your webhook
5. Your function processes it:
   - Extracts USER_ID from the start parameter
   - Gets contact's info (name, username, chat_id)
   - Saves to `telegramContacts` collection
   - Sends greeting + confirmation messages
6. Contact is now connected **permanently**
7. User creates check-in, selects Telegram contacts
8. When check-in expires → Alert sent via Telegram

### Database Schema

**Collection: `telegramContacts`**
```javascript
{
  userId: string,           // Owner's Firebase UID
  telegramUserId: string,   // Telegram user ID (unique)
  chatId: string,          // Where to send messages
  firstName: string,       // Contact's first name
  username: string,        // @username (optional)
  connectedAt: Timestamp   // When they connected
}
```

**Check-ins get:**
```javascript
{
  // ... existing fields
  telegramContactIds: array[string]  // IDs of selected contacts
}
```

---

## Troubleshooting

### Bot doesn't respond when I press START

**Check webhook:**
```bash
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo"
```

If URL is empty or wrong → Set it again (Step 3)

**Check function is deployed:**
- Go to Firebase Console → Functions
- Look for `telegramWebhook`
- Check it's deployed and not erroring

**Check logs:**
```bash
firebase functions:log --only telegramWebhook
```

### Contact doesn't appear in app

**Check Firestore:**
- Firebase Console → Firestore Database
- Look for `telegramContacts` collection
- Should have a document with your contact's info

**Check browser console:**
- Open DevTools → Console
- Look for errors

### Alerts not being sent

**Check function logs:**
```bash
firebase functions:log --only checkExpiredCheckIns
```

Look for: "✅ Sent telegram alert to..."

**Check check-in document:**
- Should have `telegramContactIds` array with contact IDs

---

## Key Files

**Backend:**
- `functions/index.js` (lines 254-425) - Webhook handler
- `functions/core/checkins/checkExpiredCheckIns.js` - Alert sending
- `firestore.rules` - Security for `telegramContacts`

**Frontend:**
- `frontend/src/config/telegram.js` - Bot configuration
- `frontend/src/components/settings/TelegramLinkDisplay.jsx`
- `frontend/src/components/settings/TelegramContactsList.jsx`
- `frontend/src/components/checkin/TelegramContactSelector.jsx`
- `frontend/src/pages/CreateCheckInPage.jsx`
- `frontend/src/pages/SettingsPage.jsx`

---

## Important Notes

✅ **Contacts are permanent** - They don't expire
✅ **Completely free** - Telegram API has no costs
✅ **Unlimited contacts** - No limits
✅ **GitHub auto-deploys** - Just push to deploy
⚠️ **Must set webhook** - Required after each deployment that changes webhook URL
⚠️ **Bot token is secret** - Don't commit it to code (use Firebase config)

---

## Questions?

- **Webhook not working?** Make sure function is deployed first
- **Bot token where?** `firebase functions:config:get`
- **Webhook URL format?** `https://REGION-PROJECT_ID.cloudfunctions.net/telegramWebhook`
- **Test webhook?** `curl "https://api.telegram.org/botTOKEN/getWebhookInfo"`

For Telegram Bot API docs: https://core.telegram.org/bots/api
