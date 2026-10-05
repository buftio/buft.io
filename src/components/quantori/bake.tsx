'use client'

import { useLayoutEffect, useRef, type ReactNode } from 'react'
import {
  BufferAttribute,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  type BufferGeometry,
  type Group,
  type Material,
  type Object3D,
} from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

const SMALL = 0.05

const anchorOf = (object: Object3D, root: Object3D) => {
  for (let o = object.parent; o && o !== root; o = o.parent)
    if (o.userData.live) return o
  return root
}

const hidden = (object: Object3D, root: Object3D) => {
  for (let o: Object3D | null = object; o && o !== root; o = o.parent)
    if (!o.visible) return true
  return false
}

const meshesOf = (root: Object3D) => {
  const meshes: Mesh[] = []
  root.traverse((object) => {
    const mesh = object as Mesh
    if (
      mesh.isMesh &&
      !Array.isArray(mesh.material) &&
      !(mesh as Mesh & { isInstancedMesh?: boolean }).isInstancedMesh
    )
      meshes.push(mesh)
  })
  return meshes
}

const relative = (mesh: Object3D, anchor: Object3D) => {
  const matrix = mesh.matrix.clone()
  for (let o = mesh.parent; o && o !== anchor; o = o.parent)
    matrix.premultiply(o.matrix)
  return matrix
}

const radius = (mesh: Mesh, matrix: Matrix4) => {
  if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere()
  return (
    (mesh.geometry.boundingSphere?.radius ?? 0) * matrix.getMaxScaleOnAxis()
  )
}

const plain = (material: Material): material is MeshStandardMaterial =>
  material instanceof MeshStandardMaterial &&
  !material.map &&
  !material.transparent &&
  !material.vertexColors &&
  material.roughness === 0.92 &&
  material.metalness === 0 &&
  material.emissive.getHex() === 0

const paint = (part: BufferGeometry, material: MeshStandardMaterial) => {
  const { r, g, b } = material.color
  const count = part.attributes.position.count
  const colors = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) colors.set([r, g, b], i * 3)
  part.setAttribute('color', new BufferAttribute(colors, 3))
}

/** Merges the clay pieces inside into one mesh per material, so a model built from dozens of parts costs a few draw calls. Groups marked `userData.live` keep moving and carry their own merged pieces. With `tint`, plain clay of every color folds into one mesh that carries its colors per vertex. */
export function Bake({
  children,
  tint,
}: {
  children: ReactNode
  tint?: MeshStandardMaterial
}) {
  const root = useRef<Group>(null)
  useLayoutEffect(() => {
    const group = root.current
    if (!group) return
    group.updateWorldMatrix(true, true)
    const buckets = new Map<
      Object3D,
      Map<Material, { parts: BufferGeometry[]; shadow: boolean }>
    >()
    const sources: Mesh[] = []
    for (const mesh of meshesOf(group)) {
      const anchor = anchorOf(mesh, group)
      if (hidden(mesh, group)) continue
      const local = relative(mesh, anchor)
      const part = mesh.geometry.index
        ? mesh.geometry.toNonIndexed()
        : mesh.geometry.clone()
      for (const name of Object.keys(part.attributes))
        if (!['position', 'normal', 'uv'].includes(name))
          part.deleteAttribute(name)
      part.applyMatrix4(local)
      const byMaterial = buckets.get(anchor) ?? new Map()
      const own = mesh.material as Material
      const folded = !!tint && plain(own)
      if (folded) paint(part, own)
      const material = folded ? tint : own
      const bucket = byMaterial.get(material) ?? { parts: [], shadow: false }
      bucket.parts.push(part)
      bucket.shadow ||= mesh.castShadow && radius(mesh, local) >= SMALL
      byMaterial.set(material, bucket)
      buckets.set(anchor, byMaterial)
      sources.push(mesh)
    }
    const baked: Mesh[] = []
    for (const [anchor, byMaterial] of buckets)
      for (const [material, { parts, shadow }] of byMaterial) {
        const geometry = mergeGeometries(parts)
        parts.forEach((part) => part.dispose())
        if (!geometry) continue
        const mesh = new Mesh(geometry, material)
        mesh.castShadow = shadow
        mesh.receiveShadow = true
        anchor.add(mesh)
        baked.push(mesh)
      }
    sources.forEach((mesh) => (mesh.visible = false))
    return () => {
      baked.forEach((mesh) => {
        mesh.removeFromParent()
        mesh.geometry.dispose()
      })
      sources.forEach((mesh) => (mesh.visible = true))
    }
  }, [tint])
  return <group ref={root}>{children}</group>
}

/** Stops parts too small to throw a visible shadow from casting one, so the shadow pass skips them. Everything keeps animating. */
export function Slim({ children }: { children: ReactNode }) {
  const root = useRef<Group>(null)
  useLayoutEffect(() => {
    const group = root.current
    if (!group) return
    group.updateWorldMatrix(true, true)
    const trimmed = meshesOf(group).filter(
      (mesh) => mesh.castShadow && radius(mesh, relative(mesh, group)) < SMALL,
    )
    trimmed.forEach((mesh) => (mesh.castShadow = false))
    return () => trimmed.forEach((mesh) => (mesh.castShadow = true))
  }, [])
  return <group ref={root}>{children}</group>
}
