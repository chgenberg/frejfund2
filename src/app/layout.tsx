import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Chatbot from "@/components/Chatbot";
import Script from 'next/script';
import { organizationSchema, websiteSchema, faqSchema, howToSchema, serviceSchema, softwareAppSchema } from '@/lib/structured-data';

// Disable prerendering globally to avoid Turbopack prerender errors on client-heavy pages
export const dynamic = 'force-dynamic';

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "FrejFund - AI-Powered Investment Matching for Startups",
  description: "Connect with the right investors using AI. Get funding faster with intelligent matching and investment readiness coaching. Hur får jag pengar till min startup?",
  keywords: [
    'startup funding',
    'get funding for startup',
    'hur får jag pengar till min startup',
    'venture capital',
    'angel investors', 
    'seed funding',
    'Series A',
    'investment matching',
    'AI investor matching',
    'pitch deck',
    'fundraising',
    'startup investment',
    'Nordic startups',
    'European VCs'
  ],
  authors: [{ name: 'FrejFund' }],
  creator: 'FrejFund',
  publisher: 'FrejFund',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'FrejFund - Get Startup Funding with AI',
    description: 'Connect with 500+ investors. AI-powered matching and coaching for startups seeking funding.',
    url: 'https://www.frejfund.com',
    siteName: 'FrejFund',
    images: [
      {
        url: 'https://www.frejfund.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FrejFund - AI Investment Matching',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FrejFund - Get Startup Funding with AI',
    description: 'Connect with 500+ investors. AI-powered matching for startups.',
    images: ['https://www.frejfund.com/twitter-image.png'],
    creator: '@frejfund',
  },
  alternates: {
    canonical: 'https://www.frejfund.com',
    languages: {
      'en-US': 'https://www.frejfund.com',
      'sv-SE': 'https://www.frejfund.com/sv',
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Combine all schemas
  const structuredData = [
    organizationSchema,
    websiteSchema,
    faqSchema,
    howToSchema,
    serviceSchema,
    softwareAppSchema
  ];

  return (
    <html lang="en">
      <head>
        {/* Google Tag Manager (guarded) */}
        {process.env.NODE_ENV === 'production' && (
          <>
            <Script
              id="gtag-src"
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GTM_ID || 'AW-17103900584'}`}
            />
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
                      gtag('config', '${process.env.NEXT_PUBLIC_GTM_ID || 'AW-17103900584'}');
                    }
                  } catch (e) {
                    // no-op if blocked by ITP/adblock
                  }
                `,
              }}
            />
          </>
        )}
        
        {/* JSON-LD Structured Data for LLMs */}
        {structuredData.map((schema, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </head>
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        {children}
        <Chatbot />
      </body>
    </html>
  );
}
