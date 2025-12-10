# Facebook Messenger Page Access Token Setup Guide

## Overview
This guide will help you get a **Page Access Token** for your Facebook Messenger integration. The token allows your app to send messages and access user profile data through Messenger.

**Important:** If it works for developer accounts but not live accounts, your app is likely in **Development Mode** and needs to be switched to **Live Mode** or go through App Review.

---

## Part 1: Get Your Page Access Token

### Step 1: Go to Facebook Developers Console
1. Visit: https://developers.facebook.com/
2. Log in with your Facebook account
3. Click **"My Apps"** in the top right
4. Select your app (or create a new one if needed)

### Step 2: Add Messenger Product
1. In your app dashboard, click **"+ Add Product"** (left sidebar)
2. Find **"Messenger"** and click **"Set Up"**
3. This will add Messenger to your app

### Step 3: Get Page Access Token
1. In the left sidebar, click **"Messenger"** > **"Settings"**
2. Scroll down to **"Access Tokens"** section
3. Under **"Token Generation"**, select your Facebook Page from the dropdown
   - If you don't see your page, you need to:
     - Make sure you're an admin of the Facebook Page
     - Go to your Facebook Page > Settings > Page Roles and verify your admin access
4. Click **"Generate Token"**
5. **Copy the token immediately** - it will look like: `EAAMS0hXaq54BQFX4Nn2IFnGy0fuwOlCuMHoREGmktH0IuD4lKK5bIU9M8ZCxdgWzubd2JAA9ZB626qbuoYymvdPtsMAnZCWJqSokWJpeTXmQpuqY8WZBPKKLPWUVoF0CZBhjid6KRMQQfUwnrym6ldZAaFDBaLDVc66aZCq3SseHU1vBh1G3y1Iq9ZAtLyH1Qr2nm8bRhopu7gZDZD`

### Step 4: Set Token in Firebase
```bash
firebase functions:config:set facebook.page_token="YOUR_TOKEN_HERE"
```

### Step 5: Redeploy Functions
```bash
firebase deploy --only functions
```

---

## Part 2: Verify Your Token

### Method 1: Check Token in Firebase Functions Config
```bash
firebase functions:config:get
```

Look for:
```json
{
  "facebook": {
    "page_token": "EAAMS0hXaq54BQFX4Nn2IFnGy0fuwOlCuMHoREGmktH0IuD4lKK5bIU9M8ZCxdgWzubd2JAA9ZB626qbuoYymvdPtsMAnZCWJqSokWJpeTXmQpuqY8WZBPKKLPWUVoF0CZBhjid6KRMQQfUwnrym6ldZAaFDBaLDVc66aZCq3SseHU1vBh1G3y1Iq9ZAtLyH1Qr2nm8bRhopu7gZDZD"
  }
}
```

### Method 2: Test Token with Graph API Explorer
1. Visit: https://developers.facebook.com/tools/explorer/
2. Select your app from the dropdown (top right)
3. Click **"Get Token"** > **"Get User Access Token"**
4. In the popup, select these permissions:
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_messaging`
5. Click **"Generate Access Token"**
6. After generating, click the **"i"** icon next to the token
7. Click **"Open in Access Token Tool"**
8. In the Access Token Tool, click **"Debug"**
9. You should see your token details including:
   - **Type:** Page Access Token
   - **Valid:** Yes
   - **Expires:** (date or "Never" for long-lived tokens)

### Method 3: Test Token with cURL (Command Line)
Replace `YOUR_TOKEN` with your actual token:

```bash
# Test if token can access your page
curl "https://graph.facebook.com/v24.0/me?access_token=YOUR_TOKEN"

# Test if token can send messages (this will show permissions)
curl "https://graph.facebook.com/v24.0/me/permissions?access_token=YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "data": [
    {
      "permission": "pages_messaging",
      "status": "granted"
    },
    {
      "permission": "pages_read_engagement",
      "status": "granted"
    }
  ]
}
```

### Method 4: Check Token in Facebook App Dashboard
1. Go to: https://developers.facebook.com/apps/
2. Select your app
3. Go to **"Messenger"** > **"Settings"**
4. Scroll to **"Access Tokens"**
5. You should see your token listed with:
   - The page name it's associated with
   - Token status (Active/Expired)
   - Last used date

---

## Part 3: Fix "Development Mode" Issue

If your token works for developer accounts but **NOT for live accounts**, your app is in **Development Mode**. Here's how to fix it:

### Option A: Switch to Live Mode (No App Review Required)
**Note:** This only works if you don't need advanced permissions.

1. Go to your app dashboard: https://developers.facebook.com/apps/
2. Select your app
3. In the top bar, you'll see **"Development Mode"** - click it
4. Click **"Switch to Live Mode"**
5. Confirm the switch

**Limitations:**
- Only works for users who are:
  - App admins
  - App developers
  - App testers (if you add them)
- Won't work for general public users

### Option B: Submit for App Review (Required for Public Use)
If you need the app to work for **all users**, you must submit for App Review:

1. Go to your app dashboard
2. Click **"App Review"** in the left sidebar
3. Click **"Permissions and Features"**
4. Find **"pages_messaging"** permission
5. Click **"Request"** or **"Edit"**
6. Fill out the form:
   - **Use Case:** Explain how your app uses Messenger (e.g., "Send safety alerts to users' emergency contacts")
   - **Instructions:** Provide step-by-step instructions for reviewers
   - **Screencast/Video:** Record a video showing the feature in action
7. Submit for review (can take 1-7 business days)

**Required Permissions for Review:**
- `pages_messaging` - To send/receive messages
- `pages_read_engagement` - To read page engagement data

---

## Part 4: Verify Token Permissions

### Check What Permissions Your Token Has

1. Go to: https://developers.facebook.com/tools/debug/accesstoken/
2. Paste your Page Access Token
3. Click **"Debug"**
4. Review the permissions listed

**Required Permissions:**
- ✅ `pages_messaging` - **REQUIRED** for sending messages
- ✅ `pages_read_engagement` - **REQUIRED** for reading user data
- ✅ `pages_show_list` - Helpful for managing pages

### If Permissions Are Missing

1. Go to **"Messenger"** > **"Settings"** in your app dashboard
2. Scroll to **"Access Tokens"**
3. Click **"Generate Token"** again
4. Make sure you select the correct page
5. The new token should have all required permissions

---

## Part 5: Make Token Long-Lived (Optional but Recommended)

Page Access Tokens can expire. To make them long-lived:

1. Go to: https://developers.facebook.com/tools/explorer/
2. Select your app
3. Get a User Access Token with `pages_manage_metadata` permission
4. Use this API call to exchange for a long-lived token:

```bash
curl -X GET "https://graph.facebook.com/v24.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_LIVED_TOKEN"
```

**Or use the Access Token Tool:**
1. Go to: https://developers.facebook.com/tools/accesstoken/
2. Select your app
3. Find your Page Access Token
4. Click **"Extend Access Token"**
5. Copy the new long-lived token
6. Update it in Firebase:

```bash
firebase functions:config:set facebook.page_token="NEW_LONG_LIVED_TOKEN"
firebase deploy --only functions
```

---

## Part 6: Troubleshooting

### Error: "Invalid OAuth access token"
- Token may have expired
- Regenerate token in Messenger Settings
- Update Firebase config and redeploy

### Error: "Missing permissions"
- Token doesn't have `pages_messaging` permission
- Regenerate token with correct permissions
- Make sure you're selecting the right page

### Error: "Object does not exist, cannot be loaded due to missing permissions"
- App is in Development Mode (only works for dev accounts)
- Switch to Live Mode OR submit for App Review
- Token might not have permission to access user profile data

### Works for Dev Accounts but Not Live Accounts
**This is the most common issue!**

**Solution:**
1. Check app mode: App Dashboard > App Review > App Status
2. If in Development Mode:
   - Add test users: App Dashboard > Roles > Test Users
   - OR switch to Live Mode (limited functionality)
   - OR submit for App Review (full functionality)

### Token Works but Can't Send Messages
1. Verify webhook is set up correctly
2. Check webhook URL in Messenger Settings
3. Verify webhook is subscribed to events:
   - `messages`
   - `messaging_postbacks`
   - `messaging_referrals`

---

## Part 7: Quick Verification Checklist

Use this checklist to verify everything is set up correctly:

- [ ] Page Access Token generated in Messenger Settings
- [ ] Token copied and saved securely
- [ ] Token set in Firebase: `firebase functions:config:set facebook.page_token="TOKEN"`
- [ ] Functions redeployed: `firebase deploy --only functions`
- [ ] Token verified with Graph API Explorer or Debug Tool
- [ ] Token has `pages_messaging` permission
- [ ] App is in Live Mode OR App Review submitted (if needed for public use)
- [ ] Webhook URL configured in Messenger Settings
- [ ] Webhook subscribed to required events
- [ ] Test message sent successfully

---

## Part 8: Test Your Setup

### Test 1: Send a Test Message via API
Replace `YOUR_TOKEN` and `RECIPIENT_PSID`:

```bash
curl -X POST "https://graph.facebook.com/v24.0/me/messages?access_token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": {"id": "RECIPIENT_PSID"},
    "message": {"text": "Test message from Besties app"}
  }'
```

**Note:** `RECIPIENT_PSID` is the Facebook user's Page-Scoped ID. You can get this from webhook events when users interact with your page.

### Test 2: Check Webhook Logs
1. Go to Firebase Console > Functions > Logs
2. Look for `messengerWebhook` function logs
3. Send a test message to your page
4. Check logs for any errors

### Test 3: Use Facebook's Test Tool
1. Go to: https://developers.facebook.com/apps/
2. Select your app > Messenger > Settings
3. Scroll to **"Webhooks"**
4. Click **"Test"** button next to your webhook
5. This will send a test event to your webhook

---

## Important Notes

1. **Token Security:** Never commit tokens to Git. Always use Firebase Functions config.

2. **Token Expiration:** Page Access Tokens can expire. Check expiration date and regenerate if needed.

3. **App Review:** For production apps serving real users, you MUST go through App Review for `pages_messaging` permission.

4. **Rate Limits:** Facebook has rate limits. Check: https://developers.facebook.com/docs/graph-api/overview/rate-limiting

5. **Webhook URL:** Must be HTTPS and publicly accessible. Your Firebase Function URL should work: `https://us-central1-bestiesapp.cloudfunctions.net/messengerWebhook`

---

## Support Resources

- **Facebook Graph API Docs:** https://developers.facebook.com/docs/graph-api
- **Messenger Platform Docs:** https://developers.facebook.com/docs/messenger-platform
- **Access Token Debugger:** https://developers.facebook.com/tools/debug/accesstoken/
- **Graph API Explorer:** https://developers.facebook.com/tools/explorer/

---

## Your Current Configuration

Based on your codebase:
- **Page Username:** `besties.safety`
- **M.me Link:** `https://m.me/besties.safety?ref={userId}`
- **Webhook Function:** `messengerWebhook`
- **Project ID:** `bestiesapp`
- **Region:** `us-central1` (based on error logs)

Your webhook URL should be:
```
https://us-central1-bestiesapp.cloudfunctions.net/messengerWebhook
```

Make sure this URL is configured in Facebook Messenger Settings > Webhooks.

