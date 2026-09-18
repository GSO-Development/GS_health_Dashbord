import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { 
  Network, Search, Plus, Eye, Edit2, Trash2, 
  CheckCircle, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Hash, Layers, Tag, CheckSquare, Package, Link2, X
} from 'lucide-react';
import api from '../services/api';

const FISCAL_YEARS = [
  'FY 2026/27',
  'FY 2027/28',
  'FY 2025/26',
  'All Years'
];

// ─── High-Contrast Searchable Range Select Dropdown for Table & Modals ───
const SearchableRangeSelect = ({ value, onChange, availableRanges, placeholder = "Select Range..." }) => {
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
    return availableRanges.filter(r => r && r.toLowerCase().includes(filterSearch.toLowerCase().trim()));
  }, [availableRanges, filterSearch]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', minWidth: '220px' }}>
      <div 
        onClick={() => setIsOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.45rem 0.75rem', background: 'var(--bg-card, #ffffff)',
          border: '1.5px solid #00a896', borderRadius: '6px',
          color: 'var(--text-main, #0f172a)', fontSize: '0.85rem', fontWeight: 700,
          cursor: 'pointer', userSelect: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: value ? '#00a896' : 'var(--text-muted, #64748b)' }}>
          {value || placeholder}
        </span>
        <span style={{ fontSize: '0.7rem', color: '#00a896', marginLeft: '0.4rem' }}>▼</span>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 99999,
          marginTop: '0.35rem', background: 'var(--bg-card, #ffffff)', border: '1.5px solid #00a896',
          borderRadius: '8px', boxShadow: '0 14px 35px rgba(0,0,0,0.25)',
          padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.45rem',
          maxHeight: '260px'
        }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search Range..."
              value={filterSearch}
              onChange={e => setFilterSearch(e.target.value)}
              autoFocus
              style={{
                width: '100%', padding: '0.4rem 0.5rem 0.4rem 2rem',
                background: 'var(--bg-primary, #f8fafc)', border: '1px solid #cbd5e1',
                borderRadius: '5px', color: 'var(--text-main, #0f172a)', fontSize: '0.82rem', fontWeight: 600, outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '0.6rem', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
                No range matching "{filterSearch}"
              </div>
            ) : (
              filtered.map((rName, idx) => {
                const isSelected = value === rName;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      onChange(rName);
                      setIsOpen(false);
                      setFilterSearch('');
                    }}
                    style={{
                      padding: '0.45rem 0.75rem', borderRadius: '5px',
                      fontSize: '0.825rem', fontWeight: 700,
                      color: isSelected ? '#ffffff' : 'var(--text-main, #0f172a)',
                      background: isSelected ? '#00a896' : 'transparent',
                      cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(0, 168, 150, 0.12)';
                        e.currentTarget.style.color = '#00a896';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-main, #0f172a)';
                      }
                    }}
                  >
                    {rName}
                  </div>
                );
              })
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
  // Types: 'add_sales_group' | 'add_range' | 'add_mapping'
  const [activeModal, setActiveModal] = useState(null);
  const [viewModalType, setViewModalType] = useState(null); // 'sales_group' | 'range'

  // Modal forms
  const [salesGroupInput, setSalesGroupInput] = useState('');
  const [rangeInput, setRangeInput] = useState('');
  const [mappingForm, setMappingForm] = useState({ sales_group: '', range_name: '' });

  // Inline edit state for main datatable (tracked by unique row id)
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

  // Derived Analytics & Unique Lists
  const nextPrimaryId = useMemo(() => {
    if (!Array.isArray(mappings) || mappings.length === 0) return 1;
    const validIds = mappings.map(m => Number(m.id) || 0).filter(id => !isNaN(id) && id > 0);
    if (validIds.length === 0) return 1;
    return Math.max(...validIds) + 1;
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

  // ─── Modal Submissions ───

  // 1. Add Sales Group
  const handleSaveSalesGroup = async (e) => {
    e.preventDefault();
    if (!salesGroupInput.trim()) {
      showToast('Please enter a Sales Group name.', 'error');
      return;
    }
    try {
      await api.post('/division-mappings/add-sales-group', { sales_group: salesGroupInput.trim() });
      showToast(`✅ Sales Group "${salesGroupInput.trim()}" added successfully!`);
      setSalesGroupInput('');
      setActiveModal(null);
      loadMappings();
    } catch {
      showToast('Failed to add Sales Group.', 'error');
    }
  };

  // 2. Add Range
  const handleSaveRange = async (e) => {
    e.preventDefault();
    if (!rangeInput.trim()) {
      showToast('Please enter a Range name.', 'error');
      return;
    }
    try {
      await api.post('/division-mappings/add-range', { range_name: rangeInput.trim() });
      showToast(`✅ Range "${rangeInput.trim()}" registered successfully!`);
      setRangeInput('');
      setActiveModal(null);
      loadMappings();
    } catch {
      showToast('Failed to add Range.', 'error');
    }
  };

  // 3. Add / Map Sales Group to Range
  const handleSaveMapping = async (e) => {
    e.preventDefault();
    if (!mappingForm.sales_group.trim() || !mappingForm.range_name.trim()) {
      showToast('Please select/enter both Sales Group and Range.', 'error');
      return;
    }
    try {
      await api.post('/division-mappings', {
        sales_group: mappingForm.sales_group.trim(),
        range_name: mappingForm.range_name.trim()
      });
      showToast(`✅ Mapped "${mappingForm.sales_group.trim()}" to "${mappingForm.range_name.trim()}"!`);
      setMappingForm({ sales_group: '', range_name: '' });
      setActiveModal(null);
      loadMappings();
    } catch {
      showToast('Failed to save mapping.', 'error');
    }
  };

  // ─── Inline Table Edit Handlers ───
  const handleStartInlineEdit = (row) => {
    setInlineEditId(row.id);
    setInlineForm({ sales_group: row.sales_group, range_name: row.range_name });
  };

  const handleSaveInlineEdit = async (row) => {
    if (!inlineForm.range_name.trim()) {
      showToast('Range name cannot be empty.', 'error');
      return;
    }
    try {
      await api.put(`/division-mappings/${row.mapping_id || row.id}`, {
        sales_group: row.sales_group,
        range_name: inlineForm.range_name.trim()
      });
      showToast(`✅ Sales Group "${row.sales_group}" mapped to Range "${inlineForm.range_name.trim()}"!`);
      setInlineEditId(null);
      loadMappings();
    } catch {
      showToast('Failed to update mapping.', 'error');
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete mapping for "${row.sales_group}" (ID #${row.id})?`)) return;
    try {
      await api.delete(`/division-mappings/${row.mapping_id || row.id}`);
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
            Configure Sales Group master names, Target Range categories, and map Sales Groups to Ranges.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Dedicated + Add Mapping Button */}
          <button 
            onClick={() => {
              setMappingForm({ sales_group: '', range_name: '' });
              setActiveModal('add_mapping');
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.1rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
          >
            <Link2 style={{ width: '16px', height: '16px' }} /> + Add Mapping
          </button>

          <button onClick={handleAutoSync} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', background: 'var(--accent-gradient)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(200,16,46,0.25)' }}>
            <RefreshCw style={{ width: '15px', height: '15px' }} /> Auto-Sync from Budget
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                onClick={() => {
                  setSalesGroupInput('');
                  setActiveModal('add_sales_group');
                }}
                title="Add New Sales Group Category"
                style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.35rem 0.65rem', background: 'var(--accent-gradient)', border: 'none', borderRadius: 'var(--radius-xs)', color: '#fff', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', boxShadow: '0 2px 6px rgba(200,16,46,0.25)' }}
              >
                <Plus style={{ width: '13px', height: '13px' }} /> + Add
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
                  TOTAL RANGE
                </span>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Range categories</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                onClick={() => {
                  setRangeInput('');
                  setActiveModal('add_range');
                }}
                title="Add New Target Range Category"
                style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.35rem 0.65rem', background: 'linear-gradient(135deg, #00a896 0%, #00897b 100%)', border: 'none', borderRadius: 'var(--radius-xs)', color: '#fff', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,168,150,0.25)' }}
              >
                <Plus style={{ width: '13px', height: '13px' }} /> + Add
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

      {/* Main Division Mappings Datatable */}
      <div className="glass-card" style={{ padding: 0, overflow: 'visible' }}>
        <div style={{ overflowX: 'auto', minHeight: '350px' }}>
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
                    Loading division mappings & budget records...
                  </td>
                </tr>
              ) : paginatedMappings.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No mapping records matching "{searchTerm}".
                  </td>
                </tr>
              ) : (
                paginatedMappings.map((row) => {
                  const isEditingInline = inlineEditId === row.id;
                  return (
                    <tr key={row.id} style={{ borderBottom: '1px solid var(--border-color)', background: isEditingInline ? 'rgba(0,168,150,0.06)' : 'transparent' }}>
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
                          <span style={{ fontWeight: 700, color: 'var(--gsh-teal)', background: 'rgba(0,168,150,0.08)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                            {row.range_name}
                          </span>
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
                            <button onClick={() => handleSaveInlineEdit(row)} title="Save Changes" style={{ padding: '0.35rem 0.6rem', background: '#10b981', border: 'none', borderRadius: 'var(--radius-xs)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' }}>
                              Save
                            </button>
                            <button onClick={() => setInlineEditId(null)} title="Cancel" style={{ padding: '0.35rem 0.6rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.75rem' }}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => handleStartInlineEdit(row)} title="Edit Range for this row" style={{ padding: '0.35rem 0.5rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', cursor: 'pointer' }}>
                              <Edit2 style={{ width: '14px', height: '14px' }} />
                            </button>
                            <button onClick={() => handleDelete(row)} title="Delete Mapping" style={{ padding: '0.35rem 0.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-xs)', color: '#ef4444', cursor: 'pointer' }}>
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

      {/* ─── MODAL 1: ADD SALES GROUP ONLY ─── */}
      {activeModal === 'add_sales_group' && ReactDOM.createPortal(
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setActiveModal(null); }}
          style={{ 
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
            zIndex: 999999, background: 'rgba(0, 0, 0, 0.7)', 
            backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', padding: '1rem', boxSizing: 'border-box'
          }}
        >
          <form 
            onSubmit={handleSaveSalesGroup} 
            style={{ 
              width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto',
              background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-md)', padding: '1.5rem', boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers style={{ width: '20px', height: '20px', color: 'var(--gsh-red)' }} />
                Add New Sales Group
              </h3>
              <button type="button" onClick={() => setActiveModal(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-subtle)' }}>✕</button>
            </div>

            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.2rem' }}>
              Create a new Sales Group master category. You can later map this Sales Group to a Target Range.
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.35rem' }}>
                Sales Group Name <span style={{ color: 'var(--gsh-red)' }}>*</span>
              </label>
              <input
                type="text"
                value={salesGroupInput}
                onChange={e => setSalesGroupInput(e.target.value)}
                placeholder="e.g. ABBOTT, ROCKET SAL, B BRAUN..."
                autoFocus
                style={{ width: '100%', padding: '0.65rem 0.85rem', background: 'var(--bg-primary)', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
              <button type="button" onClick={() => setActiveModal(null)} style={{ padding: '0.6rem 1.2rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="submit" style={{ padding: '0.6rem 1.4rem', background: 'var(--accent-gradient)', border: 'none', borderRadius: 'var(--radius-xs)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(200,16,46,0.25)' }}>
                Add Sales Group
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* ─── MODAL 2: ADD RANGE ONLY ─── */}
      {activeModal === 'add_range' && ReactDOM.createPortal(
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setActiveModal(null); }}
          style={{ 
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
            zIndex: 999999, background: 'rgba(0, 0, 0, 0.7)', 
            backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', padding: '1rem', boxSizing: 'border-box'
          }}
        >
          <form 
            onSubmit={handleSaveRange} 
            style={{ 
              width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto',
              background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-md)', padding: '1.5rem', boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Tag style={{ width: '20px', height: '20px', color: 'var(--gsh-teal)' }} />
                Add New Range / Division Category
              </h3>
              <button type="button" onClick={() => setActiveModal(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-subtle)' }}>✕</button>
            </div>

            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.2rem' }}>
              Create a new Target Range / Division name. This will become available in all mapping dropdowns.
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.35rem' }}>
                Range Name <span style={{ color: 'var(--gsh-teal)' }}>*</span>
              </label>
              <input
                type="text"
                value={rangeInput}
                onChange={e => setRangeInput(e.target.value)}
                placeholder="e.g. SUR CONSUMABLES, ARROWIL A5, OAKNET..."
                autoFocus
                style={{ width: '100%', padding: '0.65rem 0.85rem', background: 'var(--bg-primary)', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
              <button type="button" onClick={() => setActiveModal(null)} style={{ padding: '0.6rem 1.2rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="submit" style={{ padding: '0.6rem 1.4rem', background: 'linear-gradient(135deg, #00a896 0%, #00897b 100%)', border: 'none', borderRadius: 'var(--radius-xs)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,168,150,0.25)' }}>
                Add Range Category
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* ─── MODAL 3: MAP SALES GROUP TO RANGE ─── */}
      {activeModal === 'add_mapping' && ReactDOM.createPortal(
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setActiveModal(null); }}
          style={{ 
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
            zIndex: 999999, background: 'rgba(0, 0, 0, 0.7)', 
            backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', padding: '1rem', boxSizing: 'border-box'
          }}
        >
          <form 
            onSubmit={handleSaveMapping} 
            style={{ 
              width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto',
              background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-md)', padding: '1.5rem', boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Link2 style={{ width: '20px', height: '20px', color: '#10b981' }} />
                Map Sales Group to Range
              </h3>
              <button type="button" onClick={() => setActiveModal(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-subtle)' }}>✕</button>
            </div>

            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Connect a Sales Group to a Target Range. This updates all associated SKUs in the total_budget table.
            </p>

            {/* Sales Group Select or Custom Input */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.35rem' }}>
                1. Select / Enter Sales Group <span style={{ color: 'var(--gsh-red)' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={mappingForm.sales_group}
                  onChange={e => setMappingForm(f => ({ ...f, sales_group: e.target.value }))}
                  placeholder="Type or pick Sales Group..."
                  style={{ flex: 1, padding: '0.6rem 0.8rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.875rem', outline: 'none' }}
                />
                <select
                  onChange={e => { if (e.target.value) setMappingForm(f => ({ ...f, sales_group: e.target.value })); }}
                  defaultValue=""
                  style={{ padding: '0.6rem 0.5rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.825rem', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
                >
                  <option value="" disabled>Choose Existing...</option>
                  {uniqueSalesGroups.map(sg => (
                    <option key={sg} value={sg}>{sg}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Range Select or Custom Input */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.35rem' }}>
                2. Select / Enter Target Range <span style={{ color: 'var(--gsh-teal)' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={mappingForm.range_name}
                  onChange={e => setMappingForm(f => ({ ...f, range_name: e.target.value }))}
                  placeholder="Type or pick Range..."
                  style={{ flex: 1, padding: '0.6rem 0.8rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.875rem', outline: 'none' }}
                />
                <select
                  onChange={e => { if (e.target.value) setMappingForm(f => ({ ...f, range_name: e.target.value })); }}
                  defaultValue=""
                  style={{ padding: '0.6rem 0.5rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.825rem', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
                >
                  <option value="" disabled>Choose Existing...</option>
                  {uniqueRanges.map(rg => (
                    <option key={rg} value={rg}>{rg}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
              <button type="button" onClick={() => setActiveModal(null)} style={{ padding: '0.6rem 1.2rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="submit" style={{ padding: '0.6rem 1.4rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', borderRadius: 'var(--radius-xs)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
                Save Mapping
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* ─── MODAL 4: VIEW ALL (Sales Groups or Ranges) ─── */}
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
