import type { Metadata } from 'next'
import './globals.css'
import './project.css'
import './responsive.css'

export const metadata: Metadata = {
  title: 'Igor Ostanin · buft.io',
  description:
    'Software, curiosity, and a little fire. Explore Igor Ostanin’s work in AI, science, games, and the tools people use.',
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
