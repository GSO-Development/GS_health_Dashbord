import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Users, UserPlus, Trash2, ShieldCheck, User, Mail, Key, 
  CheckCircle, AlertCircle, Loader, Search, X, Layers, Globe, Info,
  RefreshCw, LogIn, AlertTriangle
} from 'lucide-react';

const ManageUsersPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [toast, setToast] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('system'); // 'system' or 'microsoft'
  const [submitting, setSubmitting] = useState(false);

  // System User Form State
  const [systemForm, setSystemForm] = useState({
    username: '',
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  });

  // Microsoft User Search State
  const [msQuery, setMsQuery] = useState('');
  const [msSearching, setMsSearching] = useState(false);
  const [msSearchResults, setMsSearchResults] = useState([]);
  const [selectedMsUser, setSelectedMsUser] = useState(null);
  const [msRole, setMsRole] = useState('user');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadUsers = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const response = await api.get('/users');
      setUsers(response.data.users || []);
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      if (status === 401) {
        setFetchError('Your login session has expired or is invalid. Please log in again with an administrator account.');
        showToast('Session expired. Please log in again.', 'error');
      } else if (status === 403) {
        setFetchError('Administrator privileges are required to view and manage users.');
        showToast('Admin privileges required.', 'error');
      } else {
        setFetchError(detail || 'Failed to fetch user list from server. Please check your network connection.');
        showToast(detail || 'Failed to fetch user list', 'error');
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Handle Microsoft Graph User Search
  useEffect(() => {
    if (!msQuery || msQuery.trim().length < 2 || selectedMsUser) {
      setMsSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setMsSearching(true);
      try {
        const res = await api.get('/auth/microsoft/search-users', {
          params: { q: msQuery }
        });
        setMsSearchResults(res.data.users || []);
      } catch (err) {
        console.warn('Graph API Search error:', err);
      }
      setMsSearching(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [msQuery, selectedMsUser]);

  // Submit System User
  const handleCreateSystemUser = async (e) => {
    e.preventDefault();
    if (!systemForm.username || !systemForm.full_name || !systemForm.email || !systemForm.password) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    if (systemForm.password !== systemForm.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/users', {
        account_type: 'system',
        username: systemForm.username,
        full_name: systemForm.full_name,
        email: systemForm.email,
        password: systemForm.password,
        role: systemForm.role
      });
      if (res.data.success) {
        showToast(res.data.message || 'System user created successfully', 'success');
        setSystemForm({ username: '', full_name: '', email: '', password: '', confirmPassword: '', role: 'user' });
        setShowModal(false);
        loadUsers();
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to create system user';
      showToast(msg, 'error');
    }
    setSubmitting(false);
  };

  // Submit Microsoft User (via Graph API search selection)
  const handleCreateMicrosoftUser = async (e) => {
    e.preventDefault();

    if (!selectedMsUser) {
      showToast('Please search and select a Microsoft user', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/users', {
        account_type: 'microsoft',
        email: selectedMsUser.mail,
        full_name: selectedMsUser.displayName,
        username: selectedMsUser.mail.split('@')[0].toLowerCase(),
        azure_oid: selectedMsUser.azure_oid,
        role: msRole
      });
      if (res.data.success) {
        showToast(res.data.message || 'Microsoft account added successfully', 'success');
        setSelectedMsUser(null);
        setMsQuery('');
        setMsSearchResults([]);
        setShowModal(false);
        loadUsers();
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to add Microsoft user';
      showToast(msg, 'error');
    }
    setSubmitting(false);
  };

  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Are you sure you want to delete user account '${name}'?`)) return;

    try {
      await api.delete(`/users/${userId}`);
      showToast(`User '${name}' deleted successfully`, 'success');
      loadUsers();
    } catch {
      showToast('Failed to delete user account', 'error');
    }
  };

  // Summary Metrics
  const totalUsers = users.length;
  const adminUsers = users.filter(u => u.role === 'admin').length;
  const standardUsers = users.filter(u => u.role === 'user').length;
  const msAccounts = users.filter(u => u.account_type === 'microsoft').length;

  return (
    <div className="page-view animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '1.5rem',
          right: '1.5rem',
          zIndex: 99999999,
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

      {/* Top Header & Actions Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users style={{ width: '26px', height: '26px', color: 'var(--gsh-red)' }} />
            User Access & Permissions Management
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
            Control system access privileges, manage executive accounts, and link Microsoft Azure AD Entra ID users.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, #c8102e 0%, #a00c24 100%)',
            border: 'none',
            borderRadius: '24px',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.9rem',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(200, 16, 46, 0.4)',
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <UserPlus style={{ width: '18px', height: '18px' }} />
          Add User Account
        </button>
      </div>

      {/* Top Summary KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Total Users */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
            <Users style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Users</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1.1 }}>{totalUsers}</div>
          </div>
        </div>

        {/* Admin Accounts */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(200, 16, 46, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gsh-red)' }}>
            <ShieldCheck style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Admin Privileges</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1.1 }}>{adminUsers}</div>
          </div>
        </div>

        {/* Standard Users */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
            <User style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Standard Users</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1.1 }}>{standardUsers}</div>
          </div>
        </div>

        {/* Microsoft Accounts */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
            <Globe style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Microsoft Entra ID</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1.1 }}>{msAccounts}</div>
          </div>
        </div>
      </div>

      {/* Error Alert Banner if fetch failed */}
      {fetchError && (
        <div style={{
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle style={{ width: '22px', height: '22px', color: '#ef4444', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 800, color: '#ef4444', fontSize: '0.9rem' }}>Access Error / Session Expired</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>{fetchError}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => loadUsers()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              <RefreshCw style={{ width: '14px', height: '14px' }} />
              Retry
            </button>
            <button
              onClick={() => navigate('/login')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                background: '#c8102e',
                border: 'none',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              <LogIn style={{ width: '14px', height: '14px' }} />
              Login as Admin
            </button>
          </div>
        </div>
      )}

      {/* Main User Accounts Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Registered Users Directory ({users.length})
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-main)', fontWeight: 700 }}>
                <th style={{ padding: '0.85rem 1.25rem' }}>User Profile</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Email Address</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Account Type</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Role Privilege</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Access Scope</th>
                <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading users list...</td></tr>
              ) : fetchError ? (
                <tr>
                  <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
                    <AlertCircle style={{ width: '24px', height: '24px', margin: '0 auto 0.5rem auto', display: 'block' }} />
                    <span style={{ fontWeight: 700 }}>{fetchError}</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No users registered. Click 'Add User Account' above to create one.</td></tr>
              ) : users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{u.full_name}</div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-subtle)', fontFamily: 'monospace' }}>@{u.username}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)' }}>{u.email}</td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      background: u.account_type === 'microsoft' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                      color: u.account_type === 'microsoft' ? '#3b82f6' : 'var(--text-muted)',
                      border: `1px solid ${u.account_type === 'microsoft' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(100, 116, 139, 0.3)'}`
                    }}>
                      {u.account_type === 'microsoft' ? '⚡ Microsoft' : '🖥️ System'}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.2rem 0.6rem',
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
                  <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                    {u.role === 'admin' ? 'All Pages + User Admin' : 'Dashboard FY Only'}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                    <button
                      onClick={() => handleDeleteUser(u.id, u.full_name)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '0.4rem',
                        borderRadius: '4px'
                      }}
                      title="Delete User"
                    >
                      <Trash2 style={{ width: '17px', height: '17px' }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP MODAL: Add User Account (Z-INDEX HIGH OVERLAY) */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999999, // Super high z-index to stay above topbar and sidebar!
          padding: '1.25rem',
          boxSizing: 'border-box'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            width: '100%',
            maxWidth: '540px',
            maxHeight: '88vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.1rem 1.5rem',
              background: 'var(--bg-hover)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0
            }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus style={{ width: '20px', height: '20px', color: 'var(--gsh-red)' }} />
                Add New User Account
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
              >
                <X style={{ width: '22px', height: '22px' }} />
              </button>
            </div>

            {/* Modal Tabs Header */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setActiveTab('system')}
                style={{
                  flex: 1,
                  padding: '0.85rem',
                  border: 'none',
                  borderBottom: activeTab === 'system' ? '3px solid var(--gsh-red)' : 'none',
                  background: activeTab === 'system' ? 'var(--bg-card)' : 'transparent',
                  color: activeTab === 'system' ? 'var(--text-main)' : 'var(--text-muted)',
                  fontWeight: activeTab === 'system' ? 800 : 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                🖥️ System User
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('microsoft')}
                style={{
                  flex: 1,
                  padding: '0.85rem',
                  border: 'none',
                  borderBottom: activeTab === 'microsoft' ? '3px solid #3b82f6' : 'none',
                  background: activeTab === 'microsoft' ? 'var(--bg-card)' : 'transparent',
                  color: activeTab === 'microsoft' ? '#3b82f6' : 'var(--text-muted)',
                  fontWeight: activeTab === 'microsoft' ? 800 : 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                ⚡ Microsoft User
              </button>
            </div>

            {/* Modal Scrollable Content Container */}
            <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>

              {/* Tab 1: System User Form */}
              {activeTab === 'system' && (
                <form onSubmit={handleCreateSystemUser} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
                      Username *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. john_doe"
                      value={systemForm.username}
                      onChange={e => setSystemForm(f => ({ ...f, username: e.target.value }))}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={systemForm.full_name}
                      onChange={e => setSystemForm(f => ({ ...f, full_name: e.target.value }))}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. john@gsh.lk"
                      value={systemForm.email}
                      onChange={e => setSystemForm(f => ({ ...f, email: e.target.value }))}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
                        Password *
                      </label>
                      <input
                        type="password"
                        placeholder="Password"
                        value={systemForm.password}
                        onChange={e => setSystemForm(f => ({ ...f, password: e.target.value }))}
                        style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        placeholder="Confirm password"
                        value={systemForm.confirmPassword}
                        onChange={e => setSystemForm(f => ({ ...f, confirmPassword: e.target.value }))}
                        style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
                      Role Privilege *
                    </label>
                    <select
                      value={systemForm.role}
                      onChange={e => setSystemForm(f => ({ ...f, role: e.target.value }))}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.85rem', outline: 'none' }}
                    >
                      <option value="user">👤 Standard User (Dashboard FY only)</option>
                      <option value="admin">👑 Admin (All 7 Pages + User Management)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      style={{ padding: '0.6rem 1.1rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      style={{ padding: '0.6rem 1.4rem', background: 'linear-gradient(135deg, #c8102e 0%, #a00c24 100%)', border: 'none', borderRadius: 'var(--radius-xs)', color: '#ffffff', fontWeight: 800, fontSize: '0.85rem', cursor: submitting ? 'not-allowed' : 'pointer' }}
                    >
                      {submitting ? 'Creating...' : 'Create System Account'}
                    </button>
                  </div>
                </form>
              )}

              {/* Tab 2: Microsoft User Form (Search + Manual Email Entry) */}
              {activeTab === 'microsoft' && (
                <form onSubmit={handleCreateMicrosoftUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                  {/* Search Bar - Single clean input */}
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.3rem' }}>
                      Search Microsoft Organizational Users
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: selectedMsUser ? '#10b981' : 'var(--text-subtle)' }} />
                      <input
                        type="text"
                        placeholder="Type a name or email to search..."
                        value={msQuery}
                        onChange={e => {
                          setMsQuery(e.target.value);
                          if (selectedMsUser) setSelectedMsUser(null);
                        }}
                        style={{
                          width: '100%',
                          padding: '0.6rem 2.2rem 0.6rem 2.2rem',
                          background: selectedMsUser ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-primary)',
                          border: selectedMsUser ? '1px solid #10b981' : '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-xs)',
                          color: selectedMsUser ? '#10b981' : 'var(--text-main)',
                          fontWeight: selectedMsUser ? 700 : 400,
                          fontSize: '0.875rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                      {selectedMsUser ? (
                        <button
                          type="button"
                          onClick={() => { setSelectedMsUser(null); setMsQuery(''); setMsSearchResults([]); }}
                          style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 800, lineHeight: 1 }}
                          title="Clear selection and search again"
                        >✕</button>
                      ) : msSearching ? (
                        <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Searching...
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Search Results Dropdown List (hides when user is selected) */}
                  {!selectedMsUser && msQuery.trim().length >= 2 && (
                    <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', background: 'var(--bg-primary)' }}>
                      {msSearching ? (
                        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                          Searching Microsoft Graph API...
                        </div>
                      ) : msSearchResults.length === 0 ? (
                        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                          No matching users found
                        </div>
                      ) : (
                        <div style={{ padding: '0.3rem' }}>
                          {msSearchResults.map((u, idx) => (
                            <div
                              key={idx}
                              onClick={() => {
                                setSelectedMsUser(u);
                                setMsQuery(`${u.displayName} (${u.mail})`);
                                setMsSearchResults([]);
                              }}
                              style={{
                                padding: '0.55rem 0.75rem',
                                borderRadius: '6px',
                                background: 'transparent',
                                border: '1px solid transparent',
                                cursor: 'pointer',
                                marginBottom: '0.15rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'background 0.15s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>{u.displayName}</div>
                                <div style={{ fontSize: '0.77rem', color: '#60a5fa' }}>{u.mail}</div>
                              </div>
                              <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600 }}>Select ➔</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selected User Summary Badge */}
                  {selectedMsUser && (
                    <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-xs)', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <CheckCircle style={{ width: '14px', height: '14px' }} /> Selected User Ready To Add
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--text-main)' }}>{selectedMsUser.displayName}</div>
                        <div style={{ fontSize: '0.79rem', color: '#6ee7b7' }}>{selectedMsUser.mail}</div>
                      </div>
                    </div>
                  )}

                  {/* Role Select */}
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
                      Assign Role Privilege *
                    </label>
                    <select
                      value={msRole}
                      onChange={e => setMsRole(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.85rem', outline: 'none' }}
                    >
                      <option value="user">👤 Standard User (Dashboard FY only)</option>
                      <option value="admin">👑 Admin (All 7 Pages + User Management)</option>
                    </select>
                  </div>

                  {/* Submit Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.3rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      style={{ padding: '0.6rem 1.1rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !selectedMsUser}
                      style={{ padding: '0.6rem 1.4rem', background: selectedMsUser ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 'var(--bg-tertiary)', border: 'none', borderRadius: 'var(--radius-xs)', color: selectedMsUser ? '#ffffff' : 'var(--text-muted)', fontWeight: 800, fontSize: '0.85rem', cursor: (submitting || !selectedMsUser) ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                    >
                      {submitting ? 'Adding...' : '+ Add Microsoft User'}
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageUsersPage;
