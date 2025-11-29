const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');
const EMAIL_CONFIG = require('../../utils/emailConfig');

// Lazy SendGrid initialization
let sendGridInitialized = false;

function initializeSendGrid() {
  if (!sendGridInitialized) {
    const apiKey = functions.config().sendgrid?.api_key;
    if (!apiKey) {
      throw new Error('SendGrid API key not configured. Please set sendgrid.api_key in Firebase Functions config.');
    }
    sgMail.setApiKey(apiKey);
    sendGridInitialized = true;
  }
}

const db = admin.firestore();
const APP_URL = functions.config().app?.url || 'https://bestiesapp.web.app';

// Monitor critical errors and send email alerts to admin
// Only alerts on SITE ISSUES (affecting multiple users or core functionality)
// Not individual user errors
exports.monitorCriticalErrors = functions.firestore
  .document('errors/{errorId}')
  .onCreate(async (snapshot, context) => {
    const error = snapshot.data();

    // First check: Is this error type critical at all?
    const isCriticalType =
      error.type === 'uncaught_error' ||
      error.type === 'unhandled_promise' ||
      error.message?.includes('verification failed') ||
      error.message?.includes('Check-in was not saved') ||
      error.message?.includes('Firebase') ||
      error.message?.includes('Database') ||
      error.message?.includes('Function') ||
      error.code === 'permission-denied' ||
      error.code === 'unavailable';

    if (!isCriticalType) {
      return null; // Not a critical error type
    }

    // Second check: Is this a SITE ISSUE or just a single user problem?
    // Look for same error in last 5 minutes from multiple users
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const recentErrorsQuery = await db.collection('errors')
      .where('message', '==', error.message)
      .where('timestamp', '>=', fiveMinutesAgo)
      .get();

    const uniqueUsers = new Set();
    recentErrorsQuery.forEach(doc => {
      const errorData = doc.data();
      if (errorData.userId) {
        uniqueUsers.add(errorData.userId);
      }
    });

    // Only alert if multiple users (2+) have same error, OR if it's a database/firebase error
    const isSystemError =
      error.message?.includes('Firebase') ||
      error.message?.includes('Database') ||
      error.code === 'unavailable' ||
      error.code === 'permission-denied';

    const affectsMultipleUsers = uniqueUsers.size >= 2;

    if (!isSystemError && !affectsMultipleUsers) {
      functions.logger.debug('Single user error, not alerting admin:', error.message);
      return null; // Single user error, don't alert
    }

    functions.logger.warn(`SITE ISSUE detected: ${error.message} (affects ${uniqueUsers.size} users)`);

    // Send email alert to admin
    initializeSendGrid();
    
    const alertType = isSystemError ? 'SYSTEM ERROR' : `SITE ISSUE (${uniqueUsers.size} users affected)`;

    const msg = {
      to: EMAIL_CONFIG.ADMIN,
      from: EMAIL_CONFIG.ALERTS,
      subject: `🚨 ${alertType} - ${error.type}`,
      html: `
        <h2 style="color: #dc2626;">${alertType}</h2>

        <div style="background: #fee2e2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
          <strong>Error Message:</strong><br/>
          ${error.message}
        </div>

        ${affectsMultipleUsers ? `
          <div style="background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <strong>⚠️ This error has affected ${uniqueUsers.size} users in the last 5 minutes</strong>
          </div>
        ` : ''}

        <h3>Details:</h3>
        <ul>
          <li><strong>Type:</strong> ${error.type}</li>
          <li><strong>Severity:</strong> ${isSystemError ? 'System Error' : 'Multiple Users Affected'}</li>
          <li><strong>User ID:</strong> ${error.userId || 'Anonymous'}</li>
          <li><strong>Session ID:</strong> ${error.sessionId}</li>
          <li><strong>URL:</strong> ${error.url}</li>
          <li><strong>Timestamp:</strong> ${new Date(error.timestamp).toISOString()}</li>
          ${error.filename ? `<li><strong>File:</strong> ${error.filename}:${error.lineno}:${error.colno}</li>` : ''}
        </ul>

        ${error.stack ? `
          <h3>Stack Trace:</h3>
          <pre style="background: #f3f4f6; padding: 15px; border-radius: 8px; overflow-x: auto;">
${error.stack}
          </pre>
        ` : ''}

        ${error.details ? `
          <h3>Additional Details:</h3>
          <pre style="background: #f3f4f6; padding: 15px; border-radius: 8px; overflow-x: auto;">
${JSON.stringify(error.details, null, 2)}
          </pre>
        ` : ''}

        <hr style="margin: 30px 0;"/>

        <p>
          <a href="${APP_URL}/error-dashboard"
             style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
            View Error Dashboard
          </a>
        </p>

        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          This is an automated alert from Besties Error Monitoring System.
        </p>
      `,
    };

    try {
      await sgMail.send(msg);
      functions.logger.info('Critical error alert sent to admin');
    } catch (emailError) {
      functions.logger.error('Failed to send email alert:', emailError);
    }

    return null;
  });
