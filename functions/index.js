const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();

// ========================================
// CHECK-IN FUNCTIONS
// ========================================
const { checkExpiredCheckIns } = require('./core/checkins/checkExpiredCheckIns');
const { checkCascadingAlertEscalation } = require('./core/checkins/checkCascadingAlertEscalation');
const { acknowledgeAlert } = require('./core/checkins/acknowledgeAlert');
const { extendCheckIn } = require('./core/checkins/extendCheckIn');
const { completeCheckIn } = require('./core/checkins/completeCheckIn');
const { onCheckInCreated } = require('./core/checkins/onCheckInCreated');
const { onCheckInCountUpdate } = require('./core/checkins/onCheckInCountUpdate');
const { sendCheckInReminders } = require('./core/checkins/sendCheckInReminders');
const { trackCheckInReaction } = require('./core/checkins/trackCheckInReaction');
const { trackCheckInComment } = require('./core/checkins/trackCheckInComment');

// ========================================
// BESTIE FUNCTIONS
// ========================================
const { sendBestieInvite } = require('./core/besties/sendBestieInvite');
const { acceptBestieRequest } = require('./core/besties/acceptBestieRequest');
const { declineBestieRequest } = require('./core/besties/declineBestieRequest');
const { onBestieCountUpdate } = require('./core/besties/onBestieCountUpdate');
const { onBestieCreated } = require('./core/besties/onBestieCreated');
const { onBestieDeleted } = require('./core/besties/onBestieDeleted');

// ========================================
// USER FUNCTIONS
// ========================================
const { onUserCreated } = require('./core/users/onUserCreated');

// ========================================
// EMERGENCY FUNCTIONS
// ========================================
const { onDuressCodeUsed } = require('./core/emergency/onDuressCodeUsed');
const { triggerEmergencySOS } = require('./core/emergency/triggerEmergencySOS');

// ========================================
// ANALYTICS FUNCTIONS
// ========================================
const { dailyAnalyticsAggregation } = require('./core/analytics/dailyAnalyticsAggregation');
const { updateDailyStreaks } = require('./core/analytics/updateDailyStreaks');
const { rebuildAnalyticsCache } = require('./core/analytics/rebuildAnalyticsCache');
const { generateMilestones } = require('./core/analytics/generateMilestones');

// ========================================
// PAYMENT FUNCTIONS
// ========================================
const { createCheckoutSession } = require('./core/payments/createCheckoutSession');
const { createPortalSession } = require('./core/payments/createPortalSession');
const { stripeWebhook } = require('./core/payments/stripeWebhook');

// ========================================
// MONITORING FUNCTIONS
// ========================================
const { monitorCriticalErrors } = require('./core/monitoring/monitorCriticalErrors');

// ========================================
// SOCIAL FUNCTIONS
// ========================================
const { trackReaction } = require('./core/social/trackReaction');
const { trackPostComment } = require('./core/social/trackPostComment');
const { generateShareCard } = require('./core/social/generateShareCard');

// ========================================
// NOTIFICATION FUNCTIONS
// ========================================
const { checkBirthdays } = require('./core/notifications/checkBirthdays');

// ========================================
// MAINTENANCE FUNCTIONS
// ========================================
const { cleanupOldData } = require('./core/maintenance/cleanupOldData');
const { sendTestAlert } = require('./core/maintenance/sendTestAlert');
const { migratePhoneNumbers } = require('./core/maintenance/migratePhoneNumbers');
const { fixDoubleCountedStats } = require('./core/maintenance/fixDoubleCountedStats');
const { backfillBestieUserIds } = require('./core/maintenance/backfillBestieUserIds');

// ========================================
// EXPORTS
// ========================================

// Check-ins
exports.checkExpiredCheckIns = checkExpiredCheckIns;
exports.checkCascadingAlertEscalation = checkCascadingAlertEscalation;
exports.acknowledgeAlert = acknowledgeAlert;
exports.extendCheckIn = extendCheckIn;
exports.completeCheckIn = completeCheckIn;
exports.onCheckInCreated = onCheckInCreated;
exports.onCheckInCountUpdate = onCheckInCountUpdate;
exports.sendCheckInReminders = sendCheckInReminders;
exports.trackCheckInReaction = trackCheckInReaction;
exports.trackCheckInComment = trackCheckInComment;

// Besties
exports.sendBestieInvite = sendBestieInvite;
exports.acceptBestieRequest = acceptBestieRequest;
exports.declineBestieRequest = declineBestieRequest;
exports.onBestieCountUpdate = onBestieCountUpdate;
exports.onBestieCreated = onBestieCreated;
exports.onBestieDeleted = onBestieDeleted;

// Users
exports.onUserCreated = onUserCreated;

// Emergency
exports.onDuressCodeUsed = onDuressCodeUsed;
exports.triggerEmergencySOS = triggerEmergencySOS;

// Analytics
exports.dailyAnalyticsAggregation = dailyAnalyticsAggregation;
exports.updateDailyStreaks = updateDailyStreaks;
exports.rebuildAnalyticsCache = rebuildAnalyticsCache;
exports.generateMilestones = generateMilestones;

// Payments
exports.createCheckoutSession = createCheckoutSession;
exports.createPortalSession = createPortalSession;
exports.stripeWebhook = stripeWebhook;

// Monitoring
exports.monitorCriticalErrors = monitorCriticalErrors;

// Social
exports.trackReaction = trackReaction;
exports.trackPostComment = trackPostComment;
exports.generateShareCard = generateShareCard;

// Notifications
exports.checkBirthdays = checkBirthdays;

// Maintenance
exports.cleanupOldData = cleanupOldData;
exports.sendTestAlert = sendTestAlert;
exports.migratePhoneNumbers = migratePhoneNumbers;
exports.fixDoubleCountedStats = fixDoubleCountedStats;
exports.backfillBestieUserIds = backfillBestieUserIds;
