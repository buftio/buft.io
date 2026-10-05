'use client'

import { useFrame } from '@react-three/fiber'
import { useRef, type RefObject } from 'react'
import {
  CanvasTexture,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  RepeatWrapping,
} from 'three'
import { geo } from '../marketdata/models/clay'
import { itemMaterial } from './models/kit'
import { itemGeometry, itemHeight } from './models/items'
import { SPEED, type Game, type Item } from './factory'
import { DIRS, cellOf, toWorld, type Dir, type Kind } from './map'

export const tints: Record<Kind, string> = {
  potato: '#b08a5a',
  tomato: '#e0533d',
  bear: '#7a5236',
  van: '#6f7d4a',
  banana: '#f2d14b',
  grapes: '#7d4fa3',
  monkey: '#a87a52',
  car: '#e23b2e',
  paper: '#fbfbf7',
  gray: '#9aa0a8',
  gold: '#f2bf3a',
  diamond: '#7fe3ff',
}
const kinds = Object.keys(tints) as Kind[]
const money: Kind[] = ['paper', 'gray', 'gold', 'diamond']
export const itemScale = (kind: Kind) => (money.includes(kind) ? 1.25 : 1.5)
export const heightOf = (kind: Kind) => itemHeight[kind] * itemScale(kind)
const CAP = 320

export type Placed = {
  item: Item
  x: number
  y: number
  z: number
  yaw: number
}

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
        y: 0.1,
        yaw: -belt.dir * (Math.PI / 2) + Math.sin(item.id * 7.3) * 0.25,
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
          y: 0.4 + Math.sin(t * 2 + item.id) * 0.08 + i * 0.05,
          yaw: a,
        })
      } else
        visit({
          item,
          x: cx + ((i % 3) - 1) * 0.12,
          z: cz + (Math.floor(i / 3) % 2) * 0.12 - 0.06,
          y: 0.02 + heightOf(item.kind) * Math.floor(i / 6),
          yaw: item.id * 1.7,
        })
    })
  }
  if (game.held && hand)
    visit({ item: game.held.item, x: hand.x, z: hand.z, y: 0.6, yaw: 0 })
}

const dummy = new Object3D()

export function Items({
  game,
  hand,
  lit,
}: {
  game: RefObject<Game>
  hand: RefObject<{ x: number; z: number } | null>
  lit: RefObject<number | null>
}) {
  const meshes = useRef<Partial<Record<Kind, InstancedMesh | null>>>({})
  const counts = useRef<Partial<Record<Kind, number>>>({})
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    for (const kind of kinds) counts.current[kind] = 0
    eachItem(game.current, t, hand.current, ({ item, x, y, z, yaw }) => {
      const mesh = meshes.current[item.kind]
      const n = counts.current[item.kind]!
      if (!mesh || n >= CAP) return
      const held = game.current.held?.item === item
      const glow =
        item.id === lit.current ? 1.3 + Math.sin(t * 12) * 0.05 : held ? 1.2 : 1
      const gem = item.kind === 'diamond'
      const grow = (gem ? 0.7 + item.n * 0.12 : 1) * glow * itemScale(item.kind)
      dummy.position.set(x, y + (glow > 1 ? 0.08 : 0), z)
      dummy.rotation.set(0, gem ? t * 2 + item.id : yaw, 0)
      dummy.scale.setScalar(grow)
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
          args={[itemGeometry(kind), itemMaterial, CAP]}
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

export const turnOf = (dir: Dir) => -(dir - 3) * (Math.PI / 2)

export function BeltTile({
  material = beltMaterial(),
  lifted = false,
}: {
  material?: MeshStandardMaterial
  lifted?: boolean
}) {
  return (
    <mesh
      geometry={geo.slab}
      material={material}
      scale={[0.94, 0.1, 0.94]}
      castShadow={lifted}
      receiveShadow
    />
  )
}

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
            rotation={[0, turnOf(dir), 0]}
          >
            <BeltTile material={material} />
          </group>
        )
      })}
    </>
  )
}
