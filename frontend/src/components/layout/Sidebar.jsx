import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import GshLogo from '../GshLogo';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard,
  Calculator,
  PieChart,
  FileText,
  Truck,
  X,
  Upload,
  Calendar,
  Users,
  LogOut,
  Layers,
  BarChart2,
  Network,
  Box,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Track dropdown state for PROD-IFS
  const isProdIfsChildActive = location.pathname === '/sync-invoice' || location.pathname === '/sync-outstanding';
  const [prodIfsOpen, setProdIfsOpen] = useState(isProdIfsChildActive || true);

  // Role-Based Navigation Items
  const allMenuItems = [
    { path: '/dashboard-fy', label: 'Dashboard FY', sub: 'Executive Dashboard Overview', icon: LayoutDashboard, public: true },
    { path: '/total-range-fy', label: 'Total- Range wise fy', sub: 'Range-wise financial analysis', icon: Layers, public: true },
    { path: '/dis-dashboard-fy', label: 'Dis-Dashboard fy', sub: 'Distributor budget overview', icon: PieChart, public: true },
    { path: '/distri-range-fy', label: 'DISTRI-Range wise fy', sub: 'Distributor range-wise targets', icon: BarChart2, public: true },
    
    // UPLOAD AND SYNC DATA Section (Admin Only)
    { path: '/upload-annual-budget', label: 'Upload Annual Budget', sub: 'Import & Validate Total Budget Excel', icon: Upload, divider: true, sectionHeader: '📤 UPLOAD AND SYNC DATA', adminOnly: true },
    { path: '/upload-dis-budget', label: 'Upload Dis Budget', sub: 'Import & Validate Dis Budget Excel', icon: PieChart, adminOnly: true },
    { path: '/upload-axienta-data', label: 'Upload Axienta Data', sub: 'Daily Calendar View & Axienta Excel', icon: Calendar, adminOnly: true },
    
    // PROD-IFS DROPDOWN MENU inside UPLOAD AND SYNC DATA section
    { 
      isDropdown: true,
      key: 'prod-ifs',
      label: 'prod-ifs Sync',
      sub: 'Oracle IFS Live Connection Queries',
      icon: Box,
      adminOnly: true,
      children: [
        { path: '/sync-invoice', label: 'Invoice Sync', sub: 'ifsapp.gsh_invoice_report', icon: FileText },
        { path: '/sync-outstanding', label: 'Outstanding Sync', sub: 'ifsapp.gsh_order_report', icon: Truck }
      ]
    },

    // Admin Master Records Section
    { path: '/total-budget', label: 'Total Budget', sub: 'total_budget (649 records)', icon: Calculator, adminOnly: true, divider: true, sectionHeader: '🛡️ Admin Master Records' },
    { path: '/dis-budget', label: 'Dis Budget', sub: 'dis_budget (9,644 records)', icon: PieChart, adminOnly: true },
    { path: '/invoice-output', label: 'Invoice Output Report', sub: 'invoice_output (19,046 records)', icon: FileText, adminOnly: true },
    { path: '/outstanding-output', label: 'Outstanding Output Report', sub: 'outstanding_output (170 records)', icon: Truck, adminOnly: true },
    { path: '/map-divisions', label: 'Map Divisions', sub: 'Sales Group → Range mappings', icon: Network, adminOnly: true },
    { path: '/admin/users', label: 'Manage Users', sub: 'User accounts & privileges', icon: Users, adminOnly: true },
  ];

  // Filter items according to role
  const visibleMenuItems = allMenuItems.filter(item => {
    if (item.public) return true;
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  const handleClose = () => {
    if (setMobileOpen) setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/welcome', { replace: true });
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          onClick={handleClose}
          className="sidebar-backdrop"
        />
      )}

      {/* Sidebar Drawer */}
      <aside className={`sidebar-container ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Mobile Close Button */}
        <div className="mobile-close-bar">
          <button 
            onClick={handleClose}
            className="btn btn-secondary mobile-close-btn"
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Brand Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem',
          padding: '0.6rem 0.8rem',
          background: '#ffffff',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <GshLogo style={{ height: '40px', width: 'auto', maxWidth: '100%' }} />
        </div>

        {/* Dynamic Multi-Color Divider */}
        <div style={{
          height: '3px',
          width: '100%',
          background: 'linear-gradient(90deg, #c8102e 0%, #f4c430 50%, #00a896 100%)',
          borderRadius: 'var(--radius-full)',
          marginBottom: '1.0rem'
        }} />

        {/* Navigation List (Starts at Top) */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem', overflowY: 'auto' }}>
          {visibleMenuItems.map((item, index) => {
            const Icon = item.icon;

            if (item.isDropdown) {
              return (
                <div key={item.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <div
                    onClick={() => setProdIfsOpen(o => !o)}
                    className={`sidebar-nav-link ${isProdIfsChildActive ? 'active' : ''}`}
                    style={{ cursor: 'pointer', justifyContent: 'space-between' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                      <Icon className="nav-icon" style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', lineHeight: '1.2' }}>
                          {item.label}
                        </span>
                        <span style={{ fontSize: '0.68rem', opacity: 0.8, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', lineHeight: '1.2' }}>
                          {item.sub}
                        </span>
                      </div>
                    </div>
                    {prodIfsOpen ? <ChevronDown style={{ width: '15px', height: '15px' }} /> : <ChevronRight style={{ width: '15px', height: '15px' }} />}
                  </div>

                  {prodIfsOpen && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', paddingLeft: '1.25rem', borderLeft: '2px dashed var(--border-color)', marginLeft: '1rem' }}>
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        return (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            onClick={handleClose}
                            className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
                            style={{ padding: '0.45rem 0.65rem' }}
                          >
                            <ChildIcon className="nav-icon" style={{ width: '15px', height: '15px', flexShrink: 0 }} />
                            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', lineHeight: '1.2' }}>
                                {child.label}
                              </span>
                              <span style={{ fontSize: '0.65rem', opacity: 0.8, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', lineHeight: '1.2' }}>
                                {child.sub}
                              </span>
                            </div>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <React.Fragment key={item.path}>
                {item.divider && index !== 0 && (
                  <div style={{
                    margin: '0.75rem 0 0.5rem 0',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '0.5rem'
                  }}>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      color: item.sectionHeader?.includes('UPLOAD') ? 'var(--gsh-teal)' : 'var(--gsh-red)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      padding: '0 0.5rem'
                    }}>
                      {item.sectionHeader || (item.adminOnly ? '🛡️ Admin Master Records' : '📊 Core Analytics')}
                    </span>
                  </div>
                )}
                
                <NavLink
                  to={item.path}
                  onClick={handleClose}
                  className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon className="nav-icon" style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', lineHeight: '1.2' }}>
                      {item.label}
                    </span>
                    <span style={{ fontSize: '0.68rem', opacity: 0.8, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', lineHeight: '1.2' }}>
                      {item.sub}
                    </span>
                  </div>
                </NavLink>
              </React.Fragment>
            );
          })}
        </nav>

        {/* BOTTOM SECTION: User Profile Capsule & Footer */}
        <div style={{ marginTop: 'auto', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          
          {/* User Profile Info Capsule */}
          <div style={{
            padding: '0.65rem 0.85rem',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0, flex: 1 }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: isAdmin ? 'var(--gsh-red)' : 'var(--gsh-teal)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.85rem',
                flexShrink: 0
              }}>
                {(user?.username || 'U')[0].toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden', minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user?.full_name || user?.username || 'Standard User'}
                </div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: isAdmin ? 'var(--gsh-red)' : 'var(--gsh-teal)', whiteSpace: 'nowrap' }}>
                  {isAdmin ? '🛡️ Administrator' : '👤 User Access'}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-subtle)',
                cursor: 'pointer',
                padding: '0.35rem',
                borderRadius: 'var(--radius-xs)',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0
              }}
            >
              <LogOut style={{ width: '16px', height: '16px' }} />
            </button>
          </div>

          {/* System Version Footer */}
          <div style={{
            fontSize: '0.7rem',
            color: 'var(--text-subtle)',
            textAlign: 'center'
          }}>
            GSH Executive Suite v2.0 • 2026/27
          </div>
        </div>

      </aside>
    </>
  );
};

export default Sidebar;
