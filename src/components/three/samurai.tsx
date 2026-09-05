'use client'

import { useGLTF, useAnimations } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { clone } from 'three/addons/utils/SkeletonUtils.js'

const fadeDuration = 1.1

function useFadeIn(scene: THREE.Object3D) {
  const fade = useMemo(() => {
    const materials: THREE.Material[] = []
    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      const material = object.material as THREE.Material
      material.transparent = true
      material.opacity = 0
      materials.push(material)
    })
    return { materials, elapsed: 0 }
  }, [scene])
  useFrame((_, delta) => {
    if (fade.elapsed >= fadeDuration) return
    fade.elapsed += Math.min(delta, 0.05)
    const t = Math.min(fade.elapsed / fadeDuration, 1)
    for (const material of fade.materials) {
      material.opacity = t * t * (3 - 2 * t)
      if (t === 1) material.transparent = false
    }
  })
}

export function Samurai({ reduced }: { reduced: boolean }) {
  const source = useGLTF('/sitting.glb')
  const scene = useMemo(() => {
    const result = clone(source.scene)
    result.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      object.castShadow = true
      const material = (object.material as THREE.MeshStandardMaterial).clone()
      material.emissiveIntensity = 0.08
      material.roughness = 0.72
      material.metalness = 0.28
      object.material = material
    })
    return result
  }, [source.scene])
  useFadeIn(scene)
  const { actions, names } = useAnimations(source.animations, scene)
  useEffect(() => {
    const action = actions[names[0]]
    if (!action) return
    action.play()
    action.paused = reduced
    return () => {
      action.stop()
    }
  }, [actions, names, reduced])
  return <primitive object={scene} />
}

export function Rock() {
  const source = useGLTF('/rock.glb')
  const scene = useMemo(() => {
    const result = source.scene.clone(true)
    result.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      const material = (object.material as THREE.MeshStandardMaterial).clone()
      material.color.set('#514341')
      material.roughness = 0.93
      object.material = material
      object.receiveShadow = true
    })
    return result
  }, [source.scene])
  useFadeIn(scene)
  return (
    <primitive
      object={scene}
      scale={2}
      position={[-1.8, -0.9, -0.3]}
      rotation={[0, (7 * Math.PI) / 4, 0]}
    />
  )
}
