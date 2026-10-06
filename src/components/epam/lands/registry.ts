import type { ComponentType } from 'react'

export type Land = { id: string; name: string; x: number; y: number; radius: number }
export type SceneProps = { land: Land; reduced: boolean }
type Entry = Land & { load: () => Promise<{ default: ComponentType<SceneProps> }> }

export const LANDS: Entry[] = [
  { id: 'rose-cliffs', name: 'The Rose Cliffs', x: 11000, y: 17500, radius: 1800, load: () => import('./sites/rose-cliffs') },
  { id: 'lantern-sea', name: 'The Lantern Sea', x: 5000, y: 24000, radius: 2000, load: () => import('./sites/lantern-sea') },
  { id: 'honeycomb-basin', name: 'Honeycomb Basin', x: 18500, y: 32500, radius: 2400, load: () => import('./sites/honeycomb-basin') },
  { id: 'bubble-bazaar', name: 'The Bubble Bazaar', x: 25000, y: 15500, radius: 2000, load: () => import('./sites/bubble-bazaar') },
  { id: 'archipelago', name: 'The Archipelago', x: 19000, y: 21500, radius: 1500, load: () => import('./sites/archipelago') },
  { id: 'ember-canal', name: 'The Ember Canal', x: 21135, y: 22455, radius: 1300, load: () => import('./sites/ember-canal') },
  { id: 'red-aqueduct', name: 'The Red Aqueduct', x: 15800, y: 22000, radius: 1600, load: () => import('./sites/red-aqueduct') },
  { id: 'ring-well', name: 'The Ring Well', x: 12000, y: 26000, radius: 1500, load: () => import('./sites/ring-well') },
  { id: 'north-atolls', name: 'The North Atolls', x: 27500, y: 3500, radius: 1800, load: () => import('./sites/north-atolls') },
  { id: 'great-wall', name: 'The Great Wall', x: 34500, y: 6500, radius: 1800, load: () => import('./sites/great-wall') },
  { id: 'serpent-coast', name: 'The Serpent Coast', x: 46000, y: 25000, radius: 1800, load: () => import('./sites/serpent-coast') },
  { id: 'labyrinth', name: 'The Labyrinth', x: 32500, y: 14000, radius: 1800, load: () => import('./sites/labyrinth') },
  { id: 'old-town', name: 'Old Town', x: 30000, y: 20000, radius: 1800, load: () => import('./sites/old-town') },
  { id: 'bell-foundry', name: 'The Bell Foundry', x: 30500, y: 8000, radius: 1800, load: () => import('./sites/bell-foundry') },
  { id: 'academy', name: 'The Academy', x: 36000, y: 14500, radius: 1800, load: () => import('./sites/academy') },
  { id: 'star-moat', name: 'The Star Moat', x: 44000, y: 15000, radius: 1600, load: () => import('./sites/star-moat') },
  { id: 'southern-watch', name: 'The Southern Watch', x: 26000, y: 33000, radius: 1800, load: () => import('./sites/southern-watch') },
  { id: 'ring-road', name: 'The Ring Road', x: 14000, y: 33000, radius: 1600, load: () => import('./sites/ring-road') },
  { id: 'southern-shoals', name: 'The Southern Shoals', x: 30000, y: 39000, radius: 1800, load: () => import('./sites/southern-shoals') },
  { id: 'red-thread', name: 'The Red Thread', x: 4500, y: 28500, radius: 1600, load: () => import('./sites/red-thread') },
  { id: 'whale-rib', name: 'The Whale Rib', x: 8500, y: 38500, radius: 1800, load: () => import('./sites/whale-rib') },
  { id: 'cloud-sea', name: 'The Cloud Sea', x: 30000, y: 2000, radius: 2500, load: () => import('./sites/cloud-sea') },
  { id: 'sky-serpent', name: 'The Sky Serpent', x: 44300, y: 10000, radius: 1500, load: () => import('./sites/sky-serpent') },
  { id: 'weavers-quarter', name: "The Weavers' Quarter", x: 37000, y: 20000, radius: 1800, load: () => import('./sites/weavers-quarter') },
]
