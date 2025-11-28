// Telegram Bot Configuration
export const TELEGRAM_CONFIG = {
  // Bot username (without @)
  botUsername: 'BestiesSafetyBot',

  // Generate deep link for user to connect their Telegram
  getLinkForUser: (userId) => `https://t.me/BestiesSafetyBot?start=${userId}`,

  // Direct link to bot (for general access)
  botLink: 'https://t.me/BestiesSafetyBot'
};

export default TELEGRAM_CONFIG;
