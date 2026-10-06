'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { Stand } from '../../stand'
import { ROD, skiffGeometry, starGeometry } from './models'
import { done, ease, flat, lift } from './util'

const CX = 960
const CY = -660
const R = 340
const RING = Array.from({ length: 10 }, (_, i) => (18 + i * 36) * (Math.PI / 180))
const LOST = 3
const PTS: [number, number][] = [
  ...RING.map((a): [number, number] => [CX + Math.cos(a) * R, CY + Math.sin(a) * R]),
  [CX + 150, CY + R + 120],
  [CX - 170, CY + R + 110],
  [CX + 40, CY - R - 170],
]
const LINKS: [number, number][] = [
  ...RING.map((_, i): [number, number] => [i, (i + 1) % 10]),
  [1, 10],
  [3, 11],
  [7, 12],
]
const EYES: [number, number][] = [[CX - 110, CY - 50], [CX + 110, CY - 50]]
const SKIFF: [number, number] = [405, 30]
const SKIFF_S = 110
const PERIOD = 26
const NIGHT = 820
const hooked = { x: 0, y: 0 }
const end = { x: 0, y: 0 }

function link(l: THREE.InstancedMesh, w: number) {
  LINKS.forEach(([i, j], k) => {
    let [ax, ay] = PTS[i]
    let [bx, by] = PTS[j]
    const len = Math.hypot(bx - ax, by - ay)
    const ux = (bx - ax) / len
    const uy = (by - ay) / len
    if (i === LOST) [ax, ay] = [ax + ux * 40, ay + uy * 40]
    if (j === LOST) [bx, by] = [bx - ux * 40, by - uy * 40]
    flat(l, k, (ax + bx) / 2, (ay + by) / 2, 4, Math.hypot(bx - ax, by - ay), w, -Math.atan2(by - ay, bx - ax))
  })
  done(l)
}

function nightGeometry() {
  const rings = [0, 0.2, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.93, 1]
  const sm = (r: number) => {
    const k = Math.min(1, Math.max(0, (r - 0.32) / 0.68))
    return 0.82 * (1 - k * k * (3 - 2 * k))
  }
  const n = 64
  const pos: number[] = []
  const col: number[] = []
  const idx: number[] = []
  const c = new THREE.Color('#1b2678')
  rings.forEach((r, j) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      const w = 1 + 0.04 * Math.sin(a * 3 + 1)
      pos.push(Math.cos(a) * r * w, Math.sin(a) * r * w * 1.08, 0)
      col.push(c.r, c.g, c.b, sm(r))
      if (j) idx.push((j - 1) * n + i, j * n + i, (j - 1) * n + ((i + 1) % n), j * n + i, j * n + ((i + 1) % n), (j - 1) * n + ((i + 1) % n))
    }
  })
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4))
  g.setIndex(idx)
  return g
}

export function Sky({ hope, reduced, tex }: { hope: RefObject<number>; reduced: boolean; tex: THREE.Texture }) {
  const geo = useMemo(
    () => ({
      star: starGeometry(),
      plane: new THREE.PlaneGeometry(1, 1),
      disc: new THREE.CircleGeometry(1, 24),
      ring: new THREE.RingGeometry(0.8, 1, 24),
      skiff: skiffGeometry(),
      night: nightGeometry(),
    }),
    [],
  )
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo])
  const stars = useRef<THREE.InstancedMesh>(null)
  const halos = useRef<THREE.InstancedMesh>(null)
  const lines = useRef<THREE.InstancedMesh>(null)
  const whites = useRef<THREE.InstancedMesh>(null)
  const pupils = useRef<THREE.InstancedMesh>(null)
  const line = useRef<THREE.Mesh>(null)
  const boat = useRef<THREE.Mesh>(null)
  const wide = useRef(0)

  useFrame((state) => {
    const t = reduced ? 3 : state.clock.elapsedTime
    const h = hope.current
    const st = stars.current
    const ha = halos.current
    const wh = whites.current
    const pu = pupils.current
    const ln = line.current
    const sk = boat.current
    const li = lines.current
    if (!st || !ha || !wh || !pu || !ln || !sk || !li) return
    const far = Math.min(3, Math.max(1, 0.22 / state.camera.zoom))
    if (Math.abs(far - wide.current) > 0.05) {
      wide.current = far
      link(li, 7 * far)
    }
    const tip = lift(SKIFF[0], SKIFF[1], ROD.x, ROD.y, 0, SKIFF_S)
    const tx = tip.x
    const ty = tip.y
    const [sx, sy] = PTS[LOST]
    const dx = tx + 30
    const dy = ty + 70
    const p = (t % PERIOD) / PERIOD
    const wig = Math.sin(t * 7) * 6
    if (p < 0.3) {
      const k = ease(p / 0.3)
      hooked.x = sx + (dx - sx) * k + wig * (1 - k)
      hooked.y = sy + (dy - sy) * k + Math.sin(k * Math.PI) * 40
      end.x = hooked.x
      end.y = hooked.y
    } else if (p < 0.56) {
      const shake = p > 0.48 ? Math.sin(t * 30) * 8 : 0
      hooked.x = dx + Math.sin(t * 2) * 8 + shake
      hooked.y = dy + Math.sin(t * 3.1) * 6
      end.x = hooked.x
      end.y = hooked.y
    } else if (p < 0.8) {
      const k = ease((p - 0.56) / 0.24)
      hooked.x = dx + (sx - dx) * k + Math.sin(k * Math.PI * 3) * 30
      hooked.y = dy + (sy - dy) * k - Math.sin(k * Math.PI) * 80
      end.x = tx + 6
      end.y = ty + 60 + Math.sin(t * 2) * 6
    } else {
      const k = ease((p - 0.8) / 0.2)
      hooked.x = sx + wig * 0.3
      hooked.y = sy
      end.x = tx + 6 + (sx - tx - 6) * k
      end.y = ty + 60 + (sy - ty - 60) * k - Math.sin(k * Math.PI) * 160
    }
    const caught = p > 0.3 && p < 0.56
    const happy = caught ? Math.abs(Math.sin(t * 8)) : 0
    sk.rotation.z = Math.sin(t * 1.1) * 0.05 + happy * 0.08
    sk.position.y = happy * 0.12

    PTS.forEach(([x, y], i) => {
      const lost = i === LOST
      const px = lost ? hooked.x : x
      const py = lost ? hooked.y : y
      const tw = 0.8 + 0.2 * Math.sin(t * (1.3 + (i % 4) * 0.7) + i * 2.3)
      const size = (lost ? 54 : i === 12 ? 62 : 44) * tw * far
      flat(st, i, px, py, 8, size, size, lost ? t * 2 : Math.sin(t * 0.3 + i) * 0.2)
      flat(ha, i, px, py, 10, (size / far) * 4.2 * (0.35 + 0.65 * h))
    })
    const look = caught || p < 0.3 ? 1 : 0.25
    EYES.forEach(([x, y], i) => {
      const wide = 58 + (1 - h) * 14 + (caught ? 6 * Math.abs(Math.sin(t * 4)) : 0)
      flat(wh, i, x, y, 6, wide)
      const ax = (1 - h) > 0.15 ? -1 : (hooked.x - x) * look
      const ay = (1 - h) > 0.15 ? 0.8 : (hooked.y - y) * look + (1 - look) * Math.sin(t * 0.4) * 300
      const l = Math.hypot(ax, ay) || 1
      flat(pu, i, x + (ax / l) * wide * 0.45, y + (ay / l) * wide * 0.45, 7, wide * 0.5)
    })
    const mx = (tx + end.x) / 2
    const my = (ty + end.y) / 2
    ln.position.set(mx, -my, 9)
    ln.rotation.z = -Math.atan2(end.y - ty, end.x - tx)
    ln.scale.set(Math.hypot(end.x - tx, end.y - ty), 3, 1)
    done(st, ha, wh, pu)
  })

  return (
    <group>
      <mesh geometry={geo.night} position={[CX - 20, -CY + 40, 1]} scale={NIGHT} renderOrder={40}>
        <meshBasicMaterial vertexColors transparent depthWrite={false} depthTest={false} />
      </mesh>
      <instancedMesh ref={lines} args={[geo.plane, undefined, LINKS.length]} frustumCulled={false} renderOrder={42}>
        <meshBasicMaterial color="#9fb4ff" transparent opacity={0.55} depthWrite={false} depthTest={false} />
      </instancedMesh>
      <instancedMesh ref={halos} args={[geo.plane, undefined, PTS.length]} frustumCulled={false} renderOrder={43}>
        <meshBasicMaterial map={tex} color="#b9c8ff" transparent depthWrite={false} depthTest={false} blending={THREE.AdditiveBlending} />
      </instancedMesh>
      <instancedMesh ref={stars} args={[geo.star, undefined, PTS.length]} frustumCulled={false} renderOrder={44}>
        <meshBasicMaterial color="#ffe58f" depthTest={false} />
      </instancedMesh>
      <mesh geometry={geo.ring} position={[PTS[LOST][0], -PTS[LOST][1], 5]} scale={34} renderOrder={44}>
        <meshBasicMaterial color="#9fb4ff" transparent opacity={0.7} depthTest={false} />
      </mesh>
      <instancedMesh ref={whites} args={[geo.disc, undefined, 2]} frustumCulled={false} renderOrder={44}>
        <meshBasicMaterial color="#ffffff" depthTest={false} />
      </instancedMesh>
      <instancedMesh ref={pupils} args={[geo.disc, undefined, 2]} frustumCulled={false} renderOrder={45}>
        <meshBasicMaterial color="#2a1630" depthTest={false} />
      </instancedMesh>
      <mesh ref={line} geometry={geo.plane} renderOrder={47}>
        <meshBasicMaterial color="#e8ecff" transparent opacity={0.85} depthTest={false} />
      </mesh>
      <Stand at={SKIFF} size={SKIFF_S} turn={0}>
        <mesh ref={boat} geometry={geo.skiff}>
          <meshStandardMaterial vertexColors flatShading roughness={0.7} />
        </mesh>
      </Stand>
    </group>
  )
}
