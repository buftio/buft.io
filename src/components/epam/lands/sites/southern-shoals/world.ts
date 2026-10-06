export type World = {
  t: number
  danger: number
  board: number
  launch: number
  tide: number
  zoom: number
  rush: number
}
export const fresh = (): World => ({
  t: 0,
  danger: 0,
  board: 0,
  launch: 0,
  tide: 0.5,
  zoom: 0.25,
  rush: 1,
})
