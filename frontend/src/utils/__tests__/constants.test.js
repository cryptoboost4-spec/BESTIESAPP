/**
 * Constants Tests
 */
import {
  MAX_BESTIES,
  MIN_BESTIES_FOR_CHECKIN,
  MIN_CHECKIN_DURATION,
  MAX_CHECKIN_DURATION,
  MAX_PROFILE_PICTURE_SIZE,
  MAX_CHECKIN_PHOTO_SIZE,
  PRIVACY_LEVELS,
  CHECKIN_STATUS,
  SOS_RATE_LIMIT_PER_HOUR,
} from '../constants';

describe('Constants', () => {
  test('MAX_BESTIES should be 5', () => {
    expect(MAX_BESTIES).toBe(5);
  });

  test('MIN_BESTIES_FOR_CHECKIN should be 1', () => {
    expect(MIN_BESTIES_FOR_CHECKIN).toBe(1);
  });

  test('MIN_CHECKIN_DURATION should be 10 minutes', () => {
    expect(MIN_CHECKIN_DURATION).toBe(10);
  });

  test('MAX_CHECKIN_DURATION should be 180 minutes', () => {
    expect(MAX_CHECKIN_DURATION).toBe(180);
  });

  test('MAX_PROFILE_PICTURE_SIZE should be 2MB', () => {
    expect(MAX_PROFILE_PICTURE_SIZE).toBe(2 * 1024 * 1024);
  });

  test('MAX_CHECKIN_PHOTO_SIZE should be 10MB', () => {
    expect(MAX_CHECKIN_PHOTO_SIZE).toBe(10 * 1024 * 1024);
  });

  test('PRIVACY_LEVELS should have correct values', () => {
    expect(PRIVACY_LEVELS.ALL_BESTIES).toBe('all_besties');
    expect(PRIVACY_LEVELS.CIRCLE).toBe('circle');
    expect(PRIVACY_LEVELS.ALERTS_ONLY).toBe('alerts_only');
  });

  test('CHECKIN_STATUS should have correct values', () => {
    expect(CHECKIN_STATUS.ACTIVE).toBe('active');
    expect(CHECKIN_STATUS.COMPLETED).toBe('completed');
    expect(CHECKIN_STATUS.ALERTED).toBe('alerted');
    expect(CHECKIN_STATUS.FALSE_ALARM).toBe('false_alarm');
  });

  test('SOS_RATE_LIMIT_PER_HOUR should be 3', () => {
    expect(SOS_RATE_LIMIT_PER_HOUR).toBe(3);
  });
});

