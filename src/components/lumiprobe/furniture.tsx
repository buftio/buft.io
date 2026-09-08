'use client'

import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { Group, type MeshStandardMaterial } from 'three'
import { Clay, clay, geo } from '../marketdata/models/clay'
import type { Element } from './molecule'
import { tones, glowMaterial } from './palette'
import {
  BASE_HEIGHT,
  DISH_HEIGHT,
  FACING,
  KEY_HEIGHT,
  PITCH,
  TRASH,
  panelFoot,
  type View,
  type Pad,
  type Panel,
  type Spot,
} from './projection'
import { propPoses, type Pose } from './prop-placement'
import type { BoardPlacement } from './board-motion'

const SIN = Math.sin(PITCH)
const COS = Math.cos(PITCH)
/* Deterministic scatter for beads resting in a dish, in units of dish radius. */
const PILE: [number, number, number][] = Array.from({ length: 8 }, (_, i) => {
  const angle = i * 2.4 + 0.6
  const reach = i === 0 ? 0 : 0.36 + (i % 3) * 0.14
  return [Math.cos(angle) * reach, (i % 2) * 0.02, Math.sin(angle) * reach]
})

/* Offset from a camera-facing panel's centre toward the camera. */
const toward = (t: number): [number, number, number] => [0, t * COS, t * SIN]

export function Dish({
  spot,
  radius,
  element,
  count,
  dim,
  invite,
  reduced,
}: {
  spot: Spot
  radius: number
  element: Element
  count: number
  dim: boolean
  invite: boolean
  reduced: boolean
}) {
  const bead = element === 'C' ? 0.17 : 0.15
  const tone = element === 'C' ? tones.carbon : tones.oxygen
  const pile = useRef<Group>(null)
  useLayoutEffect(() => {
    if (!pile.current || (invite && !reduced)) return
    pile.current.children.forEach((item, i) => {
      item.position.y = DISH_HEIGHT + bead + PILE[i][1]
      item.scale.setScalar(1)
    })
  }, [invite, reduced, bead, count])
  useFrame(({ clock }) => {
    if (!pile.current || !invite || reduced) return
    pile.current.children.forEach((item, i) => {
      const phase =
        (clock.elapsedTime + i * 0.15 + (element === 'O' ? 1.3 : 0)) % 3
      const hop = phase < 0.85 ? Math.sin((phase / 0.85) * Math.PI) : 0
      item.position.y = DISH_HEIGHT + bead + PILE[i][1] + hop * 0.3
      item.scale.set(1 - hop * 0.08, 1 + hop * 0.12, 1 - hop * 0.08)
    })
  })
  return (
    <group position={[spot.x, 0, spot.z]}>
      <Clay
        shape="cylinder"
        color={tones.dish}
        size={[radius * 2, DISH_HEIGHT, radius * 2]}
        position={[0, DISH_HEIGHT / 2, 0]}
      />
      <Clay
        shape="cylinder"
        color={dim ? tones.dish : tones.dishWell}
        size={[radius * 1.7, 0.04, radius * 1.7]}
        position={[0, DISH_HEIGHT, 0]}
      />
      <group ref={pile}>
        {PILE.slice(0, count).map(([px, py, pz], i) => (
          <group
            key={i}
            position={[px * radius, DISH_HEIGHT + bead + py, pz * radius]}
          >
            <Clay shape="sphere" color={tone} size={bead * 2} />
            {element === 'O' && (
              <Clay
                shape="sphere"
                color={tones.hydrogen}
                size={0.16}
                position={[bead * 0.75, 0.06, bead * 0.5]}
              />
            )}
          </group>
        ))}
      </group>
    </group>
  )
}

export function Trash({
  spot,
  open,
  reduced,
}: {
  spot: Spot
  open: boolean
  reduced: boolean
}) {
  const lid = useRef<Group>(null)
  const target = open ? -1.1 : 0
  useLayoutEffect(() => {
    if (reduced && lid.current) lid.current.rotation.x = target
  }, [reduced, target])
  useFrame((_, delta) => {
    const group = lid.current
    if (!group || reduced) return
    group.rotation.x += (target - group.rotation.x) * Math.min(1, delta * 10)
  })
  const { radius, height } = TRASH
  return (
    <group position={[spot.x, 0, spot.z]}>
      {open && (
        <Clay
          shape="torus"
          color={tones.oxygen}
          size={[radius * 3.4, radius * 3.4, 0.5]}
          position={[0, 0.03, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
      )}
      <Clay
        shape="cylinder"
        color={tones.tin}
        size={[radius * 2, height, radius * 2]}
        position={[0, height / 2, 0]}
      />
      <Clay
        shape="cylinder"
        color={tones.tinDark}
        size={[radius * 2.1, 0.08, radius * 2.1]}
        position={[0, 0.04, 0]}
      />
      <Clay
        shape="cylinder"
        color={tones.tinDark}
        size={[radius * 2.1, 0.08, radius * 2.1]}
        position={[0, height - 0.04, 0]}
      />
      <group
        ref={lid}
        position={[0, height, -radius]}
        rotation={reduced ? [target, 0, 0] : undefined}
      >
        <Clay
          shape="cylinder"
          color={open ? tones.oxygen : tones.tinDark}
          size={[radius * 2.2, 0.08, radius * 2.2]}
          position={[0, 0.04, radius]}
        />
        <Clay
          shape="slab"
          color={tones.tinDark}
          size={[0.16, 0.08, 0.3]}
          position={[0, 0.12, radius]}
        />
      </group>
    </group>
  )
}

function FacingSlab({
  panel,
  color,
  depth = 0.06,
  inset = 0,
  lift = 0,
  material,
}: {
  panel: Panel
  color: string
  depth?: number
  inset?: number
  lift?: number
  material?: MeshStandardMaterial
}) {
  const [dx, dy, dz] = toward(lift)
  return (
    <mesh
      geometry={geo.slab}
      material={material ?? clay(color)}
      position={[panel.x + dx, panel.y + dy, panel.z + dz]}
      rotation={FACING}
      scale={[panel.w - inset * 2, depth, panel.h - inset * 2]}
      castShadow
      receiveShadow
      dispose={null}
    />
  )
}

function Turned({ pose, children }: { pose: Pose; children: ReactNode }) {
  return (
    <group position={pose.pivot} rotation={[0, pose.yaw, 0]}>
      <group position={[-pose.pivot[0], -pose.pivot[1], -pose.pivot[2]]}>
        {children}
      </group>
    </group>
  )
}

function Tilted({ pose, children }: { pose: Pose; children: ReactNode }) {
  return (
    <group position={pose.pivot} rotation={[pose.lean, 0, 0]}>
      <group position={[-pose.pivot[0], -pose.pivot[1], -pose.pivot[2]]}>
        {children}
      </group>
    </group>
  )
}

export function Laptop({ view, glow }: { view: View; glow: boolean }) {
  const { layout } = view
  const pose = propPoses(view).laptop
  const { screen, base, keys } = layout
  const foot = panelFoot(screen)
  const frontSpace = base.d - keys[0].d - 0.3
  const smallKeyWidth = (base.w - 0.44) / 10
  return (
    <Turned pose={pose}>
      <Clay
        shape="slab"
        color="#a3a7b1"
        size={[base.w, BASE_HEIGHT, base.d]}
        position={[base.x, BASE_HEIGHT / 2, base.z]}
      />
      <Clay
        shape="slab"
        color={tones.shell}
        size={[base.w - 0.12, 0.03, base.d - 0.16]}
        position={[base.x, BASE_HEIGHT + 0.005, base.z]}
      />
      {keys.map((key: Pad, i) => (
        <group key={i} position={[key.x, BASE_HEIGHT, key.z]}>
          <Clay
            shape="slab"
            color="#aaa1b1"
            size={[key.w, KEY_HEIGHT, key.d]}
            position={[0, KEY_HEIGHT / 2, 0]}
          />
          <Clay
            shape="slab"
            color={tones.key}
            size={[key.w - 0.06, 0.04, key.d - 0.08]}
            position={[0, KEY_HEIGHT - 0.01, 0]}
          />
        </group>
      ))}
      {Array.from({ length: 30 }, (_, index) => {
        const row = Math.floor(index / 10)
        const column = index % 10
        return (
          <Clay
            key={index}
            shape="slab"
            color={row === 0 ? '#d6cedd' : '#c3bdcd'}
            size={[smallKeyWidth - 0.045, 0.055, frontSpace * 0.15]}
            position={[
              base.x + (column - 4.5) * smallKeyWidth,
              BASE_HEIGHT + 0.045,
              keys[0].z + keys[0].d / 2 + frontSpace * (0.15 + row * 0.21),
            ]}
          />
        )
      })}
      <Clay
        shape="slab"
        color="#787482"
        size={[base.w * 0.28, 0.025, frontSpace * 0.21]}
        position={[
          base.x,
          BASE_HEIGHT + 0.018,
          base.z + base.d / 2 - frontSpace * 0.14,
        ]}
      />
      <Clay
        shape="cylinder"
        color="#8a8794"
        size={[0.14, screen.w * 0.7, 0.14]}
        position={foot}
        rotation={[0, 0, Math.PI / 2]}
      />
      <Tilted pose={pose}>
        <FacingSlab
          panel={{ ...screen, w: screen.w + 0.18, h: screen.h + 0.18 }}
          color={tones.shell}
          depth={0.09}
        />
        <FacingSlab
          panel={screen}
          color={glow ? tones.screenLit : tones.screen}
          depth={0.03}
          lift={0.06}
          material={glow ? glowMaterial : undefined}
        />
        <Clay
          shape="sphere"
          color="#28242f"
          size={0.055}
          position={[
            screen.x,
            screen.y + (screen.h / 2 + 0.045) * SIN + 0.04 * COS,
            screen.z - (screen.h / 2 + 0.045) * COS + 0.04 * SIN,
          ]}
        />
      </Tilted>
    </Turned>
  )
}

export function Clipboard({ placement }: { placement: BoardPlacement }) {
  const { panel, pose } = placement
  const angle = PITCH + pose.lean
  const backY =
    pose.pivot[1] + (panel.h / 2) * Math.sin(angle) - 0.05 * Math.cos(angle)
  const backZ =
    pose.pivot[2] - (panel.h / 2) * Math.cos(angle) - 0.05 * Math.sin(angle)
  const legRise = backY - 0.04
  const legRun = legRise * 0.7
  return (
    <Turned pose={pose}>
      <Tilted pose={pose}>
        <FacingSlab panel={panel} color={tones.board} depth={0.08} />
        <FacingSlab
          panel={{ ...panel, y: panel.y + 0.04 * SIN, z: panel.z - 0.04 * COS }}
          color={tones.paper}
          depth={0.03}
          inset={0.1}
          lift={0.055}
        />
        <Clay
          shape="box"
          color={tones.clip}
          size={[Math.min(1, panel.w * 0.35), 0.1, 0.18]}
          position={[
            panel.x,
            panel.y + (panel.h / 2 - 0.02) * SIN + 0.08,
            panel.z - (panel.h / 2 - 0.02) * COS,
          ]}
          rotation={FACING}
        />
      </Tilted>
      {/* A prop leg from the board's back down to the bench behind it. */}
      <Clay
        shape="slab"
        color={tones.board}
        size={[panel.w * 0.3, 0.08, Math.hypot(legRise, legRun)]}
        position={[panel.x, 0.04 + legRise / 2, backZ - legRun / 2]}
        rotation={[-Math.atan2(legRise, legRun), 0, 0]}
      />
    </Turned>
  )
}
