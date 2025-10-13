'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Globe, MapPin, TrendingUp } from 'lucide-react';
import Header from '@/components/Header';
import { SEO_LOCATIONS } from '@/lib/seo-locations';

// Note: Metadata must be exported from server components
// For client components, we'll set this via document.title in useEffect

export default function LocationsPage() {
  const majorHubs = SEO_LOCATIONS.filter(l => l.tech_scene === 'major');
  const growingHubs = SEO_LOCATIONS.filter(l => l.tech_scene === 'growing');
  const emergingHubs = SEO_LOCATIONS.filter(l => l.tech_scene === 'emerging');

  const regions = {
    'North America': SEO_LOCATIONS.filter(l => l.region === 'North America'),
    'Europe': SEO_LOCATIONS.filter(l => l.region === 'Europe'),
    'Asia': SEO_LOCATIONS.filter(l => l.region === 'Asia'),
    'Middle East': SEO_LOCATIONS.filter(l => l.region === 'Middle East'),
    'Africa': SEO_LOCATIONS.filter(l => l.region === 'Africa'),
    'South America': SEO_LOCATIONS.filter(l => l.region === 'South America'),
    'Oceania': SEO_LOCATIONS.filter(l => l.region === 'Oceania'),
  };

  return (
    <div className="min-h-screen bg-white">
      <Header showInvestorsButton />
      
      <div className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-black mb-6">
              FrejFund Worldwide
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Connect with investors and startups in over 150 cities and countries. 
              Because great ideas deserve a chance, no matter where they come from.
            </p>
          </div>

          {/* Major Tech Hubs */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <TrendingUp className="w-6 h-6 text-black" />
              <h2 className="text-3xl font-bold text-black">Major Tech Hubs</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {majorHubs.map((location) => (
                <Link
                  key={location.slug}
                  href={`/${location.slug}`}
                  className="p-4 border border-gray-200 rounded-xl hover:border-black transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-black group-hover:underline">
                        {location.name}
                      </h3>
                      {location.type === 'city' && location.country && (
                        <p className="text-sm text-gray-600">{location.country}</p>
                      )}
                    </div>
                    <MapPin className="w-4 h-4 text-gray-400 group-hover:text-black transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Browse by Region */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <Globe className="w-6 h-6 text-black" />
              <h2 className="text-3xl font-bold text-black">Browse by Region</h2>
            </div>
            <div className="space-y-12">
              {Object.entries(regions).map(([region, locations]) => (
                locations.length > 0 && (
                  <div key={region}>
                    <h3 className="text-xl font-semibold text-black mb-4">{region}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {locations.map((location) => (
                        <Link
                          key={location.slug}
                          href={`/${location.slug}`}
                          className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <span className="text-sm font-medium text-gray-700 hover:text-black">
                            {location.name}
                            {location.type === 'city' && location.country && ` • ${location.country}`}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-12">
        <div className="max-w-6xl mx-auto px-8 text-center">
          <p className="text-gray-600 mb-4">
            Can't find your location? We're constantly expanding.
          </p>
          <Link 
            href="/" 
            className="text-black font-semibold hover:underline"
          >
            Get Started Anyway →
          </Link>
        </div>
      </footer>
    </div>
  );
}
