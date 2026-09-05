import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { projects } from '@/lib/projects'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Project card from buft.io'

export function generateStaticParams() {
  return projects.map(({ slug }) => ({ slug }))
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const project = projects.find((item) => item.slug === slug)!
  const root = process.cwd()
  const [heading, body, mono, icon] = await Promise.all([
    readFile(join(root, 'public/fonts/manrope-extrabold.ttf')),
    readFile(join(root, 'public/fonts/manrope-regular.ttf')),
    readFile(join(root, 'public/fonts/dm-mono.ttf')),
    readFile(join(root, 'src/app/icon.svg'), 'utf8'),
  ])
  const iconSrc = `data:image/svg+xml;base64,${Buffer.from(icon).toString('base64')}`
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 72,
        background:
          'radial-gradient(circle at 85% 80%, rgba(255,110,40,0.35), transparent 45%), #10090b',
        color: '#f3e9e2',
        fontFamily: 'Manrope',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          fontFamily: 'DM Mono',
          fontSize: 26,
          letterSpacing: 4,
          color: project.color,
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            background: project.color,
          }}
        />
        {project.name.toUpperCase()} · {project.period}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1 }}>
          {project.title}
        </div>
        <div
          style={{
            fontSize: 34,
            lineHeight: 1.35,
            color: '#c9b8ad',
            maxWidth: 960,
          }}
        >
          {project.summary}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          fontSize: 28,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            backgroundImage: `url(${iconSrc})`,
            backgroundSize: '44px 44px',
          }}
        />
        <span style={{ fontWeight: 800 }}>buft.io</span>
        <span style={{ color: '#8f7d73' }}>· Igor Ostanin</span>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: 'Manrope', data: heading, weight: 800 },
        { name: 'Manrope', data: body, weight: 400 },
        { name: 'DM Mono', data: mono, weight: 400 },
      ],
    },
  )
}
