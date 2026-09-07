'use client'

import dynamic from 'next/dynamic'
import { useMemo, useRef, useState } from 'react'
import { ArrowDown, Pause, Play, SkipForward } from 'lucide-react'
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
  const [visibleCarpets, setVisibleCarpets] = useState(12)
  const carpetPosition = useRef<HTMLSpanElement>(null)
  const workshop = useWorkshop(reduced)
  const stop = stops[stopAt(workshop.progress)] ?? stops[0]
  const shown = workshop.active?.design ?? design
  const count = workshop.carpets.length
  const collection = useMemo(
    () => workshop.carpets.slice(0, visibleCarpets),
    [workshop.carpets, visibleCarpets],
  )
  return (
    <article className="market-story">
      <header className="market-intro">
        <h2 id="project-heading">MarketData</h2>
        <p>
          I built the backend and frontend from scratch for a carpet factory,
          turning its everyday paperwork into software.
        </p>
      </header>
      <div className="workshop-status">
        <div className="workshop-status-text" aria-live="polite">
          <i className={workshop.active ? 'is-working' : ''} />
          <span>
            {workshop.active ? (
              <>
                <strong>{workshop.active.name}</strong> · {stop.name}
              </>
            ) : (
              'A little carpet factory. Yours to try.'
            )}
          </span>
        </div>
        <div className="workshop-actions">
          {workshop.active && (
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
          )}
          {reduced ? (
            <button onClick={workshop.advance}>
              <SkipForward size={16} /> Next stop
            </button>
          ) : (
            <button
              onClick={() => workshop.setPaused(!workshop.paused)}
              aria-label={
                workshop.paused ? 'Resume the workshop' : 'Pause the workshop'
              }
            >
              {workshop.paused ? <Play size={16} /> : <Pause size={16} />}
            </button>
          )}
        </div>
      </div>
      {workshop.queue.length > 1 && (
        <p className="workshop-queue">
          {workshop.queue.length - 1} more{' '}
          {workshop.queue.length === 2 ? 'carpet' : 'carpets'} waiting for the
          loom.
        </p>
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
                clock={workshop.clock}
                marker={carpetPosition}
                reduced={reduced}
                paused={reduced || workshop.paused}
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
          <div id="market-owner" className="market-stop market-stop-owner">
            <span>06</span> Home, eventually
          </div>
        </div>
      </div>
      <section
        className="market-collection"
        aria-label="Your carpet collection"
      >
        <div className="collection-heading">
          <h3>
            {count
              ? `${count} ${count === 1 ? 'carpet' : 'carpets'}, ${count === 1 ? 'one happy owner' : 'all with a home'}`
              : 'Room for your carpets'}
          </h3>
          <p>
            {count
              ? 'Your designs stay in this browser. Come back and make another.'
              : 'Make one above. Its owner will settle in here.'}
          </p>
        </div>
        <p className="sr-only" aria-live="polite">
          {workshop.lastFinished
            ? `${workshop.lastFinished} has a happy owner and has joined your collection.`
            : ''}
        </p>
        {storageErrorMessage(workshop.storageError)}
        {count > 0 && (
          <>
            <div
              className="carpet-collection-world"
              style={
                {
                  '--rug-rows': Math.ceil(collection.length / 3),
                  '--mobile-rug-rows': Math.ceil(collection.length / 2),
                } as React.CSSProperties
              }
            >
              <SceneBoundary compact>
                <Collection
                  carpets={collection}
                  onFly={workshop.fly}
                  paused={reduced || workshop.paused}
                />
              </SceneBoundary>
            </div>
            {count > visibleCarpets && (
              <button
                className="show-carpets"
                onClick={() => setVisibleCarpets((value) => value + 12)}
              >
                Show more carpets <ArrowDown size={15} />
              </button>
            )}
          </>
        )}
      </section>
    </article>
  )
}

function storageErrorMessage(failed: boolean) {
  return failed ? (
    <output className="workshop-storage-note">
      Browser storage is unavailable. New carpets will stay for this visit.
    </output>
  ) : null
}
