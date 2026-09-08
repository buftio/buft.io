import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  grenadeResult,
  launch,
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

test('blasts remove local chunks persistently and the unsupported wall eventually collapses', () => {
  const aim = { x: 26.3, y: -49.4 }
  const first = grenadeResult(aim)
  assert.ok(first.bricks.length > 0 && first.bricks.length < WALL_BRICKS.length)
  assert.equal(first.broken, false)
  const second = grenadeResult(aim, first.bricks)
  assert.ok(
    second.bricks.length > 0 && second.bricks.length < first.bricks.length,
  )
  assert.ok(
    second.bricks.every((brick) =>
      first.bricks.some((previous) => previous.id === brick.id),
    ),
  )
  const third = grenadeResult(aim, second.bricks)
  assert.equal(third.broken, true)
  assert.equal(third.bricks.length, 0)
  assert.equal(
    grenadeResult({ x: 8, y: -10 }).bricks.length,
    WALL_BRICKS.length,
  )
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

test('high and low throws cannot enter the football cage, even through a broken wall', () => {
  for (const bricks of [WALL_BRICKS, []]) {
    for (let x = 8; x <= 66; x += 2) {
      for (let y = -62; y <= -8; y += 2) {
        let ball = launch({ x, y })
        for (let i = 0; i < 264; i++) {
          ball = stepGrenade(ball, 1 / 120, bricks)
          assert.ok(
            !(ball.x > 80.5 && ball.y > 24.5 && ball.y < 63.5),
            `entered cage: ${x},${y}`,
          )
        }
      }
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
  assert.ok(time < 8, `arrival took ${time} seconds`)
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
