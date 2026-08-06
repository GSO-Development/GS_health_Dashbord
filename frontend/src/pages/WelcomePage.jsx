import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import GshLogo from '../components/GshLogo';

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      height: '100vh',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0b1e36 0%, #002b49 50%, #071527 100%)',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      overflowX: 'hidden',
      overflowY: 'auto',
      boxSizing: 'border-box'
    }}>
      {/* Top Corporate Navbar */}
      <header style={{
        padding: '0.85rem 1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        backdropFilter: 'blur(12px)',
        background: 'rgba(11, 30, 54, 0.85)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <GshLogo style={{ height: '36px', width: 'auto' }} />
          <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.25)', paddingLeft: '0.75rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#ffffff', display: 'block' }}>
              George Steuart Health
            </span>
            <span style={{ display: 'block', fontSize: '0.675rem', color: '#90caf9', fontWeight: 600, letterSpacing: '0.02em' }}>
              Executive Analytics Portal
            </span>
          </div>
        </div>
      </header>

      {/* Main Hero Content (Fits 100vh cleanly on desktop) */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem 1.25rem',
        textAlign: 'center',
        position: 'relative',
        boxSizing: 'border-box'
      }}>
        
        {/* Soft Background Radial Glow */}
        <div style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(144, 202, 249, 0.08) 0%, rgba(200, 16, 46, 0.04) 40%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none'
        }} />

        {/* Corporate Pill Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.35rem 1rem',
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          color: '#90caf9',
          fontSize: '0.775rem',
          fontWeight: 700,
          marginBottom: '1.25rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          maxWidth: '90%'
        }}>
          <ShieldCheck style={{ width: '16px', height: '16px', color: '#64b5f6', flexShrink: 0 }} />
          <span>Enterprise Analytics & Financial Intelligence 2026/27</span>
        </div>

        {/* Hero Title */}
        <h1 style={{
          fontSize: 'clamp(1.75rem, 4.2vw, 3.2rem)',
          fontWeight: 900,
          lineHeight: 1.15,
          maxWidth: '850px',
          margin: '0 0 1rem 0',
          background: 'linear-gradient(180deg, #ffffff 0%, #e2e8f0 75%, #94a3b8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.02em'
        }}>
          Executive Financial Dashboard & Target Intelligence
        </h1>

        {/* Description Text */}
        <p style={{
          fontSize: 'clamp(0.9rem, 1.8vw, 1.1rem)',
          color: '#cbd5e1',
          maxWidth: '680px',
          margin: '0 0 2rem 0',
          lineHeight: 1.6,
          fontWeight: 400
        }}>
          Real-time tracking for Total Budget targets, Invoiced Sales Actuals, Distributor Performance, and Outstanding Order Backlog with Role-Based Access Control.
        </p>

        {/* Call to Action Button */}
        <button
          onClick={() => navigate('/login')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.85rem 2.2rem',
            background: 'linear-gradient(135deg, #c8102e 0%, #9b0a22 100%)',
            border: 'none',
            borderRadius: '30px',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 8px 25px rgba(200, 16, 46, 0.5)',
            transition: 'all 0.25s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(200, 16, 46, 0.65)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(200, 16, 46, 0.5)';
          }}
        >
          Access Dashboard Portal
          <ArrowRight style={{ width: '20px', height: '20px' }} />
        </button>
      </main>

      {/* Corporate Footer */}
      <footer style={{
        padding: '0.85rem 1.5rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center',
        fontSize: '0.775rem',
        color: '#94a3b8',
        background: 'rgba(7, 21, 39, 0.95)',
        letterSpacing: '0.01em',
        flexShrink: 0
      }}>
        © 2026 George Steuart Health (Pvt) Ltd. All Rights Reserved. Executive Financial Dashboard System.
      </footer>
    </div>
  );
};

export default WelcomePage;
