'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ChatInterface from '@/components/ChatInterface';
import { BusinessInfo } from '@/types/business';

// Disable prerendering; this page depends on client-only storage/session
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ChatPage() {
  const router = useRouter();
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to get business info from localStorage
    const savedInfo = localStorage.getItem('frejfund-business-info');
    if (savedInfo) {
      try {
        const parsed = JSON.parse(savedInfo);
        setBusinessInfo(parsed);
      } catch (e) {
        console.error('Failed to parse business info:', e);
      }
    }
    
    // Also check if there's a temporary session
    const tempInfo = sessionStorage.getItem('frejfund-temp-business-info');
    if (tempInfo && !savedInfo) {
      try {
        const parsed = JSON.parse(tempInfo);
        setBusinessInfo(parsed);
        // Move to permanent storage
        localStorage.setItem('frejfund-business-info', tempInfo);
        sessionStorage.removeItem('frejfund-temp-business-info');
      } catch (e) {
        console.error('Failed to parse temp business info:', e);
      }
    }

    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!businessInfo) {
    // If no business info, redirect to wizard
    router.push('/');
    return null;
  }

  return <ChatInterface businessInfo={businessInfo} messages={messages} setMessages={setMessages} />;
}
