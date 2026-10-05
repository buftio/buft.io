'use client'

import { useEffect, useRef, type RefObject, type ReactNode } from 'react'
import type { InstancedMesh } from 'three'
import {
  Clay,
  clay,
  palette,
  type GroupProps,
} from '../../marketdata/models/clay'
import { Bake as Merge, Slim } from '../../quantori/bake'
import type { Game } from '../factory'
import type { Kind } from '../map'
import { itemGeometry } from './items'

export { Clay, palette, Slim }
export type ModelProps = { game: RefObject<Game> }
export const itemMaterial = clay('#ffffff', 'kontur-vertex')
itemMaterial.vertexColors = true

export const Bake = ({ children }: { children: ReactNode }) => (
  <Merge tint={itemMaterial}>{children}</Merge>
)
export function Goods({ kind, ...props }: GroupProps & { kind: Kind }) {
  const mesh = useRef<InstancedMesh>(null)
  useEffect(() => {
    const instance = mesh.current
    return () => instance?.dispose()
  }, [])
  return (
    <group {...props}>
      <instancedMesh
        ref={mesh}
        args={[itemGeometry(kind), itemMaterial, 1]}
        castShadow
        receiveShadow
        dispose={null}
      />
    </group>
  )
}
export function Coin({
  gold = true,
  ...props
}: GroupProps & { gold?: boolean }) {
  return (
    <group {...props}>
      <Clay
        shape="cylinder"
        color={gold ? '#e9b735' : palette.steel}
        size={[0.32, 0.065, 0.32]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <Clay
        shape="torus"
        color={gold ? '#ffe29a' : '#c3c7cb'}
        size={0.26}
        position={[0, 0, 0.038]}
      />
      <Clay
        color={gold ? '#ffe29a' : '#c3c7cb'}
        size={[0.045, 0.12, 0.025]}
        position={[0, 0, 0.045]}
        rotation={[0, 0, -0.25]}
      />
    </group>
  )
}
export function Plinth({
  size = 1.8,
  color = '#e8d5b0',
}: {
  size?: number
  color?: string
}) {
  return (
    <Clay color={color} size={[size, 0.12, size]} position={[0, 0.06, 0]} />
  )
}
export function Columns({
  color = '#fff9ef',
  y = 0.78,
  z = 0.42,
}: {
  color?: string
  y?: number
  z?: number
}) {
  return (
    <>
      {[-0.64, 0.64].map((x) => (
        <group key={x} position={[x, y, z]}>
          <Clay shape="cylinder" color={color} size={[0.19, 1.05, 0.19]} />
          <Clay
            color={color}
            size={[0.28, 0.12, 0.28]}
            position={[0, -0.53, 0]}
          />
          <Clay
            color={color}
            size={[0.27, 0.13, 0.27]}
            position={[0, 0.52, 0]}
          />
        </group>
      ))}
    </>
  )
}
export function Pediment({ color = '#c9d6e6' }: { color?: string }) {
  return (
    <>
      <Clay
        color={color}
        size={[1.68, 0.16, 1.05]}
        position={[0, 1.4, -0.03]}
      />
      <Clay
        shape="wedge"
        color={color}
        size={[0.84, 0.34, 1.02]}
        position={[-0.84, 1.47, -0.03]}
      />
      <Clay
        shape="wedge"
        color={color}
        size={[0.84, 0.34, 1.02]}
        position={[0.84, 1.47, -0.03]}
        rotation={[0, Math.PI, 0]}
      />
    </>
  )
}
export function BankLink({ children }: { children?: ReactNode }) {
  return (
    <group>
      {[-0.5, 0, 0.5].map((x, i) => (
        <group key={x} position={[x, 1.85, -0.32]}>
          <Clay
            shape="cylinder"
            color={palette.steel}
            size={[0.035, 0.32, 0.035]}
          />
          <Clay
            color={['#86d2bb', '#9ebce8', '#e8bf80'][i]}
            size={[0.27, 0.19, 0.08]}
            position={[0.055, 0.12, 0]}
          />
          <Clay
            color="#ecfff2"
            size={[0.028, 0.09, 0.012]}
            position={[0.01, 0.12, 0.049]}
          />
          <Clay
            color="#ecfff2"
            size={[0.028, 0.09, 0.012]}
            position={[0.09, 0.12, 0.049]}
          />
        </group>
      ))}
      <Clay
        color="#72cbbb"
        size={[1.05, 0.035, 0.035]}
        position={[0, 1.73, -0.32]}
      />
      {children}
    </group>
  )
}
export const pulse = (age: number, duration = 0.7) =>
  age >= 0 && age < duration ? Math.sin((age / duration) * Math.PI) : 0
