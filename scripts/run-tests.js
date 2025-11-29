#!/usr/bin/env node

/**
 * Test Runner Script
 * Runs all tests and generates a comprehensive test report
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, cwd, description) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`Running: ${description}`, 'blue');
  log(`${'='.repeat(60)}`, 'cyan');
  
  try {
    execSync(command, { 
      cwd, 
      stdio: 'inherit',
      env: { ...process.env, CI: 'true' }
    });
    log(`✅ ${description} - PASSED`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} - FAILED`, 'red');
    return false;
  }
}

function main() {
  log('\n🧪 BESTIES APP - COMPREHENSIVE TEST SUITE', 'cyan');
  log('='.repeat(60), 'cyan');
  
  const results = {
    frontend: false,
    backend: false,
    integration: false,
  };

  // Check if we're in the right directory
  if (!fs.existsSync('frontend') || !fs.existsSync('functions')) {
    log('❌ Error: Must run from project root directory', 'red');
    process.exit(1);
  }

  // Frontend Tests
  if (fs.existsSync('frontend/package.json')) {
    log('\n📱 Frontend Tests', 'yellow');
    results.frontend = runCommand(
      'npm test -- --watchAll=false --coverage',
      'frontend',
      'Frontend Unit Tests'
    );
  } else {
    log('⚠️  Frontend tests skipped (package.json not found)', 'yellow');
  }

  // Backend Tests
  if (fs.existsSync('functions/package.json')) {
    log('\n⚙️  Backend Tests', 'yellow');
    results.backend = runCommand(
      'npm test',
      'functions',
      'Backend Unit Tests'
    );
  } else {
    log('⚠️  Backend tests skipped (package.json not found)', 'yellow');
  }

  // Integration Tests (if they exist)
  if (fs.existsSync('tests/integration')) {
    log('\n🔗 Integration Tests', 'yellow');
    results.integration = runCommand(
      'npm test',
      'tests',
      'Integration Tests'
    );
  } else {
    log('ℹ️  Integration tests not found (optional)', 'yellow');
  }

  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 TEST SUMMARY', 'cyan');
  log('='.repeat(60), 'cyan');
  
  log(`Frontend Tests: ${results.frontend ? '✅ PASSED' : '❌ FAILED'}`, results.frontend ? 'green' : 'red');
  log(`Backend Tests: ${results.backend ? '✅ PASSED' : '❌ FAILED'}`, results.backend ? 'green' : 'red');
  log(`Integration Tests: ${results.integration ? '✅ PASSED' : '⚠️  SKIPPED'}`, results.integration ? 'green' : 'yellow');

  const allPassed = results.frontend && results.backend;
  
  if (allPassed) {
    log('\n🎉 All tests passed!', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Some tests failed. Please review the output above.', 'red');
    process.exit(1);
  }
}

main();

