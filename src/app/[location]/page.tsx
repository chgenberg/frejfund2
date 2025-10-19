import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LocationLandingPage from '@/components/LocationLandingPage';
import { SEO_LOCATIONS, Location } from '@/lib/seo-locations';

interface PageProps {
  params: { location: string };
}

// Generate static params for only major tech hubs to reduce build time and memory
// Other locations will be generated on-demand
export async function generateStaticParams() {
  // Only pre-generate major tech hubs to save memory during build
  const majorLocations = SEO_LOCATIONS.filter((l) => l.tech_scene === 'major').slice(0, 20);
  return majorLocations.map((location) => ({
    location: location.slug,
  }));
}

// Enable ISR for dynamic locations
export const dynamicParams = true;
export const revalidate = 3600; // Revalidate every hour

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { location: locationSlug } = await params;
  const location = SEO_LOCATIONS.find((l) => l.slug === locationSlug);

  if (!location) {
    return {
      title: 'Location Not Found - FrejFund',
    };
  }

  const locationTitle =
    location.type === 'city' && location.country
      ? `${location.name}, ${location.country}`
      : location.name;

  return {
    title: `FrejFund ${locationTitle} - Connecting Founders & Investors`,
    description: `Because great ideas from ${location.name} deserve a chance. Connect with investors who believe in building a better future. Investment intelligence platform for startups in ${locationTitle}.`,
    keywords: [
      `${location.name} startups`,
      `${location.name} investors`,
      `${location.name} venture capital`,
      `${location.name} fundraising`,
      `startup funding ${location.name}`,
      `angel investors ${location.name}`,
      'FrejFund',
      'investment platform',
      'startup analysis',
    ].join(', '),
    openGraph: {
      title: `FrejFund ${locationTitle} - Investment Platform`,
      description: `Great ideas from ${location.name} deserve funding. Connect with investors on FrejFund.`,
      type: 'website',
      locale: 'en_US',
      url: `https://frejfund.com/${location.slug}`,
      siteName: 'FrejFund',
    },
    twitter: {
      card: 'summary_large_image',
      title: `FrejFund ${locationTitle}`,
      description: `Because great ideas from ${location.name} deserve a chance.`,
    },
    alternates: {
      canonical: `https://frejfund.com/${location.slug}`,
    },
  };
}

export default async function LocationPage({ params }: PageProps) {
  const { location: locationSlug } = await params;
  const location = SEO_LOCATIONS.find((l) => l.slug === locationSlug);

  if (!location) {
    notFound();
  }

  return <LocationLandingPage location={location} />;
}
