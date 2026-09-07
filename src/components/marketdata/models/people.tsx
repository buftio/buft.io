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
  type Vec3,
} from './clay'

export type ShopperPose = 'stand' | 'sit' | 'fly'

export type ShopperProps = GroupProps & {
  pose?: ShopperPose
  color?: string
  variant?: number
}

const skins = ['#f1c9a5', '#d9a07a', '#a86f4b', '#6f4a31', '#f7d7c4']
const hairColors = ['#2b2622', '#5a3a22', '#b8742f', '#d9c27a', '#8c8c8c']
const trousers = ['#3d405b', '#6e4a30', '#2b2622', '#5a6e8c']
const cheek = '#e8a090'

const cap: Item = { position: [0, 0.07, -0.03], scale: [0.4, 0.3, 0.4] }

function hairItems(style: number): Item[] {
  switch (style % 4) {
    case 1:
      return [cap, { position: [0, 0.22, -0.1], scale: 0.16 }]
    case 2:
      return [{ position: [0, 0.02, -0.07], scale: [0.42, 0.42, 0.42] }]
    case 3:
      return [
        cap,
        { position: [0, 0.2, 0], scale: 0.14 },
        { position: [-0.14, 0.15, 0.04], scale: 0.13 },
        { position: [0.14, 0.15, 0.04], scale: 0.13 },
        { position: [-0.1, 0.16, -0.12], scale: 0.13 },
        { position: [0.1, 0.16, -0.12], scale: 0.13 },
      ]
    default:
      return [cap]
  }
}

function Arm({
  name,
  side,
  y,
  raised,
  sleeve,
  skin,
}: {
  name: string
  side: -1 | 1
  y: number
  raised: boolean
  sleeve: string
  skin: string
}) {
  return (
    <group
      name={name}
      position={[side * 0.22, y, 0]}
      rotation={[0, 0, side * (raised ? 2.6 : 0.25)]}
    >
      <Clay
        shape="sphere"
        color={sleeve}
        size={[0.12, 0.34, 0.12]}
        position={[0, -0.15, 0]}
      />
      <Clay shape="sphere" color={skin} size={0.1} position={[0, -0.32, 0]} />
    </group>
  )
}

function Head({
  y,
  skin,
  hair,
  style,
  delighted,
}: {
  y: number
  skin: string
  hair: string
  style: number
  delighted: boolean
}) {
  const face = useMemo<Item[]>(
    () => [
      { position: [-0.07, 0.03, 0.16], scale: 0.045, color: palette.ink },
      { position: [0.07, 0.03, 0.16], scale: 0.045, color: palette.ink },
      {
        position: [-0.12, -0.03, 0.13],
        scale: [0.06, 0.04, 0.03],
        color: cheek,
      },
      {
        position: [0.12, -0.03, 0.13],
        scale: [0.06, 0.04, 0.03],
        color: cheek,
      },
    ],
    [],
  )
  const hairs = useMemo(() => hairItems(style), [style])
  const tilt: Vec3 = delighted ? [-0.15, 0, 0] : [0, 0, 0]
  return (
    <group name="shopper-head" position={[0, y, 0]} rotation={tilt}>
      <Clay shape="sphere" color={skin} size={0.36} />
      <Instanced shape="sphere" items={face} />
      <Instanced shape="sphere" color={hair} items={hairs} />
      <Clay
        shape="smile"
        color={palette.ink}
        size={delighted ? 0.18 : 0.14}
        position={[0, -0.06, 0.17]}
        rotation={[0, 0, Math.PI]}
      />
      {delighted && (
        <Clay
          shape="sphere"
          color={palette.ink}
          size={[0.08, 0.07, 0.04]}
          position={[0, -0.09, 0.17]}
        />
      )}
    </group>
  )
}

export function Shopper({
  pose = 'stand',
  color,
  variant = 0,
  ...props
}: ShopperProps) {
  const outfit = color ?? pick(rugColors, variant)
  const skin = pick(skins, variant)
  const hair = pick(hairColors, variant * 3 + 1)
  const pants = pick(trousers, variant)
  const style = variant % 4
  const sitting = pose === 'sit'
  const flying = pose === 'fly'
  const torsoY = sitting ? 0.35 : 0.47
  const headY = sitting ? 0.8 : 0.92
  const armY = sitting ? 0.52 : 0.64
  return (
    <group {...props} name="shopper">
      {sitting ? (
        <>
          <Clay
            shape="cylinder"
            color={pants}
            size={[0.14, 0.3, 0.14]}
            position={[-0.1, 0.12, 0.15]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <Clay
            shape="cylinder"
            color={pants}
            size={[0.14, 0.3, 0.14]}
            position={[0.1, 0.12, 0.15]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <Clay
            shape="sphere"
            color={palette.ink}
            size={[0.16, 0.14, 0.1]}
            position={[-0.1, 0.12, 0.33]}
          />
          <Clay
            shape="sphere"
            color={palette.ink}
            size={[0.16, 0.14, 0.1]}
            position={[0.1, 0.12, 0.33]}
          />
        </>
      ) : (
        <>
          <Clay
            shape="cylinder"
            color={pants}
            size={[0.14, 0.24, 0.14]}
            position={[-0.1, 0.12, 0]}
          />
          <Clay
            shape="cylinder"
            color={pants}
            size={[0.14, 0.24, 0.14]}
            position={[0.1, 0.12, 0]}
          />
          <Clay
            shape="sphere"
            color={palette.ink}
            size={[0.16, 0.08, 0.2]}
            position={[-0.1, 0.04, 0.04]}
          />
          <Clay
            shape="sphere"
            color={palette.ink}
            size={[0.16, 0.08, 0.2]}
            position={[0.1, 0.04, 0.04]}
          />
        </>
      )}
      <Clay
        shape="sphere"
        color={outfit}
        size={[0.42, 0.5, 0.34]}
        position={[0, torsoY, 0]}
        rotation={flying ? [-0.2, 0, 0] : [0, 0, 0]}
      />
      <Arm
        name="shopper-arm-l"
        side={-1}
        y={armY}
        raised={flying}
        sleeve={outfit}
        skin={skin}
      />
      <Arm
        name="shopper-arm-r"
        side={1}
        y={armY}
        raised={flying}
        sleeve={outfit}
        skin={skin}
      />
      <Head
        y={headY}
        skin={skin}
        hair={hair}
        style={style}
        delighted={flying}
      />
    </group>
  )
}

export type YarnSpoolProps = GroupProps & { color?: string }

export function YarnSpool({ color = rugColors[0], ...props }: YarnSpoolProps) {
  const rings = useMemo<Item[]>(
    () => [
      {
        position: [0, 0.09, 0],
        rotation: [Math.PI / 2, 0, 0],
        scale: [0.46, 0.46, 0.3],
      },
      {
        position: [0, 0.16, 0],
        rotation: [Math.PI / 2, 0, 0],
        scale: [0.47, 0.47, 0.3],
      },
      {
        position: [0, 0.23, 0],
        rotation: [Math.PI / 2, 0, 0],
        scale: [0.46, 0.46, 0.3],
      },
    ],
    [],
  )
  return (
    <group {...props} name="yarn-spool">
      <Clay
        shape="cylinder"
        color={palette.wood}
        size={[0.12, 0.3, 0.12]}
        position={[0, 0.15, 0]}
      />
      <Clay
        shape="cylinder"
        color={palette.darkWood}
        size={[0.28, 0.03, 0.28]}
        position={[0, 0.015, 0]}
      />
      <Clay
        shape="cylinder"
        color={palette.darkWood}
        size={[0.28, 0.03, 0.28]}
        position={[0, 0.285, 0]}
      />
      <Clay
        shape="cylinder"
        color={color}
        size={[0.22, 0.22, 0.22]}
        position={[0, 0.15, 0]}
      />
      <Instanced shape="torus" color={color} items={rings} />
    </group>
  )
}
