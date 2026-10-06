'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { MathUtils, Vector3, type PerspectiveCamera } from 'three'
import { Sparkles } from '@react-three/drei'
import { Arena } from './arena'
import type { Game } from './defense'
import type { Dock } from './dock'
import { Docking } from './docking'
import { Confetti, Flash } from './fx'
import { Air, Lab, Researchers, Rug } from './environment'
import { ARENA, PIG, stations, timeline, type Phase } from './layout'
import { Slim } from './bake'
import { Patient, Pig } from './models'
import { Poke } from './poke'
import { RollSequence } from './syringe'

type Props = {
  phase: Phase
  dock: Dock
  game: RefObject<Game>
  reduced: boolean
  onTap: (index: number) => void
  onMove: (index: number, slot: number | null) => void
  onDrop: (slot: number) => void
  onGameChange: () => void
  onReady: () => void
  onPig: (streak: number) => void
}

function CameraRig({ phase, reduced }: { phase: Phase; reduced: boolean }) {
  const camera = useThree((state) => state.camera)
  const aspect = useThree(
    (state) => state.size.width / Math.max(1, state.size.height),
  )
  const fov =
    aspect < 0.75
      ? MathUtils.radToDeg(
          2 * Math.atan((Math.tan(MathUtils.degToRad(20)) * 0.75) / aspect),
        )
      : 40
  const look = useRef(new Vector3(...stations.dock.target))
  const first = useRef(true)
  const goal = useMemo(() => {
    const narrow = aspect < 1
    const lift = new Vector3(0, narrow && phase === 'dock' ? 0.6 : 0, 0)
    const target = new Vector3(...stations[phase].target)
    const position = new Vector3(...stations[phase].position)
      .sub(target)
      .multiplyScalar(narrow ? 1.45 : 1)
      .add(target)
      .add(lift)
    return { position, target: target.add(lift) }
  }, [phase, aspect])
  useFrame((state, dt) => {
    const lens = state.camera as PerspectiveCamera
    const { width, height } = state.size
    lens.fov = fov
    lens.setViewOffset(
      width,
      height,
      aspect > 1.7 ? width * -0.16 : 0,
      0,
      width,
      height,
    )
    const k =
      reduced || first.current
        ? 1
        : 1 - Math.exp(-dt * (phase === 'roll' ? 3 : 1.8))
    first.current = false
    camera.position.lerp(goal.position, k)
    look.current.lerp(goal.target, k)
    camera.lookAt(look.current)
  })
  return null
}

function usePhaseClock(phase: Phase) {
  const since = useRef(0)
  const pending = useRef(true)
  useEffect(() => {
    pending.current = true
  }, [phase])
  useFrame(({ clock }) => {
    if (!pending.current) return
    since.current = clock.elapsedTime
    pending.current = false
  }, -1)
  return since
}

function Ready({ onReady }: { onReady: () => void }) {
  useEffect(onReady, [onReady])
  return null
}

function Scene({
  phase,
  dock,
  game,
  reduced,
  onTap,
  onMove,
  onDrop,
  onGameChange,
  onReady,
  onPig,
}: Props) {
  const since = usePhaseClock(phase)
  const hurt = useRef(-10)
  useFrame(({ clock }) => {
    if (phase === 'play' && game.current.time - game.current.hurt < 0.05)
      hurt.current = clock.elapsedTime
  })
  const arena =
    phase === 'ready' || phase === 'play' || phase === 'won' || phase === 'lost'
  const pigHome = phase === 'dock' || phase === 'grail' || phase === 'papers'
  return (
    <>
      <CameraRig phase={phase} reduced={reduced} />
      <Ready onReady={onReady} />
      <color attach="background" args={['#dfe8f5']} />
      <fog attach="fog" args={['#dfe8f5', 10, 30]} />
      <hemisphereLight args={['#ffffff', '#b9c4d8', 1.6]} />
      <directionalLight
        position={[6, 10, 6]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[-12, 12, 12, -12, 1, 30]}
        />
      </directionalLight>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[40, 48]} />
        <meshStandardMaterial color="#eaf1fc" roughness={1} />
      </mesh>
      <Air />
      {!arena && (
        <Docking
          dock={dock}
          phase={phase}
          onTap={onTap}
          onMove={onMove}
          onDrop={onDrop}
        />
      )}
      {!arena && <Lab />}
      {(phase === 'grail' || phase === 'papers') && (
        <Researchers phase={phase} />
      )}
      <group position={ARENA}>
        {arena && <Rug />}
        <Slim>
          <Patient
            pose={
              phase === 'won'
                ? 'dance'
                : phase === 'lost'
                  ? 'recline'
                  : phase === 'ready' || phase === 'play'
                    ? 'scared'
                    : 'stand'
            }
            hurt={hurt}
          />
        </Slim>
        {pigHome && (
          <Poke enabled={phase === 'papers'} position={PIG} onPoke={onPig}>
            <Slim>
              <Pig />
            </Slim>
          </Poke>
        )}
        {phase === 'roll' && (
          <Slim>
            <Pig position={PIG} since={since} delay={timeline.roll.hit} />
          </Slim>
        )}
        {phase === 'roll' && <RollSequence since={since} />}
        {arena && (
          <Arena
            game={game}
            playing={phase === 'play'}
            onChange={onGameChange}
          />
        )}
        {phase === 'won' && (
          <>
            <Confetti
              position={[0, 1.3, 0]}
              count={110}
              repeat={1.7}
              life={1.7}
              speed={2.4}
              up={5.5}
              gravity={6}
              size={0.1}
            />
            <Sparkles
              count={60}
              scale={[4, 3, 4]}
              position={[0, 1.4, 0]}
              size={7}
              speed={0.6}
              color="#ffd36b"
            />
            <Flash position={[0, 1.2, 0]} size={2.2} life={0.9} />
          </>
        )}
      </group>
    </>
  )
}

export default function World(props: Props) {
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.5]}
      resize={{ offsetSize: true, debounce: 0 }}
      camera={{ fov: 40, near: 0.1, far: 80, position: stations.dock.position }}
    >
      <Scene {...props} />
    </Canvas>
  )
}
