/**
 * Application constants
 * Centralized location for magic numbers and configuration values
 */

// Bestie limits
export const MAX_BESTIES = 5;
export const MIN_BESTIES_FOR_CHECKIN = 1;

// Check-in limits
export const MIN_CHECKIN_DURATION = 10; // minutes
export const MAX_CHECKIN_DURATION = 180; // minutes
export const DEFAULT_CHECKIN_DURATION = 30; // minutes

// Quick check-in durations (in minutes)
export const QUICK_CHECKIN_DURATIONS = [15, 30, 60];

// File upload limits
export const MAX_PROFILE_PICTURE_SIZE = 2 * 1024 * 1024; // 2MB
export const MAX_CHECKIN_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10MB

// Notification limits
export const MAX_NOTIFICATIONS_DISPLAY = 50;

// Rate limiting
export const SOS_RATE_LIMIT_PER_HOUR = 3;
export const SOS_WARNING_THRESHOLD = 2;

// Privacy levels
export const PRIVACY_LEVELS = {
  ALL_BESTIES: 'all_besties',
  CIRCLE: 'circle',
  ALERTS_ONLY: 'alerts_only',
};

// Check-in statuses
export const CHECKIN_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ALERTED: 'alerted',
  FALSE_ALARM: 'false_alarm',
};

// Bestie request statuses
export const BESTIE_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  CANCELLED: 'cancelled',
  INVITED: 'invited',
};

// Alert escalation
export const ALERT_ESCALATION_TIMEOUT = 30; // seconds between cascading alerts

// Profile completion
export const PROFILE_COMPLETION_TASKS = {
  EASY: 5,
  HARDER: 9,
  TOTAL: 14,
};

// Badge limits
export const MAX_FEATURED_BADGES = 3;

// Streak thresholds
export const STREAK_MILESTONES = [3, 7, 30, 100];

// Circle health levels
export const CIRCLE_HEALTH_LEVELS = {
  PERFECT: 100,
  EXCELLENT: 80,
  GOOD: 60,
  FAIR: 40,
  POOR: 20,
};

// Data retention
export const DEFAULT_DATA_RETENTION_HOURS = 24;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

