import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { 
  Network, Search, Plus, Eye, Edit2, Trash2, 
  CheckCircle, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Hash, Layers, Tag, CheckSquare, AlertTriangle, Database, Calendar
} from 'lucide-react';
import api from '../services/api';

const FISCAL_YEARS = [
  'FY 2026/27',
  'FY 2027/28',
  'FY 2025/26',
  'All Years'
];

// ─── Searchable Range Select Dropdown Component for Table Edit Rows ───
const SearchableRangeSelect = ({ value, onChange, availableRanges }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    if (!filterSearch.trim()) return availableRanges;
    return availableRanges.filter(r => r.toLowerCase().includes(filterSearch.toLowerCase().trim()));
  }, [availableRanges, filterSearch]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', minWidth: '200px' }}>
      <div 
        onClick={() => setIsOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.45rem 0.65rem', background: 'var(--bg-primary)',
          border: '1.5px solid var(--gsh-teal)', borderRadius: 'var(--radius-xs)',
          color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 700,
          cursor: 'pointer', userSelect: 'none'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: value ? 'var(--gsh-teal)' : 'var(--text-subtle)' }}>
          {value || 'Select Range...'}
        </span>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999,
          marginTop: '0.25rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-xs)', boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem',
          maxHeight: '220px'
        }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', width: '13px', height: '13px', color: 'var(--text-subtle)' }} />
            <input
              type="text"
              placeholder="Search Range..."
              value={filterSearch}
              onChange={e => setFilterSearch(e.target.value)}
              autoFocus
              style={{
                width: '100%', padding: '0.35rem 0.5rem 0.35rem 1.8rem',
                background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                borderRadius: '4px', color: 'var(--text-main)', fontSize: '0.78rem', outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                No range matching "{filterSearch}"
              </div>
            ) : (
              filtered.map((rName, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    onChange(rName);
                    setIsOpen(false);
                    setFilterSearch('');
                  }}
                  style={{
                    padding: '0.35rem 0.6rem', borderRadius: '4px',
                    fontSize: '0.8rem', fontWeight: 700,
                    color: value === rName ? '#fff' : 'var(--text-main)',
                    background: value === rName ? 'var(--gsh-teal)' : 'transparent',
                    cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}
                >
                  {rName}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

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

  // Modals state
  const [quickAddModal, setQuickAddModal] = useState(null);
  const [viewModalType, setViewModalType] = useState(null);
  const [quickAddForm, setQuickAddForm] = useState({ sales_group: '', range_name: '' });

  // Inline edit state for main datatable
  const [inlineEditId, setInlineEditId] = useState(null);
  const [inlineForm, setInlineForm] = useState({ sales_group: '', range_name: '' });

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

  // Derived Analytics & Counts
  const nextPrimaryId = useMemo(() => {
    if (!mappings || mappings.length === 0) return 1;
    const max = Math.max(...mappings.map(m => m.id || 0));
    return max + 1;
  }, [mappings]);

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

  // Quick Add Handlers
  const handleOpenQuickAdd = (type) => {
    setQuickAddModal(type);
    setQuickAddForm({ sales_group: '', range_name: '' });
  };

  const handleSaveQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickAddForm.sales_group.trim() || !quickAddForm.range_name.trim()) {
      showToast('Both Sales Group and Range name are required.', 'error');
      return;
    }

    try {
      await api.post('/division-mappings', quickAddForm);
      showToast(`✅ New Mapping (ID #${nextPrimaryId}) created successfully!`);
      setQuickAddModal(null);
      loadMappings();
    } catch {
      showToast('Failed to create new mapping.', 'error');
    }
  };

  // Inline Table Edit Handlers
  const handleStartInlineEdit = (item) => {
    setInlineEditId(item.id);
    setInlineForm({ sales_group: item.sales_group, range_name: item.range_name });
  };

  const handleSaveInlineEdit = async (id) => {
    try {
      await api.put(`/division-mappings/${id}`, inlineForm);
      showToast('✅ Division mapping updated!');
      setInlineEditId(null);
      loadMappings();
    } catch {
      showToast('Failed to update mapping.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Delete mapping ID #${id}?`)) return;
    try {
      await api.delete(`/division-mappings/${id}`);
      showToast('Mapping deleted successfully.');
      loadMappings();
    } catch {
      showToast('Failed to delete mapping.', 'error');
    }
  };

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
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 99999, padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-sm)', background: toast.type === 'success' ? '#10b981' : (toast.type === 'info' ? 'var(--gsh-teal)' : '#ef4444'), color: '#fff', fontWeight: 700, fontSize: '0.85rem', boxShadow: '0 8px 24px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
            Configure Sales Group, Range division mappings, Part No., and Product (SKU) details from total_budget database table.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <button onClick={handleAutoSync} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', background: 'var(--accent-gradient)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(200,16,46,0.25)' }}>
            <Database style={{ width: '15px', height: '15px' }} /> Auto-Sync from total_budget
          </button>
          <button onClick={loadMappings} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
            <RefreshCw style={{ width: '15px', height: '15px' }} /> Refresh
          </button>
        </div>
      </div>

      {/* ─── TOP 4 KPI CARDS (Sales Group, Range, Mapped Count, Unmapped Count) ─── */}
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
                  Total Sales Group
                </span>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unique Sales Groups mapped</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <button
                onClick={() => handleOpenQuickAdd('sales_group')}
                title="Add New Sales Group Entry"
                style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.35rem 0.6rem', background: 'var(--accent-gradient)', border: 'none', borderRadius: 'var(--radius-xs)', color: '#fff', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
              >
                <Plus style={{ width: '13px', height: '13px' }} /> Add
              </button>
              
              <button
                onClick={() => { setViewModalType('sales_group'); }}
                title="View All Sales Groups"
                style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.35rem 0.6rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
              >
                <Eye style={{ width: '13px', height: '13px', color: 'var(--gsh-red)' }} /> View All
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {stats.total_sales_groups || uniqueSalesGroups.length} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Groups</span>
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gsh-red)', background: 'rgba(200, 16, 46, 0.08)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
              Next Primary ID: #{nextPrimaryId}
            </div>
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
                  Total Range
                </span>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Range categories created</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <button
                onClick={() => handleOpenQuickAdd('range')}
                title="Add New Range Entry"
                style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.35rem 0.6rem', background: 'linear-gradient(135deg, #00a896 0%, #00897b 100%)', border: 'none', borderRadius: 'var(--radius-xs)', color: '#fff', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
              >
                <Plus style={{ width: '13px', height: '13px' }} /> Add
              </button>
              
              <button
                onClick={() => { setViewModalType('range'); }}
                title="View All Ranges"
                style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.35rem 0.6rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
              >
                <Eye style={{ width: '13px', height: '13px', color: 'var(--gsh-teal)' }} /> View All
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {stats.total_ranges || uniqueRanges.length} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Ranges</span>
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gsh-teal)', background: 'rgba(0, 168, 150, 0.08)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
              Next Primary ID: #{nextPrimaryId}
            </div>
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
                  Mapped Count
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

        {/* CARD 4: Unmapped Count */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: `4px solid ${stats.unmapped_count > 0 ? '#ef4444' : '#f59e0b'}`, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-xs)', background: stats.unmapped_count > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: stats.unmapped_count > 0 ? '#ef4444' : '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle style={{ width: '22px', height: '22px' }} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-subtle)' }}>
                  Not Mapped Count
                </span>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unmapped Sales Groups</p>
              </div>
            </div>

            <button
              onClick={handleAutoSync}
              title="Sync missing mappings directly from total_budget"
              style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.35rem 0.6rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
            >
              <Database style={{ width: '13px', height: '13px', color: '#f59e0b' }} /> Auto-Sync
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: stats.unmapped_count > 0 ? '#ef4444' : '#f59e0b' }}>
              {stats.unmapped_count} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Pending</span>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: stats.unmapped_count === 0 ? '#10b981' : '#ef4444' }}>
              {stats.unmapped_count === 0 ? 'All 100% Synced' : 'Requires Sync'}
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
            <Calendar style={{ width: '16px', height: '16px', color: 'var(--gsh-teal)' }} />
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
            Next Primary ID: <strong style={{ color: 'var(--gsh-red)', fontSize: '0.9rem' }}>#{nextPrimaryId}</strong>
          </div>
          <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            Showing <strong>{paginatedMappings.length}</strong> of <strong>{filteredMappings.length}</strong> items (Page {currentPage} of {totalPages})
          </div>
        </div>
      </div>

      {/* Main Division Mappings Datatable with Part No. & Product (SKU) Columns */}
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
                <th style={{ padding: '0.75rem 1rem', width: '140px' }}>Last Updated</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading division mappings & total_budget records...
                  </td>
                </tr>
              ) : paginatedMappings.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No mapping records matching "{searchTerm}".
                  </td>
                </tr>
              ) : (
                paginatedMappings.map((row, idx) => {
                  const isEditingInline = inlineEditId === row.id;
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', background: isEditingInline ? 'rgba(200,16,46,0.04)' : 'transparent' }}>
                      <td style={{ padding: '0.65rem 1rem', fontWeight: 800, color: 'var(--gsh-red)', fontFamily: 'monospace' }}>
                        #{row.id}
                      </td>

                      {/* Sales Group */}
                      <td style={{ padding: '0.65rem 1rem' }}>
                        <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{row.sales_group}</span>
                      </td>

                      {/* Range Name */}
                      <td style={{ padding: '0.65rem 1rem' }}>
                        {isEditingInline ? (
                          <SearchableRangeSelect
                            value={inlineForm.range_name}
                            availableRanges={uniqueRanges}
                            onChange={(selectedRange) => setInlineForm(f => ({ ...f, range_name: selectedRange }))}
                          />
                        ) : (
                          <span style={{ fontWeight: 700, color: 'var(--gsh-teal)', background: 'rgba(0,168,150,0.08)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{row.range_name}</span>
                        )}
                      </td>

                      {/* Part No. (from total_budget) */}
                      <td style={{ padding: '0.65rem 1rem', fontFamily: 'monospace', fontWeight: 800, color: 'var(--gsh-red)' }}>
                        {row.part_no || '-'}
                      </td>

                      {/* Product (SKU) (from total_budget) */}
                      <td style={{ padding: '0.65rem 1rem', fontWeight: 600, color: 'var(--text-main)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.product_sku || '-'}
                      </td>

                      {/* Last Updated */}
                      <td style={{ padding: '0.65rem 1rem', color: 'var(--text-subtle)', fontSize: '0.8rem' }}>
                        {row.updated_at || 'Auto System'}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.65rem 1rem', textAlign: 'right' }}>
                        {isEditingInline ? (
                          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => handleSaveInlineEdit(row.id)} title="Save Changes" style={{ padding: '0.35rem 0.6rem', background: '#10b981', border: 'none', borderRadius: 'var(--radius-xs)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' }}>
                              Save
                            </button>
                            <button onClick={() => setInlineEditId(null)} title="Cancel" style={{ padding: '0.35rem 0.6rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.75rem' }}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => handleStartInlineEdit(row)} title="Edit Row" style={{ padding: '0.35rem 0.5rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', cursor: 'pointer' }}>
                              <Edit2 style={{ width: '14px', height: '14px' }} />
                            </button>
                            <button onClick={() => handleDelete(row.id)} title="Delete Mapping" style={{ padding: '0.35rem 0.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-xs)', color: '#ef4444', cursor: 'pointer' }}>
                              <Trash2 style={{ width: '14px', height: '14px' }} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
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

      {/* ─── MODAL 1: QUICK ADD ─── */}
      {quickAddModal && ReactDOM.createPortal(
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setQuickAddModal(null); }}
          style={{ 
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
            zIndex: 999999, background: 'rgba(0, 0, 0, 0.7)', 
            backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', padding: '1rem', boxSizing: 'border-box'
          }}
        >
          <form 
            onSubmit={handleSaveQuickAdd} 
            style={{ 
              width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto',
              background: 'var(--bg-card)', border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-md)', padding: '1.5rem', boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus style={{ width: '20px', height: '20px', color: quickAddModal === 'sales_group' ? 'var(--gsh-red)' : 'var(--gsh-teal)' }} />
                Add New {quickAddModal === 'sales_group' ? 'Sales Group' : 'Range'} Entry
              </h3>
              <button type="button" onClick={() => setQuickAddModal(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-subtle)', padding: '0.2rem' }}>✕</button>
            </div>

            <div style={{ padding: '0.65rem 0.85rem', background: 'rgba(200,16,46,0.06)', borderRadius: 'var(--radius-xs)', border: '1px dashed var(--gsh-red)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-subtle)' }}>Assigned Primary ID:</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--gsh-red)', fontFamily: 'monospace' }}>#{nextPrimaryId}</span>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.35rem' }}>
                Sales Group Name <span style={{ color: 'var(--gsh-red)' }}>*</span>
              </label>
              <input
                type="text"
                value={quickAddForm.sales_group}
                onChange={e => setQuickAddForm(f => ({ ...f, sales_group: e.target.value }))}
                placeholder="e.g. ADCOCK, ROCKET SAL, B BRAUN..."
                style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.35rem' }}>
                Range Name <span style={{ color: 'var(--gsh-red)' }}>*</span>
              </label>
              <input
                type="text"
                value={quickAddForm.range_name}
                onChange={e => setQuickAddForm(f => ({ ...f, range_name: e.target.value }))}
                placeholder="e.g. OAKNET, ALPAYA, SURGICAL CONSUMABLES..."
                style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
              <button type="button" onClick={() => setQuickAddModal(null)} style={{ padding: '0.6rem 1.2rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="submit" style={{ padding: '0.6rem 1.4rem', background: 'var(--accent-gradient)', border: 'none', borderRadius: 'var(--radius-xs)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(200,16,46,0.25)' }}>
                Insert Entry (ID #{nextPrimaryId})
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

    </div>
  );
};

export default MapDivisionsPage;
