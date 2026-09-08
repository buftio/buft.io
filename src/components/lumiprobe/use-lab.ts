'use client'

import { useState } from 'react'
import { challenges, isUnlocked } from './challenges'
import { nameMolecule } from './naming'
import {
  addAtom,
  attachmentError,
  canRemoveAtom,
  initialMolecule,
  molecularFormula,
  moveAtom,
  neighbors,
  reconnectAtom,
  removeAtom,
  structureKey,
  toSmiles,
  type Element,
  type Molecule,
} from './molecule'

export type Celebration = { serial: number; task: number } | null
export type Phase = 'intro' | 'building' | 'complete'

type State = {
  molecule: Molecule
  selected: number
  history: Molecule[]
  task: number
  phase: Phase
  completed: number[]
  message: string
  layoutRevision: number
  celebration: Celebration
  celebrated: boolean
}

export function useLab() {
  const [state, setState] = useState<State>({
    molecule: initialMolecule(),
    selected: 0,
    history: [],
    task: 0,
    phase: 'intro',
    completed: [],
    message: '',
    layoutRevision: 0,
    celebration: null,
    celebrated: false,
  })
  const commit = (
    change: (m: Molecule) => Molecule,
    message = '',
    selected?: number,
    refit = true,
  ) => {
    setState((current) => {
      if (current.phase !== 'building') return current
      const molecule = change(current.molecule)
      if (molecule === current.molecule)
        return {
          ...current,
          message: message || 'Try an atom with a free connection.',
        }
      const solved =
        current.task >= 0 &&
        structureKey(molecule) === challenges[current.task].key
      const newlySolved = solved && !current.celebrated
      return {
        ...current,
        molecule,
        phase: newlySolved ? 'complete' : current.phase,
        selected:
          selected !== undefined &&
          molecule.atoms.some((a) => a.id === selected)
            ? selected
            : molecule.atoms.some((a) => a.id === current.selected)
              ? current.selected
              : molecule.atoms[0].id,
        history: [...current.history, current.molecule].slice(-40),
        completed: solved
          ? [...new Set([...current.completed, current.task])]
          : current.completed,
        layoutRevision: current.layoutRevision + Number(refit),
        celebrated: current.celebrated || solved,
        celebration: newlySolved
          ? {
              serial: (current.celebration?.serial ?? 0) + 1,
              task: current.task,
            }
          : current.celebration,
        message,
      }
    })
  }
  const select = (id: number) =>
    setState((s) =>
      s.phase === 'building' ? { ...s, selected: id, message: '' } : s,
    )
  const add = (
    element: Element,
    parent = state.selected,
    point?: { x: number; y: number },
  ) => {
    const error = attachmentError(state.molecule, parent, element)
    if (error) {
      setState((s) => ({ ...s, message: error }))
      return
    }
    commit((m) => addAtom(m, parent, element, point))
  }
  const move = (id: number, x: number, y: number) =>
    commit((m) => moveAtom(m, id, x, y), '', id, false)
  const reconnect = (id: number, parent: number) => {
    if (neighbors(state.molecule, id).length !== 1) {
      setState((s) => ({
        ...s,
        message:
          'Move an end atom to change its connection. Inner atoms keep their bonds.',
      }))
      return
    }
    commit(
      (m) => {
        const linked = reconnectAtom(m, id, parent)
        if (linked === m) return m
        const atom = linked.atoms.find((a) => a.id === id)!
        const rest = removeAtom(linked, id)
        const placed = addAtom(rest, parent, atom.element)
        const position = placed.atoms[placed.atoms.length - 1]
        return moveAtom(linked, id, position.x, position.y)
      },
      '',
      id,
    )
  }
  const remove = (id = state.selected) => {
    const allowed = canRemoveAtom(state.molecule, id)
    if (!allowed) {
      setState((s) => ({
        ...s,
        message:
          neighbors(s.molecule, id).length > 1
            ? 'This atom holds the chain together. Remove an end atom first.'
            : 'Keep one carbon on the bench to build from.',
      }))
      return
    }
    commit((m) => removeAtom(m, id))
  }
  const undo = () =>
    setState((s) =>
      s.phase === 'building' && s.history.length
        ? {
            ...s,
            molecule: s.history[s.history.length - 1],
            selected: s.history[s.history.length - 1].atoms[0].id,
            history: s.history.slice(0, -1),
            layoutRevision: s.layoutRevision + 1,
            message: '',
          }
        : s,
    )
  const chooseTask = (task: number, begin = false) => {
    setState((s) => {
      if (task !== -1 && !isUnlocked(task, s.completed)) return s
      return {
        ...s,
        task,
        phase: task < 0 || begin ? 'building' : 'intro',
        molecule: task < 0 ? s.molecule : initialMolecule(),
        selected: task < 0 ? s.selected : 0,
        celebrated: false,
        history: [],
        layoutRevision: s.layoutRevision + 1,
        message: '',
      }
    })
  }
  const reset = () =>
    setState((s) =>
      s.phase !== 'building'
        ? s
        : {
            ...s,
            molecule: initialMolecule(),
            selected: 0,
            history: [...s.history, s.molecule].slice(-40),
            layoutRevision: s.layoutRevision + 1,
            celebrated: false,
            message: '',
          },
    )
  const challenge = state.task >= 0 ? challenges[state.task] : null
  const nextTask = challenges.findIndex(
    (_, index) => !state.completed.includes(index),
  )
  return {
    ...state,
    phase: state.phase ?? 'intro',
    nextTask,
    challenge,
    solved: Boolean(
      challenge && structureKey(state.molecule) === challenge.key,
    ),
    name: nameMolecule(state.molecule),
    smiles: toSmiles(state.molecule),
    formula: molecularFormula(state.molecule),
    select,
    add,
    move,
    reconnect,
    remove,
    undo,
    reset,
    chooseTask,
    start: () =>
      setState((s) =>
        (s.phase ?? 'intro') === 'intro' ? { ...s, phase: 'building' } : s,
      ),
    next: () => state.phase === 'complete' && chooseTask(nextTask, true),
    canRemove: canRemoveAtom(state.molecule, state.selected),
    canAdd: (element: Element) =>
      attachmentError(state.molecule, state.selected, element) === null,
  }
}

export type Lab = ReturnType<typeof useLab>
