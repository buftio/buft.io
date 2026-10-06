import type { Squad, War } from './sim'

export const GUARD = 0
export const LARD = 1
export const GOOSE = 2
export const NET = 3
export const BELL = 4
export const STAR = 5
export const STATES = 4

export type Kind = {
  castle: string
  name: string
  cell: string
  power: string
  bio: string
  skin: string
}

export const KINDS: Kind[] = [
  {
    castle: 'dawnhold',
    name: 'Crown Guard',
    cell: 'killer T cell',
    power: 'The steady line: helm, spear and shield.',
    bio: 'Killer T cells check every cell they pass, and when one shows the wrong marks they order it to die. Cancer survives by hiding those marks.',
    skin: '#6a4fd0',
  },
  {
    castle: 'fatline-keep',
    name: 'Lard Slingers',
    cell: 'macrophage',
    power: 'Big eaters: their towers clear goo faster.',
    bio: 'Macrophage means "big eater". They swallow dead cells and debris whole, and they love fat: in fatty tissue they swell into foamy, lard-filled cells.',
    skin: '#d0823a',
  },
  {
    castle: 'bandgate',
    name: 'Goose Wardens',
    cell: 'plasma cell',
    power: 'Antibody bolts: goo creeps slower around their towers.',
    bio: 'Plasma cells are B cells that finished their training in follicles like this one. Each fires thousands of Y-shaped antibodies a second that stick to a target and flag it.',
    skin: '#3d8fd6',
  },
  {
    castle: 'northmere',
    name: 'Net-casters',
    cell: 'neutrophil',
    power: 'Wide nets: their towers reach further.',
    bio: 'Neutrophils throw out sticky nets of their own DNA to trap invaders, called NETs. The awkward part: in real tumors, cancer cells can hitch a ride on those nets and spread.',
    skin: '#23a58c',
  },
  {
    castle: 'rimwatch',
    name: 'Bell-ringers',
    cell: 'dendritic cell',
    power: 'Lookouts: their towers see further and strike earlier.',
    bio: 'Dendritic cells are the scouts. Their branches sample everything nearby, then they travel to a lymph node and show the T cells what they found.',
    skin: '#d4506e',
  },
  {
    castle: 'starfold',
    name: 'Star-gazers',
    cell: 'natural killer cell',
    power:
      'Comets: every 20 s each tower calls one onto the thickest goo in reach.',
    bio: 'Natural killer cells need no training. They strike any cell that looks stressed or has hidden its marks, which is exactly the trick that lets cancer slip past T cells.',
    skin: '#4652c4',
  },
]

const MORE_ATTACK = 1
const MORE_GUARD = 0.5
const MORE_REACH = 0.35
const MORE_SIGHT = 0.5
export const COMET = 20

export const dress = (state: number, kind: number) => state + kind * STATES

export const share = (s: Squad, kind: number) =>
  s.crew > 0 ? s.mix[kind] / s.crew : 0

export const attack = (s: Squad) => 1 + MORE_ATTACK * share(s, LARD)
export const guarding = (s: Squad) => 1 + MORE_GUARD * share(s, GOOSE)
export const widen = (s: Squad) => 1 + MORE_REACH * share(s, NET)
export const sight = (s: Squad) => MORE_SIGHT * share(s, BELL)

export function recruit(war: War, s: Squad, n: number) {
  const lit = war.castles.filter((c) => c.lit)
  for (let k = 0; k < n; k++) {
    const from = lit[Math.floor(Math.random() * lit.length)]
    s.mix[from?.kind ?? GUARD]++
  }
  s.crew += n
}

export function lose(s: Squad) {
  let pick = Math.random() * s.crew
  for (let k = 0; k < s.mix.length; k++) {
    pick -= s.mix[k]
    if (pick < 0 && s.mix[k] > 0) {
      s.mix[k]--
      break
    }
  }
  s.crew--
}
