'use client'

import { useEffect, useMemo } from 'react'
import { CatmullRomCurve3, TubeGeometry } from 'three'

export function Road({
  curve,
  flight = false,
}: {
  curve: CatmullRomCurve3
  flight?: boolean
}) {
  const road = useMemo(
    () => new TubeGeometry(curve, 100, flight ? 0.025 : 0.18, 8, false),
    [curve, flight],
  )
  useEffect(() => () => road.dispose(), [road])
  return (
    <group>
      <mesh geometry={road} scale={[1, 0.12, 1]} receiveShadow>
        <meshStandardMaterial
          color={flight ? '#c5a66a' : '#afbbac'}
          roughness={1}
          transparent
          opacity={flight ? 0.4 : 1}
        />
      </mesh>
      {!flight &&
        Array.from({ length: 35 }, (_, i) => {
          const point = curve.getPointAt(i / 35)
          const tangent = curve.getTangentAt(i / 35)
          return (
            <mesh
              key={i}
              position={[point.x, 0.028, point.z]}
              rotation={[0, Math.atan2(-tangent.z, tangent.x), 0]}
            >
              <boxGeometry args={[0.16, 0.006, 0.025]} />
              <meshBasicMaterial color="#e8ead8" />
            </mesh>
          )
        })}
    </group>
  )
}

export function Island({
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
