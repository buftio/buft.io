import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  CAGE,
  CRATES,
  GROUND,
  PIT,
  chipWall,
  grenadeResult,
  inTrench,
  launch,
  settleTrooper,
  stepGrenade,
  distance,
} from '../src/components/sperasoft/game.ts'
import {
  grabBall,
  moveBall,
  dropBall,
  releaseBalls,
  rollBalls,
  ballPosition,
  CHANNEL_LENGTH,
  FIRST_BALL_LENGTH,
} from '../src/components/sperasoft/rolling.ts'
import { WALL_BRICKS, PASSER } from '../src/components/sperasoft/types.ts'

const body = (x, y = GROUND) => ({ x, y, vx: 0, vy: 0, grounded: true })
const land = (from, aim, bricks = WALL_BRICKS) => {
  const { ball } = grenadeResult(aim, bricks, from)
  return settleTrooper(from, ball, bricks)
}

test('a throw that bounces off the crates back to his feet pops the trooper over them', () => {
  const after = land(body(8), { x: 62, y: -16 })
  assert.ok(
    after.x > CRATES.right && after.x < PIT.left,
    `landed at ${after.x}`,
  )
  assert.equal(after.grounded, true)
  const lob = land(body(8), { x: 30, y: -50 })
  assert.ok(lob.x < CRATES.left, 'a plain lob leaves him in place')
})

test('a grenade lobbed behind him carries the trooper across the pit, a weak one drops him in', () => {
  const across = land(body(40), { x: -16, y: -18 })
  assert.ok(across.x > PIT.right && !inTrench(across), `landed at ${across.x}`)
  const short = land(body(44), { x: -40, y: -10 })
  assert.ok(inTrench(short) || short.x < PIT.left)
})

test('knocking out the base drops the wall, lobs onto the top only chip it', () => {
  const base = grenadeResult({ x: 6, y: -10 }, WALL_BRICKS, body(60))
  assert.equal(base.broken, true)
  const top = chipWall({ x: 72, y: 31 }, WALL_BRICKS)
  assert.ok(top.length > 0 && top.length < WALL_BRICKS.length)
  const chipped = WALL_BRICKS.filter((brick) => !top.includes(brick))
  assert.ok(chipped.every((brick) => brick.row >= 5))
  assert.deepEqual(chipWall({ x: 30, y: 55 }, WALL_BRICKS), WALL_BRICKS)
})

test('the trooper cannot pass the standing wall or reach the cage over it', () => {
  for (let x = -40; x <= 66; x += 4)
    for (let y = -62; y <= -4; y += 4) {
      const after = land(body(62), { x, y }, WALL_BRICKS)
      assert.ok(after.x < WALL_BRICKS[0].x, `passed the wall with ${x},${y}`)
    }
})

test('all footballs travel continuously through the chute; the first reaches the passer', () => {
  const balls = releaseBalls()
  let previous = balls.map(ballPosition)
  for (let frame = 0; frame < 7200; frame++) {
    rollBalls(balls, 1 / 120)
    const current = balls.map(ballPosition)
    current.forEach((point, id) => {
      assert.ok(distance(point, previous[id]) < 1.6, `ball ${id} jumped`)
    })
    previous = current
  }
  assert.equal(balls[0].travelled, FIRST_BALL_LENGTH)
  assert.ok(distance(ballPosition(balls[0]), PASSER) < 0.001)
  assert.ok(balls.every((ball) => ball.travelled >= CHANNEL_LENGTH))
})

test('no throw from anywhere on the course lands a grenade inside the cage', () => {
  for (const from of [body(8), body(26, CRATES.top), body(40), body(62)])
    for (const bricks of [WALL_BRICKS, []])
      for (let x = -40; x <= 66; x += 3)
        for (let y = -62; y <= -4; y += 3) {
          let ball = launch({ x, y }, from)
          for (let i = 0; i < 186; i++) {
            ball = stepGrenade(ball, 1 / 120, bricks)
            assert.ok(
              !(
                ball.x > CAGE.left + 1 &&
                ball.x < CAGE.right - 1 &&
                ball.y > CAGE.top + 1.5 &&
                ball.y < CAGE.bottom
              ),
              `entered cage: ${x},${y}`,
            )
          }
        }
})

test('the first ball reaches the player promptly while spare balls remain in motion outside the pitch', () => {
  const balls = releaseBalls()
  let time = 0
  while (balls[0].travelled < FIRST_BALL_LENGTH) {
    rollBalls(balls, 1 / 120)
    time += 1 / 120
    for (const ball of balls.slice(1)) {
      const p = ballPosition(ball)
      assert.ok(
        !(p.x < 81 && p.x > 20 && p.y > 191 && p.y < 253),
        'spare entered pitch',
      )
    }
  }
  assert.ok(
    time + 0.45 >= 5 && time + 0.45 <= 6,
    `arrival with collapse took ${time + 0.45} seconds`,
  )
  assert.ok(
    balls
      .slice(1)
      .some((ball) => !ball.drop || Math.hypot(ball.drop.vx, ball.drop.vy) > 5),
  )
})

test('spare balls fall with gravity, rebound and settle against each other above the floor', () => {
  const balls = releaseBalls()
  let rebound = false,
    falling = false
  for (let frame = 0; frame < 2400; frame++) {
    const before = balls[1].drop?.vy
    rollBalls(balls, 1 / 120)
    const after = balls[1].drop?.vy
    if (before !== undefined && after !== undefined) {
      if (before > 0 && after < 0) rebound = true
      if (after > before && after > 0) falling = true
    }
  }
  assert.ok(rebound && falling)
  const dropped = balls.slice(1).map((ball) => ball.drop)
  assert.ok(dropped.every((ball) => ball && ball.y <= 264.601 && ball.y > 254))
  for (let i = 0; i < dropped.length; i++)
    for (let j = i + 1; j < dropped.length; j++)
      assert.ok(distance(dropped[i], dropped[j]) > 2.6, 'settled balls overlap')
  assert.ok(
    dropped.every((ball) => Math.hypot(ball.vx, ball.vy) < 2),
    'pile did not settle',
  )
})

test('loose balls stay in the hand and keep release momentum', () => {
  const balls = releaseBalls()
  for (let i = 0; i < 1200; i++) rollBalls(balls, 1 / 120)
  assert.equal(grabBall(balls, 0), false, 'match ball must stay in the game')
  assert.equal(grabBall(balls, 1), true)
  moveBall(balls, 1, { x: 88, y: 235 })
  for (let i = 0; i < 120; i++) rollBalls(balls, 1 / 120)
  assert.deepEqual(ballPosition(balls[1]), { x: 88, y: 235 })
  dropBall(balls, 1, { x: -20, y: -35 })
  rollBalls(balls, 1 / 120)
  assert.ok(balls[1].drop.x < 88 && balls[1].drop.y < 235)
  assert.equal(balls[1].drop.held, false)
  for (let i = 0; i < 1800; i++) rollBalls(balls, 1 / 120)
  assert.ok(balls[1].drop.y > 254 && balls[1].drop.y <= 264.601)
})

test('dropped props rebound from players without moving the players', () => {
  const ball = {
    id: 1,
    travelled: CHANNEL_LENGTH,
    speed: 0,
    drop: { x: 50, y: 228, vx: 0, vy: 30, spin: 0 },
  }
  const player = { x: 50, y: 237, radius: 2.7 }
  let bounced = false
  for (let i = 0; i < 120; i++) {
    rollBalls([ball], 1 / 120, [player])
    if (ball.drop.vy < 0) bounced = true
    assert.ok(distance(ball.drop, player) >= 4.09)
  }
  assert.ok(bounced)
  assert.deepEqual(player, { x: 50, y: 237, radius: 2.7 })
})
