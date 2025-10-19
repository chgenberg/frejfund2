'use client';

import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function TermsOfService() {
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
            Terms of Service
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

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 mb-4">
              By accessing or using FrejFund's services ("Services"), you agree to be bound by these
              Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our
              Services.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">2. Description of Services</h2>
            <p className="text-gray-700 mb-4">FrejFund provides an AI-powered platform that:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Analyzes startup businesses across multiple dimensions</li>
              <li>Provides investment readiness assessments</li>
              <li>Matches startups with potential investors</li>
              <li>Offers AI-driven coaching and insights</li>
              <li>Facilitates connections between founders and investors</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">3. User Accounts</h2>
            <p className="text-gray-700 mb-4">
              <strong>3.1 Account Creation:</strong> You may need to create an account to access
              certain features. You are responsible for maintaining the confidentiality of your
              account credentials.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>3.2 Accurate Information:</strong> You agree to provide accurate, current, and
              complete information during registration and to update such information to keep it
              accurate.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>3.3 Account Security:</strong> You are responsible for all activities that
              occur under your account.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">4. Use of Services</h2>
            <p className="text-gray-700 mb-4">
              <strong>4.1 Permitted Use:</strong> You may use our Services only for lawful purposes
              and in accordance with these Terms.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>4.2 Prohibited Uses:</strong> You agree not to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Provide false or misleading information</li>
              <li>Impersonate any person or entity</li>
              <li>Use the Services to harass, abuse, or harm others</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Use our Services for any illegal or unauthorized purpose</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">
              5. Content and Intellectual Property
            </h2>
            <p className="text-gray-700 mb-4">
              <strong>5.1 Your Content:</strong> You retain ownership of any content you submit to
              FrejFund. By submitting content, you grant us a worldwide, non-exclusive, royalty-free
              license to use, process, and analyze your content to provide our Services.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>5.2 Our Content:</strong> FrejFund and its licensors own all rights to the
              Services, including all software, text, images, and other content.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">6. AI Analysis and Matching</h2>
            <p className="text-gray-700 mb-4">
              <strong>6.1 No Guarantee:</strong> Our AI analysis and investor matching are provided
              as tools to assist in your fundraising journey. We do not guarantee funding, investor
              interest, or the accuracy of our analysis.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>6.2 Not Financial Advice:</strong> Our Services do not constitute financial,
              investment, or legal advice. Always consult with qualified professionals before making
              financial decisions.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">
              7. Privacy and Data Protection
            </h2>
            <p className="text-gray-700 mb-4">
              Your use of our Services is also governed by our Privacy Policy. By using our
              Services, you consent to our collection and use of your information as described in
              the Privacy Policy.
            </p>
            <h3 className="text-xl font-semibold text-black mt-6 mb-3">7.1 Data Processing Addendum (DPA)</h3>
            <p className="text-gray-700 mb-4">
              If you are a business customer and require a DPA under applicable data protection laws
              (e.g., GDPR), our standard DPA applies to your use of the Services and is incorporated
              by reference. The DPA describes our roles (processor vs controller), data processing
              instructions, security measures, subprocessors, and international transfer safeguards.
              See <a href="/dpa" className="underline">/dpa</a> for details.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">8. Fees and Payment</h2>
            <p className="text-gray-700 mb-4">
              <strong>8.1 Pricing:</strong> Some features of our Services may require payment.
              Current pricing is available on our website.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>8.2 Payment Terms:</strong> By purchasing a paid plan, you agree to pay all
              applicable fees. Fees are non-refundable except as required by law.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">
              9. Disclaimers and Limitations of Liability
            </h2>
            <p className="text-gray-700 mb-4">
              <strong>9.1 "As Is" Basis:</strong> Our Services are provided "as is" and "as
              available" without warranties of any kind, either express or implied.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>9.2 Limitation of Liability:</strong> To the maximum extent permitted by law,
              FrejFund shall not be liable for any indirect, incidental, special, consequential, or
              punitive damages resulting from your use or inability to use the Services.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">10. Indemnification</h2>
            <p className="text-gray-700 mb-4">
              You agree to indemnify and hold harmless FrejFund, its officers, directors, employees,
              and agents from any claims, damages, or expenses arising from your use of the Services
              or violation of these Terms.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">11. Termination</h2>
            <p className="text-gray-700 mb-4">
              We may terminate or suspend your account and access to the Services at any time, with
              or without cause or notice. You may terminate your account at any time by contacting
              us.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">12. Changes to Terms</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify these Terms at any time. We will notify you of
              significant changes by posting the new Terms on our website and updating the "Last
              Updated" date.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">13. Governing Law</h2>
            <p className="text-gray-700 mb-4">
              These Terms shall be governed by and construed in accordance with the laws of Sweden,
              without regard to its conflict of law provisions.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">14. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about these Terms, please contact us at:
            </p>
            <p className="text-gray-700 mb-4">
              <strong>FrejFund</strong>
              <br />
              Email: legal@frejfund.com
              <br />
              Address: Stockholm, Sweden
            </p>

            <div className="mt-12 p-6 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600 text-center">
                By using FrejFund, you acknowledge that you have read, understood, and agree to be
                bound by these Terms of Service.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.main>

      <Footer />
    </div>
  );
}
