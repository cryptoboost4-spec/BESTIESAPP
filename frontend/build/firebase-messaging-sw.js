// Firebase Messaging Service Worker
// This script runs in the background and handles push notifications

// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in service worker
// Note: These values should match your Firebase config
// The service worker can't access environment variables, so we'll use a fetch to get config
let firebaseApp;
let messaging;

// Try to initialize Firebase
try {
  // Fetch Firebase config from main app
  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'INIT_FIREBASE') {
      const firebaseConfig = event.data.config;

      if (!firebaseApp) {
        firebaseApp = firebase.initializeApp(firebaseConfig);
        messaging = firebase.messaging();
        console.log('Firebase initialized in service worker');

        // Set up background message handler
        setupMessageHandler();
      }
    }
  });

  // Fallback: try to initialize with hardcoded config if available
  // This will be replaced by the message above
  setTimeout(() => {
    if (!firebaseApp) {
      console.warn('Firebase not initialized from main app, attempting fallback...');
      // Fallback will be handled by the main app sending config via postMessage
    }
  }, 2000);
} catch (error) {
  console.error('Error in service worker:', error);
}

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
