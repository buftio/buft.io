/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import {
  CurveModifier,
  CurveModifierRef,
  Environment,
  MeshReflectorMaterial,
  Point,
  Points,
  ScrollControls,
  useGLTF,
  useScroll,
} from '@react-three/drei'
import { Canvas, useFrame, useThree, type ThreeElements } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { ReactElement, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { KeyControlsHandler, KeyControlsProvider } from './key'

function Monk() {
  // Load the GLB file
  const obj = useGLTF('/sitting.glb')
  const { scene, animations } = obj

  // Animation mixer reference
  const mixer = useRef<THREE.AnimationMixer | null>(null)

  useEffect(() => {
    // Initialize the AnimationMixer when the component mounts
    mixer.current = new THREE.AnimationMixer(scene)

    // Play the first animation clip
    const action = mixer.current.clipAction(animations[0])
    action.play()

    // Cleanup the mixer when the component unmounts
    return () => {
      mixer.current?.stopAllAction()
    }
  }, [scene, animations])

  // Update the animation on every frame
  useFrame((state, delta) => {
    if (mixer.current) mixer.current.update(delta) // Advance animation based on time
  })

  return (
    <mesh position={[0.0, 0.0, 0.0]}>
      <primitive object={scene} />
    </mesh>
  )
}

function Rock() {
  // Load the GLB file
  const obj = useGLTF('/rock.glb')

  return (
    <mesh
      scale={2}
      position={[-1.8, -0.9, -0.3]}
      rotation={[0, (7 * Math.PI) / 4, 0]}
    >
      <primitive object={obj.scene} />
    </mesh>
  )
}

function curvePath({
  numPoints = 100,
  height = 20,
  radius = 3,
  turns = 1,
  y0 = -2,
}) {
  const ps = []

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * (Math.PI * 2) * turns
    const x = radius * Math.cos(angle)
    const y = (i / numPoints) * height // Height interpolation
    const z = radius * Math.sin(angle)
    ps.push(new THREE.Vector3(x, y + y0, z))
  }

  return ps
}

function Spiral({
  numPoints = 100,
  height = 20,
  children,
}: {
  numPoints?: number
  height?: number
  children: ReactElement<ThreeElements['mesh']>
}) {
  const scroll = useScroll()
  const ref = useRef<CurveModifierRef>(null)

  const camera = useThree((state) => state.camera)

  useFrame(() => {
    if (!ref.current) return

    //ref.current.uniforms.pathOffset.value = scroll.offset

    const point = curve.getPoint(1 - scroll.offset)

    if (!point) {
      return
    }

    camera.position.set(point.x, point.y, point.z)
    camera.lookAt(0, 0, 0)
  })

  const { curve, points } = useMemo(() => {
    const ps = curvePath({ numPoints, height, radius: 5, turns: 2 })
    return {
      curve: new THREE.CatmullRomCurve3(ps, false, 'catmullrom', 0.5),
      points: ps,
    }
  }, [numPoints, height])

  return (
    <>
      <CurveModifier curve={curve} ref={ref}>
        {children}
      </CurveModifier>
      <Points limit={numPoints}>
        <pointsMaterial size={0.1} color="blue" opacity={0.3} />
        {points.map((p, i) => (
          <Point key={i} position={p} />
        ))}
      </Points>
    </>
  )
}

function Olympus() {
  return (
    <>
      <Monk />
      <Rock />
    </>
  )
}

function _Scene() {
  return (
    <>
      <color attach="background" args={['#101009']} />

      <fog attach="fog" args={['#101009', 20, 30]} />

      <ambientLight intensity={0.25} />

      <mesh position={[0, -2.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <MeshReflectorMaterial
          blur={[400, 100]}
          mirror={0.75}
          resolution={1024}
          mixBlur={1}
          mixStrength={15}
          depthScale={1}
          minDepthThreshold={0.85}
          color="#151515"
          metalness={0.6}
          roughness={1}
        />
      </mesh>

      <ScrollControls pages={10}>
        <Spiral numPoints={100} height={4}>
          <mesh position={[0, 0, 0]}>
            <meshStandardMaterial color="black" />
            <boxGeometry args={[0, 0, 0]} />
          </mesh>
        </Spiral>

        <Olympus />
      </ScrollControls>

      <Environment preset="sunset" />

      <EffectComposer>
        <Bloom luminanceThreshold={0.5} intensity={0.1} />
      </EffectComposer>
    </>
  )
}

export function Scene() {
  return (
    <KeyControlsProvider>
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [5, 3, 6], fov: 50 }}
        gl={{ alpha: false }}
      >
        <_Scene />
        <KeyControlsHandler />
      </Canvas>
    </KeyControlsProvider>
  )
}
