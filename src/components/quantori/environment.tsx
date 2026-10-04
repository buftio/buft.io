'use client'

import { Sparkles } from '@react-three/drei'
import { Bake } from './bake'
import { PROTEIN } from './docking'
import type { Phase, V3 } from './layout'
import {
  Bench,
  Flasks,
  Microscope,
  Monitor,
  Plant,
  Scientist,
  ServerRack,
  Stool,
  Whiteboard,
} from './models'
import { Thought, type Idea } from './thoughts'

const crew: {
  angle: number
  action: 'think' | 'write' | 'peer'
  ideas: Idea[]
}[] = [
  { angle: -1.7, action: 'write', ideas: ['chart', 'molecule'] },
  { angle: -1.15, action: 'think', ideas: ['question', 'eureka'] },
  { angle: -0.6, action: 'peer', ideas: ['molecule', 'question'] },
  { angle: 0.6, action: 'think', ideas: ['eureka', 'chart'] },
  { angle: 1.15, action: 'write', ideas: ['molecule', 'eureka'] },
  { angle: 1.7, action: 'peer', ideas: ['question', 'chart'] },
]

export function Researchers({ phase }: { phase: Phase }) {
  const cheering = phase === 'grail'
  return (
    <Bake>
      {crew.map(({ angle, action, ideas }, i) => {
        const x = PROTEIN[0] + Math.sin(angle) * 2.6
        const z = PROTEIN[2] + Math.cos(angle) * 2.6
        return (
          <group key={i} position={[x, 0, z]}>
            <Scientist
              variant={i}
              action={cheering ? 'cheer' : action}
              rotation={[0, angle + Math.PI, 0]}
            />
            {!cheering && (
              <Thought
                position={[0.25, 1.55, 0]}
                ideas={ideas}
                offset={i * 1.7}
              />
            )}
          </group>
        )
      })}
    </Bake>
  )
}

function Rack({ position, rotation = 0 }: { position: V3; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {[-0.5, 0, 0.5].map((x) => (
        <ServerRack key={x} position={[x, 0, 0]} />
      ))}
    </group>
  )
}

/** The lab around the protein: the supercomputer, benches, a whiteboard, plants. */
export function Lab() {
  return (
    <Bake>
      <Rack position={[-5, 0, -7.2]} rotation={0.35} />
      <group position={[-4.9, 0, -3.6]} rotation={[0, 1.05, 0]}>
        <Bench />
        <Monitor position={[0.35, 0.86, 0]} />
        <Flasks position={[-0.55, 0.86, 0.05]} scale={0.8} />
        <Stool position={[0, 0, 0.75]} />
      </group>
      <group position={[4.9, 0, -4.4]} rotation={[0, -0.95, 0]}>
        <Bench />
        <Microscope position={[-0.45, 0.86, 0]} />
        <Flasks position={[0.45, 0.86, 0]} />
        <Stool position={[-0.3, 0, 0.75]} />
      </group>
      <Whiteboard position={[2.4, 0, -7.6]} rotation={[0, -0.25, 0]} />
      <Plant position={[-6.4, 0, -1.4]} scale={1.2} />
      <Plant position={[6.6, 0, -6.6]} scale={1.4} />
      <Plant position={[-2.6, 0, -8]} />
    </Bake>
  )
}

/** Soft dust motes floating through the whole scene. */
export function Air() {
  return (
    <Sparkles
      count={70}
      scale={[22, 6, 16]}
      position={[1.5, 3, -2]}
      size={2.5}
      speed={0.15}
      opacity={0.5}
      color="#ffffff"
    />
  )
}

/** A soft rug under the patient that marks how close the viruses may come. */
export function Rug() {
  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
        receiveShadow
      >
        <circleGeometry args={[1.25, 48]} />
        <meshStandardMaterial color="#cfe0f7" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <ringGeometry args={[1.12, 1.22, 48]} />
        <meshStandardMaterial color="#ffffff" roughness={1} />
      </mesh>
    </group>
  )
}
