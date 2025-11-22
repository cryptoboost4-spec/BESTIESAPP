# Testing Checklist - BESTIESAPP

## Pre-Testing Setup

- [ ] Run cleanup script: `node scripts/cleanup-firestore.js`
- [ ] Deploy Firestore rules: `firebase deploy --only firestore:rules`
- [ ] Clear browser cache and local storage
- [ ] Test with 2-3 different user accounts

---

## 🔐 Authentication & Onboarding

### Account Creation
- [ ] Sign up with Google account
- [ ] Sign up with email/password
- [ ] Verify onboarding flow appears for new users
- [ ] Complete onboarding steps
- [ ] Verify user document is created in Firestore

### Phone Authentication (NEW FIX)
- [ ] Go to Settings > Edit Profile
- [ ] Add phone number (first time)
- [ ] Receive SMS verification code
- [ ] Enter verification code
- [ ] **Verify no permission errors after verification**
- [ ] Check profile shows phone number
- [ ] Try to change phone number to different number
- [ ] Verify SMS sent to new number
- [ ] Complete verification
- [ ] **Verify no permission errors**

### Sign In/Out
- [ ] Sign out
- [ ] Sign in with Google
- [ ] Sign in with email/password
- [ ] Verify data persists after sign out/in

---

## 👥 Bestie Management

### Adding Besties
- [ ] Send bestie request via phone number
- [ ] Send bestie request via email
- [ ] Generate and copy invite link
- [ ] Open invite link in incognito/different browser
- [ ] Accept invite as new user
- [ ] Verify both users see each other as besties
- [ ] Check bestie celebration modal appears

### Bestie Circle
- [ ] Add besties to featured circle (up to 5)
- [ ] Remove besties from circle
- [ ] Verify circle shows on profile
- [ ] Verify circle members see each other's check-ins

### Bestie Requests
- [ ] View pending requests
- [ ] Accept bestie request
- [ ] Decline bestie request
- [ ] Cancel sent request
- [ ] Delete bestie connection

---

## 🚨 Check-ins & Safety

### Creating Check-ins
- [ ] Create check-in with 15 min duration
- [ ] Create check-in with 180 min duration
- [ ] Select 1-5 besties for check-in
- [ ] Choose privacy level: "All Besties"
- [ ] Choose privacy level: "Circle Only"
- [ ] Choose privacy level: "Alerts Only"
- [ ] Add location to check-in
- [ ] Save check-in template

### Check-in Privacy
- [ ] Create "Circle Only" check-in
- [ ] Verify only circle members can see it
- [ ] Create "Alerts Only" check-in
- [ ] Verify check-in is hidden until alert triggers
- [ ] Create "All Besties" check-in
- [ ] Verify all besties can see it

### Check-in Monitoring
- [ ] Wait for check-in timer to complete
- [ ] Mark check-in as "I'm Safe" before timer expires
- [ ] Let check-in timer expire without response
- [ ] Verify alert is sent to selected besties
- [ ] Mark expired check-in as "False Alarm"
- [ ] Verify false alarm notification sent

### Emergency Features
- [ ] Trigger Emergency SOS
- [ ] Verify all besties are notified
- [ ] Respond to someone's alert
- [ ] View active check-ins on home page
- [ ] View check-in history

---

## 📱 Profile & Customization

### Profile Setup
- [ ] Upload profile picture
- [ ] Add display name
- [ ] Write bio (max 150 chars)
- [ ] Add birthday
- [ ] Add phone number
- [ ] Verify profile completion percentage updates

### Profile Customization
- [ ] Earn a badge
- [ ] Set featured badges (up to 3)
- [ ] Customize bestie circle
- [ ] View profile stats

### Profile Completion
- [ ] Complete all "Easy Tasks" (5 tasks)
- [ ] Complete all "Harder Tasks" (9 tasks)
- [ ] Verify profile completion badge awarded
- [ ] View celebration modal

---

## 🏆 Badges & Achievements

### Badge Types to Test
- [ ] Profile Complete badge (complete all profile tasks)
- [ ] First Check-in badge
- [ ] First Bestie badge
- [ ] Circle Complete badge (5 besties in circle)
- [ ] Safety Champion badge (5+ completed check-ins)
- [ ] Night Owl badge (check-in 9pm-6am)
- [ ] Weekend Warrior badge (weekend check-ins)
- [ ] Login Streak badges (3, 7, 30, 100 days)
- [ ] Check confetti animation appears

---

## 📊 Posts & Social

### Creating Posts
- [ ] Create text post
- [ ] Create post with image
- [ ] Create post with multiple images
- [ ] Tag besties in post
- [ ] Set post privacy

### Interacting with Posts
- [ ] React to post with emoji
- [ ] Comment on post
- [ ] View post reactions
- [ ] View post comments
- [ ] Delete own post
- [ ] Delete own comment

---

## ⚙️ Settings

### Notification Settings
- [ ] Enable/disable email notifications
- [ ] Enable/disable push notifications
- [ ] Enable/disable WhatsApp notifications
- [ ] Test notification for check-in alert
- [ ] Test notification for bestie request

### Privacy Settings
- [ ] Change default check-in privacy
- [ ] Hide/show profile from non-besties
- [ ] Review privacy options

### Security Settings
- [ ] Set safety passcode
- [ ] Change safety passcode
- [ ] Remove safety passcode
- [ ] Mark "Reviewed Passcode Settings" complete

### Account Settings
- [ ] Change email (via Google auth)
- [ ] Update profile information
- [ ] View member since date
- [ ] Sign out

---

## 🔍 Firestore Rules Testing

### User Documents
- [ ] User can read their own document
- [ ] User cannot read non-bestie documents
- [ ] User can read bestie documents
- [ ] User can update their own document
- [ ] User cannot update other user documents

### Check-ins
- [ ] Owner can read their check-in
- [ ] Bestie can read check-in based on privacy
- [ ] Non-bestie cannot read private check-in
- [ ] User can create check-in
- [ ] User can update own check-in
- [ ] Selected bestie can mark as false alarm

### Besties Collection
- [ ] User can read besties where they are requester
- [ ] User can read besties where they are recipient
- [ ] User can create bestie request
- [ ] User can accept bestie request
- [ ] User can delete bestie connection

---

## 🐛 Bug Testing

### Permission Errors (MAIN FIX)
- [ ] Phone verification doesn't cause permission errors
- [ ] Can save profile after phone verification
- [ ] Can access Firestore after phone auth
- [ ] AuthContext listener works after phone link

### Edge Cases
- [ ] Try to add same phone to 2 accounts (should fail gracefully)
- [ ] Try to send bestie request to yourself (should block)
- [ ] Try to create check-in with 0 besties (should block)
- [ ] Try to create check-in with >5 besties (should block)
- [ ] Try to upload >5MB profile picture (should block)

### UI/UX
- [ ] App works on mobile viewport
- [ ] App works on tablet viewport
- [ ] App works on desktop viewport
- [ ] Dark mode works properly
- [ ] Loading states show properly
- [ ] Error messages are clear

---

## 📊 Data Integrity

### After Running Cleanup Script
- [ ] All collections are empty
- [ ] Can create new user account
- [ ] User document created properly
- [ ] Can create new check-in
- [ ] Can add new bestie
- [ ] All features work from scratch

---

## Performance

- [ ] Home page loads quickly
- [ ] Check-ins list loads quickly
- [ ] Profile page loads quickly
- [ ] Image uploads complete successfully
- [ ] Real-time updates work (check-ins, notifications)

---

## 🎯 Critical Path (Must Work)

1. **New User Flow**
   - [ ] Sign up → Onboarding → Add Bestie → Create Check-in → Complete Check-in

2. **Phone Authentication Flow** (NEW)
   - [ ] Settings → Edit Profile → Add Phone → Verify → Save → No Errors

3. **Emergency Flow**
   - [ ] Create Check-in → Timer Expires → Alert Sent → Bestie Responds

4. **Social Flow**
   - [ ] Invite Link → New User Signs Up → Auto-connected as Besties → Celebration

---

## Notes

- Test with multiple accounts to verify permissions work correctly
- Check browser console for any errors during testing
- Verify Firebase costs stay reasonable during testing
- Check that Cloud Functions are triggered properly
- Monitor Firestore usage during heavy testing

---

**Last Updated:** 2025-11-22
