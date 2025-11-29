// Firebase Messaging Service Worker
// This script runs in the background and handles push notifications

// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// VAPID key - fallback if not received from main app
// This should match REACT_APP_FIREBASE_VAPID_KEY in your .env file
const FALLBACK_VAPID_KEY = 'BPXtVOACRBaCM1AtO7sUvFGfc7_nzwvZPVh4BRDCth2-c8a_FI7_l-jszYjgtSnw_f2pJ5OAo9CgnBIUClpPm3s';

// Firebase config and VAPID key - received from main app
let firebaseApp;
let messaging;
let vapidKey = FALLBACK_VAPID_KEY;

// Initialize Firebase when message received from main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'INIT_FIREBASE') {
    const firebaseConfig = event.data.config;
    // Use VAPID key from message, or fallback to hardcoded
    vapidKey = event.data.vapidKey || FALLBACK_VAPID_KEY;

    if (!firebaseApp) {
      try {
        firebaseApp = firebase.initializeApp(firebaseConfig);
        messaging = firebase.messaging();
        console.log('[firebase-messaging-sw.js] Firebase initialized in service worker');
        console.log('[firebase-messaging-sw.js] VAPID Key configured:', vapidKey ? 'Yes' : 'No');

        // Set up background message handler
        setupMessageHandler();
      } catch (error) {
        console.error('[firebase-messaging-sw.js] Error initializing Firebase:', error);
      }
    }
  }
});

// Auto-initialize on install (will use config from main app)
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service worker installing...');
  self.skipWaiting();
});

function setupMessageHandler() {
  // Handle background messages
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    const notificationTitle = payload.notification?.title || 'Besties';
    const notificationOptions = {
      body: payload.notification?.body || 'You have a new notification',
      icon: payload.notification?.icon || '/logo192.png',
      badge: '/logo192.png',
      tag: 'besties-notification',
      requireInteraction: true,
      data: payload.data || {},
      actions: [
        {
          action: 'open',
          title: 'Open App'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };

    // Show notification
    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Open app when notification is clicked
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

// Handle service worker installation
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service worker installing...');
  self.skipWaiting();
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service worker activated');
  event.waitUntil(clients.claim());
});
