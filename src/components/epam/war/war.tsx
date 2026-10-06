'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import type * as THREE from 'three'
import type { SlideMeta } from '../slide-data'
import { SWEEP } from '../tumors'
import { Base } from './base'
import { field } from '../lands/threat'
import { Corruption, fieldTexture } from './corruption'
import { Question, isWhy, type Ask } from './ask'
import { build, charge, economy, MINE, POST, spotAt } from './build'
import { aimFog, clearFog, fog, fogTexture, paintFog } from './fog'
import { Buildings, type Ghost } from './buildings'
import { Deposits } from './deposits'
import { createCrowd, headcount, syncCrowd } from './crowd'
import type { Terrain } from './terrain'
import { CELL, createWar, reveal, step, warriors } from './sim'
import { Network } from './network'
import { Villagers } from './villagers'
import { Warriors } from './warriors'

const DT = 0.1
const REPORT = 0.25
const OPEN = 1e9
const ASK_MS = 2400

export type Tap = { x: number; y: number; at: number; grab: number }
export type Status = {
  contained: number
  tumors: number
  time: number
  won: number | null
  corrupted: number
  warriors: number
  crowd: number
  fallen: number
  shownFallen: number
  shownEaten: number
  villagers: number
  lost: number
  fat: number
  income: number
}
export function War({
  meta,
  land,
  scan,
  tap,
  reduced,
  onStatus,
}: {
  meta: SlideMeta
  land: Terrain
  scan: number
  tap: Tap | null
  reduced: boolean
  onStatus: (status: Status) => void
}) {
  const [war] = useState(() => createWar(meta, meta.tumors, land))
  const [crowd] = useState(() => createCrowd())
  const texture = useMemo(() => fieldTexture(war), [war])
  const light = useMemo(() => fogTexture(war), [war])
  const fogged = useRef(-1)
  const dawn = useRef(-OPEN)
  const ghosts = useRef<Ghost[]>([])
  const [ask, setAsk] = useState<Ask | null>(null)
  const asking = useRef<{ next?: Ask | null; shown: Ask | null }>({
    shown: null,
  })
  const version = useRef(0)
  const clock = useRef({ last: -1, debt: 0, reported: 0 })
  const sweep = useRef({ scan: 0, at: 0, sent: true })

  useEffect(() => {
    if (!tap) return
    const made = build(war, tap.x, tap.y, tap.grab)
    if (!isWhy(made)) {
      asking.current.next = null
      return
    }
    const spot = spotAt(war, tap)
    const at = spot ?? tap
    ghosts.current.push({ x: at.x, y: at.y, mine: !!spot })
    asking.current.next = {
      x: at.x,
      y: at.y,
      mine: !!spot,
      why: made,
      cost: spot ? MINE : POST,
      at: tap.at,
    }
  }, [tap, war])

  useEffect(() => () => texture.dispose(), [texture])

  const camera = useThree((state) => state.camera)
  useEffect(() => {
    field.war = war
    field.tumors = meta.tumors
    aimFog(war, light)
    return () => {
      if (field.war === war) {
        field.war = null
        field.tumors = []
      }
      clearFog()
      light.dispose()
    }
  }, [war, light, meta])

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production')
      Object.assign(window, { epamWar: { war, crowd, camera } })
  }, [war, crowd, camera])

  useFrame((state, delta) => {
    const now = state.clock.elapsedTime
    const q = asking.current
    const stale = q.shown && performance.now() - q.shown.at > ASK_MS
    if (q.next !== undefined || stale) {
      q.shown = q.next ?? null
      q.next = undefined
      setAsk(q.shown)
    }
    const c = clock.current
    if (c.last < 0) c.last = now
    c.debt += Math.min(0.5, now - c.last)
    c.last = now
    while (c.debt >= DT) {
      step(war, DT)
      economy(war, DT)
      c.debt -= DT
      version.current++
    }
    if (sweep.current.scan !== scan) {
      const free = sweep.current.scan === 0
      sweep.current = { scan, at: now, sent: !free && !charge(war) }
    }
    for (let left = Math.min(0.5, delta); left > 1e-4; left -= 0.1)
      syncCrowd(crowd, war, Math.min(0.1, left))
    const t = (now - sweep.current.at) / SWEEP
    if (sweep.current.scan && !sweep.current.sent) {
      const camera = state.camera as THREE.OrthographicCamera
      const halfW = state.size.width / 2 / camera.zoom
      const halfH = state.size.height / 2 / camera.zoom
      const left = camera.position.x - halfW
      const top = -camera.position.y - halfH
      reveal(war, left, top, left + 2 * halfW * Math.min(1, t), top + 2 * halfH)
      if (dawn.current < OPEN)
        dawn.current = t >= 1 ? OPEN : left + 2 * halfW * t
      field.dawn = Math.max(field.dawn, dawn.current)
      version.current++
      if (t >= 1) sweep.current.sent = true
    }
    if (fogged.current !== version.current) {
      fogged.current = version.current
      paintFog(war, light)
    }
    fog.uFogOn.value = Math.min(1, fog.uFogOn.value + delta)
    if (now - c.reported >= REPORT) {
      c.reported = now
      onStatus({
        contained: war.contained.filter((v) => v >= 1).length,
        tumors: war.tumors,
        time: war.time,
        won: war.won,
        corrupted: war.corrupted * ((CELL * meta.mpp) / 1000) ** 2,
        warriors: warriors(war),
        crowd: headcount(crowd),
        fallen: war.fallen,
        shownFallen: crowd.fallen,
        shownEaten: crowd.eaten,
        villagers: war.folkTotal,
        lost: war.folkLost,
        fat: war.fat,
        income: war.income,
      })
    }
  })

  return (
    <group>
      <Corruption
        war={war}
        texture={texture}
        version={version}
        dawn={dawn}
        reduced={reduced}
      />
      <Villagers
        meta={meta}
        war={war}
        texture={texture}
        dawn={dawn}
        reduced={reduced}
      />
      <Network war={war} mpp={meta.mpp} dawn={dawn} reduced={reduced} />
      <Deposits war={war} dawn={dawn} reduced={reduced} />
      <Buildings war={war} dawn={dawn} ghosts={ghosts} reduced={reduced} />
      {ask && <Question key={ask.at} ask={ask} />}
      <Warriors crowd={crowd} mpp={meta.mpp} dawn={dawn} />
      <Base war={war} dawn={dawn} reduced={reduced} />
    </group>
  )
}
