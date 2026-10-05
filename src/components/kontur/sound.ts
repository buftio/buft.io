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
