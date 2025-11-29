#!/usr/bin/env node

/**
 * Script to verify Firebase configuration
 * Run with: node scripts/verify-firebase-config.js
 * 
 * This script checks:
 * 1. Frontend .env file variables
 * 2. Firebase Functions config variables
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
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

function checkFrontendEnv() {
  log('\n📱 Checking Frontend .env file...', 'cyan');
  log('='.repeat(50), 'cyan');

  const envPath = path.join(__dirname, '..', 'frontend', '.env');
  
  if (!fs.existsSync(envPath)) {
    log('❌ .env file not found in frontend folder!', 'red');
    log('   Expected location: frontend/.env', 'yellow');
    return { valid: false, missing: ['.env file'] };
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  const required = [
    'REACT_APP_FIREBASE_API_KEY',
    'REACT_APP_FIREBASE_AUTH_DOMAIN',
    'REACT_APP_FIREBASE_PROJECT_ID',
    'REACT_APP_FIREBASE_STORAGE_BUCKET',
    'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
    'REACT_APP_FIREBASE_APP_ID',
  ];

  const optional = [
    'REACT_APP_FIREBASE_VAPID_KEY',
    'REACT_APP_GOOGLE_MAPS_API_KEY',
    'REACT_APP_STRIPE_PUBLISHABLE_KEY',
  ];

  const missing = required.filter(key => !envVars[key] || envVars[key].trim() === '');
  const present = required.filter(key => envVars[key] && envVars[key].trim() !== '');
  const missingOptional = optional.filter(key => !envVars[key] || envVars[key].trim() === '');

  if (missing.length === 0) {
    log('✅ All required frontend variables are set!', 'green');
  } else {
    log('❌ Missing required frontend variables:', 'red');
    missing.forEach(key => log(`   - ${key}`, 'red'));
  }

  log(`\n✅ Present: ${present.length}/${required.length}`, 'green');
  present.forEach(key => log(`   - ${key}`, 'green'));

  if (missingOptional.length > 0) {
    log(`\n⚠️  Optional variables not set: ${missingOptional.length}`, 'yellow');
    missingOptional.forEach(key => log(`   - ${key}`, 'yellow'));
  }

  return {
    valid: missing.length === 0,
    missing,
    present,
    missingOptional,
  };
}

function checkFunctionsConfig() {
  log('\n☁️  Checking Firebase Functions config...', 'cyan');
  log('='.repeat(50), 'cyan');

  try {
    const configOutput = execSync('firebase functions:config:get', {
      encoding: 'utf8',
      cwd: path.join(__dirname, '..'),
    });

    if (!configOutput || configOutput.trim() === '{}' || configOutput.trim() === '') {
      log('❌ No Firebase Functions config found!', 'red');
      log('   Run: firebase functions:config:set <category>.<key>="<value>"', 'yellow');
      return { valid: false, missing: ['All config'] };
    }

    const config = JSON.parse(configOutput);

    const required = {
      twilio: ['account_sid', 'auth_token', 'phone_number'],
      stripe: ['secret_key', 'publishable_key'],
      sendgrid: ['api_key'],
      app: ['url'],
      email: ['alerts_from', 'notifications_from', 'support_from', 'support_to'],
      admin: ['email'],
    };

    const optional = {
      google: ['maps_api_key'],
      telegram: ['bot_token'],
      facebook: ['page_token'],
      stripe: ['webhook_secret'],
    };

    const missing = [];
    const present = [];
    const missingOptional = [];

    // Check required
    for (const [category, keys] of Object.entries(required)) {
      for (const key of keys) {
        const value = config[category]?.[key];
        if (!value || value.trim() === '') {
          missing.push(`${category}.${key}`);
        } else {
          present.push(`${category}.${key}`);
        }
      }
    }

    // Check optional
    for (const [category, keys] of Object.entries(optional)) {
      for (const key of keys) {
        const value = config[category]?.[key];
        if (!value || value.trim() === '') {
          missingOptional.push(`${category}.${key}`);
        } else {
          present.push(`${category}.${key}`);
        }
      }
    }

    if (missing.length === 0) {
      log('✅ All required Functions config is set!', 'green');
    } else {
      log('❌ Missing required Functions config:', 'red');
      missing.forEach(key => log(`   - ${key}`, 'red'));
    }

    log(`\n✅ Present: ${present.length} config values`, 'green');

    if (missingOptional.length > 0) {
      log(`\n⚠️  Optional config not set: ${missingOptional.length}`, 'yellow');
      missingOptional.forEach(key => log(`   - ${key}`, 'yellow'));
    }

    return {
      valid: missing.length === 0,
      missing,
      present,
      missingOptional,
    };
  } catch (error) {
    log('❌ Error checking Functions config:', 'red');
    log(`   ${error.message}`, 'red');
    log('\n   Make sure you are:', 'yellow');
    log('   1. Logged in: firebase login', 'yellow');
    log('   2. In the correct project: firebase use <project-id>', 'yellow');
    return { valid: false, error: error.message };
  }
}

// Main execution
function main() {
  log('\n🔍 Firebase Configuration Verification', 'blue');
  log('='.repeat(50), 'blue');

  const frontendResult = checkFrontendEnv();
  const functionsResult = checkFunctionsConfig();

  log('\n📊 Summary', 'cyan');
  log('='.repeat(50), 'cyan');

  const allValid = frontendResult.valid && functionsResult.valid;

  if (allValid) {
    log('\n✅ All configuration is valid!', 'green');
    log('   Your Firebase setup is complete and ready to use.', 'green');
    process.exit(0);
  } else {
    log('\n❌ Configuration incomplete!', 'red');
    if (!frontendResult.valid) {
      log('   Frontend .env file is missing required variables.', 'red');
    }
    if (!functionsResult.valid) {
      log('   Firebase Functions config is missing required values.', 'red');
    }
    log('\n   See above for details on what needs to be set.', 'yellow');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { checkFrontendEnv, checkFunctionsConfig };

