'use client'

import { useEffect, useMemo } from 'react'
import { CatmullRomCurve3, TubeGeometry, Vector3 } from 'three'
import { Clay } from './models/clay'
import { FloorCushion, TeaTray, Radio } from './models/party-props'
import { Shopper } from './models/people'
import { type PartyLayout } from './party-layout'

export function PartyDecor({ layout }: { layout: PartyLayout }) {
  const side = layout.width / 2 - 0.65
  const z = layout.near - 0.2
  const wire = useMemo(
    () =>
      new TubeGeometry(
        new CatmullRomCurve3([
          new Vector3(-side, 2.3, z),
          new Vector3(0, 1.85, z + 0.12),
          new Vector3(side, 2.3, z),
        ]),
        60,
        0.012,
        5,
        false,
      ),
    [side, z],
  )
  useEffect(() => () => wire.dispose(), [wire])
  return (
    <>
      <mesh
        position={[0, -0.03, (layout.near + layout.far) / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[layout.width * 0.48, (layout.far - layout.near) / 2 + 1, 1]}
        receiveShadow
      >
        <circleGeometry args={[1, 64]} />
        <meshStandardMaterial color="#d9dfc8" roughness={1} />
      </mesh>
      <mesh geometry={wire}>
        <meshStandardMaterial color="#867e61" roughness={1} />
      </mesh>
      {[-side, side].map((x) => (
        <Clay
          key={x}
          shape="cylinder"
          color="#a28457"
          size={[0.055, 2.3, 0.055]}
          position={[x, 1.15, z]}
        />
      ))}
      {Array.from({ length: 17 }, (_, i) => {
        const ratio = i / 16
        return (
          <group
            key={i}
            position={[
              -side + 2 * side * ratio,
              2.3 - Math.sin(ratio * Math.PI) * 0.45,
              z + 0.1,
            ]}
          >
            <mesh position={[0, -0.12, 0]}>
              <sphereGeometry args={[0.065, 10, 8]} />
              <meshStandardMaterial
                color={['#edb260', '#c67d78', '#e2d7a8'][i % 3]}
                emissive="#cc8e46"
                emissiveIntensity={0.3}
              />
            </mesh>
          </group>
        )
      })}
      <group position={[0.15, 0.015, 0]}>
        <TeaTray cups={3} />
      </group>
      <group position={[-0.6, 0, 0.4]} rotation={[0, 1, 0]}>
        <FloorCushion color="#ba7862" />
        <group position={[0, 0.13, 0]} scale={0.65}>
          <Shopper pose="sit" color="#779582" variant={4} />
        </group>
      </group>
      <group position={[0.8, 0, -0.25]} rotation={[0, -1.6, 0]}>
        <FloorCushion color="#d5b966" round />
        <group position={[0, 0.17, 0]} scale={0.7}>
          <Shopper pose="sit" color="#be8b99" variant={5} />
        </group>
      </group>
      <Radio position={[-0.6, 0, -0.5]} rotation={[0, -0.4, 0]} />
    </>
  )
}
