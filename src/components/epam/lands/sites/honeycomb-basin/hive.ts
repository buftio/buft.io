import * as THREE from 'three'
import { type Agent, agent, angle, BUCKET, LADLE, NONE, PADDLE } from './agents'
import { type Bee, bee, swarm } from './bees'
import { BOWL, HAND } from './kit'
import { BEE_SIZE, CREWS, FOLK_SIZE, NAPPER, PIPE_R, PRESS, SKEP, type P } from './layout'
import { along, blob, flier, held, model, point, stand, stream } from './pose'
import { Queen, type QueenRig } from './queen'
import { type Comb, rng } from './state'

type IM = THREE.InstancedMesh
export type Rig = {
  comb: THREE.Mesh
  folk: IM
  bucket: IM
  ladle: IM
  paddle: IM
  gold: IM
  bee: IM
  wing: IM
  smoke: IM
  clamp: IM
  wheel: THREE.Object3D
  screw: THREE.Object3D
} & QueenRig
export type Pipe = { pts: THREE.Vector3[]; tan: THREE.Vector3[]; length: number }

type Crew = { home: P; a: Agent; b: Agent; cell: number; phase: number; t: number }

const BEES = 36
const QUEUE = 8
const BEADS = 64
const PUFFS = 10
const HIDE = 0.11

const m = new THREE.Matrix4()
const mt = new THREE.Matrix4()
const v = new THREE.Vector3()
const w = new THREE.Vector3()
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0)
const SMOKE = new THREE.Color('#fff3d6')
const SIGNAL = new THREE.Color('#ff7a3a')

function toWorld(at: P, size: number, x: number, y: number, z: number): [number, number, number] {
  v.set(x, y, z).applyMatrix4(model(mt, at, size))
  return [v.x, -v.y, v.z]
}

export class Hive {
  rnd = rng(91)
  folk: Agent[] = []
  crews: Crew[]
  queue: Agent[]
  bees: Bee[]
  capstan: Agent[]
  foreman: Agent
  napper: Agent
  inspector: Agent
  nap: number
  hauls = Array.from({ length: QUEUE }, () => ({ phase: 0, t: 0 }))
  queen: Queen
  napState = 0
  door: [number, number, number]
  hub: P
  chimney: [number, number, number]
  centre: P = [0, 0]
  alarm = 0
  sealed = false
  nextDrain = 2
  clamped = false
  meshes: IM[] | null = null

  constructor(
    readonly comb: Comb,
    readonly pipe: Pipe,
  ) {
    this.door = toWorld(SKEP.at, SKEP.size, 0, 0.05, 1.25)
    this.hub = [SKEP.at[0], SKEP.at[1] - 120]
    this.chimney = toWorld(SKEP.at, SKEP.size, 0.42, 1.9, -0.1)
    this.crews = CREWS.map((home) => {
      const a = agent(home[0], home[1], LADLE)
      const b = agent(home[0] - 60, home[1] + 20, PADDLE)
      this.folk.push(a, b)
      return { home, a, b, cell: -1, phase: 0, t: this.rnd() * 2 }
    })
    this.queue = Array.from({ length: QUEUE }, (_, k) => this.add(agent(this.slot(k)[0], this.slot(k)[1], BUCKET)))
    this.capstan = Array.from({ length: 4 }, () => this.add(agent(PRESS.at[0], PRESS.at[1], NONE)))
    const top = toWorld(SKEP.at, SKEP.size, 0, 1.76, 0)
    this.foreman = this.add({ ...agent(top[0], top[1], LADLE, 66), z: top[2] })
    this.inspector = this.add(agent(0, 0, PADDLE))
    this.queen = new Queen(this.folk)
    this.nap = comb.near(NAPPER[0], NAPPER[1], 600, (i) => comb.free(i), () => 0)
    if (this.nap >= 0) {
      comb.busy[this.nap] = 1
      comb.setLevel(this.nap, 1, -100)
      comb.setLid(this.nap, 1, -100)
    }
    const c = comb.list[Math.max(0, this.nap)]
    this.napper = this.add(agent(c.x + c.mean * 0.42, c.y + c.mean * 0.1, NONE))
    this.napper.show = 0
    this.bees = swarm(BEES, this.hub, this.rnd)
  }

  add(a: Agent) {
    this.folk.push(a)
    return a
  }

  slot(k: number): P {
    const [cx, cy] = this.centre ?? [0, 0]
    const dx = this.door[0] - cx
    const dy = this.door[1] - cy
    const d = Math.hypot(dx, dy)
    const s = 250 + k * 62
    return [cx + (dx / d) * s + Math.sin(k * 1.3) * 10, cy + (dy / d) * s]
  }

  goto(a: Agent, x: number, y: number, speed: number, dt: number) {
    const dx = x - a.x
    const dy = y - a.y
    const d = Math.hypot(dx, dy)
    if (d < 3) {
      a.hop *= 0.8
      return true
    }
    const s = Math.min(d, speed * dt)
    a.x += (dx / d) * s
    a.y += (dy / d) * s
    a.turn = angle(a.turn, Math.atan2(dx, dy), Math.min(1, dt * 10))
    a.stride += s / 14
    a.hop = Math.abs(Math.sin(a.stride)) * a.size * 0.22
    return false
  }

  flee(a: Agent, dt: number) {
    if (this.goto(a, this.door[0], this.door[1], 300, dt)) a.show = Math.max(0, a.show - dt * 3)
  }

  face(a: Agent, x: number, y: number, dt: number) {
    a.turn = angle(a.turn, Math.atan2(x - a.x, y - a.y), Math.min(1, dt * 5))
  }

  step(t: number, dt: number, rig: Rig, zoom: number, threat: number, open: boolean, centre: P | null) {
    if (centre) this.centre = centre
    this.alarm += ((threat > 0.12 ? 1 : 0) - this.alarm) * Math.min(1, dt * 1.5)
    const comb = this.comb
    if (this.alarm > 0.5 && !this.sealed) {
      this.sealed = true
      for (let i = 0; i < comb.n; i++) if (comb.ct[i] === 0 && comb.lt[i] > 0 && !comb.mother[i]) comb.setLid(i, 1, t + this.rnd() * 2)
    }
    if (this.alarm < 0.3) this.sealed = false
    if (t > this.nextDrain && !this.sealed) {
      this.nextDrain = t + 1.6 + this.rnd() * 2
      let opened = 0
      for (let i = 0; i < comb.n; i++) if (comb.open(i)) opened++
      const i = opened < 16 ? comb.any((k) => comb.sealed(k), this.rnd) : -1
      if (i >= 0) comb.setLid(i, 0, t)
    }
    for (const c of this.crews) this.crew(c, t, dt)
    this.waiting(t, dt, open)
    this.press(t)
    this.top(t)
    this.walker(t)
    this.sleeper(t)
    this.queen.step(t, this.centre, open, this.alarm, rig)
    for (const b of this.bees) bee(this, b, t, dt)
    const mat = rig.comb.material as THREE.ShaderMaterial
    mat.uniforms.uTime.value = t
    mat.uniforms.uAlarm.value = this.alarm
    rig.wheel.rotation.z = -t * 1.4
    rig.screw.rotation.y = -t * 0.32
    const small = zoom >= HIDE
    for (const k of this.dyn(rig)) if (k !== rig.gold && k !== rig.smoke) k.visible = small
    this.draw(t, rig)
  }

  crew(c: Crew, t: number, dt: number) {
    const comb = this.comb
    const { a, b } = c
    if (this.alarm > 0.5) {
      if (c.cell >= 0) comb.busy[c.cell] = 0
      c.cell = a.cell = -1
      c.phase = 0
      a.ax = b.ax = 0.4
      this.flee(a, dt)
      this.flee(b, dt)
      return
    }
    a.show = b.show = Math.min(1, a.show + dt * 2)
    const cell = c.cell >= 0 ? comb.list[c.cell] : null
    if (c.phase === 0) {
      const i = comb.near(a.x, a.y, 650, (k) => comb.empty(k) && Math.hypot(comb.list[k].x - c.home[0], comb.list[k].y - c.home[1]) < 900, this.rnd)
      if (i < 0) {
        c.phase = 4
        c.t = t + 2 + this.rnd() * 2
        return
      }
      comb.busy[i] = 1
      c.cell = a.cell = i
      c.phase = 1
    } else if (c.phase === 1 && cell) {
      a.full = true
      a.ax = 0.5
      const ok = this.goto(a, cell.x, cell.y - cell.mean * 0.95, 115, dt)
      const ok2 = this.goto(b, cell.x - cell.mean * 0.85, cell.y - cell.mean * 0.2, 105, dt)
      if (ok && ok2) {
        c.phase = 2
        c.t = t
        comb.setLevel(c.cell, 1, t + 0.35)
      }
    } else if (c.phase === 2 && cell) {
      const k = t - c.t
      a.turn = angle(a.turn, 0, Math.min(1, dt * 8))
      a.ax = 0.5 + 1.25 * Math.min(1, k * 3, Math.max(0, (3.0 - k) * 3))
      a.full = k < 2.6
      a.lean = Math.sin(k * 7) * 0.05
      this.face(b, cell.x, cell.y, dt)
      b.az = Math.sin(t * 3) * 0.2
      if (k > 3.1) {
        c.phase = 3
        c.t = t
        comb.setLid(c.cell, 1, t)
      }
    } else if (c.phase === 3 && cell) {
      const k = Math.min(1, (t - c.t) / 1.3)
      a.ax = 0.4
      a.lean = 0
      this.goto(a, cell.x - cell.mean * 0.2, cell.y - cell.mean * 1.3, 80, dt)
      b.x = cell.x + (-0.85 + 1.7 * k) * cell.mean
      b.y = cell.y - cell.mean * 0.15
      b.turn = angle(b.turn, 0, Math.min(1, dt * 8))
      b.az = Math.sin(t * 16) * 0.5
      b.hop = Math.abs(Math.sin(t * 10)) * 4
      if (k >= 1) {
        comb.busy[c.cell] = 0
        c.cell = a.cell = -1
        c.phase = 4
        c.t = t + 0.6 + this.rnd() * 2
        b.az = 0
        a.full = false
      }
    } else if (c.phase === 4) {
      a.lean = Math.sin(t * 2 + c.home[0]) * 0.12
      b.lean = -a.lean
      if (t > c.t) c.phase = 0
    }
  }

  waiting(t: number, dt: number, open: boolean) {
    this.queue.forEach((a, k) => {
      if (this.alarm > 0.5) return this.flee(a, dt)
      if (open) return this.haul(a, k, t, dt)
      a.show = Math.min(1, a.show + dt * 2)
      a.full = false
      const [sx, sy] = this.slot(k)
      if (!this.goto(a, sx, sy, 120, dt)) return
      const [cx, cy] = this.centre
      const look = Math.sin(t * 0.35 + k * 2.1) > 0.93
      this.face(a, look ? this.door[0] : cx, look ? this.door[1] : cy, dt)
      a.lean = Math.sin(t * 1.3 + k) * 0.07
      a.hop = k === 0 && t % 6 < 1.2 ? Math.abs(Math.sin(t * 9)) * 9 : 0
    })
  }

  haul(a: Agent, k: number, t: number, dt: number) {
    const h = this.hauls[k]
    const [cx, cy] = this.centre
    const dx = this.door[0] - cx
    const dy = this.door[1] - cy
    const d = Math.hypot(dx, dy)
    const spread = (k - (QUEUE - 1) / 2) * 0.16
    const ux = (dx / d) * Math.cos(spread) - (dy / d) * Math.sin(spread)
    const uy = (dx / d) * Math.sin(spread) + (dy / d) * Math.cos(spread)
    if (h.phase === 0) {
      a.show = Math.min(1, a.show + dt * 3)
      a.full = false
      if (this.goto(a, cx + ux * 330, cy + uy * 330, 125 + k * 6, dt)) Object.assign(h, { phase: 1, t: t + 0.6 + this.rnd() })
    } else if (h.phase === 1) {
      this.face(a, cx, cy, dt)
      a.lean = Math.sin(t * 8) * 0.25
      a.hop = 0
      if (t > h.t) Object.assign(h, { phase: 2, t })
      a.full = t > h.t - 0.3
    } else if (h.phase === 2) {
      if (this.goto(a, this.door[0] + spread * 60, this.door[1], 105 + k * 5, dt)) Object.assign(h, { phase: 3, t: t + 0.8 + this.rnd() })
    } else {
      a.show = Math.max(0, a.show - dt * 4)
      if (t > h.t) h.phase = 0
    }
  }

  press(t: number) {
    this.capstan.forEach((a, k) => {
      const ang = (k / 4) * Math.PI * 2 + t * 0.32 - 0.3
      const [x, y, z] = toWorld(PRESS.at, PRESS.size, Math.cos(ang) * 1.32, 0, Math.sin(ang) * 1.32)
      a.x = x
      a.y = y
      a.z = z
      a.turn = -ang
      a.hop = Math.abs(Math.sin(t * 5 + k)) * 4
      a.lean = 0.18
    })
  }

  top(t: number) {
    const a = this.foreman
    const panic = this.alarm > 0.5
    a.turn = Math.sin(t * 0.4) * 0.45
    a.ax = 0.5 + Math.sin(t * (panic ? 9 : 3)) * 0.55
    a.az = Math.sin(t * 1.5) * 0.35
    a.hop = panic ? Math.abs(Math.sin(t * 8)) * 10 : 0
  }

  walker(t: number) {
    const a = this.inspector
    const { pts, tan } = this.pipe
    const u = 0.74 + 0.2 * Math.sin((t * Math.PI * 2) / 90)
    const i = Math.round(u * (pts.length - 1))
    const back = Math.cos((t * Math.PI * 2) / 90) < 0
    a.x = pts[i].x + tan[i].y * 55
    a.y = -(pts[i].y - tan[i].x * 55)
    a.turn = Math.atan2(tan[i].x * (back ? -1 : 1), -tan[i].y * (back ? -1 : 1))
    a.hop = Math.abs(Math.sin(t * 6)) * 5
    a.ax = 0.3 + 1.1 * Math.pow(Math.max(0, Math.sin(t * 2.2)), 8)
  }

  sleeper(t: number) {
    if (this.nap < 0) return
    const f = t % 13
    const a = this.napper
    const state = f < 7 ? 0 : f < 10.6 ? 1 : 2
    if (state !== this.napState) {
      this.napState = state
      if (state === 1) this.comb.setLid(this.nap, 0.45, t)
      if (state === 2) this.comb.setLid(this.nap, 1, t + 0.4)
    }
    const up = Math.min(1, Math.max(0, (f - 7.6) * 3), Math.max(0, (10.6 - f) * 3))
    a.show = up
    a.turn = Math.sin((f - 7.6) * 2.2) * 0.9
    a.lean = Math.sin(f * 1.7) * 0.1
  }

  draw(t: number, rig: Rig) {
    let nl = 0
    let np = 0
    let nb = 0
    let ng = 0
    const gold = rig.gold
    this.folk.forEach((a, k) => {
      const s = a.size * a.show
      stand(m, a.x, a.y, a.z, Math.atan2(Math.sin(a.turn), Math.cos(a.turn)) * 0.55, s, a.hop, a.lean)
      rig.folk.setMatrixAt(k, s > 0.5 ? m : ZERO)
      if (s < 0.5) return
      if (a.tool === LADLE) {
        held(mt, m, HAND, a.ax, a.az)
        rig.ladle.setMatrixAt(nl++, mt)
        v.set(...BOWL).applyMatrix4(mt)
        if (a.full) gold.setMatrixAt(ng++, point(m, v, a.size * 0.11))
        if (a.ax > 1.3 && a.size === FOLK_SIZE) {
          const cell = a.cell >= 0 ? this.comb.list[a.cell] : null
          if (cell) gold.setMatrixAt(ng++, stream(m, v, w.set(cell.x, -cell.y, 4), 4 + Math.sin(t * 20) * 0.8))
        }
      } else if (a.tool === PADDLE) rig.paddle.setMatrixAt(np++, held(mt, m, HAND, a.ax, a.az).scale(v.setScalar(a.grip)))
      else if (a.tool === BUCKET) {
        rig.bucket.setMatrixAt(nb++, held(mt, m, HAND, 0.15, Math.sin(t * 2 + k) * 0.15))
        if (a.full) gold.setMatrixAt(ng++, point(m, v.set(0, -0.01, 0).applyMatrix4(mt), a.size * 0.15))
      }
    })
    const { pts } = this.pipe
    const speed = this.alarm > 0.5 ? 0.04 : 0.016
    for (let k = 0; k < BEADS; k++) {
      const u = (((k / BEADS + t * speed + 0.006 * Math.sin(k * 1.7 + t * 0.8)) % 1) + 1) % 1
      const p = pts[Math.round(u * (pts.length - 1))]
      gold.setMatrixAt(ng++, point(m, p, 22 + 5 * Math.sin(k * 2.3)))
    }
    this.bees.forEach((b, k) => {
      const z = 70 + Math.sin(t * 3 + b.seed * 30) * 14
      const near = Math.hypot(b.x - this.door[0], b.y - this.door[1])
      const s = b.phase === 4 ? 0 : BEE_SIZE * Math.min(1, near / 60 + (b.phase === 0 ? 1 : 0))
      rig.bee.setMatrixAt(k, flier(m, b.x, b.y, z, b.yaw, s))
      rig.wing.setMatrixAt(k, flier(m, b.x, b.y, z + 2, b.yaw, s, 0.3 + 0.7 * Math.abs(Math.sin(t * 50 + b.seed * 40))))
      if (b.cargo && s > 1) gold.setMatrixAt(ng++, blob(m, b.x, b.y + 6, z - 4, 5))
    })
    const [cx, cy, cz] = this.chimney
    for (let k = 0; k < PUFFS; k++) {
      const age = (t / 5 + k / PUFFS) % 1
      const s = (20 + age * 80) * (1 - age ** 4)
      rig.smoke.setMatrixAt(k, blob(m, cx + age * 90 + Math.sin(age * 7 + k) * 20, cy - age * 320, cz + age * 200, s))
    }
    ;(rig.smoke.material as THREE.MeshStandardMaterial).color.lerpColors(SMOKE, SIGNAL, this.alarm)
    if (!this.clamped) this.clamps(rig.clamp)
    rig.ladle.count = nl
    rig.paddle.count = np
    rig.bucket.count = nb
    gold.count = ng
    for (const k of this.dyn(rig)) k.instanceMatrix.needsUpdate = true
  }

  dyn(rig: Rig) {
    this.meshes ??= [rig.folk, rig.ladle, rig.paddle, rig.bucket, rig.gold, rig.bee, rig.wing, rig.smoke]
    return this.meshes
  }

  clamps(mesh: IM) {
    this.clamped = true
    const { pts, tan } = this.pipe
    const n = mesh.count
    for (let k = 0; k < n; k++) {
      const i = Math.round(((k + 0.5) / n) * (pts.length - 1))
      mesh.setMatrixAt(k, along(m, pts[i], tan[i], PIPE_R * 1.05))
    }
    mesh.instanceMatrix.needsUpdate = true
  }
}
