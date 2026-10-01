import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Loader from '../components/Loader';

export default function Certificate() {
  const { id } = useParams();
  const [cert, setCert] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${(import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '')}/api/public/certificates/${id}`)
      .then(async (r) => (r.ok ? setCert(await r.json()) : setError(r.status === 404 ? 'No certificate exists with this ID.' : 'Could not verify right now.')))
      .catch(() => setError('Could not reach the server.'));
  }, [id]);

  if (error) {
    return (
      <div className="auth-page single">
        <div className="card onboarding">
          <p className="eyebrow">[ Verification ]</p>
          <h1 style={{ margin: 0 }}>Not verified</h1>
          <p className="muted">{error}</p>
          <Link to="/" className="btn btn-ghost">LearnSphere home</Link>
        </div>
      </div>
    );
  }
  if (!cert) return <Loader full />;

  const date = new Date(cert.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const verifyUrl = window.location.href;

  return (
    <div className="cert-page">
      <div className="cert-actions no-print">
        <Link to="/" className="wordmark">LearnSphere</Link>
        <span className="badge badge-success">Verified certificate</span>
        <button className="btn btn-primary btn-sm" onClick={() => window.print()}>Print / save as PDF</button>
      </div>
      <article className="certificate">
        <span className="cert-deva" aria-hidden>विद्या</span>
        <p className="eyebrow">LearnSphere · Certificate of completion</p>
        <p className="cert-lead">This certifies that</p>
        <h1>{cert.user?.name}</h1>
        <p className="cert-lead">has successfully completed every module of</p>
        <h2>{cert.course?.title}</h2>
        {cert.course?.duration && <p className="muted">{cert.course.duration} course</p>}
        <div className="cert-foot">
          <div><p className="eyebrow">Instructor</p><p>{cert.course?.instructor?.name}</p></div>
          <div className="stamp"><div><b>✓</b><span>complete</span></div></div>
          <div><p className="eyebrow">Completed on</p><p>{date}</p></div>
        </div>
        <p className="cert-id mono">Credential ID {cert.certificate_id} · verify at {verifyUrl}</p>
      </article>
    </div>
  );
}
