# Error Display Migration Guide

## Error Categories

### INLINE Errors
**Use for:** Form validation, field-specific errors
**Component:** `InlineError`
**Example locations:**
- Form input validation (location, duration, bestie selection)
- Field-specific error messages
- Input format errors

**Migration pattern:**
```jsx
// Before:
toast.error('Please enter a location');

// After:
const [locationError, setLocationError] = useState('');
// In form:
{locationError && <InlineError message={locationError} />}
```

### CONTEXTUAL Errors
**Use for:** Component/section-level errors, initialization failures
**Component:** `ContextualError`
**Example locations:**
- Map initialization failures
- Data loading errors within sections
- Component-level action failures

**Migration pattern:**
```jsx
// Before:
toast.error('Failed to initialize map. Please refresh the page.');

// After:
{mapError && (
  <ContextualError 
    message="Failed to initialize map. Please refresh the page."
    title="Map Error"
    onRetry={() => window.location.reload()}
  />
)}
```

### SUBTLE Errors
**Use for:** Non-critical warnings, optional feature failures
**Component:** `SubtleNotification`
**Example locations:**
- GPS not available (user can still type location)
- Optional feature failures
- Background operation errors

**Migration pattern:**
```jsx
// Before:
toast.error('Geolocation not supported. Please search for your location manually.');

// After:
<SubtleNotification 
  message="Geolocation not supported. Please search for your location manually."
  type="warning"
  duration={5000}
/>
```

### TOAST Errors (Keep)
**Use for:** Critical system errors that need immediate attention
**Keep as:** `toast.error()`
**Example locations:**
- Authentication failures
- Network errors that block functionality
- Critical system errors

## Categorization Summary

### CheckInMap.jsx
- Map init failure → CONTEXTUAL (already handled via mapError state)
- Autocomplete init failure → SUBTLE (optional feature)
- GPS not enabled → SUBTLE (optional feature)
- Geolocation not supported → SUBTLE (optional feature)
- GPS error → SUBTLE (user can still type location)
- Place selection error → SUBTLE (non-critical)

### CreateCheckInPage.jsx
- No besties selected → INLINE (form validation)
- No location entered → INLINE (form validation)
- Invalid duration → INLINE (form validation)
- Besties without contact → CONTEXTUAL (action blocker)
- Besties load error → CONTEXTUAL (data loading)
- Maps API missing → CONTEXTUAL (feature blocker)

### LoginPage.jsx
- Sign in failed → CONTEXTUAL (authentication error)
- Verification failed → CONTEXTUAL (authentication error)
- Form validation → INLINE (field errors)

### CheckInCard.jsx
- Passcode errors → INLINE (form validation)
- Photo upload errors → CONTEXTUAL (action failure)
- Extension errors → CONTEXTUAL (action failure)

## Migration Priority

1. **High Priority** - User-facing form validation (INLINE)
2. **Medium Priority** - Component initialization (CONTEXTUAL)
3. **Low Priority** - Optional features (SUBTLE)

## Notes

- Keep toast.error for critical system errors
- Inline errors require state management in forms
- Contextual errors work well for component-level failures
- Subtle notifications are for non-blocking warnings

