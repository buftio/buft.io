'use client'

import { useEffect, useRef, useState } from 'react'
import { PITCH, TARGET_Z, panelFoot, type Panel, type View } from './projection'
import { propPoses, type Pose } from './prop-placement'
import type { Phase } from './use-lab'

export type BoardPlacement = { panel: Panel; pose: Pose; prominence: number }

function placement(view: View, prominence: number): BoardPlacement {
  const side = view.layout.clipboard
  const resting = propPoses(view).clipboard
  const height =
    (view.narrow ? (view.width < 300 ? 350 : 300) : 260) / view.unit
  const y = 0.05 + (height * Math.sin(PITCH)) / 2
  const screenY = view.height * (view.narrow ? 0.44 : 0.56)
  const close: Panel = {
    x: 0,
    y,
    z:
      TARGET_Z +
      (y * Math.cos(PITCH) - (view.height / 2 - screenY) / view.unit) /
        Math.sin(PITCH),
    w: Math.min(380, view.width - 40) / view.unit,
    h: height,
  }
  const lerp = (a: number, b: number) => a + (b - a) * prominence
  const panel: Panel = {
    x: lerp(side.x, close.x),
    y: lerp(side.y, close.y),
    z: lerp(side.z, close.z),
    w: lerp(side.w, close.w),
    h: lerp(side.h, close.h),
  }
  return {
    panel,
    pose: {
      pivot: panelFoot(panel),
      yaw: lerp(resting.yaw, 0.1),
      lean: lerp(resting.lean, 0.12),
    },
    prominence,
  }
}

export function useBoardMotion(view: View, phase: Phase, reduced: boolean) {
  const target = phase === 'building' ? 0 : 1
  const [progress, setProgress] = useState(target)
  if (reduced && progress !== target) setProgress(target)
  const current = useRef(target)
  useEffect(() => {
    if (reduced) {
      current.current = target
      return
    }
    const from = current.current
    if (from === target) return
    let frame = 0
    const begin = performance.now() + (phase === 'complete' ? 700 : 0)
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - begin) / 650))
      const eased = t * t * (3 - 2 * t)
      current.current = from + (target - from) * eased
      setProgress(current.current)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [phase, target, reduced])
  return {
    ...placement(view, reduced ? target : progress),
    moving: !reduced && progress !== target,
  }
}
