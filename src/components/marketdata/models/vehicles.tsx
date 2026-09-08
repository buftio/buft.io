'use client'

import { useMemo } from 'react'
import {
  Clay,
  Instanced,
  palette,
  type GroupProps,
  type Item,
  type Vec3,
} from './clay'

function Wheel({
  name,
  position,
  radius = 0.2,
}: {
  name: string
  position: Vec3
  radius?: number
}) {
  return (
    <group name={name} position={position}>
      <Clay
        shape="cylinder"
        color={palette.rubber}
        size={[radius * 2, 0.14, radius * 2]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <Clay
        shape="cylinder"
        color={palette.steel}
        size={[radius, 0.16, radius]}
        rotation={[Math.PI / 2, 0, 0]}
      />
    </group>
  )
}

export function DeliveryTruck(props: GroupProps) {
  const bed = useMemo<Item[]>(
    () => [
      { position: [-0.425, 0.44, 0], scale: [1.15, 0.08, 0.9] },
      { position: [-0.425, 0.62, 0.43], scale: [1.15, 0.3, 0.05] },
      { position: [-0.425, 0.62, -0.43], scale: [1.15, 0.3, 0.05] },
      { position: [-0.975, 0.62, 0], scale: [0.05, 0.3, 0.9] },
    ],
    [],
  )
  const lights = useMemo<Item[]>(
    () => [
      { position: [1.0, 0.6, 0.3], scale: 0.12, color: palette.cream },
      { position: [1.0, 0.6, -0.3], scale: 0.12, color: palette.cream },
      { position: [-1.0, 0.5, 0.36], scale: 0.09, color: palette.red },
      { position: [-1.0, 0.5, -0.36], scale: 0.09, color: palette.red },
    ],
    [],
  )
  return (
    <group {...props} name="delivery-truck">
      <Clay
        shape="slab"
        color={palette.ink}
        size={[1.9, 0.1, 0.8]}
        position={[0, 0.34, 0]}
      />
      <Clay
        color={palette.forest}
        size={[0.6, 0.8, 0.9]}
        position={[0.42, 0.8, 0]}
      />
      <Clay
        color={palette.forest}
        size={[0.42, 0.42, 0.9]}
        position={[0.8, 0.6, 0]}
      />
      <Clay
        shape="slab"
        color={palette.glass}
        size={[0.04, 0.4, 0.72]}
        position={[0.7, 0.98, 0]}
        rotation={[0, 0, -0.35]}
      />
      <Clay
        shape="slab"
        color={palette.glass}
        size={[0.3, 0.32, 0.04]}
        position={[0.42, 0.92, 0.46]}
      />
      <Clay
        shape="slab"
        color={palette.glass}
        size={[0.3, 0.32, 0.04]}
        position={[0.42, 0.92, -0.46]}
      />
      <Clay
        color={palette.steel}
        size={[0.08, 0.1, 0.96]}
        position={[1.02, 0.42, 0]}
      />
      <Clay
        color={palette.mustard}
        size={[0.16, 0.08, 0.3]}
        position={[0.42, 1.24, 0]}
      />
      <Instanced shape="sphere" items={lights} />
      <Instanced shape="slab" color={palette.mustard} items={bed} />
      <group name="truck-bed-anchor" position={[-0.425, 0.48, 0]} />
      <Wheel name="wheel-fl" position={[0.62, 0.2, -0.45]} />
      <Wheel name="wheel-fr" position={[0.62, 0.2, 0.45]} />
      <Wheel name="wheel-bl" position={[-0.62, 0.2, -0.45]} />
      <Wheel name="wheel-br" position={[-0.62, 0.2, 0.45]} />
    </group>
  )
}

export function Cart(props: GroupProps) {
  const bars = useMemo<Item[]>(() => {
    const items: Item[] = []
    for (let i = 0; i < 6; i++) {
      const x = -0.25 + i * 0.1
      items.push({ position: [x, 0.42, 0.2], scale: [0.02, 0.22, 0.02] })
      items.push({ position: [x, 0.42, -0.2], scale: [0.02, 0.22, 0.02] })
    }
    for (let i = 0; i < 4; i++) {
      const z = -0.15 + i * 0.1
      items.push({ position: [0.28, 0.42, z], scale: [0.02, 0.22, 0.02] })
      items.push({ position: [-0.28, 0.42, z], scale: [0.02, 0.22, 0.02] })
    }
    return items
  }, [])
  const rails = useMemo<Item[]>(
    () => [
      { position: [0, 0.53, 0.2], scale: [0.58, 0.03, 0.03] },
      { position: [0, 0.53, -0.2], scale: [0.58, 0.03, 0.03] },
      { position: [0.28, 0.53, 0], scale: [0.03, 0.03, 0.42] },
      { position: [-0.28, 0.53, 0], scale: [0.03, 0.03, 0.42] },
      { position: [0, 0.31, 0.2], scale: [0.58, 0.03, 0.03] },
      { position: [0, 0.31, -0.2], scale: [0.58, 0.03, 0.03] },
      { position: [0.28, 0.31, 0], scale: [0.03, 0.03, 0.42] },
      { position: [-0.28, 0.31, 0], scale: [0.03, 0.03, 0.42] },
      {
        position: [0.24, 0.6, -0.32],
        rotation: [-0.45, 0, 0],
        scale: [0.03, 0.62, 0.03],
      },
      {
        position: [-0.24, 0.6, -0.32],
        rotation: [-0.45, 0, 0],
        scale: [0.03, 0.62, 0.03],
      },
      {
        position: [0.24, 0.18, -0.1],
        rotation: [0.9, 0, 0],
        scale: [0.03, 0.3, 0.03],
      },
      {
        position: [-0.24, 0.18, -0.1],
        rotation: [0.9, 0, 0],
        scale: [0.03, 0.3, 0.03],
      },
    ],
    [],
  )
  const wheels = useMemo<Item[]>(
    () => [
      {
        position: [0.22, 0.06, 0.16],
        rotation: [0, 0, Math.PI / 2],
        scale: [0.12, 0.05, 0.12],
      },
      {
        position: [-0.22, 0.06, 0.16],
        rotation: [0, 0, Math.PI / 2],
        scale: [0.12, 0.05, 0.12],
      },
      {
        position: [0.22, 0.06, -0.16],
        rotation: [0, 0, Math.PI / 2],
        scale: [0.12, 0.05, 0.12],
      },
      {
        position: [-0.22, 0.06, -0.16],
        rotation: [0, 0, Math.PI / 2],
        scale: [0.12, 0.05, 0.12],
      },
    ],
    [],
  )
  return (
    <group {...props} name="cart">
      <Clay
        shape="slab"
        color={palette.steel}
        size={[0.58, 0.03, 0.42]}
        position={[0, 0.31, 0]}
      />
      <Instanced shape="cylinder" color={palette.steel} items={bars} />
      <Instanced shape="slab" color={palette.steel} items={rails} />
      <Clay
        shape="cylinder"
        color={palette.red}
        size={[0.07, 0.56, 0.07]}
        position={[0, 0.86, -0.45]}
        rotation={[0, 0, Math.PI / 2]}
      />
      <Instanced shape="cylinder" color={palette.rubber} items={wheels} />
      <group name="cart-basket-anchor" position={[0, 0.34, 0]} />
    </group>
  )
}
