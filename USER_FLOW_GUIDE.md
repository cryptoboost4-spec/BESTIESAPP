# Step-by-Step User Experience Guide

**For Cursor / Developers:** This document shows exactly what users see and do at each step. Use this to build the features correctly.

---

## 🎯 Tutorial Timing

**When do tutorials appear?**
- **First time visiting that page/feature** (already working for existing tutorials)
- **After completing prerequisite tutorials** (e.g., bestie circle tutorial shows after check-in tutorial)
- **Not during initial onboarding** - onboarding is separate, tutorials come after

**How tutorials work now:**
- Check-in tutorial → User completes first check-in → "I'm Safe!" button clicked → afterSafe tooltip appears → User chooses "Continue Tutorial" → Bestie circle tutorial shows
- This flow is already implemented and working

---

## 📱 FEATURE 1: "I SEE YOU" MESSAGES

### Scenario: Sarah wants to send Emma a supportive message

**Step 1: Finding the Message Button**

Sarah sees Emma's post in activity feed:
```
┌─────────────────────────────────┐
│ [Emma's avatar] Emma             │
│ 😔 Not great                     │
│ "Rough week at work"             │
│ 2 hours ago                      │
│                                  │
│ [💬 Send Support]                │
└─────────────────────────────────┘
```

**Step 2: Tapping Send Support**

Sarah taps the button. A drawer slides up from bottom:

```
┌─────────────────────────────────┐
│ Send Message to Emma             │
├─────────────────────────────────┤
│ Quick Messages:                  │
│                                  │
│ [💜 Thinking of you - here if   │
│      you need me]                │
│                                  │
│ [☕ Let's grab coffee this week] │
│                                  │
│ [🎧 Want to vent? I'm listening] │
│                                  │
│ [📞 I'll call you today]         │
│                                  │
│ [🤗 Sending love]                │
│                                  │
│ ────────── OR ──────────         │
│                                  │
│ [✍️ Write Custom Message]        │
│                                  │
│ [Cancel]                         │
└─────────────────────────────────┘
```

**Step 3: Selecting a Message**

Sarah taps "🎧 Want to vent? I'm listening"

The drawer closes immediately. She sees confirmation:
```
┌─────────────────────────────────┐
│ ✓ Message sent to Emma!          │
└─────────────────────────────────┘
```
(Toast notification, disappears after 2 seconds)

**Step 4: Emma Receives It**

Emma's phone buzzes. Push notification:
```
┌─────────────────────────────────┐
│ 💬 Besties                       │
│ Sarah sent you a message         │
│ "Want to vent? I'm listening"   │
│ Tap to reply                     │
└─────────────────────────────────┘
```

**Step 5: Emma Opens Notification**

Emma taps notification. Opens directly to message thread:

```
┌─────────────────────────────────┐
│ < Messages with Sarah            │
├─────────────────────────────────┤
│                                  │
│  [Sarah's avatar]                │
│  🎧 Want to vent? I'm listening  │
│  2 min ago · ✓✓ Read             │
│                                  │
│                                  │
│                                  │
│ ──────────────────────────       │
│ [💬 Reply to Sarah]              │
└─────────────────────────────────┘
```

**Step 6: Emma Tries to Reply**

Emma taps "Reply to Sarah". Drawer opens with same message options.

She taps "☕ Let's grab coffee this week"

**Step 7: Rate Limit Hit (Already Sent Today)**

Emma sees error:
```
┌─────────────────────────────────┐
│ ⏰ One Message Per Day           │
│                                  │
│ You already sent Sarah a message │
│ today!                           │
│                                  │
│ You can send another message     │
│ tomorrow at 8:30 AM 💜           │
│                                  │
│ [OK]                             │
└─────────────────────────────────┘
```

**Step 8: Tomorrow Sarah Sees Emma's Reply**

Next day, Sarah gets notification:
```
┌─────────────────────────────────┐
│ 💬 Besties                       │
│ Emma sent you a message          │
│ "Let's grab coffee this week"   │
└─────────────────────────────────┘
```

Opens to thread:
```
┌─────────────────────────────────┐
│ < Messages with Emma             │
├─────────────────────────────────┤
│ Yesterday:                       │
│                                  │
│  [Sarah's avatar]                │
│  🎧 Want to vent? I'm listening  │
│  ✓✓ Read                         │
│                                  │
│                       [Emma]     │
│        ☕ Let's grab coffee this  │
│              week                │
│              Just now · ✓✓       │
│                                  │
│ ──────────────────────────       │
│ [💬 Reply to Emma]               │
└─────────────────────────────────┘
```

---

## 📱 FEATURE 2: SUPPORT ACTIONS (Replaces "Reach Out")

### Scenario: Emma posts "needs to vent", Sarah wants to help

**Step 1: Sarah Sees Needs Attention**

On home page activity feed:
```
┌─────────────────────────────────┐
│ ⚠️ NEEDS ATTENTION               │
├─────────────────────────────────┤
│ [Emma's avatar]                  │
│  Emma · 💭 needs to vent         │
│                                  │
│           [💜 Support ▼]         │
└─────────────────────────────────┘
```

**Step 2: Tap Support Button**

Dropdown menu appears:
```
┌─────────────────────────────────┐
│ How do you want to help?         │
├─────────────────────────────────┤
│ 💬 Send quick message            │
│                                  │
│ 📞 I'm calling them now          │
│                                  │
│ 📅 Let's meet up                 │
│                                  │
│ ✅ I reached out off-app         │
└─────────────────────────────────┘
```

**Option A: Sarah Chooses "Send quick message"**

Opens "I See You" message drawer (see Feature 1)

**Option B: Sarah Chooses "I'm calling them now"**

```
1. Screen shows: "Logging call..."
2. Phone dialer opens with Emma's number
3. Database logs:
   - Sarah initiated call to Emma
   - Timestamp
   - Context: needs_attention
4. Sarah's stats increment: "Support actions this month: +1"
5. Done. No follow-up.
```

**Option C: Sarah Chooses "Let's meet up"**

Form appears:
```
┌─────────────────────────────────┐
│ Propose Meetup with Emma         │
├─────────────────────────────────┤
│ When can you meet?               │
│ [ This week        ▼]            │
│                                  │
│ What for?                        │
│ [ Coffee           ▼]            │
│                                  │
│ Add note (optional):             │
│ ┌─────────────────────────────┐ │
│ │ downtown starbucks?         │ │
│ └─────────────────────────────┘ │
│ 50 characters max                │
│                                  │
│ [Cancel]  [Send Proposal]        │
└─────────────────────────────────┘
```

Sarah fills it out, taps "Send Proposal"

Emma receives as in-app message:
```
┌─────────────────────────────────┐
│ 💬 Sarah sent you a message      │
│                                  │
│ 📅 Sarah wants to meet up!       │
│ When: This week                  │
│ What: Coffee                     │
│ Note: "downtown starbucks?"      │
│                                  │
│ Tap to reply                     │
└─────────────────────────────────┘
```

Database logs: support_action type "meetup_proposed"

**That's it. No tracking if they actually meet.**

**Option D: Sarah Chooses "I reached out off-app"**

Form appears:
```
┌─────────────────────────────────┐
│ Log Your Outreach                │
├─────────────────────────────────┤
│ How did you reach out?           │
│ [ Texted            ▼]           │
│                                  │
│ How did it go?                   │
│ 😊 Good                          │
│ 😐 Okay                          │
│ 😔 No response                   │
│                                  │
│ [Cancel]  [Log It]               │
└─────────────────────────────────┘
```

Sarah logs it. Gets confirmation:
```
┌─────────────────────────────────┐
│ ✓ Outreach logged!               │
│ Thanks for supporting Emma 💜    │
└─────────────────────────────────┘
```

Database logs: support_action type "off_app_contact" with metadata

---

## 📱 FEATURE 3: CIRCLE CHECK-INS

### Scenario: Sarah wants to share how she's feeling

**Step 1: Sarah Opens App**

At top of activity feed (only if she hasn't checked in today):
```
┌─────────────────────────────────┐
│ How are you feeling today?       │
│                                  │
│ 🌟  😊  😐  😔  😢               │
│                                  │
│ [Dismiss ✕]                      │
└─────────────────────────────────┘
```

**Step 2: Sarah Taps 😔 Not great**

Card expands:
```
┌─────────────────────────────────┐
│ Want to share more? (optional)   │
│                                  │
│ ┌─────────────────────────────┐ │
│ │ Rough week...               │ │
│ └─────────────────────────────┘ │
│ 23/50 characters                 │
│                                  │
│ [Skip]  [Share with Circle]      │
└─────────────────────────────────┘
```

**Step 3: Sarah Adds Note and Shares**

Taps "Share with Circle"

Celebration appears:
```
┌─────────────────────────────────┐
│ ✨ Shared with Your Circle       │
│                                  │
│ Your 3 circle besties can now    │
│ see how you're doing 💜          │
│                                  │
│ [Close]                          │
└─────────────────────────────────┘
```

**Step 4: Emma (in Sarah's Circle) Sees It**

Emma opens app. In activity feed:
```
┌─────────────────────────────────┐
│ [Sarah's avatar] Sarah           │
│ 😔 Not great                     │
│ "Rough week..."                  │
│ 5 min ago                        │
│                                  │
│ [💬 Send Support]                │
└─────────────────────────────────┘
```

Emma can tap "Send Support" (opens message drawer - Feature 1)

**Step 5: Maria (NOT in Sarah's Circle)**

Maria opens app. Sees nothing.

Circle check-ins only visible to featured circle (max 5 people).

---

## 📱 FEATURE 4: BESTIE CHALLENGES

### Scenario: Sarah wants to challenge Emma

**Step 1: Sarah Opens Challenges Page**

Navigation: Home → Menu → Challenges (or direct link)

```
┌─────────────────────────────────┐
│ Bestie Challenges 🏆             │
├─────────────────────────────────┤
│ Do challenges with your besties  │
│ to build safety habits together! │
│                                  │
│ Active Challenges (0)            │
│ ─────────────────────────────    │
│ No active challenges yet         │
│                                  │
│ ┌─────────────────────────────┐ │
│ │ [+ Start a Challenge]       │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Step 2: Sarah Taps "Start a Challenge"**

Challenge library appears:
```
┌─────────────────────────────────┐
│ Choose a Challenge               │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 🛡️ Weekend Safety Warriors  │ │
│ │ Both complete 3 safety       │ │
│ │ check-ins this week          │ │
│ │ Earn: 50 points + badge      │ │
│ └─────────────────────────────┘ │
│                                  │
│ ┌─────────────────────────────┐ │
│ │ 💬 Connection Champions     │ │
│ │ Share feelings 5 times       │ │
│ │ this week                    │ │
│ │ Earn: 50 points              │ │
│ └─────────────────────────────┘ │
│                                  │
│ ┌─────────────────────────────┐ │
│ │ 🤝 Support Squad            │ │
│ │ Send each other 3 messages   │ │
│ │ this week                    │ │
│ │ Earn: 30 points              │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Step 3: Sarah Picks One**

Taps "Weekend Safety Warriors"

```
┌─────────────────────────────────┐
│ Weekend Safety Warriors 🛡️       │
├─────────────────────────────────┤
│ Goal: Both complete 3 safety     │
│ check-ins this week              │
│                                  │
│ Time limit: 7 days               │
│                                  │
│ What you both earn:              │
│ • 50 points                      │
│ • Weekend Warrior badge          │
│                                  │
│ Who do you want to challenge?    │
│                                  │
│ Search besties...                │
│ ┌─────────────────────────────┐ │
│ │ 🔍 [search box]             │ │
│ └─────────────────────────────┘ │
│                                  │
│ Your Besties:                    │
│ [Emma's avatar] Emma             │
│ [Maria's avatar] Maria           │
│ [Jake's avatar] Jake             │
│                                  │
│ [Cancel]                         │
└─────────────────────────────────┘
```

**Step 4: Sarah Picks Emma**

Taps Emma's name. Confirmation:
```
┌─────────────────────────────────┐
│ Challenge Emma?                  │
│                                  │
│ Weekend Safety Warriors          │
│ Both do 3 check-ins this week    │
│                                  │
│ Emma will get an invitation.     │
│ The challenge starts when you    │
│ both accept!                     │
│                                  │
│ [Go Back]  [Send Invitation]     │
└─────────────────────────────────┘
```

Sarah taps "Send Invitation"

```
┌─────────────────────────────────┐
│ ✓ Invitation sent to Emma!       │
│                                  │
│ Waiting for Emma to accept...    │
└─────────────────────────────────┘
```

**Step 5: Emma Gets Notification**

```
┌─────────────────────────────────┐
│ 🏆 Besties                       │
│ Sarah invited you to a challenge!│
│ Weekend Safety Warriors          │
│ Tap to view                      │
└─────────────────────────────────┘
```

**Step 6: Emma Opens Invitation**

```
┌─────────────────────────────────┐
│ Challenge Invitation 🏆          │
├─────────────────────────────────┤
│ Sarah wants to do a challenge    │
│ with you!                        │
│                                  │
│ Weekend Safety Warriors          │
│ ─────────────────────────────    │
│ Both complete 3 safety check-ins │
│ this week                        │
│                                  │
│ Time limit: 7 days               │
│                                  │
│ What you both earn:              │
│ • 50 points each                 │
│ • Weekend Warrior badge          │
│                                  │
│ [Decline]  [Accept Challenge]    │
└─────────────────────────────────┘
```

**Step 7: Emma Accepts**

Taps "Accept Challenge"

```
┌─────────────────────────────────┐
│ 🎉 Challenge Started!            │
│                                  │
│ You and Sarah are now doing      │
│ Weekend Safety Warriors!         │
│                                  │
│ Good luck! 💜                    │
│                                  │
│ [View Challenge]                 │
└─────────────────────────────────┘
```

**Step 8: Both See Active Challenge**

On challenges page:
```
┌─────────────────────────────────┐
│ Active Challenges (1)            │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ Weekend Safety Warriors 🛡️  │ │
│ │ with Emma                    │ │
│ │                              │ │
│ │ Your progress:    █░░ 1/3    │ │
│ │ Emma's progress:  ░░░ 0/3    │ │
│ │                              │ │
│ │ Time left: 6 days            │ │
│ │                              │ │
│ │ [View Details]               │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Step 9: Sarah Creates a Check-In**

Sarah goes to home, creates safety check-in.

Automatically detected! Progress updates:
```
Your progress: ██░ 2/3
```

(No manual logging - system tracks it automatically)

**Step 10: Challenge Completes**

When both reach 3/3:

Both get notification:
```
┌─────────────────────────────────┐
│ 🎉 Besties                       │
│ Challenge complete!              │
│ You and Emma finished            │
│ Weekend Safety Warriors!         │
│ Tap to celebrate                 │
└─────────────────────────────────┘
```

**Step 11: Tap Notification**

Opens celebration screen:
```
┌─────────────────────────────────┐
│         🎊🎊🎊🎊🎊              │
│                                  │
│   You did it together! 🎉        │
│                                  │
│   Weekend Safety Warriors        │
│   ✓ COMPLETED                    │
│                                  │
│   You both earned:               │
│   • 50 points                    │
│   • Weekend Warrior badge 🛡️     │
│                                  │
│   Great teamwork! 💜             │
│                                  │
│   [Close]  [Start New Challenge] │
│                                  │
│         🎊🎊🎊🎊🎊              │
└─────────────────────────────────┘
```

(Confetti animation plays)

---

## 📱 FEATURE 5: SAFETY PACT

### Scenario: Sarah and Emma make their sacred promise

**Step 1: Sarah Views Her Circle**

On home page, sees Living Circle (featuredcircle besties):

```
┌─────────────────────────────────┐
│ Your Bestie Circle 💜            │
├─────────────────────────────────┤
│ Your core 5 safety besties       │
│                                  │
│  [Emma]    [Maria]    [Jake]     │
│    ●          ●         ●        │
│                                  │
│     [+]              [+]         │
│      ●                ●          │
│                                  │
│ 3/5 slots filled                 │
└─────────────────────────────────┘
```

**Step 2: Tap Emma's Circle Slot**

Opens Emma's mini-profile:
```
┌─────────────────────────────────┐
│ Emma                             │
│ [Emma's avatar]                  │
│                                  │
│ Connection: Strong ⚡             │
│ In your circle: 45 days          │
│                                  │
│ ┌─────────────────────────────┐ │
│ │ Make Our Safety Pact         │ │
│ └─────────────────────────────┘ │
│                                  │
│ [View Full Profile]              │
│ [Remove from Circle]             │
│                                  │
│ [Close]                          │
└─────────────────────────────────┘
```

**Step 3: Tap "Make Our Safety Pact"**

Beautiful full-screen modal appears:
```
┌─────────────────────────────────┐
│          💜                      │
│                                  │
│    Our Safety Pact               │
│                                  │
│ ───────────────────────────      │
│                                  │
│ Hey Emma,                        │
│                                  │
│ You mean a lot to me. And I know │
│ I mean a lot to you too.         │
│                                  │
│ So let's make a promise to each  │
│ other:                           │
│                                  │
│ Whenever either of us is in a    │
│ situation where we don't feel    │
│ 100% safe, we'll use this app.   │
│                                  │
│ Not because we're scared, but    │
│ because we're smart. Not because │
│ we have to, but because we want  │
│ to come home safe - for          │
│ ourselves and for each other.    │
│                                  │
│ Whether it's a first date, a     │
│ night out, walking alone,        │
│ meeting someone new, or just     │
│ that weird feeling that          │
│ something's off - we'll check in.│
│                                  │
│ Because you matter to me. And I  │
│ matter to you. And we both       │
│ deserve to make it home safe.    │
│                                  │
│ Let's look out for each other.   │
│ Deal?                            │
│                                  │
│ ───────────────────────────      │
│                                  │
│ [Not Now]  [I Promise]           │
│                                  │
│          💜                      │
└─────────────────────────────────┘
```

(Subtle background animation - soft glow, gentle hearts)

**Step 4: Sarah Taps "I Promise"**

Screen changes:
```
┌─────────────────────────────────┐
│          💜💜                    │
│                                  │
│ Waiting for Emma to promise...   │
│                                  │
│ We've sent Emma your invitation. │
│ The pact activates when you both │
│ make your promise.               │
│                                  │
│ ───────────────────────────      │
│                                  │
│ Sarah has promised ✓             │
│ Emma: Invitation sent...         │
│                                  │
│ [Close]                          │
│                                  │
│          💜💜                    │
└─────────────────────────────────┘
```

**Step 5: Emma Gets Notification**

```
┌─────────────────────────────────┐
│ 💜 Besties                       │
│ Sarah wants to make a Safety     │
│ Pact with you 💜                 │
│                                  │
│ A special promise to always use  │
│ the app when you don't feel safe │
│                                  │
│ Tap to view                      │
└─────────────────────────────────┘
```

**Step 6: Emma Opens Invitation**

Same beautiful pact screen appears, but shows:
```
┌─────────────────────────────────┐
│          💜                      │
│                                  │
│    Our Safety Pact               │
│                                  │
│ ───────────────────────────      │
│ [Full pact text appears here]    │
│ ───────────────────────────      │
│                                  │
│ Sarah has promised.              │
│ Will you promise too?            │
│                                  │
│ [Decline]  [I Promise]           │
│                                  │
│          💜                      │
└─────────────────────────────────┘
```

**Step 7: Emma Taps "I Promise"**

Celebration animation:
```
┌─────────────────────────────────┐
│     ✨    💜    ✨              │
│                                  │
│   You've made your               │
│   Safety Pact with Sarah! 💜     │
│                                  │
│      [Two hearts joining]        │
│           💜💜                   │
│          /    \                  │
│         /      \                 │
│                                  │
│ Your promise is active.          │
│ Look out for each other.         │
│                                  │
│ ───────────────────────────      │
│                                  │
│ Pact active since: Dec 19, 2025  │
│                                  │
│ [Close]                          │
│                                  │
│     ✨    💜    ✨              │
└─────────────────────────────────┘
```

(Confetti falls, hearts animate, subtle haptic feedback)

**Step 8: Both See Active Pact**

On Emma's circle slot:
```
┌─────────────────────────────────┐
│ Emma                             │
│ [Emma's avatar]                  │
│                                  │
│ 💜 Safety Pact Active ✓          │
│ Active since: Dec 19, 2025       │
│                                  │
│ Connection: Strong ⚡             │
│                                  │
│ [View Pact Details]              │
│ [View Full Profile]              │
│                                  │
│ [Close]                          │
└─────────────────────────────────┘
```

**Step 9: Sarah Creates Check-In Later**

Sarah goes on a date, creates safety check-in.

At bottom of check-in card, subtle text appears:
```
┌─────────────────────────────────┐
│ Safety Check-In                  │
│ [check-in details]               │
│                                  │
│ ─────────────────────────────    │
│ ✓ Honoring your pact with Emma   │
└─────────────────────────────────┘
```

(Small, gray text, not prominent - gentle affirmation)

**Step 10: Sarah Marks Safe**

When she completes check-in:
```
┌─────────────────────────────────┐
│ ✓ Made it home safe -            │
│   Emma will be glad 💜           │
└─────────────────────────────────┘
```

(Toast notification)

**Step 11: Viewing All Pacts**

Profile → Safety Pacts (or dedicated page):
```
┌─────────────────────────────────┐
│ Your Safety Pacts 💜             │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ Emma                         │ │
│ │ Pact active since: Dec 19    │ │
│ │ Last honored: 2 hours ago    │ │
│ │ (Sarah checked in safely)    │ │
│ │                              │ │
│ │ [View Details] [End Pact]    │ │
│ └─────────────────────────────┘ │
│                                  │
│ ┌─────────────────────────────┐ │
│ │ Maria                        │ │
│ │ Pact active since: Nov 12    │ │
│ │ Last honored: 5 days ago     │ │
│ │ (Maria checked in safely)    │ │
│ │                              │ │
│ │ [View Details] [End Pact]    │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Step 12: Ending a Pact (If Needed)**

Sarah taps "End Pact" on Emma:
```
┌─────────────────────────────────┐
│ End Safety Pact?                 │
│                                  │
│ Are you sure you want to end     │
│ your Safety Pact with Emma?      │
│                                  │
│ You can always make a new pact   │
│ later if you'd like.             │
│                                  │
│ [Go Back]  [End Pact]            │
└─────────────────────────────────┘
```

If confirmed:
```
Emma gets notification:
"Sarah ended your Safety Pact.
You can always make a new one
if you'd like."
```

---

## 📱 STATS SECTION (Redesigned)

### What Sarah Sees on Her Profile

**Before scrolling:**
```
┌─────────────────────────────────┐
│ Sarah Johnson                    │
│ [Profile photo]                  │
│                                  │
│ Your Featured Badges             │
│ [Badge1] [Badge2] [Badge3]       │
│                                  │
│ ───── Your Safety Habits ─────   │
│                                  │
│ ┌─────┐ ┌─────┐ ┌─────┐         │
│ │ ✅  │ │ 📅  │ │ 🔥  │         │
│ │ 47  │ │ 89  │ │ 12  │         │
│ │ Safe│ │ Days│ │ Day │         │
│ │Check│ │Activ│ │Strek│         │
│ └─────┘ └─────┘ └─────┘         │
│                                  │
│ ┌─────┐ ┌─────┐                 │
│ │ 🌙  │ │ 🎉  │                 │
│ │ 23  │ │ 15  │                 │
│ │Night│ │Weeke│                 │
│ │Check│ │nd   │                 │
│ └─────┘ └─────┘                 │
└─────────────────────────────────┘
```

**Scroll down:**
```
┌─────────────────────────────────┐
│ ──── Your Relationships 💜 ────  │
│                                  │
│ ┌─────┐ ┌─────┐ ┌─────┐         │
│ │ 💬  │ │ 🤝  │ │ 🏆  │         │
│ │ 12  │ │  8  │ │  2  │         │
│ │Messg│ │Times│ │Chall│         │
│ │This │ │You  │ │enges│         │
│ │Week │ │Helpd│ │Done │         │
│ └─────┘ └─────┘ └─────┘         │
│                                  │
│ ┌─────┐ ┌─────┐                 │
│ │ 🛡️  │ │ ⚡  │                 │
│ │  3  │ │ 45  │                 │
│ │Activ│ │ Sec │                 │
│ │Pacts│ │Respo│                 │
│ └─────┘ └─────┘                 │
│                                  │
│ ┌─────────────────────────────┐ │
│ │ 💪 Strongest Connection     │ │
│ │                              │ │
│ │ [Emma's avatar] Emma         │ │
│ │ Connection Score: 87/100     │ │
│ │ Status: Powerful ⚡           │ │
│ │                              │ │
│ │ [View Details]               │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Scroll more:**
```
┌─────────────────────────────────┐
│ ────── Your Impact ──────        │
│                                  │
│ ┌─────┐ ┌─────┐                 │
│ │ 🛡️  │ │ 👥  │                 │
│ │ 23  │ │  5  │                 │
│ │Times│ │Best │                 │
│ │Selec│ │Helpd│                 │
│ │ted  │ │This │                 │
│ │Emerg│ │Month│                 │
│ └─────┘ └─────┘                 │
│                                  │
│ ────── Achievements ──────       │
│                                  │
│ ┌─────┐                         │
│ │ 🏆  │                         │
│ │ 15  │                         │
│ │Badge│                         │
│ │Earnd│                         │
│ └─────┘                         │
│                                  │
│ [View All Badges →]              │
└─────────────────────────────────┘
```

---

## 📝 SUCCESS METRICS (What to Track)

**Track these numbers, don't force behavior:**

### Adoption (Are people using it?)
- How many users send at least 1 message per week?
- How many bestie pairs have an active challenge?
- How many bestie pairs have a safety pact?
- How many users post circle check-ins?

### Engagement (How much are they using it?)
- Average messages per user per week
- Average support actions when someone posts "needs attention"
- What % of challenges get completed vs abandoned?
- For users with pacts: how often do they create check-ins?

### Connection (Is it working?)
- Average connection score across all bestie relationships
- What % of besties have "strong" connection (50+ score)?
- Is response time to alerts getting faster?

### Retention (Do they stick around?)
- Do users with active pacts log in more often?
- Do users who exchange messages stay active longer?
- Do users who complete challenges come back more?

**Important:** We're not forcing people to send messages or do check-ins. We just want to see if the features help naturally.

---

## 🎓 TUTORIAL TIMING (Answered)

**When tutorials appear:**
- **First time visiting that page/feature**
  - Example: First time on challenges page → Shows challenge tutorial
  - Example: First time making a pact → Could show brief tooltip
- **After completing prerequisite action**
  - Example: After completing first check-in → "Want to see more?" tutorial
  - Already working: Check-in tutorial → afterSafe tooltip → Bestie circle tutorial

**When tutorials DON'T appear:**
- Not during initial onboarding (that's separate)
- Not repeatedly after being dismissed
- Not if user has already used the feature

---

**END OF USER FLOW GUIDE**

This document shows exactly what users see at each step. Use this to build the features correctly.
