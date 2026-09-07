'use client'

import { useState, type Dispatch } from 'react'
import {
  Check as CheckIcon,
  MessagesSquare,
  FileSearch,
  ShieldCheck,
  Paperclip,
  Send,
} from 'lucide-react'
import {
  candidates,
  evidenceNames,
  vacancy,
  type Check,
  type Evidence,
} from './candidates'
import {
  canCheck,
  canOffer,
  revealed,
  salaryUsed,
  type Action,
  type Game,
} from './game'

export function Vacancy() {
  return (
    <aside
      className="hiring-paper hiring-vacancy"
      aria-label="Vacancy requirements"
    >
      <small>VACANCY / FS-03</small>
      <h3>{vacancy.role}</h3>
      <div className="hiring-tags">
        {vacancy.tags.map((tag) => (
          <span className="hiring-tag" key={tag}>
            {tag}
          </span>
        ))}
      </div>
      <p>
        <strong>{vacancy.years}+ years</strong> of production work. Own features
        from the screen to the database.
      </p>
      <hr />
      <p>
        Two interviews. A security check. Resolve any document mismatch, then
        agree a salary.
      </p>
      <p>For a rejection, select the document that supports your decision.</p>
      <hr />
      <dl className="hiring-facts">
        <dt>Open seats</dt>
        <dd>{vacancy.seats}</dd>
        <dt>Salary ceiling</dt>
        <dd>{vacancy.cap} each</dd>
        <dt>Shared budget</dt>
        <dd>{vacancy.budget}</dd>
      </dl>
      <small>Monthly pay in game credits.</small>
    </aside>
  )
}

export function CandidateFile({
  game,
  dispatch,
}: {
  game: Game
  dispatch: Dispatch<Action>
}) {
  const candidate = candidates[game.current]
  const file = game.files[game.current]
  const evidence = revealed(file)
  const cite = (kind: Evidence) => dispatch({ type: 'cite', evidence: kind })
  return (
    <section
      className="hiring-paper hiring-file"
      aria-label={`${candidate.name}'s application`}
    >
      <div className="hiring-file-top">
        <div>
          <small>
            APPLICATION / {String(game.current + 1).padStart(2, '0')}
          </small>
          <h3>{candidate.name}</h3>
        </div>
        <div className="hiring-initials" aria-hidden="true">
          {candidate.name
            .split(' ')
            .map((word) => word[0])
            .join('')}
        </div>
      </div>
      <p>
        <strong>{candidate.role}</strong>
      </p>
      <div className="hiring-tags">
        {candidate.tags.map((tag) => (
          <span className="hiring-tag" key={tag}>
            {tag}
          </span>
        ))}
      </div>
      <dl className="hiring-facts">
        <dt>Experience claimed</dt>
        <dd>{candidate.years} years</dd>
        <dt>Salary requested</dt>
        <dd>{candidate.ask} credits</dd>
      </dl>
      <p>{candidate.intro}</p>
      <p className="hiring-project">
        <small>RECENT PROJECT</small>
        <br />
        {candidate.project}
      </p>
      {file.seen.map((check) => (
        <div className="hiring-evidence" key={check}>
          <h4>{evidenceNames[check]}</h4>
          <p>{candidate.evidence[check]}</p>
        </div>
      ))}
      {file.reply && (
        <div className="hiring-evidence">
          <h4>Salary conversation</h4>
          <p>{file.reply}</p>
        </div>
      )}
      {!file.decision && (
        <fieldset className="hiring-citations">
          <legend>Base your decision on</legend>
          {evidence.map((kind) => (
            <label key={kind}>
              <input
                type="radio"
                name={`evidence-${candidate.id}`}
                value={kind}
                checked={file.cited === kind}
                onChange={() => cite(kind)}
              />
              <span>{evidenceNames[kind]}</span>
            </label>
          ))}
        </fieldset>
      )}
    </section>
  )
}

const tools: { check: Check; label: string; icon: typeof MessagesSquare }[] = [
  { check: 'technical', label: 'Interview · Stack', icon: MessagesSquare },
  { check: 'project', label: 'Interview · Project', icon: FileSearch },
  { check: 'security', label: 'Security check', icon: ShieldCheck },
  { check: 'clarify', label: 'Request clarification', icon: Paperclip },
]

export function DeskTools({
  game,
  dispatch,
}: {
  game: Game
  dispatch: Dispatch<Action>
}) {
  const file = game.files[game.current]
  const [salary, setSalary] = useState(file.agreed ?? file.offers.at(-1) ?? 100)
  const remaining = vacancy.budget - salaryUsed(game)
  const limit = Math.min(vacancy.cap, remaining)
  const offerEnabled = canOffer(game, salary)
  return (
    <aside
      className="hiring-paper hiring-tools"
      aria-label="Interview and offer tools"
    >
      <small>YOUR DESK</small>
      <h4>Ask for evidence</h4>
      <div className="hiring-tools-list">
        {tools.map(({ check, label, icon: Icon }) => {
          const seen = file.seen.includes(check)
          const prerequisite =
            check === 'project' && !file.seen.includes('technical')
              ? 'After the stack interview'
              : check === 'clarify' && !file.seen.includes('security')
                ? 'After the security check'
                : null
          return (
            <button
              key={check}
              className="hiring-tool"
              onClick={() => dispatch({ type: 'check', check })}
              disabled={!canCheck(game, check)}
            >
              {seen ? <CheckIcon size={17} /> : <Icon size={17} />}
              <span>
                {label}
                <small>
                  {seen ? 'Added to file' : (prerequisite ?? '1 check')}
                </small>
              </span>
            </button>
          )
        })}
      </div>
      <div className="hiring-offer">
        <div>
          <h4>Talk salary</h4>
          <label htmlFor="hiring-salary">Your offer per month</label>
          <output htmlFor="hiring-salary">
            {salary}
            <small> credits</small>
          </output>
          <input
            id="hiring-salary"
            type="range"
            min={80}
            max={120}
            step={5}
            value={salary}
            onChange={(event) => setSalary(Number(event.target.value))}
            disabled={Boolean(file.decision) || file.agreed !== undefined}
          />
        </div>
        <div>
          <p className="hiring-meta">
            {file.agreed !== undefined
              ? `Agreed: ${file.agreed} credits`
              : `${2 - file.offers.length} offers left · 1 check each`}
          </p>
          <button
            className="hiring-tool"
            disabled={!offerEnabled}
            onClick={() => dispatch({ type: 'offer', salary })}
          >
            <Send size={16} />
            Make offer
          </button>
          {salary > limit && (
            <p className="hiring-meta">
              {remaining} credits remain for both seats.
            </p>
          )}
          {!game.checks && !file.agreed && (
            <p className="hiring-meta">
              No checks left. You can still close files.
            </p>
          )}
        </div>
      </div>
    </aside>
  )
}
