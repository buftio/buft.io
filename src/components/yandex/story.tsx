'use client'

import dynamic from 'next/dynamic'
import { useReducer, useRef, useEffect, useState } from 'react'
import { Users, Coins, ClipboardCheck } from 'lucide-react'
import { SceneBoundary } from '../scene-boundary'
import { candidates, vacancy } from './candidates'
import {
  gameReducer,
  hireBlock,
  hires,
  initialGame,
  salaryUsed,
  type Action,
} from './game'
import { CandidateFile, DeskTools, Vacancy } from './papers'
import { DayReview, Receipt } from './review'
import type { OfficeStage } from './office'

const HiringOffice = dynamic(() => import('./office'), { ssr: false })

export default function YandexStory({
  reduced,
  onReady,
}: {
  reduced: boolean
  onReady: () => void
}) {
  const [game, dispatch] = useReducer(gameReducer, undefined, () =>
    initialGame(),
  )
  const [stage, setStage] = useState<OfficeStage>('review')
  const candidateIndex = game.current
  const finished = game.finished
  const paper = useRef<HTMLDivElement>(null)
  const desk = useRef<HTMLDivElement>(null)
  const feedback = useRef<HTMLDivElement>(null)
  const lastPage = useRef(`${game.current}:false`)
  const file = game.files[game.current]
  const candidate = candidates[game.current]
  const hired = game.files.flatMap((record, index) =>
    record.decision?.kind === 'hire' ? [index] : [],
  )
  const block = hireBlock(game)
  const act = (action: Action) => {
    dispatch(action)
    if (action.type === 'check')
      setStage(
        action.check === 'security' || action.check === 'clarify'
          ? 'security'
          : 'interview',
      )
    if (action.type === 'offer') setStage('offer')
    if (action.type === 'decide')
      setStage(action.kind === 'hire' ? 'hired' : 'rejected')
    if (
      action.type === 'open' ||
      action.type === 'next' ||
      action.type === 'restart'
    )
      setStage('review')
  }
  useEffect(() => {
    if (file.decision)
      feedback.current?.scrollIntoView({
        behavior: reduced ? 'instant' : 'smooth',
        block: 'center',
      })
  }, [file.decision, reduced])
  useEffect(() => {
    const page = `${candidateIndex}:${finished}`
    if (lastPage.current !== page) {
      const target = finished
        ? desk.current
        : window.matchMedia('(max-width: 600px)').matches
          ? paper.current?.querySelector('.hiring-file')
          : paper.current
      target?.scrollIntoView({
        behavior: reduced ? 'instant' : 'smooth',
        block: 'start',
      })
      lastPage.current = page
    }
  }, [candidateIndex, finished, reduced])
  return (
    <article className="hiring-story">
      <header className="hiring-intro">
        <h2 id="project-heading">Yandex</h2>
        <p>
          I worked on the system recruiters used to manage candidates, from
          application to hiring. My work included vacancy publishing, search
          filters, and the candidate workflow.
        </p>
      </header>
      <div className="hiring-office">
        <figure aria-label="A clay recruitment office, with a candidate at your desk, a computer, files, and a waiting area">
          <SceneBoundary compact onFailure={onReady}>
            <HiringOffice
              candidate={game.current}
              hired={hired}
              stage={game.finished ? 'closed' : stage}
              paused={reduced}
              onReady={onReady}
            />
          </SceneBoundary>
        </figure>
        <div className="hiring-office-note">
          <i />
          {game.finished ? 'OFFICE CLOSED' : `NOW MEETING / ${candidate.name}`}
        </div>
      </div>
      <div className="hiring-daybar" aria-label="Hiring day resources">
        <strong>
          {game.finished ? 'DAY COMPLETE' : 'YOUR FIRST HIRING DAY'}
        </strong>
        <span>
          <ClipboardCheck size={15} />
          {game.checks} checks left
        </span>
        <span>
          <Users size={15} />
          {hires(game)}/{vacancy.seats} seats
        </span>
        <span>
          <Coins size={15} />
          {vacancy.budget - salaryUsed(game)} credits left
        </span>
      </div>
      <div ref={desk} className="hiring-desk">
        {game.finished ? (
          <DayReview game={game} dispatch={act} />
        ) : (
          <>
            <nav className="hiring-folders" aria-label="Candidate folders">
              {game.order.map((index) => (
                <button
                  key={index}
                  onClick={() => act({ type: 'open', index })}
                  aria-current={index === game.current ? 'true' : undefined}
                >
                  <span>{candidates[index].name.split(' ')[0]}</span>
                  <small>
                    {game.files[index].decision?.kind === 'hire'
                      ? 'Hired'
                      : game.files[index].decision
                        ? 'Rejected'
                        : 'Application'}
                  </small>
                </button>
              ))}
            </nav>
            <div ref={paper} className="hiring-papers">
              <Vacancy />
              <CandidateFile game={game} dispatch={act} />
              <DeskTools key={candidate.id} game={game} dispatch={act} />
            </div>
            {!file.decision && (
              <div className="hiring-decisions">
                <p className="hiring-decision-note">
                  {block ??
                    'The checks and offer are complete. Does the evidence support a hire?'}
                </p>
                <button
                  className="hiring-stamp is-reject"
                  onClick={() => act({ type: 'decide', kind: 'pass' })}
                >
                  Reject
                </button>
                <button
                  className="hiring-stamp is-hire"
                  onClick={() => act({ type: 'decide', kind: 'hire' })}
                  disabled={Boolean(block)}
                >
                  Hire
                </button>
              </div>
            )}
            <div ref={feedback}>
              <Receipt game={game} dispatch={act} />
            </div>
          </>
        )}
      </div>
      <footer className="hiring-outro">
        <p>
          The vacancy uses my stack. These six applications and their salary
          credits are fictional.
        </p>
      </footer>
    </article>
  )
}
