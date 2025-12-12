/**
 * Mock bestie for tutorial purposes
 * This allows users to learn how to create check-ins before adding real besties
 */

export const MOCK_BESTIE = {
  id: 'tutorial-mock-bestie',
  userId: 'tutorial-mock-user',
  name: 'Demo Bestie',
  email: 'demo@besties.app',
  photoURL: null,
  phone: null,
  smsEnabled: false,
  telegramChatId: null,
  notificationPreferences: {
    telegram: false,
    push: false,
    sms: false
  },
  requestAttention: false,
  isMock: true, // Flag to identify this as a mock bestie
  isTutorial: true // Flag for tutorial context
};

/**
 * Check if a bestie is a mock/tutorial bestie
 */
export const isMockBestie = (bestie) => {
  return bestie?.id === 'tutorial-mock-bestie' || bestie?.isMock === true;
};

/**
 * Filter out mock besties from a besties array
 */
export const filterMockBesties = (besties) => {
  return besties.filter(bestie => !isMockBestie(bestie));
};

