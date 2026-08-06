import React, { useState, useEffect } from 'react';
import { fetchTotalBudget } from '../services/api';
import KpiCard from '../components/KpiCard';
import { Search, DollarSign, Package, Layers, ChevronLeft, ChevronRight, AlertCircle, Calendar } from 'lucide-react';
import { ExcelColHeader, ExcelRowNum, ExcelRowHeader } from '../components/ExcelTableHeader';

const MONTH_OPTIONS = [
  { key: 'april', label: 'April 2026' },
  { key: 'may', label: 'May 2026' },
  { key: 'june', label: 'June 2026' },
  { key: 'july', label: 'July 2026' },
  { key: 'august', label: 'August 2026' },
  { key: 'september', label: 'September 2026' },
  { key: 'october', label: 'October 2026' },
  { key: 'november', label: 'November 2026' },
  { key: 'december', label: 'December 2026' },
  { key: 'january', label: 'January 2027' },
  { key: 'february', label: 'February 2027' },
  { key: 'march', label: 'March 2027' },
];

const TotalBudgetPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [activeMonth, setActiveMonth] = useState('august');

  const loadData = async () => {
    setLoading(true);
    setError(false);
    const result = await fetchTotalBudget(page, limit, search, activeMonth);
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
  }, [page, limit, search, activeMonth]);

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '0.00';
    return Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  const activeMonthLabel = MONTH_OPTIONS.find(m => m.key === activeMonth)?.label || 'August 2026';

  return (
    <div className="page-view animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Title Header & Month Filter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Total Budget Report (FY 2026-27)
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
            Working Month Budget targets sourced from <code style={{ background: 'var(--bg-hover)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>Budget 2026-27.xlsx &rarr; Total Budget</code> (649 Records)
          </p>
        </div>

        {/* Working Month Selector Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <Calendar style={{ width: '18px', height: '18px', color: 'var(--gsh-red)' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Working Month:</span>
          <select
            value={activeMonth}
            onChange={(e) => { setActiveMonth(e.target.value); setPage(1); }}
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
            {MONTH_OPTIONS.map(m => (
              <option key={m.key} value={m.key}>{m.label}</option>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <KpiCard 
          title="Total Budget Value"
          value={data ? `LKR ${formatCurrency(data.working_month_total)}` : (error ? 'Offline' : 'Loading...')}
          subtext={`Working Month (${activeMonthLabel}) Target`}
          icon={DollarSign}
          accentColor="var(--gsh-red)"
        />
        <KpiCard 
          title="Full Year Budget Target"
          value={data ? `LKR ${formatCurrency(data.grand_total)}` : (error ? 'Offline' : 'Loading...')}
          subtext="Full Year (12 Months) Grand Total"
          icon={Package}
          accentColor="var(--gsh-gold)"
        />
        <KpiCard 
          title="Cost Centers"
          value="ARRA1"
          subtext="Active Cost Center"
          icon={Layers}
          accentColor="var(--gsh-teal)"
        />
      </div>

      {/* Filter & Search Controls */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', minWidth: '280px', flex: 1 }}>
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
            placeholder="Search Cost Center, Sales Group, Part No, Product SKU..." 
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
      </div>

      {/* Main Datatable */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', maxHeight: '600px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <ExcelRowHeader />
                <ExcelColHeader col="C" label="Cost Center" />
                <ExcelColHeader col="D" label="Sales Group" />
                <ExcelColHeader col="E" label="Range" />
                <ExcelColHeader col="F" label="Part No" />
                <ExcelColHeader col="G" label="Product (SKU)" minWidth="220px" />
                <ExcelColHeader col="H" label="Pack" />
                <ExcelColHeader col="I" label="April" align="right" style={{ background: activeMonth === 'april' ? 'rgba(200,16,46,0.08)' : undefined }} />
                <ExcelColHeader col="J" label="May" align="right" style={{ background: activeMonth === 'may' ? 'rgba(200,16,46,0.08)' : undefined }} />
                <ExcelColHeader col="K" label="June" align="right" style={{ background: activeMonth === 'june' ? 'rgba(200,16,46,0.08)' : undefined }} />
                <ExcelColHeader col="L" label="July" align="right" style={{ background: activeMonth === 'july' ? 'rgba(200,16,46,0.08)' : undefined }} />
                <ExcelColHeader col="M" label="August" align="right" style={{ background: activeMonth === 'august' ? 'rgba(200,16,46,0.08)' : undefined }} />
                <ExcelColHeader col="N" label="September" align="right" style={{ background: activeMonth === 'september' ? 'rgba(200,16,46,0.08)' : undefined }} />
                <ExcelColHeader col="O" label="October" align="right" style={{ background: activeMonth === 'october' ? 'rgba(200,16,46,0.08)' : undefined }} />
                <ExcelColHeader col="P" label="November" align="right" style={{ background: activeMonth === 'november' ? 'rgba(200,16,46,0.08)' : undefined }} />
                <ExcelColHeader col="Q" label="December" align="right" style={{ background: activeMonth === 'december' ? 'rgba(200,16,46,0.08)' : undefined }} />
                <ExcelColHeader col="R" label="January" align="right" style={{ background: activeMonth === 'january' ? 'rgba(200,16,46,0.08)' : undefined }} />
                <ExcelColHeader col="S" label="February" align="right" style={{ background: activeMonth === 'february' ? 'rgba(200,16,46,0.08)' : undefined }} />
                <ExcelColHeader col="T" label="March" align="right" style={{ background: activeMonth === 'march' ? 'rgba(200,16,46,0.08)' : undefined }} />
                <ExcelColHeader col="U" label="Total" align="right" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="20" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading Total Budget records...
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
                    <td style={{ padding: '0.65rem 1rem', fontWeight: 600 }}>{row.cost_center || '-'}</td>
                    <td style={{ padding: '0.65rem 1rem' }}>{row.sales_group || '-'}</td>
                    <td style={{ padding: '0.65rem 1rem' }}>{row.range_name || '-'}</td>
                    <td style={{ padding: '0.65rem 1rem', fontFamily: 'monospace' }}>{row.part_no || '-'}</td>
                    <td style={{ padding: '0.65rem 1rem', fontWeight: 600, color: 'var(--text-main)' }}>{row.product_sku || '-'}</td>
                    <td style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)' }}>{row.pack || '-'}</td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', background: activeMonth === 'april' ? 'rgba(200, 16, 46, 0.04)' : 'transparent' }}>{formatCurrency(row.april)}</td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', background: activeMonth === 'may' ? 'rgba(200, 16, 46, 0.04)' : 'transparent' }}>{formatCurrency(row.may)}</td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', background: activeMonth === 'june' ? 'rgba(200, 16, 46, 0.04)' : 'transparent' }}>{formatCurrency(row.june)}</td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', background: activeMonth === 'july' ? 'rgba(200, 16, 46, 0.04)' : 'transparent' }}>{formatCurrency(row.july)}</td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', background: activeMonth === 'august' ? 'rgba(200, 16, 46, 0.04)' : 'transparent', fontWeight: activeMonth === 'august' ? 700 : 400 }}>{formatCurrency(row.august)}</td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', background: activeMonth === 'september' ? 'rgba(200, 16, 46, 0.04)' : 'transparent' }}>{formatCurrency(row.september)}</td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', background: activeMonth === 'october' ? 'rgba(200, 16, 46, 0.04)' : 'transparent' }}>{formatCurrency(row.october)}</td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', background: activeMonth === 'november' ? 'rgba(200, 16, 46, 0.04)' : 'transparent' }}>{formatCurrency(row.november)}</td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', background: activeMonth === 'december' ? 'rgba(200, 16, 46, 0.04)' : 'transparent' }}>{formatCurrency(row.december)}</td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', background: activeMonth === 'january' ? 'rgba(200, 16, 46, 0.04)' : 'transparent' }}>{formatCurrency(row.january)}</td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', background: activeMonth === 'february' ? 'rgba(200, 16, 46, 0.04)' : 'transparent' }}>{formatCurrency(row.february)}</td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', background: activeMonth === 'march' ? 'rgba(200, 16, 46, 0.04)' : 'transparent' }}>{formatCurrency(row.march)}</td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--gsh-red)', background: 'rgba(200, 16, 46, 0.04)' }}>
                      {formatCurrency(row.total)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="20" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {error ? 'Backend API offline. Please start backend with: python main.py' : 'No budget records matching search criteria.'}
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

export default TotalBudgetPage;
