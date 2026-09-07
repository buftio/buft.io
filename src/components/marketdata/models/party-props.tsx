'use client'

import { useMemo } from 'react'
import {
  Clay,
  Instanced,
  palette,
  pick,
  rugColors,
  type GroupProps,
  type Item,
} from './clay'

const tea = '#b8742f'
const glaze = '#f7efe2'
const cookie = '#d9b46a'

export type TeaTrayProps = GroupProps & {
  color?: string
  cups?: number
}

export function TeaTray({
  color = palette.teal,
  cups = 3,
  ...props
}: TeaTrayProps) {
  const count = Math.max(1, Math.min(4, Math.round(cups)))
  const cupItems = useMemo<Item[]>(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = 0.35 + (i / count) * Math.PI * 1.15
        return {
          position: [Math.cos(angle) * 0.23, 0.065, Math.sin(angle) * 0.23],
          scale: [0.09, 0.07, 0.09],
        }
      }),
    [count],
  )
  const teaItems = useMemo<Item[]>(
    () =>
      cupItems.map((cup) => ({
        position: [cup.position[0], 0.095, cup.position[2]],
        scale: [0.072, 0.02, 0.072],
      })),
    [cupItems],
  )
  const cookies = useMemo<Item[]>(
    () => [
      { position: [-0.04, 0.0575, 0.02], scale: [0.06, 0.025, 0.06] },
      { position: [0.03, 0.0575, -0.03], scale: [0.06, 0.025, 0.06] },
      { position: [0.04, 0.0575, 0.04], scale: [0.06, 0.025, 0.06] },
      { position: [-0.01, 0.08, 0.0], scale: [0.06, 0.025, 0.06] },
    ],
    [],
  )
  return (
    <group {...props} name="tea-tray">
      <Clay
        shape="cylinder"
        color={palette.wood}
        size={[0.72, 0.03, 0.72]}
        position={[0, 0.015, 0]}
      />
      <Clay
        shape="torus"
        color={palette.darkWood}
        size={[0.72, 0.72, 0.3]}
        position={[0, 0.03, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <group name="teapot" position={[-0.12, 0.03, -0.06]}>
        <Clay
          shape="sphere"
          color={color}
          size={0.22}
          position={[0, 0.11, 0]}
        />
        <Clay
          shape="cylinder"
          color={color}
          size={[0.11, 0.03, 0.11]}
          position={[0, 0.215, 0]}
        />
        <Clay
          shape="sphere"
          color={palette.cream}
          size={0.05}
          position={[0, 0.245, 0]}
        />
        <Clay
          shape="cone"
          color={color}
          size={[0.08, 0.16, 0.08]}
          position={[0.14, 0.15, 0]}
          rotation={[0, 0, -1.1]}
        />
        <Clay
          shape="torus"
          color={color}
          size={[0.16, 0.16, 0.16]}
          position={[-0.11, 0.12, 0]}
        />
      </group>
      <Instanced shape="cylinder" color={glaze} items={cupItems} />
      <Instanced shape="cylinder" color={tea} items={teaItems} />
      <group name="snacks" position={[0.17, 0.03, 0.12]}>
        <Clay
          shape="cylinder"
          color={palette.cream}
          size={[0.2, 0.015, 0.2]}
          position={[0, 0.0075, 0]}
        />
        <Instanced shape="sphere" color={cookie} items={cookies} />
      </group>
    </group>
  )
}

export type RadioProps = GroupProps & { color?: string }

const grille: Item[] = Array.from({ length: 12 }, (_, i) => ({
  position: [-0.16 + (i % 4) * 0.04, 0.09 + Math.floor(i / 4) * 0.04, 0.105],
  scale: 0.018,
}))

export function Radio({ color = palette.terracotta, ...props }: RadioProps) {
  return (
    <group {...props} name="radio">
      <Clay
        shape="box"
        color={color}
        size={[0.44, 0.28, 0.18]}
        position={[0, 0.14, 0]}
      />
      <Clay
        shape="slab"
        color={palette.cream}
        size={[0.38, 0.2, 0.02]}
        position={[0, 0.14, 0.09]}
      />
      <Instanced shape="sphere" color={palette.ink} items={grille} />
      <Clay
        shape="cylinder"
        color={palette.mustard}
        size={[0.1, 0.02, 0.1]}
        position={[0.1, 0.17, 0.105]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <Clay
        shape="cylinder"
        color={palette.ink}
        size={[0.016, 0.03, 0.016]}
        position={[0.1, 0.19, 0.115]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <Clay
        shape="cylinder"
        color={palette.ink}
        size={[0.04, 0.025, 0.04]}
        position={[0.04, 0.08, 0.105]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <Clay
        shape="cylinder"
        color={palette.ink}
        size={[0.04, 0.025, 0.04]}
        position={[0.14, 0.08, 0.105]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <Clay
        shape="smile"
        color={palette.darkWood}
        size={[0.3, 0.3, 0.3]}
        position={[0, 0.28, 0]}
      />
      <group
        name="antenna"
        position={[0.17, 0.27, -0.05]}
        rotation={[0, 0, -0.45]}
      >
        <Clay
          shape="cylinder"
          color={palette.steel}
          size={[0.015, 0.36, 0.015]}
          position={[0, 0.18, 0]}
        />
        <Clay
          shape="sphere"
          color={palette.steel}
          size={0.035}
          position={[0, 0.36, 0]}
        />
      </group>
    </group>
  )
}

export type FloorCushionProps = GroupProps & {
  color?: string
  accent?: string
  variant?: number
  size?: number
  round?: boolean
}

export function FloorCushion({
  color,
  accent = palette.cream,
  variant = 0,
  size = 0.6,
  round = false,
  ...props
}: FloorCushionProps) {
  const fill = color ?? pick(rugColors, variant)
  const tassels = useMemo<Item[]>(() => {
    const r = size / 2 + 0.01
    return [
      { position: [-r, 0.06, -r], scale: 0.05 },
      { position: [r, 0.06, -r], scale: 0.05 },
      { position: [-r, 0.06, r], scale: 0.05 },
      { position: [r, 0.06, r], scale: 0.05 },
    ]
  }, [size])
  return (
    <group {...props} name="floor-cushion">
      {round ? (
        <Clay
          shape="sphere"
          color={fill}
          size={[size, 0.2, size]}
          position={[0, 0.1, 0]}
        />
      ) : (
        <Clay
          shape="box"
          color={fill}
          size={[size, 0.16, size]}
          position={[0, 0.08, 0]}
        />
      )}
      <Clay
        shape="sphere"
        color={accent}
        size={0.05}
        position={[0, round ? 0.185 : 0.15, 0]}
      />
      {!round && <Instanced shape="sphere" color={accent} items={tassels} />}
    </group>
  )
}

export type CushionRingProps = GroupProps & { radius?: number; count?: number }

export function CushionRing({
  radius = 0.9,
  count = 4,
  ...props
}: CushionRingProps) {
  const seats = Math.max(1, Math.min(8, Math.round(count)))
  return (
    <group {...props} name="cushion-ring">
      {Array.from({ length: seats }, (_, i) => {
        const angle = (i / seats) * Math.PI * 2 + Math.PI / seats
        return (
          <FloorCushion
            key={i}
            variant={i}
            round={i % 2 === 1}
            size={0.55}
            position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius]}
            rotation={[0, -angle + Math.PI / 2, 0]}
          />
        )
      })}
    </group>
  )
}
