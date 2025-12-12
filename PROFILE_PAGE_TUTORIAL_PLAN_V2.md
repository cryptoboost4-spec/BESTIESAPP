# Profile Page Tutorial - Interactive Implementation Plan

## 🎯 Core Philosophy

**Goal:** Empower users to make their profile their own AND complete essential setup.
**Tone:** Excited friend helping you move into a new space and decorate.
**Approach:** Show → Encourage customization → Celebrate their choices → Guide completion.

---

## 🧠 User Psychology & Flow

### What the user is thinking when they arrive:
- "How do I make this profile look good?"
- "What do my besties see?"
- "Do I have to fill everything out?"
- "What are these badges and stats?"

### What they need to feel:
- **Creative:** I can make this uniquely mine
- **Accomplished:** I'm making progress, unlocking things
- **Motivated:** Badges and stats make this fun
- **In control:** I choose what to share and how

---

## 📱 Tutorial Structure

### Pre-Tutorial: The Invitation (Prompt Card)

**When it shows:**
- First visit to Profile page
- Profile completion < 50% (optional trigger)
- NOT if navigated from settings with specific intent
- User has completed account setup

**Content:**
```
Emoji: ✨
Title: "Let's Make This Profile Yours!"
Body: "Your profile is how your besties see you. Let's customize it, track your progress, and unlock some achievements!"

Highlight Box (purple/pink gradient):
"🎨 Express yourself - make it uniquely you"

Time: "⏱️ 90 seconds • Skip anytime"

Buttons:
- Primary: "Let's Personalize" → starts tutorial
- Secondary (text link): "I'll do it myself" → dismisses
```

**Why this works:**
- "Make it yours" = ownership and creativity
- "Unlock achievements" = gamification hook
- 90 seconds = quick, not overwhelming
- Friendly invitation, not requirement

---

## 🎬 Tutorial Steps (4 Steps)

### Step 1: Profile Card Overview + Quick Edit

**Element Highlighted:** ProfileCard component (the whole visual card)

**Tutorial State:**
- Overlay active
- Profile card glowing, elevated
- Edit button (if exists) is CLICKABLE
- Everything else dimmed

**Tooltip Content:**
```
Position: Below profile card (so card is visible)
Icon: 👤
Title: "This is You!"
Body: "This is how your besties see you. Your photo, colors, and style are all yours to customize. See that edit button? Go ahead and tap it to try changing something!"

Progress: ●○○○

Buttons:
- "Try Customizing" (primary, pulsing) → clicks edit button
- "I Like It As Is" (secondary) → next step
```

**Interactive Flow:**
1. User clicks "Try Customizing" OR clicks edit button directly
2. Tutorial **pauses** (overlay fades to 40% opacity)
3. Profile customizer opens (could be modal or inline editor)
4. User can:
   - **Make changes:** Editor saves → tutorial resumes → celebrate + next step
   - **Cancel/close:** Editor closes → tutorial resumes → stay on step 1 with softer message

**Post-Edit Micro-Celebration:**
If user makes changes:
```
Toast (2 seconds): "Looking good! 🎨"
Position: Bottom-center
Style: Purple gradient, bounce-in
```

**Fallback Message (if closed without changes):**
```
Body: "No worries! You can always customize later. Want to try again, or move on?"

Buttons:
- "Try Again" (secondary)
- "Continue" (primary)
```

**Why this works:**
- Shows profile card first (what besties see)
- Immediate action opportunity (not just passive viewing)
- Celebrates any customization (positive reinforcement)
- No pressure if they don't want to change anything

---

### Step 2: Profile Completion Checklist

**Element Highlighted:** ProfileCompletion component (progress bar + checklist)

**Tutorial State:**
- Overlay active
- Completion section glowing
- Checklist items are CLICKABLE (each one can be tapped)
- Progress bar visible

**Tooltip Content:**
```
Position: Above completion section, centered
Icon: ✅
Title: "Level Up Your Profile"
Body: "See what's left to set up! Each item you complete unlocks features and earns badges. Tap any item to jump right to that setting. Want to knock a few out now?"

Progress: ○●○○

Buttons:
- "I'll Complete Some" (primary) → highlights checklist, lets them click items
- "Later" (secondary) → next step
```

**Interactive Flow:**

**If "I'll Complete Some" clicked:**
1. Tooltip transforms to "mini mode" (smaller, top-right corner)
2. Mini tooltip shows:
   ```
   "Tap any item to set it up! ✨"
   [Continue Tutorial] (small button)
   ```
3. Checklist items become fully interactive:
   - User taps item → navigates to that setting → tutorial pauses
   - User completes setting → returns to profile → tutorial resumes
   - Updated checklist shows progress
4. When user clicks "Continue Tutorial" → next step

**If "Later" clicked:**
- Direct to Step 3

**Why this works:**
- Makes completion actionable, not just informational
- Gamification: "Level up" language
- Mini mode lets them work while tutorial waits
- No pressure, always an escape

---

### Step 3: Badges & Stats (Motivation)

**Element Highlighted:** BadgesSection + StatsSection (both together, or sequentially)

**Tutorial State:**
- Overlay active
- Badges section glowing
- Individual badges are CLICKABLE (show how to earn)
- Stats visible

**Tooltip Content:**
```
Position: Above badges section, centered
Icon: 🏆
Title: "Track Your Achievements"
Body: "Earn badges by checking in, adding besties, and staying active. Your stats show your progress - login streaks, check-ins completed, and more. Tap any badge to see how to unlock it!"

Progress: ○○●○

Buttons:
- "Check Out Badges" (primary) → lets them tap badges to see details
- "Cool, Next" (secondary) → next step
```

**Interactive Flow:**

**If "Check Out Badges" clicked:**
1. Tooltip enters "mini mode" (top-right)
2. Badges become interactive:
   - User taps badge → modal/tooltip shows "How to earn this badge"
   - User can tap multiple badges
3. Stats section animates (numbers count up if static)
4. Mini tooltip: "Tap any badge to learn more! ✨" + [Continue]

**If "Cool, Next" clicked:**
- Direct to Step 4

**Why this works:**
- Motivation through achievement visibility
- Interactive exploration (tap badges)
- Stats provide concrete progress tracking
- Fun, not preachy

---

### Step 4: All Set - Next Steps

**Element Highlighted:** None (or whole profile page with subtle glow)

**Tutorial State:**
- Overlay active (lighter, 60% opacity)
- No specific element highlighted
- Tooltip centered on screen

**Tooltip Content:**
```
Position: Center of screen
Icon: 🎉
Title: "Your Profile is Ready!"
Body: "You can always come back to customize more, complete your checklist, and track your badges. Head to Settings anytime to adjust privacy, notifications, and more. You're all set!"

Progress: ○○○●

Buttons:
- "Finish" (primary, purple gradient with sparkle) → complete tutorial
- "Visit Settings" (secondary, text link) → navigates to settings page
```

**Completion Flow:**
1. User clicks "Finish"
2. Overlay fades out (300ms)
3. Celebration toast appears:
   ```
   🎉 "Profile looking great! Keep it up!"
   Duration: 4 seconds
   Style: Purple gradient, bounce-in
   ```
4. Tutorial state saved
5. Optional: Light confetti (2 seconds)

**If "Visit Settings" clicked:**
1. Save tutorial as completed
2. Navigate to Settings page
3. If Settings tutorial not completed → trigger Settings tutorial
4. If Settings tutorial completed → normal settings view

**Why this works:**
- Clear endpoint with celebration
- Bridges to Settings (natural next step)
- Reinforces that they can always come back
- Positive, accomplished feeling

---

## 🎨 Visual Design Specifications

**[Same as Besties Tutorial - Reuse Styles]**

### Overlay, Highlighting, Tooltips, Progress Dots, Buttons
- Use identical styling to maintain consistency
- Purple/pink gradient theme throughout
- Same z-index layers
- Same animation timings

### Profile-Specific Additions

**Profile Card Highlight:**
```
- Glow effect: More prominent (larger shadow radius)
- Pulse animation: 2s infinite (slower for elegance)
- Border-radius: Matches profile card (could be rounded-xl or custom)
- Elevation: Lift card 8px with shadow
```

**Completion Checklist Interactive States:**
```
When tutorial active:
- Completed items: Green checkmark, green text
- Incomplete items: Purple glow on hover, pointer cursor
- On tap: Haptic feedback + navigate
```

**Badge Interactive States:**
```
When "Check Out Badges" mode active:
- Locked badges: Grayscale with subtle glow
- Unlocked badges: Full color with bounce animation on tap
- On tap: Modal shows badge details + progress
```

---

## 🔧 Technical Implementation Details

### State Management

**Hook:** `useProfileTutorialState`

```javascript
const useProfileTutorialState = () => {
  const [currentStep, setCurrentStep] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [isMiniMode, setIsMiniMode] = useState(false); // for checklist/badge exploration
  const [userMadeChanges, setUserMadeChanges] = useState(false); // track if customization happened

  // Methods
  const startTutorial = () => { /* ... */ };
  const nextStep = () => { /* ... */ };
  const skipTutorial = () => { /* ... */ };
  const completeTutorial = () => { /* ... */ };
  const enterMiniMode = () => { /* ... */ };
  const exitMiniMode = () => { /* ... */ };
  const pauseForNavigation = () => { /* ... */ }; // when checklist item clicked
  const resumeFromNavigation = () => { /* ... */ };

  return { /* ... */ };
};
```

**Storage Schema:**
```javascript
localStorage:
  - 'profile_tutorial_completed': boolean
  - 'profile_tutorial_dismissed': timestamp
  - 'profile_tutorial_current_step': number
  - 'profile_tutorial_customization_done': boolean // celebrate if true

Firestore: users/{userId}/settings/tutorials
  - profile: {
      completed: boolean,
      completedAt: timestamp,
      dismissed: boolean,
      customizationAttempted: boolean,
      checklistItemsCompleted: number // track progress during tutorial
    }
```

### Component Structure

**File:** `frontend/src/components/ProfileTutorialOverlay.jsx`

```javascript
const ProfileTutorialOverlay = ({
  currentStep,
  onStepComplete,
  onSkipTutorial,
  onCompleteTutorial,
  isPaused,
  isMiniMode,
  profileCompletionPercent,
  userCustomizedProfile
}) => {
  // Refs
  const profileCardRef = useRef(null);
  const profileCompletionRef = useRef(null);
  const badgesSectionRef = useRef(null);
  const statsSectionRef = useRef(null);

  // Step configs
  const steps = {
    1: {
      ref: profileCardRef,
      config: {
        title: "This is You!",
        body: "...",
        buttons: [
          { text: "Try Customizing", action: "tryCustomize", primary: true },
          { text: "I Like It As Is", action: "skip", primary: false }
        ]
      }
    },
    // ... more steps
  };

  return (
    <TutorialOverlay
      highlightedElementRef={steps[currentStep]?.ref}
      tooltipConfig={steps[currentStep]?.config}
      currentStep={currentStep}
      totalSteps={4}
      onNext={onStepComplete}
      onSkip={onSkipTutorial}
      isPaused={isPaused}
      isMiniMode={isMiniMode}
    />
  );
};
```

### Integration Points

**File:** `frontend/src/pages/ProfilePage.jsx`

```javascript
// Add refs
<ProfileCard ref={profileCardRef} onEdit={handleEditProfile} />
<ProfileCompletion ref={profileCompletionRef} onItemClick={handleChecklistItemClick} />
<BadgesSection ref={badgesSectionRef} onBadgeClick={handleBadgeClick} />
<StatsSection ref={statsSectionRef} />

// Tutorial integration
{showTutorial && (
  <ProfileTutorialOverlay
    currentStep={tutorialStep}
    onStepComplete={handleTutorialStepComplete}
    onSkipTutorial={handleSkipTutorial}
    onCompleteTutorial={handleCompleteTutorial}
    isPaused={isCustomizerOpen || navigatedToSettings}
    isMiniMode={checklistExplorationMode || badgeExplorationMode}
    profileCompletionPercent={completionPercent}
    userCustomizedProfile={userMadeChanges}
  />
)}

// Handle customization
const handleEditProfile = () => {
  if (tutorialActive && tutorialStep === 1) {
    pauseTutorial();
    openCustomizer();
  }
};

const handleCustomizerClose = (changesMade) => {
  if (tutorialActive && tutorialStep === 1) {
    if (changesMade) {
      setUserMadeChanges(true);
      showToast("Looking good! 🎨", { duration: 2000 });
      setTutorialStep(2);
    }
    resumeTutorial();
  }
};

// Handle checklist navigation
const handleChecklistItemClick = (item) => {
  if (tutorialActive && tutorialStep === 2 && checklistExplorationMode) {
    pauseTutorial();
    navigateToSetting(item);
    // On return, resume tutorial with updated checklist
  }
};
```

---

## 🎯 Interactive Action Handling

### Profile Customization (Step 1)

**Flow:**
1. User clicks "Try Customizing" OR edit button
2. `pauseTutorial()` called → overlay to 40% opacity
3. Customizer opens (modal or inline)
4. User customizes:
   - Changes avatar → save
   - Changes colors → save
   - Changes layout → save
5. User closes customizer:
   - **If changes made:**
     - Save changes
     - Show micro-toast: "Looking good! 🎨"
     - Set `userMadeChanges = true`
     - `resumeTutorial()` → advance to Step 2
   - **If no changes:**
     - Close customizer
     - `resumeTutorial()` → stay on Step 1
     - Update tooltip to softer retry message

### Checklist Exploration (Step 2)

**Flow:**
1. User clicks "I'll Complete Some"
2. Tooltip enters mini mode (shrinks to top-right)
3. Mini tooltip shows: "Tap any item to set it up! ✨" + [Continue Tutorial]
4. Checklist items become interactive:
   - On tap: Navigate to that setting screen
   - Tutorial pauses, remembers state
5. User completes setting → returns to profile:
   - Tutorial resumes in mini mode
   - Checklist updates (item now checked)
   - Mini tooltip still visible
6. User clicks "Continue Tutorial" → exit mini mode → Step 3

**Technical:**
```javascript
const handleChecklistItemClick = (settingKey) => {
  if (tutorialActive && tutorialStep === 2 && checklistExplorationMode) {
    // Save current state
    saveTutorialState({ step: 2, mode: 'checklist_exploration' });

    // Navigate
    navigateToSetting(settingKey); // e.g., /settings#notifications

    // Tutorial pauses
    pauseTutorial();
  }
};

// On return to profile (useEffect or route guard)
useEffect(() => {
  const savedState = loadTutorialState();
  if (savedState && savedState.mode === 'checklist_exploration') {
    // Resume tutorial in mini mode
    resumeTutorial();
    setChecklistExplorationMode(true);
    setIsMiniMode(true);
  }
}, [location]); // React Router
```

### Badge Exploration (Step 3)

**Flow:**
1. User clicks "Check Out Badges"
2. Tooltip enters mini mode
3. Badges become interactive:
   - User taps badge → modal shows "How to unlock"
   - Modal has close button
   - User can tap multiple badges
4. Mini tooltip: [Continue Tutorial]
5. User clicks Continue → exit mini mode → Step 4

---

## 🚨 Edge Cases & Error Handling

### 1. Profile Already Highly Customized
**Problem:** User already customized profile before tutorial
**Solution:**
- Skip Step 1 customization action
- Acknowledge: "Nice! Your profile already looks great. Let's see what else..."
- Jump to Step 2

### 2. Profile Completion Already 100%
**Problem:** Nothing on checklist to complete
**Solution:**
- Step 2 becomes informational only
- Body: "Wow! You've completed everything. Nice work! Your profile is fully set up."
- Skip mini mode, just celebrate and move to Step 3

### 3. No Badges Earned Yet
**Problem:** Badge section is empty
**Solution:**
- Show locked badges (grayed out)
- Body: "These are the badges you can unlock. Tap any to see how to earn it!"
- Make locked badges tappable to show unlock criteria

### 4. Navigation to Settings During Tutorial
**Problem:** User clicks checklist item, goes to settings, tutorial unclear
**Solution:**
- Show unobtrusive indicator that tutorial is paused:
  ```
  Top-right corner: "Tutorial paused • Resume on Profile"
  ```
- Save state to resume on return

### 5. User Customizes but Doesn't Save
**Problem:** Opens customizer, makes changes, clicks cancel
**Solution:**
- Treat as "no changes made"
- Stay on Step 1
- Softer retry message

### 6. Slow Loading Badges/Stats
**Problem:** Badges/stats still loading when Step 3 reached
**Solution:**
- Show loading skeleton during tutorial
- Tutorial waits (show "Loading your achievements...")
- Once loaded, continue with normal step

---

## 📊 Analytics Tracking

**Events to Track:**
```javascript
// Tutorial lifecycle
analytics.track('tutorial_started', { page: 'profile' });
analytics.track('tutorial_step_completed', { page: 'profile', step: 2 });
analytics.track('tutorial_completed', { page: 'profile', duration_seconds: 95 });
analytics.track('tutorial_skipped', { page: 'profile', at_step: 3 });

// Interactive actions
analytics.track('tutorial_customization_attempted', { page: 'profile' });
analytics.track('tutorial_customization_completed', { page: 'profile', changes: ['avatar', 'colors'] });
analytics.track('tutorial_customization_cancelled', { page: 'profile' });

analytics.track('tutorial_checklist_explored', { page: 'profile' });
analytics.track('tutorial_checklist_item_clicked', { page: 'profile', item: 'notifications' });
analytics.track('tutorial_checklist_item_completed', { page: 'profile', item: 'notifications' });

analytics.track('tutorial_badge_clicked', { page: 'profile', badge_id: 'first_checkin' });

// Navigation
analytics.track('tutorial_navigated_to_settings', { page: 'profile', from_step: 4 });

// Completion metrics
analytics.track('tutorial_profile_completion_before', { percent: 30 });
analytics.track('tutorial_profile_completion_after', { percent: 65 });
```

---

## ✅ Success Criteria

**User completes tutorial when they:**
- [ ] Understand their profile is customizable
- [ ] Know how to access customization
- [ ] Understand the completion checklist
- [ ] Discovered badges and stats
- [ ] Know where to go next (Settings)

**Tutorial is successful when:**
- [ ] >65% completion rate
- [ ] >40% of users customize during tutorial
- [ ] Profile completion % increases after tutorial
- [ ] Users who complete it have higher badge unlock rates
- [ ] Average completion time: 60-90 seconds

---

## 🎉 Celebration & Completion

**Completion Toast:**
```
Icon: 🎉
Message: "Profile looking great! Keep it up!"
Duration: 4 seconds
Style: Purple gradient, white text
Position: Center-bottom
Animation: Bounce in, fade out
```

**Confetti (Optional):**
```
Trigger: On completion
Duration: 2 seconds
Style: Purple, pink, gold confetti
Density: Light (15-25 pieces)
```

**State Updates:**
```javascript
localStorage.setItem('profile_tutorial_completed', true);
localStorage.setItem('profile_tutorial_completed_at', Date.now());

await updateDoc(doc(db, 'users', userId, 'settings', 'tutorials'), {
  'profile.completed': true,
  'profile.completedAt': serverTimestamp(),
  'profile.customizationAttempted': userMadeChanges
});
```

---

## 🔄 Restart Tutorial

**Same as Besties tutorial:**
Settings > Tutorials > Profile Tutorial > [Restart Tutorial]

---

## 📝 Testing Checklist

- [ ] Prompt card shows on first visit
- [ ] Tutorial doesn't show if already completed
- [ ] Step 1 highlights profile card
- [ ] Step 1 edit button clickable
- [ ] Customizer opens when "Try Customizing" clicked
- [ ] Customization saves and advances to Step 2
- [ ] Customization cancel stays on Step 1
- [ ] Retry message shows after cancel
- [ ] Micro-toast shows after customization
- [ ] Step 2 highlights completion checklist
- [ ] Mini mode activates when "I'll Complete Some" clicked
- [ ] Checklist items clickable in mini mode
- [ ] Navigation to settings pauses tutorial
- [ ] Return from settings resumes tutorial
- [ ] Checklist updates when items completed
- [ ] Step 3 highlights badges section
- [ ] Badges clickable in exploration mode
- [ ] Badge modals show unlock criteria
- [ ] Stats section visible and formatted
- [ ] Step 4 shows completion message
- [ ] "Visit Settings" navigates correctly
- [ ] Completion toast shows
- [ ] Tutorial state saved correctly
- [ ] Tutorial can be restarted from Settings
- [ ] Already-customized profiles skip customization step
- [ ] 100% complete profiles show celebration on Step 2
- [ ] Empty badges show locked state
- [ ] Dark mode works correctly
- [ ] Mobile responsive
- [ ] Smooth animations
- [ ] No console errors

---

**End of Profile Page Tutorial Plan**
