# 🔥 FIREBASE BACKEND SETUP - COMPLETE GUIDE

## Step-by-Step: Setting Up Your Firebase Backend

**Time Required: 15-20 minutes**

---

## 📋 STEP 1: Enable Firebase Services

### 1.1 Go to Firebase Console
1. Open: https://console.firebase.google.com
2. Click on your project: **bestiesapp**

---

### 1.2 Enable Authentication

1. In left sidebar, click **Authentication**
2. Click **Get Started**
3. Go to **Sign-in method** tab
4. Enable these providers:

**Email/Password:**
- Click "Email/Password"
- Toggle ON "Email/Password"
- Click Save

**Google:**
- Click "Google"
- Toggle ON
- Enter support email: `support@bestiesapp.xyz`
- Click Save

**Phone:**
- Click "Phone"
- Toggle ON
- Click Save
- Note: You'll need to add test phone numbers for development

---

### 1.3 Enable Firestore Database

1. In left sidebar, click **Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode** (we have security rules ready)
4. Select location: **australia-southeast1** (Sydney)
5. Click **Enable**

---

### 1.4 Enable Storage

1. In left sidebar, click **Storage**
2. Click **Get Started**
3. Choose **Start in production mode**
4. Select location: **australia-southeast1** (Sydney)
5. Click **Done**

---

### 1.5 Enable Cloud Functions

1. In left sidebar, click **Functions**
2. Click **Get Started**
3. Click **Upgrade project** (you need Blaze plan for Cloud Functions)
4. Add payment method (don't worry - has generous free tier)
5. Set spending limit to **$25/month** to avoid surprises
6. Click **Continue**

**Firebase Free Tier Limits (More than enough for starting):**
- Cloud Functions: 2M invocations/month
- Firestore: 50K reads, 20K writes, 20K deletes per day
- Storage: 5GB stored, 1GB downloaded per day
- Authentication: Unlimited

---

## 📋 STEP 2: Set Up Firestore Security Rules

1. In Firestore Database, click **Rules** tab
2. Replace all content with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isAuthenticated() && isOwner(userId);
      allow delete: if isAuthenticated() && isOwner(userId);
    }
    
    // Besties collection (relationships)
    match /besties/{bestieId} {
      allow read: if isAuthenticated() && (
        resource.data.requesterId == request.auth.uid ||
        resource.data.recipientId == request.auth.uid
      );
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && (
        resource.data.requesterId == request.auth.uid ||
        resource.data.recipientId == request.auth.uid
      );
      allow delete: if isAuthenticated() && (
        resource.data.requesterId == request.auth.uid ||
        resource.data.recipientId == request.auth.uid
      );
    }
    
    // Check-ins collection
    match /checkins/{checkinId} {
      allow read: if isAuthenticated() && (
        resource.data.userId == request.auth.uid ||
        request.auth.uid in resource.data.bestieIds
      );
      allow create: if isAuthenticated() && isOwner(request.resource.data.userId);
      allow update: if isAuthenticated() && (
        resource.data.userId == request.auth.uid ||
        request.auth.uid in resource.data.bestieIds
      );
      allow delete: if isAuthenticated() && isOwner(resource.data.userId);
    }
    
    // Templates collection
    match /templates/{templateId} {
      allow read: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() && isOwner(request.resource.data.userId);
      allow update: if isAuthenticated() && isOwner(resource.data.userId);
      allow delete: if isAuthenticated() && isOwner(resource.data.userId);
    }
    
    // Badges collection
    match /badges/{userId} {
      allow read: if isAuthenticated();
      allow write: if false; // Only cloud functions can write badges
    }
    
    // Analytics collection (admin only via functions)
    match /analytics/{doc} {
      allow read: if false;
      allow write: if false;
    }
  }
}
```

3. Click **Publish**

---

## 📋 STEP 3: Set Up Storage Security Rules

1. In Storage, click **Rules** tab
2. Replace all content with this:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isImage() {
      return request.resource.contentType.matches('image/.*');
    }
    
    function isVideo() {
      return request.resource.contentType.matches('video/.*');
    }
    
    function isUnder10MB() {
      return request.resource.size < 10 * 1024 * 1024;
    }
    
    // Check-in media (photos/videos)
    match /checkins/{userId}/{checkinId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() 
        && isOwner(userId)
        && (isImage() || isVideo())
        && isUnder10MB();
      allow delete: if isAuthenticated() && isOwner(userId);
    }
    
    // Emergency recordings (encrypted)
    match /emergency/{userId}/{emergencyId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isOwner(userId);
      allow delete: if false; // Can only be deleted by cloud function after 7 days
    }
    
    // Profile pictures
    match /profiles/{userId}/{fileName} {
      allow read: if true; // Public
      allow write: if isAuthenticated() 
        && isOwner(userId)
        && isImage()
        && isUnder10MB();
      allow delete: if isAuthenticated() && isOwner(userId);
    }
  }
}
```

3. Click **Publish**

---

## 📋 STEP 4: Create Firestore Indexes

1. In Firestore Database, click **Indexes** tab
2. Click **Create Index** for each of these:

**Index 1: Active Check-ins by Alert Time**
```
Collection ID: checkins
Fields:
  - status (Ascending)
  - alertTime (Ascending)
Query scope: Collection
```

**Index 2: User's Check-ins**
```
Collection ID: checkins
Fields:
  - userId (Ascending)
  - createdAt (Descending)
Query scope: Collection
```

**Index 3: Bestie Relationships**
```
Collection ID: besties
Fields:
  - requesterId (Ascending)
  - status (Ascending)
Query scope: Collection
```

**Index 4: Bestie Relationships (Recipient)**
```
Collection ID: besties
Fields:
  - recipientId (Ascending)
  - status (Ascending)
Query scope: Collection
```

3. Click **Create** for each
4. Wait 5-10 minutes for indexes to build

---

## 📋 STEP 5: Set Up Cloud Functions Environment

### 5.1 Install Firebase CLI (if not already)

```bash
npm install -g firebase-tools
firebase login
```

### 5.2 Set Environment Variables for Functions

Firebase Functions need your API keys. Set them with:

```bash
# Navigate to your project root
cd besties-complete

# Set Twilio credentials
firebase functions:config:set twilio.account_sid="YOUR_TWILIO_ACCOUNT_SID"
firebase functions:config:set twilio.auth_token="YOUR_TWILIO_AUTH_TOKEN"
firebase functions:config:set twilio.phone_number="YOUR_TWILIO_PHONE_NUMBER"

# Set Stripe credentials
firebase functions:config:set stripe.publishable_key="YOUR_STRIPE_PUBLISHABLE_KEY"
firebase functions:config:set stripe.secret_key="YOUR_STRIPE_SECRET_KEY"

# Set Google Maps API
firebase functions:config:set google.maps_api_key="YOUR_GOOGLE_MAPS_API_KEY"

# Set app config
firebase functions:config:set app.domain="bestiesapp.xyz"
firebase functions:config:set app.url="https://bestiesapp.xyz"
firebase functions:config:set app.support_email="support@bestiesapp.xyz"

# Verify configuration
firebase functions:config:get
```

You should see output like:
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

## 📋 STEP 6: Enable Required Google Cloud APIs

Cloud Functions need these APIs enabled:

1. Go to: https://console.cloud.google.com
2. Select project: **bestiesapp**
3. Go to **APIs & Services** > **Library**
4. Search and enable each:

**Required APIs:**
- ✅ Cloud Functions API
- ✅ Cloud Build API
- ✅ Cloud Scheduler API (for scheduled functions)
- ✅ Cloud Tasks API (for delayed functions)
- ✅ Secret Manager API (for secure config)
- ✅ Maps JavaScript API (for location suggestions)
- ✅ Places API (for location autocomplete)
- ✅ Geolocation API (for GPS)

**For each API:**
1. Search for it
2. Click on it
3. Click **Enable**

---

## 📋 STEP 7: Set Up Cloud Scheduler (for Timed Tasks)

1. Go to: https://console.cloud.google.com/cloudscheduler
2. Select region: **australia-southeast1**
3. Click **Create Job**

**Job 1: Check Expired Check-ins (runs every minute)**
```
Name: check-expired-checkins
Frequency: */1 * * * *
Timezone: Australia/Sydney
Target: HTTP
URL: https://australia-southeast1-bestiesapp.cloudfunctions.net/checkExpiredCheckIns
HTTP method: GET
Auth header: Add OIDC token
Service account: (use default)
```

**Job 2: Clean Up Old Data (runs daily at 3am)**
```
Name: cleanup-old-data
Frequency: 0 3 * * *
Timezone: Australia/Sydney
Target: HTTP
URL: https://australia-southeast1-bestiesapp.cloudfunctions.net/cleanupOldData
HTTP method: GET
Auth header: Add OIDC token
Service account: (use default)
```

**Job 3: Update Badge Stats (runs every hour)**
```
Name: update-badge-stats
Frequency: 0 * * * *
Timezone: Australia/Sydney
Target: HTTP
URL: https://australia-southeast1-bestiesapp.cloudfunctions.net/updateBadgeStats
HTTP method: GET
Auth header: Add OIDC token
Service account: (use default)
```

---

## 📋 STEP 8: Set Up Twilio WhatsApp (Optional but Recommended)

1. Go to: https://console.twilio.com
2. Click **Messaging** > **Try it out** > **Send a WhatsApp message**
3. Follow the setup wizard
4. You'll get a WhatsApp-enabled number (different from SMS)
5. Update your config:

```bash
firebase functions:config:set twilio.whatsapp_number="+14155238886"
```

---

## 📋 STEP 9: Test Your Backend Setup

### 9.1 Test Authentication

```bash
# In your project
cd besties-complete/frontend
npm install
npm start
```

Open http://localhost:3000 and:
1. Click "Sign up with Google"
2. Verify it creates user in Firestore
3. Check Firebase Console > Authentication (should see new user)
4. Check Firestore > users collection (should see user document)

### 9.2 Test Cloud Functions Locally

```bash
# In functions directory
cd besties-complete/functions
npm install

# Start emulator
firebase emulators:start
```

Open http://localhost:4000 to see emulator UI

Test creating a check-in and verify function triggers

---

## 📋 STEP 10: Deploy Everything

Once everything is set up and tested:

```bash
# From project root
cd besties-complete

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage

# Deploy all functions
firebase deploy --only functions

# Deploy frontend
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```

---

## ✅ VERIFICATION CHECKLIST

After setup, verify each:

### Firebase Console
```
✅ Authentication enabled (Google, Email, Phone)
✅ Firestore database created (australia-southeast1)
✅ Storage enabled (australia-southeast1)
✅ Firestore security rules published
✅ Storage security rules published
✅ Firestore indexes created (4 indexes, all built)
✅ Blaze plan active with $25 spending limit
```

### Google Cloud Console
```
✅ All required APIs enabled (7 APIs)
✅ Cloud Scheduler jobs created (3 jobs)
✅ Project billing enabled
```

### Firebase CLI
```
✅ Firebase CLI installed
✅ Logged into Firebase
✅ Environment config set (twilio, stripe, google, app)
✅ Functions config verified with: firebase functions:config:get
```

### Twilio
```
✅ Account verified
✅ Phone number active (+61468050420)
✅ SMS credits available
✅ (Optional) WhatsApp enabled
```

### Stripe
```
✅ Account activated
✅ Live mode enabled
✅ API keys copied
✅ Webhook endpoint ready to configure (after first deploy)
```

---

## 🎯 WHAT HAPPENS NEXT

Once all this is done:

1. **I'll give you the complete codebase** (frontend + backend)
2. **You copy it to your computer**
3. **Run `firebase deploy`**
4. **Your app goes live!** 🚀

---

## 🆘 TROUBLESHOOTING

### "Quota exceeded" error
- Check Firebase Console > Usage
- Verify Blaze plan is active
- Increase spending limit if needed

### Functions won't deploy
- Verify Node.js version 18
- Check `firebase functions:config:get` shows all keys
- Enable Cloud Build API

### "Permission denied" in Firestore
- Verify security rules are published
- Check user is authenticated
- Verify index is built (not "building")

### Can't send SMS
- Verify Twilio account is verified (not trial)
- Check phone number is formatted: +61...
- Verify credits available

---

## 📞 QUICK REFERENCE

**Your Project:**
- Project ID: `bestiesapp`
- Region: `australia-southeast1`
- Domain: `bestiesapp.xyz`
- Support: `support@bestiesapp.xyz`

**Important URLs:**
- Firebase Console: https://console.firebase.google.com/project/bestiesapp
- Google Cloud: https://console.cloud.google.com/
- Twilio: https://console.twilio.com
- Stripe: https://dashboard.stripe.com

---

## ✨ YOU'RE READY!

Once you've completed all these steps, let me know and I'll create the complete codebase with everything pre-configured!

**Estimated time for full setup: 15-20 minutes**

**Any questions or issues? Let me know!** 🚀
