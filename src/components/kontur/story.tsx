'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Coins,
  Landmark,
  Rocket,
  RotateCcw,
  SquareChevronUp,
  Stamp,
} from 'lucide-react'
import { SceneBoundary } from '../scene-boundary'
import { boop, fanfare, pickup, pop, squeak } from '../quantori/sound'
import {
  BANKS,
  FACTORY,
  ROCKET,
  connectBanks,
  newGame,
  register,
  type Game,
} from './factory'
import { cheer, chink, gate, lift, thud } from './sound'
import type { Look } from './input'
import type { Signal } from './world'

const World = dynamic(() => import('./world'), { ssr: false })
const Inspect = dynamic(() => import('./inspect'), { ssr: false })

type Snapshot = {
  wallet: number
  tiles: number
  registered: boolean
  sold: boolean
  minted: boolean
  built: number
  banks: boolean
  gate: number
  opened: boolean
  imported: boolean
  openings: number
  rocket: number
  launched: boolean
}

const snap = (game: Game): Snapshot => ({
  wallet: game.wallet,
  tiles: game.tiles,
  registered: game.registered,
  sold: game.sold,
  minted: game.minted,
  built: game.built,
  banks: game.banks,
  gate: Math.max(0, Math.ceil(game.gate - game.time)),
  opened: game.opened,
  imported: game.imported,
  openings: game.openings,
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
      'Your business makes paperwork now. To earn, drag goods off the belt into the shop. Right-click or long-press anything for a closer look.',
    ]
  if (!s.minted)
    return [
      '02 · Pay a tax',
      'Money from hand sales is gray. Carry a paper and two gray coins to the tax office: it turns them into one gold coin.',
    ]
  if (!s.built)
    return [
      '02 · Pay a tax',
      'A belt factory opened. Drop the gold coin into it to press a belt tile, then drag the tile out onto the floor; it faces the way you dragged. Tap a belt to turn it.',
    ]
  if (!s.banks)
    return [
      '02 · Pay a tax',
      `Automate the chores: goods into the shop, coins and papers into the tax office. Gold makes more belts at the factory, or goes to the bank: at ${BANKS} banked gold, connect the banks.`,
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
  coin: chink,
  broke: boop,
  lift,
}

export default function KonturStory({
  reduced,
  onReady,
}: {
  reduced: boolean
  onReady: () => void
}) {
  const game = useRef(newGame())
  const [state, setState] = useState(() => snap(newGame()))
  const [failed, setFailed] = useState(false)
  const [round, setRound] = useState(0)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const onChange = useCallback(() => {
    const next = snap(game.current)
    setState((old) => {
      if (!old.launched && next.launched) fanfare()
      if (next.openings > old.openings) (next.openings === 1 ? cheer : gate)()
      return JSON.stringify(old) === JSON.stringify(next) ? old : next
    })
  }, [])
  const [broke, setBroke] = useState(0)
  const [look, setLook] = useState<Look | null>(null)
  const [stamped, setStamped] = useState(false)
  const close = useCallback(() => setLook(null), [])
  const onSignal = useCallback((signal: Signal) => {
    sounds[signal]()
    if (signal === 'broke') setBroke((n) => n + 1)
  }, [])
  const restart = () => {
    game.current = newGame()
    setState(snap(game.current))
    setBroke(0)
    setLook(null)
    setStamped(false)
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
        <div className="k-stage">
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
                onChange={onChange}
                onSignal={onSignal}
                onInspect={setLook}
                onReady={onReady}
                reduced={reduced}
              />
            </SceneBoundary>
          </figure>
          <div
            className={
              state.launched
                ? 'k-step is-done'
                : !state.registered
                  ? `k-step is-intro${stamped ? ' is-stamped' : ''}`
                  : 'k-step'
            }
            aria-live="polite"
          >
            <span>{state.launched ? 'Liftoff' : eyebrow}</span>
            {state.launched ? (
              <>
                <strong>Everything runs</strong>
                <p>
                  Useful software disappears into the task it helps you finish.
                  The factory keeps going without you.
                </p>
                <button onClick={restart}>
                  <RotateCcw size={14} /> Play again
                </button>
              </>
            ) : (
              <p>{line}</p>
            )}
            {!state.registered && (
              <>
                <button
                  className="k-stamp"
                  disabled={stamped}
                  onClick={() => {
                    setStamped(true)
                    timers.current = [
                      window.setTimeout(thud, 260),
                      window.setTimeout(() => {
                        register(game.current)
                        pickup()
                        onChange()
                      }, 1100),
                    ]
                  }}
                >
                  <Stamp size={18} /> Register business
                </button>
                {stamped && <i className="k-approved">Approved</i>}
              </>
            )}
          </div>
          {state.imported && (
            <p className="k-note">
              The shop, the goods and the rocket are made up. The registration
              service, the bank API and the customs logs were real.
            </p>
          )}
          {look && (
            <Inspect
              game={game}
              look={look}
              reduced={reduced}
              onClose={close}
            />
          )}
          {state.registered && (
            <div className="k-hud">
              <span className="k-wallet" aria-label={`${state.wallet} gold`}>
                <Coins size={15} /> {state.wallet}
              </span>
              {state.minted && (
                <span
                  key={broke}
                  className={
                    broke ? 'k-wallet k-tiles is-broke' : 'k-wallet k-tiles'
                  }
                  aria-label={`${state.tiles} belt tiles`}
                >
                  <SquareChevronUp size={15} /> {state.tiles}
                  {broke > 0 && !state.tiles && (
                    <em>Drop gold into the factory</em>
                  )}
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
        </div>
      )}
    </article>
  )
}
