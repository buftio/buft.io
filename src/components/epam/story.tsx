'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronUp, Maximize2, Minimize2, ScanSearch } from 'lucide-react'
import { SceneBoundary } from '../scene-boundary'
import {
  loadSlide,
  mb,
  scaleBar,
  type SlideMeta,
  type View,
} from './slide-data'
import { MINE, POST, SCAN } from './war/build'
import type { Status } from './war/war'
import { Victory } from './victory'

const COOLDOWN = 2
const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`

const world = () => import('./world')
const World = dynamic(world, { ssr: false })

export default function EpamStory({
  reduced,
  onReady,
}: {
  reduced: boolean
  onReady: () => void
}) {
  const [meta, setMeta] = useState<SlideMeta | null>(null)
  const [failed, setFailed] = useState(false)
  const [scan, setScan] = useState(0)
  const [round, setRound] = useState(0)
  const [status, setStatus] = useState<Status | null>(null)
  const [ready, setReady] = useState(0)
  const [more, setMore] = useState(false)
  const [full, setFull] = useState(false)
  const stage = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLSpanElement>(null)
  const label = useRef<HTMLSpanElement>(null)
  const loaded = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    world()
    loadSlide()
      .then(setMeta)
      .catch(() => {
        setFailed(true)
        onReady()
      })
  }, [onReady])

  useEffect(() => {
    const sync = () => setFull(document.fullscreenElement === stage.current)
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])

  const onFull = () => {
    if (!document.fullscreenEnabled) return setFull((f) => !f)
    if (document.fullscreenElement) document.exitFullscreen()
    else stage.current?.requestFullscreen()
  }

  const onView = useCallback(
    (view: View) => {
      if (!meta) return
      const { px, label: text } = scaleBar(meta.mpp, view.scale)
      const width = `${px}px`
      if (bar.current && bar.current.style.width !== width)
        bar.current.style.width = width
      if (label.current && label.current.textContent !== text)
        label.current.textContent = text
    },
    [meta],
  )

  const cooldown =
    status && status.time < ready ? Math.ceil(ready - status.time) : 0
  const broke = !!status && status.fat < SCAN

  const onStatus = useCallback((next: Status) => setStatus(next), [])

  const onScan = () => {
    setScan((n) => n + 1)
    setReady((status?.time ?? 0) + COOLDOWN)
  }

  const onReplay = () => {
    setRound((n) => n + 1)
    setStatus(null)
    setScan((n) => n + 1)
    setReady(COOLDOWN)
  }

  const onLoaded = useCallback(
    (tiles: number, bytes: number) => {
      if (!meta || !loaded.current) return
      loaded.current.textContent = `you loaded ${tiles.toLocaleString('en')} · ${mb(bytes)} (${Math.round((bytes / meta.bytes) * 100)}%)`
    },
    [meta],
  )

  return (
    <article className="e-story" data-playing={scan ? '' : undefined}>
      <header className="e-intro">
        <h2 id="project-heading">EPAM</h2>
        <p>
          A slide like this is billions of pixels. At EPAM I built the viewer
          that let lab scientists fly through them like a map, mark what they
          saw, and let AI point out what to look at next.
        </p>
      </header>
      {failed ? (
        <p className="e-fallback">
          The slide could not load. It is a real lymph node section from the
          CAMELYON16 dataset, with tumor regions outlined by pathologists.
        </p>
      ) : (
        <div className="e-stage" ref={stage} data-full={full ? '' : undefined}>
          <figure aria-label="A zoomable microscope slide of a lymph node">
            <SceneBoundary
              compact
              onFailure={() => {
                setFailed(true)
                onReady()
              }}
            >
              {meta && (
                <World
                  meta={meta}
                  scan={scan}
                  round={round}
                  reduced={reduced}
                  onView={onView}
                  onLoaded={onLoaded}
                  onReady={onReady}
                  onStatus={onStatus}
                />
              )}
            </SceneBoundary>
          </figure>
          <p className="e-hint">
            {scan
              ? 'Build lighthouses in your light. Tap a gold ring to mine fat.'
              : 'Scroll or pinch to zoom. Drag to move.'}
          </p>
          {status?.won != null && (
            <Victory
              key={round}
              status={status}
              time={clock(status.won)}
              onReplay={onReplay}
            />
          )}
          {meta && (
            <p className="e-stats" aria-live="off">
              <span>
                {meta.files.toLocaleString('en')} tiles · {mb(meta.bytes)} on
                the server
              </span>
              <span ref={loaded}>you loaded 0 · 0.0 MB (0%)</span>
            </p>
          )}
          <button
            type="button"
            className="e-full"
            onClick={onFull}
            aria-label={full ? 'Exit full screen' : 'Full screen'}
          >
            {full ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <div className="e-hud" data-more={more ? '' : undefined}>
            <div className="e-command">
              <button
                type="button"
                className="e-scan"
                onClick={onScan}
                disabled={!!scan && (cooldown > 0 || broke)}
              >
                <ScanSearch size={16} aria-hidden />
                {!scan
                  ? 'Scan for tumor'
                  : broke
                    ? `Scan needs ${SCAN} fat`
                    : `Scan · ${SCAN} fat`}
              </button>
              {status && (
                <p className="e-war" aria-live="polite">
                  <span className="e-long">
                    {status.contained} of {status.tumors} contained
                  </span>
                  <span className="e-short">
                    {status.contained}/{status.tumors}
                  </span>{' '}
                  · {clock(status.won ?? status.time)}
                </p>
              )}
              {status && (
                <p
                  className="e-count"
                  data-warriors={status.warriors}
                  data-crowd={status.crowd}
                  data-fallen={status.fallen}
                  data-shown-fallen={status.shownFallen}
                  data-shown-eaten={status.shownEaten}
                  data-lost={status.lost}
                >
                  <span>{status.corrupted.toFixed(2)} mm² corrupted</span>
                  <span>{status.warriors} warriors</span>
                  <span>{status.fallen} fallen</span>
                  <span>
                    {(status.villagers - status.lost).toLocaleString('en')}{' '}
                    villagers saved
                  </span>
                </p>
              )}
              {status && (
                <p className="e-meter" data-fat={Math.floor(status.fat)}>
                  <span className="e-fat">{Math.floor(status.fat)} fat</span>
                  <span>
                    {status.income >= 0 ? '+' : ''}
                    {status.income.toFixed(1)}/s
                  </span>
                  <span>
                    lighthouse {POST} · mine {MINE}
                  </span>
                </p>
              )}
              {status && (
                <button
                  type="button"
                  className="e-more"
                  onClick={() => setMore((m) => !m)}
                  aria-expanded={more}
                  aria-label={more ? 'Fewer stats' : 'More stats'}
                >
                  <ChevronUp size={16} />
                </button>
              )}
            </div>
            <div className="e-scale" aria-hidden>
              <span className="e-bar" ref={bar} />
              <span ref={label} />
            </div>
          </div>
          <p className="e-credit">
            Slide: CAMELYON16 tumor_091 (Radboud UMC and UMC Utrecht), CC0.
            Outlines drawn by pathologists. The spread and the squads are a
            game, not biology.
          </p>
        </div>
      )}
    </article>
  )
}
