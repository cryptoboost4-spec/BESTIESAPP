# Besties Page Tutorial Plan

## Overview
Tutorial to guide users through the Besties page features, focusing on social features, activity feed, leaderboard, and bestie management.

## Target Audience
- Users who have at least one bestie
- First-time visitors to Besties page
- Users who haven't explored social features

## Tutorial Steps

### Step 1: Activity Feed Introduction
**Element**: Activity Feed section
**Content**:
- Title: "Your Social Hub"
- Body: "This is where you'll see all your besties' check-ins and posts. It's your private space - only your besties can see what's here. No algorithms, just real connections."
- Actions: Continue button

### Step 2: Create Post Button
**Element**: "✍️ Post" button in Activity Feed header
**Content**:
- Title: "Share Updates"
- Body: "Want to share something with your besties? Tap here to create a post. Share photos, updates, or just say hi!"
- Actions: 
  - Skip button
  - "Try It" button (opens post modal, then continues)

### Step 3: Needs Attention Section (Conditional)
**Element**: Needs Attention section (only if there are missed check-ins or attention requests)
**Content**:
- Title: "Stay Alert"
- Body: "When a bestie misses a check-in, it shows up here. Tap to see details and help them out. This is what Besties is all about - looking out for each other."
- Actions: Continue button

### Step 4: Leaderboard
**Element**: Besties Leaderboard section
**Content**:
- Title: "Friendly Competition"
- Body: "See who's most reliable, who responds fastest, and celebrate together! Remember - everyone wins when we keep each other safe. Tap to switch between weekly, monthly, and yearly rankings."
- Actions: Continue button

### Step 5: Besties Grid
**Element**: Besties Grid section
**Content**:
- Title: "Your Safety Squad"
- Body: "All your besties in one place. Tap any bestie to see their profile, recent activity, and stay connected. Your featured circle appears at the top."
- Actions: Continue button

### Step 6: Add Bestie Button
**Element**: Floating "+" button (bottom right)
**Content**:
- Title: "Grow Your Circle"
- Body: "Need to add more besties? Tap the + button anytime to invite someone new. You can have up to 5 besties in your circle."
- Actions: 
  - Skip button
  - "Add Bestie" button (opens modal, then continues)

### Step 7: Notification Bell (Optional)
**Element**: Floating notification bell (top right)
**Content**:
- Title: "Stay Updated"
- Body: "Tap the bell to see all your notifications - bestie requests, check-in alerts, and more. Never miss what matters."
- Actions: Continue button

## Implementation Details

### State Management
- Use `useBestiesTutorialState` hook (similar to check-in tutorial)
- Store completion in localStorage and Firestore
- Track step progress

### Trigger Conditions
- Show tutorial if:
  - User has at least one bestie
  - User hasn't completed tutorial
  - User hasn't visited Besties page before (or first visit in 7 days)
  - Not triggered by notification navigation

### Component Structure
- Create `BestiesTutorialOverlay` component
- Reuse `CheckInTutorialOverlay` styling and positioning logic
- Add refs for each highlighted element

### Edge Cases
- No besties: Skip tutorial, show empty state
- No activity: Skip activity feed step
- No missed check-ins: Skip needs attention step
- Already on page from notification: Don't show tutorial

### Completion
- Mark tutorial complete after final step
- Show brief celebration
- Option to restart tutorial from settings

## Files to Create/Modify

1. **frontend/src/hooks/useBestiesTutorialState.js** - New hook for tutorial state
2. **frontend/src/components/BestiesTutorialOverlay.jsx** - New overlay component
3. **frontend/src/pages/BestiesPage.jsx** - Add tutorial integration
4. **frontend/src/components/besties/ActivityFeed.jsx** - Add ref for tutorial
5. **frontend/src/components/besties/BestiesLeaderboard.jsx** - Add ref for tutorial
6. **frontend/src/components/besties/BestiesGrid.jsx** - Add ref for tutorial

## Testing Checklist
- [ ] Tutorial shows on first visit
- [ ] Tutorial doesn't show if already completed
- [ ] All steps highlight correct elements
- [ ] Skip buttons work correctly
- [ ] Action buttons (Try It, Add Bestie) work
- [ ] Tutorial adapts to missing sections
- [ ] Completion is saved correctly
- [ ] Tutorial can be restarted from settings

