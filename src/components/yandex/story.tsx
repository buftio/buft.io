'use client'

import dynamic from 'next/dynamic'
import { useReducer, useRef, useEffect, useState } from 'react'
import { Users, Coins, ClipboardCheck, FastForward } from 'lucide-react'
import { SceneBoundary } from '../scene-boundary'
import { candidates, evidenceNames, vacancy, type Evidence } from './candidates'
import {
  gameReducer,
  hireBlock,
  hires,
  initialGame,
  revealed,
  salaryUsed,
  type Action,
} from './game'
import { CandidateFile, DeskTools, Vacancy, VacancyBrief } from './papers'
import { DayReview, Receipt } from './review'
import type { OfficeStage } from './office'

const HiringOffice = dynamic(() => import('./office'), { ssr: false })
const phone = () =>
  matchMedia('(max-width: 700px), (max-height: 500px)').matches

type Phase = 'brief' | 'arriving' | 'file'

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
  const [phase, setPhase] = useState<Phase>('brief')
  const [said, setSaid] = useState<Evidence | null>(null)
  const [sceneFailed, setSceneFailed] = useState(false)
  const finished = game.finished
  const paper = useRef<HTMLDivElement>(null)
  const desk = useRef<HTMLDivElement>(null)
  const feedback = useRef<HTMLDivElement>(null)
  const office = useRef<HTMLDivElement>(null)
  const file = game.files[game.current]
  const candidate = candidates[game.current]
  const first = candidate.name.split(' ')[0]
  const hired = game.files.flatMap((record, index) =>
    record.decision?.kind === 'hire' ? [index] : [],
  )
  const block = hireBlock(game)
  const instant = reduced || sceneFailed
  const scroll = reduced ? 'instant' : 'smooth'
  const call = () => {
    setSaid(null)
    setStage('review')
    setPhase(instant ? 'file' : 'arriving')
    if (phone()) office.current?.scrollIntoView({ behavior: scroll })
  }
  const act = (action: Action) => {
    dispatch(action)
    if (action.type === 'check') {
      setStage(
        action.check === 'security' || action.check === 'clarify'
          ? 'security'
          : 'interview',
      )
      setSaid(action.check)
    }
    if (action.type === 'offer') {
      setStage('offer')
      setSaid('salary')
    }
    if (action.type === 'decide') {
      setSaid(null)
      setStage(action.kind === 'hire' ? 'hired' : 'rejected')
    }
    if (action.type === 'next' || action.type === 'restart') call()
  }
  useEffect(() => {
    if (!file.decision) return
    feedback.current?.querySelector('h3')?.focus({ preventScroll: true })
    if (phone())
      feedback.current?.scrollIntoView({ block: 'nearest', behavior: scroll })
  }, [file.decision, scroll])
  useEffect(() => {
    const heading = finished
      ? desk.current?.querySelector<HTMLElement>('.hiring-results h3')
      : phase === 'file'
        ? paper.current?.querySelector<HTMLElement>('.hiring-file h3')
        : null
    heading?.focus({ preventScroll: true })
  }, [phase, game.current, finished])
  const sceneStage: OfficeStage =
    phase === 'brief'
      ? 'brief'
      : finished
        ? 'closed'
        : file.decision
          ? file.decision.kind === 'hire'
            ? 'hired'
            : 'rejected'
          : stage
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
      <div ref={office} className="hiring-office">
        <figure aria-label="A clay recruitment office, with a candidate at your desk, a computer, files, and a waiting area">
          <SceneBoundary
            compact
            onFailure={() => {
              setSceneFailed(true)
              if (phase === 'arriving') setPhase('file')
              onReady()
            }}
          >
            <HiringOffice
              candidate={game.current}
              hired={hired}
              stage={sceneStage}
              paused={reduced}
              arrived={phase !== 'arriving'}
              onArrive={() => setPhase('file')}
              onReady={onReady}
            />
          </SceneBoundary>
        </figure>
        <div className="hiring-office-note">
          <i />
          {phase === 'brief'
            ? `OPEN VACANCY / ${vacancy.role}`
            : finished
              ? 'OFFICE CLOSED'
              : phase === 'arriving'
                ? `${first} brings a resume…`
                : `NOW MEETING / ${candidate.name}`}
        </div>
        {said &&
          phase === 'file' &&
          !file.decision &&
          revealed(file).includes(said) && (
            <div key={said} className="hiring-bubble" aria-hidden="true">
              <small>
                {said === 'salary'
                  ? first
                  : said === 'security'
                    ? 'Security desk'
                    : 'Interview notes'}{' '}
                · {evidenceNames[said]}
              </small>
              <p>
                {said === 'salary'
                  ? file.reply
                  : said !== 'application' && candidate.evidence[said]}
              </p>
            </div>
          )}
        {phase === 'arriving' && (
          <button className="hiring-skip" onClick={() => setPhase('file')}>
            Skip
            <FastForward size={14} />
          </button>
        )}
      </div>
      <div
        className="hiring-daybar"
        aria-label="Hiring day resources"
        hidden={phase === 'brief'}
      >
        <strong>
          {finished
            ? 'DAY COMPLETE'
            : `CANDIDATE ${game.order.indexOf(game.current) + 1} OF ${candidates.length}`}
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
        {finished ? (
          <DayReview game={game} dispatch={act} />
        ) : phase === 'brief' ? (
          <VacancyBrief onStart={call} />
        ) : (
          <>
            <div ref={paper} className="hiring-papers">
              <Vacancy />
              {phase === 'file' ? (
                <>
                  <CandidateFile
                    key={`file-${candidate.id}`}
                    game={game}
                    dispatch={act}
                  />
                  <DeskTools
                    key={candidate.id}
                    game={game}
                    said={said}
                    dispatch={act}
                  />
                </>
              ) : (
                <div className="hiring-slot" aria-live="polite">
                  {first} is walking to your desk with a resume.
                </div>
              )}
            </div>
            {phase === 'file' && !file.decision && (
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
