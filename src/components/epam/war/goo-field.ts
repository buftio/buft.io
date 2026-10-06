import * as THREE from 'three'
import type { War } from './sim'

export function softTexture(war: War) {
  const soft = new THREE.DataTexture(
    new Uint8Array(war.cols * war.rows),
    war.cols,
    war.rows,
    THREE.RedFormat,
  )
  soft.unpackAlignment = 1
  soft.magFilter = THREE.LinearFilter
  soft.minFilter = THREE.LinearFilter
  return soft
}

export function gridTexture(war: War) {
  const data = new Uint8Array(war.cols * war.rows * 4)
  const aux = new THREE.DataTexture(data, war.cols, war.rows, THREE.RGBAFormat)
  aux.magFilter = THREE.LinearFilter
  aux.minFilter = THREE.LinearFilter
  return aux
}

const SIZE = 256
const LATTICE = 32

function lattice(seed: number) {
  let a = seed
  const rand = () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return Float32Array.from({ length: LATTICE * LATTICE }, rand)
}

function smooth(grid: Float32Array, size: number, x: number, y: number) {
  const fx = Math.floor(x)
  const fy = Math.floor(y)
  const tx = x - fx
  const ty = y - fy
  const sx = tx * tx * (3 - 2 * tx)
  const sy = ty * ty * (3 - 2 * ty)
  const at = (u: number, v: number) =>
    grid[((v % size) * LATTICE + (u % size)) % grid.length]
  const top = at(fx, fy) + (at(fx + 1, fy) - at(fx, fy)) * sx
  const bottom = at(fx, fy + 1) + (at(fx + 1, fy + 1) - at(fx, fy + 1)) * sx
  return top + (bottom - top) * sy
}

let noise: Uint8Array | null = null

export function noiseBytes() {
  if (noise) return noise
  const data = new Uint8Array(SIZE * SIZE * 4)
  for (let ch = 0; ch < 4; ch++) {
    const coarse = lattice(11 + ch * 7)
    const fine = lattice(97 + ch * 13)
    for (let y = 0; y < SIZE; y++)
      for (let x = 0; x < SIZE; x++) {
        const u = (x / SIZE) * LATTICE
        const v = (y / SIZE) * LATTICE
        const value =
          smooth(coarse, LATTICE, u, v) * 0.7 +
          smooth(fine, LATTICE, u * 2, v * 2) * 0.3
        data[(y * SIZE + x) * 4 + ch] = Math.round(value * 255)
      }
  }
  noise = data
  return data
}

export function noiseTexture() {
  const texture = new THREE.DataTexture(
    noiseBytes(),
    SIZE,
    SIZE,
    THREE.RGBAFormat,
  )
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.magFilter = THREE.LinearFilter
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.generateMipmaps = true
  texture.needsUpdate = true
  return texture
}
