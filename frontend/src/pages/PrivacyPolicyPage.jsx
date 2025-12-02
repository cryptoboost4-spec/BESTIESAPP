import React from 'react';

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-pattern">
      <div className="max-w-4xl mx-auto p-6 pb-20">
        <div className="card p-8">
          <h1 className="text-3xl font-display text-text-primary mb-6">Privacy Policy</h1>

          <p className="text-sm text-text-secondary mb-6">
            <strong>Last Updated:</strong> December 2, 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">Overview</h2>
            <p className="text-text-secondary mb-4">
              Besties is a personal safety check-in application that helps users stay safe by notifying their trusted contacts if they don't check in on time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">Information We Collect</h2>

            <h3 className="text-xl font-semibold text-text-primary mb-3">Information You Provide:</h3>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>Name and email address (for account creation)</li>
              <li>Phone number (for SMS notifications)</li>
              <li>Location information (when you create check-ins)</li>
              <li>Emergency contact information (names and phone numbers of your Besties)</li>
            </ul>

            <h3 className="text-xl font-semibold text-text-primary mb-3">Information from Facebook (if you connect via Facebook Messenger):</h3>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>Your Facebook Page-Scoped ID (PSID) to identify you in Messenger</li>
              <li>Your name and profile picture to personalize notifications</li>
              <li>We do NOT access your Facebook friends list, posts, or other Facebook data</li>
            </ul>

            <h3 className="text-xl font-semibold text-text-primary mb-3">Automatically Collected Information:</h3>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>Check-in history and timestamps</li>
              <li>Device information and IP address</li>
              <li>Usage analytics (page views, features used)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">How We Use Your Information</h2>
            <p className="text-text-secondary mb-4">We use your information to:</p>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>Send safety alerts to your designated emergency contacts when you don't check in on time</li>
              <li>Send emergency notifications when you trigger an SOS alert</li>
              <li>Deliver notifications via Messenger (if you've connected Facebook)</li>
              <li>Verify your identity and prevent fraud</li>
              <li>Improve our service and user experience</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">How We Share Your Information</h2>
            <p className="text-text-secondary mb-4">We share your information ONLY in these situations:</p>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li><strong>With Your Besties:</strong> We share your check-in status, location, and alerts with emergency contacts YOU designate</li>
              <li><strong>With Service Providers:</strong> We use third-party services to operate our platform:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>Firebase (Google): Hosting, database, authentication</li>
                  <li>Twilio: SMS notifications</li>
                  <li>SendGrid: Email notifications</li>
                  <li>Google Maps: Location autocomplete</li>
                  <li>Stripe: Payment processing (if applicable)</li>
                </ul>
              </li>
              <li><strong>With Facebook:</strong> If you connect via Messenger, we share limited data necessary to operate Messenger features (per Facebook's Platform Terms)</li>
              <li><strong>For Safety:</strong> We may share information with law enforcement if we believe it's necessary to prevent harm</li>
              <li><strong>With Your Consent:</strong> Any other sharing requires your explicit permission</li>
            </ul>

            <p className="text-text-secondary mb-4"><strong>We do NOT:</strong></p>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>Sell your personal information</li>
              <li>Share your information for marketing purposes</li>
              <li>Share your data with third parties except as described above</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">Facebook Messenger Integration</h2>
            <p className="text-text-secondary mb-4">If you connect via Facebook Messenger:</p>

            <h3 className="text-xl font-semibold text-text-primary mb-3">What We Collect from Facebook:</h3>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>Page-Scoped ID (PSID) - a unique identifier for Messenger</li>
              <li>Your name and profile picture</li>
              <li>We do NOT access your friends list, posts, timeline, or other Facebook data</li>
            </ul>

            <h3 className="text-xl font-semibold text-text-primary mb-3">How We Use Messenger:</h3>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>Send you safety check-in notifications from your friends</li>
              <li>Alert you when someone you referred joins (if you opt-in)</li>
              <li>Provide 24-hour emergency contact notifications</li>
            </ul>

            <h3 className="text-xl font-semibold text-text-primary mb-3">Messenger Referral Links:</h3>
            <p className="text-text-secondary mb-4">
              When you share a referral link (m.me/bestiespage?ref=YOUR_ID), clicking it opens Messenger with our Page. This allows us to notify the person about your safety status for 24 hours, in accordance with Facebook's messaging policies.
            </p>

            <h3 className="text-xl font-semibold text-text-primary mb-3">Your Rights:</h3>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>You can disconnect Messenger access at any time in Settings</li>
              <li>Disconnecting will stop Messenger notifications but won't affect other app features</li>
              <li>Facebook's Data Policy also applies: <a href="https://www.facebook.com/privacy/policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://www.facebook.com/privacy/policy</a></li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">Your Data Rights</h2>
            <p className="text-text-secondary mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>Access your personal data</li>
              <li>Delete your account and all associated data</li>
              <li>Export your data</li>
              <li>Disconnect Facebook Messenger integration</li>
              <li>Opt-out of notifications</li>
              <li>Update your information at any time</li>
            </ul>
            <p className="text-text-secondary">
              To exercise these rights, go to Settings in the app or contact us at <a href="mailto:bestiesapp.xyz@gmail.com" className="text-primary hover:underline">bestiesapp.xyz@gmail.com</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">Data Security</h2>
            <p className="text-text-secondary mb-4">We protect your data using:</p>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>Industry-standard encryption in transit and at rest</li>
              <li>Secure Firebase authentication</li>
              <li>Regular security audits</li>
              <li>Limited employee access to personal data</li>
              <li>Secure API connections with third-party services</li>
            </ul>
            <p className="text-text-secondary">
              While we implement strong security measures, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">Third-Party Services</h2>
            <p className="text-text-secondary mb-4">Each service we use has its own privacy policy:</p>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>Firebase (Google): <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://firebase.google.com/support/privacy</a></li>
              <li>Twilio: <a href="https://www.twilio.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://www.twilio.com/legal/privacy</a></li>
              <li>SendGrid: <a href="https://www.twilio.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://www.twilio.com/legal/privacy</a></li>
              <li>Google Maps: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://policies.google.com/privacy</a></li>
              <li>Stripe: <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://stripe.com/privacy</a></li>
              <li>Facebook: <a href="https://www.facebook.com/privacy/policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://www.facebook.com/privacy/policy</a></li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">Children's Privacy</h2>
            <p className="text-text-secondary">
              Besties is not intended for users under 18. We do not knowingly collect information from children. If we learn we have collected information from a child under 18, we will delete it immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">International Users</h2>
            <p className="text-text-secondary">
              Your data may be processed in the United States and other countries where our servers are located. By using Besties, you consent to the transfer of your information to these countries.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">Changes to Privacy Policy</h2>
            <p className="text-text-secondary mb-4">We may update this Privacy Policy from time to time. We'll notify you of significant changes via:</p>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>Email notification</li>
              <li>In-app notification</li>
              <li>Notice on our website</li>
            </ul>
            <p className="text-text-secondary">
              Your continued use of Besties after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">Data Retention</h2>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li><strong>Active accounts:</strong> Data retained while your account is active</li>
              <li><strong>Deleted accounts:</strong> Data permanently deleted within 30 days</li>
              <li><strong>Legal requirements:</strong> Some data may be retained longer if required by law</li>
              <li><strong>Check-in history:</strong> Retained for 90 days unless you delete it sooner</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">Cookie Policy</h2>
            <p className="text-text-secondary mb-4">We use cookies and similar technologies for:</p>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>Authentication and security</li>
              <li>Analytics and performance monitoring</li>
              <li>User preferences and settings</li>
              <li>Maintaining your session</li>
            </ul>
            <p className="text-text-secondary">
              You can disable cookies in your browser settings, but this may limit some functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">Communications and Notifications</h2>
            <p className="text-text-secondary mb-4">
              By using Besties and adding emergency contacts, you consent to us sending safety notifications via:
            </p>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>SMS text messages</li>
              <li>Email</li>
              <li>Facebook Messenger (if enabled)</li>
              <li>WhatsApp (if enabled in the future)</li>
            </ul>

            <p className="text-text-secondary mb-4">Emergency contacts will be notified about:</p>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>Missed check-ins</li>
              <li>SOS alerts</li>
              <li>Location updates (if shared)</li>
            </ul>

            <p className="text-text-secondary mb-4">Emergency contacts can opt-out at any time by:</p>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>Replying STOP to SMS messages</li>
              <li>Clicking unsubscribe in emails</li>
              <li>Blocking our Messenger notifications</li>
              <li>Contacting us directly</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">Legal Basis for Processing (GDPR)</h2>
            <p className="text-text-secondary mb-4">If you're in the EU/EEA, we process your data based on:</p>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li><strong>Consent:</strong> You've given us permission</li>
              <li><strong>Contract:</strong> Necessary to provide our service</li>
              <li><strong>Legitimate interests:</strong> Safety and security</li>
              <li><strong>Legal obligation:</strong> Compliance with laws</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">Contact Us</h2>
            <p className="text-text-secondary mb-4">If you have questions about this Privacy Policy or your data:</p>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>Email: <a href="mailto:bestiesapp.xyz@gmail.com" className="text-primary hover:underline">bestiesapp.xyz@gmail.com</a></li>
              <li>Website: <a href="https://app.bestiesapp.xyz" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">app.bestiesapp.xyz</a></li>
            </ul>
          </section>

          <div className="border-t border-gray-200 pt-8 mt-8">
            <p className="text-text-secondary text-center">
              By using Besties, you agree to this Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
