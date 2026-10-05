'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import {
  Bake,
  Clay,
  Plinth,
  Slim,
  palette,
  pulse,
  type ModelProps,
} from './kit'

export function Workshop({ game }: ModelProps) {
  const press = useRef<Group>(null),
    tile = useRef<Group>(null),
    gear = useRef<Group>(null)
  useFrame(() => {
    const since = game.current.time - game.current.at.bought,
      stamp = pulse(since, 0.3),
      pop = pulse(since - 0.18, 0.42)
    if (press.current) press.current.position.y = 0.66 - stamp * 0.17
    if (tile.current) {
      tile.current.position.y = 0.39 + pop * 0.16
      tile.current.position.z = 0.64 + pop * 0.09
      tile.current.rotation.x = -pop * 0.18
    }
    if (gear.current) gear.current.rotation.z = -game.current.time * 0.55
  })
  return (
    <Slim>
      <Bake>
        <Plinth color="#e6d3ac" />
        <Clay
          color="#ecc697"
          size={[1.58, 0.72, 1.16]}
          position={[0, 0.5, -0.22]}
        />
        <Clay
          shape="slab"
          color="#b8773e"
          size={[1.66, 0.09, 1.25]}
          position={[0, 0.86, -0.2]}
        />
        {[-0.82, -0.4, 0.02].map((z) => (
          <group key={z} position={[0, 0.9, z]}>
            <Clay
              shape="wedge"
              color="#d98b31"
              size={[0.42, 0.19, 1.66]}
              rotation={[0, -Math.PI / 2, 0]}
            />
            <Clay
              shape="slab"
              color={palette.glass}
              size={[1.35, 0.105, 0.024]}
              position={[0, 0.12, 0.424]}
            />
          </group>
        ))}
        <Clay
          shape="slab"
          color={palette.rubber}
          size={[0.91, 0.065, 0.67]}
          position={[-0.05, 1.125, -0.21]}
        />
        {[-1, 1].map((s) => (
          <Clay
            key={s}
            shape="slab"
            color="#fff2cb"
            size={[0.12, 0.045, 0.44]}
            position={[-0.025, 1.18, -0.21 + s * 0.14]}
            rotation={[0, (-s * Math.PI) / 4, 0]}
          />
        ))}
        <Clay
          shape="slab"
          color={palette.terracotta}
          size={[0.23, 0.35, 0.23]}
          position={[0.61, 1.08, -0.6]}
        />
        <Clay
          shape="slab"
          color="#edc793"
          size={[0.3, 0.08, 0.3]}
          position={[0.61, 1.27, -0.6]}
        />
        <Clay
          shape="slab"
          color={palette.ink}
          size={[0.18, 0.018, 0.18]}
          position={[0.61, 1.319, -0.6]}
        />
        <Clay
          shape="slab"
          color={palette.ink}
          size={[0.68, 0.53, 0.035]}
          position={[0.13, 0.46, 0.375]}
        />
        {[-0.27, 0.53].map((x) => (
          <Clay
            key={x}
            shape="slab"
            color="#cb8134"
            size={[0.1, 0.63, 0.15]}
            position={[x, 0.47, 0.39]}
          />
        ))}
        <Clay
          shape="slab"
          color="#cb8134"
          size={[0.9, 0.12, 0.25]}
          position={[0.13, 0.82, 0.43]}
        />
        <Clay
          shape="slab"
          color={palette.rubber}
          size={[0.7, 0.12, 0.84]}
          position={[0.13, 0.28, 0.47]}
        />
        {[-0.27, 0.53].map((x) => (
          <Clay
            key={x}
            shape="slab"
            color={palette.steel}
            size={[0.09, 0.16, 0.85]}
            position={[x, 0.3, 0.47]}
          />
        ))}
        {[0.12, 0.86].map((z) => (
          <Clay
            key={z}
            shape="cylinder"
            color={palette.steel}
            size={[0.15, 0.65, 0.15]}
            position={[0.13, 0.28, z]}
            rotation={[0, 0, Math.PI / 2]}
          />
        ))}
        <group
          name="belt-press"
          ref={press}
          userData={{ live: true }}
          position={[0.13, 0.66, 0.41]}
        >
          <Clay
            shape="slab"
            color={palette.steel}
            size={[0.12, 0.22, 0.12]}
            position={[0, 0.12, 0]}
          />
          <Clay shape="slab" color="#d9a527" size={[0.57, 0.12, 0.31]} />
          <Clay
            shape="slab"
            color={palette.rubber}
            size={[0.48, 0.04, 0.25]}
            position={[0, -0.08, 0]}
          />
        </group>
        <group
          name="belt-tile"
          ref={tile}
          userData={{ live: true }}
          position={[0.13, 0.39, 0.64]}
        >
          <Clay color={palette.steel} size={[0.48, 0.08, 0.42]} />
          <Clay
            shape="slab"
            color="#56636b"
            size={[0.32, 0.025, 0.4]}
            position={[0, 0.051, 0]}
          />
          {[-1, 1].map((s) => (
            <Clay
              key={s}
              shape="slab"
              color="#d1d7d9"
              size={[0.075, 0.018, 0.19]}
              position={[s * 0.055, 0.075, 0]}
              rotation={[0, (-s * Math.PI) / 4, 0]}
            />
          ))}
        </group>
        <group position={[-0.56, 0.62, 0.4]} rotation={[-0.22, 0, 0]}>
          <Clay shape="slab" color="#fff2cb" size={[0.34, 0.39, 0.055]} />
          <Clay
            shape="cylinder"
            color="#e9b735"
            size={[0.22, 0.045, 0.22]}
            position={[0, 0.055, 0.045]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <Clay
            shape="slab"
            color="#ffe29a"
            size={[0.027, 0.095, 0.015]}
            position={[0, 0.055, 0.075]}
          />
          <Clay
            shape="slab"
            color={palette.ink}
            size={[0.17, 0.034, 0.015]}
            position={[0, -0.105, 0.035]}
          />
        </group>
        <group
          name="belt-gear"
          ref={gear}
          userData={{ live: true }}
          position={[-0.56, 0.3, 0.421]}
        >
          <Clay
            shape="cylinder"
            color="#b8773e"
            size={[0.22, 0.045, 0.22]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          {[0, 1, 2].map((i) => (
            <Clay
              key={i}
              shape="slab"
              color="#b8773e"
              size={[0.29, 0.065, 0.04]}
              rotation={[0, 0, (i * Math.PI) / 3]}
            />
          ))}
          <Clay
            shape="cylinder"
            color="#fff2cb"
            size={[0.075, 0.025, 0.075]}
            position={[0, 0, 0.035]}
            rotation={[Math.PI / 2, 0, 0]}
          />
        </group>
      </Bake>
    </Slim>
  )
}
