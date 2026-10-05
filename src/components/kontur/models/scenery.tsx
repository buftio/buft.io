'use client'

import { Instanced, type Item } from '../../marketdata/models/clay'
import { BORDER, H, W, toWorld } from '../map'
import { Bake, Clay, Slim } from './kit'
import { SceneryLife } from './scenery-life'

const edge = toWorld(BORDER, 0)[0]
const green = ['#83ac83', '#91b78b', '#a5c596']
const flowers = ['#efaa9d', '#f3cf77', '#e8d9c4', '#b9a4cc']
const trees = [
  [-W / 2 - 2, -2, 1.1],
  [-W / 2 - 3.8, 1, 1.25],
  [-W / 2 - 5.5, -4, 1.4],
  [-W / 2 - 2.4, -H / 2 - 2.1, 1.3],
  [-W / 2 + 1.5, -H / 2 - 2, 1.1],
  [-W / 2 + 4.5, -H / 2 - 3.5, 1.3],
  [edge - 3, -H / 2 - 2, 1.15],
  [edge - 0.9, -H / 2 - 4.8, 1.4],
]
const palms = [
  [W / 2 + 2, -2.8],
  [W / 2 + 3.7, 0.7],
  [W / 2 + 5.8, -4.1],
  [W / 2 - 1.6, -H / 2 - 2.1],
  [edge + 2.4, -H / 2 - 3.3],
]
const trunks: Item[] = trees.map(([x, z, s]) => ({
  position: [x, s * 0.78, z],
  scale: [0.24 * s, 1.6 * s, 0.24 * s],
  color: '#a08060',
}))
const leaves: Item[] = trees.flatMap(([x, z, s], i) =>
  Array.from({ length: 4 }, (_, j) => ({
    position: [
      x + Math.sin(j * 2.4) * s * 0.43,
      s * (1.65 + (j === 0 ? 0.4 : 0)),
      z + Math.cos(j * 2.4) * s * 0.43,
    ] as [number, number, number],
    scale: [s * 1.3, s * 1.4, s * 1.3] as [number, number, number],
    color: green[(i + j) % green.length],
  })),
)
const bushes: Item[] = Array.from({ length: 32 }, (_, i) => {
  const front = i < 20
  const x = front
    ? -W / 2 - 4 + i * 1.5
    : (i % 2 ? -1 : 1) * (W / 2 + 1.5 + (i % 3))
  const z = front ? H / 2 + 2.4 + Math.sin(i * 2) * 0.4 : -H / 2 - 1.5 - (i % 4)
  return {
    position: [x, 0.22, z],
    scale: [0.9, 0.5, 0.65],
    color: x < edge ? green[i % 3] : '#b4b98a',
  }
})
const petals: Item[] = Array.from({ length: 108 }, (_, i) => {
  const cluster = Math.floor(i / 12)
  const x = -W / 2 - 2 + cluster * 3.2 + Math.sin(i * 2.4) * 0.5
  const z = H / 2 + 1.2 + Math.cos(i * 2.4) * 0.35
  return {
    position: [x, 0.23 + (i % 3) * 0.035, z],
    scale: [0.16, 0.09, 0.16],
    color: flowers[i % 4],
  }
})
const stones: Item[] = Array.from({ length: 54 }, (_, i) => ({
  position: [
    -W / 2 - 6 + i * 0.64,
    0.005,
    H / 2 + 3.7 + Math.sin(i * 0.34) * 0.3,
  ],
  scale: [0.53, 0.065, 0.62],
  rotation: [0, Math.sin(i * 4) * 0.14, 0],
  color: i * 0.64 - W / 2 - 6 < edge ? '#ddd2b8' : '#e9c9a0',
}))

function House({
  x,
  z,
  blue = false,
}: {
  x: number
  z: number
  blue?: boolean
}) {
  return (
    <group position={[x, 0, z]} rotation={[0, blue ? 0.14 : -0.12, 0]}>
      <Clay color="#e8ddc3" size={[1.65, 1.35, 1.4]} position={[0, 0.7, 0]} />
      <Clay
        color={blue ? '#86aaa8' : '#d79379'}
        size={[1.88, 0.18, 1.7]}
        position={[0, 1.42, 0]}
      />
      {[-1, 1].map((s) => (
        <Clay
          key={s}
          shape="wedge"
          color={blue ? '#86aaa8' : '#d79379'}
          size={[0.94, 0.7, 1.7]}
          position={[s * -0.94, 1.5, 0]}
          rotation={[0, s === 1 ? 0 : Math.PI, 0]}
        />
      ))}
      <Clay
        color="#9f7961"
        size={[0.43, 0.86, 0.06]}
        position={[-0.28, 0.44, 0.72]}
      />
      <Clay
        color="#f4d692"
        size={[0.42, 0.44, 0.07]}
        position={[0.45, 0.85, 0.73]}
      />
      <Clay
        color="#fff1d6"
        size={[0.045, 0.5, 0.08]}
        position={[0.45, 0.85, 0.77]}
      />
      <Clay
        color="#fff1d6"
        size={[0.48, 0.045, 0.08]}
        position={[0.45, 0.85, 0.77]}
      />
      <Clay
        color="#e7ccb3"
        size={[0.32, 0.8, 0.32]}
        position={[0.52, 1.94, -0.32]}
      />
      <Clay
        color="#b7927e"
        size={[0.42, 0.1, 0.4]}
        position={[0.52, 2.35, -0.32]}
      />
      <Clay
        color="#cfbea5"
        size={[0.8, 0.14, 0.36]}
        position={[-0.25, 0.05, 0.94]}
      />
    </group>
  )
}

function Bench({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      {[-0.48, 0.48].map((s) => (
        <Clay
          key={s}
          color="#788e7e"
          size={[0.09, 0.45, 0.48]}
          position={[s, 0.21, 0]}
        />
      ))}
      {[0, 1, 2].map((i) => (
        <Clay
          key={i}
          color="#bb9570"
          size={[1.35, 0.09, 0.13]}
          position={[0, 0.45, i * 0.16 - 0.16]}
        />
      ))}
      {[0, 1].map((i) => (
        <Clay
          key={i}
          color="#bb9570"
          size={[1.35, 0.12, 0.075]}
          position={[0, 0.6 + i * 0.17, -0.25]}
        />
      ))}
    </group>
  )
}

function Lamp({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <Clay
        color="#73867f"
        shape="cylinder"
        size={[0.15, 1.8, 0.15]}
        position={[0, 0.9, 0]}
      />
      <Clay color="#899e8b" size={[0.36, 0.07, 0.36]} position={[0, 1.82, 0]} />
      <Clay color="#ffe4a3" size={[0.27, 0.36, 0.27]} position={[0, 2.02, 0]} />
      <Clay
        color="#899e8b"
        shape="cone"
        size={[0.5, 0.24, 0.5]}
        position={[0, 2.28, 0]}
      />
      <Clay
        color="#899e8b"
        shape="sphere"
        size={0.13}
        position={[0, 2.43, 0]}
      />
    </group>
  )
}

function Stall({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <Clay color="#c49a6f" size={[1.65, 0.7, 0.75]} position={[0, 0.36, 0]} />
      {[-0.7, 0.7].map((s) => (
        <Clay
          key={s}
          color="#a97d58"
          size={[0.07, 1.9, 0.07]}
          position={[s, 0.95, 0]}
        />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <Clay
          key={i}
          color={i % 2 ? '#f7e6be' : '#e5a16f'}
          size={[0.3, 0.13, 1.1]}
          position={[-0.75 + i * 0.3, 1.82, 0]}
          rotation={[-0.12, 0, 0]}
        />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <Clay
          key={i}
          shape="sphere"
          color={i % 2 ? '#eab85b' : '#c3b968'}
          size={0.23}
          position={[
            -0.5 + (i % 4) * 0.32,
            0.83,
            -0.15 + Math.floor(i / 4) * 0.3,
          ]}
        />
      ))}
    </group>
  )
}

export function Scenery() {
  const sides = [
    { x: -W / 2 - 3.925, color: '#cbd6ad' },
    { x: W / 2 + 3.925, color: '#e9d5b3' },
  ]
  const back = -H / 2 - 7.5
  const front = H / 2 + 7.5
  return (
    <Slim>
      <Bake>
        {sides.map(({ x, color }) => (
          <Clay
            key={x}
            color={color}
            size={[7.15, 0.1, front - back]}
            position={[x, -0.06, 0]}
          />
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <Clay
            key={i}
            color="#b3a283"
            size={[1.35, 0.025, 1]}
            position={[-W / 2 - 2 + i * 3.2, 0, H / 2 + 1.2]}
          />
        ))}
        {[-1, 1].map((s) => (
          <group key={s}>
            <Clay
              color="#cbd6ad"
              size={[edge + W / 2 + 0.35, 0.1, 7.15]}
              position={[(edge - W / 2 - 0.35) / 2, -0.06, s * (H / 2 + 3.925)]}
            />
            <Clay
              color="#e9d5b3"
              size={[W / 2 + 0.35 - edge, 0.1, 7.15]}
              position={[(edge + W / 2 + 0.35) / 2, -0.06, s * (H / 2 + 3.925)]}
            />
          </group>
        ))}
        <House x={-W / 2 + 1.5} z={-H / 2 - 4.9} />
        <House x={edge - 4.8} z={-H / 2 - 4.9} blue />
        <Bench x={-W / 2 + 1.2} z={H / 2 + 2.1} />
        <Bench x={edge - 1.8} z={H / 2 + 2.1} />
        <Bench x={W / 2 + 2.4} z={H / 2 + 1.7} />
        <Lamp x={-W / 2 - 1.8} z={2.4} />
        <Lamp x={edge - 1} z={-H / 2 - 1.7} />
        <Lamp x={W / 2 + 2} z={3.5} />
        <Stall x={W / 2 + 2.8} z={-H / 2 - 3.3} />
        <Stall x={edge + 2.8} z={-H / 2 - 5.7} />
        {Array.from({ length: 12 }, (_, i) => (
          <group key={i} position={[-W / 2 - 5.2 + i * 0.7, 0, -H / 2 - 1.25]}>
            <Clay
              color="#eee2c7"
              size={[0.12, 0.7, 0.13]}
              position={[0, 0.35, 0]}
            />
            <Clay
              color="#eee2c7"
              shape="cone"
              size={[0.16, 0.14, 0.16]}
              position={[0, 0.76, 0]}
            />
            <Clay
              color="#eee2c7"
              size={[0.71, 0.09, 0.09]}
              position={[0.32, 0.32, 0]}
            />
            <Clay
              color="#eee2c7"
              size={[0.71, 0.09, 0.09]}
              position={[0.32, 0.6, 0]}
            />
          </group>
        ))}
        {palms.map(([x, z], i) => (
          <group key={i} position={[x, 0, z]} rotation={[0, i, 0]}>
            <Clay
              color="#be9a75"
              shape="cylinder"
              size={[0.21, 2.2, 0.21]}
              position={[0, 1.1, 0]}
              rotation={[0, 0, 0.08]}
            />
            {Array.from({ length: 6 }, (_, j) => (
              <group
                key={j}
                position={[-0.08, 2.15, 0]}
                rotation={[0, (j * Math.PI) / 3, 0]}
              >
                <Clay
                  color={j % 2 ? '#99b88c' : '#83a97e'}
                  shape="sphere"
                  size={[0.42, 0.13, 1.45]}
                  position={[0, -0.04, 0.48]}
                  rotation={[0.24, 0, 0]}
                />
              </group>
            ))}
            <Clay
              color="#a88664"
              shape="sphere"
              size={[0.35, 0.25, 0.3]}
              position={[0, 1.98, 0]}
            />
          </group>
        ))}
      </Bake>
      <Instanced shape="cylinder" items={trunks} />
      <Instanced shape="sphere" items={leaves} />
      <Instanced shape="sphere" items={bushes} />
      <Instanced
        shape="cylinder"
        items={petals.map(({ position: [x, y, z] }) => ({
          position: [x, y / 2, z],
          scale: [0.022, y, 0.022],
          color: '#7c9c70',
        }))}
      />
      <Instanced shape="sphere" items={petals} />
      <Instanced items={stones} />
      <SceneryLife
        chimneys={[
          [-W / 2 + 2.02, -H / 2 - 5.22],
          [edge - 4.28, -H / 2 - 5.22],
        ]}
      />
    </Slim>
  )
}

export function Mood() {
  return (
    <>
      <color attach="background" args={['#e8e5d8']} />
      <fog attach="fog" args={['#e8e5d8', 42, 78]} />
      <hemisphereLight args={['#fff4de', '#b2c4b2', 1.9]} />
      <directionalLight
        color="#fff1d5"
        position={[-7, 14, 8]}
        intensity={1.65}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.00015}
        shadow-normalBias={0.035}
        shadow-radius={3}
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[-23, 23, 19, -19, 1, 42]}
        />
      </directionalLight>
    </>
  )
}
