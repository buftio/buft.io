'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Heart, RotateCcw, Terminal } from 'lucide-react'
import { SceneBoundary } from '../scene-boundary'
import { DURATION, LIVES, fireAhead, newGame } from './defense'
import { Jigsaw, Page, Sparks } from './jigsaw'
import {
  candidates,
  drop,
  hint,
  isLocked,
  isSolved,
  newDock,
  pick,
  slots,
} from './dock'
import { gunAt, timeline, type Phase } from './layout'
import { pop, squeak } from './sound'

const World = dynamic(() => import('./world'), { ssr: false })

const steps: Record<Phase, [string, string]> = {
  dock: [
    '01 · Docking',
    'In 2024, before tools like this were popular, I built a Claude Code–style agent that ran supercomputers for scientists doing docking. Find the three pieces that fit the pocket, then turn them into place.',
  ],
  grail: ['01 · Docking', 'A match.'],
  papers: [
    '02 · Research',
    'Then labs study it from every side. I built the workspace where 70+ researchers put their findings together. Assemble the paper.',
  ],
  roll: [
    '03 · Preclinical',
    'Before people, a medicine is tested in preclinical studies. I built software for those too.',
  ],
  ready: [
    '04 · Patients',
    'Viruses are coming. Keep them away from the patient.',
  ],
  play: ['04 · Patients', 'Click anywhere to fire a syringe. Hold to spray.'],
  won: ['04 · Patients', 'The patient stayed healthy.'],
  lost: ['04 · Patients', 'The patient caught it.'],
}

export default function QuantoriStory({
  reduced,
  onReady,
}: {
  reduced: boolean
  onReady: () => void
}) {
  const [phase, setPhase] = useState<Phase>('dock')
  const [dock, setDock] = useState(newDock)
  const [log, setLog] = useState<{ command: string; reply: string } | null>(
    null,
  )
  const [rolling, setRolling] = useState(false)
  const [failed, setFailed] = useState(false)
  const [hud, setHud] = useState({ lives: LIVES, left: DURATION, popped: 0 })
  const game = useRef(newGame())
  const popped = useRef(0)
  const docked = isSolved(dock)

  useEffect(() => {
    if (phase !== 'dock' || !docked) return
    const timer = setTimeout(() => setPhase('grail'), 900)
    return () => clearTimeout(timer)
  }, [phase, docked])
  useEffect(() => {
    if (phase !== 'grail') return
    const timer = setTimeout(
      () => setPhase('papers'),
      (reduced ? 0.8 : timeline.grail) * 1000,
    )
    return () => clearTimeout(timer)
  }, [phase, reduced])
  useEffect(() => {
    if (phase !== 'roll') return
    const hit = setTimeout(squeak, timeline.roll.hit * 1000)
    const done = setTimeout(() => setPhase('ready'), timeline.roll.done * 1000)
    return () => {
      clearTimeout(hit)
      clearTimeout(done)
    }
  }, [phase])
  useEffect(() => {
    if (phase !== 'play') return
    const key = (event: KeyboardEvent) => {
      const turn = { ArrowLeft: 0.18, ArrowRight: -0.18 }[event.code]
      if (turn) game.current.aim += turn
      else if (event.code === 'Space') fireAhead(game.current, gunAt)
      else return
      event.preventDefault()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [phase])

  const onPick = useCallback(
    (index: number) => setDock((current) => pick(current, index)),
    [],
  )
  const onDrop = useCallback(
    (slot: number) => {
      const next = drop(dock, slot, performance.now())
      if (next.miss && next.miss !== dock.miss)
        setLog({
          command: `dock ${candidates[next.miss.index].name} --pocket ${slots[slot].name}`,
          reply: "doesn't bind",
        })
      else setLog(null)
      setDock(next)
    },
    [dock],
  )
  const solved = useCallback(() => {
    setRolling(true)
    setTimeout(() => {
      setRolling(false)
      setPhase('roll')
    }, 900)
  }, [])
  const onGameChange = useCallback(() => {
    const state = game.current
    if (state.popped > popped.current) pop()
    popped.current = state.popped
    setHud({
      lives: state.lives,
      left: Math.max(0, Math.ceil(DURATION - state.time)),
      popped: state.popped,
    })
    if (state.status !== 'play')
      setPhase((current) => (current === 'play' ? state.status : current))
  }, [])
  const start = () => {
    game.current = newGame()
    popped.current = 0
    setHud({ lives: LIVES, left: DURATION, popped: 0 })
    setPhase('play')
  }
  const restart = () => {
    game.current = newGame()
    setDock(newDock())
    setLog(null)
    setPhase('dock')
  }

  const [eyebrow, line] = steps[phase]
  return (
    <article className="q-story">
      <header className="q-intro">
        <h2 id="project-heading">Quantori</h2>
        <p>
          At Quantori I worked along the path a medicine takes: an agent that
          ran supercomputers for scientists doing docking, a shared workspace
          for research labs, software for preclinical studies, and a data
          platform for AstraZeneca.
        </p>
      </header>
      {failed ? (
        <ol className="q-fallback">
          {(['dock', 'papers', 'roll', 'ready'] as Phase[]).map((step) => (
            <li key={step}>
              <strong>{steps[step][0]}</strong> {steps[step][1]}
            </li>
          ))}
        </ol>
      ) : (
        <div className={`q-stage is-${phase}`}>
          <figure aria-label="A clay protein, a glowing molecule, researchers, a pig, and a patient">
            <SceneBoundary
              compact
              onFailure={() => {
                setFailed(true)
                onReady()
              }}
            >
              <World
                phase={phase}
                dock={dock}
                game={game}
                reduced={reduced}
                onPick={onPick}
                onDrop={onDrop}
                onGameChange={onGameChange}
                onReady={onReady}
              />
            </SceneBoundary>
          </figure>
          <div className="q-step" aria-live="polite">
            <span>{eyebrow}</span>
            <p>{line}</p>
          </div>
          {phase === 'dock' && (
            <div className="q-agent" aria-live="polite">
              {log && (
                <p>
                  <code>&gt; {log.command}</code>
                  {log.reply}
                </p>
              )}
              <button
                onClick={() => setLog({ command: 'hint', reply: hint(dock) })}
              >
                <Terminal size={14} /> Ask the agent
              </button>
            </div>
          )}
          {phase === 'papers' && !rolling && <Jigsaw onSolved={solved} />}
          {rolling && (
            <div className="q-rolling" aria-hidden="true">
              <Page />
              <Sparks count={36} reach={340} />
            </div>
          )}
          {(phase === 'play' || phase === 'won' || phase === 'lost') && (
            <div className="q-hud">
              <span aria-label={`${hud.lives} of ${LIVES} hearts left`}>
                {Array.from({ length: LIVES }, (_, i) => (
                  <Heart
                    key={i}
                    size={16}
                    fill={i < hud.lives ? 'currentColor' : 'none'}
                  />
                ))}
              </span>
              <span>{hud.left}s</span>
              <span>{hud.popped} popped</span>
            </div>
          )}
          {phase === 'ready' && (
            <div className="q-card">
              <p>
                A syringe full of the new medicine. Viruses are on their way.
              </p>
              <button onClick={start}>Start</button>
            </div>
          )}
          {(phase === 'won' || phase === 'lost') && (
            <div className="q-card">
              <p>
                {phase === 'won'
                  ? `The patient stayed healthy. You popped ${hud.popped} viruses.`
                  : `The patient caught it after ${hud.popped} pops.`}
              </p>
              <button onClick={start}>
                {phase === 'won' ? 'Play again' : 'Try again'}
              </button>
              <button className="is-quiet" onClick={restart}>
                <RotateCcw size={14} /> From the docking
              </button>
            </div>
          )}
        </div>
      )}
      {!failed && phase === 'dock' && (
        <div className="q-controls sr-only focus-within:not-sr-only">
          {candidates.map(({ name }, i) => (
            <button
              key={name}
              onClick={() => onPick(i)}
              disabled={isLocked(dock, i)}
              aria-pressed={dock.selected === i}
            >
              {isLocked(dock, i)
                ? `${name} fits`
                : dock.placed[i] !== null
                  ? `Turn ${name}`
                  : `Pick ${name}`}
            </button>
          ))}
          {dock.selected !== null &&
            slots.map(({ name }, slot) => (
              <button key={name} onClick={() => onDrop(slot)}>
                Try the {name} pocket
              </button>
            ))}
        </div>
      )}
      <footer className="q-outro">
        <p>
          The molecule, papers, pig, and viruses are made up. The work behind
          each step was real.
        </p>
      </footer>
    </article>
  )
}
