'use client'

import { Line, RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { Project } from '@/lib/projects'

type Point = [number, number, number]
const cream = '#f3ebdb'

function Clay({
  position = [0, 0, 0],
  scale = [1, 1, 1],
  color = cream,
}: {
  position?: Point
  scale?: Point
  color?: string
}) {
  return (
    <mesh position={position} scale={scale} castShadow receiveShadow>
      <sphereGeometry args={[1, 28, 18]} />
      <meshStandardMaterial color={color} roughness={0.86} />
    </mesh>
  )
}
function Block({
  position = [0, 0, 0],
  size = [1, 1, 1],
  color = cream,
  rotation = [0, 0, 0],
}: {
  position?: Point
  size?: Point
  color?: string
  rotation?: Point
}) {
  return (
    <RoundedBox
      position={position}
      args={size}
      radius={0.07}
      smoothness={3}
      rotation={rotation}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color={color} roughness={0.78} />
    </RoundedBox>
  )
}

function Molecule({ color }: { color: string }) {
  const points: Point[] = Array.from({ length: 6 }, (_, i) => [
    Math.cos((i * Math.PI) / 3) * 1.25,
    0.5 + Math.sin((i * Math.PI) / 3) * 0.75,
    Math.sin((i * Math.PI) / 3) * 0.55,
  ])
  return (
    <group>
      {points.map((p, i) => (
        <group key={i}>
          <Clay
            position={p}
            scale={[0.26, 0.26, 0.26]}
            color={i % 3 === 0 ? '#d7796d' : color}
          />
          <Line
            points={[p, points[(i + 1) % 6]]}
            color="#d4ceb8"
            lineWidth={8}
          />
          <Line
            points={[p, [p[0] * 1.55, p[1] * 1.25, p[2] * 1.5]]}
            color="#d4ceb8"
            lineWidth={6}
          />
          <Clay
            position={[p[0] * 1.55, p[1] * 1.25, p[2] * 1.5]}
            scale={[0.13, 0.13, 0.13]}
          />
        </group>
      ))}
    </group>
  )
}
function Research({ color }: { color: string }) {
  const points: Point[] = [
    [-1.6, 1.0, -0.3],
    [1.3, 0.8, -0.7],
    [0, 1.6, 0.4],
    [-0.4, 0.2, 1.3],
    [1.7, 1.8, 0.5],
  ]
  return (
    <group>
      {points.map((p, i) => (
        <group key={i} position={p} rotation={[0, i * 0.4 - 0.5, 0]}>
          <Block size={[0.9, 0.12, 0.65]} color={i % 2 ? '#e6b384' : color} />
          <Block position={[0, 0.085, 0]} size={[0.8, 0.05, 0.55]} />
          <Block
            position={[-0.2, 0.13, 0]}
            size={[0.25, 0.06, 0.5]}
            color="#a6bfb5"
          />
        </group>
      ))}
      {points.slice(1).map((p, i) => (
        <Line
          key={i}
          points={[points[0], p]}
          color="#8daba6"
          lineWidth={2}
          dashed
          dashSize={0.1}
          gapSize={0.07}
        />
      ))}
      <Clay
        position={[-1.6, 1.24, -0.3]}
        scale={[0.16, 0.16, 0.16]}
        color="#e5bc75"
      />
    </group>
  )
}
function Microscope({ color }: { color: string }) {
  const cells = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => {
        const a = i * 2.39996,
          r = Math.sqrt(i / 22) * 2
        return {
          position: [
            Math.cos(a) * r,
            0.1 + Math.sin(i * 8) * 0.08,
            Math.sin(a) * r,
          ] as Point,
          radius: 0.19 + (i % 3) * 0.045,
        }
      }),
    [],
  )
  return (
    <group>
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[2.5, 2.5, 0.08, 64]} />
        <meshPhysicalMaterial
          color="#d2e2d9"
          transparent
          opacity={0.55}
          roughness={0.3}
        />
      </mesh>
      {cells.map((cell, i) => (
        <group key={i} position={cell.position}>
          <Clay
            scale={[cell.radius, cell.radius * 0.6, cell.radius * 1.2]}
            color={i % 3 ? color : '#d5a1a6'}
          />
          <Clay
            position={[0.04, cell.radius * 0.45, 0]}
            scale={[cell.radius * 0.4, cell.radius * 0.3, cell.radius * 0.4]}
            color={i % 3 ? '#5f8b92' : '#956f82'}
          />
        </group>
      ))}
      <mesh position={[0.6, 1.4, 0.2]} rotation={[-1.1, 0, 0.2]}>
        <torusGeometry args={[0.85, 0.09, 16, 60]} />
        <meshStandardMaterial color="#ecbb84" roughness={0.5} />
      </mesh>
      <Block
        position={[1.35, 1, 0.7]}
        size={[0.16, 0.16, 1.1]}
        rotation={[0.4, -0.9, 0]}
        color="#ecbb84"
      />
    </group>
  )
}
function Search({ color }: { color: string }) {
  return (
    <group rotation={[0, -0.1, 0]}>
      {[-1.3, 0, 1.3].map((x, i) => (
        <group
          key={x}
          position={[x, i === 1 ? 0.35 : 0, i === 1 ? 0.5 : 0]}
          rotation={[0, (1 - i) * 0.2, 0]}
        >
          <Block
            position={[0, 0.8, 0]}
            size={[1.0, 1.5, 0.15]}
            color={i === 1 ? color : cream}
          />
          <Clay
            position={[0, 1.12, 0.15]}
            scale={[0.18, 0.18, 0.08]}
            color={i === 1 ? '#b77851' : '#b7bbb4'}
          />
          <Clay
            position={[0, 0.77, 0.15]}
            scale={[0.29, 0.19, 0.05]}
            color={i === 1 ? '#bc895d' : '#c1c2b9'}
          />
          {[0.4, 0.26].map((y) => (
            <Block
              key={y}
              position={[0, y, 0.12]}
              size={[0.6, 0.04, 0.03]}
              color="#aaa98f"
            />
          ))}
        </group>
      ))}
      <Line
        points={[
          [-2, -0.15, 1],
          [-0.6, -0.15, 1.2],
          [0, -0.15, 1.3],
          [2, -0.15, 1],
        ]}
        color="#d29c65"
        lineWidth={3}
      />
    </group>
  )
}
function Textile({ color }: { color: string }) {
  return (
    <group>
      {[-1.25, 0, 1.25].map((x, i) => (
        <group key={i} position={[x, 0, -0.3]}>
          <mesh position={[0, 0.75, 0]} castShadow>
            <cylinderGeometry args={[0.37, 0.37, 1.3, 48]} />
            <meshStandardMaterial
              color={[color, '#ddad82', '#99bfb4'][i]}
              roughness={1}
            />
          </mesh>
          {[0.07, 1.43].map((y) => (
            <mesh key={y} position={[0, y, 0]} castShadow>
              <cylinderGeometry args={[0.46, 0.46, 0.1, 48]} />
              <meshStandardMaterial color="#cbaa80" roughness={0.7} />
            </mesh>
          ))}
          {Array.from({ length: 19 }, (_, n) => (
            <mesh
              key={n}
              position={[0, 0.18 + n * 0.062, 0]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <torusGeometry args={[0.373, 0.012, 5, 40]} />
              <meshStandardMaterial
                color={['#c28caa', '#bb8e6a', '#78a697'][i]}
              />
            </mesh>
          ))}
        </group>
      ))}
      <Line
        points={[
          [-1.2, 0.15, 0],
          [-0.7, -0.1, 1.2],
          [0.4, -0.1, 1.6],
          [1.5, -0.1, 1.1],
          [1.9, -0.1, 1.7],
        ]}
        color={color}
        lineWidth={7}
      />
    </group>
  )
}
function Game({ color }: { color: string }) {
  return (
    <group>
      <Block position={[0, -0.05, 0]} size={[4.3, 0.18, 2.7]} color="#8aaa89" />
      <Line
        points={[
          [-1.9, 0.06, -1.1],
          [1.9, 0.06, -1.1],
          [1.9, 0.06, 1.1],
          [-1.9, 0.06, 1.1],
          [-1.9, 0.06, -1.1],
        ]}
        color="#e5e6bf"
        lineWidth={2}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <ringGeometry args={[0.55, 0.57, 64]} />
        <meshBasicMaterial color="#e5e6bf" />
      </mesh>
      <group position={[0, 1.1, 0]} rotation={[-0.2, 0, 0.05]}>
        <Block size={[2.2, 0.55, 0.85]} color={color} />
        <Clay
          position={[-0.8, -0.2, 0.2]}
          scale={[0.48, 0.48, 0.4]}
          color={color}
        />
        <Clay
          position={[0.8, -0.2, 0.2]}
          scale={[0.48, 0.48, 0.4]}
          color={color}
        />
        <Block
          position={[-0.65, 0.32, 0.05]}
          size={[0.5, 0.06, 0.16]}
          color="#625b58"
        />
        <Block
          position={[-0.65, 0.32, 0.05]}
          size={[0.16, 0.06, 0.5]}
          color="#625b58"
        />
        {[
          [0.6, -0.15],
          [0.85, 0.06],
          [0.6, 0.27],
          [0.35, 0.06],
        ].map(([x, z], i) => (
          <Clay
            key={i}
            position={[x, 0.3, z]}
            scale={[0.085, 0.06, 0.085]}
            color={['#95bfa6', '#d58176', '#e9ca84', '#a3becb'][i]}
          />
        ))}
      </group>
    </group>
  )
}
function Bank({ color }: { color: string }) {
  return (
    <group>
      <Block position={[0, 0, -0.3]} size={[2.5, 0.25, 1.2]} color="#dfd9ca" />
      {[-0.85, 0, 0.85].map((x) => (
        <mesh key={x} position={[x, 0.8, -0.3]} castShadow>
          <cylinderGeometry args={[0.16, 0.2, 1.4, 16]} />
          <meshStandardMaterial color={cream} roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 1.7, -0.3]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.8, 0.6, 4]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh
          key={i}
          position={[-1.7 + i * 0.65, 0.13, 1.1 + Math.sin(i) * 0.18]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        >
          <cylinderGeometry args={[0.23, 0.23, 0.07, 32]} />
          <meshStandardMaterial
            color="#e3b565"
            metalness={0.3}
            roughness={0.6}
          />
        </mesh>
      ))}
    </group>
  )
}
function Metrics({ color }: { color: string }) {
  return (
    <group>
      <Block position={[0, -0.15, 0]} size={[4, 0.18, 2.5]} color="#e2d8c6" />
      {[0.6, 1.1, 0.85, 1.6, 2].map((height, i) => (
        <Block
          key={i}
          position={[-1.5 + i * 0.73, height / 2, 0]}
          size={[0.46, height, 0.5]}
          color={i % 2 ? '#dfa77b' : color}
        />
      ))}
      <Line
        points={[
          [-1.5, 0.9, 0.35],
          [-0.8, 1.4, 0.35],
          [0, 1.15, 0.35],
          [0.7, 1.9, 0.35],
          [1.5, 2.3, 0.35],
        ]}
        color="#aa7159"
        lineWidth={3}
      />
    </group>
  )
}

export function ProjectWorld({
  project,
  paused,
}: {
  project: Project
  paused: boolean
}) {
  const group = useRef<THREE.Group>(null)
  const time = useRef(0)
  useFrame((_, delta) => {
    if (paused || !group.current) return
    time.current += Math.min(delta, 0.05)
    group.current.rotation.y = Math.sin(time.current * 0.25) * 0.16
    group.current.position.y = Math.sin(time.current * 0.6) * 0.035
  })
  return (
    <group ref={group}>
      {project.scene === 'research' && <Research color={project.color} />}
      {project.scene === 'molecule' && <Molecule color={project.color} />}
      {project.scene === 'microscope' && <Microscope color={project.color} />}
      {project.scene === 'search' && <Search color={project.color} />}
      {project.scene === 'textile' && <Textile color={project.color} />}
      {project.scene === 'game' && <Game color={project.color} />}
      {project.scene === 'bank' && <Bank color={project.color} />}
      {project.scene === 'metrics' && <Metrics color={project.color} />}
    </group>
  )
}
