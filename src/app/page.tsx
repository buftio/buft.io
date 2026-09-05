import { preload } from 'react-dom'
import { Home } from '@/components/home'

export default function HomePage() {
  preload('/sitting.glb', { as: 'fetch', crossOrigin: 'anonymous' })
  preload('/rock.glb', { as: 'fetch', crossOrigin: 'anonymous' })
  return <Home />
}
