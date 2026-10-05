'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState, type RefObject } from 'react'
import { Rig } from './camera'
import { step, type Game } from './factory'
import { Flood } from './flood'
import { Input, type Look } from './input'
import { Belts } from './items'
import { Mood, Scenery } from './models/scenery'
import type { Dir } from './map'
import { Floor, Sites } from './sites'

export type Signal =
  | 'sold'
  | 'denied'
  | 'back'
  | 'built'
  | 'coin'
  | 'broke'
  | 'lift'

type Props = {
  game: RefObject<Game>
  onChange: () => void
  onSignal: (signal: Signal) => void
  onInspect: (look: Look) => void
  onReady: () => void
}

const layoutOf = (game: Game) => ({
  version: game.version,
  belts: [...game.belts].map(([at, belt]): [number, Dir] => [at, belt.dir]),
  registered: game.registered,
  minted: game.minted,
  banks: game.banks,
  rocket: game.rocket,
  launched: game.launched,
})

function Scene({ game, onChange, onSignal, onInspect, onReady }: Props) {
  const [layout, setLayout] = useState(() => layoutOf(game.current))
  const tick = useRef(0)
  useEffect(onReady, [onReady])
  useFrame((_, dt) => {
    const state = game.current
    const before = state.version
    step(state, Math.min(dt, 0.05))
    tick.current += dt
    if (state.version !== before || tick.current > 0.25) {
      tick.current = 0
      if (state.version !== layout.version) setLayout(layoutOf(state))
      onChange()
    }
  })
  return (
    <>
      <Rig game={game} />
      <Mood />
      <Scenery />
      <Floor />
      <Belts belts={layout.belts} />
      <Sites game={game} state={layout} />
      <Input game={game} onSignal={onSignal} onInspect={onInspect} />
      {layout.launched && <Flood game={game} />}
    </>
  )
}

export default function World(props: Props) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      resize={{ offsetSize: true, debounce: 0 }}
      camera={{ fov: 40, near: 0.1, far: 80, position: [0, 14, 10] }}
    >
      <Scene {...props} />
    </Canvas>
  )
}
