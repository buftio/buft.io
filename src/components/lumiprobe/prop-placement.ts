import type { CSSProperties } from 'react'
import {
  PITCH,
  panelFoot,
  project,
  type Panel,
  type Pad,
  type View,
} from './projection'

type Vec3 = [number, number, number]
export type Pose = { pivot: Vec3; yaw: number; lean: number }

export function propPoses(view: View): { clipboard: Pose; laptop: Pose } {
  return {
    clipboard: {
      pivot: panelFoot(view.layout.clipboard),
      yaw: view.narrow ? 0.14 : 0.26,
      lean: 0.18,
    },
    laptop: {
      pivot: panelFoot(view.layout.screen),
      yaw: view.narrow ? -0.16 : -0.28,
      lean: 0.26,
    },
  }
}

function orient([x, y, z]: Vec3, pose: Pose, lean: number): Vec3 {
  const liftedY = y * Math.cos(lean) - z * Math.sin(lean)
  const liftedZ = y * Math.sin(lean) + z * Math.cos(lean)
  return [
    x * Math.cos(pose.yaw) + liftedZ * Math.sin(pose.yaw),
    liftedY,
    -x * Math.sin(pose.yaw) + liftedZ * Math.cos(pose.yaw),
  ]
}

function surfaceStyle(
  centre: Vec3,
  right: Vec3,
  down: Vec3,
  width: number,
  height: number,
  view: View,
  pose: Pose,
  lean: number,
): CSSProperties {
  const relative = centre.map((n, i) => n - pose.pivot[i]) as Vec3
  const turned = orient(relative, pose, lean)
  const at = project(turned.map((n, i) => n + pose.pivot[i]) as Vec3, view)
  const zero = project([0, 0, 0], view)
  const u = project(orient(right, pose, lean), view)
  const v = project(orient(down, pose, lean), view)
  const a = (u.left - zero.left) / view.unit
  const b = (u.top - zero.top) / view.unit
  const c = (v.left - zero.left) / view.unit
  const d = (v.top - zero.top) / view.unit
  return {
    ...at,
    width: width * view.unit,
    height: height * view.unit,
    transform: `translate(-50%, -50%) matrix(${a}, ${b}, ${c}, ${d}, 0, 0)`,
  }
}

export function panelStyle(
  panel: Panel,
  view: View,
  pose: Pose,
): CSSProperties {
  const sin = Math.sin(PITCH)
  const cos = Math.cos(PITCH)
  return surfaceStyle(
    [panel.x, panel.y + 0.075 * cos, panel.z + 0.075 * sin],
    [1, 0, 0],
    [0, -sin, cos],
    panel.w,
    panel.h,
    view,
    pose,
    pose.lean,
  )
}

export function keyStyle(pad: Pad, view: View, pose: Pose): CSSProperties {
  return surfaceStyle(
    [pad.x, pad.y, pad.z],
    [1, 0, 0],
    [0, 0, 1 / Math.sin(PITCH)],
    pad.w,
    Math.max(44 / view.unit, pad.d * Math.sin(PITCH)),
    view,
    pose,
    0,
  )
}
