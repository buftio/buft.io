import type { Carpet } from './design'

export type PartyPlace = { x: number; z: number; angle: number }
export const PARTY_SINE = 30 / Math.hypot(30, 38)
function randomFrom(id: string) {
  let seed = 2166136261
  for (const letter of id)
    seed = Math.imul(seed ^ letter.charCodeAt(0), 16777619)
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0
    return (seed >>> 0) / 4294967296
  }
}
export function partyLayout(carpets: Carpet[], narrow: boolean) {
  const width = narrow ? 7.8 : 12.8
  const places: PartyPlace[] = []
  carpets.forEach((carpet, index) => {
    const random = randomFrom(carpet.id)
    let extent = 2.4 + Math.floor(index / (narrow ? 3 : 6)) * 1.15
    let place: PartyPlace | undefined
    for (let tries = 0; !place; tries++) {
      if (tries && tries % 250 === 0) extent += 1
      const x = (random() - 0.5) * (width - 2.8)
      const z = (random() - 0.5) * extent * 2
      if (
        Math.hypot(x, z) < 1.75 ||
        places.some((p) => Math.hypot(p.x - x, p.z - z) < 2.12)
      )
        continue
      place = { x, z, angle: (random() - 0.5) * 1.5 }
    }
    places.push(place)
  })
  const near = Math.min(-2, ...places.map((p) => p.z - 1))
  const far = Math.max(2, ...places.map((p) => p.z + 1))
  return {
    places,
    width,
    near,
    far,
    focus: (near + far) / 2 - 1.2,
    height: (far - near) * PARTY_SINE + 3.7,
  }
}
export type PartyLayout = ReturnType<typeof partyLayout>
