/**
 * Segmented progress: one tick per module when `total` is known,
 * otherwise a continuous hairline bar.
 */
export default function ProgressBar({ value, total, done, showLabel = true }) {
  const segmented = total > 0 && total <= 24;
  const filled = done ?? Math.round((value / 100) * (total || 0));
  return (
    <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      {segmented ? (
        <div className="progress-track">
          {Array.from({ length: total }, (_, i) => <span key={i} className={`progress-seg ${i < filled ? 'on' : ''}`} />)}
        </div>
      ) : (
        <div className="progress-track solid"><div className="progress-fill" style={{ width: `${Math.min(100, value)}%` }} /></div>
      )}
      {showLabel && <span className="progress-label">{String(value).padStart(2, '0')}%</span>}
    </div>
  );
}
