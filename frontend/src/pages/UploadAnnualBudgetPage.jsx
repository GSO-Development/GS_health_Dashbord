import React, { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, RefreshCw, Search, Layers, Calendar, DollarSign, ArrowLeftRight, X, AlertCircle, Edit3, Save } from 'lucide-react';
import api from '../services/api';

const fmt = (v) => (v || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const FISCAL_YEARS = [
  'FY 2026/27',
  'FY 2027/28',
  'FY 2025/26',
  'FY 2024/25'
];

const MONTH_KEYS = [
  'april', 'may', 'june', 'july', 'august', 'september',
  'october', 'november', 'december', 'january', 'february', 'march'
];

const UploadAnnualBudgetPage = () => {
  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [activeMonth, setActiveMonth] = useState('july');
  const [workingMonthTotal, setWorkingMonthTotal] = useState(0);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYearFilter, setSelectedYearFilter] = useState('FY 2026/27');
  const [loading, setLoading] = useState(true);

  // Upload Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFy, setSelectedFy] = useState('FY 2026/27');
  const [uploading, setUploading] = useState(false);
  
  // Overwrite Confirmation State
  const [overwritePrompt, setOverwritePrompt] = useState(null);

  // Edit Row State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleEditClick = (row) => {
    setEditingRow(row);
    setEditFormData({
      id: row.id,
      range_name: row.range_name || '',
      sales_group: row.sales_group || '',
      part_no: row.part_no || '',
      product_sku: row.product_sku || '',
      cost_center: row.cost_center || '',
      april: row.april || 0,
      may: row.may || 0,
      june: row.june || 0,
      july: row.july || 0,
      august: row.august || 0,
      september: row.september || 0,
      october: row.october || 0,
      november: row.november || 0,
      december: row.december || 0,
      january: row.january || 0,
      february: row.february || 0,
      march: row.march || 0,
      total: row.total || 0,
    });
    setIsEditModalOpen(true);
  };

  const handleEditFieldChange = (field, value) => {
    setEditFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (MONTH_KEYS.includes(field)) {
        const sum = MONTH_KEYS.reduce((acc, m) => acc + (parseFloat(m === field ? value : updated[m]) || 0), 0);
        updated.total = sum;
      }
      return updated;
    });
  };

  const handleSaveRowEdit = async (e) => {
    if (e) e.preventDefault();
    if (!editingRow) return;

    setSavingEdit(true);
    try {
      const res = await api.put(`/reports/total-budget/${editingRow.id}`, editFormData);
      if (res.data) {
        showToast(res.data.message || '✅ Row updated successfully!');
        setIsEditModalOpen(false);
        setEditingRow(null);
        await loadBudgetData();
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to update row.';
      showToast(msg, 'error');
    }
    setSavingEdit(false);
  };

  const loadBudgetData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/total-budget', {
        params: { page, limit: 15, search: searchTerm, year: selectedYearFilter }
      });
      if (res.data) {
        setRows(res.data.rows || []);
        setTotalCount(res.data.total_count || 0);
        setGrandTotal(res.data.grand_total || 0);
        setActiveMonth(res.data.active_month || 'july');
        setWorkingMonthTotal(res.data.working_month_total || 0);
        setTotalPages(res.data.total_pages || 1);
      }
    } catch {
      showToast('Failed to load annual budget records.', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBudgetData();
  }, [page, searchTerm, selectedYearFilter]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        showToast('Only Excel files (.xlsx, .xls) are allowed!', 'error');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadSubmit = async (forceOverwrite = false) => {
    if (!selectedFile) {
      showToast('Please select an Excel file to upload.', 'error');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('fiscal_year', selectedFy);
    if (forceOverwrite) {
      formData.append('overwrite', 'true');
    }

    try {
      const res = await api.post('/reports/budget/upload-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.exists && !forceOverwrite) {
        // Prompt user to confirm overwrite
        setOverwritePrompt({
          message: res.data.message,
          count: res.data.existing_count,
          fy: res.data.fiscal_year
        });
      } else if (res.data.success) {
        showToast(res.data.message, 'success');
        setIsModalOpen(false);
        setOverwritePrompt(null);
        setSelectedFile(null);
        setPage(1);
        loadBudgetData();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to upload Excel sheet. Please verify column order.';
      showToast(errorMsg, 'error');
    }
    setUploading(false);
  };

  return (
    <div className="page-view animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Toast Notification */}
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 99999, padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-sm)', background: toast.type === 'success' ? '#10b981' : '#ef4444', color: '#fff', fontWeight: 700, fontSize: '0.85rem', boxShadow: '0 8px 24px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {toast.type === 'success' ? <CheckCircle style={{ width: '18px', height: '18px' }} /> : <AlertCircle style={{ width: '18px', height: '18px' }} />}
          {toast.msg}
        </div>
      )}

      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileSpreadsheet style={{ width: '24px', height: '24px', color: 'var(--gsh-teal)' }} />
            Upload Annual Budget (Total Budget Management)
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
            Manage annual sales budget records (`total_budget` table). Upload Excel spreadsheets, validate column order, select Fiscal Year, and replace budget records.
          </p>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setOverwritePrompt(null);
            setSelectedFile(null);
          }}
          style={{
            padding: '0.65rem 1.2rem',
            borderRadius: 'var(--radius-xs)',
            border: 'none',
            background: 'var(--gsh-teal)',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(0, 168, 150, 0.3)',
            transition: 'transform 0.15s ease'
          }}
        >
          <Upload style={{ width: '18px', height: '18px' }} />
          📤 Upload Annual Budget Excel
        </button>
      </div>

      {/* Top KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        <div className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-xs)', background: 'rgba(0,168,150,0.12)', color: 'var(--gsh-teal)' }}>
            <Layers style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>TOTAL BUDGET ROWS</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>{totalCount.toLocaleString()}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-xs)', background: 'rgba(200,16,46,0.12)', color: 'var(--gsh-red)' }}>
            <DollarSign style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>ANNUAL GRAND TOTAL (LKR)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gsh-red)' }}>{fmt(grandTotal)}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-xs)', background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>
            <Calendar style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>WORKING MONTH BUDGET ({activeMonth.toUpperCase()})</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#3b82f6' }}>{fmt(workingMonthTotal)}</div>
          </div>
        </div>
      </div>

      {/* Search & Action Bar with Fiscal Year Filter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', width: '320px' }}>
            <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--text-subtle)' }} />
            <input
              type="text"
              placeholder="Search Range, Sales Group, Part No, Product..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              style={{ width: '100%', padding: '0.45rem 0.75rem 0.45rem 2.4rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.825rem', outline: 'none' }}
            />
          </div>

          {/* Fiscal Year Filter Selector Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: 'var(--bg-card)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
            <Calendar style={{ width: '16px', height: '16px', color: 'var(--gsh-teal)' }} />
            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)' }}>Fiscal Year:</label>
            <select
              value={selectedYearFilter}
              onChange={e => {
                setSelectedYearFilter(e.target.value);
                setPage(1);
              }}
              style={{ padding: '0.35rem 0.6rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', background: 'var(--bg-hover)', color: 'var(--text-main)', fontSize: '0.825rem', fontWeight: 800, outline: 'none', cursor: 'pointer' }}
            >
              {FISCAL_YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={loadBudgetData}
          style={{ padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <RefreshCw style={{ width: '14px', height: '14px' }} />
          Refresh
        </button>
      </div>

      {/* Main Datatable */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 310px)', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-card)', borderBottom: '2px solid var(--border-color)', fontWeight: 800 }}>
              <tr style={{ color: 'var(--text-subtle)' }}>
                <th style={{ padding: '0.6rem 0.75rem', width: '75px', textAlign: 'center' }}>Action</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Range Name</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Sales Group</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Part No</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Product SKU</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>April</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>May</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>June</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right', background: 'rgba(0,168,150,0.08)', color: 'var(--gsh-teal)' }}>July</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>August</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>September</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>October</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>November</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>December</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>January</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>February</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>March</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right', color: 'var(--gsh-red)' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="18" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading annual budget records...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan="18" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No budget records found. Click <strong>Upload Annual Budget Excel</strong> to import.
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => (
                  <tr key={row.id || idx} style={{ borderBottom: '1px solid var(--border-color)', background: idx % 2 === 0 ? 'transparent' : 'var(--bg-hover)' }}>
                    {/* Action Column: Edit Button */}
                    <td style={{ padding: '0.45rem 0.6rem', textAlign: 'center' }}>
                      <button
                        onClick={() => handleEditClick(row)}
                        title="Edit this budget record"
                        style={{
                          padding: '0.25rem 0.55rem',
                          background: 'rgba(59,130,246,0.12)',
                          border: '1px solid rgba(59,130,246,0.3)',
                          borderRadius: '4px',
                          color: '#3b82f6',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.25)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(59,130,246,0.12)'}
                      >
                        <Edit3 style={{ width: '13px', height: '13px' }} /> Edit
                      </button>
                    </td>

                    <td style={{ padding: '0.45rem 0.75rem', fontWeight: 700, color: 'var(--gsh-red)' }}>{row.range_name}</td>
                    <td style={{ padding: '0.45rem 0.75rem', fontWeight: 700, color: 'var(--gsh-teal)' }}>{row.sales_group}</td>
                    <td style={{ padding: '0.45rem 0.75rem', fontFamily: 'monospace', fontWeight: 800 }}>{row.part_no}</td>
                    <td style={{ padding: '0.45rem 0.75rem', fontWeight: 600, color: 'var(--text-main)', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.product_sku}</td>
                    <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>{fmt(row.april)}</td>
                    <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>{fmt(row.may)}</td>
                    <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>{fmt(row.june)}</td>
                    <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', fontWeight: 800, color: 'var(--gsh-teal)', background: 'rgba(0,168,150,0.04)' }}>{fmt(row.july)}</td>
                    <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>{fmt(row.august)}</td>
                    <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>{fmt(row.september)}</td>
                    <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>{fmt(row.october)}</td>
                    <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>{fmt(row.november)}</td>
                    <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>{fmt(row.december)}</td>
                    <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>{fmt(row.january)}</td>
                    <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>{fmt(row.february)}</td>
                    <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>{fmt(row.march)}</td>
                    <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', fontWeight: 800, color: 'var(--gsh-red)' }}>{fmt(row.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
          <div>
            Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} total items)
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              style={{ padding: '0.35rem 0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              style={{ padding: '0.35rem 0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1 }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ─── UPLOAD EXCEL MODAL POPUP ─── */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card animate-fade-in" style={{ width: '540px', maxWidth: '100%', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--gsh-teal)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.1rem', color: 'var(--gsh-teal)' }}>
                <Upload style={{ width: '22px', height: '22px' }} />
                Upload Annual Budget Excel
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* Modal Content */}
            {!overwritePrompt ? (
              <>
                {/* Fiscal Year Selection */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Select Fiscal Year (Target Budget Period):
                  </label>
                  <select
                    value={selectedFy}
                    onChange={e => setSelectedFy(e.target.value)}
                    style={{ padding: '0.55rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', background: 'var(--bg-hover)', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 700, outline: 'none' }}
                  >
                    {FISCAL_YEARS.map(fy => (
                      <option key={fy} value={fy}>{fy}</option>
                    ))}
                  </select>
                </div>

                {/* File Input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Upload Budget Excel File (.xlsx or .xls):
                  </label>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    style={{ padding: '0.55rem', borderRadius: 'var(--radius-xs)', border: '1px dashed var(--gsh-teal)', background: 'rgba(0,168,150,0.04)', color: 'var(--text-main)', fontSize: '0.825rem', cursor: 'pointer' }}
                  />
                  {selectedFile && (
                    <div style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
                      <CheckCircle style={{ width: '14px', height: '14px' }} />
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </div>
                  )}
                </div>

                {/* Column Validation Rule Warning Box */}
                <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-xs)', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <strong style={{ color: '#3b82f6', display: 'block', marginBottom: '0.25rem' }}>Required Excel Column Order:</strong>
                  <code>range_name, sales_group, part_no, product_sku, april, may, june, july, august, september, october, november, december, january, february, march, total</code>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    style={{ padding: '0.55rem 1rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!selectedFile || uploading}
                    onClick={() => handleUploadSubmit(false)}
                    style={{ padding: '0.55rem 1.25rem', borderRadius: 'var(--radius-xs)', border: 'none', background: 'var(--gsh-teal)', color: '#fff', fontWeight: 800, cursor: (!selectedFile || uploading) ? 'not-allowed' : 'pointer', opacity: (!selectedFile || uploading) ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    {uploading ? 'Validating & Uploading...' : 'Validate & Upload Budget'}
                  </button>
                </div>
              </>
            ) : (
              /* OVERWRITE CONFIRMATION PROMPT DIALOG */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '1rem', borderRadius: 'var(--radius-xs)', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', display: 'flex', gap: '0.75rem' }}>
                  <AlertTriangle style={{ width: '28px', height: '28px', color: '#ef4444', flexShrink: 0 }} />
                  <div>
                    <h4 style={{ margin: 0, color: '#ef4444', fontWeight: 800, fontSize: '0.95rem' }}>Existing Budget Data Found!</h4>
                    <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                      Budget data for <strong>{overwritePrompt.fy}</strong> already exists in the <code>total_budget</code> table (<strong>{overwritePrompt.count}</strong> existing records).
                    </p>
                    <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.8rem', fontWeight: 700, color: 'var(--gsh-red)' }}>
                      Do you want to replace/overwrite the existing budget data with your newly selected Excel file?
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    onClick={() => setOverwritePrompt(null)}
                    style={{ padding: '0.55rem 1rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Cancel / Keep Existing
                  </button>
                  <button
                    disabled={uploading}
                    onClick={() => handleUploadSubmit(true)}
                    style={{ padding: '0.55rem 1.25rem', borderRadius: 'var(--radius-xs)', border: 'none', background: '#ef4444', color: '#fff', fontWeight: 800, cursor: uploading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}
                  >
                    {uploading ? 'Replacing Data...' : 'Yes, Overwrite & Replace Budget'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ─── EDIT ROW MODAL POPUP ─── */}
      {isEditModalOpen && editingRow && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget && !savingEdit) setIsEditModalOpen(false); }}
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, 
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', boxSizing: 'border-box' 
          }}
        >
          <div 
            className="glass-card animate-fade-in" 
            style={{ 
              width: '100%', maxWidth: '850px', maxHeight: '92vh', overflowY: 'auto',
              background: 'var(--bg-card, #ffffff)', borderRadius: 'var(--radius-md)', 
              border: '1.5px solid var(--gsh-teal)', padding: '1.75rem', 
              display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 25px 60px rgba(0,0,0,0.45)' 
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-main)' }}>
                  <Edit3 style={{ width: '20px', height: '20px', color: 'var(--gsh-teal)' }} />
                  Edit Budget Record <span style={{ color: 'var(--gsh-red)', fontFamily: 'monospace' }}>#{editingRow.id}</span>
                </div>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Update master parameters and monthly budget targets for this product line.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setIsEditModalOpen(false)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRowEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Section 1: Core Information */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem', background: 'var(--bg-hover)', padding: '1rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
                
                {/* Range Name */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--gsh-red)' }}>Range Name *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.range_name || ''}
                    onChange={e => handleEditFieldChange('range_name', e.target.value)}
                    style={{ padding: '0.5rem 0.65rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.825rem', fontWeight: 700 }}
                  />
                </div>

                {/* Sales Group */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--gsh-teal)' }}>Sales Group *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.sales_group || ''}
                    onChange={e => handleEditFieldChange('sales_group', e.target.value)}
                    style={{ padding: '0.5rem 0.65rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.825rem', fontWeight: 700 }}
                  />
                </div>

                {/* Part No */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-main)' }}>Part No</label>
                  <input
                    type="text"
                    value={editFormData.part_no || ''}
                    onChange={e => handleEditFieldChange('part_no', e.target.value)}
                    style={{ padding: '0.5rem 0.65rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.825rem', fontFamily: 'monospace', fontWeight: 700 }}
                  />
                </div>

                {/* Cost Center */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-main)' }}>Cost Center</label>
                  <input
                    type="text"
                    value={editFormData.cost_center || ''}
                    onChange={e => handleEditFieldChange('cost_center', e.target.value)}
                    style={{ padding: '0.5rem 0.65rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.825rem' }}
                  />
                </div>

                {/* Product SKU */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-main)' }}>Product SKU / Description</label>
                  <input
                    type="text"
                    value={editFormData.product_sku || ''}
                    onChange={e => handleEditFieldChange('product_sku', e.target.value)}
                    style={{ padding: '0.5rem 0.65rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.825rem', fontWeight: 600 }}
                  />
                </div>

              </div>

              {/* Section 2: 12 Monthly Budget Targets */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.825rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-subtle)' }}>
                    Monthly Budget Targets (LKR)
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Auto Calculated Total:</span>
                    <strong style={{ color: 'var(--gsh-red)', fontSize: '0.95rem', background: 'rgba(200,16,46,0.08)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                      Rs. {fmt(editFormData.total)}
                    </strong>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.6rem' }}>
                  {MONTH_KEYS.map((m) => (
                    <div key={m} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', background: 'var(--bg-hover)', padding: '0.5rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                      <label style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'capitalize', color: m === 'july' ? 'var(--gsh-teal)' : 'var(--text-muted)' }}>
                        {m}
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={editFormData[m] !== undefined ? editFormData[m] : 0}
                        onChange={e => handleEditFieldChange(m, e.target.value)}
                        style={{ width: '100%', padding: '0.35rem 0.45rem', borderRadius: '3px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.8rem', fontWeight: 700, textAlign: 'right', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={() => setIsEditModalOpen(false)}
                  style={{ padding: '0.55rem 1.2rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  style={{
                    padding: '0.55rem 1.4rem',
                    borderRadius: 'var(--radius-xs)',
                    border: 'none',
                    background: 'var(--accent-gradient)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: savingEdit ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 4px 14px rgba(200,16,46,0.3)'
                  }}
                >
                  {savingEdit ? (
                    <RefreshCw className="animate-spin" style={{ width: '15px', height: '15px' }} />
                  ) : (
                    <Save style={{ width: '15px', height: '15px' }} />
                  )}
                  Save Changes
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default UploadAnnualBudgetPage;
