import React from 'react';
import GshLogo from './GshLogo';
import { 
  FileText, 
  ShoppingBag, 
  Truck,
  Award,
  Database, 
  ShieldCheck,
  X
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, mobileOpen, setMobileOpen }) => {
  const menuItems = [
    { id: 'invoice-output', label: 'Invoice Output Report', sub: 'invoice_output (19,046 records)', icon: FileText },
    { id: 'outstanding-output', label: 'Outstanding Output Report', sub: 'outstanding_output (170 records)', icon: Truck },
    { id: 'database', label: 'XAMPP MySQL Database', sub: 'Live gsh_dashboard Health', icon: Database },
  ];

  const handleSelectTab = (id) => {
    setActiveTab(id);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="sidebar-backdrop"
        />
      )}

      {/* Sidebar Drawer */}
      <aside className={`sidebar-container ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Mobile Close Button */}
        <div className="mobile-close-bar">
          <button 
            onClick={() => setMobileOpen(false)}
            className="btn btn-secondary mobile-close-btn"
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Brand Header with Authentic GSH Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem',
          padding: '0.5rem 0',
          background: 'rgba(255, 255, 255, 0.6)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <GshLogo height={44} showText={true} />
        </div>

        {/* Decorative Gold Accent Bar */}
        <div style={{
          height: '3px',
          width: '100%',
          background: 'linear-gradient(90deg, #c8102e 0%, #f4c430 50%, #00a896 100%)',
          borderRadius: 'var(--radius-full)',
          marginBottom: '1.0rem'
        }} />

        {/* Sidebar Clickable Dashboard Name Header */}
        <button 
          onClick={() => handleSelectTab('fy27-dashboard')}
          title="Click to open Dashboard FY 27 configuration page"
          style={{
            width: '100%',
            padding: '0.65rem 0.85rem',
            marginBottom: '1.0rem',
            borderRadius: 'var(--radius-sm)',
            background: activeTab === 'fy27-dashboard' 
              ? 'linear-gradient(135deg, rgba(200, 16, 46, 0.18) 0%, rgba(244, 196, 48, 0.28) 100%)' 
              : 'linear-gradient(135deg, rgba(200, 16, 46, 0.06) 0%, rgba(244, 196, 48, 0.12) 100%)',
            border: activeTab === 'fy27-dashboard'
              ? '1px solid var(--gsh-red)'
              : '1px solid rgba(200, 16, 46, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s ease-in-out',
            boxShadow: activeTab === 'fy27-dashboard' ? '0 4px 14px rgba(200, 16, 46, 0.25)' : 'var(--shadow-sm)'
          }}
          className="dashboard-fy27-btn"
        >
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gsh-red)', letterSpacing: '0.03em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            Dashboard FY 27
          </span>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'var(--gsh-red)', color: '#ffffff' }}>
            FY 2026/27
          </span>
        </button>


        {/* Navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, overflowY: 'auto' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.75rem 1.0rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: isActive ? 'var(--accent-gradient)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  justifyContent: 'flex-start',
                  width: '100%',
                  textAlign: 'left',
                  boxShadow: isActive ? '0 4px 14px rgba(200, 16, 46, 0.25)' : 'none'
                }}
              >
                <Icon style={{ 
                  width: '20px', 
                  height: '20px', 
                  flexShrink: 0,
                  color: isActive ? '#ffffff' : 'inherit'
                }} />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ whiteSpace: 'nowrap', fontSize: '0.875rem' }}>{item.label}</div>
                  <div style={{ fontSize: '0.7rem', color: isActive ? 'rgba(255,255,255,0.85)' : 'var(--text-subtle)' }}>
                    {item.sub}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer Info */}
        <div style={{
          padding: '0.875rem',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <ShieldCheck style={{ width: '20px', height: '20px', color: 'var(--gsh-teal)' }} />
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
              GSH XAMPP MySQL
            </p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', margin: 0, whiteSpace: 'nowrap' }}>
              DB: gsh_dashboard (2 Active Tables)
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
