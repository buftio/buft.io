'use client'

import { useMemo } from 'react'
import { Clay } from '../marketdata/models/clay'
import type { Element } from './molecule'
import { tones } from './palette'
import { Dish, Trash, Laptop, Clipboard } from './furniture'
import { Bottle, Sprinkle } from './bottles'
import {
  SHELF_Y,
  SHELF_DEPTH,
  bottles,
  bottleX,
  shelfSpacing,
  type View,
} from './projection'
import type { Celebration } from './use-lab'
import type { BoardPlacement } from './board-motion'

export function Scenery({
  view,
  task,
  completed,
  solved,
  celebration,
  overTrash,
  supply,
  invitePiles,
  board,
  reduced,
}: {
  view: View
  task: number
  completed: number[]
  solved: boolean
  celebration: Celebration
  overTrash: boolean
  supply: Record<Element, number>
  invitePiles: boolean
  board: BoardPlacement
  reduced: boolean
}) {
  const { layout } = view
  const width = view.span + 3
  const depth = layout.benchFront - layout.benchBack
  const centre = (layout.benchFront + layout.benchBack) / 2
  const edge = bottleX(bottles.length - 1, view) + shelfSpacing(view) * 0.95
  const glowing = reduced && solved
  const sprinkleAt = useMemo<[number, number, number]>(
    () => [layout.moleculeX, 1.2, layout.moleculeZ],
    [layout.moleculeX, layout.moleculeZ],
  )
  return (
    <group>
      <Clay
        shape="slab"
        color={tones.bench}
        size={[width, 0.5, depth]}
        position={[0, -0.25, centre]}
      />
      <Clay
        shape="slab"
        color={tones.apron}
        size={[width, 1.1, depth]}
        position={[0, -1.05, centre]}
      />
      <Clay
        shape="slab"
        color={tones.shelf}
        size={[width, SHELF_Y, SHELF_DEPTH]}
        position={[0, SHELF_Y / 2, layout.shelfZ]}
      />
      {bottles.map((_, index) => (
        <Bottle
          key={index}
          index={index}
          view={view}
          current={index === task}
          done={completed.includes(index)}
          glow={glowing && index === task}
          hop={celebration?.task === index ? celebration.serial : null}
          reduced={reduced}
        />
      ))}
      {celebration && sprinkleAt && (
        <Sprinkle
          key={celebration.serial}
          origin={sprinkleAt}
          shelfZ={layout.shelfZ}
          reduced={reduced}
        />
      )}
      {!view.narrow && (
        <group position={[-edge, SHELF_Y, layout.shelfZ]}>
          <Clay
            shape="cylinder"
            color={tones.glass}
            size={[0.62, 0.72, 0.62]}
            position={[0, 0.36, 0]}
          />
          <Clay
            shape="cylinder"
            color={tones.ring}
            size={[0.54, 0.26, 0.54]}
            position={[0, 0.14, 0]}
          />
        </group>
      )}
      <Dish
        spot={layout.dishes.C}
        radius={layout.dishRadius}
        element="C"
        count={supply.C}
        dim={supply.C === 0}
        invite={invitePiles}
        reduced={reduced}
      />
      <Dish
        spot={layout.dishes.O}
        radius={layout.dishRadius}
        element="O"
        count={supply.O}
        dim={supply.O === 0}
        invite={invitePiles}
        reduced={reduced}
      />
      <Trash spot={layout.trash} open={overTrash} reduced={reduced} />
      <Laptop view={view} glow={solved} />
      <Clipboard placement={board} />
    </group>
  )
}
