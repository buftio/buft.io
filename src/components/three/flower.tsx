'use client'

import { Billboard, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import Image from 'next/image'
import { projectPosition, type Project } from '@/lib/projects'
import { Flames, Glow } from './fire'

function petalGeometry() {
  const geometry = new THREE.BufferGeometry()
  const positions: number[] = [],
    colors: number[] = [],
    indices: number[] = []
  const copper = new THREE.Color('#4b160a'),
    gold = new THREE.Color('#ffad48')
  for (let y = 0; y <= 18; y++) {
    const t = y / 18
    for (let x = 0; x <= 8; x++) {
      const s = (x / 8) * 2 - 1
      const width = Math.sin(Math.PI * t) * 0.49
      positions.push(
        s * width,
        t * 1.55,
        Math.sin(t * Math.PI) * 0.26 + s * s * 0.15,
      )
      const color = copper
        .clone()
        .lerp(gold, Math.pow(Math.abs(s), 4) * 0.78 + t * t * 0.22)
      colors.push(color.r, color.g, color.b)
      if (y < 18 && x < 8) {
        const a = y * 9 + x
        indices.push(a, a + 1, a + 9, a + 1, a + 10, a + 9)
      }
    }
  }
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  )
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

export function Flower({
  project,
  index,
  active,
  near,
  open,
  reduced,
  onOpen,
}: {
  project: Project
  index: number
  active: boolean
  near: boolean
  open: boolean
  reduced: boolean
  onOpen: () => void
}) {
  const petals = useRef<THREE.Group>(null)
  const flames = useRef<THREE.Group>(null)
  const bloom = useRef(0)
  const [hovered, setHovered] = useState(false)
  const geometry = useMemo(() => petalGeometry(), [])
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        metalness: 0.48,
        roughness: 0.4,
        side: THREE.DoubleSide,
        emissive: new THREE.Color('#fd5a10'),
        emissiveIntensity: 0.16,
      }),
    [],
  )
  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )
  useFrame((_, delta) => {
    const target = open ? 1 : active || hovered ? 0.6 : near ? 0.1 : 0
    bloom.current = reduced
      ? target
      : THREE.MathUtils.damp(bloom.current, target, 4, Math.min(delta, 0.05))
    petals.current?.children.forEach((pivot, i) => {
      const petal = pivot.children[0]
      petal.rotation.x = 0.18 + bloom.current * (i < 9 ? 1.24 : 0.88)
    })
    flames.current?.scale.setScalar(0.22 + bloom.current * 0.32)
  })
  return (
    <group position={projectPosition(index)} scale={0.65}>
      <group
        ref={petals}
        onClick={(event) => {
          event.stopPropagation()
          onOpen()
        }}
        onPointerOver={(event) => {
          event.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
      >
        {Array.from({ length: 16 }, (_, i) => (
          <group
            key={i}
            rotation={[
              0,
              i < 9 ? (i / 9) * Math.PI * 2 : ((i - 9) / 7) * Math.PI * 2 + 0.3,
              0,
            ]}
          >
            <mesh
              geometry={geometry}
              material={material}
              scale={i < 9 ? 1 : 0.76}
            />
          </group>
        ))}
      </group>
      <mesh position={[0, -0.27, 0]} scale={[0.55, 0.17, 0.55]}>
        <sphereGeometry args={[1, 24, 12]} />
        <meshStandardMaterial
          color="#2a160f"
          roughness={0.35}
          metalness={0.7}
        />
      </mesh>
      <group ref={flames} position={[0, -0.08, 0]}>
        <Flames reduced={reduced} />
      </group>
      <Glow
        position={[0, 0.6, 0]}
        scale={2.6}
        opacity={0.4}
        reduced={reduced}
      />
      <Billboard position={[0, active ? 0.88 : 1.2, 0]}>
        <Html center distanceFactor={9} zIndexRange={[5, 0]}>
          <button
            className={`flower-label ${active ? 'is-active' : ''} ${near ? '' : 'is-far'}`}
            onClick={onOpen}
            aria-label={`Open ${project.name}`}
            style={{ '--project-color': project.color } as React.CSSProperties}
          >
            {project.logo ? (
              <Image
                src={project.logo}
                alt=""
                width={32}
                height={32}
                loading={near ? 'eager' : 'lazy'}
                unoptimized
              />
            ) : (
              <span className={`wordmark wordmark-${project.id}`}>
                {project.id === 'yandex'
                  ? 'Я'
                  : project.id === 'epam'
                    ? '<e>'
                    : project.name.slice(0, 1)}
              </span>
            )}
            <span className="flower-name">{project.name}</span>
          </button>
        </Html>
      </Billboard>
    </group>
  )
}
