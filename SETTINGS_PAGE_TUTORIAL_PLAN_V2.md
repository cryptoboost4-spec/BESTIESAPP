# Settings Page Tutorial - Interactive Implementation Plan

## 🎯 Core Philosophy

**Goal:** Guide users to configure essential safety settings while respecting their autonomy.
**Tone:** Knowledgeable friend helping you set up important stuff, not pushy salesperson.
**Approach:** Explain why it matters → Show how → Encourage (don't force) → Celebrate choices.

---

## 🧠 User Psychology & Flow

### What the user is thinking when they arrive:
- "Which settings are actually important?"
- "Do I have to enable everything?"
- "Will this cost money? (SMS, phone calls)"
- "Is this private and secure?"
- "Can I change these later?"

### What they need to feel:
- **Informed:** I understand what each setting does
- **In control:** I'm choosing, not being forced
- **Safe:** My information is secure
- **Confident:** I've set this up correctly
- **Empowered:** I can change anything anytime

---

## 📱 Tutorial Structure

### Pre-Tutorial: The Invitation (Prompt Card)

**When it shows:**
- First visit to Settings page
- OR Profile completion < 30% and notification settings not configured
- NOT if navigated from Profile tutorial with specific intent
- NOT if navigated from error/warning about missing settings

**Content:**
```
Emoji: ⚙️
Title: "Let's Set Up Your Safety Settings"
Body: "We'll walk you through notifications, privacy, and how to connect with besties. Everything is optional, but these settings help keep you safe. You're in control!"

Highlight Box (blue gradient - trustworthy, not pushy):
"🔒 Your privacy matters - you choose what to share"

Time: "⏱️ 2-3 minutes • Skip or change anything"

Buttons:
- Primary: "Get Started" → starts tutorial
- Secondary (text link): "I'll set it up myself" → dismisses
```

**Why this works:**
- "Safety settings" = clear purpose
- "Everything is optional" = removes pressure immediately
- "You're in control" = autonomy respected
- Blue (not purple) = trust, not urgency
- Shows time range (2-3 min) acknowledging it varies

---

## 🎬 Tutorial Steps (5 Steps - Essential Settings Only)

### Step 1: Notifications Overview

**Element Highlighted:** NotificationSettings section (entire section)

**Tutorial State:**
- Overlay active
- Notification section glowing
- Toggle switches are VISIBLE but not yet interactive
- Everything else dimmed

**Tooltip Content:**
```
Position: Above notification section, centered
Icon: 🔔
Title: "Stay Connected with Your Besties"
Body: "Notifications let your besties reach you in emergencies. You can choose how to be notified: push, email, SMS, or phone calls. You don't need all of them - pick what works for you!"

Important Note (small, gray text):
"📱 SMS and calls may use your plan minutes/messages. Check with your carrier."

Progress: ●○○○○

Buttons:
- "Let Me Choose" (primary) → enables interactive mode
- "Skip For Now" (secondary) → next step
```

**Interactive Flow:**

**If "Let Me Choose" clicked:**
1. Tooltip transforms to **mini mode** (compact, top-right corner)
2. Mini tooltip shows:
   ```
   "Toggle the ones you want! ✨"
   Progress: ●○○○○
   [Continue] (small button)
   ```
3. Notification toggles become fully interactive:
   - User can toggle Push, Email, SMS, Phone
   - Each toggle shows micro-confirmation:
     - ON: Green checkmark animation
     - OFF: Gray, no animation
   - Real-time save (auto-save on toggle)
4. When user clicks "Continue" → celebrate choices → next step

**Celebration Message (when Continue clicked):**
```
Toast (2 sec): "Great choices! 📱" (if any enabled)
OR
Toast (2 sec): "No problem! You can enable these anytime." (if none enabled)
```

**If "Skip For Now" clicked:**
- Advance to Step 2
- No judgment, no warning

**Why this works:**
- Explains WHY notifications matter (emergency contact)
- Shows WHAT options exist (push, email, SMS, phone)
- Addresses cost concern upfront (transparency)
- User makes real choices, not just learning
- Mini mode lets them work at their pace
- Celebrates any choice (enabled or not)

---

### Step 2: Phone Number Verification (If Enabled)

**Conditional Step:** Only shows if user enabled SMS or Phone notifications in Step 1

**Element Highlighted:** Phone number input field + "Send Code" button

**Tutorial State:**
- Overlay active
- Phone input section glowing, interactive
- Verification flow is LIVE (they'll actually verify)

**Tooltip Content:**
```
Position: Above phone input, centered
Icon: 📞
Title: "Verify Your Phone Number"
Body: "Since you enabled phone notifications, let's verify your number. We'll send you a code - enter it and you're all set! This ensures your besties can reach you when it matters."

Progress: ○●○○○ (or ●○○○ if phone not enabled)

Buttons:
- "Send Code Now" (primary, glowing) → clicks "Send Code" button
- "I'll Do This Later" (secondary) → skip to next step
```

**Interactive Flow:**

**If "Send Code Now" clicked OR user manually enters number + clicks Send:**
1. Tutorial pauses (overlay 40% opacity, still visible)
2. Phone verification flow activates (native functionality):
   - User enters phone number
   - Clicks "Send Code"
   - Receives SMS with code
   - Enters code
   - Verification succeeds or fails

3. **On success:**
   - Show success toast: "Phone verified! 🎉"
   - Tutorial resumes → advance to next step
   - Mini celebration (green checkmark animation)

4. **On failure/error:**
   - Show error toast: "Couldn't verify. Try again?"
   - Tutorial resumes → stays on Step 2
   - Offers retry or skip

**If "I'll Do This Later" clicked:**
- Save preference: phone_verification_postponed
- Advance to next step
- No judgment

**Why this works:**
- Only shows if relevant (conditional)
- Explains WHY verification matters
- Real verification (not demo)
- Handles success and failure gracefully
- Respects postponement choice

---

### Step 3: Messenger Integration (Optional But Encouraged)

**Element Highlighted:** MessengerLinkDisplay section (if Messenger feature enabled)

**Tutorial State:**
- Overlay active
- Messenger section glowing
- Link display and copy button visible
- QR code visible (if implemented)

**Tooltip Content:**
```
Position: Above messenger section, centered
Icon: 💬
Title: "Free Unlimited Alerts with Messenger"
Body: "Connect your Facebook Messenger to get free alerts - no SMS charges, ever! Just share your unique link with besties or have them scan your QR code. It's instant and unlimited!"

Highlight (green box):
"💚 Totally free - no carrier charges"

Progress: ○○●○○ (or adjusted if phone step skipped)

Buttons:
- "Copy My Link" (primary) → copies messenger link to clipboard
- "I Don't Use Messenger" (secondary) → next step
```

**Interactive Flow:**

**If "Copy My Link" clicked:**
1. Copy Messenger link to clipboard
2. Show success toast:
   ```
   "Link copied! Share it with your besties 📋"
   Duration: 3 seconds
   Style: Green gradient (free = green theme)
   ```
3. Tutorial advances to next step automatically (after 2 sec delay)

**If user clicks QR code (if visible):**
1. Expand QR code in modal
2. Tutorial pauses
3. User can download/share QR
4. On modal close → resume tutorial, stay on step 3
5. User clicks Continue → next step

**If "I Don't Use Messenger" clicked:**
- Advance to next step
- No tracking (privacy respected)

**Why this works:**
- Highlights "free" benefit (addresses cost concern)
- Makes it actionable (copy link right now)
- QR code as alternative (visual, easy)
- Respects non-users (no pressure)
- Auto-advances after copy (smooth flow)

---

### Step 4: Privacy Settings (Quick Overview)

**Element Highlighted:** PrivacySettings section

**Tutorial State:**
- Overlay active
- Privacy section glowing
- Toggle switches and dropdowns are INTERACTIVE
- Mini mode available for exploration

**Tooltip Content:**
```
Position: Above privacy section, centered
Icon: 🔒
Title: "Control Your Privacy"
Body: "Choose who sees your check-ins and profile info. You can set defaults here, and change them for each check-in if you want. Your data, your rules!"

Progress: ○○○●○ (or adjusted based on previous steps)

Buttons:
- "Set My Preferences" (primary) → mini mode, lets them adjust
- "Defaults Are Fine" (secondary) → next step
```

**Interactive Flow:**

**If "Set My Preferences" clicked:**
1. Tooltip enters mini mode (top-right)
2. Mini tooltip:
   ```
   "Adjust your privacy settings! 🔒"
   [Continue]
   ```
3. Privacy toggles/dropdowns become interactive:
   - Who can see check-ins (Besties Only / Public / Custom)
   - Profile visibility
   - Location sharing defaults
   - Real-time save on change
4. User makes changes, clicks Continue → celebrate → next step

**Celebration (when Continue clicked):**
```
Toast: "Privacy settings saved! 🔒"
Duration: 2 seconds
Style: Blue gradient (trust theme)
```

**If "Defaults Are Fine" clicked:**
- Show what defaults are (1-line summary):
  ```
  "Default: Besties-only check-ins, private profile. You can change anytime!"
  ```
- Advance to next step

**Why this works:**
- Emphasizes user control ("Your data, your rules")
- Shows they can adjust per-check-in (flexibility)
- Makes defaults clear (transparency)
- Celebrates their choices
- No pressure to change defaults

---

### Step 5: All Set - You're In Control

**Element Highlighted:** None (or whole settings page with subtle glow)

**Tutorial State:**
- Overlay active (lighter, 50% opacity)
- No specific element highlighted
- Tooltip centered on screen

**Tooltip Content:**
```
Position: Center of screen
Icon: ✅
Title: "You're All Set Up!"
Body: "Your safety settings are configured! Remember:
• You can change any setting anytime
• Test your notifications to make sure they work
• Add more besties to build your safety network
• Check back here to adjust as you go

You're in control - these are YOUR settings for YOUR safety."

Progress: ○○○○● (or adjusted)

Buttons:
- "Test My Notifications" (primary, glowing) → opens test notification modal
- "Finish Setup" (secondary) → complete tutorial
```

**Interactive Flow:**

**If "Test My Notifications" clicked:**
1. Tutorial pauses
2. Test notification modal opens:
   ```
   Modal: "Test Your Notifications"
   Body: "We'll send a test alert to all enabled channels. Check that you receive it!"
   [Send Test Alert]
   ```
3. User clicks Send Test Alert:
   - System sends test to all enabled channels
   - Modal shows: "Test sent! Check your notifications."
   - User clicks OK → modal closes
4. Tutorial resumes → shows completion flow

**If "Finish Setup" clicked directly:**
- Go to completion flow

**Completion Flow:**
1. Overlay fades out (300ms)
2. **Summary toast** appears (center-bottom):
   ```
   🎉 "Settings saved! You're ready to stay safe with your besties!"
   Duration: 5 seconds
   Style: Purple gradient, larger text
   Action: [Go to Profile] (optional link)
   ```
3. Tutorial state saved
4. Optional: Confetti (2 sec, purple/gold)
5. If notifications enabled: Show encouragement badge/achievement

**Why this works:**
- Clear summary of what was accomplished
- Reinforcement that they can change anything
- Test option builds confidence
- Multiple paths to completion (test or finish)
- Celebration feels earned
- Bridges to next step (Profile or Home)

---

## 🎨 Visual Design Specifications

**[Mostly same as Besties/Profile, with Settings-specific additions]**

### Color Theme: Trust & Safety (Blue + Purple)
- Primary actions: Purple gradient (consistency)
- Trust/privacy elements: Blue gradient
- Success states: Green
- Neutral: Gray

### Settings Section Highlighting
```
- Glow: Blue-purple gradient shadow
- Pulse: Slower (2.5s) for readability
- Border-radius: 16px (larger sections)
- Elevation: 4px lift
```

### Toggle Switches During Tutorial
```
When interactive:
- ON state: Green background, white checkmark, subtle bounce animation
- OFF state: Gray background, white X
- Transition: 300ms ease
- Haptic feedback: Light vibration on toggle

When locked (before interactive mode):
- Dimmed: 60% opacity
- Cursor: not-allowed
- No hover state
```

### Mini Mode Tooltip (Settings Specific)
```
Position: Top-right corner, fixed
Size: 200px x 80px (compact)
Content: Icon + 1-line message + [Continue] button
Style: Same gradient, smaller padding
z-index: 10003 (above everything)
Animation: Slide in from top-right
```

---

## 🔧 Technical Implementation Details

### State Management

**Hook:** `useSettingsTutorialState`

```javascript
const useSettingsTutorialState = () => {
  const [currentStep, setCurrentStep] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [isMiniMode, setIsMiniMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState({
    push: false,
    email: false,
    sms: false,
    phone: false
  });
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [messengerLinked, setMessengerLinked] = useState(false);
  const [userChangedSettings, setUserChangedSettings] = useState(false);

  // Methods
  const startTutorial = () => { /* ... */ };
  const nextStep = () => {
    // Skip phone verification step if SMS/phone not enabled
    if (currentStep === 1 && !notificationsEnabled.sms && !notificationsEnabled.phone) {
      setCurrentStep(3); // Skip step 2
    } else {
      setCurrentStep(currentStep + 1);
    }
  };
  const skipTutorial = () => { /* ... */ };
  const completeTutorial = () => { /* ... */ };
  const enterMiniMode = () => { /* ... */ };
  const exitMiniMode = () => { /* ... */ };

  return { /* ... */ };
};
```

**Storage Schema:**
```javascript
localStorage:
  - 'settings_tutorial_completed': boolean
  - 'settings_tutorial_dismissed': timestamp
  - 'settings_tutorial_current_step': number
  - 'settings_tutorial_notifications_configured': object
  - 'settings_tutorial_test_sent': boolean

Firestore: users/{userId}/settings/tutorials
  - settings: {
      completed: boolean,
      completedAt: timestamp,
      dismissed: boolean,
      notificationsConfigured: {
        push: boolean,
        email: boolean,
        sms: boolean,
        phone: boolean
      },
      phoneVerified: boolean,
      messengerLinked: boolean,
      privacyConfigured: boolean,
      testNotificationSent: boolean
    }
```

### Component Structure

**File:** `frontend/src/components/SettingsTutorialOverlay.jsx`

```javascript
const SettingsTutorialOverlay = ({
  currentStep,
  onStepComplete,
  onSkipTutorial,
  onCompleteTutorial,
  isPaused,
  isMiniMode,
  notificationsEnabled,
  phoneVerified,
  onNotificationToggle, // callback for real toggle actions
  onPhoneVerify, // callback for verification
  onMessengerCopy, // callback for link copy
  onPrivacyChange // callback for privacy changes
}) => {
  // Refs
  const notificationSettingsRef = useRef(null);
  const phoneVerificationRef = useRef(null);
  const messengerLinkRef = useRef(null);
  const privacySettingsRef = useRef(null);

  // Determine if step 2 should be shown
  const showPhoneStep = notificationsEnabled.sms || notificationsEnabled.phone;

  // Step configs
  const steps = {
    1: {
      ref: notificationSettingsRef,
      config: { /* notification step */ }
    },
    2: showPhoneStep ? {
      ref: phoneVerificationRef,
      config: { /* phone verification step */ }
    } : null,
    3: {
      ref: messengerLinkRef,
      config: { /* messenger step */ }
    },
    4: {
      ref: privacySettingsRef,
      config: { /* privacy step */ }
    },
    5: {
      ref: null,
      config: { /* completion step */ }
    }
  };

  // Filter out null steps
  const activeSteps = Object.entries(steps)
    .filter(([_, step]) => step !== null)
    .reduce((acc, [key, step]) => ({ ...acc, [key]: step }), {});

  return (
    <TutorialOverlay
      highlightedElementRef={activeSteps[currentStep]?.ref}
      tooltipConfig={activeSteps[currentStep]?.config}
      currentStep={currentStep}
      totalSteps={Object.keys(activeSteps).length}
      onNext={onStepComplete}
      onSkip={onSkipTutorial}
      isPaused={isPaused}
      isMiniMode={isMiniMode}
    />
  );
};
```

### Integration Points

**File:** `frontend/src/pages/SettingsPage.jsx`

```javascript
// Add refs to settings sections
<NotificationSettings
  ref={notificationSettingsRef}
  onToggle={handleNotificationToggle}
  tutorialActive={tutorialActive}
  tutorialInteractive={tutorialStep === 1 && miniMode}
/>

<PhoneVerification
  ref={phoneVerificationRef}
  onVerify={handlePhoneVerify}
  tutorialActive={tutorialActive}
/>

<MessengerLinkDisplay
  ref={messengerLinkRef}
  onCopyLink={handleMessengerCopy}
  tutorialActive={tutorialActive}
/>

<PrivacySettings
  ref={privacySettingsRef}
  onChange={handlePrivacyChange}
  tutorialActive={tutorialActive}
  tutorialInteractive={tutorialStep === 4 && miniMode}
/>

// Tutorial overlay
{showTutorial && (
  <SettingsTutorialOverlay
    currentStep={tutorialStep}
    onStepComplete={handleTutorialStepComplete}
    onSkipTutorial={handleSkipTutorial}
    onCompleteTutorial={handleCompleteTutorial}
    isPaused={isVerificationModalOpen || isTestModalOpen}
    isMiniMode={miniMode}
    notificationsEnabled={notificationState}
    phoneVerified={phoneVerified}
    onNotificationToggle={handleNotificationToggle}
    onPhoneVerify={handlePhoneVerify}
    onMessengerCopy={handleMessengerCopy}
    onPrivacyChange={handlePrivacyChange}
  />
)}

// Handle notification toggles during tutorial
const handleNotificationToggle = (type, enabled) => {
  if (tutorialActive && tutorialStep === 1 && miniMode) {
    // Real toggle action
    updateNotificationSettings(type, enabled);
    setNotificationState(prev => ({ ...prev, [type]: enabled }));

    // Micro-feedback
    if (enabled) {
      // Green checkmark animation
      showMicroSuccess(type);
    }

    // Track for tutorial state
    setUserChangedSettings(true);
  }
};

// Handle phone verification during tutorial
const handlePhoneVerify = async (phoneNumber, code) => {
  if (tutorialActive && tutorialStep === 2) {
    pauseTutorial();

    const result = await verifyPhoneNumber(phoneNumber, code);

    if (result.success) {
      setPhoneVerified(true);
      showToast("Phone verified! 🎉", { duration: 3000, type: 'success' });
      resumeTutorial();
      // Advance to next step
      setTutorialStep(3);
    } else {
      showToast("Couldn't verify. Try again?", { duration: 3000, type: 'error' });
      resumeTutorial();
      // Stay on step 2 for retry
    }
  }
};
```

---

## 🎯 Interactive Action Handling

### Notification Toggles (Step 1)

**Flow:**
1. User clicks "Let Me Choose"
2. Mini mode activates
3. Toggles become interactive:
   - Push: Toggle ON → save to Firestore → micro-success animation
   - Email: Toggle OFF → save → no animation
   - SMS: Toggle ON → save → micro-success → (will trigger Step 2)
   - Phone: Toggle ON → save → micro-success → (will trigger Step 2)
4. Each toggle auto-saves immediately (no "Save" button)
5. User clicks "Continue" → celebrate → next step

**Micro-Success Animation:**
```javascript
const showMicroSuccess = (toggleType) => {
  // Green checkmark appears next to toggle
  const checkmark = document.createElement('div');
  checkmark.className = 'absolute text-green-500 animate-ping';
  checkmark.innerHTML = '✓';
  // Position next to toggle
  // Fade out after 1 second
};
```

### Phone Verification (Step 2)

**Flow:**
1. User clicks "Send Code Now" OR manually enters number + sends
2. Tutorial pauses (overlay 40% opacity)
3. Phone verification UI becomes active:
   - Input: Phone number
   - Button: "Send Code"
   - User enters number → clicks Send
   - Code sent via SMS
   - Input: Verification code
   - User enters code → submits
4. Verification result:
   - **Success:**
     - Toast: "Phone verified! 🎉"
     - Tutorial resumes → auto-advance to Step 3
   - **Failure:**
     - Toast: "Couldn't verify. Try again?"
     - Tutorial resumes → stays on Step 2
     - Retry available
5. User can skip anytime

### Messenger Link Copy (Step 3)

**Flow:**
1. User clicks "Copy My Link"
2. Copy to clipboard
3. Success toast: "Link copied! Share it with your besties 📋"
4. Auto-advance to Step 4 (after 2 sec delay)

**Alternative (QR Code):**
1. User clicks QR code
2. Modal opens with larger QR
3. Tutorial pauses
4. User downloads/shares QR
5. Modal closes → tutorial resumes on Step 3
6. User clicks Continue → Step 4

### Privacy Settings (Step 4)

**Flow:**
1. User clicks "Set My Preferences"
2. Mini mode activates
3. Privacy controls become interactive:
   - Dropdown: Who can see check-ins → change → auto-save
   - Toggle: Profile visibility → toggle → auto-save
   - Dropdown: Location sharing → change → auto-save
4. Each change saves immediately
5. User clicks Continue → celebrate → Step 5

---

## 🚨 Edge Cases & Error Handling

### 1. Notifications Already Configured
**Problem:** User already enabled notifications
**Solution:**
- Step 1 acknowledges: "Nice! You've already set up notifications. Want to adjust them, or move on?"
- Buttons: [Adjust] [Continue]

### 2. Phone Already Verified
**Problem:** User's phone is already verified
**Solution:**
- Skip Step 2 entirely
- Jump from Step 1 → Step 3

### 3. Messenger Not Available (Feature Flag Off)
**Problem:** Messenger feature disabled
**Solution:**
- Skip Step 3 entirely
- Adjust step numbering dynamically

### 4. SMS Verification Fails (Network Issue)
**Problem:** SMS doesn't arrive
**Solution:**
- Show retry option: "Didn't get it? [Resend Code]"
- Alternative: "Having trouble? [Skip for now]"
- Log error for debugging

### 5. User Exits Settings Mid-Tutorial
**Problem:** Navigates away during tutorial
**Solution:**
- Save state: `settings_tutorial_paused_at_step: 3`
- On return (within 10 min): "Resume tutorial?"
- After 10 min: Clear state (too stale)

### 6. Cost Warning for SMS/Phone (International Users)
**Problem:** SMS/calls might be expensive in some countries
**Solution:**
- Add country-specific warnings:
  ```
  "📱 Note: SMS charges may apply in your country. Check with your carrier, or use free Messenger instead!"
  ```

### 7. Privacy Defaults Already Strict
**Problem:** User has already set strict privacy
**Solution:**
- Step 4 celebrates: "Your privacy is already locked down. Nice! Want to review, or continue?"

---

## 📊 Analytics Tracking

**Events to Track:**
```javascript
// Tutorial lifecycle
analytics.track('tutorial_started', { page: 'settings' });
analytics.track('tutorial_step_completed', { page: 'settings', step: 2 });
analytics.track('tutorial_completed', { page: 'settings', duration_seconds: 145 });
analytics.track('tutorial_skipped', { page: 'settings', at_step: 4 });

// Notification actions
analytics.track('tutorial_notification_enabled', { type: 'push' });
analytics.track('tutorial_notification_enabled', { type: 'sms' });
analytics.track('tutorial_notification_disabled', { type: 'email' });

// Phone verification
analytics.track('tutorial_phone_verification_started');
analytics.track('tutorial_phone_verification_success');
analytics.track('tutorial_phone_verification_failed', { reason: 'invalid_code' });
analytics.track('tutorial_phone_verification_skipped');

// Messenger
analytics.track('tutorial_messenger_link_copied');
analytics.track('tutorial_messenger_qr_viewed');
analytics.track('tutorial_messenger_skipped');

// Privacy
analytics.track('tutorial_privacy_changed', { setting: 'checkin_visibility', value: 'besties_only' });

// Test notification
analytics.track('tutorial_test_notification_sent');

// Completion metrics
analytics.track('tutorial_settings_completion_summary', {
  notifications_enabled: ['push', 'sms'],
  phone_verified: true,
  messenger_linked: false,
  privacy_changed: true,
  test_sent: true
});
```

---

## ✅ Success Criteria

**User completes tutorial when they:**
- [ ] Understand notification options
- [ ] Have enabled at least one notification method (or consciously skipped)
- [ ] Verified phone if SMS/phone enabled
- [ ] Know about free Messenger option
- [ ] Understand privacy settings
- [ ] Feel confident in their choices

**Tutorial is successful when:**
- [ ] >60% completion rate
- [ ] >75% of users enable at least one notification
- [ ] >50% verify phone if SMS enabled
- [ ] >30% copy Messenger link
- [ ] >40% adjust privacy settings
- [ ] >50% send test notification
- [ ] Users feel informed, not pressured

---

## 🎉 Celebration & Completion

**Completion Toast (Detailed Summary):**
```
Icon: 🎉
Title: "Settings saved! You're ready!"
Body: [Context-aware summary based on actions taken]

Examples:
- "You enabled SMS & email alerts, verified your phone, and set your privacy to besties-only. You're all set up!"
- "You chose to skip notifications for now - you can always enable them later in Settings!"
- "You copied your Messenger link and set your privacy. Nice work!"

Duration: 6 seconds (longer for summary)
Style: Purple gradient
Position: Center-bottom
Action Buttons:
  - [Test Notifications] (if any enabled)
  - [Done]
Animation: Slide up, bounce, fade
```

**Optional Confetti:**
```
Trigger: On completion (only if user enabled notifications)
Duration: 3 seconds
Style: Purple, gold, green confetti
Density: Medium (30-40 pieces)
```

**Achievement Badge (if implemented):**
```
If user enabled notifications AND verified phone:
  Unlock badge: "Safety First" or "Connected"
  Show badge unlock animation
```

**State Updates:**
```javascript
localStorage.setItem('settings_tutorial_completed', true);
localStorage.setItem('settings_tutorial_completed_at', Date.now());
localStorage.setItem('settings_tutorial_summary', JSON.stringify({
  notificationsEnabled: notificationState,
  phoneVerified,
  messengerLinked,
  privacyConfigured,
  testSent
}));

await updateDoc(doc(db, 'users', userId, 'settings', 'tutorials'), {
  'settings.completed': true,
  'settings.completedAt': serverTimestamp(),
  'settings.notificationsConfigured': notificationState,
  'settings.phoneVerified': phoneVerified,
  'settings.messengerLinked': messengerLinked,
  'settings.privacyConfigured': privacyConfigured
});
```

---

## 🔄 Restart Tutorial

**Same as other tutorials:**
Settings > Tutorials > Settings Tutorial > [Restart Tutorial]

**Special Note:**
- Restarting doesn't reset actual settings (notification prefs, privacy)
- Only resets tutorial state
- User can walk through again to review

---

## 📝 Testing Checklist

- [ ] Prompt card shows on first visit
- [ ] Tutorial doesn't show if already completed
- [ ] Step 1 highlights notification section
- [ ] Notification toggles work in mini mode
- [ ] Micro-success animations show on toggle
- [ ] Step 2 shows only if SMS/phone enabled
- [ ] Step 2 skips if SMS/phone not enabled
- [ ] Phone verification flow works (send code)
- [ ] Phone verification success advances to Step 3
- [ ] Phone verification failure stays on Step 2
- [ ] Phone verification skip works
- [ ] Step 3 highlights messenger section
- [ ] Copy link works and shows toast
- [ ] Copy link auto-advances to Step 4
- [ ] QR code modal works (if implemented)
- [ ] Step 4 highlights privacy section
- [ ] Privacy controls work in mini mode
- [ ] Privacy changes auto-save
- [ ] Step 5 shows completion summary
- [ ] Test notification button works
- [ ] Test modal sends test to all enabled channels
- [ ] Completion toast shows correct summary
- [ ] Tutorial state saved correctly
- [ ] Analytics events fire correctly
- [ ] Tutorial can be restarted
- [ ] Restart doesn't reset actual settings
- [ ] Dark mode works
- [ ] Mobile responsive
- [ ] Smooth animations
- [ ] No console errors
- [ ] International cost warning shows (if applicable)
- [ ] Already-configured settings skip gracefully
- [ ] Navigation away saves state
- [ ] Return offers resume

---

**End of Settings Page Tutorial Plan**
