import { MeshStandardMaterial } from 'three'

export const tones = {
  bench: '#f4eadf',
  apron: '#d8cbe6',
  shelf: '#cdbfe0',
  carbon: '#3b3540',
  oxygen: '#c8553d',
  hydrogen: '#f7f0e6',
  bond: '#e6dbd0',
  ring: '#8f7bb8',
  label: '#f8f2ea',
  glass: '#dfe6e8',
  paper: '#efe6d8',
  dish: '#e9e2ef',
  dishWell: '#d9d0e3',
  tin: '#9aa0ad',
  tinDark: '#6f7582',
  shell: '#4a4450',
  screen: '#dfe9e6',
  screenLit: '#fff1bf',
  key: '#f3ede6',
  board: '#a5764f',
  clip: '#5c5563',
  glow: '#ffe6a3',
}

export const glowMaterial = new MeshStandardMaterial({
  color: tones.glow,
  emissive: '#ffd27a',
  emissiveIntensity: 0.55,
  roughness: 0.9,
})
