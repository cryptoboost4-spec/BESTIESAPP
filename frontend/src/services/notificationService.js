import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Notification Types:
 * - bestie_request: Someone sent you a bestie request
 * - check_in_alert: A bestie missed their check-in
 * - missed_check_in: You missed a check-in
 * - request_attention: A bestie is requesting attention
 * - badge_earned: You earned a new badge
 * - system: System messages and announcements
 */

class NotificationService {
  /**
   * Create a notification for a user
   * @param {string} userId - The user ID to send notification to
   * @param {string} type - Type of notification (bestie_request, check_in_alert, etc.)
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {object} metadata - Optional metadata (bestieId, checkInId, etc.)
   */
  async createNotification(userId, type, title, message, metadata = {}) {
    try {
      await addDoc(collection(db, 'notifications'), {
        userId,
        type,
        title,
        message,
        read: false,
        createdAt: serverTimestamp(),
        ...metadata,
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Send a bestie request notification
   */
  async notifyBestieRequest(userId, requesterName) {
    return this.createNotification(
      userId,
      'bestie_request',
      'New Bestie Request',
      `${requesterName} wants to be your bestie!`,
      { requesterName }
    );
  }

  /**
   * Send a check-in alert notification
   */
  async notifyCheckInAlert(userId, bestieName, checkInId) {
    return this.createNotification(
      userId,
      'check_in_alert',
      'Check-in Alert',
      `${bestieName} hasn't checked in yet. They might need help.`,
      { bestieName, checkInId }
    );
  }

  /**
   * Send a missed check-in notification
   */
  async notifyMissedCheckIn(userId, checkInId) {
    return this.createNotification(
      userId,
      'missed_check_in',
      'Missed Check-in',
      'You missed your check-in. Your besties were notified.',
      { checkInId }
    );
  }

  /**
   * Send a request attention notification
   */
  async notifyRequestAttention(userId, bestieName, bestieId) {
    return this.createNotification(
      userId,
      'request_attention',
      'Someone Needs You',
      `${bestieName} is requesting your attention`,
      { bestieName, bestieId }
    );
  }

  /**
   * Send a badge earned notification
   */
  async notifyBadgeEarned(userId, badgeName, badgeDescription) {
    return this.createNotification(
      userId,
      'badge_earned',
      'New Badge Unlocked!',
      `You earned the "${badgeName}" badge! ${badgeDescription}`,
      { badgeName, badgeDescription }
    );
  }

  /**
   * Send a system notification
   */
  async notifySystem(userId, title, message) {
    return this.createNotification(
      userId,
      'system',
      title,
      message
    );
  }

  /**
   * Send welcome notification to new users
   */
  async notifyWelcome(userId, displayName) {
    return this.createNotification(
      userId,
      'system',
      `Welcome to Besties, ${displayName}!`,
      'Start by adding your first bestie and creating a check-in. We\'ve got your back!'
    );
  }

  /**
   * Send notification when a bestie accepts your request
   */
  async notifyBestieAccepted(userId, bestieName) {
    return this.createNotification(
      userId,
      'bestie_request',
      'Bestie Request Accepted!',
      `${bestieName} accepted your bestie request. Stay safe together!`,
      { bestieName }
    );
  }

  /**
   * Send notification when a check-in is completed successfully
   */
  async notifyCheckInComplete(userId, checkInName) {
    return this.createNotification(
      userId,
      'check_in_alert',
      'Check-in Complete',
      `Great job! You completed "${checkInName}" safely.`,
      { checkInName }
    );
  }
}

export const notificationService = new NotificationService();
export default notificationService;
