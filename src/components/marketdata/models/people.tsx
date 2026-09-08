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

export const shopperPoses = [
  'stand',
  'push',
  'sit',
  'fly',
  'wave',
  'dance',
  'recline',
] as const
export type ShopperPose = (typeof shopperPoses)[number]

export type ShopperProps = GroupProps & {
  pose?: ShopperPose
  color?: string
  variant?: number
}

export const shopperParts = {
  root: 'shopper',
  upper: 'shopper-upper',
  torso: 'shopper-torso',
  legs: 'shopper-legs',
  legL: 'shopper-leg-l',
  legR: 'shopper-leg-r',
  head: 'shopper-head',
  armL: 'shopper-arm-l',
  armR: 'shopper-arm-r',
  handL: 'shopper-hand-l',
  handR: 'shopper-hand-r',
} as const

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

type LegStyle = 'stand' | 'sit' | 'recline'

type Layout = {
  legs: LegStyle
  spread: number
  hip: Vec3
  torso: Vec3
  torsoRotation: Vec3
  head: Vec3
  headRotation: Vec3
  shoulderY: number
  shoulderZ: number
  armL: Vec3
  armR: Vec3
  delighted: boolean
}

const standing: Layout = {
  legs: 'stand',
  spread: 0.1,
  hip: [0, 0.24, 0],
  torso: [0, 0.47, 0],
  torsoRotation: [0, 0, 0],
  head: [0, 0.92, 0],
  headRotation: [0, 0, 0],
  shoulderY: 0.64,
  shoulderZ: 0,
  armL: [0, 0, -0.25],
  armR: [0, 0, 0.25],
  delighted: false,
}

const layouts: Record<ShopperPose, Layout> = {
  stand: standing,
  push: {
    ...standing,
    armL: [-Math.PI / 2, 0, 0],
    armR: [-Math.PI / 2, 0, 0],
  },
  sit: {
    ...standing,
    legs: 'sit',
    hip: [0, 0.12, 0],
    torso: [0, 0.35, 0],
    head: [0, 0.8, 0],
    shoulderY: 0.52,
  },
  fly: {
    ...standing,
    torsoRotation: [-0.2, 0, 0],
    headRotation: [-0.15, 0, 0],
    armL: [0, 0, -2.6],
    armR: [0, 0, 2.6],
    delighted: true,
  },
  wave: {
    ...standing,
    headRotation: [0, 0.15, -0.12],
    armR: [0.15, 0, 2.35],
    delighted: true,
  },
  dance: {
    ...standing,
    spread: 0.13,
    torsoRotation: [0, 0.35, 0.1],
    headRotation: [0.05, 0.2, 0.15],
    armL: [0.4, 0, -2.1],
    armR: [0.4, 0, 2.4],
    delighted: true,
  },
  recline: {
    legs: 'recline',
    spread: 0.1,
    hip: [0, 0.07, 0],
    torso: [0, 0.2, -0.05],
    torsoRotation: [-1.05, 0, 0],
    head: [0, 0.41, -0.42],
    headRotation: [-0.55, 0, 0],
    shoulderY: 0.25,
    shoulderZ: -0.14,
    armL: [-1.05, 0, 0],
    armR: [0.9, 0, 0],
    delighted: false,
  },
}

const minus = (a: Vec3, b: Vec3): Vec3 => [
  a[0] - b[0],
  a[1] - b[1],
  a[2] - b[2],
]

function Leg({
  name,
  side,
  style,
  spread,
  pants,
}: {
  name: string
  side: -1 | 1
  style: LegStyle
  spread: number
  pants: string
}) {
  const x = side * spread
  if (style === 'stand')
    return (
      <group name={name} position={[x, 0.24, 0]}>
        <Clay
          shape="cylinder"
          color={pants}
          size={[0.14, 0.24, 0.14]}
          position={[0, -0.12, 0]}
        />
        <Clay
          shape="sphere"
          color={palette.ink}
          size={[0.16, 0.08, 0.2]}
          position={[0, -0.2, 0.04]}
        />
      </group>
    )
  const reclined = style === 'recline'
  const y = reclined ? 0.07 : 0.12
  const length = reclined ? 0.4 : 0.3
  return (
    <group name={name} position={[x, y, reclined ? 0.05 : 0]}>
      <Clay
        shape="cylinder"
        color={pants}
        size={[0.14, length, 0.14]}
        position={[0, 0, length / 2]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <Clay
        shape="sphere"
        color={palette.ink}
        size={[0.16, 0.14, 0.1]}
        position={[0, 0, length + 0.03]}
      />
    </group>
  )
}

function Arm({
  name,
  hand,
  position,
  rotation,
  sleeve,
  skin,
}: {
  name: string
  hand: string
  position: Vec3
  rotation: Vec3
  sleeve: string
  skin: string
}) {
  return (
    <group name={name} position={position} rotation={rotation}>
      <Clay
        shape="sphere"
        color={sleeve}
        size={[0.12, 0.34, 0.12]}
        position={[0, -0.15, 0]}
      />
      <group name={hand} position={[0, -0.32, 0]}>
        <Clay shape="sphere" color={skin} size={0.1} />
      </group>
    </group>
  )
}

function Head({
  position,
  rotation,
  skin,
  hair,
  style,
  delighted,
}: {
  position: Vec3
  rotation: Vec3
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
  return (
    <group name={shopperParts.head} position={position} rotation={rotation}>
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
  const layout = layouts[pose] ?? standing
  const { hip } = layout
  const shoulder = (side: -1 | 1): Vec3 =>
    minus([side * 0.22, layout.shoulderY, layout.shoulderZ], hip)
  return (
    <group {...props} name={shopperParts.root}>
      <group name={shopperParts.legs}>
        <Leg
          name={shopperParts.legL}
          side={-1}
          style={layout.legs}
          spread={layout.spread}
          pants={pants}
        />
        <Leg
          name={shopperParts.legR}
          side={1}
          style={layout.legs}
          spread={layout.spread}
          pants={pants}
        />
      </group>
      <group name={shopperParts.upper} position={hip}>
        <group
          name={shopperParts.torso}
          position={minus(layout.torso, hip)}
          rotation={layout.torsoRotation}
        >
          <Clay shape="sphere" color={outfit} size={[0.42, 0.5, 0.34]} />
        </group>
        <Arm
          name={shopperParts.armL}
          hand={shopperParts.handL}
          position={shoulder(-1)}
          rotation={layout.armL}
          sleeve={outfit}
          skin={skin}
        />
        <Arm
          name={shopperParts.armR}
          hand={shopperParts.handR}
          position={shoulder(1)}
          rotation={layout.armR}
          sleeve={outfit}
          skin={skin}
        />
        <Head
          position={minus(layout.head, hip)}
          rotation={layout.headRotation}
          skin={skin}
          hair={hair}
          style={style}
          delighted={layout.delighted}
        />
      </group>
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
