/**
 * Tests for configuration verification utility
 */
const { verifyConfig, getConfigReport, requireConfig } = require('../verifyConfig');
const functions = require('firebase-functions');

// Mock firebase-functions
jest.mock('firebase-functions', () => ({
  config: jest.fn(),
}));

describe('verifyConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return valid=true when all required config is present', () => {
    functions.config.mockReturnValue({
      twilio: {
        account_sid: 'test_sid',
        auth_token: 'test_token',
        phone_number: '+1234567890',
      },
      stripe: {
        secret_key: 'sk_test_123',
        publishable_key: 'pk_test_123',
      },
      sendgrid: {
        api_key: 'SG.test_key',
      },
      app: {
        url: 'https://bestiesapp.xyz',
      },
      email: {
        alerts_from: 'alerts@bestiesapp.com',
        notifications_from: 'notifications@bestiesapp.com',
        support_from: 'support@bestiesapp.com',
        support_to: 'support@bestiesapp.com',
      },
      admin: {
        email: 'admin@bestiesapp.com',
      },
    });

    const result = verifyConfig();
    expect(result.valid).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it('should return valid=false when required config is missing', () => {
    functions.config.mockReturnValue({
      twilio: {
        account_sid: 'test_sid',
        // Missing auth_token and phone_number
      },
      stripe: {
        secret_key: 'sk_test_123',
        // Missing publishable_key
      },
    });

    const result = verifyConfig();
    expect(result.valid).toBe(false);
    expect(result.missing.length).toBeGreaterThan(0);
    expect(result.missing).toContain('twilio.auth_token');
    expect(result.missing).toContain('twilio.phone_number');
    expect(result.missing).toContain('stripe.publishable_key');
  });

  it('should detect empty string values as missing', () => {
    functions.config.mockReturnValue({
      twilio: {
        account_sid: 'test_sid',
        auth_token: '', // Empty string
        phone_number: '   ', // Whitespace only
      },
    });

    const result = verifyConfig();
    expect(result.valid).toBe(false);
    expect(result.missing).toContain('twilio.auth_token');
    expect(result.missing).toContain('twilio.phone_number');
  });

  it('should track optional config separately', () => {
    functions.config.mockReturnValue({
      twilio: {
        account_sid: 'test_sid',
        auth_token: 'test_token',
        phone_number: '+1234567890',
      },
      stripe: {
        secret_key: 'sk_test_123',
        publishable_key: 'pk_test_123',
      },
      sendgrid: {
        api_key: 'SG.test_key',
      },
      app: {
        url: 'https://bestiesapp.xyz',
      },
      email: {
        alerts_from: 'alerts@bestiesapp.com',
        notifications_from: 'notifications@bestiesapp.com',
        support_from: 'support@bestiesapp.com',
        support_to: 'support@bestiesapp.com',
      },
      admin: {
        email: 'admin@bestiesapp.com',
      },
      google: {
        maps_api_key: 'AIza_test_key', // Optional but present
      },
      // telegram and facebook not set (optional)
    });

    const result = verifyConfig();
    expect(result.valid).toBe(true);
    expect(result.optional.present).toContain('google.maps_api_key');
    expect(result.optional.missing).toContain('telegram.bot_token');
    expect(result.optional.missing).toContain('facebook.page_token');
  });

  it('should generate a readable report', () => {
    functions.config.mockReturnValue({
      twilio: {
        account_sid: 'test_sid',
        auth_token: 'test_token',
        phone_number: '+1234567890',
      },
      stripe: {
        secret_key: 'sk_test_123',
        publishable_key: 'pk_test_123',
      },
      sendgrid: {
        api_key: 'SG.test_key',
      },
      app: {
        url: 'https://bestiesapp.xyz',
      },
      email: {
        alerts_from: 'alerts@bestiesapp.com',
        notifications_from: 'notifications@bestiesapp.com',
        support_from: 'support@bestiesapp.com',
        support_to: 'support@bestiesapp.com',
      },
      admin: {
        email: 'admin@bestiesapp.com',
      },
    });

    const report = getConfigReport();
    expect(report).toContain('Configuration Report');
    expect(report).toContain('✅ All required configuration is set!');
    expect(report).toContain('twilio.account_sid');
  });

  it('should throw error when requireConfig is called with missing config', () => {
    functions.config.mockReturnValue({
      twilio: {
        account_sid: 'test_sid',
        // Missing other required fields
      },
    });

    expect(() => requireConfig()).toThrow('Missing required Firebase Functions configuration');
  });

  it('should not throw when requireConfig is called with all config present', () => {
    functions.config.mockReturnValue({
      twilio: {
        account_sid: 'test_sid',
        auth_token: 'test_token',
        phone_number: '+1234567890',
      },
      stripe: {
        secret_key: 'sk_test_123',
        publishable_key: 'pk_test_123',
      },
      sendgrid: {
        api_key: 'SG.test_key',
      },
      app: {
        url: 'https://bestiesapp.xyz',
      },
      email: {
        alerts_from: 'alerts@bestiesapp.com',
        notifications_from: 'notifications@bestiesapp.com',
        support_from: 'support@bestiesapp.com',
        support_to: 'support@bestiesapp.com',
      },
      admin: {
        email: 'admin@bestiesapp.com',
      },
    });

    expect(() => requireConfig()).not.toThrow();
  });
});

