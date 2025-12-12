const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * Audit Logger - Centralized security event logging
 * Logs all security-critical operations for incident response
 */

const AuditEventType = {
  // Authentication events
  LOGIN_SUCCESS: 'auth.login.success',
  LOGIN_FAILURE: 'auth.login.failure',
  LOGOUT: 'auth.logout',
  PASSWORD_RESET: 'auth.password_reset',

  // Emergency events
  SOS_TRIGGERED: 'emergency.sos.triggered',
  SOS_REVERSED: 'emergency.sos.reversed',
  DURESS_CODE_USED: 'emergency.duress_code.used',

  // Account events
  ACCOUNT_CREATED: 'account.created',
  ACCOUNT_DELETED: 'account.deleted',
  ACCOUNT_SUSPENDED: 'account.suspended',

  // Data access
  ADMIN_ACCESS: 'admin.access',
  BULK_DATA_EXPORT: 'data.bulk_export',
  SENSITIVE_DATA_ACCESS: 'data.sensitive_access',

  // Payment events
  PAYMENT_INITIATED: 'payment.initiated',
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_FAILED: 'payment.failed',

  // Security events
  RATE_LIMIT_EXCEEDED: 'security.rate_limit_exceeded',
  UNAUTHORIZED_ACCESS: 'security.unauthorized_access',
  SUSPICIOUS_ACTIVITY: 'security.suspicious_activity',
};

/**
 * Log an audit event
 * @param {string} eventType - Type from AuditEventType
 * @param {string} userId - User ID (or null for anonymous)
 * @param {Object} details - Additional event details
 * @param {string} severity - 'info' | 'warning' | 'critical'
 */
async function logAuditEvent(eventType, userId, details = {}, severity = 'info') {
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const auditEntry = {
    eventType,
    userId: userId || null,
    timestamp,
    severity,
    details,
    // Add context
    functionName: process.env.FUNCTION_NAME || 'unknown',
    projectId: process.env.GCLOUD_PROJECT || 'unknown',
  };

  try {
    // Write to audit_logs collection
    await admin.firestore()
      .collection('audit_logs')
      .add(auditEntry);

    // Also log to Cloud Logging for alerting
    if (severity === 'critical') {
      functions.logger.error('CRITICAL AUDIT EVENT', auditEntry);
    } else if (severity === 'warning') {
      functions.logger.warn('Audit Event', auditEntry);
    } else {
      functions.logger.info('Audit Event', auditEntry);
    }

  } catch (error) {
    // Never let audit logging failure break the main function
    functions.logger.error('Failed to write audit log', {
      error: error.message,
      eventType,
      userId,
    });
  }
}

/**
 * Audit middleware for Cloud Functions
 * Wraps a function to automatically log entry/exit
 */
function withAudit(eventType, func) {
  return async (data, context) => {
    const userId = context.auth?.uid || null;
    const startTime = Date.now();

    await logAuditEvent(eventType, userId, {
      action: 'function_called',
      data: sanitizeForLog(data),
    }, 'info');

    try {
      const result = await func(data, context);

      await logAuditEvent(eventType, userId, {
        action: 'function_completed',
        duration_ms: Date.now() - startTime,
      }, 'info');

      return result;
    } catch (error) {
      await logAuditEvent(eventType, userId, {
        action: 'function_failed',
        error: error.message,
        duration_ms: Date.now() - startTime,
      }, 'warning');

      throw error;
    }
  };
}

/**
 * Sanitize data for logging (remove sensitive fields)
 */
function sanitizeForLog(data) {
  if (!data || typeof data !== 'object') return data;

  const sanitized = { ...data };
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'phoneNumber', 'email'];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

module.exports = {
  AuditEventType,
  logAuditEvent,
  withAudit,
};
