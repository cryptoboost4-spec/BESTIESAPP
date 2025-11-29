# Test Failures Analysis

**Status**: 178 tests failing, 81 passing  
**Test Suites**: 33 failed, 2 passed, 35 total

## Common Issues to Check

### 1. Mock Setup Issues
The tests rely heavily on mocks. Common problems:
- **Firebase Admin mocks** - Check if `admin.firestore()` is properly mocked
- **Firebase Functions mocks** - Verify `functions.https.onCall` returns the handler
- **SendGrid mocks** - Ensure `@sendgrid/mail` is properly mocked

### 2. Function Export Issues
Functions are exported as:
```javascript
exports.completeCheckIn = functions.https.onCall(async (data, context) => {
```

Tests import them as:
```javascript
const { completeCheckIn } = require('../completeCheckIn');
```

The `jest.setup.js` should make `functions.https.onCall` return the handler directly.

### 3. Database Mock Issues
Many tests mock `admin.firestore()` but the actual functions might use it differently. Check:
- Are collection/doc chains properly mocked?
- Are async operations (get, update, etc.) properly resolved/rejected?

### 4. Missing Dependencies
Some functions might require:
- `functions.config()` to return specific values
- External services (Twilio, Stripe) to be mocked
- Environment variables to be set

## Quick Fixes to Try

### Fix 1: Check jest.setup.js
Ensure all mocks are properly configured, especially:
```javascript
functions.config = jest.fn(() => ({
  sendgrid: { api_key: 'test-key' },
  twilio: { account_sid: 'test', auth_token: 'test' },
  stripe: { secret_key: 'test-key' },
  app: { url: 'http://localhost' },
}));
```

### Fix 2: Verify Function Imports
Make sure tests import the actual handler, not the wrapped function. The mock should unwrap it.

### Fix 3: Check Async/Await
Ensure all async operations in tests are properly awaited and mocked promises resolve correctly.

## Next Steps

1. **Run a single test file** to see specific error:
   ```bash
   cd functions
   npm test -- completeCheckIn.test.js
   ```

2. **Check the error output** - Look for:
   - "Cannot read property X of undefined"
   - "TypeError: X is not a function"
   - Mock-related errors
   - Async/await issues

3. **Fix common patterns** - Once you identify the pattern, fix all similar tests

4. **Update mocks** - Ensure jest.setup.js has all necessary mocks

## Files to Check

- `functions/jest.setup.js` - Main mock configuration
- `functions/jest.config.js` - Jest configuration
- Individual test files - Check for mock setup issues
- Function files - Ensure exports match test expectations

