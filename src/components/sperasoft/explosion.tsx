'use client'

import { Instanced, geo, type Item } from '../marketdata/models/clay'
import type { SceneState } from './types'
import { at, rand } from './stage'

const BLAST_LIFE = 0.85
const unit = (v: number) => Math.min(1, Math.max(0, v))
const easeOut = (t: number) => 1 - (1 - t) ** 3
const puffs = [
  [0, 0, 1],
  [1.1, 0.5, 0.8],
  [-1, 0.7, 0.75],
  [0.5, 1.5, 0.6],
  [-0.7, -0.5, 0.7],
  [1.3, -0.3, 0.55],
  [-1.4, 1.2, 0.5],
]
type Shard = {
  dx: number
  dy: number
  speed: number
  spin: number
  color: string
}
const shardSeeds = (
  count: number,
  salt: number,
  colors: string[],
  lift: number,
): Shard[] =>
  Array.from({ length: count }, (_, i) => {
    const dx = (rand(i, salt) - 0.5) * 2
    const dy = lift + rand(i, salt + 1) * (1 - lift)
    const norm = Math.hypot(dx, dy) || 1
    return {
      dx: dx / norm,
      dy: dy / norm,
      speed: 0.75 + rand(i, salt + 2) * 0.6,
      spin: rand(i, salt + 3) * Math.PI * 2,
      color: colors[i % colors.length],
    }
  })
const sparkSeeds = shardSeeds(12, 20, ['#f2b64a', '#f6d281', '#e8944a'], 0.15)
const chunkSeeds = shardSeeds(8, 40, ['#c9a482', '#b8916c', '#8f7a5a'], 0.4)
export function Explosion({
  blast,
  reduced,
}: {
  blast: NonNullable<SceneState['explosion']>
  reduced: boolean
}) {
  const age = reduced
    ? BLAST_LIFE * 0.45
    : unit(blast.age / BLAST_LIFE) * BLAST_LIFE
  const reach = blast.radius * 0.7
  const burst = unit(age / 0.32)
  const core = unit(age / 0.2)
  const ring = unit(age / 0.6)
  const smoke = unit((age - 0.08) / (BLAST_LIFE - 0.08))
  const grow = easeOut(smoke)
  const size = blast.radius * 0.4
  const travel = easeOut(age / BLAST_LIFE)
  const fall = 55 * age * age
  const shards = (
    seeds: Shard[],
    gravity: number,
    base: number,
    fade: number,
  ) =>
    seeds.map<Item>((s, i) => ({
      position: [
        s.dx * s.speed * reach * travel,
        s.dy * s.speed * reach * travel - fall * gravity,
        3 + (i % 3) * 0.4,
      ],
      rotation: [0, 0, s.spin + age * (s.dx > 0 ? 9 : -9)],
      scale: Math.max(
        0.01,
        base *
          (0.4 + 0.6 * (1 - travel)) *
          (1 - unit((age - fade) / (BLAST_LIFE - fade))),
      ),
      color: s.color,
    }))
  const sparks = shards(sparkSeeds, 0.35, 1.2, 0.35)
  const chunks = shards(chunkSeeds, 1, 1.7, 0.5)
  return (
    <group position={at(blast, 2)}>
      {burst < 1 && (
        <>
          <mesh
            geometry={geo.sphere}
            scale={Math.max(
              0.01,
              reach * 0.75 * easeOut(burst) * (1 - 0.2 * burst),
            )}
            position={[0, 0, 2]}
            dispose={null}
          >
            <meshBasicMaterial
              color="#f0a456"
              transparent
              opacity={0.95 * (1 - burst)}
              depthWrite={false}
            />
          </mesh>
          <mesh
            geometry={geo.sphere}
            scale={Math.max(0.01, reach * 0.45 * easeOut(core))}
            position={[0, 0.5, 2.5]}
            dispose={null}
          >
            <meshBasicMaterial
              color="#fbe08a"
              transparent
              opacity={1 - core}
              depthWrite={false}
            />
          </mesh>
        </>
      )}
      {ring < 1 && (
        <mesh
          scale={Math.max(0.01, reach * 1.1 * easeOut(ring))}
          position={[0, 0, 1.5]}
          dispose={null}
        >
          <ringGeometry args={[0.86, 1, 48]} />
          <meshBasicMaterial
            color="#f3d9a0"
            transparent
            opacity={0.8 * (1 - ring)}
            depthWrite={false}
          />
        </mesh>
      )}
      <Instanced shape="sphere" items={sparks} />
      <Instanced items={chunks} />
      {smoke > 0 &&
        puffs.map(([x, y, s], i) => (
          <mesh
            key={i}
            geometry={geo.sphere}
            position={[
              x * size * grow * 0.55,
              y * size * grow * 0.5 + smoke * 4,
              i * 0.3,
            ]}
            scale={size * s * (0.3 + 0.7 * grow)}
            dispose={null}
          >
            <meshStandardMaterial
              color={i % 2 ? '#c9c1ae' : '#dcd5c4'}
              transparent
              opacity={0.85 * (1 - smoke) ** 1.2}
              roughness={1}
              depthWrite={false}
            />
          </mesh>
        ))}
    </group>
  )
}
