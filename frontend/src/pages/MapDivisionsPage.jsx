import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { 
  Network, Search, Eye, 
  CheckCircle, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Hash, Layers, Tag, CheckSquare, Package, Database, DatabaseZap,
  SlidersHorizontal, Check, Settings2, X, Building2, Upload, FileSpreadsheet, AlertTriangle, FileUp, PlusCircle, Sparkles, Filter, Calendar
} from 'lucide-react';
import api from '../services/api';

const FISCAL_YEARS = [
  'FY 2026/27',
  'FY 2027/28',
  'FY 2025/26'
];

const MapDivisionsPage = () => {
  const [mappings, setMappings] = useState([]);
  const [stats, setStats] = useState({ total_sales_groups: 0, total_ranges: 0, mapped_count: 0, unmapped_count: 0, not_in_budget_count: 0, total_items: 0, not_in_budget_list: [] });
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
    contract_code: '',
    visibility: 'both'
  });
  const [savingMatching, setSavingMatching] = useState(false);

  // ─── EXCEL UPLOAD STATE ───
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedExcelFile, setSelectedExcelFile] = useState(null);
  const [uploadFiscalYear, setUploadFiscalYear] = useState('FY 2026/27');
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [isNotIncludedModalOpen, setIsNotIncludedModalOpen] = useState(false);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'budget' | 'not_in_budget'
  const [visibilityFilter, setVisibilityFilter] = useState('all'); // 'all' | 'both' | 'total_range' | 'distri_range'
  const [notIncludedSearch, setNotIncludedSearch] = useState('');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadMappings = async (yearToLoad = selectedYear) => {
    setLoading(true);
    try {
      const [resMap, resStats, resContracts] = await Promise.all([
        api.get('/division-mappings', { params: { search: searchTerm, year: yearToLoad } }),
        api.get('/division-mappings/stats', { params: { year: yearToLoad } }),
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
    loadMappings(selectedYear);
  }, [selectedYear]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterTab, visibilityFilter]);

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

  const handleVisibilityChange = async (row, newVisibility) => {
    try {
      // Optimistically update local mappings state
      setMappings(prev => prev.map(m => {
        if (m.sales_group === row.sales_group) {
          return { ...m, visibility: newVisibility };
        }
        return m;
      }));

      const res = await api.put('/division-mappings/update-visibility', {
        sales_group: row.sales_group,
        range_name: row.range_name,
        visibility: newVisibility
      });

      if (res.data && res.data.status === 'success') {
        const labelMap = {
          'both': 'Both (Total & Distri)',
          'total_range': 'Total Range FY Only',
          'distri_range': 'Distri Range FY Only'
        };
        showToast(`✅ Visibility for '${row.sales_group}' updated to ${labelMap[newVisibility] || newVisibility}!`);
      }
    } catch {
      showToast('Failed to update mapping visibility.', 'error');
      loadMappings();
    }
  };

  const openMatchingModal = (row) => {
    setEditMatchingRow(row);
    setMatchingForm({
      match_type: row.match_type || 'CATALOG_GROUP',
      contract_code: row.contract_code || '',
      visibility: row.visibility || 'both'
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
        contract_code: matchingForm.match_type === 'CONTRACT' ? matchingForm.contract_code : null,
        visibility: matchingForm.visibility
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

  // ─── EXCEL UPLOAD HANDLER ───
  const handleExcelFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        showToast('Only Excel files (.xlsx, .xls) are allowed!', 'error');
        return;
      }
      setSelectedExcelFile(file);
    }
  };

  const handleExcelUploadSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedExcelFile) {
      showToast('Please select an Excel file first.', 'error');
      return;
    }

    setUploadingExcel(true);
    const formData = new FormData();
    formData.append('file', selectedExcelFile);

    try {
      const res = await api.post('/division-mappings/compare-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: { fiscal_year: uploadFiscalYear, year: uploadFiscalYear }
      });

      if (res.data && res.data.status === 'success') {
        showToast(`✅ Processed: ${res.data.included_count} in Budget, ${res.data.not_included_count} Unbudgeted added!`);
        setIsUploadModalOpen(false);
        setSelectedExcelFile(null);
        setSelectedYear(uploadFiscalYear);
        loadMappings(uploadFiscalYear);
      } else {
        showToast('Failed to parse Excel file.', 'error');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error uploading Excel file.';
      showToast(msg, 'error');
    }
    setUploadingExcel(false);
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

  // Counts of Budget vs Not in Budget
  const inBudgetCount = useMemo(() => {
    return mappings.filter(m => m.upload_status === 'Budget').length;
  }, [mappings]);

  const notInBudgetCount = useMemo(() => {
    return mappings.filter(m => m.upload_status === 'Not in Budget').length;
  }, [mappings]);

  // Filtered table rows
  const filteredMappings = useMemo(() => {
    return mappings.filter(m => {
      // Tab filter
      if (filterTab === 'budget' && m.upload_status !== 'Budget') return false;
      if (filterTab === 'not_in_budget' && m.upload_status !== 'Not in Budget') return false;

      // Visibility filter
      if (visibilityFilter !== 'all') {
        const v = m.visibility || 'both';
        if (v !== visibilityFilter) return false;
      }

      // Search filter
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        (m.sales_group && m.sales_group.toLowerCase().includes(term)) ||
        (m.range_name && m.range_name.toLowerCase().includes(term)) ||
        (m.part_no && String(m.part_no).toLowerCase().includes(term)) ||
        (m.product_sku && m.product_sku.toLowerCase().includes(term)) ||
        (m.contract_code && m.contract_code.toLowerCase().includes(term)) ||
        (m.match_type && m.match_type.toLowerCase().includes(term)) ||
        (m.visibility && m.visibility.toLowerCase().includes(term)) ||
        (m.upload_status && m.upload_status.toLowerCase().includes(term)) ||
        (m.id && String(m.id).includes(term))
      );
    });
  }, [mappings, searchTerm, filterTab, visibilityFilter]);

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
                Master hierarchy mapping between <strong>Annual Budget Sales Groups</strong>, <strong>45 Parent Division Ranges</strong>, and <strong>IFS Oracle Match Rules</strong>.
              </p>
            </div>
          </div>

          {/* Action Buttons: Excel Upload & Auto-Sync */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            
            {/* BUTTON: Upload Excel (Sales Group & Range) */}
            <button
              onClick={() => {
                setUploadFiscalYear(selectedYear);
                setIsUploadModalOpen(true);
              }}
              className="btn btn-primary"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 1rem',
                fontSize: '0.82rem', fontWeight: 800, background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                border: 'none', borderRadius: 'var(--radius-xs)', color: '#fff', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
                cursor: 'pointer'
              }}
              title="Upload Excel with Sales Group and Range columns for unbudgeted or new items"
            >
              <FileSpreadsheet style={{ width: '16px', height: '16px' }} />
              Upload Excel (Sales Group & Range)
            </button>

            {/* BUTTON: Auto-Sync from Budget Master */}
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

      {/* 5 Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        
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

        {/* CARD 3: In Budget Count */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '4px solid #10b981', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-xs)', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckSquare style={{ width: '22px', height: '22px' }} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-subtle)' }}>
                  BUDGET MASTER
                </span>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>With Allocated Budget</p>
              </div>
            </div>

            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
              ✅ Budget Master
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>
              {inBudgetCount} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Items</span>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)' }}>
              In {selectedYear}
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
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>All Mapped SKUs / Items</p>
              </div>
            </div>

            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#3b82f6', background: 'rgba(59, 130, 246, 0.12)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
              📦 Active SKUs
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {mappings.length.toLocaleString('en-US')} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Items</span>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)' }}>
              Master Table Total
            </span>
          </div>
        </div>

        {/* CARD 5: 🌟 UPLOAD NOT INCLUDE (UNBUDGETED PRODUCTS) */}
        <div 
          className="glass-card" 
          style={{ 
            padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', 
            borderLeft: notInBudgetCount > 0 ? '4px solid #ef4444' : '4px solid #f59e0b', 
            background: notInBudgetCount > 0 ? 'linear-gradient(180deg, rgba(239, 68, 68, 0.04) 0%, var(--bg-card) 100%)' : 'var(--bg-card)',
            position: 'relative' 
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-xs)', background: notInBudgetCount > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)', color: notInBudgetCount > 0 ? '#ef4444' : '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle style={{ width: '22px', height: '22px' }} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: notInBudgetCount > 0 ? '#ef4444' : '#f59e0b' }}>
                  UPLOAD NOT INCLUDE
                </span>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Unbudgeted Products
                </p>
              </div>
            </div>

            {notInBudgetCount > 0 && (
              <button
                onClick={() => setIsNotIncludedModalOpen(true)}
                title="View All Uploaded Items Not in Budget"
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.75rem', 
                  background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', 
                  borderRadius: 'var(--radius-xs)', color: '#ef4444', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' 
                }}
              >
                <Eye style={{ width: '14px', height: '14px' }} /> View List ({notInBudgetCount})
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: notInBudgetCount > 0 ? '#ef4444' : '#10b981' }}>
              {notInBudgetCount}{' '}
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                {notInBudgetCount > 0 ? 'Not in Budget' : 'All Budgeted'}
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
              {selectedYear}
            </span>
          </div>
        </div>

      </div>

      {/* Filter Tabs: All, In Budget, Not in Budget + Visibility Filter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', background: 'var(--bg-card)', padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginRight: '0.5rem' }}>
            <Filter style={{ width: '14px', height: '14px', color: 'var(--gsh-teal)' }} />
            Status Filter:
          </span>
          {[
            { key: 'all', label: `All Records (${mappings.length})` },
            { key: 'budget', label: `🟢 In Budget (${inBudgetCount})`, color: '#10b981' },
            { key: 'not_in_budget', label: `🟠 Not in Budget (${notInBudgetCount})`, color: '#ef4444' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterTab(tab.key)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                border: filterTab === tab.key ? 'none' : '1px solid var(--border-color)',
                background: filterTab === tab.key ? (tab.color || 'var(--gsh-teal)') : 'var(--bg-hover)',
                color: filterTab === tab.key ? '#fff' : (tab.color || 'var(--text-main)'),
                boxShadow: filterTab === tab.key ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Visibility Filter Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: 'var(--bg-hover)', padding: '0.3rem 0.65rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
          <Eye style={{ width: '14px', height: '14px', color: '#10b981' }} />
          <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)' }}>Mapping Visibility:</label>
          <select
            value={visibilityFilter}
            onChange={e => setVisibilityFilter(e.target.value)}
            style={{ padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.8rem', fontWeight: 800, outline: 'none', cursor: 'pointer' }}
          >
            <option value="all">All Visibilities</option>
            <option value="both">🌐 Both (Total & Distri)</option>
            <option value="total_range">📊 Total Range FY Only</option>
            <option value="distri_range">📈 Distri Range FY Only</option>
          </select>
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
              placeholder="Search Sales Group, Range, Part No, Status..."
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

      {/* Main Division Mappings Datatable (With Interactive IFS Matching Field, Visibility & Upload Status Column) */}
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
                
                {/* COLUMN: Upload Status (Budget vs Not in Budget) */}
                <th style={{ padding: '0.75rem 1rem', color: '#f59e0b', minWidth: '130px' }}>Upload Status</th>

                {/* COLUMN: Mapping Visibility */}
                <th style={{ padding: '0.75rem 1rem', color: '#10b981', minWidth: '190px' }}>Mapping Visibility</th>

                <th style={{ padding: '0.75rem 1rem', color: '#3b82f6', minWidth: '220px' }}>IFS Matching Field & Rule</th>
                <th style={{ padding: '0.75rem 1rem', width: '140px' }}>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading division mappings & budget master records...
                  </td>
                </tr>
              ) : paginatedMappings.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No mapping records matching current filters.
                  </td>
                </tr>
              ) : (
                paginatedMappings.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid var(--border-color)', background: row.upload_status === 'Not in Budget' ? 'rgba(245, 158, 11, 0.04)' : 'inherit' }}>
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

                    {/* Part No. */}
                    <td style={{ padding: '0.65rem 1rem', fontFamily: 'monospace', fontWeight: 800, color: 'var(--gsh-red)' }}>
                      {row.part_no || '-'}
                    </td>

                    {/* Product (SKU) */}
                    <td style={{ padding: '0.65rem 1rem', fontWeight: 600, color: 'var(--text-main)', maxWidth: '260px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.product_sku}>
                      {row.product_sku || '-'}
                    </td>

                    {/* COLUMN CELL: Upload Status (Budget vs Not in Budget) */}
                    <td style={{ padding: '0.65rem 1rem' }}>
                      {row.upload_status === 'Budget' ? (
                        <span 
                          title="Imported from Annual Budget Master"
                          style={{ padding: '0.25rem 0.6rem', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', borderRadius: '4px', fontWeight: 800, fontSize: '0.75rem', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <CheckCircle style={{ width: '12px', height: '12px' }} /> Budget
                        </span>
                      ) : (
                        <span 
                          title="Unbudgeted product (Uploaded via Excel or Manual)"
                          style={{ padding: '0.25rem 0.6rem', background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', borderRadius: '4px', fontWeight: 800, fontSize: '0.75rem', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <AlertTriangle style={{ width: '12px', height: '12px' }} /> Not in Budget
                        </span>
                      )}
                    </td>

                    {/* COLUMN CELL: Mapping Visibility (Interactive Dropdown) */}
                    <td style={{ padding: '0.65rem 1rem' }}>
                      <select
                        value={row.visibility || 'both'}
                        onChange={(e) => handleVisibilityChange(row, e.target.value)}
                        style={{
                          padding: '0.35rem 0.6rem',
                          borderRadius: 'var(--radius-xs)',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          outline: 'none',
                          border: '1px solid ' + (
                            (row.visibility === 'total_range') ? 'rgba(16, 185, 129, 0.4)' :
                            (row.visibility === 'distri_range') ? 'rgba(245, 158, 11, 0.4)' :
                            'rgba(59, 130, 246, 0.4)'
                          ),
                          background: (
                            (row.visibility === 'total_range') ? 'rgba(16, 185, 129, 0.1)' :
                            (row.visibility === 'distri_range') ? 'rgba(245, 158, 11, 0.1)' :
                            'rgba(59, 130, 246, 0.1)'
                          ),
                          color: (
                            (row.visibility === 'total_range') ? '#10b981' :
                            (row.visibility === 'distri_range') ? '#f59e0b' :
                            '#3b82f6'
                          ),
                          transition: 'all 0.15s ease'
                        }}
                        title="Choose whether this division mapping applies to Both pages, Total Range FY only, or Distri Range FY only"
                      >
                        <option value="both">🌐 Both (Total & Distri)</option>
                        <option value="total_range">📊 Total Range FY Only</option>
                        <option value="distri_range">📈 Distri Range FY Only</option>
                      </select>
                    </td>

                    {/* INTERACTIVE COLUMN: IFS Matching Field */}
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
                            {row.part_no && row.part_no !== '-' && (
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

      {/* ─── MODAL 1: EXCEL UPLOAD MODAL (With Fiscal Year Selection) ─── */}
      {isUploadModalOpen && ReactDOM.createPortal(
        <div 
          onClick={(e) => { if (e.target === e.currentTarget && !uploadingExcel) setIsUploadModalOpen(false); }}
          style={{ 
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
            zIndex: 999999, background: 'rgba(0, 0, 0, 0.75)', 
            backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', padding: '1rem', boxSizing: 'border-box'
          }}
        >
          <div 
            style={{ 
              width: '100%', maxWidth: '540px', display: 'flex', flexDirection: 'column',
              background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-md)', padding: '1.75rem', boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
              gap: '1.25rem'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-xs)', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.15))', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileSpreadsheet style={{ width: '22px', height: '22px' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Upload Excel & Update Mappings
                  </h3>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Upload Excel with <strong>Sales Group</strong> and <strong>Range</strong> columns
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsUploadModalOpen(false)} 
                disabled={uploadingExcel}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-subtle)' }}
              >
                ✕
              </button>
            </div>

            {/* Fiscal Year Selector for Upload */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', background: 'var(--bg-hover)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar style={{ width: '15px', height: '15px', color: 'var(--gsh-teal)' }} />
                Select Target Fiscal Year:
              </label>
              <select
                value={uploadFiscalYear}
                onChange={e => setUploadFiscalYear(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 800, outline: 'none', cursor: 'pointer' }}
              >
                {FISCAL_YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Items will be compared and updated against <strong>{uploadFiscalYear}</strong> annual budget.
              </span>
            </div>

            {/* Instruction Banner */}
            <div style={{ padding: '0.85rem 1rem', background: 'rgba(245, 158, 11, 0.08)', borderRadius: 'var(--radius-xs)', border: '1px solid rgba(245, 158, 11, 0.25)', fontSize: '0.8rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ fontWeight: 800, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Sparkles style={{ width: '15px', height: '15px' }} /> Required 2 Columns in Excel:
              </div>
              <div style={{ color: 'var(--text-muted)', lineHeight: '1.4' }}>
                • Column 1: <strong>Sales Group</strong> (e.g. <code>ADCOCK</code>, <code>HETERO</code>, <code>UPL HETERO</code>)<br/>
                • Column 2: <strong>Range</strong> (e.g. <code>OAKNET</code>, <code>HETERO</code>, <code>UPL HETERO</code>)
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.2rem' }}>
                ℹ️ Unbudgeted Sales Groups will be marked as <strong>"Not in Budget"</strong> and permanently added to division mappings so IFS actuals map cleanly to their Range!
              </div>
            </div>

            {/* File Upload Drop Area */}
            <label 
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '2rem 1rem', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-sm)',
                background: selectedExcelFile ? 'rgba(0, 168, 150, 0.05)' : 'var(--bg-hover)',
                cursor: 'pointer', transition: 'all 0.2s ease', gap: '0.5rem'
              }}
            >
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                onChange={handleExcelFileSelect} 
                style={{ display: 'none' }} 
              />
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: selectedExcelFile ? 'rgba(0, 168, 150, 0.12)' : 'rgba(245, 158, 11, 0.12)', color: selectedExcelFile ? 'var(--gsh-teal)' : '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {selectedExcelFile ? <CheckCircle style={{ width: '26px', height: '26px' }} /> : <FileUp style={{ width: '26px', height: '26px' }} />}
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  {selectedExcelFile ? selectedExcelFile.name : 'Click to select Excel (.xlsx, .xls) file'}
                </span>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {selectedExcelFile ? `${(selectedExcelFile.size / 1024).toFixed(1)} KB — Ready to Upload & Map` : 'Only Excel spreadsheet files are supported'}
                </p>
              </div>
            </label>

            {/* Modal Footer Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button 
                type="button" 
                disabled={uploadingExcel}
                onClick={() => setIsUploadModalOpen(false)} 
                style={{ padding: '0.5rem 1.2rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                disabled={uploadingExcel || !selectedExcelFile}
                onClick={handleExcelUploadSubmit}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.4rem', fontSize: '0.85rem', fontWeight: 800, background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: 'var(--radius-xs)', color: '#fff', cursor: selectedExcelFile ? 'pointer' : 'not-allowed', opacity: selectedExcelFile ? 1 : 0.6 }}
              >
                {uploadingExcel ? <RefreshCw className="spin" style={{ width: '15px', height: '15px' }} /> : <Upload style={{ width: '15px', height: '15px' }} />}
                {uploadingExcel ? 'Updating & Mapping...' : 'Upload & Update Mappings'}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL 2: "UPLOAD NOT INCLUDE" INSPECT MODAL ─── */}
      {isNotIncludedModalOpen && ReactDOM.createPortal(
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsNotIncludedModalOpen(false); }}
          style={{ 
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
            zIndex: 999999, background: 'rgba(0, 0, 0, 0.75)', 
            backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', padding: '1rem', boxSizing: 'border-box'
          }}
        >
          <div 
            style={{ 
              width: '100%', maxWidth: '680px', maxHeight: '85vh', display: 'flex', flexDirection: 'column',
              background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-md)', padding: '1.5rem', boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
              gap: '1rem'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-xs)', background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle style={{ width: '20px', height: '20px' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Unbudgeted Products ({notInBudgetCount}) — {selectedYear}
                  </h3>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    These Sales Groups exist in Division Mappings but have no allocated budget in <strong>{selectedYear} Annual Budget</strong>.
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsNotIncludedModalOpen(false)} 
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-subtle)' }}
              >
                ✕
              </button>
            </div>

            {/* Search filter in modal */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: 'var(--text-subtle)' }} />
                <input
                  type="text"
                  placeholder="Filter missing Sales Group or Range..."
                  value={notIncludedSearch}
                  onChange={e => setNotIncludedSearch(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem 0.65rem 0.45rem 2.2rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.825rem', outline: 'none' }}
                />
              </div>
            </div>

            {/* List Table */}
            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', maxHeight: '42vh' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', textAlign: 'left' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)' }}>
                  <tr style={{ color: 'var(--text-main)', fontWeight: 800 }}>
                    <th style={{ padding: '0.6rem 0.75rem', width: '40px' }}>#</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Sales Group</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Target Range</th>
                    <th style={{ padding: '0.6rem 0.75rem', color: '#f59e0b' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mappings
                    .filter(item => item.upload_status === 'Not in Budget')
                    .filter(item => {
                      if (!notIncludedSearch.trim()) return true;
                      const s = notIncludedSearch.toLowerCase();
                      return (item.sales_group && item.sales_group.toLowerCase().includes(s)) ||
                             (item.range_name && item.range_name.toLowerCase().includes(s));
                    })
                    .map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.55rem 0.75rem', color: 'var(--text-subtle)', fontFamily: 'monospace' }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '0.55rem 0.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
                          {item.sales_group}
                        </td>
                        <td style={{ padding: '0.55rem 0.75rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--gsh-teal)', background: 'rgba(0,168,150,0.08)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                            {item.range_name}
                          </span>
                        </td>
                        <td style={{ padding: '0.55rem 0.75rem' }}>
                          <span style={{ padding: '0.15rem 0.45rem', background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', borderRadius: '4px', fontWeight: 800, fontSize: '0.72rem' }}>
                            Not in Budget
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Total: <strong>{notInBudgetCount}</strong> unbudgeted items in <strong>{selectedYear}</strong>
              </div>
              <button 
                type="button" 
                onClick={() => setIsNotIncludedModalOpen(false)} 
                style={{ padding: '0.45rem 1.2rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.825rem', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL 3: CONFIGURE IFS MATCHING FIELD & CONTRACT ─── */}
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
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Configure IFS Matching Rule
                  </h3>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Target: <strong>{editMatchingRow.sales_group}</strong> → Range: <strong>{editMatchingRow.range_name}</strong>
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setEditMatchingRow(null)} 
                disabled={savingMatching}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-subtle)' }}
              >
                ✕
              </button>
            </div>

            {/* Matching Rule Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Select Oracle IFS Extraction Field:
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
                    Pulls all IFS Invoices and Outstanding Orders where <code>CATALOG_GROUP = '{editMatchingRow.sales_group}'</code>.
                  </div>
                </div>
              </label>

              {/* Option 2: CONTRACT (Contract Code Matching) */}
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
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Building2 style={{ width: '14px', height: '14px' }} />
                    CONTRACT (Match All Records by IFS Contract Code)
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    Extracts <strong>ALL</strong> invoices & backlog lines matching this IFS Contract site.
                  </div>

                  {matchingForm.match_type === 'CONTRACT' && (
                    <div style={{ marginTop: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
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
              {/* Visibility Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.25rem' }}>
                <label style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Mapping Visibility across Dashboard Pages:
                </label>
                <select
                  value={matchingForm.visibility || 'both'}
                  onChange={e => setMatchingForm(p => ({ ...p, visibility: e.target.value }))}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-hover)',
                    color: 'var(--text-main)',
                    fontSize: '0.825rem',
                    fontWeight: 800,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="both">🌐 Both (Total Range FY & Distri Range FY)</option>
                  <option value="total_range">📊 Total Range FY Only</option>
                  <option value="distri_range">📈 Distri Range FY Only</option>
                </select>
              </div>
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
