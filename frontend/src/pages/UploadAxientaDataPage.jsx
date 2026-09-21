import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Upload, FileSpreadsheet, CheckCircle, AlertTriangle, RefreshCw, Layers, DollarSign, X, AlertCircle, ChevronLeft, ChevronRight, Package, Box, Database, Loader, LayoutGrid, Table as TableIcon, Search, Filter, Eye, Clock } from 'lucide-react';
import api from '../services/api';

const fmt = (v) => (v || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const MONTHS_LIST = [
  { num: 1, name: 'January' },
  { num: 2, name: 'February' },
  { num: 3, name: 'March' },
  { num: 4, name: 'April' },
  { num: 5, name: 'May' },
  { num: 6, name: 'June' },
  { num: 7, name: 'July' },
  { num: 8, name: 'August' },
  { num: 9, name: 'September' },
  { num: 10, name: 'October' },
  { num: 11, name: 'November' },
  { num: 12, name: 'December' },
];

const YEARS_LIST = [2026, 2027, 2025, 2024];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const UploadAxientaDataPage = () => {
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonthNum, setSelectedMonthNum] = useState(7); // July 2026
  const [calendarSummary, setCalendarSummary] = useState({});
  const [loading, setLoading] = useState(true);

  // View Mode: 'cards' (Calendar Grid) | 'table' (Data Table)
  const [viewMode, setViewMode] = useState('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'uploaded' | 'pending'

  // Selected Date Modal Popup State
  const [activeDate, setActiveDate] = useState(null); // 'YYYY-MM-DD'
  const [dailyRecords, setDailyRecords] = useState([]);
  const [dailyTotalCount, setDailyTotalCount] = useState(0);
  const [dailyTotalValue, setDailyTotalValue] = useState(0);
  const [loadingDaily, setLoadingDaily] = useState(false);

  // File Upload State inside Modal
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [overwritePrompt, setOverwritePrompt] = useState(null);

  // Sync State
  const [syncing, setSyncing] = useState(false);
  const [syncingDay, setSyncingDay] = useState(null); // 'YYYY-MM-DD' or null

  // Toast Notification State
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSyncData = async () => {
    setSyncing(true);
    try {
      const res = await api.post('/axienta/sync-data', {
        year: selectedYear,
        month: selectedMonthNum
      }, { timeout: 180000 });
      if (res.data && res.data.success) {
        showToast(res.data.message || `Synced successfully!`, 'success');
        loadCalendarSummary();
      }
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'Failed to sync Axienta data from MS SQL Server.';
      showToast(errMsg, 'error');
    }
    setSyncing(false);
  };

  const handleSyncDay = async (dateStr, e) => {
    e.stopPropagation(); // Prevent opening the day modal
    const [y, m, d] = dateStr.split('-').map(Number);
    setSyncingDay(dateStr);
    try {
      const res = await api.post('/axienta/sync-day', {
        year: y,
        month: m,
        day: d
      }, { timeout: 60000 });
      if (res.data && res.data.success) {
        showToast(res.data.message || `Synced ${dateStr} successfully!`, 'success');
        loadCalendarSummary();
      }
    } catch (err) {
      const errMsg = err.response?.data?.detail || `Failed to sync data for ${dateStr} from MS SQL Server.`;
      showToast(errMsg, 'error');
    }
    setSyncingDay(null);
  };

  const loadCalendarSummary = async () => {
    setLoading(true);
    try {
      const res = await api.get('/axienta/calendar-summary', {
        params: { year: selectedYear, month: selectedMonthNum }
      });
      if (res.data) {
        setCalendarSummary(res.data.summary || {});
      }
    } catch {
      showToast('Failed to load Axienta calendar summary.', 'error');
    }
    setLoading(false);
  };

  const loadDailyRecords = async (dateStr) => {
    setLoadingDaily(true);
    try {
      const res = await api.get('/axienta/daily-records', {
        params: { entry_date: dateStr, page: 1, limit: 100 }
      });
      if (res.data) {
        setDailyRecords(res.data.rows || []);
        setDailyTotalCount(res.data.total_count || 0);
        setDailyTotalValue(res.data.total_value || 0);
      }
    } catch {
      setDailyRecords([]);
      setDailyTotalCount(0);
      setDailyTotalValue(0);
    }
    setLoadingDaily(false);
  };

  useEffect(() => {
    loadCalendarSummary();
  }, [selectedYear, selectedMonthNum]);

  const handleDateClick = (dateStr) => {
    setActiveDate(dateStr);
    setSelectedFile(null);
    setOverwritePrompt(null);
    loadDailyRecords(dateStr);
  };

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
    if (!selectedFile || !activeDate) {
      showToast('Please select an Excel file to upload.', 'error');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('entry_date', activeDate);
    if (forceOverwrite) {
      formData.append('overwrite', 'true');
    }

    try {
      const res = await api.post('/axienta/upload-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.exists && !forceOverwrite) {
        setOverwritePrompt({
          message: res.data.message,
          count: res.data.existing_count,
          date: res.data.entry_date
        });
      } else if (res.data.success) {
        showToast(res.data.message, 'success');
        setOverwritePrompt(null);
        setSelectedFile(null);
        loadDailyRecords(activeDate);
        loadCalendarSummary();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to upload Axienta Excel file. Please verify columns: Product ID, Product, Qty, Value.';
      showToast(errorMsg, 'error');
    }
    setUploading(false);
  };

  // Helper: Generate calendar day grid cells
  const getCalendarCells = () => {
    const firstDay = new Date(selectedYear, selectedMonthNum - 1, 1);
    const lastDay = new Date(selectedYear, selectedMonthNum, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sun

    const cells = [];
    // Empty padding cells before 1st day
    for (let i = 0; i < startingDayOfWeek; i++) {
      cells.push(null);
    }
    // Days of month
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${selectedYear}-${String(selectedMonthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ dayNum: d, dateStr: dStr });
    }
    return cells;
  };

  // Compute monthly table records
  const monthTableData = useMemo(() => {
    const lastDay = new Date(selectedYear, selectedMonthNum, 0);
    const daysInMonth = lastDay.getDate();
    const list = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(selectedYear, selectedMonthNum - 1, d);
      const dStr = `${selectedYear}-${String(selectedMonthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeekShort = DAYS_OF_WEEK[dateObj.getDay()];
      const dayOfWeekFull = FULL_DAYS_OF_WEEK[dateObj.getDay()];
      const daySummary = calendarSummary[dStr];
      const hasData = Boolean(daySummary && daySummary.row_count > 0);
      const rowCount = daySummary?.row_count || 0;
      const dailyValue = daySummary?.daily_value ?? daySummary?.total_value ?? 0;
      const sheetTotalValue = daySummary?.sheet_total_value ?? daySummary?.total_value ?? 0;

      list.push({
        dayNum: d,
        dateStr: dStr,
        dayOfWeekShort,
        dayOfWeekFull,
        isSunday: dateObj.getDay() === 0,
        hasData,
        rowCount,
        dailyValue,
        sheetTotalValue
      });
    }
    return list;
  }, [selectedYear, selectedMonthNum, calendarSummary]);

  // Filter table data by search query and status
  const filteredTableData = useMemo(() => {
    return monthTableData.filter(item => {
      if (statusFilter === 'uploaded' && !item.hasData) return false;
      if (statusFilter === 'pending' && item.hasData) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchDate = item.dateStr.toLowerCase().includes(q);
        const matchDayNum = String(item.dayNum) === q || `day ${item.dayNum}`.includes(q);
        const matchDayName = item.dayOfWeekFull.toLowerCase().includes(q) || item.dayOfWeekShort.toLowerCase().includes(q);
        const matchStatus = (item.hasData ? 'uploaded' : 'pending').includes(q);
        const matchValue = String(item.dailyValue).includes(q) || String(item.sheetTotalValue).includes(q);
        return matchDate || matchDayNum || matchDayName || matchStatus || matchValue;
      }
      return true;
    });
  }, [monthTableData, searchTerm, statusFilter]);

  const calendarCells = getCalendarCells();
  const monthLabel = MONTHS_LIST.find(m => m.num === selectedMonthNum)?.name || 'July';

  // Month Total Value & Rows
  const totalUploadedDays = Object.keys(calendarSummary).length;
  const monthTotalRows = Object.values(calendarSummary).reduce((acc, curr) => acc + (curr.row_count || 0), 0);
  const monthTotalValue = Object.values(calendarSummary).reduce((acc, curr) => acc + (curr.total_value || 0), 0);

  return (
    <div className="page-view animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Toast Notification */}
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 99999, padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-sm)', background: toast.type === 'success' ? '#10b981' : '#ef4444', color: '#fff', fontWeight: 700, fontSize: '0.85rem', boxShadow: '0 8px 24px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {toast.type === 'success' ? <CheckCircle style={{ width: '18px', height: '18px' }} /> : <AlertCircle style={{ width: '18px', height: '18px' }} />}
          {toast.msg}
        </div>
      )}

      {/* Header & Controls Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar style={{ width: '24px', height: '24px', color: 'var(--gsh-teal)' }} />
            Upload Axienta Data ({viewMode === 'cards' ? 'Calendar Card View' : 'Data Table View'})
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
            Select Month & Year. Switch between Calendar Card View and Data Table View. Click any day to upload Excel sheets or inspect records.
          </p>
        </div>

        {/* Top Control Bar: Dropdowns + View Switcher + Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          
          {/* Year & Month Selection */}
          <div className="glass-card" style={{ padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)' }}>Year:</label>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                style={{ padding: '0.4rem 0.55rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', background: 'var(--bg-hover)', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 800, outline: 'none' }}
              >
                {YEARS_LIST.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)' }}>Month:</label>
              <select
                value={selectedMonthNum}
                onChange={e => setSelectedMonthNum(Number(e.target.value))}
                style={{ padding: '0.4rem 0.55rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', background: 'var(--bg-hover)', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 800, outline: 'none' }}
              >
                {MONTHS_LIST.map(m => (
                  <option key={m.num} value={m.num}>{m.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={loadCalendarSummary}
              title="Refresh Data"
              style={{ padding: '0.4rem 0.65rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <RefreshCw style={{ width: '14px', height: '14px' }} />
            </button>
          </div>

          {/* ─── View Mode Switcher: Card View vs Table View ─── */}
          <div style={{ display: 'inline-flex', background: 'var(--bg-card)', padding: '3px', borderRadius: '8px', border: '1.5px solid var(--border-color)', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', gap: '3px' }}>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              title="Calendar Card View"
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'cards' ? 'var(--gsh-teal)' : 'transparent',
                color: viewMode === 'cards' ? '#ffffff' : 'var(--text-main)',
                fontWeight: 800,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: viewMode === 'cards' ? '0 2px 6px rgba(0,168,150,0.35)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <LayoutGrid style={{ width: '14px', height: '14px' }} />
              Card View
            </button>

            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="Data Table View"
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'table' ? '#3b82f6' : 'transparent',
                color: viewMode === 'table' ? '#ffffff' : 'var(--text-main)',
                fontWeight: 800,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: viewMode === 'table' ? '0 2px 6px rgba(59,130,246,0.35)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <TableIcon style={{ width: '14px', height: '14px' }} />
              Table View
            </button>
          </div>

        </div>
      </div>

      {/* Sync Axienta Data button - Right-aligned below header */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleSyncData}
          disabled={syncing}
          title="Sync Axienta Data from MS SQL Server (172.16.0.21)"
          style={{
            padding: '0.55rem 1.25rem',
            borderRadius: 'var(--radius-xs)',
            border: 'none',
            background: syncing ? '#64748b' : 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.84rem',
            cursor: syncing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: syncing ? 'none' : '0 3px 12px rgba(14,165,233,0.4)',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={e => { if (!syncing) { e.currentTarget.style.background = 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
          onMouseLeave={e => { if (!syncing) { e.currentTarget.style.background = 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)'; e.currentTarget.style.transform = 'translateY(0)'; } }}
        >
          {syncing ? (
            <>
              <Loader style={{ width: '15px', height: '15px', animation: 'spin 1s linear infinite' }} />
              Syncing... (this may take up to 60s)
            </>
          ) : (
            <>
              <Database style={{ width: '15px', height: '15px' }} />
              Sync Axienta Data
            </>
          )}
        </button>
      </div>

      {/* Top Monthly Summary KPI Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-xs)', background: 'rgba(0,168,150,0.12)', color: 'var(--gsh-teal)' }}>
            <Calendar style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>UPLOADED DAYS ({monthLabel.toUpperCase()} {selectedYear})</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gsh-teal)' }}>{totalUploadedDays} Days</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-xs)', background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>
            <Layers style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>TOTAL AXIENTA ROWS</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>{monthTotalRows.toLocaleString()}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-xs)', background: 'rgba(200,16,46,0.12)', color: 'var(--gsh-red)' }}>
            <DollarSign style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>TOTAL MONTH AXIENTA VALUE (LKR)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gsh-red)' }}>{fmt(monthTotalValue)}</div>
          </div>
        </div>
      </div>

      {/* ─── CONDITIONAL VIEW: CARD VIEW (CALENDAR) vs TABLE VIEW ─── */}
      {viewMode === 'cards' ? (
        /* ─── BIG CALENDAR CARD VIEW ─── */
        <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Calendar Title Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              📅 {monthLabel} {selectedYear} Axienta Daily Upload Calendar Grid
            </h3>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              Click any day card to upload Excel sheet or inspect records
            </span>
          </div>

          {/* Days of Week Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
            {DAYS_OF_WEEK.map((d, i) => (
              <div key={d} style={{ padding: '0.5rem', fontSize: '0.8rem', fontWeight: 800, color: i === 0 ? 'var(--gsh-red)' : 'var(--text-subtle)', background: 'var(--bg-hover)', borderRadius: 'var(--radius-xs)' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.6rem' }}>
            {calendarCells.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty_${idx}`} style={{ minHeight: '95px', background: 'transparent' }}></div>;
              }

              const daySummary = calendarSummary[cell.dateStr];
              const hasData = Boolean(daySummary && daySummary.row_count > 0);

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => handleDateClick(cell.dateStr)}
                  style={{
                    minHeight: '105px',
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-xs)',
                    border: hasData ? '1.5px solid var(--gsh-teal)' : '1px solid var(--border-color)',
                    background: hasData ? 'rgba(0,168,150,0.06)' : 'var(--bg-card)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                    boxShadow: hasData ? '0 4px 12px rgba(0,168,150,0.12)' : 'none',
                    transition: 'all 0.15s ease-in-out'
                  }}
                >
                  {/* Day Number Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: hasData ? 'var(--gsh-teal)' : 'var(--text-main)' }}>
                      {cell.dayNum}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {hasData && (
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, background: 'var(--gsh-teal)', color: '#fff', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                          Uploaded
                        </span>
                      )}
                      {/* Per-Day Sync Button */}
                      <button
                        type="button"
                        onClick={(e) => handleSyncDay(cell.dateStr, e)}
                        disabled={syncingDay === cell.dateStr || syncing}
                        title={`Sync ${cell.dateStr} from MS SQL Server (172.16.0.21)`}
                        style={{
                          background: syncingDay === cell.dateStr ? 'rgba(14, 165, 233, 0.2)' : 'rgba(0,0,0,0.06)',
                          border: '1px solid rgba(14, 165, 233, 0.3)',
                          borderRadius: '4px',
                          padding: '0.15rem 0.3rem',
                          cursor: (syncingDay === cell.dateStr || syncing) ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: syncingDay === cell.dateStr ? '#0ea5e9' : 'var(--text-muted)',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(14, 165, 233, 0.25)';
                          e.currentTarget.style.color = '#0ea5e9';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = syncingDay === cell.dateStr ? 'rgba(14, 165, 233, 0.2)' : 'rgba(0,0,0,0.06)';
                          e.currentTarget.style.color = syncingDay === cell.dateStr ? '#0ea5e9' : 'var(--text-muted)';
                        }}
                      >
                        {syncingDay === cell.dateStr ? (
                          <Loader style={{ width: '11px', height: '11px', animation: 'spin 1s linear infinite' }} />
                        ) : (
                          <RefreshCw style={{ width: '11px', height: '11px' }} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Day Summary Highlights */}
                  {hasData ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.35rem' }}>
                      {/* 1. Sheet Total Value (Day 1 - Day N Cumulative LKR) */}
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>Sheet Total:</span>
                        <strong style={{ color: 'var(--text-main)', fontSize: '0.72rem' }}>LKR {fmt(daySummary.sheet_total_value ?? daySummary.total_value)}</strong>
                      </div>

                      {/* 2. Daily Total Value (This Day Only: Day N - Day N-1 LKR) */}
                      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--gsh-teal)', background: 'rgba(0,168,150,0.12)', padding: '0.15rem 0.3rem', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>Daily Total:</span>
                        <strong style={{ color: 'var(--gsh-teal)' }}>LKR {fmt(daySummary.daily_value ?? daySummary.total_value)}</strong>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontStyle: 'italic', marginTop: '0.5rem' }}>
                      Click to Upload
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ─── DATA TABLE VIEW WITH SEARCH & FILTERS ─── */
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Table Controls: Title, Search Bar & Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <TableIcon style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
                {monthLabel} {selectedYear} Daily Axienta Data Records Table
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Showing {filteredTableData.length} of {monthTableData.length} days ({totalUploadedDays} days uploaded)
              </span>
            </div>

            {/* Search and Status Filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              
              {/* Search Bar */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search style={{ position: 'absolute', left: '0.65rem', width: '15px', height: '15px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Search by date, day, status, value..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    padding: '0.45rem 1.8rem 0.45rem 2rem',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-hover)',
                    color: 'var(--text-main)',
                    fontSize: '0.825rem',
                    width: '260px',
                    outline: 'none'
                  }}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    style={{ position: 'absolute', right: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                  >
                    <X style={{ width: '13px', height: '13px' }} />
                  </button>
                )}
              </div>

              {/* Status Filter Buttons */}
              <div style={{ display: 'inline-flex', background: 'var(--bg-hover)', borderRadius: '6px', padding: '2px', border: '1px solid var(--border-color)', gap: '2px' }}>
                <button
                  onClick={() => setStatusFilter('all')}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: '4px',
                    border: 'none',
                    background: statusFilter === 'all' ? 'var(--bg-card)' : 'transparent',
                    color: statusFilter === 'all' ? 'var(--text-main)' : 'var(--text-muted)',
                    fontWeight: statusFilter === 'all' ? 800 : 600,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    boxShadow: statusFilter === 'all' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  All ({monthTableData.length})
                </button>
                <button
                  onClick={() => setStatusFilter('uploaded')}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: '4px',
                    border: 'none',
                    background: statusFilter === 'uploaded' ? 'var(--gsh-teal)' : 'transparent',
                    color: statusFilter === 'uploaded' ? '#ffffff' : 'var(--text-muted)',
                    fontWeight: statusFilter === 'uploaded' ? 800 : 600,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    boxShadow: statusFilter === 'uploaded' ? '0 1px 3px rgba(0,168,150,0.3)' : 'none'
                  }}
                >
                  Uploaded ({totalUploadedDays})
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: '4px',
                    border: 'none',
                    background: statusFilter === 'pending' ? '#f59e0b' : 'transparent',
                    color: statusFilter === 'pending' ? '#ffffff' : 'var(--text-muted)',
                    fontWeight: statusFilter === 'pending' ? 800 : 600,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    boxShadow: statusFilter === 'pending' ? '0 1px 3px rgba(245,158,11,0.3)' : 'none'
                  }}
                >
                  Pending ({monthTableData.length - totalUploadedDays})
                </button>
              </div>

            </div>
          </div>

          {/* Interactive Data Table */}
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', textAlign: 'left' }}>
              <thead style={{ background: 'var(--bg-hover)', borderBottom: '1.5px solid var(--border-color)', fontWeight: 800, color: 'var(--text-main)' }}>
                <tr>
                  <th style={{ padding: '0.65rem 0.85rem', width: '50px', textAlign: 'center' }}>#</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Date</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Day</th>
                  <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>Upload Status</th>
                  <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Axienta Rows</th>
                  <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Daily Value (LKR)</th>
                  <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Sheet Total (LKR)</th>
                  <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', width: '220px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTableData.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Search style={{ width: '28px', height: '28px', margin: '0 auto 0.5rem auto', opacity: 0.5, display: 'block' }} />
                      No daily records matching your search/filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTableData.map((row) => (
                    <tr
                      key={row.dateStr}
                      onClick={() => handleDateClick(row.dateStr)}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        background: row.hasData ? 'rgba(0,168,150,0.02)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.12s ease'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = row.hasData ? 'rgba(0,168,150,0.02)' : 'transparent'; }}
                    >
                      {/* # Day Number */}
                      <td style={{ padding: '0.55rem 0.85rem', textAlign: 'center', fontWeight: 800, color: row.isSunday ? 'var(--gsh-red)' : 'var(--text-muted)' }}>
                        {row.dayNum}
                      </td>

                      {/* Date */}
                      <td style={{ padding: '0.55rem 0.85rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-main)' }}>
                        {row.dateStr}
                      </td>

                      {/* Day of Week */}
                      <td style={{ padding: '0.55rem 0.85rem', fontWeight: 600, color: row.isSunday ? 'var(--gsh-red)' : 'var(--text-subtle)' }}>
                        {row.dayOfWeekFull}
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: '0.55rem 0.85rem', textAlign: 'center' }}>
                        {row.hasData ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '12px',
                            background: 'rgba(0,168,150,0.12)',
                            color: 'var(--gsh-teal)',
                            fontWeight: 800,
                            fontSize: '0.725rem'
                          }}>
                            <CheckCircle style={{ width: '12px', height: '12px' }} />
                            Uploaded
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '12px',
                            background: 'rgba(100,116,139,0.1)',
                            color: 'var(--text-muted)',
                            fontWeight: 600,
                            fontSize: '0.725rem'
                          }}>
                            <Clock style={{ width: '12px', height: '12px' }} />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Row Count */}
                      <td style={{ padding: '0.55rem 0.85rem', textAlign: 'right', fontWeight: 700, color: row.hasData ? 'var(--text-main)' : 'var(--text-muted)' }}>
                        {row.hasData ? row.rowCount.toLocaleString() : '—'}
                      </td>

                      {/* Daily Total Value */}
                      <td style={{ padding: '0.55rem 0.85rem', textAlign: 'right', fontWeight: 800, color: row.hasData ? 'var(--gsh-teal)' : 'var(--text-muted)' }}>
                        {row.hasData ? `LKR ${fmt(row.dailyValue)}` : '—'}
                      </td>

                      {/* Sheet Total Value */}
                      <td style={{ padding: '0.55rem 0.85rem', textAlign: 'right', fontWeight: 700, color: row.hasData ? 'var(--text-main)' : 'var(--text-muted)' }}>
                        {row.hasData ? `LKR ${fmt(row.sheetTotalValue)}` : '—'}
                      </td>

                      {/* Action Buttons */}
                      <td style={{ padding: '0.55rem 0.85rem', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                          <button
                            type="button"
                            onClick={() => handleDateClick(row.dateStr)}
                            title={`Inspect / Upload records for ${row.dateStr}`}
                            style={{
                              padding: '0.3rem 0.65rem',
                              borderRadius: '4px',
                              border: '1px solid var(--border-color)',
                              background: row.hasData ? 'rgba(0,168,150,0.1)' : 'var(--bg-card)',
                              color: row.hasData ? 'var(--gsh-teal)' : 'var(--text-main)',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              transition: 'all 0.12s ease'
                            }}
                          >
                            {row.hasData ? <Eye style={{ width: '12px', height: '12px' }} /> : <Upload style={{ width: '12px', height: '12px' }} />}
                            {row.hasData ? 'View Records' : 'Upload File'}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleSyncDay(row.dateStr, e)}
                            disabled={syncingDay === row.dateStr || syncing}
                            title={`Sync ${row.dateStr} from MS SQL Server (172.16.0.21)`}
                            style={{
                              padding: '0.3rem 0.55rem',
                              borderRadius: '4px',
                              border: '1px solid rgba(14, 165, 233, 0.3)',
                              background: syncingDay === row.dateStr ? 'rgba(14, 165, 233, 0.2)' : 'rgba(14, 165, 233, 0.08)',
                              color: '#0ea5e9',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              cursor: (syncingDay === row.dateStr || syncing) ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              transition: 'all 0.12s ease'
                            }}
                          >
                            {syncingDay === row.dateStr ? (
                              <Loader style={{ width: '12px', height: '12px', animation: 'spin 1s linear infinite' }} />
                            ) : (
                              <RefreshCw style={{ width: '12px', height: '12px' }} />
                            )}
                            Sync
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {/* Table Footer Summary Totals */}
              {filteredTableData.length > 0 && (
                <tfoot style={{ background: 'var(--bg-hover)', borderTop: '2px solid var(--border-color)', fontWeight: 800 }}>
                  <tr>
                    <td colSpan="3" style={{ padding: '0.75rem 0.85rem', color: 'var(--text-main)', fontSize: '0.85rem' }}>
                      MONTH TOTAL SUMMARY ({filteredTableData.filter(x => x.hasData).length} Uploaded Days)
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center', color: 'var(--gsh-teal)' }}>
                      {((filteredTableData.filter(x => x.hasData).length / filteredTableData.length) * 100).toFixed(0)}% Complete
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', color: 'var(--text-main)' }}>
                      {filteredTableData.reduce((acc, c) => acc + c.rowCount, 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', color: 'var(--gsh-teal)', fontSize: '0.9rem' }}>
                      LKR {fmt(filteredTableData.reduce((acc, c) => acc + c.dailyValue, 0))}
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', color: 'var(--gsh-red)', fontSize: '0.9rem' }}>
                      LKR {fmt(monthTotalValue)}
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem' }}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

        </div>
      )}

      {/* ─── DATE-SPECIFIC LARGE UPLOAD MODAL POPUP ─── */}
      {activeDate && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card animate-fade-in" style={{ width: '850px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--gsh-teal)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.15rem', color: 'var(--gsh-teal)' }}>
                <Upload style={{ width: '22px', height: '22px' }} />
                Axienta Daily Data Upload & Records for Date: <strong>{activeDate}</strong>
              </div>
              <button onClick={() => setActiveDate(null)} style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* Overwrite Prompt Banner */}
            {overwritePrompt ? (
              <div style={{ padding: '1rem', borderRadius: 'var(--radius-xs)', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', display: 'flex', gap: '0.75rem' }}>
                <AlertTriangle style={{ width: '28px', height: '28px', color: '#ef4444', flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: 0, color: '#ef4444', fontWeight: 800, fontSize: '0.95rem' }}>Existing Records Found for {overwritePrompt.date}!</h4>
                  <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                    Axienta data for <strong>{overwritePrompt.date}</strong> already contains <strong>{overwritePrompt.count}</strong> records.
                  </p>
                  <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.8rem', fontWeight: 700, color: 'var(--gsh-red)' }}>
                    Uploading this new Excel file will remove the existing records for this day. Do you want to proceed?
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                    <button onClick={() => setOverwritePrompt(null)} style={{ padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', fontWeight: 700, cursor: 'pointer' }}>
                      Cancel / Keep Existing
                    </button>
                    <button disabled={uploading} onClick={() => handleUploadSubmit(true)} style={{ padding: '0.45rem 1.1rem', borderRadius: 'var(--radius-xs)', border: 'none', background: '#ef4444', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
                      {uploading ? 'Replacing...' : 'Yes, Overwrite & Replace Date Records'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Excel File Upload Form */
              <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', background: 'rgba(0,168,150,0.03)', border: '1px dashed var(--gsh-teal)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    📤 Select Axienta Excel File (.xlsx, .xls) for {activeDate}:
                  </label>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    Required Columns: <code>Product ID, Product, Qty, Value</code>
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.825rem' }}
                  />
                  <button
                    disabled={!selectedFile || uploading}
                    onClick={() => handleUploadSubmit(false)}
                    style={{ padding: '0.55rem 1.25rem', borderRadius: 'var(--radius-xs)', border: 'none', background: 'var(--gsh-teal)', color: '#fff', fontWeight: 800, cursor: (!selectedFile || uploading) ? 'not-allowed' : 'pointer', opacity: (!selectedFile || uploading) ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    {uploading ? 'Validating & Uploading...' : 'Validate & Upload Excel'}
                  </button>
                </div>

                {selectedFile && (
                  <div style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckCircle style={{ width: '14px', height: '14px' }} />
                    Selected File: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>
            )}

            {/* Daily Data Table Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                  Existing Records for {activeDate} ({dailyTotalCount} Items)
                </h4>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gsh-red)' }}>
                  Total Daily Value: LKR {fmt(dailyTotalValue)}
                </div>
              </div>

              <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)', fontWeight: 800 }}>
                    <tr>
                      <th style={{ padding: '0.45rem 0.6rem', width: '45px' }}>#</th>
                      <th style={{ padding: '0.45rem 0.6rem' }}>Product ID</th>
                      <th style={{ padding: '0.45rem 0.6rem' }}>Product</th>
                      <th style={{ padding: '0.45rem 0.6rem', textAlign: 'right' }}>Qty</th>
                      <th style={{ padding: '0.45rem 0.6rem', textAlign: 'right' }}>Value (LKR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingDaily ? (
                      <tr>
                        <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          Loading records for {activeDate}...
                        </td>
                      </tr>
                    ) : dailyRecords.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No records uploaded for {activeDate}. Select an Excel file above to import records.
                        </td>
                      </tr>
                    ) : (
                      dailyRecords.map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.35rem 0.6rem', color: 'var(--text-muted)', fontWeight: 700 }}>{i + 1}</td>
                          <td style={{ padding: '0.35rem 0.6rem', fontFamily: 'monospace', fontWeight: 800, color: 'var(--gsh-red)' }}>{r.product_id}</td>
                          <td style={{ padding: '0.35rem 0.6rem', fontWeight: 600, color: 'var(--text-main)' }}>{r.product}</td>
                          <td style={{ padding: '0.35rem 0.6rem', textAlign: 'right', fontWeight: 600 }}>{r.qty}</td>
                          <td style={{ padding: '0.35rem 0.6rem', textAlign: 'right', fontWeight: 800, color: '#10b981' }}>{fmt(r.value)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default UploadAxientaDataPage;
