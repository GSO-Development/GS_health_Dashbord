import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { 
  Network, Search, Eye, 
  CheckCircle, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Hash, Layers, Tag, CheckSquare, Package, Database, DatabaseZap,
  SlidersHorizontal, Check, Settings2, X, Building2
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
  const [availableContracts, setAvailableContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('FY 2026/27');
  const [toast, setToast] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // View Modal State ('sales_group' | 'range')
  const [viewModalType, setViewModalType] = useState(null);

  // Configure IFS Matching Modal State
  const [editMatchingRow, setEditMatchingRow] = useState(null);
  const [matchingForm, setMatchingForm] = useState({
    match_type: 'CATALOG_GROUP',
    contract_code: ''
  });
  const [savingMatching, setSavingMatching] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadMappings = async () => {
    setLoading(true);
    try {
      const [resMap, resStats, resContracts] = await Promise.all([
        api.get('/division-mappings', { params: { search: searchTerm, year: selectedYear } }),
        api.get('/division-mappings/stats'),
        api.get('/division-mappings/contracts')
      ]);

      if (resMap.data && resMap.data.data) {
        setMappings(resMap.data.data);
      }
      if (resStats.data) {
        setStats(resStats.data);
      }
      if (resContracts.data && resContracts.data.contracts) {
        setAvailableContracts(resContracts.data.contracts);
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

  const openMatchingModal = (row) => {
    setEditMatchingRow(row);
    setMatchingForm({
      match_type: row.match_type || 'CATALOG_GROUP',
      contract_code: row.contract_code || ''
    });
  };

  const handleSaveMatching = async () => {
    if (!editMatchingRow) return;
    setSavingMatching(true);
    try {
      const res = await api.put('/division-mappings/update-matching', {
        sales_group: editMatchingRow.sales_group,
        range_name: editMatchingRow.range_name,
        match_type: matchingForm.match_type,
        contract_code: matchingForm.match_type === 'CONTRACT' ? matchingForm.contract_code : null
      });

      if (res.data && res.data.status === 'success') {
        showToast(`✅ Updated IFS Matching for '${editMatchingRow.sales_group}'!`);
        setEditMatchingRow(null);
        loadMappings();
      } else {
        showToast('Failed to update IFS matching field.', 'error');
      }
    } catch {
      showToast('Error updating matching field.', 'error');
    }
    setSavingMatching(false);
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
      (m.contract_code && m.contract_code.toLowerCase().includes(term)) ||
      (m.match_type && m.match_type.toLowerCase().includes(term)) ||
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
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', background: 'linear-gradient(135deg, rgba(200, 16, 46, 0.15), rgba(0, 168, 150, 0.15))', color: 'var(--gsh-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
              <Network style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Division Mappings Master
                <span style={{ fontSize: '0.75rem', fontWeight: 800, background: 'rgba(0, 168, 150, 0.12)', color: 'var(--gsh-teal)', padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                  {selectedYear}
                </span>
              </h1>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                Master hierarchy mapping between <strong>total_budget Sales Groups</strong>, <strong>45 Parent Division Ranges</strong>, and <strong>IFS Oracle Match Rules</strong>.
              </p>
            </div>
          </div>

          {/* Action Button: Auto-Sync Master */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleAutoSync}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 0.9rem', fontSize: '0.82rem', fontWeight: 700 }}
              title="Sync all distinct Sales Groups and Range names directly from total_budget table"
            >
              <DatabaseZap style={{ width: '15px', height: '15px', color: 'var(--gsh-teal)' }} />
              Auto-Sync from Budget Master
            </button>
          </div>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        
        {/* CARD 1: Total Sales Groups */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '4px solid var(--gsh-red)', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-xs)', background: 'rgba(200, 16, 46, 0.1)', color: 'var(--gsh-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers style={{ width: '22px', height: '22px' }} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-subtle)' }}>
                  TOTAL SALES GROUPS
                </span>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unique Sales Groups</p>
              </div>
            </div>

            <button
              onClick={() => setViewModalType('sales_group')}
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
              Master Table
            </span>
          </div>
        </div>

        {/* CARD 2: Total Division Ranges */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '4px solid var(--gsh-teal)', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-xs)', background: 'rgba(0, 168, 150, 0.1)', color: 'var(--gsh-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Tag style={{ width: '22px', height: '22px' }} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-subtle)' }}>
                  DIVISION RANGES
                </span>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Official 45 GSH Divisions</p>
              </div>
            </div>

            <button
              onClick={() => setViewModalType('range')}
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
              placeholder="Search Sales Group, Range, Part No, Contract..."
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

      {/* Main Division Mappings Datatable (Clean Master View with Interactive IFS Matching Field) */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 330px)', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-hover)', borderBottom: '2px solid var(--border-color)' }}>
              <tr style={{ color: 'var(--text-main)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                <th style={{ padding: '0.75rem 1rem', width: '70px' }}>ID</th>
                <th style={{ padding: '0.75rem 1rem' }}>Sales Group</th>
                <th style={{ padding: '0.75rem 1rem' }}>Range</th>
                <th style={{ padding: '0.75rem 1rem', color: 'var(--gsh-red)' }}>Part No.</th>
                <th style={{ padding: '0.75rem 1rem', color: 'var(--gsh-teal)' }}>Product (SKU)</th>
                <th style={{ padding: '0.75rem 1rem', color: '#3b82f6', minWidth: '220px' }}>IFS Matching Field & Rule</th>
                <th style={{ padding: '0.75rem 1rem', width: '160px' }}>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading division mappings & budget master records...
                  </td>
                </tr>
              ) : paginatedMappings.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
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
                    <td style={{ padding: '0.65rem 1rem', fontWeight: 600, color: 'var(--text-main)', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.product_sku}>
                      {row.product_sku || '-'}
                    </td>

                    {/* INTERACTIVE COLUMN: IFS Matching Field (Shows & Configures Oracle IFS source rule) */}
                    <td style={{ padding: '0.65rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                        {row.match_type === 'CONTRACT' ? (
                          <span 
                            title={`Matching all IFS Invoices and Backlog where Contract = ${row.contract_code || 'All'}`}
                            style={{ padding: '0.25rem 0.6rem', background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 800, fontSize: '0.78rem', border: '1px solid rgba(139, 92, 246, 0.3)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            <Building2 style={{ width: '12px', height: '12px' }} />
                            CONTRACT: {row.contract_code || 'ALL'}
                          </span>
                        ) : row.match_type === 'CATALOG_NO' ? (
                          <span 
                            title="Direct SKU matching via CATALOG_NO"
                            style={{ padding: '0.25rem 0.55rem', background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 800, fontSize: '0.75rem', border: '1px solid rgba(245, 158, 11, 0.3)' }}
                          >
                            CATALOG_NO ({row.part_no || 'SKU'})
                          </span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span 
                              title="Oracle Invoices & Backlog match by CATALOG_GROUP"
                              style={{ padding: '0.2rem 0.5rem', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 800, fontSize: '0.75rem', border: '1px solid rgba(59,130,246,0.25)' }}
                            >
                              CATALOG_GROUP
                            </span>
                            {row.part_no && (
                              <span 
                                title="Direct SKU matching via CATALOG_NO"
                                style={{ padding: '0.2rem 0.45rem', background: 'rgba(200,16,46,0.08)', color: 'var(--gsh-red)', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.72rem', border: '1px solid rgba(200,16,46,0.2)' }}
                              >
                                CATALOG_NO
                              </span>
                            )}
                          </div>
                        )}

                        {/* Configure/Edit Button */}
                        <button
                          onClick={() => openMatchingModal(row)}
                          title="Configure IFS Matching Field & Rule"
                          style={{
                            padding: '0.2rem 0.45rem',
                            background: 'var(--bg-hover)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.color = 'var(--text-main)';
                            e.currentTarget.style.borderColor = 'var(--gsh-teal)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.color = 'var(--text-muted)';
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                          }}
                        >
                          <SlidersHorizontal style={{ width: '12px', height: '12px' }} />
                          Edit
                        </button>
                      </div>
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

      {/* ─── MODAL: CONFIGURE IFS MATCHING FIELD & CONTRACT ─── */}
      {editMatchingRow && ReactDOM.createPortal(
        <div 
          onClick={(e) => { if (e.target === e.currentTarget && !savingMatching) setEditMatchingRow(null); }}
          style={{ 
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
            zIndex: 999999, background: 'rgba(0, 0, 0, 0.75)', 
            backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', padding: '1rem', boxSizing: 'border-box'
          }}
        >
          <div 
            style={{ 
              width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column',
              background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-md)', padding: '1.5rem', boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
              gap: '1.25rem'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-xs)', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SlidersHorizontal style={{ width: '18px', height: '18px' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Configure IFS Matching Field
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Set matching source for <strong>{editMatchingRow.sales_group}</strong> → <strong>{editMatchingRow.range_name}</strong>
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => !savingMatching && setEditMatchingRow(null)} 
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-subtle)' }}
              >
                ✕
              </button>
            </div>

            {/* Target Information Card */}
            <div style={{ background: 'var(--bg-hover)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>Sales Group:</span>
                <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>{editMatchingRow.sales_group}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>Target Range:</span>
                <div style={{ fontWeight: 800, color: 'var(--gsh-teal)' }}>{editMatchingRow.range_name}</div>
              </div>
              {editMatchingRow.part_no && (
                <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border-color)', paddingTop: '0.4rem', marginTop: '0.2rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>Part No / SKU: </span>
                  <strong style={{ color: 'var(--gsh-red)' }}>{editMatchingRow.part_no}</strong> — {editMatchingRow.product_sku}
                </div>
              )}
            </div>

            {/* Select Matching Mode */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Select IFS Matching Method:
              </label>

              {/* Option 1: CATALOG_GROUP (Default) */}
              <label 
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem',
                  borderRadius: 'var(--radius-xs)', border: matchingForm.match_type === 'CATALOG_GROUP' ? '2px solid #3b82f6' : '1px solid var(--border-color)',
                  background: matchingForm.match_type === 'CATALOG_GROUP' ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-card)',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="radio"
                  name="match_type"
                  value="CATALOG_GROUP"
                  checked={matchingForm.match_type === 'CATALOG_GROUP'}
                  onChange={() => setMatchingForm(p => ({ ...p, match_type: 'CATALOG_GROUP' }))}
                  style={{ marginTop: '0.2rem', accentColor: '#3b82f6' }}
                />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#3b82f6' }}>
                    CATALOG_GROUP (Standard Sales Group Matching)
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    Matches invoices & backlog based on IFS Column T/R (<code>CATALOG_GROUP = '{editMatchingRow.sales_group}'</code>).
                  </div>
                </div>
              </label>

              {/* Option 2: CONTRACT (Contract Wide Matching) */}
              <label 
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem',
                  borderRadius: 'var(--radius-xs)', border: matchingForm.match_type === 'CONTRACT' ? '2px solid #8b5cf6' : '1px solid var(--border-color)',
                  background: matchingForm.match_type === 'CONTRACT' ? 'rgba(139, 92, 246, 0.05)' : 'var(--bg-card)',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="radio"
                  name="match_type"
                  value="CONTRACT"
                  checked={matchingForm.match_type === 'CONTRACT'}
                  onChange={() => setMatchingForm(p => ({ ...p, match_type: 'CONTRACT' }))}
                  style={{ marginTop: '0.2rem', accentColor: '#8b5cf6' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#8b5cf6' }}>
                    CONTRACT (Match All Volume from an IFS Contract)
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    Maps all invoices & backlog having a specific IFS Site/Contract Code directly to this Range.
                  </div>

                  {/* Contract Code Selector (visible when CONTRACT is selected) */}
                  {matchingForm.match_type === 'CONTRACT' && (
                    <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        Select or Enter IFS Contract Code:
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select
                          value={matchingForm.contract_code}
                          onChange={e => setMatchingForm(p => ({ ...p, contract_code: e.target.value }))}
                          style={{
                            flex: 1, padding: '0.45rem 0.6rem', borderRadius: 'var(--radius-xs)',
                            border: '1px solid var(--border-color)', background: 'var(--bg-hover)',
                            color: 'var(--text-main)', fontSize: '0.825rem', fontWeight: 800, outline: 'none'
                          }}
                        >
                          <option value="">-- Select IFS Contract --</option>
                          {availableContracts.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Or Custom Code"
                          value={matchingForm.contract_code}
                          onChange={e => setMatchingForm(p => ({ ...p, contract_code: e.target.value.toUpperCase() }))}
                          style={{
                            width: '120px', padding: '0.45rem 0.6rem', borderRadius: 'var(--radius-xs)',
                            border: '1px solid var(--border-color)', background: 'var(--bg-hover)',
                            color: 'var(--text-main)', fontSize: '0.825rem', fontWeight: 800, outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </label>

              {/* Option 3: CATALOG_NO (Part Number SKU Matching) */}
              <label 
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem',
                  borderRadius: 'var(--radius-xs)', border: matchingForm.match_type === 'CATALOG_NO' ? '2px solid #f59e0b' : '1px solid var(--border-color)',
                  background: matchingForm.match_type === 'CATALOG_NO' ? 'rgba(245, 158, 11, 0.05)' : 'var(--bg-card)',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="radio"
                  name="match_type"
                  value="CATALOG_NO"
                  checked={matchingForm.match_type === 'CATALOG_NO'}
                  onChange={() => setMatchingForm(p => ({ ...p, match_type: 'CATALOG_NO' }))}
                  style={{ marginTop: '0.2rem', accentColor: '#f59e0b' }}
                />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f59e0b' }}>
                    CATALOG_NO (Direct Part No / SKU Match)
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    Matches directly by IFS Catalog No (<code>CATALOG_NO = '{editMatchingRow.part_no || 'SKU'}'</code>).
                  </div>
                </div>
              </label>
            </div>

            {/* Modal Footer Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button 
                type="button" 
                disabled={savingMatching}
                onClick={() => setEditMatchingRow(null)} 
                style={{ padding: '0.5rem 1.2rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                disabled={savingMatching || (matchingForm.match_type === 'CONTRACT' && !matchingForm.contract_code.trim())}
                onClick={handleSaveMatching}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.4rem', fontSize: '0.85rem', fontWeight: 800, background: 'var(--gsh-teal)', border: 'none', borderRadius: 'var(--radius-xs)', color: '#fff', cursor: 'pointer' }}
              >
                {savingMatching ? <RefreshCw className="spin" style={{ width: '15px', height: '15px' }} /> : <Check style={{ width: '15px', height: '15px' }} />}
                Save IFS Rule
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

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
