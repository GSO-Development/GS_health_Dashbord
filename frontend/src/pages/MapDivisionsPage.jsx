import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { 
  Network, Search, Eye, 
  CheckCircle, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Hash, Layers, Tag, CheckSquare, Package, Database
} from 'lucide-react';
import api from '../services/api';

const FISCAL_YEARS = [
  'FY 2026/27',
  'FY 2027/28',
  'FY 2025/26'
];

const MapDivisionsPage = () => {
  const [mappings, setMappings] = useState([]);
  const [stats, setStats] = useState({ total_sales_groups: 0, total_ranges: 0, mapped_count: 0, unmapped_count: 0, unmapped_list: [] });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('FY 2026/27');
  const [toast, setToast] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // View Modal State ('sales_group' | 'range')
  const [viewModalType, setViewModalType] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadMappings = async () => {
    setLoading(true);
    try {
      const [resMap, resStats] = await Promise.all([
        api.get('/division-mappings', { params: { search: searchTerm, year: selectedYear } }),
        api.get('/division-mappings/stats')
      ]);

      if (resMap.data && resMap.data.data) {
        setMappings(resMap.data.data);
      }
      if (resStats.data) {
        setStats(resStats.data);
      }
    } catch {
      showToast('Failed to load division mappings.', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMappings();
  }, [selectedYear]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleAutoSync = async () => {
    try {
      showToast('Syncing mappings from total_budget database table...', 'info');
      const res = await api.post('/division-mappings/sync-from-budget');
      if (res.data) {
        showToast(res.data.message || '✅ Mappings auto-synced successfully!');
        loadMappings();
      }
    } catch {
      showToast('Failed to auto-sync mappings from budget.', 'error');
    }
  };

  // Derived Analytics & Unique Lists
  const uniqueSalesGroups = useMemo(() => {
    const set = new Set();
    mappings.forEach(m => {
      if (m.sales_group) set.add(m.sales_group.trim());
    });
    return Array.from(set).sort();
  }, [mappings]);

  const uniqueRanges = useMemo(() => {
    const set = new Set();
    mappings.forEach(m => {
      if (m.range_name) set.add(m.range_name.trim());
    });
    return Array.from(set).sort();
  }, [mappings]);

  // Filtered table rows
  const filteredMappings = mappings.filter(m => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (m.sales_group && m.sales_group.toLowerCase().includes(term)) ||
      (m.range_name && m.range_name.toLowerCase().includes(term)) ||
      (m.part_no && m.part_no.toLowerCase().includes(term)) ||
      (m.product_sku && m.product_sku.toLowerCase().includes(term)) ||
      (m.id && String(m.id).includes(term))
    );
  });

  const totalPages = Math.ceil(filteredMappings.length / pageSize) || 1;
  const paginatedMappings = filteredMappings.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="page-view animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Toast Notification */}
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 999999, padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-sm)', background: toast.type === 'success' ? '#10b981' : (toast.type === 'info' ? 'var(--gsh-teal)' : '#ef4444'), color: '#fff', fontWeight: 700, fontSize: '0.85rem', boxShadow: '0 8px 24px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {toast.type === 'success' ? <CheckCircle style={{ width: '18px', height: '18px' }} /> : <AlertCircle style={{ width: '18px', height: '18px' }} />}
          {toast.msg}
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Network style={{ width: '24px', height: '24px', color: 'var(--gsh-red)' }} />
            Map Divisions — Sales Group, Part No. & Product (SKU) Master
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
            Authoritative master view of Sales Groups, Target Ranges, Part No., and SKUs automatically derived from the Annual Budget.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={handleAutoSync} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.1rem', background: 'var(--accent-gradient)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(200,16,46,0.25)' }}>
            <Database style={{ width: '16px', height: '16px' }} /> Auto-Sync from Budget
          </button>

          <button onClick={loadMappings} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
            <RefreshCw style={{ width: '15px', height: '15px' }} /> Refresh
          </button>
        </div>
      </div>

      {/* ─── TOP 4 KPI CARDS ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
        
        {/* CARD 1: Total Sales Group */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '4px solid var(--gsh-red)', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-xs)', background: 'rgba(200, 16, 46, 0.1)', color: 'var(--gsh-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers style={{ width: '22px', height: '22px' }} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-subtle)' }}>
                  TOTAL SALES GROUP
                </span>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unique Sales Groups</p>
              </div>
            </div>

            <button
              onClick={() => { setViewModalType('sales_group'); }}
              title="View All Sales Groups"
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.75rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
            >
              <Eye style={{ width: '14px', height: '14px', color: 'var(--gsh-red)' }} /> View All
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {stats.total_sales_groups || uniqueSalesGroups.length} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Groups</span>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gsh-red)', background: 'rgba(200, 16, 46, 0.08)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
              Total Budget Synced
            </span>
          </div>
        </div>

        {/* CARD 2: Total Range */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '4px solid var(--gsh-teal)', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-xs)', background: 'rgba(0, 168, 150, 0.1)', color: 'var(--gsh-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Tag style={{ width: '22px', height: '22px' }} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-subtle)' }}>
                  TOTAL RANGE
                </span>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Range categories</p>
              </div>
            </div>

            <button
              onClick={() => { setViewModalType('range'); }}
              title="View All Ranges"
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.75rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
            >
              <Eye style={{ width: '14px', height: '14px', color: 'var(--gsh-teal)' }} /> View All
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {stats.total_ranges || uniqueRanges.length} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Ranges</span>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gsh-teal)', background: 'rgba(0, 168, 150, 0.08)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
              Target Master
            </span>
          </div>
        </div>

        {/* CARD 3: Mapped Count */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '4px solid #10b981', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-xs)', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckSquare style={{ width: '22px', height: '22px' }} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-subtle)' }}>
                  MAPPED COUNT
                </span>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>total_budget Sales Groups mapped</p>
              </div>
            </div>

            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
              ✅ 100% Active
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>
              {stats.mapped_count} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Mapped</span>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)' }}>
              From total_budget
            </span>
          </div>
        </div>

        {/* CARD 4: Total Items Count */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '4px solid #3b82f6', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-xs)', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package style={{ width: '22px', height: '22px' }} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-subtle)' }}>
                  TOTAL ITEMS COUNT
                </span>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mapped Product SKUs / Items</p>
              </div>
            </div>

            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#3b82f6', background: 'rgba(59, 130, 246, 0.12)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
              📦 Active SKUs
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {(stats.total_items || mappings.length).toLocaleString('en-US')} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Items</span>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)' }}>
              From total_budget items
            </span>
          </div>
        </div>

      </div>

      {/* Search Bar, Year Filter Selector & Info Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Search Bar */}
          <div style={{ position: 'relative', width: '320px' }}>
            <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--text-subtle)' }} />
            <input
              type="text"
              placeholder="Search Sales Group, Range, Part No, SKU..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem 0.55rem 2.4rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.85rem', outline: 'none' }}
            />
          </div>

          {/* Year Filter Selector Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-card)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)' }}>Target Year:</label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              style={{ padding: '0.35rem 0.5rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', background: 'var(--bg-hover)', color: 'var(--text-main)', fontSize: '0.825rem', fontWeight: 800, outline: 'none', cursor: 'pointer' }}
            >
              {FISCAL_YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
            <Hash style={{ width: '15px', height: '15px', color: 'var(--gsh-red)' }} />
            Total Rows: <strong style={{ color: 'var(--gsh-red)', fontSize: '0.9rem' }}>{filteredMappings.length}</strong>
          </div>
          <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            Showing <strong>{paginatedMappings.length}</strong> of <strong>{filteredMappings.length}</strong> items (Page {currentPage} of {totalPages})
          </div>
        </div>
      </div>

      {/* Main Division Mappings Datatable (Clean Master View) */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 330px)', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-hover)', borderBottom: '2px solid var(--border-color)' }}>
              <tr style={{ color: 'var(--text-main)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                <th style={{ padding: '0.75rem 1rem', width: '80px' }}>ID</th>
                <th style={{ padding: '0.75rem 1rem' }}>Sales Group</th>
                <th style={{ padding: '0.75rem 1rem' }}>Range</th>
                <th style={{ padding: '0.75rem 1rem', color: 'var(--gsh-red)' }}>Part No.</th>
                <th style={{ padding: '0.75rem 1rem', color: 'var(--gsh-teal)' }}>Product (SKU)</th>
                <th style={{ padding: '0.75rem 1rem', width: '180px' }}>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading division mappings & budget master records...
                  </td>
                </tr>
              ) : paginatedMappings.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No mapping records matching "{searchTerm}".
                  </td>
                </tr>
              ) : (
                paginatedMappings.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.65rem 1rem', fontWeight: 800, color: 'var(--gsh-red)', fontFamily: 'monospace' }}>
                      #{row.id}
                    </td>

                    {/* Sales Group */}
                    <td style={{ padding: '0.65rem 1rem' }}>
                      <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{row.sales_group}</span>
                    </td>

                    {/* Range Name */}
                    <td style={{ padding: '0.65rem 1rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--gsh-teal)', background: 'rgba(0,168,150,0.08)', padding: '0.25rem 0.6rem', borderRadius: '4px' }}>
                        {row.range_name}
                      </span>
                    </td>

                    {/* Part No. (from total_budget) */}
                    <td style={{ padding: '0.65rem 1rem', fontFamily: 'monospace', fontWeight: 800, color: 'var(--gsh-red)' }}>
                      {row.part_no || '-'}
                    </td>

                    {/* Product (SKU) (from total_budget) */}
                    <td style={{ padding: '0.65rem 1rem', fontWeight: 600, color: 'var(--text-main)', maxWidth: '350px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {row.product_sku || '-'}
                    </td>

                    {/* Last Updated */}
                    <td style={{ padding: '0.65rem 1rem', color: 'var(--text-subtle)', fontSize: '0.8rem' }}>
                      {row.updated_at || 'Auto System'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', padding: '0.75rem 1rem', background: 'var(--bg-hover)', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              Rows per page:
            </span>
            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
              {[25, 50, 80, 100, 150].map((size) => {
                const isActive = pageSize === size;
                return (
                  <button
                    key={size}
                    onClick={() => {
                      setPageSize(size);
                      setCurrentPage(1);
                    }}
                    style={{
                      padding: '0.3rem 0.65rem',
                      background: isActive ? 'var(--gsh-red)' : 'var(--bg-card)',
                      border: isActive ? 'none' : '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-xs)',
                      color: isActive ? '#fff' : 'var(--text-main)',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      boxShadow: isActive ? '0 2px 8px rgba(200,16,46,0.3)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginLeft: '0.5rem' }}>
              (Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> — Total {filteredMappings.length} rows)
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              style={{ padding: '0.35rem 0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.8rem', fontWeight: 700, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '0.2rem' }}
            >
              <ChevronLeft style={{ width: '14px', height: '14px' }} /> Prev
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              style={{ padding: '0.35rem 0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.8rem', fontWeight: 700, cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', opacity: currentPage >= totalPages ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '0.2rem' }}
            >
              Next <ChevronRight style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── MODAL: VIEW ALL (Sales Groups or Ranges) ─── */}
      {viewModalType && ReactDOM.createPortal(
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setViewModalType(null); }}
          style={{ 
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
            zIndex: 999999, background: 'rgba(0, 0, 0, 0.7)', 
            backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', padding: '1rem', boxSizing: 'border-box'
          }}
        >
          <div 
            style={{ 
              width: '100%', maxWidth: '560px', maxHeight: '85vh', display: 'flex', flexDirection: 'column',
              background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-md)', padding: '1.5rem', boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Eye style={{ width: '20px', height: '20px', color: viewModalType === 'sales_group' ? 'var(--gsh-red)' : 'var(--gsh-teal)' }} />
                All {viewModalType === 'sales_group' ? 'Sales Groups' : 'Ranges'} ({viewModalType === 'sales_group' ? uniqueSalesGroups.length : uniqueRanges.length})
              </h3>
              <button type="button" onClick={() => setViewModalType(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-subtle)' }}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0.5rem 0', maxHeight: '50vh' }}>
              {(viewModalType === 'sales_group' ? uniqueSalesGroups : uniqueRanges).map((item, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    background: viewModalType === 'sales_group' ? 'rgba(200, 16, 46, 0.08)' : 'rgba(0, 168, 150, 0.08)',
                    color: viewModalType === 'sales_group' ? 'var(--gsh-red)' : 'var(--gsh-teal)',
                    border: `1px solid ${viewModalType === 'sales_group' ? 'rgba(200, 16, 46, 0.2)' : 'rgba(0, 168, 150, 0.2)'}`
                  }}
                >
                  {item}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', marginTop: '1rem' }}>
              <button type="button" onClick={() => setViewModalType(null)} style={{ padding: '0.5rem 1.2rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default MapDivisionsPage;
