import type { RefObject } from 'react'

export type Live = { t: number; dt: number; alarm: number; zoom: number }
export type LiveRef = RefObject<Live>

export const DETAIL = 0.11
