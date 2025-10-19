'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

const STORAGE_KEY = 'ff_cookie_consent_v1';

export default function AnalyticsScripts() {
  const [allowAnalytics, setAllowAnalytics] = useState(false);

  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return setAllowAnalytics(false);
        const data = JSON.parse(raw);
        setAllowAnalytics(Boolean(data?.analytics));
      } catch {
        setAllowAnalytics(false);
      }
    };
    read();
    window.addEventListener('ff_cookie_consent_changed', read);
    return () => window.removeEventListener('ff_cookie_consent_changed', read);
  }, []);

  if (process.env.NODE_ENV !== 'production') return null;
  if (!allowAnalytics) return null;

  const id = process.env.NEXT_PUBLIC_GTM_ID || 'AW-17103900584';

  return (
    <>
      <Script id="gtag-src" strategy="afterInteractive" src={`https://www.googletagmanager.com/gtag/js?id=${id}`} />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            try {
              if (typeof window !== 'undefined') {
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);} 
                gtag('js', new Date());
                gtag('config', '${id}');
              }
            } catch (e) {}
          `,
        }}
      />
    </>
  );
}


