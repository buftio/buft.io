'use client'

import dynamic from 'next/dynamic'
import { useRef, type PointerEvent } from 'react'
import { ArrowDown, RotateCcw, StepForward } from 'lucide-react'
import { SceneBoundary } from '../scene-boundary'
import { useGame } from './use-game'
import { clamp } from './game'
import { kickVector, MAX_POWER } from './football'
import { WORLD_HEIGHT, type Point } from './types'
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
  const ballMarker = useRef<HTMLSpanElement>(null)
  const pitch = useRef<HTMLSpanElement>(null)
  const drag = useRef<(Point & { pointerId: number }) | null>(null)
  const keyboardAim = useRef({ x: 26.3, y: -49.4 })
  const shotAim = useRef({ x: 0, y: -44 })
  const ballDrag = useRef<(Point & { pointerId: number }) | null>(null)
  const point = (event: PointerEvent): Point => {
    const rect = world.current!.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * WORLD_HEIGHT,
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
  const follow = () =>
    (game.arrived ? pitch.current : ballMarker.current)?.scrollIntoView({
      block: 'center',
      behavior: reduced ? 'instant' : 'smooth',
    })
  const leader = game.scene.balls[0]
  const canKick =
    game.arrived && game.scene.outcome === 'setup' && game.scene.shotsLeft > 0
  const football = game.scene.football
  return (
    <article
      className="spera-story"
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
      <div className="spera-world" ref={world}>
        <figure
          className="spera-canvas"
          aria-label="Grenade playground connected by football chutes to a stadium"
        >
          <SceneBoundary compact onFailure={onReady}>
            <GameScene state={game.scene} onReady={onReady} />
          </SceneBoundary>
        </figure>
        <aside className="spera-narrative spera-halo">
          <h3>Behind the throw</h3>
          <p>
            Grenades were one example. I also built the editor tools used to
            configure how they behaved.
          </p>
        </aside>
        <aside className="spera-narrative spera-fifa">
          <h3>Over to FIFA</h3>
          <p>
            My FIFA work was on football team management systems inside the
            game.
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
          ) : (
            <button
              className="spera-icon"
              aria-label="Follow footballs"
              onClick={follow}
            >
              <ArrowDown size={22} />
            </button>
          )}
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
          aria-label="Aim grenade with arrow keys, then press Enter to throw"
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
        <span
          ref={ballMarker}
          className="spera-ball-marker"
          style={{ top: `${((leader?.y ?? 60) / WORLD_HEIGHT) * 100}%` }}
        />
        <span ref={pitch} className="spera-pitch-marker" />
        {football && (
          <button
            className={`spera-ball-hit ${canKick ? 'is-waiting' : ''}`}
            aria-label="Flick football. Drag back and release. Arrow left and right aim, up and down change power, Enter kicks."
            disabled={!canKick}
            style={{
              left: `${game.scene.player.x}%`,
              top: `${((game.scene.player.y - 1.75) / WORLD_HEIGHT) * 100}%`,
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
              top: `${((fan.y - 1.6) / WORLD_HEIGHT) * 100}%`,
            }}
            onClick={() => game.pokeFan(id)}
          />
        ))}
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
            disabled={!game.arrived}
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
      <output className="sr-only" aria-live="polite">
        {game.message} {game.footballMessage}
      </output>
    </article>
  )
}
