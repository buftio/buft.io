import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  formation,
  resolveKick,
  kickOutcome,
  launchKick,
  stepKick,
  keeperAt,
  STEP,
} from '../src/components/sperasoft/football.ts'
import { PASSER } from '../src/components/sperasoft/types.ts'

test('straight kicks rebound off defenders and full power cannot cross an empty pitch in one kick', () => {
  const defended = resolveKick(
    PASSER,
    { x: 0, y: -58 },
    formation(0, PASSER),
    0,
  )
  assert.equal(defended.kick.status, 'stopped')
  assert.ok(defended.kick.rebounds > 0)
  assert.ok(defended.kick.y > 230)
  assert.equal(
    resolveKick(PASSER, { x: 0, y: -58 }, [], 0).kick.status,
    'stopped',
  )
})

test('a bank shot sets up a second kick that can beat the keeper', () => {
  const first = resolveKick(
    PASSER,
    { x: -52.565851648125694, y: -24.51185918096057 },
    formation(0, PASSER),
    0,
  )
  assert.equal(first.kick.rebounds, 1)
  assert.equal(
    kickOutcome(first.kick, formation(0, PASSER), 2),
    'repositioning',
  )
  const defenders = formation(1, first.kick)
  assert.notDeepEqual(defenders, formation(0, PASSER))
  const second = resolveKick(
    first.kick,
    { x: 38.05142368144942, y: -43.77315565292078 },
    defenders,
    first.time,
  )
  assert.equal(kickOutcome(second.kick, defenders, 1), 'goal')
})

test('the keeper saves contact, and running out of kicks or leaving possession at a defender loses', () => {
  const saved = stepKick(
    launchKick({ x: 50, y: 203 }, { x: 0, y: -58 }),
    STEP,
    [],
    { x: 50, y: 199 },
  )
  assert.equal(kickOutcome(saved, [], 2), 'saved')
  const stopped = { ...launchKick(PASSER, { x: 0, y: 0 }), status: 'stopped' }
  assert.equal(kickOutcome(stopped, [], 0), 'lost')
  assert.equal(kickOutcome(stopped, [PASSER], 2), 'lost')
})

test('instant reduced-motion resolution matches every animated physics step', () => {
  const vector = { x: 56, y: -29 },
    defenders = formation(0, PASSER)
  const instant = resolveKick(PASSER, vector, defenders, 1.5)
  let ball = launchKick(PASSER, vector),
    time = 1.5
  while (ball.status === 'rolling') {
    time += STEP
    ball = stepKick(ball, STEP, defenders, keeperAt(time))
  }
  assert.deepEqual(ball, instant.kick)
  assert.equal(time, instant.time)
})
