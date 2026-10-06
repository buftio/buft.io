import { CELL, type War } from '../war/sim'

export const field: {
  war: War | null
  dawn: number
  tumors: [number, number][][]
} = { war: null, dawn: -Infinity, tumors: [] }

export function threat(x: number, y: number, radius: number) {
  const war = field.war
  if (!war) return 0
  const c0 = Math.max(0, Math.floor((x - radius) / CELL))
  const c1 = Math.min(war.cols - 1, Math.floor((x + radius) / CELL))
  const r0 = Math.max(0, Math.floor((y - radius) / CELL))
  const r1 = Math.min(war.rows - 1, Math.floor((y + radius) / CELL))
  let hit = 0
  let all = 0
  for (let r = r0; r <= r1; r++)
    for (let c = c0; c <= c1; c++) {
      if (Math.hypot((c + 0.5) * CELL - x, (r + 0.5) * CELL - y) > radius)
        continue
      all++
      if (war.corrupt[r * war.cols + c] >= 0.5) hit++
    }
  return all ? hit / all : 0
}
