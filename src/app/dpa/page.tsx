'use client';

import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function DPA() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="pt-24 sm:pt-28 pb-16 px-4 sm:px-8"
      >
        <div className="max-w-4xl mx-auto prose prose-lg">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-black mb-8">Data Processing Addendum (DPA)</h1>
          <p className="text-gray-600 mb-8">
            <strong>Effective Date:</strong> January 1, 2024
            <br />
            <strong>Last Updated:</strong> January 1, 2024
          </p>

          <h2>1. Scope and Parties</h2>
          <p>
            This DPA forms part of the Terms of Service between FrejFund ("Processor") and the
            customer ("Controller"). It applies to the processing of personal data by FrejFund on
            behalf of the customer in connection with the Services.
          </p>

          <h2>2. Roles and Instructions</h2>
          <p>
            The customer is the Controller and determines the purposes and means of processing. FrejFund
            acts as Processor and shall process personal data only on documented instructions from the
            Controller, including with regard to transfers to third countries.
          </p>

          <h2>3. Nature and Purpose of Processing</h2>
          <p>
            FrejFund processes uploaded documents, user inputs, and related metadata to provide AI-powered
            analysis, investor matching, and related Services.
          </p>

          <h2>4. Data Types and Data Subjects</h2>
          <p>
            Personal data may include contact details, business profile data, communications, and
            optionally financial or investment-related information concerning customer personnel, representatives,
            founders, or other data subjects.
          </p>

          <h2>5. Security Measures</h2>
          <ul>
            <li>Encryption in transit and at rest where available</li>
            <li>Access controls and authentication</li>
            <li>Logging and monitoring of access</li>
            <li>Regular security reviews</li>
          </ul>

          <h2>6. Subprocessors</h2>
          <p>
            FrejFund uses subprocessors to deliver the Services, including cloud hosting and AI providers.
            Current subprocessors include: cloud infrastructure (e.g., AWS), email delivery, analytics (opt-in),
            and AI API providers (e.g., OpenAI). A current list is available upon request and may be updated
            from time to time.
          </p>

          <h2>7. International Transfers</h2>
          <p>
            Transfers outside the EEA/UK use appropriate safeguards, including Standard Contractual Clauses
            where applicable.
          </p>

          <h2>8. Data Subject Rights</h2>
          <p>
            FrejFund will assist the Controller by appropriate technical and organizational measures to fulfill
            obligations to respond to requests to exercise data subject rights.
          </p>

          <h2>9. Confidentiality</h2>
          <p>
            FrejFund ensures that persons authorized to process personal data have committed to confidentiality
            or are under an appropriate statutory obligation of confidentiality.
          </p>

          <h2>10. Deletion or Return</h2>
          <p>
            Upon termination of the Services, FrejFund will delete or return all personal data to the Controller,
            unless storage is required by law.
          </p>

          <h2>11. Audits</h2>
          <p>
            FrejFund will make available information necessary to demonstrate compliance with this DPA and
            allow for audits or inspections by the Controller or an auditor mandated by the Controller, subject
            to reasonable notice and confidentiality.
          </p>

          <h2>12. Contact</h2>
          <p>
            For DPA-related inquiries, contact <strong>privacy@frejfund.com</strong>.
          </p>
        </div>
      </motion.main>

      <Footer />
    </div>
  );
}


