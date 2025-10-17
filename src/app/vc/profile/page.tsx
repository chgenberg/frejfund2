'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Upload, Save, Camera, Globe, Linkedin, Twitter,
  MapPin, DollarSign, Target, Building2, Check
} from 'lucide-react';

export default function VCProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [profile, setProfile] = useState({
    firmName: 'Nordic Ventures',
    partnerName: 'Sarah Johnson',
    role: 'Managing Partner',
    bio: 'Investing in early-stage B2B SaaS companies across the Nordics. Former operator with 10+ years building enterprise software.',
    logoUrl: '',
    location: 'Stockholm, Sweden',
    website: 'https://nordicventures.com',
    linkedin: 'https://linkedin.com/in/sarahjohnson',
    twitter: '@sarahj_vc',
    fundSize: '€50M',
    typicalCheck: '€500K - €2M',
    sweetSpot: '€1M',
    sectors: ['B2B SaaS', 'Fintech', 'Climate Tech'],
    stages: ['Seed', 'Series A'],
    portfolio: [
      { name: 'DataFlow AI', logo: '/placeholder.png' },
      { name: 'GreenPay', logo: '/placeholder.png' },
      { name: 'CloudMetrics', logo: '/placeholder.png' }
    ]
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const addPortfolioCompany = () => {
    setProfile({
      ...profile,
      portfolio: [...profile.portfolio, { name: '', logo: '/placeholder.png' }]
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/vc')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <h1 className="text-xl font-bold text-black">VC Profile</h1>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved
                </>
              ) : saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Profile
                </>
              )}
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Logo and Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-black mb-4">Firm Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Firm Logo
                </label>
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors overflow-hidden"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {profile.logoUrl ? (
                      <img src={profile.logoUrl} alt="Firm logo" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Upload Logo
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Firm Name
                  </label>
                  <input
                    type="text"
                    value={profile.firmName}
                    onChange={(e) => setProfile({ ...profile, firmName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={profile.partnerName}
                    onChange={(e) => setProfile({ ...profile, partnerName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <input
                    type="text"
                    value={profile.role}
                    onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                  placeholder="Tell founders about your investment thesis and what you look for..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-black mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Globe className="inline w-4 h-4 mr-1" />
                Website
              </label>
              <input
                type="url"
                value={profile.website}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Linkedin className="inline w-4 h-4 mr-1" />
                LinkedIn
              </label>
              <input
                type="url"
                value={profile.linkedin}
                onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Twitter className="inline w-4 h-4 mr-1" />
                Twitter
              </label>
              <input
                type="text"
                value={profile.twitter}
                onChange={(e) => setProfile({ ...profile, twitter: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Investment Criteria */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-black mb-4">Investment Criteria</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <DollarSign className="inline w-4 h-4 mr-1" />
                Fund Size
              </label>
              <input
                type="text"
                value={profile.fundSize}
                onChange={(e) => setProfile({ ...profile, fundSize: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Typical Check Size
              </label>
              <input
                type="text"
                value={profile.typicalCheck}
                onChange={(e) => setProfile({ ...profile, typicalCheck: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sweet Spot
              </label>
              <input
                type="text"
                value={profile.sweetSpot}
                onChange={(e) => setProfile({ ...profile, sweetSpot: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Target className="inline w-4 h-4 mr-1" />
                Sectors
              </label>
              <div className="flex flex-wrap gap-2">
                {profile.sectors.map((sector, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-black text-white rounded-full text-sm"
                  >
                    {sector}
                  </span>
                ))}
                <button
                  className="px-3 py-1 border border-gray-300 rounded-full text-sm hover:bg-gray-50 transition-colors"
                >
                  + Add
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="inline w-4 h-4 mr-1" />
                Stages
              </label>
              <div className="flex flex-wrap gap-2">
                {profile.stages.map((stage, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-gray-800 text-white rounded-full text-sm"
                  >
                    {stage}
                  </span>
                ))}
                <button
                  className="px-3 py-1 border border-gray-300 rounded-full text-sm hover:bg-gray-50 transition-colors"
                >
                  + Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-black mb-4">Portfolio Companies</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {profile.portfolio.map((company, idx) => (
              <div
                key={idx}
                className="text-center"
              >
                <div className="w-20 h-20 bg-gray-100 rounded-lg mx-auto mb-2 overflow-hidden">
                  <img
                    src={company.logo}
                    alt={company.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm font-medium">{company.name}</p>
              </div>
            ))}
            <button
              onClick={addPortfolioCompany}
              className="w-20 h-20 bg-gray-100 rounded-lg mx-auto mb-2 hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              <Upload className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
