'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react'
import {
  attachmentError,
  neighbors,
  type Element,
  type Molecule,
} from './molecule'
import {
  atomWorld,
  project,
  radiusOf,
  unproject,
  type Fit,
  type Point,
  type View,
} from './projection'
import type { Lab } from './use-lab'

export type Source =
  | { kind: 'atom'; id: number }
  | { kind: 'palette'; element: Element }

export type Drag = Source & {
  client: Point
  local: Point
  point: Point
  target: number | null
  overTrash: boolean
}

type Session = {
  source: Source
  pointerId: number
  start: Point
  rect: DOMRect
  moved: boolean
  sockets: number[]
  view: View
  fit: Fit
  lab: Lab
  target: number | null
  overTrash: boolean
  point: Point | null
  release: () => void
}

const DRAG_THRESHOLD = 6

export function isEnd(molecule: Molecule, id: number) {
  return neighbors(molecule, id).length <= 1
}

/* Atoms that would accept the dragged (or keyboard-linked) source. Pure reads of molecule.ts helpers; all mutations still go through useLab. */
export function socketsFor(molecule: Molecule, source: Source | null) {
  if (!source) return []
  if (source.kind === 'palette')
    return molecule.atoms
      .filter((a) => attachmentError(molecule, a.id, source.element) === null)
      .map((a) => a.id)
  const linked = neighbors(molecule, source.id)
  if (linked.length !== 1) return []
  return molecule.atoms
    .filter(
      (a) =>
        a.element === 'C' &&
        a.id !== source.id &&
        !linked.includes(a.id) &&
        neighbors(molecule, a.id).length < 4,
    )
    .map((a) => a.id)
}

function nearestSocket(session: Session, local: Point) {
  let best: { id: number; distance: number } | null = null
  for (const id of session.sockets) {
    const atom = session.lab.molecule.atoms.find((a) => a.id === id)
    if (!atom) continue
    const at = project(atomWorld(atom, session.fit), session.view)
    const distance = Math.hypot(at.left - local.x, at.top - local.y)
    const reach = Math.max(
      30,
      radiusOf(atom.element) * session.fit.scale * session.view.unit * 1.5,
    )
    if (distance <= reach && (!best || distance < best.distance))
      best = { id, distance }
  }
  return best?.id ?? null
}

export function useDrag(
  lab: Lab,
  stage: RefObject<HTMLDivElement | null>,
  view: View,
  fit: Fit,
  onMiss: (source: Source) => void,
  onPileDrag: () => void,
) {
  const [drag, setDrag] = useState<Drag | null>(null)
  const session = useRef<Session | null>(null)
  const suppress = useRef(false)
  const cancel = useCallback(() => {
    const current = session.current
    if (!current) return
    session.current = null
    current.release()
    setDrag(null)
  }, [])
  useEffect(
    () => cancel,
    [cancel, lab.molecule, lab.task, lab.phase, view, fit],
  )

  const start = (source: Source, event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    const element = stage.current
    if (!element || session.current || lab.phase !== 'building') return
    const handle = event.currentTarget
    handle.setPointerCapture(event.pointerId)

    const move = (e: PointerEvent) => {
      const current = session.current
      if (!current || e.pointerId !== current.pointerId) return
      if (!current.moved) {
        const travelled = Math.hypot(
          e.clientX - current.start.x,
          e.clientY - current.start.y,
        )
        if (travelled < DRAG_THRESHOLD) return
        current.moved = true
        if (current.source.kind === 'palette') onPileDrag()
      }
      const local = {
        x: e.clientX - current.rect.left,
        y: e.clientY - current.rect.top,
      }
      current.point = unproject(local.x, local.y, current.view, current.fit)
      const trash = element
        .querySelector('[data-lumi-trash]')
        ?.getBoundingClientRect()
      current.overTrash = Boolean(
        trash &&
        e.clientX >= trash.left &&
        e.clientX <= trash.right &&
        e.clientY >= trash.top &&
        e.clientY <= trash.bottom,
      )
      current.target = current.overTrash ? null : nearestSocket(current, local)
      setDrag({
        ...current.source,
        client: { x: e.clientX, y: e.clientY },
        local,
        point: unproject(local.x, local.y, current.view, current.fit, false),
        target: current.target,
        overTrash: current.overTrash,
      })
    }

    const end = (event: PointerEvent) => {
      const current = session.current
      if (!current || event.pointerId !== current.pointerId) return
      session.current = null
      current?.release()
      setDrag(null)
      if (!current?.moved) return
      suppress.current = true
      window.setTimeout(() => {
        suppress.current = false
      }, 0)
      if (event.type === 'pointercancel') return
      const { source, target, point, overTrash, lab: startLab } = current
      if (overTrash) {
        if (source.kind === 'atom') startLab.remove(source.id)
        return
      }
      if (source.kind === 'palette') {
        if (target !== null) startLab.add(source.element, target)
        else onMiss(source)
        return
      }
      if (target !== null) startLab.reconnect(source.id, target)
      else if (point) startLab.move(source.id, point.x, point.y)
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
    window.addEventListener('blur', cancel)
    window.addEventListener('scroll', cancel, true)
    handle.addEventListener('lostpointercapture', cancel)
    session.current = {
      source,
      pointerId: event.pointerId,
      start: { x: event.clientX, y: event.clientY },
      rect: element.getBoundingClientRect(),
      moved: false,
      sockets: socketsFor(lab.molecule, source),
      view,
      fit,
      lab,
      target: null,
      overTrash: false,
      point: null,
      release: () => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', end)
        window.removeEventListener('pointercancel', end)
        window.removeEventListener('blur', cancel)
        window.removeEventListener('scroll', cancel, true)
        handle.removeEventListener('lostpointercapture', cancel)
        if (handle.hasPointerCapture(event.pointerId))
          handle.releasePointerCapture(event.pointerId)
      },
    }
  }

  /* True for the synthetic click that follows a completed drag. */
  const wasDrag = () => suppress.current

  return { drag, start, wasDrag }
}
