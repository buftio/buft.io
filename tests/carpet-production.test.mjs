import { test } from 'node:test'
import assert from 'node:assert/strict'
import { partyLayout } from '../src/components/marketdata/party-layout.ts'
import {
  moveRuns,
  nextDeparture,
  spaceRuns,
  STAGGER,
  ARRIVAL_END,
} from '../src/components/marketdata/workshop-state.ts'

const rug = (id, progress) => ({
  id,
  name: id,
  design: { palette: 'ruby', pattern: 'medallion', pixels: [1, 2, 3] },
  createdAt: 1,
  progress,
})
test('reserving another party place keeps existing guests in their places', () => {
  const guests = Array.from({ length: 12 }, (_, i) => rug(`guest-${i}`, 0))
  for (const narrow of [false, true]) {
    const before = partyLayout(guests, narrow)
    const after = partyLayout([...guests, rug('new-arrival', 0)], narrow)
    assert.deepEqual(after.places.slice(0, guests.length), before.places)
  }
})
test('old waiting rugs become staggered departures without changing the leading rug', () => {
  const migrated = spaceRuns([
    rug('first', 0.35),
    rug('second', 0),
    rug('third', 0),
  ])
  assert.deepEqual(
    migrated.map((r) => r.progress),
    [0.35, 0, -STAGGER],
  )
  assert.equal(nextDeparture(migrated), -2 * STAGGER)
})
test('several trucks run concurrently and keep their distance', () => {
  let runs = []
  for (let i = 0; i < 8; i++) runs.push(rug(String(i), nextDeparture(runs)))
  const moved = moveRuns(runs, 12).pending
  assert.equal(
    moved.filter((r) => r.progress >= 0.23 && r.progress < 0.43).length,
    3,
  )
  moved
    .slice(1)
    .forEach((r, i) =>
      assert.ok(Math.abs(moved[i].progress - r.progress - STAGGER) < 1e-10),
    )
})
test('finishing a rug preserves the next rug progress and saved designs', () => {
  const first = rug('first', ARRIVAL_END - 0.01)
  const second = rug('second', ARRIVAL_END - 0.09)
  const result = moveRuns([first, second], 0.6)
  assert.equal(result.finished[0].id, 'first')
  assert.equal(result.finished[0].design, first.design)
  assert.equal(result.pending[0].id, 'second')
  assert.ok(Math.abs(result.pending[0].progress - (ARRIVAL_END - 0.07)) < 1e-10)
  assert.equal(first.progress, ARRIVAL_END - 0.01)
  assert.equal(moveRuns(result.pending, 0).finished.length, 0)
})
test('reaching home keeps the same delivery alive until its party flight finishes', () => {
  const start = rug('arriving', 0.99)
  const flight = moveRuns([start], 0.6)
  assert.equal(flight.finished.length, 0)
  assert.equal(flight.pending[0].id, start.id)
  assert.ok(flight.pending[0].progress > 1)
  const restored = spaceRuns(JSON.parse(JSON.stringify(flight.pending)))
  assert.deepEqual(restored, flight.pending)
  const landed = moveRuns(restored, 5)
  assert.equal(landed.pending.length, 0)
  assert.equal(landed.finished.length, 1)
  assert.equal(landed.finished[0].id, start.id)
})
test('negative launch delays survive a reload and every rug finishes exactly once', () => {
  const queued = spaceRuns(
    Array.from({ length: 20 }, (_, i) => rug(String(i), 0)),
  )
  const restored = spaceRuns(JSON.parse(JSON.stringify(queued)))
  assert.deepEqual(restored, queued)
  const result = moveRuns(restored, 90)
  assert.equal(result.pending.length, 0)
  assert.equal(new Set(result.finished.map((r) => r.id)).size, 20)
})
