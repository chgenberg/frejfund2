'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Users, Target, Mail, ExternalLink, 
  Building2, MapPin, Calendar, DollarSign, Sparkles
} from 'lucide-react';
import { useParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface FounderProfile {
  name: string;
  email: string;
  company: string;
  industry: string;
  stage: string;
  website?: string;
  oneLiner?: string;
  askAmount?: number;
  traction?: {
    mrr?: string;
    users?: string;
    growth?: string;
    [key: string]: any;
  };
  pitchDeck?: string;
  readinessScore?: number;
}

export default function FounderProfilePage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [profile, setProfile] = useState<FounderProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [slug]);

  const loadProfile = async () => {
    try {
      const response = await fetch(`/api/founder/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h1>
          <p className="text-gray-600">This founder profile doesn't exist or has been made private.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Powered by</div>
                <div className="text-lg font-bold text-black">FrejFund</div>
              </div>
            </div>
            <a
              href="https://frejfund2-production.up.railway.app"
              className="text-sm text-gray-600 hover:text-black transition-colors"
            >
              Get your profile →
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6"
        >
          <div className="p-8">
            {/* Company Info */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-black mb-2">{profile.company}</h1>
                {profile.oneLiner && (
                  <p className="text-lg text-gray-700 mb-4">{profile.oneLiner}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                    {profile.industry}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                    {profile.stage}
                  </span>
                  {profile.askAmount && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      Raising ${(profile.askAmount / 1000000).toFixed(1)}M
                    </span>
                  )}
                </div>
              </div>
              
              {profile.readinessScore && (
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full border-4 border-green-500 flex items-center justify-center mb-2">
                    <span className="text-2xl font-bold text-black">{profile.readinessScore}</span>
                  </div>
                  <p className="text-xs text-gray-600">Readiness</p>
                </div>
              )}
            </div>

            {/* Founder Info */}
            <div className="border-t border-gray-100 pt-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Founder</h2>
              <p className="text-lg font-medium text-black">{profile.name}</p>
            </div>

            {/* Quick Stats */}
            {profile.traction && Object.keys(profile.traction).length > 0 && (
              <div className="border-t border-gray-100 pt-6 mt-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Traction</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {profile.traction.mrr && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">MRR</div>
                      <div className="text-2xl font-bold text-black">{profile.traction.mrr}</div>
                    </div>
                  )}
                  {profile.traction.users && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Users</div>
                      <div className="text-2xl font-bold text-black">{profile.traction.users}</div>
                    </div>
                  )}
                  {profile.traction.growth && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Growth</div>
                      <div className="text-2xl font-bold text-black">{profile.traction.growth}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Links */}
            <div className="border-t border-gray-100 pt-6 mt-6 flex flex-wrap gap-3">
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors inline-flex items-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Website</span>
                </a>
              )}
              {profile.pitchDeck && (
                <a
                  href={profile.pitchDeck}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors inline-flex items-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Pitch Deck</span>
                </a>
              )}
            </div>
          </div>

          {/* CTA for VCs */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Interested in connecting?</h3>
                <p className="text-sm text-gray-300 mb-4">
                  Request an introduction and we'll connect you with {profile.name}.
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const mailtoLink = `mailto:intros@frejfund.com?subject=Intro Request: ${profile.company}&body=I'm interested in connecting with ${profile.name} at ${profile.company}.%0A%0AMy name: %0AMy firm: %0AMy email: %0A%0AWhy I'm interested: `;
                  window.location.href = mailtoLink;
                }}
                className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors whitespace-nowrap"
              >
                Request Intro
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Powered by FrejFund */}
        <div className="text-center text-sm text-gray-500">
          <p>
            This profile is powered by{' '}
            <a href="https://frejfund2-production.up.railway.app" className="text-black font-medium hover:underline">
              FrejFund AI
            </a>
            {' '}— The fundraising platform for ambitious founders
          </p>
        </div>
      </main>
    </div>
  );
}
