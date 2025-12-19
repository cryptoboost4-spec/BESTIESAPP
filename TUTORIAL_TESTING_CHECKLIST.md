# Tutorial System Testing Checklist

**Purpose**: Document known tutorial issues and create testing checklist  
**Source**: Investigation findings from conversation history  
**Status**: Issues documented, awaiting testing/fixes

---

## 🐛 Known Tutorial Issues

### 1. **afterSafe Tutorial Tooltip Not Appearing**
**Location**: After check-in completion  
**Expected**: Tooltip should appear with "Learn About Bestie Circle" button  
**Actual**: Tooltip may not appear or appear incorrectly  
**Component**: `CheckInTutorialOverlay.jsx`  
**Priority**: HIGH

**Test Steps**:
1. Create new user account
2. Complete first check-in (click "I'm Safe")
3. Verify `afterSafe` tooltip appears
4. Verify "Learn About Bestie Circle" button is full-width
5. Verify "Skip Tutorial" appears as text link
6. Click "Learn About Bestie Circle" and verify it scrolls to Bestie Circle

---

### 2. **checkedIn Tutorial Tooltip Not Appearing**
**Location**: CheckInCard component  
**Expected**: Tooltip should appear on completed check-in card  
**Actual**: Tooltip may not appear  
**Component**: `CheckInCard.jsx`  
**Priority**: HIGH

**Test Steps**:
1. Complete a check-in
2. Navigate to home page
3. Verify tooltip appears on the check-in card
4. Verify tooltip content is correct

---

### 3. **Timer Layout Shift in CheckInCard**
**Location**: CheckInCard countdown timer  
**Expected**: UI elements should remain stable as timer counts down  
**Actual**: Elements shift when numbers change (e.g., 10→9 changes width)  
**Component**: `CheckInCard.jsx`  
**Priority**: MEDIUM

**Test Steps**:
1. Create active check-in
2. Watch countdown timer
3. Verify no layout shift when:
   - Two digits → one digit (10→9)
   - Numbers change (59→58)
4. Check on mobile viewport (375px width)

---

### 4. **Bestie Circle Tutorial Lag**
**Location**: LivingCircle component tutorial  
**Expected**: Smooth animations without lag  
**Actual**: Performance issues/lag during tutorial  
**Component**: `BestieCircleTutorial.jsx`, `LivingCircle.jsx`  
**Priority**: MEDIUM

**Test Steps**:
1. Trigger Bestie Circle tutorial
2. Monitor performance (check FPS, CPU usage)
3. Test on lower-end devices
4. Verify animations play smoothly
5. Check for excessive re-renders

---

### 5. **Tooltip Cut Off by Bottom Menu**
**Location**: Various tutorial tooltips  
**Expected**: Tooltips should be fully visible  
**Actual**: Bottom menu bar may obscure tooltips  
**Component**: Multiple tutorial components  
**Priority**: HIGH

**Test Steps**:
1. Go through all tutorial steps
2. Verify each tooltip is fully visible
3. Check z-index values
4. Test on mobile viewport
5. Verify tooltips adjust position if needed

---

### 6. **Tutorial Animation Sequence Issues**
**Location**: Bestie Circle tutorial  
**Expected**: Scene animations complete before tooltips appear  
**Actual**: Tooltips may appear before animations finish  
**Component**: `BestieCircleTutorial.jsx`  
**Priority**: MEDIUM

**Test Steps**:
1. Start Bestie Circle tutorial
2. Verify each animation completes fully
3. Verify tooltip appears AFTER animation
4. Check timing for all tutorial steps

---

## 📋 Complete Tutorial Flow Testing

### New User Onboarding Flow
- [ ] Sign up / first login
- [ ] Welcome screen appears
- [ ] Home page tutorial starts
- [ ] Check-in creation tutorial
- [ ] First check-in completion
- [ ] "afterSafe" tooltip appears
- [ ] Bestie Circle tutorial (if triggered)
- [ ] All tooltips visible and positioned correctly
- [ ] Skip tutorial works at any step
- [ ] Tutorial state persists in localStorage

### Tutorial Components to Test
- [ ] `CheckInTutorialOverlay.jsx`
- [ ] `PostTutorialTooltip.jsx`
- [ ] `TutorialOverlay.jsx`
- [ ] `TutorialTooltip.jsx`
- [ ] `BestieCircleTutorial.jsx`
- [ ] `HomePageTutorialOverlay.jsx`
- [ ] `TutorialPromptCard.jsx`

---

## 🔧 Technical Checks

### State Management
- [ ] Tutorial state stored in localStorage
- [ ] Tutorial steps tracked correctly
- [ ] Tutorial can be reset for testing
- [ ] Tutorial doesn't repeat for existing users

### Responsive Design
- [ ] Test on mobile (375px width)
- [ ] Test on tablet (768px width)
- [ ] Test on desktop (1920px width)
- [ ] Tooltips adjust position for small screens

### Performance
- [ ] No memory leaks
- [ ] Animations don't cause lag
- [ ] No excessive re-renders
- [ ] Tutorial doesn't slow down app

### Accessibility
- [ ] Tooltips have proper ARIA labels
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Focus management correct

---

## 🐛 Debug Tools Available

### TutorialDebugPanel
**Location**: `frontend/src/components/TutorialDebugPanel.jsx`  
**Usage**: Rendered on HomePage for testing  
**Features**: 
- View current tutorial state
- Manually trigger tutorial steps
- Reset tutorial progress

**Note**: Should be removed or disabled in production

---

## 📝 Testing Notes

### localStorage Keys to Check
- `tutorialCompleted`
- `sacredTransition`
- `bestieCircle`
- `afterSafe`
- `checkedIn`

### Console Logging
Multiple debug console.log statements exist:
- HomePage.jsx line 60: "Debug: Log tutorial step changes"
- CheckInCard.jsx line 59: "Debug: Log tutorial state updates"
- CreateCheckInPage.jsx: Debug logging for contacts

---

## ✅ Definition of Done

Tutorial system is considered working when:
- [ ] All 6 known issues are resolved
- [ ] Complete tutorial flow tested end-to-end
- [ ] No console errors during tutorial
- [ ] Tooltips visible on all screen sizes
- [ ] Animations smooth and performant
- [ ] Tutorial can be completed without issues
- [ ] Tutorial can be skipped at any point
- [ ] Debug code removed from production

---

**Last Updated**: 2025-12-20  
**Next Steps**: Test each issue systematically, fix bugs, remove debug code
