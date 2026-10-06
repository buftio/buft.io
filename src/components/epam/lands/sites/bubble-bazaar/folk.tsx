'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { makeMarket, step, type Market } from './actors'
import { folkGeometry, hatGeometry, topHatGeometry } from './shapes'
import { PEARLS } from './data'
import { BUTTER, CORAL, kickAt, LILAC, lift, pose, TEAL, type Mood } from './kit'

const HATS = [TEAL, CORAL, BUTTER, LILAC].map((c) => new THREE.Color(c))
const BALLS = [CORAL, TEAL, BUTTER, LILAC, '#ff9ec2'].map((c) => new THREE.Color(c))
const RIPPLE = new THREE.Color(TEAL)
const GLOW = new THREE.Color('#ff9ec2')
const MILK = new THREE.Color('#e9e2ec')
const tint = new THREE.Color()
const mat = new THREE.Matrix4()
const v = new THREE.Vector3()
const q = new THREE.Quaternion()
const s = new THREE.Vector3()
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0)

const talkVertex = `
attribute float aCell;
varying vec2 vUv;
void main() {
  vec2 cell = vec2(mod(aCell, 4.0), 2.0 + floor(aCell / 4.0));
  vUv = vec2((cell.x + uv.x) / 4.0, 1.0 - (cell.y + 1.0 - uv.y) / 4.0);
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
}`

const talkFragment = `
uniform sampler2D uMap;
varying vec2 vUv;
void main() {
  vec4 c = texture2D(uMap, vUv);
  if (c.a < 0.1) discard;
  gl_FragColor = c;
  #include <colorspace_fragment>
}`

type Props = { mood: RefObject<Mood>; reduced: boolean; map: THREE.Texture }

export function Folk({ mood, reduced, map }: Props) {
  const body = useMemo(() => folkGeometry(), [])
  const hat = useMemo(() => hatGeometry(), [])
  const top = useMemo(() => topHatGeometry(), [])
  const quad = useMemo(() => {
    const g = new THREE.PlaneGeometry(1, 1)
    g.setAttribute('aCell', new THREE.InstancedBufferAttribute(new Float32Array(16), 1))
    return g
  }, [])
  const talkMat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: talkVertex, fragmentShader: talkFragment, uniforms: { uMap: { value: map } }, transparent: true, depthTest: false, depthWrite: false }),
    [map],
  )
  useEffect(() => () => [body, hat, top, quad, talkMat].forEach((o) => o.dispose()), [body, hat, top, quad, talkMat])

  const market = useRef<Market | null>(null)
  const clock = useRef(0)
  const group = useRef<THREE.Group>(null)
  const folk = useRef<THREE.InstancedMesh>(null)
  const hats = useRef<THREE.InstancedMesh>(null)
  const topHat = useRef<THREE.Mesh>(null)
  const balls = useRef<THREE.InstancedMesh>(null)
  const talk = useRef<THREE.InstancedMesh>(null)
  const rings = useRef<THREE.InstancedMesh>(null)

  useFrame((state, dt) => {
    if (!market.current) market.current = makeMarket()
    const m = market.current
    const g = group.current
    const F = folk.current
    const H = hats.current
    const B = balls.current
    const T = talk.current
    const R = rings.current
    const crown = topHat.current
    if (!g || !F || !H || !B || !T || !R || !crown) return
    g.visible = mood.current.zoom > 0.11
    if (!g.visible) return
    clock.current += reduced ? dt * 0.08 : Math.min(dt, 0.1)
    step(m, clock.current, Math.min(dt, 0.1), mood.current.t, kickAt(state.clock.elapsedTime * (reduced ? 0.1 : 1)))
    F.count = H.count = m.folk.length
    B.count = m.balls.length
    T.count = m.talk.length
    R.count = m.rings.length + PEARLS.length
    m.folk.forEach((p, k) => {
      if (!p.on || p.s <= 0) {
        F.setMatrixAt(k, ZERO)
        H.setMatrixAt(k, ZERO)
        return
      }
      pose(mat, p.x, p.y, p.h, p.s, p.turn, p.sq, p.z)
      F.setMatrixAt(k, mat)
      H.setMatrixAt(k, p.hat < 0 ? ZERO : mat)
      if (p.hat >= 0) H.setColorAt(k, HATS[p.hat])
    })
    pose(crown.matrix, m.shady.x, m.shady.y, m.shady.h, m.shady.s, m.shady.turn, 1, m.shady.z)
    m.balls.forEach((b, k) => {
      lift(v, b.x, b.y, 0, b.h, b.z)
      B.setMatrixAt(k, b.on ? mat.compose(v, q.identity(), s.set(b.r, b.r, b.r)) : ZERO)
      B.setColorAt(k, BALLS[b.tint])
    })
    const grow = Math.min(2.2, Math.max(1, 0.55 / mood.current.zoom))
    const cells = T.geometry.getAttribute('aCell') as THREE.InstancedBufferAttribute
    m.talk.forEach((k, i) => {
      lift(v, k.x, k.y, 0, k.h, k.z)
      v.z += 40
      const z = 46 * k.pop * grow
      T.setMatrixAt(i, k.pop > 0 ? mat.compose(v, q.identity(), s.set(z, z, 1)) : ZERO)
      cells.setX(i, k.cell)
    })
    cells.needsUpdate = true
    m.rings.forEach((r, k) => {
      const on = r.age > 0 && r.age < 1.6
      const w = 24 + r.age * 70
      R.setMatrixAt(k, on ? mat.compose(v.set(r.x, -r.y, 4), q.identity(), s.set(w, w, 1)) : ZERO)
      R.setColorAt(k, tint.copy(RIPPLE).lerp(MILK, Math.min(1, Math.max(0, r.age / 1.6))))
    })
    PEARLS.forEach(([x, y], i) => {
      const k = m.rings.length + i
      const w = 58 + Math.sin(clock.current * 2.2 + i * 1.7) * 8
      R.setMatrixAt(k, m.calm ? mat.compose(v.set(x, -y, 3), q.identity(), s.set(w, w, 1)) : ZERO)
      R.setColorAt(k, GLOW)
    })
    for (const mesh of [F, H, B, T, R]) {
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
  })

  const count = 80
  return (
    <group ref={group}>
      <instancedMesh ref={folk} args={[body, undefined, count]} frustumCulled={false} renderOrder={47}>
        <meshStandardMaterial vertexColors flatShading roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={hats} args={[hat, undefined, count]} frustumCulled={false} renderOrder={47}>
        <meshStandardMaterial vertexColors flatShading roughness={0.7} />
      </instancedMesh>
      <mesh ref={topHat} geometry={top} matrixAutoUpdate={false} renderOrder={47}>
        <meshStandardMaterial vertexColors flatShading roughness={0.5} />
      </mesh>
      <instancedMesh ref={balls} args={[undefined, undefined, 16]} frustumCulled={false} renderOrder={47}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshStandardMaterial roughness={0.35} />
      </instancedMesh>
      <instancedMesh ref={talk} args={[quad, talkMat, 16]} frustumCulled={false} renderOrder={49} />
      <instancedMesh ref={rings} args={[undefined, undefined, 24]} frustumCulled={false} renderOrder={42}>
        <ringGeometry args={[0.82, 1, 32]} />
        <meshBasicMaterial transparent opacity={0.85} depthWrite={false} />
      </instancedMesh>
    </group>
  )
}
