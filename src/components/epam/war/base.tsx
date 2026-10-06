'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { animated, state, tick } from './fortress-shade'
import { CELL, type Point, type War } from './sim'
import { CASTLES, siteAt } from './sites'
import { castleShape, CROWN } from './warm'

const CASTLE = 900
const CAPITAL = 1250
const PITCH = new THREE.Quaternion().setFromEuler(
  new THREE.Euler((50 * Math.PI) / 180, 0, 0),
)
const FLAT = new THREE.Quaternion()
const place = new THREE.Matrix4()
const at = new THREE.Vector3()
const size = new THREE.Vector3()
const NEAR = 4000
const LIT = new THREE.Color('#ffffff')
const DARK = new THREE.Color('#6f6679')
const BLIGHT = Math.ceil(2400 / CELL)

function blighted(war: War, c: Point) {
  const [cx, cy] = [Math.floor(c.x / CELL), Math.floor(c.y / CELL)]
  for (let dy = -BLIGHT; dy <= BLIGHT; dy += 2)
    for (let dx = -BLIGHT; dx <= BLIGHT; dx += 2) {
      const [x, y] = [cx + dx, cy + dy]
      if (
        x < 0 ||
        y < 0 ||
        x >= war.cols ||
        y >= war.rows ||
        dx * dx + dy * dy > BLIGHT * BLIGHT
      )
        continue
      const i = y * war.cols + x
      if (war.seen[i] && war.corrupt[i] > 0.3) return true
    }
  return false
}

const alarmed = (war: War, c: Point) =>
  war.squads.some(
    (s) => s.fighting && Math.hypot(s.x - c.x, s.y - c.y) < NEAR,
  ) || blighted(war, c)

export function Base({
  war,
  dawn,
  reduced,
}: {
  war: War
  dawn: RefObject<number>
  reduced: boolean
}) {
  const count = war.castles.length
  const kinds = useMemo(
    () =>
      war.castles.map((c) => {
        const id = siteAt(CASTLES, c)?.id ?? ''
        const shape = castleShape(id)
        shape.setAttribute('aState', state(1, [1, 1, 0]))
        return { shape, size: id === CROWN ? CAPITAL : CASTLE }
      }),
    [war],
  )
  const look = useMemo(() => animated(0.85), [])
  useEffect(
    () => () =>
      [look, ...kinds.map((k) => k.shape)].forEach((x) => x.dispose()),
    [kinds, look],
  )
  const castles = useRef<(THREE.InstancedMesh | null)[]>([])
  const shadows = useRef<THREE.InstancedMesh>(null)
  const checked = useRef(-1)

  useFrame((frame) => {
    const t = reduced ? 0 : frame.clock.elapsedTime
    const check = frame.clock.elapsedTime - checked.current > 0.5
    if (check) checked.current = frame.clock.elapsedTime
    war.castles.forEach((c, k) => {
      const mesh = castles.current[k]
      if (!mesh) return
      tick(mesh, t)
      if (check) {
        const alarm = mesh.geometry.getAttribute(
          'aState',
        ) as THREE.InstancedBufferAttribute
        alarm.setXYZ(0, 1, c.lit ? 1 : 0, c.lit && alarmed(war, c) ? 1 : 0)
        alarm.needsUpdate = true
      }
      const s = c.known && c.x <= dawn.current ? kinds[k].size : 0
      mesh.visible = s > 0
      mesh.setColorAt(0, c.lit ? LIT : DARK)
      const bob = 1 + 0.015 * Math.sin(t * 2 + k)
      mesh.setMatrixAt(
        0,
        place.compose(at.set(c.x, -c.y, 0), PITCH, size.set(s, s * bob, s)),
      )
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
      shadows.current?.setMatrixAt(
        k,
        place.compose(
          at.set(c.x, -c.y - 0.12 * s, 0),
          FLAT,
          size.set(1.1 * s, 0.75 * s, 1),
        ),
      )
    })
    if (shadows.current) shadows.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh
        ref={shadows}
        args={[undefined, undefined, count]}
        frustumCulled={false}
        renderOrder={57}
      >
        <circleGeometry args={[1, 32]} />
        <meshBasicMaterial
          color="#2a1630"
          transparent
          opacity={0.22}
          depthTest={false}
          depthWrite={false}
        />
      </instancedMesh>
      {kinds.map(({ shape }, k) => (
        <instancedMesh
          key={k}
          ref={(mesh) => {
            castles.current[k] = mesh
          }}
          args={[shape, look, 1]}
          frustumCulled={false}
          renderOrder={58}
        />
      ))}
    </group>
  )
}
