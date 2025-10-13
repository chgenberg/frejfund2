'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-8">
          {/* Logo section - full width on mobile */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black rounded-full flex items-center justify-center">
                <div className="w-1 h-1 bg-white rounded-full" />
              </div>
              <span className="text-lg sm:text-xl font-semibold text-black">FrejFund</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600">
              Investment intelligence for tomorrow&apos;s unicorns
            </p>
          </div>

          {/* Removed Founders quick-links per request */}

          {/* For Investors section */}
          <div className="col-span-1">
            <h3 className="font-semibold text-black mb-2 sm:mb-3 text-sm sm:text-base">For Investors</h3>
            <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
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

          {/* Company section - spans full width on small mobile */}
          <div className="col-span-2 sm:col-span-1 md:col-span-1">
            <h3 className="font-semibold text-black mb-2 sm:mb-3 text-sm sm:text-base">Company</h3>
            <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
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

        {/* Copyright section */}
        <div className="border-t border-gray-200 pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 font-light text-xs sm:text-sm mb-4 md:mb-0 text-center md:text-left">
            © 2024 FrejFund - Because great ideas deserve a chance
          </p>
          <div className="flex space-x-4 sm:space-x-6 text-xs sm:text-sm text-gray-500">
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
