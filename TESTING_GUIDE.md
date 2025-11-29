# Complete Testing Guide - Besties App

This guide covers all aspects of testing the Besties app, from unit tests to end-to-end scenarios.

## 🎯 Quick Start

### Run All Tests
```bash
# From project root
node scripts/run-tests.js
```

### Run Frontend Tests Only
```bash
cd frontend
npm test
```

### Run Backend Tests Only
```bash
cd functions
npm test
```

### Run with Coverage
```bash
cd frontend
npm run test:coverage

cd functions
npm run test:coverage
```

---

## 📋 Test Coverage

### ✅ Unit Tests (Implemented)

#### Frontend
- ✅ Logger utility (`frontend/src/utils/__tests__/logger.test.js`)
- ✅ Constants (`frontend/src/utils/__tests__/constants.test.js`)

#### Backend
- ✅ Validation utilities (`functions/utils/__tests__/validation.test.js`)
- ✅ Rate limiting (`functions/utils/__tests__/rateLimiting.test.js`)

### ✅ Integration Tests (Implemented)

- ✅ User creation flow
- ✅ Bestie connection flow
- ✅ Check-in creation and completion
- ✅ Rate limiting tracking

### 📝 End-to-End Tests (Manual)

See `tests/e2e/test-scenarios.md` for comprehensive manual test scenarios covering:
- New user onboarding
- Bestie connections
- Check-in flows
- Emergency SOS
- Security rules
- Error handling

---

## 🧪 Test Types Explained

### 1. Unit Tests
**What**: Test individual functions in isolation  
**Where**: `__tests__` directories  
**Example**: Testing if `validateEmail()` correctly validates email format

### 2. Integration Tests
**What**: Test interactions between components  
**Where**: `tests/integration/`  
**Example**: Testing if creating a check-in updates user stats correctly

### 3. End-to-End Tests
**What**: Test complete user flows manually  
**Where**: `tests/e2e/test-scenarios.md`  
**Example**: Testing the complete flow from signup to creating a check-in

---

## 🚀 Running Tests in CI/CD

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd frontend && npm ci && npm run test:ci
      - run: cd functions && npm ci && npm test
```

---

## 📊 Test Results Interpretation

### Coverage Reports

After running tests with coverage, you'll see:
- **Statements**: % of code statements executed
- **Branches**: % of if/else branches tested
- **Functions**: % of functions called
- **Lines**: % of lines executed

**Goal**: 70%+ coverage for critical utilities

### Reading Test Output

```
PASS  src/utils/__tests__/logger.test.js
  Logger Utility
    Development Mode
      ✓ logger.log should call console.log in development
      ✓ logger.warn should call console.warn in development
    Production Mode
      ✓ logger.log should NOT call console.log in production
```

✅ Green checkmarks = Tests passing  
❌ Red X = Tests failing

---

## 🐛 Debugging Failed Tests

### Common Issues

1. **Firebase not initialized**
   - Solution: Check `jest.setup.js` mocks

2. **Async function not awaited**
   - Solution: Use `async/await` or return promises

3. **Mock not working**
   - Solution: Check mock setup in test file

### Debug Mode

Run tests in watch mode to debug:
```bash
cd frontend
npm test -- --watch

cd functions
npm test -- --watch
```

---

## 📝 Writing New Tests

### Frontend Test Template

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

### Backend Test Template

```javascript
const { functionToTest } = require('../module');

describe('Function Name', () => {
  test('should do something', () => {
    const result = functionToTest(input);
    expect(result).toBe(expectedOutput);
  });
});
```

---

## ✅ Pre-Launch Testing Checklist

Before launching, ensure:

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual E2E scenarios tested
- [ ] Security rules tested
- [ ] Rate limiting tested
- [ ] Error handling tested
- [ ] Performance tested
- [ ] Mobile responsiveness tested
- [ ] Browser compatibility tested
- [ ] No console errors in production build

---

## 🔍 Test Maintenance

### When to Update Tests

- When adding new features
- When fixing bugs (add regression test)
- When refactoring code
- When changing APIs

### Test Best Practices

1. **Keep tests simple** - One assertion per test when possible
2. **Use descriptive names** - Test names should explain what they test
3. **Test edge cases** - Don't just test happy paths
4. **Keep tests fast** - Unit tests should run in milliseconds
5. **Isolate tests** - Tests shouldn't depend on each other

---

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Firebase Testing](https://firebase.google.com/docs/emulator-suite)

---

*Last Updated: 2025-01-27*

