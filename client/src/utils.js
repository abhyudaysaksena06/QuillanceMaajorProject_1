export const formatDate = (d) =>
  d ? new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export function relativeDue(d) {
  if (!d) return 'No due date';
  const days = Math.ceil((new Date(d) - Date.now()) / 86400000);
  if (days < 0) return 'Overdue';
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
}

/** Converts a YouTube/Vimeo URL into an embeddable URL. */
export function toEmbedUrl(url) {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

/** ISO string -> value for <input type="datetime-local"> */
export function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export const RESOURCE_TYPES = {
  notes: 'Notes', pdf: 'PDF', video: 'Video', code: 'Source code', reference: 'Reference', exercise: 'Exercise',
};

/** Badge for a student's submission state. */
export function submissionBadge(sub, maxPoints, dueDate) {
  if (!sub) {
    return dueDate && new Date(dueDate) < new Date()
      ? { cls: 'badge-danger', text: 'Missed' } : { cls: 'badge-warning', text: relativeDue(dueDate) };
  }
  if (sub.status === 'graded') return { cls: 'badge-success', text: `Graded: ${sub.grade}/${maxPoints}` };
  if (sub.status === 'resubmit') return { cls: 'badge-danger', text: 'Resubmission requested' };
  return { cls: 'badge-info', text: 'Submitted' };
}

export const isLate = (sub, dueDate) => Boolean(sub && dueDate && new Date(sub.submitted_at) > new Date(dueDate));

/** Short, stable pseudo commit hash for the activity log. */
export function shortHash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 7);
}
