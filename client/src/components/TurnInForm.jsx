import { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../api';

export default function TurnInForm({ assignment, onDone, onCancel }) {
  const sub = assignment.submission;
  const [content, setContent] = useState(sub?.content || '');
  const [link, setLink] = useState(sub?.link_url || '');
  const [file, setFile] = useState(null);
  const [keepFile, setKeepFile] = useState(Boolean(sub?.file_name));
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !link.trim() && !file && !keepFile) return toast.error('Write an answer, add a link or attach a file');
    if (link && !/^https?:\/\//i.test(link)) return toast.error('Link must start with http:// or https://');
    if (file && file.size > 10 * 1024 * 1024) return toast.error('File must be 10 MB or smaller');
    setBusy(true);
    try {
      const form = new FormData();
      form.append('content', content);
      form.append('link_url', link);
      form.append('keep_file', String(keepFile && !file));
      if (file) form.append('file', file);
      const saved = await api(`/assignments/${assignment.id}/submit`, { method: 'POST', body: form });
      toast.success(sub ? 'Submission updated' : 'Assignment turned in');
      onDone(saved);
    } catch (err) { toast.error(err.message); }
    setBusy(false);
  };

  return (
    <form className="form turn-in" onSubmit={submit}>
      {sub?.status === 'resubmit' && sub.feedback && (
        <div className="alert alert-error" style={{ margin: 0 }}><strong>Instructor feedback:</strong> {sub.feedback}</div>
      )}
      <label>Answer / notes<textarea className="input" rows={4} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your answer here" /></label>
      <div className="form-row">
        <label>Link (GitHub, Drive, live URL)<input className="input" type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" /></label>
        <label>File (PDF, ZIP, DOCX, PNG, JPG · max 10 MB)
          <input className="input" type="file" accept=".pdf,.zip,.docx,.png,.jpg,.jpeg" onChange={(e) => setFile(e.target.files[0] || null)} />
        </label>
      </div>
      {sub?.file_name && keepFile && !file && (
        <p className="small" style={{ margin: 0 }}>Attached: <span className="file-link">{sub.file_name}</span>
          <button type="button" className="link-btn danger-link" onClick={() => setKeepFile(false)}> remove</button></p>
      )}
      <div className="form-actions">
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Submitting' : sub ? 'Update submission' : 'Turn in'}</button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
