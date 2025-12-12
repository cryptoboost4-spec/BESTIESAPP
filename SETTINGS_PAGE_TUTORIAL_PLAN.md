# Settings Page Tutorial Plan (Improved)

## Overview
Tutorial to guide users through important settings: notifications, privacy, security, and preferences.

## Target Audience
- New users setting up their account
- Users who haven't reviewed settings
- Users with incomplete notification setup

## Prompt Card (Before Tutorial Starts)
**Component**: TutorialPromptCard (reuse from home tutorial)
**Content**:
- Emoji: ⚙️
- Title: "Let's Set Up Your Settings"
- Body: "We'll walk you through notifications, privacy, and security. Takes about 2 minutes. You can skip any step."
- Highlight: "✅ Take control of your privacy and safety"
- Time estimate: "⏱️ About 2 minutes. You can skip anytime."
- Actions:
  - "Start Tutorial" button
  - "Skip - I'll explore on my own" link

## Tutorial Steps

### Step 1: Notification Settings
**Element**: NotificationSettings section
**Content**:
- Title: "Stay Connected"
- Body: "Enable notifications so your besties can reach you in emergencies. Choose how you want to be notified - email, SMS, or push notifications."
- Actions: 
  - "Skip" button
  - "Try It" button (opens test alert modal, then continues)
  - "Continue" button (if skipped)

### Step 2: Messenger Integration (Conditional)
**Element**: MessengerLinkDisplay section (if feature enabled)
**Content**:
- Title: "Connect Messenger"
- Body: "Link your Facebook Messenger to get free alerts. Share your link with besties to connect via Messenger - it's free and unlimited!"
- Actions: Continue button

### Step 3: Privacy Settings
**Element**: PrivacySettings section
**Content**:
- Title: "Control Your Privacy"
- Body: "Decide who can see your check-ins and profile. Set default privacy levels and control what information is shared. Your privacy matters."
- Actions: Continue button

### Step 4: Security Passcodes
**Element**: SecurityPasscodes section
**Content**:
- Title: "Extra Security (Optional)"
- Body: "Want extra protection? You can set up a safety passcode or duress code. These are completely optional - only set them up if you want extra security features."
- Actions:
  - "Skip" button (emphasized as primary)
  - "Learn More" button (shows info, then continues)
- **Note**: Make this step feel optional and friendly, not scary

### Step 5: Preferences
**Element**: PreferencesAndQuickAccess section
**Content**:
- Title: "Customize Your Experience"
- Body: "Adjust app preferences, quick access settings, and more. Make Besties work exactly how you want it."
- Actions: Continue button

**Note**: Test Alert step removed - integrated into Step 1 as "Try It" button

## Implementation Details

### State Management
- Use `useSettingsTutorialState` hook
- Store completion in localStorage and Firestore
- Track step progress

### Trigger Conditions
- Show tutorial if:
  - User hasn't completed tutorial
  - Notifications not fully set up (optional)
  - First visit to settings page
  - Not triggered by profile completion navigation

### Component Structure
- Create `SettingsTutorialOverlay` component
- Reuse existing tutorial overlay patterns
- Add refs for each highlighted element
- Support hash-based navigation (#notifications, #privacy, etc.)

### Edge Cases
- Notifications already set up: Skip notification step
- Messenger not available: Skip messenger step
- Passcodes already set: Skip passcode step
- Already on specific section: Start from that step

### Completion
- Mark tutorial complete after final step
- Show celebration toast: "Your settings are all set! ⚙️" (with 🎉 icon)
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
- Check notification setup before showing notification step
- Skip messenger step if feature disabled
- Skip passcode step if already set up
- Adapt messages based on completion status

### Error Handling
- Retry logic for refs
- Fallback positioning
- Graceful degradation

### Friendlier Language
- Use conversational tone
- Avoid technical jargon
- Emphasize optional features
- Make security step feel safe, not scary

## Files to Create/Modify

1. **frontend/src/hooks/useSettingsTutorialState.js** - New hook for tutorial state
2. **frontend/src/components/SettingsTutorialOverlay.jsx** - New overlay component
3. **frontend/src/pages/SettingsPage.jsx** - Add tutorial integration
4. **frontend/src/components/settings/NotificationSettings.jsx** - Add ref for tutorial
5. **frontend/src/components/settings/MessengerLinkDisplay.jsx** - Add ref for tutorial
6. **frontend/src/components/settings/PrivacySettings.jsx** - Add ref for tutorial
7. **frontend/src/components/settings/SecurityPasscodes.jsx** - Add ref for tutorial
8. **frontend/src/components/settings/PreferencesAndQuickAccess.jsx** - Add ref for tutorial

## Testing Checklist
- [ ] Tutorial shows on first visit
- [ ] Tutorial doesn't show if already completed
- [ ] All steps highlight correct elements
- [ ] Skip buttons work correctly
- [ ] Action buttons work
- [ ] Tutorial adapts to missing sections
- [ ] Hash navigation works
- [ ] Completion is saved correctly
- [ ] Tutorial can be restarted from settings

## Special Considerations

### Notification Requirements
- Explain test check-ins don't require notifications
- Explain emergency contacts require notifications
- Show which besties have notifications enabled

### Security
- Explain safety vs duress passcodes clearly
- Show examples of when to use each
- Emphasize importance without being scary

### Privacy
- Explain default privacy levels
- Show how to change privacy per check-in
- Clarify what besties can see

