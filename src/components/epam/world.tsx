'use client'

import { Canvas } from '@react-three/fiber'
import { useCallback, useEffect, useState } from 'react'
import { Controls } from './controls'
import { Feather } from './feather'
import { Lands } from './lands/lands'
import { EYE, GLASS, type SlideMeta, type View } from './slide-data'
import { Tiles } from './tiles'
import { Tumors } from './tumors'
import { landOf } from './war/land'
import type { Terrain } from './war/terrain'
import { War, type Status, type Tap } from './war/war'
import { warmUp } from './war/warm'

const GRAB_PX = 24

export default function World({
  meta,
  scan,
  round,
  reduced,
  onView,
  onLoaded,
  onReady,
  onStatus,
}: {
  meta: SlideMeta
  scan: number
  round: number
  reduced: boolean
  onView: (view: View) => void
  onLoaded: (tiles: number, bytes: number) => void
  onReady: () => void
  onStatus: (status: Status) => void
}) {
  const [land, setLand] = useState<Terrain | null>(null)
  const [tap, setTap] = useState<(Tap & { round: number }) | null>(null)
  const [hold, setHold] = useState<{ x: number; y: number } | null>(null)
  const playing = scan > 0 && land !== null

  useEffect(onReady, [onReady])
  useEffect(() => {
    const stop = new AbortController()
    landOf(meta, stop.signal).then(
      (next) => !stop.signal.aborted && setLand(next),
      () => setLand(null),
    )
    return () => stop.abort()
  }, [meta])
  useEffect(() => {
    if (land && !playing) warmUp(meta, land)
  }, [meta, land, playing])

  const onTap = useCallback(
    (x: number, y: number, scale: number) => {
      setHold(null)
      setTap({ x, y, at: performance.now(), grab: GRAB_PX / scale, round })
    },
    [round],
  )
  const onHold = useCallback((x: number, y: number) => setHold({ x, y }), [])
  const onClose = useCallback(() => setHold(null), [])

  return (
    <Canvas
      orthographic
      frameloop={playing ? 'always' : 'demand'}
      resize={{ offsetSize: true, debounce: 0 }}
      camera={{ position: [0, 0, EYE], zoom: 0.01, near: 1, far: 2 * EYE }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
      onCreated={({ gl }) => gl.setClearColor(GLASS)}
    >
      <Controls
        meta={meta}
        onView={onView}
        onTap={playing ? onTap : undefined}
        onHold={playing ? onHold : undefined}
      />
      <Tiles meta={meta} onLoaded={onLoaded} />
      <Feather meta={meta} />
      {playing && (
        <War
          key={round}
          meta={meta}
          land={land}
          scan={scan}
          tap={tap?.round === round ? tap : null}
          reduced={reduced}
          onStatus={onStatus}
        />
      )}
      <hemisphereLight args={['#fffaff', '#8a6a96', 2.6]} />
      <directionalLight position={[-0.5, 0.8, 1]} intensity={3.2} />
      <Lands reduced={reduced} hold={hold} onClose={onClose} />
      <Tumors meta={meta} scan={scan} />
    </Canvas>
  )
}
