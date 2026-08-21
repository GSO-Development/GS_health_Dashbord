import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, ShieldCheck, ArrowRight, AlertCircle, Loader, KeyRound, Eye, EyeOff } from 'lucide-react';
import GshLogo from '../components/GshLogo';
import api from '../services/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithToken, loading } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [msLoading, setMsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Check for Microsoft OAuth Callback Query Parameters in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oauthCode = params.get('oauth_code');
    const token = params.get('token');
    const userStr = params.get('user');
    const errParam = params.get('error');
    const emailParam = params.get('email');

    // FIX-9: Exchange temporary oauth_code securely via POST
    if (oauthCode) {
      setMsLoading(true);
      api.post('/auth/microsoft/exchange', { code: oauthCode })
        .then((res) => {
          if (res.data?.token && res.data?.user) {
            loginWithToken(res.data.user, res.data.token);
            if (res.data.user.role === 'admin') {
              navigate('/admin/users', { replace: true });
            } else {
              navigate('/dashboard-fy', { replace: true });
            }
          }
        })
        .catch((err) => {
          setError(err.response?.data?.detail || 'Failed to complete OAuth security exchange.');
        })
        .finally(() => {
          setMsLoading(false);
        });
    } else if (token && userStr) {
      try {
        let userObj;
        try {
          userObj = JSON.parse(userStr);
        } catch {
          userObj = JSON.parse(decodeURIComponent(userStr));
        }

        loginWithToken(userObj, token);

        // Redirect based on assigned role
        if (userObj.role === 'admin') {
          navigate('/admin/users', { replace: true });
        } else {
          navigate('/dashboard-fy', { replace: true });
        }
      } catch (e) {
        console.error('OAuth token parse error:', e);
        setError('Failed to process Microsoft login response');
      }
    } else if (errParam) {
      if (errParam === 'not_registered' && emailParam) {
        setError(`Access Denied: Your Microsoft account (${decodeURIComponent(emailParam)}) is not registered in the system. Please contact an administrator.`);
      } else {
        setError(`Microsoft Sign-In Error: ${decodeURIComponent(errParam)}`);
      }
    }
  }, [location, loginWithToken, navigate]);

  // System Login Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter username and password');
      return;
    }

    const result = await login(username, password);
    if (result.success) {
      if (result.user?.role === 'admin') {
        navigate('/admin/users', { replace: true });
      } else {
        navigate('/dashboard-fy', { replace: true });
      }
    } else {
      setError(result.error || 'Invalid username or password');
    }
  };

  // Microsoft OAuth Login Handler
  const handleMicrosoftLogin = async () => {
    setError('');
    setMsLoading(true);
    try {
      const res = await api.get('/auth/microsoft/url');
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        setError('Failed to generate Microsoft login URL');
        setMsLoading(false);
      }
    } catch (err) {
      setError('Microsoft OAuth service unavailable. Please use system credentials.');
      setMsLoading(false);
    }
  };

  return (
    <div style={{
      height: '100vh',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0b1e36 0%, #002b49 50%, #071527 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      position: 'relative',
      overflowX: 'hidden',
      overflowY: 'auto',
      boxSizing: 'border-box'
    }}>
      
      {/* Background Radial Glow */}
      <div style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(144, 202, 249, 0.08) 0%, rgba(200, 16, 46, 0.04) 40%, rgba(0,0,0,0) 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '20px',
        padding: '1.75rem 1.75rem',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45)',
        zIndex: 10,
        boxSizing: 'border-box'
      }}>

        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.65rem' }}>
            <GshLogo style={{ height: '40px', width: 'auto' }} />
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#ffffff', margin: 0, letterSpacing: '-0.01em' }}>
            Executive Dashboard Portal
          </h2>
          <p style={{ fontSize: '0.775rem', color: '#90caf9', margin: '0.25rem 0 0 0', fontWeight: 600 }}>
            George Steuart Health Authentication
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            marginBottom: '1rem',
            padding: '0.65rem 0.85rem',
            borderRadius: '10px',
            background: 'rgba(200, 16, 46, 0.18)',
            border: '1px solid rgba(200, 16, 46, 0.45)',
            color: '#ff6b81',
            fontSize: '0.8rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            lineHeight: 1.35
          }}>
            <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* System Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          
          {/* Username */}
          <div>
            <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.3rem' }}>
              Username or Email
            </label>
            <div style={{ position: 'relative' }}>
              <User style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Enter username (e.g. admin)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.3rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#64748b' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 2.5rem 0.65rem 2.4rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: showPassword ? '#90caf9' : '#64748b',
                  transition: 'color 0.2s ease'
                }}
              >
                {showPassword ? (
                  <EyeOff style={{ width: '16px', height: '16px' }} />
                ) : (
                  <Eye style={{ width: '16px', height: '16px' }} />
                )}
              </button>
            </div>
          </div>

          {/* System Login Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              marginTop: '0.3rem',
              background: 'linear-gradient(135deg, #c8102e 0%, #a00c24 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 15px rgba(200, 16, 46, 0.45)',
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? <Loader style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> : <KeyRound style={{ width: '16px', height: '16px' }} />}
            Sign In with Password
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          margin: '1.25rem 0 1rem 0'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.12)' }} />
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.12)' }} />
        </div>

        {/* Microsoft Entra ID SSO Button */}
        <button
          type="button"
          onClick={handleMicrosoftLogin}
          disabled={msLoading}
          style={{
            width: '100%',
            padding: '0.7rem',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            borderRadius: '10px',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: msLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.55rem',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
          }}
        >
          {msLoading ? (
            <Loader style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', width: '16px', height: '16px', flexShrink: 0 }}>
                <div style={{ background: '#f25022' }} />
                <div style={{ background: '#7fba00' }} />
                <div style={{ background: '#00a4ef' }} />
                <div style={{ background: '#ffb900' }} />
              </div>
              Sign in with Microsoft
            </>
          )}
        </button>

      </div>
    </div>
  );
};

export default LoginPage;
