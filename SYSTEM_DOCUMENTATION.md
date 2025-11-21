# Besties App - System Documentation

## 🚨 HOW THE ALERT SYSTEM WORKS

### Alert Trigger Flow:

1. **User Creates Check-In**
   - Selects besties to notify
   - Sets duration (e.g., 30 minutes)
   - Adds optional details (location, notes, photos)
   - Check-in saved with status: "active"
   - `alertTime` calculated: `createdAt + duration`

2. **Backend Cloud Function Monitors**
   - Firebase Cloud Function runs every minute
   - Checks all active check-ins where `alertTime < now`
   - For each expired check-in:
     - Checks if user marked themselves safe
     - If NO safety confirmation → **ALERT TRIGGERED**

3. **When Alert Triggers**:
   ```javascript
   // Backend sets status to "alerted"
   checkin.status = "alerted"

   // Sends to ALL selected besties:
   for (bestie of selectedBesties) {
     // SMS via Twilio
     sendSMS(bestie.phone, {
       message: `🚨 ${userName} hasn't checked in!`,
       activity: checkIn.activity.name,
       location: checkIn.location.address,
       duration: checkIn.duration,
       link: `besties.app/alert/${checkInId}`
     })

     // In-app notification
     createNotification(bestie.id, {
       type: 'check_in_alert',
       checkInId: checkIn.id,
       userName: userName
     })
   }
   ```

4. **What Besties See**:
   - **SMS**: Direct text with all check-in details
   - **In-App**:
     - Red banner in NotificationBell
     - "NEEDS ATTENTION" section on Besties page
     - Pulsing alert card showing:
       - ⚠️ Bestie's name
       - 📍 Location/address
       - 🕐 Activity type & duration
       - 📝 Any notes left
       - 📷 Photos if uploaded
       - **"Call Now" button** (tel: link)

### Data Shared During Alert:

✅ **Shared with Besties**:
- User's display name
- Activity name & emoji
- Full location address (if provided)
- Duration of check-in
- Notes/special instructions
- Uploaded photos
- Time check-in was created
- Time alert was triggered

❌ **NOT Shared**:
- Real-time GPS tracking
- Continuous location updates
- Phone number (unless manually added to notes)
- Personal messages to other besties

### Current Limitations:

1. **No Optional Sharing**: All check-ins automatically visible to circle besties
2. **No Post Creation**: Activity feed is auto-populated, can't create custom posts
3. **No Share Control**: Can't choose which check-ins appear on feed

---

## 📱 ACTIVITY FEED - CURRENT BEHAVIOR

### What Shows Automatically:

The Besties page activity feed displays:
- Last 48 hours of check-ins from all besties
- Badge achievements
- Missed check-ins (alerts)
- Request attention posts

```javascript
// Current auto-sharing logic (BestiesPage.jsx:130-143)
const twoDaysAgo = new Date();
twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);

for (const bestieId of bestieIds) {
  const checkInsQuery = query(
    collection(db, 'checkins'),
    where('userId', '==', bestieId),
    where('createdAt', '>=', twoDaysAgo), // Last 48 hours
    orderBy('createdAt', 'desc'),
    limit(10)
  );
  // Automatically shown - no opt-in required
}
```

### Missing Features:

1. **No "Share to Feed" Button**: All check-ins auto-share
2. **No Custom Posts**: Can't write status updates
3. **No Privacy Control**: Can't hide specific check-ins

---

## 🎯 REQUESTED IMPROVEMENTS

### 1. Add "Share Check-In" Option
**Current**: Auto-shares all check-ins
**Requested**: Let users choose which check-ins to share publicly

### 2. Add "Create Post" Feature
**Current**: Only system-generated content (check-ins, badges)
**Requested**: Status updates, thoughts, general posts

### 3. Improve Champions Section
**Current**: Simple cards with placeholders
**Requested**: Super girly, sparkly, animated

### 4. Improve All Besties Display
**Current**: Basic grid with BestieCard
**Requested**: Hover menu with actions (view profile, add to circle, remove)

### 5. Enhance Profile View Page
**Current**: Basic stats and badges
**Requested**: More interactive, fun, personalized

---

## 🔐 PRIVACY SETTINGS

### Current Privacy Controls (per user):

```javascript
privacySettings: {
  showStatsToBesties: true/false,      // Show check-in stats
  showCheckInsToBesties: true/false,   // Show recent check-ins
  profileVisibility: 'besties' | 'private'
}
```

### Recommendations:

Add more granular controls:
```javascript
privacySettings: {
  showStatsToBesties: boolean,
  showCheckInsToBesties: boolean,
  autoShareCheckIns: boolean,          // NEW: Auto-share to feed
  allowCommentsOnCheckIns: boolean,    // NEW: Let besties comment
  showLocationInFeed: boolean,         // NEW: Hide location from public feed
  profileVisibility: 'besties' | 'private'
}
```

---

## 📊 DATA STRUCTURE

### Check-In Document:
```javascript
{
  id: "checkin123",
  userId: "user456",
  status: "active" | "completed" | "alerted",
  activity: {
    name: "Walking home",
    emoji: "🚶‍♀️"
  },
  location: {
    address: "123 Main St",
    coords: { lat: 40.7, lng: -74.0 }
  },
  duration: 30,
  alertTime: Timestamp,
  createdAt: Timestamp,
  bestieIds: ["bestie1", "bestie2"],
  notes: "Taking the long route",
  photoURLs: ["url1", "url2"],
  sharedToFeed: true/false,    // NEW: For selective sharing
  reactions: {                  // Subcollection
    reaction1: { userId, emoji, timestamp }
  },
  comments: {                   // Subcollection
    comment1: { userId, text, timestamp }
  }
}
```

---

## 🎨 UI/UX IMPROVEMENTS NEEDED

1. **Activity Feed**:
   - Add "+ Create Post" button at top
   - Add "Share" toggle when creating check-in
   - Filter: "My Check-ins" | "All Activity" | "Alerts Only"

2. **Champions Section**:
   - Sparkly gradient backgrounds
   - Animated crown icons
   - Confetti on hover
   - Actual bestie data (not placeholders)

3. **All Besties Display**:
   - Hover cards with quick actions
   - Visual indicators (online, recently active)
   - Quick "Add to Circle" heart button

4. **Profile Page**:
   - Friendship timeline
   - Shared memories counter
   - Personalized stats
   - Fun achievements
   - "Send Support" quick button

