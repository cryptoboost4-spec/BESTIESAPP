# 📬 Complete Notification List

This document lists all notifications sent by the Besties app, when they're triggered, and what they do.

---

## 🆘 Emergency Notifications

### 1. Emergency SOS Alert
- **Type:** `emergency_sos`
- **When:** User clicks SOS button and completes 5-second countdown
- **Sent To:** 
  - All besties in user's circle (isFavorite=true) with notifications enabled
  - All active Facebook Messenger contacts
- **Channels:** Push, SMS, WhatsApp, Email, In-app
- **Message:** "🆘 EMERGENCY: [Name] needs help NOW! Location: [location]"
- **Action:** Navigates to homepage to view active check-ins

### 2. Duress Code Alert
- **Type:** `critical_alert` (internal: `_internal_duress`)
- **When:** User enters duress code to cancel a check-in
- **Sent To:** All circle besties (isFavorite=true)
- **Channels:** Push, SMS, WhatsApp, Email, In-app
- **Message:** "🚨🚨 DURESS CODE ALERT - [Name] is in DANGER and was FORCED to cancel"
- **Action:** Navigates to homepage

---

## ✅ Check-in Notifications

### 3. Check-in Created
- **Type:** `checkInCreated`
- **When:** User creates a new check-in
- **Sent To:** Selected besties (bestieIds array) + selected messenger contacts
- **Channels:** Push, Telegram, Messenger, In-app
- **Message:** "👀 [Name] just started a check-in - they're at [location] for the next [duration] mins"
- **Action:** Navigates to homepage

### 4. Check-in Extended
- **Type:** `checkInExtended`
- **When:** User extends an active check-in
- **Sent To:** Selected besties + selected messenger contacts
- **Channels:** Push, Telegram, Messenger, In-app
- **Message:** "⏰ [Name] extended their check-in by [minutes] minutes"
- **Action:** Navigates to homepage

### 5. Check-in Completed
- **Type:** `checkInCompleted`
- **When:** User marks check-in as "I'm Safe"
- **Sent To:** Selected besties
- **Channels:** Push, Telegram, In-app
- **Message:** "✅ [Name] checked in safely!"
- **Action:** Navigates to homepage

### 6. Check-in Alert (Missed)
- **Type:** `check_in_alert`
- **When:** Check-in expires without being completed
- **Sent To:** Selected besties (cascading - one at a time)
- **Channels:** Push, SMS, WhatsApp, Email, Telegram, Messenger
- **Message:** "🚨 [Name] hasn't checked in yet. They might need help."
- **Action:** Navigates to homepage

### 7. Check-in Reminder (5 minutes before)
- **Type:** `checkin_reminder`
- **When:** 5 minutes before check-in expires
- **Sent To:** Check-in owner
- **Channels:** Push, In-app
- **Message:** "⏰ Your check-in expires in 5 minutes"
- **Action:** Navigates to homepage

### 8. Check-in Urgent Reminder (1 minute before)
- **Type:** `checkin_urgent`
- **When:** 1 minute before check-in expires
- **Sent To:** Check-in owner
- **Channels:** Push, In-app
- **Message:** "🚨 URGENT: Your check-in expires in 1 minute!"
- **Action:** Navigates to homepage

---

## 💜 Bestie Notifications

### 9. Bestie Request Received
- **Type:** `bestie_request`
- **When:** Someone sends you a bestie request
- **Sent To:** Request recipient
- **Channels:** Push, In-app
- **Message:** "💜 [Name] wants to be your bestie!"
- **Action:** Navigates to /besties page

### 10. Bestie Request Accepted
- **Type:** `bestie_accepted`
- **When:** Someone accepts your bestie request
- **Sent To:** Request sender
- **Channels:** Push, In-app
- **Message:** "🎉 [Name] accepted your bestie request!"
- **Action:** Navigates to /besties page

---

## 🏆 Achievement Notifications

### 11. Badge Earned
- **Type:** `badge_earned`
- **When:** User earns a new badge
- **Sent To:** Badge owner
- **Channels:** Push, In-app
- **Message:** "🏆 Badge Earned! You earned the [Badge Name] badge! [icon]"
- **Action:** Navigates to /profile page, scrolls to badges section

---

## 💬 Social Notifications

### 12. Post Comment
- **Type:** `post_comment`
- **When:** Someone comments on your post
- **Sent To:** Post owner
- **Channels:** Push, In-app
- **Message:** "💬 [Name] commented on your post"
- **Action:** Navigates to /besties page, opens comment modal

### 13. Check-in Reaction
- **Type:** `checkin_reaction`
- **When:** Someone reacts to your check-in
- **Sent To:** Check-in owner
- **Channels:** Push, In-app
- **Message:** "💜 [Name] reacted to your check-in"
- **Action:** Navigates to /besties page

### 14. Attention Response
- **Type:** `attention_response`
- **When:** Someone clicks "Reach Out" on your "needs attention" request
- **Sent To:** User who requested attention
- **Channels:** In-app
- **Message:** "💜 [Name] saw you needed support and is reaching out!"
- **Action:** Navigates to /besties page

---

## 📊 Notification Channels Priority

1. **Push Notifications** - Always tried first (fast, free)
2. **Telegram** - If enabled and connected
3. **Facebook Messenger** - If active contact
4. **WhatsApp** - If phone number available (free)
5. **SMS** - If subscribed (paid)
6. **Email** - If enabled
7. **In-app** - Always created (regardless of other settings)

---

## 🔔 Notification Settings

Users can control notifications in Settings → Notifications:
- Push notifications (browser permission)
- Telegram (requires connection)
- Facebook Messenger (auto-connects via link)
- SMS (requires subscription)

**Note:** Emergency alerts (SOS, duress) are sent via ALL available channels regardless of settings.

