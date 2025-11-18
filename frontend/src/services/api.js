import { functions } from './firebase';
import { httpsCallable } from 'firebase/functions';

// Use Firebase callable functions (no CORS issues)
export const extendCheckIn = httpsCallable(functions, 'extendCheckIn');
export const completeCheckIn = httpsCallable(functions, 'completeCheckIn');
export const sendBestieInvite = httpsCallable(functions, 'sendBestieInvite');
export const acceptBestieRequest = httpsCallable(functions, 'acceptBestieRequest');
export const declineBestieRequest = httpsCallable(functions, 'declineBestieRequest');
export const triggerEmergencySOS = httpsCallable(functions, 'triggerEmergencySOS');
export const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
export const createPortalSession = httpsCallable(functions, 'createPortalSession');
export const sendTestAlert = httpsCallable(functions, 'sendTestAlert');
export const migratePhoneNumbers = httpsCallable(functions, 'migratePhoneNumbers');

const apiService = {
  extendCheckIn,
  completeCheckIn,
  sendBestieInvite,
  acceptBestieRequest,
  declineBestieRequest,
  triggerEmergencySOS,
  createCheckoutSession,
  createPortalSession,
  sendTestAlert,
  migratePhoneNumbers,
};

export default apiService;
