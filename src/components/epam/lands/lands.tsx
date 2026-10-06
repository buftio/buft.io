'use client'

import { Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { X } from 'lucide-react'
import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
  type RefObject,
} from 'react'
import * as THREE from 'three'
import { explain } from '../war/explain'
import { Garrison } from '../war/garrison'
import { fogged, landFade } from '../war/fog'
import { CELL } from '../war/sim'
import { Clouds, thin } from './clouds'
import { LORE } from './lore'
import { LANDS, type Land, type SceneProps } from './registry'
import { field } from './threat'

const MOUNT = 0.05
const KEEP = 0.035
const NEAR = 1.15
const FAR = 2.5
const WAIT = 3
const ORDER = 45
const SETTLE = 20
const CHECK = 6
const spot = new THREE.Vector3()

function place(
  el: THREE.Object3D,
  camera: THREE.Camera,
  size: { width: number; height: number },
) {
  if (innerWidth <= 700 || innerHeight <= 500)
    return [size.width / 2, size.height]
  spot.setFromMatrixPosition(el.matrixWorld).project(camera)
  return [((spot.x + 1) * size.width) / 2, ((1 - spot.y) * size.height) / 2]
}

function settle(root: THREE.Object3D) {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.material) return
    if (mesh.renderOrder === 0) mesh.renderOrder = ORDER
    for (const m of Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material]) {
      fogged(m, true)
      if (!m.transparent) {
        m.transparent = true
        m.needsUpdate = true
      }
    }
  })
}

class Quiet extends Component<
  { id: string; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: Error) {
    console.error(`land ${this.props.id} failed`, error)
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

function Ready({
  root,
  onReady,
}: {
  root: RefObject<THREE.Group | null>
  onReady: () => void
}) {
  const gl = useThree((state) => state.gl)
  const camera = useThree((state) => state.camera)
  const scene = useThree((state) => state.scene)
  useEffect(() => {
    const group = root.current
    if (!group) return
    let live = true
    settle(group)
    gl.compileAsync(group, camera, scene).then(() => live && onReady())
    return () => {
      live = false
    }
  }, [gl, camera, scene, root, onReady])
  return null
}

function Place({
  land,
  Scene,
  reduced,
  onReady,
}: {
  land: Land
  Scene: ComponentType<SceneProps>
  reduced: boolean
  onReady: (id: string) => void
}) {
  const root = useRef<THREE.Group>(null)
  const [ready, setReady] = useState(false)
  const done = useCallback(() => {
    setReady(true)
    onReady(land.id)
  }, [land.id, onReady])
  return (
    <group ref={root} position={[land.x, -land.y, 0]} visible={ready}>
      <Quiet id={land.id}>
        <Suspense fallback={null}>
          <Scene land={land} reduced={reduced} />
          <Ready root={root} onReady={done} />
        </Suspense>
      </Quiet>
    </group>
  )
}

export function Lands({
  reduced,
  hold,
  onClose,
}: {
  reduced: boolean
  hold: { x: number; y: number } | null
  onClose: () => void
}) {
  const scenes = useMemo(
    () => new Map(LANDS.map((land) => [land.id, lazy(land.load)])),
    [],
  )
  const [mounted, setMounted] = useState<string[]>([])
  const [revealed, setRevealed] = useState<string[]>([])
  const list = useRef<string[]>([])
  const shown = useRef(new Set<string>())
  const ready = useRef(new Set<string>())
  const started = useRef(new Map<string, number>())
  const root = useRef<THREE.Group>(null)
  const places = useRef<THREE.Group>(null)
  const frame = useRef(0)
  const camera = useThree((state) => state.camera)
  const scene = useThree((state) => state.scene)

  useEffect(() => {
    field.dawn = -Infinity
  }, [])

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production')
      Object.assign(window, {
        epamLands: { camera, scene, lands: LANDS, mounted: list, ready },
      })
  }, [camera, scene])

  useEffect(() => {
    if (!hold) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      onClose()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [hold, onClose])

  const onReady = useCallback((id: string) => ready.current.add(id), [])

  useFrame((state) => {
    const n = frame.current++
    landFade.value = thin(state.camera.zoom)
    if (places.current) places.current.visible = landFade.value > 0.01
    if (root.current && n % SETTLE === 0) settle(root.current)
    if (n % CHECK) return
    const view = state.camera as THREE.OrthographicCamera
    const cx = view.position.x
    const cy = -view.position.y
    const w = state.size.width / 2 / view.zoom
    const h = state.size.height / 2 / view.zoom
    const inside = (l: Land, k: number) =>
      Math.abs(l.x - cx) < w * k + l.radius &&
      Math.abs(l.y - cy) < h * k + l.radius
    const before = shown.current.size
    const war = field.war
    if (war)
      for (const l of LANDS) {
        const c = Math.min(war.cols - 1, Math.floor(l.x / CELL))
        const r = Math.min(war.rows - 1, Math.floor(l.y / CELL))
        if (war.seen[r * war.cols + c]) shown.current.add(l.id)
      }
    if (shown.current.size !== before) setRevealed([...shown.current])
    const now = state.clock.elapsedTime
    const keep = list.current.filter((id) => {
      const l = LANDS.find((x) => x.id === id)
      return l && view.zoom >= KEEP && inside(l, FAR)
    })
    for (const id of list.current)
      if (!keep.includes(id)) ready.current.delete(id)
    const busy = keep.some(
      (id) =>
        !ready.current.has(id) && now - (started.current.get(id) ?? 0) < WAIT,
    )
    let next = keep
    if (!busy && view.zoom >= MOUNT) {
      const want = LANDS.filter(
        (l) =>
          shown.current.has(l.id) && !keep.includes(l.id) && inside(l, NEAR),
      ).sort(
        (a, b) =>
          Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy),
      )[0]
      if (want) {
        next = [...keep, want.id]
        started.current.set(want.id, now)
      }
    }
    if (next.join() === list.current.join()) return
    list.current = next
    setMounted(next)
  })

  const lore = useMemo(() => {
    if (!hold) return null
    const below = -hold.y > camera.position.y
    const note = explain(hold)
    if (note) return { ...note, ...hold, below, land: null }
    const land = LANDS.filter(
      (l) =>
        revealed.includes(l.id) &&
        Math.hypot(l.x - hold.x, l.y - hold.y) < l.radius,
    ).sort(
      (a, b) =>
        Math.hypot(a.x - hold.x, a.y - hold.y) -
        Math.hypot(b.x - hold.x, b.y - hold.y),
    )[0]
    return land
      ? { ...LORE[land.id], name: land.name, tag: '', land, below, ...hold }
      : null
  }, [hold, revealed, camera])

  return (
    <>
      <group ref={root}>
        <group ref={places}>
          {mounted.map((id) => {
            const land = LANDS.find((l) => l.id === id)
            const Scene = scenes.get(id)
            return land && Scene ? (
              <Place
                key={id}
                land={land}
                Scene={Scene}
                reduced={reduced}
                onReady={onReady}
              />
            ) : null
          })}
        </group>
        {lore && (
          <Html
            position={[lore.x, -lore.y, 0]}
            center
            zIndexRange={[5, 5]}
            calculatePosition={place}
          >
            <aside
              className="e-lore"
              data-land={lore.land?.id}
              data-kind={'kind' in lore ? lore.kind : undefined}
              data-id={'id' in lore ? lore.id : undefined}
              data-below={lore.below || undefined}
            >
              <button type="button" aria-label="Close" onClick={onClose}>
                <X size={14} aria-hidden />
              </button>
              <h3>{lore.name}</h3>
              {lore.tag && <small>{lore.tag}</small>}
              {'warrior' in lore && lore.warrior !== undefined && (
                <Garrison kind={lore.warrior} />
              )}
              {lore.story && <p>{lore.story}</p>}
              {lore.bio && <p>{lore.bio}</p>}
            </aside>
          </Html>
        )}
      </group>
      <Clouds revealed={revealed} />
    </>
  )
}
