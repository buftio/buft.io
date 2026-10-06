export type Site = {
  id: string
  name: string
  x: number
  y: number
  story: string
  bio: string
}

const CASTLE_BIO =
  'Castles sit on the darkest small, round purple spots on the slide: places where lymphocytes crowd tightest, most likely lymphoid follicles, where B cells gather and train.'

const FAT_BIO =
  'Fat cells show as empty white rings because slide processing dissolves the fat and leaves only the cell walls. Deposits sit on white patches fully enclosed by tissue; the more white, the richer.'

export const CASTLES: Site[] = [
  {
    id: 'dawnhold',
    name: 'Dawnhold',
    x: 15088,
    y: 18288,
    story:
      'The capital of the Node, and the only castle still lit when you arrive. Its crystal crown is the flame every lighthouse is lit from. The Red Aqueduct fills the moat fountain, the Queen waves from the balcony at anything that moves, and the royal balloon is tied to the tower in case the Blight wins.',
    bio: `A bright purple knot of lymphocytes pressed against a red band of blood cells, with a field of fat to the west. ${CASTLE_BIO}`,
  },
  {
    id: 'fatline-keep',
    name: 'Fatline Keep',
    x: 13136,
    y: 29200,
    story:
      'A border fort on the line where the fat fields meet the purple woods. Its windmill churns lard day and night, and pilgrims on the way to the Ring Well stop for buttered toast and leave with a free bucket of lard they did not ask for.',
    bio: `Sits on the border between the node’s purple lymphoid tissue and the fat outside it, crossed by pink strands of connective tissue that carry small blood vessels. ${CASTLE_BIO}`,
  },
  {
    id: 'bandgate',
    name: 'Bandgate',
    x: 17680,
    y: 39248,
    story:
      'A toll castle built across the long dark ribbon that curls around the south. The keepers lower the drawbridge for every lard caravan, then raise it again, then forget why, and the moat goose has been on duty longer than any of them.',
    bio: `Sits on a dark curving ribbon of packed cells that runs along the edge of the node, with fat on the outside of the curve. ${CASTLE_BIO}`,
  },
  {
    id: 'northmere',
    name: 'Northmere',
    x: 26672,
    y: 6672,
    story:
      'The harbour castle of the north. Fishers sail out on the glass toward the North Atolls and come back with nets of cloud fluff, which the dock crane stacks into a tower nobody has a use for.',
    bio: `A dark spot near the northern rim of the node, where the lymphoid tissue thins out into fat and then into bare glass. ${CASTLE_BIO}`,
  },
  {
    id: 'rimwatch',
    name: 'Rimwatch',
    x: 45168,
    y: 19280,
    story:
      'The easternmost castle, perched on the very edge of the world, where the land stops and the empty glass begins. Its lookout keeps a brass spyglass on the Blight to the north-west and rings the bell at every shadow, including her own.',
    bio: `On the east edge of the tissue; beyond it is bare glass. The ragged pale fringe is where the blade cut through the edge of the node. ${CASTLE_BIO}`,
  },
  {
    id: 'starfold',
    name: 'Starfold',
    x: 39184,
    y: 11248,
    story:
      'The Academy’s observatory. Astronomers turn the great telescope toward the Blight every night and write down how far it crept. They have filled eleven ledgers and named a comet after the head cook.',
    bio: `A dark knot in the lymphoid tissue of the north-east, close to the edge of the node. ${CASTLE_BIO}`,
  },
]

export const DEPOSITS: Site[] = [
  {
    id: 'mother-lode',
    name: 'The Mother Lode',
    x: 18480,
    y: 32528,
    story:
      'The richest seep in the Node, right under the Honeycomb Queen’s bed. The bees sip it straight from the source, and the Lardwrights say a bucket from here can light a lighthouse for a week.',
    bio: `The biggest lake of fat inside the node, ringed by lymphoid tissue. Fat often creeps into lymph nodes with age. ${FAT_BIO}`,
  },
  {
    id: 'bazaar-spring',
    name: 'Bazaar Spring',
    x: 25104,
    y: 16784,
    story:
      'A spring in the middle of the market. A stall sells the fat by the bubble, and the merchant swears every bubble is a different flavour. They are all the same flavour.',
    bio: `An island of fat cells inside the lymphoid tissue, with lymphocytes packed into the walls between them. ${FAT_BIO}`,
  },
  {
    id: 'first-well',
    name: 'The First Well',
    x: 12368,
    y: 19408,
    story:
      'The well that fed Dawnhold before anyone had heard of the Blight. The windlass still creaks, the bucket still drips, and the well-keeper still tells everyone it is the original rope. It is not.',
    bio: `Fat between the red blood-cell bands west of the capital, just outside the node. ${FAT_BIO}`,
  },
  {
    id: 'lantern-pool',
    name: 'Lantern Pool',
    x: 6672,
    y: 21808,
    story:
      'The night fishers moor here between shifts. Their lanterns hang over the gold so it glows twice, and one boat has been "leaving in a minute" since spring.',
    bio: `Thin, loose fat at the far west edge of the tissue, with stray red blood cells between the cells. ${FAT_BIO}`,
  },
  {
    id: 'millrace-pond',
    name: 'Millrace Pond',
    x: 15856,
    y: 24848,
    story:
      'The Millers dug a race from the Red Aqueduct to this pond, and the wheel turns so fast it churns the fat into butter before it reaches the bucket. Nobody complains.',
    bio: `A strip of fat beside the lymphoid tissue, with small blood vessels running past it. ${FAT_BIO}`,
  },
  {
    id: 'hermits-tarn',
    name: 'Hermit’s Tarn',
    x: 13392,
    y: 12368,
    story:
      'A hermit lives here and fishes the gold with a stick and string. He has never caught anything, which he says is the point. His chimney is the only smoke for miles.',
    bio: `Loose fat with thin fibrous strands far to the north-west, outside the node. ${FAT_BIO}`,
  },
  {
    id: 'rib-pool',
    name: 'Rib Pool',
    x: 9456,
    y: 39344,
    story:
      'The fat pooled under the ribs of a second, smaller whale, which the museum next door refuses to talk about. Kids climb the bones and dare each other to touch the gold.',
    bio: `Fat beside a long fibrous band in the far south-west. ${FAT_BIO}`,
  },
  {
    id: 'last-drip',
    name: 'The Last Drip',
    x: 17808,
    y: 8080,
    story:
      'The poorest seep on the map. One prospector camps here anyway, sure that the mother lode is just under the next shovel. The campfire is warmer than the fat is rich.',
    bio: `A thin patch of fat between fibrous strands at the north edge of the tissue. ${FAT_BIO}`,
  },
]

const TUMOR_BIO =
  'Outlined by a pathologist as breast-cancer metastasis in a sentinel lymph node (CAMELYON16). Cancer cells grow in tight sheets with big, pale nuclei and push the small dark lymphocytes aside.'

export const TUMORS: Omit<Site, 'x' | 'y'>[] = [
  {
    id: 'sprawl',
    name: 'The Sprawl',
    story:
      'It spreads like spilled soup, slowly and in every direction at once. It has already eaten two villages and a signpost that read NOT THIS WAY.',
    bio: `${TUMOR_BIO} About 1.3 × 1.0 mm (0.66 mm²); a deposit this size counts as a micrometastasis (0.2 to 2 mm).`,
  },
  {
    id: 'spawn',
    name: 'The Spawn',
    story:
      'A bud that broke off the Sprawl and wandered south on its own. Small, hungry, and very proud of itself.',
    bio: `${TUMOR_BIO} A small satellite just south of the Sprawl, about 0.31 × 0.13 mm (0.016 mm²): still above the 0.2 mm micrometastasis cutoff.`,
  },
  {
    id: 'maw',
    name: 'The Maw',
    story:
      'The biggest Blight in the Node. Its rim keeps opening and closing as if it is chewing, and the Folk of Old Town can hear it from their beds.',
    bio: `${TUMOR_BIO} The largest region on the slide, about 1.3 × 1.4 mm (1.02 mm²): a micrometastasis, close to the 2 mm line where it would become a macrometastasis.`,
  },
  {
    id: 'coil',
    name: 'The Coil',
    story:
      'It curls toward the Serpent Coast, and Granny Coil has started sleeping with one eye open.',
    bio: `${TUMOR_BIO} About 0.84 × 1.1 mm (0.54 mm²): a micrometastasis.`,
  },
  {
    id: 'tick',
    name: 'The Tick',
    story:
      'A speck stuck to the side of the Coil. Easy to miss, and that is exactly how it likes it.',
    bio: `${TUMOR_BIO} Only about 0.13 × 0.17 mm (0.007 mm²). Under 0.2 mm, pathologists call this isolated tumour cells; it is still worth finding, because small ones are the easiest to miss.`,
  },
  {
    id: 'lurker',
    name: 'The Lurker',
    story:
      'It sits quietly in the north-east, close to the Academy and the Star Moat, and grows when nobody is watching.',
    bio: `${TUMOR_BIO} About 0.61 × 0.69 mm (0.22 mm²): a micrometastasis.`,
  },
]

export const siteAt = <T extends { x: number; y: number }>(
  list: Site[],
  p: T,
  reach = 1500,
) => list.find((s) => Math.hypot(s.x - p.x, s.y - p.y) < reach) ?? null
