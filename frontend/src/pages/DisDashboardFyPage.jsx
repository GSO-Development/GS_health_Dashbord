import React, { useState, useEffect } from 'react';
import { PieChart, RefreshCw } from 'lucide-react';
import MonthCalendarBar from '../components/common/MonthCalendarBar';
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

const CircularGauge = ({ percentage, variance, size = 110, activeColor = '#06b6d4' }) => {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cappedPct = Math.min(percentage, 999);
  const strokeDashoffset = circumference - (Math.min(cappedPct, 100) / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
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
            stroke={activeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: size > 120 ? '1.5rem' : '1.35rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1 }}>
            {percentage}%
          </span>
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '0.4rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
          VARIANCE
        </div>
        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: activeColor }}>
          {variance}
        </div>
      </div>
    </div>
  );
};

const DisDashboardFyPage = () => {
  const [selectedMonth, setSelectedMonth] = useState('july');
  const [selectedDate, setSelectedDate] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDisDashboardData = async () => {
    setLoading(true);
    try {
      const params = { month: selectedMonth };
      if (selectedDate) params.date = selectedDate;

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
  }, [selectedMonth, selectedDate]);

  const pri = data?.primary_sales || { actual: 783909774.55, target: 80800000, pct: 970, variance: 703109774.55 };
  const rd = data?.rd_sales || { actual: 22494390.46, target: 80800000, pct: 28, variance: -58305609.54 };
  const fy = data?.full_year || { pri_target: 964400000, pri_actual: 783909774.55, pri_pct: 81, rd_target: 964400000, rd_actual: 105931503.38, rd_pct: 11 };
  const breakdown = data?.monthly_breakdown || [];

  return (
    <div className="page-view animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PieChart style={{ width: '24px', height: '24px', color: 'var(--gsh-teal)' }} />
            Dis-Dashboard fy (Primary & RD Sales Analytics)
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
            Executive Overview comparing Primary Targets vs Actuals & RD Targets vs Actuals (Live MySQL Data).
          </p>
        </div>

        <button
          onClick={fetchDisDashboardData}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 0.9rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
        >
          <RefreshCw style={{ width: '15px', height: '15px' }} /> Refresh Live Data
        </button>
      </div>

      {/* ─── Interactive Month & Calendar Date Bar ─── */}
      <MonthCalendarBar
        selectedMonth={selectedMonth}
        onSelectMonth={setSelectedMonth}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      {/* 3-Column Dashboard Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', alignItems: 'stretch' }}>
        
        {/* CARD 1: Primary Sales Details (Top Left) */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-main)', margin: '0 0 1rem 0' }}>
            Primary Sales Details ({data?.month_label || 'July 2026'})
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flex: 1 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
            <CircularGauge percentage={pri.pct || 0} variance={`${fmtMn(pri.variance)}`} size={110} activeColor="#06b6d4" />
          </div>
        </div>

        {/* CARD 2: RD Sales Details (Top Middle) */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-main)', margin: '0 0 1rem 0' }}>
            RD Sales Details ({data?.month_label || 'July 2026'})
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flex: 1 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
            <CircularGauge percentage={rd.pct || 0} variance={`${fmtMn(rd.variance)}`} size={110} activeColor={rd.pct >= 100 ? '#10b981' : '#f59e0b'} />
          </div>
        </div>

        {/* CARD 3: Distributor Total Budget vs Actual FY 27' (Tall Right Column) */}
        <div className="glass-card" style={{ padding: '1.25rem', gridRow: 'span 2', display: 'flex', flexDirection: 'column', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-main)', margin: '0 0 1.25rem 0', textAlign: 'center' }}>
            Distributor Total Budget vs Actual FY 27'
          </h3>
          
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
          <h3 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-main)', margin: '0 0 1rem 0' }}>
            Primary Update of the Quarter wise
          </h3>
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
          <h3 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-main)', margin: '0 0 1rem 0' }}>
            RD Update of the Quarter wise
          </h3>
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
  );
};

export default DisDashboardFyPage;
