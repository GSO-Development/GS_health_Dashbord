import React, { useState, useEffect } from 'react';
import { Menu, LogOut, Database, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { fetchSyncStatus } from '../../services/api';

const Header = ({ setMobileOpen }) => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [syncInfo, setSyncInfo] = useState({
    lastSync: null,
    isSyncing: false,
    status: 'IDLE'
  });

  const loadSyncStatus = async () => {
    try {
      const res = await fetchSyncStatus();
      if (res && res.status === 'success') {
        setSyncInfo({
          lastSync: res.last_sync,
          isSyncing: !!res.is_syncing,
          status: res.last_status || 'IDLE'
        });
      }
    } catch (e) {
      console.warn('Failed to load sync status:', e);
    }
  };

  useEffect(() => {
    loadSyncStatus();
    // Poll every 30 seconds for live sync timestamp updates
    const interval = setInterval(loadSyncStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/welcome', { replace: true });
  };

  return (
    <header className="header-container">
      {/* Left Area - Mobile Menu Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        <button 
          onClick={() => setMobileOpen(prev => !prev)}
          className="btn btn-secondary mobile-menu-toggle"
          title="Open Menu"
        >
          <Menu style={{ width: '20px', height: '20px' }} />
        </button>
      </div>

      {/* Center Area - Last Database Sync Time */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        background: syncInfo.isSyncing ? 'rgba(234, 179, 8, 0.08)' : 'rgba(16, 185, 129, 0.08)',
        border: `1px solid ${syncInfo.isSyncing ? 'rgba(234, 179, 8, 0.3)' : 'rgba(16, 185, 129, 0.25)'}`,
        padding: '0.45rem 1.1rem',
        borderRadius: '9999px',
        fontSize: '0.84rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'all 0.3s ease'
      }}>
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: syncInfo.isSyncing ? '#eab308' : '#10b981',
          display: 'inline-block',
          boxShadow: syncInfo.isSyncing ? '0 0 8px #eab308' : '0 0 8px #10b981'
        }} />
        <Database style={{ width: '15px', height: '15px', color: syncInfo.isSyncing ? '#ca8a04' : '#10b981' }} />
        <span style={{ color: 'var(--text-subtle)', fontWeight: 600 }}>
          Last DB Sync:
        </span>
        <span style={{ 
          color: syncInfo.isSyncing ? '#ca8a04' : '#0f766e', 
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums'
        }}>
          {syncInfo.isSyncing ? 'Syncing in background...' : (syncInfo.lastSync || 'Never')}
        </span>
      </div>

      {/* Right Area - User Profile & Sign Out */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
