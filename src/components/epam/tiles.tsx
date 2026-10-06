'use client'

import { createPortal, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { fitRelief, makeRelief, RELIEF } from './relief'
import { tileExists, tileUrl, type SlideMeta } from './slide-data'
import { fog, fogged } from './war/fog'

type Entry = {
  state: 'loading' | 'ready' | 'missing'
  mesh?: THREE.Mesh
  used: number
}

const CACHE_LIMIT = 260
const PRELOAD = 2

export function Tiles({
  meta,
  onLoaded,
}: {
  meta: SlideMeta
  onLoaded: (tiles: number, bytes: number) => void
}) {
  const group = useRef<THREE.Group>(null)
  const cache = useRef(new Map<string, Entry>())
  const plane = useMemo(() => new THREE.PlaneGeometry(1, 1), [])
  const seen = useRef(new Set<string>())
  const bytes = useRef(0)
  const invalidate = useThree((state) => state.invalidate)
  const gl = useThree((state) => state.gl)
  const stage = useMemo(() => new THREE.Scene(), [])
  const relief = useMemo(
    () => (RELIEF ? makeRelief(meta.width, meta.height) : null),
    [meta],
  )
  const buffer = useMemo(() => new THREE.Vector2(), [])

  const request = (z: number, x: number, y: number, frame: number) => {
    const key = `${z}/${x}_${y}`
    const hit = cache.current.get(key)
    if (hit) {
      hit.used = frame
      return hit
    }
    const entry: Entry = { state: 'loading', used: frame }
    cache.current.set(key, entry)
    fetch(tileUrl(meta, z, x, y))
      .then((response) => {
        if (!response.ok) throw new Error(`${response.status}`)
        return response.blob()
      })
      .then(async (blob) => {
        const bitmap = await createImageBitmap(blob, {
          imageOrientation: 'flipY',
        })
        if (!seen.current.has(key)) {
          seen.current.add(key)
          bytes.current += blob.size
          onLoaded(seen.current.size, bytes.current)
        }
        if (cache.current.get(key) !== entry) return bitmap.close()
        const texture = new THREE.Texture(bitmap)
        texture.flipY = false
        texture.needsUpdate = true
        texture.colorSpace = THREE.SRGBColorSpace
        texture.generateMipmaps = false
        texture.minFilter = THREE.LinearFilter
        texture.anisotropy = gl.capabilities.getMaxAnisotropy()
        const s = 2 ** (meta.zmax - z)
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          toneMapped: false,
          depthTest: false,
          transparent: true,
          opacity: 0,
        })
        fogged(material)
        const mesh = new THREE.Mesh(plane, material)
        const w = bitmap.width * s
        const h = bitmap.height * s
        const x0 = x * meta.tile * s
        const y0 = y * meta.tile * s
        mesh.scale.set(w, h, 1)
        mesh.position.set(x0 + w / 2, -(y0 + h / 2), 0)
        mesh.renderOrder = z
        mesh.visible = false
        entry.mesh = mesh
        entry.state = 'ready'
        group.current?.add(mesh)
        invalidate()
      })
      .catch(() => {
        entry.state = 'missing'
      })
    return entry
  }

  useEffect(() => {
    for (let z = 0; z <= PRELOAD; z++) {
      const s = 2 ** (meta.zmax - z) * meta.tile
      for (let y = 0; y < Math.ceil(meta.height / s); y++)
        for (let x = 0; x < Math.ceil(meta.width / s); x++)
          request(z, x, y, Number.MAX_SAFE_INTEGER)
    }
    const entries = cache.current
    return () => {
      for (const entry of entries.values()) dispose(entry)
      entries.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta])

  const frame = useRef(0)
  const drawn = useRef('')
  useFrame((state, delta) => {
    const camera = state.camera as THREE.OrthographicCamera
    const dpr = state.gl.getPixelRatio()
    const scale = camera.zoom
    const level = Math.max(0, Math.floor(Math.log2(1 / (scale * dpr * 0.9))))
    const target = Math.max(0, meta.zmax - level)
    const halfW = state.size.width / 2 / scale
    const halfH = state.size.height / 2 / scale
    const left = camera.position.x - halfW
    const right = camera.position.x + halfW
    const top = -camera.position.y - halfH
    const bottom = -camera.position.y + halfH
    const now = ++frame.current
    const shown = new Set<THREE.Mesh>()
    let fading = false
    for (let z = 0; z <= target; z++) {
      const s = 2 ** (meta.zmax - z) * meta.tile
      const x0 = Math.max(0, Math.floor(left / s))
      const x1 = Math.min(Math.ceil(meta.width / s) - 1, Math.floor(right / s))
      const y0 = Math.max(0, Math.floor(top / s))
      const y1 = Math.min(
        Math.ceil(meta.height / s) - 1,
        Math.floor(bottom / s),
      )
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) {
          const wanted =
            z === target ||
            z <= PRELOAD ||
            (z === meta.capZ && target > meta.capZ)
          const entry =
            wanted && tileExists(meta, z, x, y)
              ? request(z, x, y, now)
              : cache.current.get(`${z}/${x}_${y}`)
          if (entry?.mesh) {
            entry.used = Math.max(entry.used, now)
            shown.add(entry.mesh)
          }
        }
    }
    for (const entry of cache.current.values()) {
      const mesh = entry.mesh
      if (!mesh) continue
      const material = mesh.material as THREE.MeshBasicMaterial
      mesh.visible = shown.has(mesh)
      if (mesh.visible && material.opacity < 1) {
        material.opacity = Math.min(
          1,
          material.opacity + Math.min(delta, 1 / 30) * 5,
        )
        fading = true
      }
    }
    if (fading) state.invalidate()
    if (cache.current.size > CACHE_LIMIT) evict(cache.current, now)
    if (!relief) return
    state.gl.getDrawingBufferSize(buffer)
    const map = fog.uFog.value
    const key = [
      camera.position.x,
      camera.position.y,
      scale,
      buffer.x,
      buffer.y,
      fading,
      map.uuid,
      map.version,
      fog.uFogOn.value,
      fog.uFogSize.value.x,
      fog.uFogSize.value.y,
      ...[...shown].map((mesh) => mesh.id),
    ].join()
    if (key === drawn.current && !fading) return
    drawn.current = key
    fitRelief(relief, buffer.x, buffer.y, scale * dpr, left, bottom, right, top)
    state.gl.setRenderTarget(relief.target)
    state.gl.render(stage, camera)
    state.gl.setRenderTarget(null)
  })

  useEffect(
    () => () => {
      relief?.target.dispose()
      relief?.material.dispose()
    },
    [relief],
  )

  if (!relief) return <group ref={group} />
  return (
    <>
      {createPortal(<group ref={group} />, stage)}
      <mesh material={relief.material} frustumCulled={false} renderOrder={-10}>
        <planeGeometry args={[2, 2]} />
      </mesh>
    </>
  )
}

function dispose(entry: Entry) {
  if (!entry.mesh) return
  const material = entry.mesh.material as THREE.MeshBasicMaterial
  const image = material.map?.image as ImageBitmap | undefined
  material.map?.dispose()
  image?.close()
  material.dispose()
  entry.mesh.removeFromParent()
}

function evict(cache: Map<string, Entry>, now: number) {
  const stale = [...cache.entries()]
    .filter(([, entry]) => entry.used < now && entry.state !== 'loading')
    .sort((a, b) => a[1].used - b[1].used)
  for (const [key, entry] of stale.slice(0, cache.size - CACHE_LIMIT)) {
    dispose(entry)
    cache.delete(key)
  }
}
