// Telegram configuration
export const TELEGRAM_CONFIG = {
  // Telegram bot username (for t.me links)
  botUsername: 'BestiesSafetyBot',

  // T.me link template - replace {userId} with actual user ID
  getLinkForUser: (userId) => `https://t.me/BestiesSafetyBot?start=${userId}`,

  // Contact expiry time (20 hours in milliseconds)
  contactExpiryHours: 20,
  contactExpiryMs: 20 * 60 * 60 * 1000
};

export default TELEGRAM_CONFIG;
