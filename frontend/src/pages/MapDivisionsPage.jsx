import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { 
  Network, Search, Eye, 
  CheckCircle, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Hash, Layers, Tag, CheckSquare, Package, Database, DatabaseZap,
  SlidersHorizontal, Check, Settings2, X, Building2, Upload, FileSpreadsheet, AlertTriangle, FileUp, PlusCircle, Sparkles, Filter, Calendar,
  Edit3, Trash2
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

  // ─── EDIT ROW STATE ───
  const [editRowModalOpen, setEditRowModalOpen] = useState(false);
  const [editingRowData, setEditingRowData] = useState({
    id: null,
    budget_id: null,
    mapping_id: null,
    sales_group: '',
    range_name: '',
    part_no: '',
    product_sku: '',
    match_type: 'CATALOG_GROUP',
    contract_code: '',
    visibility: 'both',
    fiscal_year: 'FY 2026/27'
  });
  const [savingEditRow, setSavingEditRow] = useState(false);

  // ─── DELETE ROW STATE ───
  const [deleteRowModalOpen, setDeleteRowModalOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);
  const [deletingRow, setDeletingRow] = useState(false);

  // ─── EXCEL UPLOAD STATE ───
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedExcelFile, setSelectedExcelFile] = useState(null);
  const [uploadFiscalYear, setUploadFiscalYear] = useState('FY 2026/27');
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [isNotIncludedModalOpen, setIsNotIncludedModalOpen] = useState(false);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'budget' | 'not_in_budget'
  const [visibilityFilter, setVisibilityFilter] = useState('all'); // 'all' | 'both' | 'total_range' | 'distri_range'
  const [notIncludedSearch, setNotIncludedSearch] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addActiveTab, setAddActiveTab] = useState('sales_group'); // 'sales_group' | 'range'
  const [addSalesGroupForm, setAddSalesGroupForm] = useState({
    sales_group: '',
    range_name: '',
    fiscal_year: 'FY 2026/27',
    part_no: '',
    product_sku: '',
    match_type: 'CATALOG_GROUP',
    contract_code: '',
    visibility: 'both'
  });
  const [addRangeForm, setAddRangeForm] = useState({
    range_name: '',
    sales_group: '',
    fiscal_year: 'FY 2026/27'
  });
  const [savingAdd, setSavingAdd] = useState(false);

  // ─── UNMAPPED IFS SALES GROUPS & ITEMS STATE ───
  const [unmappedIfsSummary, setUnmappedIfsSummary] = useState({
    total_unmapped_groups: 0,
    total_unmapped_items: 0,
    total_unmapped_value: 0,
    groups: []
  });
  const [isUnmappedIfsModalOpen, setIsUnmappedIfsModalOpen] = useState(false);
  const [unmappedIfsTab, setUnmappedIfsTab] = useState('groups'); // 'groups' | 'items'
  const [unmappedIfsItems, setUnmappedIfsItems] = useState([]);
  const [unmappedIfsTotalCount, setUnmappedIfsTotalCount] = useState(0);
  const [unmappedIfsLoading, setUnmappedIfsLoading] = useState(false);
  const [unmappedIfsGroupFilter, setUnmappedIfsGroupFilter] = useState('all');
  const [unmappedIfsContractFilter, setUnmappedIfsContractFilter] = useState('all');
  const [unmappedIfsSearch, setUnmappedIfsSearch] = useState('');
  const [unmappedIfsPage, setUnmappedIfsPage] = useState(1);
  const [unmappedIfsPageSize, setUnmappedIfsPageSize] = useState(25);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadMappings = async (yearToLoad = selectedYear) => {
    setLoading(true);
    try {
      const [resMap, resStats, resContracts, resUnmapped] = await Promise.all([
        api.get('/division-mappings', { params: { search: searchTerm, year: yearToLoad } }),
        api.get('/division-mappings/stats', { params: { year: yearToLoad } }),
        api.get('/division-mappings/contracts'),
        api.get('/division-mappings/unmapped-ifs-summary')
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
      if (resUnmapped.data && resUnmapped.data.status === 'success') {
        setUnmappedIfsSummary(resUnmapped.data);
      }
    } catch {
      showToast('Failed to load division mappings.', 'error');
    }
    setLoading(false);
  };

  const loadUnmappedIfsItems = async (
    group = unmappedIfsGroupFilter,
    search = unmappedIfsSearch,
    contract = unmappedIfsContractFilter,
    page = unmappedIfsPage,
    limit = unmappedIfsPageSize
  ) => {
    setUnmappedIfsLoading(true);
    try {
      const res = await api.get('/division-mappings/unmapped-ifs-items', {
        params: {
          group: group === 'all' ? undefined : group,
          search: search.trim() || undefined,
          contract: contract === 'all' ? undefined : contract,
          page: page,
          limit: limit
        }
      });
      if (res.data && res.data.status === 'success') {
        setUnmappedIfsItems(res.data.items || []);
        setUnmappedIfsTotalCount(res.data.total_count || 0);
      }
    } catch {
      showToast('Failed to load unmapped IFS items.', 'error');
    }
    setUnmappedIfsLoading(false);
  };

  const filteredUnmappedGroups = useMemo(() => {
    if (!unmappedIfsSummary || !unmappedIfsSummary.groups) return [];
    if (!unmappedIfsSearch.trim()) return unmappedIfsSummary.groups;
    const term = unmappedIfsSearch.trim().toLowerCase();
    return unmappedIfsSummary.groups.filter(g =>
      (g.sales_group && g.sales_group.toLowerCase().includes(term)) ||
      (g.contracts && g.contracts.toLowerCase().includes(term))
    );
  }, [unmappedIfsSummary, unmappedIfsSearch]);

  useEffect(() => {
    if (isUnmappedIfsModalOpen && unmappedIfsTab === 'items') {
      const timer = setTimeout(() => {
        loadUnmappedIfsItems(unmappedIfsGroupFilter, unmappedIfsSearch, unmappedIfsContractFilter, unmappedIfsPage, unmappedIfsPageSize);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isUnmappedIfsModalOpen, unmappedIfsSearch, unmappedIfsGroupFilter, unmappedIfsContractFilter, unmappedIfsPage, unmappedIfsPageSize, unmappedIfsTab]);

  const handleOpenUnmappedModal = (initialGroup = 'all', initialTab = 'groups') => {
    setUnmappedIfsGroupFilter(initialGroup);
    setUnmappedIfsTab(initialTab);
    setUnmappedIfsSearch('');
    setUnmappedIfsPage(1);
    setIsUnmappedIfsModalOpen(true);
  };

  const handleQuickMapFromUnmapped = (groupName) => {
    setIsUnmappedIfsModalOpen(false);
    setAddSalesGroupForm({
      sales_group: groupName,
      range_name: uniqueRanges.length > 0 ? uniqueRanges[0] : '',
      fiscal_year: selectedYear,
      part_no: '',
      product_sku: '',
      match_type: 'CATALOG_GROUP',
      contract_code: '',
      visibility: 'both'
    });
    setAddActiveTab('sales_group');
    setIsAddModalOpen(true);
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

  // ─── EDIT ROW HANDLERS ───
  const openEditRowModal = (row) => {
    setEditingRowData({
      id: row.id || row.budget_id,
      budget_id: row.budget_id || row.id,
      mapping_id: row.mapping_id,
      sales_group: row.sales_group || '',
      range_name: row.range_name || '',
      part_no: row.part_no || '',
      product_sku: row.product_sku || '',
      match_type: row.match_type || 'CATALOG_GROUP',
      contract_code: row.contract_code || '',
      visibility: row.visibility || 'both',
      fiscal_year: row.fiscal_year || selectedYear || 'FY 2026/27'
    });
    setEditRowModalOpen(true);
  };

  const handleSaveEditRow = async (e) => {
    if (e) e.preventDefault();
    if (!editingRowData.sales_group.trim() || !editingRowData.range_name.trim()) {
      showToast('Sales Group and Range Name are required!', 'error');
      return;
    }
    setSavingEditRow(true);
    try {
      const res = await api.put('/division-mappings/edit-row', editingRowData);
      if (res.data) {
        showToast(res.data.message || 'Mapping updated successfully!');
        setEditRowModalOpen(false);
        loadMappings(selectedYear);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to update mapping.';
      showToast(msg, 'error');
    }
    setSavingEditRow(false);
  };

  // ─── DELETE ROW HANDLERS ───
  const openDeleteRowModal = (row) => {
    setRowToDelete(row);
    setDeleteRowModalOpen(true);
  };

  const handleConfirmDeleteRow = async () => {
    if (!rowToDelete) return;
    setDeletingRow(true);
    try {
      const rowId = rowToDelete.id || rowToDelete.budget_id || rowToDelete.mapping_id;
      const res = await api.delete(`/division-mappings/delete-row/${rowId}`);
      if (res.data) {
        showToast(res.data.message || `Record for '${rowToDelete.sales_group}' deleted successfully!`);
        setDeleteRowModalOpen(false);
        setRowToDelete(null);
        loadMappings(selectedYear);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to delete record.';
      showToast(msg, 'error');
    }
    setDeletingRow(false);
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

  const handleOpenAddModal = () => {
    setAddSalesGroupForm({
      sales_group: '',
      range_name: uniqueRanges.length > 0 ? uniqueRanges[0] : '',
      fiscal_year: selectedYear,
      part_no: '',
      product_sku: '',
      match_type: 'CATALOG_GROUP',
      contract_code: '',
      visibility: 'both'
    });
    setAddRangeForm({
      range_name: '',
      sales_group: '',
      fiscal_year: selectedYear
    });
    setAddActiveTab('sales_group');
    setIsAddModalOpen(true);
  };

  const handleSaveAddSalesGroup = async (e) => {
    if (e) e.preventDefault();
    if (!addSalesGroupForm.sales_group.trim()) {
      showToast('Sales Group name is required!', 'error');
      return;
    }
    if (!addSalesGroupForm.range_name.trim()) {
      showToast('Please select or specify a Range name!', 'error');
      return;
    }

    setSavingAdd(true);
    try {
      const res = await api.post('/division-mappings', addSalesGroupForm);
      if (res.data) {
        showToast(res.data.message || `✅ Sales Group '${addSalesGroupForm.sales_group}' mapped to '${addSalesGroupForm.range_name}'!`);
        setIsAddModalOpen(false);
        loadMappings(addSalesGroupForm.fiscal_year || selectedYear);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to save sales group mapping.';
      showToast(msg, 'error');
    }
    setSavingAdd(false);
  };

  const handleSaveAddRange = async (e) => {
    if (e) e.preventDefault();
    if (!addRangeForm.range_name.trim()) {
      showToast('Range name is required!', 'error');
      return;
    }

    setSavingAdd(true);
    try {
      const res = await api.post('/division-mappings/add-range', addRangeForm);
      if (res.data) {
        showToast(res.data.message || `✅ New Range '${addRangeForm.range_name}' registered successfully!`);
        setIsAddModalOpen(false);
        loadMappings(addRangeForm.fiscal_year || selectedYear);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to add new range.';
      showToast(msg, 'error');
    }
    setSavingAdd(false);
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>
          
          {/* Left Column: Title, Description, and Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minWidth: '320px' }}>
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

            {/* Action Buttons: Add Mapping, Excel Upload & Auto-Sync */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              
              {/* BUTTON: Add New Mapping / Range */}
              <button
                onClick={handleOpenAddModal}
                className="btn btn-primary"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 1rem',
                  fontSize: '0.82rem', fontWeight: 800, background: 'var(--accent-gradient, linear-gradient(135deg, #c8102e, #990011))',
                  border: 'none', borderRadius: 'var(--radius-xs)', color: '#fff', boxShadow: '0 4px 12px rgba(200, 16, 46, 0.3)',
                  cursor: 'pointer'
                }}
                title="Add a new Sales Group mapping or create a new Division Range"
              >
                <PlusCircle style={{ width: '16px', height: '16px' }} />
                ➕ Add New Mapping
              </button>

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

          {/* Right Column: Interactive Unmapped IFS Sales Groups Card */}
          <div
            onClick={() => handleOpenUnmappedModal('all', 'groups')}
            style={{
              cursor: 'pointer',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(245, 158, 11, 0.08))',
              border: '1.5px solid rgba(239, 68, 68, 0.35)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.85rem 1.15rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.9rem',
              transition: 'all 0.25s ease',
              boxShadow: '0 4px 16px rgba(239, 68, 68, 0.1)',
              minWidth: '280px'
            }}
            className="hover-card"
            title="Click to view all 24 Sales Groups present in IFS Oracle Invoices that are NOT yet mapped in this page"
          >
            <div style={{
              width: '42px', height: '42px', borderRadius: 'var(--radius-xs)',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)', flexShrink: 0
            }}>
              <AlertTriangle style={{ width: '22px', height: '22px' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#ef4444' }}>
                  IFS ORACLE UNMAPPED
                </span>
                <span style={{
                  fontSize: '0.68rem', fontWeight: 800, background: '#ef4444', color: '#fff',
                  padding: '0.15rem 0.45rem', borderRadius: '12px'
                }}>
                  {unmappedIfsSummary.total_unmapped_groups || 0}
                </span>
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                {unmappedIfsSummary.total_unmapped_groups || 0} <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Groups in IFS only</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <span>{unmappedIfsSummary.total_unmapped_items || 0} Products</span>
                <span style={{ color: 'var(--gsh-teal)', fontWeight: 700 }}>View IFS Items →</span>
              </div>
            </div>
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
      <div className="glass-card table-glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="main-table-scroll-wrapper" style={{ overflowX: 'auto', overflowY: 'auto' }}>
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
                <th style={{ padding: '0.75rem 1rem', width: '130px' }}>Last Updated</th>
                <th style={{ padding: '0.75rem 1rem', width: '140px', textAlign: 'center', color: 'var(--text-main)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading division mappings & budget master records...
                  </td>
                </tr>
              ) : paginatedMappings.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
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
                          Rule
                        </button>
                      </div>
                    </td>

                    {/* Last Updated */}
                    <td style={{ padding: '0.65rem 1rem', color: 'var(--text-subtle)', fontSize: '0.8rem' }}>
                      {row.updated_at || 'Auto System'}
                    </td>

                    {/* ACTION COLUMN */}
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                        <button
                          onClick={() => openEditRowModal(row)}
                          title="Edit Division Mapping & Item Details"
                          style={{
                            padding: '0.3rem 0.6rem',
                            background: 'rgba(0, 168, 150, 0.1)',
                            border: '1px solid rgba(0, 168, 150, 0.3)',
                            borderRadius: 'var(--radius-xs)',
                            color: 'var(--gsh-teal)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'var(--gsh-teal)';
                            e.currentTarget.style.color = '#fff';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(0, 168, 150, 0.1)';
                            e.currentTarget.style.color = 'var(--gsh-teal)';
                          }}
                        >
                          <Edit3 style={{ width: '13px', height: '13px' }} />
                          Edit
                        </button>

                        <button
                          onClick={() => openDeleteRowModal(row)}
                          title="Delete / Remove Mapping Record"
                          style={{
                            padding: '0.3rem 0.5rem',
                            background: 'rgba(200, 16, 46, 0.08)',
                            border: '1px solid rgba(200, 16, 46, 0.25)',
                            borderRadius: 'var(--radius-xs)',
                            color: 'var(--gsh-red)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'var(--gsh-red)';
                            e.currentTarget.style.color = '#fff';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(200, 16, 46, 0.08)';
                            e.currentTarget.style.color = 'var(--gsh-red)';
                          }}
                        >
                          <Trash2 style={{ width: '13px', height: '13px' }} />
                        </button>
                      </div>
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

      {/* ─── MODAL 0: ADD NEW MAPPING / RANGE POPUP MODAL ─── */}
      {isAddModalOpen && ReactDOM.createPortal(
        <div 
          onClick={(e) => { if (e.target === e.currentTarget && !savingAdd) setIsAddModalOpen(false); }}
          style={{ 
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
            zIndex: 999999, background: 'rgba(0, 0, 0, 0.75)', 
            backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', padding: '1rem', boxSizing: 'border-box'
          }}
        >
          <div 
            style={{ 
              width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column',
              background: 'var(--bg-card, #ffffff)', border: '1.5px solid var(--gsh-red, #c8102e)', 
              borderRadius: 'var(--radius-md)', padding: '1.75rem', boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
              gap: '1.25rem'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-xs)', background: 'rgba(200, 16, 46, 0.12)', color: 'var(--gsh-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PlusCircle style={{ width: '22px', height: '22px' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Add Division Master Entry
                  </h3>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Add a new <strong>Sales Group</strong> with Range mapping, or register a new <strong>Range</strong> category.
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsAddModalOpen(false)} 
                disabled={savingAdd}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-subtle)' }}
              >
                ✕
              </button>
            </div>

            {/* ─── SEGMENTED TAB BUTTONS (Sales Group vs Range) ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'var(--bg-hover)', padding: '0.35rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={() => setAddActiveTab('sales_group')}
                style={{
                  padding: '0.6rem 0.75rem',
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  background: addActiveTab === 'sales_group' ? 'var(--accent-gradient, linear-gradient(135deg, #c8102e, #990011))' : 'transparent',
                  color: addActiveTab === 'sales_group' ? '#ffffff' : 'var(--text-main)',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  boxShadow: addActiveTab === 'sales_group' ? '0 4px 12px rgba(200, 16, 46, 0.25)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Layers style={{ width: '16px', height: '16px' }} />
                Sales Group
              </button>

              <button
                type="button"
                onClick={() => setAddActiveTab('range')}
                style={{
                  padding: '0.6rem 0.75rem',
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  background: addActiveTab === 'range' ? 'var(--gsh-teal, #00a896)' : 'transparent',
                  color: addActiveTab === 'range' ? '#ffffff' : 'var(--text-main)',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  boxShadow: addActiveTab === 'range' ? '0 4px 12px rgba(0, 168, 150, 0.25)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Tag style={{ width: '16px', height: '16px' }} />
                Range
              </button>
            </div>

            {/* ─── TAB 1: ADD SALES GROUP FORM ─── */}
            {addActiveTab === 'sales_group' && (
              <form onSubmit={handleSaveAddSalesGroup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem', background: 'var(--bg-hover)', padding: '1rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
                  
                  {/* Sales Group Name */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--gsh-red)' }}>
                      Sales Group Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CARDIO 01, HETERO, ADCOCK"
                      value={addSalesGroupForm.sales_group}
                      onChange={e => setAddSalesGroupForm(p => ({ ...p, sales_group: e.target.value }))}
                      style={{ padding: '0.5rem 0.65rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 700 }}
                    />
                  </div>

                  {/* Select Range (Dropdown + Custom) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--gsh-teal)' }}>
                      Select Range (Map to Parent Division) *
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select
                        value={addSalesGroupForm.range_name}
                        onChange={e => setAddSalesGroupForm(p => ({ ...p, range_name: e.target.value }))}
                        style={{ flex: 1, padding: '0.5rem 0.65rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 800, outline: 'none' }}
                      >
                        <option value="">-- Select Existing Range --</option>
                        {uniqueRanges.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Or Type New Range"
                        value={addSalesGroupForm.range_name}
                        onChange={e => setAddSalesGroupForm(p => ({ ...p, range_name: e.target.value }))}
                        style={{ width: '180px', padding: '0.5rem 0.65rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 700 }}
                      />
                    </div>
                  </div>

                  {/* Fiscal Year */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-main)' }}>Fiscal Year</label>
                    <select
                      value={addSalesGroupForm.fiscal_year}
                      onChange={e => setAddSalesGroupForm(p => ({ ...p, fiscal_year: e.target.value }))}
                      style={{ padding: '0.5rem 0.65rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.825rem', fontWeight: 700 }}
                    >
                      {FISCAL_YEARS.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  {/* Mapping Visibility */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#10b981' }}>Mapping Visibility</label>
                    <select
                      value={addSalesGroupForm.visibility}
                      onChange={e => setAddSalesGroupForm(p => ({ ...p, visibility: e.target.value }))}
                      style={{ padding: '0.5rem 0.65rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.825rem', fontWeight: 700 }}
                    >
                      <option value="both">🌐 Both (Total & Distri)</option>
                      <option value="total_range">📊 Total Range FY Only</option>
                      <option value="distri_range">📈 Distri Range FY Only</option>
                    </select>
                  </div>

                  {/* Part No (Optional) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-main)' }}>Part No (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. CC001"
                      value={addSalesGroupForm.part_no}
                      onChange={e => setAddSalesGroupForm(p => ({ ...p, part_no: e.target.value }))}
                      style={{ padding: '0.5rem 0.65rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.825rem', fontFamily: 'monospace' }}
                    />
                  </div>

                  {/* Product SKU (Optional) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-main)' }}>Product SKU / Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Product Line / Item Description"
                      value={addSalesGroupForm.product_sku}
                      onChange={e => setAddSalesGroupForm(p => ({ ...p, product_sku: e.target.value }))}
                      style={{ padding: '0.5rem 0.65rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.825rem' }}
                    />
                  </div>

                  {/* IFS Matching Rule */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#3b82f6' }}>IFS Matching Field & Rule</label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <select
                        value={addSalesGroupForm.match_type}
                        onChange={e => setAddSalesGroupForm(p => ({ ...p, match_type: e.target.value }))}
                        style={{ flex: 1, padding: '0.5rem 0.65rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.825rem', fontWeight: 700 }}
                      >
                        <option value="CATALOG_GROUP">CATALOG_GROUP (Match Oracle Catalog Group by Sales Group Name)</option>
                        <option value="CONTRACT">CONTRACT (Match all records by IFS Contract Site)</option>
                        <option value="CATALOG_NO">CATALOG_NO (Direct Part No / SKU Match)</option>
                      </select>

                      {addSalesGroupForm.match_type === 'CONTRACT' && (
                        <select
                          value={addSalesGroupForm.contract_code}
                          onChange={e => setAddSalesGroupForm(p => ({ ...p, contract_code: e.target.value }))}
                          style={{ width: '150px', padding: '0.5rem 0.65rem', borderRadius: '4px', border: '1px solid #8b5cf6', background: 'rgba(139,92,246,0.08)', color: '#8b5cf6', fontSize: '0.825rem', fontWeight: 800 }}
                        >
                          <option value="">-- Contract --</option>
                          {availableContracts.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
                  <button 
                    type="button" 
                    disabled={savingAdd}
                    onClick={() => setIsAddModalOpen(false)} 
                    style={{ padding: '0.5rem 1.2rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={savingAdd}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.4rem', fontSize: '0.85rem', fontWeight: 800, background: 'var(--accent-gradient, linear-gradient(135deg, #c8102e, #990011))', border: 'none', borderRadius: 'var(--radius-xs)', color: '#fff', cursor: 'pointer', boxShadow: '0 4px 14px rgba(200,16,46,0.3)' }}
                  >
                    {savingAdd ? <RefreshCw className="spin" style={{ width: '15px', height: '15px' }} /> : <Check style={{ width: '15px', height: '15px' }} />}
                    Save Sales Group Mapping
                  </button>
                </div>
              </form>
            )}

            {/* ─── TAB 2: ADD RANGE FORM ─── */}
            {addActiveTab === 'range' && (
              <form onSubmit={handleSaveAddRange} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', background: 'var(--bg-hover)', padding: '1rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
                  
                  {/* Range Name */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--gsh-teal)' }}>
                      New Division Range Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SURGICAL CONSUMABLES, ALPAYA, OAKNET"
                      value={addRangeForm.range_name}
                      onChange={e => setAddRangeForm(p => ({ ...p, range_name: e.target.value }))}
                      style={{ padding: '0.55rem 0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 800 }}
                    />
                  </div>

                  {/* Target Fiscal Year */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-main)' }}>Target Fiscal Year</label>
                    <select
                      value={addRangeForm.fiscal_year}
                      onChange={e => setAddRangeForm(p => ({ ...p, fiscal_year: e.target.value }))}
                      style={{ padding: '0.5rem 0.65rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.825rem', fontWeight: 700 }}
                    >
                      {FISCAL_YEARS.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  {/* Info Notice Box */}
                  <div style={{ padding: '0.75rem 0.9rem', background: 'rgba(0,168,150,0.08)', border: '1px solid rgba(0,168,150,0.25)', borderRadius: '4px', fontSize: '0.78rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                    <strong style={{ color: 'var(--gsh-teal)' }}>📌 Official Parent Division Range:</strong>
                    <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)' }}>
                      Adding this Range registers it in the master hierarchy. You can then map multiple Sales Groups into this Range category across all reports and dashboards.
                    </p>
                  </div>

                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
                  <button 
                    type="button" 
                    disabled={savingAdd}
                    onClick={() => setIsAddModalOpen(false)} 
                    style={{ padding: '0.5rem 1.2rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={savingAdd}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.4rem', fontSize: '0.85rem', fontWeight: 800, background: 'var(--gsh-teal, #00a896)', border: 'none', borderRadius: 'var(--radius-xs)', color: '#fff', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,168,150,0.3)' }}
                  >
                    {savingAdd ? <RefreshCw className="spin" style={{ width: '15px', height: '15px' }} /> : <Check style={{ width: '15px', height: '15px' }} />}
                    Save New Range
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL 5: UNMAPPED IFS SALES GROUPS & ITEMS MODAL ─── */}
      {isUnmappedIfsModalOpen && ReactDOM.createPortal(
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsUnmappedIfsModalOpen(false); }}
          style={{ 
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
            zIndex: 999999, background: 'rgba(0, 0, 0, 0.75)', 
            backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', padding: '1rem', boxSizing: 'border-box'
          }}
        >
          <div 
            style={{ 
              width: '100%', maxWidth: '1150px', maxHeight: '92vh', display: 'flex', flexDirection: 'column',
              background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-md)', padding: '1.5rem', boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-xs)', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(239,68,68,0.3)' }}>
                  <AlertTriangle style={{ width: '22px', height: '22px' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    IFS Unmapped Sales Groups & Item Pricing
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, background: 'rgba(239,68,68,0.12)', color: '#ef4444', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                      {unmappedIfsSummary.total_unmapped_groups || 0} Groups Pending
                    </span>
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    These Sales Groups exist in <strong>IFS Oracle Invoice Output</strong> but are not yet mapped in Division Mappings.
                  </p>
                </div>
              </div>

              <button 
                type="button" 
                onClick={() => setIsUnmappedIfsModalOpen(false)} 
                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', cursor: 'pointer', color: 'var(--text-subtle)' }}
              >
                ✕
              </button>
            </div>

            {/* 3 Metric Summary Banner inside Modal */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', margin: '1rem 0' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-xs)', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Layers style={{ width: '28px', height: '28px', color: '#ef4444' }} />
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase' }}>Unmapped Groups</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>{unmappedIfsSummary.total_unmapped_groups || 0} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Groups</span></div>
                </div>
              </div>

              <div style={{ background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: 'var(--radius-xs)', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Package style={{ width: '28px', height: '28px', color: '#3b82f6' }} />
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase' }}>Total Unmapped Items</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>{unmappedIfsSummary.total_unmapped_items?.toLocaleString() || 0} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Products</span></div>
                </div>
              </div>

              <div style={{ background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 'var(--radius-xs)', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <DatabaseZap style={{ width: '28px', height: '28px', color: '#10b981' }} />
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>Total Invoiced Sales Value</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Rs. {((unmappedIfsSummary.total_unmapped_value || 0) / 1000000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mn</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Tabs Header & Search Bar on the SAME line */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              
              {/* Left: Tab Switcher Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setUnmappedIfsTab('groups')}
                  style={{
                    padding: '0.45rem 1rem',
                    fontSize: '0.825rem',
                    fontWeight: 800,
                    borderRadius: 'var(--radius-xs)',
                    border: 'none',
                    background: unmappedIfsTab === 'groups' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'var(--bg-hover)',
                    color: unmappedIfsTab === 'groups' ? '#ffffff' : 'var(--text-main)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: unmappedIfsTab === 'groups' ? '0 4px 12px rgba(239,68,68,0.25)' : 'none'
                  }}
                >
                  <Layers style={{ width: '15px', height: '15px' }} />
                  Group Overview ({unmappedIfsSummary.groups?.length || 0})
                </button>

                <button
                  type="button"
                  onClick={() => setUnmappedIfsTab('items')}
                  style={{
                    padding: '0.45rem 1rem',
                    fontSize: '0.825rem',
                    fontWeight: 800,
                    borderRadius: 'var(--radius-xs)',
                    border: 'none',
                    background: unmappedIfsTab === 'items' ? 'linear-gradient(135deg, var(--gsh-teal, #00a896), #028072)' : 'var(--bg-hover)',
                    color: unmappedIfsTab === 'items' ? '#ffffff' : 'var(--text-main)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: unmappedIfsTab === 'items' ? '0 4px 12px rgba(0,168,150,0.25)' : 'none'
                  }}
                >
                  <Package style={{ width: '15px', height: '15px' }} />
                  Item & Pricing Breakdown ({unmappedIfsTotalCount || unmappedIfsSummary.total_unmapped_items || 0})
                </button>
              </div>

              {/* Right: Search Bar on the SAME line as the Tabs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-hover)', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-xs)', padding: '0.4rem 0.8rem', minWidth: '320px', maxWidth: '420px', flex: 1 }}>
                <Search style={{ width: '16px', height: '16px', color: 'var(--gsh-teal)' }} />
                <input
                  type="text"
                  placeholder={unmappedIfsTab === 'groups' ? "Search IFS Sales Group or Contract..." : "Search Item Code, Product Name, or Sales Group..."}
                  value={unmappedIfsSearch}
                  onChange={(e) => {
                    setUnmappedIfsSearch(e.target.value);
                    setUnmappedIfsPage(1);
                  }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.85rem', width: '100%', outline: 'none', fontWeight: 600 }}
                />
                {unmappedIfsSearch && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setUnmappedIfsSearch('');
                      setUnmappedIfsPage(1);
                    }} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem', padding: 0 }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* TAB 1: GROUP OVERVIEW */}
            {unmappedIfsTab === 'groups' && (
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.85rem' }}>
                  {filteredUnmappedGroups.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No unmapped IFS Sales Groups found matching "{unmappedIfsSearch}".
                    </div>
                  ) : (
                    filteredUnmappedGroups.map((grp, idx) => (
                      <div 
                        key={idx}
                        style={{
                          background: 'var(--bg-hover)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-xs)',
                          padding: '1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.75rem',
                          position: 'relative'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{
                            fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)',
                            background: 'rgba(239, 68, 68, 0.1)', padding: '0.25rem 0.6rem',
                            borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.25)'
                          }}>
                            {grp.sales_group}
                          </span>

                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                            {grp.contracts}
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.65rem 0.8rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Products / Items</div>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#3b82f6' }}>{grp.item_count} items</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Invoices</div>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>{grp.invoice_count}</div>
                          </div>
                          <div style={{ gridColumn: 'span 2', borderTop: '1px dashed var(--border-color)', paddingTop: '0.4rem', marginTop: '0.2rem' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Invoiced Sales Value</div>
                            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#10b981' }}>
                              Rs. {grp.total_net_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.35rem' }}>
                                ({(grp.total_net_amount / 1000000).toFixed(2)} Mn)
                              </span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setUnmappedIfsGroupFilter(grp.sales_group);
                              setUnmappedIfsTab('items');
                            }}
                            style={{
                              flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.78rem', fontWeight: 700,
                              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                              borderRadius: '4px', color: 'var(--text-main)', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem'
                            }}
                          >
                            <Eye style={{ width: '13px', height: '13px', color: 'var(--gsh-teal)' }} />
                            View Items & Prices
                          </button>

                          <button
                            type="button"
                            onClick={() => handleQuickMapFromUnmapped(grp.sales_group)}
                            style={{
                              padding: '0.45rem 0.85rem', fontSize: '0.78rem', fontWeight: 800,
                              background: 'linear-gradient(135deg, #c8102e, #990011)', border: 'none',
                              borderRadius: '4px', color: '#fff', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                              boxShadow: '0 2px 8px rgba(200, 16, 46, 0.25)'
                            }}
                          >
                            <PlusCircle style={{ width: '13px', height: '13px' }} />
                            + Map
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: ITEM LEVEL & PRICE BREAKDOWN */}
            {unmappedIfsTab === 'items' && (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                
                {/* Secondary Filters Toolbar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    
                    {/* Filter by Sales Group */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>Group:</label>
                      <select
                        value={unmappedIfsGroupFilter}
                        onChange={(e) => {
                          setUnmappedIfsGroupFilter(e.target.value);
                          setUnmappedIfsPage(1);
                        }}
                        style={{ padding: '0.45rem 0.65rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-hover)', color: 'var(--text-main)', fontSize: '0.825rem', fontWeight: 700 }}
                      >
                        <option value="all">All Unmapped Groups ({unmappedIfsSummary.groups?.length || 0})</option>
                        {(unmappedIfsSummary.groups || []).map(g => (
                          <option key={g.sales_group} value={g.sales_group}>
                            {g.sales_group} ({g.item_count} items)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Filter by Contract */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>Contract:</label>
                      <select
                        value={unmappedIfsContractFilter}
                        onChange={(e) => {
                          setUnmappedIfsContractFilter(e.target.value);
                          setUnmappedIfsPage(1);
                        }}
                        style={{ padding: '0.45rem 0.65rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-hover)', color: 'var(--text-main)', fontSize: '0.825rem', fontWeight: 700 }}
                      >
                        <option value="all">All Contracts</option>
                        {availableContracts.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Refresh */}
                  <button
                    type="button"
                    onClick={() => loadUnmappedIfsItems(unmappedIfsGroupFilter, unmappedIfsSearch, unmappedIfsContractFilter, unmappedIfsPage, unmappedIfsPageSize)}
                    style={{ padding: '0.45rem 0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-hover)', color: 'var(--text-main)', fontSize: '0.825rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <RefreshCw className={unmappedIfsLoading ? "spin" : ""} style={{ width: '14px', height: '14px' }} />
                    Refresh
                  </button>
                </div>

                {/* Items Table */}
                <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                      <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                        <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--text-muted)', width: '120px' }}>IFS SALES GROUP</th>
                        <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--text-muted)', width: '110px' }}>ITEM CODE</th>
                        <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>PRODUCT DESCRIPTION</th>
                        <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--text-muted)', width: '80px' }}>CONTRACT</th>
                        <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--text-muted)', width: '105px' }}>INVOICE DATE</th>
                        <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--text-muted)', textAlign: 'right', width: '90px' }}>QTY SOLD</th>
                        <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--text-muted)', textAlign: 'right', width: '130px' }}>UNIT PRICE (LKR)</th>
                        <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--text-muted)', textAlign: 'right', width: '150px' }}>TOTAL SALES (LKR)</th>
                        <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: 'var(--text-muted)', textAlign: 'center', width: '90px' }}>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unmappedIfsLoading ? (
                        <tr>
                          <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            <RefreshCw className="spin" style={{ width: '24px', height: '24px', margin: '0 auto 0.5rem auto', display: 'block', color: 'var(--gsh-teal)' }} />
                            Loading unmapped IFS items & price details...
                          </td>
                        </tr>
                      ) : unmappedIfsItems.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            No unmapped items found matching the selected filter.
                          </td>
                        </tr>
                      ) : (
                        unmappedIfsItems.map((it, idx) => (
                          <tr 
                            key={idx}
                            style={{ 
                              borderBottom: '1px solid var(--border-color)',
                              background: idx % 2 === 0 ? 'transparent' : 'var(--bg-hover)'
                            }}
                          >
                            <td style={{ padding: '0.55rem 0.75rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 800, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.2rem 0.45rem', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                                {it.sales_group}
                              </span>
                            </td>
                            <td style={{ padding: '0.55rem 0.75rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'monospace' }}>
                              {it.catalog_no}
                            </td>
                            <td style={{ padding: '0.55rem 0.75rem', color: 'var(--text-main)', fontWeight: 600 }}>
                              {it.description}
                            </td>
                            <td style={{ padding: '0.55rem 0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                              {it.contract || '-'}
                            </td>
                            <td style={{ padding: '0.55rem 0.75rem', color: 'var(--text-subtle)', fontWeight: 700, whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                              <span style={{ background: 'rgba(0, 168, 150, 0.08)', color: 'var(--gsh-teal)', padding: '0.15rem 0.4rem', borderRadius: '3px', border: '1px solid rgba(0, 168, 150, 0.2)' }}>
                                {it.invoice_date || it.last_invoice_date || '-'}
                              </span>
                            </td>
                            <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-main)' }}>
                              {it.total_qty.toLocaleString()}
                            </td>
                            <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: 800, color: '#3b82f6' }}>
                              Rs. {it.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: 800, color: '#10b981' }}>
                              Rs. {it.total_net_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '0.55rem 0.75rem', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleQuickMapFromUnmapped(it.sales_group)}
                                style={{
                                  padding: '0.3rem 0.6rem', fontSize: '0.72rem', fontWeight: 800,
                                  background: 'linear-gradient(135deg, #c8102e, #990011)', border: 'none',
                                  borderRadius: '3px', color: '#fff', cursor: 'pointer',
                                  display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
                                }}
                                title={`Map Sales Group '${it.sales_group}' to a Division Range`}
                              >
                                <PlusCircle style={{ width: '11px', height: '11px' }} /> Map
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Items Pagination Controls */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Showing {unmappedIfsItems.length > 0 ? (unmappedIfsPage - 1) * unmappedIfsPageSize + 1 : 0} to {Math.min(unmappedIfsPage * unmappedIfsPageSize, unmappedIfsTotalCount)} of {unmappedIfsTotalCount} products
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button
                      type="button"
                      disabled={unmappedIfsPage <= 1}
                      onClick={() => setUnmappedIfsPage(p => Math.max(1, p - 1))}
                      style={{ padding: '0.35rem 0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-hover)', color: 'var(--text-main)', fontSize: '0.78rem', fontWeight: 700, cursor: unmappedIfsPage <= 1 ? 'not-allowed' : 'pointer', opacity: unmappedIfsPage <= 1 ? 0.5 : 1 }}
                    >
                      ◀ Previous
                    </button>
                    
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '0 0.5rem', color: 'var(--text-main)' }}>
                      Page {unmappedIfsPage} of {Math.ceil(unmappedIfsTotalCount / unmappedIfsPageSize) || 1}
                    </span>

                    <button
                      type="button"
                      disabled={unmappedIfsPage >= Math.ceil(unmappedIfsTotalCount / unmappedIfsPageSize)}
                      onClick={() => setUnmappedIfsPage(p => p + 1)}
                      style={{ padding: '0.35rem 0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-hover)', color: 'var(--text-main)', fontSize: '0.78rem', fontWeight: 700, cursor: unmappedIfsPage >= Math.ceil(unmappedIfsTotalCount / unmappedIfsPageSize) ? 'not-allowed' : 'pointer', opacity: unmappedIfsPage >= Math.ceil(unmappedIfsTotalCount / unmappedIfsPageSize) ? 0.5 : 1 }}
                    >
                      Next ▶
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', marginTop: '0.75rem' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles style={{ width: '14px', height: '14px', color: 'var(--gsh-teal)' }} />
                Click <strong>+ Map</strong> to quickly assign any IFS Sales Group to an official Division Range.
              </div>

              <button 
                type="button" 
                onClick={() => setIsUnmappedIfsModalOpen(false)} 
                style={{ padding: '0.5rem 1.4rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Close
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

      {/* ─── MODAL 5: EDIT ROW MODAL ─── */}
      {editRowModalOpen && ReactDOM.createPortal(
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setEditRowModalOpen(false); }}
          style={{ 
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
            zIndex: 999999, background: 'rgba(0, 0, 0, 0.75)', 
            backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', padding: '1rem', boxSizing: 'border-box'
          }}
        >
          <div 
            style={{ 
              width: '100%', maxWidth: '640px', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
              background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-md)', padding: '1.75rem', boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(0, 168, 150, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gsh-teal)' }}>
                  <Edit3 style={{ width: '20px', height: '20px' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Edit Mapping Record #{editingRowData.id || ''}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Update Sales Group, Division Range, Part SKU & Mapping Configurations
                  </div>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setEditRowModalOpen(false)} 
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-subtle)', padding: '0.2rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditRow} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Sales Group */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Sales Group / Catalog Group <span style={{ color: 'var(--gsh-red)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingRowData.sales_group}
                    onChange={e => setEditingRowData(prev => ({ ...prev, sales_group: e.target.value.toUpperCase() }))}
                    placeholder="e.g. ADCOCK, MUYANGXI"
                    style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 700, outline: 'none' }}
                  />
                </div>

                {/* Division / Range Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Division / Range Name <span style={{ color: 'var(--gsh-red)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="edit-ranges-list"
                    value={editingRowData.range_name}
                    onChange={e => setEditingRowData(prev => ({ ...prev, range_name: e.target.value.toUpperCase() }))}
                    placeholder="Select or type Range name..."
                    style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 700, outline: 'none' }}
                  />
                  <datalist id="edit-ranges-list">
                    {uniqueRanges.map((rn, idx) => (
                      <option key={idx} value={rn} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                {/* Part No */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Part No. / Item Code
                  </label>
                  <input
                    type="text"
                    value={editingRowData.part_no}
                    onChange={e => setEditingRowData(prev => ({ ...prev, part_no: e.target.value.toUpperCase() }))}
                    placeholder="e.g. PUN107"
                    style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--gsh-red)', fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 700, outline: 'none' }}
                  />
                </div>

                {/* Product SKU */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Product Description (SKU)
                  </label>
                  <input
                    type="text"
                    value={editingRowData.product_sku}
                    onChange={e => setEditingRowData(prev => ({ ...prev, product_sku: e.target.value }))}
                    placeholder="e.g. Nicardia Retard 20mg 50's"
                    style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Mapping Visibility */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Mapping Visibility
                  </label>
                  <select
                    value={editingRowData.visibility}
                    onChange={e => setEditingRowData(prev => ({ ...prev, visibility: e.target.value }))}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="both">🌐 Both (Total & Distri)</option>
                    <option value="total_range">📊 Total Range FY Only</option>
                    <option value="distri_range">📈 Distri Range FY Only</option>
                  </select>
                </div>

                {/* Fiscal Year */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Fiscal Year
                  </label>
                  <select
                    value={editingRowData.fiscal_year}
                    onChange={e => setEditingRowData(prev => ({ ...prev, fiscal_year: e.target.value }))}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
                  >
                    {FISCAL_YEARS.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--bg-hover)', padding: '0.85rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
                {/* IFS Matching Rule */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#3b82f6', marginBottom: '0.35rem' }}>
                    IFS Matching Rule
                  </label>
                  <select
                    value={editingRowData.match_type}
                    onChange={e => setEditingRowData(prev => ({ ...prev, match_type: e.target.value }))}
                    style={{ width: '100%', padding: '0.5rem 0.7rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.825rem', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="CATALOG_GROUP">Match by CATALOG_GROUP</option>
                    <option value="CONTRACT">Match by CONTRACT Code</option>
                    <option value="CATALOG_NO">Match by CATALOG_NO (Part SKU)</option>
                  </select>
                </div>

                {/* Contract Code */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#8b5cf6', marginBottom: '0.35rem' }}>
                    Contract Code {editingRowData.match_type === 'CONTRACT' && <span style={{ color: 'var(--gsh-red)' }}>*</span>}
                  </label>
                  <input
                    type="text"
                    list="edit-contracts-list"
                    disabled={editingRowData.match_type !== 'CONTRACT'}
                    value={editingRowData.contract_code}
                    onChange={e => setEditingRowData(prev => ({ ...prev, contract_code: e.target.value.toUpperCase() }))}
                    placeholder={editingRowData.match_type === 'CONTRACT' ? "e.g. 133, PUN" : "Disabled (Only for Contract)"}
                    style={{ width: '100%', padding: '0.5rem 0.7rem', background: editingRowData.match_type === 'CONTRACT' ? 'var(--bg-card)' : 'transparent', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.825rem', fontWeight: 700, outline: 'none', opacity: editingRowData.match_type === 'CONTRACT' ? 1 : 0.5 }}
                  />
                  <datalist id="edit-contracts-list">
                    {availableContracts.map((cc, idx) => (
                      <option key={idx} value={cc} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setEditRowModalOpen(false)}
                  style={{ padding: '0.55rem 1.25rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEditRow}
                  style={{ padding: '0.55rem 1.5rem', background: 'var(--gsh-teal)', border: 'none', borderRadius: 'var(--radius-xs)', color: '#fff', fontWeight: 800, fontSize: '0.85rem', cursor: savingEditRow ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 4px 12px rgba(0, 168, 150, 0.3)' }}
                >
                  {savingEditRow ? (
                    <>
                      <RefreshCw style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check style={{ width: '15px', height: '15px' }} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL 6: DELETE CONFIRMATION MODAL ─── */}
      {deleteRowModalOpen && rowToDelete && ReactDOM.createPortal(
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteRowModalOpen(false); }}
          style={{ 
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
            zIndex: 999999, background: 'rgba(0, 0, 0, 0.75)', 
            backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', padding: '1rem', boxSizing: 'border-box'
          }}
        >
          <div 
            style={{ 
              width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column',
              background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-md)', padding: '1.75rem', boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(200, 16, 46, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gsh-red)' }}>
                <Trash2 style={{ width: '22px', height: '22px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Delete Mapping Record?
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  This action will permanently remove this division mapping row.
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-hover)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div><strong>Sales Group:</strong> <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{rowToDelete.sales_group}</span></div>
              <div><strong>Range / Division:</strong> <span style={{ color: 'var(--gsh-teal)', fontWeight: 700 }}>{rowToDelete.range_name}</span></div>
              {rowToDelete.part_no && rowToDelete.part_no !== '-' && (
                <div><strong>Part No.:</strong> <span style={{ color: 'var(--gsh-red)', fontFamily: 'monospace', fontWeight: 700 }}>{rowToDelete.part_no}</span></div>
              )}
              {rowToDelete.product_sku && (
                <div><strong>Product SKU:</strong> <span style={{ color: 'var(--text-muted)' }}>{rowToDelete.product_sku}</span></div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setDeleteRowModalOpen(false)}
                style={{ padding: '0.55rem 1.25rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingRow}
                onClick={handleConfirmDeleteRow}
                style={{ padding: '0.55rem 1.4rem', background: 'var(--gsh-red)', border: 'none', borderRadius: 'var(--radius-xs)', color: '#fff', fontWeight: 800, fontSize: '0.85rem', cursor: deletingRow ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 4px 12px rgba(200, 16, 46, 0.3)' }}
              >
                {deletingRow ? (
                  <>
                    <RefreshCw style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 style={{ width: '15px', height: '15px' }} />
                    Delete Record
                  </>
                )}
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
