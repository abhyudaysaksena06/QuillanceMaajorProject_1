import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import Avatar from '../components/Avatar';
import { formatDate } from '../utils';

export default function Admin() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState(null);
  const [filter, setFilter] = useState('');

  const load = () => api('/admin/users').then(setUsers);
  useEffect(() => { load(); }, []);
  if (!users) return <Loader />;

  const update = async (u, body) => {
    try {
      await api(`/admin/users/${u.id}`, { method: 'PATCH', body });
      toast.success('User updated');
      load();
    } catch (e) { toast.error(e.message); }
  };

  const shown = users.filter((u) => `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(filter.toLowerCase()));
  const count = (r) => users.filter((u) => u.role === r).length;

  return (
    <>
      <div className="page-header"><div><h1>Admin Panel</h1><p className="muted">Manage users and roles.</p></div></div>
      <div className="stats-grid">
        <div className="stat card accent-indigo"><span className="stat-icon">👥</span><div><div className="stat-value">{users.length}</div><div className="muted small">Total users</div></div></div>
        <div className="stat card accent-green"><span className="stat-icon">🎒</span><div><div className="stat-value">{count('student')}</div><div className="muted small">Students</div></div></div>
        <div className="stat card accent-amber"><span className="stat-icon">🧑‍🏫</span><div><div className="stat-value">{count('instructor')}</div><div className="muted small">Instructors</div></div></div>
        <div className="stat card accent-pink"><span className="stat-icon">🛡️</span><div><div className="stat-value">{count('admin')}</div><div className="muted small">Admins</div></div></div>
      </div>
      <div className="toolbar"><input className="input" placeholder="🔍 Search users…" value={filter} onChange={(e) => setFilter(e.target.value)} /></div>
      <div className="card table-wrap">
        <table className="table">
          <thead><tr><th>User</th><th>Joined</th><th>Role</th><th>Status</th></tr></thead>
          <tbody>
            {shown.map((u) => (
              <tr key={u.id}>
                <td><div className="user-cell"><Avatar user={u} size={30} /><div><strong>{u.name}</strong><div className="muted small">{u.email}</div></div></div></td>
                <td>{formatDate(u.created_at)}</td>
                <td>
                  <select className="input w-auto" value={u.role} disabled={u.id === me.id} onChange={(e) => update(u, { role: e.target.value })}>
                    <option value="student">Student</option><option value="instructor">Instructor</option><option value="admin">Admin</option>
                  </select>
                </td>
                <td>
                  <button className={`btn btn-sm ${u.is_active ? 'btn-ghost' : 'btn-success'}`} disabled={u.id === me.id} onClick={() => update(u, { is_active: !u.is_active })}>
                    {u.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
