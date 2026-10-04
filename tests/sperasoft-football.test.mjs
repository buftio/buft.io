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
  opponentShot,
  resolveOpponent,
  HOME_KEEPER,
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

function state(reduced = false) {
  return {
    score: [0, 0],
    homeKeeper: { ...HOME_KEEPER },
    reaction: 'neutral',
    outcome: 'setup',
    football: { ...PASSER },
    player: { ...PASSER },
    defenders: formation(0, PASSER),
    keeper: keeperAt(0),
    shotsLeft: 3,
    trace: [],
    kickAim: [],
    reduced,
    shooter: 0,
  }
}
const { createMatch, resetMatch, awardGoal, possessionResult } =
  await import('../src/components/sperasoft/match.ts')

test('opponent shots repeat with a seed and keeper position decides block or goal', () => {
  const ball = { x: 50, y: 219 }
  assert.deepEqual(opponentShot(ball, 1000), opponentShot(ball, 1000))
  let found = false
  for (let seed = 0; seed < 100; seed++) {
    const shot = resolveOpponent(ball, seed, { x: 56, y: 244 })
    if (shot.status !== 'goal') continue
    const saved = resolveOpponent(ball, seed, { x: shot.x, y: 244 })
    assert.equal(saved.status, 'saved')
    found = true
    break
  }
  assert.ok(found)
  let onTarget = 0
  for (let i = 0; i < 1000; i++) {
    const shot = opponentShot(ball, Math.imul(i + 1, 2654435761) >>> 0)
    const x = ball.x + (shot.vx / shot.vy) * (249 - ball.y)
    if (x > 45.4 && x < 54.6) onTarget++
  }
  assert.ok(onTarget >= 400 && onTarget <= 500, `${onTarget} of 1000 on target`)
})

test('save, defender capture and spent flicks hand possession to red', () => {
  for (const [status, shots, defenders] of [
    ['saved', 2, []],
    ['stopped', 0, []],
    ['stopped', 2, [PASSER]],
  ]) {
    const s = state()
    s.shotsLeft = shots
    s.defenders = defenders.length ? defenders : formation(0, PASSER)
    possessionResult({ ...launchKick(PASSER, { x: 0, y: 0 }), status }, s)
    assert.equal(s.outcome, 'opponent-windup')
    assert.equal(s.defenders[s.shooter].x, PASSER.x)
  }
})

test('each team wins at two and rematch resets both scores, flicks and keeper', () => {
  for (const team of [0, 1]) {
    const s = state()
    awardGoal(s, team)
    assert.equal(s.outcome, 'goal')
    awardGoal(s, team)
    assert.equal(s.outcome, team === 0 ? 'won' : 'lost')
    assert.equal(s.reaction, team === 0 ? 'cheer' : 'slump')
    resetMatch(s)
    assert.deepEqual(s.score, [0, 0])
    assert.equal(s.shotsLeft, 3)
    assert.equal(s.outcome, 'setup')
    assert.deepEqual(s.football, PASSER)
    assert.deepEqual(s.homeKeeper, HOME_KEEPER)
  }
})

test('opponent visibly anticipates for 0.6 seconds, then returns possession', () => {
  const s = state(),
    match = createMatch(() => s)
  s.shotsLeft = 0
  possessionResult(
    { ...launchKick(PASSER, { x: 0, y: 0 }), status: 'stopped' },
    s,
  )
  for (let i = 0; i < 71; i++) match.step()
  assert.equal(s.outcome, 'opponent-windup')
  for (let i = 0; i < 2; i++) match.step()
  assert.equal(s.outcome, 'opponent-shot')
  for (let i = 0; i < 600; i++) match.step()
  assert.equal(s.outcome, 'setup')
  assert.equal(s.shotsLeft, 3)
})

test('reduced motion resolves a whole turn instantly and keeper keyboard nudges persist', () => {
  const s = state(true),
    match = createMatch(() => s)
  match.keeper(44)
  assert.equal(s.homeKeeper.x, 44)
  s.shotsLeft = 1
  match.play({ x: 0, y: -8 })
  assert.equal(s.outcome, 'setup')
  assert.equal(s.shotsLeft, 3)
  assert.equal(s.homeKeeper.x, 44)
})
