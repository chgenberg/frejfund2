'use client';

import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="pt-24 sm:pt-28 pb-16 px-4 sm:px-8"
      >
        <div className="max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-black mb-8"
          >
            Privacy Policy
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="prose prose-lg max-w-none"
          >
            <p className="text-gray-600 mb-8">
              <strong>Effective Date:</strong> January 1, 2024
              <br />
              <strong>Last Updated:</strong> January 1, 2024
            </p>

            <p className="text-gray-700 mb-6">
              At FrejFund, we take your privacy seriously. This Privacy Policy explains how we
              collect, use, disclose, and safeguard your information when you use our AI-powered
              investment matching platform.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">1. Information We Collect</h2>

            <h3 className="text-xl font-semibold text-black mt-6 mb-3">
              1.1 Information You Provide
            </h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>
                <strong>Account Information:</strong> Name, email address, password
              </li>
              <li>
                <strong>Business Information:</strong> Company name, industry, stage, business
                model, revenue, team size
              </li>
              <li>
                <strong>Financial Information:</strong> Revenue metrics, burn rate, runway
                (optional)
              </li>
              <li>
                <strong>Documents:</strong> Pitch decks, business plans, financial statements you
                choose to upload
              </li>
              <li>
                <strong>Communication Data:</strong> Messages with our AI coach, feedback, support
                inquiries
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-black mt-6 mb-3">
              1.2 Information We Collect Automatically
            </h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>
                <strong>Usage Data:</strong> How you interact with our platform, features used, time
                spent
              </li>
              <li>
                <strong>Device Information:</strong> Browser type, operating system, IP address
              </li>
              <li>
                <strong>Cookies and Tracking:</strong> Session cookies, analytics cookies (with
                consent)
              </li>
              <li>
                <strong>Log Data:</strong> Access times, pages viewed, errors encountered
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">
              2. How We Use Your Information
            </h2>
            <p className="text-gray-700 mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Provide AI-powered business analysis and investment readiness scoring</li>
              <li>Match you with relevant investors based on your profile</li>
              <li>Improve our matching algorithms and AI models</li>
              <li>Communicate with you about our services and updates</li>
              <li>Ensure platform security and prevent fraud</li>
              <li>Comply with legal obligations</li>
              <li>Analyze platform usage to improve our services</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">
              3. How We Share Your Information
            </h2>

            <h3 className="text-xl font-semibold text-black mt-6 mb-3">3.1 With Your Consent</h3>
            <p className="text-gray-700 mb-4">
              We share your business information with investors only when you explicitly approve a
              match or introduction. You control what information investors can see.
            </p>

            <h3 className="text-xl font-semibold text-black mt-6 mb-3">3.2 Service Providers</h3>
            <p className="text-gray-700 mb-4">We work with trusted third-party services for:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Cloud hosting (AWS/Google Cloud)</li>
              <li>Email delivery (SendGrid)</li>
              <li>Analytics (privacy-focused tools)</li>
              <li>Payment processing (Stripe)</li>
            </ul>

            <h3 className="text-xl font-semibold text-black mt-6 mb-3">3.3 Legal Requirements</h3>
            <p className="text-gray-700 mb-4">
              We may disclose information if required by law, court order, or government request.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">4. Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement industry-standard security measures including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security audits and penetration testing</li>
              <li>Access controls and authentication</li>
              <li>Secure data centers with 24/7 monitoring</li>
              <li>Employee training on data protection</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">
              5. Your Rights (GDPR Compliance)
            </h2>
            <p className="text-gray-700 mb-4">
              Under GDPR and other privacy laws, you have the right to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>
                <strong>Access:</strong> Request a copy of your personal data
              </li>
              <li>
                <strong>Rectification:</strong> Correct inaccurate or incomplete data
              </li>
              <li>
                <strong>Erasure:</strong> Request deletion of your data ("right to be forgotten")
              </li>
              <li>
                <strong>Portability:</strong> Receive your data in a machine-readable format
              </li>
              <li>
                <strong>Object:</strong> Opt-out of certain data processing
              </li>
              <li>
                <strong>Restrict:</strong> Limit how we process your data
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">6. Data Retention</h2>
            <p className="text-gray-700 mb-4">
              We retain your data for as long as necessary to provide our services and comply with
              legal obligations:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Active account data: Retained while account is active</li>
              <li>Deleted account data: Removed within 90 days</li>
              <li>Analytics data: Anonymized after 24 months</li>
              <li>Legal/tax records: Retained as required by law</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">
              7. International Data Transfers
            </h2>
            <p className="text-gray-700 mb-4">
              Your data may be transferred to and processed in countries outside the European
              Economic Area (EEA). We ensure appropriate safeguards are in place, including Standard
              Contractual Clauses approved by the European Commission.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">8. Children's Privacy</h2>
            <p className="text-gray-700 mb-4">
              FrejFund is not intended for users under 18 years of age. We do not knowingly collect
              personal information from children.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">9. AI and Machine Learning</h2>
            <p className="text-gray-700 mb-4">
              We use AI to analyze your business and provide insights. Here's how:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Your data trains our models to improve accuracy</li>
              <li>Analysis results are stored securely with your profile</li>
              <li>We never share individual analysis with other users</li>
              <li>You can request human review of AI decisions</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">10. Cookies Policy</h2>
            <p className="text-gray-700 mb-4">We use cookies to:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>
                <strong>Essential cookies:</strong> Required for platform functionality
              </li>
              <li>
                <strong>Analytics cookies:</strong> Help us understand usage (with consent)
              </li>
              <li>
                <strong>Preference cookies:</strong> Remember your settings
              </li>
            </ul>
            <p className="text-gray-700 mb-4">
              You can manage cookie preferences in your browser settings.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">11. Changes to This Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this Privacy Policy periodically. We will notify you of significant
              changes via email or platform notification. Continued use after changes constitutes
              acceptance.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">12. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              For privacy-related questions or to exercise your rights:
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Data Protection Officer</strong>
              <br />
              FrejFund
              <br />
              Email: privacy@frejfund.com
              <br />
              Address: Stockholm, Sweden
            </p>
            <p className="text-gray-700 mb-4">Response time: Within 30 days of request</p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">13. Supervisory Authority</h2>
            <p className="text-gray-700 mb-4">
              If you are not satisfied with our response, you have the right to lodge a complaint
              with your local data protection authority. In Sweden, this is the Swedish Authority
              for Privacy Protection (Integritetsskyddsmyndigheten).
            </p>

            <div className="mt-12 p-6 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600 text-center">
                Your privacy is important to us. We are committed to protecting your data and being
                transparent about how we use it to help you succeed in your fundraising journey.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.main>

      <Footer />
    </div>
  );
}
