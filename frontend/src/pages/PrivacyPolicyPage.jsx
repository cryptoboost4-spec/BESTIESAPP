import React from 'react';
import Header from '../components/Header';

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-pattern">
      <Header />

      <div className="max-w-4xl mx-auto p-6 pb-20">
        <div className="card p-8">
          <h1 className="text-3xl font-display text-text-primary mb-6">Privacy Policy</h1>

          <p className="text-sm text-text-secondary mb-6">
            <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
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
              <li><strong>With Service Providers:</strong> We use third-party services (Firebase, Twilio, SendGrid) to operate our platform</li>
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
            <h2 className="text-2xl font-display text-text-primary mb-4">Your Data Rights</h2>
            <p className="text-text-secondary mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>Access your personal data</li>
              <li>Delete your account and all associated data</li>
              <li>Export your data</li>
              <li>Opt-out of notifications</li>
              <li>Update your information at any time</li>
            </ul>
            <p className="text-text-secondary">
              To exercise these rights, go to Settings in the app or contact us directly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">Data Security</h2>
            <p className="text-text-secondary mb-4">We protect your data using:</p>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>End-to-end encryption for sensitive data</li>
              <li>Secure Firebase authentication</li>
              <li>Regular security audits</li>
              <li>Limited employee access to personal data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">Third-Party Services</h2>
            <p className="text-text-secondary mb-4">We use these services:</p>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li><strong>Firebase</strong> (Google): Hosting, database, authentication</li>
              <li><strong>Twilio:</strong> SMS notifications</li>
              <li><strong>SendGrid:</strong> Email notifications</li>
              <li><strong>Google Maps:</strong> Location autocomplete</li>
              <li><strong>Stripe:</strong> Payment processing (optional)</li>
            </ul>
            <p className="text-text-secondary">
              Each service has its own privacy policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">Children's Privacy</h2>
            <p className="text-text-secondary">
              Besties is not intended for users under 18. We do not knowingly collect information from children.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">International Users</h2>
            <p className="text-text-secondary">
              Your data may be processed in the United States and other countries where our servers are located.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">Changes to Privacy Policy</h2>
            <p className="text-text-secondary">
              We'll notify you of significant changes via email or in-app notification.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">Data Retention</h2>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li><strong>Active accounts:</strong> Data retained while account is active</li>
              <li><strong>Deleted accounts:</strong> Data permanently deleted within 30 days</li>
              <li><strong>Legal requirements:</strong> Some data may be retained longer if required by law</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">Cookie Policy</h2>
            <p className="text-text-secondary mb-4">We use cookies for:</p>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>Authentication and security</li>
              <li>Analytics and performance monitoring</li>
              <li>User preferences</li>
            </ul>
            <p className="text-text-secondary">
              You can disable cookies in your browser settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">WhatsApp/Messenger Communications</h2>
            <p className="text-text-secondary mb-4">
              By adding emergency contacts, you consent to us sending them safety notifications via:
            </p>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>SMS</li>
              <li>Email</li>
              <li>WhatsApp (if enabled)</li>
              <li>Facebook Messenger (if enabled)</li>
            </ul>
            <p className="text-text-secondary">
              Emergency contacts can opt-out at any time by replying STOP or contacting us.
            </p>
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
