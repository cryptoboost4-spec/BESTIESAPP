# Relationship-Based Features Implementation Plan

**Purpose:** Transform Besties from tracking individual safety behaviors to rewarding relationship behaviors between besties. We want to measure and celebrate what people do TOGETHER, not just what they do alone.

**Problem We're Solving:** Currently we track things like "you sent a message" but we have no idea if they actually messaged or what happened. We need trackable, meaningful interactions that happen IN the app.

---

## 🎯 Core Philosophy

**OLD WAY (Individual Focus):**
- My check-ins
- My streak
- My badges
- Click button → open SMS app → ??? (we have no idea what happens)

**NEW WAY (Relationship Focus):**
- What we do together
- How we support each other
- How quickly we show up for each other
- Trackable actions that happen in-app

---

## ✨ Features to Implement

### 1. CIRCLE CHECK-INS (Daily Wellness)

**What It Is:**
A simple "how are you today?" system between besties. This is NOT location-based safety check-ins (those still exist separately). This is emotional wellness checking in on each other.

**How It Works - User Experience:**

1. **Daily Prompt (Optional, Not Forced):**
   - User opens app, sees optional prompt: "How are you feeling today?"
   - Choose from 5 options:
     - 🌟 Amazing
     - 😊 Good
     - 😐 Okay
     - 😔 Not great
     - 😢 Struggling
   - Can add optional short note (50 characters max)
   - This gets shared with their featured circle besties only

2. **Seeing Bestie's Check-Ins:**
   - On main page, see which besties have checked in today
   - See their mood emoji and optional note
   - Can send a quick "I See You" response (see feature #4)

3. **No Pressure:**
   - This is completely optional
   - No notifications nagging people to check in
   - It's there if they want to use it
   - Builds organic connection when people choose to share

**What Data to Track:**
- Database collection: `circle_checkins`
- Fields needed:
  - `userId` - who posted it
  - `mood` - which emoji (1-5 scale)
  - `note` - optional text (max 50 chars)
  - `createdAt` - timestamp
  - `visibleTo` - array of userIds (their featured circle at time of posting)
  - `responses` - array of response objects (see feature #4)

**Stats This Creates:**
- "Days you've shared how you're feeling: X"
- "Besties you've checked in on: X"
- "Days you and [bestie name] both checked in: X" (mutual check-in streak)

---

### 2. BESTIE CHALLENGES (Simple Version)

**What It Is:**
Simple, achievable challenges that two besties can complete together. NOT complicated. Each challenge is a single, clear goal.

**How It Works - User Experience:**

1. **Challenge Library (Pre-Made Only):**
   - Users browse a list of simple challenges
   - Examples:
     - "Both check in on the app 3 days this week"
     - "Respond to each other's circle check-ins 5 times"
     - "Both complete a safety check-in this weekend"
     - "Send each other 3 'I See You' messages this week"
   - Each challenge shows:
     - Clear goal
     - How long you have (usually 1 week)
     - What you both get (points/badge/celebration)

2. **Starting a Challenge:**
   - User picks a challenge
   - Picks which bestie to do it with
   - App sends invitation to that bestie
   - Both must accept for challenge to start
   - Only BOTH accepting makes it active (both need to do it to get points)

3. **During Challenge:**
   - Progress bar shows how you're both doing
   - "You: 2/3 check-ins, Sarah: 3/3 check-ins"
   - Each person's progress counts toward shared goal

4. **Completing Challenge:**
   - When goal reached, both get celebration
   - Both earn the same points
   - Both get a shared badge/achievement
   - Unlocks next tier of challenges

**What Data to Track:**
- Database collection: `bestie_challenges`
- Fields needed:
  - `challengeId` - which challenge template
  - `user1Id` - first person
  - `user2Id` - second person
  - `status` - "invited", "active", "completed", "expired"
  - `startedAt` - when both accepted
  - `expiresAt` - deadline
  - `user1Progress` - their individual progress
  - `user2Progress` - their individual progress
  - `completedAt` - when finished (or null)

- Database collection: `challenge_templates` (admin-created, not user-created)
- Fields needed:
  - `templateId` - unique ID
  - `name` - "Weekend Safety Streak"
  - `description` - clear explanation
  - `goal` - what needs to happen
  - `metric` - what to count (circle_checkins, safety_checkins, messages, etc.)
  - `target` - how many needed
  - `duration` - how many days (usually 7)
  - `points` - how many points both get
  - `badge` - optional badge ID both earn

**Stats This Creates:**
- "Challenges completed together: X"
- "Current active challenges: X"
- "Challenge streak with [bestie]: X weeks in a row"

---

### 3. "I SEE YOU" MESSAGES (In-App Support)

**What It Is:**
Quick, meaningful messages you can send to besties INSIDE the app. These are trackable, visible, and build connection. Replaces the old "Reach Out" button that just opened SMS.

**How It Works - User Experience:**

1. **When You Can Send:**
   - When a bestie posts a circle check-in (especially if struggling)
   - When someone needs attention
   - Anytime from their profile
   - From the activity feed

2. **Message Options:**
   - Quick-send drawer pops up with options:
     - 💜 "Thinking of you - here if you need me"
     - ☕ "Let's grab coffee this week"
     - 🎧 "Want to vent? I'm listening"
     - 📞 "I'll call you today"
     - 🤗 "Sending love"
     - ✍️ Custom message (100 character limit)

3. **What Happens:**
   - Message sends instantly in-app
   - Recipient gets notification
   - Message appears in their "messages from besties" feed
   - Sender sees it was delivered and when it was read
   - Recipient can reply with another quick message or custom text

4. **Message Thread:**
   - Between any two besties, messages stack in a simple thread
   - Can see last 5 messages exchanged
   - Click to see full conversation history
   - No complex chat system - just supportive check-ins

**What Data to Track:**
- Database collection: `bestie_messages`
- Fields needed:
  - `senderId` - who sent it
  - `recipientId` - who receives it
  - `messageType` - "preset" or "custom"
  - `messageText` - the actual message
  - `sentAt` - timestamp
  - `readAt` - when recipient opened it (null if unread)
  - `repliedAt` - when they replied (null if no reply)
  - `contextType` - what triggered it ("circle_checkin", "needs_attention", "profile", "spontaneous")
  - `contextId` - ID of the thing that triggered it (checkin ID, etc.)

**Stats This Creates:**
- "Support messages sent: X"
- "Support messages received: X"
- "Average response time: X hours"
- "Most supportive bestie: [name]" (who sends you most messages)
- "Bestie you support most: [name]" (who you send most messages to)

---

### 4. VOICE NOTES (Async Voice Messages)

**What It Is:**
Record quick voice messages for besties. More personal than text, works for busy schedules. Think Instagram voice messages but for emotional support.

**How It Works - User Experience:**

1. **Recording:**
   - From a bestie's profile or message thread, tap microphone icon
   - Hold to record (max 60 seconds)
   - Can listen to preview before sending
   - Send or cancel

2. **Receiving:**
   - Notification: "Sarah sent you a voice note 🎤"
   - See audio player in message thread
   - Tap to play
   - Can reply with voice note or text message

3. **Simple, Not Complicated:**
   - No voice channels or live calls
   - Just async audio messages
   - Stores in message thread like text messages
   - Auto-deletes after 30 days (privacy + storage costs)

**Technical Question to Answer:**
Is this hard to set up? Needs:
- Audio recording in browser (Web Audio API - fairly standard)
- File storage (Firebase Storage can handle this)
- Audio playback (HTML5 audio element - simple)

**Decision Point:** If this is too complex for V1, we can skip it. Voice notes are nice-to-have, not essential.

**What Data to Track:**
- Same collection as messages: `bestie_messages`
- Additional fields:
  - `messageType` - now includes "voice"
  - `audioUrl` - link to audio file in storage
  - `duration` - length in seconds
  - `transcription` - optional AI transcription (future feature)

**Stats This Creates:**
- "Voice notes exchanged: X"
- "Hours of support given: X" (total voice note duration)

---

### 5. SAFETY PACTS (Mutual Accountability)

**What It Is:**
A standing agreement between two besties to hold each other accountable for specific safety behaviors. Both must agree to it, both must do it, both get credit.

**How It Works - User Experience:**

1. **Creating a Pact:**
   - Go to a bestie's profile
   - Click "Create Safety Pact"
   - Choose from pact templates:
     - "Text when you get home from dates"
     - "Check in every Friday night"
     - "Use safety check-in for solo runs"
     - "Never walk alone after 10 PM"
     - Custom pact (write your own agreement)
   - Send invitation to bestie
   - Both must accept for pact to activate

2. **Pact Templates Include:**
   - Clear description of the promise
   - How often it applies (every Friday, every date, etc.)
   - What counts as completing it (safety check-in, circle check-in, text message logged)
   - Reminder settings (optional notifications)

3. **Living the Pact:**
   - When someone does the thing, they log it: "Completed pact: got home safe from date ✅"
   - The other bestie sees it in their feed: "Sarah completed your safety pact!"
   - Both people can see pact history
   - If someone breaks the pact, they can acknowledge it: "Forgot to check in last Friday 😅"

4. **Pact Stats:**
   - "Pact streak: 12 weeks" (both kept the pact)
   - "Times you kept your promise: 45/47"
   - "Times they kept their promise: 47/47"
   - Visual reminder of mutual commitment

**What Data to Track:**
- Database collection: `safety_pacts`
- Fields needed:
  - `user1Id`, `user2Id` - both people in the pact
  - `pactType` - which template
  - `customText` - if custom pact, what's the agreement
  - `status` - "pending", "active", "paused", "ended"
  - `createdAt` - when created
  - `activatedAt` - when both accepted
  - `frequency` - "weekly", "every_date", "every_friday", "daily", "custom"
  - `reminderEnabled` - boolean

- Database collection: `pact_completions`
- Fields needed:
  - `pactId` - which pact this is for
  - `userId` - who completed it
  - `completedAt` - timestamp
  - `note` - optional context ("drinks with coworkers, checked in safe")
  - `verified` - did the other person confirm? (optional feature)

**Stats This Creates:**
- "Active safety pacts: X"
- "Pact completion rate: 95%"
- "Longest pact streak: X weeks"
- "Most reliable pact partner: [name]"

---

### 6. SUPPORT ACTIONS (Replacing "Reach Out" Button)

**What It Is:**
Replace the current "Reach Out" button (that just opens SMS and we have no idea what happens) with trackable in-app actions.

**How It Works - User Experience:**

1. **Where It Appears:**
   - Needs Attention section (when bestie requests support)
   - Activity feed (when you see someone struggling)
   - Circle check-ins (when someone posts they're having a rough day)

2. **Current Bad UX:**
   ```
   [💜 Reach Out] → Opens phone's SMS app → ??? we have no idea if they messaged
   ```

3. **New Better UX:**
   ```
   [💜 Support] button with dropdown menu:

   - 💬 "Send quick message" (opens "I See You" message drawer - trackable)
   - 📞 "I'm calling them now" (logs that you initiated a call, opens phone dialer)
   - 📅 "Let's meet up" (opens simple scheduling prompt - trackable)
   - ✅ "I reached out off-app" (manual log: "I texted/called them, here's how it went")
   ```

4. **What Each Option Does:**

   **Option A: "Send quick message"**
   - Opens the "I See You" message drawer (feature #3)
   - Trackable in-app message
   - We know it was sent, read, replied to

   **Option B: "I'm calling them now"**
   - Logs in database: "[User] initiated call to [Bestie] at [timestamp] in response to [needs attention request]"
   - Opens phone dialer with their number
   - Later, can optionally prompt: "How did your call go?" (collect outcome data)
   - We at least know a call was INITIATED even if we don't know what happened

   **Option C: "Let's meet up"**
   - Opens simple scheduling prompt:
     - "When can you meet? This week / Next week / Just checking in for now"
     - "What for? Coffee / Meal / Activity / Just talk"
   - Sends invitation to bestie
   - Logs that meetup was proposed
   - If bestie accepts, both get reminder
   - After proposed date passes, prompt: "Did you meet up?" Y/N

   **Option D: "I reached out off-app"**
   - Quick log form:
     - "How did you reach out? Texted / Called / Instagram / Other"
     - "How did it go? 😊 Good / 😐 Okay / 😔 No response"
   - Lets users self-report contact that happened outside app
   - Not ideal but better than nothing
   - Gives partial credit

5. **Dismissing vs. Acting:**
   - Current system: Little X to dismiss
   - Keep that, but also track:
     - Dismissed without action = no credit
     - Any support action taken = credit in stats

**What Data to Track:**
- Database collection: `support_actions`
- Fields needed:
  - `actorId` - who took the action
  - `recipientId` - who needed support
  - `actionType` - "message", "call", "meetup", "off_app_contact"
  - `contextType` - "needs_attention", "circle_checkin", "manual"
  - `contextId` - ID of the triggering event
  - `timestamp` - when action taken
  - `outcome` - optional, how it went
  - `meetupDetails` - if applicable, when/what
  - `meetupCompleted` - if they confirmed they met up

**Stats This Creates:**
- "Times you showed up for besties: X"
- "Support actions taken this month: X"
- "Average response time to needs attention: X minutes"
- "Besties you've supported: X"

---

## 📊 REDESIGNING THE STATS SECTION

### Current Problems:
- All stats are individual ("my check-ins", "my streak")
- No relationship metrics
- Doesn't show what makes besties strong

### New Stats Structure:

**Section 1: "Your Safety Habits" (Individual)**
- ✅ Safe Check-ins: X
- 📅 Days Active: X
- 🔥 Current Streak: X days
- 🌙 Night Check-ins: X
- 🎉 Weekend Check-ins: X

**Section 2: "Your Relationships" (NEW - This is the important part)**
- 💜 Besties: X
- ⭐ Featured Circle: X/5
- 🤝 Support given this month: X actions
- 💬 Messages exchanged this week: X
- 🏆 Challenges completed together: X
- 🛡️ Active safety pacts: X
- 📞 Average response time to alerts: X minutes
- 💪 Strongest connection: [Bestie name] (shows top connection score)

**Section 3: "Your Impact" (Community)**
- 🛡️ Times Selected as Emergency Contact: X (keep this!)
- 👥 Besties you've helped this month: X unique people
- ⚡ Fastest alert response: X seconds

**Section 4: "Achievements"**
- 🏆 Badges Earned: X
- 🎯 Next milestone: [what they're close to achieving]

### Key Changes:
1. **Relationship metrics are prominent** - not hidden
2. **Recent activity is highlighted** - "this week", "this month"
3. **Connection strength is visible** - "strongest connection" gamifies it
4. **Support is measured** - we track what people do for each other
5. **Individual safety habits still matter** - but they're one part of the story

---

## 📚 UPDATING THE TUTORIAL

### Current Tutorial Problems:
- Focuses only on individual features (check-ins, circle, emergency contacts)
- Doesn't explain relationship features (because they didn't exist)
- Doesn't help users understand WHY they should engage with besties

### New Tutorial Flow:

**Step 1: Welcome & Philosophy** (unchanged)
- What Besties is
- Safety through connection

**Step 2: Your Featured Circle** (enhanced)
- Add up to 5 besties to your circle
- These are your closest people
- **NEW:** They'll see your circle check-ins
- **NEW:** You can start challenges and pacts with them

**Step 3: Safety Check-Ins** (unchanged)
- How to create a check-in
- How alerts work
- How to complete check-ins

**Step 4: Circle Check-Ins** (NEW)
- "Share how you're feeling with your circle"
- Optional daily wellness check
- See how your besties are doing
- Send quick support messages

**Step 5: Building Strong Connections** (NEW)
- "Strong relationships = better safety"
- Shows sample challenge: "Both check in 3 times this week"
- Shows sample safety pact: "Text when you get home from dates"
- Shows "I See You" message examples

**Step 6: Your Stats** (enhanced)
- **OLD:** Just showed badges and check-in count
- **NEW:** Shows relationship metrics
- "Track what you build together"
- "See your strongest connections"

**Step 7: When Someone Needs You** (enhanced)
- **OLD:** Just explained alerts
- **NEW:** Shows support actions
- "How to show up for besties"
- "Every action counts"

### Tutorial Tooltips to Add:

**On Circle Check-Ins:**
"Checking in regularly helps your besties know how you're doing - and builds stronger connections."

**On Challenges:**
"Challenges are fun ways to build safety habits together. Both of you work toward the same goal!"

**On Safety Pacts:**
"Make a promise to each other, hold each other accountable. That's what besties do."

**On Stats Page:**
"Your strongest connections aren't random - they're the besties you actually show up for."

**On Support Actions:**
"When someone needs support, we'll show you trackable ways to help. Every action builds your connection."

---

## 🗄️ DATABASE SCHEMA ADDITIONS

### New Collections Needed:

1. **`circle_checkins`**
   - Emotional wellness check-ins (not safety check-ins)
   - Visible to featured circle only
   - Includes mood + optional note

2. **`bestie_challenges`**
   - Active challenges between two users
   - Tracks progress for both people
   - Completion status

3. **`challenge_templates`**
   - Pre-made challenges (admin creates these)
   - Users pick from this list
   - Defines goals, points, duration

4. **`bestie_messages`**
   - In-app support messages
   - Includes text and voice notes
   - Read receipts and reply tracking

5. **`safety_pacts`**
   - Mutual safety agreements
   - Both users must accept
   - Status tracking

6. **`pact_completions`**
   - Log of each time someone completes a pact
   - Builds streak and reliability data

7. **`support_actions`**
   - Tracks all support actions (calls, messages, meetups, etc.)
   - Response times
   - Outcomes when available

### Updates to Existing Collections:

**`users` collection:**
- Add `stats.messagesExchanged` - total count
- Add `stats.supportActionsGiven` - total count
- Add `stats.challengesCompleted` - total count
- Add `stats.activePacts` - current count
- Add `stats.averageResponseTime` - calculated field

**`interactions` collection (already exists):**
- Add new interaction types:
  - `circle_checkin_response`
  - `challenge_progress`
  - `pact_completion`
  - `support_message`
  - `voice_note`

---

## 🎯 SUCCESS METRICS

How do we know these features are working?

**Feature Adoption:**
- % of users who send at least 1 "I See You" message per week
- % of bestie pairs with at least 1 active challenge
- % of bestie pairs with at least 1 safety pact
- % of users doing circle check-ins at least once/week

**Engagement:**
- Average messages per active user per week
- Average support actions per needs-attention request
- Challenge completion rate
- Pact adherence rate

**Connection Quality:**
- Average connection strength score increasing over time
- % of besties with "strong" or higher connection
- Response time to alerts improving

**Retention:**
- Do users with active challenges/pacts have better retention?
- Do users who exchange messages stay active longer?

---

## 🚀 IMPLEMENTATION PRIORITY

### Phase 1 (Essential - Do First):
1. "I See You" Messages (feature #3) - Replaces broken "reach out" button
2. Support Actions (feature #6) - Makes support trackable
3. Circle Check-Ins (feature #2) - Creates opportunities for connection
4. Stats Section Redesign - Shows the new relationship data

### Phase 2 (Important - Do Next):
5. Safety Pacts (feature #5) - Deeper commitment
6. Bestie Challenges (feature #3) - Gamification

### Phase 3 (Nice to Have - If Time):
7. Voice Notes (feature #4) - Only if not too complex
8. Tutorial Updates - After features are working

---

## 📝 NOTES FOR IMPLEMENTATION

### Keep It Simple:
- No complex chat systems
- No real-time messaging needed (async is fine)
- No video/audio calls
- No group messages (just 1:1)

### Mobile-First:
- All features must work on phone
- Thumb-friendly tap targets
- Quick actions (not buried in menus)

### Privacy:
- Circle check-ins only visible to featured circle
- Messages only between besties
- Users control what they share

### Performance:
- Don't load all message history (just recent)
- Lazy load voice notes
- Cache connection scores (don't recalculate every time)

### Notifications:
- Push notification when you receive a message
- Push notification when someone completes a challenge with you
- Push notification when pact partner does their part
- NOT spammy - users can control notification settings

---

## ✅ DEFINITION OF DONE

Each feature is complete when:

1. **It works on mobile and desktop**
2. **Data is being tracked in database correctly**
3. **Stats section shows the new metrics**
4. **Users can discover the feature** (not hidden)
5. **Tutorial mentions it** (where relevant)
6. **It's trackable** - we know if/when it happened
7. **Both users get credit** (for mutual features)

---

## 🎬 USER STORIES TO TEST

**Story 1: Sarah Checks In**
- Sarah posts circle check-in: "😔 Not great - rough week"
- Her bestie Emma sees it
- Emma clicks support button → sends "I See You" message: "Want to vent? I'm listening"
- Sarah gets notification, reads it, replies
- Both see this in their stats as messages exchanged
- Emma sees in her stats: "Support given this week: 1"

**Story 2: Challenge Completed**
- Emma invites Sarah to challenge: "Both check in 3 times this week"
- Sarah accepts
- Both do their check-ins throughout the week
- On Friday, challenge completes
- Both get celebration animation
- Both earn 50 points
- Shows in stats: "Challenges completed: 1"

**Story 3: Safety Pact**
- Sarah and Emma create pact: "Text when you get home from dates"
- Both accept
- Sarah goes on date Friday night
- She completes safety check-in, marks "completing safety pact"
- Emma gets notification: "Sarah kept her safety pact ✅"
- Pact streak continues: "3 weeks"

**Story 4: Needs Attention Response**
- Emma posts needs attention: "💭 needs to vent"
- Sarah sees it in activity feed
- Sarah clicks support → "I'm calling them now"
- System logs: Sarah initiated call at 8:47 PM
- Opens phone dialer
- After call, optional prompt: "How did it go?"
- Sarah: "😊 Good - we talked for an hour"
- Shows in stats: "Times you showed up: 1"

---

**END OF PLAN**

This plan should give Cursor everything needed to implement these features without you needing to write code. Each feature is explained from the user's perspective, with clear data requirements and success criteria.
