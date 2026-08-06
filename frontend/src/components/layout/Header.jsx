import React from 'react';
import { Search, Bell, Moon, Sun, RefreshCw, Menu, LogOut, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header = ({ theme, setTheme, onRefresh, isRefreshing, setMobileOpen }) => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const handleLogout = () => {
    logout();
    navigate('/welcome', { replace: true });
  };

  return (
    <header className="header-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        {/* Mobile Hamburger Toggle Button */}
        <button 
          onClick={() => setMobileOpen(prev => !prev)}
          className="btn btn-secondary mobile-menu-toggle"
          title="Open Menu"
        >
          <Menu style={{ width: '20px', height: '20px' }} />
        </button>

        {/* Search Input */}
        <div className="header-search-wrapper">
          <Search style={{
            position: 'absolute',
            left: '0.875rem',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '18px',
            height: '18px',
            color: 'var(--text-subtle)'
          }} />
          <input 
            type="text" 
            placeholder="Search GSH records, reports, metrics..." 
            style={{
              width: '100%',
              padding: '0.5rem 1rem 0.5rem 2.5rem',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-main)',
              fontSize: '0.875rem',
              outline: 'none',
              transition: 'border-color var(--transition-fast)'
            }}
          />
        </div>
      </div>

      {/* Action Badges & User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button 
          onClick={onRefresh}
          className="btn btn-secondary"
          title="Refresh Data"
          style={{ padding: '0.5rem', borderRadius: 'var(--radius-full)' }}
        >
          <RefreshCw style={{ 
            width: '18px', 
            height: '18px', 
            animation: isRefreshing ? 'spin 1s linear infinite' : 'none' 
          }} />
        </button>

        <button 
          onClick={toggleTheme}
          className="btn btn-secondary"
          title="Toggle Dark/Light Mode"
          style={{ padding: '0.5rem', borderRadius: 'var(--radius-full)' }}
        >
          {theme === 'dark' ? <Sun style={{ width: '18px', height: '18px', color: 'var(--gsh-gold)' }} /> : <Moon style={{ width: '18px', height: '18px' }} />}
        </button>

        <div className="header-notification-wrapper" style={{ position: 'relative' }}>
          <button className="btn btn-secondary" style={{ padding: '0.5rem', borderRadius: 'var(--radius-full)', position: 'relative' }}>
            <Bell style={{ width: '18px', height: '18px' }} />
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--gsh-red)'
            }}></span>
          </button>
        </div>

        <div className="header-divider" style={{
          height: '24px',
          width: '1px',
          background: 'var(--border-color)'
        }} />

        {/* User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: isAdmin ? 'var(--accent-gradient)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.85rem',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            flexShrink: 0
          }}>
            {user?.full_name?.charAt(0) || 'G'}
          </div>
          <div className="header-user-text">
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {user?.full_name || 'GSH Executive'}
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '0.1rem 0.4rem',
                borderRadius: '8px',
                background: isAdmin ? 'rgba(200, 16, 46, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                color: isAdmin ? 'var(--gsh-red)' : '#10b981',
                border: `1px solid ${isAdmin ? 'rgba(200, 16, 46, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
              }}>
                {user?.role?.toUpperCase() || 'GUEST'}
              </span>
            </p>
            <p style={{ fontSize: '0.72rem', color: 'var(--gsh-teal)', margin: 0, fontWeight: 600, whiteSpace: 'nowrap' }}>
              George Steuart Health
            </p>
          </div>

          {user && (
            <button
              onClick={handleLogout}
              className="btn btn-secondary"
              title="Sign Out"
              style={{ padding: '0.45rem', marginLeft: '0.25rem', color: 'var(--gsh-red)' }}
            >
              <LogOut style={{ width: '16px', height: '16px' }} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
