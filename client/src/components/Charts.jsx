export function BarList({ data, valueKey = 'count', labelKey = 'title' }) {
  const max = Math.max(1, ...data.map((d) => d[valueKey]));
  return (
    <div className="barlist">
      {data.map((d) => (
        <div key={d[labelKey]} className="barlist-row">
          <span className="barlist-label" title={d[labelKey]}>{d[labelKey]}</span>
          <span className="barlist-track"><span className="barlist-fill" style={{ width: `${(d[valueKey] / max) * 100}%` }} /></span>
          <span className="barlist-value mono">{d[valueKey]}</span>
        </div>
      ))}
      {!data.length && <p className="muted">No data yet.</p>}
    </div>
  );
}

export function TrendChart({ data }) {
  const w = 600, h = 140, pad = 4;
  const max = Math.max(1, ...data.map((d) => d.count));
  const step = (w - pad * 2) / Math.max(1, data.length - 1);
  const pts = data.map((d, i) => [pad + i * step, h - pad - (d.count / max) * (h - pad * 2 - 14)]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const total = data.reduce((s, d) => s + d.count, 0);
  const label = (d) => new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return (
    <div className="trend">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label={`${total} enrollments in the last 30 days`}>
        <path d={`${line} L${pts.at(-1)[0]},${h} L${pts[0][0]},${h} Z`} className="trend-area" />
        <path d={line} className="trend-line" vectorEffect="non-scaling-stroke" />
        {pts.map(([x, y], i) => data[i].count > 0 && <circle key={i} cx={x} cy={y} r="2.5" className="trend-dot"><title>{label(data[i])}: {data[i].count}</title></circle>)}
      </svg>
      <div className="trend-axis mono"><span>{label(data[0])}</span><span>{total} in 30 days</span><span>{label(data.at(-1))}</span></div>
    </div>
  );
}

export function Donut({ segments }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  let offset = 0;
  const r = 40, c = 2 * Math.PI * r;
  return (
    <div className="donut">
      <svg viewBox="0 0 100 100" width="120" height="120">
        <circle cx="50" cy="50" r={r} className="donut-bg" />
        {total > 0 && segments.map((s) => {
          const len = (s.value / total) * c;
          const el = <circle key={s.label} cx="50" cy="50" r={r} className={`donut-seg ${s.tone}`} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} />;
          offset += len;
          return el;
        })}
        <text x="50" y="54" textAnchor="middle" className="donut-total">{total}</text>
      </svg>
      <ul className="donut-legend">
        {segments.map((s) => <li key={s.label}><span className={`swatch ${s.tone}`} />{s.label}<b className="mono">{s.value}</b></li>)}
      </ul>
    </div>
  );
}
