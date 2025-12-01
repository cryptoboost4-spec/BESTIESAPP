# Error Message Categorization

This document categorizes all `toast.error` calls across the codebase for migration to the new error display system.

## Categorization Key
- **INLINE**: Form validation, field-specific errors → Use `InlineError`
- **CONTEXTUAL**: Component/section errors, initialization failures → Use `ContextualError`  
- **SUBTLE**: Non-critical warnings, optional features → Use `SubtleNotification`
- **TOAST**: Critical system errors → Keep as `toast.error`

## CheckInMap.jsx (7 errors)
1. "Failed to initialize map" → **CONTEXTUAL** (already handled via mapError state)
2. "Error selecting location" → **SUBTLE** (non-critical, user can retry)
3. "Could not initialize address search" → **SUBTLE** (optional feature, user can type manually)
4. "GPS location is not enabled" → **SUBTLE** (optional feature)
5. "Geolocation not supported" → **SUBTLE** (optional feature)
6. "Invalid location received" → **SUBTLE** (user can retry)
7. "Could not get your location" → **SUBTLE** (user can type manually)

## CreateCheckInPage.jsx (11 errors)
1. "Unable to load your besties" → **CONTEXTUAL** (data loading error)
2. "You need at least one bestie" → **INLINE** (form validation)
3. "Address autocomplete is not available" → **SUBTLE** (optional feature)
4. "Map is taking too long to load" → **CONTEXTUAL** (initialization)
5. "Map failed to load" → **CONTEXTUAL** (initialization)
6. "Failed to load address autocomplete" → **SUBTLE** (optional feature)
7. "Please select at least one bestie" → **INLINE** (form validation)
8. "These besties need to enable notifications" → **CONTEXTUAL** (action blocker)
9. "Please enter a location" → **INLINE** (form validation)
10. "Duration must be between 10 and 180 minutes" → **INLINE** (form validation)

## LoginPage.jsx (11 errors)
1. "Verification setup failed" → **CONTEXTUAL** (initialization)
2. "Sign in failed" → **CONTEXTUAL** (authentication)
3. "Please fix the errors before continuing" → **INLINE** (form validation)
4. "Authentication failed" → **CONTEXTUAL** (authentication)
5. "Please wait for verification" → **INLINE** (form validation)
6. "Verification not ready" → **CONTEXTUAL** (initialization)
7. "Failed to send code" → **CONTEXTUAL** (action failure)
8. "Invalid code" → **INLINE** (form validation)
9. "Verification failed" → **CONTEXTUAL** (authentication)

## CheckInCard.jsx (8 errors)
1. "Please enter your passcode" → **INLINE** (form validation)
2. "Incorrect passcode" → **INLINE** (form validation)
3. "Unable to extend check-in" → **CONTEXTUAL** (action failure)
4. "Failed to extend check-in" → **CONTEXTUAL** (action failure)
5. "You can only have up to 5 photos" → **INLINE** (form validation)
6. "Photo is too large" → **INLINE** (form validation)
7. "Failed to upload photo" → **CONTEXTUAL** (action failure)

## Other Files (Summary)
- **SettingsPage.jsx**: Mostly **CONTEXTUAL** (settings update failures)
- **BestiesPage.jsx**: Mix of **CONTEXTUAL** and **SUBTLE**
- **ProfilePage.jsx**: Mostly **CONTEXTUAL** (data loading)
- **EmergencySOSButton.jsx**: **TOAST** (critical system errors - keep as toast)
- **AuthContext.jsx**: **TOAST** (critical auth errors - keep as toast)

## Migration Priority

### Phase 1: High Priority (User-facing forms)
- CreateCheckInPage form validation → INLINE
- LoginPage form validation → INLINE
- CheckInCard passcode validation → INLINE

### Phase 2: Medium Priority (Component initialization)
- Map initialization errors → CONTEXTUAL (already done)
- Data loading errors → CONTEXTUAL
- Authentication errors → CONTEXTUAL

### Phase 3: Low Priority (Optional features)
- GPS/Geolocation errors → SUBTLE
- Autocomplete failures → SUBTLE
- Optional feature warnings → SUBTLE

## Notes
- Critical system errors (auth failures, network errors) should remain as TOAST
- Form validation errors should be INLINE for better UX
- Component-level errors work well as CONTEXTUAL with retry options
- Optional features should use SUBTLE to not block the user

