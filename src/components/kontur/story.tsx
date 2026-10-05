'use client'

import dynamic from 'next/dynamic'
import { useCallback, useRef, useState } from 'react'
import {
  Coins,
  Hand,
  Landmark,
  Rocket,
  RotateCcw,
  Trash2,
  Waypoints,
} from 'lucide-react'
import { SceneBoundary } from '../scene-boundary'
import { boop, fanfare, pickup, pop, squeak } from '../quantori/sound'
import {
  BANKS,
  BELT,
  FACTORY,
  ROCKET,
  connectBanks,
  newGame,
  register,
  type Game,
} from './factory'
import type { Signal, Tool } from './world'

const World = dynamic(() => import('./world'), { ssr: false })

type Snapshot = {
  wallet: number
  registered: boolean
  sold: boolean
  minted: boolean
  built: number
  banks: boolean
  gate: number
  opened: boolean
  rocket: number
  launched: boolean
}

const snap = (game: Game): Snapshot => ({
  wallet: game.wallet,
  registered: game.registered,
  sold: game.sold,
  minted: game.minted,
  built: game.built,
  banks: game.banks,
  gate: Math.max(0, Math.ceil(game.gate - game.time)),
  opened: game.opened,
  rocket: game.rocket,
  launched: game.launched,
})

function stepOf(s: Snapshot): [string, string] {
  if (!s.registered)
    return [
      '01 · Start a business',
      'Opening a small business in Russia used to mean queues and paper. I built the country’s first online registration service. One click.',
    ]
  if (!s.sold)
    return [
      '01 · Start a business',
      'Your business makes paperwork now. To earn, drag goods off the belt into the shop.',
    ]
  if (!s.minted)
    return [
      '02 · Pay a tax',
      'Money from hand sales is gray. Carry a paper and two gray coins to the tax office: it turns them into one gold coin.',
    ]
  if (!s.built)
    return [
      '02 · Pay a tax',
      `Gold buys belts, ${BELT} a tile. Pick the belt tool and drag across the floor; things ride where the arrows point.`,
    ]
  if (!s.banks)
    return [
      '02 · Pay a tax',
      `Automate the chores: goods into the shop, coins and papers into the tax office. Tap gold coins to pocket them. At ${BANKS} gold, connect the banks.`,
    ]
  if (!s.opened)
    return [
      '03 · Banks',
      'Three major banks plugged into one API I designed, with SDKs and docs, so their clients could pay taxes right from the bank. Next: imports wait behind customs; a gold coin in the customs booth opens the gate.',
    ]
  if (s.rocket < FACTORY)
    return [
      '04 · Customs',
      'At customs I set up the log system: bugs were found twice as fast, and QA could sort them out without waiting for developers. Belt imports into the shop; they sell for diamonds. Five buy a rocket factory.',
    ]
  return [
    '05 · Get on with your day',
    `Feed the rocket ${ROCKET} diamonds. Keep the gate paid and let the factory run.`,
  ]
}

const sounds: Record<Signal, () => void> = {
  sold: pop,
  denied: boop,
  back: () => {},
  built: squeak,
  coin: pickup,
}

export default function KonturStory({
  onReady,
}: {
  reduced: boolean
  onReady: () => void
}) {
  const game = useRef(newGame())
  const [state, setState] = useState(() => snap(newGame()))
  const [tool, setTool] = useState<Tool>('hand')
  const [failed, setFailed] = useState(false)
  const [round, setRound] = useState(0)

  const onChange = useCallback(() => {
    const next = snap(game.current)
    setState((old) => {
      if (!old.launched && next.launched) fanfare()
      return JSON.stringify(old) === JSON.stringify(next) ? old : next
    })
  }, [])
  const onSignal = useCallback((signal: Signal) => sounds[signal](), [])
  const restart = () => {
    game.current = newGame()
    setState(snap(game.current))
    setTool('hand')
    setRound((n) => n + 1)
  }

  const [eyebrow, line] = stepOf(state)
  return (
    <article className="k-story">
      <header className="k-intro">
        <h2 id="project-heading">Kontur</h2>
        <p>
          Kontur is Russia’s largest B2B platform for business and government
          reporting. I built the plumbing behind ordinary business chores:
          opening a company, paying taxes through a bank, getting goods through
          customs.
        </p>
      </header>
      {failed ? (
        <p className="k-fallback">{line}</p>
      ) : (
        <div className={`k-stage is-${tool}`}>
          <figure aria-label="A small clay factory: a shop, a tax office, a border with customs, and a rocket site">
            <SceneBoundary
              compact
              onFailure={() => {
                setFailed(true)
                onReady()
              }}
            >
              <World
                key={round}
                game={game}
                tool={tool}
                onChange={onChange}
                onSignal={onSignal}
                onReady={onReady}
              />
            </SceneBoundary>
          </figure>
          <div className="k-step" aria-live="polite">
            <span>{eyebrow}</span>
            <p>{line}</p>
            {!state.registered && (
              <button
                onClick={() => {
                  register(game.current)
                  pickup()
                  onChange()
                }}
              >
                Register business
              </button>
            )}
          </div>
          {state.registered && (
            <div className="k-hud">
              <span className="k-wallet" aria-label={`${state.wallet} gold`}>
                <Coins size={15} /> {state.wallet}
              </span>
              {state.minted && (
                <span className="k-tools" aria-label="Tool">
                  {(
                    [
                      ['hand', Hand, 'Carry'],
                      ['belt', Waypoints, `Belt · ${BELT}`],
                      ['remove', Trash2, 'Remove'],
                    ] as const
                  ).map(([id, Icon, label]) => (
                    <button
                      key={id}
                      aria-pressed={tool === id}
                      onClick={() => setTool(id)}
                    >
                      <Icon size={14} /> {label}
                    </button>
                  ))}
                </span>
              )}
              {state.built > 0 && !state.banks && (
                <button
                  className="k-buy"
                  disabled={state.wallet < BANKS}
                  onClick={() => {
                    connectBanks(game.current)
                    pickup()
                    onChange()
                  }}
                >
                  <Landmark size={14} /> Connect banks · {BANKS}
                </button>
              )}
              {state.opened && (
                <span className={state.gate ? 'is-open' : 'is-closed'}>
                  Gate {state.gate ? `${state.gate}s` : 'closed'}
                </span>
              )}
              {state.rocket >= FACTORY && (
                <span>
                  <Rocket size={14} /> {state.rocket}/{ROCKET}
                </span>
              )}
            </div>
          )}
          {state.launched && (
            <div className="k-card">
              <div>
                <span>Liftoff</span>
                <strong>Everything runs</strong>
                <p>
                  Useful software disappears into the task it helps you finish.
                </p>
              </div>
              <button onClick={restart}>
                <RotateCcw size={14} /> Play again
              </button>
            </div>
          )}
        </div>
      )}
      <footer className="k-outro">
        <p>
          The shop, the goods and the rocket are made up. The registration
          service, the bank API and the customs logs were real.
        </p>
      </footer>
    </article>
  )
}
