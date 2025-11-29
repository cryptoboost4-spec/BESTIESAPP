const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { RATE_LIMITS, checkRateLimit, getClientIP } = require('../../utils/rateLimiting');

// Generate dynamic share card HTML with custom meta tags
exports.generateShareCard = functions.https.onRequest(async (req, res) => {
  try {
    // Rate limiting: 100 requests per IP per hour
    const clientIp = getClientIP(req);
    const rateLimit = await checkRateLimit(
      clientIp,
      'generateShareCard',
      { count: 100, window: 60 * 60 * 1000 } // 100 per hour
    );

    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        resetAt: rateLimit.resetAt.toISOString(),
      });
    }

    const inviteId = req.query.invite;

    // Validate inviteId if provided
    if (inviteId) {
      if (typeof inviteId !== 'string' || inviteId.length > 100 || !/^[a-zA-Z0-9_-]+$/.test(inviteId)) {
        // Invalid format - show default card instead of error
        return res.send(getDefaultHTML());
      }
    } else {
      // No invite parameter - show default card
      return res.send(getDefaultHTML());
    }

    // Fetch user data from Firestore
    const userDoc = await admin.firestore().collection('users').doc(inviteId).get();

    if (!userDoc.exists) {
      // User not found - show default card
      return res.send(getDefaultHTML());
    }

    const userData = userDoc.data();
    const userName = userData.displayName || 'A friend';
    const userPhoto = userData.photoURL || 'https://bestiesapp.web.app/logo192.png';
    const APP_URL = functions.config().app?.url || 'https://bestiesapp.web.app';
    const inviteUrl = `${APP_URL}/?invite=${inviteId}`;

    // Generate custom HTML with dynamic meta tags
    const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />

    <!-- Dynamic Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${inviteUrl}" />
    <meta property="og:title" content="${userName} invited you to Besties!" />
    <meta property="og:description" content="Join ${userName}'s safety network. Keep each other safe with Besties! 💜" />
    <meta property="og:image" content="${userPhoto}" />

    <!-- Dynamic Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="${inviteUrl}" />
    <meta property="twitter:title" content="${userName} invited you to Besties!" />
    <meta property="twitter:description" content="Join ${userName}'s safety network. Keep each other safe! 💜" />
    <meta property="twitter:image" content="${userPhoto}" />

    <title>${userName} invited you to Besties!</title>

    <!-- Redirect to main app -->
    <meta http-equiv="refresh" content="0;url=${inviteUrl}" />
  </head>
  <body>
    <p>Redirecting to Besties...</p>
    <p>If you are not redirected, <a href="${inviteUrl}">click here</a>.</p>
  </body>
</html>
    `;

    res.status(200).send(html);
  } catch (error) {
    functions.logger.error('Error generating share card:', error);
    res.status(500).send(getDefaultHTML());
  }
});

function getDefaultHTML() {
  const APP_URL = functions.config().app?.url || 'https://bestiesapp.web.app';
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />

    <meta property="og:type" content="website" />
    <meta property="og:url" content="${APP_URL}/" />
    <meta property="og:title" content="Besties - Your Safety Network" />
    <meta property="og:description" content="Join Besties! Keep each other safe. 💜" />
    <meta property="og:image" content="${APP_URL}/social-card.png" />

    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="${APP_URL}/" />
    <meta property="twitter:title" content="Besties - Your Safety Network" />
    <meta property="twitter:description" content="Join Besties! Keep each other safe. 💜" />
    <meta property="twitter:image" content="${APP_URL}/social-card.png" />

    <title>Besties - Your Safety Network</title>

    <meta http-equiv="refresh" content="0;url=${APP_URL}/" />
  </head>
  <body>
    <p>Redirecting to Besties...</p>
    <p>If you are not redirected, <a href="${APP_URL}/">click here</a>.</p>
  </body>
</html>
  `;
}
