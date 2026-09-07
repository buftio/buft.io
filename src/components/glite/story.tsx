'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { ArrowUpRight, RotateCcw, LampDesk } from 'lucide-react'
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
          I led full-stack development at Glite and built the Image Test:
          describe a picture, see what the AI understood, and talk it through. I
          built the production voice agent pipeline and speech evaluation behind
          it.
        </p>
      </header>

      <section
        className="glite-conversation"
        aria-label="An illustrated language exercise"
      >
        <div className="glite-prose conversation-copy">
          <div className="glite-transcript">
            <p className="tutor-line">
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
            <p className="tutor-line tutor-reply" aria-live="polite">
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
              paused={reduced}
              onReady={onReady}
              onLamp={() => setEvening((value) => !value)}
            />
          </SceneBoundary>
        </figure>
        <div className="glite-scene-controls">
          <button
            onClick={() => setEvening((value) => !value)}
            aria-label={evening ? 'Turn café lamp off' : 'Turn café lamp on'}
            aria-pressed={evening}
          >
            <LampDesk size={17} />
          </button>
        </div>
      </section>

      <section className="glite-words" aria-label="Dictionary">
        <div className="glite-prose">
          <p>
            The dictionary connected the learning experience. Look up a word,
            save it, practise it in the question feed, then use it in a
            conversation.
          </p>
        </div>
        <Dictionary word={word} onWord={setWord} />
      </section>

      <section className="glite-practice" aria-label="Idiom practice">
        <QuizPhone onLookup={lookup} />
        <div className="glite-prose practice-copy">
          <p>I scaled the acquisition tests that brought people into Glite.</p>
          <p className="glite-test-scale">
            <strong>Hundreds of thousands</strong>
            <span>of test users per month</span>
          </p>
          <p>
            I used PostHog experiments and funnel analysis to improve the
            journey from taking a test to using the app.
          </p>
        </div>
      </section>

      <footer className="glite-outro">
        <p>
          I also built and operated the voice AI infrastructure, handling mixed
          CPU- and I/O-bound workloads, and led a team of three developers.
        </p>
        <a href="https://glite.ai" target="_blank" rel="noreferrer">
          Visit Glite <ArrowUpRight size={16} />
        </a>
      </footer>
    </article>
  )
}
