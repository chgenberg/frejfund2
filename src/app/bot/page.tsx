'use client';

import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function BotPolicy() {
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
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-black mb-8">FrejFund Crawler Policy</h1>
          <p className="text-gray-700 mb-6">User-Agent: <code>FrejFundBot/1.0 (+https://www.frejfund.com/bot)</code></p>
          <h2>Purpose</h2>
          <p>
            FrejFundBot crawls public startup websites to extract high-level business information for
            founder-provided analysis. We respect website owners and aim to minimize load.
          </p>
          <h2>Respect for robots.txt</h2>
          <p>
            We make best-effort requests to <code>/robots.txt</code> and do not fetch disallowed paths.
            Site owners can disallow our bot by adding <code>User-agent: FrejFundBot</code> and
            <code>Disallow: /</code>.
          </p>
          <h2>Crawl-rate and politeness</h2>
          <ul>
            <li>We limit parallel requests and add delays between fetches.</li>
            <li>We follow <code>Crawl-delay</code> where present.</li>
            <li>We cap total pages and depth per domain.</li>
          </ul>
          <h2>Contact</h2>
          <p>
            Questions or removal requests? Contact <strong>bot@frejfund.com</strong> and include your domain.
          </p>
        </div>
      </motion.main>
      <Footer />
    </div>
  );
}


