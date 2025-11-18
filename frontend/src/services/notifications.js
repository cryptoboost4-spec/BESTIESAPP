import { messaging, getToken, onMessage, db, auth } from './firebase';
import { doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

// VAPID key - This needs to be generated in Firebase Console
// Go to: Project Settings > Cloud Messaging > Web Push certificates
const VAPID_KEY = process.env.REACT_APP_FIREBASE_VAPID_KEY;

class NotificationService {
  constructor() {
    this.initialized = false;
    this.token = null;
  }

  // Check if notifications are supported
  isSupported() {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Check current permission status
  getPermissionStatus() {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  // Request notification permission
  async requestPermission() {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported in this browser');
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Initialize service worker
  async initializeServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  // Get FCM token
  async getToken() {
    try {
      if (!VAPID_KEY) {
        console.warn('VAPID key not configured');
        toast.error('Push notifications require additional setup. Please use email or WhatsApp notifications instead.', { duration: 6000 });
        return null;
      }

      // Make sure service worker is registered first
      const registration = await this.initializeServiceWorker();
      if (!registration) {
        console.error('Could not register service worker');
        return null;
      }

      // Wait a bit for service worker to be ready
      await new Promise(resolve => setTimeout(resolve, 1000));

      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration
      });

      if (token) {
        console.log('FCM Token obtained:', token);
        this.token = token;
        return token;
      } else {
        console.warn('No FCM token available. Request permission to generate one.');
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  // Save token to user document
  async saveTokenToFirestore(token) {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.warn('No user logged in to save token');
        return false;
      }

      await updateDoc(doc(db, 'users', user.uid), {
        fcmToken: token,
        notificationsEnabled: true,
        lastTokenUpdate: new Date()
      });

      console.log('FCM token saved to Firestore');
      return true;
    } catch (error) {
      console.error('Error saving FCM token:', error);
      return false;
    }
  }

  // Enable notifications
  async enableNotifications() {
    try {
      // Check support
      if (!this.isSupported()) {
        toast.error('Push notifications are not supported in your browser');
        return false;
      }

      // Request permission
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        toast.error('Notification permission denied');
        return false;
      }

      // Get token
      const token = await this.getToken();
      if (!token) {
        toast.error('Could not get notification token');
        return false;
      }

      // Save to Firestore
      const saved = await this.saveTokenToFirestore(token);
      if (!saved) {
        toast.error('Could not save notification settings');
        return false;
      }

      // Set up foreground message listener
      this.setupForegroundListener();

      this.initialized = true;
      toast.success('Push notifications enabled!');
      return true;
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast.error('Failed to enable notifications');
      return false;
    }
  }

  // Disable notifications
  async disableNotifications() {
    try {
      const user = auth.currentUser;
      if (!user) return false;

      await updateDoc(doc(db, 'users', user.uid), {
        notificationsEnabled: false,
        fcmToken: null
      });

      this.token = null;
      this.initialized = false;

      toast.success('Push notifications disabled');
      return true;
    } catch (error) {
      console.error('Error disabling notifications:', error);
      toast.error('Failed to disable notifications');
      return false;
    }
  }

  // Setup listener for foreground messages
  setupForegroundListener() {
    onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);

      const { title, body, icon } = payload.notification || {};

      // Show toast notification
      toast.custom((t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              {icon && (
                <div className="flex-shrink-0 pt-0.5">
                  <img className="h-10 w-10 rounded-full" src={icon} alt="" />
                </div>
              )}
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">{title}</p>
                <p className="mt-1 text-sm text-gray-500">{body}</p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-primary hover:text-primary/80 focus:outline-none"
            >
              Close
            </button>
          </div>
        </div>
      ), {
        duration: 6000,
        position: 'top-right',
      });

      // Also show browser notification if possible
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: icon || '/logo192.png',
          badge: '/logo192.png',
          tag: 'besties-notification',
          requireInteraction: false
        });
      }
    });
  }

  // Test notification
  async sendTestNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Besties Test Notification', {
        body: 'Push notifications are working!',
        icon: '/logo192.png',
        badge: '/logo192.png'
      });
      return true;
    }
    return false;
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
