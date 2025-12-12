# Tutorial Field Missing - Diagnosis

## Problem
User deleted `checkInTutorialComplete` field from Firestore user documents, and now:
1. Tutorial doesn't show on check-in page
2. Field doesn't appear in user profiles anymore
3. `currentCheckInTutorialStep` might not be tracking

## How the Code Handles Missing Fields

### Current Behavior
When `checkInTutorialComplete` is missing from Firestore:
- Code uses: `data.checkInTutorialComplete || false` (line 54)
- This defaults to `false`, which should make tutorial show
- localStorage is then updated to match: `'false'`

### Potential Issues

#### Issue 1: localStorage Conflict
If localStorage has old value `checkInTutorial_complete: 'true'`:
- localStorage loads first: `localComplete = true`
- Firestore sync happens: `firestoreComplete = false` (field missing)
- They differ, so state updates to `false` ✅
- localStorage gets updated to `'false'` ✅
- **This should work correctly**

#### Issue 2: User Already Has Check-ins
The tutorial only shows if:
```javascript
if (querySnapshot.empty && !checkInTutorialComplete) {
  // Show tutorial
}
```
If user already has check-ins, `querySnapshot.empty` is `false`, so tutorial won't show regardless of field value.

#### Issue 3: Field Not Being Created
When tutorial runs and sets step, it should create the field:
```javascript
await updateDoc(userRef, {
  currentCheckInTutorialStep: step,
  checkInTutorialComplete: false
});
```
But if this fails or doesn't run, field won't be created.

## Debugging Steps

### Step 1: Check Console Logs
Look for these logs in browser console:
- `[Tutorial] Initial state loaded from localStorage:` - shows what localStorage has
- `[Tutorial] Firestore state:` - shows what Firestore has (should be `false, null` if field missing)
- `[Tutorial] Conditions not met:` - shows why tutorial check isn't running
- `[Tutorial] Checking first check-in:` - shows if check runs
- `[Tutorial] Check-ins found:` - shows if user has check-ins

### Step 2: Check localStorage
In browser console, run:
```javascript
localStorage.getItem('checkInTutorial_complete')
localStorage.getItem('current_checkInTutorial_step')
```

### Step 3: Check Firestore
In Firestore console, check user document:
- Does `checkInTutorialComplete` field exist?
- What is its value?
- Does `currentCheckInTutorialStep` field exist?

### Step 4: Check if User Has Check-ins
The tutorial only shows for users with NO check-ins. If user already created check-ins, tutorial won't show.

## Solutions

### Solution 1: Clear localStorage
If localStorage has old values:
```javascript
localStorage.removeItem('checkInTutorial_complete')
localStorage.removeItem('current_checkInTutorial_step')
```
Then refresh page - tutorial should show if user has no check-ins.

### Solution 2: Re-add Field to Firestore
If you want the field to exist (for tracking):
- Add `checkInTutorialComplete: false` to user documents
- Add `currentCheckInTutorialStep: null` if needed
- Tutorial will work correctly

### Solution 3: Test with New User
Create a test user with:
- No check-ins
- No `checkInTutorialComplete` field in Firestore
- No localStorage values
- Tutorial should show

## Expected Behavior After Field Deletion

1. **Field missing in Firestore**: Defaults to `false` ✅
2. **Tutorial should show**: Only if user has NO check-ins ✅
3. **When tutorial starts**: Field gets created with `checkInTutorialComplete: false` ✅
4. **When tutorial completes**: Field gets updated to `checkInTutorialComplete: true` ✅

## Questions to Answer

1. **Do users have check-ins?** If yes, tutorial won't show (by design)
2. **What do console logs show?** Check the `[Tutorial]` logs
3. **What does localStorage have?** Check browser localStorage
4. **Is `isTutorialStateLoaded` true?** Tutorial waits for this before checking

## Next Steps

1. Check browser console for `[Tutorial]` logs
2. Check if test user has any check-ins
3. Clear localStorage and test again
4. Verify `isTutorialStateLoaded` becomes `true`
5. Check if `hasCheckedForFirstCheckIn` is blocking the check

