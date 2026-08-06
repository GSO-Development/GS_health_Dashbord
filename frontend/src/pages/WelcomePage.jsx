import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Activity, Database, Lock, Users, PieChart } from 'lucide-react';
import GshLogo from '../components/GshLogo';

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #052312 0%, #083b1e 50%, #0d4d29 100%)',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      overflowX: 'hidden'
    }}>
      {/* Top Navbar */}
      <header style={{
        padding: '1.25rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        background: 'rgba(5, 35, 18, 0.7)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <GshLogo style={{ height: '38px', width: 'auto' }} />
          <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.2)', paddingLeft: '0.75rem' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#ffffff' }}>
              George Steuart Health
            </span>
            <span style={{ display: 'block', fontSize: '0.7rem', color: '#95f2a1', fontWeight: 600 }}>
              Executive Analytics Portal
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate('/login')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.4rem',
            background: 'linear-gradient(135deg, #c8102e 0%, #a00c24 100%)',
            border: 'none',
            borderRadius: '24px',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(200, 16, 46, 0.4)',
            transition: 'transform 0.2s ease, boxShadow 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(200, 16, 46, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(200, 16, 46, 0.4)';
          }}
        >
          Login to Dashboard
          <ArrowRight style={{ width: '16px', height: '16px' }} />
        </button>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem', textAlign: 'center', position: 'relative' }}>
        
        {/* Glow Effects */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(149, 242, 161, 0.12) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 1rem',
          borderRadius: '20px',
          background: 'rgba(149, 242, 161, 0.1)',
          border: '1px solid rgba(149, 242, 161, 0.3)',
          color: '#95f2a1',
          fontSize: '0.825rem',
          fontWeight: 700,
          marginBottom: '1.5rem'
        }}>
          <ShieldCheck style={{ width: '16px', height: '16px' }} />
          Enterprise Analytics & Financial Intelligence 2026/27
        </div>

        <h1 style={{
          fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
          fontWeight: 900,
          lineHeight: 1.15,
          maxWidth: '900px',
          margin: '0 0 1.25rem 0',
          background: 'linear-gradient(180deg, #ffffff 0%, #cfebdc 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Executive Financial Dashboard & Target Intelligence
        </h1>

        <p style={{
          fontSize: '1.1rem',
          color: '#b0d9c0',
          maxWidth: '700px',
          margin: '0 0 2.5rem 0',
          lineHeight: 1.6
        }}>
          Real-time tracking for Total Budget targets, Invoiced Sales Actuals, Distributor Performance, and Outstanding Order Backlog with Role-Based Access Control.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '4rem' }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.9rem 2.2rem',
              background: 'linear-gradient(135deg, #c8102e 0%, #a00c24 100%)',
              border: 'none',
              borderRadius: '30px',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '1.05rem',
              cursor: 'pointer',
              boxShadow: '0 8px 25px rgba(200, 16, 46, 0.5)',
              transition: 'all 0.25s ease'
            }}
          >
            Access Dashboard Portal
            <ArrowRight style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.5rem',
          maxWidth: '1100px',
          width: '100%'
        }}>
          {[
            {
              icon: Activity,
              title: 'Executive Dashboard FY',
              desc: 'Live ring gauges and bar charts tracking Total Budget vs Actual, Direct Sales, and Annual Targets.',
              color: '#95f2a1'
            },
            {
              icon: Database,
              title: 'Dynamic Formula Studio',
              desc: 'Create and edit custom formula sections with Excel-style column coordinates (A-Z).',
              color: '#f59e0b'
            },
            {
              icon: Lock,
              title: 'Role-Based Access Control',
              desc: 'Strict permission scoping for Admin management and Standard User viewing privileges.',
              color: '#3b82f6'
            },
            {
              icon: Users,
              title: 'User Management Panel',
              desc: 'Admin console to add executive accounts, assign roles, and audit permissions.',
              color: '#ef4444'
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  textAlign: 'left',
                  backdropFilter: 'blur(10px)',
                  transition: 'transform 0.25s ease, borderColor 0.25s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'rgba(149, 242, 161, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                }}
              >
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: `${item.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}>
                  <Icon style={{ width: '22px', height: '22px', color: item.color }} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#ffffff' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#a0c7b0', margin: 0, lineHeight: 1.5 }}>
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '1.5rem 2rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        textAlign: 'center',
        fontSize: '0.825rem',
        color: '#7aa38d',
        background: 'rgba(5, 35, 18, 0.9)'
      }}>
        © 2026 George Steuart Health (Pvt) Ltd. All Rights Reserved. Executive Financial Dashboard System.
      </footer>
    </div>
  );
};

export default WelcomePage;
