'use client'

import type { ReactNode, RefObject } from 'react'
import type { Group } from 'three'
import { Clay, palette, type GroupProps } from '../../marketdata/models/clay'

export type PersonProps = GroupProps & {
  outfit?: string
  hat?: 'cap' | 'hardhat' | 'none'
  leftArm?: RefObject<Group | null>
  rightArm?: RefObject<Group | null>
  leftHand?: ReactNode
  rightHand?: ReactNode
}
export function Person({
  outfit = '#91bdb9',
  hat = 'none',
  leftArm,
  rightArm,
  leftHand,
  rightHand,
  ...props
}: PersonProps) {
  return (
    <group {...props}>
      {[-1, 1].map((s) => (
        <group key={s}>
          <Clay
            color="#4e596c"
            size={[0.13, 0.25, 0.14]}
            position={[s * 0.09, 0.2, 0]}
          />
          <Clay
            shape="sphere"
            color={palette.ink}
            size={[0.17, 0.09, 0.23]}
            position={[s * 0.09, 0.065, 0.04]}
          />
        </group>
      ))}
      <Clay
        shape="sphere"
        color={outfit}
        size={[0.42, 0.43, 0.3]}
        position={[0, 0.48, 0]}
      />
      <Clay color={outfit} size={[0.34, 0.2, 0.26]} position={[0, 0.36, 0]} />
      <Clay
        shape="sphere"
        color="#edc3a2"
        size={[0.4, 0.4, 0.36]}
        position={[0, 0.85, 0]}
      />
      <Clay
        shape="sphere"
        color="#694937"
        size={[0.41, 0.23, 0.35]}
        position={[0, 0.96, -0.045]}
      />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Clay
            shape="sphere"
            color="#edc3a2"
            size={[0.07, 0.1, 0.075]}
            position={[s * 0.19, 0.85, 0]}
          />
          <Clay
            shape="sphere"
            color={palette.ink}
            size={[0.036, 0.044, 0.026]}
            position={[s * 0.075, 0.865, 0.165]}
          />
          <Clay
            shape="sphere"
            color="#e6a594"
            size={[0.07, 0.04, 0.026]}
            position={[s * 0.115, 0.805, 0.151]}
          />
        </group>
      ))}
      <Clay
        shape="sphere"
        color="#edc3a2"
        size={[0.055, 0.065, 0.065]}
        position={[0, 0.835, 0.18]}
      />
      <Clay
        shape="smile"
        color="#9b6b57"
        size={0.08}
        position={[0, 0.79, 0.163]}
        rotation={[0, 0, Math.PI]}
      />
      {hat !== 'none' && (
        <group position={[0, 1, 0]}>
          <Clay
            shape="sphere"
            color={hat === 'cap' ? '#526e86' : '#edba50'}
            size={[0.43, 0.22, 0.39]}
          />
          <Clay
            color={hat === 'cap' ? '#526e86' : '#edba50'}
            size={[0.43, 0.045, 0.3]}
            position={[0, -0.035, 0.11]}
          />
          {hat === 'cap' && (
            <Clay
              shape="sphere"
              color="#e9b735"
              size={[0.075, 0.065, 0.024]}
              position={[0, 0.025, 0.19]}
            />
          )}
        </group>
      )}
      {[-1, 1].map((s, i) => (
        <group
          key={s}
          name={i === 0 ? 'left-arm' : 'right-arm'}
          ref={i === 0 ? leftArm : rightArm}
          userData={{ live: true }}
          position={[s * 0.215, 0.64, 0]}
          rotation={[-0.35, 0, s * 0.18]}
        >
          <Clay
            shape="sphere"
            color={outfit}
            size={[0.15, 0.22, 0.16]}
            position={[0, -0.07, 0]}
          />
          <Clay
            shape="sphere"
            color="#edc3a2"
            size={[0.105, 0.19, 0.11]}
            position={[0, -0.22, 0]}
          />
          <group position={[0, -0.3, 0]}>
            <Clay shape="sphere" color="#edc3a2" size={0.12} />
            {i === 0 ? leftHand : rightHand}
          </group>
        </group>
      ))}
    </group>
  )
}
