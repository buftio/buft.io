'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

const flameVertex = `
  varying vec2 vUv;
  uniform float uTime;
  void main() {
    vUv = uv;
    vec3 p = position;
    p.x += sin(uv.y * 9.0 - uTime * 2.3) * uv.y * 0.09;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`
const noise = `
  float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  float noise(vec2 p) {
    vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);
  }
  float fbm(vec2 p) { return noise(p)*0.55+noise(p*2.03)*0.28+noise(p*4.11)*0.13; }
`
const flameFragment = `
  varying vec2 vUv;
  uniform float uTime;
  ${noise}
  void main() {
    vec2 p=vUv;
    float n=fbm(vec2(p.x*5.0,p.y*4.0-uTime*1.5));
    float edge=abs(p.x-0.5)*2.0;
    float shape=1.0-edge-p.y*0.82+n*0.48-0.23;
    float flame=smoothstep(0.06,0.3,shape);
    float fade=pow(1.0-p.y,1.25)*smoothstep(0.0,0.08,p.y);
    vec3 color=mix(vec3(1.0,0.045,0.004),vec3(1.0,0.44,0.055),clamp(shape*1.6,0.0,1.0));
    color=mix(color,vec3(1.0,0.7,0.24),pow(max(0.0,shape),3.0));
    gl_FragColor=vec4(color*1.3,flame*fade*0.48);
  }
`

export function Flames({
  reduced = false,
  scale = 1,
  position = [0, 0, 0],
}: {
  reduced?: boolean
  scale?: number
  position?: [number, number, number]
}) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: flameVertex,
        fragmentShader: flameFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [],
  )
  useEffect(() => () => material.dispose(), [material])
  useFrame((_, delta) => {
    if (!reduced) material.uniforms.uTime.value += Math.min(delta, 0.05)
  })
  return (
    <group position={position} scale={scale}>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[0, 0.85, 0]}
          rotation={[0, (i * Math.PI) / 3, 0]}
          material={material}
        >
          <planeGeometry args={[1.4, 2, 1, 12]} />
        </mesh>
      ))}
    </group>
  )
}

export function Embers({ reduced = false }: { reduced?: boolean }) {
  const ref = useRef<THREE.ShaderMaterial>(null)
  const positions = useMemo(() => {
    const values = new Float32Array(420 * 3)
    for (let i = 0; i < 420; i++) {
      const s = Math.sin(i * 127.1 + 311.7) * 43758.5453
      const r = (s - Math.floor(s)) * 8
      const a = i * 2.39996
      values.set([Math.cos(a) * r, (i * 0.137) % 10, Math.sin(a) * r], i * 3)
    }
    return values
  }, [])
  useFrame((_, delta) => {
    if (ref.current && !reduced)
      ref.current.uniforms.uTime.value += Math.min(delta, 0.05)
  })
  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <shaderMaterial
        ref={ref}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{ uTime: { value: 0 } }}
        vertexShader={`uniform float uTime; varying float vLife; void main(){
        vec3 p=position; p.y=mod(p.y+uTime*0.35,10.0)-2.0;
        p.x+=sin(p.y*0.7+position.z)*0.45;
        vLife=1.0-smoothstep(2.0,8.0,p.y);
        vec4 mv=modelViewMatrix*vec4(p,1.0);
        gl_PointSize=clamp(22.0/-mv.z,1.0,4.0);
        gl_Position=projectionMatrix*mv;
      }`}
        fragmentShader={`varying float vLife; void main(){
        float a=1.0-smoothstep(0.05,0.5,length(gl_PointCoord-0.5));
        gl_FragColor=vec4(1.0,0.34,0.035,a*vLife*0.85);
      }`}
      />
    </points>
  )
}

export function FireCircle({ reduced = false }: { reduced?: boolean }) {
  return (
    <group>
      {Array.from({ length: 13 }, (_, i) => {
        const a = (i / 13) * Math.PI * 2
        return (
          <Flames
            key={i}
            reduced={reduced}
            scale={0.6 + (i % 3) * 0.16}
            position={[Math.sin(a) * 2.1, -2.0, Math.cos(a) * 1.9]}
          />
        )
      })}
      <pointLight
        position={[0, -0.3, 2]}
        color="#ff6b22"
        intensity={28}
        distance={12}
        decay={2}
      />
      <pointLight
        position={[-2, 0, -1]}
        color="#ff2408"
        intensity={18}
        distance={9}
        decay={2}
      />
      <Embers reduced={reduced} />
    </group>
  )
}
