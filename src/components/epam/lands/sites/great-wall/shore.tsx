'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { scopeGeometry } from './folk'
import { clock, frame, GATE_D, LEN, PITCH, pop, SCOPE, SHEAR, SITES, type Mood } from './space'

const e = new THREE.Euler()

function boardGeometry() {
  const f = frame(SITES.gate - 360 / LEN)
  const o = -(GATE_D / 2 - 30)
  const g = new THREE.PlaneGeometry(190, 96)
  g.rotateY(f.turn)
  g.translate(f.x + f.nx * o, 128, f.z + f.nz * o)
  g.applyMatrix4(SHEAR)
  g.translate(0, 0, 3)
  return g
}

function paint(c: HTMLCanvasElement, days: number, alarm: boolean) {
  const g = c.getContext('2d')
  if (!g) return
  g.fillStyle = '#2a1630'
  g.fillRect(0, 0, 256, 128)
  g.fillStyle = alarm ? '#ff4a2a' : '#16b3a0'
  g.fillRect(6, 6, 244, 116)
  g.fillStyle = '#fff4f9'
  g.fillRect(12, 12, 232, 104)
  g.fillStyle = '#2a1630'
  g.textAlign = 'center'
  g.font = 'bold 19px ui-rounded, system-ui, sans-serif'
  g.fillText('DAYS WITHOUT', 128, 36)
  g.fillText('AN INVASION', 128, 58)
  g.fillStyle = alarm ? '#ff4a2a' : '#6e2a63'
  g.font = 'bold 50px ui-rounded, system-ui, sans-serif'
  g.fillText(alarm ? '0' : days.toLocaleString('en-US'), 128, 108)
}

export function Shore({ mood, reduced }: { mood: RefObject<Mood>; reduced: boolean }) {
  const scope = useMemo(() => scopeGeometry(), [])
  const board = useMemo(() => boardGeometry(), [])
  const canvas = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 128
    return c
  }, [])
  const tex = useMemo(() => new THREE.CanvasTexture(canvas), [canvas])
  useEffect(() => () => [scope, board, tex].forEach((x) => x.dispose()), [scope, board, tex])
  const mesh = useRef<THREE.Mesh>(null)
  const sign = useRef<THREE.Mesh>(null)
  const shown = useRef('')

  useFrame((state) => {
    const [a, b] = [mesh.current, sign.current]
    if (!a || !b) return
    const t = clock(state.clock.elapsedTime, reduced)
    const alarm = mood.current.alarm > 0.5
    const days = 3652 + Math.floor(t / 20)
    const key = alarm ? 'x' : String(days)
    if (key !== shown.current) {
      shown.current = key
      paint(canvas, days, alarm)
      const map = (b.material as THREE.MeshBasicMaterial).map
      if (map) map.needsUpdate = true
    }
    const near = state.camera.zoom > 0.11
    a.visible = near
    if (!near) return
    const pan = alarm ? 3.6 + Math.sin(t * 2) * 0.3 : 0.75 + Math.sin(t * 0.21) * 0.3 + Math.sin(t * 0.07) * 0.15
    pop(SCOPE[0], 15, SCOPE[1], a.position)
    a.quaternion.setFromEuler(e.set(0, pan, 0, 'YXZ')).premultiply(PITCH)
  })

  return (
    <group>
      <mesh ref={mesh} geometry={scope} renderOrder={47}>
        <meshStandardMaterial vertexColors flatShading roughness={0.5} metalness={0.1} />
      </mesh>
      <mesh ref={sign} geometry={board} renderOrder={46}>
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  )
}
