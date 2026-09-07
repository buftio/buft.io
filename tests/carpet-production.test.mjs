import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  moveRuns,
  nextDeparture,
  spaceRuns,
  STAGGER,
} from '../src/components/marketdata/workshop-state.ts'

const rug = (id, progress) => ({
  id,
  name: id,
  design: { palette: 'ruby', pattern: 'medallion', pixels: [1, 2, 3] },
  createdAt: 1,
  progress,
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
  const first = rug('first', 0.99)
  const second = rug('second', 0.91)
  const result = moveRuns([first, second], 0.6)
  assert.equal(result.finished[0].id, 'first')
  assert.equal(result.finished[0].design, first.design)
  assert.equal(result.pending[0].id, 'second')
  assert.ok(Math.abs(result.pending[0].progress - 0.93) < 1e-10)
  assert.equal(first.progress, 0.99)
  assert.equal(moveRuns(result.pending, 0).finished.length, 0)
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
