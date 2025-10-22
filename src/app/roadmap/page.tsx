'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Target,
  CheckCircle2,
  Circle,
  ChevronRight,
  Calendar,
  TrendingUp,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import Header from '@/components/Header';
import { UserRoadmap, calculateRoadmapProgress, getCurrentMilestone } from '@/lib/goal-system';

export const dynamic = 'force-dynamic';

export default function RoadmapPage() {
  const router = useRouter();
  const [roadmap, setRoadmap] = useState<UserRoadmap | null>(null);
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);

  useEffect(() => {
    // Redirect immediately to dashboard; this page is not used post-analysis
    router.replace('/dashboard');
  }, [router]);

  const handleStartCoaching = () => {
    router.push('/chat');
  };

  // Render nothing because we redirect
  return null;
}
