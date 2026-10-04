'use client'

import { Sparkles } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type RefObject } from 'react'
import {
  CanvasTexture,
  DoubleSide,
  MeshStandardMaterial,
  type BufferGeometry,
  type Mesh,
  Quaternion,
  SRGBColorSpace,
  Vector3,
  type Group,
} from 'three'
import { Clay, geo, palette } from '../marketdata/models/clay'
import { gold } from './docking'
import { Confetti, Flash, useTrail } from './fx'
import { PIG, timeline } from './layout'

const glass = new MeshStandardMaterial({
  color: '#e8f4ff',
  transparent: true,
  opacity: 0.45,
  roughness: 0.1,
})
export const TIP = 0.82

/** A syringe gun pointing along +x. */
export function Syringe() {
  return (
    <group>
      <mesh geometry={geo.cylinder} material={glass} scale={[0.24, 0.72, 0.24]} rotation={[0, 0, Math.PI / 2]} />
      <mesh geometry={geo.cylinder} material={gold} scale={[0.17, 0.5, 0.17]} position={[0.08, 0, 0]} rotation={[0, 0, Math.PI / 2]} />
      <Clay shape="cylinder" color="#d9dde2" size={[0.07, 0.42, 0.07]} position={[-0.52, 0, 0]} rotation={[0, 0, Math.PI / 2]} />
      <Clay shape="cylinder" color="#d9dde2" size={[0.24, 0.05, 0.24]} position={[-0.74, 0, 0]} rotation={[0, 0, Math.PI / 2]} />
      <Clay shape="box" color="#d9dde2" size={[0.05, 0.44, 0.14]} position={[-0.36, 0, 0]} />
      <Clay shape="cone" color="#d9dde2" size={[0.13, 0.12, 0.13]} position={[0.42, 0, 0]} rotation={[0, 0, -Math.PI / 2]} />
      <Clay shape="cylinder" color={palette.steel} size={[0.025, 0.36, 0.025]} position={[0.62, 0, 0]} rotation={[0, 0, Math.PI / 2]} />
      <Clay shape="box" color={palette.terracotta} size={[0.12, 0.32, 0.12]} position={[-0.22, -0.24, 0]} rotation={[0, 0, 0.25]} />
    </group>
  )
}

export function Dart() {
  return (
    <group>
      <Clay shape="cylinder" color="#d9dde2" size={[0.06, 0.22, 0.06]} rotation={[0, 0, Math.PI / 2]} />
      <mesh geometry={geo.sphere} material={gold} scale={[0.18, 0.08, 0.08]} position={[-0.05, 0, 0]} />
      <Clay shape="cylinder" color={palette.steel} size={[0.02, 0.16, 0.02]} position={[0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]} />
    </group>
  )
}

const X = new Vector3(1, 0, 0)
const ease = (p: number) => {
  const c = Math.min(1, Math.max(0, p))
  return c * c * (3 - 2 * c)
}
const W = 1.2
const H = 0.8
const R = 0.075
const SHEET = new Vector3(-1.65, 1.3, 1.5)

function pageTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 600
  canvas.height = 400
  const g = canvas.getContext('2d')
  if (!g) return null
  g.fillStyle = '#fbf6ec'
  g.fillRect(0, 0, 600, 400)
  g.fillStyle = '#5d6b84'
  g.font = '500 18px "DM Mono", monospace'
  g.fillText('RESEARCH NOTES · 70+ RESEARCHERS', 44, 60)
  g.fillStyle = '#1f2a3d'
  g.font = '800 38px Manrope, sans-serif'
  g.fillText('Scattered research,', 44, 112)
  g.fillText('put together.', 44, 156)
  g.strokeStyle = '#3f5f9e'
  g.lineWidth = 4
  g.beginPath()
  ;[0, 1, 2, 3, 4, 5].forEach((i) => g.lineTo(60 + i * 44, i % 2 ? 210 : 245))
  g.stroke()
  ;[0, 1, 2, 3, 4, 5].forEach((i) => {
    g.beginPath()
    g.arc(60 + i * 44, i % 2 ? 210 : 245, 11, 0, Math.PI * 2)
    g.fillStyle = '#ffc94a'
    g.fill()
    g.stroke()
  })
  g.fillStyle = '#d9ccb2'
  ;[300, 330, 360].forEach((y, i) => g.fillRect(44, y, [360, 300, 220][i], 10))
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

function curl(geometry: BufferGeometry, base: Float32Array, p: number) {
  const position = geometry.attributes.position
  const front = W * (1 - p)
  for (let i = 0; i < position.count; i++) {
    const x = base[i * 3] + W / 2
    const y = base[i * 3 + 1]
    if (x <= front) {
      position.setXYZ(i, x, y, 0)
      continue
    }
    const angle = (x - front) / R
    const radius = R * (1 - 0.05 * angle / Math.PI)
    position.setXYZ(i, front + Math.sin(angle) * radius, y, (1 - Math.cos(angle)) * radius)
  }
  position.needsUpdate = true
  geometry.computeVertexNormals()
}

/** The page appears, curls into a scroll, the scroll turns into a syringe, and it shoots the pig. Arena-local. */
export function RollSequence({ since }: { since: RefObject<number> }) {
  const carrier = useRef<Group>(null)
  const scroll = useRef<Group>(null)
  const gun = useRef<Group>(null)
  const dart = useRef<Group>(null)
  const { enter, paper: rolled, syringe: formed, aim, hit } = timeline.roll
  const origin = useMemo(() => new Vector3(-1.2, 1.1, 0.6), [])
  const butt = useMemo(() => new Vector3(PIG[0] - 0.42, 0.5, PIG[2]), [])
  const aimed = useMemo(
    () => new Quaternion().setFromUnitVectors(X, butt.clone().sub(origin).normalize()),
    [butt, origin],
  )
  const level = useMemo(() => new Quaternion(), [])
  const page = useRef<Mesh>(null)
  const base = useRef<Float32Array | null>(null)
  const texture = useMemo(() => pageTexture(), [])
  const trail = useTrail(12)
  const tip = useMemo(() => new Vector3(), [])
  const next = useMemo(() => new Vector3(), [])
  useFrame(({ clock }) => {
    const s = clock.elapsedTime - since.current
    const appear = ease((s - enter) / 0.45)
    const p = ease((s - enter - 0.35) / (rolled - enter - 0.35))
    const morph = ease((s - rolled) / (formed - rolled))
    const mesh = page.current
    if (mesh) {
      base.current ??= Float32Array.from(mesh.geometry.attributes.position.array)
      curl(mesh.geometry, base.current, p)
      const material = mesh.material as MeshStandardMaterial
      material.opacity = appear
      material.emissiveIntensity = ease((s - rolled + 0.5) / 0.6) * 0.9
    }
    const box = carrier.current
    if (box) {
      box.position.lerpVectors(SHEET, origin, morph)
      box.position.y += Math.sin(ease((s - enter) / 0.6) * Math.PI) * 0.12 + Math.sin(morph * Math.PI) * 0.35
      box.quaternion.slerpQuaternions(level, aimed, ease((s - formed) / (aim - formed)))
      const windup = ease((s - (aim - 0.35)) / 0.3)
      const recoil = s > aim ? Math.exp(-(s - aim) * 10) : 0
      box.translateX(-0.22 * windup * (1 - Math.min(1, recoil + (s > aim ? 1 : 0))) - 0.25 * recoil)
    }
    if (scroll.current) {
      scroll.current.visible = morph < 0.65
      scroll.current.rotation.set(0, morph * Math.PI * 3, (-Math.PI / 2) * morph)
      scroll.current.scale.setScalar((0.7 + 0.3 * appear) * (1 - ease((morph - 0.35) / 0.3)))
    }
    if (gun.current) {
      const grow = ease((morph - 0.4) / 0.6)
      gun.current.visible = grow > 0
      gun.current.scale.setScalar(grow * (1 + Math.sin(grow * Math.PI) * 0.25))
      gun.current.rotation.x = (1 - grow) * Math.PI * 2
    }
    const flight = (s - aim) / (hit - aim)
    const flying = flight > 0 && flight < 1
    tip.copy(origin).add(X.clone().applyQuaternion(aimed).multiplyScalar(TIP))
    const at = (f: number, out: Vector3) => out.lerpVectors(tip, butt, f).setY(out.y + Math.sin(f * Math.PI) * 0.35)
    if (dart.current) {
      dart.current.visible = flying
      at(Math.min(1, Math.max(0, flight)), dart.current.position)
      dart.current.lookAt(at(Math.min(1, Math.max(0, flight) + 0.05), next))
      dart.current.rotateY(-Math.PI / 2)
    }
    const point = dart.current?.position
    trail.push(point?.x ?? 0, point?.y ?? 0, point?.z ?? 0, flying)
  })
  return (
    <>
      <group ref={carrier} position={SHEET}>
        <group ref={scroll}>
          <mesh ref={page} castShadow>
            <planeGeometry args={[W, H, 60, 1]} />
            <meshStandardMaterial map={texture} side={DoubleSide} roughness={0.85} transparent emissive="#ffb800" emissiveIntensity={0} />
          </mesh>
        </group>
        <group ref={gun} visible={false}>
          <Syringe />
        </group>
      </group>
      <Sparkles count={30} scale={[1.6, 1, 1]} position={[SHEET.x + W / 2, SHEET.y, SHEET.z]} size={3} speed={0.5} color="#ffd36b" />
      <Flash since={since} at={enter} position={[SHEET.x + W / 2, SHEET.y, SHEET.z]} size={0.9} />
      <Flash since={since} at={rolled + (formed - rolled) * 0.5} position={[(SHEET.x + origin.x) / 2, 1.5, (SHEET.z + origin.z) / 2]} size={0.65} />
      <Confetti since={since} at={rolled + (formed - rolled) * 0.5} position={[(SHEET.x + origin.x) / 2, 1.5, (SHEET.z + origin.z) / 2]} count={40} speed={1.6} up={1.6} gravity={2.5} size={0.06} colors={['#ffd36b', '#fff3c4', '#ffffff']} />
      <group ref={dart} visible={false}>
        <Dart />
      </group>
      {trail.dots}
      <Flash since={since} at={hit} position={[butt.x, butt.y, butt.z]} size={0.4} color="#ffb800" />
      <Confetti since={since} at={hit} position={[butt.x, butt.y + 0.2, butt.z]} count={36} speed={2} up={2.4} size={0.07} />
    </>
  )
}
