'use client'

import { Terminal } from 'lucide-react'
import {
  candidates,
  guessOf,
  isPending,
  isSolved,
  slots,
  type Dock,
  type Try,
} from './dock'

const names = (guess: number[]) =>
  guess.map((index) => candidates[index].name).join(' ')

function Pegs({ done }: { done: Try }) {
  const misses = slots.length - done.right - done.near
  const words = [
    done.right && `${done.right} in the right pocket`,
    done.near && `${done.near} in the wrong pocket`,
  ].filter(Boolean)
  return (
    <span
      className="q-pegs"
      aria-label={words.length ? words.join(', ') : 'nothing binds'}
    >
      {Array.from({ length: done.right }, (_, i) => (
        <i key={`r${i}`} className="is-right" />
      ))}
      {Array.from({ length: done.near }, (_, i) => (
        <i key={`n${i}`} className="is-near" />
      ))}
      {Array.from({ length: misses }, (_, i) => (
        <i key={`m${i}`} />
      ))}
      <span aria-hidden="true">
        {done.right === slots.length
          ? 'all three bind'
          : words.length
            ? words.join(' · ')
            : 'nothing binds'}
      </span>
    </span>
  )
}

/** The docking agent's terminal: every scored try with its pegs, plus a button that docks one right fragment. */
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
  return (
    <div className="q-agent" aria-live="polite">
      {(dock.tries.length > 0 || pending || note) && (
        <ol>
          {dock.tries.slice(pending ? -2 : -3).map((done, i, shown) => (
            <li key={dock.tries.length - shown.length + i}>
              <code>&gt; dock {names(done.guess)}</code>
              <Pegs done={done} />
            </li>
          ))}
          {pending && (
            <li className="is-running">
              <code>&gt; dock {names(guessOf(dock))}</code>
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
