'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Vector2 } from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

export function GardenBloom() {
  const { gl, scene, camera, size, viewport } = useThree()
  const pipeline = useRef<EffectComposer | null>(null)

  useEffect(() => {
    const composer = new EffectComposer(gl)
    const render = new RenderPass(scene, camera)
    const bloom = new UnrealBloomPass(new Vector2(1, 1), 0.65, 0.55, 1)
    const output = new OutputPass()
    composer.addPass(render)
    composer.addPass(bloom)
    composer.addPass(output)
    pipeline.current = composer
    return () => {
      pipeline.current = null
      render.dispose()
      bloom.dispose()
      output.dispose()
      composer.dispose()
    }
  }, [gl, scene, camera])

  useEffect(() => {
    pipeline.current?.setPixelRatio(viewport.dpr)
    pipeline.current?.setSize(size.width, size.height)
  }, [size.width, size.height, viewport.dpr])

  useFrame((_, delta) => {
    if (pipeline.current) pipeline.current.render(delta)
    else {
      gl.setRenderTarget(null)
      gl.render(scene, camera)
    }
  }, 1)

  return null
}
