# Profile Page Tutorial Plan (Improved)

## Overview
Tutorial to guide users through profile customization, badges, stats, and profile completion features.

## Target Audience
- New users setting up their profile
- Users who haven't customized their profile
- Users with incomplete profiles

## Prompt Card (Before Tutorial Starts)
**Component**: TutorialPromptCard (reuse from home tutorial)
**Content**:
- Emoji: ✨
- Title: "Let's Personalize Your Profile"
- Body: "We'll show you how to customize it, track your progress, and earn badges. Takes about 1.5 minutes."
- Highlight: "✅ Make it yours - express your unique style"
- Time estimate: "⏱️ About 1.5 minutes. You can skip anytime."
- Actions:
  - "Start Tutorial" button
  - "Skip - I'll explore on my own" link

## Tutorial Steps

### Step 1: Profile Card Introduction
**Element**: ProfileCard component
**Content**:
- Title: "Your Profile"
- Body: "This is how your besties see you. Customize your photo, colors, and style to make it yours. Tap the edit button to get started."
- Actions: Continue button

### Step 2: Profile Customization
**Element**: Profile customizer button/icon
**Content**:
- Title: "Make It Yours"
- Body: "Customize your profile with different layouts, backgrounds, and themes. Express yourself! Your besties will see your unique style."
- Actions:
  - "Skip" button
  - "Try It" button (opens customizer, then continues)
  - "Continue" button (if skipped)

### Step 3: Profile Completion
**Element**: ProfileCompletion component
**Content**:
- Title: "Complete Your Profile"
- Body: "See what's left to set up. Complete your profile to unlock badges and get the most out of Besties. Tap any item to jump to that setting."
- Actions: Continue button

### Step 4: Badges Section
**Element**: BadgesSection component
**Content**:
- Title: "Earn Badges"
- Body: "Complete check-ins, add besties, and stay active to earn badges. Show off your achievements! Tap badges to see how to earn them."
- Actions: Continue button

### Step 5: Stats Section
**Element**: StatsSection component
**Content**:
- Title: "Track Your Progress"
- Body: "See your check-in stats, login streak, and more. Watch your numbers grow as you use Besties to stay safe."
- Actions: Continue button

### Step 6: Settings Button
**Element**: Settings button at bottom
**Content**:
- Title: "Fine-Tune Settings"
- Body: "Tap here to manage notifications, privacy, security, and more. Make Besties work exactly how you want it."
- Actions: Continue button (navigates to settings)

## Implementation Details

### State Management
- Use `useProfileTutorialState` hook
- Store completion in localStorage and Firestore
- Track step progress

### Trigger Conditions
- Show tutorial if:
  - User hasn't completed tutorial
  - Profile completion < 50% (optional)
  - First visit to profile page
  - Not triggered by settings navigation

### Component Structure
- Create `ProfileTutorialOverlay` component
- Reuse existing tutorial overlay patterns
- Add refs for each highlighted element

### Edge Cases
- Profile already complete: Skip completion step
- No badges yet: Show "Coming soon" message
- No stats yet: Show "Start checking in" message
- Customizer already open: Handle gracefully

### Completion
- Mark tutorial complete after final step
- Show celebration toast: "Your profile is looking great! ✨" (with 🎉 icon)
- Brief confetti animation (optional)
- Option to restart tutorial from settings

## Additional Features

### Visual Progress Indicator
- Use progress dots (not numbers) at bottom of tooltip
- Shows progress visually without being overwhelming

### Back Navigation
- Add back button (only show on steps > 1)
- Allows review without restarting

### Context-Aware Messaging
- Check profile completion before showing completion step
- Skip customization step if already customized
- Adapt messages based on completion status

### Error Handling
- Retry logic for refs
- Fallback positioning
- Graceful degradation

## Files to Create/Modify

1. **frontend/src/hooks/useProfileTutorialState.js** - New hook for tutorial state
2. **frontend/src/components/ProfileTutorialOverlay.jsx** - New overlay component
3. **frontend/src/pages/ProfilePage.jsx** - Add tutorial integration
4. **frontend/src/components/profile/ProfileCard.jsx** - Add ref for tutorial
5. **frontend/src/components/profile/ProfileCompletion.jsx** - Add ref for tutorial
6. **frontend/src/components/profile/BadgesSection.jsx** - Add ref for tutorial
7. **frontend/src/components/profile/StatsSection.jsx** - Add ref for tutorial

## Testing Checklist
- [ ] Tutorial shows on first visit
- [ ] Tutorial doesn't show if already completed
- [ ] All steps highlight correct elements
- [ ] Skip buttons work correctly
- [ ] Action buttons work
- [ ] Tutorial adapts to missing sections
- [ ] Completion is saved correctly
- [ ] Navigation to settings works
- [ ] Tutorial can be restarted from settings

