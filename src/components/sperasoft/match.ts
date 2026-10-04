import { PASSER, type Point, type SceneState } from './types.ts'
import {
  formation,
  HOME_KEEPER,
  keeperAt,
  kickGuide,
  kickOutcome,
  launchKick,
  opponentShot,
  stepKick,
  stepOpponent,
  STEP,
  type Kick,
} from './football.ts'

export function resetMatch(state: SceneState) {
  state.score = [0, 0]
  state.homeKeeper = { ...HOME_KEEPER }
  state.reaction = 'neutral'
  state.keeper = keeperAt(0)
  state.shooter = 0
  resetPossession(state)
}
export function resetPossession(state: SceneState) {
  state.outcome = 'setup'
  state.kickDragging = false
  state.trace = []
  state.shotsLeft = 3
  state.defenders = formation((state.score[0] + state.score[1]) % 3, PASSER)
  state.football = { ...PASSER }
  state.player = { x: PASSER.x, y: PASSER.y + 3.5 }
  state.kickAim = kickGuide(PASSER, { x: 0, y: -44 })
}
export function awardGoal(state: SceneState, team: 0 | 1) {
  state.score = state.score.map((score, i) => score + (i === team ? 1 : 0)) as [
    number,
    number,
  ]
  state.reaction = team === 0 ? 'cheer' : 'slump'
  state.outcome =
    state.score[team] === 2 ? (team === 0 ? 'won' : 'lost') : 'goal'
  state.kickAim = []
}
export function possessionResult(kick: Kick, state: SceneState) {
  const result = kickOutcome(kick, state.defenders, state.shotsLeft)
  if (result === 'goal') awardGoal(state, 0)
  else if (result === 'repositioning') state.outcome = 'repositioning'
  else {
    state.outcome = 'opponent-windup'
    state.shooter = state.defenders.reduce(
      (nearest, p, i, all) =>
        Math.hypot(p.x - kick.x, p.y - kick.y) <
        Math.hypot(all[nearest].x - kick.x, all[nearest].y - kick.y)
          ? i
          : nearest,
      0,
    )
    state.defenders = state.defenders.map((p, i) =>
      i === state.shooter ? { x: kick.x, y: kick.y - 3.5 } : p,
    )
  }
}
export function createMatch(get: () => SceneState) {
  let shot: Kick | null = null,
    age = 0,
    time = 0,
    seed = 7281
  let aim = { x: 0, y: -44 }
  const canKick = () => get().outcome === 'setup' && !!get().football
  const finish = () => {
    const state = get()
    if (!shot) return
    state.football = { x: shot.x, y: shot.y }
    if (state.outcome === 'opponent-shot') {
      if (shot.status === 'goal') awardGoal(state, 1)
      else {
        state.reaction = shot.status === 'saved' ? 'cheer' : 'neutral'
        resetPossession(state)
      }
    } else possessionResult(shot, state)
    shot = null
    age = 0
    state.kickAim = []
    if (state.outcome === 'repositioning') {
      state.defenders = formation(3 - state.shotsLeft, state.football)
      if (state.reduced) state.outcome = 'setup'
    }
  }
  const step = () => {
    const state = get()
    time += STEP
    state.keeper = keeperAt(time)
    age += STEP
    if (state.outcome === 'won' || state.outcome === 'lost') return
    if (state.outcome === 'opponent-windup' && age >= 0.6) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      shot = opponentShot(state.football!, seed)
      state.outcome = 'opponent-shot'
      state.trace = []
      age = 0
    }
    if (state.outcome === 'goal' && age >= 1.25) resetPossession(state)
    if (state.outcome === 'repositioning' && age >= 0.28)
      state.outcome = 'setup'
    if (shot) {
      shot =
        state.outcome === 'opponent-shot'
          ? stepOpponent(shot, STEP, state.homeKeeper)
          : stepKick(shot, STEP, state.defenders, state.keeper)
      state.football = { x: shot.x, y: shot.y }
      if (Math.round(time / STEP) % 4 === 0)
        state.trace = [...state.trace.slice(-90), state.football]
      if (shot.status !== 'rolling') finish()
    } else if (state.outcome === 'setup' && state.football) follow(state)
  }
  const follow = (state: SceneState) => {
    state.player = {
      x: state.football!.x,
      y: Math.min(247, state.football!.y + 3.5),
    }
    state.kickAim = kickGuide(state.football!, aim)
  }
  const settle = () => {
    for (let i = 0; i < 1800; i++) {
      const state = get()
      if (
        state.outcome === 'setup' ||
        state.outcome === 'won' ||
        state.outcome === 'lost'
      )
        break
      step()
    }
    const state = get()
    if (state.outcome === 'setup' && state.football) follow(state)
  }
  return {
    step,
    settle,
    canKick,
    aim(vector: Point) {
      if (canKick()) {
        aim = vector
        get().kickAim = kickGuide(get().football!, vector)
      }
    },
    play(vector: Point) {
      if (!canKick() || Math.hypot(vector.x, vector.y) < 3) return
      const state = get()
      state.kickDragging = false
      state.reaction = 'neutral'
      state.shotsLeft--
      state.trace = [state.football!]
      state.kickAim = []
      state.outcome = 'playing'
      shot = launchKick(state.football!, vector)
      age = 0
      if (state.reduced) settle()
    },
    keeper(x: number) {
      get().homeKeeper = { x: Math.max(44, Math.min(56, x)), y: HOME_KEEPER.y }
    },
    retry() {
      shot = null
      age = 0
      time = 0
      seed = 7281
      aim = { x: 0, y: -44 }
      resetMatch(get())
    },
    forceGoal(team: 0 | 1) {
      shot = null
      age = 0
      awardGoal(get(), team)
    },
  }
}
