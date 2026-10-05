'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { X } from 'lucide-react'
import { useEffect, useRef, type RefObject } from 'react'
import { Box3, Vector3, type Group, type PerspectiveCamera } from 'three'
import { FACTORY, type Game } from './factory'
import type { Look } from './input'
import type { Kind, Site } from './map'
import { Bank } from './models/bank'
import { Business } from './models/business'
import { Customs } from './models/customs'
import { itemGeometry } from './models/items'
import { itemMaterial } from './models/kit'
import { RocketSite } from './models/rocket'
import { Shop } from './models/shop'
import { TaxOffice } from './models/tax'
import { Workshop } from './models/workshop'

type Stage = 'plot' | 'factory' | 'launched'

const places: Record<Site, [string, string]> = {
  shop: [
    'Shop',
    'Buys anything with a price tag. Home-grown goods pay in gray coins, cash with no paperwork. Imports pay in diamonds, because the cashier has a soft spot for monkeys.',
  ],
  business: [
    'Your business',
    'Registered in one click, which back then felt like cheating. Its only product is paperwork, printed and stamped every two seconds.',
  ],
  tax: [
    'Tax office',
    'One paper and two gray coins in, one gold coin out. Between customers the clerk sweeps up the loose change. With the banks plugged in it runs three times faster and nobody queues.',
  ],
  bank: [
    'Bank',
    'Keeps your gold and lends it back as belts. Three real banks shared one API, so their clients paid taxes without leaving the vault.',
  ],
  booth: [
    'Customs',
    'Closed unless you pay. One gold coin buys six seconds of open border, and the officer logs every crate that rolls past, so when something goes wrong the log already knows.',
  ],
  rocket: ['', ''],
  workshop: [
    'Belt factory',
    'Drop a gold coin in and it presses a belt tile. Drag the tile wherever it should go; it faces the way you carried it. Drag a belt back in and the tile goes back on the shelf.',
  ],
}

const rocket: Record<Stage, [string, string]> = {
  plot: [
    'Rocket site',
    'An empty pad with big plans. Five diamonds and it becomes a factory.',
  ],
  factory: [
    'Rocket factory',
    'Eats diamonds and stores the leftovers in a glass tank. A thousand, then it leaves.',
  ],
  launched: [
    'Launch pad',
    'The rocket is gone. The diamonds never stopped coming, so now it rains them.',
  ],
}

const goods: Record<Kind, [string, string]> = {
  potato: ['Potato', 'Home-grown and dependable. One gray coin at the shop.'],
  tomato: [
    'Tomato',
    'A fruit by science, a vegetable by law, a gray coin by the shop.',
  ],
  bear: ['Teddy bear', 'Stitched at home. Hugs are not included in the price.'],
  van: ['Toy van', 'Delivers nothing, sells anyway.'],
  banana: ['Banana', 'Came across the border. Worth one diamond.'],
  grapes: ['Grapes', 'Imported by the bunch. Two diamonds.'],
  monkey: [
    'Monkey',
    'A plush import with a passport. Four diamonds, and the cashier’s favorite.',
  ],
  car: ['Toy car', 'The fanciest import. Eight diamonds.'],
  paper: [
    'Paperwork',
    'Your business prints it, the tax office eats it. One sheet per gold coin.',
  ],
  gray: [
    'Gray coin',
    'Real money, but off the books. Two of them plus a paper make it clean.',
  ],
  gold: [
    'Gold coin',
    'Taxed and spendable. The bank keeps it, belts cost it, customs takes it.',
  ],
  diamond: ['Diamond', 'What imports sell for. The rocket’s favorite food.'],
}

const box = new Box3()
const size = new Vector3()
const view = new Vector3(3, 2.4, 4).normalize()

function Turntable({
  margin,
  children,
}: {
  margin: number
  children: React.ReactNode
}) {
  const group = useRef<Group>(null)
  const framed = useRef(0)
  useFrame(({ camera }, dt) => {
    const g = group.current
    if (!g) return
    g.rotation.y += dt * 0.5
    if (framed.current++ > 3) return
    box.setFromObject(g).getSize(size)
    const radius = Math.hypot(size.x, size.z) / 2
    const height = size.y
    const fov = ((camera as PerspectiveCamera).fov * Math.PI) / 180
    const reach = Math.hypot(radius, height / 2) * margin
    const middle = box.min.y + height / 2
    camera.position
      .copy(view)
      .multiplyScalar(reach / Math.sin(fov / 2))
      .setY(camera.position.y + middle)
    camera.lookAt(0, middle, 0)
  })
  return <group ref={group}>{children}</group>
}

function Model({
  game,
  look,
  stage,
}: {
  game: RefObject<Game>
  look: Look
  stage: Stage
}) {
  if ('item' in look)
    return (
      <mesh
        geometry={itemGeometry(look.item)}
        material={itemMaterial}
        castShadow
      />
    )
  const { site } = look
  if (site === 'shop') return <Shop game={game} />
  if (site === 'business') return <Business game={game} />
  if (site === 'tax')
    return <TaxOffice game={game} banks={game.current.banks} />
  if (site === 'bank')
    return <Bank game={game} connected={game.current.banks} />
  if (site === 'booth') return <Customs game={game} />
  if (site === 'workshop') return <Workshop game={game} />
  return <RocketSite game={game} stage={stage} />
}

export default function Inspect({
  game,
  look,
  onClose,
}: {
  game: RefObject<Game>
  look: Look
  onClose: () => void
}) {
  const state = game.current
  const stage: Stage = state.launched
    ? 'launched'
    : state.rocket >= FACTORY
      ? 'factory'
      : 'plot'
  const [title, text] =
    'item' in look
      ? goods[look.item]
      : look.site === 'rocket'
        ? rocket[stage]
        : places[look.site]
  const ready = useRef(false)
  useEffect(() => {
    const timer = window.setTimeout(() => (ready.current = true), 400)
    return () => clearTimeout(timer)
  }, [])
  const dismiss = () => {
    if (ready.current) onClose()
  }
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      onClose()
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [onClose])
  return (
    <div className="k-inspect">
      <button
        className="k-inspect-back"
        aria-label="Close"
        onClick={dismiss}
        onContextMenu={(event) => {
          event.preventDefault()
          dismiss()
        }}
      />
      <dialog open aria-label={title}>
        <div className="k-inspect-view">
          <Canvas
            shadows
            dpr={[1, 2]}
            resize={{ offsetSize: true, debounce: 0 }}
            camera={{ fov: 30, position: [3, 2.6, 4] }}
          >
            <hemisphereLight args={['#fff7ec', '#b9c4d8', 1.8]} />
            <directionalLight position={[4, 8, 5]} intensity={1.4} castShadow />
            <Turntable margin={'item' in look ? 1.3 : 1.05}>
              <Model game={game} look={look} stage={stage} />
            </Turntable>
          </Canvas>
        </div>
        <div className="k-inspect-text">
          <h3>{title}</h3>
          <p>{text}</p>
        </div>
        <button
          className="k-inspect-close"
          aria-label="Close"
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </dialog>
    </div>
  )
}
