# Besties Page Tutorial Plan (Improved)

## Overview
Tutorial to guide users through the Besties page features, focusing on social features, activity feed, leaderboard, and bestie management.

## Target Audience
- Users who have at least one bestie
- First-time visitors to Besties page
- Users who haven't explored social features

## Prompt Card (Before Tutorial Starts)
**Component**: TutorialPromptCard (reuse from home tutorial)
**Content**:
- Emoji: 💜
- Title: "Let's Explore Your Besties Page"
- Body: "We'll show you the activity feed, leaderboard, and how to connect with your besties. Takes about 2 minutes."
- Highlight: "✅ Your private space - only your besties see what's here"
- Time estimate: "⏱️ About 2 minutes. You can skip anytime."
- Actions:
  - "Start Tutorial" button
  - "Skip - I'll explore on my own" link

## Tutorial Steps (Reduced from 7 to 5)

### Step 1: Activity Feed + Create Post (Combined)
**Element**: Activity Feed section + "✍️ Post" button
**Content**:
- Title: "Your Social Hub"
- Body: activityFeed.length === 0 
  ? "Your activity feed will show up here once you and your besties start checking in! Want to share something? Tap the 'Post' button to create your own!"
  : "See all your besties' check-ins and posts here. Want to share something? Tap the 'Post' button to create your own!"
- Actions: 
  - "Skip" button
  - "Try It" button (opens post modal, then continues to next step)
  - "Continue" button (if skipped)
- **Note**: If user closes modal without posting, stay on same step

### Step 2: Needs Attention Section (Conditional)
**Element**: Needs Attention section (only if there are missed check-ins or attention requests)
**Content**:
- Title: "Stay Alert"
- Body: "When a bestie misses a check-in, it shows up here. Tap to see details and help them out. This is what Besties is all about - looking out for each other."
- Actions: Continue button

### Step 3: Leaderboard
**Element**: Besties Leaderboard section
**Content**:
- Title: "Friendly Competition"
- Body: "See who's most reliable, who responds fastest, and celebrate together! Remember - everyone wins when we keep each other safe. Tap to switch between weekly, monthly, and yearly rankings."
- Actions: Continue button

### Step 4: Besties Grid
**Element**: Besties Grid section
**Content**:
- Title: "Your Safety Squad"
- Body: "All your besties in one place. Tap any bestie to see their profile, recent activity, and stay connected. Your featured circle appears at the top."
- Actions: Continue button

### Step 5: Add Bestie Button
**Element**: Floating "+" button (bottom right)
**Content**:
- Title: "Grow Your Circle"
- Body: "Need to add more besties? Tap the + button anytime to invite someone new. You can have up to 5 besties in your circle."
- Actions: 
  - Skip button
  - "Add Bestie" button (opens modal, then continues)

**Note**: Removed notification bell step - too minor, users can discover naturally

## Implementation Details

### State Management
- Use `useBestiesTutorialState` hook (similar to check-in tutorial)
- Store completion in localStorage and Firestore
- Track step progress

### Trigger Conditions
- Show tutorial if:
  - User has at least one bestie (if no besties, don't show tutorial - show empty state instead)
  - User hasn't completed tutorial
  - User hasn't visited Besties page before (or first visit in 7+ days)
  - Not triggered by notification navigation
  - Data has finished loading (besties, activity feed)

### Component Structure
- Create `BestiesTutorialOverlay` component
- Reuse `CheckInTutorialOverlay` styling and positioning logic
- Add refs for each highlighted element

### Edge Cases
- **No besties**: Don't show tutorial, show empty state instead (tutorial requires besties)
- **No activity**: Show encouraging message in step 1 (activity will appear later)
- **No missed check-ins**: Skip needs attention step (step 2 conditional)
- **Already on page from notification**: Don't show tutorial (check location.state)
- **Data still loading**: Wait for loading to complete before starting tutorial
- **User navigates away**: Save current step, resume on return (within 5 minutes)
- **Modal closed without action**: Stay on same step, allow retry

### Completion
- Mark tutorial complete after final step
- Show celebration toast: "You're all set! Your besties page is ready. 💜" (with 🎉 icon, 4 second duration)
- Optional: Brief confetti animation (2-3 seconds, if enabled)
- Save completion to localStorage and Firestore
- Option to restart tutorial from Settings → Tutorials section

## Files to Create/Modify

1. **frontend/src/hooks/useBestiesTutorialState.js** - New hook for tutorial state
2. **frontend/src/components/BestiesTutorialOverlay.jsx** - New overlay component
3. **frontend/src/pages/BestiesPage.jsx** - Add tutorial integration
4. **frontend/src/components/besties/ActivityFeed.jsx** - Add ref for tutorial
5. **frontend/src/components/besties/BestiesLeaderboard.jsx** - Add ref for tutorial
6. **frontend/src/components/besties/BestiesGrid.jsx** - Add ref for tutorial

## Additional Features

### Visual Progress Indicator
- Use progress dots at bottom of tooltip: ○○○○○ (unfilled) / ●○○○○ (filled)
- Animate fill on step change
- Don't show on prompt card
- Shows progress visually without being overwhelming

### Back Navigation
- Add back button (only show on steps > 1)
- On step 1, back button exits tutorial (returns to prompt card or marks as skipped)
- Allows review without restarting
- Smooth 300ms transitions

### Context-Aware Messaging
- Check if user has activity before showing feed step
- Check if user has missed check-ins before showing needs attention
- Adapt messages based on state

### Error Handling
- Retry logic for refs (like home tutorial)
- Fallback positioning if element not found
- Graceful degradation

## Additional Implementation Details

### Tutorial State Management
- Save current step to localStorage on each step change
- Resume from saved step if user navigates away and returns (within 5 minutes)
- Clear saved state after completion or 5 minute timeout
- Validate state on load (reset if corrupted)

### "Try It" Button Standardization
- Opens modal/feature with tutorial overlay still visible (paused)
- User explores feature
- On modal close:
  - If action completed: Advance to next step
  - If closed without action: Stay on same step, show retry option
- Make behavior consistent across all tutorials

### Accessibility
- Add ARIA labels: `aria-label="Tutorial step X of Y"`
- Keyboard navigation: Tab to buttons, Enter to activate, Escape to skip
- Screen reader: Announce step changes
- Focus management: Focus on highlighted element when possible
- High contrast mode support

### Analytics Tracking
- Track: `tutorial_started` (besties_tutorial)
- Track: `tutorial_step_completed` (step number, time taken)
- Track: `tutorial_skipped` (at which step)
- Track: `tutorial_completed` (total time)
- Track: `tutorial_try_it_clicked` (which step)
- Track: `tutorial_restarted` (from settings)

### Tutorial Restart Location
- Add "Tutorials" section in Settings page
- List all tutorials with:
  - Completion status (✓ Complete / Not started)
  - Last completed date (if applicable)
  - "Restart Tutorial" button
- Allow restarting any tutorial at any time

## Testing Checklist
- [ ] Prompt card shows before tutorial
- [ ] Tutorial shows on first visit (with besties)
- [ ] Tutorial doesn't show if no besties (shows empty state)
- [ ] Tutorial doesn't show if already completed
- [ ] All steps highlight correct elements
- [ ] Step numbering is correct (1-5)
- [ ] Skip buttons work correctly
- [ ] "Try It" buttons work (open modals)
- [ ] Modal closing behavior works (advance or stay)
- [ ] Back navigation works (exits on step 1)
- [ ] Tutorial adapts to missing sections (no activity, no missed check-ins)
- [ ] Completion celebration shows
- [ ] Completion is saved correctly (localStorage + Firestore)
- [ ] Tutorial can be restarted from Settings → Tutorials
- [ ] Visual progress indicator works (dots)
- [ ] Tutorial resumes if user navigates away and returns
- [ ] Loading states handled correctly
- [ ] Empty activity feed shows encouraging message
- [ ] Accessibility features work (keyboard, screen reader)

