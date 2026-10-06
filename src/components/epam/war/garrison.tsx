import { KINDS } from './kinds'
import { Miniature } from './miniature'

export function Garrison({ kind }: { kind: number }) {
  const k = KINDS[kind]
  if (!k) return null
  return (
    <section className="e-garrison" data-warrior={k.castle}>
      <Miniature kind={kind} />
      <div>
        <h4>{k.name}</h4>
        <small>Recruits here: {k.cell}</small>
        <p>{k.power}</p>
      </div>
      <p className="e-cell">{k.bio}</p>
    </section>
  )
}
