import { candidates, vacancy, type Check, type Evidence } from './candidates.ts'

export type Decision = {
  kind: 'hire' | 'pass'
  score: number
  message: string
  salary?: number
}
export type File = {
  seen: Check[]
  offers: number[]
  agreed?: number
  reply: string
  cited: Evidence
  decision?: Decision
}
export type Game = {
  order: number[]
  current: number
  checks: number
  files: File[]
  finished: boolean
}
export type Action =
  | { type: 'check'; check: Check }
  | { type: 'offer'; salary: number }
  | { type: 'cite'; evidence: Evidence }
  | { type: 'decide'; kind: Decision['kind'] }
  | { type: 'open'; index: number }
  | { type: 'next' }
  | { type: 'restart'; order: number[] }

export function initialGame(order = candidates.map((_, i) => i)): Game {
  return {
    order,
    current: order[0],
    checks: vacancy.checks,
    finished: false,
    files: candidates.map(() => ({
      seen: [],
      offers: [],
      reply: '',
      cited: 'application',
    })),
  }
}
export function salaryUsed(game: Game) {
  return game.files.reduce((sum, file) => sum + (file.decision?.salary ?? 0), 0)
}
export function hires(game: Game) {
  return game.files.filter((file) => file.decision?.kind === 'hire').length
}
export function revealed(file: File): Evidence[] {
  return [
    'application',
    ...file.seen,
    ...(file.offers.length ? ['salary' as const] : []),
  ]
}
export function canCheck(game: Game, check: Check) {
  const file = game.files[game.current]
  if (
    game.finished ||
    file.decision ||
    game.checks < 1 ||
    file.seen.includes(check)
  )
    return false
  if (check === 'project') return file.seen.includes('technical')
  if (check === 'clarify') return file.seen.includes('security')
  return true
}
export function hireBlock(game: Game): string | null {
  const file = game.files[game.current]
  if (file.decision || game.finished) return 'This file is already closed.'
  if (hires(game) >= vacancy.seats) return 'Both seats are filled.'
  if (!file.seen.includes('technical') || !file.seen.includes('project'))
    return 'Complete both interview rounds before hiring.'
  if (!file.seen.includes('security'))
    return 'Run the security check before hiring.'
  if (candidates[game.current].discrepancy && !file.seen.includes('clarify'))
    return 'Resolve the document discrepancy before hiring.'
  if (file.agreed === undefined) return 'Agree a salary before hiring.'
  if (file.agreed > vacancy.cap)
    return `The limit for this role is ${vacancy.cap} credits.`
  if (salaryUsed(game) + file.agreed > vacancy.budget)
    return 'This offer exceeds the remaining salary budget.'
  return null
}
export function canOffer(game: Game, salary: number) {
  const file = game.files[game.current]
  return (
    !game.finished &&
    !file.decision &&
    game.checks > 0 &&
    file.offers.length < 2 &&
    file.agreed === undefined &&
    Number.isInteger(salary) &&
    salary >= 80 &&
    salary <= vacancy.cap &&
    salary <= vacancy.budget - salaryUsed(game) &&
    salary % 5 === 0 &&
    !file.offers.includes(salary)
  )
}

export function gameReducer(game: Game, action: Action): Game {
  if (action.type === 'restart') return initialGame(action.order)
  if (game.finished) return game
  const index = game.current
  const candidate = candidates[index]
  const file = game.files[index]
  const update = (value: File, cost = 0): Game => ({
    ...game,
    checks: game.checks - cost,
    files: game.files.map((old, i) => (i === index ? value : old)),
  })
  switch (action.type) {
    case 'open':
      return game.order.includes(action.index)
        ? { ...game, current: action.index }
        : game
    case 'next': {
      const position = game.order.indexOf(index)
      const search = [
        ...game.order.slice(position + 1),
        ...game.order.slice(0, position + 1),
      ]
      const next = search.find((i) => !game.files[i].decision)
      return next === undefined
        ? { ...game, finished: true }
        : { ...game, current: next }
    }
    case 'cite':
      return !file.decision && revealed(file).includes(action.evidence)
        ? update({ ...file, cited: action.evidence })
        : game
    case 'check':
      return canCheck(game, action.check)
        ? update(
            {
              ...file,
              seen: [...file.seen, action.check],
              cited: action.check,
            },
            1,
          )
        : game
    case 'offer': {
      const salary = action.salary
      if (!canOffer(game, salary)) return game
      const accepted = salary >= candidate.floor
      const reply = accepted
        ? `We have an agreement at ${salary} credits a month. I am ready for the written offer.`
        : `Thank you. My minimum is ${candidate.floor} credits a month. ${candidate.id === 'rustam' ? 'I also need a cross-team architecture role.' : 'Can you meet that?'}`
      return update(
        {
          ...file,
          offers: [...file.offers, salary],
          agreed: accepted ? salary : undefined,
          reply,
          cited: 'salary',
        },
        1,
      )
    }
    case 'decide': {
      if (file.decision || !revealed(file).includes(file.cited)) return game
      if (action.kind === 'hire' && hireBlock(game)) return game
      const correct =
        action.kind === 'hire' ? candidate.qualified : !candidate.qualified
      const supported =
        action.kind === 'hire' || candidate.rejectProof.includes(file.cited)
      const score = correct ? (supported ? 3 : 1) : 0
      const message =
        action.kind === 'hire'
          ? correct
            ? 'Offer signed. The role, experience, checks, and salary line up.'
            : 'The file was complete, but the evidence did not support this hire.'
          : correct
            ? supported
              ? 'A supported decision. The cited evidence explains the mismatch.'
              : 'The decision was right, but that document did not establish the mismatch.'
            : 'A suitable candidate was turned away. There was a way to complete this hire.'
      return update({
        ...file,
        decision: {
          kind: action.kind,
          score,
          message,
          salary: action.kind === 'hire' ? file.agreed : undefined,
        },
      })
    }
  }
}

export function results(game: Game) {
  const points = game.files.reduce(
    (sum, file) => sum + (file.decision?.score ?? 0),
    0,
  )
  const goodHires = game.files.filter(
    (file, i) => file.decision?.kind === 'hire' && candidates[i].qualified,
  ).length
  return {
    points,
    percent: Math.round((points / (candidates.length * 3)) * 100),
    goodHires,
    total: salaryUsed(game),
    perfect: points === candidates.length * 3 && goodHires === vacancy.seats,
  }
}
