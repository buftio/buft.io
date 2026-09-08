'use client'

import { useEffect, useRef, useState } from 'react'
import { Shuffle } from 'lucide-react'
import { MakeCarpetButton } from './make-carpet-button'
import {
  COLS,
  ROWS,
  colorsFor,
  paintRug,
  palettes,
  patterns,
  patternPixels,
  type RugDesign,
} from './design'

export function RugPreview({ design }: { design: RugDesign }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d')
    if (ctx) paintRug(ctx, design, 270, 390)
  }, [design])
  return (
    <canvas
      ref={canvas}
      width={270}
      height={390}
      className="rug-preview"
      aria-label="Your carpet design"
    />
  )
}

export function Designer({
  design,
  onDesign,
  onMake,
  ready,
  reduced,
}: {
  design: RugDesign
  onDesign: (design: RugDesign) => void
  onMake: (name: string) => void
  ready: boolean
  reduced: boolean
}) {
  const [ink, setInk] = useState(1)
  const [mirror, setMirror] = useState(true)
  const [drawing, setDrawing] = useState(false)
  const [name, setName] = useState('')
  const [cell, setCell] = useState(58)
  const grid = useRef<HTMLFieldSetElement>(null)
  const colors = colorsFor(design)
  const paint = (index: number) => {
    if (index < 0 || index >= COLS * ROWS) return
    const reflected = mirror
      ? Math.floor(index / COLS) * COLS + COLS - 1 - (index % COLS)
      : index
    if (design.pixels[index] === ink && design.pixels[reflected] === ink) return
    const pixels = [...design.pixels]
    pixels[index] = ink
    pixels[reflected] = ink
    onDesign({ ...design, pixels })
  }
  const paintAt = (x: number, y: number) => {
    const rect = grid.current?.getBoundingClientRect()
    if (
      !rect ||
      x < rect.left ||
      x >= rect.right ||
      y < rect.top ||
      y >= rect.bottom
    )
      return
    const col = Math.floor(((x - rect.left) / rect.width) * COLS)
    const row = Math.floor(((y - rect.top) / rect.height) * ROWS)
    paint(row * COLS + col)
  }
  return (
    <div className="carpet-designer">
      <div className="designer-heading">
        <h3>Make a carpet</h3>
      </div>
      <div className="designer-workbench">
        <div className="design-swatch">
          <RugPreview design={design} />
          {drawing && (
            <fieldset
              className="rug-drawing"
              ref={grid}
              aria-label="Draw your carpet. Use arrow keys and Space to paint."
              onPointerDown={(event) => {
                event.preventDefault()
                event.currentTarget.setPointerCapture(event.pointerId)
                paintAt(event.clientX, event.clientY)
              }}
              onPointerMove={(event) => {
                if (event.buttons === 1) paintAt(event.clientX, event.clientY)
              }}
            >
              {design.pixels.map((color, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Row ${Math.floor(i / COLS) + 1}, column ${(i % COLS) + 1}, yarn ${color + 1}`}
                  tabIndex={cell === i ? 0 : -1}
                  style={{ backgroundColor: colors[color] }}
                  onFocus={() => setCell(i)}
                  onClick={(event) => {
                    if (event.detail === 0) paint(i)
                  }}
                  onKeyDown={(event) => {
                    const offset = {
                      ArrowLeft: -1,
                      ArrowRight: 1,
                      ArrowUp: -COLS,
                      ArrowDown: COLS,
                    }[event.key]
                    if (offset === undefined) return
                    event.preventDefault()
                    const next = Math.max(
                      0,
                      Math.min(COLS * ROWS - 1, i + offset),
                    )
                    grid.current?.querySelectorAll('button')[next]?.focus()
                  }}
                />
              ))}
            </fieldset>
          )}
        </div>
        <div className="designer-tools">
          <fieldset className="rug-palettes" aria-label="Carpet colors">
            {palettes.map((palette) => (
              <button
                key={palette.id}
                aria-label={palette.name}
                aria-pressed={design.palette === palette.id}
                onClick={() => onDesign({ ...design, palette: palette.id })}
              >
                {palette.colors.slice(0, 3).map((color) => (
                  <i key={color} style={{ backgroundColor: color }} />
                ))}
              </button>
            ))}
          </fieldset>
          <fieldset className="rug-patterns" aria-label="Woven pattern">
            {patterns.map((pattern) => (
              <button
                key={pattern.id}
                aria-pressed={design.pattern === pattern.id}
                onClick={() =>
                  onDesign({
                    ...design,
                    pattern: pattern.id,
                    pixels: patternPixels(pattern.id),
                  })
                }
              >
                {pattern.name}
              </button>
            ))}
          </fieldset>
          <button
            className="draw-toggle"
            aria-pressed={drawing}
            onClick={() => setDrawing(!drawing)}
          >
            {drawing ? 'Finish drawing' : 'Draw your own'}
          </button>
          {drawing && (
            <div className="rug-brushes">
              <fieldset aria-label="Drawing yarn">
                {colors.map((color, i) => (
                  <button
                    key={color}
                    aria-label={`Paint with yarn ${i + 1}`}
                    aria-pressed={ink === i}
                    onClick={() => setInk(i)}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </fieldset>
              <label>
                <input
                  type="checkbox"
                  checked={mirror}
                  onChange={(e) => setMirror(e.target.checked)}
                />{' '}
                Mirror stitches
              </label>
            </div>
          )}
          {!drawing && (
            <button
              className="rug-surprise"
              onClick={() => {
                const pattern =
                  patterns[Math.floor(Math.random() * patterns.length)].id
                const palette =
                  palettes[
                    (palettes.findIndex((p) => p.id === design.palette) +
                      1 +
                      Math.floor(Math.random() * 3)) %
                      palettes.length
                  ].id
                onDesign({ palette, pattern, pixels: patternPixels(pattern) })
              }}
            >
              <Shuffle size={14} /> Surprise me
            </button>
          )}
        </div>
      </div>
      <label className="carpet-name">
        <span>Give it a name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          placeholder="Something for the living room"
        />
      </label>
      <MakeCarpetButton
        design={design}
        disabled={!ready}
        reduced={reduced}
        onClick={() => {
          onMake(name.trim())
          setName('')
        }}
      />
    </div>
  )
}
