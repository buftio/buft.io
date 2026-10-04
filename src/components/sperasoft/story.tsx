'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { ArrowDown, RotateCcw, StepForward } from 'lucide-react'
import { SceneBoundary } from '../scene-boundary'
import { useGame } from './use-game'
import { clamp } from './game'
import { kickVector, MAX_POWER } from './football'
import {
  WORLD_HEIGHT,
  WORLD_TOP,
  worldPercent,
  type Point,
  type SceneState,
} from './types'
import { fans } from './fan-layout'
import { LooseBalls } from './loose-balls'

const GameScene = dynamic(() => import('./scene'), { ssr: false })

export default function SperasoftStory({
  reduced,
  onReady,
}: {
  reduced: boolean
  onReady: () => void
}) {
  const game = useGame(reduced)
  const world = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)
  const keeperDrag = useRef<number | null>(null)
  useEffect(() => {
    if (!game.scene.wallBroken) return
    const dialog = world.current?.closest('dialog')
    const hide = () => setScrolled(true)
    dialog?.addEventListener('scroll', hide, { once: true })
    return () => dialog?.removeEventListener('scroll', hide)
  }, [game.scene.wallBroken])
  const drag = useRef<(Point & { pointerId: number }) | null>(null)
  const keyboardAim = useRef({ x: 44, y: -38 })
  const shotAim = useRef({ x: 0, y: -44 })
  const ballDrag = useRef<(Point & { pointerId: number }) | null>(null)
  const point = (event: PointerEvent): Point => {
    const rect = world.current!.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * WORLD_HEIGHT + WORLD_TOP,
    }
  }
  const aimFrom = (event: PointerEvent) => {
    if (drag.current?.pointerId !== event.pointerId) return
    const current = point(event)
    keyboardAim.current = {
      x: clamp((drag.current.x - current.x) * 3, 8, 66),
      y: clamp((drag.current.y - current.y) * 3, -62, -8),
    }
    game.aim(
      keyboardAim.current,
      (Math.hypot(drag.current.x - current.x, drag.current.y - current.y) * 3) /
        70,
    )
  }
  const aimBall = (event: PointerEvent) => {
    if (ballDrag.current?.pointerId !== event.pointerId) return
    const current = point(event)
    shotAim.current = kickVector({
      x: (ballDrag.current.x - current.x) * 3.2,
      y: (ballDrag.current.y - current.y) * 3.2,
    })
    game.aimKick(shotAim.current)
  }
  const canKick =
    game.arrived && game.scene.outcome === 'setup' && game.scene.shotsLeft > 0
  const football = game.scene.football
  return (
    <article
      className="spera-story"
      data-score={JSON.stringify(game.scene.score)}
      data-home-keeper={JSON.stringify(game.scene.homeKeeper)}
      data-clock={game.scene.clock}
      data-wall={game.scene.wallBroken ? 'open' : 'intact'}
      data-bricks={game.scene.wallBricks.length}
      data-outcome={game.scene.outcome}
      data-arrived={game.arrived}
      data-defenders={JSON.stringify(game.scene.defenders)}
      data-exploding={!!game.scene.explosion}
      data-throw-progress={game.scene.throwProgress}
      data-throw-charging={game.scene.throwCharging}
      data-throw-strength={game.scene.throwStrength}
      data-shots={game.scene.shotsLeft}
      data-ball={JSON.stringify(game.scene.football)}
      data-keeper={JSON.stringify(game.scene.keeper)}
      data-player={JSON.stringify(game.scene.player)}
      data-balls={JSON.stringify(game.scene.balls)}
      data-kick-dragging={game.scene.kickDragging}
      data-fan-pokes={JSON.stringify(game.scene.fanPokes)}
    >
      <header className="spera-intro">
        <h2 id="project-heading">Gameplay &amp; game tools</h2>
        <p>
          At Sperasoft, I developed gameplay features and editor tools for Halo,
          and football team management systems for FIFA.
        </p>
      </header>
      <aside className="spera-narrative spera-halo">
        <h3>Behind the throw</h3>
        <p>
          Grenades were one example. I built the editor tools designers used to
          set up how they behave, and an in-engine testing framework that kept
          the editor stable.
        </p>
      </aside>
      <div className="spera-world" ref={world}>
        <figure
          className="spera-canvas"
          aria-label="Grenade playground connected by football chutes to a stadium"
        >
          <SceneBoundary compact onFailure={onReady}>
            <GameScene state={game.scene} onReady={onReady} />
          </SceneBoundary>
        </figure>
        <aside className="spera-narrative spera-artists">
          <h3>For the artists</h3>
          <p>
            Artists make the game too. My Maya and Perforce integrations cut a
            typical art task from 4 hours to 2.
          </p>
        </aside>
        <aside className="spera-narrative spera-fifa">
          <h3>Over to FIFA</h3>
          <p>
            On FIFA 2022 I worked on team management systems and the menus
            around them, together with designers and QA.
          </p>
        </aside>
        <div className="spera-tools" aria-label="Grenade controls">
          {!game.scene.wallBroken ? (
            <button
              className="spera-icon"
              aria-label="Throw grenade"
              disabled={
                !!game.scene.grenade ||
                (!game.scene.throwCharging && game.scene.throwProgress > 0)
              }
              onClick={game.throwGrenade}
            >
              <span className="spera-grenade" aria-hidden="true">
                <i />
              </span>
            </button>
          ) : null}
          {reduced && game.scene.wallBroken && (
            <button
              className="spera-icon"
              aria-label="Advance footballs"
              onClick={game.advance}
            >
              <StepForward size={22} />
            </button>
          )}
        </div>
        <button
          className="spera-throw-area"
          aria-label="Trooper"
          disabled={
            game.scene.wallBroken ||
            !!game.scene.grenade ||
            (!game.scene.throwCharging && game.scene.throwProgress > 0)
          }
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId)
            if (drag.current) return
            drag.current = { ...point(event), pointerId: event.pointerId }
            game.aim(keyboardAim.current, 0)
          }}
          onPointerMove={aimFrom}
          onPointerUp={(event) => {
            if (drag.current?.pointerId !== event.pointerId) return
            aimFrom(event)
            drag.current = null
            game.throwGrenade()
          }}
          onLostPointerCapture={(event) => {
            if (drag.current?.pointerId !== event.pointerId) return
            drag.current = null
            game.cancelThrow()
          }}
          onPointerCancel={(event) => {
            if (drag.current?.pointerId !== event.pointerId) return
            drag.current = null
            game.cancelThrow()
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault()
              event.stopPropagation()
              drag.current = null
              game.cancelThrow()
              return
            }
            const shift = {
              ArrowLeft: [-3, 0],
              ArrowRight: [3, 0],
              ArrowUp: [0, -3],
              ArrowDown: [0, 3],
            }[event.key]
            if (shift) {
              event.preventDefault()
              keyboardAim.current = {
                x: clamp(keyboardAim.current.x + shift[0], 8, 66),
                y: clamp(keyboardAim.current.y + shift[1], -62, -8),
              }
              game.aim(keyboardAim.current)
            }
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              game.throwGrenade()
            }
          }}
        />
        <div
          className="spera-score"
          aria-label={`${game.scene.score[0]} to ${game.scene.score[1]}`}
        >
          <span>{game.scene.score[0]}</span>
          <span>{game.scene.score[1]}</span>
        </div>
        {game.arrived && (
          <button
            className="spera-keeper-hit"
            aria-label="Blue keeper"
            style={{
              left: `${game.scene.homeKeeper.x}%`,
              top: `${worldPercent(game.scene.homeKeeper.y)}%`,
            }}
            onPointerDown={(event) => {
              keeperDrag.current = event.pointerId
              event.currentTarget.setPointerCapture(event.pointerId)
              game.moveKeeper(point(event).x)
            }}
            onPointerMove={(event) => {
              if (keeperDrag.current === event.pointerId)
                game.moveKeeper(point(event).x)
            }}
            onPointerUp={() => {
              keeperDrag.current = null
            }}
            onPointerCancel={() => {
              keeperDrag.current = null
            }}
            onLostPointerCapture={() => {
              keeperDrag.current = null
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault()
                game.moveKeeper(
                  game.scene.homeKeeper.x +
                    (event.key === 'ArrowLeft' ? -2 : 2),
                )
              }
            }}
          />
        )}
        {football && (
          <button
            className={`spera-ball-hit ${canKick ? 'is-waiting' : ''}`}
            aria-label="Blue player"
            disabled={!canKick}
            style={{
              left: `${game.scene.player.x}%`,
              top: `${worldPercent(game.scene.player.y - 1.75)}%`,
            }}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId)
              if (ballDrag.current) return
              ballDrag.current = { ...point(event), pointerId: event.pointerId }
              game.grabKick(true)
            }}
            onPointerMove={aimBall}
            onPointerUp={(event) => {
              if (ballDrag.current?.pointerId !== event.pointerId) return
              aimBall(event)
              ballDrag.current = null
              game.grabKick(false)
              game.play(shotAim.current)
            }}
            onLostPointerCapture={(event) => {
              if (ballDrag.current?.pointerId !== event.pointerId) return
              ballDrag.current = null
              game.grabKick(false)
            }}
            onPointerCancel={(event) => {
              if (ballDrag.current?.pointerId !== event.pointerId) return
              ballDrag.current = null
              game.grabKick(false)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && ballDrag.current) {
                event.preventDefault()
                event.stopPropagation()
                ballDrag.current = null
                game.grabKick(false)
                return
              }
              if (
                ![
                  'ArrowLeft',
                  'ArrowRight',
                  'ArrowUp',
                  'ArrowDown',
                  'Enter',
                  ' ',
                ].includes(event.key)
              )
                return
              event.preventDefault()
              if (event.key === 'Enter' || event.key === ' ') {
                game.play(shotAim.current)
                return
              }
              let angle = Math.atan2(shotAim.current.y, shotAim.current.x)
              let power = Math.hypot(shotAim.current.x, shotAim.current.y)
              if (event.key === 'ArrowLeft') angle -= Math.PI / 36
              if (event.key === 'ArrowRight') angle += Math.PI / 36
              if (event.key === 'ArrowUp')
                power = Math.min(MAX_POWER, power + 4)
              if (event.key === 'ArrowDown') power = Math.max(8, power - 4)
              shotAim.current = {
                x: Math.cos(angle) * power,
                y: Math.sin(angle) * power,
              }
              game.aimKick(shotAim.current)
            }}
          />
        )}
        <LooseBalls
          balls={game.scene.balls}
          world={world}
          grab={game.grabBall}
          move={game.moveBall}
          drop={game.dropBall}
        />
        {fans.map((fan, id) => (
          <button
            key={id}
            className="spera-fan-hit"
            aria-label={`Poke fan ${id + 1}`}
            data-fan={id}
            style={{
              left: `${fan.x}%`,
              top: `${worldPercent(fan.y - 1.6)}%`,
            }}
            onClick={() => game.pokeFan(id)}
          />
        ))}
        {(game.scene.outcome === 'won' || game.scene.outcome === 'lost') && (
          <aside className="spera-narrative spera-ending">
            <h3>Full time</h3>
            <p>
              Most of what I built at Sperasoft was for the people making the
              game: designers, artists and QA.
            </p>
          </aside>
        )}
        <div className="spera-match" aria-label="Football controls">
          <span className="spera-kicks">
            <span className="sr-only">
              {game.scene.shotsLeft} kicks remaining
            </span>
            {[0, 1, 2].map((i) => (
              <i
                key={i}
                aria-hidden="true"
                className={i < game.scene.shotsLeft ? 'available' : ''}
              />
            ))}
          </span>
          <button
            className="spera-icon"
            aria-label="Retry"
            disabled={
              game.scene.outcome !== 'won' && game.scene.outcome !== 'lost'
            }
            onClick={() => {
              ballDrag.current = null
              shotAim.current = { x: 0, y: -44 }
              game.retry()
            }}
          >
            <RotateCcw size={22} />
          </button>
          {reduced && !game.arrived && game.scene.wallBroken && (
            <button
              className="spera-icon"
              aria-label="Advance footballs"
              onClick={game.advance}
            >
              <StepForward size={22} />
            </button>
          )}
        </div>
      </div>
      {game.scene.wallBroken && !scrolled && (
        <span className="spera-scroll-cue" aria-hidden="true">
          <ArrowDown size={26} />
        </span>
      )}
      <output className="sr-only" aria-live="polite">
        {game.message} {matchNews(game.scene)}
      </output>
    </article>
  )
}

function matchNews({ outcome, score: [home, away] }: SceneState) {
  if (outcome === 'won' || outcome === 'lost')
    return `Full time, ${home} to ${away}`
  if (outcome === 'saved') return 'Saved'
  if (outcome === 'opponent-windup') return 'Opponent shooting'
  return home + away ? `Score ${home} to ${away}` : ''
}
