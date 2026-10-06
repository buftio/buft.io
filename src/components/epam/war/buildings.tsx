'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { MAX_POSTS } from './build'
import { lighthouseGeometry, mineGeometry } from './castle'
import { animated, state, tick } from './fortress-shade'
import { CELL, CREW, type War } from './sim'

const TOWER = 520
const MINE = 620
const PITCH = new THREE.Quaternion().setFromEuler(
  new THREE.Euler((50 * Math.PI) / 180, 0, 0),
)
const LIVE = new THREE.Color('#ffffff')
const CUT = new THREE.Color('#8f8496')
const SICK = new THREE.Color('#ff6b5a')
const WRONG = new THREE.Color('#ff9aa8')
const Z = new THREE.Vector3(0, 0, 1)
const RISE = 0.5
const FALL = 0.7
const GHOST = 1.1
const SPARE = 24
const place = new THREE.Matrix4()
const at = new THREE.Vector3()
const size = new THREE.Vector3()
const turn = new THREE.Quaternion()

export type Ghost = { x: number; y: number; mine: boolean }
type Fade = Ghost & { at: number; how: 'gone' | 'eaten' | 'ghost' }

const clamp = (u: number) => Math.min(1, Math.max(0, u))
const pop = (u: number) => 1 + 2.70158 * (u - 1) ** 3 + 1.70158 * (u - 1) ** 2
const fade = (f: Fade, now: number) => {
  if (f.how !== 'ghost') {
    const u = clamp((now - f.at) / FALL)
    return { s: 1 - u * u, tilt: u * u * 1.2 * (f.x % 2 ? 1 : -1), shake: 0 }
  }
  const u = clamp((now - f.at) / GHOST)
  if (u < 0.3) return { s: pop(u / 0.3), tilt: 0, shake: 0 }
  if (u < 0.55) return { s: 1, tilt: 0, shake: Math.sin(now * 70) * 0.04 }
  const v = (u - 0.55) / 0.45
  return { s: 1 - v * v, tilt: v * 0.5, shake: 0 }
}

const calm = () =>
  typeof matchMedia !== 'undefined' &&
  matchMedia('(prefers-reduced-motion: reduce)').matches

function staged(shape: THREE.BufferGeometry, n: number) {
  shape.setAttribute('aState', state(n, [1, 1, 0]))
  return shape
}

export function Buildings({
  war,
  dawn,
  ghosts,
  reduced,
}: {
  war: War
  dawn: RefObject<number>
  ghosts: RefObject<Ghost[]>
  reduced?: boolean
}) {
  const room = Math.max(1, war.deposits.length)
  const tower = useMemo(
    () => staged(lighthouseGeometry(), MAX_POSTS + SPARE),
    [],
  )
  const mine = useMemo(() => staged(mineGeometry(), room + SPARE), [room])
  const towerLook = useMemo(() => animated(0.85), [])
  const mineLook = useMemo(() => animated(0.6), [])
  const still = useMemo(() => reduced ?? calm(), [reduced])
  useEffect(
    () => () => [tower, mine, towerLook, mineLook].forEach((x) => x.dispose()),
    [tower, mine, towerLook, mineLook],
  )
  const towers = useRef<THREE.InstancedMesh>(null)
  const mines = useRef<THREE.InstancedMesh>(null)
  const born = useRef(new Map<number, number>())
  const seen = useRef(new Map<number, Ghost>())
  const fades = useRef<Fade[]>([])

  useFrame((frame) => {
    const show = (x: number, s: number) => (x <= dawn.current ? s : 0)
    const tall = towers.current
    const fat = mines.current
    if (!tall || !fat) return
    const t = still ? 0 : frame.clock.elapsedTime
    tick(tall, t)
    tick(fat, t)
    const crews = tall.geometry.getAttribute(
      'aState',
    ) as THREE.InstancedBufferAttribute
    const runs = fat.geometry.getAttribute(
      'aState',
    ) as THREE.InstancedBufferAttribute
    const now = frame.clock.elapsedTime
    const was = seen.current
    const live = new Map<number, Ghost>()
    for (const b of [...war.squads, ...war.mines]) {
      live.set(b.id, { x: b.x, y: b.y, mine: 'rich' in b })
      if (!born.current.has(b.id)) born.current.set(b.id, still ? -1e9 : now)
    }
    for (const [id, b] of was) {
      if (live.has(id)) continue
      born.current.delete(id)
      const i =
        Math.min(war.rows - 1, Math.floor(b.y / CELL)) * war.cols +
        Math.min(war.cols - 1, Math.floor(b.x / CELL))
      fades.current.push({
        ...b,
        at: now,
        how: war.corrupt[i] >= 0.5 ? 'eaten' : 'gone',
      })
    }
    seen.current = live
    for (const g of ghosts.current.splice(0))
      fades.current.push({ ...g, at: now, how: 'ghost' })
    fades.current = still
      ? []
      : fades.current.filter(
          (f) => now - f.at < (f.how === 'ghost' ? GHOST : FALL),
        )
    const grow = (id: number) =>
      pop(clamp((now - (born.current.get(id) ?? -1e9)) / RISE))
    war.squads.forEach((s, k) => {
      const v = show(s.x, TOWER) * grow(s.id)
      tall.setMatrixAt(
        k,
        place.compose(at.set(s.x, -s.y, 0), PITCH, size.set(v, v, v)),
      )
      tall.setColorAt(k, s.from ? LIVE : CUT)
      crews.setXYZ(k, s.crew / CREW, s.from ? 1 : 0, s.fighting ? 1 : 0)
    })
    war.mines.forEach((m, k) => {
      const v = show(m.x, MINE) * grow(m.id)
      fat.setMatrixAt(
        k,
        place.compose(at.set(m.x, -m.y, 0), PITCH, size.set(v, v, v)),
      )
      fat.setColorAt(k, m.from ? LIVE : CUT)
      runs.setXYZ(k, 1, m.from ? 1 : 0, 0)
    })
    let towerAt = war.squads.length
    let mineAt = war.mines.length
    for (const f of fades.current) {
      const mesh = f.mine ? fat : tall
      const k = f.mine ? mineAt : towerAt
      if (k >= (f.mine ? room : MAX_POSTS) + SPARE) continue
      const { s, tilt, shake } = fade(f, now)
      const v = (f.mine ? MINE : TOWER) * Math.max(0, s)
      turn.setFromAxisAngle(Z, tilt).multiply(PITCH)
      mesh.setMatrixAt(
        k,
        place.compose(
          at.set(f.x + shake * v, -f.y, 0),
          turn,
          size.set(v, v, v),
        ),
      )
      mesh.setColorAt(
        k,
        f.how === 'gone' ? CUT : f.how === 'eaten' ? SICK : WRONG,
      )
      ;(f.mine ? runs : crews).setXYZ(k, 1, 0, 0)
      if (f.mine) mineAt++
      else towerAt++
    }
    tall.count = towerAt
    fat.count = mineAt
    crews.needsUpdate = true
    runs.needsUpdate = true
    for (const mesh of [tall, fat]) {
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
  })

  return (
    <group>
      <instancedMesh
        ref={mines}
        args={[mine, mineLook, room + SPARE]}
        frustumCulled={false}
        renderOrder={58}
      />
      <instancedMesh
        ref={towers}
        args={[tower, towerLook, MAX_POSTS + SPARE]}
        frustumCulled={false}
        renderOrder={58}
      />
    </group>
  )
}
