import { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../api';

export default function QuizPanel({ lesson, passed, onPassed }) {
  const [answers, setAnswers] = useState(() => lesson.quiz.map(() => null));
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (answers.some((a) => a === null)) return toast.error('Answer every question');
    setBusy(true);
    try {
      const r = await api(`/lessons/${lesson.id}/quiz`, { method: 'POST', body: { answers } });
      setResult(r);
      if (r.passed) {
        toast.success(`Passed with ${r.score}%`);
        onPassed(r);
      } else {
        toast.error(`${r.score}%: you need ${r.pass_mark}% to pass`);
      }
    } catch (e) { toast.error(e.message); }
    setBusy(false);
  };

  const retry = () => { setAnswers(lesson.quiz.map(() => null)); setResult(null); };

  return (
    <div className="quiz">
      <div className="card-header">
        <div><p className="eyebrow">Knowledge check · pass mark {lesson.pass_mark}%</p><h3 style={{ margin: '.3rem 0 0' }}>Module quiz</h3></div>
        {passed && !result && <span className="badge badge-success">Passed</span>}
        {result && <span className={`badge ${result.passed ? 'badge-success' : 'badge-danger'}`}>{result.score}%</span>}
      </div>
      {lesson.quiz.map((q, qi) => {
        const r = result?.results[qi];
        return (
          <fieldset key={qi} className="quiz-q">
            <legend><span className="mono accent">{String(qi + 1).padStart(2, '0')}</span> {q.question}</legend>
            {q.options.map((o, oi) => {
              const state = r ? (oi === r.answer ? 'right' : oi === answers[qi] ? 'wrong' : '') : '';
              return (
                <label key={oi} className={`quiz-opt ${answers[qi] === oi ? 'chosen' : ''} ${state}`}>
                  <input type="radio" name={`q${qi}`} checked={answers[qi] === oi} disabled={!!result}
                    onChange={() => setAnswers(answers.map((a, i) => (i === qi ? oi : a)))} />
                  {o}
                </label>
              );
            })}
            {r?.explanation && <p className="muted small quiz-expl">{r.explanation}</p>}
          </fieldset>
        );
      })}
      <div className="form-actions">
        {!result && <button className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? 'Checking' : 'Submit answers'}</button>}
        {result && !result.passed && <button className="btn btn-ghost" onClick={retry}>Try again</button>}
      </div>
    </div>
  );
}
