export default function ProgressBar({ value, showLabel = true }) {
  return (
    <div className="progress">
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      {showLabel && <span className="progress-label">{value}%</span>}
    </div>
  );
}
