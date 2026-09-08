import type { Metadata } from 'next'
import { siteUrl } from '@/lib/site'
import './globals.css'
import './project.css'
import './responsive.css'
import './glite-objects.css'
import './glite.css'
import './marketdata-designer.css'
import './marketdata-button.css'
import './marketdata.css'
import './yandex.css'
import './yandex-responsive.css'
import './sperasoft.css'
import './lumiprobe.css'
import './lumiprobe-furniture.css'
import './lumiprobe-glossary.css'
import './lumiprobe-responsive.css'

const description =
  'Software, curiosity, and a little fire. Explore Igor Ostanin’s work in AI, science, games, and the tools people use.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Igor Ostanin · buft.io',
    template: '%s · buft.io',
  },
  description,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'buft.io',
    url: '/',
    title: 'Igor Ostanin · buft.io',
    description,
  },
  twitter: { card: 'summary_large_image' },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  )
}
