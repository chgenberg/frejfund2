'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Users, Globe, Building2 } from 'lucide-react';
import { Location } from '@/lib/seo-locations';
import Header from '@/components/Header';

interface LocationLandingPageProps {
  location: Location;
}

export default function LocationLandingPage({ location }: LocationLandingPageProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');

  const handleGetStarted = () => {
    // Store location context
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('user-location', location.slug);
    }
    router.push('/');
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // Store email and location
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('early-access-email', email);
        sessionStorage.setItem('user-location', location.slug);
      }
      router.push('/');
    }
  };

  // Location-specific content
  const getLocationStats = () => {
    switch (location.tech_scene) {
      case 'major':
        return {
          startups: '10,000+',
          investors: '500+',
          funding: '$10B+',
          unicorns: '20+'
        };
      case 'growing':
        return {
          startups: '1,000+',
          investors: '100+',
          funding: '$1B+',
          unicorns: '5+'
        };
      default:
        return {
          startups: '100+',
          investors: '20+',
          funding: '$100M+',
          unicorns: '1+'
        };
    }
  };

  const stats = getLocationStats();
  const locationTitle = location.type === 'city' && location.country 
    ? `${location.name}, ${location.country}` 
    : location.name;

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      <Header showInvestorsButton />

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-6 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative max-w-4xl w-full text-center"
        >
          {/* Location Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full mb-8"
          >
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium text-gray-700">{locationTitle}</span>
          </motion.div>

          <h1 className="text-5xl md:text-6xl font-bold text-black mb-6 tracking-tight leading-tight">
            Because great ideas from<br />
            <span className="text-gray-600">{location.name}</span> deserve a chance.
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-12 font-light max-w-3xl mx-auto">
            We connect founders and investors who believe in building a better future
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGetStarted}
              className="minimal-button inline-flex items-center gap-3 px-8 py-4"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>

            <span className="text-gray-400">or</span>

            <form onSubmit={handleEmailSubmit} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black transition-colors"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
              >
                Join Waitlist
              </button>
            </form>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-black mb-4">
              The {location.name} Startup Ecosystem
            </h2>
            <p className="text-lg text-gray-600">
              Join a thriving community of innovators and investors
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <Building2 className="w-8 h-8 mx-auto mb-4 text-gray-700" />
              <div className="text-3xl font-bold text-black mb-2">{stats.startups}</div>
              <div className="text-sm text-gray-600">Active Startups</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <Users className="w-8 h-8 mx-auto mb-4 text-gray-700" />
              <div className="text-3xl font-bold text-black mb-2">{stats.investors}</div>
              <div className="text-sm text-gray-600">Active Investors</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <TrendingUp className="w-8 h-8 mx-auto mb-4 text-gray-700" />
              <div className="text-3xl font-bold text-black mb-2">{stats.funding}</div>
              <div className="text-sm text-gray-600">Annual Funding</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <div className="w-8 h-8 mx-auto mb-4 bg-black rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full" />
              </div>
              <div className="text-3xl font-bold text-black mb-2">{stats.unicorns}</div>
              <div className="text-sm text-gray-600">Unicorn Companies</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-black mb-4">
              Built for {location.name}'s Entrepreneurs
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our AI-powered platform understands the unique challenges and opportunities 
              in the {location.name} startup ecosystem
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="minimal-box text-center"
            >
              <div className="w-12 h-12 bg-black rounded-full mx-auto mb-4 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
              <h3 className="text-xl font-semibold text-black mb-2">Local Investor Network</h3>
              <p className="text-gray-600">
                Connect with investors who understand the {location.name} market
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="minimal-box text-center"
            >
              <div className="w-12 h-12 bg-black rounded-full mx-auto mb-4 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
              <h3 className="text-xl font-semibold text-black mb-2">Market Intelligence</h3>
              <p className="text-gray-600">
                AI-powered insights tailored to {location.name}'s business landscape
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="minimal-box text-center"
            >
              <div className="w-12 h-12 bg-black rounded-full mx-auto mb-4 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
              <h3 className="text-xl font-semibold text-black mb-2">Global Reach</h3>
              <p className="text-gray-600">
                Take your {location.name} startup to the world stage
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to take your {location.name} startup to the next level?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of founders who trust FrejFund to connect them with the right investors
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGetStarted}
              className="bg-white text-black px-8 py-4 rounded-full font-semibold inline-flex items-center gap-3 hover:bg-gray-100 transition-colors"
            >
              <span>Start Your Journey</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                  <div className="w-1 h-1 bg-white rounded-full" />
                </div>
                <span className="text-xl font-semibold text-black">FrejFund</span>
              </div>
              <p className="text-sm text-gray-600">
                Investment intelligence for {location.name} startups
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-black mb-3">For Founders</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="/pitch" className="hover:text-black">Pitch Analysis</a></li>
                <li><a href="/analysis" className="hover:text-black">Business Analysis</a></li>
                <li><a href="/chat" className="hover:text-black">AI Coach</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-black mb-3">For Investors</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="/vc" className="hover:text-black">Deal Flow</a></li>
                <li><a href="/vc/analytics" className="hover:text-black">Analytics</a></li>
                <li><a href="/vc/swipe" className="hover:text-black">Smart Matching</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-black mb-3">Locations</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="/san-francisco" className="hover:text-black">San Francisco</a></li>
                <li><a href="/new-york" className="hover:text-black">New York</a></li>
                <li><a href="/london" className="hover:text-black">London</a></li>
                <li><a href="/stockholm" className="hover:text-black">Stockholm</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8 text-center">
            <p className="text-gray-500 font-light text-sm">
              © 2024 FrejFund - Empowering {location.name} startups
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
