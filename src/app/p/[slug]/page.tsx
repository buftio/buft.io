import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Home } from '@/components/home'
import { projects } from '@/lib/projects'

type Props = { params: Promise<{ slug: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return projects.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const project = projects.find((item) => item.slug === slug)
  if (!project) return {}
  const title = `${project.name}: ${project.title}`
  return {
    title,
    description: project.summary,
    alternates: { canonical: `/p/${slug}` },
    openGraph: { title, description: project.summary, url: `/p/${slug}` },
  }
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params
  const index = projects.findIndex((item) => item.slug === slug)
  if (index < 0) notFound()
  return <Home initial={index} />
}
