'use client'

import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type RefObject } from 'react'
import { CanvasTexture, RepeatWrapping, type Group } from 'three'
import { FACTORY, ROCKET, type Game } from './factory'
import { BORDER, H, W, sites, toWorld, type Site } from './map'
import { tints } from './items'
import { Bank } from './models/bank'
import { Border } from './models/border'
import { Business } from './models/business'
import { Customs } from './models/customs'
import { RocketSite } from './models/rocket'
import { Shop } from './models/shop'
import { TaxOffice } from './models/tax'

function grid(tint: string) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = tint
  ctx.fillRect(0, 0, 64, 64)
  ctx.strokeStyle = '#00000014'
  ctx.lineWidth = 2
  ctx.strokeRect(0, 0, 64, 64)
  const texture = new CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = RepeatWrapping
  return texture
}

export function Floor() {
  const home = useMemo(() => {
    const t = grid('#e9eff8')
    t.repeat.set(BORDER, H)
    return t
  }, [])
  const away = useMemo(() => {
    const t = grid('#f6ead6')
    t.repeat.set(W - BORDER - 1, H)
    return t
  }, [])
  const [left] = toWorld(0, 0)
  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[left - 0.5 + BORDER / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[BORDER, H]} />
        <meshStandardMaterial map={home} roughness={1} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[left - 0.5 + BORDER + 1 + (W - BORDER - 1) / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[W - BORDER - 1, H]} />
        <meshStandardMaterial map={away} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[80, 60]} />
        <meshStandardMaterial color="#dfe8f5" roughness={1} />
      </mesh>
    </>
  )
}

const back = (x: number) => 1 + 2.7 * (x - 1) ** 3 + 1.7 * (x - 1) ** 2

function Bounce({
  game,
  site,
  children,
}: {
  game: RefObject<Game>
  site: Site
  children: React.ReactNode
}) {
  const group = useRef<Group>(null)
  const born = useRef<number | null>(null)
  useFrame(({ clock }) => {
    const g = group.current
    if (!g) return
    born.current ??= clock.elapsedTime
    const grow = back(Math.min(1, (clock.elapsedTime - born.current) / 0.5))
    const since = game.current.time - (game.current.hit[site] ?? -9)
    const squash = since < 0.3 ? Math.sin((since / 0.3) * Math.PI) * 0.1 : 0
    g.scale.set(
      grow * (1 + squash * 0.6),
      grow * (1 - squash),
      grow * (1 + squash * 0.6),
    )
  })
  return <group ref={group}>{children}</group>
}

function Label({ children, y = 1 }: { children: React.ReactNode; y?: number }) {
  return (
    <Html
      position={[0, y, 0]}
      center
      zIndexRange={[1, 0]}
      pointerEvents="none"
      style={{ pointerEvents: 'none' }}
    >
      <span className="k-label">{children}</span>
    </Html>
  )
}

const heights: Record<Site, number> = {
  shop: 1.85,
  business: 1.7,
  tax: 2.05,
  bank: 2.05,
  booth: 1.65,
  rocket: 0.5,
}

export function Sites({
  game,
  state,
}: {
  game: RefObject<Game>
  state: {
    registered: boolean
    banks: boolean
    rocket: number
    launched: boolean
  }
}) {
  const stage = state.launched
    ? 'launched'
    : state.rocket >= FACTORY
      ? 'factory'
      : 'plot'
  return (
    <>
      <Border game={game} />
      {(Object.keys(sites) as Site[]).map((name) => {
        const s = sites[name]
        if (name === 'business' && !state.registered) return null
        const [x, z] = toWorld(s.x + (s.w - 1) / 2, s.y + (s.h - 1) / 2)
        return (
          <group key={name} position={[x, 0, z]}>
            <Bounce game={game} site={name}>
              {name === 'shop' ? (
                <Shop game={game} />
              ) : name === 'business' ? (
                <Business game={game} />
              ) : name === 'tax' ? (
                <TaxOffice game={game} banks={state.banks} />
              ) : name === 'bank' ? (
                <Bank game={game} connected={state.banks} />
              ) : name === 'booth' ? (
                <Customs game={game} />
              ) : (
                <RocketSite key={stage} game={game} stage={stage} />
              )}
            </Bounce>
            <Label
              y={heights[name] + (name === 'tax' && state.banks ? 0.3 : 0)}
            >
              {name === 'shop'
                ? 'Shop'
                : name === 'business'
                  ? 'Your business'
                  : name === 'tax'
                    ? `Tax office${state.banks ? ' + banks' : ''}`
                    : name === 'bank'
                      ? 'Bank'
                      : name === 'booth'
                        ? 'Customs'
                        : state.rocket < FACTORY
                          ? `Rocket site · ${state.rocket}/${FACTORY} 💎`
                          : `Rocket · ${state.rocket}/${ROCKET} 💎`}
            </Label>
          </group>
        )
      })}
      {Object.values(sites).flatMap((s) =>
        s.ports.map((port) => {
          const [x, z] = toWorld(port.x, port.y)
          return (
            <mesh
              key={`${port.x},${port.y}`}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[x, 0.012, z]}
            >
              <ringGeometry args={[0.3, 0.42, 24]} />
              <meshBasicMaterial color={tints[port.kind]} />
            </mesh>
          )
        }),
      )}
    </>
  )
}
