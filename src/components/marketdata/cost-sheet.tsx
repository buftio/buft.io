'use client'

import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { CanvasTexture, SRGBColorSpace } from 'three'
import { type RugDesign } from './design'

export function workshopCosts(design: RugDesign) {
  const stitches = design.pixels.filter((p) => p !== 0).length
  const yarn = Math.round(24 + stitches * 0.16)
  const weaving = 12 + new Set(design.pixels).size * 3
  return { yarn, weaving, freight: 8, total: yarn + weaving + 8 }
}

export function CostSheet({
  design,
  clock,
  reduced,
}: {
  design: RugDesign
  clock: RefObject<{ progress: number; time: number }>
  reduced: boolean
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 600
    canvas.height = 420
    return new CanvasTexture(canvas)
  }, [])
  const lastStep = useRef(-1)
  const previousDesign = useRef<RugDesign | null>(null)
  useFrame(() => {
    const progress = reduced
      ? Number(clock.current.progress >= 0.43)
      : Math.max(0, Math.min(1, (clock.current.progress - 0.43) / 0.08))
    const step = Math.floor(progress * 24)
    if (lastStep.current === step && previousDesign.current === design) return
    lastStep.current = step
    previousDesign.current = design
    const ctx = (texture.image as HTMLCanvasElement).getContext('2d')!
    const cost = workshopCosts(design)
    ctx.fillStyle = '#f8f3dd'
    ctx.fillRect(0, 0, 600, 420)
    ctx.fillStyle = '#286751'
    ctx.fillRect(0, 0, 600, 63)
    ctx.font = 'bold 25px Arial'
    ctx.fillStyle = '#fff7df'
    ctx.fillText('CARPET COSTS', 30, 40)
    ctx.fillStyle = '#e3e6d6'
    ctx.fillRect(0, 63, 600, 43)
    ctx.fillStyle = '#667767'
    ctx.font = '17px monospace'
    ctx.fillText('fx   = SUM(C3:C5)', 28, 92)
    const rows = [
      ['Yarn', cost.yarn],
      ['Weaving', cost.weaving],
      ['Freight', cost.freight],
      ['Total', cost.total],
    ]
    rows.forEach(([label, value], i) => {
      const y = 108 + i * 62
      ctx.fillStyle = i === 3 ? '#dce8be' : i % 2 ? '#f0f0df' : '#faf7e9'
      ctx.fillRect(0, y, 600, 62)
      ctx.strokeStyle = '#cbd2bd'
      ctx.strokeRect(0, y, 600, 62)
      ctx.fillStyle = '#81907d'
      ctx.font = '17px monospace'
      ctx.fillText(String(i + 3), 17, y + 39)
      ctx.fillStyle = '#344d40'
      ctx.font = `${i === 3 ? 'bold ' : ''}24px Arial`
      ctx.fillText(String(label), 65, y + 39)
      ctx.textAlign = 'right'
      ctx.fillText(Math.round(Number(value) * progress).toFixed(2), 564, y + 39)
      ctx.textAlign = 'left'
    })
    if (progress > 0 && progress < 1) {
      ctx.strokeStyle = '#2c805d'
      ctx.lineWidth = 4
      ctx.strokeRect(
        360,
        110 + Math.min(3, Math.floor(progress * 4)) * 62,
        238,
        58,
      )
    }
    ctx.font = '16px Arial'
    ctx.fillStyle = '#71816b'
    ctx.fillText('Workshop estimate · credits', 23, 392)
    if (progress === 1) {
      ctx.save()
      ctx.translate(405, 240)
      ctx.rotate(-0.19)
      ctx.strokeStyle = '#2c805d'
      ctx.lineWidth = 6
      ctx.strokeRect(-116, -30, 232, 58)
      ctx.fillStyle = '#2c805d'
      ctx.font = 'bold 25px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('CHECKED', 0, 10)
      ctx.restore()
    }
    texture.colorSpace = SRGBColorSpace
    texture.needsUpdate = true
  })
  useEffect(() => () => texture.dispose(), [texture])
  return (
    <group rotation={[0, 0, -0.12]}>
      <mesh position={[0.04, -0.05, -0.045]}>
        <boxGeometry args={[3.18, 2.3, 0.07]} />
        <meshStandardMaterial color="#bdb89b" roughness={1} />
      </mesh>
      <mesh>
        <boxGeometry args={[3.15, 2.25, 0.06]} />
        <meshStandardMaterial color="#f4e9c9" roughness={1} />
      </mesh>
      <mesh position={[0, 0, 0.035]}>
        <planeGeometry args={[3.08, 2.15]} />
        <meshBasicMaterial map={texture} />
      </mesh>
    </group>
  )
}
