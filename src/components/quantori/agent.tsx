'use client'

import { Terminal } from 'lucide-react'
import { Fragment } from 'react'
import {
  candidates,
  guessOf,
  isPending,
  isSolved,
  slots,
  type Dock,
  type Mark,
  type Try,
} from './dock'

const verdict: Record<Mark, string> = {
  right: 'binds here',
  near: 'binds in another pocket',
  miss: "doesn't bind",
}

function Guess({ done, words }: { done: Try; words: boolean }) {
  return (
    <>
      <code>
        &gt; dock{' '}
        {done.guess.map((index, slot) => (
          <Fragment key={slot}>
            <b className={`is-${done.marks[slot]}`}>
              {candidates[index].name}
            </b>{' '}
          </Fragment>
        ))}
      </code>
      {words &&
        (done.marks.every((mark) => mark === 'right') ? (
          <span>all three bind</span>
        ) : (
          done.guess.map((index, slot) => (
            <span key={slot} className={`is-${done.marks[slot]}`}>
              {slots[slot].name}: {candidates[index].name}{' '}
              {verdict[done.marks[slot]]}
            </span>
          ))
        ))}
    </>
  )
}

/** The docking agent's terminal: every scored try, colored per pocket, plus a button that docks one right fragment. */
export function Agent({
  dock,
  note,
  onAsk,
}: {
  dock: Dock
  note: string | null
  onAsk: () => void
}) {
  const pending = isPending(dock)
  const shown = dock.tries.slice(pending ? -2 : -3)
  return (
    <div className="q-agent" aria-live="polite">
      {(dock.tries.length > 0 || pending || note) && (
        <ol>
          {shown.map((done, i) => (
            <li key={dock.tries.length - shown.length + i}>
              <Guess
                done={done}
                words={!pending && !note && i === shown.length - 1}
              />
            </li>
          ))}
          {pending && (
            <li className="is-running">
              <code>
                &gt; dock{' '}
                {guessOf(dock)
                  .map((index) => candidates[index].name)
                  .join(' ')}
              </code>
              running on 64 nodes…
            </li>
          )}
          {note && !pending && (
            <li>
              <code>&gt; ask agent</code>
              {note}
            </li>
          )}
        </ol>
      )}
      {!isSolved(dock) && (
        <button onClick={onAsk} disabled={pending}>
          <Terminal size={14} /> Ask the agent
        </button>
      )}
    </div>
  )
}
