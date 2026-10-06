'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { bargeGeometry, C, glowTexture } from './geo'
import { bargeMatrix, FIRES, WINDOW, type Mood } from './layout'
import { along, cycle, FLEET, S_BOT, S_END, S_TOP, shown, slotOf, smooth, type Spot, VESSEL } from './map'

const PUFFS = FLEET * 2
const SPARKS = 26
const BEADS = 2 + FIRES.length
const GLOWS = BEADS + FLEET + SPARKS + 1
const mats = Array.from({ length: FLEET }, () => new THREE.Matrix4())
const m4 = new THREE.Matrix4()
const v = new THREE.Vector3()
const s3 = new THREE.Vector3()
const flat = new THREE.Quaternion()
const tint = new THREE.Color()
const EMBER = new THREE.Color(C.ember)
const DEEP = new THREE.Color('#ff4a0a')
const HOT = new THREE.Color('#ffb347')
const spot: Spot = { x: 0, y: 0, tx: 0, ty: 0 }
const Z = new THREE.Vector3(0, 0, 1)

function strip(from: number, to: number, pos: number[], col: number[]) {
  const n = 24
  const warm = new THREE.Color('#ff8a3a')
  const at: Spot = { x: 0, y: 0, tx: 0, ty: 0 }
  for (let k = 0; k <= n; k++) {
    const f = k / n
    along(from + (to - from) * f, at)
    const w = 44 * Math.min(1, Math.sin(Math.PI * f) * 2.2)
    const fade = Math.min(1, Math.sin(Math.PI * f) * 1.6)
    pos.push(at.x - at.ty * w, at.y + at.tx * w, 1, at.x + at.ty * w, at.y - at.tx * w, 1)
    col.push(warm.r * fade, warm.g * fade, warm.b * fade, warm.r * fade, warm.g * fade, warm.b * fade)
  }
}

function waterGeometry() {
  const pos: number[] = []
  const col: number[] = []
  const index: number[] = []
  for (const [a, b] of [[0, S_BOT + 40], [S_TOP - 40, S_END]]) {
    const base = pos.length / 3
    strip(a, b, pos, col)
    for (let k = 0; k < 24; k++) {
      const i = base + k * 2
      index.push(i, i + 1, i + 2, i + 1, i + 3, i + 2)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  g.setIndex(index)
  return g
}

function glowAt(mesh: THREE.InstancedMesh, k: number, x: number, y: number, z: number, sx: number, sy: number, turn: number, color: THREE.Color, power: number) {
  flat.setFromAxisAngle(Z, turn)
  mesh.setMatrixAt(k, m4.compose(v.set(x, y, z), flat, s3.set(sx, sy, 1)))
  mesh.setColorAt(k, tint.copy(color).multiplyScalar(power))
}

export function Fleet({ mood }: { mood: RefObject<Mood> }) {
  const hull = useMemo(() => bargeGeometry(), [])
  const tex = useMemo(() => glowTexture(), [])
  const water = useMemo(() => waterGeometry(), [])
  useEffect(() => () => [hull, tex, water].forEach((x) => x.dispose()), [hull, tex, water])
  const barges = useRef<THREE.InstancedMesh>(null)
  const puffs = useRef<THREE.InstancedMesh>(null)
  const glows = useRef<THREE.InstancedMesh>(null)

  useFrame((state) => {
    const far = smooth(0.16, 0.06, state.camera.zoom)
    const m = mood.current
    const b = barges.current
    const smoke = puffs.current
    const glow = glows.current
    if (!m || !b || !smoke || !glow) return
    const { c, p } = cycle(m.cyc)
    const t = m.now
    const warm = 0.25 + 0.75 * m.calm
    for (let i = 0; i < FLEET; i++) {
      bargeMatrix(i, c, p, m, mats[i])
      b.setMatrixAt(i, mats[i])
      const vis = shown(slotOf(i, c, p))
      v.set(0, 36, -6).applyMatrix4(mats[i])
      const flick = 0.75 + 0.25 * Math.sin(t * 7 + i * 2.1) * Math.sin(t * 3.3 + i)
      glowAt(glow, BEADS + i, v.x, v.y, v.z + 4, 70 * vis * (1 + far * 1.4), 70 * vis * (1 + far * 1.4), 0, EMBER, (0.55 + 0.6 * far) * flick * warm)
    }
    for (let j = 0; j < PUFFS; j++) {
      const i = j % FLEET
      const ph = (t * 0.38 + Math.floor(j / FLEET) / 2 + i * 0.137) % 1
      v.set(13, 46, -22).applyMatrix4(mats[i])
      const u = slotOf(i, c, p)
      const vis = shown(u) * (Math.abs(u - 1) < 0.05 && p < 0.42 ? 1.9 : 1)
      const r = (6 + 20 * ph) * (1 - ph ** 4) * vis * (0.15 + 0.85 * m.calm) * (1 - 0.65 * far)
      v.x += Math.sin(ph * 4 + j) * 6 + ph * 34
      v.y += ph * 80
      v.z += ph * 60
      flat.setFromAxisAngle(Z, j + ph)
      smoke.setMatrixAt(j, m4.compose(v, flat, s3.set(r, r, r)))
    }
    const pulse = 0.85 + 0.15 * Math.sin(t * 1.3) + 0.05 * Math.sin(t * 5.1)
    glowAt(glow, 0, VESSEL.x, -VESSEL.y, 3, VESSEL.w * 0.85, VESSEL.h * 0.8, VESSEL.turn, EMBER, (0.2 + 0.14 * far) * pulse * warm)
    glowAt(glow, GLOWS - 1, VESSEL.x, -VESSEL.y, 2, VESSEL.w * (1.5 + far), VESSEL.h * (1.6 + far), VESSEL.turn, DEEP, (0.1 + 0.12 * far) * pulse * warm)
    glowAt(glow, 1, WINDOW.x, WINDOW.y, WINDOW.z + 2, 60, 50, 0, HOT, 0.5 * warm)
    FIRES.forEach((f, k) => {
      const fl = 0.8 + 0.2 * Math.sin(t * 9 + k * 1.7)
      glowAt(glow, 2 + k, f.p.x, f.p.y, f.p.z + 6, f.r * 9 * fl, f.r * 9 * fl, 0, HOT, 0.6 * m.calm)
    })
    for (let k = 0; k < SPARKS; k++) {
      const ph = (t * (0.18 + (k % 5) * 0.03) + k * 0.137) % 1
      along(S_BOT + ((k * 97.3) % (S_TOP - S_BOT)), spot)
      const side = ((k * 53) % 160) - 80
      const r = (13 + far * 30) * Math.sin(ph * Math.PI) * (0.6 + 0.4 * Math.sin(t * 13 + k)) * m.calm
      glowAt(glow, BEADS + FLEET + k, spot.x - spot.ty * side + Math.sin(ph * 6 + k) * 14, spot.y + spot.tx * side + ph * 150, 30 + ph * 120, r, r, 0, HOT, 0.9)
    }
    b.instanceMatrix.needsUpdate = smoke.instanceMatrix.needsUpdate = glow.instanceMatrix.needsUpdate = true
    if (glow.instanceColor) glow.instanceColor.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={glows} args={[undefined, undefined, GLOWS]} frustumCulled={false} renderOrder={47}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={tex} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </instancedMesh>
      <mesh geometry={water} renderOrder={44}>
        <meshBasicMaterial vertexColors transparent opacity={0.55} depthWrite={false} toneMapped={false} />
      </mesh>
      <instancedMesh ref={barges} args={[hull, undefined, FLEET]} frustumCulled={false} renderOrder={46}>
        <meshStandardMaterial vertexColors flatShading roughness={0.7} emissive="#2a0c04" transparent side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={puffs} args={[undefined, undefined, PUFFS]} frustumCulled={false} renderOrder={48}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color={C.smoke} emissive="#3a2a40" roughness={1} transparent opacity={0.7} depthWrite={false} />
      </instancedMesh>
    </group>
  )
}

