import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Chatbot from "@/components/Chatbot";

// Disable prerendering globally to avoid Turbopack prerender errors on client-heavy pages
export const dynamic = 'force-dynamic';

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "FrejFund AI - Investment Intelligence for Startups",
  description: "AI-powered business analysis and investment readiness platform for startups and entrepreneurs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        {children}
        <Chatbot />
      </body>
    </html>
  );
}
