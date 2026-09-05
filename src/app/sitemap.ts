import type { MetadataRoute } from 'next'
import { projects } from '@/lib/projects'
import { siteUrl } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, priority: 1 },
    ...projects.map((item) => ({
      url: `${siteUrl}/p/${item.slug}`,
      priority: 0.8,
    })),
  ]
}
