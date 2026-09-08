'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Group, Quaternion, Vector3 } from 'three'
import { Clay, clay, geo } from '../marketdata/models/clay'
import type { Atom, Element, Molecule } from './molecule'
import {
  BEAD_Y,
  CAMERA_DISTANCE,
  PITCH,
  TARGET_Z,
  radiusOf,
  viewFor,
  type Fit,
} from './projection'
import { tones } from './palette'
import { Scenery } from './scenery'
import type { Celebration } from './use-lab'
import type { BoardPlacement } from './board-motion'

type Props = {
  molecule: Molecule
  selected: number
  fit: Fit
  task: number
  completed: number[]
  solved: boolean
  celebration: Celebration
  overTrash: boolean
  supply: Record<Element, number>
  invitePiles: boolean
  board: BoardPlacement
  reduced: boolean
  onReady: () => void
}

const UP = new Vector3(0, 1, 0)

function Camera() {
  const get = useThree((state) => state.get)
  const size = useThree((state) => state.size)
  useLayoutEffect(() => {
    const { camera, setDpr } = get()
    const view = viewFor(size.width, size.height)
    camera.position.set(
      0,
      Math.sin(PITCH) * CAMERA_DISTANCE,
      TARGET_Z + Math.cos(PITCH) * CAMERA_DISTANCE,
    )
    camera.lookAt(0, 0, TARGET_Z)
    camera.zoom = view.unit
    camera.updateProjectionMatrix()
    setDpr(Math.min(window.devicePixelRatio, 1.5))
  }, [get, size.width, size.height])
  return null
}

function Ready({ onReady }: { onReady: () => void }) {
  useEffect(onReady, [onReady])
  return null
}

function Bond({ from, to }: { from: Atom; to: Atom }) {
  const pose = useMemo(() => {
    const a = new Vector3(from.x, BEAD_Y, from.y)
    const b = new Vector3(to.x, BEAD_Y, to.y)
    const direction = b.clone().sub(a)
    const length = direction.length()
    const quaternion = new Quaternion().setFromUnitVectors(
      UP,
      direction.normalize(),
    )
    return { position: a.add(b).multiplyScalar(0.5), quaternion, length }
  }, [from.x, from.y, to.x, to.y])
  return (
    <mesh
      geometry={geo.cylinder}
      material={clay(tones.bond)}
      position={pose.position}
      quaternion={pose.quaternion}
      scale={[0.2, pose.length, 0.2]}
      castShadow
      receiveShadow
      dispose={null}
    />
  )
}

function Bead({
  atom,
  away,
  selected,
  reduced,
}: {
  atom: Atom
  away: { x: number; y: number }
  selected: boolean
  reduced: boolean
}) {
  const radius = radiusOf(atom.element)
  const ref = useRef<Group>(null)
  const grown = useRef(reduced ? 1 : 0)
  useLayoutEffect(() => {
    ref.current?.scale.setScalar(reduced ? 1 : grown.current || 0.01)
    if (reduced && ref.current) ref.current.position.y = BEAD_Y
  }, [reduced])
  useFrame((state, delta) => {
    const group = ref.current
    if (!group || reduced) return
    grown.current = Math.min(1, grown.current + delta * 4)
    const eased = 1 - (1 - grown.current) ** 3
    group.scale.setScalar(eased)
    group.position.y =
      BEAD_Y + (selected ? Math.sin(state.clock.elapsedTime * 2.2) * 0.03 : 0)
  })
  return (
    <group ref={ref} position={[atom.x, BEAD_Y, atom.y]}>
      <Clay
        shape="sphere"
        color={atom.element === 'C' ? tones.carbon : tones.oxygen}
        size={radius * 2}
      />
      {atom.element === 'O' && (
        <Clay
          shape="sphere"
          color={tones.hydrogen}
          size={0.4}
          position={[away.x * 0.44, 0.12, away.y * 0.44]}
        />
      )}
    </group>
  )
}

function MoleculeView({
  molecule,
  selected,
  fit,
  reduced,
}: Pick<Props, 'molecule' | 'selected' | 'fit' | 'reduced'>) {
  const byId = new Map(molecule.atoms.map((atom) => [atom.id, atom]))
  const awayFrom = (atom: Atom) => {
    const bond = molecule.bonds.find((b) => b.includes(atom.id))
    const other = bond && byId.get(bond[0] === atom.id ? bond[1] : bond[0])
    if (!other) return { x: 1, y: 0 }
    const dx = atom.x - other.x
    const dy = atom.y - other.y
    const length = Math.hypot(dx, dy) || 1
    return { x: dx / length, y: dy / length }
  }
  const current = byId.get(selected)
  return (
    <group position={[fit.x, 0, fit.z]} scale={fit.scale}>
      {molecule.bonds.map(([a, b]) => {
        const from = byId.get(a)
        const to = byId.get(b)
        return from && to ? (
          <Bond key={`${a}-${b}`} from={from} to={to} />
        ) : null
      })}
      {molecule.atoms.map((atom) => (
        <Bead
          key={atom.id}
          atom={atom}
          away={awayFrom(atom)}
          selected={atom.id === selected}
          reduced={reduced}
        />
      ))}
      {current && (
        <mesh
          geometry={geo.torus}
          material={clay(tones.ring)}
          position={[current.x, 0.03, current.y]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[
            radiusOf(current.element) * 2.7,
            radiusOf(current.element) * 2.7,
            0.45,
          ]}
          receiveShadow
          dispose={null}
        />
      )}
    </group>
  )
}

function Stage(props: Props) {
  const size = useThree((state) => state.size)
  const view = useMemo(
    () => viewFor(size.width, size.height),
    [size.width, size.height],
  )
  return (
    <>
      <Camera />
      <ambientLight intensity={0.75} />
      <hemisphereLight args={['#fff7ec', '#b6a6cb', 0.9]} />
      <directionalLight
        position={[-6, 14, 9]}
        intensity={2.1}
        color="#fff3e2"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-near={1}
        shadow-camera-far={45}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      <Scenery
        view={view}
        task={props.task}
        completed={props.completed}
        solved={props.solved}
        celebration={props.celebration}
        overTrash={props.overTrash}
        supply={props.supply}
        invitePiles={props.invitePiles}
        board={props.board}
        reduced={props.reduced}
      />
      <MoleculeView
        molecule={props.molecule}
        selected={props.selected}
        fit={props.fit}
        reduced={props.reduced}
      />
      <Ready onReady={props.onReady} />
    </>
  )
}

export default function Bench(props: Props) {
  return (
    <Canvas
      orthographic
      shadows="soft"
      frameloop={props.reduced ? 'demand' : 'always'}
      resize={{ offsetSize: true, debounce: 0 }}
      camera={{ position: [0, 40, 40], zoom: 60, near: 0.1, far: 200 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
    >
      <Stage {...props} />
    </Canvas>
  )
}
