/**
 * Tests for notification utilities
 */
const twilio = require('twilio');
const sgMail = require('@sendgrid/mail');
const { sendSMSAlert, sendWhatsAppAlert, sendEmailAlert } = require('../notifications');

// Mock dependencies
jest.mock('twilio');
jest.mock('@sendgrid/mail');
jest.mock('firebase-functions', () => ({
  config: jest.fn(() => ({
    twilio: {
      account_sid: 'test_sid',
      auth_token: 'test_token',
      phone_number: '+1234567890',
    },
    sendgrid: {
      api_key: 'test_key',
    },
  })),
}));

describe('Notification Utilities', () => {
  let mockTwilioClient;
  let mockMessages;

  beforeEach(() => {
    mockMessages = {
      create: jest.fn().mockResolvedValue({ sid: 'test_sid' }),
    };

    mockTwilioClient = {
      messages: mockMessages,
    };

    twilio.mockImplementation(() => mockTwilioClient);
    sgMail.setApiKey = jest.fn();
    sgMail.send = jest.fn().mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendSMSAlert', () => {
    test('should send SMS via Twilio', async () => {
      await sendSMSAlert('+61412345678', 'Test message');

      expect(mockMessages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '+61412345678',
          from: '+1234567890',
          body: 'Test message',
        })
      );
    });

    test('should handle Twilio errors', async () => {
      // Create a new mock that rejects
      const rejectMock = jest.fn().mockRejectedValue(new Error('Twilio error'));
      mockTwilioClient.messages.create = rejectMock;
      twilio.mockImplementation(() => mockTwilioClient);

      await expect(
        sendSMSAlert('+61412345678', 'Test message')
      ).rejects.toThrow('Twilio error');
    });
  });

  describe('sendWhatsAppAlert', () => {
    test('should send WhatsApp message via Twilio', async () => {
      // Reset mocks to ensure clean state
      jest.clearAllMocks();
      mockMessages.create = jest.fn().mockResolvedValue({ sid: 'test_sid' });
      mockTwilioClient.messages = mockMessages;
      twilio.mockImplementation(() => mockTwilioClient);

      await sendWhatsAppAlert('+61412345678', 'Test message');

      expect(mockMessages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'whatsapp:+61412345678',
          from: expect.stringContaining('whatsapp:'),
          body: 'Test message',
        })
      );
    });
  });

  describe('sendEmailAlert', () => {
    test('should send email via SendGrid', async () => {
      const checkIn = {
        location: 'Test Location',
        alertTime: {
          toMillis: () => Date.now(),
        },
      };

      await sendEmailAlert('test@example.com', 'Test message', checkIn);

      expect(sgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: '🚨 Safety Alert from Besties',
          text: 'Test message',
        })
      );
    });

    test('should handle SendGrid errors', async () => {
      const checkIn = {
        location: 'Test Location',
        alertTime: {
          toMillis: () => Date.now(),
        },
      };

      sgMail.send.mockRejectedValue(new Error('SendGrid error'));

      await expect(
        sendEmailAlert('test@example.com', 'Test message', checkIn)
      ).rejects.toThrow();
    });
  });
});

