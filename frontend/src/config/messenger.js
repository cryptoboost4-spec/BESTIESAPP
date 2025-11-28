// Facebook Messenger configuration
export const MESSENGER_CONFIG = {
  // Facebook Page username (for m.me links)
  pageUsername: 'besties.safety',

  // M.me link template - replace {userId} with actual user ID
  getLinkForUser: (userId) => `https://m.me/besties.safety?ref=${userId}`,

  // Contact expiry time (20 hours in milliseconds)
  contactExpiryHours: 20,
  contactExpiryMs: 20 * 60 * 60 * 1000
};

export default MESSENGER_CONFIG;
