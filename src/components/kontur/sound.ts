import { tone } from '../quantori/sound'

export const lift = () =>
  tone(
    [
      [0, 900],
      [0.05, 1300],
    ],
    'sine',
    0.06,
  )

export const chink = () =>
  [0, 0.07].forEach((delay, i) =>
    tone(
      [
        [0, 1900 + i * 500],
        [0.12, 1700 + i * 500],
      ],
      'triangle',
      0.07,
      delay,
    ),
  )

export const thud = () => {
  tone(
    [
      [0, 180],
      [0.12, 60],
    ],
    'sine',
    0.35,
  )
  tone(
    [
      [0, 420],
      [0.04, 140],
    ],
    'square',
    0.05,
  )
}

export const cheer = () =>
  [523, 659, 784, 1047].forEach((frequency, i) =>
    tone(
      [
        [0, frequency],
        [0.18, frequency * 1.01],
      ],
      'triangle',
      0.09,
      i * 0.09,
    ),
  )

export const nag = () => {
  chink()
  ;[0.18, 0.34].forEach((delay) =>
    tone(
      [
        [0, 240],
        [0.11, 300],
      ],
      'square',
      0.045,
      delay,
    ),
  )
}

export const gate = () =>
  tone(
    [
      [0, 520],
      [0.1, 780],
    ],
    'triangle',
    0.08,
  )
