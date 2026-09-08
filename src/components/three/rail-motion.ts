export type RailMotion = { position: number; velocity: number }

export function advanceRail(motion: RailMotion, target: number, delta: number) {
  const offset = motion.position - target
  const speed = 24
  const decay = speed * 0.75
  const frequency = Math.sqrt(speed * speed - decay * decay)
  const dt = Math.min(delta, 0.1)
  const envelope = Math.exp(-decay * dt)
  const sine = Math.sin(frequency * dt)
  const cosine = Math.cos(frequency * dt)
  const velocity = motion.velocity
  const previous = motion.position
  motion.position =
    target +
    envelope *
      (offset * cosine + ((velocity + decay * offset) / frequency) * sine)
  motion.velocity =
    envelope *
    (velocity * cosine -
      ((decay * velocity + speed * speed * offset) / frequency) * sine)
  const maxTravel = 6.5 * dt
  if (Math.abs(motion.position - previous) > maxTravel) {
    const direction = Math.sign(motion.position - previous)
    motion.position = previous + direction * maxTravel
    motion.velocity = direction * 6.5
  }
  if (
    Math.abs(motion.position - target) < 0.0001 &&
    Math.abs(motion.velocity) < 0.001
  ) {
    motion.position = target
    motion.velocity = 0
  }
  return motion.position
}
