'use client'

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

export type Vec3 = [number, number, number]
export type GroupProps = ThreeElements['group']

export const palette = {
  cream: '#f3e6cf',
  sand: '#e8d5b0',
  terracotta: '#c8553d',
  red: '#d14b3c',
  teal: '#2e8b88',
  forest: '#2f6b47',
  mustard: '#d9a527',
  wood: '#a5764f',
  darkWood: '#6e4a30',
  ink: '#2b2622',
  glass: '#bfe3ec',
  rubber: '#3a3532',
  steel: '#9aa3a8',
}

export const rugColors = [
  '#c8553d',
  '#2e8b88',
  '#d9a527',
  '#7a4c8f',
  '#e07a5f',
  '#3d405b',
  '#81b29a',
  '#f2cc8f',
]

const materials = new Map<string, THREE.MeshStandardMaterial>()

export function clay(color: string, key = ''): THREE.MeshStandardMaterial {
  const id = color + key
  let material = materials.get(id)
  if (!material) {
    material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.92,
      metalness: 0,
    })
    materials.set(id, material)
  }
  return material
}

export const geo = {
  box: new RoundedBoxGeometry(1, 1, 1, 3, 0.06),
  slab: new THREE.BoxGeometry(1, 1, 1),
  sphere: new THREE.SphereGeometry(0.5, 20, 14),
  cylinder: new THREE.CylinderGeometry(0.5, 0.5, 1, 20),
  cone: new THREE.ConeGeometry(0.5, 1, 20),
  torus: new THREE.TorusGeometry(0.5, 0.08, 10, 28),
  smile: new THREE.TorusGeometry(0.5, 0.09, 8, 16, Math.PI),
  wedge: wedgeGeometry(),
}

function wedgeGeometry() {
  const shape = new THREE.Shape()
  shape.moveTo(0, 0)
  shape.lineTo(1, 0)
  shape.lineTo(1, 1)
  shape.closePath()
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 1,
    bevelEnabled: false,
  })
  geometry.translate(0, 0, -0.5)
  return geometry
}

export type Shape = keyof typeof geo

type MeshProps = Omit<ThreeElements['mesh'], 'scale' | 'geometry' | 'material'>

export type ClayProps = MeshProps & {
  shape?: Shape
  color: string
  size?: number | Vec3
}

export function Clay({ shape = 'box', color, size = 1, ...rest }: ClayProps) {
  const scale: Vec3 = typeof size === 'number' ? [size, size, size] : size
  return (
    <mesh
      geometry={geo[shape]}
      material={clay(color)}
      scale={scale}
      castShadow
      receiveShadow
      dispose={null}
      {...rest}
    />
  )
}

export type Item = {
  position: Vec3
  rotation?: Vec3
  scale?: number | Vec3
  color?: string
}

export type InstancedProps = {
  shape?: Shape
  color?: string
  items: Item[]
}

const dummy = new THREE.Object3D()
const tint = new THREE.Color()

export function Instanced({
  shape = 'box',
  color = '#ffffff',
  items,
}: InstancedProps) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const material = useMemo(() => clay(color, 'instanced'), [color])
  useEffect(() => {
    const instance = ref.current
    return () => instance?.dispose()
  }, [])
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    items.forEach((item, i) => {
      const s = item.scale ?? 1
      dummy.position.set(...item.position)
      dummy.rotation.set(...(item.rotation ?? [0, 0, 0]))
      if (typeof s === 'number') dummy.scale.setScalar(s)
      else dummy.scale.set(...s)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      mesh.setColorAt(i, tint.set(item.color ?? '#ffffff'))
    })
    mesh.count = items.length
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [items])
  return (
    <instancedMesh
      ref={ref}
      args={[geo[shape], material, Math.max(1, items.length)]}
      castShadow
      receiveShadow
      dispose={null}
    />
  )
}

export function pick<T>(list: T[], index: number): T {
  return list[((index % list.length) + list.length) % list.length]
}
