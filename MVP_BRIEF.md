# BESTIES — MVP Scope Brief
### Instructions for the Vibe Coder

---

## What This Document Is

This is a complete brief for simplifying the BESTIES app to a focused MVP. The app has been over-built — it started as a safety check-in app but grew into a social network. We are stripping it back to its core purpose: **a safety check-in app where your friends get alerted if you don't check in safe.**

**Read this whole document before touching any code.**

---

## The Golden Rule

> **HIDE or DISABLE features. Do NOT delete code unless explicitly told to below.**
>
> The owner plans to re-introduce some features later. Deleting code now creates future work. Use feature flags, comment out UI elements, or remove routes/nav links — but leave the underlying components and functions in place.

---

## The Core Product (What BESTIES Does)

1. User creates a check-in with a timer before an activity
2. Countdown warnings fire at 10min, 5min, 1min, 30sec before time runs out
3. If they don't tap "I'm Safe" in time, their besties get alerted
4. Besties are notified via SMS, Telegram, or Push notification
5. That's it. Everything else is secondary.

---

## New Navigation Structure

**3 tabs only. No exceptions.**

| Tab | Purpose |
|-----|---------|
| **Home** | Check-in dashboard — start, manage, and respond to check-ins |
| **Besties** | Manage your bestie list and send support messages |
| **Profile** | Your profile, badges, stats, settings, and subscription |

Remove any other navigation items (activity feed, challenges, circle check-ins, pacts, social posts, etc.) from the nav entirely. Pages can stay in the codebase but should not be reachable from the UI.

---

## Tab-by-Tab Breakdown

### HOME TAB

**When no check-in is active:**
- Prominent "Start Check-In" button
- 4 quick-start template buttons (keep all 4 as they are — rideshare, and the others)
- Any pending alerts from besties who haven't checked in

**When a check-in is active:**
- Big, clear "I'm Safe" button — this is the most important button in the app
- Time remaining display
- Extend buttons (+15min, +30min, +1hr)
- Countdown warnings at 10min, 5min, 1min, 30sec (keep defaults, do NOT make them user-configurable — just fire automatically)

**Incoming alerts:**
- If a bestie has missed their check-in, show an alert with "Call Now" button
- Keep alert acknowledgment flow as is

**Remove from Home:**
- Activity feed (48hr bestie check-in history) — remove entirely
- Social posts/reactions/comments — remove entirely
- Any social content

---

### BESTIES TAB

**Keep:**
- Full bestie list with status indicators
- Add bestie (via phone number, email)
- Pending bestie requests (send/accept/decline)
- Bestie invitations for non-users
- "I See You" messages — keep these, they are warm and on-brand
  - Simplify: remove rate limiting (the 1-per-day restriction). Just let besties send them freely.
  - Keep preset messages + custom message option

**Remove from Besties:**
- Bestie profile pages with full stats/history — not needed. Tapping a bestie can show a simple card (name, photo, phone) but no deep profile page.
- Connection strength scores — remove from UI (leave backend code)
- Featured Circle / "top 5" highlighted section — simplify to just a flat list

---

### PROFILE TAB

**Keep — simplified:**
- Profile photo
- Name and short bio
- Edit profile option
- **Badges** — keep all of them. They are custom, look great, and reward safety behaviour. Display them here. Just don't make them a headline feature.
- Stats (total check-ins, current streak) — keep, simple display
- **Settings** — move all settings here:
  - Notification preferences (Push, SMS, Telegram only — see Notifications section)
  - SMS subscription management (Stripe portal link)
  - Account settings
  - Privacy settings (basic)
  - Data export option

**Remove from Profile:**
- Profile layout selector (8 layout options) — pick ONE clean layout and hardcode it. Remove the layout picker entirely.
- Profile completion progress bar — remove
- The full stats dashboard — keep it simple, just check-in count and streak

---

## Notifications — Active Stack

**Keep and ensure these work:**
- Push notifications (web/PWA)
- SMS via Twilio (paid tier only)
- Telegram notifications

**Hide but do NOT delete:**
- WhatsApp notifications — owner is planning to re-enable later. Hide from settings UI, leave all code in place.
- Facebook notifications — same as above. Hide from UI, leave code.

**Remove entirely:**
- Email notifications — safety alerts going to spam folders defeats the purpose. Remove from notification settings UI and do not send emails for alerts. (Can keep email for account things like password reset if Firebase handles that separately.)

---

## Authentication

**Keep:**
- Google login
- Email/password login

**Remove:**
- Phone number authentication — adds cost and complexity. Remove from the login screen. Leave Firebase Auth code in place in case it's needed later, but do not show it as an option.

---

## Features to Hide/Disable (Not Delete)

These are fully built but not right for MVP. Remove them from the UI but leave all code:

| Feature | Action |
|---------|--------|
| Activity feed | Remove from Home, remove nav link |
| Social posts | Remove from UI |
| Reactions + comments on check-ins | Remove from check-in cards |
| Challenges | Remove page from nav |
| Circle check-ins | Remove page from nav |
| Safety Pacts | Remove page from nav |
| Connection strength scoring | Remove from UI, leave backend |
| "I See You" rate limiting | Remove the restriction — make it unlimited |
| 7 extra profile layouts | Remove layout picker, keep one layout |
| Bestie deep profile pages | Simplify to a basic contact card |
| WhatsApp notifications in settings | Hide toggle |
| Facebook notifications in settings | Hide toggle |
| Email notifications in settings | Remove toggle |
| Phone number login | Remove from login screen |
| Featured Circle / top 5 besties section | Simplify to flat list |
| Profile completion progress | Remove |
| Emergency SOS button | Remove from UI (partially built, leave code) |

---

## Features to Keep Exactly As They Are

Do not touch these — they work and are core:

- Check-in creation flow (timer, location, notes, photos)
- All 4 check-in template quick-buttons
- Extend check-in (+15, +30, +1hr buttons)
- Countdown warnings (10min, 5min, 1min, 30sec) — keep as automatic defaults
- "I'm Safe" button and completion flow
- Cascading alert system (notifies besties one by one until acknowledged)
- Bestie add/invite/accept/decline flow
- SMS alerts via Twilio
- Telegram notifications
- Push notifications
- Stripe payments and SMS subscription ($2/month model)
- Free tier (push only) vs paid tier (SMS) model
- Badges — all of them, as they are
- Admin dashboard (internal use, not user-facing — leave as is)
- Firestore security rules
- All Cloud Functions (even for features being hidden — leave them running)
- All error handling and logging

---

## Tutorial Redesign

The current tutorial is comprehensive but walks users through features we are cutting. Replace it with a new 5-step action-based tutorial that teaches the core loop.

**New Tutorial — 5 Steps:**

1. **"Add your first bestie"**
   - Prompt the user to add one contact
   - Explain: "Your besties are the people who'll check on you if you don't check in safe"
   - Walk them through the add bestie flow

2. **"Create your first check-in"**
   - Prompt them to start a check-in (can be a test one)
   - Show them the timer, the template buttons
   - Explain: "Set a timer before any activity — catching an Uber, a night out, a solo walk"

3. **"This is what your bestie sees"**
   - Show a preview/mockup of what the alert looks like on the bestie's end
   - Build trust: "They'll get a message with your name, what you were doing, and a way to reach you"

4. **"Mark yourself safe"**
   - Have them tap "I'm Safe" to complete the loop
   - Celebrate it — confetti, a badge unlock, something warm

5. **"You're all set"**
   - One screen explaining what happens if they DON'T check in
   - "If you miss your check-in, [bestie name] will be notified. They can call you or acknowledge the alert."
   - Done

**Tutorial rules:**
- Action-based — the user actually does each step, they don't just read
- Only reference features that exist in the MVP
- No mention of social posts, challenges, badges (except the first badge unlock at step 4), or any hidden features
- Should take under 3 minutes to complete

---

## Profile Layout Decision

Pick the single cleanest, simplest layout from the existing 8 options and hardcode it. Suggested criteria: the one that looks best on mobile, shows photo + name + bio clearly, and has a clean section for badges and stats below. Remove the layout picker component from the UI entirely.

---

## What the Home Screen Should Feel Like

The home screen should immediately communicate one thing: **are you safe right now?**

- If no active check-in: calm, with a clear invitation to start one
- If active check-in: urgent and focused — big timer, big "I'm Safe" button, nothing distracting
- No social content, no feed, no noise

---

## Summary Checklist for the Coder

Before you consider this done, verify:

- [ ] Navigation is exactly 3 tabs: Home, Besties, Profile
- [ ] No activity feed anywhere
- [ ] No social posts, reactions, or comments anywhere
- [ ] No challenges page reachable
- [ ] No circle check-ins page reachable
- [ ] No safety pacts page reachable
- [ ] 8 profile layout options reduced to 1 hardcoded layout
- [ ] "I See You" messages work with no rate limiting
- [ ] WhatsApp and Facebook notification toggles are hidden (not deleted)
- [ ] Email notification toggle is removed from settings
- [ ] Phone number login is removed from login screen
- [ ] Countdown warnings fire automatically (not configurable by user)
- [ ] Emergency SOS button is not visible anywhere
- [ ] Tutorial is the new 5-step version
- [ ] SMS subscription (Stripe) still works
- [ ] Badges still appear on Profile tab
- [ ] All 4 check-in template buttons still work on Home
- [ ] Push, SMS, and Telegram notifications all still work
- [ ] Admin dashboard still accessible (internal use)

---

## What NOT to Do

- Do not delete Cloud Functions even for hidden features
- Do not drop any Firestore collections or change database schema
- Do not remove Stripe integration
- Do not remove Twilio or Telegram code
- Do not remove WhatsApp or Facebook code (just hide from UI)
- Do not change Firestore security rules
- Do not remove any badge definitions or badge logic
- Do not touch the landing page

---

*Brief prepared March 2026. All decisions confirmed with app owner.*
