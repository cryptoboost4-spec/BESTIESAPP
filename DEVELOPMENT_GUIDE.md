# Development Guide - Besties App

This guide covers how to develop, test, and maintain the Besties app codebase.

---

## 🚀 Quick Start

### Prerequisites

1. **Node.js 20+** installed
2. **Firebase CLI** installed globally: `npm install -g firebase-tools`
3. **Firebase project** set up (see `FIREBASE_SETUP_GUIDE.md`)

### Setup

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../functions
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Firebase credentials
```

---

## 🧪 Testing

### Running Tests

#### All Tests
```bash
# From project root
node scripts/run-tests.js
```

#### Frontend Tests Only
```bash
cd frontend
npm test
```

#### Backend Tests Only
```bash
cd functions
npm test
```

#### With Coverage
```bash
cd frontend
npm run test:coverage

cd functions
npm run test:coverage
```

#### Watch Mode (Development)
```bash
cd frontend
npm test -- --watch

cd functions
npm run test:watch
```

#### Specific Test File
```bash
cd functions
npm test -- completeCheckIn.test.js
```

### Test Types

1. **Unit Tests** - Test individual functions in isolation
   - Location: `__tests__` directories
   - Example: Testing if `validateEmail()` correctly validates email format

2. **Integration Tests** - Test interactions between components
   - Location: `tests/integration/`
   - Example: Testing if creating a check-in updates user stats correctly

3. **End-to-End Tests** - Test complete user flows manually
   - Location: `tests/e2e/test-scenarios.md`
   - Example: Testing the complete flow from signup to creating a check-in

### Writing New Tests

#### Frontend Test Template
```javascript
import { functionToTest } from '../module';

describe('Function Name', () => {
  test('should do something', () => {
    const result = functionToTest(input);
    expect(result).toBe(expectedOutput);
  });

  test('should handle edge case', () => {
    expect(() => functionToTest(invalidInput)).toThrow();
  });
});
```

#### Backend Test Template
```javascript
const { functionToTest } = require('../module');

describe('Function Name', () => {
  test('should do something', () => {
    const result = functionToTest(input);
    expect(result).toBe(expectedOutput);
  });
});
```

### Test Best Practices

1. **Keep tests simple** - One assertion per test when possible
2. **Use descriptive names** - Test names should explain what they test
3. **Test edge cases** - Don't just test happy paths
4. **Keep tests fast** - Unit tests should run in milliseconds
5. **Isolate tests** - Tests shouldn't depend on each other

---

## 📝 Code Standards

### Code Organization

- **Frontend**: React components in `frontend/src/components/`
- **Backend**: Cloud Functions in `functions/core/`
- **Utilities**: Shared utilities in `functions/utils/`
- **Tests**: Co-located in `__tests__/` directories

### Naming Conventions

- **Components**: PascalCase (e.g., `ActivityFeed.jsx`)
- **Functions**: camelCase (e.g., `completeCheckIn`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_CHECKIN_DURATION`)
- **Files**: Match the exported name

### Error Handling

- Always use try-catch for async operations
- Log errors using the logger utility (not console.log)
- Return meaningful error messages to users
- Don't expose internal errors in production

### Logging

- Use `logger.log()`, `logger.warn()`, `logger.error()` from `utils/logger`
- Never use `console.log()` in production code
- Log important operations and errors
- Include context in log messages

### Input Validation

- Validate all user inputs using `utils/validation`
- Check authentication before operations
- Enforce rate limits on critical functions
- Sanitize data before storing in database

---

## 🔧 Common Patterns

### Adding a New Feature

1. **Create the function** in appropriate `core/` directory
2. **Add input validation** using `utils/validation`
3. **Add rate limiting** if user-facing
4. **Add error handling** with try-catch
5. **Add logging** for important operations
6. **Write tests** in `__tests__/` directory
7. **Update documentation** if needed

### Adding a New Cloud Function

```javascript
const functions = require('firebase-functions');
const { validateAuth, validateInput } = require('../utils/validation');
const { checkRateLimit } = require('../utils/rateLimiting');
const logger = require('../utils/logger');

exports.myNewFunction = functions.https.onCall(async (data, context) => {
  // 1. Validate authentication
  validateAuth(context);

  // 2. Validate input
  validateInput(data, {
    required: ['field1', 'field2'],
    types: { field1: 'string', field2: 'number' }
  });

  // 3. Check rate limit
  await checkRateLimit(context.auth.uid, 'myNewFunction', 10, 3600);

  try {
    // 4. Business logic
    const result = await doSomething(data);

    // 5. Log success
    logger.log('myNewFunction completed', { userId: context.auth.uid });

    return { success: true, data: result };
  } catch (error) {
    // 6. Error handling
    logger.error('myNewFunction failed', error);
    throw new functions.https.HttpsError('internal', 'Operation failed');
  }
});
```

### Adding a New React Component

```javascript
import React, { useState } from 'react';
import logger from '../utils/logger';

const MyComponent = ({ prop1, prop2 }) => {
  const [state, setState] = useState(null);

  const handleAction = async () => {
    try {
      // Component logic
      logger.log('Action performed');
    } catch (error) {
      logger.error('Action failed', error);
    }
  };

  return (
    <div className="card">
      {/* Component JSX */}
    </div>
  );
};

export default MyComponent;
```

---

## 🐛 Debugging

### Common Issues

1. **Firebase not initialized**
   - Solution: Check `jest.setup.js` mocks in tests
   - Solution: Verify Firebase config in production

2. **Async function not awaited**
   - Solution: Use `async/await` or return promises
   - Solution: Check for missing `await` keywords

3. **Mock not working**
   - Solution: Check mock setup in test file
   - Solution: Verify mock is called before function execution

4. **Rate limit errors**
   - Solution: Check rate limit configuration
   - Solution: Verify user hasn't exceeded limits

### Debug Mode

Run tests in watch mode to debug:
```bash
cd frontend
npm test -- --watch

cd functions
npm test -- --watch
```

---

## 📊 Test Coverage

### Coverage Goals

- **Critical utilities**: 90%+ coverage
- **Core functions**: 85%+ coverage
- **All functions**: 70%+ coverage

### Viewing Coverage Reports

After running `npm run test:coverage`:
- **Location**: `coverage/lcov-report/index.html`
- **Open in browser**: View detailed coverage by file

---

## ✅ Pre-Commit Checklist

Before committing code:

- [ ] All tests pass (`npm test`)
- [ ] No linter errors
- [ ] Code follows naming conventions
- [ ] Error handling added
- [ ] Logging added (using logger utility)
- [ ] Input validation added
- [ ] Rate limiting added (if user-facing)
- [ ] Tests written for new features
- [ ] Documentation updated if needed

---

## 📚 Additional Resources

- **Jest Documentation**: https://jestjs.io/docs/getting-started
- **React Testing Library**: https://testing-library.com/docs/react-testing-library/intro/
- **Firebase Testing**: https://firebase.google.com/docs/emulator-suite
- **Codebase Structure**: See `CODEBASE_STRUCTURE.md`
- **Testing Status**: See `TESTING_STATUS.md`

---

*Last Updated: 2025-01-27*

