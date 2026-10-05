'use client'

import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type RefObject } from 'react'
import { CanvasTexture, RepeatWrapping, type Group } from 'three'
import { Clay } from '../marketdata/models/clay'
import { FACTORY, ROCKET, isOpen, type Game } from './factory'
import { BORDER, GATE, H, W, sites, toWorld, type Site } from './map'
import { looks } from './items'

const colors: Record<Site, string> = {
  shop: '#f28c6b',
  business: '#7fb0e8',
  tax: '#d8c17f',
  bank: '#9cc7a4',
  booth: '#5d6b84',
  rocket: '#c9d3e3',
}

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

export function Border({ game }: { game: RefObject<Game> }) {
  const arm = useRef<Group>(null)
  const [gx, gz] = toWorld(...GATE)
  useFrame((_, dt) => {
    if (!arm.current) return
    const goal = isOpen(game.current) ? -1.35 : 0
    arm.current.rotation.z +=
      (goal - arm.current.rotation.z) * (1 - Math.exp(-dt * 8))
  })
  return (
    <>
      {Array.from({ length: H }, (_, y) => {
        if (y === GATE[1]) return null
        const [x, z] = toWorld(BORDER, y)
        return (
          <Clay
            key={y}
            color="#8b93a6"
            size={[0.5, 0.7, 0.98]}
            position={[x, 0.35, z]}
          />
        )
      })}
      <group ref={arm} position={[gx, 0.55, gz + 0.46]}>
        <Clay
          color="#e8574a"
          size={[0.1, 0.1, 0.92]}
          position={[0, 0, -0.46]}
        />
      </group>
    </>
  )
}

function Label({ children, y = 1 }: { children: React.ReactNode; y?: number }) {
  return (
    <Html position={[0, y, 0]} center zIndexRange={[1, 0]}>
      <span className="k-label">{children}</span>
    </Html>
  )
}

export function Sites({
  state,
}: {
  state: { registered: boolean; banks: boolean; rocket: number }
}) {
  return (
    <>
      {(Object.keys(sites) as Site[]).map((name) => {
        const s = sites[name]
        if (name === 'business' && !state.registered) return null
        const [x, z] = toWorld(s.x + (s.w - 1) / 2, s.y + (s.h - 1) / 2)
        const tall = name === 'rocket' ? 0.08 : name === 'booth' ? 0.7 : 0.9
        return (
          <group key={name} position={[x, 0, z]}>
            <Clay
              color={colors[name]}
              size={[s.w - 0.2, tall, s.h - 0.2]}
              position={[0, tall / 2, 0]}
            />
            {name === 'rocket' && state.rocket >= FACTORY && (
              <Clay
                shape="cylinder"
                color="#f3f5fa"
                size={[0.7, 0.4 + (state.rocket / ROCKET) * 2.4, 0.7]}
                position={[0, 0.2 + (state.rocket / ROCKET) * 1.2, 0]}
              />
            )}
            <Label y={name === 'rocket' ? 0.6 : tall + 0.35}>
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
              <meshBasicMaterial color={looks[port.kind].color} />
            </mesh>
          )
        }),
      )}
    </>
  )
}
