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
  const [filterRole, setFilterRole] = useState('');

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

  const shown = users.filter((u) => (!filterRole || u.role === filterRole) && `${u.name} ${u.email}`.toLowerCase().includes(filter.toLowerCase()));
  const count = (r) => users.filter((u) => u.role === r).length;

  return (
    <>
      <div className="page-header"><div><p className="eyebrow">[ Administration ]</p><h1>Users</h1><p className="muted">Students, instructors and admins: roles, enrollments and account status.</p></div></div>
      <div className="stats-grid">
        {[['Users', users.length], ['Students', count('student')], ['Instructors', count('instructor')], ['Admins', count('admin')]].map(([label, n], i) => (
          <div key={label} className="stat"><p className="eyebrow"><span>{label}</span><span>0{i + 1}</span></p><div className="stat-value">{n}</div></div>
        ))}
      </div>
      <div className="toolbar">
        <input className="input" placeholder="Search by name or email" value={filter} onChange={(e) => setFilter(e.target.value)} />
        <select className="input w-auto" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
          <option value="">All roles</option><option value="student">Students</option><option value="instructor">Instructors</option><option value="admin">Admins</option>
        </select>
      </div>
      <div className="card table-wrap">
        <table className="table">
          <thead><tr><th>User</th><th>Joined</th><th>Enrollments</th><th>Courses taught</th><th>Role</th><th>Status</th></tr></thead>
          <tbody>
            {shown.map((u) => (
              <tr key={u.id}>
                <td><div className="user-cell"><Avatar user={u} size={30} /><div><strong>{u.name}</strong><div className="muted small">{u.email}</div></div></div></td>
                <td>{formatDate(u.created_at)}</td>
                <td>{u.enrollments?.[0]?.count ?? 0}</td>
                <td>{u.role === 'student' ? '—' : u.courses?.[0]?.count ?? 0}</td>
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
