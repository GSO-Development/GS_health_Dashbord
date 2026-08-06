import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, UserPlus, Trash2, ShieldCheck, User, Mail, Key, CheckCircle, AlertCircle, Loader } from 'lucide-react';

const ManageUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    username: '',
    full_name: '',
    email: '',
    password: '',
    role: 'user'
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users');
      setUsers(response.data.users || []);
    } catch {
      setError('Failed to fetch user list');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!form.username || !form.full_name || !form.email || !form.password) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    setCreating(true);
    try {
      const res = await api.post('/users', form);
      if (res.data.success) {
        showToast(`User '${form.username}' created successfully as ${form.role.toUpperCase()}!`, 'success');
        setForm({ username: '', full_name: '', email: '', password: '', role: 'user' });
        loadUsers();
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to create user';
      showToast(msg, 'error');
    }
    setCreating(false);
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete user account '${username}'?`)) return;

    try {
      await api.delete(`/users/${userId}`);
      showToast(`User '${username}' deleted successfully`, 'success');
      loadUsers();
    } catch {
      showToast('Failed to delete user account', 'error');
    }
  };

  return (
    <div className="page-view animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '1.5rem',
          right: '1.5rem',
          zIndex: 9999,
          padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius-sm)',
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '0.875rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {toast.type === 'success' ? <CheckCircle style={{ width: '18px', height: '18px' }} /> : <AlertCircle style={{ width: '18px', height: '18px' }} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users style={{ width: '24px', height: '24px', color: 'var(--gsh-red)' }} />
          Manage Users & Roles (Admin Panel)
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
          Add user accounts and control access privileges. <strong>Standard Users</strong> see <em>Dashboard FY only</em>, while <strong>Admins</strong> see <em>all 7 pages</em>.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px minmax(0, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Form: Add New User */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <UserPlus style={{ width: '18px', height: '18px', color: 'var(--gsh-red)' }} />
            Add New Account
          </div>

          <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Username */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
                Username
              </label>
              <input
                type="text"
                placeholder="e.g. john_doe"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem 0.65rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.825rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Full Name */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem 0.65rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.825rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Email */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="e.g. john@gsh.lk"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem 0.65rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.825rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
                Password
              </label>
              <input
                type="password"
                placeholder="Enter password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem 0.65rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.825rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Role Select */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
                Role Privilege
              </label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem 0.65rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.825rem', outline: 'none' }}
              >
                <option value="user">👤 Standard User (Dashboard FY only)</option>
                <option value="admin">👑 Admin (All 7 Pages + User Management)</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={creating}
              style={{
                marginTop: '0.5rem',
                padding: '0.65rem',
                background: 'var(--accent-gradient)',
                border: 'none',
                borderRadius: 'var(--radius-xs)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: creating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 12px rgba(200, 16, 46, 0.25)'
              }}
            >
              {creating ? <Loader style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> : <UserPlus style={{ width: '16px', height: '16px' }} />}
              Create User Account
            </button>
          </form>
        </div>

        {/* Right Table: Existing User Accounts */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>
              User Accounts ({users.length})
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-main)', fontWeight: 700 }}>
                  <th style={{ padding: '0.75rem 1rem' }}>User Profile</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Email</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Role Badge</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Access Level</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading users...</td></tr>
                ) : users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{u.full_name}</div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-subtle)', fontFamily: 'monospace' }}>@{u.username}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{u.email}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        background: u.role === 'admin' ? 'rgba(200, 16, 46, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                        color: u.role === 'admin' ? 'var(--gsh-red)' : '#10b981',
                        border: `1px solid ${u.role === 'admin' ? 'rgba(200, 16, 46, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                      }}>
                        {u.role === 'admin' ? <ShieldCheck style={{ width: '13px', height: '13px' }} /> : <User style={{ width: '13px', height: '13px' }} />}
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {u.role === 'admin' ? 'All 7 Pages + User Admin' : 'Dashboard FY Only'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '0.35rem',
                          borderRadius: '4px'
                        }}
                        title="Delete User"
                      >
                        <Trash2 style={{ width: '16px', height: '16px' }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ManageUsersPage;
