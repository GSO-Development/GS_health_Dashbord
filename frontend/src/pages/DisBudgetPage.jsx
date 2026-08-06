import React, { useState, useEffect } from 'react';
import { fetchDisBudget } from '../services/api';
import KpiCard from '../components/KpiCard';
import { Search, Target, Award, Filter, ChevronLeft, ChevronRight, AlertCircle, Calendar } from 'lucide-react';
import { ExcelColHeader, ExcelRowNum, ExcelRowHeader } from '../components/ExcelTableHeader';

const DIS_MONTH_OPTIONS = [
  { num: 4, label: 'April 2026' },
  { num: 5, label: 'May 2026' },
  { num: 6, label: 'June 2026' },
  { num: 7, label: 'July 2026' },
  { num: 8, label: 'August 2026' },
  { num: 9, label: 'September 2026' },
  { num: 10, label: 'October 2026' },
  { num: 11, label: 'November 2026' },
  { num: 12, label: 'December 2026' },
  { num: 1, label: 'January 2027' },
  { num: 2, label: 'February 2027' },
  { num: 3, label: 'March 2027' },
];

const DisBudgetPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [qtr, setQtr] = useState('');
  const [monthNum, setMonthNum] = useState(8); // Default August

  const loadData = async () => {
    setLoading(true);
    setError(false);
    const result = await fetchDisBudget(page, limit, search, '', qtr, monthNum);
    if (!result) {
      setError(true);
      setData(null);
    } else {
      setData(result);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [page, limit, search, qtr, monthNum]);

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '0.00';
    return Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  const activeMonthLabel = DIS_MONTH_OPTIONS.find(m => m.num === Number(monthNum))?.label || 'August 2026';

  return (
    <div className="page-view animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Title Header & Month Selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Distributor Budget Report (Dis Budget)
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
            Working Month Distributor Targets vs Actuals sourced from <code style={{ background: 'var(--bg-hover)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>Budget 2026-27.xlsx &rarr; Dis Budget</code> (9,644 Records)
          </p>
        </div>

        {/* Working Month Selector Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <Calendar style={{ width: '18px', height: '18px', color: '#3b82f6' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Working Month:</span>
          <select
            value={monthNum}
            onChange={(e) => { setMonthNum(Number(e.target.value)); setPage(1); }}
            style={{
              padding: '0.35rem 0.65rem',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              fontWeight: 700,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {DIS_MONTH_OPTIONS.map(m => (
              <option key={m.num} value={m.num}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Backend Connection Error Alert */}
      {error && (
        <div style={{
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(200, 16, 46, 0.08)',
          border: '1px solid rgba(200, 16, 46, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          color: 'var(--gsh-red)'
        }}>
          <AlertCircle style={{ width: '22px', height: '22px', flexShrink: 0 }} />
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>Backend Connection Failed</p>
            <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Cannot reach FastAPI server at <code style={{ background: 'rgba(255,255,255,0.7)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>http://localhost:8000</code>. Please run <code style={{ background: 'rgba(255,255,255,0.7)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>python main.py</code> inside your <code style={{ background: 'rgba(255,255,255,0.7)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>backend</code> directory.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <KpiCard 
          title="Primary Target"
          value={data && data.working_month_summary ? `LKR ${formatCurrency(data.working_month_summary.primary_target)}` : (error ? 'Offline' : 'Loading...')}
          subtext={`Working Month (${activeMonthLabel}) Target`}
          icon={Target}
          accentColor="#3b82f6"
        />
        <KpiCard 
          title="Primary Actual"
          value={data && data.working_month_summary ? `LKR ${formatCurrency(data.working_month_summary.primary_actual)}` : (error ? 'Offline' : 'Loading...')}
          subtext={`Working Month (${activeMonthLabel}) Sales`}
          icon={Award}
          accentColor="var(--gsh-teal)"
        />
        <KpiCard 
          title="RD Target"
          value={data && data.working_month_summary ? `LKR ${formatCurrency(data.working_month_summary.rd_target)}` : (error ? 'Offline' : 'Loading...')}
          subtext={`Working Month (${activeMonthLabel}) Target`}
          icon={Target}
          accentColor="var(--gsh-gold)"
        />
        <KpiCard 
          title="RD Actual"
          value={data && data.working_month_summary ? `LKR ${formatCurrency(data.working_month_summary.rd_actual)}` : (error ? 'Offline' : 'Loading...')}
          subtext={`Working Month (${activeMonthLabel}) Actual`}
          icon={Award}
          accentColor="var(--gsh-red)"
        />
      </div>

      {/* Controls & Filters */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '300px' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1 }}>
            <Search style={{
              position: 'absolute',
              left: '0.875rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '18px',
              height: '18px',
              color: 'var(--text-subtle)'
            }} />
            <input 
              type="text" 
              placeholder="Search Product ID, Product Name, Division..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                padding: '0.55rem 1rem 0.55rem 2.5rem',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-main)',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Quarterly Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter style={{ width: '16px', height: '16px', color: 'var(--text-muted)' }} />
            <select
              value={qtr}
              onChange={(e) => { setQtr(e.target.value); setPage(1); }}
              style={{
                padding: '0.55rem 0.85rem',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">All Quarters</option>
              <option value="1st QTR">1st QTR</option>
              <option value="2nd QTR">2nd QTR</option>
              <option value="3rd QTR">3rd QTR</option>
              <option value="4th QTR">4th QTR</option>
            </select>
          </div>
        </div>
      </div>

      {/* Datatable */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', maxHeight: '600px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <ExcelRowHeader />
                <ExcelColHeader col="B" label="Month" />
                <ExcelColHeader col="C" label="Product ID" />
                <ExcelColHeader col="D" label="Product" minWidth="220px" />
                <ExcelColHeader col="E" label="Division Name" />
                <ExcelColHeader col="F" label="Primary Target" align="right" />
                <ExcelColHeader col="G" label="Primary Actual" align="right" />
                <ExcelColHeader col="H" label="RD Target" align="right" />
                <ExcelColHeader col="I" label="RD Actual" align="right" />
                <ExcelColHeader col="J" label="Pri-%" align="right" />
                <ExcelColHeader col="K" label="RD-%" align="right" />
                <ExcelColHeader col="L" label="QTR" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading Dis Budget records...
                  </td>
                </tr>
              ) : data && data.rows && data.rows.length > 0 ? (
                data.rows.map((row, idx) => (
                  <tr 
                    key={row.id || idx}
                    style={{ borderBottom: '1px solid var(--border-color)', transition: 'background var(--transition-fast)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <ExcelRowNum num={(page - 1) * limit + idx + 1} />
                    <td style={{ padding: '0.65rem 1rem', color: 'var(--text-subtle)', whiteSpace: 'nowrap' }}>
                      {row.month ? row.month.split(' ')[0] : '-'}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', fontFamily: 'monospace', fontWeight: 600 }}>{row.product_id || '-'}</td>
                    <td style={{ padding: '0.65rem 1rem', fontWeight: 600, color: 'var(--text-main)' }}>{row.product || '-'}</td>
                    <td style={{ padding: '0.65rem 1rem' }}>{row.division_name || '-'}</td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right' }}>{formatCurrency(row.primary_target)}</td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right' }}>{formatCurrency(row.primary_actual)}</td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right' }}>{formatCurrency(row.rd_target)}</td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right' }}>{formatCurrency(row.rd_actual)}</td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', color: row.pri_pct >= 100 ? 'var(--gsh-teal)' : 'var(--text-muted)' }}>
                      {row.pri_pct}%
                    </td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', color: row.rd_pct >= 100 ? 'var(--gsh-teal)' : 'var(--text-muted)' }}>
                      {row.rd_pct}%
                    </td>
                    <td style={{ padding: '0.65rem 1rem' }}>
                      <span className="badge badge-info">{row.qtr || '-'}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {error ? 'Backend API offline. Please start backend with: python main.py' : 'No distributor budget records matching search criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Bottom Navigation Bar */}
        <div style={{
          padding: '0.85rem 1.25rem',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          {/* Left Side: Quick Row Count Selector Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginRight: '0.25rem' }}>
              Rows per page:
            </span>
            {[10, 50, 100, 200].map((count) => (
              <button
                key={count}
                onClick={() => handleLimitChange(count)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  fontWeight: limit === count ? 700 : 500,
                  cursor: 'pointer',
                  border: limit === count ? '1px solid var(--gsh-red)' : '1px solid var(--border-color)',
                  background: limit === count ? 'var(--gsh-red)' : 'var(--bg-primary)',
                  color: limit === count ? '#ffffff' : 'var(--text-main)',
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                {count}
              </button>
            ))}
          </div>

          {/* Right Side: Page Indicator & Prev/Next Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {data && (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Page <strong>{data.page}</strong> of <strong>{data.total_pages}</strong> ({data.total_count.toLocaleString()} total records)
              </span>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button 
                disabled={page <= 1 || loading || error}
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}
              >
                <ChevronLeft style={{ width: '16px', height: '16px' }} /> Prev
              </button>
              <button 
                disabled={!data || page >= data.total_pages || loading || error}
                onClick={() => setPage(prev => prev + 1)}
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}
              >
                Next <ChevronRight style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisBudgetPage;
