'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import {
  CatmullRomCurve3,
  Group,
  MathUtils,
  TubeGeometry,
  Vector3,
} from 'three'
import { Mill, Warehouse, Shop, DeliveryTruck, Shopper, Cart } from './models'
import { Rug } from './rug'
import { CostSheet } from './cost-sheet'
import { type RugDesign } from './design'

type Point = [number, number, number]
type Props = {
  design: RugDesign
  clock: RefObject<{ progress: number; time: number }>
  marker: RefObject<HTMLSpanElement | null>
  paused: boolean
  reduced: boolean
  onReady: () => void
}
const between = (p: number, start: number, end: number) =>
  MathUtils.clamp((p - start) / (end - start), 0, 1)

function Road({
  curve,
  flight = false,
}: {
  curve: CatmullRomCurve3
  flight?: boolean
}) {
  const road = useMemo(
    () => new TubeGeometry(curve, 80, flight ? 0.028 : 0.16, 8, false),
    [curve, flight],
  )
  useEffect(() => () => road.dispose(), [road])
  return (
    <group position={[0, 0, -0.35]}>
      <mesh geometry={road} scale={[1, 1, 0.3]}>
        <meshStandardMaterial
          color={flight ? '#c5a66a' : '#afbbac'}
          roughness={1}
          transparent
          opacity={flight ? 0.45 : 1}
        />
      </mesh>
      {!flight &&
        Array.from({ length: 25 }, (_, i) => {
          const point = curve.getPoint(i / 25)
          const tangent = curve.getTangent(i / 25)
          return (
            <mesh
              key={i}
              position={[point.x, point.y, -0.27]}
              rotation={[0, 0, Math.atan2(tangent.y, tangent.x)]}
            >
              <boxGeometry args={[0.12, 0.025, 0.008]} />
              <meshBasicMaterial color="#e8ead8" />
            </mesh>
          )
        })}
    </group>
  )
}

function Island({
  radius = 1.8,
  color = '#d1d8bd',
}: {
  radius?: number
  color?: string
}) {
  return (
    <group>
      <mesh position={[0, -0.12, 0]} scale={[1, 1, 0.7]} receiveShadow>
        <cylinderGeometry args={[radius, radius * 0.94, 0.2, 48]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * radius * 0.88, 0, -0.1]}>
          <mesh position={[0, 0.18, 0]}>
            <cylinderGeometry args={[0.035, 0.06, 0.35, 8]} />
            <meshStandardMaterial color="#96714e" roughness={1} />
          </mesh>
          <mesh position={[0, 0.44, 0]} scale={[0.24, 0.29, 0.23]}>
            <sphereGeometry args={[1, 16, 12]} />
            <meshStandardMaterial
              color={side < 0 ? '#6f8f65' : '#87a378'}
              roughness={1}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function World({ design, clock, marker, paused, reduced, onReady }: Props) {
  const { camera, size } = useThree()
  const narrow = window.matchMedia('(max-width: 650px)').matches
  const width = narrow ? 6.7 : 11
  const height = (width * size.height) / size.width
  const point = (x: number, y: number, z = 0): Point => [
    (x - 0.5) * width,
    (0.5 - y) * height,
    z,
  ]
  const mill = point(narrow ? 0.45 : 0.23, narrow ? 0.125 : 0.175)
  const storage = point(narrow ? 0.68 : 0.77, narrow ? 0.46 : 0.47)
  const shop = point(narrow ? 0.32 : 0.25, narrow ? 0.705 : 0.725)
  const owner = point(narrow ? 0.67 : 0.75, 0.95)
  const roads = useMemo(() => {
    const p = (x: number, y: number) =>
      new Vector3((x - 0.5) * width, (0.5 - y) * height, 0)
    return {
      truck: new CatmullRomCurve3(
        narrow
          ? [p(0.64, 0.155), p(0.88, 0.27), p(0.89, 0.38), p(0.79, 0.485)]
          : [p(0.32, 0.215), p(0.42, 0.27), p(0.65, 0.38), p(0.83, 0.495)],
      ),
      flight: new CatmullRomCurve3(
        narrow
          ? [p(0.67, 0.465), p(0.86, 0.57), p(0.25, 0.63), p(0.33, 0.7)]
          : [p(0.75, 0.48), p(0.63, 0.55), p(0.39, 0.54), p(0.27, 0.715)],
      ),
      home: new CatmullRomCurve3(
        narrow
          ? [p(0.33, 0.72), p(0.73, 0.77), p(0.89, 0.88), p(0.66, 0.946)]
          : [p(0.29, 0.74), p(0.44, 0.82), p(0.62, 0.88), p(0.74, 0.946)],
      ),
    }
  }, [width, height, narrow])
  const factory = useRef<Group>(null)
  const weaving = useRef<Group>(null)
  const truck = useRef<Group>(null)
  const cargo = useRef<Group>(null)
  const stock = useRef<Group>(null)
  const flight = useRef<Group>(null)
  const shelf = useRef<Group>(null)
  const customer = useRef<Group>(null)
  const purchase = useRef<Group>(null)
  const happy = useRef<Group>(null)
  const sheet = useRef<Group>(null)
  const v = useMemo(() => new Vector3(), [])
  useEffect(() => {
    camera.position.set(0, 0, 50)
    camera.lookAt(0, 0, 0)
    camera.zoom = size.width / width
    camera.updateProjectionMatrix()
  }, [camera, size, width])
  useEffect(onReady, [onReady])
  useFrame(() => {
    const p = clock.current.progress
    const t = clock.current.time
    const shuttle = factory.current?.getObjectByName('loom-shuttle')
    const roller = factory.current?.getObjectByName('loom-roller')
    if (shuttle && !paused && p < 0.23)
      shuttle.position.x = Math.sin(t * 12) * 0.65
    if (roller && !paused && p < 0.23) roller.rotation.x = t * 3
    if (weaving.current) {
      weaving.current.visible = p < 0.23
      weaving.current.scale.z = 0.06 + between(p, 0, 0.22) * 0.94
    }
    if (truck.current) {
      const fraction = between(p, 0.23, 0.43)
      roads.truck.getPoint(fraction, v)
      truck.current.position.set(v.x, v.y + 0.12, v.z + 3.2)
      truck.current.rotation.z = -0.06
      truck.current.traverse((object) => {
        if (object.name.includes('wheel') && !paused && p >= 0.23 && p < 0.43)
          object.rotation.z = -t * 7
      })
    }
    if (cargo.current) cargo.current.visible = p >= 0.22 && p < 0.44
    if (flight.current) {
      flight.current.visible = p >= 0.51 && p < 0.69
      roads.flight.getPoint(between(p, 0.51, 0.69), v)
      flight.current.position.copy(v)
      flight.current.position.z = 4.5
      flight.current.rotation.z = Math.sin(t * 3) * 0.12
      flight.current.rotation.x = 0.84 + Math.sin(t * 2) * 0.08
    }
    if (shelf.current) shelf.current.visible = p >= 0.69 && p < 0.77
    if (customer.current) {
      customer.current.visible = p >= 0.69 && p < 0.95
      roads.home.getPoint(between(p, 0.76, 0.95), v)
      customer.current.position.copy(v)
      customer.current.position.y += Math.abs(Math.sin(t * 7)) * 0.035
      customer.current.position.z = 3.5
    }
    if (purchase.current) purchase.current.visible = p >= 0.76
    if (happy.current) {
      happy.current.visible = p >= 0.95
      happy.current.rotation.z = Math.sin(t * 2) * 0.04
      happy.current.position.y = owner[1] + Math.sin(t * 2) * 0.07
    }
    if (sheet.current)
      sheet.current.rotation.z =
        -0.08 + (p >= 0.43 && p < 0.51 ? Math.sin(t * 10) * 0.02 : 0)
    const target =
      p < 0.23
        ? weaving
        : p < 0.43
          ? cargo
          : p < 0.51
            ? stock
            : p < 0.69
              ? flight
              : p < 0.95
                ? customer
                : happy
    if (target.current && marker.current) {
      target.current.getWorldPosition(v).project(camera)
      marker.current.style.transform = `translate(${((v.x + 1) * size.width) / 2}px, ${((1 - v.y) * size.height) / 2}px)`
    }
  })
  return (
    <>
      <ambientLight intensity={0.55} />
      <hemisphereLight args={['#fff4dc', '#7b9288', 1]} />
      <directionalLight
        position={[-6, 14, 20]}
        intensity={2.5}
        color="#fff1d7"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-camera-far={70}
        shadow-bias={-0.0003}
        shadow-normalBias={0.035}
        shadow-radius={4}
      />
      <directionalLight
        position={[10, -5, 12]}
        intensity={0.5}
        color="#b6d7db"
      />
      <Road curve={roads.truck} />
      <Road curve={roads.flight} flight />
      <Road curve={roads.home} />
      <group
        position={mill}
        rotation={[0.5, -0.35, 0]}
        ref={factory}
        scale={narrow ? 0.97 : 1}
      >
        <Island radius={2.2} color="#d7d2b3" />
        <Mill />
        <group ref={weaving} position={[0.2, 0.24, 1.3]}>
          <Rug design={design} width={1.05} length={1.65} />
        </group>
      </group>
      <group
        position={storage}
        rotation={[0.5, -0.35, 0]}
        scale={narrow ? 0.87 : 0.95}
      >
        <Island radius={1.9} />
        <Warehouse />
        <group ref={stock} position={[-0.8, 0.12, 1]}>
          <Rug design={design} width={0.85} rolled />
        </group>
      </group>
      <group position={shop} rotation={[0.5, 0.25, 0]} scale={narrow ? 0.9 : 1}>
        <Island radius={2} color="#dad2b7" />
        <Shop />
        <group ref={shelf} position={[0, 0.16, 1.2]}>
          <Rug design={design} width={1.1} length={1.55} />
        </group>
      </group>
      <group ref={truck} scale={narrow ? 0.7 : 0.73}>
        <group rotation={[0.4, -0.25, 0]}>
          <DeliveryTruck />
          <group ref={cargo} position={[-0.4, 0.48, 0]}>
            <Rug design={design} width={0.8} rolled />
          </group>
        </group>
      </group>
      <group ref={flight}>
        <Rug design={design} width={1.45} length={1.9} />
      </group>
      <group ref={customer} scale={0.85}>
        <group rotation={[0.4, -0.25, 0]}>
          <Shopper color="#48778a" variant={1} />
          <group position={[0.85, 0, 0.1]}>
            <Cart />
            <group ref={purchase} position={[0, 0.6, 0]}>
              <Rug design={design} width={0.6} rolled />
            </group>
          </group>
        </group>
      </group>
      <group position={owner} rotation={[0.5, -0.3, 0]}>
        <Island radius={1.45} color="#c9d4b7" />
      </group>
      <group ref={happy} position={owner} rotation={[0.65, -0.2, 0]}>
        <Rug design={design} width={1.4} length={1.8} />
        <group position={[0, 0.04, 0]}>
          <Shopper pose="sit" color="#b45e53" variant={2} />
        </group>
      </group>
      <group
        ref={sheet}
        position={point(narrow ? 0.3 : 0.24, narrow ? 0.41 : 0.475, 0.6)}
        scale={narrow ? 0.84 : 1}
      >
        <CostSheet design={design} clock={clock} reduced={reduced} />
      </group>
    </>
  )
}

export default function Journey(props: Props) {
  return (
    <Canvas
      shadows="soft"
      resize={{ offsetSize: true, debounce: 0 }}
      orthographic
      camera={{ position: [0, 0, 50], zoom: 70, near: 0.1, far: 100 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
    >
      <World {...props} />
    </Canvas>
  )
}
