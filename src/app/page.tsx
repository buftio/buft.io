import { Home } from '@/components/home'
import { siteUrl } from '@/lib/site'

const person = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Igor Ostanin',
  jobTitle: 'Software Engineer',
  url: siteUrl,
  sameAs: ['https://github.com/buftio', 'https://www.linkedin.com/in/buftio'],
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }}
      />
      <Home />
    </>
  )
}
