'use client'

import { Component, type ReactNode } from 'react'

export class SceneBoundary extends Component<
  { children: ReactNode; compact?: boolean },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed)
      return (
        <output
          className={this.props.compact ? 'vignette-loading' : 'scene-error'}
        >
          The 3D scene could not load. You can still explore the project
          stories.
        </output>
      )
    return this.props.children
  }
}
