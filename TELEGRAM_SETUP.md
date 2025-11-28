# Telegram Bot Setup Guide

## 1. Create Bot in BotFather

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Send `/newbot`
3. Follow prompts:
   - **Bot name**: `Besties` (display name)
   - **Bot username**: `Bestiesappbot` (must end in 'bot')

4. Save the bot token (looks like `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

**Note:** The bot has already been created with username `@Bestiesappbot`

## 2. Configure Bot Settings in BotFather

Send these commands to BotFather:

### Set Description (shown when users first open the bot)
```
/setdescription
```
Then select your bot and paste:
```
Besties Safety Bot helps you stay safe! Connect your Telegram account to receive instant safety alerts when your besties need help.

Click START to connect your account.
```

### Set About Text (shown in bot profile)
```
/setabouttext
```
Then select your bot and paste:
```
Official Besties Safety notification bot. Connect your account to receive safety alerts when your friends need help.
```

### Set Commands Menu
```
/setcommands
```
Then select your bot and paste:
```
start - Connect your Telegram account
disconnect - Disconnect your account
```

### Set Bot Picture (optional)
```
/setuserpic
```
Then upload the Besties logo

## 3. Configure Firebase

Set the bot token in Firebase Functions config:
```bash
firebase functions:config:set telegram.bot_token="YOUR_BOT_TOKEN_HERE"
```

## 4. Deploy Functions

```bash
firebase deploy --only functions:telegramWebhook
```

## 5. Set Webhook

After deploying, set the webhook URL (replace with your actual values):
```bash
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
  -d "url=https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/telegramWebhook"
```

Or use this URL in browser:
```
https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook?url=https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/telegramWebhook
```

## 6. Verify Setup

Check webhook status:
```bash
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo"
```

Should return:
```json
{
  "ok": true,
  "result": {
    "url": "https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/telegramWebhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

## 7. Test the Bot

1. Go to Settings in Besties app
2. Scroll to Telegram section
3. Click "Connect Telegram"
4. Opens bot in Telegram
5. Click START (or send `/start`)
6. Should see confirmation message
7. Back in app, should show "Connected"

## Bot Messages (Already Configured in Code)

The following messages are sent programmatically by the webhook:

### On `/start` (successful connection):
```
✅ Connected!

Hi {firstName}! Your Telegram is now connected to Besties.

You'll receive safety alerts here when your besties need help. Stay safe! 💜
```

### On `/disconnect`:
```
✅ Disconnected

Your Telegram has been disconnected from Besties. You won't receive alerts here anymore.
```

### On safety alert:
```
🚨 SAFETY ALERT 🚨

{userName} needs help!

📍 Location: {location}
⏰ Started: {startTime}

They haven't checked in safely. Please reach out!
```

### On invalid link:
```
❌ Invalid link. Please use the link from your Besties app settings.
```

### On user not found:
```
❌ User not found. Please make sure you're using the correct link from the app.
```

## Troubleshooting

### Webhook not receiving updates
- Check webhook is set correctly: `/getWebhookInfo`
- Make sure functions are deployed
- Check Firebase Functions logs for errors

### Bot not responding
- Verify bot token is correct in Firebase config
- Check webhook URL matches deployed function URL
- Test webhook manually with curl

### Connection not saving
- Check Firestore rules allow user document updates
- Verify user ID in /start link is valid
- Check Firebase Functions logs for errors

## Security Notes

- Bot token is stored in Firebase Functions config (not in code)
- Users can only connect their own account (userId validated)
- `/disconnect` removes all Telegram data from user document
- Webhook validates incoming requests from Telegram
