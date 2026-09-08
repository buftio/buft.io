import { neighbors, validateMolecule, type Molecule } from './molecule.ts'

const roots = ['', 'meth', 'eth', 'prop', 'but', 'pent', 'hex', 'hept', 'oct']
const multiples = [
  '',
  '',
  'di',
  'tri',
  'tetra',
  'penta',
  'hexa',
  'hepta',
  'octa',
]
type Branch = { locant: number; name: string }

function compareNumbers(a: number[], b: number[]) {
  for (let i = 0; i < Math.min(a.length, b.length); i++)
    if (a[i] !== b[i]) return a[i] - b[i]
  return a.length - b.length
}

function prefix(branches: Branch[]) {
  const names = [...new Set(branches.map((b) => b.name))].sort((a, b) =>
    a.replace(/[\d(),-]/g, '').localeCompare(b.replace(/[\d(),-]/g, '')),
  )
  return names
    .map((name) => {
      const locants = branches
        .filter((b) => b.name === name)
        .map((b) => b.locant)
        .sort((a, b) => a - b)
      const complex = /\d/.test(name)
      const count = locants.length
      const multiplier =
        complex && count > 1
          ? ['', '', 'bis', 'tris', 'tetrakis'][count]
          : multiples[count]
      return `${locants.join(',')}-${multiplier || ''}${complex ? `(${name})` : name}`
    })
    .join('-')
}

export function nameMolecule(molecule: Molecule): string | null {
  if (validateMolecule(molecule)) return null
  const carbons = molecule.atoms
    .filter((a) => a.element === 'C')
    .map((a) => a.id)
  const carbonSet = new Set(carbons)
  const adjacent = (id: number) =>
    neighbors(molecule, id).filter((n) => carbonSet.has(n))
  const oxygen = molecule.atoms.find((a) => a.element === 'O')
  const alcohol = oxygen ? neighbors(molecule, oxygen.id)[0] : undefined

  const paths = (start: number, blocked: Set<number>) => {
    const result: number[][] = []
    const walk = (path: number[]) => {
      result.push(path)
      adjacent(path[path.length - 1])
        .filter((n) => !blocked.has(n) && !path.includes(n))
        .forEach((n) => walk([...path, n]))
    }
    walk([start])
    return result
  }

  const branchesFor = (path: number[], blocked: Set<number>): Branch[] => {
    const excluded = new Set([...blocked, ...path])
    return path.flatMap((id, i) =>
      adjacent(id)
        .filter((n) => !excluded.has(n))
        .map((n) => ({ locant: i + 1, name: alkyl(n, excluded) })),
    )
  }

  const choose = (
    candidates: number[][],
    blocked: Set<number>,
    oh?: number,
  ) => {
    const longest = Math.max(...candidates.map((p) => p.length))
    const options = candidates
      .filter((p) => p.length === longest)
      .map((path) => ({ path, branches: branchesFor(path, blocked) }))
    options.sort((a, b) => {
      if (oh !== undefined) {
        const diff = a.path.indexOf(oh) - b.path.indexOf(oh)
        if (diff) return diff
      }
      const count = b.branches.length - a.branches.length
      if (count) return count
      const locants = compareNumbers(
        a.branches.map((s) => s.locant).sort((a, b) => a - b),
        b.branches.map((s) => s.locant).sort((a, b) => a - b),
      )
      if (locants) return locants
      const alphabetical = (items: Branch[]) =>
        [...items]
          .sort((a, b) => a.name.localeCompare(b.name) || a.locant - b.locant)
          .map((s) => s.locant)
      return (
        compareNumbers(alphabetical(a.branches), alphabetical(b.branches)) ||
        prefix(a.branches).localeCompare(prefix(b.branches))
      )
    })
    return options[0]
  }

  function alkyl(root: number, blocked: Set<number>): string {
    const chosen = choose(paths(root, blocked), blocked)
    return `${prefix(chosen.branches)}${roots[chosen.path.length]}yl`
  }

  const candidates = carbons
    .flatMap((id) => paths(id, new Set()))
    .filter((path) => alcohol === undefined || path.includes(alcohol))
  const chosen = choose(candidates, new Set(), alcohol)
  const length = chosen.path.length
  const suffix =
    alcohol === undefined
      ? `${roots[length]}ane`
      : length <= 2
        ? `${roots[length]}anol`
        : `${roots[length]}an-${chosen.path.indexOf(alcohol) + 1}-ol`
  return `${prefix(chosen.branches)}${suffix}`
}
