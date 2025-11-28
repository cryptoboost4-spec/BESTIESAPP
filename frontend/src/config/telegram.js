// Telegram configuration
export const TELEGRAM_CONFIG = {
  // Telegram bot username (for t.me links)
  botUsername: 'bestiesappbot',

  // T.me link template - replace {userId} with actual user ID
  getLinkForUser: (userId) => `https://t.me/bestiesappbot?start=${userId}`
};

export default TELEGRAM_CONFIG;
