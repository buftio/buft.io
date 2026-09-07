'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { Group, MathUtils } from 'three'
import { Shopper } from './models'
import { Rug } from './rug'
import { colorsFor, type Carpet } from './design'

function OwnedCarpet({
  carpet,
  index,
  columns,
  rows,
  rowHeight,
  flying,
  paused,
  onToggle,
}: {
  carpet: Carpet
  index: number
  columns: number
  rows: number
  rowHeight: number
  flying: boolean
  paused: boolean
  onToggle: () => void
}) {
  const root = useRef<Group>(null)
  const time = useRef(index * 1.7)
  const lift = useRef(flying ? 0.3 : 0)
  const x = ((index % columns) - (columns - 1) / 2) * 3.6
  const y = ((rows - 1) / 2 - Math.floor(index / columns)) * rowHeight + 0.1
  useFrame((_, delta) => {
    if (!root.current) return
    if (!paused) time.current += Math.min(delta, 0.05)
    lift.current = paused
      ? flying
        ? 0.3
        : 0
      : MathUtils.damp(lift.current, flying ? 0.3 : 0, 4, delta)
    root.current.position.y =
      y +
      lift.current +
      (flying && !paused ? Math.sin(time.current * 1.6) * 0.08 : 0)
    root.current.rotation.z =
      flying && !paused ? Math.sin(time.current * 1.3) * 0.07 : -0.04
  })
  return (
    <group>
      <mesh position={[x, y - 0.05, -0.5]} scale={[1, 0.35, 1]}>
        <circleGeometry args={[1, 32]} />
        <meshBasicMaterial color="#6a8060" transparent opacity={0.12} />
      </mesh>
      <group
        ref={root}
        position={[x, y, 0]}
        rotation={[0.78, -0.2, -0.04]}
        onClick={(event) => {
          event.stopPropagation()
          onToggle()
        }}
      >
        <Rug design={carpet.design} width={1.6} length={2.1} />
        <group position={[0, 0.06, -0.1]}>
          <Shopper
            pose={flying ? 'fly' : index % 2 ? 'stand' : 'sit'}
            color={colorsFor(carpet.design)[2]}
            variant={index}
          />
        </group>
      </group>
    </group>
  )
}

function Gallery({
  carpets,
  toggle,
  paused,
  onColumns,
}: {
  carpets: Carpet[]
  toggle: (id: string) => void
  paused: boolean
  onColumns: (columns: number) => void
}) {
  const { camera, size } = useThree()
  const columns = window.matchMedia('(max-width: 650px)').matches ? 2 : 3
  const rows = Math.ceil(carpets.length / columns)
  const zoom = size.width / (columns * 3.6)
  const rowHeight = size.height / zoom / rows
  useEffect(() => {
    camera.position.set(0, 0, 30)
    camera.lookAt(0, 0, 0)
    camera.zoom = zoom
    camera.updateProjectionMatrix()
    onColumns(columns)
  }, [camera, zoom, columns, onColumns])
  return (
    <>
      <ambientLight intensity={1.5} />
      <hemisphereLight args={['#fff1d5', '#829780', 1.6]} />
      <directionalLight position={[-3, 6, 12]} intensity={3} />
      {carpets.map((carpet, index) => (
        <OwnedCarpet
          key={carpet.id}
          carpet={carpet}
          index={index}
          rows={rows}
          rowHeight={rowHeight}
          columns={columns}
          paused={paused}
          flying={carpet.flying ?? index % 3 === 2}
          onToggle={() => toggle(carpet.id)}
        />
      ))}
    </>
  )
}

export default function Collection({
  carpets,
  paused,
  onFly,
}: {
  carpets: Carpet[]
  paused: boolean
  onFly: (id: string) => void
}) {
  const [columns, setColumns] = useState(3)
  return (
    <>
      <Canvas
        resize={{ offsetSize: true, debounce: 0 }}
        orthographic
        camera={{ position: [0, 0, 30], zoom: 70 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
      >
        <Gallery
          carpets={carpets}
          toggle={onFly}
          paused={paused}
          onColumns={setColumns}
        />
      </Canvas>
      <ol
        className="carpet-collection-labels"
        style={{
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gridTemplateRows: `repeat(${Math.ceil(carpets.length / columns)}, 1fr)`,
        }}
      >
        {carpets.map((carpet, i) => (
          <li key={carpet.id}>
            <span>{carpet.name}</span>
            <button
              onClick={() => onFly(carpet.id)}
              aria-pressed={carpet.flying ?? i % 3 === 2}
              aria-label={`Fly ${carpet.name}`}
            >
              {(carpet.flying ?? i % 3 === 2) ? 'Land' : 'Fly'}
            </button>
          </li>
        ))}
      </ol>
    </>
  )
}
