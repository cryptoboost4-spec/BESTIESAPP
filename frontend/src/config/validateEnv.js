/**
 * Validates that all required environment variables are present
 * Throws an error if any are missing, preventing the app from starting with incomplete config
 */

export function validateEnv() {
  const required = [
    'REACT_APP_FIREBASE_API_KEY',
    'REACT_APP_FIREBASE_AUTH_DOMAIN',
    'REACT_APP_FIREBASE_PROJECT_ID',
    'REACT_APP_FIREBASE_STORAGE_BUCKET',
    'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
    'REACT_APP_FIREBASE_APP_ID',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    const errorMessage = `Missing required environment variables: ${missing.join(', ')}\n\n` +
      `Please check your .env file and ensure all Firebase configuration variables are set.`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  
  // Optional but recommended variables
  const optional = [
    'REACT_APP_FIREBASE_VAPID_KEY',
    'REACT_APP_GOOGLE_MAPS_API_KEY',
  ];
  
  const missingOptional = optional.filter(key => !process.env[key]);
  if (missingOptional.length > 0) {
    console.warn(`Optional environment variables not set: ${missingOptional.join(', ')}\n` +
      `Some features may not work without these.`);
  }
}

