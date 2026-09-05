'use client'

import dynamic from 'next/dynamic'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Pause,
  Play,
  X,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { projects } from '@/lib/projects'
import { SceneBoundary } from './scene-boundary'

const Scene = dynamic(() => import('./scene').then((module) => module.Scene), {
  ssr: false,
})
const ProjectVignette = dynamic(() => import('./three/project-vignette'), {
  ssr: false,
  loading: () => (
    <div className="vignette-loading">Opening this little world…</div>
  ),
})
const resumeUrl =
  'https://docs.google.com/document/d/1yVdeR23Y5sJU6MKffIKWd-uo_GBjAuHN/edit'
const preloadVignette = () => import('./three/project-vignette')
const subscribeMotion = (callback: () => void) => {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)')
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}

function StoryCaption({
  index,
  leaving = false,
  onEnter,
}: {
  index: number
  leaving?: boolean
  onEnter?: () => void
}) {
  const project = index >= 0 ? projects[index] : null
  return (
    <div
      className={`story-caption ${leaving ? 'is-leaving' : ''}`}
      aria-hidden={leaving || undefined}
    >
      <div className="eyebrow">
        <span className="ember-dot" />
        {project ? project.field : 'SOFTWARE ENGINEER & CURIOUS HUMAN'}
      </div>
      {project ? (
        <>
          <span className="project-company">
            {project.name} <span>{project.period}</span>
          </span>
          <h1>{project.title}</h1>
          <p>{project.summary}</p>
          <button className="enter-button" onClick={onEnter}>
            Step inside <ArrowUpRight size={19} />
          </button>
        </>
      ) : (
        <>
          <h1>
            Igor
            <br /> Ostanin<span className="hot-dot">.</span>
          </h1>
          <p>
            I make things people use.
            <br /> Sometimes to learn. Sometimes to discover.
            <br /> Sometimes just to play.
          </p>
          <button className="enter-button" onClick={onEnter}>
            Explore my work <ArrowDown size={18} />
          </button>
        </>
      )}
    </div>
  )
}

export function Home() {
  const progress = useRef(-1)
  const pending = useRef<number | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const [active, setActive] = useState(-1)
  const [leaving, setLeaving] = useState<number | null>(null)
  const shown = useRef(active)
  const [selected, setSelected] = useState<number | null>(null)
  const [paused, setPaused] = useState(false)
  const prefersReduced = useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  )
  const reduced = prefersReduced || paused
  const opened = selected !== null ? projects[selected] : null

  const navigate = useCallback(
    (index: number) => {
      const bounded = Math.max(-1, Math.min(projects.length - 1, index))
      pending.current = bounded
      setActive(bounded)
      window.scrollTo({
        top: (bounded + 1) * window.innerHeight,
        behavior: reduced ? 'instant' : 'smooth',
      })
    },
    [reduced],
  )

  const openProject = useCallback((index: number) => {
    previousFocus.current = document.activeElement as HTMLElement
    window.scrollTo({
      top: (index + 1) * window.innerHeight,
      behavior: 'instant',
    })
    setSelected(index)
    window.history.pushState(null, '', `#${projects[index].id}`)
  }, [])

  const closeProject = useCallback(() => {
    dialog.current?.close()
    setSelected(null)
    window.history.replaceState(null, '', window.location.pathname)
    previousFocus.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    if (shown.current === active) return
    setLeaving(shown.current)
    shown.current = active
    const timer = setTimeout(() => setLeaving(null), 600)
    return () => clearTimeout(timer)
  }, [active])

  useEffect(() => {
    const timer = setTimeout(preloadVignette, 2000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      progress.current = Math.max(
        -1,
        Math.min(projects.length - 1, window.scrollY / window.innerHeight - 1),
      )
      const nearest = Math.round(progress.current)
      if (pending.current !== null && nearest !== pending.current) return
      pending.current = null
      setActive(nearest)
    }
    const cancelPending = () => {
      pending.current = null
    }
    const readHash = () => {
      const index = projects.findIndex(
        (item) => `#${item.id}` === window.location.hash,
      )
      setSelected(index < 0 ? null : index)
      if (index >= 0)
        window.scrollTo({
          top: (index + 1) * window.innerHeight,
          behavior: 'instant',
        })
    }
    readHash()
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    window.addEventListener('popstate', readHash)
    window.addEventListener('wheel', cancelPending, { passive: true })
    window.addEventListener('touchstart', cancelPending, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('popstate', readHash)
      window.removeEventListener('wheel', cancelPending)
      window.removeEventListener('touchstart', cancelPending)
    }
  }, [])

  useEffect(() => {
    if (selected === null) return
    const element = dialog.current
    const focus = previousFocus.current
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    element?.showModal()
    return () => {
      element?.close()
      document.body.style.overflow = oldOverflow
      requestAnimationFrame(() => {
        if (focus?.isConnected) focus.focus({ preventScroll: true })
      })
    }
  }, [selected])

  return (
    <main className={`portfolio ${reduced ? 'reduced-motion' : ''}`}>
      <div
        className="world"
        aria-label="A seated samurai surrounded by fire and project flowers"
      >
        <SceneBoundary>
          <Scene
            progress={progress}
            active={active}
            selected={selected}
            reduced={reduced}
            onOpen={openProject}
          />
        </SceneBoundary>
      </div>
      <div className="scene-shade" />
      <header className="site-header">
        <button
          className="brand"
          onClick={() => navigate(-1)}
          aria-label="Back to the garden"
        >
          buft<span>.io</span>
          <i />
        </button>
        <span className="header-note">A FEW THINGS I HAVE BUILT</span>
        <nav aria-label="Profile links">
          <a href="https://github.com/buftio" target="_blank" rel="noreferrer">
            GitHub <ArrowUpRight size={13} />
          </a>
          <a
            href="https://www.linkedin.com/in/buftio"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn <ArrowUpRight size={13} />
          </a>
          <a href={resumeUrl} target="_blank" rel="noreferrer">
            Résumé <ArrowUpRight size={13} />
          </a>
        </nav>
      </header>
      <div className={`story-layer ${selected !== null ? 'is-hidden' : ''}`}>
        {leaving !== null && leaving !== active && (
          <StoryCaption key={leaving} index={leaving} leaving />
        )}
        <StoryCaption
          key={active}
          index={active}
          onEnter={() => (active < 0 ? navigate(0) : openProject(active))}
        />
      </div>
      <div className="vertical-note" aria-hidden="true">
        KEEP THE CURIOSITY. FEED THE FIRE.
      </div>
      <footer
        className={`journey-footer ${selected !== null ? 'is-hidden' : ''}`}
      >
        <div className="scroll-note">
          <ArrowDown size={17} />
          <span>SCROLL TO EXPLORE</span>
        </div>
        <nav className="project-nav" aria-label="Projects">
          {projects.map((item, index) => (
            <button
              key={item.id}
              onClick={() => navigate(index)}
              className={active === index ? 'current' : ''}
              aria-label={`Go to ${item.name}`}
              aria-current={active === index ? 'step' : undefined}
            >
              <span className="nav-title">{item.name}</span>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <i />
            </button>
          ))}
        </nav>
        <div className="journey-actions">
          <button
            aria-label="Previous project"
            onClick={() => navigate(active - 1)}
            disabled={active < 0}
          >
            <ArrowLeft size={19} />
          </button>
          <button
            aria-label="Next project"
            onClick={() => navigate(active + 1)}
            disabled={active === projects.length - 1}
          >
            <ArrowRight size={19} />
          </button>
          <button
            aria-label={paused ? 'Resume animation' : 'Pause animation'}
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? <Play size={15} /> : <Pause size={15} />}
          </button>
        </div>
      </footer>
      <div
        className="scroll-track"
        style={{ height: `${(projects.length + 1) * 100}vh` }}
        aria-hidden="true"
      />
      {opened && (
        <dialog
          className="project-dialog"
          ref={dialog}
          onCancel={closeProject}
          aria-labelledby="project-heading"
        >
          <div className="project-window-bar">
            <span>
              <i />
              <i />
              <i />
            </span>
            <span>{opened.name.toLowerCase()} / a closer look</span>
            <button onClick={closeProject} aria-label="Close project">
              <X size={19} />
            </button>
          </div>
          <article
            className="project-article"
            style={{ '--project-color': opened.color } as React.CSSProperties}
          >
            <div className="article-meta">
              <span>{opened.name}</span>
              <span>{opened.field}</span>
            </div>
            <h2 id="project-heading">{opened.title}</h2>
            <p className="article-intro">{opened.story}</p>
            <SceneBoundary compact key={opened.id}>
              <ProjectVignette project={opened} reduced={reduced} />
            </SceneBoundary>
            <div className="article-bottom">
              <div>
                <span className="eyebrow">MY PART</span>
                <h3>{opened.role}</h3>
                {opened.details.map((detail) => (
                  <p key={detail}>{detail}</p>
                ))}
              </div>
              {opened.url && (
                <a
                  className="visit-link"
                  href={opened.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {opened.id === 'lumiprobe'
                    ? 'View the code'
                    : 'Visit website'}{' '}
                  <ArrowUpRight size={17} />
                </a>
              )}
            </div>
          </article>
        </dialog>
      )}
    </main>
  )
}
