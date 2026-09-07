'use client'

import { useFrame } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import { useRef, useState, type ReactNode } from 'react'
import { Group, MathUtils } from 'three'

type Position = [number, number, number]

export function Clay({
  position = [0, 0, 0],
  scale = [1, 1, 1],
  color,
}: {
  position?: Position
  scale?: Position
  color: string
}) {
  return (
    <mesh position={position} scale={scale}>
      <sphereGeometry args={[1, 24, 16]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  )
}

export function Reveal({
  show,
  paused,
  children,
}: {
  show: boolean
  paused: boolean
  children: ReactNode
}) {
  const group = useRef<Group>(null)
  const [initialScale] = useState(() => (show ? 1 : 0.001))
  useFrame((_, delta) => {
    if (!group.current) return
    const next = paused
      ? show
        ? 1
        : 0.001
      : MathUtils.damp(
          group.current.scale.x,
          show ? 1 : 0.001,
          7,
          Math.min(delta, 0.05),
        )
    group.current.scale.setScalar(next)
    group.current.visible = next > 0.005
  })
  return (
    <group ref={group} scale={initialScale}>
      {children}
    </group>
  )
}

function Sunglasses({ y = 0, size = 1 }: { y?: number; size?: number }) {
  return (
    <group position={[0, y, 0]} scale={size}>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.13, 0, 0]}>
          <Clay scale={[0.13, 0.09, 0.035]} color="#463a31" />
          <Clay
            position={[0, 0, 0.024]}
            scale={[0.105, 0.065, 0.018]}
            color="#192e35"
          />
          <Clay
            position={[-0.032, 0.023, 0.04]}
            scale={[0.025, 0.01, 0.005]}
            color="#d2ecdf"
          />
        </group>
      ))}
      <Clay scale={[0.06, 0.018, 0.027]} color="#463a31" />
    </group>
  )
}

export function DesertHat({
  show,
  paused,
}: {
  show: boolean
  paused: boolean
}) {
  return (
    <Reveal show={show} paused={paused}>
      <group position={[0, 0.5, 0]} rotation={[0, 0, -0.12]}>
        <Clay scale={[0.55, 0.055, 0.44]} color="#ce9556" />
        <Clay
          position={[0, 0.075, -0.035]}
          scale={[0.31, 0.18, 0.28]}
          color="#edc885"
        />
        <mesh position={[0, 0.048, -0.035]}>
          <cylinderGeometry args={[0.288, 0.3, 0.065, 24]} />
          <meshStandardMaterial color="#865734" roughness={0.95} />
        </mesh>
      </group>
      <group position={[0, 0.29, 0.32]}>
        <Sunglasses />
      </group>
    </Reveal>
  )
}

function Cactus({
  position,
  scale = 1,
  rotation = 0,
}: {
  position: Position
  scale?: number
  rotation?: number
}) {
  return (
    <group position={position} scale={scale} rotation={[0, rotation, 0]}>
      <Clay
        position={[0, 0.63, 0]}
        scale={[0.16, 0.72, 0.15]}
        color="#6f9566"
      />
      <Clay
        position={[-0.23, 0.53, 0]}
        scale={[0.29, 0.1, 0.105]}
        color="#6f9566"
      />
      <Clay
        position={[-0.43, 0.71, 0]}
        scale={[0.1, 0.29, 0.105]}
        color="#7ba072"
      />
      <Clay
        position={[0.2, 0.82, 0]}
        scale={[0.26, 0.1, 0.105]}
        color="#6f9566"
      />
      <Clay
        position={[0.39, 1, 0]}
        scale={[0.1, 0.29, 0.105]}
        color="#7ba072"
      />
      {[-0.08, 0, 0.08].map((x) => (
        <Clay
          key={x}
          position={[x, 0.64, 0.135]}
          scale={[0.012, 0.52, 0.014]}
          color="#a3ba7d"
        />
      ))}
      <Clay
        position={[0.01, 1.36, 0]}
        scale={[0.09, 0.055, 0.08]}
        color="#d67d67"
      />
    </group>
  )
}

function Sun() {
  return (
    <Billboard position={[-0.7, 2.02, -1.25]}>
      <Clay scale={[0.4, 0.4, 0.15]} color="#f3a02b" />
      {Array.from({ length: 10 }, (_, i) => {
        const angle = (i / 10) * Math.PI * 2
        return (
          <group key={i} rotation={[0, 0, -angle]}>
            <Clay
              position={[0, 0.55, 0]}
              scale={[0.035, 0.09, 0.035]}
              color="#eca14a"
            />
          </group>
        )
      })}
      <group position={[0, 0.07, 0.15]}>
        <Sunglasses size={1.15} />
      </group>
      <Clay
        position={[0.04, -0.15, 0.147]}
        scale={[0.065, 0.025, 0.015]}
        color="#a06030"
      />
    </Billboard>
  )
}

function Tumbleweed({ paused }: { paused: boolean }) {
  const root = useRef<Group>(null)
  const ball = useRef<Group>(null)
  const time = useRef(0)
  useFrame((_, delta) => {
    if (paused || !root.current || !ball.current) return
    time.current += Math.min(delta, 0.05)
    root.current.position.x = Math.sin(time.current * 0.45) * 1.65
    root.current.position.y =
      0.24 + Math.abs(Math.sin(time.current * 2.7)) * 0.035
    ball.current.rotation.z = -root.current.position.x * 4
  })
  return (
    <group ref={root} position={[0, 0.24, 1.5]}>
      <group ref={ball}>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh
            key={i}
            rotation={[i * 0.8, i * 1.3, i * 0.6]}
            scale={[1, 0.9, 1.1]}
          >
            <torusGeometry args={[0.19, 0.012, 5, 16]} />
            <meshStandardMaterial
              color={i % 2 ? '#b37e43' : '#d0a169'}
              roughness={1}
            />
          </mesh>
        ))}
      </group>
    </group>
  )
}

export function DesertEnvironment({
  show,
  paused,
}: {
  show: boolean
  paused: boolean
}) {
  return (
    <Reveal show={show} paused={paused}>
      <Clay position={[0, -0.05, 0]} scale={[2.6, 0.15, 2.1]} color="#c28c4c" />
      <Clay
        position={[-1.05, 0.02, -0.6]}
        scale={[1.5, 0.36, 1.28]}
        color="#d79d54"
      />
      <Clay
        position={[1.45, 0, -0.55]}
        scale={[1.25, 0.46, 1.3]}
        color="#e2aa62"
      />
      <Clay
        position={[0, 0.015, 1.05]}
        scale={[2.15, 0.23, 0.94]}
        color="#e6b575"
      />
      <Clay
        position={[-0.5, 0, -1.45]}
        scale={[1.75, 0.52, 0.9]}
        color="#ca8b46"
      />
      <Cactus position={[-1.65, 0.22, -0.75]} rotation={0.5} />
      <Cactus position={[1.8, 0.25, -0.4]} scale={0.8} rotation={0.3} />
      <Cactus position={[-1.25, 0.12, 1.15]} scale={0.35} rotation={0.3} />
      <Sun />
      <Tumbleweed paused={paused || !show} />
    </Reveal>
  )
}
