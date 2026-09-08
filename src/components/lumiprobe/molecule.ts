export type Element = 'C' | 'O'
export type Atom = { id: number; element: Element; x: number; y: number }
export type Molecule = { atoms: Atom[]; bonds: [number, number][] }
export const MAX_CARBONS = 8
export const initialMolecule = (): Molecule => ({
  atoms: [{ id: 0, element: 'C', x: 0, y: 0 }],
  bonds: [],
})

export function neighbors(molecule: Molecule, id: number) {
  return molecule.bonds.flatMap(([a, b]) =>
    a === id ? [b] : b === id ? [a] : [],
  )
}

export function attachmentError(
  molecule: Molecule,
  parent: number,
  element: Element,
) {
  const atom = molecule.atoms.find((a) => a.id === parent)
  if (!atom || atom.element !== 'C') return 'Attach to a carbon atom.'
  if (neighbors(molecule, parent).length >= 4)
    return 'This carbon already has four bonds. Try another one.'
  if (
    element === 'C' &&
    molecule.atoms.filter((a) => a.element === 'C').length >= MAX_CARBONS
  )
    return 'Eight carbons fill this workbench. Remove one to try a different shape.'
  if (element === 'O' && molecule.atoms.some((a) => a.element === 'O'))
    return 'This kit has one oxygen. Move the one already on your molecule.'
  return null
}

export function addAtom(
  molecule: Molecule,
  parent: number,
  element: Element,
  point?: { x: number; y: number },
): Molecule {
  if (attachmentError(molecule, parent, element)) return molecule
  const anchor = molecule.atoms.find((a) => a.id === parent)!
  const angles = Array.from(
    { length: 12 },
    (_, i) => Math.PI / 6 + (i * Math.PI) / 6,
  )
  const candidates = angles.map((angle) => ({
    x: anchor.x + Math.cos(angle) * 1.45,
    y: anchor.y + Math.sin(angle) * 1.45,
  }))
  const distance = (p: { x: number; y: number }) =>
    Math.min(...molecule.atoms.map((a) => Math.hypot(a.x - p.x, a.y - p.y)))
  candidates.sort((a, b) => distance(b) - distance(a))
  const position = point ?? candidates[0]
  const id = Math.max(...molecule.atoms.map((a) => a.id)) + 1
  return {
    atoms: [...molecule.atoms, { id, element, ...position }],
    bonds: [...molecule.bonds, [parent, id]],
  }
}

export function moveAtom(
  molecule: Molecule,
  id: number,
  x: number,
  y: number,
): Molecule {
  return {
    ...molecule,
    atoms: molecule.atoms.map((a) => (a.id === id ? { ...a, x, y } : a)),
  }
}

export function canRemoveAtom(molecule: Molecule, id: number) {
  return (
    molecule.atoms.some((a) => a.id === id) &&
    molecule.atoms.some((a) => a.element === 'C' && a.id !== id) &&
    neighbors(molecule, id).length <= 1
  )
}

export function removeAtom(molecule: Molecule, id: number): Molecule {
  if (!canRemoveAtom(molecule, id)) return molecule
  return {
    atoms: molecule.atoms.filter((a) => a.id !== id),
    bonds: molecule.bonds.filter((b) => !b.includes(id)),
  }
}

export function reconnectAtom(
  molecule: Molecule,
  id: number,
  parent: number,
): Molecule {
  const atom = molecule.atoms.find((a) => a.id === id)
  if (
    !atom ||
    id === parent ||
    neighbors(molecule, id).length !== 1 ||
    neighbors(molecule, id).includes(parent)
  )
    return molecule
  const rest = removeAtom(molecule, id)
  if (attachmentError(rest, parent, atom.element)) return molecule
  return { atoms: molecule.atoms, bonds: [...rest.bonds, [parent, id]] }
}

export function validateMolecule(molecule: Molecule): string | null {
  const { atoms, bonds } = molecule
  if (!atoms.length) return 'Add a carbon to start.'
  const ids = new Set(atoms.map((a) => a.id))
  if (
    ids.size !== atoms.length ||
    atoms.some((a) => !['C', 'O'].includes(a.element))
  )
    return 'This structure is outside this kit.'
  if (
    atoms.filter((a) => a.element === 'C').length > MAX_CARBONS ||
    atoms.filter((a) => a.element === 'O').length > 1
  )
    return 'Use up to eight carbons and one oxygen.'
  if (bonds.some(([a, b]) => a === b || !ids.has(a) || !ids.has(b)))
    return 'Check the connections.'
  if (
    new Set(bonds.map((b) => [...b].sort((a, b) => a - b).join(':'))).size !==
    bonds.length
  )
    return 'Use one bond between atoms.'
  if (
    atoms.some(
      (a) => neighbors(molecule, a.id).length > (a.element === 'C' ? 4 : 1),
    )
  )
    return 'Carbon has four bonds. The oxygen in this kit makes an OH group.'
  const visited = new Set<number>()
  const visit = (id: number) => {
    if (visited.has(id)) return
    visited.add(id)
    neighbors(molecule, id).forEach(visit)
  }
  visit(atoms[0].id)
  if (visited.size !== atoms.length)
    return 'Connect all the atoms into one molecule.'
  if (bonds.length !== atoms.length - 1)
    return 'Keep this molecule open. Rings belong to another kit.'
  if (!atoms.some((a) => a.element === 'C')) return 'Start with a carbon atom.'
  return null
}

export function structureKey(molecule: Molecule): string {
  if (validateMolecule(molecule)) return ''
  const visit = (id: number, parent = -1): string =>
    molecule.atoms.find((a) => a.id === id)!.element +
    '(' +
    neighbors(molecule, id)
      .filter((n) => n !== parent)
      .map((n) => visit(n, id))
      .sort()
      .join('') +
    ')'
  return molecule.atoms.map((a) => visit(a.id)).sort()[0]
}

export function toSmiles(molecule: Molecule): string {
  if (validateMolecule(molecule)) return ''
  const visit = (id: number, parent = -1): string => {
    const branches = neighbors(molecule, id)
      .filter((n) => n !== parent)
      .map((n) => visit(n, id))
      .sort()
    return (
      molecule.atoms.find((a) => a.id === id)!.element +
      branches.map((s, i) => (i < branches.length - 1 ? `(${s})` : s)).join('')
    )
  }
  return molecule.atoms
    .map((a) => visit(a.id))
    .sort((a, b) => a.length - b.length || a.localeCompare(b))[0]
}

export function molecularFormula(molecule: Molecule) {
  if (validateMolecule(molecule)) return ''
  const carbon = molecule.atoms.filter((a) => a.element === 'C').length
  const oxygen = molecule.atoms.length - carbon
  const hydrogen = molecule.atoms.reduce(
    (sum, a) =>
      sum + (a.element === 'C' ? 4 : 2) - neighbors(molecule, a.id).length,
    0,
  )
  return `C${carbon > 1 ? carbon : ''}H${hydrogen}${oxygen ? 'O' : ''}`
}
