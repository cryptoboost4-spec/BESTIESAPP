# Testing Guide - Besties App

This directory contains comprehensive tests for the Besties app.

## 📁 Test Structure

```
tests/
├── integration/          # Integration tests
│   └── critical-flows.test.js
├── e2e/                 # End-to-end test scenarios
│   └── test-scenarios.md
└── README.md            # This file
```

## 🧪 Running Tests

### Frontend Tests

```bash
cd frontend
npm test
```

Run with coverage:
```bash
npm test -- --coverage
```

### Backend Tests

```bash
cd functions
npm test
```

### All Tests (from project root)

```bash
node scripts/run-tests.js
```

## 📋 Test Types

### 1. Unit Tests
- **Location**: `frontend/src/utils/__tests__/`, `functions/utils/__tests__/`
- **Purpose**: Test individual functions and utilities
- **Examples**:
  - Logger utility
  - Validation functions
  - Constants
  - Rate limiting

### 2. Integration Tests
- **Location**: `tests/integration/`
- **Purpose**: Test interactions between components
- **Examples**:
  - User creation flow
  - Bestie connection flow
  - Check-in creation and completion

### 3. End-to-End Tests
- **Location**: `tests/e2e/`
- **Purpose**: Manual test scenarios for critical flows
- **Examples**:
  - Complete user onboarding
  - Emergency SOS flow
  - Check-in alert flow

## 🎯 Critical Test Scenarios

See `tests/e2e/test-scenarios.md` for detailed manual test scenarios.

### Must Test Before Launch:
1. ✅ New user signup and onboarding
2. ✅ Bestie connection flow
3. ✅ Check-in creation and completion
4. ✅ Emergency SOS
5. ✅ Check-in alerts
6. ✅ Security rules
7. ✅ Rate limiting
8. ✅ Error handling

## 🔧 Setting Up Test Environment

### Frontend
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Set up test environment variables:
   ```bash
   cp .env.example .env.test
   # Edit .env.test with test Firebase config
   ```

### Backend
1. Install dependencies:
   ```bash
   cd functions
   npm install
   ```

2. Set up Firebase emulators (optional):
   ```bash
   firebase emulators:start
   ```

## 📊 Test Coverage Goals

- **Unit Tests**: 80%+ coverage for utilities
- **Integration Tests**: All critical flows covered
- **E2E Tests**: All user-facing features tested

## 🐛 Reporting Bugs

When you find a bug during testing:

1. Document the steps to reproduce
2. Note the expected vs actual behavior
3. Include browser/device information
4. Add to bug tracking system (if available)

## 📝 Writing New Tests

### Frontend Test Example

```javascript
import { validateEmail } from '../utils/validation';

describe('validateEmail', () => {
  test('should accept valid email', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });

  test('should reject invalid email', () => {
    expect(() => validateEmail('invalid')).toThrow();
  });
});
```

### Backend Test Example

```javascript
const { requireAuth } = require('../utils/validation');

describe('requireAuth', () => {
  test('should throw if not authenticated', () => {
    expect(() => requireAuth({ auth: null })).toThrow();
  });
});
```

## 🚀 Continuous Integration

Tests should run automatically on:
- Pull requests
- Before deployment
- Nightly builds

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Firebase Testing Guide](https://firebase.google.com/docs/emulator-suite)

---

*Last Updated: 2025-01-27*

