'use client'

import { ArrowRight, RotateCcw } from 'lucide-react'
import { candidates, evidenceNames, vacancy } from './candidates'
import { results, type Action, type Game } from './game'
import type { Dispatch } from 'react'

export function Receipt({
  game,
  dispatch,
}: {
  game: Game
  dispatch: Dispatch<Action>
}) {
  const file = game.files[game.current]
  const decision = file.decision
  if (!decision) return null
  return (
    <section
      className="hiring-receipt"
      aria-label="Decision review"
      aria-live="polite"
    >
      <small className="hiring-meta">
        {decision.kind === 'hire' ? 'OFFER SIGNED' : 'FILE CLOSED'} /{' '}
        {candidates[game.current].name}
      </small>
      <h3 tabIndex={-1}>
        {decision.score === 3
          ? 'That decision holds up.'
          : decision.score === 1
            ? 'Right call, missing evidence.'
            : 'Something slipped through.'}
      </h3>
      <p>
        {decision.message} {candidates[game.current].review}
      </p>
      <button
        className="hiring-next"
        onClick={() => dispatch({ type: 'next' })}
      >
        {game.files.every((item) => item.decision)
          ? 'Finish the day'
          : 'Next application'}
        <ArrowRight size={17} />
      </button>
    </section>
  )
}

export function DayReview({
  game,
  dispatch,
}: {
  game: Game
  dispatch: Dispatch<Action>
}) {
  const score = results(game)
  const replay = () => {
    const order = candidates.map((_, i) => i)
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[order[i], order[j]] = [order[j], order[i]]
    }
    dispatch({ type: 'restart', order })
  }
  return (
    <section
      className="hiring-paper hiring-results"
      aria-label="End of day review"
    >
      <small>END OF DAY / RECRUITMENT</small>
      <h3 tabIndex={-1}>
        {score.perfect
          ? 'Two seats. Two good fits.'
          : score.goodHires === 2
            ? 'Both seats filled. A few notes for next time.'
            : 'A few files deserve another look.'}
      </h3>
      <p>
        {score.perfect
          ? 'You checked the experience, cleared the paperwork, and made offers the team could afford.'
          : 'The review below shows which evidence could have changed each decision. Try another day with the folders in a different order.'}
      </p>
      <div className="hiring-result-numbers">
        <div>
          <strong>{score.percent}%</strong>
          <span>decision score</span>
        </div>
        <div>
          <strong>
            {score.goodHires}/{vacancy.seats}
          </strong>
          <span>suitable hires</span>
        </div>
        <div>
          <strong>
            {score.total}/{vacancy.budget}
          </strong>
          <span>salary credits</span>
        </div>
      </div>
      <ol className="hiring-ledger">
        {game.order.map((index) => {
          const candidate = candidates[index]
          const file = game.files[index]
          return (
            <li key={candidate.id}>
              <strong>{candidate.name}</strong>
              <small>
                {file.decision?.kind === 'hire' ? 'Hired' : 'Rejected'} ·{' '}
                {file.decision?.score ?? 0}/3
              </small>
              <p>{candidate.review}</p>
              <small>Cited: {evidenceNames[file.cited]}</small>
            </li>
          )
        })}
      </ol>
      <button className="hiring-next" onClick={replay}>
        <RotateCcw size={17} />
        Another day
      </button>
    </section>
  )
}
