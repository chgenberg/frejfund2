import { MetadataRoute } from 'next';
import { SEO_LOCATIONS } from '@/lib/seo-locations';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://frejfund.com';
  
  // Main pages
  const mainPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/vc`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/chat`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/analysis`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pitch`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
  ];

  // Location pages
  const locationPages = SEO_LOCATIONS.map((location) => ({
    url: `${baseUrl}/${location.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: location.tech_scene === 'major' ? 0.9 : location.tech_scene === 'growing' ? 0.8 : 0.7,
  }));

  return [...mainPages, ...locationPages];
}
