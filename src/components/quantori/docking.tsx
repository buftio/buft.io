'use client'

import { Sparkles } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
  type Group,
  type Mesh,
} from 'three'
import { Clay, geo } from '../marketdata/models/clay'
import {
  candidates,
  isLocked,
  isPending,
  occupant,
  slots,
  type Dock,
} from './dock'
import { Confetti, Flash } from './fx'
import { STEP, type Phase, type V3 } from './layout'

export const PROTEIN: V3 = [0, 1.6, -4]
export const POCKET: V3 = [0, 1.6, -2.68]
export const GRAIL: V3 = [0, 3.7, -3.4]
const UP = new Vector3(0, 1, 0)
const scratch = new Vector3()
const beam = new MeshBasicMaterial({
  color: '#ffd36b',
  transparent: true,
  opacity: 0.09,
  blending: AdditiveBlending,
  depthWrite: false,
})
const hidden = new MeshBasicMaterial({
  transparent: true,
  opacity: 0,
  depthWrite: false,
})
const ghost = new MeshBasicMaterial({
  color: '#1d2a4a',
  transparent: true,
  opacity: 0.32,
})
export const gold = new MeshStandardMaterial({
  color: '#ffd36b',
  emissive: '#ffae00',
  emissiveIntensity: 0.2,
  metalness: 0.55,
  roughness: 0.25,
})
const candy = candidates.map(
  ({ color }) =>
    new MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.12,
      roughness: 0.28,
    }),
)

function atomsOf(cells: [number, number][]) {
  const cx = cells.reduce((sum, [x]) => sum + x, 0) / cells.length
  const cy = cells.reduce((sum, [, y]) => sum + y, 0) / cells.length
  const atoms = cells.map(
    ([x, y]) => new Vector3((x - cx) * STEP, (y - cy) * STEP, 0),
  )
  const bonds: [Vector3, Vector3][] = []
  cells.forEach(([x, y], i) =>
    cells.forEach(([u, v], j) => {
      if (j > i && Math.abs(x - u) + Math.abs(y - v) === 1)
        bonds.push([atoms[i], atoms[j]])
    }),
  )
  return { atoms, bonds }
}

function Stick({
  from,
  to,
  material,
  radius = 0.05,
}: {
  from: Vector3
  to: Vector3
  material: MeshStandardMaterial | MeshBasicMaterial
  radius?: number
}) {
  const pose = useMemo(() => {
    const direction = to.clone().sub(from)
    return {
      position: from.clone().add(to).multiplyScalar(0.5),
      quaternion: new Quaternion().setFromUnitVectors(
        UP,
        direction.clone().normalize(),
      ),
      length: direction.length(),
    }
  }, [from, to])
  return (
    <mesh
      geometry={geo.cylinder}
      material={material}
      position={pose.position}
      quaternion={pose.quaternion}
      scale={[radius * 2, pose.length, radius * 2]}
    />
  )
}

function Shape({
  cells,
  material,
  atomSize = 0.17,
}: {
  cells: [number, number][]
  material: MeshStandardMaterial | MeshBasicMaterial
  atomSize?: number
}) {
  const { atoms, bonds } = useMemo(() => atomsOf(cells), [cells])
  return (
    <>
      {atoms.map((atom, i) => (
        <mesh
          key={i}
          geometry={geo.sphere}
          material={material}
          position={atom}
          scale={atomSize}
        />
      ))}
      {bonds.map(([a, b], i) => (
        <Stick key={i} from={a} to={b} material={material} />
      ))}
    </>
  )
}

const tray = (index: number): V3 => [
  index < 3 ? -1.6 : 1.6,
  0.7 - (index % 3) * 0.7,
  0.55,
]
const pointer = (on: boolean) => () =>
  (document.body.style.cursor = on ? 'pointer' : '')

function Hit({
  onClick,
  scale = 0.78,
}: {
  onClick: () => void
  scale?: number
}) {
  return (
    <mesh
      geometry={geo.slab}
      material={hidden}
      scale={[scale, scale, 0.2]}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation()
        onClick()
      }}
      onPointerOver={pointer(true)}
      onPointerOut={pointer(false)}
    />
  )
}

function Piece({
  index,
  dock,
  phase,
  onPick,
}: {
  index: number
  dock: Dock
  phase: Phase
  onPick: (index: number) => void
}) {
  const ref = useRef<Group>(null)
  const locked = isLocked(dock, index)
  const slot = dock.placed[index]
  const selected = dock.selected === index
  const pending = isPending(dock)
  const turn = -candidates[index].start * (Math.PI / 2)
  useFrame(({ clock }, dt) => {
    const group = ref.current
    if (!group) return
    const k = 1 - Math.exp(-dt * 9)
    const t = clock.elapsedTime
    const goal = scratch.set(...tray(index))
    if (slot !== null)
      goal.set(
        ...slots[slot].socket,
        locked ? 0.02 : pending ? 0.12 + Math.sin(t * 18) * 0.03 : 0.3,
      )
    else if (selected) goal.z += 0.35 + Math.sin(t * 5) * 0.05
    group.position.lerp(goal, k)
    const target = slot === null ? turn : 0
    let angle = group.rotation.z
    while (target - angle > Math.PI) angle += Math.PI * 2
    while (angle - target > Math.PI) angle -= Math.PI * 2
    group.rotation.z = angle + (target - angle) * k
    const size = slot !== null ? 0.8 : selected ? 1.18 : 1
    group.scale.setScalar(group.scale.x + (size - group.scale.x) * k)
  })
  if (phase !== 'dock' && slot === null) return null
  return (
    <group ref={ref} position={tray(index)} rotation={[0, 0, turn]}>
      <Shape
        cells={candidates[index].cells}
        material={phase === 'dock' ? candy[index] : gold}
      />
      {phase === 'dock' && !locked && <Hit onClick={() => onPick(index)} />}
      {phase === 'dock' && locked && (
        <>
          <Flash size={0.55} color={candidates[index].color} />
          <Confetti
            count={14}
            speed={1.2}
            up={1.4}
            gravity={3}
            size={0.05}
            life={0.9}
            colors={[candidates[index].color, '#ffffff']}
          />
        </>
      )}
    </group>
  )
}

function Protein() {
  const lumps: [number, number, number, number, string][] = [
    [0, 0, 0, 2.4, '#9fb6e8'],
    [-0.95, 0.55, -0.35, 1.6, '#b6c6ee'],
    [1, 0.45, -0.25, 1.7, '#8aa5df'],
    [-0.75, -0.65, 0.05, 1.5, '#a8bdea'],
    [0.85, -0.7, -0.05, 1.5, '#b6c6ee'],
    [0.1, 1.05, -0.45, 1.5, '#8aa5df'],
    [-0.1, -1.0, -0.35, 1.4, '#9fb6e8'],
    [-1.55, -0.1, -0.6, 1.1, '#8aa5df'],
    [1.6, 0, -0.6, 1.1, '#a8bdea'],
  ]
  return (
    <group position={PROTEIN}>
      {lumps.map(([x, y, z, size, color], i) => (
        <Clay
          key={i}
          shape="sphere"
          color={color}
          size={size}
          position={[x, y, z]}
        />
      ))}
      <Clay
        shape="sphere"
        color="#4c5f97"
        size={[2.05, 1.85, 0.5]}
        position={[0, 0, 1.08]}
      />
      <Clay
        shape="torus"
        color="#c4d2f0"
        size={[1.98, 1.8, 0.8]}
        position={[0, 0, 1.12]}
      />
    </group>
  )
}

function Halo() {
  const ring = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    if (ring.current) ring.current.rotation.z = clock.elapsedTime * 0.4
  })
  return (
    <group>
      <mesh
        ref={ring}
        geometry={geo.torus}
        material={gold}
        position={[0, 0, -0.5]}
        scale={2.1}
      />
      <mesh
        geometry={geo.cone}
        material={beam}
        position={[0, 2.2, 0]}
        scale={[2.2, 5, 2.2]}
        rotation={[Math.PI, 0, 0]}
      />
      <Sparkles
        count={90}
        scale={[3.4, 3.4, 2.4]}
        size={6}
        speed={0.5}
        color="#ffd36b"
      />
      <Sparkles
        count={30}
        scale={[4.5, 4, 3]}
        size={9}
        speed={0.25}
        color="#ffffff"
      />
      <Flash size={2.4} life={0.9} />
      <Confetti
        count={140}
        speed={3.6}
        up={4.2}
        gravity={5}
        life={2.6}
        size={0.11}
      />
      <pointLight color="#ffcf6b" intensity={6} distance={7} />
    </group>
  )
}

export function Docking({
  dock,
  phase,
  onPick,
  onDrop,
}: {
  dock: Dock
  phase: Phase
  onPick: (index: number) => void
  onDrop: (slot: number) => void
}) {
  const molecule = useRef<Group>(null)
  const raised = phase !== 'dock'
  const pocket = useMemo(() => new Vector3(...POCKET), [])
  const grail = useMemo(() => new Vector3(...GRAIL), [])
  useFrame(({ clock }, dt) => {
    const group = molecule.current
    if (!group) return
    const k = 1 - Math.exp(-dt * 2.2)
    const t = clock.elapsedTime
    group.position.lerp(
      raised
        ? scratch.copy(grail).setY(grail.y + Math.sin(t * 1.4) * 0.08)
        : pocket,
      k,
    )
    group.rotation.y = raised
      ? Math.sin(t * 0.9) * 0.45
      : group.rotation.y * (1 - k)
    const scale = raised ? 1.35 : 1
    group.scale.setScalar(group.scale.x + (scale - group.scale.x) * k)
    const glow = raised ? 0.5 + 0.25 * Math.sin(t * 3) : 0.2
    gold.emissiveIntensity += (glow - gold.emissiveIntensity) * k
  })
  const links = slots.map(({ socket }) => new Vector3(socket[0], socket[1], 0))
  return (
    <>
      <Protein />
      <group ref={molecule} position={POCKET}>
        {phase === 'dock' &&
          slots.map(({ socket }, slot) => (
            <group key={slot} position={[socket[0], socket[1], -0.02]}>
              <mesh
                geometry={geo.sphere}
                material={ghost}
                scale={[0.72, 0.72, 0.06]}
              />
              {dock.selected !== null && occupant(dock, slot) === -1 && (
                <Hit onClick={() => onDrop(slot)} scale={0.9} />
              )}
            </group>
          ))}
        {candidates.map((_, i) => (
          <Piece key={i} index={i} dock={dock} phase={phase} onPick={onPick} />
        ))}
        {raised &&
          links.map((from, i) => (
            <Stick
              key={i}
              from={from}
              to={links[(i + 1) % links.length]}
              material={gold}
              radius={0.035}
            />
          ))}
      </group>
      {raised && (
        <group position={GRAIL}>
          <Halo />
        </group>
      )}
    </>
  )
}
