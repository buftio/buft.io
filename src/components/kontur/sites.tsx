'use client'

import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type RefObject } from 'react'
import { CanvasTexture, RepeatWrapping, type Group } from 'three'
import { FACTORY, type Game } from './factory'
import { BORDER, H, W, sites, toWorld, type Site } from './map'
import { tints } from './items'
import { Bank } from './models/bank'
import { Border } from './models/border'
import { Business } from './models/business'
import { Customs } from './models/customs'
import { Lot } from './models/lot'
import { RocketSite } from './models/rocket'
import { Shop } from './models/shop'
import { TaxOffice } from './models/tax'
import { Workshop } from './models/workshop'

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
        <meshStandardMaterial color="#e8e5d8" roughness={1} />
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

export function Sites({
  game,
  state,
}: {
  game: RefObject<Game>
  state: {
    registered: boolean
    minted: boolean
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
        const [x, z] = toWorld(s.x + (s.w - 1) / 2, s.y + (s.h - 1) / 2)
        if (name === 'business' && !state.registered)
          return (
            <group key="lot" position={[x, 0, z]}>
              <Lot game={game} />
            </group>
          )
        if (name === 'workshop' && !state.minted) return null
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
              ) : name === 'workshop' ? (
                <Workshop game={game} />
              ) : (
                <RocketSite key={stage} game={game} stage={stage} />
              )}
            </Bounce>
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
