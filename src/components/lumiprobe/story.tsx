'use client'

import dynamic from 'next/dynamic'
import {
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
} from 'react'
import { ArrowUpRight, Check } from 'lucide-react'
import { SceneBoundary } from '../scene-boundary'
import { Clipboard, Dish, Laptop, TrashButton } from './controls'
import { MAX_CARBONS, type Element } from './molecule'
import { ATOM_HELP_ID, Overlay } from './overlay'
import {
  atomWorld,
  fitMolecule,
  project,
  unproject,
  viewFor,
  withPreview,
} from './projection'
import { isEnd, socketsFor, useDrag, type Source } from './use-drag'
import { useLab } from './use-lab'
import { useBoardMotion } from './board-motion'
import { ChemistryTerm } from './chemistry-term'

const Bench = dynamic(() => import('./bench'), { ssr: false })
const STEP = 0.35

function useSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const measure = () =>
      setSize((current) =>
        current.width === element.offsetWidth &&
        current.height === element.offsetHeight
          ? current
          : { width: element.offsetWidth, height: element.offsetHeight },
      )
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])
  return size
}

export default function LumiprobeStory({
  reduced,
  onReady,
}: {
  reduced: boolean
  onReady: () => void
}) {
  const lab = useLab()
  const stage = useRef<HTMLDivElement>(null)
  const size = useSize(stage)
  const view = useMemo(
    () => viewFor(size.width, size.height),
    [size.width, size.height],
  )
  const board = useBoardMotion(view, lab.phase ?? 'intro', reduced)
  /* Refit only when the lab says the layout changed (add, remove, reconnect,
   * undo, new task) or the stage resizes. Plain moves keep the current fit so
   * the molecule does not slide under the pointer. */
  const [fitted, setFitted] = useState(() => ({
    revision: lab.layoutRevision,
    view,
    fit: fitMolecule(lab.molecule, view),
  }))
  if (fitted.revision !== lab.layoutRevision || fitted.view !== view)
    setFitted({
      revision: lab.layoutRevision,
      view,
      fit: fitMolecule(lab.molecule, view),
    })
  const fit = fitted.fit
  const [link, setLink] = useState<{ id: number; revision: number } | null>(
    null,
  )
  const linking = link?.revision === lab.layoutRevision ? link.id : null
  const setLinking = (id: number | null) =>
    setLink(id === null ? null : { id, revision: lab.layoutRevision })
  const [hintTask, setHintTask] = useState<number | null>(null)
  const [flat, setFlat] = useState(false)
  const handleSceneReady = useCallback(() => {
    setFlat(false)
    onReady()
  }, [onReady])
  const [usedPile, setUsedPile] = useState(false)
  /* A local note that expires as soon as the lab changes anything. */
  const stamp = `${lab.history.length}:${lab.message}:${lab.task}:${lab.selected}`
  const [note, setNote] = useState<{ text: string; stamp: string } | null>(null)
  const say = (text: string) => setNote({ text, stamp })
  const { drag, start, wasDrag } = useDrag(
    lab,
    stage,
    view,
    fit,
    () => say('Drop it on a carbon bead.'),
    () => setUsedPile(true),
  )

  const preview =
    drag?.kind === 'atom'
      ? { id: drag.id, x: drag.point.x, y: drag.point.y }
      : null
  const shown = withPreview(lab.molecule, preview)
  const source: Source | null =
    drag ?? (linking !== null ? { kind: 'atom', id: linking } : null)
  const sockets = socketsFor(lab.molecule, source)
  const overTrash = drag?.kind === 'atom' && drag.overTrash
  const supply = {
    C: MAX_CARBONS - lab.molecule.atoms.filter((a) => a.element === 'C').length,
    O: 1 - lab.molecule.atoms.filter((a) => a.element === 'O').length,
  }
  const message =
    linking !== null
      ? 'Now pick the carbon it should connect to.'
      : note && note.stamp === stamp
        ? note.text
        : lab.message

  const onAtomDown = (id: number, event: PointerEvent<HTMLButtonElement>) => {
    if (linking !== null) return
    start({ kind: 'atom', id }, event)
  }
  const onAtomClick = (id: number) => {
    if (wasDrag()) return
    if (linking !== null) {
      if (sockets.includes(id)) lab.reconnect(linking, id)
      else if (id !== linking) say('Pick a carbon with a free connection.')
      setLinking(null)
      return
    }
    lab.select(id)
  }
  const onAtomKey = (id: number, event: KeyboardEvent<HTMLButtonElement>) => {
    const atom = lab.molecule.atoms.find((a) => a.id === id)
    if (!atom) return
    const nudge = (dx: number, dy: number) => {
      event.preventDefault()
      const at = project(
        atomWorld({ x: atom.x + dx * STEP, y: atom.y + dy * STEP }, fit),
        view,
      )
      const point = unproject(at.left, at.top, view, fit)
      lab.move(id, point.x, point.y)
    }
    if (event.key === 'ArrowLeft') nudge(-1, 0)
    else if (event.key === 'ArrowRight') nudge(1, 0)
    else if (event.key === 'ArrowUp') nudge(0, -1)
    else if (event.key === 'ArrowDown') nudge(0, 1)
    else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault()
      setLinking(null)
      lab.remove(id)
    } else if (event.key === 'r' || event.key === 'R') {
      event.preventDefault()
      if (linking === id) setLinking(null)
      else if (lab.molecule.atoms.length > 1 && isEnd(lab.molecule, id)) {
        lab.select(id)
        setLinking(id)
      } else
        say('Only end atoms can be reattached. Inner atoms hold the chain.')
    } else if (event.key === 'Escape' && linking !== null) {
      event.preventDefault()
      setLinking(null)
    }
  }
  const onDishDown = (
    element: Element,
    event: PointerEvent<HTMLButtonElement>,
  ) => {
    if (linking !== null) return
    start({ kind: 'palette', element }, event)
  }
  const onDishClick = (element: Element) => {
    if (wasDrag()) return
    setUsedPile(true)
    setLinking(null)
    lab.add(element)
  }
  const choose = (index: number) => {
    setLinking(null)
    setHintTask(null)
    lab.chooseTask(index)
  }
  const blocked = lab.phase !== 'building' || board.moving

  useEffect(() => {
    if (board.moving || !view.width) return
    const selector =
      lab.phase === 'building'
        ? '.lumi-atom[aria-pressed="true"]'
        : '.lumi-board-primary'
    stage.current
      ?.querySelector<HTMLElement>(selector)
      ?.focus({ preventScroll: true })
  }, [lab.phase, board.moving, view.width])

  const stageClass = [
    'lumi-stage',
    flat && 'is-flat',
    view.narrow && 'is-stacked',
    drag && 'is-dragging',
    overTrash && 'is-over-trash',
    linking !== null && 'is-linking',
    lab.solved && 'is-solved',
    !usedPile && !reduced && 'is-inviting',
    board.prominence > 0.15 && 'has-board-focus',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article className={`lumi-story${reduced ? ' is-reduced' : ''}`}>
      <header className="lumi-intro">
        <div>
          <h2 id="project-heading">Lumiprobe</h2>
        </div>
        <p>
          I built a tool to turn molecular shorthand into chemical names for a
          Lumiprobe open-source contest. It reads{' '}
          <ChemistryTerm term="SMILES" />, works out how the atoms connect, and
          writes an <ChemistryTerm term="IUPAC" /> name.
        </p>
      </header>

      <section className="lumi-bench" aria-label="Chemistry bench">
        <div className={stageClass} ref={stage}>
          <figure
            className="lumi-scene"
            aria-label="A pale clay chemistry bench with five puzzle bottles on the back shelf, a task board on the left, and a laptop on the right. Charcoal carbon beads and a terracotta OH bead connect in the middle. Two dishes of spare beads and a tin bin sit along the front."
          >
            <SceneBoundary
              key="lumi-moving-board"
              compact
              onFailure={() => {
                setFlat(true)
                onReady()
              }}
            >
              {view.width > 0 && (
                <Bench
                  molecule={shown}
                  selected={lab.selected}
                  fit={fit}
                  task={lab.task}
                  completed={lab.completed}
                  solved={lab.solved}
                  celebration={lab.celebration}
                  overTrash={Boolean(overTrash)}
                  supply={supply}
                  invitePiles={!usedPile}
                  board={board}
                  reduced={reduced}
                  onReady={handleSceneReady}
                />
              )}
            </SceneBoundary>
          </figure>
          <Overlay
            view={view}
            fit={fit}
            molecule={shown}
            selected={lab.selected}
            dragging={drag?.kind === 'atom' ? drag.id : null}
            linking={linking}
            sockets={sockets}
            hot={drag?.target ?? null}
            task={lab.task}
            completed={lab.completed}
            blocked={blocked}
            onChoose={choose}
            onAtomDown={onAtomDown}
            onAtomClick={onAtomClick}
            onAtomKey={onAtomKey}
          />
          {view.width > 0 && (
            <>
              <div className="lumi-props lumi-board-layer">
                <Clipboard
                  view={view}
                  lab={lab}
                  hint={hintTask === lab.task}
                  board={board}
                  moving={board.moving}
                  onHint={() =>
                    setHintTask(hintTask === lab.task ? null : lab.task)
                  }
                />
              </div>
              <div className="lumi-props lumi-tools" inert={blocked}>
                <div className="lumi-dishes" aria-label="Spare beads">
                  <Dish
                    element="C"
                    view={view}
                    count={supply.C}
                    dim={!lab.canAdd('C')}
                    onDown={(event) => onDishDown('C', event)}
                    onClick={() => onDishClick('C')}
                  />
                  <Dish
                    element="O"
                    view={view}
                    count={supply.O}
                    dim={!lab.canAdd('O')}
                    onDown={(event) => onDishDown('O', event)}
                    onClick={() => onDishClick('O')}
                  />
                </div>
                <Laptop view={view} lab={lab} message={message} />
                <TrashButton
                  view={view}
                  hot={Boolean(overTrash)}
                  onClick={() => {
                    setLinking(null)
                    lab.remove()
                  }}
                />
              </div>
            </>
          )}
          <p id={ATOM_HELP_ID} className="sr-only">
            Press to select. Drag any atom to move it. Drop an end atom on a
            carbon to reattach it there, or on the bin to discard it. Arrow keys
            move the selected atom. Press R on an end atom, then choose a carbon
            to reattach it; Escape cancels. Delete discards an end atom.
          </p>
          {lab.phase === 'complete' &&
            board.prominence < 0.15 &&
            lab.challenge && (
              <output
                className="lumi-success"
                aria-hidden="true"
                style={{
                  ...project(
                    [view.layout.moleculeX, 1.9, view.layout.moleculeZ],
                    view,
                  ),
                  maxWidth: Math.min(260, view.layout.safeWidth * view.unit),
                }}
              >
                <Check size={22} aria-hidden="true" />
                <span>
                  <strong>Made it!</strong>
                  <span>{lab.challenge.target}</span>
                </span>
              </output>
            )}
          {drag?.kind === 'palette' && (
            <span
              className={`lumi-ghost ${drag.element === 'C' ? 'is-carbon' : 'is-oxygen'}`}
              style={{ left: drag.local.x, top: drag.local.y }}
              aria-hidden="true"
            >
              {drag.element === 'C' ? 'C' : 'OH'}
            </span>
          )}
        </div>
      </section>

      <footer className="lumi-notes">
        <p>
          This kit names chains, branches, and alcohols. Hydrogen fills the
          unused bonds automatically. The model illustrates the connections; it
          does not calculate molecular geometry.
        </p>
        <a
          href="https://github.com/buftio/buftinom"
          target="_blank"
          rel="noreferrer"
        >
          View the code <ArrowUpRight size={16} />
        </a>
      </footer>
    </article>
  )
}
