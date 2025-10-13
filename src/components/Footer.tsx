'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Footer() {
  return (
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
              Investment intelligence for tomorrow&apos;s unicorns
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-black mb-3">For Founders</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/pitch" className="hover:text-black transition-colors">
                  Pitch Analysis
                </Link>
              </li>
              <li>
                <Link href="/analysis" className="hover:text-black transition-colors">
                  Business Analysis
                </Link>
              </li>
              <li>
                <Link href="/chat" className="hover:text-black transition-colors">
                  AI Coach
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-black mb-3">For Investors</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/vc" className="hover:text-black transition-colors">
                  Deal Flow
                </Link>
              </li>
              <li>
                <Link href="/vc/analytics" className="hover:text-black transition-colors">
                  Analytics
                </Link>
              </li>
              <li>
                <Link href="/vc/swipe" className="hover:text-black transition-colors">
                  Smart Matching
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-black mb-3">Company</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/about" className="hover:text-black transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-black transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/locations" className="hover:text-black transition-colors">
                  All Locations
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 font-light text-sm mb-4 md:mb-0">
            © 2024 FrejFund - Because great ideas deserve a chance
          </p>
          <div className="flex space-x-6 text-sm text-gray-500">
            <Link href="/privacy" className="hover:text-black transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-black transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
