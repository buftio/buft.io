let context: AudioContext | undefined

function tone(points: [number, number][], type: OscillatorType, volume: number) {
  try {
    context ??= new AudioContext()
    const now = context.currentTime
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = type
    points.forEach(([at, frequency], i) =>
      i === 0
        ? oscillator.frequency.setValueAtTime(frequency, now + at)
        : oscillator.frequency.exponentialRampToValueAtTime(frequency, now + at),
    )
    const end = points[points.length - 1][0]
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + end)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start(now)
    oscillator.stop(now + end + 0.02)
  } catch {
    /* Sound is a garnish; the game works without it. */
  }
}

export const squeak = () => {
  tone([[0, 700], [0.08, 1700], [0.2, 1100], [0.32, 1900]], 'triangle', 0.18)
}

export const pop = () => {
  tone([[0, 520 + Math.random() * 200], [0.09, 120]], 'sine', 0.12)
}
