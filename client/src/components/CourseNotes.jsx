import { useEffect, useState } from 'react';

const snippets = [
  ['Definition', '**Term:** '],
  ['Key point', '- '],
  ['Code', '```\n\n```'],
];

export default function CourseNotes({ courseId, courseTitle }) {
  const key = `learnsphere-notes-${courseId}`;
  const [text, setText] = useState(() => { try { return localStorage.getItem(key) || ''; } catch { return ''; } });
  const [open, setOpen] = useState(false);

  useEffect(() => { try { localStorage.setItem(key, text); } catch { /* storage unavailable */ } }, [key, text]);

  const download = () => {
    const blob = new Blob([`${courseTitle}: notes\n\n${text}`], { type: 'text/plain' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${courseTitle.replace(/\W+/g, '_')}_notes.txt` });
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="notes">
      <button className="notes-toggle" onClick={() => setOpen(!open)}>
        <span>My notes</span><span className="mono small">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <>
          <div className="row-actions">
            {snippets.map(([label, s]) => <button key={label} className="btn btn-ghost btn-sm" onClick={() => setText((t) => `${t}${t && !t.endsWith('\n') ? '\n' : ''}${s}`)}>{label}</button>)}
          </div>
          <textarea className="input" rows={9} value={text} onChange={(e) => setText(e.target.value)} placeholder="Notes are saved in this browser as you type." />
          <div className="notes-foot">
            <span className="muted small">{text.length ? 'Saved' : 'Empty'}</span>
            <button className="btn btn-ghost btn-sm" onClick={download} disabled={!text}>Export .txt</button>
          </div>
        </>
      )}
    </div>
  );
}
