# 📸 VISUAL SETUP GUIDE

## What Each Step Actually Looks Like

---

## Step 1: Enable Authentication

**What to click:**
```
Firebase Console Homepage
└── Left sidebar: "Authentication"
    └── Click "Get Started"
        └── Click "Sign-in method" tab
            └── Enable these:
                ├── Email/Password
                ├── Google (enter: support@bestiesapp.xyz)
                └── Phone
```

**You'll know it's working when:**
- You see "Enabled" next to Email/Password, Google, and Phone
- Each shows a green checkmark

---

## Step 2: Create Firestore Database

**What to click:**
```
Firebase Console Homepage
└── Left sidebar: "Firestore Database"
    └── Click "Create database"
        ├── Select "Start in production mode"
        ├── Location: "australia-southeast1 (Sydney)"
        └── Click "Enable"
```

**Wait time:** 30 seconds - 1 minute

**You'll know it's working when:**
- You see "Data", "Rules", "Indexes", "Usage" tabs
- Database shows as "Cloud Firestore"

---

## Step 3: Set Firestore Security Rules

**What to click:**
```
Firestore Database page
└── Click "Rules" tab
    └── Delete everything in the editor
    └── Copy/paste rules from FIREBASE_SETUP_GUIDE.md
    └── Click "Publish"
```

**You'll know it's working when:**
- Rules editor shows your new rules
- Top shows "Published" with timestamp
- No error messages

---

## Step 4: Create Firestore Indexes

**What to click:**
```
Firestore Database page
└── Click "Indexes" tab
    └── Click "Create Index" (4 times, once for each)
        
Index 1:
Collection ID: checkins
Fields to index:
  - status: Ascending
  - alertTime: Ascending
Click "Create"

Index 2:
Collection ID: checkins
Fields to index:
  - userId: Ascending
  - createdAt: Descending
Click "Create"

Index 3:
Collection ID: besties
Fields to index:
  - requesterId: Ascending
  - status: Ascending
Click "Create"

Index 4:
Collection ID: besties
Fields to index:
  - recipientId: Ascending
  - status: Ascending
Click "Create"
```

**Wait time:** 5-10 minutes for all to build

**You'll know it's working when:**
- All 4 indexes show "Enabled" (green)
- None say "Building" (wait if they do)

---

## Step 5: Enable Storage

**What to click:**
```
Firebase Console Homepage
└── Left sidebar: "Storage"
    └── Click "Get Started"
        ├── Select "Start in production mode"
        ├── Location: "australia-southeast1"
        └── Click "Done"
```

**Then set rules:**
```
Storage page
└── Click "Rules" tab
    └── Delete everything
    └── Copy/paste storage rules from guide
    └── Click "Publish"
```

**You'll know it's working when:**
- You see "Files" tab with empty bucket
- Rules show "Published" timestamp

---

## Step 6: Upgrade to Blaze Plan

**What to click:**
```
Firebase Console Homepage
└── Left sidebar: "Functions" OR top-right "Upgrade"
    └── Click "Upgrade project"
        ├── Add payment method (credit card)
        ├── Set budget alert: $25/month
        └── Click "Continue"
```

**You'll know it's working when:**
- Top-right shows "Blaze" instead of "Spark"
- Functions section is accessible
- No "Upgrade" prompts

---

## Step 7: Enable Google Cloud APIs

**What to click:**
```
Google Cloud Console (console.cloud.google.com)
└── Select project: "bestiesapp"
    └── Left menu: "APIs & Services" > "Library"
        └── For EACH API:
            ├── Search for API name
            ├── Click on it
            ├── Click "Enable"
            └── Wait for "API enabled" message
```

**APIs to enable (do all 8):**
1. Cloud Functions API
2. Cloud Build API
3. Cloud Scheduler API
4. Cloud Tasks API
5. Secret Manager API
6. Maps JavaScript API
7. Places API
8. Geolocation API

**You'll know it's working when:**
- Each API page shows "API enabled" at top
- "Disable" button visible (not "Enable")

---

## Step 8: Set Up Cloud Scheduler

**What to click:**
```
Google Cloud Console
└── Left menu: "Cloud Scheduler"
    └── Select region: "australia-southeast1"
        └── Click "Create Job" (3 times, once for each job)

Job 1:
Name: check-expired-checkins
Description: Check for expired check-ins every minute
Frequency: */1 * * * *
Timezone: Australia/Sydney
Target type: HTTP
URL: (will fill after deploy)
HTTP method: GET
Auth header: Add OIDC token

Click "Create"

(Repeat for Jobs 2 and 3 with different details)
```

**You'll know it's working when:**
- You see 3 jobs listed
- Each shows "Enabled"
- Frequency shows correctly

---

## Step 9: Set Firebase Functions Config (Terminal)

**Open Terminal/Command Prompt:**

```bash
# Check Firebase CLI installed
firebase --version
# Should show: 13.x.x or higher

# Login
firebase login
# Browser opens, click "Allow"

# Navigate to project
cd path/to/besties-complete

# Set all config (copy/paste each line)
firebase functions:config:set twilio.account_sid="YOUR_TWILIO_ACCOUNT_SID"
# Wait for "✔  Functions config updated."

firebase functions:config:set twilio.auth_token="YOUR_TWILIO_AUTH_TOKEN"
# Wait for confirmation

firebase functions:config:set twilio.phone_number="YOUR_TWILIO_PHONE_NUMBER"
# Wait for confirmation

firebase functions:config:set stripe.publishable_key="YOUR_STRIPE_PUBLISHABLE_KEY"
# Wait for confirmation

firebase functions:config:set stripe.secret_key="YOUR_STRIPE_SECRET_KEY"
# Wait for confirmation

firebase functions:config:set google.maps_api_key="YOUR_GOOGLE_MAPS_API_KEY"
# Wait for confirmation

firebase functions:config:set app.domain="bestiesapp.xyz"
firebase functions:config:set app.url="https://bestiesapp.xyz"
firebase functions:config:set app.support_email="support@bestiesapp.xyz"
# Wait for all confirmations

# Verify everything is set
firebase functions:config:get
```

**You'll know it's working when:**
- Each command shows "✔  Functions config updated."
- `firebase functions:config:get` shows all your values
- No error messages

**Example output you should see:**
```json
{
  "twilio": {
    "account_sid": "YOUR_TWILIO_ACCOUNT_SID",
    "auth_token": "YOUR_TWILIO_AUTH_TOKEN",
    "phone_number": "YOUR_TWILIO_PHONE_NUMBER"
  },
  "stripe": {
    "publishable_key": "YOUR_STRIPE_PUBLISHABLE_KEY",
    "secret_key": "YOUR_STRIPE_SECRET_KEY"
  },
  "google": {
    "maps_api_key": "YOUR_GOOGLE_MAPS_API_KEY"
  },
  "app": {
    "domain": "bestiesapp.xyz",
    "url": "https://bestiesapp.xyz",
    "support_email": "support@bestiesapp.xyz"
  }
}
```

---

## ✅ FINAL VERIFICATION

Before moving on, double-check:

**Firebase Console:**
- [ ] Authentication shows 3 providers enabled
- [ ] Firestore database created in Sydney
- [ ] Firestore rules published (see timestamp)
- [ ] 4 Firestore indexes all show "Enabled"
- [ ] Storage enabled in Sydney
- [ ] Storage rules published
- [ ] Blaze plan active (top-right shows "Blaze")

**Google Cloud Console:**
- [ ] Project selected: bestiesapp
- [ ] 8 APIs all enabled
- [ ] 3 Cloud Scheduler jobs created

**Terminal:**
- [ ] `firebase --version` shows version number
- [ ] `firebase login` successful
- [ ] `firebase functions:config:get` shows all values

**External Services:**
- [ ] Twilio account active
- [ ] Stripe account in live mode

---

## 🎉 YOU'RE READY!

If all checkboxes above are checked, you're ready for the codebase!

**Tell me when you're done and I'll create the complete app code!** 🚀

---

## 🆘 Common Issues

**"Command not found: firebase"**
- Solution: Run `npm install -g firebase-tools`

**"Permission denied" when setting config**
- Solution: Run `firebase login` again

**"Indexes still building" after 10 minutes**
- Solution: Normal for first time, can take up to 30 min
- You can continue, they'll work once built

**"Billing not enabled"**
- Solution: Go to Firebase Console > Upgrade to Blaze
- Add payment method

**"API not enabled" errors**
- Solution: Go to Google Cloud Console
- Enable the specific API mentioned in error

---

**Need help? Check the full guide: FIREBASE_SETUP_GUIDE.md**
