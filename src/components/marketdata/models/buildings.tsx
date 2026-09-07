'use client'

import { useMemo } from 'react'
import {
  Clay,
  Instanced,
  palette,
  rugColors,
  type GroupProps,
  type Item,
} from './clay'

const teeth = [0, 1, 2]

export function Mill(props: GroupProps) {
  const roof = useMemo<Item[]>(
    () =>
      teeth.map((i) => ({
        position: [-1.8 + i * 1.2, 1.6, 0],
        scale: [1.2, 0.7, 2.1],
      })),
    [],
  )
  const skylights = useMemo<Item[]>(
    () =>
      teeth.map((i) => ({
        position: [-0.58 + i * 1.2, 1.9, 0],
        scale: [0.05, 0.42, 1.5],
      })),
    [],
  )
  const puffs = useMemo<Item[]>(
    () => [
      { position: [1.45, 2.5, -0.6], scale: 0.2 },
      { position: [1.52, 2.68, -0.62], scale: 0.28 },
      { position: [1.62, 2.9, -0.58], scale: 0.36 },
    ],
    [],
  )
  const posts = useMemo<Item[]>(
    () => [
      { position: [-1.05, 0.7, 0.2], scale: [0.12, 1.3, 0.12] },
      { position: [1.05, 0.7, 0.2], scale: [0.12, 1.3, 0.12] },
      { position: [-1.05, 0.06, 0.4], scale: [0.14, 0.06, 0.6] },
      { position: [1.05, 0.06, 0.4], scale: [0.14, 0.06, 0.6] },
    ],
    [],
  )
  const warp = useMemo<Item[]>(
    () =>
      Array.from({ length: 15 }, (_, i) => ({
        position: [-0.84 + i * 0.12, 0.825, 0.375],
        rotation: [-0.353, 0, 0],
        scale: [0.014, 1.01, 0.014],
        color: i % 2 ? palette.cream : palette.sand,
      })),
    [],
  )
  const reels = useMemo<Item[]>(
    () => [
      ...Array.from({ length: 5 }, (_, i) => ({
        position: [-1.58 + i * 0.17, 1.13, -0.62] as Item['position'],
        scale: [0.15, 0.2, 0.15] as Item['scale'],
        color: rugColors[i],
      })),
      {
        position: [1.3, 0.2, 0.55],
        scale: [0.16, 0.22, 0.16],
        color: rugColors[5],
      },
      {
        position: [1.5, 0.2, 0.35],
        scale: [0.16, 0.22, 0.16],
        color: rugColors[6],
      },
      {
        position: [1.42, 0.2, 0.05],
        rotation: [0, 0, Math.PI / 2],
        scale: [0.16, 0.22, 0.16],
        color: rugColors[7],
      },
    ],
    [],
  )
  return (
    <group {...props} name="mill">
      <Clay color={palette.sand} size={[3.6, 0.1, 2]} position={[0, 0.05, 0]} />
      <Clay
        color={palette.cream}
        size={[3.6, 1.6, 0.12]}
        position={[0, 0.8, -0.94]}
      />
      <Clay
        color={palette.cream}
        size={[0.12, 1.6, 2]}
        position={[-1.74, 0.8, 0]}
      />
      <Clay
        color={palette.cream}
        size={[0.12, 1.6, 2]}
        position={[1.74, 0.8, 0]}
      />
      <Clay
        color={palette.cream}
        size={[3.6, 0.32, 0.12]}
        position={[0, 1.44, 0.94]}
      />
      <Instanced shape="wedge" color={palette.terracotta} items={roof} />
      <Instanced shape="slab" color={palette.glass} items={skylights} />
      <Clay
        shape="cylinder"
        color={palette.terracotta}
        size={[0.3, 0.9, 0.3]}
        position={[1.45, 2.05, -0.6]}
      />
      <group name="chimney-puffs">
        <Instanced shape="sphere" color={palette.cream} items={puffs} />
      </group>

      <group name="loom" position={[0, 0, 0]}>
        <Instanced color={palette.darkWood} items={posts} />
        <Clay
          color={palette.wood}
          size={[2.3, 0.12, 0.12]}
          position={[0, 1.3, 0.2]}
        />
        <Instanced shape="cylinder" items={warp} />
        <group name="loom-roller" position={[0, 0.35, 0.55]}>
          <Clay
            shape="cylinder"
            color={palette.wood}
            size={[0.2, 2.2, 0.2]}
            rotation={[0, 0, Math.PI / 2]}
          />
          <Clay
            shape="sphere"
            color={palette.darkWood}
            size={0.16}
            position={[1.16, 0, 0]}
          />
          <Clay
            shape="sphere"
            color={palette.darkWood}
            size={0.16}
            position={[-1.16, 0, 0]}
          />
        </group>
        <group name="loom-shuttle" position={[0, 0.8, 0.39]}>
          <Clay
            shape="sphere"
            color={palette.darkWood}
            size={[0.42, 0.07, 0.12]}
          />
        </group>
        <group name="mill-rug-anchor" position={[0, 0.36, 0.72]} />
      </group>

      <Clay
        color={palette.darkWood}
        size={[0.95, 0.05, 0.3]}
        position={[-1.24, 1.0, -0.62]}
      />
      <Instanced shape="cylinder" items={reels} />
      <Clay
        color={palette.wood}
        size={[0.5, 0.25, 0.5]}
        position={[1.4, 0.125, 0.3]}
      />
    </group>
  )
}

export function Warehouse(props: GroupProps) {
  const rolls = useMemo<Item[]>(
    () =>
      [
        [-1.25, 0.15],
        [-0.95, 0.15],
        [-0.65, 0.15],
        [-1.1, 0.41],
        [-0.8, 0.41],
        [-0.95, 0.67],
      ].map(([x, y], i) => ({
        position: [x, y, 0.85] as Item['position'],
        rotation: [0, 0, Math.PI / 2] as Item['rotation'],
        scale: [0.3, 0.28, 0.3] as Item['scale'],
        color: rugColors[i % rugColors.length],
      })),
    [],
  )
  const crates = useMemo<Item[]>(
    () => [
      { position: [0.9, 0.18, 0.85], scale: 0.36 },
      { position: [1.28, 0.18, 0.85], scale: 0.36 },
      { position: [1.09, 0.54, 0.85], scale: 0.36, rotation: [0, 0.2, 0] },
    ],
    [],
  )
  const windows = useMemo<Item[]>(
    () => [
      { position: [-0.9, 1.35, 0.72], scale: [0.4, 0.3, 0.04] },
      { position: [0.9, 1.35, 0.72], scale: [0.4, 0.3, 0.04] },
    ],
    [],
  )
  return (
    <group {...props} name="warehouse">
      <Clay
        color={palette.sand}
        size={[3, 1.7, 1.7]}
        position={[0, 0.85, -0.15]}
      />
      <Clay
        color={palette.darkWood}
        size={[3.2, 0.16, 1.9]}
        position={[0, 1.78, -0.15]}
      />
      <Clay
        color={palette.darkWood}
        size={[3.2, 0.14, 1.1]}
        position={[0, 1.93, -0.15]}
      />
      <Clay
        color="#1f6b69"
        size={[1.2, 1.32, 0.06]}
        position={[0, 0.66, 0.71]}
      />
      <Clay
        color={palette.teal}
        size={[0.52, 1.22, 0.06]}
        position={[-0.28, 0.61, 0.74]}
      />
      <Clay
        color={palette.teal}
        size={[0.52, 1.22, 0.06]}
        position={[0.28, 0.61, 0.74]}
      />
      <Clay
        shape="sphere"
        color={palette.steel}
        size={0.07}
        position={[-0.08, 0.62, 0.79]}
      />
      <Clay
        shape="sphere"
        color={palette.steel}
        size={0.07}
        position={[0.08, 0.62, 0.79]}
      />
      <Clay
        color={palette.cream}
        size={[1.0, 0.22, 0.06]}
        position={[0, 1.5, 0.73]}
      />
      <Instanced shape="slab" color={palette.glass} items={windows} />
      <Instanced shape="cylinder" items={rolls} />
      <Instanced color={palette.wood} items={crates} />
      <group name="warehouse-stack-anchor" position={[0, 0, 0.9]} />
    </group>
  )
}

const stripes = Array.from({ length: 8 }, (_, i) => i)

export function Shop(props: GroupProps) {
  const slats = useMemo<Item[]>(
    () =>
      stripes.map((i) => ({
        position: [-1.4 + i * 0.4, 1.72, 0.98],
        rotation: [0.32, 0, 0],
        scale: [0.4, 0.04, 0.7],
        color: i % 2 ? palette.cream : palette.red,
      })),
    [],
  )
  const scallops = useMemo<Item[]>(
    () =>
      stripes.map((i) => ({
        position: [-1.4 + i * 0.4, 1.6, 1.3],
        scale: [0.4, 0.12, 0.12],
        color: i % 2 ? palette.cream : palette.red,
      })),
    [],
  )
  const rods = useMemo<Item[]>(
    () => [
      {
        position: [-1.45, 1.35, 1.0],
        rotation: [0.9, 0, 0],
        scale: [0.04, 0.75, 0.04],
      },
      {
        position: [1.45, 1.35, 1.0],
        rotation: [0.9, 0, 0],
        scale: [0.04, 0.75, 0.04],
      },
    ],
    [],
  )
  return (
    <group {...props} name="shop">
      <Clay
        color={palette.cream}
        size={[3, 1.9, 1.7]}
        position={[0, 0.95, -0.15]}
      />
      <Clay
        color={palette.terracotta}
        size={[3.2, 0.16, 1.9]}
        position={[0, 1.98, -0.15]}
      />
      <Clay
        color={palette.sand}
        size={[3.3, 0.1, 2.1]}
        position={[0, 0.05, 0.05]}
      />
      <Clay
        color={palette.darkWood}
        size={[1.55, 1.15, 0.08]}
        position={[0.55, 1.02, 0.72]}
      />
      <Clay
        shape="slab"
        color={palette.glass}
        size={[1.38, 0.98, 0.04]}
        position={[0.55, 1.02, 0.75]}
      />
      <Clay
        color={palette.darkWood}
        size={[0.8, 1.5, 0.08]}
        position={[-0.85, 0.85, 0.72]}
      />
      <Clay
        shape="slab"
        color="#5a4a3e"
        size={[0.66, 1.38, 0.04]}
        position={[-0.85, 0.79, 0.75]}
      />
      <Instanced items={slats} />
      <Instanced shape="sphere" items={scallops} />
      <Instanced shape="cylinder" color={palette.darkWood} items={rods} />
      <Clay
        color={palette.mustard}
        size={[1.7, 0.32, 0.08]}
        position={[0, 2.22, 0.7]}
      />
      <Clay
        color={palette.red}
        size={[0.5, 0.14, 0.03]}
        position={[-0.4, 2.22, 0.76]}
      />
      <Clay
        color={palette.teal}
        size={[0.5, 0.14, 0.03]}
        position={[0.4, 2.22, 0.76]}
      />
      <Clay
        color={palette.terracotta}
        size={[0.34, 0.26, 0.34]}
        position={[1.3, 0.23, 0.95]}
      />
      <Clay
        shape="sphere"
        color="#5f9e6e"
        size={[0.4, 0.34, 0.4]}
        position={[1.3, 0.5, 0.95]}
      />
      <group name="shop-display" position={[0.55, 0.55, 0.9]} />
      <group name="shop-door-anchor" position={[-0.85, 0, 0.8]} />
    </group>
  )
}
