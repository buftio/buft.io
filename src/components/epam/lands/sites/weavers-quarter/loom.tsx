'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { phase, type Life } from './clock'
import { air, C, Kit, netTexture, TILE, TILT } from './kit'
import { CAPSTAN, FIELD, LENGTH, MID, WARPS, WIDTH } from './layout'
import { WIRES } from './threads'

const H = Math.PI / 2
const m = new THREE.Matrix4()
const p = new THREE.Vector3()
const s = new THREE.Vector3()
const q = new THREE.Quaternion()
const a = new THREE.Vector3()
const b = new THREE.Vector3()
const Z = new THREE.Vector3(0, 0, 1)
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0)
const SEGS = WIRES.reduce((n, w) => n + w.pts.length - 1, 0)
const N = WARPS + SEGS + 1
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

export const fellY = (pr: number) => -FIELD.south + pr * LENGTH

function seg(mesh: THREE.InstancedMesh, i: number, from: THREE.Vector3, to: THREE.Vector3, w: number) {
  p.lerpVectors(from, to, 0.5)
  q.setFromAxisAngle(Z, Math.atan2(to.y - from.y, to.x - from.x))
  mesh.setMatrixAt(i, m.compose(p, q, s.set(Math.hypot(to.x - from.x, to.y - from.y) + w * 0.4, w, 1)))
}

function gantryGeometry() {
  const k = new Kit()
  const half = WIDTH / 2 + 40
  for (const x of [-half, half]) {
    k.add(new THREE.BoxGeometry(30, 270, 30), C.wood, x, 135, 0)
    for (const z of [-50, 50]) {
      const brace = new THREE.BoxGeometry(14, 200, 14)
      brace.rotateX(z > 0 ? 0.35 : -0.35)
      k.add(brace, C.oak, x, 95, z * 0.6)
      const w = new THREE.CylinderGeometry(26, 26, 14, 12)
      w.rotateZ(H)
      k.add(w, C.ink, x, 26, z)
    }
    k.add(new THREE.SphereGeometry(20, 10, 8), C.mint, x, 340, 0)
  }
  k.add(new THREE.BoxGeometry(WIDTH + 120, 46, 44), C.oak, 0, 260, 0)
  const roof = new THREE.CylinderGeometry(58, 58, WIDTH + 150, 3)
  roof.rotateZ(H)
  roof.rotateX(-H)
  k.add(roof, C.teal, 0, 312, 0)
  const flags = [C.indigo, C.madder, C.saffron, C.magenta]
  for (let i = 0; i < 9; i++) {
    const f = new THREE.BoxGeometry(46, 90, 4)
    k.add(f, flags[i % 4], -WIDTH / 2 + 20 + (i * (WIDTH - 40)) / 8, 190, 26)
    k.add(new THREE.ConeGeometry(23, 22, 3), flags[i % 4], -WIDTH / 2 + 20 + (i * (WIDTH - 40)) / 8, 136, 26, 0, Math.PI)
  }
  k.add(new THREE.BoxGeometry(WIDTH + 40, 14, 12), C.mint, 0, 96, -8)
  for (let i = 0; i <= 24; i++) k.add(new THREE.BoxGeometry(3, 70, 3), C.stone, -WIDTH / 2 + (i * WIDTH) / 24, 60, -8)
  return k.geo()
}

function capstanGeometry() {
  const k = new Kit()
  k.add(new THREE.CylinderGeometry(30, 34, 90, 12), C.wood, 0, 57, 0)
  k.add(new THREE.CylinderGeometry(40, 40, 16, 12), C.teal, 0, 108, 0)
  for (let i = 0; i < 4; i++) {
    const arm = new THREE.BoxGeometry(150, 10, 10)
    arm.translate(75, 0, 0)
    k.add(arm, C.oak, 0, 30, 0, (i * Math.PI) / 2)
  }
  k.add(new THREE.ConeGeometry(16, 30, 8), C.mint, 0, 130, 0)
  return k.geo()
}

export function Loom({ life }: { life: RefObject<Life> }) {
  const geos = useMemo(
    () => ({
      gantry: gantryGeometry(),
      capstan: capstanGeometry(),
      quad: new THREE.PlaneGeometry(1, 1),
      net: new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0),
      reel: new THREE.CylinderGeometry(1, 1, WIDTH - 60, 14).rotateZ(H),
      shuttle: new THREE.SphereGeometry(1, 10, 6).scale(48, 9, 12),
      spark: new THREE.CircleGeometry(1, 4),
    }),
    [],
  )
  const tex = useMemo(() => netTexture(), [])
  useEffect(
    () => () => {
      Object.values(geos).forEach((g) => g.dispose())
      tex.dispose()
    },
    [geos, tex],
  )
  const strands = useRef<THREE.InstancedMesh>(null)
  const gantry = useRef<THREE.Group>(null)
  const shuttle = useRef<THREE.Mesh>(null)
  const reel = useRef<THREE.Mesh>(null)
  const net = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>>(null)
  const capstan = useRef<THREE.Group>(null)
  const sparks = useRef<THREE.InstancedMesh>(null)
  const colored = useRef(false)

  useFrame(() => {
    const L = life.current
    const st = strands.current
    const g = gantry.current
    const sh = shuttle.current
    const r = reel.current
    const n = net.current
    const cp = capstan.current
    const sp = sparks.current
    if (!st || !g || !sh || !r || !n || !cp || !sp) return
    const t = L.t
    const z = L.zoom
    const ph = phase(t)
    if (!colored.current) {
      colored.current = true
      const warp = new THREE.Color(C.rose)
      let i = 0
      for (; i < WARPS; i++) st.setColorAt(i, warp)
      for (const w of WIRES) for (let j = 1; j < w.pts.length; j++) st.setColorAt(i++, w.color)
      st.setColorAt(i, new THREE.Color(C.stone))
      if (st.instanceColor) st.instanceColor.needsUpdate = true
    }
    const ww = clamp(0.9 / z, 4, 14)
    const lw = clamp(2.6 / z, 7, 38)
    let i = 0
    for (; i < WARPS; i++) {
      const x = FIELD.x0 + (i + 0.5) * (WIDTH / WARPS)
      seg(st, i, a.set(x, -FIELD.south, 1.5), b.set(x, -FIELD.north, 1.5), ww)
    }
    for (const w of WIRES) for (let j = 1; j < w.pts.length; j++) seg(st, i++, w.pts[j - 1], w.pts[j], lw)
    const fy = fellY(ph.p)
    air(CAPSTAN[0], CAPSTAN[1], 100, a)
    air(MID, -fy, 60, b)
    if (ph.back) seg(st, i, a, b, lw * 0.6)
    else st.setMatrixAt(i, ZERO)
    st.instanceMatrix.needsUpdate = true

    g.position.set(MID, fy, 0)
    const sw = Math.sin(t * (1.9 + L.alarm))
    sh.position.x = ph.back ? -WIDTH / 2 - 60 : sw * (WIDTH / 2 - 40)
    sh.rotation.y = Math.cos(t * (1.9 + L.alarm)) * 0.2
    const rr = 14 + ph.wind * 56
    r.scale.set(1, rr, rr)
    r.position.set(0, rr + 6, 70)
    r.rotation.x = -t * (ph.back ? 3 : 0.2)

    const len = Math.max(1, ph.p * LENGTH)
    n.scale.set(WIDTH, len, 1)
    n.position.set(MID, -FIELD.south, 3)
    n.material.map!.repeat.set(WIDTH / TILE, len / TILE)
    const far = clamp((0.17 - z) / 0.08, 0, 1)
    n.material.opacity = Math.min(1, 0.75 + 0.25 * Math.max(L.alarm, far) + (ph.back ? 0.1 * Math.sin(t * 8) : 0))
    n.material.color.setRGB(1, 1 - Math.max(far * 0.6, L.alarm * 0.45), 1 - far * 0.25 - L.alarm * 0.3)

    cp.rotation.y = ph.back ? -ph.wind * Math.PI * 6 : 0

    const show = z > 0.12
    sp.visible = show
    if (show) {
      for (let k = 0; k < 10; k++) {
        const cyc = t * 0.7 + k * 0.37
        const c = Math.floor(cyc)
        const f = cyc - c
        const h = Math.sin((c * 12.9898 + k * 78.233) * 43758.5453)
        const hx = h - Math.floor(h)
        const hy = (hx * 7.31) % 1
        const sz = Math.sin(f * Math.PI) * (14 + 10 * L.alarm)
        p.set(FIELD.x0 + 30 + hx * (WIDTH - 60), -FIELD.south + 20 + hy * Math.max(0, len - 40), 5)
        q.setFromAxisAngle(Z, f * 2)
        sp.setMatrixAt(k, m.compose(p, q, s.set(sz, sz * 1.6, 1)))
      }
      sp.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group>
      <instancedMesh ref={strands} args={[geos.quad, undefined, N]} frustumCulled={false} renderOrder={46}>
        <meshBasicMaterial transparent opacity={0.9} depthWrite={false} />
      </instancedMesh>
      <mesh ref={net} geometry={geos.net} renderOrder={45}>
        <meshBasicMaterial map={tex} transparent depthWrite={false} />
      </mesh>
      <instancedMesh ref={sparks} args={[geos.spark, undefined, 10]} frustumCulled={false} renderOrder={47}>
        <meshBasicMaterial color="#fff6cf" transparent depthWrite={false} />
      </instancedMesh>
      <group ref={gantry}>
        <group quaternion={TILT}>
          <mesh geometry={geos.gantry}>
            <meshStandardMaterial vertexColors flatShading roughness={0.8} />
          </mesh>
          <mesh ref={shuttle} geometry={geos.shuttle} position={[0, 34, -8]}>
            <meshBasicMaterial color={C.gold} />
          </mesh>
          <mesh ref={reel} geometry={geos.reel}>
            <meshStandardMaterial color={C.magenta} emissive={C.magenta} emissiveIntensity={0.35} roughness={0.6} />
          </mesh>
        </group>
      </group>
      <group position={[CAPSTAN[0], -CAPSTAN[1], 0]} quaternion={TILT}>
        <group ref={capstan}>
          <mesh geometry={geos.capstan}>
            <meshStandardMaterial vertexColors flatShading roughness={0.8} />
          </mesh>
        </group>
      </group>
    </group>
  )
}
