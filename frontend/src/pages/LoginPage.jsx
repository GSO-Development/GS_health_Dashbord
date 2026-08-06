import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, ShieldCheck, ArrowRight, AlertCircle, Loader, KeyRound } from 'lucide-react';
import GshLogo from '../components/GshLogo';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter username and password');
      return;
    }

    const result = await login(username, password);
    if (result.success) {
      // Admin goes to Dashboard FY by default (with full sidebar access)
      // Standard User goes to Dashboard FY (restricted sidebar access)
      navigate('/dashboard-fy', { replace: true });
    } else {
      setError(result.error || 'Invalid login credentials');
    }
  };

  const handleQuickLogin = async (demoUsername, demoPassword) => {
    setUsername(demoUsername);
    setPassword(demoPassword);
    setError('');

    const result = await login(demoUsername, demoPassword);
    if (result.success) {
      navigate('/dashboard-fy', { replace: true });
    } else {
      setError(result.error || 'Demo login failed');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #052312 0%, #083b1e 50%, #0d4d29 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      position: 'relative'
    }}>
      
      {/* Background Radial Glow */}
      <div style={{
        position: 'absolute',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(149, 242, 161, 0.1) 0%, rgba(0,0,0,0) 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '24px',
        padding: '2.5rem 2rem',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
        zIndex: 10
      }}>

        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.85rem' }}>
            <GshLogo style={{ height: '44px', width: 'auto' }} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ffffff', margin: 0 }}>
            Executive Dashboard Portal
          </h2>
          <p style={{ fontSize: '0.825rem', color: '#95f2a1', margin: '0.35rem 0 0 0', fontWeight: 600 }}>
            George Steuart Health Authentication
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            marginBottom: '1.25rem',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            background: 'rgba(200, 16, 46, 0.15)',
            border: '1px solid rgba(200, 16, 46, 0.4)',
            color: '#ff6b81',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle style={{ width: '18px', height: '18px', flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Username */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#d0ebdb', marginBottom: '0.4rem' }}>
              Username or Email
            </label>
            <div style={{ position: 'relative' }}>
              <User style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#88b59a' }} />
              <input
                type="text"
                placeholder="Enter username (e.g. admin or user)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.6rem',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#d0ebdb', marginBottom: '0.4rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#88b59a' }} />
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.6rem',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Login Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.85rem',
              marginTop: '0.5rem',
              background: 'linear-gradient(135deg, #c8102e 0%, #a00c24 100%)',
              border: 'none',
              borderRadius: '12px',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 15px rgba(200, 16, 46, 0.4)'
            }}
          >
            {loading ? <Loader style={{ width: '18px', height: '18px', animation: 'spin 1s linear infinite' }} /> : <KeyRound style={{ width: '18px', height: '18px' }} />}
            Sign In to Dashboard
          </button>
        </form>

        {/* Quick Demo Login Accounts */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.25rem' }}>
          <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#88b59a', textAlign: 'center', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ⚡ Quick Demo Accounts
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
            <button
              onClick={() => handleQuickLogin('admin', 'admin123')}
              style={{
                padding: '0.6rem 0.5rem',
                background: 'rgba(200, 16, 46, 0.15)',
                border: '1px solid rgba(200, 16, 46, 0.4)',
                borderRadius: '10px',
                color: '#ff6b81',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              👑 Login as Admin
              <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 400, color: '#ffb3c1', marginTop: '0.1rem' }}>All 7 pages + Users</span>
            </button>

            <button
              onClick={() => handleQuickLogin('user', 'user123')}
              style={{
                padding: '0.6rem 0.5rem',
                background: 'rgba(149, 242, 161, 0.15)',
                border: '1px solid rgba(149, 242, 161, 0.4)',
                borderRadius: '10px',
                color: '#95f2a1',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              👤 Login as User
              <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 400, color: '#cff8d8', marginTop: '0.1rem' }}>Dashboard FY only</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
