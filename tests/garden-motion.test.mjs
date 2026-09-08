import { test } from 'node:test'
import assert from 'node:assert/strict'
import { advanceRail } from '../src/components/three/rail-motion.ts'

test('a neighboring project responds promptly and settles with only a small bounce', () => {
  const motion = { position: 0, velocity: 0 }
  let peak = 0
  for (let frame = 1; frame <= 60; frame++) {
    advanceRail(motion, 1, 1 / 60)
    peak = Math.max(peak, motion.position)
    if (frame === 6) assert.ok(motion.position > 0.5)
    if (frame >= 24) assert.ok(Math.abs(motion.position - 1) < 0.01)
  }
  assert.ok(peak > 1 && peak < 1.03)
  assert.equal(motion.position, 1)
  assert.equal(motion.velocity, 0)
})

test('long jumps keep a bounded speed and settle across frame rates', () => {
  for (const fps of [15, 30, 60, 144]) {
    const motion = { position: -1, velocity: 0 }
    for (const target of [8, -1]) {
      for (let frame = 0; frame < fps * 3; frame++) {
        const before = motion.position
        advanceRail(motion, target, 1 / fps)
        assert.ok(Math.abs(motion.position - before) * fps <= 6.501)
      }
      assert.equal(motion.position, target)
      assert.equal(motion.velocity, 0)
    }
  }
})

test('a reversal and a delayed frame cannot leave the camera drifting', () => {
  const motion = { position: 0, velocity: 0 }
  for (let frame = 0; frame < 6; frame++) advanceRail(motion, 8, 1 / 60)
  const before = motion.position
  advanceRail(motion, -1, 10)
  assert.ok(Math.abs(motion.position - before) <= 0.651)
  for (let frame = 0; frame < 120; frame++) advanceRail(motion, -1, 1 / 60)
  assert.equal(motion.position, -1)
  assert.equal(motion.velocity, 0)
})
