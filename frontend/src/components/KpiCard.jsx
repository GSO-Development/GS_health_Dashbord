import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const KpiCard = ({ title, value, change, isPositive, icon: Icon, color }) => {
  return (
    <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          {title}
        </span>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: 'var(--radius-sm)',
          background: color || 'var(--accent-glow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {Icon && <Icon style={{ width: '22px', height: '22px', color: '#fff' }} />}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
        <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          {value}
        </h3>
        {change && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: isPositive ? 'var(--success)' : 'var(--danger)',
            gap: '0.125rem'
          }}>
            {isPositive ? <ArrowUpRight style={{ width: '14px', height: '14px' }} /> : <ArrowDownRight style={{ width: '14px', height: '14px' }} />}
            {change}
          </span>
        )}
      </div>
    </div>
  );
};

export default KpiCard;
