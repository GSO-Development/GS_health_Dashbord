import React, { useState, useEffect } from 'react';
import { PieChart, RefreshCw, Calculator, ShieldCheck, Eye, EyeOff, Layers, Package, FileCheck } from 'lucide-react';
import MonthCalendarBar, { getCurrentMonthKey } from '../components/common/MonthCalendarBar';
import DataLoaderOverlay from '../components/common/DataLoaderOverlay';
import ContractMultiSelect from '../components/common/ContractMultiSelect';
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

const CircularGauge = ({ percentage = 0, varianceNum = 0, size = 115, gradientId = 'disGaugeGrad' }) => {
  const isAchieved = (percentage >= 100) || (varianceNum >= 0);
  const activeColor = isAchieved ? '#10b981' : '#c8102e';
  const stopColor = isAchieved ? '#059669' : '#991b1b';

  const strokeWidth = 10;
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
        <span style={{ fontSize: '1.4rem', fontWeight: 900, color: activeColor, letterSpacing: '-0.5px' }}>
          {percentage}%
        </span>
        <span style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          VARIANCE
        </span>
        <span style={{
          fontSize: '0.75rem',
          fontWeight: 800,
          color: activeColor,
          background: isAchieved ? 'rgba(16, 185, 129, 0.1)' : 'rgba(200, 16, 46, 0.1)',
          padding: '0.1rem 0.45rem',
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

const DisDashboardFyPage = () => {
  const { isAdmin } = useAuth();
  const [showAdminFormulas, setShowAdminFormulas] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [backlogMode, setBacklogMode] = useState('without'); // default 'without' (Without Backlog / Invoiced Only)
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
          params.end_date = endDate;
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

  return (
    <div className="page-view animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Header with Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PieChart style={{ width: '24px', height: '24px', color: 'var(--gsh-teal)' }} />
            Dis-Dashboard fy (Primary & RD Sales Analytics)
            {loading && (
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gsh-teal)', background: 'rgba(0,168,150,0.1)', padding: '0.2rem 0.6rem', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <RefreshCw style={{ width: '12px', height: '12px', animation: 'spin 1s linear infinite' }} />
                Loading...
              </span>
            )}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
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
          gap: '0.75rem',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '0.6rem 1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
              📊 Backlog Calculation Mode ({selectedMonth.toUpperCase()} - Current Month):
            </span>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              (Switch between Invoiced Net Sales and Pending Orders)
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setBacklogMode('with')}
              disabled={loading}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                border: backlogMode === 'with' ? '1.5px solid var(--gsh-teal)' : '1px solid #cbd5e1',
                background: backlogMode === 'with' ? 'var(--gsh-teal)' : '#f8fafc',
                color: backlogMode === 'with' ? '#ffffff' : '#475569',
                fontWeight: backlogMode === 'with' ? 800 : 600,
                fontSize: '0.75rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: backlogMode === 'with' ? '0 2px 6px rgba(0,168,150,0.3)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Layers style={{ width: '13px', height: '13px' }} />
              Sales (Invoices + Reserved)
            </button>

            <button
              onClick={() => setBacklogMode('without')}
              disabled={loading}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                border: backlogMode === 'without' ? '1.5px solid var(--gsh-teal)' : '1px solid #cbd5e1',
                background: backlogMode === 'without' ? 'var(--gsh-teal)' : '#f8fafc',
                color: backlogMode === 'without' ? '#ffffff' : '#475569',
                fontWeight: backlogMode === 'without' ? 800 : 600,
                fontSize: '0.75rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: backlogMode === 'without' ? '0 2px 6px rgba(0,168,150,0.3)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <FileCheck style={{ width: '13px', height: '13px' }} />
              Without Backlog (Invoiced Only)
            </button>

            <button
              onClick={() => setBacklogMode('only')}
              disabled={loading}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                border: backlogMode === 'only' ? '1.5px solid var(--gsh-teal)' : '1px solid #cbd5e1',
                background: backlogMode === 'only' ? 'var(--gsh-teal)' : '#f8fafc',
                color: backlogMode === 'only' ? '#ffffff' : '#475569',
                fontWeight: backlogMode === 'only' ? 800 : 600,
                fontSize: '0.75rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: backlogMode === 'only' ? '0 2px 6px rgba(0,168,150,0.3)' : 'none',
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

      {/* 3-Column Responsive Dashboard Layout */}
      <div style={{ position: 'relative', minHeight: '440px' }}>
        <DataLoaderOverlay loading={loading} title="Crunching Dis-Dashboard Analytics..." />

        <div className="dashboard-cards-grid" style={{ opacity: loading ? 0.4 : 1, transition: 'opacity 0.25s ease' }}>
        
        {/* CARD 1: Primary Sales Details (Top Left) */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-main)', margin: '0 0 0.75rem 0' }}>
            Primary Sales Details ({data?.month_label || 'July 2026'})
          </h3>

          {/* Admin Formula Guide */}
          {isAdmin && showAdminFormulas && (
            <AdminFormulaBox
              targetFormula="Monthly Primary Target from uploaded Dis Budget (dis_budget.primary_target). Pro-rated by days if date filter active."
              actualFormula="Invoiced Sales (invoice_output.net_dom_amount) where Cust Grp = 'DISTRI' + Backlog Orders (outstanding_output.backlog_value_base_curr) where Cust Grp = 'DISTRI' (contract != 'GSTEA')."
              dataSource="dis_budget + invoice_output + outstanding_output"
            />
          )}

          <div className="gauge-card-content">
            <div className="gauge-card-bars">
              {/* Pri:Act */}
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Pri:Act</span>
                  <span style={{ fontWeight: 800, color: '#06b6d4' }}>{fmtMn(pri.actual)}</span>
                </div>
                <div style={{ background: '#f1f5f9', borderRadius: '6px', height: '28px', overflow: 'hidden', padding: '2px' }}>
                  <div style={{ width: '100%', background: '#06b6d4', height: '100%', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                </div>
              </div>
              {/* Pri:Tgt */}
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Pri:Tgt</span>
                  <span style={{ fontWeight: 800, color: '#00a896' }}>{fmtMn(pri.target)}</span>
                </div>
                <div style={{ background: '#f1f5f9', borderRadius: '6px', height: '28px', overflow: 'hidden', padding: '2px' }}>
                  <div style={{ width: pri.target > 0 ? `${Math.min((pri.target / (pri.actual || 1)) * 100, 100)}%` : '50%', background: '#00a896', height: '100%', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                </div>
              </div>
            </div>
            <div style={{ flexShrink: 0 }}>
              <CircularGauge percentage={pri.pct || 0} varianceNum={pri.variance} size={110} gradientId="disPriGrad" />
            </div>
          </div>
        </div>

        {/* CARD 2: RD Sales Details (Top Middle) */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-main)', margin: '0 0 0.75rem 0' }}>
            RD Sales Details ({data?.month_label || 'July 2026'})
          </h3>

          {/* Admin Formula Guide */}
          {isAdmin && showAdminFormulas && (
            <AdminFormulaBox
              targetFormula="Monthly RD (Redistribution) Target from uploaded Dis Budget (dis_budget.rd_target). Pro-rated by days if date filter active."
              actualFormula="Total secondary sales value from Axienta SFA distributor synchronization (axienta_data.value)."
              dataSource="dis_budget + axienta_data (Axienta SFA)"
            />
          )}

          <div className="gauge-card-content">
            <div className="gauge-card-bars">
              {/* RD:Act */}
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>RD:Act</span>
                  <span style={{ fontWeight: 800, color: '#3b82f6' }}>{fmtMn(rd.actual)}</span>
                </div>
                <div style={{ background: '#f1f5f9', borderRadius: '6px', height: '28px', overflow: 'hidden', padding: '2px' }}>
                  <div style={{ width: rd.target > 0 ? `${Math.min((rd.actual / rd.target) * 100, 100)}%` : '40%', background: '#3b82f6', height: '100%', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                </div>
              </div>
              {/* RD:Tgt */}
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>RD:Tgt</span>
                  <span style={{ fontWeight: 800, color: '#1e3a8a' }}>{fmtMn(rd.target)}</span>
                </div>
                <div style={{ background: '#f1f5f9', borderRadius: '6px', height: '28px', overflow: 'hidden', padding: '2px' }}>
                  <div style={{ width: '100%', background: '#1e3a8a', height: '100%', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                </div>
              </div>
            </div>
            <div style={{ flexShrink: 0 }}>
              <CircularGauge percentage={rd.pct || 0} varianceNum={rd.variance} size={110} gradientId="disRdGrad" />
            </div>
          </div>
        </div>

        {/* CARD 3: Distributor Total Budget vs Actual FY 27' (Tall Right Column) */}
        <div className="glass-card dashboard-card-tall" style={{ padding: '1.25rem', gridRow: 'span 2', display: 'flex', flexDirection: 'column', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-main)', margin: '0 0 0.75rem 0', textAlign: 'center' }}>
            Distributor Total Budget vs Actual FY 27'
          </h3>

          {/* Admin Formula Guide */}
          {isAdmin && showAdminFormulas && (
            <AdminFormulaBox
              targetFormula="Annual Primary Target (12M sum of primary_target) vs Annual RD Target (12M sum of rd_target) from dis_budget."
              actualFormula="Full Financial Year Invoiced Sales (DISTRI) + Backlog Orders vs Full Financial Year Axienta SFA RD Sales."
              dataSource="dis_budget + invoice_output + outstanding_output + axienta_data"
            />
          )}
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', alignItems: 'flex-end', height: '240px', padding: '0 0.5rem' }}>
              {/* Pri:Tgt */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-main)' }}>{fmtMnFull(fy.pri_target)}</span>
                <div style={{ width: '100%', height: '180px', background: '#00a896', borderRadius: '4px 4px 0 0' }} />
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)' }}>Pri:Tgt</span>
              </div>
              {/* Pri:Act */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#06b6d4' }}>{fmtMnFull(fy.pri_actual)}</span>
                <div style={{ width: '100%', height: `${Math.min((fy.pri_actual / (fy.pri_target || 1)) * 180, 220)}px`, background: '#06b6d4', borderRadius: '4px 4px 0 0' }} />
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#06b6d4' }}>Pri:Act</span>
              </div>
              {/* RD:Tgt */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-main)' }}>{fmtMnFull(fy.rd_target)}</span>
                <div style={{ width: '100%', height: '180px', background: '#1e3a8a', borderRadius: '4px 4px 0 0' }} />
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)' }}>RD:Tgt</span>
              </div>
              {/* RD:Act */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#3b82f6' }}>{fmtMnFull(fy.rd_actual)}</span>
                <div style={{ width: '100%', height: `${Math.max(Math.min((fy.rd_actual / (fy.rd_target || 1)) * 180, 220), 20)}px`, background: '#3b82f6', borderRadius: '4px 4px 0 0' }} />
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#3b82f6' }}>RD:Act</span>
              </div>
            </div>

            {/* Achievement Badges */}
            <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <div style={{ padding: '0.4rem 1rem', background: 'rgba(6,182,212,0.12)', borderRadius: '20px', border: '1px solid rgba(6,182,212,0.3)', color: '#06b6d4', fontWeight: 800, fontSize: '0.85rem' }}>
                Primary: {fy.pri_pct || 0}%
              </div>
              <div style={{ padding: '0.4rem 1rem', background: 'rgba(59,130,246,0.12)', borderRadius: '20px', border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6', fontWeight: 800, fontSize: '0.85rem' }}>
                RD: {fy.rd_pct || 0}%
              </div>
            </div>
          </div>
        </div>

        {/* CARD 4: Primary Update of the Quarter wise (Bottom Left) */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-main)', margin: '0 0 0.75rem 0' }}>
            Primary Update of the Quarter wise
          </h3>

          {/* Admin Formula Guide */}
          {isAdmin && showAdminFormulas && (
            <AdminFormulaBox
              targetFormula="Monthly Primary Targets from dis_budget grouped into Q1 (Apr-Jun), Q2 (Jul-Sep), Q3 (Oct-Dec), Q4 (Jan-Mar)."
              actualFormula="Monthly Invoiced Distributor Sales (DISTRI) + Active Month Pending Backlog Orders."
              dataSource="invoice_output + outstanding_output + dis_budget"
            />
          )}

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.35rem', height: '140px', padding: '0 0.25rem' }}>
            {breakdown.map((q, i) => {
              const heightPx = q.pri_tgt > 0 ? Math.min((q.pri_act / q.pri_tgt) * 110, 130) : 0;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                  <div style={{ width: '100%', height: `${Math.max(heightPx, q.pri_act > 0 ? 8 : 0)}px`, background: q.pri_act > 0 ? '#06b6d4' : 'var(--bg-hover)', borderRadius: '2px 2px 0 0' }} />
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{q.month_short}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'between', fontSize: '0.65rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
            <span>1st QTR</span><span>2nd QTR</span><span>3rd QTR</span><span>4th QTR</span>
          </div>
        </div>

        {/* CARD 5: RD Update of the Quarter wise (Bottom Middle) */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-main)', margin: '0 0 0.75rem 0' }}>
            RD Update of the Quarter wise
          </h3>

          {/* Admin Formula Guide */}
          {isAdmin && showAdminFormulas && (
            <AdminFormulaBox
              targetFormula="Monthly RD Targets from dis_budget grouped into Q1 (Apr-Jun), Q2 (Jul-Sep), Q3 (Oct-Dec), Q4 (Jan-Mar)."
              actualFormula="Monthly RD Sales Value from Axienta SFA distributor synchronization (axienta_data.value)."
              dataSource="axienta_data + dis_budget"
            />
          )}

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.35rem', height: '140px', padding: '0 0.25rem' }}>
            {breakdown.map((q, i) => {
              const heightPx = q.rd_tgt > 0 ? Math.min((q.rd_act / q.rd_tgt) * 110, 130) : 0;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                  <div style={{ width: '100%', height: `${Math.max(heightPx, q.rd_act > 0 ? 8 : 0)}px`, background: q.rd_act > 0 ? '#3b82f6' : 'var(--bg-hover)', borderRadius: '2px 2px 0 0' }} />
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{q.month_short}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'between', fontSize: '0.65rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
            <span>1st QTR</span><span>2nd QTR</span><span>3rd QTR</span><span>4th QTR</span>
          </div>
        </div>

        </div>
      </div>
    </div>
  );
};

export default DisDashboardFyPage;
