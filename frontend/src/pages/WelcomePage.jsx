import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Activity, TrendingUp, Award } from 'lucide-react';
import GshLogo from '../components/GshLogo';

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0b1e36 0%, #002b49 50%, #071527 100%)',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      overflowX: 'hidden'
    }}>
      {/* Top Corporate Navbar */}
      <header style={{
        padding: '1.25rem 2.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        backdropFilter: 'blur(12px)',
        background: 'rgba(11, 30, 54, 0.85)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <GshLogo style={{ height: '42px', width: 'auto' }} />
          <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.25)', paddingLeft: '0.85rem' }}>
            <span style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#ffffff' }}>
              George Steuart Health
            </span>
            <span style={{ display: 'block', fontSize: '0.725rem', color: '#90caf9', fontWeight: 600, letterSpacing: '0.02em' }}>
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
            padding: '0.65rem 1.5rem',
            background: 'linear-gradient(135deg, #c8102e 0%, #a00c24 100%)',
            border: 'none',
            borderRadius: '24px',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(200, 16, 46, 0.45)',
            transition: 'all 0.25s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 22px rgba(200, 16, 46, 0.65)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(200, 16, 46, 0.45)';
          }}
        >
          Login to Dashboard
          <ArrowRight style={{ width: '16px', height: '16px' }} />
        </button>
      </header>

      {/* Main Hero Content (Cleaned without lower cards) */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 1.5rem',
        textAlign: 'center',
        position: 'relative'
      }}>
        
        {/* Soft Background Radial Glow */}
        <div style={{
          position: 'absolute',
          top: '35%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(144, 202, 249, 0.08) 0%, rgba(200, 16, 46, 0.04) 40%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none'
        }} />

        {/* Corporate Pill Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.45rem 1.25rem',
          borderRadius: '24px',
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          color: '#90caf9',
          fontSize: '0.85rem',
          fontWeight: 700,
          marginBottom: '2rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
        }}>
          <ShieldCheck style={{ width: '18px', height: '18px', color: '#64b5f6' }} />
          Enterprise Analytics & Financial Intelligence 2026/27
        </div>

        {/* Hero Title */}
        <h1 style={{
          fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)',
          fontWeight: 900,
          lineHeight: 1.12,
          maxWidth: '920px',
          margin: '0 0 1.5rem 0',
          background: 'linear-gradient(180deg, #ffffff 0%, #e2e8f0 70%, #94a3b8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.02em'
        }}>
          Executive Financial Dashboard & Target Intelligence
        </h1>

        {/* Description Text */}
        <p style={{
          fontSize: '1.15rem',
          color: '#cbd5e1',
          maxWidth: '720px',
          margin: '0 0 3rem 0',
          lineHeight: 1.65,
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
            gap: '0.75rem',
            padding: '1rem 2.6rem',
            background: 'linear-gradient(135deg, #c8102e 0%, #9b0a22 100%)',
            border: 'none',
            borderRadius: '32px',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '1.1rem',
            cursor: 'pointer',
            boxShadow: '0 10px 30px rgba(200, 16, 46, 0.55)',
            transition: 'all 0.25s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 14px 38px rgba(200, 16, 46, 0.7)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(200, 16, 46, 0.55)';
          }}
        >
          Access Dashboard Portal
          <ArrowRight style={{ width: '22px', height: '22px' }} />
        </button>
      </main>

      {/* Corporate Footer */}
      <footer style={{
        padding: '1.75rem 2rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center',
        fontSize: '0.85rem',
        color: '#94a3b8',
        background: 'rgba(7, 21, 39, 0.95)',
        letterSpacing: '0.01em'
      }}>
        © 2026 George Steuart Health (Pvt) Ltd. All Rights Reserved. Executive Financial Dashboard System.
      </footer>
    </div>
  );
};

export default WelcomePage;
