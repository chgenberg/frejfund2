'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPin, TrendingUp, DollarSign } from 'lucide-react';

interface MapStartup {
  id: string;
  companyName: string;
  location: {
    city: string;
    country: string;
    coordinates: [number, number];
  };
  monthlyRevenue: number;
  seeking: number;
  readinessScore: number;
  metrics: {
    growth: number;
  };
}

interface InteractiveMapProps {
  startups: MapStartup[];
  onStartupClick: (startup: MapStartup) => void;
}

// Extend window object for Leaflet
declare global {
  interface Window {
    L: any;
    mapStartupClick: (id: string) => void;
  }
}

export default function InteractiveMap({ startups, onStartupClick }: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    // Load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = initializeMap;
    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
      document.head.removeChild(link);
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    // Update markers when startups change
    if (mapInstanceRef.current && window.L) {
      updateMarkers();
    }
  }, [startups]);

  const initializeMap = () => {
    if (!mapRef.current || !window.L) return;

    // Initialize map centered on Europe
    const map = window.L.map(mapRef.current).setView([54.5260, 15.2551], 4);
    mapInstanceRef.current = map;

    // Add tile layer
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    updateMarkers();
  };

  const updateMarkers = () => {
    if (!mapInstanceRef.current || !window.L) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    startups.forEach(startup => {
      const getMarkerColor = (score: number) => {
        if (score >= 80) return '#10b981'; // green
        if (score >= 60) return '#f59e0b'; // yellow
        return '#ef4444'; // red
      };

      // Create custom icon
      const icon = window.L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background-color: ${getMarkerColor(startup.readinessScore)};
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: transform 0.2s;
          " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
            <span style="color: white; font-weight: bold; font-size: 14px;">
              ${startup.readinessScore}
            </span>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const marker = window.L.marker(startup.location.coordinates, { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div style="min-width: 250px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold;">${startup.companyName}</h3>
            <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">
              ${startup.location.city}, ${startup.location.country}
            </p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
              <div style="background: #f3f4f6; padding: 8px; border-radius: 6px;">
                <div style="font-size: 12px; color: #666;">MRR</div>
                <div style="font-weight: bold;">$${(startup.monthlyRevenue / 1000).toFixed(0)}k</div>
              </div>
              <div style="background: #f3f4f6; padding: 8px; border-radius: 6px;">
                <div style="font-size: 12px; color: #666;">Growth</div>
                <div style="font-weight: bold; color: #10b981;">+${startup.metrics.growth}%</div>
              </div>
            </div>
            <div style="text-align: center; padding: 8px; background: #000; color: white; border-radius: 6px; cursor: pointer;"
                 onclick="window.mapStartupClick('${startup.id}')">
              View Details
            </div>
          </div>
        `);

      markersRef.current.push(marker);
    });

    // Set up global click handler
    window.mapStartupClick = (id: string) => {
      const startup = startups.find(s => s.id === id);
      if (startup) onStartupClick(startup);
    };
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4">
        <h4 className="font-semibold text-sm mb-2">Readiness Score</h4>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded-full" />
            <span className="text-xs">80+ (Investment Ready)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full" />
            <span className="text-xs">60-79 (Nearly Ready)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-full" />
            <span className="text-xs">&lt;60 (Early Stage)</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4">
        <div className="flex items-center space-x-6">
          <div>
            <div className="text-2xl font-bold">{startups.length}</div>
            <div className="text-xs text-gray-600">Companies</div>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div>
            <div className="text-2xl font-bold">
              ${(startups.reduce((sum, s) => sum + s.seeking, 0) / 1000000).toFixed(0)}M
            </div>
            <div className="text-xs text-gray-600">Total Seeking</div>
          </div>
        </div>
      </div>
    </div>
  );
}
