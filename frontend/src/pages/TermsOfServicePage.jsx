import React from 'react';

const TermsOfServicePage = () => {
  return (
    <div className="min-h-screen bg-pattern">

      <div className="max-w-4xl mx-auto p-6 pb-20">
        <div className="card p-8">
          <h1 className="text-3xl font-display text-text-primary mb-6">Terms of Service</h1>

          <p className="text-sm text-text-secondary mb-6">
            <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">1. Acceptance of Terms</h2>
            <p className="text-text-secondary mb-4">
              By accessing or using Besties ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
            <p className="text-text-secondary">
              These Terms constitute a legally binding agreement between you and Besties. Your continued use of the Service indicates your acceptance of these Terms and any future modifications.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">2. Description of Service</h2>
            <p className="text-text-secondary mb-4">
              Besties is a personal safety check-in application that allows users to:
            </p>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>Create timed check-ins with location information</li>
              <li>Designate emergency contacts ("Besties") to receive alerts</li>
              <li>Send automatic notifications if check-ins are missed</li>
              <li>Trigger emergency SOS alerts to designated contacts</li>
              <li>Share check-in status and location with trusted contacts</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">3. Eligibility</h2>
            <p className="text-text-secondary mb-4">
              You must be at least 18 years old to use the Service. By using Besties, you represent and warrant that:
            </p>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>You are at least 18 years of age</li>
              <li>You have the legal capacity to enter into this agreement</li>
              <li>You will comply with all applicable laws and regulations</li>
              <li>All information you provide is accurate and complete</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">4. Account Registration</h2>
            <p className="text-text-secondary mb-4">To use the Service, you must:</p>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>Create an account with accurate information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Provide a valid phone number for emergency notifications</li>
            </ul>
            <p className="text-text-secondary">
              You may not share your account with others or create multiple accounts for fraudulent purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">5. Emergency Contacts and Consent</h2>
            <p className="text-text-secondary mb-4">By adding emergency contacts ("Besties"), you:</p>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>Confirm you have permission to add their contact information</li>
              <li>Authorize us to send them alerts on your behalf</li>
              <li>Acknowledge they will receive notifications via SMS, email, WhatsApp, or other channels</li>
              <li>Accept responsibility for any costs they may incur from receiving messages</li>
              <li>Agree to inform them about how their information will be used</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">6. Safety Features and Limitations</h2>
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 mb-4">
              <p className="text-sm font-semibold text-yellow-800">
                ⚠️ IMPORTANT DISCLAIMER
              </p>
            </div>
            <p className="text-text-secondary mb-4">
              Besties is designed as a safety tool, but it is NOT a replacement for:
            </p>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>Emergency services (911 or local emergency numbers)</li>
              <li>Professional security or monitoring services</li>
              <li>Medical alert systems</li>
              <li>Personal safety devices or training</li>
            </ul>
            <p className="text-text-secondary mb-4"><strong>You acknowledge that:</strong></p>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>The Service depends on internet connectivity, device battery, and third-party services</li>
              <li>Notifications may be delayed or fail due to technical issues</li>
              <li>Location information may be inaccurate or unavailable</li>
              <li>Emergency contacts may not see or respond to alerts</li>
              <li>The Service cannot guarantee your safety in emergency situations</li>
            </ul>
            <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 mb-4">
              <p className="text-sm font-semibold text-red-800">
                🚨 IN A TRUE EMERGENCY, ALWAYS CONTACT LOCAL EMERGENCY SERVICES (911) IMMEDIATELY
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">7. User Responsibilities</h2>
            <p className="text-text-secondary mb-4">You agree to:</p>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>Use the Service responsibly and lawfully</li>
              <li>Provide accurate location and check-in information</li>
              <li>Keep your emergency contact list updated</li>
              <li>Complete check-ins on time when safe to do so</li>
              <li>Not abuse the emergency alert features</li>
              <li>Respect the privacy of other users</li>
              <li>Maintain a working device with internet connection</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">8. Prohibited Uses</h2>
            <p className="text-text-secondary mb-4">You may NOT:</p>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>Use the Service for illegal activities</li>
              <li>Send false emergency alerts or abuse the SOS feature</li>
              <li>Harass, stalk, or threaten other users</li>
              <li>Add contacts without their knowledge or permission</li>
              <li>Attempt to bypass security features or access restrictions</li>
              <li>Reverse engineer, decompile, or hack the Service</li>
              <li>Use automated systems (bots) to access the Service</li>
              <li>Resell or commercially exploit the Service</li>
              <li>Impersonate others or provide false information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">9. User Content</h2>
            <p className="text-text-secondary mb-4">
              You retain ownership of content you submit (locations, notes, photos). By using the Service, you grant us a license to:
            </p>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>Store and process your content to provide the Service</li>
              <li>Share your check-in information with your designated emergency contacts</li>
              <li>Use anonymized data for analytics and service improvement</li>
            </ul>
            <p className="text-text-secondary">
              You are responsible for the content you share and must not submit illegal, harmful, or infringing content.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">10. Payments and Subscriptions</h2>
            <p className="text-text-secondary mb-4">If you choose to support Besties through donations or subscriptions:</p>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>Payments are processed securely through Stripe</li>
              <li>Donations are non-refundable</li>
              <li>Subscriptions auto-renew until cancelled</li>
              <li>You can cancel subscriptions anytime through your account settings</li>
              <li>We reserve the right to change pricing with 30 days notice</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">11. Third-Party Services</h2>
            <p className="text-text-secondary mb-4">
              The Service integrates with third-party providers (Twilio, SendGrid, Firebase, Google Maps, Stripe). Your use of these services is subject to their respective terms and privacy policies. We are not responsible for third-party service failures or changes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">12. Intellectual Property</h2>
            <p className="text-text-secondary mb-4">
              Besties and all related trademarks, logos, and content are owned by us or our licensors. You may not use our intellectual property without written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">13. Disclaimer of Warranties</h2>
            <div className="bg-gray-100 border-2 border-gray-300 rounded-xl p-4 mb-4">
              <p className="text-sm font-semibold text-gray-800 uppercase">
                THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND
              </p>
            </div>
            <p className="text-text-secondary mb-4">We make no warranties that:</p>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>The Service will be uninterrupted, secure, or error-free</li>
              <li>Notifications will always be delivered on time</li>
              <li>Location information will be accurate</li>
              <li>The Service will meet your safety needs or expectations</li>
              <li>Defects will be corrected</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">14. Limitation of Liability</h2>
            <p className="text-text-secondary mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR:
            </p>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>Any injuries, harm, or damages resulting from use or inability to use the Service</li>
              <li>Failed or delayed notifications</li>
              <li>Inaccurate location information</li>
              <li>Actions or inactions of emergency contacts</li>
              <li>Third-party service failures</li>
              <li>Loss of data or content</li>
              <li>Indirect, incidental, or consequential damages</li>
            </ul>
            <p className="text-text-secondary mb-4">
              If we are found liable, our total liability is limited to the amount you paid us in the past 12 months, or $100, whichever is less.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">15. Indemnification</h2>
            <p className="text-text-secondary">
              You agree to indemnify and hold harmless Besties and its affiliates from any claims, damages, or expenses arising from: (a) your use of the Service, (b) your violation of these Terms, (c) your violation of any third-party rights, or (d) false emergency alerts.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">16. Termination</h2>
            <p className="text-text-secondary mb-4">We may terminate or suspend your account if you:</p>
            <ul className="list-disc list-inside text-text-secondary mb-4 space-y-2">
              <li>Violate these Terms</li>
              <li>Abuse the Service or emergency features</li>
              <li>Engage in fraudulent activity</li>
              <li>Pose a risk to other users</li>
            </ul>
            <p className="text-text-secondary">
              You may terminate your account anytime through Settings. Upon termination, your data will be deleted as described in our Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">17. Changes to Terms</h2>
            <p className="text-text-secondary">
              We may update these Terms at any time. Significant changes will be communicated via email or in-app notification. Continued use after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">18. Governing Law and Disputes</h2>
            <p className="text-text-secondary mb-4">
              These Terms are governed by the laws of Australia. Any disputes will be resolved through binding arbitration, except where prohibited by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">19. Severability</h2>
            <p className="text-text-secondary">
              If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display text-text-primary mb-4">20. Contact Information</h2>
            <p className="text-text-secondary mb-4">
              For questions about these Terms, contact us at:
            </p>
            <ul className="list-none text-text-secondary space-y-2">
              <li><strong>Email:</strong> legal@bestiesapp.com</li>
              <li><strong>Support:</strong> support@bestiesapp.com</li>
            </ul>
          </section>

          <div className="border-t border-gray-200 pt-8 mt-8">
            <p className="text-text-secondary text-center mb-4">
              <strong>By using Besties, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</strong>
            </p>
            <p className="text-sm text-text-secondary text-center">
              For information about how we handle your data, please review our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
