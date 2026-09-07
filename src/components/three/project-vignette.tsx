'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import {
  ContactShadows,
  OrbitControls,
  useAnimations,
  useGLTF,
} from '@react-three/drei'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { clone } from 'three/addons/utils/SkeletonUtils.js'
import { PCFShadowMap } from 'three'
import type { Project } from '@/lib/projects'
import { ProjectWorld } from './project-worlds'

function Conversation({
  paused,
  onBeat,
}: {
  paused: boolean
  onBeat: (beat: number) => void
}) {
  const source = useGLTF('/glite-room.glb')
  const scene = useMemo(() => clone(source.scene), [source.scene])
  const { actions } = useAnimations(source.animations, scene)
  const last = useRef(-1)
  useEffect(() => {
    const action = actions.Conversation
    if (!action) return
    action.play()
    return () => {
      action.stop()
    }
  }, [actions])
  useEffect(() => {
    if (actions.Conversation) actions.Conversation.paused = paused
  }, [actions, paused])
  useFrame(() => {
    const beat = Math.floor((actions.Conversation?.time ?? 0) / 4)
    if (beat !== last.current) {
      last.current = beat
      onBeat(beat)
    }
  })
  return <primitive object={scene} />
}

const dialogues = [
  ['I would like a coffee, please.', 'Perfect. And how do you take it?'],
  ['Yesterday I went to the museum.', 'What was your favorite part?'],
  ['Could you say that a little slower?', 'Of course. Take your time.'],
]

function Ready({ onReady }: { onReady: () => void }) {
  useEffect(onReady, [onReady])
  return null
}

export default function ProjectVignette({
  project,
  reduced,
  onReady,
}: {
  project: Project
  reduced: boolean
  onReady?: () => void
}) {
  const [beat, setBeat] = useState(0)
  const [line, setLine] = useState(0)
  const [ready, setReady] = useState(false)
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null)
  const conversation = project.scene === 'conversation'
  const cameraPosition: [number, number, number] = conversation
    ? [5, 4, 6]
    : [4.5, 3.5, 6]
  const cameraTarget: [number, number, number] = conversation
    ? [0, 0.9, -0.3]
    : [0, 0.6, 0]
  const resetView = () => {
    const current = controls.current
    if (!current) return
    current.object.position.set(...cameraPosition)
    current.target.set(...cameraTarget)
    current.update()
  }
  return (
    <figure className={`project-vignette vignette-${project.id}`}>
      <div className={`mini-world ${ready ? 'is-ready' : ''}`}>
        <Canvas
          shadows={{ type: PCFShadowMap }}
          dpr={[1, 1.5]}
          camera={{ position: cameraPosition, fov: conversation ? 26 : 29 }}
        >
          <color
            attach="background"
            args={[conversation ? '#dbe3d5' : '#e3ded2']}
          />
          <ambientLight intensity={1.0} />
          <hemisphereLight args={['#fff1d5', '#aec1b7', 1.0]} />
          <directionalLight
            position={[3, 6, 5]}
            intensity={2}
            color="#fff2db"
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <Suspense fallback={null}>
            {conversation ? (
              <Conversation paused={reduced} onBeat={setBeat} />
            ) : (
              <ProjectWorld project={project} paused={reduced} />
            )}
            <ContactShadows
              position={[0, -0.25, 0]}
              opacity={0.28}
              scale={11}
              blur={2.5}
              far={5}
              resolution={256}
              frames={1}
            />
            <Ready
              onReady={() => {
                setReady(true)
                onReady?.()
              }}
            />
          </Suspense>
          <OrbitControls
            ref={controls}
            target={cameraTarget}
            enableZoom={false}
            enablePan={false}
            minPolarAngle={0.5}
            maxPolarAngle={1.5}
            minAzimuthAngle={-0.5}
            maxAzimuthAngle={1.1}
          />
        </Canvas>
        {conversation && (
          <div className={`conversation-bubble speaker-${beat}`}>
            <span>{beat === 0 ? 'YOU' : 'AI TUTOR'}</span>
            <p>{dialogues[line][beat]}</p>
          </div>
        )}
        <div className="world-controls">
          <button onClick={resetView} aria-label="Reset scene view">
            <RotateCcw size={14} />
          </button>
        </div>
        <span className="drag-hint">DRAG TO LOOK AROUND</span>
      </div>
      <figcaption>
        <span>
          {conversation ? 'An illustrated conversation.' : project.summary}
        </span>
        {conversation && (
          <button
            onClick={() => {
              setLine((value) => (value + 1) % dialogues.length)
              resetView()
            }}
          >
            Another conversation <span aria-hidden="true">↗</span>
          </button>
        )}
      </figcaption>
    </figure>
  )
}
