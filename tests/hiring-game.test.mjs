import { test } from 'node:test'
import assert from 'node:assert/strict'
import { candidates, vacancy } from '../src/components/yandex/candidates.ts'
import {
  initialGame,
  gameReducer,
  hireBlock,
  results,
} from '../src/components/yandex/game.ts'

const act = (game, ...actions) => actions.reduce(gameReducer, game)
const check = (check) => ({ type: 'check', check })
const offer = (salary) => ({ type: 'offer', salary })
const decide = (kind) => ({ type: 'decide', kind })
const open = (index) => ({ type: 'open', index })
const interviews = [check('technical'), check('project'), check('security')]

test('a complete evidence-led day hires both suitable candidates within 12 checks', () => {
  let game = initialGame()
  game = act(game, decide('pass'), open(1), check('security'), decide('pass'))
  game = act(game, open(5), offer(100), decide('pass'))
  game = act(
    game,
    open(2),
    ...interviews,
    offer(100),
    offer(110),
    decide('hire'),
  )
  game = act(
    game,
    open(3),
    ...interviews,
    check('clarify'),
    offer(105),
    decide('hire'),
  )
  game = act(game, open(4), decide('pass'), { type: 'next' })
  assert.equal(game.checks, 0)
  assert.equal(game.finished, true)
  assert.deepEqual(results(game), {
    points: 18,
    percent: 100,
    goodHires: 2,
    total: 215,
    perfect: true,
  })
})

test('a flagged document needs clarification before a valid hire', () => {
  const game = act(initialGame(), open(3), ...interviews, offer(105))
  assert.match(hireBlock(game), /Resolve the document/)
  assert.equal(gameReducer(game, decide('hire')), game)
  const cleared = act(game, check('clarify'), decide('hire'))
  assert.equal(cleared.files[3].decision.score, 3)
})

test('a complete process cannot make fabricated experience a correct hire', () => {
  const game = act(
    initialGame(),
    open(1),
    ...interviews,
    offer(100),
    decide('hire'),
  )
  assert.equal(game.files[1].decision.score, 0)
  assert.equal(results(game).goodHires, 0)
})

test('unsupported rejection gets partial credit, and rejecting everyone cannot win', () => {
  let game = initialGame()
  for (let i = 0; i < candidates.length; i++)
    game = act(game, open(i), decide('pass'))
  assert.equal(game.files[1].decision.score, 1)
  assert.equal(game.files[2].decision.score, 0)
  assert.equal(results(game).perfect, false)
  assert.equal(results(game).goodHires, 0)
})

test('checks, offers and closed files cannot be spent or stamped twice', () => {
  const first = act(initialGame(), check('security'))
  assert.equal(gameReducer(first, check('security')), first)
  const offered = act(first, offer(100))
  assert.equal(gameReducer(offered, offer(100)), offered)
  const closed = act(offered, decide('pass'))
  assert.equal(gameReducer(closed, decide('pass')), closed)
  assert.equal(gameReducer(closed, check('technical')), closed)
  assert.equal(
    gameReducer(initialGame(), check('project')).checks,
    vacancy.checks,
  )
  assert.equal(
    gameReducer(initialGame(), { type: 'cite', evidence: 'security' }).files[0]
      .cited,
    'application',
  )
})

test('shared salary budget is enforced even after a candidate agrees', () => {
  const game = act(
    initialGame(),
    open(3),
    offer(105),
    open(2),
    ...interviews,
    offer(120),
    decide('hire'),
    open(3),
    ...interviews,
    check('clarify'),
  )
  assert.match(hireBlock(game), /remaining salary budget/)
  assert.equal(gameReducer(game, decide('hire')), game)
})

test('exhausted checks leave free decisions available, with no negative budget', () => {
  const exhausted = { ...initialGame(), checks: 0 }
  assert.equal(gameReducer(exhausted, check('technical')), exhausted)
  assert.equal(gameReducer(exhausted, offer(100)), exhausted)
  assert.equal(act(exhausted, decide('pass')).files[0].decision.score, 3)
})

test('replay clears decisions and honors the new folder order', () => {
  const old = act(initialGame(), decide('pass'))
  const order = [3, 5, 1, 0, 2, 4]
  const replay = act(old, { type: 'restart', order })
  assert.equal(replay.current, 3)
  assert.equal(replay.checks, vacancy.checks)
  assert.ok(replay.files.every((file) => !file.decision && !file.seen.length))
})
