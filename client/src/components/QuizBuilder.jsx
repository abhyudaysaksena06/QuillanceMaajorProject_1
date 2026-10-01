const blank = () => ({ question: '', options: ['', ''], answer: 0, explanation: '' });

export default function QuizBuilder({ quiz = [], passMark = 60, onChange }) {
  const update = (next, mark = passMark) => onChange(next, mark);
  const setQ = (i, patch) => update(quiz.map((q, j) => (j === i ? { ...q, ...patch } : q)));

  return (
    <div className="quiz-builder">
      <div className="card-header" style={{ marginBottom: '.4rem' }}>
        <strong className="small">Module quiz (optional). Students must pass it to complete the module.</strong>
        {quiz.length > 0 && (
          <label className="pass-mark">Pass mark %
            <input className="input w-24" type="number" min={0} max={100} value={passMark} onChange={(e) => update(quiz, Number(e.target.value))} />
          </label>
        )}
      </div>
      {quiz.map((q, i) => (
        <div key={i} className="qb-question">
          <div className="resource-row">
            <span className="mono accent small">{String(i + 1).padStart(2, '0')}</span>
            <input className="input" placeholder="Question" value={q.question} onChange={(e) => setQ(i, { question: e.target.value })} />
            <button type="button" className="icon-btn" title="Remove question" onClick={() => update(quiz.filter((_, j) => j !== i))}>×</button>
          </div>
          {q.options.map((o, oi) => (
            <div key={oi} className="resource-row qb-option">
              <input type="radio" name={`answer-${i}`} checked={q.answer === oi} onChange={() => setQ(i, { answer: oi })} title="Correct answer" />
              <input className="input" placeholder={`Option ${oi + 1}`} value={o}
                onChange={(e) => setQ(i, { options: q.options.map((x, k) => (k === oi ? e.target.value : x)) })} />
              {q.options.length > 2 && (
                <button type="button" className="icon-btn" onClick={() => setQ(i, {
                  options: q.options.filter((_, k) => k !== oi),
                  answer: q.answer === oi ? 0 : q.answer > oi ? q.answer - 1 : q.answer,
                })}>×</button>
              )}
            </div>
          ))}
          <div className="resource-row">
            {q.options.length < 6 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setQ(i, { options: [...q.options, ''] })}>+ option</button>}
            <input className="input" placeholder="Explanation shown after submitting (optional)" value={q.explanation || ''} onChange={(e) => setQ(i, { explanation: e.target.value })} />
          </div>
        </div>
      ))}
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => update([...quiz, blank()])}>+ question</button>
    </div>
  );
}
