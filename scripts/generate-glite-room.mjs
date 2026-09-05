import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { writeFileSync } from 'node:fs'

globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((b) => {
      this.result = b
      this.onloadend?.()
    })
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((b) => {
      this.result = `data:${blob.type};base64,${Buffer.from(b).toString('base64')}`
      this.onloadend?.()
    })
  }
}

const C = {
  wall: '#8fc7bf',
  wallDeep: '#6fa9a3',
  floor: '#f2c8a6',
  rug: '#e4a98a',
  terracotta: '#c8694b',
  wood: '#a97a52',
  woodDark: '#8a5e3c',
  cream: '#f8efe4',
  dark: '#3a3036',
  leaf: '#6fae76',
  leafDark: '#4f8f5c',
  skin: '#f2b892',
  shirt: '#e98f6b',
  hair: '#4a3328',
  tutor: '#5cb6c4',
  tutorLight: '#a9e0e6',
  lampShade: '#f4b183',
  bulb: '#ffd08a',
  book1: '#d9775f',
  book2: '#5aa3b0',
  book3: '#f0c96b',
  coffee: '#6b4a34',
  white: '#ffffff',
}
const mats = {}
const mat = (name, extra = {}) => {
  const key = name + JSON.stringify(extra)
  if (!mats[key]) {
    mats[key] = new THREE.MeshStandardMaterial({
      color: new THREE.Color(C[name]),
      roughness: 0.88,
      metalness: 0,
      ...extra,
    })
    mats[key].name = name
  }
  return mats[key]
}

const geos = new Map()
const cached = (key, make) => {
  if (!geos.has(key)) {
    const g = make()
    g.deleteAttribute('uv')
    geos.set(key, g)
  }
  return geos.get(key)
}
const rbox = (w, h, d, r = 0.04, seg = 2) =>
  cached(
    `rbox${[w, h, d, r, seg]}`,
    () => new RoundedBoxGeometry(w, h, d, seg, r),
  )
const sphere = (r, ws = 16, hs = 12) =>
  cached(`sph${[r, ws, hs]}`, () => new THREE.SphereGeometry(r, ws, hs))
const capsule = (r, l, cs = 4, rs = 14) =>
  cached(`cap${[r, l, cs, rs]}`, () => new THREE.CapsuleGeometry(r, l, cs, rs))
const cyl = (rt, rb, h, rs = 20, open = false) =>
  cached(
    `cyl${[rt, rb, h, rs, open]}`,
    () => new THREE.CylinderGeometry(rt, rb, h, rs, 1, open),
  )
const torus = (r, t) =>
  cached(`tor${[r, t]}`, () => new THREE.TorusGeometry(r, t, 7, 18))
const stripUV = (g) => {
  g.deleteAttribute('uv')
  return g
}

const add = (parent, geo, m, [x, y, z] = [0, 0, 0], name, opts = {}) => {
  const mesh = new THREE.Mesh(geo, m)
  mesh.position.set(x, y, z)
  if (opts.rot) mesh.rotation.set(...opts.rot)
  if (opts.scale) mesh.scale.set(...opts.scale)
  if (name) mesh.name = name
  parent.add(mesh)
  return mesh
}
const group = (parent, name, [x, y, z] = [0, 0, 0], rotY = 0) => {
  const g = new THREE.Group()
  g.name = name
  g.position.set(x, y, z)
  g.rotation.y = rotY
  parent.add(g)
  return g
}

const scene = new THREE.Scene()
scene.name = 'GliteRoom'
const room = group(scene, 'Room')

add(room, rbox(4.6, 0.22, 3.8, 0.06), mat('floor'), [0, -0.11, -0.3], 'Floor')
add(room, cyl(1.25, 1.25, 0.03, 32), mat('rug'), [0, 0.015, 0], 'Rug')
add(room, cyl(0.95, 0.95, 0.032, 32), mat('floor'), [0, 0.016, 0], 'RugInner')

const wallShape = new THREE.Shape()
wallShape.moveTo(-2.3, 0)
wallShape.lineTo(2.3, 0)
wallShape.lineTo(2.3, 2.7)
wallShape.lineTo(-2.3, 2.7)
wallShape.closePath()
const arch = new THREE.Path()
arch.moveTo(-0.62, 0)
arch.lineTo(-0.62, 1.25)
arch.absarc(0, 1.25, 0.62, Math.PI, 0, true)
arch.lineTo(0.62, 0)
arch.closePath()
wallShape.holes.push(arch)
const backWallGeo = stripUV(
  new THREE.ExtrudeGeometry(wallShape, {
    depth: 0.2,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
    curveSegments: 16,
  }),
)
add(room, backWallGeo, mat('wall'), [0, 0, -2.1], 'BackWall')
add(
  room,
  rbox(1.9, 2.4, 0.08, 0.03),
  mat('cream'),
  [0, 1.2, -2.45],
  'ArchBackdrop',
)
add(room, sphere(0.35, 12, 8), mat('wallDeep'), [0, 1.85, -2.35], 'ArchMoon', {
  scale: [1, 1, 0.35],
})
add(
  room,
  rbox(0.2, 2.7, 3.8, 0.04),
  mat('wall'),
  [-2.3, 1.35, -0.3],
  'SideWall',
)
add(
  room,
  rbox(0.06, 0.28, 3.8, 0.02),
  mat('cream'),
  [-2.18, 0.14, -0.3],
  'Skirting',
)
add(
  room,
  rbox(4.6, 0.28, 0.06, 0.02),
  mat('cream'),
  [0, 0.14, -1.97],
  'SkirtingBack',
)

add(
  room,
  rbox(0.3, 0.05, 1.1, 0.015),
  mat('wood'),
  [-2.03, 1.55, -0.9],
  'Shelf',
)
const bookColors = ['book1', 'book2', 'book3', 'terracotta', 'book2']
bookColors.forEach((c, i) => {
  add(
    room,
    rbox(0.2, 0.28 + (i % 2) * 0.05, 0.06, 0.01),
    mat(c),
    [-2.03, 1.72 + (i % 2) * 0.025, -1.3 + i * 0.085],
    `ShelfBook${i}`,
    { rot: [0, 0, i === 4 ? 0.25 : 0] },
  )
})
add(
  room,
  cyl(0.09, 0.07, 0.14, 18),
  mat('terracotta'),
  [-2.03, 1.65, -0.55],
  'ShelfPot',
)
;[
  [0, 0.1, 0],
  [-0.07, 0.06, 0.05],
  [0.06, 0.05, -0.06],
  [0.02, 0.03, 0.08],
].forEach((p, i) =>
  add(
    room,
    sphere(0.07, 12, 8),
    mat(i % 2 ? 'leafDark' : 'leaf'),
    [-2.03 + p[0], 1.78 + p[1], -0.55 + p[2]],
    `ShelfLeaf${i}`,
    { scale: [1, 0.8, 1] },
  ),
)

const plant = group(room, 'Plant', [-1.55, 0, -1.45])
add(
  plant,
  cyl(0.24, 0.19, 0.36, 20),
  mat('terracotta'),
  [0, 0.18, 0],
  'PlantPot',
)
add(plant, cyl(0.2, 0.2, 0.03, 20), mat('dark'), [0, 0.355, 0], 'PlantSoil')
add(plant, cyl(0.02, 0.025, 0.5, 8), mat('leafDark'), [0, 0.6, 0], 'PlantStem')
;[
  [0, 0.98, 0, 0.26],
  [-0.22, 0.78, 0.1, 0.2],
  [0.2, 0.82, -0.12, 0.21],
  [0.05, 0.72, 0.24, 0.18],
  [-0.1, 0.65, -0.22, 0.17],
].forEach(([x, y, z, r], i) =>
  add(
    plant,
    sphere(r, 16, 12),
    mat(i % 2 ? 'leafDark' : 'leaf'),
    [x, y, z],
    `PlantLeaf${i}`,
    {
      scale: [1.15, 0.8, 1],
    },
  ),
)

const lamp = group(room, 'Lamp', [1.65, 0, -1.35])
add(lamp, cyl(0.2, 0.22, 0.05, 22), mat('woodDark'), [0, 0.025, 0], 'LampBase')
add(lamp, cyl(0.025, 0.025, 1.6, 12), mat('woodDark'), [0, 0.85, 0], 'LampPole')
add(
  lamp,
  cyl(0.2, 0.32, 0.36, 22, true),
  new THREE.MeshStandardMaterial({
    color: new THREE.Color(C.lampShade),
    roughness: 0.9,
    side: THREE.DoubleSide,
    name: 'lampShade',
  }),
  [0, 1.78, 0],
  'LampShade',
)
add(
  lamp,
  sphere(0.08, 16, 12),
  new THREE.MeshStandardMaterial({
    color: new THREE.Color(C.bulb),
    emissive: new THREE.Color(C.bulb),
    emissiveIntensity: 2.2,
    roughness: 0.5,
    name: 'bulb',
  }),
  [0, 1.7, 0],
  'LampBulb',
)
const light = new THREE.PointLight(new THREE.Color('#ffb060'), 6, 6, 2)
light.name = 'LampLight'
light.position.set(0, 1.62, 0)
lamp.add(light)

const stack = group(room, 'BookStack', [1.45, 0, 0.45])
;['book2', 'book3', 'book1'].forEach((c, i) =>
  add(
    stack,
    rbox(0.34, 0.06, 0.26, 0.012),
    mat(c),
    [i * 0.02, 0.03 + i * 0.062, -i * 0.015],
    `FloorBook${i}`,
    { rot: [0, i * 0.18, 0] },
  ),
)
add(stack, cyl(0.075, 0.06, 0.1, 18), mat('cream'), [0.02, 0.24, 0], 'StackCup')

const table = group(room, 'Table', [0, 0, 0])
add(
  table,
  cyl(0.3, 0.34, 0.05, 22),
  mat('woodDark'),
  [0, 0.025, 0],
  'TableBase',
)
add(table, cyl(0.07, 0.07, 0.62, 16), mat('wood'), [0, 0.36, 0], 'TableStem')
add(table, cyl(0.62, 0.6, 0.07, 32), mat('wood'), [0, 0.7, 0], 'TableTop')
const cup = (parent, name, [x, z], rotY, _fill) => {
  const g = group(parent, name, [x, 0.735, z], rotY)
  add(g, cyl(0.075, 0.06, 0.11, 20), mat('cream'), [0, 0.055, 0], name + 'Body')
  add(
    g,
    cyl(0.062, 0.062, 0.01, 20),
    mat('coffee'),
    [0, 0.105, 0],
    name + 'Coffee',
  )
  add(
    g,
    torus(0.045, 0.014),
    mat('cream'),
    [0.085, 0.055, 0],
    name + 'Handle',
    { rot: [0, 0, 0] },
  )
  add(
    g,
    cyl(0.1, 0.1, 0.01, 20),
    mat('terracotta'),
    [0, 0.005, 0],
    name + 'Saucer',
  )
}
cup(table, 'CupA', [-0.2, 0.3], 0.9)
cup(table, 'CupB', [0.22, -0.28], -2.1)
add(
  table,
  rbox(0.3, 0.035, 0.22, 0.01),
  mat('book2'),
  [0.32, 0.75, 0.08],
  'TableNotebook',
  {
    rot: [0, -0.9, 0],
  },
)
add(
  table,
  rbox(0.25, 0.012, 0.18, 0.005),
  mat('cream'),
  [0.32, 0.775, 0.08],
  'TableNotebookPage',
  {
    rot: [0, -0.9, 0],
  },
)

const stool = (parent, name, pos) => {
  const g = group(parent, name, pos)
  add(g, cyl(0.24, 0.26, 0.07, 22), mat('woodDark'), [0, 0.4, 0], name + 'Seat')
  add(
    g,
    cyl(0.05, 0.05, 0.37, 12),
    mat('woodDark'),
    [0, 0.185, 0],
    name + 'Leg',
  )
  add(g, cyl(0.2, 0.22, 0.04, 22), mat('woodDark'), [0, 0.02, 0], name + 'Foot')
}

const learnerPos = [-0.5, 0, 0.82]
const tutorPos = [0.5, 0, -0.82]
const camDir = new THREE.Vector3(5, 0, 6).normalize()
const faceYaw = (from, to, toward) =>
  Math.atan2(
    to[0] + camDir.x * toward - from[0],
    to[2] + camDir.z * toward - from[2],
  )
stool(room, 'StoolA', learnerPos)
stool(room, 'StoolB', tutorPos)

const learner = group(
  scene,
  'Learner',
  learnerPos,
  faceYaw(learnerPos, tutorPos, 0.9),
)
add(
  learner,
  capsule(0.24, 0.3, 4, 16),
  mat('shirt'),
  [0, 0.72, 0],
  'LearnerBody',
  {
    scale: [1, 1, 0.85],
  },
)
add(
  learner,
  capsule(0.09, 0.28, 3, 10),
  mat('dark'),
  [-0.14, 0.32, 0.18],
  'LearnerLegL',
  {
    rot: [1.35, 0, 0],
  },
)
add(
  learner,
  capsule(0.09, 0.28, 3, 10),
  mat('dark'),
  [0.14, 0.32, 0.18],
  'LearnerLegR',
  {
    rot: [1.35, 0, 0],
  },
)
const lHead = group(learner, 'LearnerHead', [0, 1.02, 0])
add(lHead, sphere(0.26, 20, 14), mat('skin'), [0, 0.22, 0], 'LearnerFace')
add(
  lHead,
  sphere(0.275, 18, 10),
  mat('hair'),
  [0, 0.27, -0.03],
  'LearnerHair',
  {
    scale: [1, 0.8, 1],
  },
)
add(
  lHead,
  sphere(0.09, 10, 8),
  mat('hair'),
  [0.19, 0.42, -0.02],
  'LearnerHairBun',
)
add(lHead, sphere(0.032, 8, 6), mat('dark'), [-0.1, 0.24, 0.235], 'LearnerEyeL')
add(lHead, sphere(0.032, 8, 6), mat('dark'), [0.1, 0.24, 0.235], 'LearnerEyeR')
add(
  lHead,
  sphere(0.045, 8, 6),
  mat('terracotta'),
  [-0.17, 0.16, 0.19],
  'LearnerCheekL',
  {
    scale: [1, 0.6, 0.5],
  },
)
add(
  lHead,
  sphere(0.045, 8, 6),
  mat('terracotta'),
  [0.17, 0.16, 0.19],
  'LearnerCheekR',
  {
    scale: [1, 0.6, 0.5],
  },
)
add(
  lHead,
  torus(0.05, 0.014),
  mat('terracotta'),
  [0, 0.12, 0.245],
  'LearnerMouth',
  {
    rot: [0.2, 0, 0],
    scale: [1, 0.5, 0.4],
  },
)
const lArmL = group(learner, 'LearnerArmL', [-0.24, 0.86, 0.05], 0)
add(
  lArmL,
  capsule(0.065, 0.26, 3, 10),
  mat('shirt'),
  [0, -0.15, 0],
  'LearnerArmLMesh',
)
add(lArmL, sphere(0.075, 10, 8), mat('skin'), [0, -0.32, 0], 'LearnerHandL')
const lArmR = group(learner, 'LearnerArmR', [0.24, 0.86, 0.05], 0)
add(
  lArmR,
  capsule(0.065, 0.26, 3, 10),
  mat('shirt'),
  [0, -0.15, 0],
  'LearnerArmRMesh',
)
add(lArmR, sphere(0.075, 10, 8), mat('skin'), [0, -0.32, 0], 'LearnerHandR')

const tutor = group(
  scene,
  'Tutor',
  tutorPos,
  faceYaw(tutorPos, learnerPos, 0.9),
)
add(tutor, sphere(0.3, 20, 14), mat('tutor'), [0, 0.72, 0], 'TutorBody', {
  scale: [1, 1.05, 0.9],
})
add(
  tutor,
  sphere(0.2, 12, 8),
  mat('tutorLight'),
  [0, 0.64, 0.14],
  'TutorBelly',
  {
    scale: [1, 1.1, 0.6],
  },
)
add(tutor, sphere(0.1, 10, 8), mat('tutor'), [-0.16, 0.4, 0.12], 'TutorFootL', {
  scale: [1, 0.55, 1.3],
})
add(tutor, sphere(0.1, 10, 8), mat('tutor'), [0.16, 0.4, 0.12], 'TutorFootR', {
  scale: [1, 0.55, 1.3],
})
const tHead = group(tutor, 'TutorHead', [0, 0.98, 0])
add(tHead, sphere(0.3, 20, 14), mat('tutor'), [0, 0.22, 0], 'TutorFace', {
  scale: [1.08, 0.95, 1],
})
add(
  tHead,
  sphere(0.16, 16, 12),
  mat('tutorLight'),
  [0, 0.16, 0.2],
  'TutorMuzzle',
  {
    scale: [1.3, 0.9, 0.55],
  },
)
add(tHead, sphere(0.06, 10, 8), mat('white'), [-0.12, 0.28, 0.25], 'TutorEyeL')
add(tHead, sphere(0.06, 10, 8), mat('white'), [0.12, 0.28, 0.25], 'TutorEyeR')
add(tHead, sphere(0.032, 8, 6), mat('dark'), [-0.11, 0.285, 0.3], 'TutorPupilL')
add(tHead, sphere(0.032, 8, 6), mat('dark'), [0.11, 0.285, 0.3], 'TutorPupilR')
add(tHead, torus(0.04, 0.012), mat('dark'), [0, 0.15, 0.3], 'TutorMouth', {
  rot: [0.3, 0, 0],
  scale: [1, 0.5, 0.4],
})
const antL = group(tHead, 'TutorAntennaL', [-0.14, 0.46, 0], 0)
add(
  antL,
  capsule(0.035, 0.22, 3, 8),
  mat('tutor'),
  [0, 0.12, 0],
  'TutorAntennaLMesh',
  {
    rot: [0, 0, 0.35],
  },
)
add(
  antL,
  sphere(0.06, 10, 8),
  mat('lampShade'),
  [-0.08, 0.27, 0],
  'TutorAntennaLTip',
)
const antR = group(tHead, 'TutorAntennaR', [0.14, 0.46, 0], 0)
add(
  antR,
  capsule(0.035, 0.22, 3, 8),
  mat('tutor'),
  [0, 0.12, 0],
  'TutorAntennaRMesh',
  {
    rot: [0, 0, -0.35],
  },
)
add(
  antR,
  sphere(0.06, 10, 8),
  mat('lampShade'),
  [0.08, 0.27, 0],
  'TutorAntennaRTip',
)
const tArmL = group(tutor, 'TutorArmL', [-0.28, 0.8, 0.05], 0)
add(
  tArmL,
  capsule(0.055, 0.18, 3, 10),
  mat('tutor'),
  [0, -0.1, 0],
  'TutorArmLMesh',
)
add(tArmL, sphere(0.07, 10, 8), mat('tutorLight'), [0, -0.23, 0], 'TutorHandL')
const tArmR = group(tutor, 'TutorArmR', [0.28, 0.8, 0.05], 0)
add(
  tArmR,
  capsule(0.055, 0.18, 3, 10),
  mat('tutor'),
  [0, -0.1, 0],
  'TutorArmRMesh',
)
add(tArmR, sphere(0.07, 10, 8), mat('tutorLight'), [0, -0.23, 0], 'TutorHandR')

const armRest = new THREE.Euler(-0.55, 0, 0.35)
const armRestR = new THREE.Euler(-0.55, 0, -0.35)
lArmL.rotation.copy(armRest)
lArmR.rotation.copy(armRestR)
tArmL.rotation.copy(armRest)
tArmR.rotation.copy(armRestR)

const DUR = 8
const fps = 12
const times = []
for (let i = 0; i <= DUR * fps; i++) times.push(i / fps)
const pulse = (t, a, b) =>
  t < a || t > b ? 0 : Math.sin(((t - a) / (b - a)) * Math.PI)
const quat = (e) => new THREE.Quaternion().setFromEuler(e)
const quatTrack = (node, fn) => {
  const vals = []
  const e = new THREE.Euler()
  for (const t of times) {
    fn(t, e)
    const q = quat(e)
    vals.push(q.x, q.y, q.z, q.w)
  }
  return new THREE.QuaternionKeyframeTrack(
    `${node.name}.quaternion`,
    times,
    vals,
  )
}
const scaleTrack = (node, fn) => {
  const vals = []
  for (const t of times) vals.push(...fn(t))
  return new THREE.VectorKeyframeTrack(`${node.name}.scale`, times, vals)
}
const learnerTalk = (t) => pulse(t, 0.2, 3.2)
const tutorTalk = (t) => pulse(t, 4.0, 7.2)
const tracks = [
  quatTrack(lHead, (t, e) =>
    e.set(
      -0.05 +
        Math.sin(t * 2 * Math.PI * 1.6) * 0.07 * learnerTalk(t) +
        Math.sin(t * 2 * Math.PI * 1.1) * 0.09 * pulse(t, 4.6, 6.6),
      0.1 * learnerTalk(t) - 0.08 * tutorTalk(t),
      0.06 * Math.sin(t * 2 * Math.PI * 0.6) * learnerTalk(t) +
        0.12 * pulse(t, 6.2, 7.6),
    ),
  ),
  quatTrack(tHead, (t, e) =>
    e.set(
      -0.04 +
        Math.sin(t * 2 * Math.PI * 1.5) * 0.08 * tutorTalk(t) +
        Math.sin(t * 2 * Math.PI * 1.2) * 0.1 * pulse(t, 1.0, 2.8),
      -0.12 * tutorTalk(t) + 0.06 * learnerTalk(t),
      0.12 * Math.sin(t * 2 * Math.PI * 0.5) * tutorTalk(t) -
        0.14 * pulse(t, 2.4, 3.8),
    ),
  ),
  quatTrack(lArmR, (t, e) =>
    e.set(
      armRestR.x -
        1.1 * learnerTalk(t) +
        0.15 * Math.sin(t * 2 * Math.PI * 1.8) * learnerTalk(t),
      0.3 * learnerTalk(t),
      armRestR.z - 0.6 * learnerTalk(t),
    ),
  ),
  quatTrack(lArmL, (t, e) =>
    e.set(
      armRest.x - 0.25 * learnerTalk(t) - 0.5 * pulse(t, 6.2, 7.6),
      0,
      armRest.z + 0.15 * learnerTalk(t),
    ),
  ),
  quatTrack(tArmR, (t, e) =>
    e.set(
      armRestR.x -
        1.3 * tutorTalk(t) +
        0.2 * Math.sin(t * 2 * Math.PI * 2) * tutorTalk(t),
      0,
      armRestR.z - 0.9 * tutorTalk(t),
    ),
  ),
  quatTrack(tArmL, (t, e) =>
    e.set(
      armRest.x -
        1.0 * tutorTalk(t) +
        0.2 * Math.cos(t * 2 * Math.PI * 2) * tutorTalk(t),
      0,
      armRest.z + 0.8 * tutorTalk(t),
    ),
  ),
  quatTrack(antL, (t, e) =>
    e.set(
      0,
      0,
      0.25 * Math.sin(t * 2 * Math.PI * 1.3) * tutorTalk(t) +
        0.15 * Math.sin(t * 2 * Math.PI * 0.4),
    ),
  ),
  quatTrack(antR, (t, e) =>
    e.set(
      0,
      0,
      -0.25 * Math.sin(t * 2 * Math.PI * 1.3 + 0.7) * tutorTalk(t) -
        0.15 * Math.sin(t * 2 * Math.PI * 0.4 + 0.5),
    ),
  ),
  scaleTrack(tutor.children[0], (t) => {
    const s = 1 + 0.02 * Math.sin(t * 2 * Math.PI * 0.375)
    return [1, 1.05 * s, 0.9 / s]
  }),
  scaleTrack(learner.children[0], (t) => {
    const s = 1 + 0.012 * Math.sin(t * 2 * Math.PI * 0.375 + 1)
    return [1, s, 0.85]
  }),
]
const clip = new THREE.AnimationClip('Conversation', DUR, tracks)

scene.updateMatrixWorld(true)
const bounds = new THREE.Box3().setFromObject(scene)
let tris = 0,
  verts = 0,
  meshes = 0
scene.traverse((o) => {
  if (o.isMesh) {
    meshes++
    verts += o.geometry.attributes.position.count
    tris +=
      (o.geometry.index
        ? o.geometry.index.count
        : o.geometry.attributes.position.count) / 3
  }
})

const exporter = new GLTFExporter()
const glb = await exporter.parseAsync(scene, {
  binary: true,
  animations: [clip],
  onlyVisible: true,
})
const out = new URL('../public/glite-room.glb', import.meta.url).pathname
writeFileSync(out, Buffer.from(glb))

const size = bounds.getSize(new THREE.Vector3())
const center = bounds.getCenter(new THREE.Vector3())
console.log(
  JSON.stringify(
    {
      output: out,
      bytes: glb.byteLength,
      meshes,
      verts,
      tris,
      bounds: {
        min: bounds.min.toArray().map((v) => +v.toFixed(3)),
        max: bounds.max.toArray().map((v) => +v.toFixed(3)),
        size: size.toArray().map((v) => +v.toFixed(3)),
        center: center.toArray().map((v) => +v.toFixed(3)),
      },
      clip: {
        name: clip.name,
        duration: clip.duration,
        tracks: tracks.map((t) => t.name),
      },
    },
    null,
    2,
  ),
)
