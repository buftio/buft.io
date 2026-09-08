'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'

const terms = {
  SMILES: {
    definition:
      'A way to write a molecule as text. Letters and symbols describe the atoms and how they connect.',
    example:
      'CCO describes ethanol: two carbons connected to an oxygen. Most hydrogens are left out of the text.',
  },
  IUPAC: {
    definition:
      'International rules for naming chemicals, so a name describes how a molecule is put together.',
    example:
      'The molecule written CCO is called ethanol. The code and the name describe the same molecule.',
  },
}

export function ChemistryTerm({ term }: { term: keyof typeof terms }) {
  const id = useId()
  const button = useRef<HTMLButtonElement>(null)
  const tooltip = useRef<HTMLSpanElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ left: 16, top: 16 })
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }
  const show = () => {
    cancelClose()
    setOpen(true)
  }
  const leave = () => {
    cancelClose()
    closeTimer.current = setTimeout(() => setOpen(false), 150)
  }
  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current)
    },
    [],
  )
  useLayoutEffect(() => {
    if (!open) return
    tooltip.current?.showPopover()
    const measure = () => {
      if (!button.current || !tooltip.current) return
      const at = button.current.getBoundingClientRect()
      const box = tooltip.current.getBoundingClientRect()
      const below = at.bottom + 8
      setPosition({
        left: Math.max(
          16,
          Math.min(at.left, window.innerWidth - box.width - 16),
        ),
        top: Math.max(
          16,
          below + box.height <= window.innerHeight - 16
            ? below
            : at.top - box.height - 8,
        ),
      })
    }
    const outside = (event: PointerEvent) => {
      if (
        !button.current?.contains(event.target as Node) &&
        !tooltip.current?.contains(event.target as Node)
      )
        setOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      cancelClose()
      setOpen(false)
    }
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    document.addEventListener('pointerdown', outside, true)
    document.addEventListener('keydown', escape, true)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
      document.removeEventListener('pointerdown', outside, true)
      document.removeEventListener('keydown', escape, true)
    }
  }, [open])
  return (
    <>
      <button
        ref={button}
        type="button"
        className="lumi-term"
        aria-label={`What is ${term}?`}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse') show()
        }}
        onPointerLeave={leave}
        onFocus={(event) => {
          if (event.currentTarget.matches(':focus-visible')) show()
        }}
        onBlur={() => setOpen(false)}
        onClick={show}
      >
        {term}
      </button>
      {open && (
        <span
          ref={tooltip}
          id={id}
          popover="manual"
          role="tooltip"
          className="lumi-term-tooltip"
          style={position}
          onPointerEnter={cancelClose}
          onPointerLeave={leave}
        >
          <strong>{term === 'IUPAC' ? 'IUPAC names' : 'SMILES'}</strong>
          <span>{terms[term].definition}</span>
          <span className="lumi-term-example">{terms[term].example}</span>
        </span>
      )}
    </>
  )
}
