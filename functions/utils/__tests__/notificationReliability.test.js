/**
 * Notification Reliability Tests
 *
 * Verifies that:
 * - All channels (Push, Telegram, Messenger, WhatsApp, SMS, Email, In-app) are attempted
 * - Failures in one channel do not block other channels
 * - Invalid FCM tokens are cleaned up automatically
 * - Notification status is correctly written to Firestore for monitoring
 * - Partial failures are recorded as 'partial', total failures as 'failed'
 * - Retry logic applies correct back-off behaviour
 */

// ---------- Module-level mocks (must be before any require) ----------
jest.mock('twilio');
jest.mock('@sendgrid/mail');
jest.mock('axios');
jest.mock('../checkInNotifications', () => ({
  sendMessengerAlert: jest.fn().mockResolvedValue(),
  sendMessengerContactNotifications: jest.fn().mockResolvedValue(),
}));
jest.mock('../../index', () => ({
  sendTelegramAlert: jest.fn().mockResolvedValue(),
}));
// smsCredits is required inside sendSMSAlert – provide a simple stub
jest.mock('../smsCredits', () => ({
  getAvailableCredits: jest.fn().mockResolvedValue(5),
  deductCredit: jest.fn().mockResolvedValue({ success: true, creditType: 'subscription', newBalance: 4 }),
}));

// ---------- Require modules after mocks are registered ----------
const admin  = require('firebase-admin');
const twilio = require('twilio');
const sgMail = require('@sendgrid/mail');
const axios  = require('axios');

const {
  sendPushNotification,
  sendWhatsAppAlert,
  sendEmailAlert,
  sendCascadingAlert,
  sendAlertToBesties,
} = require('../notifications');

const { isRetryableError, retryOperation } = require('../retry');

// ---------- Shared mock helpers ----------
function makeCheckIn(overrides = {}) {
  return {
    userId:    'user123',
    location:  'Test Location',
    status:    'active',
    alertTime: { toMillis: () => Date.now() - 60_000 },
    bestieIds: ['bestie1'],
    createdAt: { toDate: () => new Date(Date.now() - 3_600_000) },
    notes:     'Test notes',
    photoURLs: [],
    ...overrides,
  };
}

function makeBestieData(overrides = {}) {
  return {
    fcmToken:             'valid-fcm-token',
    notificationsEnabled: true,
    telegramChatId:       null,
    notificationPreferences: {
      telegram: false,
      sms:      false,
      email:    false,
      whatsapp: false,
    },
    phoneNumber: '+61400000001',
    email:       'bestie@example.com',
    ...overrides,
  };
}

// Snapshot mock that behaves like a Firestore QuerySnapshot
function makeMessengerSnapshot(docs = []) {
  return {
    docs,
    forEach: jest.fn((cb) => docs.forEach(cb)),
  };
}

// ---------- Hold stable references to key mock instances ----------
let mockMessagingInstance;
let mockTwilioMessages;
let mockDb;

// Reusable Firestore doc / collection mocks that can be overridden per-test
let mockUserDocRef;
let mockBestieDocRef;
let mockNotificationsAdd;
let mockNotificationStatusAdd;

beforeAll(() => {
  // messaging() returns the same instance throughout the suite
  mockMessagingInstance = admin.messaging();
  // Twilio mock – initialise messages.create once; the module caches the client
  mockTwilioMessages = { create: jest.fn().mockResolvedValue({ sid: 'TW123' }) };
  twilio.mockImplementation(() => ({ messages: mockTwilioMessages }));
});

beforeEach(() => {
  jest.clearAllMocks();

  // Restore default success behaviours
  mockMessagingInstance.send    = jest.fn().mockResolvedValue('projects/test/messages/ok');
  mockTwilioMessages.create     = jest.fn().mockResolvedValue({ sid: 'TW123' });
  sgMail.setApiKey              = jest.fn();
  sgMail.send                   = jest.fn().mockResolvedValue([{ statusCode: 202 }]);
  axios.post                    = jest.fn().mockResolvedValue({ data: { ok: true } });

  // Firestore
  mockDb = admin.firestore();

  mockNotificationsAdd        = jest.fn().mockResolvedValue({ id: 'notif-1' });
  mockNotificationStatusAdd   = jest.fn().mockResolvedValue({ id: 'status-1' });

  mockUserDocRef = {
    get: jest.fn().mockResolvedValue({
      exists: true,
      data: jest.fn(() => ({
        displayName:  'Alice',
        uid:          'user123',
        smsCredits:   { balance: 5, hourlyCount: 0, hourlyResetAt: null, subscriptionCredits: 5 },
      })),
    }),
    update: jest.fn().mockResolvedValue(),
  };

  mockBestieDocRef = {
    get: jest.fn().mockResolvedValue({
      exists: true,
      data: jest.fn(() => makeBestieData()),
    }),
    update: jest.fn().mockResolvedValue(),
  };

  mockDb.collection = jest.fn((name) => {
    if (name === 'users') return {
      doc: jest.fn((id) => id === 'user123' ? mockUserDocRef : mockBestieDocRef),
    };
    if (name === 'notifications')        return { add: mockNotificationsAdd };
    if (name === 'notification_status')  return { add: mockNotificationStatusAdd };
    if (name === 'messengerContacts')     return {
      where: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(makeMessengerSnapshot([])),
      }),
    };
    if (name === 'admin_alerts')  return { add: jest.fn().mockResolvedValue() };
    if (name === 'sms_usage')     return { add: jest.fn().mockResolvedValue() };
    return {
      add:  jest.fn().mockResolvedValue(),
      doc:  jest.fn(() => ({ update: jest.fn().mockResolvedValue() })),
    };
  });
});

// ============================================================
// sendPushNotification
// ============================================================
describe('sendPushNotification', () => {
  test('sends push notification via FCM', async () => {
    await sendPushNotification('token-abc', 'Title', 'Body', { type: 'test' });

    expect(mockMessagingInstance.send).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'token-abc' })
    );
  });

  test('throws when FCM rejects', async () => {
    mockMessagingInstance.send.mockRejectedValue(new Error('FCM error'));

    await expect(sendPushNotification('bad-token', 'T', 'B')).rejects.toThrow('FCM error');
  });

  test('retries on transient FCM errors and ultimately succeeds', async () => {
    const transientError = Object.assign(new Error('unavailable'), { code: 'unavailable' });
    mockMessagingInstance.send
      .mockRejectedValueOnce(transientError)
      .mockResolvedValue('projects/test/messages/456');

    await expect(sendPushNotification('token-abc', 'T', 'B')).resolves.not.toThrow();
    expect(mockMessagingInstance.send).toHaveBeenCalledTimes(2);
  });
});

// ============================================================
// sendWhatsAppAlert
// ============================================================
describe('sendWhatsAppAlert', () => {
  test('sends WhatsApp message via Twilio', async () => {
    await sendWhatsAppAlert('+61400000001', 'Hello');

    expect(mockTwilioMessages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        to:   'whatsapp:+61400000001',
        from: expect.stringContaining('whatsapp:'),
        body: 'Hello',
      })
    );
  });
});

// ============================================================
// sendEmailAlert
// ============================================================
describe('sendEmailAlert', () => {
  const checkIn = {
    location:  'Test Location',
    alertTime: { toMillis: () => Date.now() },
  };

  test('sends email via SendGrid', async () => {
    await sendEmailAlert('test@example.com', 'Alert message', checkIn);

    expect(sgMail.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to:      'test@example.com',
        subject: '🚨 Safety Alert from Besties',
        text:    'Alert message',
      })
    );
  });

  test('throws on SendGrid failure', async () => {
    sgMail.send.mockRejectedValue(new Error('SendGrid down'));

    await expect(sendEmailAlert('bad@example.com', 'msg', checkIn)).rejects.toThrow('SendGrid down');
  });
});

// ============================================================
// sendCascadingAlert – channel fallback and status tracking
// ============================================================
describe('sendCascadingAlert – channel fallback & status tracking', () => {
  const userData = { displayName: 'Alice', uid: 'user123' };

  test('sends push + in-app when no other channels are configured', async () => {
    // Default bestie has no telegram/email/sms/whatsapp
    await sendCascadingAlert('checkin1', makeCheckIn(), 'bestie1', userData);

    expect(mockMessagingInstance.send).toHaveBeenCalledTimes(1);
    expect(mockNotificationsAdd).toHaveBeenCalledTimes(1);
  });

  test('continues to email when push fails', async () => {
    mockMessagingInstance.send.mockRejectedValue(
      Object.assign(new Error('FCM failed'), { code: 'messaging/unknown' })
    );
    mockBestieDocRef.get.mockResolvedValue({
      exists: true,
      data: () => makeBestieData({
        notificationPreferences: { telegram: false, sms: false, email: true },
      }),
    });

    await sendCascadingAlert('checkin1', makeCheckIn(), 'bestie1', userData);

    expect(sgMail.send).toHaveBeenCalledTimes(1);
    // In-app always fires regardless of push failure
    expect(mockNotificationsAdd).toHaveBeenCalledTimes(1);
  });

  test('clears invalid FCM token from Firestore', async () => {
    mockMessagingInstance.send.mockRejectedValue(
      Object.assign(new Error('Token not registered'), {
        code: 'messaging/registration-token-not-registered',
      })
    );

    await sendCascadingAlert('checkin1', makeCheckIn(), 'bestie1', userData);

    expect(mockBestieDocRef.update).toHaveBeenCalledWith(
      expect.objectContaining({ notificationsEnabled: false })
    );
  });

  test('also clears messaging/invalid-registration-token', async () => {
    mockMessagingInstance.send.mockRejectedValue(
      Object.assign(new Error('Invalid token'), {
        code: 'messaging/invalid-registration-token',
      })
    );

    await sendCascadingAlert('checkin1', makeCheckIn(), 'bestie1', userData);

    expect(mockBestieDocRef.update).toHaveBeenCalledWith(
      expect.objectContaining({ notificationsEnabled: false })
    );
  });

  test('does NOT clear token on non-token push errors', async () => {
    mockMessagingInstance.send.mockRejectedValue(
      Object.assign(new Error('Server error'), { code: 'messaging/internal-error' })
    );

    await sendCascadingAlert('checkin1', makeCheckIn(), 'bestie1', userData);

    // update should not be called for token cleanup (but may be called for other reasons)
    const updateCalls = mockBestieDocRef.update.mock.calls;
    const hasTokenCleanup = updateCalls.some(
      (args) => args[0] && args[0].notificationsEnabled === false
    );
    expect(hasTokenCleanup).toBe(false);
  });

  test('records partial failure when some channels fail', async () => {
    mockMessagingInstance.send.mockRejectedValue(
      Object.assign(new Error('FCM failed'), { code: 'messaging/unknown' })
    );
    // No other channels configured → only in-app succeeds
    mockBestieDocRef.get.mockResolvedValue({
      exists: true,
      data: () => makeBestieData({
        notificationPreferences: { telegram: false, sms: false, email: false },
      }),
    });

    await sendCascadingAlert('checkin1', makeCheckIn(), 'bestie1', userData);

    expect(mockNotificationStatusAdd).toHaveBeenCalledWith(
      expect.objectContaining({ status: expect.stringMatching(/partial|failed/) })
    );
  });

  test('records total failure when ALL channels fail (including in-app)', async () => {
    mockMessagingInstance.send.mockRejectedValue(new Error('FCM failed'));
    sgMail.send.mockRejectedValue(new Error('Email failed'));
    mockNotificationsAdd.mockRejectedValue(new Error('Firestore unavailable'));
    mockBestieDocRef.get.mockResolvedValue({
      exists: true,
      data: () => makeBestieData({
        notificationPreferences: { telegram: false, sms: false, email: true },
      }),
    });

    await sendCascadingAlert('checkin1', makeCheckIn(), 'bestie1', userData);

    expect(mockNotificationStatusAdd).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed' })
    );
  });

  test('skips notification_status write when all channels succeed', async () => {
    // Default bestie: only push + in-app, both succeed
    await sendCascadingAlert('checkin1', makeCheckIn(), 'bestie1', userData);

    expect(mockNotificationStatusAdd).not.toHaveBeenCalled();
  });

  test('handles missing bestie gracefully without throwing', async () => {
    mockBestieDocRef.get.mockResolvedValue({ exists: false });

    await expect(
      sendCascadingAlert('checkin1', makeCheckIn(), 'bestie1', userData)
    ).resolves.not.toThrow();

    expect(mockMessagingInstance.send).not.toHaveBeenCalled();
  });

  test('sends via Telegram when configured', async () => {
    const { sendTelegramAlert } = require('../../index');
    mockBestieDocRef.get.mockResolvedValue({
      exists: true,
      data: () => makeBestieData({
        telegramChatId: 'tg-123',
        notificationPreferences: { telegram: true, sms: false, email: false },
      }),
    });

    await sendCascadingAlert('checkin1', makeCheckIn(), 'bestie1', userData);

    expect(sendTelegramAlert).toHaveBeenCalledWith(
      'tg-123',
      expect.objectContaining({ userName: 'Alice' })
    );
  });

  test('records Telegram failure in channelsFailed', async () => {
    const { sendTelegramAlert } = require('../../index');
    sendTelegramAlert.mockRejectedValue(new Error('Telegram offline'));
    mockBestieDocRef.get.mockResolvedValue({
      exists: true,
      data: () => makeBestieData({
        telegramChatId: 'tg-123',
        notificationPreferences: { telegram: true, sms: false, email: false },
      }),
    });

    await sendCascadingAlert('checkin1', makeCheckIn(), 'bestie1', userData);

    // Push + in-app succeed but Telegram fails → partial failure logged
    expect(mockNotificationStatusAdd).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'partial' })
    );
  });
});

// ============================================================
// sendAlertToBesties – initialises cascading alert
// ============================================================
describe('sendAlertToBesties', () => {
  test('does nothing when the check-in has no besties', async () => {
    mockUserDocRef.get.mockResolvedValue({
      exists: true,
      data: jest.fn(() => ({ displayName: 'Alice' })),
    });

    await sendAlertToBesties('checkin1', makeCheckIn({ bestieIds: [] }));

    expect(mockMessagingInstance.send).not.toHaveBeenCalled();
  });

  test('initialises escalation fields on the check-in document', async () => {
    const mockCheckInUpdate = jest.fn().mockResolvedValue();
    mockDb.collection = jest.fn((name) => {
      if (name === 'users') return {
        doc: jest.fn((id) => id === 'user123' ? mockUserDocRef : mockBestieDocRef),
      };
      if (name === 'checkins') return {
        doc: jest.fn(() => ({ update: mockCheckInUpdate })),
      };
      if (name === 'notifications')       return { add: mockNotificationsAdd };
      if (name === 'notification_status') return { add: mockNotificationStatusAdd };
      if (name === 'messengerContacts') return {
        where: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(makeMessengerSnapshot([])),
        }),
      };
      return { add: jest.fn().mockResolvedValue(), doc: jest.fn(() => ({ update: jest.fn().mockResolvedValue() })) };
    });
    mockUserDocRef.get.mockResolvedValue({
      exists: true,
      data: jest.fn(() => ({ displayName: 'Alice', uid: 'user123' })),
    });

    await sendAlertToBesties('checkin1', makeCheckIn());

    expect(mockCheckInUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        currentNotifiedBestie: 'bestie1',
        escalationLevel:       0,
        acknowledgedBy:        [],
      })
    );
  });
});

// ============================================================
// isRetryableError
// ============================================================
describe('isRetryableError', () => {
  test('retries on network errors', () => {
    expect(isRetryableError({ code: 'ECONNRESET' })).toBe(true);
    expect(isRetryableError({ code: 'ETIMEDOUT' })).toBe(true);
    expect(isRetryableError({ code: 'ECONNREFUSED' })).toBe(true);
  });

  test('retries on HTTP 5xx and 429', () => {
    expect(isRetryableError({ statusCode: 500 })).toBe(true);
    expect(isRetryableError({ statusCode: 503 })).toBe(true);
    expect(isRetryableError({ statusCode: 429 })).toBe(true);
  });

  test('does not retry on 4xx (except 408 and 429)', () => {
    expect(isRetryableError({ statusCode: 400 })).toBe(false);
    expect(isRetryableError({ statusCode: 401 })).toBe(false);
    expect(isRetryableError({ statusCode: 404 })).toBe(false);
  });

  test('retries on Firebase unavailable / deadline-exceeded', () => {
    expect(isRetryableError({ code: 'unavailable' })).toBe(true);
    expect(isRetryableError({ code: 'deadline-exceeded' })).toBe(true);
    expect(isRetryableError({ code: 'resource-exhausted' })).toBe(true);
  });

  test('does not retry on generic errors', () => {
    expect(isRetryableError(new Error('generic error'))).toBe(false);
  });
});

// ============================================================
// retryOperation – exponential back-off behaviour
// ============================================================
describe('retryOperation', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('succeeds immediately without retrying', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    await expect(retryOperation(fn, { maxRetries: 3, initialDelay: 100 })).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('retries up to maxRetries times then throws', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('fail'));
    const promise = retryOperation(fn, { maxRetries: 2, initialDelay: 10 });

    // Drive the retry timer loops
    for (let i = 0; i < 4; i++) {
      await Promise.resolve();
      jest.runAllTimers();
    }

    await expect(promise).rejects.toThrow('fail');
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  test('succeeds on a later retry', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValue('recovered');

    const promise = retryOperation(fn, { maxRetries: 3, initialDelay: 10 });
    await Promise.resolve();
    jest.runAllTimers();

    await expect(promise).resolves.toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('does not retry when shouldRetry returns false', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('permanent'));
    await expect(
      retryOperation(fn, { maxRetries: 3, initialDelay: 10, shouldRetry: () => false })
    ).rejects.toThrow('permanent');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
