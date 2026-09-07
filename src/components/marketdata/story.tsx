'use client'

import dynamic from 'next/dynamic'
import { useRef, useState } from 'react'
import { ArrowDown, SkipForward } from 'lucide-react'
import { SceneBoundary } from '../scene-boundary'
import { Designer } from './designer'
import { initialDesign } from './design'
import { stops, stopAt, useWorkshop } from './workshop'

const Journey = dynamic(() => import('./journey'), { ssr: false })
const Collection = dynamic(() => import('./collection'), { ssr: false })

export default function MarketDataStory({
  reduced,
  onReady,
}: {
  reduced: boolean
  onReady: () => void
}) {
  const [design, setDesign] = useState(initialDesign)
  const carpetPosition = useRef<HTMLSpanElement>(null)
  const workshop = useWorkshop(reduced)
  const stop = stops[stopAt(workshop.progress)] ?? stops[0]
  const shown = workshop.active?.design ?? design
  return (
    <article className="market-story">
      <header className="market-intro">
        <h2 id="project-heading">MarketData</h2>
        <p>
          I built the backend and frontend from scratch for a carpet factory,
          turning its everyday paperwork into software.
        </p>
      </header>
      {workshop.active && (
        <div className="workshop-status">
          <div className="workshop-status-text" aria-live="polite">
            <i className="is-working" />
            <span>
              <strong>{workshop.active.name}</strong> · {stop.name}
            </span>
          </div>
          <div className="workshop-actions">
            <button
              onClick={() =>
                carpetPosition.current?.scrollIntoView({
                  block: 'center',
                  behavior: reduced ? 'instant' : 'smooth',
                })
              }
              aria-label="Find my carpet"
            >
              <ArrowDown size={16} />
              <span>Find it</span>
            </button>
            {reduced && (
              <button onClick={workshop.advance}>
                <SkipForward size={16} /> Next stop
              </button>
            )}
          </div>
        </div>
      )}
      <div className="market-workshop">
        <div className="market-designer-position">
          <Designer
            design={design}
            onDesign={setDesign}
            onMake={(name) => workshop.make(design, name)}
            ready={workshop.ready}
            queued={workshop.queue.length}
          />
        </div>
        <div className="market-journey">
          <figure
            className="market-canvas"
            aria-label="A clay carpet factory, delivery truck, warehouse, flying carpet, shop, and a happy customer"
          >
            <SceneBoundary compact onFailure={onReady}>
              <Journey
                design={shown}
                queue={workshop.queue}
                clock={workshop.clock}
                marker={carpetPosition}
                reduced={reduced}
                paused={reduced}
                onReady={onReady}
              />
            </SceneBoundary>
          </figure>
          <span
            ref={carpetPosition}
            className="market-carpet-position"
            aria-hidden="true"
          />
          <div id="market-mill" className="market-stop market-stop-mill">
            <span>01</span> The mill
          </div>
          <div id="market-freight" className="market-stop market-stop-freight">
            <span>02</span> On the road
          </div>
          <div className="market-copy market-copy-invoices">
            <p>
              Factory invoices used to be checked by hand. I automated those
              checks so each delivery no longer needed someone to go through the
              paperwork.
            </p>
          </div>
          <div id="market-storage" className="market-stop market-stop-storage">
            <span>03</span> Into storage
          </div>
          <div id="market-flight" className="market-stop market-stop-flight">
            <span>04</span> A flying delivery
          </div>
          <div className="market-copy market-copy-costs">
            <p>
              Cost planning lived in Excel. I built tools that did the same
              calculations automatically, without the repeated copying,
              checking, and recalculating.
            </p>
          </div>
          <div id="market-shop" className="market-stop market-stop-shop">
            <span>05</span> In the shop
          </div>
          <div className="market-copy market-copy-owner">
            <p>
              The work connected the factory&apos;s daily operations, from an
              invoice arriving to understanding what a carpet cost.
            </p>
          </div>
        </div>
      </div>
      <section className="market-party" aria-label="Carpet party">
        <p className="sr-only" aria-live="polite">
          {workshop.lastFinished
            ? `${workshop.lastFinished} joined the party.`
            : ''}
        </p>
        {storageErrorMessage(workshop.storageError)}
        {workshop.ready && (
          <SceneBoundary compact>
            <Collection
              carpets={workshop.carpets}
              onFly={workshop.fly}
              paused={reduced}
            />
          </SceneBoundary>
        )}
      </section>
    </article>
  )
}

function storageErrorMessage(failed: boolean) {
  return failed ? (
    <output className="workshop-storage-note">
      Your last changes could not be saved.
    </output>
  ) : null
}
