export const HALL = { x: -60, y: -1400, s: 360 }
export const BOARD = { x: 790, y: -720, s: 230 }
export const STAGE = { x: -1130, y: -760, s: 260 }
export const RANGE = { x: -770, y: 430, gap: 128, line: 230 }
export const TRACK = { x: 170, y: 470, rx: 640, ry: 360, w: 110 }
export const EXIT = { x: 1750, y: 1150 }

export const CADET = 78
export const ELDER = 110

export const DESKS = Array.from({ length: 15 }, (_, k) => {
  const row = Math.floor(k / 5)
  const col = (k % 5) - 2
  return { x: BOARD.x + col * 125 + row * 14, y: BOARD.y + 210 + row * 105 }
})

export const DUMMIES = Array.from({ length: 5 }, (_, k) => {
  const a = Math.PI * (0.15 + k * 0.175)
  return { x: TRACK.x + Math.cos(a) * 330, y: TRACK.y + Math.sin(a) * 160 + 40, a }
})

export const TARGETS = Array.from({ length: 4 }, (_, k) => ({ x: RANGE.x + (k - 1.5) * RANGE.gap, y: RANGE.y }))
export const THROWERS = Array.from({ length: 3 }, (_, k) => ({ x: RANGE.x + (k - 1) * 165, y: RANGE.y + RANGE.line }))

export const GRADS = Array.from({ length: 6 }, (_, k) => ({ x: STAGE.x - 90 + k * 78, y: STAGE.y - 20 }))
export const DEAN = { x: STAGE.x - 290, y: STAGE.y - 10 }

export const PATHS: [number, number][][] = [
  [[HALL.x, HALL.y + 330], [40, -560], [TRACK.x - 60, TRACK.y - TRACK.ry - 70]],
  [[BOARD.x - 150, BOARD.y + 560], [TRACK.x + 420, TRACK.y - TRACK.ry + 10]],
  [[STAGE.x + 120, STAGE.y + 140], [-820, -260], [RANGE.x + 20, RANGE.y - 190]],
  [[TRACK.x + TRACK.rx + 60, TRACK.y + 120], [1180, 860], [EXIT.x - 200, EXIT.y - 120]],
]

export const ROMP = { x: -60, y: -110, ax: 300, ay: 110 }
