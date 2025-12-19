# FINAL COMPREHENSIVE IMPLEMENTATION PLAN

**This is the complete, finalized plan incorporating all decisions. Read this + RELATIONSHIP_FEATURES_PLAN.md + USER_FLOW_GUIDE.md**

**NEW: See USER_FLOW_GUIDE.md for step-by-step user flows showing exactly what users see at each stage.**

---

## 🎯 KEY DECISIONS FINALIZED

### Safety Pact
- **ONE pact per bestie** (not multiple templates)
- **Initiated from Bestie Circle page** only
- **Only appears if you have that bestie** (not visible before)
- **Option disappears after pact is made** with that bestie
- **Use Option 2 wording** (softer tone): "Hey [Name], you mean a lot to me..."

### Messages
- **One message per day** per bestie (rate limit)
- **No blocking feature** (keep it simple)
- **Emojis allowed** in in-app messages (not in SMS)
- **Message retention** follows existing data retention settings in user preferences

### Cancellations
- **Challenges:** Simple "Cancel Challenge" button - sets status to "cancelled", both users notified
- **Safety Pacts:** Simple "End Pact" button - sets status to "inactive", other user notified gently
- **Messages:** Cannot delete sent messages (keeps it simple, prevents abuse)

### Voice Notes
- **SKIP FOR NOW** - Not implementing in this version

### Analytics
- **Use existing Firebase Analytics** + custom interaction tracking already in place
- **Connection scores cached** for quick loading, updated periodically (suggest: daily background job)

---

## 📋 PHASE 1: CORE FEATURES (Build These First)

### 1. "I See You" Messages System

**Implementation Specifics:**

**Rate Limiting:**
- Users can send **ONE message per day** to each bestie
- Track in database: `lastMessageSentAt` timestamp
- Frontend: Disable message button with tooltip: "You can send another message to [Name] tomorrow 💜"
- Reset: Daily at midnight user's local time (or UTC if timezone not set)

**Message Threading:**
- **One message per day = simple list** (no complex threading needed)
- Show last 5 messages on profile/bestie page
- Click "See all messages" to see full history
- Each message is a simple card with:
  - Sender name + avatar
  - Message text (with emoji support)
  - Timestamp ("2 hours ago", "Yesterday", etc.)
  - Read status (✓ or ✓✓)

**Database:**
```
Collection: bestie_messages
Fields:
- senderId (string)
- recipientId (string)
- messageType (string) - "preset" | "custom"
- messageText (string, max 100 chars)
- sentAt (timestamp)
- readAt (timestamp | null)
- contextType (string) - "circle_checkin" | "needs_attention" | "profile" | "spontaneous"
- contextId (string | null) - ID of triggering event
```

**UI Locations:**
1. Bestie profile page - "Send Message" button
2. Activity feed - on posts where bestie shared circle check-in
3. Needs Attention section - as support action option
4. Circle check-ins - quick response button

**Preset Messages:**
- 💜 "Thinking of you - here if you need me"
- ☕ "Let's grab coffee this week"
- 🎧 "Want to vent? I'm listening"
- 📞 "I'll call you today"
- 🤗 "Sending love"
- ✍️ Custom (100 char max)

**Deep Linking:**
Notification tap should open:
- Route: `/besties/messages/{senderId}`
- Scrolls to that specific message
- Marks message as read automatically

---

### 2. Support Actions (Replace "Reach Out")

**Where to Replace:**
- `frontend/src/components/besties/NeedsAttentionSection.jsx` line 128 - "💜 Reach Out" button
- Any other location with "Reach Out" button

**New Implementation:**

Replace button with dropdown menu (4 options):

**Option 1: "Send quick message"**
- Opens "I See You" message drawer
- Pre-selects "Thinking of you" preset
- Fully trackable

**Option 2: "I'm calling them now"**
- Logs to `support_actions` collection:
  - `actionType: "call"`
  - `timestamp: now()`
- Opens phone dialer: `window.location.href = 'tel:${bestie.phone}'`
- NO follow-up (we just count that call was initiated)

**Option 3: "Let's meet up"**
- Simple form with 3 fields:
  - "When?" - Dropdown: This week | Next week | Just checking in
  - "What for?" - Dropdown: Coffee | Meal | Activity | Just talk
  - Optional custom note (50 chars)
- Sends in-app message with meetup proposal
- Logs to `support_actions` collection: `actionType: "meetup_proposed"`
- **DO NOT track if they actually met** - just count the reach out

**Option 4: "I reached out off-app"**
- Quick self-report form:
  - "How?" - Dropdown: Texted | Called | Instagram | Other
  - "How did it go?" - Emoji: 😊 Good | 😐 Okay | 😔 No response
- Logs to `support_actions` collection: `actionType: "off_app_contact"`
- Gives partial credit for external outreach

**Database:**
```
Collection: support_actions
Fields:
- actorId (string) - who took action
- recipientId (string) - who received support
- actionType (string) - "message" | "call" | "meetup_proposed" | "off_app_contact"
- contextType (string) - "needs_attention" | "circle_checkin" | "spontaneous"
- contextId (string | null)
- timestamp (timestamp)
- metadata (object) - varies by actionType
  - For meetup: {when, what, note}
  - For off_app: {method, outcome}
```

**Deep Linking:**
Notification: "[Name] wants to meet up!"
- Route: `/besties/messages/{actorId}`
- Shows the meetup message

---

### 3. Circle Check-Ins (Daily Wellness)

**When It Appears:**
- Optional card at top of activity feed
- Only shows if user hasn't checked in today
- NO push notifications (not forced)
- Dismissible with X button (remembers for that day)

**UI Flow:**
1. Card shows: "How are you feeling today?"
2. Tap card → expands to show 5 emojis:
   - 🌟 Amazing
   - 😊 Good
   - 😐 Okay
   - 😔 Not great
   - 😢 Struggling
3. Tap emoji → optional text box appears: "Want to share more? (50 chars)"
4. Tap "Share with circle" → posts to featured circle only
5. Celebration: "Your circle can see how you're doing 💜"

**Who Sees It:**
- Only users in your **featured circle** (featuredCircle array on user doc)
- Shows in their activity feed
- Includes: emoji, optional note, timestamp, option to send message

**Database:**
```
Collection: circle_checkins
Fields:
- userId (string)
- mood (number) - 1-5 scale (1=struggling, 5=amazing)
- note (string | null, max 50 chars)
- createdAt (timestamp)
- visibleTo (array<string>) - copy of user's featuredCircle at posting time
- responses (array<messageId>) - messages sent in response
```

**Activity Feed Display:**
```
[Avatar] Sarah is feeling 😔 Not great
"Rough week, could use some support"
2 hours ago

[💬 Send Support] button → opens message drawer
```

**Deep Linking:**
Notification: "[Name] shared how they're feeling"
- Route: `/besties/activity`
- Highlights that specific check-in

---

### 4. Stats Section Redesign

**Location:** `frontend/src/components/profile/StatsSection.jsx`

**New Structure:**

```jsx
<StatsSection>
  {/* Section 1: Your Safety Habits */}
  <StatCard emoji="✅" value={completedCheckIns} label="Safe Check-ins" />
  <StatCard emoji="📅" value={daysActive} label="Days Active" />
  <StatCard emoji="🔥" value={loginStreak} label="Day Streak" />
  <StatCard emoji="🌙" value={nighttimeCheckIns} label="Night Check-ins" />
  <StatCard emoji="🎉" value={weekendCheckIns} label="Weekend Check-ins" />

  {/* Section 2: Your Relationships (NEW!) */}
  <h3>💜 Your Relationships</h3>
  <StatCard emoji="💬" value={messagesExchangedThisWeek} label="Messages This Week" />
  <StatCard emoji="🤝" value={supportActionsThisMonth} label="Times You Showed Up" />
  <StatCard emoji="🏆" value={challengesCompleted} label="Challenges Completed" />
  <StatCard emoji="🛡️" value={activePacts} label="Active Safety Pacts" />
  <StatCard emoji="⚡" value={avgResponseTime} label="Avg Alert Response" sublabel="seconds" />

  {/* Strongest Connection Card */}
  <StrongestConnectionCard
    bestie={strongestConnection}
    score={connectionScore}
  />

  {/* Section 3: Your Impact */}
  <StatCard emoji="🛡️" value={emergencyContactCount} label="Times Selected as Emergency Contact" />
  <StatCard emoji="👥" value={bestiesHelpedThisMonth} label="Besties Helped This Month" />

  {/* Section 4: Achievements */}
  <StatCard emoji="🏆" value={badges.length} label="Badges Earned" />
</StatsSection>
```

**New Stats to Calculate:**

**messagesExchangedThisWeek:**
- Count from `bestie_messages` where `sentAt` is in last 7 days
- Include both sent and received

**supportActionsThisMonth:**
- Count from `support_actions` where `timestamp` is in last 30 days
- Only count where `actorId` = current user

**challengesCompleted:**
- Count from `bestie_challenges` where `status = "completed"`
- And either `user1Id` or `user2Id` = current user

**activePacts:**
- Count from `safety_pacts` where `status = "active"`
- And either `user1Id` or `user2Id` = current user

**avgResponseTime:**
- From `alert_responses` where `responderId` = current user
- Average of `responseTime` field (convert milliseconds to seconds)
- Show as "X seconds" or "X minutes" depending on scale

**strongestConnection:**
- From connection strength algorithm (already exists in `connectionStrength.js`)
- Cache this value in `users` collection under `stats.strongestConnection`
- Update daily via Cloud Function
- Structure: `{bestieId, name, score}`

**Connection Score Caching:**
Create Cloud Function (scheduled daily):
```
functions/scheduled/updateConnectionScores.js

For each user:
  - Get all their besties
  - Calculate connection score for each
  - Find highest score
  - Update users/{userId}/stats:
    - strongestConnection: {bestieId, score}
    - connectionScores: {bestieId: score, ...} (for quick lookup)
```

---

## 📋 PHASE 2: ENGAGEMENT FEATURES

### 5. Bestie Challenges

**Challenge Progress Mechanism:**

When a user completes an action (check-in, circle check-in, message, etc.):
1. Query `bestie_challenges` for active challenges involving this user
2. For each active challenge:
   - Check if this action counts toward challenge metric
   - If yes, increment appropriate progress counter
   - Check if target reached
   - If target reached by BOTH users, mark challenge complete

**Example - Challenge: "Both check in 3 times this week"**

When Sarah creates a check-in:
```js
// 1. Find active challenges
const challenges = await getActiveChallenges(sarahId);

// 2. Filter for "check-in" challenges
const checkInChallenges = challenges.filter(c =>
  c.metric === 'safety_checkins' &&
  c.expiresAt > now()
);

// 3. Increment progress
for (const challenge of checkInChallenges) {
  if (challenge.user1Id === sarahId) {
    challenge.user1Progress++;
  } else {
    challenge.user2Progress++;
  }

  // 4. Check completion
  if (challenge.user1Progress >= challenge.target &&
      challenge.user2Progress >= challenge.target) {
    await completeChallenge(challenge.id);
  } else {
    await updateChallenge(challenge.id, {
      user1Progress: challenge.user1Progress,
      user2Progress: challenge.user2Progress
    });
  }
}
```

**Progress Data Structure:**
```
user1Progress: number (0 to target)
user2Progress: number (0 to target)

Example:
{
  target: 3,
  user1Progress: 2, // Sarah has done 2/3
  user2Progress: 3  // Emma has done 3/3
}
```

**Challenge Templates (Pre-Made Only):**
```
Collection: challenge_templates
Documents (created by admin):

1. {
  id: "check_in_3x_week",
  name: "Weekend Safety Warriors",
  description: "Both complete 3 safety check-ins this week",
  metric: "safety_checkins",
  target: 3,
  duration: 7, // days
  points: 50,
  badge: "weekend_warrior"
}

2. {
  id: "circle_checkin_5x",
  name: "Connection Champions",
  description: "Share how you're feeling 5 times this week",
  metric: "circle_checkins",
  target: 5,
  duration: 7,
  points: 50,
  badge: null
}

3. {
  id: "mutual_support_3x",
  name: "Support Squad",
  description: "Send each other support messages 3 times this week",
  metric: "messages_exchanged",
  target: 3,
  duration: 7,
  points: 30,
  badge: null
}
```

**Cancellation Flow:**
- Either user can click "Cancel Challenge"
- Simple confirmation: "Are you sure? [Name] will be notified."
- Set `status: "cancelled"`
- Send notification to other user: "[Name] cancelled your challenge 'Weekend Safety Warriors'"
- No penalty, no negative tracking

**Deep Linking:**
Notification: "Challenge 'Weekend Safety Warriors' completed! 🎉"
- Route: `/challenges/{challengeId}/complete`
- Shows celebration screen with confetti

---

### 6. Safety Pact (The Sacred Promise)

**CRITICAL IMPLEMENTATION DETAILS:**

**Location & Visibility:**
- **ONLY** appears on Bestie Circle page (`/circle` or wherever featured circle is shown)
- **ONLY** if user has at least 1 bestie in their featured circle
- **Option disappears** after pact is created with that specific bestie
- UI: Each bestie card shows either:
  - "Make Our Safety Pact" button (if no pact exists)
  - "Safety Pact Active ✓" badge (if pact exists)

**Pact Text (FINAL - Use This):**

```
Our Safety Pact

Hey [Bestie Name],

You mean a lot to me. And I know I mean a lot to you too.

So let's make a promise to each other:

Whenever either of us is in a situation where we don't feel 100% safe,
we'll use this app.

Not because we're scared, but because we're smart. Not because we have to,
but because we want to come home safe - for ourselves and for each other.

Whether it's a first date, a night out, walking alone, meeting someone new,
or just that weird feeling that something's off - we'll check in.

Because you matter to me. And I matter to you. And we both deserve to
make it home safe.

Let's look out for each other. Deal?
```

**UI Flow:**

1. **Initiation:**
   - User clicks "Make Our Safety Pact" on Emma's circle card
   - Beautiful full-screen modal appears with pact text
   - Replace "[Bestie Name]" with "Emma"
   - Two buttons:
     - "I Promise" (primary, purple gradient)
     - "Not Now" (secondary, gray)

2. **After User 1 Promises:**
   - Status: "Waiting for Emma to promise..."
   - Emma gets notification: "Sarah wants to make a Safety Pact with you 💜"
   - Emma's circle card shows: "Sarah invited you to make a Safety Pact" + view button

3. **Emma Opens Invitation:**
   - Same beautiful modal with pact text
   - Shows: "Sarah has promised. Will you?"
   - Buttons: "I Promise" | "Decline"

4. **When Both Promise:**
   - Both see celebration screen:
     - Visual: Two hearts connecting/joining
     - Text: "You've made your Safety Pact with [Name] 💜"
     - Subtext: "Your promise is active. Look out for each other."
   - Confetti animation
   - Button: "Close"

5. **Living the Pact:**
   - When creating safety check-in, subtle note appears:
     - "✓ Honoring your pact with Emma"
   - When completing check-in safely:
     - "✓ Made it home safe - Emma will be glad"
   - These are SUBTLE (small text, faded color, not prominent)

**Ending a Pact:**
- From pact list page, each pact has "..." menu → "End Pact"
- Confirmation: "Are you sure? This will end your Safety Pact with [Name]."
- Set `status: "inactive"`
- Notification to other user: "Sarah ended your Safety Pact. You can always make a new one if you'd like."
- NO negative language, NO guilt

**Database:**
```
Collection: safety_pacts
Document per pact (one per bestie pair):

{
  user1Id: "abc123",
  user2Id: "def456",
  status: "pending" | "active" | "inactive",
  createdAt: timestamp,
  activatedAt: timestamp | null,
  user1AcceptedAt: timestamp | null,
  user2AcceptedAt: timestamp | null,
  lastHonoredAt: timestamp | null,
  lastHonoredBy: userId | null,
  totalCheckInsUnderPact: 0
}
```

**Check-in → Pact Linkage:**

When user creates safety check-in:
```js
// 1. Query active pacts for this user
const pacts = await getActivePacts(userId);

// 2. Update each pact
for (const pact of pacts) {
  await updateDoc(pact.id, {
    lastHonoredAt: now(),
    lastHonoredBy: userId,
    totalCheckInsUnderPact: increment(1)
  });
}

// 3. Show subtle affirmation in UI
if (pacts.length > 0) {
  const bestieNames = pacts.map(p =>
    p.user1Id === userId ? p.user2Name : p.user1Name
  );

  return `✓ Honoring your pact with ${bestieNames.join(', ')}`;
}
```

**Deep Linking:**
Notification: "[Name] wants to make a Safety Pact with you 💜"
- Route: `/circle/pact/{pactId}`
- Opens pact invitation modal

---

## 🗄️ DATABASE SCHEMA UPDATES

### New Collections:

**1. circle_checkins**
```
{
  userId: string,
  mood: number (1-5),
  note: string | null (max 50),
  createdAt: timestamp,
  visibleTo: array<string>,
  responses: array<messageId>
}
Index: userId, createdAt DESC
```

**2. bestie_messages**
```
{
  senderId: string,
  recipientId: string,
  messageType: "preset" | "custom",
  messageText: string (max 100),
  sentAt: timestamp,
  readAt: timestamp | null,
  contextType: string,
  contextId: string | null
}
Indexes:
- recipientId, sentAt DESC
- senderId, sentAt DESC
- Compound: recipientId, readAt (for unread queries)
```

**3. support_actions**
```
{
  actorId: string,
  recipientId: string,
  actionType: "message" | "call" | "meetup_proposed" | "off_app_contact",
  contextType: string,
  contextId: string | null,
  timestamp: timestamp,
  metadata: object
}
Index: actorId, timestamp DESC
```

**4. bestie_challenges**
```
{
  challengeId: string (template reference),
  user1Id: string,
  user2Id: string,
  status: "invited" | "active" | "completed" | "cancelled" | "expired",
  startedAt: timestamp | null,
  expiresAt: timestamp | null,
  user1Progress: number,
  user2Progress: number,
  completedAt: timestamp | null,
  target: number (copied from template for convenience)
}
Indexes:
- user1Id, status
- user2Id, status
- Compound: status, expiresAt (for cleanup jobs)
```

**5. challenge_templates** (admin-only)
```
{
  id: string,
  name: string,
  description: string,
  metric: "safety_checkins" | "circle_checkins" | "messages_exchanged",
  target: number,
  duration: number (days),
  points: number,
  badge: string | null
}
```

**6. safety_pacts**
```
{
  user1Id: string,
  user2Id: string,
  status: "pending" | "active" | "inactive",
  createdAt: timestamp,
  activatedAt: timestamp | null,
  user1AcceptedAt: timestamp | null,
  user2AcceptedAt: timestamp | null,
  lastHonoredAt: timestamp | null,
  lastHonoredBy: string | null,
  totalCheckInsUnderPact: number
}
Indexes:
- user1Id, status
- user2Id, status
```

### Updates to Existing Collections:

**users collection - Add to `stats` object:**
```
{
  stats: {
    // Existing fields...

    // NEW FIELDS:
    messagesExchangedThisWeek: 0,
    supportActionsThisMonth: 0,
    challengesCompleted: 0,
    activePacts: 0,
    avgResponseTime: 0, // milliseconds
    strongestConnection: {
      bestieId: string,
      bestieName: string,
      score: number
    } | null,
    connectionScores: {
      [bestieId]: score
    }
  }
}
```

**interactions collection - Add new types:**
```
Existing types: 'check_in', 'profile_view', 'alert_response'

NEW types:
- 'circle_checkin_response' (when someone sends message in response)
- 'challenge_progress' (when someone makes progress on challenge)
- 'pact_honored' (when someone creates check-in under active pact)
- 'support_message' (when someone sends I See You message)
```

---

## 🔗 DEEP LINKING SPECIFICATION

**Format:** `besties://[route]?[params]`

**Routes:**

1. **Message received:**
   - Notification: "[Name] sent you a message"
   - Deep link: `besties://messages?senderId={userId}&messageId={id}`
   - Opens: Message thread with that bestie, scrolled to that message
   - Action: Mark message as read

2. **Circle check-in:**
   - Notification: "[Name] is feeling 😔 Not great"
   - Deep link: `besties://activity?checkinId={id}`
   - Opens: Activity feed, highlights that check-in
   - Action: Focus on that check-in card

3. **Challenge invitation:**
   - Notification: "[Name] invited you to a challenge!"
   - Deep link: `besties://challenges/invite?challengeId={id}`
   - Opens: Challenge invitation modal
   - Action: Show accept/decline options

4. **Challenge completed:**
   - Notification: "Challenge completed! 🎉"
   - Deep link: `besties://challenges/complete?challengeId={id}`
   - Opens: Celebration screen
   - Action: Show confetti, points earned

5. **Safety pact invitation:**
   - Notification: "[Name] wants to make a Safety Pact with you 💜"
   - Deep link: `besties://circle/pact?pactId={id}`
   - Opens: Pact invitation modal
   - Action: Show pact text, I Promise button

6. **Support action:**
   - Notification: "[Name] wants to meet up!"
   - Deep link: `besties://messages?senderId={userId}&messageId={id}`
   - Opens: Message thread
   - Action: Show meetup proposal message

**Implementation:**
- Use React Router with query params
- In App.jsx, check for query params on mount
- If params exist, navigate to appropriate route + trigger action
- Clear query params after navigation

---

## 📱 TUTORIAL UPDATES

**Timing Clarification Needed:**
When do these tutorials appear? Please specify:
- During initial onboarding flow? (first-time user setup)
- First visit to that specific page?
- Triggered when feature becomes available?
- Manual trigger from help menu?

**Assuming "first visit to page" pattern:**

### New Tutorial: Circle Check-Ins
**When:** First time user visits activity feed and sees "How are you feeling?" card
**Steps:**
1. Highlight the circle check-in card
   - "This is Circle Check-In - share how you're feeling with your close besties"
2. Tap emoji → show note field
   - "Add an optional note if you want to share more"
3. After posting → show where it appears
   - "Your featured circle can now see how you're doing and send support"

### New Tutorial: Bestie Challenges
**When:** First time user views challenges page
**Steps:**
1. Show challenge library
   - "Pick a challenge to do with a bestie - you'll both work toward the same goal"
2. Highlight "invite" button
   - "Both of you must accept for the challenge to start"
3. Show progress bar
   - "Track your progress together. When you both complete it, you both earn rewards!"

### New Tutorial: Safety Pact
**When:** First time "Make Our Safety Pact" button appears on circle page
**Steps:**
1. Highlight the button
   - "This is special - make a promise to always use the app when you don't feel 100% safe"
2. After reading pact text
   - "This is a commitment between you and [Name] - both must promise for it to activate"
3. After pact activated
   - "Your pact is active. You'll see gentle reminders when you honor it by checking in."

### Enhanced Tutorial: Stats Page
**When:** First time user visits stats/profile after new features launch
**Steps:**
1. Highlight "Your Relationships" section
   - "Track what you build together - messages, support actions, challenges"
2. Highlight "Strongest Connection"
   - "This shows your most active bestie relationship based on how you support each other"

### Enhanced Tutorial: Support Actions
**When:** First time user sees needs attention request
**Steps:**
1. Highlight new "Support" button (replacing old Reach Out)
   - "New! Choose how you want to help - all options are trackable"
2. Show dropdown options
   - "Send in-app message, initiate a call, propose meetup, or log external contact"

---

## ✅ TESTING USER STORIES

### Story 1: Sarah Checks In (Circle Check-In → Message)
1. Sarah opens app, sees "How are you feeling?"
2. Taps 😔 Not great
3. Types "Rough week at work"
4. Taps "Share with circle"
5. Emma (in Sarah's featured circle) sees it in activity feed
6. Emma taps "💬 Send Support"
7. Selects "Want to vent? I'm listening"
8. Sarah gets notification: "Emma sent you a message"
9. Sarah taps notification → opens message thread
10. Sarah sees Emma's message, taps to reply
11. Error: "You already sent Emma a message today. You can send another tomorrow."
12. Both users' stats show: messagesExchangedThisWeek: 1

**Verify:**
- Circle check-in only visible to featured circle ✓
- Message rate limit working ✓
- Deep link opens correct thread ✓
- Stats updated ✓

### Story 2: Challenge Completed
1. Emma invites Sarah to "Weekend Safety Warriors" (3 check-ins each)
2. Sarah gets notification, taps → opens challenge invitation
3. Sarah taps "Accept"
4. Challenge status: active, both progress: 0/3
5. Sarah creates check-in Friday night → progress: 1/3
6. Emma creates check-in Friday night → Emma's progress: 1/3
7. Sarah creates 2 more check-ins → Sarah: 3/3, Emma: 1/3
8. Emma creates 2 more check-ins → Emma: 3/3
9. BOTH users get celebration notification
10. Both tap notification → see celebration screen with confetti
11. Both earn 50 points + weekend_warrior badge
12. Both stats show: challengesCompleted: 1

**Verify:**
- Progress increments automatically when check-ins created ✓
- Completion triggers only when BOTH reach target ✓
- Both users get celebration ✓
- Deep link to celebration works ✓

### Story 3: Safety Pact
1. Sarah goes to Circle page (featured besties visible)
2. Emma's card shows "Make Our Safety Pact" button
3. Sarah taps button → beautiful modal with pact text
4. Sarah taps "I Promise"
5. Pact status: pending, user1AcceptedAt: now
6. Emma's card now shows "Waiting for Emma to promise..."
7. Emma gets notification: "Sarah wants to make a Safety Pact with you 💜"
8. Emma taps notification → opens pact modal
9. Emma reads pact, taps "I Promise"
10. Pact status: active, both accepted timestamps set
11. Both see celebration: two hearts connecting
12. Sarah creates check-in Sunday night
13. Subtle text appears: "✓ Honoring your pact with Emma"
14. Sarah completes check-in: "✓ Made it home safe - Emma will be glad"
15. Pact lastHonoredAt updated, totalCheckInsUnderPact: 1
16. Both stats show: activePacts: 1

**Verify:**
- One pact per bestie pair ✓
- Button disappears after pact created ✓
- Both must accept for activation ✓
- Gentle affirmations (not intrusive) ✓
- No points/gamification ✓

### Story 4: Support Actions
1. Emma posts needs attention: "💭 needs to vent"
2. Sarah sees it in activity feed
3. Sarah taps "💜 Support" button → dropdown appears
4. Option 1: Send quick message (opens message drawer - already tested)
5. Option 2: Sarah taps "I'm calling them now"
6. System logs to support_actions: {actionType: "call", timestamp: now}
7. Phone dialer opens with Emma's number
8. NO follow-up tracking
9. Sarah's stats show: supportActionsThisMonth: 1

**Alternative path:**
3. Sarah taps "Let's meet up"
4. Form appears: When? "This week" | What for? "Coffee" | Note: "downtown?"
5. Sarah submits
6. System logs support_action: {actionType: "meetup_proposed"}
7. Emma receives in-app message: "Sarah wants to meet up for coffee this week - downtown?"
8. Sarah's stats show: supportActionsThisMonth: 1
9. NO tracking of whether they actually met

**Verify:**
- Replaces old "Reach Out" button ✓
- All actions logged to database ✓
- Stats updated ✓
- No complex follow-up tracking ✓

---

## 📊 SUCCESS METRICS

**IMPORTANT:** We are NOT forcing people to send messages or do check-ins. These metrics track natural behavior to see if features are helping.

**Note:** Since we don't have baselines yet, track these and establish what's "normal" over first month. No targets set - just observe and learn.

**Adoption Metrics:**
- % of users who send at least 1 message/week
- % of bestie pairs with active challenge
- % of bestie pairs with safety pact
- % of users posting circle check-ins

**Engagement Metrics:**
- Average messages per user per week
- Average support actions per needs-attention request
- Challenge completion rate (completed / started)
- Average check-ins created by users with active pacts

**Connection Quality:**
- Average connection strength score
- % of besties with "strong" rating or higher (50+)
- Average response time to alerts (improving over time?)

**Retention Indicators:**
- Do users with active pacts have higher 30-day retention?
- Do users who exchange messages stay active longer?
- Do users completing challenges return more frequently?

**Track these in Firebase Analytics + existing custom analytics dashboard**

---

## 🚨 EDGE CASES & ERROR HANDLING

### Messages
- **User removed as bestie mid-conversation:**
  - Old messages remain visible (read-only)
  - Cannot send new messages
  - Show banner: "You are no longer besties with [Name]"

- **Message rate limit hit:**
  - Disable send button
  - Tooltip: "You can send another message to [Name] tomorrow 💜"
  - Show countdown if <6 hours remaining

- **Recipient blocked notifications:**
  - Message still sends and saves to database
  - They won't get push notification but can see in app

### Challenges
- **User removed mid-challenge:**
  - Auto-cancel challenge
  - Set status: "cancelled"
  - Notify other user: "[Name] is no longer your bestie. Challenge cancelled."

- **Challenge expired:**
  - Scheduled job checks daily for expired challenges
  - Set status: "expired"
  - Send consolation message: "Your challenge 'Weekend Safety Warriors' expired. Try again?"

- **User deletes account:**
  - All their challenges auto-cancelled
  - All their pacts set to inactive
  - Messages remain (for other user's records) but anonymized

### Safety Pacts
- **User declines pact:**
  - Set status: "declined"
  - Notify initiator: "[Name] declined your Safety Pact invitation"
  - NO negative language

- **User ends active pact:**
  - Set status: "inactive"
  - Notify other user gently (see earlier section)
  - Can create new pact later

- **User removed as bestie:**
  - Auto-end pact (status: "inactive")
  - No notification (they already know they're not besties)

---

## 🔐 SECURITY & PRIVACY

### Message Safety
- **No blocking feature** (as requested)
- **Rate limiting:** 1 message per day per bestie (prevents spam)
- **Message length:** Max 100 chars (prevents abuse)
- **No message deletion:** Once sent, cannot be unsent (prevents manipulation)
- **Report option:** User can report abusive message to admin (manual review)

### Data Retention
- **Messages:** Follow user's data retention settings (existing setting)
  - If user has "Hold Data" = true: keep forever
  - If user has retention = 24 hours: delete messages after 24 hours
  - Settings location: `users/{userId}/settings/dataRetention`

- **Circle Check-ins:** Same as messages, follow data retention

- **Challenges:** Keep completed challenges for badge/stats integrity

- **Pacts:** Keep inactive pacts for historical record (minimal data)

### Privacy Settings
- **Circle check-ins visible ONLY to featured circle** (not all besties)
- **Messages ONLY between besties** (must be mutual)
- **Challenge invitations ONLY between besties**
- **Pacts ONLY between besties**

---

## 🎯 IMPLEMENTATION PRIORITY (Final)

**Phase 1 (4-6 weeks):**
1. Messages system (2 weeks)
2. Support Actions replacement (1 week)
3. Circle Check-Ins (1 week)
4. Stats Redesign (1 week)
5. Connection score caching (Cloud Function, 3 days)

**Phase 2 (3-4 weeks):**
6. Challenges (2 weeks)
7. Safety Pact (2 weeks)

**Phase 3 (1-2 weeks):**
8. Tutorial updates (1 week)
9. Deep linking implementation (3 days)
10. Testing & bug fixes (1 week)

**Phase 4 (Deferred):**
- Voice notes (NOT implementing for now)

---

## 📝 FINAL NOTES

### What Makes This Different From Original Plan:

1. **Safety Pact:**
   - ONE pact per bestie (not templates)
   - Only from Circle page
   - Option 2 wording (softer tone)
   - Button disappears after pact made

2. **Messages:**
   - One per day rate limit
   - No blocking
   - Emojis allowed
   - Follow data retention settings

3. **Challenges:**
   - Clear progress mechanism defined
   - Simple cancellation

4. **Support Actions:**
   - Meetup just logs proposal (no follow-up)
   - Call just logs initiation (no follow-up)

5. **Voice Notes:**
   - SKIPPED for this version

6. **Analytics:**
   - Use existing Firebase Analytics + custom tracking
   - Connection scores cached daily

7. **Deep Linking:**
   - Fully specified for all notification types

### Tutorial Timing (ANSWERED):

**When tutorials appear:**
- **First time visiting that page/feature** (existing pattern)
  - Example: First time on challenges page → Shows challenge tutorial
  - Example: First time seeing pact button → Could show brief tooltip
- **After completing prerequisite action** (existing pattern)
  - Example: After first check-in → "Want to learn more?" prompt
  - Already working: Check-in tutorial → afterSafe tooltip → Bestie circle tutorial

**When tutorials DON'T appear:**
- Not during initial onboarding (that's separate)
- Not repeatedly after being dismissed
- Not if user has already used the feature

**See USER_FLOW_GUIDE.md for detailed tutorial experiences.**

---

**That's everything! This plan is now comprehensive and ready for Cursor.** 🚀
