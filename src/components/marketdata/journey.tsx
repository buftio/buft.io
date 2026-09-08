'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { Group, Vector3 } from 'three'
import { Mill, Warehouse, Shop } from './models'
import { Rug } from './rug'
import { CostSheet } from './cost-sheet'
import { type RugDesign } from './design'
import { type Run, type WorkshopClock } from './workshop-state'
import { type JourneyLayout } from './journey-layout'
import { Road, Island } from './ground'
import { Delivery } from './delivery'

type Props = {
  design: RugDesign
  queue: Run[]
  guestIds: string[]
  layout: JourneyLayout
  narrow: boolean
  clock: RefObject<WorkshopClock>
  marker: RefObject<HTMLSpanElement | null>
  paused: boolean
  reduced: boolean
  onReady: () => void
}

export default function Journey({
  design,
  queue,
  guestIds,
  layout,
  narrow,
  clock,
  marker,
  paused,
  reduced,
  onReady,
}: Props) {
  const { camera, size } = useThree()
  const traveling = queue.filter((rug) => rug.progress >= 0)
  const weaver = queue.find((rug) => rug.progress >= 0 && rug.progress < 0.23)
  const invoice = queue.findLast((rug) => rug.progress >= 0.43) ?? queue[0]
  const focused = queue[0]?.id
  const factory = useRef<Group>(null)
  const weaving = useRef<Group>(null)
  const invoiceClock = useRef({ progress: 0, time: 0 })
  const v = useMemo(() => new Vector3(), [])
  useEffect(onReady, [onReady])
  useFrame(() => {
    const t = clock.current.time
    const p =
      clock.current.runs.find((rug) => rug.id === weaver?.id)?.progress ?? 1
    const shuttle = factory.current?.getObjectByName('loom-shuttle')
    const roller = factory.current?.getObjectByName('loom-roller')
    if (shuttle)
      shuttle.position.x = !paused && p < 0.23 ? Math.sin(t * 12) * 0.65 : 0
    if (roller && !paused && p < 0.23) roller.rotation.x = t * 3
    if (weaving.current) {
      weaving.current.visible = p >= 0 && p < 0.23
      weaving.current.scale.z = 0.06 + Math.max(0, Math.min(1, p / 0.22)) * 0.94
      if (weaver?.id === focused && marker.current && p < 0.23) {
        weaving.current.getWorldPosition(v).project(camera)
        marker.current.style.transform = `translate(${((v.x + 1) * size.width) / 2}px, ${((1 - v.y) * size.height) / 2}px)`
      }
    }
    invoiceClock.current.progress =
      clock.current.runs.find((rug) => rug.id === invoice?.id)?.progress ?? 0
    invoiceClock.current.time = t
  })
  return (
    <>
      <Road curve={layout.roads.truck} />
      <Road curve={layout.roads.flight} flight />
      <Road curve={layout.roads.home} />
      <group
        position={layout.mill}
        rotation={[0, -0.35, 0]}
        ref={factory}
        scale={narrow ? 0.97 : 1}
      >
        <Island radius={2.2} color="#d7d2b3" />
        <Mill />
        {weaver && (
          <group ref={weaving} position={[0.2, 0.24, 1.3]}>
            <Rug design={weaver.design} width={1.05} length={1.65} />
          </group>
        )}
      </group>
      <group
        position={layout.storage}
        rotation={[0, -0.25, 0]}
        scale={narrow ? 0.87 : 0.95}
      >
        <Island radius={1.9} />
        <Warehouse />
      </group>
      <group
        position={layout.shop}
        rotation={[0, 0.25, 0]}
        scale={narrow ? 0.9 : 1}
      >
        <Island radius={2} color="#dad2b7" />
        <Shop />
      </group>
      <group position={layout.owner} rotation={[0, -0.3, 0]}>
        <Island radius={1.45} color="#c9d4b7" />
      </group>
      {traveling.map((rug) => (
        <Delivery
          key={rug.id}
          rug={rug}
          variant={Math.max(0, guestIds.indexOf(rug.id))}
          clock={clock}
          layout={layout}
          narrow={narrow}
          paused={paused}
          marker={marker}
          focused={rug.id === focused}
        />
      ))}
      <group
        position={layout.sheet}
        rotation={[-1.15, 0, -0.08]}
        scale={narrow ? 0.78 : 1}
      >
        <CostSheet
          design={invoice?.design ?? design}
          clock={invoiceClock}
          reduced={reduced}
        />
      </group>
    </>
  )
}
