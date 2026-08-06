import React from 'react';

const CircularGauge = ({ 
  percentage = 100, 
  variance = '0.00 Mn', 
  size = 140,
  activeColor = '#10b981',
  inactiveColor = '#e2e8f0'
}) => {
  const numTicks = 28;
  const radius = size / 2 - 12;
  const center = size / 2;
  const clampedPct = Math.min(Math.max(percentage, 0), 100);
  const activeTicksCount = Math.round((clampedPct / 100) * numTicks);

  const ticks = [];
  for (let i = 0; i < numTicks; i++) {
    const angle = (i / numTicks) * 360 - 90; // Start top (-90 deg)
    const rad = (angle * Math.PI) / 180;
    
    const innerRadius = radius - 8;
    const outerRadius = radius;

    const x1 = center + innerRadius * Math.cos(rad);
    const y1 = center + innerRadius * Math.sin(rad);
    const x2 = center + outerRadius * Math.cos(rad);
    const y2 = center + outerRadius * Math.sin(rad);

    const isActive = i <= activeTicksCount || percentage >= 100;

    ticks.push(
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={isActive ? activeColor : inactiveColor}
        strokeWidth={3}
        strokeLinecap="round"
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size}>
          {ticks}
        </svg>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
            {percentage}%
          </span>
        </div>
      </div>
      <div style={{ marginTop: '0.4rem', textAlign: 'center' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Variance
        </div>
        <div style={{ fontSize: '0.875rem', fontWeight: 800, color: activeColor, marginTop: '0.15rem' }}>
          {variance}
        </div>
      </div>
    </div>
  );
};

export default CircularGauge;
