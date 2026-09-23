import React, { useState, useEffect } from 'react';
import { PieChart, RefreshCw, Layers, Package, TrendingUp } from 'lucide-react';
import MonthCalendarBar, { getCurrentMonthKey } from '../components/common/MonthCalendarBar';
import DataLoaderOverlay from '../components/common/DataLoaderOverlay';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const fmtMn = (val) => {
  if (val === undefined || val === null) return '0.0 M';
  const mn = val / 1000000;
  return mn.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' M';
};

const fmtMnFull = (val) => {
  if (val === undefined || val === null) return '0 M';
  const mn = val / 1000000;
  return Math.round(mn).toLocaleString('en-US') + ' M';
};

const fmtVariance = (varianceNum) => {
  if (varianceNum === undefined || varianceNum === null) return '0.0 M';
  const mn = varianceNum / 1000000;
  const sign = mn > 0 ? '+' : '';
  return sign + mn.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' M';
};

const CircularGauge = ({ percentage = 0, varianceNum = 0, size = 135, gradientId = 'disGaugeGrad' }) => {
  const isAchieved = (percentage >= 100) || (varianceNum >= 0);
  const activeColor = isAchieved ? '#10b981' : '#c8102e';
  const stopColor = isAchieved ? '#059669' : '#991b1b';

  const strokeWidth = 11;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cappedPct = Math.min(percentage, 999);
  const strokeDashoffset = circumference - (Math.min(cappedPct, 100) / 100) * circumference;

  const formattedVariance = fmtVariance(varianceNum);

  return (
    <div style={{ position: 'relative', width: `${size}px`, height: `${size}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={activeColor} />
            <stop offset="100%" stopColor={stopColor} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          strokeDasharray="4 4"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <span style={{ fontSize: '1.65rem', fontWeight: 900, color: activeColor, letterSpacing: '-0.5px' }}>
          {percentage}%
        </span>
        <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          VARIANCE
        </span>
        <span style={{
          fontSize: '0.85rem',
          fontWeight: 800,
          color: activeColor,
          background: isAchieved ? 'rgba(16, 185, 129, 0.12)' : 'rgba(200, 16, 46, 0.12)',
          padding: '0.15rem 0.55rem',
          borderRadius: '8px',
          marginTop: '2px',
          border: `1px solid ${isAchieved ? 'rgba(16, 185, 129, 0.3)' : 'rgba(200, 16, 46, 0.3)'}`
        }}>
          {formattedVariance}
        </span>
      </div>
    </div>
  );
};

// ─── COMBO CHART COMPONENT (Target Bars + Actual Connected Line) ───
const QuarterComboChart = ({ title, data = [], actKey = 'pri_act', tgtKey = 'pri_tgt', barColor = '#00a896', lineColor = '#06b6d4', iconColor = '#00a896', subtitle = 'Primary Sales Target vs Actual' }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Month list in standard FY order
  const months = data && data.length === 12 ? data : [
    { month_short: 'Apr', [tgtKey]: 0, [actKey]: 0 },
    { month_short: 'May', [tgtKey]: 0, [actKey]: 0 },
    { month_short: 'Jun', [tgtKey]: 0, [actKey]: 0 },
    { month_short: 'Jul', [tgtKey]: 0, [actKey]: 0 },
    { month_short: 'Aug', [tgtKey]: 0, [actKey]: 0 },
    { month_short: 'Sep', [tgtKey]: 0, [actKey]: 0 },
    { month_short: 'Oct', [tgtKey]: 0, [actKey]: 0 },
    { month_short: 'Nov', [tgtKey]: 0, [actKey]: 0 },
    { month_short: 'Dec', [tgtKey]: 0, [actKey]: 0 },
    { month_short: 'Jan', [tgtKey]: 0, [actKey]: 0 },
    { month_short: 'Feb', [tgtKey]: 0, [actKey]: 0 },
    { month_short: 'Mar', [tgtKey]: 0, [actKey]: 0 }
  ];

  const maxVal = Math.max(...months.map(m => Math.max(m[tgtKey] || 0, m[actKey] || 0)), 1000000) * 1.15;

  const chartWidth = 720;
  const chartHeight = 250;
  const paddingX = 35;
  const paddingY = 20;
  const usableWidth = chartWidth - paddingX * 2;
  const usableHeight = chartHeight - paddingY * 2;
  const stepX = usableWidth / 12;
  const barWidth = 26;

  const points = months.map((m, idx) => {
    const cx = paddingX + idx * stepX + stepX / 2;
    const cy = paddingY + usableHeight - ((m[actKey] || 0) / maxVal) * usableHeight;
    const tgtHeight = ((m[tgtKey] || 0) / maxVal) * usableHeight;
    const tgtY = paddingY + usableHeight - tgtHeight;
    return { cx, cy, tgtHeight, tgtY, ...m };
  });

  const linePathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.cx} ${pt.cy}` : `${acc} L ${pt.cx} ${pt.cy}`;
  }, '');

  return (
    <div className="glass-card" style={{
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
      color: 'var(--text-main)'
    }}>
      {/* Chart Header with Legend */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp style={{ width: '18px', height: '18px', color: iconColor }} />
            {title}
          </h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{subtitle}</span>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', background: '#f8fafc', padding: '0.4rem 0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', color: '#475569', fontWeight: 700 }}>
            <div style={{ width: '12px', height: '12px', background: barColor, borderRadius: '3px' }} />
            <span>Target (Bar)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', color: '#475569', fontWeight: 700 }}>
            <div style={{ width: '14px', height: '3.5px', background: lineColor, borderRadius: '2px', position: 'relative' }}>
              <div style={{ width: '8px', height: '8px', background: '#ffffff', border: `2.5px solid ${lineColor}`, borderRadius: '50%', position: 'absolute', top: '-2.5px', left: '3px' }} />
            </div>
            <span>Actual (Line)</span>
          </div>
        </div>
      </div>

      {/* SVG Container */}
      <div style={{ position: 'relative', width: '100%', height: '260px', flex: 1, display: 'flex', alignItems: 'center' }}>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          <defs>
            <linearGradient id={`barGrad_${actKey}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={barColor} stopOpacity="0.95" />
              <stop offset="100%" stopColor={barColor} stopOpacity="0.65" />
            </linearGradient>
            <filter id={`glow_${actKey}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="glow" />
              <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>
          </defs>

          {/* Horizontal Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = paddingY + usableHeight * (1 - ratio);
            return (
              <line
                key={i}
                x1={paddingX}
                y1={y}
                x2={chartWidth - paddingX}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                strokeWidth="1.2"
              />
            );
          })}

          {/* Target Bars */}
          {points.map((pt, idx) => (
            <rect
              key={`bar_${idx}`}
              x={pt.cx - barWidth / 2}
              y={pt.tgtY}
              width={barWidth}
              height={Math.max(pt.tgtHeight, 2)}
              fill={`url(#barGrad_${actKey})`}
              rx="4"
              style={{
                transition: 'all 0.25s ease',
                filter: hoveredIdx === idx ? 'brightness(1.15)' : 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          ))}

          {/* Actual Connecting Line */}
          <path
            d={linePathD}
            fill="none"
            stroke={lineColor}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#glow_${actKey})`}
          />

          {/* Actual Nodes / Dots */}
          {points.map((pt, idx) => (
            <g
              key={`node_${idx}`}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <circle
                cx={pt.cx}
                cy={pt.cy}
                r={hoveredIdx === idx ? 7.5 : 5.5}
                fill="#ffffff"
                stroke={lineColor}
                strokeWidth="3.5"
                style={{ transition: 'r 0.2s ease' }}
              />
            </g>
          ))}

          {/* Month Labels */}
          {points.map((pt, idx) => (
            <text
              key={`label_${idx}`}
              x={pt.cx}
              y={chartHeight - 4}
              textAnchor="middle"
              fill={hoveredIdx === idx ? lineColor : '#64748b'}
              fontSize="12"
              fontWeight="800"
            >
              {pt.month_short}
            </text>
          ))}
        </svg>

        {/* Floating Tooltip */}
        {hoveredIdx !== null && points[hoveredIdx] && (
          <div style={{
            position: 'absolute',
            top: '8px',
            left: `${(points[hoveredIdx].cx / chartWidth) * 100}%`,
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.95)',
            border: `1.5px solid ${lineColor}`,
            borderRadius: '8px',
            padding: '0.55rem 0.9rem',
            boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
            zIndex: 10,
            pointerEvents: 'none',
            fontSize: '0.78rem',
            whiteSpace: 'nowrap',
            color: '#ffffff'
          }}>
            <div style={{ fontWeight: 800, color: '#38bdf8', marginBottom: '0.25rem', textAlign: 'center' }}>
              {points[hoveredIdx].month_short} ({points[hoveredIdx].qtr || ''})
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.25rem', color: '#cbd5e1' }}>
              <span>Target:</span>
              <strong style={{ color: '#f8fafc' }}>{fmtMn(points[hoveredIdx][tgtKey])}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.25rem', color: '#cbd5e1' }}>
              <span>Actual:</span>
              <strong style={{ color: '#38bdf8' }}>{fmtMn(points[hoveredIdx][actKey])}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.25rem', color: '#cbd5e1', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '0.25rem', marginTop: '0.25rem' }}>
              <span>Achieved:</span>
              <strong style={{ color: points[hoveredIdx][actKey] >= points[hoveredIdx][tgtKey] ? '#10b981' : '#f43f5e' }}>
                {points[hoveredIdx][tgtKey] > 0 ? Math.round((points[hoveredIdx][actKey] / points[hoveredIdx][tgtKey]) * 100) : 0}%
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const DisDashboardFyPage = () => {
  const { isAdmin } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [backlogMode, setBacklogMode] = useState('with'); // default 'with' (Sales / Invoices + Reserved)
  const [selectedContracts, setSelectedContracts] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const isCurrentMonth = selectedMonth === getCurrentMonthKey();
  const effectiveBacklogMode = isCurrentMonth ? backlogMode : 'without';

  const fetchDisDashboardData = async () => {
    setLoading(true);
    try {
      const params = { month: selectedMonth, backlog_mode: effectiveBacklogMode };
      if (startDate && endDate) {
        if (startDate === endDate) {
          params.date = startDate;
        } else {
          params.start_date = startDate;
        }
      }
      if (selectedContracts.length > 0) {
        params.contracts = selectedContracts.join(',');
      }

      const res = await api.get('/reports/dis-dashboard-fy-overview', { params });
      if (res.data) {
        setData(res.data);
      }
    } catch {
      // Fallback
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDisDashboardData();
  }, [selectedMonth, startDate, endDate, effectiveBacklogMode, selectedContracts]);

  const pri = data?.primary_sales || { actual: 783909774.55, target: 80800000, pct: 970, variance: 703109774.55 };
  const rd = data?.rd_sales || { actual: 22494390.46, target: 80800000, pct: 28, variance: -58305609.54 };
  const fy = data?.full_year || { pri_target: 964400000, pri_actual: 783909774.55, pri_pct: 81, rd_target: 964400000, rd_actual: 105931503.38, rd_pct: 11 };
  const breakdown = data?.monthly_breakdown || [];

  const priMax = Math.max(pri.actual || 0, pri.target || 0, 1);
  const rdMax = Math.max(rd.actual || 0, rd.target || 0, 1);
  const fyMax = Math.max(fy.pri_target || 0, fy.pri_actual || 0, fy.rd_target || 0, fy.rd_actual || 0, 1);

  return (
    <div className="page-view animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <PieChart style={{ width: '26px', height: '26px', color: 'var(--gsh-teal)' }} />
            Dis-Dashboard FY (Primary & RD Sales Analytics)
            {loading && (
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gsh-teal)', background: 'rgba(0,168,150,0.1)', padding: '0.25rem 0.75rem', borderRadius: '14px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <RefreshCw style={{ width: '13px', height: '13px', animation: 'spin 1s linear infinite' }} />
                Loading...
              </span>
            )}
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0.3rem 0 0 0' }}>
            Executive Overview comparing Primary Targets vs Actuals & RD Targets vs Actuals (Live MySQL Data).
          </p>
        </div>
      </div>

      {/* Backlog Mode Switcher (Visible ONLY for Current Month) */}
      {isCurrentMonth && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.85rem',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '0.75rem 1.25rem',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>
              📊 Backlog Calculation Mode ({selectedMonth.toUpperCase()} - Current Month):
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              (Switch between Invoiced Net Sales and Pending Orders)
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setBacklogMode('with')}
              disabled={loading}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '6px',
                border: backlogMode === 'with' ? '1.5px solid var(--gsh-teal)' : '1px solid #cbd5e1',
                background: backlogMode === 'with' ? 'var(--gsh-teal)' : '#f8fafc',
                color: backlogMode === 'with' ? '#ffffff' : '#475569',
                fontWeight: backlogMode === 'with' ? 800 : 600,
                fontSize: '0.8rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: backlogMode === 'with' ? '0 2px 8px rgba(0,168,150,0.3)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Layers style={{ width: '14px', height: '14px' }} />
              Sales (Invoices + Reserved)
            </button>

            <button
              onClick={() => setBacklogMode('without')}
              disabled={loading}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '6px',
                border: backlogMode === 'without' ? '1.5px solid #3b82f6' : '1px solid #cbd5e1',
                background: backlogMode === 'without' ? '#3b82f6' : '#f8fafc',
                color: backlogMode === 'without' ? '#ffffff' : '#475569',
                fontWeight: backlogMode === 'without' ? 800 : 600,
                fontSize: '0.8rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Layers style={{ width: '14px', height: '14px' }} />
              Without Backlog (Invoices Only)
            </button>

            <button
              onClick={() => setBacklogMode('only')}
              disabled={loading}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '6px',
                border: backlogMode === 'only' ? '1.5px solid var(--gsh-teal)' : '1px solid #cbd5e1',
                background: backlogMode === 'only' ? 'var(--gsh-teal)' : '#f8fafc',
                color: backlogMode === 'only' ? '#ffffff' : '#475569',
                fontWeight: backlogMode === 'only' ? 800 : 600,
                fontSize: '0.8rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: backlogMode === 'only' ? '0 2px 8px rgba(0,168,150,0.3)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Package style={{ width: '14px', height: '14px' }} />
              Only Backlog (Reserved Only)
            </button>
          </div>
        </div>
      )}

      {/* ─── Interactive Month & Calendar Date Bar ─── */}
      <MonthCalendarBar
        selectedMonth={selectedMonth}
        onSelectMonth={(m) => {
          setSelectedMonth(m);
          setStartDate(null);
          setEndDate(null);
        }}
        startDate={startDate}
        endDate={endDate}
        onSelectDateRange={(s, e) => {
          setStartDate(s);
          setEndDate(e);
        }}
        loading={loading}
      />

      {/* 3-Column Responsive Dashboard Layout */}
      <div style={{ position: 'relative', minHeight: '460px' }}>
        <DataLoaderOverlay loading={loading} title="Crunching Dis-Dashboard Analytics..." />

        <div className="dashboard-cards-grid" style={{ opacity: loading ? 0.4 : 1, transition: 'opacity 0.25s ease' }}>
        
        {/* CARD 1: Primary Sales Details (Top Left) */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '0.925rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-main)', margin: '0 0 1rem 0' }}>
            Primary Sales Details ({data?.month_label || 'September 2026'})
          </h3>

          <div className="gauge-card-content">
            <div className="gauge-card-bars">
              {/* Pri:Act (Light Green) */}
              <div>
                <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Pri:Act</span>
                  <span style={{ fontWeight: 800, color: '#10b981', fontSize: '0.9rem' }}>{fmtMn(pri.actual)}</span>
                </div>
                <div style={{ background: '#f1f5f9', borderRadius: '6px', height: '32px', overflow: 'hidden', padding: '2px' }}>
                  <div style={{ width: `${Math.min(((pri.actual || 0) / priMax) * 100, 100)}%`, background: '#10b981', height: '100%', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                </div>
              </div>
              {/* Pri:Tgt (Red) */}
              <div>
                <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Pri:Tgt</span>
                  <span style={{ fontWeight: 800, color: '#c8102e', fontSize: '0.9rem' }}>{fmtMn(pri.target)}</span>
                </div>
                <div style={{ background: '#f1f5f9', borderRadius: '6px', height: '32px', overflow: 'hidden', padding: '2px' }}>
                  <div style={{ width: `${Math.min(((pri.target || 0) / priMax) * 100, 100)}%`, background: '#c8102e', height: '100%', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                </div>
              </div>
            </div>
            <div style={{ flexShrink: 0 }}>
              <CircularGauge percentage={pri.pct || 0} varianceNum={pri.variance} size={135} gradientId="disPriGrad" />
            </div>
          </div>
        </div>

        {/* CARD 2: RD Sales Details (Top Middle) */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '0.925rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-main)', margin: '0 0 1rem 0' }}>
            RD Sales Details ({data?.month_label || 'September 2026'})
          </h3>

          <div className="gauge-card-content">
            <div className="gauge-card-bars">
              {/* RD:Act (Blue) */}
              <div>
                <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>RD:Act</span>
                  <span style={{ fontWeight: 800, color: '#3b82f6', fontSize: '0.9rem' }}>{fmtMn(rd.actual)}</span>
                </div>
                <div style={{ background: '#f1f5f9', borderRadius: '6px', height: '32px', overflow: 'hidden', padding: '2px' }}>
                  <div style={{ width: `${Math.min(((rd.actual || 0) / rdMax) * 100, 100)}%`, background: '#3b82f6', height: '100%', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                </div>
              </div>
              {/* RD:Tgt (Red) */}
              <div>
                <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>RD:Tgt</span>
                  <span style={{ fontWeight: 800, color: '#c8102e', fontSize: '0.9rem' }}>{fmtMn(rd.target)}</span>
                </div>
                <div style={{ background: '#f1f5f9', borderRadius: '6px', height: '32px', overflow: 'hidden', padding: '2px' }}>
                  <div style={{ width: `${Math.min(((rd.target || 0) / rdMax) * 100, 100)}%`, background: '#c8102e', height: '100%', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                </div>
              </div>
            </div>
            <div style={{ flexShrink: 0 }}>
              <CircularGauge percentage={rd.pct || 0} varianceNum={rd.variance} size={135} gradientId="disRdGrad" />
            </div>
          </div>
        </div>

        {/* CARD 3: Distributor Total Budget vs Actual FY 27' (Tall Right Column) */}
        <div className="glass-card dashboard-card-tall" style={{ padding: '1.5rem', gridRow: 'span 2', display: 'flex', flexDirection: 'column', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '0.925rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-main)', margin: '0 0 1rem 0', textAlign: 'center' }}>
            Distributor Total Budget vs Actual FY 27'
          </h3>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.65rem', alignItems: 'flex-end', height: '260px', padding: '0 0.5rem' }}>
              {/* Pri:Tgt (Red) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#c8102e' }}>{fmtMnFull(fy.pri_target)}</span>
                <div style={{ width: '100%', height: `${Math.max(((fy.pri_target || 0) / fyMax) * 190, 15)}px`, background: '#c8102e', borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#c8102e' }}>Pri:Tgt</span>
              </div>
              {/* Pri:Act (Light Green) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#10b981' }}>{fmtMnFull(fy.pri_actual)}</span>
                <div style={{ width: '100%', height: `${Math.max(((fy.pri_actual || 0) / fyMax) * 190, 15)}px`, background: '#10b981', borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10b981' }}>Pri:Act</span>
              </div>
              {/* RD:Tgt (Red) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#c8102e' }}>{fmtMnFull(fy.rd_target)}</span>
                <div style={{ width: '100%', height: `${Math.max(((fy.rd_target || 0) / fyMax) * 190, 15)}px`, background: '#c8102e', borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#c8102e' }}>RD:Tgt</span>
              </div>
              {/* RD:Act (Blue) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#3b82f6' }}>{fmtMnFull(fy.rd_actual)}</span>
                <div style={{ width: '100%', height: `${Math.max(((fy.rd_actual || 0) / fyMax) * 190, 15)}px`, background: '#3b82f6', borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#3b82f6' }}>RD:Act</span>
              </div>
            </div>

            {/* Achievement Badges */}
            <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <div style={{ padding: '0.5rem 1.25rem', background: 'rgba(16,185,129,0.12)', borderRadius: '24px', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', fontWeight: 800, fontSize: '0.925rem' }}>
                Primary: {fy.pri_pct || 0}%
              </div>
              <div style={{ padding: '0.5rem 1.25rem', background: 'rgba(59,130,246,0.12)', borderRadius: '24px', border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6', fontWeight: 800, fontSize: '0.925rem' }}>
                RD: {fy.rd_pct || 0}%
              </div>
            </div>
          </div>
        </div>

        {/* CARD 4: Primary Update of the Month wise (Bottom Left) - COMBO CHART */}
        <QuarterComboChart
          title="Primary Update of the Month wise"
          data={breakdown}
          actKey="pri_act"
          tgtKey="pri_tgt"
          barColor="#c8102e"
          lineColor="#10b981"
          iconColor="#10b981"
          subtitle="12-Month Primary Target (Bars) vs Primary Invoiced Actuals (Line)"
        />

        {/* CARD 5: RD Update of the Month wise (Bottom Middle) - COMBO CHART */}
        <QuarterComboChart
          title="RD Update of the Month wise"
          data={breakdown}
          actKey="rd_act"
          tgtKey="rd_tgt"
          barColor="#c8102e"
          lineColor="#3b82f6"
          iconColor="#3b82f6"
          subtitle="12-Month RD Target (Bars) vs Axienta SFA Secondary Sales (Line)"
        />

        </div>
      </div>
    </div>
  );
};

export default DisDashboardFyPage;
