import { FOLK_SIZE } from './layout'

export type Agent = { cell: number; x: number; y: number; z: number; turn: number; stride: number; hop: number; lean: number; size: number; tool: number; ax: number; az: number; full: boolean; show: number; grip: number }

export const NONE = 0
export const LADLE = 1
export const PADDLE = 2
export const BUCKET = 3

export const agent = (x: number, y: number, tool: number, size = FOLK_SIZE): Agent => ({ cell: -1, x, y, z: 0, turn: 0, stride: 0, hop: 0, lean: 0, size, tool, ax: 0.4, az: 0, full: false, show: 1, grip: 1 })
export const angle = (from: number, to: number, k: number) => from + Math.atan2(Math.sin(to - from), Math.cos(to - from)) * k
