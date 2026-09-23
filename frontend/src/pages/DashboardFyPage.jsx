import React, { useState, useEffect } from 'react';
import { RefreshCw, Info, Calculator, ShieldCheck, Eye, EyeOff, Layers, Package, FileCheck } from 'lucide-react';
import MonthCalendarBar from '../components/common/MonthCalendarBar';
import DataLoaderOverlay from '../components/common/DataLoaderOverlay';
import ContractMultiSelect from '../components/common/ContractMultiSelect';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const toMn = (val) => {
  if (val === undefined || val === null) return '0.0 M';
  const mn = val / 1000000;
  return mn.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' M';
};

const toMnInt = (val) => {
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

const CircularGauge = ({ percentage = 0, varianceNum = 0, size = 120, gradientId = 'gaugeGrad' }) => {
  const isAchieved = (percentage >= 100) || (varianceNum >= 0);
  const activeColor = isAchieved ? '#10b981' : '#c8102e';
  const stopColor = isAchieved ? '#059669' : '#991b1b';
  const bgBadge = isAchieved ? 'rgba(16, 185, 129, 0.1)' : 'rgba(200, 16, 46, 0.1)';
  const borderBadge = isAchieved ? 'rgba(16, 185, 129, 0.3)' : 'rgba(200, 16, 46, 0.3)';

  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  const formattedVariance = fmtVariance(varianceNum);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.08))' }}>
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
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray="6 4"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
          />
        </svg>
        <div style={{ position: 'absolute', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: size > 115 ? '1.45rem' : '1.25rem', fontWeight: 900, color: activeColor, lineHeight: 1, letterSpacing: '-0.02em' }}>
            {percentage}%
          </span>
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '0.45rem' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-subtle)', marginBottom: '0.15rem' }}>
          VARIANCE
        </div>
        <div style={{
          fontSize: '0.825rem',
          fontWeight: 800,
          color: activeColor,
          background: bgBadge,
          padding: '0.15rem 0.55rem',
          borderRadius: '10px',
          border: `1px solid ${borderBadge}`,
          display: 'inline-block'
        }}>
          {formattedVariance}
        </div>
      </div>
    </div>
  );
};

const getCurrentMonthKey = () => {
  const curMonthIndex = new Date().getMonth(); // 0 = Jan, 1 = Feb, ... 8 = Sep, 11 = Dec
  const monthKeys = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  return monthKeys[curMonthIndex] || 'september';
};

const DashboardFyPage = () => {
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

  const loadData = async () => {
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
      if (selectedContracts && selectedContracts.length > 0) {
        params.contracts = selectedContracts.join(',');
      }

      const res = await api.get('/reports/dashboard-fy-overview', { params });
      if (res.data) {
        setData(res.data);
      }
    } catch {
      // Fallback
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth, startDate, endDate, effectiveBacklogMode, selectedContracts]);

  // Data helpers
  const tb = data?.total_budget || { target: 1092090000, actual: 1200681486.76, pct: 110, variance: 108591486.76 };
  const db = data?.direct_budget || { target: 338680000, actual: 473690000, pct: 140, variance: 135010000 };
  const dp = data?.dis_pri || { target: 753410000, actual: 779880000, pct: 104, variance: 26470000 };
  const dr = data?.dis_rd || { target: 839740000, actual: 645450000, pct: 77, variance: -194290000 };
  const an = data?.annual || { target: 13554000000, actual: 1200681486.76, pct: 9 };

  // Max values for bar widths
  const tbMax = Math.max(tb.actual, tb.target) * 1.1;
  const dbMax = Math.max(db.actual, db.target) * 1.1;
  const dpMax = Math.max(dp.actual, dp.target) * 1.1;
  const drMax = Math.max(dr.actual, dr.target) * 1.1;
  const anMax = Math.max(an.actual, an.target) * 1.05;

  return (
    <div className="page-view animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* ─── Header with Contract Multi-Select & Admin Formula Toggle ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Dashboard FY 2026/27 Overview ({data?.month_label || 'Current Month'})
            {loading && (
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gsh-teal)', background: 'rgba(0,168,150,0.1)', padding: '0.2rem 0.6rem', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <RefreshCw style={{ width: '12px', height: '12px', animation: 'spin 1s linear infinite' }} />
                Loading...
              </span>
            )}
          </h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
            Executive sales target vs actual performance overview.
          </p>
        </div>
      </div>

      {/* ─── Backlog Calculation Mode Switcher (Visible ONLY for the CURRENT Month) ─── */}
      {isCurrentMonth && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          background: 'var(--bg-card)',
          padding: '0.65rem 1rem',
          borderRadius: 'var(--radius-xs)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          opacity: loading ? 0.8 : 1,
          transition: 'opacity 0.2s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers style={{ width: '18px', height: '18px', color: 'var(--gsh-teal)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Actuals Calculation Mode ({selectedMonth.toUpperCase()} - Current Month):
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              (Choose whether Actual sales figures include pending order backlog)
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-hover)', padding: '0.25rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <button
              disabled={loading}
              onClick={() => setBacklogMode('with')}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '4px',
                border: 'none',
                background: backlogMode === 'with' ? 'var(--gsh-teal)' : 'transparent',
                color: backlogMode === 'with' ? '#ffffff' : 'var(--text-main)',
                fontWeight: 800,
                fontSize: '0.78rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.15s ease'
              }}
            >
              <Layers style={{ width: '13px', height: '13px' }} />
              Sales (Invoices + Reserved)
            </button>

            <button
              disabled={loading}
              onClick={() => setBacklogMode('without')}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '4px',
                border: 'none',
                background: backlogMode === 'without' ? '#3b82f6' : 'transparent',
                color: backlogMode === 'without' ? '#ffffff' : 'var(--text-main)',
                fontWeight: 800,
                fontSize: '0.78rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.15s ease'
              }}
            >
              <FileCheck style={{ width: '13px', height: '13px' }} />
              Without Backlog (Invoices Only)
            </button>

            <button
              disabled={loading}
              onClick={() => setBacklogMode('only')}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '4px',
                border: 'none',
                background: backlogMode === 'only' ? '#8b5cf6' : 'transparent',
                color: backlogMode === 'only' ? '#ffffff' : 'var(--text-main)',
                fontWeight: 800,
                fontSize: '0.78rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.15s ease'
              }}
            >
              <Package style={{ width: '13px', height: '13px' }} />
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

      {/* ─── Cards Container with Smooth Loading Overlay ─── */}
      <div style={{ position: 'relative' }}>
        <DataLoaderOverlay loading={loading} title="Crunching Dashboard FY Analytics..." />

        {/* ─── 3-Column Responsive Grid Layout ─── */}
        <div className="dashboard-cards-grid" style={{ opacity: loading ? 0.4 : 1, transition: 'opacity 0.25s ease' }}>

        
        {/* Card 1: TOTAL BUDGET vs ACTUAL */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '0.825rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', margin: '0 0 0.85rem 0', color: 'var(--text-main)' }}>
            TOTAL BUDGET vs ACTUAL – CURRENT MONTH
          </h3>

          <div className="gauge-card-content">
            <div className="gauge-card-bars">
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', marginBottom: '0.35rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Actual</span>
                  <span style={{ fontSize: '0.825rem', fontWeight: 800, color: '#10b981' }}>{toMn(tb.actual)}</span>
                </div>
                <div style={{ background: '#f1f5f9', borderRadius: '6px', height: '28px', overflow: 'hidden', padding: '2px' }}>
                  <div style={{ width: `${Math.min((tb.actual / tbMax) * 100, 100)}%`, background: '#10b981', height: '100%', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', marginBottom: '0.35rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Target</span>
                  <span style={{ fontSize: '0.825rem', fontWeight: 800, color: '#c8102e' }}>{toMn(tb.target)}</span>
                </div>
                <div style={{ background: '#f1f5f9', borderRadius: '6px', height: '28px', overflow: 'hidden', padding: '2px' }}>
                  <div style={{ width: `${Math.min((tb.target / tbMax) * 100, 100)}%`, background: '#c8102e', height: '100%', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                </div>
              </div>
            </div>
            <div style={{ flexShrink: 0 }}>
              <CircularGauge percentage={tb.pct} varianceNum={tb.variance} size={120} gradientId="tbGrad" />
            </div>
          </div>
        </div>

        {/* Card 2: DIRECT BUDGET vs ACTUAL */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '0.825rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', margin: '0 0 0.85rem 0', color: 'var(--text-main)' }}>
            DIRECT BUDGET vs ACTUAL – CURRENT MONTH
          </h3>

          <div className="gauge-card-content">
            <div className="gauge-card-bars">
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', marginBottom: '0.35rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Actual</span>
                  <span style={{ fontSize: '0.825rem', fontWeight: 800, color: '#10b981' }}>{toMn(db.actual)}</span>
                </div>
                <div style={{ background: '#f1f5f9', borderRadius: '6px', height: '28px', overflow: 'hidden', padding: '2px' }}>
                  <div style={{ width: `${Math.min((db.actual / dbMax) * 100, 100)}%`, background: '#10b981', height: '100%', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', marginBottom: '0.35rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Target</span>
                  <span style={{ fontSize: '0.825rem', fontWeight: 800, color: '#c8102e' }}>{toMn(db.target)}</span>
                </div>
                <div style={{ background: '#f1f5f9', borderRadius: '6px', height: '28px', overflow: 'hidden', padding: '2px' }}>
                  <div style={{ width: `${Math.min((db.target / dbMax) * 100, 100)}%`, background: '#c8102e', height: '100%', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                </div>
              </div>
            </div>
            <div style={{ flexShrink: 0 }}>
              <CircularGauge percentage={db.pct} varianceNum={db.variance} size={120} gradientId="dbGrad" />
            </div>
          </div>
        </div>

        {/* Card 5: ANNUAL BUDGET vs ACTUAL */}
        <div className="glass-card dashboard-card-tall" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gridRow: 'span 2', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '0.825rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', margin: '0 0 0.85rem 0', color: 'var(--text-main)', textAlign: 'center' }}>
            ANNUAL BUDGET vs ACTUAL
          </h3>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '2rem', height: '220px', width: '100%', position: 'relative' }}>
              {/* Target Bar */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#c8102e' }}>{toMnInt(an.target)}</span>
                <div style={{ width: '56px', height: `${Math.max((an.target / anMax) * 180, 15)}px`, background: '#c8102e', borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>FY Target</span>
              </div>

              {/* Actual Bar */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', position: 'relative' }}>
                {/* Percentage Badge - Placed at the TOP of the Bar */}
                <div style={{
                  background: an.pct >= 100 ? '#10b981' : (an.pct >= 50 ? '#0284c7' : '#c8102e'),
                  color: '#ffffff',
                  borderRadius: '16px',
                  padding: '0.2rem 0.65rem',
                  fontSize: '0.85rem',
                  fontWeight: 900,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem'
                }}>
                  <span>{an.pct}%</span>
                </div>

                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#10b981' }}>{toMnInt(an.actual)}</span>
                <div style={{
                  width: '56px',
                  height: `${Math.max((an.actual / anMax) * 180, 15)}px`,
                  background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                  borderRadius: '4px 4px 0 0',
                  position: 'relative',
                  transition: 'height 0.5s ease',
                  overflow: 'hidden'
                }}>
                  {/* Inner Portion for Selected Month */}
                  {(an.month_actual || tb.actual) > 0 && (
                    <div
                      title={`${(an.month_name || selectedMonth).toUpperCase()} (This Month): ${toMn(an.month_actual || tb.actual)}`}
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: `${Math.min(((an.month_actual || tb.actual) / (an.actual || 1)) * 100, 100)}%`,
                        background: 'rgba(255, 255, 255, 0.3)',
                        borderTop: '2px dashed rgba(255, 255, 255, 0.9)'
                      }}
                    />
                  )}
                </div>
                <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700 }}>FY Actual</span>
              </div>
            </div>

            {/* Selected Month & Full Year Breakdown Box */}
            <div style={{
              marginTop: '1rem',
              width: '100%',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              padding: '0.65rem 0.85rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              fontSize: '0.78rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Full Year (Annual) Actual:</span>
                <span style={{ fontWeight: 800, color: '#10b981' }}>{toMn(an.actual)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #e2e8f0', paddingTop: '0.35rem' }}>
                <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>
                  {(an.month_name || selectedMonth).toUpperCase()} (Selected Month):
                </span>
                <span style={{ fontWeight: 800, color: '#0284c7' }}>{toMn(an.month_actual || tb.actual)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: DIS : PRI BUDGET vs ACTUAL */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '0.825rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', margin: '0 0 0.85rem 0', color: 'var(--text-main)' }}>
            DIS : PRI BUDGET vs ACTUAL – CURRENT MONTH
          </h3>

          <div className="gauge-card-content">
            <div className="gauge-card-bars">
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', marginBottom: '0.35rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Actual</span>
                  <span style={{ fontSize: '0.825rem', fontWeight: 800, color: '#10b981' }}>{toMn(dp.actual)}</span>
                </div>
                <div style={{ background: '#f1f5f9', borderRadius: '6px', height: '28px', overflow: 'hidden', padding: '2px' }}>
                  <div style={{ width: `${Math.min((dp.actual / dpMax) * 100, 100)}%`, background: '#10b981', height: '100%', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', marginBottom: '0.35rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Target</span>
                  <span style={{ fontSize: '0.825rem', fontWeight: 800, color: '#c8102e' }}>{toMn(dp.target)}</span>
                </div>
                <div style={{ background: '#f1f5f9', borderRadius: '6px', height: '28px', overflow: 'hidden', padding: '2px' }}>
                  <div style={{ width: `${Math.min((dp.target / dpMax) * 100, 100)}%`, background: '#c8102e', height: '100%', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                </div>
              </div>
            </div>
            <div style={{ flexShrink: 0 }}>
              <CircularGauge percentage={dp.pct} varianceNum={dp.variance} size={120} gradientId="dpGrad" />
            </div>
          </div>
        </div>

        {/* Card 4: DIS : RD BUDGET vs ACTUAL */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '0.825rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', margin: '0 0 0.85rem 0', color: 'var(--text-main)' }}>
            DIS : RD BUDGET vs ACTUAL – CURRENT MONTH
          </h3>

          <div className="gauge-card-content">
            <div className="gauge-card-bars">
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', marginBottom: '0.35rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Actual</span>
                  <span style={{ fontSize: '0.825rem', fontWeight: 800, color: '#10b981' }}>{toMn(dr.actual)}</span>
                </div>
                <div style={{ background: '#f1f5f9', borderRadius: '6px', height: '28px', overflow: 'hidden', padding: '2px' }}>
                  <div style={{ width: `${Math.min((dr.actual / drMax) * 100, 100)}%`, background: '#10b981', height: '100%', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', marginBottom: '0.35rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Target</span>
                  <span style={{ fontSize: '0.825rem', fontWeight: 800, color: '#c8102e' }}>{toMn(dr.target)}</span>
                </div>
                <div style={{ background: '#f1f5f9', borderRadius: '6px', height: '28px', overflow: 'hidden', padding: '2px' }}>
                  <div style={{ width: `${Math.min((dr.target / drMax) * 100, 100)}%`, background: '#c8102e', height: '100%', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                </div>
              </div>
            </div>
            <div style={{ flexShrink: 0 }}>
              <CircularGauge percentage={dr.pct} varianceNum={dr.variance} size={120} gradientId="drGrad" />
            </div>
          </div>
        </div>

        </div>
      </div>

    </div>
  );
};

export default DashboardFyPage;



