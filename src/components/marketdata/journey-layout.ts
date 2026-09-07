import { CatmullRomCurve3, Vector3 } from 'three'

export const GROUND_SINE = 30 / Math.hypot(30, 44)
export type GroundPoint = [number, number, number]
export function journeyLayout(width: number, height: number, narrow: boolean) {
  const point = (x: number, y: number, elevation = 0): GroundPoint => [
    (x - 0.5) * width,
    elevation,
    ((y - 0.5) * height) / GROUND_SINE,
  ]
  const curve = (points: [number, number][]) =>
    new CatmullRomCurve3(
      points.map(([x, y]) => new Vector3(...point(x, y, 0.02))),
    )
  return {
    mill: point(narrow ? 0.45 : 0.23, narrow ? 0.125 : 0.175),
    storage: point(narrow ? 0.49 : 0.77, 0.47),
    shop: point(narrow ? 0.32 : 0.25, narrow ? 0.705 : 0.725),
    owner: point(narrow ? 0.67 : 0.75, 0.95),
    sheet: point(0.22, narrow ? 0.38 : 0.46, 0.65),
    roads: {
      truck: curve(
        narrow
          ? [
              [0.62, 0.16],
              [0.86, 0.25],
              [0.9, 0.38],
              [0.9, 0.5],
              [0.6, 0.53],
            ]
          : [
              [0.3, 0.225],
              [0.48, 0.31],
              [0.53, 0.41],
              [0.54, 0.5],
              [0.77, 0.535],
            ],
      ),
      flight: curve(
        narrow
          ? [
              [0.49, 0.5],
              [0.84, 0.57],
              [0.25, 0.63],
              [0.33, 0.735],
            ]
          : [
              [0.77, 0.505],
              [0.63, 0.56],
              [0.39, 0.55],
              [0.27, 0.76],
            ],
      ),
      home: curve(
        narrow
          ? [
              [0.35, 0.745],
              [0.76, 0.78],
              [0.91, 0.88],
              [0.67, 0.94],
            ]
          : [
              [0.3, 0.765],
              [0.45, 0.82],
              [0.62, 0.88],
              [0.75, 0.925],
            ],
      ),
    },
  }
}
export type JourneyLayout = ReturnType<typeof journeyLayout>
