'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { BLAST, FALL, type War } from './sim'

const MAX = 48
const SKY = BLAST * 7
const SIZE = SKY + BLAST * 2
const LIFT = 40

const shader = {
  vertexShader: /* glsl */ `
    attribute vec3 aComet;
    uniform float uTime;
    varying vec2 vLocal;
    varying float vAge;
    void main() {
      vLocal = position.xy * ${SIZE}.0;
      vAge = uTime - aComet.z + ${FALL};
      vec3 world = vec3(aComet.xy + vLocal, ${LIFT}.0);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(world, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform float uPx;
    varying vec2 vLocal;
    varying float vAge;
    const vec2 DIR = vec2(0.55, 0.835);
    void main() {
      float B = ${BLAST}.0;
      float f = clamp(vAge / ${FALL}, 0.0, 1.0);
      vec2 head = DIR * ${SKY}.0 * (1.0 - f * f);
      vec2 p = vLocal - head;
      float along = dot(p, DIR);
      float across = length(p - DIR * along);
      float falling = 1.0 - step(1.0, f);
      float wide = max(B * 0.18, uPx * 7.0) * (1.0 + along / (B * 4.0));
      float tail = falling * step(0.0, along) * exp(-along / (B * 3.0))
        * exp(-across * across / (wide * wide));
      float core = max(B * 0.3, uPx * 12.0);
      float glow = falling * exp(-dot(p, p) / (core * core));
      float e = clamp((vAge - ${FALL}) / 1.6, 0.0, 1.0);
      float hit = step(${FALL}, vAge);
      float r = length(vLocal);
      float band = max(B * 0.14, uPx * 4.0);
      float reachR = max(B, uPx * 40.0);
      float ring = hit * (1.0 - e) * exp(-pow((r - reachR * (0.3 + 1.1 * sqrt(e))) / band, 2.0));
      float flash = hit * exp(-e * 4.0) * exp(-r * r / (reachR * reachR * 0.6));
      vec3 gold = vec3(1.0, 0.82, 0.35);
      vec3 white = vec3(1.0, 0.98, 0.9);
      vec3 violet = vec3(0.55, 0.45, 1.0);
      vec3 c = gold * ring + white * flash + mix(violet, white, glow) * max(tail, glow);
      float a = clamp(ring + flash + tail * 0.9 + glow, 0.0, 1.0);
      if (a < 0.01) discard;
      gl_FragColor = vec4(c / max(a, 1e-3), a);
    }`,
}

export function Comets({ war }: { war: War }) {
  const geometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(2, 2)
    const g = new THREE.InstancedBufferGeometry()
    g.index = plane.index
    g.setAttribute('position', plane.getAttribute('position'))
    g.setAttribute(
      'aComet',
      new THREE.InstancedBufferAttribute(new Float32Array(MAX * 3), 3).setUsage(
        THREE.DynamicDrawUsage,
      ),
    )
    g.instanceCount = 0
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Infinity)
    return g
  }, [])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        ...shader,
        uniforms: { uTime: { value: 0 }, uPx: { value: 1 } },
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    [],
  )
  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )
  const mesh = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const m = mesh.current
    if (!m) return
    const g = m.geometry as THREE.InstancedBufferGeometry
    const comet = g.getAttribute('aComet') as THREE.InstancedBufferAttribute
    let n = 0
    for (const c of war.comets) {
      if (n >= MAX) break
      comet.setXYZ(n++, c.x, -c.y, c.at)
    }
    comet.needsUpdate = true
    g.instanceCount = n
    m.visible = n > 0
    const u = (m.material as THREE.ShaderMaterial).uniforms
    u.uTime.value = war.time
    u.uPx.value = 1 / state.camera.zoom
    if (n) state.invalidate()
  })

  return (
    <mesh
      ref={mesh}
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={68}
    />
  )
}
