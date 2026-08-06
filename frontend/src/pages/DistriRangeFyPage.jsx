import React, { useState, useEffect } from 'react';
import { BarChart2, RefreshCw, Search, ChevronRight, ChevronDown } from 'lucide-react';
import MonthCalendarBar from '../components/common/MonthCalendarBar';
import api from '../services/api';

const fmt = (v) => (v || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const DistriRangeFyPage = () => {
  const [selectedMonth, setSelectedMonth] = useState('july');
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [treeData, setTreeData] = useState([]);
  const [grandTotal, setGrandTotal] = useState(null);
  const [loading, setLoading] = useState(true);

  // State to track expanded Divisions & SubGroups
  const [expandedDivisions, setExpandedDivisions] = useState({});
  const [expandedSubgroups, setExpandedSubgroups] = useState({});

  const fetchDistriRangeData = async () => {
    setLoading(true);
    try {
      const params = { month: selectedMonth };
      if (selectedDate) params.date = selectedDate;

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
  }, [selectedMonth, selectedDate]);

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

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button onClick={expandAll} style={{ padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
            📂 Expand All
          </button>
          <button onClick={collapseAll} style={{ padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
            📁 Collapse All
          </button>
          <button onClick={fetchDistriRangeData} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 0.9rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
            <RefreshCw style={{ width: '15px', height: '15px' }} /> Refresh Live Data
          </button>
        </div>
      </div>

      {/* ─── Interactive Month & Calendar Date Bar ─── */}
      <MonthCalendarBar
        selectedMonth={selectedMonth}
        onSelectMonth={setSelectedMonth}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
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
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 20, background: 'var(--bg-card)' }}>
              {/* Grouped Super Header Row */}
              <tr style={{ background: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-main)', fontWeight: 800, textTransform: 'uppercase' }}>
                <th colSpan="2" style={{ padding: '0.65rem 0.85rem', borderRight: '1px solid var(--border-color)' }}>Division / Subgroup / Item</th>
                <th colSpan="6" style={{ padding: '0.65rem 0.85rem', textAlign: 'center', borderRight: '1px solid var(--border-color)', background: 'rgba(6, 182, 212, 0.08)', color: '#06b6d4' }}>
                  Division wise Sales Update - Current Month ({selectedMonth.toUpperCase()})
                </th>
                <th colSpan="6" style={{ padding: '0.65rem 0.85rem', textAlign: 'center', background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}>
                  Division wise Sales Update - Cumulative (YTD)
                </th>
              </tr>
              {/* Sub-Header Row */}
              <tr style={{ background: 'var(--bg-card)', borderBottom: '2px solid var(--border-color)', fontSize: '0.725rem', fontWeight: 800, color: 'var(--text-subtle)' }}>
                <th style={{ padding: '0.5rem 0.75rem', width: '45px' }}>#</th>
                <th style={{ padding: '0.5rem 0.75rem', borderRight: '1px solid var(--border-color)' }}>Hierarchy Name</th>
                
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
                  <td colSpan="14" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading DISTRI-Range wise tree calculations...
                  </td>
                </tr>
              ) : filteredTree.length === 0 ? (
                <tr>
                  <td colSpan="14" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No Divisions matching "{searchTerm}".
                  </td>
                </tr>
              ) : (
                filteredTree.map((div) => {
                  const isDivExpanded = Boolean(expandedDivisions[div.division_name] || searchTerm.trim());

                  return (
                    <React.Fragment key={`div_${div.division_name}`}>
                      {/* LEVEL 1: DIVISION ROW */}
                      <tr
                        onClick={() => toggleDivision(div.division_name)}
                        style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-hover)', cursor: 'pointer', fontWeight: 800 }}
                      >
                        <td style={{ padding: '0.6rem 0.75rem', color: 'var(--gsh-red)', fontWeight: 800 }}>{div.no}</td>
                        <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-main)', borderRight: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {isDivExpanded ? <ChevronDown style={{ width: '16px', height: '16px', color: 'var(--gsh-red)' }} /> : <ChevronRight style={{ width: '16px', height: '16px', color: 'var(--text-subtle)' }} />}
                          <span style={{ fontSize: '0.85rem', color: 'var(--gsh-teal)' }}>{div.division_name}</span>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-subtle)', background: 'var(--bg-card)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                            {div.subgroups?.length || 0} Subgroups
                          </span>
                        </td>

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
                              style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,168,150,0.04)', cursor: 'pointer', fontWeight: 700 }}
                            >
                              <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-subtle)', textAlign: 'right' }}>↳</td>
                              <td style={{ padding: '0.5rem 0.75rem 0.5rem 2rem', color: 'var(--text-main)', borderRight: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                {isSubExpanded ? <ChevronDown style={{ width: '14px', height: '14px', color: 'var(--gsh-teal)' }} /> : <ChevronRight style={{ width: '14px', height: '14px', color: 'var(--text-subtle)' }} />}
                                <span>{sub.subgroup_name}</span>
                                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-subtle)' }}>
                                  ({sub.items?.length || 0} Items)
                                </span>
                              </td>

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
                                <td style={{ padding: '0.4rem 0.75rem', color: 'var(--text-subtle)', textAlign: 'right', fontSize: '0.7rem' }}>•</td>
                                <td style={{ padding: '0.4rem 0.75rem 0.4rem 3.2rem', borderRight: '1px solid var(--border-color)' }}>
                                  <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--gsh-red)', marginRight: '0.5rem' }}>{item.part_no}</span>
                                  <span style={{ color: 'var(--text-muted)' }}>{item.product_sku}</span>
                                </td>

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
                  <td colSpan="2" style={{ padding: '0.75rem', color: 'var(--gsh-red)', borderRight: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
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
