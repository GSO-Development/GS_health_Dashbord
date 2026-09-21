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

const CircularGauge = ({ percentage, variance, size = 120, activeColor = '#10b981', gradientId = 'gaugeGrad' }) => {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  const isWarning = activeColor === '#f59e0b';
  const stopColor = isWarning ? '#d97706' : (activeColor === '#c8102e' ? '#991b1b' : '#059669');

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
          <span style={{ fontSize: size > 115 ? '1.45rem' : '1.25rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1, letterSpacing: '-0.02em' }}>
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
          background: activeColor === '#f59e0b' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
          padding: '0.15rem 0.55rem',
          borderRadius: '10px',
          border: `1px solid ${activeColor === '#f59e0b' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
          display: 'inline-block'
        }}>
          {variance}
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
  const [showAdminFormulas, setShowAdminFormulas] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [backlogMode, setBacklogMode] = useState('with'); // 'with' | 'without' | 'only'
  const [selectedContracts, setSelectedContracts] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = { month: selectedMonth, backlog_mode: backlogMode };
      if (startDate && endDate) {
        if (startDate === endDate) {
          params.date = startDate;
        } else {
          params.start_date = startDate;
          params.end_date = endDate;
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
  }, [selectedMonth, startDate, endDate, backlogMode, selectedContracts]);

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

const AdminFormulaBox = ({ targetFormula, actualFormula, dataSource }) => (
  <div style={{
    background: '#f8fafc',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    padding: '0.55rem 0.75rem',
    marginBottom: '0.85rem',
    fontSize: '0.725rem',
    lineHeight: 1.45,
    borderLeft: '3.5px solid var(--gsh-teal)'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
      <span style={{ fontWeight: 800, color: 'var(--gsh-teal)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.725rem' }}>
        <Calculator style={{ width: '13px', height: '13px' }} />
        Finance Formula (Admin Guide)
      </span>
      <span style={{ fontSize: '0.65rem', background: '#e2e8f0', color: '#475569', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
        {dataSource}
      </span>
    </div>
    <div style={{ color: '#334155' }}>
      <div style={{ marginBottom: '0.15rem' }}><strong style={{ color: '#c8102e' }}>Target:</strong> {targetFormula}</div>
      <div><strong style={{ color: '#059669' }}>Actual:</strong> {actualFormula}</div>
    </div>
  </div>
);

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

        {/* Right Side Control Bar: Contract Multi-Select + Admin Formula Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <ContractMultiSelect
            selectedContracts={selectedContracts}
            onChange={setSelectedContracts}
            disabled={loading}
          />

          {isAdmin && (
            <button
              onClick={() => setShowAdminFormulas(prev => !prev)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-color)',
                background: showAdminFormulas ? 'rgba(0,168,150,0.1)' : 'var(--bg-card)',
                color: showAdminFormulas ? 'var(--gsh-teal)' : 'var(--text-main)',
                fontWeight: 800,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
              }}
            >
              <ShieldCheck style={{ width: '15px', height: '15px' }} />
              {showAdminFormulas ? <EyeOff style={{ width: '14px', height: '14px' }} /> : <Eye style={{ width: '14px', height: '14px' }} />}
              Admin Formula Guide: {showAdminFormulas ? 'ON' : 'OFF'}
            </button>
          )}
        </div>
      </div>

      {/* ─── Backlog Calculation Mode Switcher (Visible to BOTH Admin & User) ─── */}
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
            Actuals Calculation Mode:
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
            With Backlog (Invoice + Backlog)
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
            Only Backlog (Pending Orders)
          </button>
        </div>
      </div>

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

          {/* Admin Formula Box */}
          {isAdmin && showAdminFormulas && (
            <AdminFormulaBox
              targetFormula="Monthly Sales Budget Target (From Total Budget Plan)"
              actualFormula="Total Net Invoiced Revenue (IFS) + Total Pending Unfulfilled Backlog Orders"
              dataSource="IFS Invoices + Backlog"
            />
          )}

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
              <CircularGauge percentage={tb.pct} variance={toMn(tb.variance)} size={120} activeColor="#10b981" gradientId="tbGrad" />
            </div>
          </div>
        </div>

        {/* Card 2: DIRECT BUDGET vs ACTUAL */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '0.825rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', margin: '0 0 0.85rem 0', color: 'var(--text-main)' }}>
            DIRECT BUDGET vs ACTUAL – CURRENT MONTH
          </h3>

          {/* Admin Formula Box */}
          {isAdmin && showAdminFormulas && (
            <AdminFormulaBox
              targetFormula="Direct Channels Target = (Total Monthly Target - Distributor Primary Target)"
              actualFormula="Direct Customers Net Invoiced Sales (Hospitals/Pharmacies/Direct) + Direct Pending Backlog"
              dataSource="IFS Non-DISTRI Invoices + Backlog"
            />
          )}

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
              <CircularGauge percentage={db.pct} variance={toMn(db.variance)} size={120} activeColor="#10b981" gradientId="dbGrad" />
            </div>
          </div>
        </div>

        {/* Card 5: ANNUAL BUDGET vs ACTUAL */}
        <div className="glass-card dashboard-card-tall" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gridRow: 'span 2', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '0.825rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', margin: '0 0 0.85rem 0', color: 'var(--text-main)', textAlign: 'center' }}>
            ANNUAL BUDGET vs ACTUAL
          </h3>

          {/* Admin Formula Box */}
          {isAdmin && showAdminFormulas && (
            <AdminFormulaBox
              targetFormula="Full Fiscal Year Total Sales Budget Target (Total Budget Master Total Column)"
              actualFormula="Current Invoiced Sales + Pending Backlog Orders"
              dataSource="Annual Budget Master + IFS Invoices"
            />
          )}

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem 0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '1.8rem', height: '240px', width: '100%', position: 'relative' }}>
              {/* Target Bar */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#c8102e' }}>{toMnInt(an.target)}</span>
                <div style={{ width: '56px', height: `${Math.max((an.target / anMax) * 200, 15)}px`, background: '#c8102e', borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Target</span>
              </div>
              {/* Actual Bar */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#10b981' }}>{toMnInt(an.actual)}</span>
                <div style={{ width: '56px', height: `${Math.max((an.actual / anMax) * 200, 15)}px`, background: '#10b981', borderRadius: '4px 4px 0 0', position: 'relative', transition: 'height 0.5s ease' }}>
                  <div style={{
                    position: 'absolute', top: '45%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: '#ffffff',
                    borderRadius: '24px',
                    padding: '0.4rem 0.9rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.22)',
                    zIndex: 10,
                    border: '1.5px solid var(--border-color)'
                  }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#000000' }}>{an.pct}%</span>
                  </div>
                </div>
                <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700 }}>Actual</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: DIS : PRI BUDGET vs ACTUAL */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '0.825rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', margin: '0 0 0.85rem 0', color: 'var(--text-main)' }}>
            DIS : PRI BUDGET vs ACTUAL – CURRENT MONTH
          </h3>

          {/* Admin Formula Box */}
          {isAdmin && showAdminFormulas && (
            <AdminFormulaBox
              targetFormula="Distributor Primary Sales Budget Target (From Dis Budget Plan -> Primary Target)"
              actualFormula="Distributor Net Invoiced Revenue (Customer Group: DISTRI) + Distributor Pending Backlog"
              dataSource="IFS DISTRI Invoices + Backlog"
            />
          )}

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
              <CircularGauge percentage={dp.pct} variance={toMn(dp.variance)} size={120} activeColor="#10b981" gradientId="dpGrad" />
            </div>
          </div>
        </div>

        {/* Card 4: DIS : RD BUDGET vs ACTUAL */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '0.825rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', margin: '0 0 0.85rem 0', color: 'var(--text-main)' }}>
            DIS : RD BUDGET vs ACTUAL – CURRENT MONTH
          </h3>

          {/* Admin Formula Box */}
          {isAdmin && showAdminFormulas && (
            <AdminFormulaBox
              targetFormula="Retail Distribution (Secondary) Sales Budget Target (From Dis Budget Plan -> RD Target)"
              actualFormula="Actual Field Sales Invoiced to Retail Outlets / Pharmacies (From Axienta SFA System)"
              dataSource="Axienta SFA Sales Records"
            />
          )}

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
              <CircularGauge percentage={dr.pct} variance={toMn(dr.variance)} size={120} activeColor="#f59e0b" gradientId="drGrad" />
            </div>
          </div>
        </div>

        </div>
      </div>

    </div>
  );
};

export default DashboardFyPage;



