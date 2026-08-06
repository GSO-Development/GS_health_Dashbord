import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import MonthCalendarBar from '../components/common/MonthCalendarBar';
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

const CircularGauge = ({ percentage, variance, size = 130, activeColor = '#10b981' }) => {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference;

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
      <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
          VARIANCE
        </div>
        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: activeColor }}>
          {variance}
        </div>
      </div>
    </div>
  );
};

const DashboardFyPage = () => {
  const [selectedMonth, setSelectedMonth] = useState('july');
  const [selectedDate, setSelectedDate] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = { month: selectedMonth };
      if (selectedDate) params.date = selectedDate;

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
  }, [selectedMonth, selectedDate]);

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
      
      {/* ─── Header ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
          Dashboard FY 2026/27 Overview ({data?.month_label || 'July 2026'})
        </h2>
        <button onClick={loadData} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 0.9rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
          <RefreshCw style={{ width: '15px', height: '15px' }} /> Refresh
        </button>
      </div>

      {/* ─── Interactive Month & Calendar Date Bar ─── */}
      <MonthCalendarBar
        selectedMonth={selectedMonth}
        onSelectMonth={setSelectedMonth}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      {/* ─── 3-Column Grid Layout ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', alignItems: 'stretch' }}>
        
        {/* Card 1: TOTAL BUDGET vs ACTUAL */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gridColumn: 'span 1', gridRow: 'span 1', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '0.825rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', margin: '0 0 1.25rem 0', color: 'var(--text-main)' }}>
            TOTAL BUDGET vs ACTUAL – CURRENT MONTH
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.85rem', flex: 1 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
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
              <CircularGauge percentage={tb.pct} variance={toMn(tb.variance)} size={130} activeColor="#10b981" />
            </div>
          </div>
        </div>

        {/* Card 2: DIRECT BUDGET vs ACTUAL */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gridColumn: 'span 1', gridRow: 'span 1', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '0.825rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', margin: '0 0 1.25rem 0', color: 'var(--text-main)' }}>
            DIRECT BUDGET vs ACTUAL – CURRENT MONTH
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.85rem', flex: 1 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
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
              <CircularGauge percentage={db.pct} variance={toMn(db.variance)} size={130} activeColor="#10b981" />
            </div>
          </div>
        </div>

        {/* Card 5: ANNUAL BUDGET vs ACTUAL */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gridColumn: 'span 1', gridRow: 'span 2', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '0.825rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', margin: '0 0 1.25rem 0', color: 'var(--text-main)', textAlign: 'center' }}>
            ANNUAL BUDGET vs ACTUAL
          </h3>
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
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gridColumn: 'span 1', gridRow: 'span 1', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '0.825rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', margin: '0 0 1.25rem 0', color: 'var(--text-main)' }}>
            DIS : PRI BUDGET vs ACTUAL – CURRENT MONTH
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.85rem', flex: 1 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
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
              <CircularGauge percentage={dp.pct} variance={toMn(dp.variance)} size={130} activeColor="#10b981" />
            </div>
          </div>
        </div>

        {/* Card 4: DIS : RD BUDGET vs ACTUAL */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gridColumn: 'span 1', gridRow: 'span 1', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '0.825rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', margin: '0 0 1.25rem 0', color: 'var(--text-main)' }}>
            DIS : RD BUDGET vs ACTUAL – CURRENT MONTH
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.85rem', flex: 1 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
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
              <CircularGauge percentage={dr.pct} variance={toMn(dr.variance)} size={130} activeColor="#f59e0b" />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default DashboardFyPage;
