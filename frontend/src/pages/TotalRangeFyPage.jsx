import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Info, Layers, RefreshCw, Search, CheckCircle, AlertCircle, ChevronRight, ChevronDown, Package, Hash, Box } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MonthCalendarBar from '../components/common/MonthCalendarBar';
import api from '../services/api';

const fmt = (v) => (v || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const TotalRangeFyPage = () => {
  const [selectedMonth, setSelectedMonth] = useState('july');
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [reportData, setReportData] = useState([]);
  const [summaryTotals, setSummaryTotals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Level 1 Expand: Division Ranges
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Level 2 Expand: Sales Groups (Click to view Product SKUs dropdown aligned directly with headers)
  const [expandedSg, setExpandedSg] = useState(new Set());

  // Hover Tooltip: Quick Preview
  const [hoveredSg, setHoveredSg] = useState(null);

  const navigate = useNavigate();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadRangeReport = async () => {
    setLoading(true);
    try {
      const params = { month: selectedMonth, search: searchTerm };
      if (selectedDate) params.date = selectedDate;

      const res = await api.get('/reports/total-range-fy', { params });
      if (res.data) {
        setReportData(res.data.rows || []);
        setSummaryTotals(res.data.summary_totals || null);
      }
    } catch {
      showToast('Failed to load Total Range FY report data.', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRangeReport();
  }, [selectedMonth, selectedDate, searchTerm]);

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
            Ranges created in Admin (A to Z) mapped with Monthly, Cumulative (Last 4M), and Annual Sales Updates (Values in LKR). Click Division Range for Sales Groups, click Sales Group for Product SKUs aligned with headers.
          </p>
        </div>

        <button onClick={loadRangeReport} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 0.9rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
          <RefreshCw style={{ width: '15px', height: '15px' }} /> Refresh
        </button>
      </div>

      {/* ─── Interactive Month & Calendar Date Bar ─── */}
      <MonthCalendarBar
        selectedMonth={selectedMonth}
        onSelectMonth={setSelectedMonth}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      {/* Search Bar & Total Ranges Count */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--text-subtle)' }} />
          <input
            type="text"
            placeholder="Search Division Range Name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.45rem 0.75rem 0.45rem 2.4rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.825rem', outline: 'none' }}
          />
        </div>

        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
          Displaying <strong>{reportData.length}</strong> Division Ranges (Product rows aligned 100% under main columns)
        </div>
      </div>

      {/* Main Datatable with Multi-Level Perfectly Aligned Tree Rows */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 11, background: 'var(--bg-card)' }}>
              {/* Grouped Super Header Row */}
              <tr style={{ background: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-main)', fontWeight: 800, textTransform: 'uppercase' }}>
                <th colSpan="2" style={{ padding: '0.65rem 0.85rem', borderRight: '1px solid var(--border-color)' }}>DIVISION RANGE / SALES GROUP / PRODUCT SKU</th>
                <th colSpan="3" style={{ padding: '0.65rem 0.85rem', textAlign: 'center', borderRight: '1px solid var(--border-color)', background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}>
                  TOTAL - CURRENT MONTH DETAILS ({selectedMonth.toUpperCase()})
                </th>
                <th colSpan="3" style={{ padding: '0.65rem 0.85rem', textAlign: 'center', borderRight: '1px solid var(--border-color)', background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}>
                  CUMULATIVE - SALES UPDATE (LAST 4 MONTHS)
                </th>
                <th colSpan="3" style={{ padding: '0.65rem 0.85rem', textAlign: 'center', background: 'rgba(200, 16, 46, 0.08)', color: 'var(--gsh-red)' }}>
                  ANNUAL - SALES UPDATE (FULL YEAR FY 2026/27)
                </th>
              </tr>
              {/* Sub-Header Row */}
              <tr style={{ background: 'var(--bg-card)', borderBottom: '2px solid var(--border-color)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-subtle)' }}>
                <th style={{ padding: '0.55rem 0.75rem', width: '45px' }}>No</th>
                <th style={{ padding: '0.55rem 0.75rem', borderRight: '1px solid var(--border-color)' }}>DIVISION RANGE / SALES GROUP / PRODUCT SKU</th>
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
                  <td colSpan="11" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading dynamic Division Range FY data...
                  </td>
                </tr>
              ) : reportData.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
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
                          background: isExpanded ? 'rgba(200,16,46,0.06)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <td style={{ padding: '0.55rem 0.75rem', fontWeight: 700, color: 'var(--gsh-red)' }}>{row.no}</td>
                        <td style={{ padding: '0.55rem 0.75rem', fontWeight: 800, color: 'var(--text-main)', borderRight: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {hasSubGroups ? (
                            isExpanded ? <ChevronDown style={{ width: '16px', height: '16px', color: 'var(--gsh-red)' }} /> : <ChevronRight style={{ width: '16px', height: '16px', color: 'var(--text-subtle)' }} />
                          ) : (
                            <span style={{ width: '16px' }}></span>
                          )}
                          <span>{row.division}</span>
                          {hasSubGroups && (
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', marginLeft: 'auto' }}>
                              {row.sales_groups.length} {row.sales_groups.length === 1 ? 'group' : 'groups'}
                            </span>
                          )}
                        </td>
                        
                        {/* Monthly Details */}
                        <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: 700 }}>{fmt(row.m_budget)}</td>
                        <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: 800, color: '#10b981' }}>{fmt(row.m_actual)}</td>
                        <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', borderRight: '1px solid var(--border-color)' }}>
                          <span style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800, background: row.cur_pct >= 100 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: row.cur_pct >= 100 ? '#10b981' : '#ef4444' }}>
                            {row.cur_pct}%
                          </span>
                        </td>

                        {/* Cumulative Details */}
                        <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: 700 }}>{fmt(row.c_budget)}</td>
                        <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: 800, color: '#3b82f6' }}>{fmt(row.c_actual)}</td>
                        <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', borderRight: '1px solid var(--border-color)' }}>
                          <span style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800, background: row.cum_pct >= 100 ? 'rgba(59,130,246,0.15)' : 'rgba(245,158,11,0.15)', color: row.cum_pct >= 100 ? '#3b82f6' : '#f59e0b' }}>
                            {row.cum_pct}%
                          </span>
                        </td>

                        {/* Annual Details */}
                        <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: 700 }}>{fmt(row.a_budget)}</td>
                        <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: 800, color: 'var(--text-main)' }}>{fmt(row.a_actual)}</td>
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
                              <tr style={{ borderBottom: '1px solid var(--border-color)', background: isSgOpen ? 'rgba(0,168,150,0.06)' : 'var(--bg-hover)', fontSize: '0.78rem' }}>
                                <td style={{ padding: '0.4rem 0.75rem', color: 'var(--text-subtle)', textAlign: 'right' }}>↳</td>
                                
                                {/* SALES GROUP BADGE WITH CLICK TO DROPDOWN + HOVER TOOLTIP */}
                                <td style={{ padding: '0.45rem 0.75rem 0.45rem 2rem', color: 'var(--text-main)', borderRight: '1px solid var(--border-color)', position: 'relative' }}>
                                  <span 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleSgExpand(sgKey);
                                    }}
                                    onMouseEnter={(e) => {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      setHoveredSg({
                                        name: sg.sales_group,
                                        products: sg.products || [],
                                        count: sg.products_count || (sg.products ? sg.products.length : 0),
                                        top: rect.bottom + window.scrollY + 6,
                                        left: Math.min(rect.left + window.scrollX, window.innerWidth - 420)
                                      });
                                    }}
                                    onMouseLeave={() => setHoveredSg(null)}
                                    title="Click to toggle Product SKUs dropdown, or hover to preview"
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
                                      transition: 'all 0.15s ease'
                                    }}
                                  >
                                    {hasProducts ? (
                                      isSgOpen ? <ChevronDown style={{ width: '13px', height: '13px' }} /> : <ChevronRight style={{ width: '13px', height: '13px' }} />
                                    ) : (
                                      <Package style={{ width: '13px', height: '13px' }} />
                                    )}
                                    <span>{sg.sales_group}</span>
                                    {sg.products_count > 0 && (
                                      <span style={{ fontSize: '0.68rem', fontWeight: 800, background: isSgOpen ? '#fff' : 'var(--gsh-teal)', color: isSgOpen ? 'var(--gsh-teal)' : '#fff', padding: '0.05rem 0.35rem', borderRadius: '10px', marginLeft: '0.2rem' }}>
                                        {sg.products_count} {isSgOpen ? 'Open' : 'SKUs'}
                                      </span>
                                    )}
                                  </span>
                                </td>

                                <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>{fmt(sg.m_budget)}</td>
                                <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>{fmt(sg.m_actual)}</td>
                                <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', borderRight: '1px solid var(--border-color)' }}>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: sg.cur_pct >= 100 ? '#10b981' : '#ef4444' }}>{sg.cur_pct}%</span>
                                </td>

                                <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>{fmt(sg.c_budget)}</td>
                                <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', fontWeight: 600, color: '#3b82f6' }}>{fmt(sg.c_actual)}</td>
                                <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', borderRight: '1px solid var(--border-color)' }}>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: sg.cum_pct >= 100 ? '#3b82f6' : '#f59e0b' }}>{sg.cum_pct}%</span>
                                </td>

                                <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>{fmt(sg.a_budget)}</td>
                                <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-main)' }}>{fmt(sg.a_actual)}</td>
                                <td style={{ padding: '0.45rem 0.75rem', textAlign: 'right' }}>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--gsh-red)' }}>{sg.tot_pct}%</span>
                                </td>
                              </tr>

                              {/* LEVEL 3: DIRECT TABLE ROWS FOR PRODUCT SKUs (100% PERFECTLY ALIGNED WITH MAIN TABLE HEADERS) */}
                              {isSgOpen && hasProducts && (
                                sg.products.map((p, pIdx) => (
                                  <tr 
                                    key={`p_${pIdx}`} 
                                    style={{ 
                                      borderBottom: '1px solid var(--border-color)', 
                                      background: 'rgba(0,168,150,0.02)', 
                                      fontSize: '0.75rem' 
                                    }}
                                  >
                                    <td style={{ padding: '0.35rem 0.75rem', color: 'var(--text-subtle)', textAlign: 'right', fontSize: '0.7rem' }}>
                                      ↳ ↳
                                    </td>

                                    {/* Product SKU Name + Part No Badge */}
                                    <td style={{ padding: '0.35rem 0.75rem 0.35rem 3.2rem', borderRight: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--gsh-red)', background: 'rgba(200,16,46,0.08)', padding: '0.1rem 0.35rem', borderRadius: '3px', border: '1px solid rgba(200,16,46,0.2)', fontSize: '0.7rem', flexShrink: 0 }}>
                                        {p.part_no}
                                      </span>
                                      <span style={{ fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {p.product_sku}
                                      </span>
                                    </td>

                                    {/* Product Monthly Figures (Directly under MONTHLY-BUDGET, MONTHLY-ACTUAL, CUR - %) */}
                                    <td style={{ padding: '0.35rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>{fmt(p.m_budget)}</td>
                                    <td style={{ padding: '0.35rem 0.75rem', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>{fmt(p.m_actual)}</td>
                                    <td style={{ padding: '0.35rem 0.75rem', textAlign: 'right', borderRight: '1px solid var(--border-color)' }}>
                                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: p.cur_pct >= 100 ? '#10b981' : '#ef4444' }}>{p.cur_pct}%</span>
                                    </td>

                                    {/* Product Cumulative Figures (Directly under CUM-BUDGET, CUM-ACTUAL, CUM - %) */}
                                    <td style={{ padding: '0.35rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>{fmt(p.c_budget)}</td>
                                    <td style={{ padding: '0.35rem 0.75rem', textAlign: 'right', fontWeight: 600, color: '#3b82f6' }}>{fmt(p.c_actual)}</td>
                                    <td style={{ padding: '0.35rem 0.75rem', textAlign: 'right', borderRight: '1px solid var(--border-color)' }}>
                                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: p.cum_pct >= 100 ? '#3b82f6' : '#f59e0b' }}>{p.cum_pct}%</span>
                                    </td>

                                    {/* Product Annual Figures (Directly under ANNUAL-BUDGET, ANNUAL-ACTUAL, ANNUAL - %) */}
                                    <td style={{ padding: '0.35rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>{fmt(p.a_budget)}</td>
                                    <td style={{ padding: '0.35rem 0.75rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-main)' }}>{fmt(p.a_actual)}</td>
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
              <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 10, background: 'var(--bg-card)', borderTop: '2.5px solid var(--gsh-red)', fontWeight: 800, fontSize: '0.85rem', boxShadow: '0 -6px 20px rgba(0,0,0,0.15)' }}>
                <tr>
                  <td colSpan="2" style={{ padding: '0.75rem', color: 'var(--gsh-red)', borderRight: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>GRAND TOTAL SUMMARY</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', background: 'var(--bg-card)' }}>{fmt(summaryTotals.m_budget)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: '#10b981', background: 'var(--bg-card)' }}>{fmt(summaryTotals.m_actual)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', borderRight: '1px solid var(--border-color)', color: '#10b981', background: 'var(--bg-card)' }}>{summaryTotals.cur_pct}%</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', background: 'var(--bg-card)' }}>{fmt(summaryTotals.c_budget)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: '#3b82f6', background: 'var(--bg-card)' }}>{fmt(summaryTotals.c_actual)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', borderRight: '1px solid var(--border-color)', color: '#3b82f6', background: 'var(--bg-card)' }}>{summaryTotals.cum_pct}%</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', background: 'var(--bg-card)' }}>{fmt(summaryTotals.a_budget)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', background: 'var(--bg-card)' }}>{fmt(summaryTotals.a_actual)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--gsh-red)', background: 'var(--bg-card)' }}>{summaryTotals.tot_pct}%</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ─── HOVER TOOLTIP FLOATING CARD (PORTAL DIRECTLY TO BODY) ─── */}
      {hoveredSg && ReactDOM.createPortal(
        <div
          style={{
            position: 'absolute',
            top: `${hoveredSg.top}px`,
            left: `${hoveredSg.left}px`,
            zIndex: 999999,
            width: '390px',
            background: 'var(--bg-card)',
            border: '1.5px solid var(--gsh-teal)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: '0 15px 35px rgba(0,0,0,0.35)',
            padding: '0.85rem',
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.85rem', color: 'var(--gsh-teal)' }}>
              <Package style={{ width: '16px', height: '16px' }} />
              Sales Group: {hoveredSg.name}
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, background: 'rgba(0,168,150,0.12)', color: 'var(--gsh-teal)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
              {hoveredSg.count} {hoveredSg.count === 1 ? 'Product' : 'Products / SKUs'}
            </span>
          </div>

          {/* Product Items Table */}
          {hoveredSg.products && hoveredSg.products.length > 0 ? (
            <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-hover)', color: 'var(--text-subtle)', fontWeight: 800, borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '0.3rem 0.4rem', width: '80px' }}>Part No</th>
                    <th style={{ padding: '0.3rem 0.4rem' }}>Product Name (SKU)</th>
                  </tr>
                </thead>
                <tbody>
                  {hoveredSg.products.map((p, pIdx) => (
                    <tr key={pIdx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.3rem 0.4rem', fontFamily: 'monospace', fontWeight: 800, color: 'var(--gsh-red)' }}>
                        {p.part_no}
                      </td>
                      <td style={{ padding: '0.3rem 0.4rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {p.product_sku}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '0.5rem', textAlign: 'center' }}>
              No product SKUs recorded for this Sales Group.
            </div>
          )}
        </div>,
        document.body
      )}

    </div>
  );
};

export default TotalRangeFyPage;
