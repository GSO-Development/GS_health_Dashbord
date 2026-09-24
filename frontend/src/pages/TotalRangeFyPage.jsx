import React, { useState, useEffect } from 'react';
import { Info, Layers, RefreshCw, Search, CheckCircle, AlertCircle, ChevronRight, ChevronDown, Package, Hash, Box, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MonthCalendarBar, { getCurrentMonthKey } from '../components/common/MonthCalendarBar';
import DataLoaderOverlay from '../components/common/DataLoaderOverlay';
import ContractMultiSelect from '../components/common/ContractMultiSelect';
import api from '../services/api';

const formatValue = (v, unitMode = 'exact') => {
  if (v === undefined || v === null || isNaN(v)) return '0.00';
  const num = Number(v);
  if (unitMode === 'millions') {
    return (num / 1000000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (unitMode === 'lakhs') {
    return (num / 100000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  // 'exact' - exact value with 2 decimal places
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const TotalRangeFyPage = () => {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [backlogMode, setBacklogMode] = useState('with'); // default 'with' (Sales / Invoices + Reserved)
  const [selectedContracts, setSelectedContracts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [unitMode, setUnitMode] = useState('millions'); // default 'millions' (Mn) | 'exact' | 'lakhs'
  const [reportData, setReportData] = useState([]);
  const [summaryTotals, setSummaryTotals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Toggle hide/show Division column for maximum mobile screen width
  const [isDivisionHidden, setIsDivisionHidden] = useState(false);

  // Level 1 Expand: Division Ranges
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Level 2 Expand: Sales Groups (Click to view Product SKUs dropdown aligned directly with headers)
  const [expandedSg, setExpandedSg] = useState(new Set());

  const navigate = useNavigate();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const isCurrentMonth = selectedMonth === getCurrentMonthKey();
  const effectiveBacklogMode = isCurrentMonth ? backlogMode : 'without';

  const loadRangeReport = async () => {
    setLoading(true);
    try {
      const params = { month: selectedMonth, search: searchTerm, backlog_mode: effectiveBacklogMode };
      if (startDate && endDate) {
        if (startDate === endDate) {
          params.date = startDate;
        } else {
          params.start_date = startDate;
          params.end_date = endDate;
        }
      }
      if (selectedContracts.length > 0) {
        params.contracts = selectedContracts.join(',');
      }

      const res = await api.get('/reports/total-range-fy', { params });
      if (res.data) {
        const rows = res.data.rows || [];
        setReportData(rows);
        setSummaryTotals(res.data.summary_totals || null);

        // If search term is present, auto-expand all matching divisions and sales groups
        if (searchTerm && searchTerm.trim()) {
          const newExpRows = new Set();
          const newExpSg = new Set();
          rows.forEach(r => {
            newExpRows.add(r.division);
            (r.sales_groups || []).forEach(sg => {
              newExpSg.add(`${r.division}__${sg.sales_group}`);
            });
          });
          setExpandedRows(newExpRows);
          setExpandedSg(newExpSg);
        }
      }
    } catch {
      showToast('Failed to load Total Range FY report data.', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRangeReport();
  }, [selectedMonth, startDate, endDate, searchTerm, effectiveBacklogMode, selectedContracts]);

  const toggleRowExpand = (divisionName) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(divisionName)) {
        next.delete(divisionName);
      } else {
        next.add(divisionName);
      }
      return next;
    });
  };

  const toggleSgExpand = (sgKey) => {
    setExpandedSg(prev => {
      const next = new Set(prev);
      if (next.has(sgKey)) {
        next.delete(sgKey);
      } else {
        next.add(sgKey);
      }
      return next;
    });
  };

  const expandAll = () => {
    const newExpRows = new Set();
    const newExpSg = new Set();
    reportData.forEach(r => {
      newExpRows.add(r.division);
      (r.sales_groups || []).forEach(sg => {
        newExpSg.add(`${r.division}__${sg.sales_group}`);
      });
    });
    setExpandedRows(newExpRows);
    setExpandedSg(newExpSg);
  };

  const collapseAll = () => {
    setExpandedRows(new Set());
    setExpandedSg(new Set());
  };

  return (
    <div className="page-view animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Toast Notification */}
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 99999, padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-sm)', background: toast.type === 'success' ? '#10b981' : (toast.type === 'info' ? 'var(--gsh-teal)' : '#ef4444'), color: '#fff', fontWeight: 700, fontSize: '0.85rem', boxShadow: '0 8px 24px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {toast.type === 'success' ? <CheckCircle style={{ width: '18px', height: '18px' }} /> : <AlertCircle style={{ width: '18px', height: '18px' }} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers style={{ width: '24px', height: '24px', color: 'var(--gsh-red)' }} />
            Total - Range wise fy (Division Range Sales Update)
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
            Click Division Range for Sales Groups, click Sales Group for Product SKUs aligned with headers.
          </p>
        </div>
      </div>

      {/* ─── Backlog Calculation Mode Switcher (Visible ONLY for Current Month) ─── */}
      {isCurrentMonth && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(241, 245, 249, 0.9) 100%)',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          borderRadius: '12px',
          padding: '0.65rem 1rem',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-subtle)' }}>
              Backlog Calculation Mode ({selectedMonth.toUpperCase()} - Current Month):
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: backlogMode === 'without' ? '#6366f1' : (backlogMode === 'with' ? '#10b981' : '#f59e0b') }}>
              {backlogMode === 'with' && '● Invoiced + Reserved Backlog'}
              {backlogMode === 'without' && '● Invoiced Sales Only (Default)'}
              {backlogMode === 'only' && '● Reserved Backlog Orders Only'}
            </span>
          </div>

          <div style={{ display: 'inline-flex', background: '#e2e8f0', borderRadius: '8px', padding: '3px', gap: '3px' }}>
            <button
              type="button"
              onClick={() => setBacklogMode('with')}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: backlogMode === 'with' ? '#10b981' : 'transparent',
                color: backlogMode === 'with' ? '#ffffff' : '#64748b',
                boxShadow: backlogMode === 'with' ? '0 2px 6px rgba(16, 185, 129, 0.35)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Layers style={{ width: '13px', height: '13px' }} />
              Sales (Invoices + Reserved)
            </button>

            <button
              type="button"
              onClick={() => setBacklogMode('without')}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: backlogMode === 'without' ? '#6366f1' : 'transparent',
                color: backlogMode === 'without' ? '#ffffff' : '#64748b',
                boxShadow: backlogMode === 'without' ? '0 2px 6px rgba(99, 102, 241, 0.35)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <CheckCircle2 style={{ width: '13px', height: '13px' }} />
              Without Backlog (Invoiced Only)
            </button>

            <button
              type="button"
              onClick={() => setBacklogMode('only')}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: backlogMode === 'only' ? '#f59e0b' : 'transparent',
                color: backlogMode === 'only' ? '#ffffff' : '#64748b',
                boxShadow: backlogMode === 'only' ? '0 2px 6px rgba(245, 158, 11, 0.35)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Package style={{ width: '13px', height: '13px' }} />
              Only Backlog (Reserved Only)
            </button>
          </div>
        </div>
      )}

      {/* ─── Interactive Month & Calendar Date Bar ─── */}
      <MonthCalendarBar
        selectedMonth={selectedMonth}
        onSelectMonth={(m) => {
          setSelectedMonth(m);
          setStartDate(null);
          setEndDate(null);
        }}
        startDate={startDate}
        endDate={endDate}
        onSelectDateRange={(s, e) => {
          setStartDate(s);
          setEndDate(e);
        }}
        loading={loading}
      />

      {/* Search Bar, Expand/Collapse Controls & Value Display Unit Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--text-subtle)' }} />
            <input
              type="text"
              placeholder="Search Division, Sales Group, Part No, SKU..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.45rem 0.75rem 0.45rem 2.4rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.825rem', outline: 'none' }}
            />
          </div>

          {/* Expand All / Collapse All Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              onClick={expandAll}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Expand All Divisions, Sales Groups and Product SKUs"
            >
              <ChevronDown style={{ width: '14px', height: '14px', color: 'var(--gsh-teal)' }} />
              Expand All
            </button>

            <button
              onClick={collapseAll}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                color: 'var(--text-muted)',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Collapse All Rows"
            >
              <ChevronRight style={{ width: '14px', height: '14px' }} />
              Collapse All
            </button>
          </div>

          {/* Value Display Mode Switcher (Exact / Millions / Lakhs) */}
          <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '2px', gap: '2px', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-subtle)', padding: '0 0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Unit:
            </span>
            <button
              type="button"
              onClick={() => setUnitMode('exact')}
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                background: unitMode === 'exact' ? 'var(--gsh-red)' : 'transparent',
                color: unitMode === 'exact' ? '#ffffff' : 'var(--text-main)',
                boxShadow: unitMode === 'exact' ? '0 2px 6px rgba(200, 16, 46, 0.3)' : 'none',
                transition: 'all 0.15s ease'
              }}
              title="Display exact amounts with decimals (Rs.)"
            >
              Exact (Rs.)
            </button>
            <button
              type="button"
              onClick={() => setUnitMode('millions')}
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                background: unitMode === 'millions' ? 'var(--gsh-teal)' : 'transparent',
                color: unitMode === 'millions' ? '#ffffff' : 'var(--text-main)',
                boxShadow: unitMode === 'millions' ? '0 2px 6px rgba(0, 168, 150, 0.3)' : 'none',
                transition: 'all 0.15s ease'
              }}
              title="Display values divided into Millions (Mn)"
            >
              Millions (Mn)
            </button>
            <button
              type="button"
              onClick={() => setUnitMode('lakhs')}
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                background: unitMode === 'lakhs' ? '#3b82f6' : 'transparent',
                color: unitMode === 'lakhs' ? '#ffffff' : 'var(--text-main)',
                boxShadow: unitMode === 'lakhs' ? '0 2px 6px rgba(59, 130, 246, 0.3)' : 'none',
                transition: 'all 0.15s ease'
              }}
              title="Display values divided into Lakhs (L / 100K)"
            >
              Lakhs (L)
            </button>
          </div>
        </div>

        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
          Displaying <strong>{reportData.length}</strong> Division Ranges (Product rows aligned 100% under main columns)
        </div>
      </div>

      {/* Main Datatable with Multi-Level Perfectly Aligned Tree Rows */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', position: 'relative', minHeight: '440px' }}>
        <DataLoaderOverlay loading={loading} title="Crunching Total-Range Wise Sales Analytics..." />
        <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 250px)', overflowY: 'auto', opacity: loading ? 0.35 : 1, transition: 'opacity 0.25s ease' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 11, background: 'var(--bg-card)' }}>
              {/* Grouped Super Header Row */}
              <tr style={{ background: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-main)', fontWeight: 800, textTransform: 'uppercase' }}>
                <th colSpan={isDivisionHidden ? 1 : 2} className="sticky-col-super" style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>Division</th>
                <th colSpan="3" style={{ padding: '0.65rem 0.85rem', textAlign: 'center', borderRight: '1px solid var(--border-color)', background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}>
                  TOTAL - CURRENT MONTH DETAILS ({selectedMonth.toUpperCase()}) {unitMode === 'millions' ? '(Mn)' : (unitMode === 'lakhs' ? '(Lakhs)' : '(Rs.)')}
                </th>
                <th colSpan="3" style={{ padding: '0.65rem 0.85rem', textAlign: 'center', borderRight: '1px solid var(--border-color)', background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}>
                  CUMULATIVE - SALES UPDATE {unitMode === 'millions' ? '(Mn)' : (unitMode === 'lakhs' ? '(Lakhs)' : '(Rs.)')}
                </th>
                <th colSpan="3" style={{ padding: '0.65rem 0.85rem', textAlign: 'center', background: 'rgba(200, 16, 46, 0.08)', color: 'var(--gsh-red)' }}>
                  ANNUAL - SALES UPDATE (FULL YEAR FY 2026/27) {unitMode === 'millions' ? '(Mn)' : (unitMode === 'lakhs' ? '(Lakhs)' : '(Rs.)')}
                </th>
              </tr>
              {/* Sub-Header Row */}
              <tr style={{ background: 'var(--bg-card)', borderBottom: '2px solid var(--border-color)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-subtle)' }}>
                <th className="sticky-col-1" style={{ padding: '0.55rem 0.15rem', textAlign: 'center' }}>
                  {isDivisionHidden ? (
                    <button
                      onClick={() => setIsDivisionHidden(false)}
                      title="Show Division Name Column"
                      style={{ background: 'var(--gsh-teal)', color: '#fff', border: 'none', borderRadius: '3px', padding: '0.15rem 0.25rem', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center' }}
                    >
                      <Eye style={{ width: '11px', height: '11px' }} />
                    </button>
                  ) : 'No'}
                </th>
                {!isDivisionHidden && (
                  <th className="sticky-col-2" style={{ padding: '0.55rem 0.4rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: '100%' }}>
                      <span style={{ fontWeight: 800, color: 'var(--text-subtle)' }}>Division</span>
                      <button
                        onClick={() => setIsDivisionHidden(true)}
                        title="Hide Division Name Column for full screen numeric view"
                        style={{
                          position: 'absolute', right: 0,
                          background: 'rgba(200, 16, 46, 0.08)',
                          color: 'var(--gsh-red)',
                          border: '1px solid rgba(200, 16, 46, 0.25)',
                          borderRadius: '4px',
                          padding: '0.1rem 0.35rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                          fontSize: '0.65rem',
                          fontWeight: 800
                        }}
                      >
                        <EyeOff style={{ width: '11px', height: '11px' }} />
                        <span>Hide</span>
                      </button>
                    </div>
                  </th>
                )}
                <th style={{ padding: '0.55rem 0.75rem', textAlign: 'right' }}>MONTHLY-BUDGET</th>
                <th style={{ padding: '0.55rem 0.75rem', textAlign: 'right' }}>MONTHLY-ACTUAL</th>
                <th style={{ padding: '0.55rem 0.75rem', textAlign: 'right', borderRight: '1px solid var(--border-color)' }}>CUR - %</th>
                <th style={{ padding: '0.55rem 0.75rem', textAlign: 'right' }}>CUM-BUDGET</th>
                <th style={{ padding: '0.55rem 0.75rem', textAlign: 'right' }}>CUM-ACTUAL</th>
                <th style={{ padding: '0.55rem 0.75rem', textAlign: 'right', borderRight: '1px solid var(--border-color)' }}>CUM - %</th>
                <th style={{ padding: '0.55rem 0.75rem', textAlign: 'right' }}>ANNUAL-BUDGET</th>
                <th style={{ padding: '0.55rem 0.75rem', textAlign: 'right' }}>ANNUAL-ACTUAL</th>
                <th style={{ padding: '0.55rem 0.75rem', textAlign: 'right' }}>ANNUAL - %</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isDivisionHidden ? 10 : 11} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading dynamic Division Range FY data...
                  </td>
                </tr>
              ) : reportData.length === 0 ? (
                <tr>
                  <td colSpan={isDivisionHidden ? 10 : 11} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No division ranges found matching "{searchTerm}".
                  </td>
                </tr>
              ) : (
                reportData.map((row) => {
                  const isExpanded = expandedRows.has(row.division);
                  const hasSubGroups = row.sales_groups && row.sales_groups.length > 0;

                  return (
                    <React.Fragment key={row.no}>
                      {/* LEVEL 1: PARENT RANGE ROW */}
                      <tr
                        onClick={() => toggleRowExpand(row.division)}
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          background: isExpanded ? '#fef2f2' : 'var(--bg-card)',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <td className="sticky-cell-1" style={{ padding: '0.55rem 0.15rem', fontWeight: 700, color: 'var(--gsh-red)', background: isExpanded ? '#fef2f2' : 'var(--bg-card)', textAlign: 'center' }}>{row.no}</td>
                        {!isDivisionHidden && (
                          <td className="sticky-cell-2" style={{ padding: '0.55rem 0.5rem', fontWeight: 800, color: 'var(--text-main)', background: isExpanded ? '#fef2f2' : 'var(--bg-card)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%' }}>
                              {hasSubGroups ? (
                                isExpanded ? <ChevronDown style={{ width: '16px', height: '16px', color: 'var(--gsh-red)', flexShrink: 0 }} /> : <ChevronRight style={{ width: '16px', height: '16px', color: 'var(--text-subtle)', flexShrink: 0 }} />
                              ) : (
                                <span style={{ width: '16px', flexShrink: 0 }}></span>
                              )}
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.division}</span>
                              {hasSubGroups && (
                                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--gsh-teal)', background: 'rgba(0,168,150,0.12)', padding: '0.1rem 0.35rem', borderRadius: '4px', border: '1px solid rgba(0,168,150,0.25)', marginLeft: 'auto', flexShrink: 0 }}>
                                  {row.sales_groups.length}G
                                </span>
                              )}
                            </div>
                          </td>
                        )}

                        {/* Monthly Details */}
                        <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: 700 }}>{formatValue(row.m_budget, unitMode)}</td>
                        <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: 800, color: '#10b981' }}>{formatValue(row.m_actual, unitMode)}</td>
                        <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', borderRight: '1px solid var(--border-color)' }}>
                          <span style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800, background: row.cur_pct >= 100 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: row.cur_pct >= 100 ? '#10b981' : '#ef4444' }}>
                            {row.cur_pct}%
                          </span>
                        </td>

                        {/* Cumulative Details */}
                        <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: 700 }}>{formatValue(row.c_budget, unitMode)}</td>
                        <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: 800, color: '#3b82f6' }}>{formatValue(row.c_actual, unitMode)}</td>
                        <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', borderRight: '1px solid var(--border-color)' }}>
                          <span style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800, background: row.cum_pct >= 100 ? 'rgba(59,130,246,0.15)' : 'rgba(245,158,11,0.15)', color: row.cum_pct >= 100 ? '#3b82f6' : '#f59e0b' }}>
                            {row.cum_pct}%
                          </span>
                        </td>

                        {/* Annual Details */}
                        <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: 700 }}>{formatValue(row.a_budget, unitMode)}</td>
                        <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: 800, color: 'var(--text-main)' }}>{formatValue(row.a_actual, unitMode)}</td>
                        <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right' }}>
                          <span style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800, background: 'rgba(200,16,46,0.12)', color: 'var(--gsh-red)' }}>
                            {row.tot_pct}%
                          </span>
                        </td>
                      </tr>

                      {/* LEVEL 2: EXPANDED SUB-ROWS FOR SALES GROUPS */}
                      {isExpanded && hasSubGroups && (
                        row.sales_groups.map((sg, sgIdx) => {
                          const sgKey = `${row.division}__${sg.sales_group}`;
                          const isSgOpen = expandedSg.has(sgKey);
                          const hasProducts = sg.products && sg.products.length > 0;

                          return (
                            <React.Fragment key={sgIdx}>
                              <tr style={{ borderBottom: '1px solid var(--border-color)', background: isSgOpen ? '#f0fdfa' : '#f8fafc', fontSize: '0.78rem' }}>
                                <td className="sticky-cell-1" style={{ padding: '0.4rem 0.15rem', color: 'var(--text-subtle)', textAlign: 'center', background: isSgOpen ? '#f0fdfa' : '#f8fafc' }}>↳</td>

                                {/* SALES GROUP BADGE WITH CLICK TO DROPDOWN */}
                                {!isDivisionHidden && (
                                  <td className="sticky-cell-2" style={{ padding: '0.45rem 0.5rem', color: 'var(--text-main)', background: isSgOpen ? '#f0fdfa' : '#f8fafc' }}>
                                    <span
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleSgExpand(sgKey);
                                      }}
                                      style={{
                                        fontWeight: 800,
                                        color: isSgOpen ? '#fff' : 'var(--gsh-teal)',
                                        background: isSgOpen ? 'var(--gsh-teal)' : 'rgba(0,168,150,0.12)',
                                        padding: '0.25rem 0.6rem',
                                        borderRadius: '4px',
                                        border: '1px solid var(--gsh-teal)',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.35rem',
                                        boxShadow: '0 2px 6px rgba(0,168,150,0.15)',
                                        transition: 'all 0.15s ease',
                                        maxWidth: '100%'
                                      }}
                                    >
                                      {hasProducts ? (
                                        isSgOpen ? <ChevronDown style={{ width: '13px', height: '13px', flexShrink: 0 }} /> : <ChevronRight style={{ width: '13px', height: '13px', flexShrink: 0 }} />
                                      ) : (
                                        <Package style={{ width: '13px', height: '13px', flexShrink: 0 }} />
                                      )}
                                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sg.sales_group}</span>
                                      {sg.products_count > 0 && (
                                        <span style={{ fontSize: '0.68rem', fontWeight: 800, background: isSgOpen ? '#fff' : 'var(--gsh-teal)', color: isSgOpen ? 'var(--gsh-teal)' : '#fff', padding: '0.05rem 0.35rem', borderRadius: '10px', marginLeft: '0.2rem', flexShrink: 0 }}>
                                          {sg.products_count} {isSgOpen ? 'Open' : 'SKUs'}
                                        </span>
                                      )}
                                    </span>
                                  </td>
                                )}

                                <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>{formatValue(sg.m_budget, unitMode)}</td>
                                <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>{formatValue(sg.m_actual, unitMode)}</td>
                                <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', borderRight: '1px solid var(--border-color)' }}>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: sg.cur_pct >= 100 ? '#10b981' : '#ef4444' }}>{sg.cur_pct}%</span>
                                </td>

                                <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>{formatValue(sg.c_budget, unitMode)}</td>
                                <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', fontWeight: 600, color: '#3b82f6' }}>{formatValue(sg.c_actual, unitMode)}</td>
                                <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', borderRight: '1px solid var(--border-color)' }}>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: sg.cum_pct >= 100 ? '#3b82f6' : '#f59e0b' }}>{sg.cum_pct}%</span>
                                </td>

                                <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>{formatValue(sg.a_budget, unitMode)}</td>
                                <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-main)' }}>{formatValue(sg.a_actual, unitMode)}</td>
                                <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right' }}>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--gsh-red)' }}>{sg.tot_pct}%</span>
                                </td>
                              </tr>

                              {/* LEVEL 3: DIRECT TABLE ROWS FOR PRODUCT SKUs */}
                              {isSgOpen && hasProducts && (
                                sg.products.map((p, pIdx) => (
                                  <tr
                                    key={`p_${pIdx}`}
                                    style={{
                                      borderBottom: '1px solid var(--border-color)',
                                      background: 'var(--bg-card)',
                                      fontSize: '0.75rem'
                                    }}
                                  >
                                    <td className="sticky-cell-1" style={{ padding: '0.35rem 0.15rem', color: 'var(--text-subtle)', textAlign: 'center', fontSize: '0.7rem', background: 'var(--bg-card)' }}>
                                      ↳
                                    </td>

                                    {/* Product SKU Name + Part No Badge */}
                                    {!isDivisionHidden && (
                                      <td className="sticky-cell-2" style={{ padding: '0.35rem 0.5rem', background: 'var(--bg-card)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%' }}>
                                          <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--gsh-red)', background: 'rgba(200,16,46,0.08)', padding: '0.1rem 0.35rem', borderRadius: '3px', border: '1px solid rgba(200,16,46,0.2)', fontSize: '0.7rem', flexShrink: 0 }}>
                                            {p.part_no}
                                          </span>
                                          <span style={{ fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {p.product_sku}
                                          </span>
                                        </div>
                                      </td>
                                    )}

                                    {/* Product Monthly Figures */}
                                    <td style={{ padding: '0.35rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>{formatValue(p.m_budget, unitMode)}</td>
                                    <td style={{ padding: '0.35rem 0.75rem', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>{formatValue(p.m_actual, unitMode)}</td>
                                    <td style={{ padding: '0.35rem 0.75rem', textAlign: 'right', borderRight: '1px solid var(--border-color)' }}>
                                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: p.cur_pct >= 100 ? '#10b981' : '#ef4444' }}>{p.cur_pct}%</span>
                                    </td>

                                    {/* Product Cumulative Figures */}
                                    <td style={{ padding: '0.35rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>{formatValue(p.c_budget, unitMode)}</td>
                                    <td style={{ padding: '0.35rem 0.75rem', textAlign: 'right', fontWeight: 600, color: '#3b82f6' }}>{formatValue(p.c_actual, unitMode)}</td>
                                    <td style={{ padding: '0.35rem 0.75rem', textAlign: 'right', borderRight: '1px solid var(--border-color)' }}>
                                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: p.cum_pct >= 100 ? '#3b82f6' : '#f59e0b' }}>{p.cum_pct}%</span>
                                    </td>

                                    {/* Product Annual Figures */}
                                    <td style={{ padding: '0.35rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>{formatValue(p.a_budget, unitMode)}</td>
                                    <td style={{ padding: '0.35rem 0.75rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-main)' }}>{formatValue(p.a_actual, unitMode)}</td>
                                    <td style={{ padding: '0.35rem 0.75rem', textAlign: 'right' }}>
                                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--gsh-red)' }}>{p.tot_pct}%</span>
                                    </td>
                                  </tr>
                                ))
                              )}

                            </React.Fragment>
                          );
                        })
                      )}

                    </React.Fragment>
                  );
                })
              )}
            </tbody>

            {/* Sticky Grand Total Summary Footer */}
            {summaryTotals && (
              <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 20, background: 'var(--bg-card)', borderTop: '2.5px solid var(--gsh-red)', fontWeight: 800, fontSize: '0.85rem', boxShadow: '0 -6px 20px rgba(0,0,0,0.15)' }}>
                <tr>
                  <td colSpan={isDivisionHidden ? 1 : 2} className="sticky-col-super" style={{ padding: '0.75rem 0.5rem', color: 'var(--gsh-red)' }}>
                    GRAND TOTAL SUMMARY {unitMode === 'millions' ? '(in Millions)' : (unitMode === 'lakhs' ? '(in Lakhs)' : '(in Rs.)')}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', background: 'var(--bg-card)' }}>{formatValue(summaryTotals.m_budget, unitMode)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: '#10b981', background: 'var(--bg-card)' }}>{formatValue(summaryTotals.m_actual, unitMode)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', borderRight: '1px solid var(--border-color)', color: '#10b981', background: 'var(--bg-card)' }}>{summaryTotals.cur_pct}%</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', background: 'var(--bg-card)' }}>{formatValue(summaryTotals.c_budget, unitMode)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: '#3b82f6', background: 'var(--bg-card)' }}>{formatValue(summaryTotals.c_actual, unitMode)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', borderRight: '1px solid var(--border-color)', color: '#3b82f6', background: 'var(--bg-card)' }}>{summaryTotals.cum_pct}%</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', background: 'var(--bg-card)' }}>{formatValue(summaryTotals.a_budget, unitMode)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', background: 'var(--bg-card)' }}>{formatValue(summaryTotals.a_actual, unitMode)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--gsh-red)', background: 'var(--bg-card)' }}>{summaryTotals.tot_pct}%</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

    </div>
  );
};

export default TotalRangeFyPage;
