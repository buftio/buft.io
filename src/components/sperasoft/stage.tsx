'use client'

import {
  Clay,
  Instanced,
  geo,
  type Item,
  type Shape,
  type Vec3,
} from '../marketdata/models/clay'
import { CHANNEL, FIRST_BALL_CHANNEL, GOAL, type Point } from './types'
import { throwPose } from './throw-pose'

export const at = (p: Point, z = 0): Vec3 => [p.x - 50, 135 - p.y, z]

type Bounds = {
  x: [number, number]
  y: [number, number]
  z?: [number, number]
  color: string
  shape?: Shape
}
export function Block({ x, y, z = [-2, 2], color, shape = 'box' }: Bounds) {
  return (
    <Clay
      shape={shape}
      color={color}
      position={[
        (x[0] + x[1]) / 2 - 50,
        135 - (y[0] + y[1]) / 2,
        (z[0] + z[1]) / 2,
      ]}
      size={[x[1] - x[0], y[1] - y[0], z[1] - z[0]]}
    />
  )
}

export const rand = (i: number, k: number) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453
  return v - Math.floor(v)
}
const armor = '#5f6e5a',
  dark = '#2f3430',
  suit = '#3e4a3a',
  sand = '#cfc3a5',
  line = '#f3efe0'

export function Ground() {
  return (
    <>
      <Block x={[0, 83]} y={[60.5, 66]} z={[-6, 4]} color={sand} />
      <Block x={[89, 100]} y={[60.5, 66]} z={[-6, 4]} color={sand} />
      <Block x={[43, 49]} y={[51, 60.5]} z={[-3, 3]} color="#8f7a5a" />
      <Block
        x={[43, 49]}
        y={[53.8, 54.5]}
        z={[3, 3.3]}
        color="#6e5a3e"
        shape="slab"
      />
      <Block
        x={[43, 49]}
        y={[57, 57.7]}
        z={[3, 3.3]}
        color="#6e5a3e"
        shape="slab"
      />
    </>
  )
}

const greenSeeds: [number, number, number, string][] = [
  [7, 69, 2.8, '#738966'],
  [16, 72, 1.8, '#91a678'],
  [32, 69, 2.1, '#718b6d'],
  [92, 68, 2.4, '#859d71'],
  [8, 115, 2.6, '#728d70'],
  [91, 113, 2.1, '#8ca174'],
  [7, 155, 2.3, '#718b6d'],
  [27, 178, 1.7, '#91a678'],
  [75, 181, 2.5, '#728d70'],
]
const greenery: Item[] = greenSeeds.map(([x, y, scale, color]) => ({
  position: at({ x, y }, -3),
  scale,
  color,
}))
const stones: Item[] = [
  [33, 64, 2],
  [56, 67, 1.7],
  [72, 72, 2.1],
  [11, 128, 1.8],
  [91, 139, 2.3],
  [28, 185, 1.7],
  [72, 186, 2],
].map(([x, y, scale], i) => ({
  position: at({ x, y }, -2),
  rotation: [0, 0, i * 0.5] as Vec3,
  scale: [scale, scale * 0.65, scale * 0.8] as Vec3,
  color: i % 2 ? '#b7aa91' : '#968d7d',
}))
export function Surroundings() {
  return (
    <>
      <Instanced shape="sphere" items={greenery} />
      <Instanced items={stones} />
    </>
  )
}

export function Trooper({
  progress,
  strength,
}: {
  progress: number
  strength: number
}) {
  const pose = throwPose(progress, strength)
  return (
    <group position={at({ x: 12.5, y: 60.5 })}>
      {[-1.2, 1.2].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <Clay
            shape="sphere"
            color={dark}
            size={[2.3, 1.2, 2.4]}
            position={[0.2, 0.5, 0]}
          />
          <Clay
            shape="cylinder"
            color={suit}
            size={[1.6, 4.2, 1.6]}
            position={[0, 2.9, 0]}
          />
          <Clay
            shape="sphere"
            color={armor}
            size={1.5}
            position={[0, 2.9, 0.6]}
          />
        </group>
      ))}
      <Clay color={dark} size={[4.8, 0.9, 3.4]} position={[0, 5, 0]} />
      <Clay color={armor} size={[4.6, 4.4, 3.2]} position={[0, 7.4, 0]} />
      <Clay color="#6f7f69" size={[3.4, 2.8, 1]} position={[0.2, 7.5, 1.6]} />
      <Clay color={dark} size={[1.6, 3.2, 2.4]} position={[-2.6, 7.2, -0.4]} />
      {[-2.7, 2.7].map((x) => (
        <Clay
          key={x}
          shape="sphere"
          color={armor}
          size={[2.4, 1.8, 2.6]}
          position={[x, 9.1, 0]}
        />
      ))}
      <Clay
        shape="sphere"
        color={armor}
        size={[3.6, 3.4, 3.6]}
        position={[0.2, 11.2, 0]}
      />
      <Clay
        color="#e0b84a"
        size={[1.4, 1.2, 2.4]}
        position={[1.6, 11.2, 0.5]}
      />
      <group position={[2.7, 9.1, 0.4]} rotation={[0, 0, pose.angle]}>
        <Clay
          shape="cylinder"
          color={suit}
          size={[1.3, pose.reach, 1.3]}
          position={[0, pose.reach / 2, 0]}
        />
        <Clay
          shape="sphere"
          color={dark}
          size={1.6}
          position={[0, pose.reach, 0.1]}
        />
      </group>
      <group position={[-2.6, 8.4, 0.6]} rotation={[0, 0, pose.support]}>
        <Clay
          shape="cylinder"
          color={suit}
          size={[1.3, 3.2, 1.3]}
          position={[0, -1.6, 0]}
        />
        <Clay shape="sphere" color={dark} size={1.4} position={[0, -3.4, 0]} />
      </group>
    </group>
  )
}

export function Reservoir({ open }: { open: boolean }) {
  const steel = '#7d8a7d'
  return (
    <>
      <Block x={[70, 96]} y={[24, 26]} z={[-3, 4]} color={steel} />
      <Block x={[94, 96]} y={[24, 62]} z={[-3, 4]} color={steel} />
      {[44, 50, 56].map((y) => (
        <Block key={y} x={[82, 94]} y={[y, y + 0.8]} z={[3, 4]} color={steel} />
      ))}
      <Block x={[82, 94]} y={[40, 58]} z={[-3, -2.2]} color={steel} />
      <Block x={[82, 82.7]} y={[40, 60.5]} z={[-3, 2.5]} color={steel} />
      <Block x={[93, 94]} y={[40, 60.5]} z={[-3, 2.5]} color={steel} />
      <Block x={[82, 83.5]} y={[58, 59]} z={[-3, 2.5]} color={steel} />
      <Block x={[87, 94]} y={[58, 59]} z={[-3, 2.5]} color={steel} />
      <mesh
        geometry={geo.slab}
        position={[38, 85, 2.7]}
        scale={[10.3, 16, 0.4]}
        dispose={null}
      >
        <meshStandardMaterial
          color="#bfe3ec"
          transparent
          opacity={0.28}
          roughness={0.35}
          depthWrite={false}
        />
      </mesh>
      <group
        position={at({ x: 87, y: 58.5 })}
        rotation={[0, 0, open ? 1.3 : 0]}
      >
        <Clay
          shape="slab"
          color="#5b6a5b"
          size={[3.5, 0.8, 5]}
          position={[-1.75, 0, 0]}
        />
      </group>
    </>
  )
}

function buildRails(points: Point[]) {
  const rails: Item[] = [],
    joints: Item[] = [],
    ties: Item[] = []
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i],
      b = points[i + 1]
    const dx = b.x - a.x,
      dy = a.y - b.y
    const length = Math.hypot(dx, dy)
    const angle = Math.atan2(-dx, dy)
    const nx = (-dy / length) * 1.9,
      ny = (dx / length) * 1.9
    const mid = at({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
    for (const s of [-1, 1]) {
      rails.push({
        position: [mid[0] + nx * s, mid[1] + ny * s, 0],
        rotation: [0, 0, angle],
        scale: [0.7, length, 0.7],
      })
      for (const p of [a, b])
        joints.push({
          position: [p.x - 50 + nx * s, 135 - p.y + ny * s, 0],
          scale: 0.85,
        })
    }
    for (let t = 3.5; t < length; t += 7) {
      const p = {
        x: a.x + ((b.x - a.x) * t) / length,
        y: a.y + ((b.y - a.y) * t) / length,
      }
      ties.push({
        position: at(p, -1.1),
        rotation: [0, 0, angle + Math.PI / 2],
        scale: [0.4, 3.8, 0.4],
      })
    }
  }
  return { rails, joints, ties }
}
const mainRails = buildRails(CHANNEL)
const feedRails = buildRails(FIRST_BALL_CHANNEL.slice(CHANNEL.length - 1))
function RailSet({ set }: { set: ReturnType<typeof buildRails> }) {
  return (
    <>
      <Instanced shape="cylinder" color="#8a7f6c" items={set.rails} />
      <Instanced shape="sphere" color="#8a7f6c" items={set.joints} />
      <Instanced shape="cylinder" color="#6e6455" items={set.ties} />
    </>
  )
}
export function Rails({ feeding }: { feeding: boolean }) {
  return (
    <>
      <RailSet set={mainRails} />
      {feeding && <RailSet set={feedRails} />}
    </>
  )
}

const stripe = 61 / 6
const BANK: [number, number] = [-1.5, 0.9]
export function Pitch() {
  return (
    <>
      <Block x={[19, 81]} y={[190, 253]} z={[-4.2, -3.4]} color="#3f6b43" />
      <Block x={[20, 80]} y={[191, 252]} z={[-3.5, -1.5]} color="#5f9a5e" />
      {[1, 3, 5].map((i) => (
        <Block
          key={i}
          x={[20, 80]}
          y={[191 + i * stripe, 191 + (i + 1) * stripe]}
          z={[-1.5, -1.4]}
          color="#579355"
          shape="slab"
        />
      ))}
      <Block x={[20.6, 43.5]} y={[191.6, 192.3]} z={BANK} color={line} />
      <Block x={[56.5, 79.4]} y={[191.6, 192.3]} z={BANK} color={line} />
      <Block x={[20.6, 79.4]} y={[250.7, 251.4]} z={BANK} color={line} />
      <Block x={[20.6, 21.3]} y={[191.6, 251.4]} z={BANK} color={line} />
      <Block x={[78.7, 79.4]} y={[191.6, 251.4]} z={BANK} color={line} />
      <Block
        x={[20.6, 79.4]}
        y={[221.15, 221.85]}
        z={[-1.5, -1.3]}
        color={line}
        shape="slab"
      />
      <Block
        x={[36, 64]}
        y={[204, 204.7]}
        z={[-1.5, -1.3]}
        color={line}
        shape="slab"
      />
      <Block
        x={[36, 36.7]}
        y={[191.6, 204.7]}
        z={[-1.5, -1.3]}
        color={line}
        shape="slab"
      />
      <Block
        x={[63.3, 64]}
        y={[191.6, 204.7]}
        z={[-1.5, -1.3]}
        color={line}
        shape="slab"
      />
      <Clay
        shape="torus"
        color={line}
        size={[16, 16, 2]}
        position={at({ x: 50, y: 221.5 }, -1.4)}
      />
      <Clay
        shape="cylinder"
        color={line}
        size={[1, 4.5, 1]}
        position={at({ x: 44, y: 194.75 }, 0.8)}
      />
      <Clay
        shape="cylinder"
        color={line}
        size={[1, 4.5, 1]}
        position={at({ x: 56, y: 194.75 }, 0.8)}
      />
      <Clay
        shape="cylinder"
        color={line}
        size={[1, 12.6, 1]}
        rotation={[0, 0, Math.PI / 2]}
        position={at({ x: 50, y: 192.5 }, 0.8)}
      />
      <mesh
        geometry={geo.slab}
        position={at({ x: GOAL.x, y: 194.75 }, 0.5)}
        scale={[12, 4.5, 0.3]}
        dispose={null}
      >
        <meshStandardMaterial
          color={line}
          transparent
          opacity={0.4}
          roughness={1}
          depthWrite={false}
        />
      </mesh>
      <Block x={[0, 100]} y={[266, 267.5]} z={[-3, 1]} color="#3f6b43" />
    </>
  )
}
