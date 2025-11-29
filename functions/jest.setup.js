// Jest setup file for Cloud Functions tests

// Create mock document reference
const createMockDocRef = (overrides = {}) => {
  const mockDoc = {
    exists: true,
    data: jest.fn(() => ({})),
    id: 'mock-doc-id',
    ...overrides,
  };
  return {
    get: jest.fn().mockResolvedValue(mockDoc),
    update: jest.fn().mockResolvedValue(),
    set: jest.fn().mockResolvedValue(),
    delete: jest.fn().mockResolvedValue(),
    ...overrides,
  };
};

// Create mock query snapshot
const createMockQuerySnapshot = (docs = []) => ({
  empty: docs.length === 0,
  size: docs.length,
  docs: docs,
  forEach: jest.fn((callback) => {
    docs.forEach(callback);
  }),
});

// Create mock query reference (chainable)
const createMockQuery = () => {
  const query = {
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    startAfter: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue(createMockQuerySnapshot()),
    count: jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue({ data: () => ({ count: 0 }) }),
    }),
  };
  return query;
};

// Create mock collection reference
const createMockCollection = () => {
  const collection = {
    doc: jest.fn((id) => createMockDocRef({ id: id || 'mock-doc-id' })),
    where: jest.fn(() => createMockQuery()),
    limit: jest.fn(() => createMockQuery()),
    orderBy: jest.fn(() => createMockQuery()),
    get: jest.fn().mockResolvedValue(createMockQuerySnapshot()),
    add: jest.fn().mockResolvedValue(createMockDocRef()),
    getAll: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue({ data: () => ({ count: 0 }) }),
    }),
  };
  return collection;
};

// Create Timestamp mock
const createTimestamp = (millis = Date.now()) => ({
  seconds: Math.floor(millis / 1000),
  nanoseconds: (millis % 1000) * 1000000,
  toMillis: () => millis,
  toDate: () => new Date(millis),
});

// Mock Firebase Admin - use singleton pattern so cached db references work
// This ensures that when functions cache `const db = admin.firestore()`, 
// they get the same instance that tests can override
let mockDbInstance = null;
const mockFirestoreFn = jest.fn(() => {
  if (!mockDbInstance) {
    mockDbInstance = {
      collection: jest.fn((name) => createMockCollection()),
      doc: jest.fn((path) => {
        const parts = path ? path.split('/') : [];
        return createMockDocRef({ id: parts[parts.length - 1] || 'mock-doc-id' });
      }),
      batch: jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        commit: jest.fn().mockResolvedValue(),
      })),
      getAll: jest.fn().mockResolvedValue([]),
    };
  }
  return mockDbInstance;
});

// Attach static methods to the mock function
mockFirestoreFn.Timestamp = {
  now: jest.fn(() => createTimestamp()),
  fromDate: jest.fn((date) => createTimestamp(date.getTime())),
  fromMillis: jest.fn((millis) => createTimestamp(millis)),
};

mockFirestoreFn.FieldValue = {
  increment: jest.fn((value) => ({ _methodName: 'FieldValue.increment', _value: value })),
  arrayUnion: jest.fn((...elements) => ({ _methodName: 'FieldValue.arrayUnion', _elements: elements })),
  arrayRemove: jest.fn((...elements) => ({ _methodName: 'FieldValue.arrayRemove', _elements: elements })),
  serverTimestamp: jest.fn(() => ({ _methodName: 'FieldValue.serverTimestamp' })),
  delete: jest.fn(() => ({ _methodName: 'FieldValue.delete' })),
};

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: mockFirestoreFn,
  auth: jest.fn(() => ({
    getUser: jest.fn(),
    createUser: jest.fn(),
  })),
  messaging: (() => {
    const mockMessagingInstance = {
      send: jest.fn().mockResolvedValue({}),
    };
    return jest.fn(() => mockMessagingInstance);
  })(),
  storage: jest.fn(() => ({
    bucket: jest.fn(() => ({
      file: jest.fn(() => ({
        delete: jest.fn().mockResolvedValue(),
      })),
    })),
  })),
}));

// Mock Firebase Functions
jest.mock('firebase-functions', () => ({
  https: {
    onCall: jest.fn((handler) => handler),
    onRequest: jest.fn((handler) => handler),
    HttpsError: class HttpsError extends Error {
      constructor(code, message, details) {
        super(message);
        this.code = code;
        this.details = details;
      }
    },
  },
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
  pubsub: {
    schedule: jest.fn(() => ({
      onRun: jest.fn((handler) => handler),
      timeZone: jest.fn(() => ({
        onRun: jest.fn((handler) => handler),
      })),
    })),
  },
  firestore: {
    document: jest.fn(() => ({
      onCreate: jest.fn((handler) => handler),
      onUpdate: jest.fn((handler) => handler),
      onDelete: jest.fn((handler) => handler),
    })),
  },
  auth: {
    user: jest.fn(() => ({
      onCreate: jest.fn((handler) => handler),
    })),
  },
  config: jest.fn(() => ({
    sendgrid: { api_key: 'SG.test-key' },
    twilio: { account_sid: 'test-sid', auth_token: 'test-token', phone_number: '+1234567890' },
    stripe: { secret_key: 'sk_test_key', publishable_key: 'pk_test_key', webhook_secret: 'whsec_test_secret' },
    telegram: { bot_token: 'test-bot-token' },
    facebook: { page_token: 'test-page-token' },
    google: { maps_api_key: 'test-maps-key' },
    app: { url: 'https://bestiesapp.web.app', domain: 'bestiesapp.web.app', support_email: 'support@bestiesapp.xyz' },
  })),
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Set test timeout
jest.setTimeout(10000);

