'use client'

import type { CSSProperties, PointerEvent } from 'react'
import {
  ArrowRight,
  Check,
  Lightbulb,
  RotateCcw,
  Trash2,
  Undo2,
} from 'lucide-react'
import { challenges } from './challenges'
import type { Element } from './molecule'
import { DISH_HEIGHT, TRASH, standingBox, type View } from './projection'
import { keyStyle, panelStyle, propPoses } from './prop-placement'
import type { Lab } from './use-lab'
import type { BoardPlacement } from './board-motion'

/*
 * Bench furniture as DOM. Every element here sits exactly over a clay object
 * drawn by bench.tsx; both take their pixel box from projection.ts. The DOM
 * carries the text, the hit target and the accessible name; the clay carries
 * the body. In the flat fallback the DOM also paints the body.
 */

type Box = { left: number; top: number; width: number; height: number }

function place(box: Box, minimum = 0): CSSProperties {
  return {
    left: box.left,
    top: box.top,
    width: Math.max(minimum, box.width),
    height: Math.max(minimum, box.height),
  }
}

export function Formula({ formula }: { formula: string }) {
  if (!formula) return <>—</>
  return (
    <>
      {formula
        .split(/(\d+)/)
        .map((part, index) =>
          /^\d+$/.test(part) ? <sub key={index}>{part}</sub> : part,
        )}
    </>
  )
}

export function Dish({
  element,
  view,
  count,
  dim,
  onDown,
  onClick,
}: {
  element: Element
  view: View
  count: number
  dim: boolean
  onDown: (event: PointerEvent<HTMLButtonElement>) => void
  onClick: () => void
}) {
  const { layout } = view
  const carbon = element === 'C'
  const box = standingBox(
    layout.dishes[element],
    layout.dishRadius,
    DISH_HEIGHT + 0.5,
    view,
  )
  const left = count === 1 ? '1 bead left' : `${count} beads left`
  return (
    <button
      type="button"
      className={`lumi-dish ${carbon ? 'is-carbon' : 'is-oxygen'}${dim ? ' is-dim' : ''}`}
      style={place(box, 44)}
      onPointerDown={onDown}
      onClick={onClick}
      aria-label={`${carbon ? 'Carbon' : 'OH'} dish, ${left}. Press to add one to the selected atom, or drag a bead onto a carbon.`}
    >
      <i aria-hidden="true">{carbon ? 'C' : 'OH'}</i>
      <span aria-hidden="true">
        {carbon ? 'C' : 'OH'} ×{count}
      </span>
    </button>
  )
}

export function TrashButton({
  view,
  hot,
  onClick,
}: {
  view: View
  hot: boolean
  onClick: () => void
}) {
  const box = standingBox(view.layout.trash, TRASH.radius, TRASH.height, view)
  return (
    <button
      type="button"
      data-lumi-trash
      className={`lumi-trash${hot ? ' is-hot' : ''}`}
      style={place(
        { ...box, width: box.width + 16, height: box.height + 8 },
        44,
      )}
      aria-label="Discard selected atom"
      onClick={onClick}
    >
      <Trash2 size={18} aria-hidden="true" />
    </button>
  )
}

export function Laptop({
  view,
  lab,
  message,
}: {
  view: View
  lab: Lab
  message: string
}) {
  const { layout } = view
  const [undoKey, resetKey] = layout.keys
  const pose = propPoses(view).laptop
  return (
    <div className="lumi-laptop">
      <div
        className={`lumi-screen${lab.solved ? ' is-glowing' : ''}`}
        style={panelStyle(layout.screen, view, pose)}
      >
        <p className="lumi-name" aria-live="polite">
          <span className="sr-only">IUPAC name</span>
          <strong>{lab.name ?? '…'}</strong>
        </p>
        <dl className="lumi-facts">
          <div>
            <dt>SMILES</dt>
            <dd>{lab.smiles || '—'}</dd>
          </div>
          <div>
            <dt>Formula</dt>
            <dd>
              <Formula formula={lab.formula} />
            </dd>
          </div>
        </dl>
        <output className="lumi-message" aria-live="polite">
          {message}
        </output>
      </div>
      <button
        type="button"
        className="lumi-key"
        style={keyStyle(undoKey, view, pose)}
        onClick={lab.undo}
        disabled={!lab.history.length}
      >
        <Undo2 size={12} aria-hidden="true" /> Undo
      </button>
      <button
        type="button"
        className="lumi-key"
        style={keyStyle(resetKey, view, pose)}
        onClick={lab.reset}
      >
        <RotateCcw size={12} aria-hidden="true" /> Reset
      </button>
    </div>
  )
}

export function Clipboard({
  view,
  lab,
  hint,
  onHint,
  board,
  moving,
}: {
  view: View
  lab: Lab
  hint: boolean
  onHint: () => void
  board: BoardPlacement
  moving: boolean
}) {
  const style = {
    ...panelStyle(board.panel, view, board.pose),
    '--board-focus': board.prominence,
  } as CSSProperties
  const challenge = lab.challenge
  if (!challenge)
    return (
      <section
        className="lumi-clipboard"
        style={style}
        aria-labelledby="lumi-clipboard-title"
        aria-busy={moving}
      >
        <span className="lumi-eyebrow">Free build</span>
        <h3 id="lumi-clipboard-title">Your bench</h3>
        <p>Up to eight carbons and one OH group. The screen reads it back.</p>
        <div className="lumi-clipboard-actions">
          <button type="button" onClick={() => lab.chooseTask(0)}>
            <RotateCcw size={12} aria-hidden="true" /> Bottle 1
          </button>
        </div>
      </section>
    )
  const next = challenges[lab.nextTask]
  const done = lab.completed.includes(lab.task)
  const intro = lab.phase === 'intro'
  const complete = lab.phase === 'complete'
  const text = complete
    ? challenge.discovery
    : intro
      ? 'Drag atoms from the dishes to build a molecule. The laptop names what you make.'
      : hint
        ? challenge.hint
        : challenge.prompt
  return (
    <section
      className={`lumi-clipboard${complete ? ' is-solved' : ''}${intro || complete ? ' is-forward' : ''}`}
      style={style}
      aria-labelledby="lumi-clipboard-title"
      aria-busy={moving}
    >
      <span className="lumi-eyebrow">
        Bottle {lab.task + 1} of {challenges.length}
        {done ? ' · made' : ''}
      </span>
      <h3 id="lumi-clipboard-title">
        {complete ? 'Made' : 'Make'} {challenge.target}
      </h3>
      <p className={hint && !lab.solved ? 'is-hint' : ''} aria-live="polite">
        {complete && <Check size={12} aria-hidden="true" />}
        {text}
      </p>
      <div className="lumi-clipboard-actions">
        {!intro && !complete && (
          <button
            type="button"
            aria-pressed={hint}
            aria-label={hint ? 'Hide hint' : 'Show hint'}
            onClick={onHint}
          >
            <Lightbulb size={12} aria-hidden="true" />
          </button>
        )}
        {(intro || complete) && (
          <button
            type="button"
            className="is-primary lumi-board-primary"
            onClick={intro ? lab.start : lab.next}
            disabled={moving}
          >
            {intro
              ? 'Start building'
              : next
                ? `Next: make ${next.target}`
                : 'Keep building'}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        )}
        {(!complete || next) && (
          <button type="button" onClick={() => lab.chooseTask(-1)}>
            Free build
          </button>
        )}
      </div>
    </section>
  )
}
