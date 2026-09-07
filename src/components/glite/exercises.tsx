'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, BookOpen, Search, Check, RotateCcw } from 'lucide-react'

const entries = [
  {
    word: 'desert',
    sound: 'DEZ-ert',
    kind: 'noun',
    meaning: 'A dry place with very little rain.',
    example: 'There is a cactus in the desert.',
  },
  {
    word: 'dessert',
    sound: 'di-ZERT',
    kind: 'noun',
    meaning: 'Something sweet at the end of a meal.',
    example: 'I would like cake for dessert.',
  },
  {
    word: 'piece of cake',
    sound: '',
    kind: 'idiom',
    meaning: 'Something that is easy to do.',
    example: 'After a little practice, this test was a piece of cake.',
  },
  {
    word: 'spill the beans',
    sound: '',
    kind: 'idiom',
    meaning: 'To tell someone a secret.',
    example: 'Please do not spill the beans about the party.',
  },
  {
    word: 'under the weather',
    sound: '',
    kind: 'idiom',
    meaning: 'Feeling a little ill.',
    example: 'I am staying home. I feel under the weather.',
  },
  {
    word: 'break the ice',
    sound: '',
    kind: 'idiom',
    meaning: 'To help people feel comfortable together.',
    example: 'A quick game helped us break the ice.',
  },
]

export function Dictionary({
  word,
  onWord,
}: {
  word: string
  onWord: (word: string) => void
}) {
  const [query, setQuery] = useState('')
  const entry = entries.find((item) => item.word === word) ?? entries[0]
  const matches = query.trim()
    ? entries.filter((item) => item.word.includes(query.trim().toLowerCase()))
    : entries.slice(0, 2)
  return (
    <div className="glite-book" id="glite-dictionary">
      <div className="book-page book-index">
        <span className="object-caption">My dictionary</span>
        <label className="dictionary-search">
          <Search size={15} aria-hidden="true" />
          <input
            aria-label="Look up a word"
            placeholder="Find a word"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="word-index" aria-label="Dictionary words">
          {matches.map((item) => (
            <button
              key={item.word}
              aria-pressed={word === item.word}
              onClick={() => onWord(item.word)}
            >
              {item.word}
              <ArrowRight size={13} />
            </button>
          ))}
          {!matches.length && (
            <p className="dictionary-empty">
              No match in this small dictionary. Try “cake” or “desert”.
            </p>
          )}
        </div>
        <span className="book-page-number">01</span>
      </div>
      <div className="book-page book-definition" aria-live="polite">
        <span className="book-tab" aria-hidden="true" />
        <span className="object-caption">{entry.kind}</span>
        <h3>{entry.word}</h3>
        {entry.sound && <span className="word-sound">{entry.sound}</span>}
        <p>{entry.meaning}</p>
        <p className="word-example">{entry.example}</p>
        <span className="book-page-number">02</span>
      </div>
    </div>
  )
}

const questions = [
  {
    idiom: 'piece of cake',
    sentence: 'The test was a piece of cake.',
    choices: ['It was easy.', 'It was about baking.', 'It took all day.'],
    answer: 0,
    explanation: 'A piece of cake is something easy. No actual cake required.',
  },
  {
    idiom: 'spill the beans',
    sentence: 'Who spilled the beans?',
    choices: ['Who made dinner?', 'Who told the secret?', 'Who left early?'],
    answer: 1,
    explanation: 'To spill the beans is to reveal a secret.',
  },
  {
    idiom: 'under the weather',
    sentence: 'I am a little under the weather.',
    choices: ['I am outside.', 'I like the rain.', 'I feel a little ill.'],
    answer: 2,
    explanation: 'Under the weather means feeling unwell.',
  },
  {
    idiom: 'break the ice',
    sentence: 'That joke helped break the ice.',
    choices: [
      'It made everyone comfortable.',
      'It was very cold.',
      'It ended the conversation.',
    ],
    answer: 0,
    explanation: 'Breaking the ice makes it easier to start talking.',
  },
]

export function QuizPhone({ onLookup }: { onLookup: (word: string) => void }) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [finished, setFinished] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const feed = useRef<HTMLDivElement>(null)
  const moveFocus = useRef(false)
  const question = questions[index]
  const answer = answers[index] ?? null
  const score = answers.filter(
    (value, i) => value === questions[i].answer,
  ).length
  const percent = Math.round((score / questions.length) * 100)
  const encouragement = [
    'Four new expressions to take with you. Give them another try.',
    'One down, three to practise. You have made a start.',
    'Two down, two to practise. You are getting there.',
    'Nice work. Just one expression to revisit.',
    'All four! Ready to try them in a conversation?',
  ][score]
  useEffect(() => {
    if (moveFocus.current) {
      heading.current?.focus({ preventScroll: true })
      feed.current?.scrollTo({ top: 0, behavior: 'instant' })
      moveFocus.current = false
    }
  }, [index, finished])
  const next = () => {
    if (answer === null) return
    moveFocus.current = true
    if (index === questions.length - 1) setFinished(true)
    else setIndex((value) => value + 1)
  }
  const restart = () => {
    moveFocus.current = true
    setIndex(0)
    setAnswers([])
    setFinished(false)
  }
  return (
    <div className="glite-phone">
      <div className="phone-side" aria-hidden="true" />
      <div className="phone-screen">
        <div className="phone-status" aria-hidden="true">
          <span>9:41</span>
          <span className="phone-camera" />
          <span>● ▰</span>
        </div>
        <div className="phone-app">
          <span>glite</span>
          <span
            aria-label={
              finished
                ? 'Your result'
                : `Question ${index + 1} of ${questions.length}`
            }
          >
            {finished ? 'Your result' : `${index + 1} / ${questions.length}`}
          </span>
        </div>
        <div
          ref={feed}
          className={`phone-feed${finished ? ' quiz-result' : ''}`}
        >
          {finished ? (
            <>
              <div className="quiz-score" aria-hidden="true">
                <svg viewBox="0 0 120 120">
                  <circle className="score-track" cx="60" cy="60" r="52" />
                  <circle
                    className="score-progress"
                    cx="60"
                    cy="60"
                    r="52"
                    pathLength="100"
                    strokeDasharray={`${percent} 100`}
                  />
                </svg>
                <strong>
                  {percent}
                  <span>%</span>
                </strong>
              </div>
              <h3 ref={heading} tabIndex={-1}>
                <span className="sr-only">{percent}% correct. </span>
                {score} of {questions.length} correct
              </h3>
              <p>{encouragement}</p>
              <ul className="quiz-recap" aria-label="Your answers">
                {questions.map((item, i) => (
                  <li key={item.idiom}>
                    {answers[i] === item.answer ? (
                      <Check size={14} aria-label="Correct" />
                    ) : (
                      <RotateCcw size={13} aria-label="To practise" />
                    )}
                    <button onClick={() => onLookup(item.idiom)}>
                      {item.idiom}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <h3 ref={heading} tabIndex={-1}>
                {question.sentence}
              </h3>
              <p>What does it mean?</p>
              <div className="quiz-choices">
                {question.choices.map((choice, i) => (
                  <button
                    key={choice}
                    onClick={() =>
                      setAnswers((values) =>
                        values[index] === undefined ? [...values, i] : values,
                      )
                    }
                    aria-disabled={answer !== null}
                    aria-pressed={answer !== null ? answer === i : undefined}
                    className={
                      answer !== null
                        ? i === question.answer
                          ? 'correct'
                          : i === answer
                            ? 'incorrect'
                            : ''
                        : ''
                    }
                  >
                    <span className="quiz-letter">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="quiz-choice-text">{choice}</span>
                    {answer !== null && i === question.answer && (
                      <>
                        <Check size={16} aria-hidden="true" />
                        <span className="sr-only">Correct answer</span>
                      </>
                    )}
                    {answer === i && i !== question.answer && (
                      <span className="sr-only">Incorrect answer</span>
                    )}
                  </button>
                ))}
              </div>
              <output className="quiz-feedback" aria-live="polite">
                {answer !== null && (
                  <>
                    <strong>
                      {answer === question.answer
                        ? 'That is it.'
                        : 'Not quite.'}
                    </strong>{' '}
                    {question.explanation}
                  </>
                )}
              </output>
            </>
          )}
        </div>
        <div className="phone-actions">
          {finished ? (
            <button className="quiz-restart" onClick={restart}>
              <RotateCcw size={16} /> {percent}% · Try again
            </button>
          ) : (
            <>
              <button
                onClick={() => onLookup(question.idiom)}
                aria-label={`Look up ${question.idiom}`}
              >
                <BookOpen size={16} /> Look up
              </button>
              <button
                onClick={next}
                disabled={answer === null}
                aria-label={
                  index === questions.length - 1
                    ? 'See quiz results'
                    : 'Next idiom question'
                }
              >
                {index === questions.length - 1 ? 'Results' : 'Next'}{' '}
                <ArrowRight size={16} />
              </button>
            </>
          )}
        </div>
        <div className="phone-home" aria-hidden="true" />
      </div>
    </div>
  )
}
