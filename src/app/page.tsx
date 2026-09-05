import { preload } from 'react-dom'
import { Home } from '@/components/home'

export default function HomePage() {
  preload('/sitting.glb', { as: 'fetch', crossOrigin: 'anonymous' })
  preload('/rock.glb', { as: 'fetch', crossOrigin: 'anonymous' })
  for (const font of ['manrope-regular', 'manrope-extrabold', 'dm-mono'])
    preload(`/fonts/${font}.ttf`, {
      as: 'font',
      type: 'font/ttf',
      crossOrigin: 'anonymous',
    })
  return <Home />
}
