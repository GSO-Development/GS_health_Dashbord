import React, { useState, useEffect } from 'react';
import { Activity, BarChart2, Zap, RefreshCw } from 'lucide-react';

const DEFAULT_STAGES = [
  { at: 0, text: 'Connecting to Database...' },
  { at: 25, text: 'Fetching Invoices & Backlog Orders...' },
  { at: 60, text: 'Calculating Pro-rata Budgets & Variance...' },
  { at: 85, text: 'Aggregating Division & Item Hierarchies...' },
  { at: 96, text: 'Finalizing Analytics...' },
];

const DataLoaderOverlay = ({
  loading,
  title = 'Crunching Financial Analytics...',
  stages = DEFAULT_STAGES,
  minHeight = '360px'
}) => {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(loading);

  useEffect(() => {
    let timer = null;
    if (loading) {
      setVisible(true);
      setProgress(12);

      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev < 40) return prev + Math.floor(Math.random() * 8) + 4;
          if (prev < 75) return prev + Math.floor(Math.random() * 6) + 3;
          if (prev < 92) return prev + Math.floor(Math.random() * 3) + 1;
          if (prev < 98) return prev + 1;
          return prev;
        });
      }, 90);
    } else {
      // Completed -> quickly hit 100% and fade out
      setProgress(100);
      const timeout = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 350);
      return () => clearTimeout(timeout);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [loading]);

  if (!visible && !loading) return null;

  // Determine current status message
  const currentStage = [...stages].reverse().find(s => progress >= s.at) || stages[0];

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        minHeight,
        zIndex: 50,
        background: 'rgba(255, 255, 255, 0.72)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        transition: 'all 0.3s ease',
        pointerEvents: 'all'
      }}
    >
      {/* Center Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
          border: '1.5px solid rgba(0, 168, 150, 0.25)',
          borderRadius: '16px',
          boxShadow: '0 20px 45px rgba(15, 23, 42, 0.12), 0 4px 14px rgba(0, 168, 150, 0.08)',
          padding: '1.75rem 2.25rem',
          maxWidth: '420px',
          width: '90%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.1rem',
          textAlign: 'center',
          animation: 'scaleUp 0.25s ease-out'
        }}
      >
        {/* Animated Icon with Glow Pulse */}
        <div style={{ position: 'relative' }}>
          <div
            style={{
              width: '62px',
              height: '62px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(200, 16, 46, 0.12), rgba(0, 168, 150, 0.18))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              boxShadow: '0 0 20px rgba(0, 168, 150, 0.3)'
            }}
          >
            <Activity
              style={{
                width: '30px',
                height: '30px',
                color: 'var(--gsh-teal)',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}
            />
          </div>
          
          {/* Rotating Spinner Orbit */}
          <div
            style={{
              position: 'absolute',
              top: '-4px',
              left: '-4px',
              right: '-4px',
              bottom: '-4px',
              borderRadius: '50%',
              border: '2px dashed var(--gsh-red)',
              animation: 'spin 4s linear infinite',
              opacity: 0.6
            }}
          />
        </div>

        {/* Title & Live Percentage Counter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'center' }}>
          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {title}
          </h4>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
            <span
              style={{
                fontSize: '2rem',
                fontWeight: 900,
                background: 'linear-gradient(135deg, var(--gsh-red), var(--gsh-teal))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.5px',
                fontVariantNumeric: 'tabular-nums'
              }}
            >
              {progress}
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--gsh-teal)' }}>%</span>
          </div>
        </div>

        {/* Glowing Progress Bar Track & Thumb */}
        <div
          style={{
            width: '100%',
            height: '8px',
            background: '#e2e8f0',
            borderRadius: '999px',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, var(--gsh-red), #e11d48, var(--gsh-teal))',
              borderRadius: '999px',
              transition: 'width 0.15s ease-out',
              boxShadow: '0 0 10px rgba(0, 168, 150, 0.5)'
            }}
          />
        </div>

        {/* Dynamic Status Text */}
        <div
          style={{
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <Zap style={{ width: '13px', height: '13px', color: '#eab308' }} />
          <span>{currentStage.text}</span>
        </div>
      </div>
    </div>
  );
};

export default DataLoaderOverlay;
