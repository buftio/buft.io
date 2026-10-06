'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { gridTexture, noiseTexture, softTexture } from './goo-field'
import { gooFragment, gooVertex } from './goo-shader'
import { gooThread } from './goo-thread'
import { CELL, type War } from './sim'

const FRONT_PX = 3

export function paint(war: War, data: Uint8Array) {
  for (let i = 0; i < war.corrupt.length; i++) {
    const p = i * 4
    data[p] = Math.round(war.corrupt[i] * 255)
    data[p + 1] = war.seen[i] ? 255 : 0
    data[p + 2] = war.guard[i] ? 255 : 0
    data[p + 3] = war.tissue[i] ? (war.scar[i] ? 160 : 255) : 0
  }
}

export function fieldTexture(war: War) {
  const data = new Uint8Array(war.cols * war.rows * 4)
  const field = new THREE.DataTexture(
    data,
    war.cols,
    war.rows,
    THREE.RGBAFormat,
  )
  field.magFilter = THREE.LinearFilter
  field.minFilter = THREE.LinearMipmapLinearFilter
  field.generateMipmaps = true
  return field
}

export function Corruption({
  war,
  texture,
  version,
  dawn,
  reduced,
}: {
  war: War
  texture: THREE.DataTexture
  version: { current: number }
  dawn: RefObject<number>
  reduced: boolean
}) {
  const aux = useMemo(() => gridTexture(war), [war])
  const soft = useMemo(() => softTexture(war), [war])
  const noise = useMemo(() => noiseTexture(), [])
  const goo = useRef<ReturnType<typeof gooThread> | null>(null)
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: gooVertex,
        fragmentShader: gooFragment,
        uniforms: {
          uField: { value: texture },
          uAux: { value: aux },
          uSoft: { value: soft },
          uNoise: { value: noise },
          uWorld: {
            value: new THREE.Vector2(war.cols * CELL, war.rows * CELL),
          },
          uGrid: { value: new THREE.Vector2(war.cols, war.rows) },
          uTime: { value: 0 },
          uZoom: { value: 0.01 },
          uReach: { value: 0 },
          uDawn: { value: 0 },
        },
        transparent: true,
        depthTest: false,
      }),
    [texture, aux, soft, noise, war],
  )
  const mesh = useRef<THREE.Mesh>(null)
  const painted = useRef(-1)
  const stirred = useRef(-1)

  useEffect(() => {
    const thread = gooThread(aux, soft)
    goo.current = thread
    return () => {
      thread.stop()
      goo.current = null
    }
  }, [aux, soft])

  useEffect(
    () => () => {
      material.dispose()
      aux.dispose()
      soft.dispose()
      noise.dispose()
    },
    [material, aux, soft, noise],
  )

  useFrame((state) => {
    const shaded = mesh.current?.material as THREE.ShaderMaterial | undefined
    if (!shaded) return
    const u = shaded.uniforms
    u.uDawn.value = dawn.current / (war.cols * CELL)
    if (!reduced) u.uTime.value = state.clock.elapsedTime
    u.uZoom.value = state.camera.zoom
    u.uReach.value = Math.max(CELL * 0.35, FRONT_PX / state.camera.zoom)
    if (painted.current !== version.current) {
      painted.current = version.current
      const field = u.uField.value as THREE.DataTexture
      paint(war, field.image.data as Uint8Array)
      field.needsUpdate = true
    }
    if (stirred.current !== version.current && goo.current?.stir(war))
      stirred.current = version.current
  })

  const width = war.cols * CELL
  const height = war.rows * CELL
  return (
    <mesh
      ref={mesh}
      material={material}
      position={[width / 2, -height / 2, 0]}
      scale={[width, height, 1]}
      renderOrder={50}
    >
      <planeGeometry />
    </mesh>
  )
}
