'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Lightbulb, Users, Globe } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      <Header />
      
      <main className="pt-24">
        {/* Hero Section */}
        <section className="px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full mb-8">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium text-gray-700">Our Story</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-black mb-8 tracking-tight leading-tight">
              Built by founders,<br />for founders
            </h1>
            
            <div className="max-w-3xl mx-auto">
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                We&apos;re Jakob and Christopher — two founders who&apos;ve been on both sides of the table.
              </p>
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                After building several companies ourselves, we know how hard it can be to turn a great idea into reality. That&apos;s why we started FrejFund — to give every truly good idea a fair chance.
              </p>
              <p className="text-xl text-gray-600 leading-relaxed">
                Our vision is simple: use AI to make it easier for entrepreneurs and investors around the world to find each other — faster, smarter, and more human.
              </p>
            </div>
          </motion.div>
        </section>

        {/* Values Section */}
        <section className="px-6 py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-black mb-4">Our Values</h2>
              <p className="text-lg text-gray-600">What drives us every day</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="minimal-box text-center"
              >
                <div className="w-12 h-12 bg-black rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-black mb-2">Innovation First</h3>
                <p className="text-gray-600">
                  We believe great ideas can come from anywhere. Our technology ensures they get the attention they deserve.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="minimal-box text-center"
              >
                <div className="w-12 h-12 bg-black rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-black mb-2">Human Connection</h3>
                <p className="text-gray-600">
                  AI enhances but never replaces human judgment. We focus on creating meaningful connections between people.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                className="minimal-box text-center"
              >
                <div className="w-12 h-12 bg-black rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-black mb-2">Global Impact</h3>
                <p className="text-gray-600">
                  From Stockholm to San Francisco, we&apos;re building a global network where geography doesn&apos;t limit opportunity.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="px-6 py-20">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="minimal-box minimal-box-shadow text-center"
            >
              <h2 className="text-3xl font-bold text-black mb-6">Our Mission</h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                To democratize access to capital and make fundraising a fair, transparent, and efficient process for every entrepreneur with a vision worth pursuing.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/')}
                className="minimal-button inline-flex items-center gap-3"
              >
                <span>Start Your Journey</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="px-6 py-20 bg-black text-white">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold mb-4">Growing Together</h2>
              <p className="text-lg text-gray-300">Our impact so far</p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl font-bold mb-2">500+</div>
                <div className="text-gray-400">Active Investors</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl font-bold mb-2">250+</div>
                <div className="text-gray-400">Cities Covered</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl font-bold mb-2">60%</div>
                <div className="text-gray-400">Faster Fundraising</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl font-bold mb-2">4x</div>
                <div className="text-gray-400">Response Rate</div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
