'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState, type RefObject } from 'react'
import { Plane, Raycaster, Vector2, Vector3, type Mesh } from 'three'
import {
  build,
  canBuild,
  grab,
  release,
  remove,
  step,
  type Game,
} from './factory'
import { Belts, Items, eachItem } from './items'
import { H, W, inside, type Cell, type Dir } from './map'
import { Border, Floor, Sites } from './sites'

export type Tool = 'hand' | 'belt' | 'remove'
export type Signal = 'sold' | 'denied' | 'back' | 'built' | 'coin'

type Props = {
  game: RefObject<Game>
  tool: Tool
  onChange: () => void
  onSignal: (signal: Signal) => void
  onReady: () => void
}

const ground = new Plane(new Vector3(0, 1, 0), 0)
const ray = new Raycaster()
const ndc = new Vector2()
const hit = new Vector3()
const seen = new Vector3()

function Rig() {
  const camera = useThree((state) => state.camera)
  const aspect = useThree(
    (state) => state.size.width / Math.max(1, state.size.height),
  )
  useEffect(() => {
    const half = Math.tan((20 * Math.PI) / 180)
    const fitWidth = (W / 2 + 0.6) / (half * aspect)
    const fitHeight = (H / 2 + 1.4) / half
    const distance = Math.max(fitWidth, fitHeight * 0.8)
    camera.position.set(0, distance * 0.82, distance * 0.58)
    camera.lookAt(0, 0, 0.4)
  }, [camera, aspect])
  return null
}

const toCell = (point: Vector3): Cell => [
  Math.floor(point.x + W / 2),
  Math.floor(point.z + H / 2),
]

function dirTo(from: Cell, to: Cell): Dir {
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 0 : 2
  return dy > 0 ? 1 : 3
}

function Input({ game, tool, onSignal }: Omit<Props, 'onChange' | 'onReady'>) {
  const camera = useThree((state) => state.camera)
  const canvas = useThree((state) => state.gl.domElement)
  const hand = useRef<{ x: number; z: number } | null>(null)
  const cursor = useRef<Mesh>(null)
  const [hover, setHover] = useState<Cell | null>(null)

  useEffect(() => {
    const state = game.current
    let down: { x: number; y: number; cell: Cell; moved: boolean } | null = null
    let last: Cell | null = null
    const pick = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      ndc.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      )
      ray.setFromCamera(ndc, camera)
      return ray.ray.intersectPlane(ground, hit) ? hit.clone() : null
    }
    const nearest = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      let best: { id: number; d: number } | null = null
      eachItem(game.current, 0, null, ({ item, x, y, z }) => {
        seen.set(x, y, z).project(camera)
        const sx = rect.left + ((seen.x + 1) / 2) * rect.width
        const sy = rect.top + ((1 - seen.y) / 2) * rect.height
        const d = Math.hypot(sx - event.clientX, sy - event.clientY)
        if (d < 34 && (!best || d < best.d)) best = { id: item.id, d }
      })
      return best as { id: number; d: number } | null
    }
    const lay = (cell: Cell) => {
      if (!last) return
      let at = last
      while (at[0] !== cell[0] || at[1] !== cell[1]) {
        const dir = dirTo(at, cell)
        const next: Cell = [
          at[0] + [1, 0, -1, 0][dir],
          at[1] + [0, 1, 0, -1][dir],
        ]
        build(game.current, at[0], at[1], dir)
        if (build(game.current, next[0], next[1], dir)) onSignal('built')
        at = next
      }
      last = cell
    }
    const onDown = (event: PointerEvent) => {
      if (event.button > 0) return
      const point = pick(event)
      if (!point) return
      const cell = toCell(point)
      down = { x: event.clientX, y: event.clientY, cell, moved: false }
      if (tool === 'hand') {
        const found = nearest(event)
        if (found && grab(game.current, found.id))
          hand.current = { x: point.x, z: point.z }
      } else if (tool === 'belt') last = cell
      else if (remove(game.current, ...cell)) onSignal('built')
      canvas.setPointerCapture(event.pointerId)
    }
    const onMove = (event: PointerEvent) => {
      const point = pick(event)
      const cell = point ? toCell(point) : null
      setHover((old) =>
        cell && inside(...cell)
          ? old && old[0] === cell[0] && old[1] === cell[1]
            ? old
            : cell
          : null,
      )
      if (!down || !point || !cell) return
      if (Math.hypot(event.clientX - down.x, event.clientY - down.y) > 6)
        down.moved = true
      if (tool === 'hand' && hand.current)
        hand.current = { x: point.x, z: point.z }
      if (
        tool === 'belt' &&
        last &&
        (cell[0] !== last[0] || cell[1] !== last[1])
      )
        lay(cell)
      if (tool === 'remove' && remove(game.current, ...cell)) onSignal('built')
    }
    const onUp = (event: PointerEvent) => {
      if (!down) return
      const point = pick(event)
      const cell = point ? toCell(point) : down.cell
      if (tool === 'hand' && game.current.held) {
        const result = release(game.current, ...cell)
        onSignal(result === 'taken' ? 'sold' : result)
        hand.current = null
      }
      if (tool === 'belt' && !down.moved) {
        const belt = game.current.belts.get(cell[1] * W + cell[0])
        const dir = belt ? (((belt.dir + 1) % 4) as Dir) : 0
        if (build(game.current, cell[0], cell[1], dir)) onSignal('built')
      }
      down = null
      last = null
    }
    canvas.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      canvas.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      if (state.held) release(state, -1, -1)
    }
  }, [camera, canvas, game, tool, onSignal])

  const ok =
    hover &&
    (tool === 'remove'
      ? game.current.belts.get(hover[1] * W + hover[0])?.fixed === false
      : canBuild(game.current, ...hover))
  return (
    <>
      <Items game={game} hand={hand} />
      {hover && tool !== 'hand' && (
        <mesh
          ref={cursor}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[hover[0] - W / 2 + 0.5, 0.13, hover[1] - H / 2 + 0.5]}
        >
          <planeGeometry args={[0.96, 0.96]} />
          <meshBasicMaterial
            color={!ok ? '#e8574a' : tool === 'remove' ? '#e8574a' : '#4fd18b'}
            transparent
            opacity={ok ? 0.45 : 0.2}
            depthWrite={false}
          />
        </mesh>
      )}
    </>
  )
}

const layoutOf = (game: Game) => ({
  version: game.version,
  belts: [...game.belts].map(([at, belt]): [number, Dir] => [at, belt.dir]),
  registered: game.registered,
  banks: game.banks,
  rocket: game.rocket,
})

function Scene({ game, tool, onChange, onSignal, onReady }: Props) {
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
      <Rig />
      <color attach="background" args={['#dfe8f5']} />
      <hemisphereLight args={['#ffffff', '#b9c4d8', 1.7]} />
      <directionalLight
        position={[5, 12, 7]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[-13, 13, 9, -9, 1, 30]}
        />
      </directionalLight>
      <Floor />
      <Border game={game} />
      <Belts belts={layout.belts} />
      <Sites state={layout} />
      <Input game={game} tool={tool} onSignal={onSignal} />
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
