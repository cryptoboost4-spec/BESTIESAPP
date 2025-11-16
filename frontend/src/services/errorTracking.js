import { db } from './firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

class ErrorTracker {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.userId = null;
    this.userAgent = navigator.userAgent;
    this.startTime = Date.now();
    this.errors = [];
    this.performance = [];
    
    // Setup global error handlers
    this.setupErrorHandlers();
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setUser(userId) {
    this.userId = userId;
  }

  setupErrorHandlers() {
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'uncaught_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'unhandled_promise',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
      });
    });

    // Track performance
    this.trackPerformance();
  }

  logError(error) {
    const errorData = {
      ...error,
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: this.userAgent,
    };

    this.errors.push(errorData);

    // Send to Firestore
    this.sendToFirestore('errors', errorData);

    console.error('Error tracked:', errorData);
  }

  logCustomError(message, details = {}) {
    this.logError({
      type: 'custom_error',
      message,
      details,
      stack: new Error().stack,
    });
  }

  trackPerformance() {
    // Track page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        
        if (perfData) {
          this.logPerformance({
            type: 'page_load',
            metrics: {
              dns: perfData.domainLookupEnd - perfData.domainLookupStart,
              tcp: perfData.connectEnd - perfData.connectStart,
              request: perfData.responseStart - perfData.requestStart,
              response: perfData.responseEnd - perfData.responseStart,
              dom: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
              load: perfData.loadEventEnd - perfData.loadEventStart,
              total: perfData.loadEventEnd - perfData.fetchStart,
            },
          });
        }
      }, 0);
    });

    // Track resource timing
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 1000) { // Only log slow resources
          this.logPerformance({
            type: 'slow_resource',
            name: entry.name,
            duration: entry.duration,
            size: entry.transferSize,
          });
        }
      }
    });
    
    observer.observe({ entryTypes: ['resource', 'measure'] });
  }

  logPerformance(data) {
    const perfData = {
      ...data,
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
      url: window.location.href,
    };

    this.performance.push(perfData);
    this.sendToFirestore('performance', perfData);
  }

  // Track user actions
  trackAction(action, details = {}) {
    const actionData = {
      action,
      details,
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
      url: window.location.href,
    };

    this.sendToFirestore('user_actions', actionData);
  }

  // Track page view
  trackPageView(page) {
    this.trackAction('page_view', { page });
  }

  // Track conversion funnel
  trackFunnelStep(funnel, step, metadata = {}) {
    const funnelData = {
      funnel,
      step,
      metadata,
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
      url: window.location.href,
    };

    this.sendToFirestore('funnel_events', funnelData);
  }

  async sendToFirestore(collectionName, data) {
    try {
      await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Failed to send to Firestore:', error);
      // Fallback: store locally
      this.storeLocally(collectionName, data);
    }
  }

  storeLocally(collectionName, data) {
    try {
      const key = `besties_${collectionName}`;
      const stored = JSON.parse(localStorage.getItem(key) || '[]');
      stored.push(data);
      
      // Keep only last 100 items
      if (stored.length > 100) {
        stored.shift();
      }
      
      localStorage.setItem(key, JSON.stringify(stored));
    } catch (error) {
      console.error('Failed to store locally:', error);
    }
  }

  // Get session summary
  getSessionSummary() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      duration: Date.now() - this.startTime,
      errors: this.errors.length,
      url: window.location.href,
      userAgent: this.userAgent,
    };
  }
}

// Create singleton instance
const errorTracker = new ErrorTracker();

export default errorTracker;
