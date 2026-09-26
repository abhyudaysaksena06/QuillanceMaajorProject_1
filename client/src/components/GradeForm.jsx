import { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../api';

/** Instructor review: award marks, or send back for resubmission, with feedback. */
export default function GradeForm({ sub, max, onSaved }) {
  const [status, setStatus] = useState(sub.status === 'resubmit' ? 'resubmit' : 'graded');
  const [grade, setGrade] = useState(sub.grade ?? '');
  const [feedback, setFeedback] = useState(sub.feedback ?? '');
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`/assignments/submissions/${sub.id}/grade`, { method: 'PATCH', body: { status, grade, feedback } });
      toast.success(status === 'graded' ? 'Marks saved' : 'Resubmission requested');
      onSaved();
    } catch (err) { toast.error(err.message); }
    setBusy(false);
  };

  return (
    <form className="grade-form" onSubmit={save}>
      <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="graded">Grade</option>
        <option value="resubmit">Request resubmission</option>
      </select>
      {status === 'graded' && (
        <input className="input w-24" type="number" min={0} max={max} required value={grade} onChange={(e) => setGrade(e.target.value)} placeholder={`/${max}`} aria-label="Marks" />
      )}
      <input className="input" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder={status === 'graded' ? 'Feedback (optional)' : 'What should the student fix?'} required={status === 'resubmit'} />
      <button className="btn btn-primary btn-sm" disabled={busy}>Save</button>
    </form>
  );
}
