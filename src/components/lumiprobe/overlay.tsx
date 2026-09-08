'use client'

import type { KeyboardEvent, PointerEvent } from 'react'
import { Check, LockKeyhole } from 'lucide-react'
import { challenges, isUnlocked } from './challenges'
import type { Molecule } from './molecule'
import {
  atomWorld,
  labelWorld,
  project,
  radiusOf,
  shelfSpacing,
  type Fit,
  type View,
} from './projection'
import { isEnd } from './use-drag'

type Props = {
  view: View
  fit: Fit
  molecule: Molecule
  selected: number
  dragging: number | null
  linking: number | null
  sockets: number[]
  hot: number | null
  task: number
  completed: number[]
  blocked: boolean
  onChoose: (index: number) => void
  onAtomDown: (id: number, event: PointerEvent<HTMLButtonElement>) => void
  onAtomClick: (id: number) => void
  onAtomKey: (id: number, event: KeyboardEvent<HTMLButtonElement>) => void
}

export const ATOM_HELP_ID = 'lumi-atom-help'

export function describeAtom(molecule: Molecule, id: number) {
  const index = molecule.atoms.findIndex((a) => a.id === id)
  const atom = molecule.atoms[index]
  if (!atom) return ''
  const kind = atom.element === 'C' ? 'Carbon' : 'OH group'
  const end =
    molecule.atoms.length > 1 && isEnd(molecule, id) ? ', end atom' : ''
  return `${kind} ${index + 1}${end}`
}

/* Bottle labels and atom hit targets, projected over the clay scene. */
export function Overlay({
  view,
  fit,
  molecule,
  selected,
  dragging,
  linking,
  sockets,
  hot,
  task,
  completed,
  blocked,
  onChoose,
  onAtomDown,
  onAtomClick,
  onAtomKey,
}: Props) {
  if (!view.width) return null
  const at = new Map(
    molecule.atoms.map((atom) => [
      atom.id,
      project(atomWorld(atom, fit), view),
    ]),
  )
  const labelWidth = shelfSpacing(view) * view.unit - 8
  return (
    <div className="lumi-overlay">
      <nav className="lumi-shelf" aria-label="Challenge bottles">
        {challenges.map((challenge, index) => {
          const point = project(labelWorld(index, view), view)
          const done = completed.includes(index)
          const locked = !isUnlocked(index, completed)
          return (
            <button
              key={challenge.target}
              type="button"
              className={`lumi-label${index === task ? ' is-current' : ''}${done ? ' is-done' : ''}${locked ? ' is-locked' : ''}`}
              style={{ left: point.left, top: point.top, width: labelWidth }}
              aria-current={index === task ? 'true' : undefined}
              aria-label={`Bottle ${index + 1}: ${challenge.target}${done ? ', made' : ''}${locked ? `, locked. Complete bottle ${index} first.` : ''}`}
              disabled={locked}
              onClick={() => onChoose(index)}
            >
              <span aria-hidden="true">
                {locked ? (
                  <LockKeyhole size={12} />
                ) : done ? (
                  <Check size={10} />
                ) : (
                  `0${index + 1}`
                )}
              </span>
              <b>{challenge.target}</b>
            </button>
          )
        })}
      </nav>
      <svg className="lumi-bonds" aria-hidden="true">
        {molecule.bonds.map(([a, b]) => {
          const from = at.get(a)
          const to = at.get(b)
          return from && to ? (
            <line
              key={`${a}-${b}`}
              x1={from.left}
              y1={from.top}
              x2={to.left}
              y2={to.top}
            />
          ) : null
        })}
      </svg>
      <div className="lumi-atoms" inert={blocked}>
        {molecule.atoms.map((atom) => {
          const point = at.get(atom.id)!
          const size = Math.max(
            36,
            radiusOf(atom.element) * 2 * fit.scale * view.unit * 1.3,
          )
          const classes = [
            'lumi-atom',
            atom.element === 'C' ? 'is-carbon' : 'is-oxygen',
            atom.id === selected && 'is-selected',
            sockets.includes(atom.id) && 'is-socket',
            hot === atom.id && 'is-hot',
            dragging === atom.id && 'is-dragging',
            linking === atom.id && 'is-linking',
            molecule.atoms.length > 1 && isEnd(molecule, atom.id) && 'is-end',
          ]
          return (
            <button
              key={atom.id}
              type="button"
              disabled={blocked}
              className={classes.filter(Boolean).join(' ')}
              style={{
                left: point.left,
                top: point.top,
                width: size,
                height: size,
              }}
              aria-pressed={atom.id === selected}
              aria-label={describeAtom(molecule, atom.id)}
              aria-describedby={ATOM_HELP_ID}
              onPointerDown={(event) => onAtomDown(atom.id, event)}
              onClick={() => onAtomClick(atom.id)}
              onKeyDown={(event) => onAtomKey(atom.id, event)}
            >
              <i aria-hidden="true">{atom.element === 'C' ? 'C' : 'OH'}</i>
            </button>
          )
        })}
      </div>
    </div>
  )
}
