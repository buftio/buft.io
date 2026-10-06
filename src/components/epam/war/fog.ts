import * as THREE from 'three'
import { CELL, type War } from './sim'

const blank = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1)
blank.needsUpdate = true

export const fog = {
  uFog: { value: blank as THREE.DataTexture },
  uFogOn: { value: 0 },
  uFogSize: { value: new THREE.Vector2(1, 1) },
}

export const landFade = { value: 1 }

export function fogTexture(war: War) {
  const texture = new THREE.DataTexture(
    new Uint8Array(war.cols * war.rows * 4),
    war.cols,
    war.rows,
  )
  texture.magFilter = THREE.LinearFilter
  texture.minFilter = THREE.LinearFilter
  return texture
}

export function paintFog(war: War, texture: THREE.DataTexture) {
  const data = texture.image.data as Uint8Array
  for (let i = 0; i < war.light.length; i++) {
    data[i * 4] = war.light[i] * 255
    data[i * 4 + 1] = war.glow[i] * 255
  }
  texture.needsUpdate = true
}

export function aimFog(war: War, texture: THREE.DataTexture) {
  fog.uFog.value = texture
  fog.uFogSize.value.set(war.cols * CELL, war.rows * CELL)
}

export function clearFog() {
  fog.uFog.value = blank
  fog.uFogOn.value = 0
}

const VERTEX = (whole: boolean) => /* glsl */ `
vec4 fogAt = vec4(${whole ? 'vec3(0.0)' : 'transformed'}, 1.0);
#ifdef USE_INSTANCING
fogAt = instanceMatrix * fogAt;
#endif
vFogAt = (modelMatrix * fogAt).xy;
`

export const FOG_HEAD = /* glsl */ `
uniform sampler2D uFog;
uniform float uFogOn;
uniform vec2 uFogSize;
varying vec2 vFogAt;
`

export const FOG_FRAGMENT = /* glsl */ `
vec4 fogLight = texture2D(uFog, vec2(vFogAt.x, -vFogAt.y) / uFogSize);
float fogShow = max(fogLight.r, fogLight.g);
float fogGray = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));
vec3 fogDim = mix(vec3(fogGray), vec3(0.86, 0.84, 0.9), 0.3);
gl_FragColor.rgb = mix(gl_FragColor.rgb, fogDim, uFogOn * (1.0 - smoothstep(0.15, 0.85, fogShow)) * 0.92);
`

export function fogged(material: THREE.Material, whole = false) {
  if (material.userData.fogged) return
  material.userData.fogged = true
  const before = material.onBeforeCompile
  const key = material.customProgramCacheKey()
  material.customProgramCacheKey = () => `${key}|fog${whole ? '-whole' : ''}`
  material.onBeforeCompile = (shader, renderer) => {
    before.call(material, shader, renderer)
    const vertex = '#include <project_vertex>'
    const fragment = '#include <opaque_fragment>'
    const fade = whole ? 'gl_FragColor.a *= uLandFade;' : ''
    if (whole) shader.uniforms.uLandFade = landFade
    if (
      shader.vertexShader.includes(vertex) &&
      shader.fragmentShader.includes(fragment)
    ) {
      Object.assign(shader.uniforms, fog)
      shader.vertexShader = `varying vec2 vFogAt;\n${shader.vertexShader.replace(vertex, `${vertex}\n${VERTEX(whole)}`)}`
      shader.fragmentShader = `${FOG_HEAD}uniform float uLandFade;\n${shader.fragmentShader.replace(fragment, `${fragment}\n${FOG_FRAGMENT}\n${fade}`)}`
    } else if (whole && shader.fragmentShader.includes('gl_FragColor'))
      shader.fragmentShader = `uniform float uLandFade;\n${shader.fragmentShader.replace(/}\s*$/, `${fade}\n}`)}`
  }
  material.needsUpdate = true
}
