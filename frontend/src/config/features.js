// Feature flags - enable/disable features without code changes
export const FEATURES = {
  // Core (always on)
  core: true,
  auth: true,
  checkIns: true,
  besties: true,
  
  // MVP Launch (enabled)
  templates: true,
  quickButtons: true,
  celebrationMessages: true,
  gpsLocation: true,
  manualLocation: true,
  extendButtons: true,
  
  // Gamification (enabled)
  bestieCircle: true,
  badges: true,
  shareableCards: true,
  
  // Media (enabled)
  mediaUpload: true,
  photoCapture: true,
  
  // Payments (enabled)
  donations: true,
  smsSubscription: true,
  
  // Future features (disabled for now)
  emergency: false,
  reversePin: false,
  liveTracking: false,
  videoRecording: false,
  facebookLogin: false, // Enable when account is unblocked
  phoneAuth: false // Not needed for MVP
};

// Helper to check if feature is enabled
export const isEnabled = (feature) => FEATURES[feature] === true;

export default FEATURES;
