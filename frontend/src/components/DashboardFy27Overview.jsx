import React, { useState } from 'react';
import { LayoutDashboard, Plus, Settings, Sparkles, Layers, Sliders, RefreshCw } from 'lucide-react';

const DashboardFy27Overview = () => {
  const [widgets, setWidgets] = useState([]);

  const handleAddWidget = (type) => {
    setWidgets((prev) => [
      ...prev,
      { id: Date.now(), type, title: `New ${type} Widget`, createdAt: new Date().toLocaleTimeString() }
    ]);
  };

  const handleClear = () => {
    setWidgets([]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Configuration Header Banner */}
      <div className="glass-card animate-fade-in" style={{ 
        padding: '1.75rem', 
        background: 'linear-gradient(135deg, rgba(200, 16, 46, 0.06) 0%, rgba(244, 196, 48, 0.12) 100%)',
        border: '1px dashed rgba(200, 16, 46, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <LayoutDashboard style={{ color: 'var(--gsh-red)', width: '26px', height: '26px' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Dashboard FY 27 Configuration
              </h2>
              <span className="badge badge-primary" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                FY 2026/27
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.35rem 0 0 0' }}>
              Blank custom canvas ready to configure executive widgets, reports, and real-time KPIs for Financial Year 2026/27.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button 
              onClick={() => handleAddWidget('KPI Card')} 
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.85rem', fontSize: '0.825rem' }}
            >
              <Plus style={{ width: '16px', height: '16px' }} /> Add KPI Card
            </button>
            <button 
              onClick={() => handleAddWidget('Analytics Chart')} 
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.85rem', fontSize: '0.825rem' }}
            >
              <Plus style={{ width: '16px', height: '16px' }} /> Add Chart
            </button>
            {widgets.length > 0 && (
              <button 
                onClick={handleClear} 
                className="btn btn-secondary"
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.825rem', color: '#ef4444' }}
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Grid / Canvas */}
      {widgets.length === 0 ? (
        <div className="glass-card animate-fade-in" style={{ 
          padding: '4rem 2rem', 
          textAlign: 'center', 
          border: '2px dashed var(--border-color)',
          background: 'rgba(255, 255, 255, 0.4)',
          borderRadius: 'var(--radius-md)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(200, 16, 46, 0.1) 0%, rgba(0, 168, 150, 0.1) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem auto'
          }}>
            <Sparkles style={{ width: '32px', height: '32px', color: 'var(--gsh-red)' }} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Blank Configuration Canvas (FY 27)
          </h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto 1.5rem auto', fontSize: '0.875rem' }}>
            This page is clean and ready for your custom configuration. Click the buttons above to configure widgets or connect custom datasets for FY 2026/27.
          </p>
          <div style={{ display: 'inline-flex', gap: '0.75rem' }}>
            <button onClick={() => handleAddWidget('KPI Summary')} className="btn btn-primary">
              <Plus style={{ width: '16px', height: '16px' }} /> Configure FY 27 Dashboard
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {widgets.map((w) => (
            <div key={w.id} className="glass-card animate-fade-in" style={{ padding: '1.5rem', borderLeft: '4px solid var(--gsh-red)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span className="badge badge-primary">{w.type}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Added at {w.createdAt}</span>
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>{w.title}</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Configured component block for FY 27 Executive Dashboard view.
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardFy27Overview;
