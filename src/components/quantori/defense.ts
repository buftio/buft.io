export const DURATION = 45
export const LIVES = 3
export const RISE = 0.6
export const TOUGH = 3
export const FLIGHT = 0.65
const SPAWN = 7
const REACH = 0.75
const DART_SPEED = 13
const HIT = 0.55
const COOLDOWN = 0.11
const MUZZLE = 0.8
const KNOCK = 0.1
const STUN = 0.08
const POP = 1.3
export const HP = 10
export const BIG_HP = 30
export const BIG = 2
export const SHOTGUN = 5
export const DROP_FALL = 1.1
export const DROP_LIFE = 7
const SPREAD = [-0.44, -0.22, 0, 0.22, 0.44]

export type Virus = {
  id: number
  angle: number
  dist: number
  speed: number
  sway: number
  kind: number
  hp: number
  big: boolean
  hit: number
  seed: number
  x: number
  z: number
  born: number
}
export type Dart = {
  id: number
  x: number
  y: number
  z: number
  vx: number
  vz: number
}
export type Pop = {
  id: number
  x: number
  z: number
  at: number
  sick: boolean
  kind: number
  big: boolean
}
export type Drop = {
  id: number
  x: number
  z: number
  at: number
}
export type Game = {
  time: number
  lives: number
  popped: number
  viruses: Virus[]
  darts: Dart[]
  fired: number
  pops: Pop[]
  drops: Drop[]
  nextDrop: number
  shotgun: number
  next: number
  ids: number
  aim: number
  hurt: number
  end: number
  status: 'play' | 'won' | 'lost'
}

export const newGame = (): Game => ({
  time: 0,
  lives: LIVES,
  popped: 0,
  viruses: [],
  darts: [],
  fired: -1,
  pops: [],
  drops: [],
  nextDrop: 10,
  shotgun: -1,
  next: 0.6,
  ids: 1,
  aim: 0,
  hurt: -10,
  end: -1,
  status: 'play',
})

const wiggle = (virus: Virus, time: number) => {
  const t = time + virus.seed * 10
  return (
    Math.sin(t * 2.2) * virus.sway +
    Math.sin(t * 5.3) * 0.05 +
    Math.sin(t * 8.9 + 1.3) * 0.03
  )
}

/** How fast a virus scoots right now: bursts and short pauses instead of a steady glide. */
export const gait = (virus: Virus, time: number) =>
  0.45 +
  1.1 * Math.max(0, Math.sin((time + virus.seed * 7) * (3 + virus.seed * 2)))

const place = (virus: Virus, time: number) => {
  const angle = virus.angle + wiggle(virus, time)
  virus.x = Math.cos(angle) * virus.dist
  virus.z = Math.sin(angle) * virus.dist
}

function spawn(game: Game) {
  const progress = game.time / DURATION
  const kind = Math.floor(Math.random() * 4)
  const big =
    game.time > 8 &&
    game.viruses.filter((item) => item.big).length < 2 &&
    Math.random() < 0.12 + progress * 0.12
  const virus: Virus = {
    id: game.ids++,
    angle: Math.PI * (0.92 + Math.random() * 1.16),
    dist: SPAWN + Math.random() * 0.6,
    speed:
      (0.8 + progress * 0.9 + Math.random() * 0.3) *
      (big ? 0.5 : kind === TOUGH ? 0.85 : 1),
    sway: Math.random() < 0.5 ? 0.12 + Math.random() * 0.15 : 0.04,
    kind,
    hp: big ? BIG_HP : HP,
    big,
    hit: -10,
    seed: Math.random(),
    x: 0,
    z: 0,
    born: game.time,
  }
  place(virus, game.time)
  game.viruses.push(virus)
  game.next = game.time + 1.6 - progress * 0.85 + Math.random() * 0.3
}

function pop(game: Game, virus: Virus, sick: boolean) {
  game.viruses = game.viruses.filter((item) => item !== virus)
  game.pops.push({
    id: virus.id,
    x: virus.x,
    z: virus.z,
    at: game.time,
    sick,
    kind: virus.kind,
    big: virus.big,
  })
}

const gap = (virus: Virus, x0: number, z0: number, x1: number, z1: number) => {
  const dx = x1 - x0
  const dz = z1 - z0
  const t = Math.min(
    1,
    Math.max(
      0,
      ((virus.x - x0) * dx + (virus.z - z0) * dz) / (dx * dx + dz * dz || 1),
    ),
  )
  return Math.hypot(virus.x - x0 - dx * t, virus.z - z0 - dz * t)
}

function expire(game: Game) {
  const old = (item: { at: number }, life: number) => game.time - item.at > life
  if (
    !game.pops.some((item) => old(item, POP)) &&
    !game.drops.some((item) => old(item, DROP_FALL + DROP_LIFE))
  )
    return false
  game.pops = game.pops.filter((item) => !old(item, POP))
  game.drops = game.drops.filter((item) => !old(item, DROP_FALL + DROP_LIFE))
  return true
}

function drop(game: Game) {
  const angle = Math.PI * (1.3 + Math.random() * 0.55)
  const dist = 2.2 + Math.random() * 1.8
  game.drops.push({
    id: game.ids++,
    x: Math.cos(angle) * dist,
    z: Math.sin(angle) * dist,
    at: game.time,
  })
  game.nextDrop = game.time + 14 + Math.random() * 3
}

/** Picks up a fallen capsule: the gun fires a spread for a few seconds. */
export function collect(game: Game, id: number) {
  if (game.status !== 'play' || !game.drops.some((item) => item.id === id))
    return false
  game.drops = game.drops.filter((item) => item.id !== id)
  game.shotgun = game.time + SHOTGUN
  return true
}

/** Keeps the last explosions playing out after the game has ended. */
export function settle(game: Game, dt: number) {
  if (game.status === 'play' || !game.pops.length) return false
  game.time += dt
  return expire(game)
}

/** Advances the game. Returns true when the set of things on screen changed. */
export function step(game: Game, dt: number) {
  if (game.status !== 'play') return settle(game, dt)
  let changed = false
  game.time += dt
  if (game.time >= game.next) {
    spawn(game)
    changed = true
  }
  if (game.time >= game.nextDrop) {
    drop(game)
    changed = true
  }
  for (const virus of [...game.viruses]) {
    if (game.time - virus.born > RISE) {
      const stunned = game.time - virus.hit < STUN ? 0 : 1
      virus.dist -= virus.speed * gait(virus, game.time) * stunned * dt
    }
    place(virus, game.time)
    if (virus.dist < REACH * (virus.big ? 1.7 : 1)) {
      pop(game, virus, true)
      game.lives -= 1
      game.hurt = game.time
      changed = true
    }
  }
  for (const dart of [...game.darts]) {
    const x0 = dart.x
    const z0 = dart.z
    dart.x += dart.vx * dt
    dart.z += dart.vz * dt
    dart.y += (FLIGHT - dart.y) * Math.min(1, dt * 14)
    const target = game.viruses.find(
      (virus) =>
        game.time - virus.born > RISE * 0.5 &&
        gap(virus, x0, z0, dart.x, dart.z) < HIT * (virus.big ? BIG * 0.9 : 1),
    )
    if (target) {
      target.hp -= 1
      target.hit = game.time
      if (target.hp <= 0) {
        pop(game, target, false)
        game.popped += 1
      } else target.dist += KNOCK * (target.big ? 0.3 : 1)
    } else if (Math.hypot(dart.x, dart.z) < SPAWN + 3) continue
    game.darts = game.darts.filter((item) => item !== dart)
    changed = true
  }
  if (expire(game)) changed = true
  if (game.lives <= 0) {
    game.status = 'lost'
    game.end = game.time
    game.darts = []
    game.drops = []
    changed = true
  } else if (game.time >= DURATION) {
    game.status = 'won'
    game.end = game.time
    game.darts = []
    game.drops = []
    for (const virus of [...game.viruses]) pop(game, virus, false)
    changed = true
  }
  return changed
}

type Point = { x: number; y: number; z: number }

export function aimAt(game: Game, point: { x: number; z: number }, gun: Point) {
  game.aim = Math.atan2(-(point.z - gun.z), point.x - gun.x)
}

/** Fires a syringe flat across the floor from the gun towards `point`, or a fan of them while the shotgun lasts. Rate-limited, so holding the trigger sprays. */
export function fire(game: Game, point: { x: number; z: number }, gun: Point) {
  if (game.status !== 'play' || game.time - game.fired < COOLDOWN) return false
  aimAt(game, point, gun)
  game.fired = game.time
  const base = Math.atan2(point.z - gun.z, point.x - gun.x)
  for (const turn of game.time < game.shotgun ? SPREAD : [0]) {
    const dx = Math.cos(base + turn)
    const dz = Math.sin(base + turn)
    game.darts.push({
      id: game.ids++,
      x: gun.x + dx * MUZZLE,
      y: gun.y,
      z: gun.z + dz * MUZZLE,
      vx: dx * DART_SPEED,
      vz: dz * DART_SPEED,
    })
  }
  return true
}

/** Fires wherever the turret points, for keyboard play. */
export const fireAhead = (game: Game, gun: Point) =>
  fire(
    game,
    { x: gun.x + Math.cos(game.aim) * 4, z: gun.z - Math.sin(game.aim) * 4 },
    gun,
  )
