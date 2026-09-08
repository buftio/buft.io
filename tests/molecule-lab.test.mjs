import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  challenges,
  isUnlocked,
} from '../src/components/lumiprobe/challenges.ts'
import { nameMolecule } from '../src/components/lumiprobe/naming.ts'
import {
  addAtom,
  attachmentError,
  initialMolecule,
  molecularFormula,
  reconnectAtom,
  removeAtom,
  structureKey,
  toSmiles,
  validateMolecule,
} from '../src/components/lumiprobe/molecule.ts'

const molecule = (elements, bonds) => ({
  atoms: [...elements].map((element, id) => ({ id, element, x: id, y: 0 })),
  bonds,
})
const butane = molecule('CCCC', [
  [0, 1],
  [1, 2],
  [2, 3],
])

test('bottles unlock in order, and replay never skips an unfinished puzzle', () => {
  assert.deepEqual(
    challenges.map((_, index) => isUnlocked(index, [])),
    [true, false, false, false, false],
  )
  assert.deepEqual(
    challenges.map((_, index) => isUnlocked(index, [0, 1])),
    [true, true, true, false, false],
  )
  assert.equal(isUnlocked(3, [0, 2]), false)
  assert.equal(isUnlocked(1, [1, 2, 3, 4]), false)
  for (const index of [-1, 5, 1.5, NaN])
    assert.equal(isUnlocked(index, [0, 1, 2, 3, 4]), false)
  assert.ok(challenges.every((_, index) => isUnlocked(index, [0, 1, 2, 3, 4])))
})

test('five puzzles use structural goals and produce the stated chemical names', () => {
  for (const challenge of challenges) {
    assert.equal(nameMolecule(challenge.goal), challenge.target)
    assert.notEqual(structureKey(initialMolecule()), challenge.key)
  }
})

test('naming handles free builds, alphabetical branches, repeated groups and complex alkyl substituents', () => {
  const examples = [
    [
      molecule('CCCC', [
        [0, 1],
        [0, 2],
        [0, 3],
      ]),
      '2-methylpropane',
      'C4H10',
    ],
    [
      molecule('CCCCCC', [
        [0, 1],
        [1, 2],
        [2, 3],
        [1, 4],
        [2, 5],
      ]),
      '2,3-dimethylbutane',
      'C6H14',
    ],
    [
      molecule('CCCCCCCC', [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [1, 5],
        [2, 6],
        [6, 7],
      ]),
      '3-ethyl-2-methylpentane',
      'C8H18',
    ],
    [
      molecule('CCCO', [
        [0, 1],
        [1, 2],
        [2, 3],
      ]),
      'propan-1-ol',
      'C3H8O',
    ],
    [
      molecule('CCCO', [
        [0, 1],
        [1, 2],
        [1, 3],
      ]),
      'propan-2-ol',
      'C3H8O',
    ],
    [
      molecule('CCCCCCCCO', [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [1, 5],
        [5, 6],
        [5, 7],
        [0, 8],
      ]),
      '2-(1-methylethyl)pentan-1-ol',
      'C8H18O',
    ],
  ]
  for (const [graph, name, formula] of examples) {
    assert.equal(nameMolecule(graph), name)
    assert.equal(molecularFormula(graph), formula)
  }
})

test('name, structural identity and SMILES ignore drawing positions, atom IDs and insertion order', () => {
  for (const { goal } of challenges) {
    const rearranged = {
      atoms: [...goal.atoms]
        .reverse()
        .map((a) => ({ ...a, id: 97 - a.id, x: -a.x, y: 12 })),
      bonds: [...goal.bonds].reverse().map(([a, b]) => [97 - b, 97 - a]),
    }
    assert.equal(nameMolecule(rearranged), nameMolecule(goal))
    assert.equal(structureKey(rearranged), structureKey(goal))
    assert.equal(toSmiles(rearranged), toSmiles(goal))
  }
  assert.notEqual(structureKey(butane), structureKey(challenges[3].goal))
  assert.equal(molecularFormula(butane), molecularFormula(challenges[3].goal))
})

test('invalid or unsupported graphs never receive a made-up name or SMILES', () => {
  const invalid = [
    molecule('CC', []),
    molecule('CCC', [
      [0, 1],
      [1, 2],
      [2, 0],
    ]),
    molecule('CCO', [
      [0, 2],
      [1, 2],
    ]),
    molecule('CCCCCC', [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
      [0, 5],
    ]),
    molecule('CC', [
      [0, 1],
      [1, 0],
    ]),
    molecule('COO', [
      [0, 1],
      [0, 2],
    ]),
  ]
  for (const graph of invalid) {
    assert.ok(validateMolecule(graph))
    assert.equal(nameMolecule(graph), null)
    assert.equal(toSmiles(graph), '')
  }
})

test('moving an end atom changes connectivity while preserving all atoms and preventing rings', () => {
  const chain = butane
  const branch = reconnectAtom(chain, 3, 1)
  assert.equal(nameMolecule(branch), '2-methylpropane')
  assert.equal(branch.atoms.length, chain.atoms.length)
  assert.equal(reconnectAtom(branch, 1, 0), branch)
  assert.equal(removeAtom(branch, 1), branch)
  assert.equal(nameMolecule(removeAtom(branch, 3)), 'propane')
})

test('the kit enforces atom and bond limits when adding', () => {
  const methanol = addAtom(initialMolecule(), 0, 'O')
  assert.equal(removeAtom(methanol, 0), methanol)
  assert.equal(nameMolecule(removeAtom(methanol, 1)), 'methane')
  let graph = initialMolecule()
  for (let id = 0; id < 7; id++) graph = addAtom(graph, id, 'C')
  assert.ok(attachmentError(graph, 7, 'C'))
  assert.equal(addAtom(graph, 7, 'C'), graph)
  graph = addAtom(graph, 7, 'O')
  assert.equal(nameMolecule(graph), 'octan-1-ol')
  assert.ok(attachmentError(graph, 0, 'O'))
  assert.ok(attachmentError(graph, 8, 'C'))
})
