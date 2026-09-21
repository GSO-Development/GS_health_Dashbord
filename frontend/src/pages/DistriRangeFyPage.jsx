import React, { useState, useEffect } from 'react';
import { BarChart2, RefreshCw, Search, ChevronRight, ChevronDown, Eye, EyeOff, CheckCircle2, Layers, Package } from 'lucide-react';
import MonthCalendarBar, { getCurrentMonthKey } from '../components/common/MonthCalendarBar';
import DataLoaderOverlay from '../components/common/DataLoaderOverlay';
import ContractMultiSelect from '../components/common/ContractMultiSelect';
import api from '../services/api';

const fmt = (v) => (v || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const DistriRangeFyPage = () => {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [backlogMode, setBacklogMode] = useState('with'); // 'with' | 'without' | 'only'
  const [selectedContracts, setSelectedContracts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [treeData, setTreeData] = useState([]);
  const [grandTotal, setGrandTotal] = useState(null);
  const [loading, setLoading] = useState(true);

  // Toggle hide/show Division column for maximum mobile screen width
  const [isDivisionHidden, setIsDivisionHidden] = useState(false);

  // State to track expanded Divisions & SubGroups
  const [expandedDivisions, setExpandedDivisions] = useState({});
  const [expandedSubgroups, setExpandedSubgroups] = useState({});

  const fetchDistriRangeData = async () => {
    setLoading(true);
    try {
      const params = { month: selectedMonth, backlog_mode: backlogMode };
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

      const res = await api.get('/reports/distri-range-fy', { params });
      if (res.data) {
        setTreeData(res.data.tree || []);
        setGrandTotal(res.data.grand_total || null);
      }
    } catch {
      // Fallback
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDistriRangeData();
  }, [selectedMonth, startDate, endDate, backlogMode, selectedContracts]);

  const toggleDivision = (divName) => {
    setExpandedDivisions(prev => ({
      ...prev,
      [divName]: !prev[divName]
    }));
  };

  const toggleSubgroup = (keyStr) => {
    setExpandedSubgroups(prev => ({
      ...prev,
      [keyStr]: !prev[keyStr]
    }));
  };

  const expandAll = () => {
    const newDivs = {};
    const newSubs = {};
    treeData.forEach(d => {
      newDivs[d.division_name] = true;
      (d.subgroups || []).forEach(s => {
        newSubs[`${d.division_name}_${s.subgroup_name}`] = true;
      });
    });
    setExpandedDivisions(newDivs);
    setExpandedSubgroups(newSubs);
  };

  const collapseAll = () => {
    setExpandedDivisions({});
    setExpandedSubgroups({});
  };

  // Filtered Tree Data by Search Term
  const filteredTree = treeData.filter(d => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchDiv = d.division_name.toLowerCase().includes(term);
    const matchSub = (d.subgroups || []).some(s => 
      s.subgroup_name.toLowerCase().includes(term) ||
      (s.items || []).some(i => i.part_no.toLowerCase().includes(term) || i.product_sku.toLowerCase().includes(term))
    );
    return matchDiv || matchSub;
  });

  return (
    <div className="page-view animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart2 style={{ width: '24px', height: '24px', color: 'var(--gsh-red)' }} />
            DISTRI-Range wise fy (Interactive Division, Subgroup & Item Tree)
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
            Click any Division or Subgroup row to expand child items. Live Primary & RD Target/Actual metrics.
          </p>
        </div>

        {/* Contract Multi-Select */}
        <div>
          <ContractMultiSelect
            selectedContracts={selectedContracts}
            onChange={setSelectedContracts}
            disabled={loading}
          />
        </div>
      </div>

      {/* ─── Backlog Calculation Mode Switcher (With / Without / Only Backlog) ─── */}
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
            Backlog Calculation Mode:
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: backlogMode === 'with' ? '#10b981' : (backlogMode === 'without' ? '#6366f1' : '#f59e0b') }}>
            {backlogMode === 'with' && '● Invoiced + Pending Backlog (Default)'}
            {backlogMode === 'without' && '● Invoiced Sales Only (Excl. Backlog)'}
            {backlogMode === 'only' && '● Pending Backlog Orders Only'}
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
            <CheckCircle2 style={{ width: '13px', height: '13px' }} />
            With Backlog (Default)
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
            <Layers style={{ width: '13px', height: '13px' }} />
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
            Only Backlog (Pending Orders)
          </button>
        </div>
      </div>

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

      {/* Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ position: 'relative', width: '340px' }}>
          <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--text-subtle)' }} />
          <input
            type="text"
            placeholder="Search Division, Subgroup, Item Code, SKU..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.45rem 0.75rem 0.45rem 2.4rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.825rem', outline: 'none' }}
          />
        </div>

        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
          Showing <strong>{filteredTree.length}</strong> Divisions ({treeData.length} total)
        </div>
      </div>

      {/* Datatable with Interactive 3-Level Collapsible Tree */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', position: 'relative', minHeight: '440px' }}>
        <DataLoaderOverlay loading={loading} title="Crunching Distri-Range Wise Analytics..." />
        <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 280px)', overflowY: 'auto', opacity: loading ? 0.35 : 1, transition: 'opacity 0.25s ease' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 20, background: 'var(--bg-card)' }}>
              {/* Grouped Super Header Row */}
              <tr style={{ background: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-main)', fontWeight: 800, textTransform: 'uppercase' }}>
                <th colSpan={isDivisionHidden ? 1 : 2} className="sticky-col-super" style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>Division</th>
                <th colSpan="6" style={{ padding: '0.65rem 0.85rem', textAlign: 'center', borderRight: '1px solid var(--border-color)', background: 'rgba(6, 182, 212, 0.08)', color: '#06b6d4' }}>
                  Division wise Sales Update - Current Month ({selectedMonth.toUpperCase()})
                </th>
                <th colSpan="6" style={{ padding: '0.65rem 0.85rem', textAlign: 'center', background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}>
                  Division wise Sales Update - Cumulative (YTD)
                </th>
              </tr>
              {/* Sub-Header Row */}
              <tr style={{ background: 'var(--bg-card)', borderBottom: '2px solid var(--border-color)', fontSize: '0.725rem', fontWeight: 800, color: 'var(--text-subtle)' }}>
                <th className="sticky-col-1" style={{ padding: '0.5rem 0.15rem', textAlign: 'center' }}>
                  {isDivisionHidden ? (
                    <button
                      onClick={() => setIsDivisionHidden(false)}
                      title="Show Division Name Column"
                      style={{ background: 'var(--gsh-teal)', color: '#fff', border: 'none', borderRadius: '3px', padding: '0.15rem 0.25rem', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center' }}
                    >
                      <Eye style={{ width: '11px', height: '11px' }} />
                    </button>
                  ) : '#'}
                </th>
                {!isDivisionHidden && (
                  <th className="sticky-col-2" style={{ padding: '0.5rem 0.4rem', textAlign: 'center' }}>
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
                
                {/* Current Month */}
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Primary-Target</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Primary-Actual</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Pri - %</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>RD-Target</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>RD-Actual</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', borderRight: '1px solid var(--border-color)' }}>RD - %</th>

                {/* Cumulative */}
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Primary-Target</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Primary-Actual</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Pri : %</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>RD-Target</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>RD-Actual</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>RD : %</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isDivisionHidden ? 13 : 14} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading DISTRI-Range wise tree calculations...
                  </td>
                </tr>
              ) : filteredTree.length === 0 ? (
                <tr>
                  <td colSpan={isDivisionHidden ? 13 : 14} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No Divisions matching "{searchTerm}".
                  </td>
                </tr>
              ) : (
                filteredTree.map((div, divIdx) => {
                  const isDivExpanded = Boolean(expandedDivisions[div.division_name] || searchTerm.trim());

                  return (
                    <React.Fragment key={`div_${div.division_name}`}>
                      {/* LEVEL 1: DIVISION ROW */}
                      <tr
                        onClick={() => toggleDivision(div.division_name)}
                        style={{ borderBottom: '1px solid var(--border-color)', background: isDivExpanded ? '#fef2f2' : 'var(--bg-card)', cursor: 'pointer', fontWeight: 800 }}
                      >
                        <td className="sticky-cell-1" style={{ padding: '0.6rem 0.15rem', color: 'var(--gsh-red)', fontWeight: 800, textAlign: 'center', background: isDivExpanded ? '#fef2f2' : 'var(--bg-card)' }}>{div.no || divIdx + 1}</td>
                        {!isDivisionHidden && (
                          <td className="sticky-cell-2" style={{ padding: '0.6rem 0.5rem', color: 'var(--text-main)', background: isDivExpanded ? '#fef2f2' : 'var(--bg-card)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%' }}>
                              {isDivExpanded ? <ChevronDown style={{ width: '16px', height: '16px', color: 'var(--gsh-red)', flexShrink: 0 }} /> : <ChevronRight style={{ width: '16px', height: '16px', color: 'var(--text-subtle)', flexShrink: 0 }} />}
                              <span style={{ fontSize: '0.85rem', color: 'var(--gsh-teal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{div.division_name}</span>
                              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--gsh-teal)', background: 'rgba(0,168,150,0.12)', padding: '0.1rem 0.35rem', borderRadius: '4px', border: '1px solid rgba(0,168,150,0.25)', marginLeft: 'auto', flexShrink: 0 }}>
                                {div.subgroups?.length || 0}G
                              </span>
                            </div>
                          </td>
                        )}

                        {/* Current Month */}
                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>{fmt(div.p_tgt)}</td>
                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', color: '#06b6d4' }}>{fmt(div.p_act)}</td>
                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>
                          <span style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800, background: div.p_pct >= 100 ? 'rgba(6,182,212,0.15)' : 'rgba(239,68,68,0.15)', color: div.p_pct >= 100 ? '#06b6d4' : '#ef4444' }}>
                            {div.p_pct}%
                          </span>
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>{fmt(div.rd_tgt)}</td>
                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', color: '#3b82f6' }}>{fmt(div.rd_act)}</td>
                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', borderRight: '1px solid var(--border-color)' }}>
                          <span style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800, background: div.rd_pct >= 100 ? 'rgba(59,130,246,0.15)' : 'rgba(245,158,11,0.15)', color: div.rd_pct >= 100 ? '#3b82f6' : '#f59e0b' }}>
                            {div.rd_pct}%
                          </span>
                        </td>

                        {/* Cumulative */}
                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>{fmt(div.c_p_tgt)}</td>
                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', color: '#06b6d4' }}>{fmt(div.c_p_act)}</td>
                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>
                          <span style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800, background: div.c_p_pct >= 100 ? 'rgba(6,182,212,0.15)' : 'rgba(239,68,68,0.15)', color: div.c_p_pct >= 100 ? '#06b6d4' : '#ef4444' }}>
                            {div.c_p_pct}%
                          </span>
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>{fmt(div.c_rd_tgt)}</td>
                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', color: '#3b82f6' }}>{fmt(div.c_rd_act)}</td>
                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>
                          <span style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800, background: div.c_rd_pct >= 100 ? 'rgba(59,130,246,0.15)' : 'rgba(245,158,11,0.15)', color: div.c_rd_pct >= 100 ? '#3b82f6' : '#f59e0b' }}>
                            {div.c_rd_pct}%
                          </span>
                        </td>
                      </tr>

                      {/* LEVEL 2: SUBGROUP ROWS */}
                      {isDivExpanded && (div.subgroups || []).map((sub) => {
                        const subKey = `${div.division_name}_${sub.subgroup_name}`;
                        const isSubExpanded = Boolean(expandedSubgroups[subKey] || searchTerm.trim());

                        return (
                          <React.Fragment key={`sub_${subKey}`}>
                            <tr
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSubgroup(subKey);
                              }}
                              style={{ borderBottom: '1px solid var(--border-color)', background: isSubExpanded ? '#f0fdfa' : '#f8fafc', cursor: 'pointer', fontWeight: 700 }}
                            >
                              <td className="sticky-cell-1" style={{ padding: '0.5rem 0.15rem', color: 'var(--text-subtle)', textAlign: 'center', background: isSubExpanded ? '#f0fdfa' : '#f8fafc' }}>↳</td>
                              {!isDivisionHidden && (
                                <td className="sticky-cell-2" style={{ padding: '0.5rem 0.5rem', color: 'var(--text-main)', background: isSubExpanded ? '#f0fdfa' : '#f8fafc' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%' }}>
                                    {isSubExpanded ? <ChevronDown style={{ width: '14px', height: '14px', color: 'var(--gsh-teal)', flexShrink: 0 }} /> : <ChevronRight style={{ width: '14px', height: '14px', color: 'var(--text-subtle)', flexShrink: 0 }} />}
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.subgroup_name}</span>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-subtle)', flexShrink: 0 }}>
                                      ({sub.items?.length || 0})
                                    </span>
                                  </div>
                                </td>
                              )}

                              {/* Current Month */}
                              <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{fmt(sub.p_tgt)}</td>
                              <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: '#06b6d4' }}>{fmt(sub.p_act)}</td>
                              <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: sub.p_pct >= 100 ? '#06b6d4' : '#ef4444' }}>{sub.p_pct}%</span>
                              </td>
                              <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{fmt(sub.rd_tgt)}</td>
                              <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: '#3b82f6' }}>{fmt(sub.rd_act)}</td>
                              <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', borderRight: '1px solid var(--border-color)' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: sub.rd_pct >= 100 ? '#3b82f6' : '#f59e0b' }}>{sub.rd_pct}%</span>
                              </td>

                              {/* Cumulative */}
                              <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{fmt(sub.c_p_tgt)}</td>
                              <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: '#06b6d4' }}>{fmt(sub.c_p_act)}</td>
                              <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: sub.c_p_pct >= 100 ? '#06b6d4' : '#ef4444' }}>{sub.c_p_pct}%</span>
                              </td>
                              <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{fmt(sub.c_rd_tgt)}</td>
                              <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: '#3b82f6' }}>{fmt(sub.c_rd_act)}</td>
                              <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: sub.c_rd_pct >= 100 ? '#3b82f6' : '#f59e0b' }}>{sub.c_rd_pct}%</span>
                              </td>
                            </tr>

                            {/* LEVEL 3: ITEM ROWS */}
                            {isSubExpanded && (sub.items || []).map((item, iIdx) => (
                              <tr key={`item_${subKey}_${item.part_no}_${iIdx}`} style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
                                <td className="sticky-cell-1" style={{ padding: '0.4rem 0.15rem', color: 'var(--text-subtle)', textAlign: 'center', fontSize: '0.7rem', background: 'var(--bg-card)' }}>•</td>
                                {!isDivisionHidden && (
                                  <td className="sticky-cell-2" style={{ padding: '0.4rem 0.5rem', background: 'var(--bg-card)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%' }}>
                                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--gsh-red)', marginRight: '0.2rem', flexShrink: 0 }}>{item.part_no}</span>
                                      <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product_sku}</span>
                                    </div>
                                  </td>
                                )}

                                {/* Current Month */}
                                <td style={{ padding: '0.4rem 0.75rem', textAlign: 'right', color: 'var(--text-subtle)' }}>{fmt(item.p_tgt)}</td>
                                <td style={{ padding: '0.4rem 0.75rem', textAlign: 'right', color: '#06b6d4' }}>{fmt(item.p_act)}</td>
                                <td style={{ padding: '0.4rem 0.75rem', textAlign: 'right' }}>
                                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: item.p_pct >= 100 ? '#06b6d4' : '#ef4444' }}>{item.p_pct}%</span>
                                </td>
                                <td style={{ padding: '0.4rem 0.75rem', textAlign: 'right', color: 'var(--text-subtle)' }}>{fmt(item.rd_tgt)}</td>
                                <td style={{ padding: '0.4rem 0.75rem', textAlign: 'right', color: '#3b82f6' }}>{fmt(item.rd_act)}</td>
                                <td style={{ padding: '0.4rem 0.75rem', textAlign: 'right', borderRight: '1px solid var(--border-color)' }}>
                                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: item.rd_pct >= 100 ? '#3b82f6' : '#f59e0b' }}>{item.rd_pct}%</span>
                                </td>

                                {/* Cumulative */}
                                <td style={{ padding: '0.4rem 0.75rem', textAlign: 'right', color: 'var(--text-subtle)' }}>{fmt(item.c_p_tgt)}</td>
                                <td style={{ padding: '0.4rem 0.75rem', textAlign: 'right', color: '#06b6d4' }}>{fmt(item.c_p_act)}</td>
                                <td style={{ padding: '0.4rem 0.75rem', textAlign: 'right' }}>
                                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: item.c_p_pct >= 100 ? '#06b6d4' : '#ef4444' }}>{item.c_p_pct}%</span>
                                </td>
                                <td style={{ padding: '0.4rem 0.75rem', textAlign: 'right', color: 'var(--text-subtle)' }}>{fmt(item.c_rd_tgt)}</td>
                                <td style={{ padding: '0.4rem 0.75rem', textAlign: 'right', color: '#3b82f6' }}>{fmt(item.c_rd_act)}</td>
                                <td style={{ padding: '0.4rem 0.75rem', textAlign: 'right' }}>
                                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: item.c_rd_pct >= 100 ? '#3b82f6' : '#f59e0b' }}>{item.c_rd_pct}%</span>
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        );
                      })}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>

            {/* GRAND TOTAL SUMMARY FOOTER */}
            {grandTotal && (
              <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 20, background: 'var(--bg-card)', borderTop: '3px solid var(--gsh-red)', fontWeight: 800 }}>
                <tr>
                  <td colSpan={isDivisionHidden ? 1 : 2} className="sticky-col-super" style={{ padding: '0.75rem 0.5rem', color: 'var(--gsh-red)', fontSize: '0.85rem' }}>
                    GRAND TOTAL SUMMARY
                  </td>

                  {/* Current Month */}
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>{fmt(grandTotal.p_tgt)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: '#06b6d4' }}>{fmt(grandTotal.p_act)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    <span style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, background: grandTotal.p_pct >= 100 ? 'rgba(6,182,212,0.15)' : 'rgba(239,68,68,0.15)', color: grandTotal.p_pct >= 100 ? '#06b6d4' : '#ef4444' }}>
                      {grandTotal.p_pct}%
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>{fmt(grandTotal.rd_tgt)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: '#3b82f6' }}>{fmt(grandTotal.rd_act)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', borderRight: '1px solid var(--border-color)' }}>
                    <span style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, background: grandTotal.rd_pct >= 100 ? 'rgba(59,130,246,0.15)' : 'rgba(245,158,11,0.15)', color: grandTotal.rd_pct >= 100 ? '#3b82f6' : '#f59e0b' }}>
                      {grandTotal.rd_pct}%
                    </span>
                  </td>

                  {/* Cumulative */}
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>{fmt(grandTotal.c_p_tgt)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: '#06b6d4' }}>{fmt(grandTotal.c_p_act)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    <span style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, background: grandTotal.c_p_pct >= 100 ? 'rgba(6,182,212,0.15)' : 'rgba(239,68,68,0.15)', color: grandTotal.c_p_pct >= 100 ? '#06b6d4' : '#ef4444' }}>
                      {grandTotal.c_p_pct}%
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>{fmt(grandTotal.c_rd_tgt)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: '#3b82f6' }}>{fmt(grandTotal.c_rd_act)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    <span style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, background: grandTotal.c_rd_pct >= 100 ? 'rgba(59,130,246,0.15)' : 'rgba(245,158,11,0.15)', color: grandTotal.c_rd_pct >= 100 ? '#3b82f6' : '#f59e0b' }}>
                      {grandTotal.c_rd_pct}%
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

    </div>
  );
};

export default DistriRangeFyPage;
