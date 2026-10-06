'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { MAX_POSTS } from './build'
import { carrierGeometry } from './castle'
import { animated, state } from './fortress-shade'
import { routes, type Route } from './roads'
import type { Point, War } from './sim'
import { army, BODY, FINE_PX, upload } from './warriors'

const LIFT = 5
const BODY_UM = 15
const GAP = 260
const SIDE = 64
const PACE = 150
const THREAD = 220
const THREAD_PX = 7
const CARRY = 80
const CARRY_GAP = 300
const WALK = 240
const WALKERS = 9000
const CARRIERS = 3000
const PITCH = new THREE.Quaternion().setFromEuler(
  new THREE.Euler((50 * Math.PI) / 180, 0, 0),
)
const Z = new THREE.Vector3(0, 0, 1)
const place = new THREE.Matrix4()
const at = new THREE.Vector3()
const size = new THREE.Vector3()
const turn = new THREE.Quaternion()

const calm = () =>
  typeof matchMedia !== 'undefined' &&
  matchMedia('(prefers-reduced-motion: reduce)').matches

type Troop = THREE.Mesh<THREE.InstancedBufferGeometry, THREE.ShaderMaterial>

const beam = {
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    varying float vLength;
    void main() {
      vUv = uv;
      vLength = length(instanceMatrix[0].xyz);
      gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform float uTime;
    varying vec2 vUv;
    varying float vLength;
    void main() {
      float y = abs(vUv.y - 0.5) * 2.0;
      float core = exp(-y * y * 30.0);
      float glow = exp(-y * y * 3.5);
      float d = vUv.x * vLength;
      float ends = smoothstep(0.0, 350.0, d) * smoothstep(0.0, 350.0, vLength - d);
      float pulse = 0.7 + 0.3 * sin((d - uTime * 700.0) / 160.0);
      vec3 color = mix(vec3(1.0, 0.8, 0.4), vec3(1.0, 0.98, 0.9), core);
      float a = (glow * 0.32 + core * 0.5) * pulse * ends;
      gl_FragColor = vec4(color, a);
    }`,
}

function walk(route: Route, s: number): [Point, number] {
  const { points, along } = route
  let lo = 0
  let hi = along.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (along[mid] <= s) lo = mid
    else hi = mid
  }
  const [p, q] = [points[lo], points[hi]]
  const f =
    along[hi] > along[lo] ? (s - along[lo]) / (along[hi] - along[lo]) : 0
  return [
    { x: p.x + (q.x - p.x) * f, y: p.y + (q.y - p.y) * f },
    Math.sign(q.x - p.x) || 1,
  ]
}

export function Network({
  war,
  mpp,
  dawn,
  reduced,
}: {
  war: War
  mpp: number
  dawn: RefObject<number>
  reduced?: boolean
}) {
  const threads = MAX_POSTS + war.deposits.length
  const still = useMemo(() => reduced ?? calm(), [reduced])
  const walkers = useMemo(() => army(WALKERS, LIFT, !still), [still])
  const carrier = useMemo(() => {
    const shape = carrierGeometry()
    shape.setAttribute('aState', state(CARRIERS, [1, 1, 0]))
    return shape
  }, [])
  const look = useMemo(() => animated(0.7), [])
  const glow = useMemo(
    () =>
      new THREE.ShaderMaterial({
        ...beam,
        uniforms: { uTime: { value: 0 } },
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    [],
  )
  useEffect(
    () => () =>
      [walkers.fine, walkers.rough, walkers.solid, carrier, look, glow].forEach(
        (x) => x.dispose(),
      ),
    [walkers, carrier, look, glow],
  )
  const light = useRef<THREE.InstancedMesh>(null)
  const fine = useRef<Troop>(null)
  const rough = useRef<Troop>(null)
  const carriers = useRef<THREE.InstancedMesh>(null)
  const roads = useRef({
    key: '\0',
    routes: [] as Route[],
    cache: new Map<string, Point[]>(),
  })

  useFrame((state) => {
    const camera = state.camera as THREE.OrthographicCamera
    const t = still ? 0 : state.clock.elapsedTime
    const beams = light.current
    const near = fine.current
    const far = rough.current
    const flow = carriers.current
    if (!beams || !near || !far || !flow) return
    ;(beams.material as THREE.ShaderMaterial).uniforms.uTime.value = t
    const gap =
      GAP * 2 ** Math.max(0, Math.ceil(Math.log2(12 / camera.zoom / GAP)))
    const width = Math.max(THREAD, THREAD_PX / camera.zoom)
    const spot = near.geometry.getAttribute(
      'aSpot',
    ) as THREE.InstancedBufferAttribute
    const face = near.geometry.getAttribute(
      'aLook',
    ) as THREE.InstancedBufferAttribute
    let k = 0
    let n = 0
    for (const b of [...war.squads, ...war.mines]) {
      if (!b.from || b.x > dawn.current) continue
      const a = b.from
      const dx = b.x - a.x
      const dy = b.y - a.y
      const length = Math.hypot(dx, dy)
      if (length < 1) continue
      turn.setFromAxisAngle(Z, Math.atan2(-dy, dx))
      beams.setMatrixAt(
        k++,
        place.compose(
          at.set((a.x + b.x) / 2, -(a.y + b.y) / 2, LIFT),
          turn,
          size.set(length, width, 1),
        ),
      )
      const nx = -dy / length
      const ny = dx / length
      const count = Math.max(2, Math.floor(length / gap))
      for (const lane of [1, -1]) {
        const toward = Math.sign(dx * lane) || 1
        for (let i = 0; i < count && n < WALKERS; i++) {
          const seed = ((b.x * 7 + i * 13 + (lane > 0 ? 3 : 0)) % 97) / 97
          const u0 = (i + seed * 0.5) / count + (t * PACE * lane) / length
          const u = u0 - Math.floor(u0)
          const off = SIDE * lane + Math.sin(seed * 40) * 14
          spot.setXY(n, a.x + dx * u + nx * off, a.y + dy * u + ny * off)
          face.setXYZW(n, 0, t + seed * 20, seed, toward * 0.8)
          n++
        }
      }
    }
    beams.count = k
    beams.instanceMatrix.needsUpdate = true
    upload(spot, n)
    upload(face, n)
    const body = (BODY_UM / mpp) * BODY
    const big = body * camera.zoom >= FINE_PX
    for (const [mesh, on] of [
      [near, big],
      [far, !big],
    ] as const) {
      mesh.visible = on && n > 0
      mesh.geometry.instanceCount = n
      mesh.material.uniforms.uSize.value = body
    }

    const r = roads.current
    if (r.key !== war.lights) {
      r.key = war.lights
      r.routes = routes(war, r.cache)
    }
    let m = 0
    for (const route of r.routes) {
      const total = route.along[route.along.length - 1]
      if (total < 1) continue
      const count = Math.max(
        1,
        Math.floor((total / CARRY_GAP) * Math.min(1, 0.4 + route.rich)),
      )
      for (let i = 0; i < count && m < CARRIERS; i++) {
        const u0 = i / count + (t * WALK) / total
        const [p, toward] = walk(route, (u0 - Math.floor(u0)) * total)
        const hop = Math.abs(Math.sin(t * 9 + i * 1.7)) * CARRY * 0.3
        turn
          .setFromAxisAngle(
            Z,
            -toward * (0.1 + 0.06 * Math.sin(t * 9 + i * 1.7)),
          )
          .multiply(PITCH)
        flow.setMatrixAt(
          m++,
          place.compose(
            at.set(p.x, -p.y + hop, LIFT + 30),
            turn,
            size.setScalar(CARRY),
          ),
        )
      }
    }
    flow.count = m
    flow.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh
        ref={light}
        args={[undefined, glow, threads]}
        frustumCulled={false}
        renderOrder={52}
      >
        <planeGeometry />
      </instancedMesh>
      <mesh
        ref={rough}
        geometry={walkers.rough}
        material={walkers.solid}
        frustumCulled={false}
        renderOrder={57}
      />
      <mesh
        ref={fine}
        geometry={walkers.fine}
        material={walkers.solid}
        frustumCulled={false}
        renderOrder={57}
      />
      <instancedMesh
        ref={carriers}
        args={[carrier, look, CARRIERS]}
        frustumCulled={false}
        renderOrder={57}
      />
    </group>
  )
}
