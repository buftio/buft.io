'use client'

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import {
  CanvasTexture,
  DoubleSide,
  Matrix4,
  SRGBColorSpace,
  type InstancedMesh,
} from 'three'
import { colorsFor, paintRug, type RugDesign } from './design'

export function useRugTexture(design: RugDesign) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 270
    canvas.height = 390
    const ctx = canvas.getContext('2d')!
    paintRug(ctx, design, canvas.width, canvas.height)
    const result = new CanvasTexture(canvas)
    result.colorSpace = SRGBColorSpace
    result.anisotropy = 4
    return result
  }, [design])
  useEffect(() => () => texture.dispose(), [texture])
  return texture
}

export function Rug({
  design,
  width = 1.25,
  length = 1.8,
  rolled = false,
}: {
  design: RugDesign
  width?: number
  length?: number
  rolled?: boolean
}) {
  const map = useRugTexture(design)
  const fringe = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    if (!fringe.current) return
    for (let i = 0; i < 28; i++) {
      const x = (((i % 14) + 0.5) / 14 - 0.5) * width
      fringe.current.setMatrixAt(
        i,
        new Matrix4().makeTranslation(
          x,
          0,
          (i < 14 ? -1 : 1) * (length / 2 + 0.065),
        ),
      )
    }
    fringe.current.instanceMatrix.needsUpdate = true
  }, [width, length, rolled])
  if (rolled)
    return (
      <group>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0.14, 0]} castShadow>
          <cylinderGeometry args={[0.14, 0.14, width, 24]} />
          <meshStandardMaterial map={map} roughness={1} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={[side * (width / 2 + 0.005), 0.14, 0]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.1, 0.1, 0.015, 20]} />
            <meshStandardMaterial color={colorsFor(design)[3]} roughness={1} />
          </mesh>
        ))}
      </group>
    )
  return (
    <group>
      <mesh position={[0, -0.018, 0]} receiveShadow>
        <boxGeometry args={[width, 0.035, length]} />
        <meshStandardMaterial color={colorsFor(design)[0]} roughness={1} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.006, 0]}
        receiveShadow
      >
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial map={map} side={DoubleSide} roughness={1} />
      </mesh>
      <instancedMesh ref={fringe} args={[undefined, undefined, 28]}>
        <boxGeometry args={[0.025, 0.02, 0.14]} />
        <meshStandardMaterial color={colorsFor(design)[3]} roughness={1} />
      </instancedMesh>
    </group>
  )
}
