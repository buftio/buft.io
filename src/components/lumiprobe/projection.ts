import type { Element, Molecule } from './molecule'

/*
 * One fixed orthographic camera, shared by the WebGL bench and the DOM overlay.
 * Both sides derive pixel positions from the same numbers here, so DOM hit
 * targets, labels and clay objects always agree without raycasting.
 *
 * Molecule coordinates (x, y) lie flat on the bench: x runs left to right,
 * y runs toward the viewer. The molecule group is scaled and centred by a Fit
 * so large molecules stay in their band while the camera never moves.
 *
 * Screen space is measured in world units: `span` across, `rows` down, with
 * the camera target at the centre. Objects that carry text (clipboard, laptop
 * screen, keys) are sized in pixels first and converted to world units, so
 * their labels stay legible at every viewport; the layout then packs the
 * remaining bands around them.
 */

export const PITCH = Math.PI / 4
export const TARGET_Z = -0.5
export const BEAD_Y = 0.42
export const SHELF_Y = 0.35
export const SHELF_DEPTH = 1.35
export const CAMERA_DISTANCE = 60
/* Rotation that turns a flat slab into a panel facing the camera. Its local
 * +z axis then points straight down the screen with no foreshortening. */
export const FACING: [number, number, number] = [PITCH, 0, 0]

const SIN = Math.sin(PITCH)
const COS = Math.cos(PITCH)

export const TRASH = { radius: 0.42, height: 0.95 }
export const DISH_HEIGHT = 0.16
export const BASE_HEIGHT = 0.12
export const KEY_HEIGHT = 0.12
const KEY_PX = 36

export type Point = { x: number; y: number }
export type Spot = { x: number; z: number }
/* A camera-facing panel: world centre and world width/height. */
export type Panel = { x: number; y: number; z: number; w: number; h: number }
/* A flat pad lying on the bench: world centre of its top face and footprint. */
export type Pad = { x: number; y: number; z: number; w: number; d: number }

export type Layout = {
  shelfZ: number
  benchBack: number
  benchFront: number
  clipboard: Panel
  screen: Panel
  base: Pad
  keys: Pad[]
  dishes: Record<Element, Spot>
  dishRadius: number
  trash: Spot
  moleculeZ: number
  moleculeX: number
  safeDepth: number
  safeWidth: number
}

export type View = {
  width: number
  height: number
  unit: number
  span: number
  rows: number
  narrow: boolean
  layout: Layout
}

export type Fit = { scale: number; x: number; z: number }
export type Preview = { id: number; x: number; y: number } | null

export const bottles = [
  { height: 0.95, radius: 0.36 },
  { height: 0.78, radius: 0.4 },
  { height: 1.02, radius: 0.32 },
  { height: 0.84, radius: 0.38 },
  { height: 0.92, radius: 0.34 },
]
const BOTTLE_TOP =
  SHELF_Y + Math.max(...bottles.map((b) => b.height + b.radius * 0.55 + 0.4))

/* Screen height (in world units) of a point on the bench plane. */
const screenOf = (y: number, z: number) => y * COS - (z - TARGET_Z) * SIN
/* Bench z of a point at height y that should sit at screen height s. */
const benchZ = (s: number, y = 0) => TARGET_Z + (y * COS - s) / SIN

/* A panel standing on `bottom`, tilted to face the camera. */
function standing(
  x: number,
  w: number,
  h: number,
  bottom: Spot & { y: number },
): Panel {
  return {
    x,
    y: bottom.y + (h / 2) * SIN,
    z: bottom.z - (h / 2) * COS,
    w,
    h,
  }
}

/* World position of a panel's bottom edge centre. Used to draw its stand. */
export function panelFoot(panel: Panel): [number, number, number] {
  return [panel.x, panel.y - (panel.h / 2) * SIN, panel.z + (panel.h / 2) * COS]
}

function layoutFor(
  unit: number,
  span: number,
  rows: number,
  narrow: boolean,
): Layout {
  const px = (n: number) => n / unit
  const top = rows / 2
  const floor = -rows / 2 + 0.35

  const shelfZ = benchZ(top - 0.25, BOTTLE_TOP)
  const shelfFront = screenOf(SHELF_Y, shelfZ + SHELF_DEPTH / 2)

  const frontZ = benchZ(floor)
  const dishRadius = Math.max(0.5, px(22))
  const dishZ = frontZ - dishRadius - 0.05
  const trash = { x: 0, z: frontZ - TRASH.radius - 0.05 }

  const keyDepth = px(KEY_PX) / SIN
  const baseDepth = keyDepth + px(35) / SIN
  const screenH = px(narrow ? 145 : 120)
  const clipH = px(narrow ? (span * unit < 300 ? 270 : 230) : 154)
  const sideGap = narrow ? 0.55 : 1
  const dishC = { x: -span / 2 + sideGap + dishRadius, z: dishZ }
  /* Narrow benches stack the OH dish behind the carbon dish to keep the
   * laptop screen wide enough for a two-line name. */
  const dishO = narrow
    ? { x: dishC.x, z: dishZ - dishRadius * 2 - 0.25 }
    : { x: dishC.x + dishRadius * 2 + 0.3, z: dishZ }
  trash.x = span / 2 - sideGap - TRASH.radius

  const propEdge = narrow ? px(20) : px(24)
  const propWidth = narrow ? (span - propEdge * 2 - px(24)) / 2 : px(210)
  const clipW = propWidth
  const screenW = narrow ? propWidth : px(192)
  const clipX = -span / 2 + propEdge + clipW / 2
  const screenX = span / 2 - propEdge - screenW / 2
  const panelTop = shelfFront - 0.48
  const clipBottom = panelTop - clipH
  const screenFoot = {
    y: BASE_HEIGHT + 0.02,
    z: benchZ(panelTop - screenH, BASE_HEIGHT + 0.02),
  }
  const laptopFront = screenFoot.z + baseDepth

  const clipboard = standing(clipX, clipW, clipH, {
    x: clipX,
    y: 0.05,
    z: benchZ(clipBottom, 0.05),
  })
  const screen = standing(screenX, screenW, screenH, {
    x: screenX,
    ...screenFoot,
  })
  const base: Pad = {
    x: screenX,
    y: BASE_HEIGHT,
    z: screenFoot.z + baseDepth / 2,
    w: screenW + 0.2,
    d: baseDepth,
  }
  const keyW = (base.w - 0.42) / 2
  const keyZ = screenFoot.z + 0.18 + keyDepth / 2
  const keys: Pad[] = [-1, 1].map((side) => ({
    x: screenX + side * (keyW / 2 + 0.07),
    y: BASE_HEIGHT + KEY_HEIGHT,
    z: keyZ,
    w: keyW,
    d: keyDepth,
  }))

  const bandBottom = floor + 1.6
  const bandTop = narrow
    ? Math.min(clipBottom, screenOf(BASE_HEIGHT, laptopFront)) - 0.65
    : shelfFront - 0.5
  const safeDepth = Math.max(1.2, (bandTop - bandBottom) / SIN)
  const moleculeZ = benchZ((bandTop + bandBottom) / 2, BEAD_Y)
  const moleculeLeft = clipX + clipW / 2 + 0.55
  const moleculeRight = screenX - screenW / 2 - 0.55

  return {
    shelfZ,
    benchBack: shelfZ - 1.4,
    benchFront: frontZ + 1.8,
    clipboard,
    screen,
    base,
    keys,
    dishes: { C: dishC, O: dishO },
    dishRadius,
    trash,
    moleculeZ,
    moleculeX: narrow ? 0 : (moleculeLeft + moleculeRight) / 2,
    safeDepth,
    safeWidth: narrow ? span - 1.2 : moleculeRight - moleculeLeft,
  }
}

export function viewFor(width: number, height: number): View {
  const narrow = width < 800
  const minSpan = narrow ? 8.5 : 12
  const minRows = narrow ? 14 : 7.6
  const unit =
    width > 0 && height > 0 ? Math.min(width / minSpan, height / minRows) : 1
  const span = width > 0 ? width / unit : minSpan
  const rows = height > 0 ? height / unit : minRows
  return {
    width,
    height,
    unit,
    span,
    rows,
    narrow,
    layout: layoutFor(unit, span, rows, narrow),
  }
}

export function radiusOf(element: Element) {
  return element === 'C' ? 0.42 : 0.36
}

export function fitMolecule(molecule: Molecule, view: View): Fit {
  const { moleculeX, moleculeZ, safeDepth, safeWidth } = view.layout
  const xs = molecule.atoms.map((a) => a.x)
  const ys = molecule.atoms.map((a) => a.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const width = maxX - minX + 1.7
  const depth = maxY - minY + 1.7
  const scale = Math.min(1, safeWidth / width, safeDepth / depth)
  return {
    scale,
    x: moleculeX - ((minX + maxX) / 2) * scale,
    z: moleculeZ - ((minY + maxY) / 2) * scale,
  }
}

export function atomWorld(atom: Point, fit: Fit): [number, number, number] {
  return [
    atom.x * fit.scale + fit.x,
    BEAD_Y * fit.scale,
    atom.y * fit.scale + fit.z,
  ]
}

export function project(
  [x, y, z]: [number, number, number],
  view: View,
): { left: number; top: number } {
  return {
    left: view.width / 2 + x * view.unit,
    top: view.height / 2 - screenOf(y, z) * view.unit,
  }
}

/* Pixel box covering an upright object of the given radius and height. */
export function standingBox(
  spot: Spot,
  radius: number,
  height: number,
  view: View,
) {
  const at = project([spot.x, height / 2, spot.z], view)
  return {
    left: at.left,
    top: at.top,
    width: radius * 2 * view.unit,
    height: (height * COS + radius * 2 * SIN) * view.unit,
  }
}

export function unproject(
  left: number,
  top: number,
  view: View,
  fit: Fit,
  clamp = true,
): Point {
  const { moleculeX, moleculeZ, safeDepth, safeWidth } = view.layout
  const sx = (left - view.width / 2) / view.unit
  const sy = (view.height / 2 - top) / view.unit
  const y = BEAD_Y * fit.scale
  const edge = Math.max(0.2, safeWidth / 2 - BEAD_Y * fit.scale)
  const reach = safeDepth / 2
  const x = clamp
    ? Math.max(moleculeX - edge, Math.min(moleculeX + edge, sx))
    : sx
  const z = clamp
    ? Math.max(moleculeZ - reach, Math.min(moleculeZ + reach, benchZ(sy, y)))
    : benchZ(sy, y)
  return {
    x: Math.round(((x - fit.x) / fit.scale) * 100) / 100,
    y: Math.round(((z - fit.z) / fit.scale) * 100) / 100,
  }
}

export function shelfSpacing(view: View) {
  return view.span * 0.16
}

export function bottleX(index: number, view: View) {
  return (index - (bottles.length - 1) / 2) * shelfSpacing(view)
}

export function bottleWorld(
  index: number,
  view: View,
): [number, number, number] {
  return [bottleX(index, view), SHELF_Y, view.layout.shelfZ]
}

export function labelWorld(
  index: number,
  view: View,
): [number, number, number] {
  const bottle = bottles[index]
  return [
    bottleX(index, view),
    SHELF_Y + bottle.height * 0.48,
    view.layout.shelfZ + bottle.radius,
  ]
}

export function withPreview(molecule: Molecule, preview: Preview): Molecule {
  if (!preview) return molecule
  return {
    ...molecule,
    atoms: molecule.atoms.map((atom) =>
      atom.id === preview.id ? { ...atom, x: preview.x, y: preview.y } : atom,
    ),
  }
}
