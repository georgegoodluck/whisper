import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import { getSiteUrl } from '@/lib/site-url'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // refresh hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl()

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/signup`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  try {
    const admin = await createAdminClient()
    const { data: spaces } = await admin
      .from('spaces')
      .select('invite_code, created_at')
      .order('created_at', { ascending: false })
      .limit(1000)

    const spacePages: MetadataRoute.Sitemap = (spaces ?? []).map(s => ({
      url: `${baseUrl}/s/${s.invite_code}`,
      lastModified: new Date(s.created_at),
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    return [...staticPages, ...spacePages]
  } catch {
    return staticPages
  }
}
