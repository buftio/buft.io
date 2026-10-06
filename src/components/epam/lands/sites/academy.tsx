'use client'

import type { SceneProps } from '../registry'
import { Academy } from './academy/scene'

export default function Scene(props: SceneProps) {
  return <Academy {...props} />
}
