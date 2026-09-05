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
  componentDidCatch(error: Error) {
    console.error('3D scene failed to render', error)
  }
  render() {
    if (this.state.failed)
      return (
        <output
          className={this.props.compact ? 'vignette-loading' : 'scene-error'}
        >
          The 3D scene could not load. You can still explore the project
          stories.
          <button onClick={() => this.setState({ failed: false })}>
            Try again
          </button>
        </output>
      )
    return this.props.children
  }
}
