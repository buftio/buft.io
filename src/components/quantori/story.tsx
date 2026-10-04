'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Heart, HeartCrack, RotateCcw, Siren, Trophy } from 'lucide-react'
import { Agent } from './agent'
import { SceneBoundary } from '../scene-boundary'
import { DURATION, LIVES, fireAhead, newGame } from './defense'
import { Jigsaw, Page, Sparks } from './jigsaw'
import {
  ask,
  candidates,
  drop,
  isLocked,
  isPending,
  isSolved,
  newDock,
  pick,
  score,
  slots,
} from './dock'
import { gunAt, timeline, type Phase } from './layout'
import { alarm, boop, fanfare, oink, pickup, pop, sad, squeak } from './sound'

const World = dynamic(() => import('./world'), { ssr: false })

const steps: Record<Phase, [string, string]> = {
  dock: [
    '01 · Docking',
    'In 2024, before tools like this were popular, I built a Claude Code–style agent that ran supercomputers for scientists doing docking. Guess which three fragments bind, and where. Fill the pocket and the supercomputer scores each try.',
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
  play: [
    '04 · Patients',
    'Click anywhere to fire a syringe. Hold to spray. Grab golden capsules.',
  ],
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
  const [note, setNote] = useState<string | null>(null)
  const [rolling, setRolling] = useState(false)
  const [failed, setFailed] = useState(false)
  const [brute, setBrute] = useState(false)
  const [hud, setHud] = useState({
    lives: LIVES,
    left: DURATION,
    popped: 0,
    shotgun: 0,
  })
  const game = useRef(newGame())
  const popped = useRef(0)
  const armed = useRef(-1)
  const docked = isSolved(dock)
  const pending = isPending(dock)

  useEffect(() => {
    if (phase !== 'dock' || !docked) return
    const timer = setTimeout(() => setPhase('grail'), 900)
    return () => clearTimeout(timer)
  }, [phase, docked])
  useEffect(() => {
    if (!pending) return
    const timer = setTimeout(() => {
      const next = score(dock)
      setDock(next)
      if (isSolved(next)) pickup()
      else boop()
    }, 1000)
    return () => clearTimeout(timer)
  }, [pending, dock])
  useEffect(() => {
    if (phase === 'ready') alarm()
    if (phase === 'won') fanfare()
    if (phase === 'lost') sad()
  }, [phase])
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
    (slot: number) => setDock((current) => drop(current, slot)),
    [],
  )
  const onAsk = () => {
    const answer = ask(dock)
    if (!answer) return
    setDock(answer.dock)
    const name = candidates[answer.dock.secret[answer.slot]].name
    setNote(
      `ran 4,096 poses: ${name} binds in the ${slots[answer.slot].name} pocket`,
    )
  }
  const solved = useCallback(() => {
    setRolling(true)
    setTimeout(() => {
      setRolling(false)
      setPhase('roll')
    }, 900)
  }, [])
  const onPig = useCallback(
    (streak: number) => {
      if (phase !== 'papers' || rolling || brute) return
      oink(streak)
      if (streak >= 10) setBrute(true)
    },
    [phase, rolling, brute],
  )
  useEffect(() => {
    if (!brute) return
    const roll = setTimeout(solved, 1500)
    const hide = setTimeout(() => setBrute(false), 3200)
    return () => {
      clearTimeout(roll)
      clearTimeout(hide)
    }
  }, [brute, solved])
  const onGameChange = useCallback(() => {
    const state = game.current
    if (state.popped > popped.current) pop()
    popped.current = state.popped
    if (state.shotgun !== armed.current && state.shotgun > state.time) pickup()
    armed.current = state.shotgun
    setHud({
      lives: state.lives,
      left: Math.max(
        0,
        Math.ceil(DURATION - (state.end < 0 ? state.time : state.end)),
      ),
      popped: state.popped,
      shotgun:
        state.status === 'play'
          ? Math.max(0, Math.ceil(state.shotgun - state.time))
          : 0,
    })
    if (state.status !== 'play')
      setPhase((current) => (current === 'play' ? state.status : current))
  }, [])
  const start = () => {
    game.current = newGame()
    popped.current = 0
    setHud({ lives: LIVES, left: DURATION, popped: 0, shotgun: 0 })
    setPhase('play')
  }
  const restart = () => {
    game.current = newGame()
    setDock(newDock())
    setNote(null)
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
                onPig={onPig}
              />
            </SceneBoundary>
          </figure>
          <div className="q-step" aria-live="polite">
            <span>{eyebrow}</span>
            <p>{line}</p>
          </div>
          {phase === 'dock' && <Agent dock={dock} note={note} onAsk={onAsk} />}
          {phase === 'papers' && !rolling && <Jigsaw onSolved={solved} />}
          {brute && (
            <output className="q-egg">
              Sometimes brute force works as well.
            </output>
          )}
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
              {hud.shotgun > 0 && (
                <span className="q-shotgun">×5 {hud.shotgun}s</span>
              )}
            </div>
          )}
          {phase === 'ready' && (
            <div className="q-card q-result q-alarm">
              <span className="q-badge" aria-hidden="true">
                <Siren size={22} />
              </span>
              <div>
                <span className="q-verdict">Outbreak</span>
                <strong>Viruses incoming</strong>
                <span className="q-stats">
                  The syringe is loaded. Hold them off for {DURATION}s.
                </span>
              </div>
              <div className="q-actions">
                <button onClick={start}>Start</button>
              </div>
            </div>
          )}
          {(phase === 'won' || phase === 'lost') && (
            <div className={`q-card q-result is-${phase}`}>
              {phase === 'won' && <Sparks count={30} reach={260} />}
              <span className="q-badge" aria-hidden="true">
                {phase === 'won' ? (
                  <Trophy size={22} />
                ) : (
                  <HeartCrack size={22} />
                )}
              </span>
              <div>
                <span className="q-verdict">
                  {phase === 'won' ? 'Patient saved' : 'Patient caught it'}
                </span>
                <strong>
                  {phase === 'won'
                    ? `${hud.popped} viruses popped`
                    : `Held out ${DURATION - hud.left}s`}
                </strong>
                <span className="q-stats">
                  <span aria-label={`${hud.lives} of ${LIVES} hearts kept`}>
                    {Array.from({ length: LIVES }, (_, i) => (
                      <Heart
                        key={i}
                        size={13}
                        fill={i < hud.lives ? 'currentColor' : 'none'}
                      />
                    ))}
                  </span>
                  {phase === 'won'
                    ? `${hud.lives} of ${LIVES} hearts kept`
                    : `${hud.popped} popped`}
                </span>
              </div>
              <div className="q-actions">
                <button onClick={start}>
                  {phase === 'won' ? 'Play again' : 'Try again'}
                </button>
                <button className="is-quiet" onClick={restart}>
                  <RotateCcw size={14} /> From the docking
                </button>
              </div>
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
              disabled={isLocked(dock, i) || pending}
              aria-pressed={dock.selected === i}
            >
              {isLocked(dock, i)
                ? `${name} binds`
                : dock.placed[i] !== null
                  ? `Take ${name} out`
                  : `Pick ${name}`}
            </button>
          ))}
          {dock.selected !== null &&
            slots.map(({ name }, slot) => (
              <button key={name} onClick={() => onDrop(slot)}>
                Put it in the {name} pocket
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
