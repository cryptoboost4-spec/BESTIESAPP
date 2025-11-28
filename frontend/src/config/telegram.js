// Telegram Bot Configuration
export const TELEGRAM_CONFIG = {
  // Bot username (without @)
  botUsername: 'Bestiesappbot',

  // Generate deep link for user to connect their Telegram
  getLinkForUser: (userId) => `https://t.me/Bestiesappbot?start=${userId}`,

  // Direct link to bot (for general access)
  botLink: 'https://t.me/Bestiesappbot'
};

export default TELEGRAM_CONFIG;
