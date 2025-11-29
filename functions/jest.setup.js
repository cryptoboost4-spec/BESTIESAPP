// Jest setup file for Cloud Functions tests

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: jest.fn(() => ({
    collection: jest.fn(),
    doc: jest.fn(),
  })),
  auth: jest.fn(),
  messaging: jest.fn(),
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
  config: jest.fn(() => ({})),
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Set test timeout
jest.setTimeout(10000);

