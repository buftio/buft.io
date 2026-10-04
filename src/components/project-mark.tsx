import Image from 'next/image'
import { monogram, type Project } from '@/lib/projects'
import { COLS, ROWS, initialDesign, colorsFor } from './marketdata/design'

const rugColors = colorsFor(initialDesign)

function TinyRug() {
  return (
    <svg
      className="project-mark rug-mark"
      viewBox={`-1 -1 ${COLS + 2} ${ROWS + 2}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <rect
        x={-1}
        y={-1}
        width={COLS + 2}
        height={ROWS + 2}
        fill={rugColors[1]}
      />
      {initialDesign.pixels.map((color, i) => (
        <rect
          key={i}
          x={i % COLS}
          y={Math.floor(i / COLS)}
          width={1}
          height={1}
          fill={rugColors[color]}
        />
      ))}
    </svg>
  )
}

export function ProjectMark({ project }: { project: Project }) {
  if (project.id === 'akts') return <TinyRug />
  const src = project.mark ?? project.logo
  if (src)
    return (
      <Image
        className="project-mark"
        src={src}
        alt=""
        width={20}
        height={20}
        unoptimized
      />
    )
  return (
    <span
      className="project-mark monogram-mark"
      style={{ '--project-color': project.color } as React.CSSProperties}
      aria-hidden="true"
    >
      {monogram(project)}
    </span>
  )
}
