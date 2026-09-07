'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { ArrowUpRight, RotateCcw, LampDesk, Pause, Play } from 'lucide-react'
import { SceneBoundary } from '../scene-boundary'
import { Dictionary, QuizPhone } from './exercises'
const Cafe = dynamic(() => import('./cafe'), { ssr: false })

export default function GliteStory({
  reduced,
  onReady,
}: {
  reduced: boolean
  onReady: () => void
}) {
  const [corrected, setCorrected] = useState(false)
  const [word, setWord] = useState('desert')
  const [evening, setEvening] = useState(true)
  const [paused, setPaused] = useState(false)
  const lookup = (value: string) => {
    setWord(value)
    document.getElementById('glite-dictionary')?.scrollIntoView({
      behavior: reduced ? 'instant' : 'smooth',
      block: 'center',
    })
  }
  return (
    <article className={`glite-story${corrected ? '' : ' is-desert'}`}>
      <header className="glite-intro">
        <div>
          <h2 id="project-heading">Glite</h2>
          <span>English practice, with an AI tutor.</span>
        </div>
        <p>
          I led full-stack development at Glite. I worked on voice agents,
          speech evaluation, and an exercise that turned a learner&apos;s
          description into a picture.
        </p>
      </header>

      <section
        className="glite-conversation"
        aria-label="An illustrated language exercise"
      >
        <div className="glite-prose conversation-copy">
          <p>
            The picture made misunderstandings visible. Say what you mean, see
            what the model understood, then try again.
          </p>
          <div className="glite-transcript">
            <p>
              <span>Tutor</span>What would you like after dinner?
            </p>
            <p className="learner-line">
              <span>You</span>
              {corrected ? (
                <>
                  I would like a{' '}
                  <button onClick={() => lookup('dessert')}>dessert</button>.
                </>
              ) : (
                <>
                  I would like a{' '}
                  <button onClick={() => lookup('desert')}>desert</button>.
                </>
              )}
            </p>
            <p className="tutor-reply" aria-live="polite">
              <span>Tutor</span>
              {corrected
                ? 'Much better. I was getting sand in my circuits.'
                : 'Good news: no rain. Bad news: no cake.'}
            </p>
          </div>
          <button
            className="glite-correction"
            onClick={() => {
              setCorrected((value) => !value)
              setWord(corrected ? 'desert' : 'dessert')
            }}
          >
            {corrected ? (
              <>
                <RotateCcw size={15} /> Try the first sentence
              </>
            ) : (
              <>
                I meant dessert <ArrowUpRight size={16} />
              </>
            )}
          </button>
        </div>
        <figure
          className="glite-cafe"
          aria-label={
            corrected
              ? 'The sand disappears, the café returns, and the plate holds a strawberry cake. The tutor takes off its sun hat and sunglasses.'
              : 'The entire café is buried in desert dunes. Giant cacti surround the table, a tumbleweed rolls past, and even the sun wears sunglasses. The tutor has put on a safari hat. The lamp is half buried in sand.'
          }
        >
          <SceneBoundary
            compact
            onFailure={onReady}
            onRetry={() =>
              import('./cafe').then(({ clearCafe }) => clearCafe())
            }
          >
            <Cafe
              corrected={corrected}
              evening={evening}
              paused={paused || reduced}
              onReady={onReady}
              onLamp={() => setEvening((value) => !value)}
            />
          </SceneBoundary>
          <span className="plate-note" aria-live="polite">
            {corrected
              ? 'dessert. civilisation restored.'
              : 'desert. the whole thing, apparently.'}
          </span>
        </figure>
        <div className="glite-scene-controls">
          <span>A small recreation of the exercise.</span>
          <button
            onClick={() => setEvening((value) => !value)}
            aria-label={evening ? 'Turn café lamp off' : 'Turn café lamp on'}
            aria-pressed={evening}
          >
            <LampDesk size={17} />
          </button>
          <button
            onClick={() => setPaused((value) => !value)}
            aria-label={paused ? 'Play café animation' : 'Pause café animation'}
            disabled={reduced}
          >
            {paused || reduced ? <Play size={15} /> : <Pause size={15} />}
          </button>
        </div>
      </section>

      <section className="glite-words" aria-label="Dictionary">
        <div className="glite-prose">
          <p>
            The dictionary was a big part of Glite. A word from a conversation
            could become something to look up, save, and practise.
          </p>
          <p>
            Here, one extra <em>s</em> gets us out of the desert and back to
            cake.
          </p>
        </div>
        <Dictionary word={word} onWord={setWord} />
      </section>

      <section className="glite-practice" aria-label="Idiom practice">
        <QuizPhone onLookup={lookup} />
        <div className="glite-prose practice-copy">
          <p>
            There was also a feed of short questions. A little practice between
            conversations, with words you could take back into the next one.
          </p>
          <p>
            Answer a question, then look up the expression in the dictionary.
          </p>
          <span className="table-scribble" aria-hidden="true">
            a piece of cake ↙
          </span>
        </div>
      </section>

      <footer className="glite-outro">
        <p>
          I built the Image Test from the first interaction through spoken
          feedback, and led the team working on the learning experience.
        </p>
        <a href="https://glite.ai" target="_blank" rel="noreferrer">
          Visit Glite <ArrowUpRight size={16} />
        </a>
      </footer>
    </article>
  )
}
