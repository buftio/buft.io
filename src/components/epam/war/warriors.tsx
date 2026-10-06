'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { CAPACITY, type Crowd } from './crowd'
import { warriorGeometry } from './warrior-model'
import { warriorFragment, warriorVertex } from './warrior-shader'
import { sprite } from './warrior-sprite'

const CELL_UM = 12
export const BODY = 0.95
const SOLID_PX = [5, 7]
export const FINE_PX = 26
const LIFT = 24

const calm = () =>
  typeof matchMedia !== 'undefined' &&
  matchMedia('(prefers-reduced-motion: reduce)').matches

type Troop = THREE.Mesh<THREE.InstancedBufferGeometry, THREE.ShaderMaterial>

function troop(
  fine: boolean,
  spot: THREE.InstancedBufferAttribute,
  look: THREE.InstancedBufferAttribute,
) {
  const shape = warriorGeometry(fine)
  const g = new THREE.InstancedBufferGeometry()
  for (const [name, attribute] of Object.entries(shape.attributes))
    g.setAttribute(name, attribute)
  g.setAttribute('aSpot', spot)
  g.setAttribute('aLook', look)
  g.instanceCount = 0
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Infinity)
  return g
}

export function upload(attribute: THREE.BufferAttribute, n: number) {
  attribute.clearUpdateRanges()
  attribute.addUpdateRange(0, n * attribute.itemSize)
  attribute.needsUpdate = true
}

export function army(capacity: number, lift: number, move: boolean) {
  const spot = new THREE.InstancedBufferAttribute(
    new Float32Array(capacity * 2),
    2,
  ).setUsage(THREE.DynamicDrawUsage)
  const look = new THREE.InstancedBufferAttribute(
    new Float32Array(capacity * 4),
    4,
  ).setUsage(THREE.DynamicDrawUsage)
  const solid = new THREE.ShaderMaterial({
    vertexShader: warriorVertex,
    fragmentShader: warriorFragment,
    uniforms: {
      uSize: { value: 1 },
      uLift: { value: lift },
      uMove: { value: move ? 1 : 0 },
    },
    vertexColors: true,
    transparent: true,
    side: THREE.DoubleSide,
  })
  return {
    fine: troop(true, spot, look),
    rough: troop(false, spot, look),
    solid,
  }
}

export function Warriors({
  crowd,
  mpp,
  dawn,
}: {
  crowd: Crowd
  mpp: number
  dawn: RefObject<number>
}) {
  const geometry = useMemo(() => {
    const shape = new THREE.BufferGeometry()
    shape.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(CAPACITY * 3), 3),
    )
    shape.setAttribute(
      'aLook',
      new THREE.BufferAttribute(new Float32Array(CAPACITY * 4), 4),
    )
    shape.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Infinity)
    return shape
  }, [])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        ...sprite,
        uniforms: {
          uPx: { value: 0 },
          uDpr: { value: 1 },
          uFade: { value: 1 },
          uDawn: { value: 0 },
        },
        transparent: true,
        depthTest: false,
      }),
    [],
  )
  const troops = useMemo(() => army(CAPACITY, LIFT, !calm()), [])
  useEffect(
    () => () => {
      for (const g of [geometry, troops.fine, troops.rough]) g.dispose()
      material.dispose()
      troops.solid.dispose()
    },
    [geometry, material, troops],
  )
  const points = useRef<THREE.Points>(null)
  const fine = useRef<Troop>(null)
  const rough = useRef<Troop>(null)

  useFrame((state) => {
    const sprites = points.current
    const near = fine.current
    const far = rough.current
    if (!sprites || !near || !far) return
    const camera = state.camera as THREE.OrthographicCamera
    const cell = CELL_UM / mpp
    const px = cell * camera.zoom
    const solid = THREE.MathUtils.smoothstep(
      px * BODY,
      SOLID_PX[0],
      SOLID_PX[1],
    )
    const agents = crowd.agents
    const shaded = sprites.material as THREE.ShaderMaterial
    shaded.uniforms.uPx.value = px
    shaded.uniforms.uDpr.value = state.gl.getPixelRatio()
    shaded.uniforms.uDawn.value = dawn.current
    shaded.uniforms.uFade.value = 1 - solid
    sprites.visible = solid < 1
    if (sprites.visible) {
      const { geometry: shape } = sprites
      const position = shape.getAttribute('position') as THREE.BufferAttribute
      const look = shape.getAttribute('aLook') as THREE.BufferAttribute
      for (let k = 0; k < agents.length; k++) {
        const a = agents[k]
        position.setXYZ(k, a.x, -a.y, 0)
        look.setXYZW(k, a.state, a.age, a.seed, a.face)
      }
      upload(position, agents.length)
      upload(look, agents.length)
      shape.setDrawRange(0, agents.length)
    }
    let n = 0
    if (solid > 0) {
      const spot = near.geometry.getAttribute(
        'aSpot',
      ) as THREE.InstancedBufferAttribute
      const look = near.geometry.getAttribute(
        'aLook',
      ) as THREE.InstancedBufferAttribute
      const margin = cell * 2
      const halfW = state.size.width / 2 / camera.zoom + margin
      const halfH = state.size.height / 2 / camera.zoom + margin
      const cx = camera.position.x
      const cy = -camera.position.y
      const edge = Math.min(dawn.current, cx + halfW)
      const s = spot.array as Float32Array
      const l = look.array as Float32Array
      for (const a of agents) {
        if (a.x > edge || a.x < cx - halfW || Math.abs(a.y - cy) > halfH)
          continue
        s[n * 2] = a.x
        s[n * 2 + 1] = a.y
        l[n * 4] = a.state
        l[n * 4 + 1] = a.age
        l[n * 4 + 2] = a.seed
        l[n * 4 + 3] = a.face
        n++
      }
      upload(spot, n)
      upload(look, n)
    }
    const big = px * BODY >= FINE_PX
    for (const [mesh, on] of [
      [near, big],
      [far, !big],
    ] as const) {
      mesh.visible = on && n > 0
      mesh.geometry.instanceCount = n
      mesh.material.uniforms.uSize.value = cell * BODY
    }
  })

  return (
    <group>
      <mesh
        ref={rough}
        geometry={troops.rough}
        material={troops.solid}
        frustumCulled={false}
        renderOrder={61}
      />
      <mesh
        ref={fine}
        geometry={troops.fine}
        material={troops.solid}
        frustumCulled={false}
        renderOrder={61}
      />
      <points
        ref={points}
        geometry={geometry}
        material={material}
        renderOrder={61}
      />
    </group>
  )
}
