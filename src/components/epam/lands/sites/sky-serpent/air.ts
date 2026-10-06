import { NESTS, ROPE, TETHERS } from './cast'
import { clamp, COS, hide, lay, smooth, span, stand } from './kit'
import { NOSE } from './models'
import { FOLK, heading, hop, inHead, top, type Beat, type Rig } from './place'
import { sample, type Spine } from './spine'

const NESTED = [0, 2]
const LOOPS: [number, number, number, number][] = [
  [0.2, 150, 0.55, 0],
  [0.25, 210, -0.42, 2],
  [0.5, 260, 0.33, 4],
  [0.75, 170, -0.6, 1],
]

function wing(r: Rig, k: number, x: number, y: number, z: number, s: number, rz: number, flap: number) {
  lay(r.wings, k * 2, x, y, z, s, s, s, rz, flap)
  lay(r.wings, k * 2 + 1, x, y, z, s, -s, s, rz, -flap)
}

export function birds(r: Rig, sp: Spine, b: Beat, time: number) {
  const S = 20
  NESTED.forEach((n, k) => {
    const p = top(sp, NESTS[n], 0.85)
    const up = 60 * hop(b, k + 3)
    const rz = heading(sp, NESTS[n]) + Math.PI + 0.3 * Math.sin(time * 0.6 + k)
    lay(r.birds, k, p.x, p.y + up * 0.5, p.z + 12 + up, S, S, S, rz)
    const flap = up > 1 ? 0.9 * Math.sin(time * 18) : 1.25
    wing(r, k, p.x, p.y + up * 0.5, p.z + 14 + up, up > 1 ? S : S * 0.55, rz, flap)
  })
  const h = r.head
  const perch = inHead(h, -52, 74, 92)
  const rz = h.rotation.z + Math.PI * 0.8
  const pj = 50 * hop(b, 0)
  lay(r.birds, 2, perch.x, perch.y + pj, perch.z + 8, S * 0.9, S * 0.9, S * 0.9, rz)
  wing(r, 2, perch.x, perch.y + pj, perch.z + 10, S * 0.5, rz, pj > 1 ? Math.sin(time * 18) : 1.25)
  LOOPS.forEach(([t, rad, w, ph], i) => {
    const k = 3 + i
    const c = top(sp, t, 0)
    const rr = rad * (1 + 1.4 * b.blast)
    const a = time * w + ph
    const x = c.x + Math.cos(a) * rr
    const y = c.y + Math.sin(a) * rr * 0.8
    const z = c.z + 170 + 20 * Math.sin(time * 0.7 + i)
    const rz = a + (w > 0 ? Math.PI / 2 : -Math.PI / 2)
    const glide = Math.sin(time * 0.5 + i * 2) > 0.3
    const flap = glide ? 0.12 : 0.8 * Math.sin(time * 11 + i * 1.7)
    lay(r.birds, k, x, y, z, S, S, S, rz, flap * 0.2)
    wing(r, k, x, y, z + 1, S, rz, flap)
  })
}

export function breathOut(r: Rig, b: Beat, wake: number, time: number, ph: number, zoom: number) {
  const big = clamp(0.5 / zoom, 1, 8)
  const h = r.head
  const dir = h.rotation.z
  const fx = Math.cos(dir)
  const fy = Math.sin(dir)
  const quiet = clamp(1 - wake * 3) * (b.age < 0 ? 1 - b.pre : smooth((b.age - 3) / 1.5))
  const far = Math.min(big, 3)
  for (let k = 0; k < 4; k++) {
    const age = (time + k * 1.3) % 5.2
    const n = inHead(h, NOSE.x + 20, 0, NOSE.z + 30)
    const s = big * (16 + age * 9) * smooth(age / 0.4) * smooth((5.2 - age) / 0.9) * quiet
    if (s < 0.5) hide(r.zeds, k)
    else lay(r.zeds, k, n.x + far * (fx * age * 30 + 14 * Math.sin(age * 2 + k)), n.y + far * (fy * age * 30 + age * 44), n.z + 80, s, s, 1, 0.3 * Math.sin(age * 1.6 + k))
  }
  for (let k = 0; k < 2; k++) {
    const age = (time + k * 2) % 4
    const d = inHead(r.head, -6, 0, 52)
    const s = (8 + age * 5) * smooth(age / 0.3) * smooth((4 - age) / 0.7) * clamp(1 - wake * 3)
    if (s < 0.5) hide(r.zeds, 4 + k)
    else lay(r.zeds, 4 + k, d.x + 20 + age * 10, d.y + 50 + age * 26, d.z + 90, s, s, 1, 0.2)
  }
  const ex = ph >= 0.55 ? (ph - 0.55) / 0.45 : -1
  for (let k = 0; k < 2; k++) {
    const n = inHead(h, NOSE.x + 6, (k ? -1 : 1) * NOSE.y, NOSE.z)
    if (ex < 0 || b.age >= 0) {
      hide(r.puffs, k)
      continue
    }
    const s = (12 + 30 * ex) * (1 - smooth((ex - 0.55) / 0.45)) * (1 - 0.6 * wake)
    lay(r.puffs, k, n.x + fx * ex * 90, n.y + fy * ex * 90 + (k ? -1 : 1) * ex * 20, n.z + 10, s, s, s * 0.7)
  }
  for (let k = 0; k < 8; k++) {
    const age = b.age
    if (age < 0 || age > 2.4) {
      hide(r.puffs, 2 + k)
      continue
    }
    const a = dir + (k / 7 - 0.5) * 1.5 + 0.2 * Math.sin(k * 7.3)
    const dist = (520 + 200 * Math.sin(k * 3.1)) * (1 - Math.exp(-age * 2.4))
    const n = inHead(h, NOSE.x, 0, NOSE.z)
    const s = (50 + 90 * smooth(age / 0.4)) * (1 - smooth((age - 1.2) / 1.1)) * (0.8 + 0.4 * Math.sin(k * 5.7) ** 2)
    lay(r.puffs, 2 + k, n.x + Math.cos(a) * dist, n.y + Math.sin(a) * dist, n.z + 30, s, s * 0.85, s * 0.7, age + k)
  }
}

export function tethers(r: Rig, sp: Spine, pegs: [number, number][], time: number) {
  TETHERS.forEach((t, i) => {
    const a = sample(sp, t)
    const ax = a.x + a.ty * a.r * 0.8
    const ay = a.y - a.tx * a.r * 0.8
    const az = a.z
    const [px, py] = pegs[i]
    const tz = 90
    const bend = (u: number) => 26 * Math.sin(Math.PI * u) * (1 + 0.2 * Math.sin(time * 0.6 + i))
    for (let k = 0; k < 8; k++) {
      const u0 = k / 8
      const u1 = (k + 1) / 8
      span(
        r.ropes, ROPE.tether + i * 8 + k,
        ax + (px - ax) * u0 - bend(u0), ay + (py + tz * COS * 0.5 - ay) * u0, az + (tz - az) * u0,
        ax + (px - ax) * u1 - bend(u1), ay + (py + tz * COS * 0.5 - ay) * u1, az + (tz - az) * u1,
        5,
      )
    }
    stand(r.pegs, i, px, py, 0, 70, 0.3 - i * 0.6, 0.05 * Math.sin(time + i))
    for (let k = 0; k < 2; k++) {
      const u = ((time * 0.045 + k * 0.5 + i * 0.27) % 1)
      const x = px + (ax - px) * u - bend(1 - u)
      const y = py + tz * COS * 0.5 + (ay - py - tz * COS * 0.5) * u
      const z = tz + (az - tz) * u
      const g = 26 * smooth(u / 0.08) * smooth((1 - u) / 0.08)
      stand(r.buckets, i * 2 + k, x, y - g * 0.7, z - g * 0.5, g, 0, 0.15 * Math.sin(time * 2 + k))
    }
  })
  const [px, py] = pegs[0]
  stand(r.folk, 8, px + 46, py - 10, 0, FOLK, -0.4, 0.3 + 0.12 * Math.sin(time * 0.7))
}
