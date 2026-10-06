'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { GLASS, type SlideMeta } from './slide-data'

const FEATHER = 1800

export function Feather({ meta }: { meta: SlideMeta }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(GLASS) },
          uSize: { value: new THREE.Vector2(meta.width, meta.height) },
          uFeather: { value: FEATHER },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform vec2 uSize;
          uniform float uFeather;
          varying vec2 vUv;
          void main() {
            vec2 p = vUv * uSize;
            float edge = min(min(p.x, uSize.x - p.x), min(p.y, uSize.y - p.y));
            float a = 1.0 - smoothstep(0.0, uFeather, edge);
            gl_FragColor = vec4(uColor, a);
            #include <colorspace_fragment>
          }`,
        transparent: true,
        depthTest: false,
        toneMapped: false,
      }),
    [meta],
  )
  return (
    <mesh
      material={material}
      position={[meta.width / 2, -meta.height / 2, 0]}
      scale={[meta.width, meta.height, 1]}
      renderOrder={50}
    >
      <planeGeometry />
    </mesh>
  )
}
