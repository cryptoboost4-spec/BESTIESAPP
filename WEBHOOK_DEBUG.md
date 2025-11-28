# Facebook Messenger Webhook Debugging Guide

## Issue: Messages not reaching webhook (no logs)

### Quick Checklist:

1. ✅ Webhook URL verified
2. ✅ Page Access Token set in Firebase
3. ❓ Webhook subscribed to Page events? ← LIKELY THE ISSUE
4. ❓ Webhook subscribed to correct fields?

---

## SOLUTION: Subscribe Webhook to Page Events

### Step 1: Go to Webhook Settings

1. Go to: https://developers.facebook.com/apps/YOUR_APP_ID/messenger/settings/
2. Scroll to "Webhooks" section
3. You should see your verified webhook

### Step 2: Subscribe to Page

Look for a section that says:
- "Subscribe to events for a specific page"
- OR "Select a page to subscribe your webhook to events"

You should see:
- A button that says "Subscribe to Events" or "Add Subscriptions"
- Click it
- Select "besties.safety" page
- Click "Subscribe" or "Done"

### Step 3: Verify Subscription Fields

Make sure these are checked:
- ✅ messages
- ✅ messaging_postbacks
- ✅ messaging_referrals

---

## Alternative: Use Graph API Explorer to Subscribe

If you can't find the subscribe button, do it via API:

1. Go to: https://developers.facebook.com/tools/explorer/
2. Select your app from dropdown
3. Get your Page ID:
   - Visit: https://www.facebook.com/besties.safety
   - Look in URL or About section for Page ID
4. In Graph API Explorer, make a POST request to:
   ```
   /{PAGE_ID}/subscribed_apps
   ```
5. Click "Submit"

This manually subscribes the webhook to your page.

---

## How to Check if Subscription Worked

### Method 1: Check in Dashboard
- Meta for Developers → Your App → Messenger → Settings
- Under Webhooks, you should see "besties.safety" listed as subscribed

### Method 2: Use Graph API
- GET request to: `/{PAGE_ID}/subscribed_apps`
- Should return your app in the list

---

## Test After Subscribing

1. Click your m.me link: https://m.me/besties.safety?ref=YOUR_USER_ID
2. Send any message
3. Check Firebase Function logs immediately
4. You should see the webhook being triggered

---

## If Still Not Working

Check these:

1. **Is GitHub deployment complete?**
   - Go to: https://github.com/cryptoboost4-spec/BESTIESAPP/actions
   - Check latest workflow run
   - Make sure functions deployed successfully

2. **Is the Page Access Token actually set?**
   ```bash
   firebase functions:config:get
   ```
   Should show: `facebook.page_token`

3. **Are you messaging from the right account?**
   - Must be an Admin/Developer/Tester added in Roles
   - Regular users won't work until App Review is approved

4. **Is the m.me link format correct?**
   ```
   https://m.me/besties.safety?ref=YOUR_FIREBASE_USER_ID
   ```

---

## What Success Looks Like

When it works, you'll see in Firebase logs:
```
Function execution started
Processing messenger message
Contact created/updated
Function execution took X ms
```

And in Messenger:
- Bot responds: "Hi [Name]! [User] said you'd reach out."
- Bot sends Yes/No quick replies
- Contact appears in your app's Settings

---

## Still Stuck?

Send me:
1. Screenshot of Messenger → Settings → Webhooks section
2. Firebase function logs (even if empty)
3. Your m.me link format
