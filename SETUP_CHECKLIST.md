# ✅ FIREBASE SETUP CHECKLIST

**Print this and check off as you go!**

---

## 🔥 Firebase Console (console.firebase.google.com/project/bestiesapp)

### Authentication
- [ ] Enable Email/Password authentication
- [ ] Enable Google authentication (support email: support@bestiesapp.xyz)
- [ ] Enable Phone authentication

### Firestore Database
- [ ] Create database in production mode
- [ ] Set location: australia-southeast1
- [ ] Copy/paste Firestore security rules
- [ ] Publish rules
- [ ] Create 4 indexes:
  - [ ] checkins: status + alertTime
  - [ ] checkins: userId + createdAt
  - [ ] besties: requesterId + status
  - [ ] besties: recipientId + status
- [ ] Wait for indexes to finish building (5-10 min)

### Storage
- [ ] Enable storage
- [ ] Set location: australia-southeast1
- [ ] Copy/paste Storage security rules
- [ ] Publish rules

### Functions
- [ ] Upgrade to Blaze plan
- [ ] Add payment method
- [ ] Set spending limit: $25/month

---

## ☁️ Google Cloud Console (console.cloud.google.com)

### Select Project: bestiesapp

### Enable APIs (APIs & Services > Library)
- [ ] Cloud Functions API
- [ ] Cloud Build API
- [ ] Cloud Scheduler API
- [ ] Cloud Tasks API
- [ ] Secret Manager API
- [ ] Maps JavaScript API
- [ ] Places API
- [ ] Geolocation API

### Cloud Scheduler (Create 3 jobs)
- [ ] check-expired-checkins (every minute)
- [ ] cleanup-old-data (daily 3am)
- [ ] update-badge-stats (hourly)

---

## 💻 Local Setup (Terminal Commands)

### Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```
- [ ] Firebase CLI installed
- [ ] Logged in successfully

### Set Function Environment Variables
```bash
cd besties-complete

firebase functions:config:set twilio.account_sid="YOUR_TWILIO_ACCOUNT_SID"
firebase functions:config:set twilio.auth_token="YOUR_TWILIO_AUTH_TOKEN"
firebase functions:config:set twilio.phone_number="YOUR_TWILIO_PHONE_NUMBER"

firebase functions:config:set stripe.publishable_key="YOUR_STRIPE_PUBLISHABLE_KEY"
firebase functions:config:set stripe.secret_key="YOUR_STRIPE_SECRET_KEY"

firebase functions:config:set google.maps_api_key="YOUR_GOOGLE_MAPS_API_KEY"

firebase functions:config:set app.domain="bestiesapp.xyz"
firebase functions:config:set app.url="https://bestiesapp.xyz"
firebase functions:config:set app.support_email="support@bestiesapp.xyz"

firebase functions:config:get
```
- [ ] All config variables set
- [ ] Verified with `firebase functions:config:get`

---

## 📱 Twilio (console.twilio.com)

- [ ] Account verified (not trial mode)
- [ ] Phone number purchased and active
- [ ] SMS credits available (check balance)
- [ ] (Optional) WhatsApp enabled

---

## 💳 Stripe (dashboard.stripe.com)

- [ ] Account activated
- [ ] Live mode enabled (not test mode)
- [ ] API keys copied to Firebase config
- [ ] Ready to set up webhook (after first deploy)

---

## 🧪 Test Before Deploy

- [ ] Firestore indexes all showing "Enabled" (not "Building")
- [ ] Security rules published (check timestamp)
- [ ] All APIs enabled in Google Cloud
- [ ] All environment variables set
- [ ] Spending limit configured

---

## 🚀 Ready to Deploy!

Once ALL boxes are checked above:

```bash
cd besties-complete
firebase deploy
```

---

**Estimated time: 15-20 minutes**

**Current step: _____ / 40 total**

**Any issues? Check FIREBASE_SETUP_GUIDE.md for detailed help!**
