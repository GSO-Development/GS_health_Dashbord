import React from 'react';

const GshLogo = ({ height = 50, showText = true }) => {
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', userSelect: 'none' }}>
      {/* Intricate Crown Vector SVG */}
      <svg 
        width={height * 1.1} 
        height={height * 0.75} 
        viewBox="0 0 120 85" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(200, 16, 46, 0.15))' }}
      >
        {/* Top Spire Cross */}
        <path d="M60 4V16M55 9H65" stroke="#c8102e" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="60" cy="17" r="2.5" fill="#c8102e" />

        {/* Outer Crown Arch Ribs */}
        <path d="M60 19C45 22 25 35 20 48M60 19C75 22 95 35 100 48" stroke="#c8102e" strokeWidth="2" strokeDasharray="3 2" />
        <path d="M60 19C50 25 38 38 35 49M60 19C70 25 82 38 85 49" stroke="#c8102e" strokeWidth="2" />
        
        {/* Intricate Inner Lattice Lines */}
        <path d="M20 48C35 42 50 40 60 40C70 40 85 42 100 48" stroke="#c8102e" strokeWidth="1.5" />
        <path d="M25 45L35 25M95 45L85 25" stroke="#c8102e" strokeWidth="1.2" />
        
        {/* Middle Ornaments */}
        <rect x="56" y="32" width="8" height="12" rx="1" fill="#c8102e" />
        <circle cx="60" cy="38" r="2" fill="#fff" />
        <polygon points="40,36 44,44 36,44" fill="#c8102e" />
        <polygon points="80,36 84,44 76,44" fill="#c8102e" />

        {/* Crown Base Rim */}
        <path d="M15 50C30 46 60 44 105 50C100 54 85 58 60 58C35 58 20 54 15 50Z" fill="none" stroke="#c8102e" strokeWidth="2.5" />
        
        {/* Jewels on Rim */}
        <circle cx="30" cy="51" r="2.5" fill="#c8102e" />
        <circle cx="45" cy="52" r="2.5" fill="#c8102e" />
        <circle cx="60" cy="52" r="3" fill="#c8102e" />
        <circle cx="75" cy="52" r="2.5" fill="#c8102e" />
        <circle cx="90" cy="51" r="2.5" fill="#c8102e" />

        {/* Double Base Rim Line */}
        <path d="M14 56C30 62 60 64 106 56" stroke="#c8102e" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M16 60C32 66 60 67 104 60" stroke="#c8102e" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      {showText && (
        <div style={{ textAlign: 'center', marginTop: '0.2rem' }}>
          {/* George Steuart Text */}
          <div style={{
            fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif",
            fontSize: `${height * 0.38}px`,
            color: 'var(--text-main, #4a5568)',
            fontWeight: 600,
            letterSpacing: '-0.01em',
            lineHeight: 1.05
          }}>
            George Steuart
          </div>

          {/* HEALTH Subtext */}
          <div style={{
            fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
            fontSize: `${height * 0.22}px`,
            color: '#00a896',
            fontWeight: 800,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            marginTop: '0.15rem'
          }}>
            HEALTH
          </div>
        </div>
      )}
    </div>
  );
};

export default GshLogo;
