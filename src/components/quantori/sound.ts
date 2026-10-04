let context: AudioContext | undefined

function tone(
  points: [number, number][],
  type: OscillatorType,
  volume: number,
  delay = 0,
) {
  try {
    context ??= new AudioContext()
    const now = context.currentTime + delay
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = type
    points.forEach(([at, frequency], i) =>
      i === 0
        ? oscillator.frequency.setValueAtTime(frequency, now + at)
        : oscillator.frequency.exponentialRampToValueAtTime(
            frequency,
            now + at,
          ),
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
  tone(
    [
      [0, 700],
      [0.08, 1700],
      [0.2, 1100],
      [0.32, 1900],
    ],
    'triangle',
    0.18,
  )
}

export const pop = () => {
  tone(
    [
      [0, 520 + Math.random() * 200],
      [0.09, 120],
    ],
    'sine',
    0.12,
  )
}

export const pickup = () => {
  tone(
    [
      [0, 440],
      [0.06, 660],
      [0.12, 990],
      [0.24, 1320],
    ],
    'square',
    0.06,
  )
}

export const oink = (streak: number) => {
  const pitch = 1 + streak * 0.06
  tone(
    [
      [0, 260 * pitch],
      [0.07, 340 * pitch],
      [0.16, 180 * pitch],
    ],
    'sawtooth',
    0.05,
  )
}

export const boop = () => {
  tone(
    [
      [0, 330],
      [0.12, 220],
    ],
    'triangle',
    0.1,
  )
}

export const alarm = () => {
  ;[0, 0.45].forEach((delay) =>
    tone(
      [
        [0, 620],
        [0.2, 900],
        [0.4, 620],
      ],
      'sawtooth',
      0.035,
      delay,
    ),
  )
}

export const fanfare = () => {
  ;[523, 659, 784, 1047].forEach((note, i) =>
    tone(
      [
        [0, note],
        [i === 3 ? 0.5 : 0.14, note * 1.01],
      ],
      'square',
      0.05,
      i * 0.12,
    ),
  )
}

export const sad = () => {
  ;[392, 370, 349].forEach((note, i) =>
    tone(
      [
        [0, note],
        [0.3, note * 0.97],
      ],
      'triangle',
      0.12,
      i * 0.32,
    ),
  )
  tone(
    [
      [0, 330],
      [0.8, 220],
    ],
    'triangle',
    0.12,
    0.96,
  )
}
