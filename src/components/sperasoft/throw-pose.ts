import type { Point } from './types'

const ease = (value: number) => value * value * (3 - 2 * value)
const mix = (a: number, b: number, t: number) => a + (b - a) * ease(t)
export function throwPose(progress: number, strength = 1) {
  const loaded = {
    angle: mix(-1.43, 0.9, strength),
    reach: mix(2.85, 5.2, strength),
    support: mix(0.35, 1.7, strength),
  }
  if (progress <= 0) return { angle: -1.43, reach: 2.85, support: 0.35 }
  if (progress < 0.45) {
    const t = progress / 0.45
    return {
      angle: mix(-1.43, loaded.angle, t),
      reach: mix(2.85, loaded.reach, t),
      support: mix(0.35, loaded.support, t),
    }
  }
  if (progress < 0.65) {
    const t = (progress - 0.45) / 0.2
    return {
      angle: mix(loaded.angle, -1.43, t),
      reach: mix(loaded.reach, 2.85, t),
      support: mix(loaded.support, 0.1, t),
    }
  }
  const t = (progress - 0.65) / 0.35
  const swing = Math.sin(t * Math.PI)
  return {
    angle: -1.43 - swing * 0.7,
    reach: 2.85 + swing * 1.4,
    support: mix(0.1, 0.35, t),
  }
}
export function grenadeHand(progress: number, strength = 1): Point {
  const { angle, reach } = throwPose(progress, strength)
  return {
    x: 15.2 - Math.sin(angle) * reach,
    y: 51.4 - Math.cos(angle) * reach,
  }
}
