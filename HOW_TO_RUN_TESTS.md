# How to Run Tests - Complete Guide

**Date**: 2025-01-27

---

## 🧪 Running Tests

### Prerequisites

1. **Install Dependencies** (if not already done)
   ```bash
   cd functions
   npm install
   ```

2. **Ensure Jest is Installed**
   ```bash
   cd functions
   npm list jest
   ```
   If not installed, it's already in `package.json` devDependencies.

---

## 🚀 Running Tests

### Option 1: Run All Tests (Recommended)

```bash
cd functions
npm test
```

This will:
- Run all test files in `**/__tests__/**/*.test.js`
- Show test results
- Exit with code 0 if all pass, 1 if any fail

### Option 2: Run Tests with Coverage

```bash
cd functions
npm run test:coverage
```

This will:
- Run all tests
- Generate coverage report
- Show coverage percentages
- Create `coverage/` directory with HTML report

**Coverage Report Location**: `functions/coverage/lcov-report/index.html`

### Option 3: Watch Mode (Development)

```bash
cd functions
npm run test:watch
```

This will:
- Run tests in watch mode
- Re-run tests when files change
- Great for development

### Option 4: Run Specific Test File

```bash
cd functions
npm test -- completeCheckIn.test.js
```

Or run all tests in a directory:
```bash
cd functions
npm test -- checkins
```

### Option 5: Run Tests Matching Pattern

```bash
cd functions
npm test -- --testNamePattern="should complete check-in"
```

---

## 📊 Understanding Test Output

### Successful Test Run
```
PASS  core/checkins/__tests__/completeCheckIn.test.js
  completeCheckIn
    Authentication
      ✓ should throw if user is not authenticated
      ✓ should throw if checkInId is missing
    ...
    
Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
```

### Failed Test
```
FAIL  core/checkins/__tests__/completeCheckIn.test.js
  completeCheckIn
    Authentication
      ✕ should throw if user is not authenticated
      
      Expected function to throw an error, but it didn't.
      
      at Object.<anonymous> (completeCheckIn.test.js:25:5)
```

---

## 🔍 Coverage Report

After running `npm run test:coverage`, you'll see:

```
-------------------|---------|----------|---------|---------|
File               | % Stmts | % Branch | % Funcs | % Lines |
-------------------|---------|----------|---------|---------|
All files          |   85.23 |    78.45 |   82.10 |   85.23 |
 core/checkins     |   92.10 |    85.20 |   90.00 |   92.10 |
 core/besties      |   88.50 |    82.30 |   87.50 |   88.50 |
-------------------|---------|----------|---------|---------|
```

**Coverage Threshold**: Tests will fail if coverage drops below 70% (configured in `jest.config.js`)

---

## 🐛 Troubleshooting

### Issue: "Cannot find module 'firebase-admin'"
**Solution**: 
```bash
cd functions
npm install
```

### Issue: "Jest is not defined"
**Solution**: Make sure you're in the `functions` directory:
```bash
cd functions
npm test
```

### Issue: Tests timeout
**Solution**: Increase timeout in test file:
```javascript
jest.setTimeout(30000); // 30 seconds
```

### Issue: "Cannot find module" errors
**Solution**: Check that all dependencies are installed:
```bash
cd functions
npm install
```

---

## 📝 Test File Structure

Tests are located in:
```
functions/
├── core/
│   ├── checkins/
│   │   └── __tests__/
│   │       ├── completeCheckIn.test.js
│   │       └── ...
│   └── ...
└── utils/
    └── __tests__/
        └── ...
```

---

## ✅ What Gets Tested

- ✅ All callable functions (user-facing)
- ✅ All HTTP functions (webhooks)
- ✅ All Firestore triggers
- ✅ All scheduled functions
- ✅ All utility functions
- ✅ Integration flows

---

## 🎯 Next Steps After Running Tests

1. **Fix any failing tests**
2. **Review coverage report** - aim for 80%+ coverage
3. **Run tests before each commit**
4. **Add tests for new features**

---

**Happy Testing!** 🧪

