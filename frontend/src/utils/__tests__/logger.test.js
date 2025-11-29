/**
 * Logger Utility Tests
 */
import logger from '../logger';

// Mock console methods
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
  group: console.group,
  groupEnd: console.groupEnd,
};

beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
  console.info = jest.fn();
  console.debug = jest.fn();
  console.group = jest.fn();
  console.groupEnd = jest.fn();
});

afterEach(() => {
  Object.assign(console, originalConsole);
});

describe('Logger Utility', () => {
  describe('Development Mode', () => {
    beforeAll(() => {
      process.env.NODE_ENV = 'development';
    });

    test('logger.log should call console.log in development', () => {
      logger.log('test message');
      expect(console.log).toHaveBeenCalledWith('test message');
    });

    test('logger.warn should call console.warn in development', () => {
      logger.warn('warning message');
      expect(console.warn).toHaveBeenCalledWith('warning message');
    });

    test('logger.info should call console.info in development', () => {
      logger.info('info message');
      expect(console.info).toHaveBeenCalledWith('info message');
    });

    test('logger.debug should call console.debug in development', () => {
      logger.debug('debug message');
      expect(console.debug).toHaveBeenCalledWith('debug message');
    });

    test('logger.group should call console.group in development', () => {
      logger.group('group label');
      expect(console.group).toHaveBeenCalledWith('group label');
    });
  });

  describe('Production Mode', () => {
    beforeAll(() => {
      process.env.NODE_ENV = 'production';
    });

    test('logger.log should NOT call console.log in production', () => {
      logger.log('test message');
      expect(console.log).not.toHaveBeenCalled();
    });

    test('logger.warn should NOT call console.warn in production', () => {
      logger.warn('warning message');
      expect(console.warn).not.toHaveBeenCalled();
    });

    test('logger.info should NOT call console.info in production', () => {
      logger.info('info message');
      expect(console.info).not.toHaveBeenCalled();
    });
  });

  describe('Error Logging (Always)', () => {
    test('logger.error should always call console.error', () => {
      process.env.NODE_ENV = 'production';
      logger.error('error message');
      expect(console.error).toHaveBeenCalledWith('error message');

      process.env.NODE_ENV = 'development';
      logger.error('error message 2');
      expect(console.error).toHaveBeenCalledWith('error message 2');
    });
  });
});

