'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef, type RefObject } from 'react'
import { Group, MathUtils, Vector3 } from 'three'
import { DeliveryTruck, Cart, Shopper } from './models'
import { shopperParts } from './models/people'
import { Rug } from './rug'
import { colorsFor } from './design'
import { type Run, type WorkshopClock } from './workshop-state'
import { type JourneyLayout } from './journey-layout'

const between = (p: number, a: number, b: number) =>
  MathUtils.clamp((p - a) / (b - a), 0, 1)

export function Delivery({
  rug,
  variant,
  clock,
  layout,
  narrow,
  marker,
  focused,
  paused,
}: {
  rug: Run
  variant: number
  clock: RefObject<WorkshopClock>
  layout: JourneyLayout
  narrow: boolean
  marker: RefObject<HTMLSpanElement | null>
  focused: boolean
  paused: boolean
}) {
  const truck = useRef<Group>(null)
  const stock = useRef<Group>(null)
  const flight = useRef<Group>(null)
  const shelf = useRef<Group>(null)
  const customer = useRef<Group>(null)
  const purchase = useRef<Group>(null)
  const { camera, size } = useThree()
  const v = useMemo(() => new Vector3(), [])
  const tangent = useMemo(() => new Vector3(), [])
  useFrame(() => {
    const p = clock.current.runs.find((run) => run.id === rug.id)?.progress ?? 1
    const t = clock.current.time
    if (truck.current) {
      truck.current.visible = p >= 0.23 && p < 0.43
      const fraction = between(p, 0.23, 0.43)
      layout.roads.truck.getPointAt(fraction, v)
      layout.roads.truck.getTangentAt(fraction, tangent)
      truck.current.position.copy(v)
      truck.current.rotation.y = Math.atan2(-tangent.z, tangent.x)
      if (!paused)
        truck.current.traverse((object) => {
          if (object.name.startsWith('wheel-')) object.rotation.z = -t * 7
        })
    }
    if (stock.current) stock.current.visible = p >= 0.43 && p < 0.51
    if (flight.current) {
      flight.current.visible = p >= 0.51 && p < 0.69
      const fraction = between(p, 0.51, 0.69)
      layout.roads.flight.getPointAt(fraction, v)
      flight.current.position.copy(v)
      flight.current.position.y = 0.25 + Math.sin(fraction * Math.PI) * 2
      flight.current.rotation.z = Math.sin(t * 3) * 0.08
    }
    if (shelf.current) shelf.current.visible = p >= 0.69 && p < 0.76
    if (customer.current) {
      customer.current.visible = p >= 0.69 && p < 0.95
      const fraction = between(p, 0.76, 0.95)
      layout.roads.home.getPointAt(fraction, v)
      layout.roads.home.getTangentAt(fraction, tangent)
      customer.current.position.copy(v)
      customer.current.position.y = 0.025
      customer.current.rotation.y = Math.atan2(tangent.x, tangent.z)
      const stride =
        !paused && p >= 0.76 && p < 0.95 ? Math.sin(t * 7) * 0.25 : 0
      const leftLeg = customer.current.getObjectByName(shopperParts.legL)
      const rightLeg = customer.current.getObjectByName(shopperParts.legR)
      if (leftLeg) leftLeg.rotation.x = stride
      if (rightLeg) rightLeg.rotation.x = -stride
    }
    if (purchase.current) purchase.current.visible = p >= 0.76
    if (focused && marker.current && p >= 0.23 && p < 0.95) {
      const target =
        p < 0.43
          ? truck
          : p < 0.51
            ? stock
            : p < 0.69
              ? flight
              : p < 0.76
                ? shelf
                : customer
      if (target.current) {
        target.current.getWorldPosition(v).project(camera)
        marker.current.style.transform = `translate(${((v.x + 1) * size.width) / 2}px, ${((1 - v.y) * size.height) / 2}px)`
      }
    }
  })
  return (
    <>
      <group ref={truck} visible={false} scale={narrow ? 0.64 : 0.65}>
        <DeliveryTruck />
        <group position={[-0.4, 0.48, 0]}>
          <Rug design={rug.design} width={0.8} rolled />
        </group>
      </group>
      <group
        position={layout.storage}
        rotation={[0, -0.25, 0]}
        scale={narrow ? 0.87 : 0.95}
      >
        <group ref={stock} visible={false} position={[-0.8, 0.03, 1.1]}>
          <Rug design={rug.design} width={0.85} rolled />
        </group>
      </group>
      <group ref={flight} visible={false}>
        <Rug design={rug.design} width={1.2} length={1.65} />
      </group>
      <group
        position={layout.shop}
        rotation={[0, 0.25, 0]}
        scale={narrow ? 0.9 : 1}
      >
        <group ref={shelf} visible={false} position={[0, 0.035, 1.25]}>
          <Rug design={rug.design} width={1.05} length={1.4} />
        </group>
      </group>
      <group ref={customer} visible={false} scale={0.8}>
        <Shopper
          pose="push"
          position={[0, 0, -0.25]}
          color={colorsFor(rug.design)[2]}
          variant={variant}
        />
        <group position={[0, 0, 0.41]} scale={0.75}>
          <Cart />
          <group ref={purchase} position={[0, 0.4, 0]}>
            <Rug design={rug.design} width={0.6} rolled />
          </group>
        </group>
      </group>
    </>
  )
}
