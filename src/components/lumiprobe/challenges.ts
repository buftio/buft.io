import { structureKey, type Molecule } from './molecule.ts'

function structure(elements: string, bonds: [number, number][]): Molecule {
  return {
    atoms: [...elements].map((element, id) => ({
      id,
      element: element as 'C' | 'O',
      x: (id - (elements.length - 1) / 2) * 1.45,
      y: id % 2 ? 0.35 : -0.35,
    })),
    bonds,
  }
}

export const challenges = [
  {
    title: 'Make a connection',
    target: 'ethane',
    prompt: 'Drag beads from the dishes to build the molecule.',
    hint: 'Drop a carbon onto the bead. For taps, select a bead, then tap a dish.',
    goal: structure('CC', [[0, 1]]),
    discovery: 'One extra carbon turns methane into ethane.',
  },
  {
    title: 'A little oxygen',
    target: 'ethanol',
    prompt: '',
    hint: 'Connect two carbons, then attach OH to either end.',
    goal: structure('CCO', [
      [0, 1],
      [1, 2],
    ]),
    discovery: 'The -ol ending tells you there is an alcohol group.',
  },
  {
    title: 'The middle matters',
    target: 'propan-2-ol',
    prompt: '',
    hint: 'Build three carbons in a line. Attach OH to the middle one.',
    goal: structure('CCCO', [
      [0, 1],
      [1, 2],
      [1, 3],
    ]),
    discovery:
      'Same formula as propan-1-ol. Different connections, different molecule.',
  },
  {
    title: 'Take a side road',
    target: '2-methylpropane',
    prompt: '',
    hint: 'Attach three carbons to one central carbon.',
    goal: structure('CCCC', [
      [0, 1],
      [1, 2],
      [1, 3],
    ]),
    discovery:
      'The longest chain has three carbons. The extra carbon is a methyl branch.',
  },
  {
    title: 'Put it together',
    target: '2-methylpropan-1-ol',
    prompt: '',
    hint: 'Join three carbons to one centre. Add OH to a tip.',
    goal: structure('CCCCO', [
      [0, 1],
      [1, 2],
      [1, 3],
      [0, 4],
    ]),
    discovery:
      'A branch and an alcohol group, described by one name. Keep experimenting.',
  },
].map((challenge) => ({ ...challenge, key: structureKey(challenge.goal) }))

export function isUnlocked(task: number, completed: number[]) {
  return (
    Number.isInteger(task) &&
    task >= 0 &&
    task < challenges.length &&
    challenges.slice(0, task).every((_, index) => completed.includes(index))
  )
}
