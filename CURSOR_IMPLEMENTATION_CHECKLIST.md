# Implementation Checklist for Cursor

**Read the full details in:** `RELATIONSHIP_FEATURES_PLAN.md`

This checklist breaks down exactly what needs to be built in order of priority.

---

## 📋 PHASE 1: Foundation (Build These First)

### 1. "I See You" Messages System

**What to Build:**
- In-app messaging system between besties (1-on-1 only, no groups)
- Quick-send drawer with preset messages + custom option
- Message thread view (simple, last 5 messages visible, click to see more)
- Read receipts (track when message was read)
- Notifications when you receive a message

**Database:**
- Collection: `bestie_messages`
- Fields: `senderId`, `recipientId`, `messageType` (preset/custom), `messageText`, `sentAt`, `readAt`, `repliedAt`, `contextType`, `contextId`

**User Interface:**
- Button to send message (appears on profiles, activity feed, circle check-ins, needs attention)
- Clicks button → drawer pops up with message options
- Select message → sends instantly → recipient gets notification
- Simple thread view to see conversation history

**Stats to Track:**
- Messages sent
- Messages received
- Average response time
- Most supportive bestie (who sends you most messages)

---

### 2. Support Actions (Replace "Reach Out" Button)

**What to Build:**
- Remove the old "Reach Out" button that just opens SMS
- Replace with "Support" button that has dropdown menu with 4 options:
  1. Send quick message (opens "I See You" drawer)
  2. I'm calling them now (logs call initiation, opens dialer)
  3. Let's meet up (simple scheduling prompt)
  4. I reached out off-app (manual log of external contact)

**Database:**
- Collection: `support_actions`
- Fields: `actorId`, `recipientId`, `actionType`, `contextType`, `contextId`, `timestamp`, `outcome`, `meetupDetails`, `meetupCompleted`

**User Interface:**
- Where "Reach Out" button currently exists, replace with "Support" dropdown
- Each option triggers different action + database logging
- For meetup option: simple form asking when/what
- For off-app option: simple form asking how they contacted + how it went

**Stats to Track:**
- Times you showed up for besties
- Support actions taken this month
- Average response time to needs attention

---

### 3. Circle Check-Ins (Daily Wellness)

**What to Build:**
- Daily optional prompt: "How are you feeling today?"
- 5 emoji options: 🌟 Amazing, 😊 Good, 😐 Okay, 😔 Not great, 😢 Struggling
- Optional short note (50 character max)
- Only visible to featured circle besties
- Shows in activity feed
- Can send "I See You" message in response

**Database:**
- Collection: `circle_checkins`
- Fields: `userId`, `mood` (1-5), `note`, `createdAt`, `visibleTo` (array of userIds), `responses` (array of message IDs)

**User Interface:**
- Optional prompt on main page (not forced, not nagging)
- Simple one-tap emoji selection + optional note
- In activity feed, show which besties checked in today
- Can tap to send support message

**Stats to Track:**
- Days you've shared how you're feeling
- Besties you've checked in on
- Mutual check-in streaks (days you both checked in)

---

### 4. Stats Section Redesign

**What to Build:**
- Reorganize stats into 4 sections:
  1. Your Safety Habits (individual metrics)
  2. Your Relationships (NEW - relationship metrics)
  3. Your Impact (community metrics)
  4. Achievements (badges)

**New Stats to Display:**
- Section 2 "Your Relationships":
  - Support given this month: X actions
  - Messages exchanged this week: X
  - Challenges completed together: X (will be 0 until challenges built)
  - Active safety pacts: X (will be 0 until pacts built)
  - Average response time to alerts: X minutes
  - Strongest connection: [Bestie name]

**What to Change:**
- Keep all existing individual stats (check-ins, streak, days active, etc.)
- Add new "Your Relationships" section prominently
- Calculate and display "strongest connection" (bestie with highest connection score)
- Show recent activity ("this week", "this month")

---

## 📋 PHASE 2: Engagement Features (Build These Next)

### 5. Bestie Challenges

**What to Build:**
- Library of pre-made challenges (admin-created, not user-created)
- User picks challenge, picks bestie to do it with
- Both must accept for challenge to activate
- Progress tracking for both people
- Celebration when completed
- Both earn same points/badge

**Database:**
- Collection: `challenge_templates`
- Fields: `templateId`, `name`, `description`, `goal`, `metric`, `target`, `duration`, `points`, `badge`
- Collection: `bestie_challenges`
- Fields: `challengeId`, `user1Id`, `user2Id`, `status`, `startedAt`, `expiresAt`, `user1Progress`, `user2Progress`, `completedAt`

**User Interface:**
- Challenge browser page
- Challenge invitation system
- Progress bar showing both people's progress
- Celebration animation when completed

**Example Challenges:**
- "Both check in 3 times this week"
- "Respond to each other's circle check-ins 5 times"
- "Both complete a safety check-in this weekend"

**Stats to Track:**
- Challenges completed together
- Active challenges
- Challenge streak (weeks in a row completing challenges)

---

### 6. Safety Pact (The Sacred Promise)

**What to Build:**
- ONE pact between two besties (not multiple templates - just one meaningful promise)
- Beautiful ceremonial screen with the pact text
- Both must read and accept (button says "I promise" not "Accept")
- Celebration when both accept
- Gentle affirmations when they honor it
- NO gamification (no points, no streaks, no leaderboards)

**The Pact Text:**
Choose one of these (or blend them) - see RELATIONSHIP_FEATURES_PLAN.md for full text:
- Option 1: More formal tone ("I know that I matter to you...")
- Option 2: Softer tone ("Hey [Name], you mean a lot to me...")

Key message: "Whenever I'm in any situation where I don't feel 100% safe, I will use this app - because you need me to come home safe."

**Database:**
- Collection: `safety_pacts`
- Fields: `user1Id`, `user2Id`, `status`, `createdAt`, `activatedAt`, `user1AcceptedAt`, `user2AcceptedAt`, `lastHonoredAt`, `lastHonoredBy`, `totalCheckInsUnderPact`

**User Interface:**
- Option to create pact from bestie profile
- Beautiful full-screen pact text
- "I promise" button to accept
- Celebration when both accept (two hearts connecting visual)
- Pact list showing active pacts
- Gentle affirmations (not nagging):
  - When creating check-in: "✓ Honoring your pact with [Name]"
  - When completing: "✓ Made it home safe - [Name] will be glad"

**Stats to Track:**
- Safety Pacts: X active
- Pact with [Name]: Active since [date]
- Times you've honored your pacts this month: X check-ins
- NO completion rates, NO streaks (this isn't a game)

**Important:**
- No shame/guilt if they don't use app
- No notifications saying "you broke the pact"
- Very gentle prompt after weeks of inactivity (see plan for wording)
- The power is in the promise itself, not tracking compliance

---

## 📋 PHASE 3: Nice-to-Have (Build If Time/Not Too Complex)

### 7. Voice Notes

**What to Build:**
- Record audio messages (max 60 seconds)
- Send to besties in message thread
- Play audio in-app
- Auto-delete after 30 days (privacy + storage)

**Technical Requirements:**
- Web Audio API for recording
- Firebase Storage for audio files
- HTML5 audio player for playback

**Database:**
- Same collection as messages: `bestie_messages`
- Additional fields: `messageType` includes "voice", `audioUrl`, `duration`, `transcription` (optional future feature)

**Decision Point:**
If this is too complex or expensive (storage costs), skip it for V1. Voice notes are nice-to-have, not essential. The text messages are enough.

---

## 📋 PHASE 4: Tutorial Updates

### What to Update:

**New Tutorial Steps:**
1. Step 4 (NEW): Circle Check-Ins
   - "Share how you're feeling with your circle"
   - Shows the emoji options
   - Explains it's optional

2. Step 5 (NEW): Building Strong Connections
   - Shows sample challenge
   - Shows sample safety pact
   - Shows "I See You" messages

3. Step 6 (Enhanced): Your Stats
   - Show relationship metrics
   - "Track what you build together"

4. Step 7 (Enhanced): When Someone Needs You
   - Show support actions
   - "How to show up for besties"

**Tooltips to Add:**
See RELATIONSHIP_FEATURES_PLAN.md section "Tutorial Tooltips to Add"

---

## 🗄️ DATABASE SCHEMA SUMMARY

### New Collections:

1. **`circle_checkins`** - Emotional wellness check-ins
2. **`bestie_messages`** - In-app support messages
3. **`support_actions`** - All support actions logged
4. **`bestie_challenges`** - Active challenges between users
5. **`challenge_templates`** - Pre-made challenges (admin creates)
6. **`safety_pacts`** - Mutual safety promises

### Updates to Existing Collections:

**`users` collection:**
Add these fields to `stats` object:
- `messagesExchanged` - total count
- `supportActionsGiven` - total count
- `challengesCompleted` - total count
- `activePacts` - current count
- `averageResponseTime` - calculated field

**`interactions` collection:**
Add these interaction types:
- `circle_checkin_response`
- `challenge_progress`
- `pact_completion`
- `support_message`
- `voice_note`

---

## ✅ TESTING CHECKLIST

Test these user stories to make sure everything works:

### Story 1: Sarah Checks In
1. Sarah posts circle check-in: "😔 Not great - rough week"
2. Emma sees it in activity feed
3. Emma clicks support → sends "I See You" message
4. Sarah gets notification, reads it, replies
5. Both see this in stats as messages exchanged
6. Emma's stats show "Support given this week: 1"

### Story 2: Challenge Completed
1. Emma invites Sarah to challenge: "Both check in 3 times this week"
2. Sarah accepts
3. Both do their check-ins throughout the week
4. Friday: challenge completes, both get celebration
5. Both earn points
6. Stats show "Challenges completed: 1"

### Story 3: Safety Pact
1. Sarah and Emma create pact
2. Both read the pact text
3. Both click "I promise"
4. Celebration moment
5. Sarah goes on date, creates check-in
6. Subtle note: "Honoring your pact with Emma"
7. Emma can see pact is active

### Story 4: Needs Attention Response
1. Emma posts needs attention: "💭 needs to vent"
2. Sarah sees it in activity feed
3. Sarah clicks support → "I'm calling them now"
4. System logs call initiation
5. Opens phone dialer
6. Optional prompt after: "How did it go?"
7. Stats show "Times you showed up: 1"

---

## 🎯 SUCCESS METRICS

Track these to know if features are working:

**Adoption:**
- % of users sending at least 1 message per week
- % of bestie pairs with active challenge
- % of bestie pairs with safety pact
- % of users doing circle check-ins

**Engagement:**
- Average messages per user per week
- Average support actions per needs-attention request
- Challenge completion rate
- Pact honor rate (check-ins created by users with active pacts)

**Connection Quality:**
- Average connection strength score increasing
- % of besties with "strong" or higher connection
- Response time to alerts improving

**Retention:**
- Do users with challenges/pacts stay active longer?
- Do users who exchange messages have better retention?

---

## 📝 IMPLEMENTATION NOTES

### Keep It Simple:
- No complex chat system
- No real-time messaging (async is fine)
- No video/audio calls
- No group messages (just 1:1)

### Mobile-First:
- All features work on phone
- Thumb-friendly buttons
- Quick actions, not buried in menus

### Privacy:
- Circle check-ins only visible to featured circle
- Messages only between besties
- Users control what they share

### Performance:
- Don't load all message history (just recent)
- Lazy load voice notes
- Cache connection scores

### Notifications:
- Push when you receive message
- Push when challenge completed
- Push when pact partner invites you
- NOT spammy - users control settings

---

## 🚀 PRIORITY ORDER (TL;DR)

**Do in this order:**

1. **Messages** ("I See You" system) - Replaces broken "reach out"
2. **Support Actions** - Makes support trackable
3. **Circle Check-Ins** - Creates connection opportunities
4. **Stats Redesign** - Shows new relationship data
5. **Challenges** - Gamification
6. **Safety Pact** - Deep commitment
7. **Voice Notes** - Only if not too complex
8. **Tutorial** - After features work

---

## ❓ QUESTIONS?

If anything is unclear, refer to `RELATIONSHIP_FEATURES_PLAN.md` for full detailed explanations of:
- User experience flows
- Data structures
- Philosophy behind each feature
- Exact wording for pact text
- Tutorial content

---

**Good luck! This is going to make Besties so much better. 💜**
