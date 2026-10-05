'use client'

import { useFrame } from '@react-three/fiber'
import { useRef, type RefObject } from 'react'
import {
  CanvasTexture,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  OctahedronGeometry,
  RepeatWrapping,
  type BufferGeometry,
} from 'three'
import { clay, geo } from '../marketdata/models/clay'
import { SPEED, type Game, type Item } from './factory'
import { DIRS, cellOf, toWorld, type Dir, type Kind } from './map'

type Look = {
  geometry: BufferGeometry
  color: string
  size: [number, number, number]
  tilt?: number
}

const gem = new OctahedronGeometry(0.5)
export const looks: Record<Kind, Look> = {
  potato: { geometry: geo.sphere, color: '#b08a5a', size: [0.34, 0.26, 0.4] },
  tomato: { geometry: geo.sphere, color: '#e0533d', size: [0.3, 0.28, 0.3] },
  bear: { geometry: geo.box, color: '#7a5236', size: [0.34, 0.4, 0.34] },
  van: { geometry: geo.box, color: '#6f7d4a', size: [0.5, 0.34, 0.3] },
  banana: {
    geometry: geo.cylinder,
    color: '#f2d14b',
    size: [0.12, 0.44, 0.12],
    tilt: Math.PI / 2,
  },
  grapes: { geometry: geo.sphere, color: '#7d4fa3', size: [0.32, 0.32, 0.32] },
  monkey: { geometry: geo.sphere, color: '#a87a52', size: [0.38, 0.38, 0.38] },
  car: { geometry: geo.box, color: '#e23b2e', size: [0.54, 0.2, 0.3] },
  paper: { geometry: geo.slab, color: '#fbfbf7', size: [0.34, 0.03, 0.44] },
  gray: { geometry: geo.cylinder, color: '#9aa0a8', size: [0.28, 0.07, 0.28] },
  gold: { geometry: geo.cylinder, color: '#f2bf3a', size: [0.3, 0.08, 0.3] },
  diamond: { geometry: gem, color: '#7fe3ff', size: [0.24, 0.3, 0.24] },
}
const kinds = Object.keys(looks) as Kind[]
const CAP = 320

export type Placed = { item: Item; x: number; y: number; z: number }

/** Where every visible item sits right now: riding a belt, waiting in a pile, or in the player's hand. */
export function eachItem(
  game: Game,
  t: number,
  hand: { x: number; z: number } | null,
  visit: (placed: Placed) => void,
) {
  for (const [at, belt] of game.belts) {
    const [cx, cz] = toWorld(...cellOf(at))
    const [dx, dz] = DIRS[belt.dir]
    for (const item of belt.items)
      visit({
        item,
        x: cx + dx * (item.p - 0.5),
        z: cz + dz * (item.p - 0.5),
        y: 0.1 + looks[item.kind].size[1] / 2,
      })
  }
  for (const [at, pile] of game.piles) {
    if (game.belts.has(at)) continue
    const [cx, cz] = toWorld(...cellOf(at))
    pile.forEach((item, i) => {
      if (item.kind === 'paper') {
        const a = item.id * 2.4 + t * 0.8
        visit({
          item,
          x: cx + Math.cos(a) * 0.28,
          z: cz + Math.sin(a) * 0.22,
          y: 0.45 + Math.sin(t * 2 + item.id) * 0.08 + i * 0.05,
        })
      } else
        visit({
          item,
          x: cx + ((i % 3) - 1) * 0.12,
          z: cz + (Math.floor(i / 3) % 2) * 0.12 - 0.06,
          y: 0.06 + looks[item.kind].size[1] * (0.5 + Math.floor(i / 6)),
        })
    })
  }
  if (game.held && hand)
    visit({ item: game.held.item, x: hand.x, z: hand.z, y: 0.75 })
}

const dummy = new Object3D()

export function Items({
  game,
  hand,
}: {
  game: RefObject<Game>
  hand: RefObject<{ x: number; z: number } | null>
}) {
  const meshes = useRef<Partial<Record<Kind, InstancedMesh | null>>>({})
  const counts = useRef<Partial<Record<Kind, number>>>({})
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    for (const kind of kinds) counts.current[kind] = 0
    eachItem(game.current, t, hand.current, ({ item, x, y, z }) => {
      const mesh = meshes.current[item.kind]
      const n = counts.current[item.kind]!
      if (!mesh || n >= CAP) return
      const look = looks[item.kind]
      const grow = item.kind === 'diamond' ? 0.7 + item.n * 0.12 : 1
      dummy.position.set(x, y * (item.kind === 'diamond' ? grow : 1), z)
      dummy.rotation.set(
        0,
        item.kind === 'diamond' ? t * 2 + item.id : item.id * 1.7,
        look.tilt ?? 0,
      )
      dummy.scale.set(
        look.size[0] * grow,
        look.size[1] * grow,
        look.size[2] * grow,
      )
      dummy.updateMatrix()
      mesh.setMatrixAt(n, dummy.matrix)
      counts.current[item.kind] = n + 1
    })
    for (const kind of kinds) {
      const mesh = meshes.current[kind]
      if (!mesh) continue
      mesh.count = counts.current[kind]!
      mesh.instanceMatrix.needsUpdate = true
    }
  })
  return (
    <>
      {kinds.map((kind) => (
        <instancedMesh
          key={kind}
          ref={(mesh) => {
            meshes.current[kind] = mesh
          }}
          args={[looks[kind].geometry, clay(looks[kind].color), CAP]}
          castShadow
          frustumCulled={false}
        />
      ))}
    </>
  )
}

function arrows() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#3a4150'
  ctx.fillRect(0, 0, 64, 64)
  ctx.fillStyle = '#4a5366'
  ctx.fillRect(0, 0, 6, 64)
  ctx.fillRect(58, 0, 6, 64)
  ctx.strokeStyle = '#8fa6c9'
  ctx.lineWidth = 6
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(18, 40)
  ctx.lineTo(32, 26)
  ctx.lineTo(46, 40)
  ctx.stroke()
  const texture = new CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = RepeatWrapping
  return texture
}

let belt: MeshStandardMaterial | undefined
const beltMaterial = () =>
  (belt ??= new MeshStandardMaterial({ map: arrows(), roughness: 0.9 }))

export function Belts({ belts }: { belts: [number, Dir][] }) {
  const material = beltMaterial()
  useFrame((_, dt) => {
    beltMaterial().map!.offset.y -= dt * SPEED
  })
  return (
    <>
      {belts.map(([at, dir]) => {
        const [x, z] = toWorld(...cellOf(at))
        return (
          <group
            key={at}
            position={[x, 0.05, z]}
            rotation={[0, -(dir - 3) * (Math.PI / 2), 0]}
          >
            <mesh
              geometry={geo.slab}
              material={material}
              scale={[0.94, 0.1, 0.94]}
              receiveShadow
            />
          </group>
        )
      })}
    </>
  )
}
