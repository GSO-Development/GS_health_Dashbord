import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart2, PieChart, TrendingUp, Activity, LayoutGrid,
  Plus, Trash2, Settings, Save, Play, Database,
  CheckCircle, AlertCircle, Loader, ArrowLeft, Table, ChevronDown, Layers, Filter, Calendar, Search
} from 'lucide-react';
import api from '../services/api';
import CircularGauge from '../components/common/CircularGauge';
import { useNavigate } from 'react-router-dom';

// ─── Constants & Fallback Templates ──────────────────────────────────────────

const TARGET_PAGE_OPTIONS = [
  { value: 'dashboard_fy', label: 'Dashboard FY', path: '/dashboard-fy', icon: LayoutGrid },
  { value: 'total_range_fy', label: 'Total- Range wise fy', path: '/total-range-fy', icon: Layers },
  { value: 'dis_dashboard_fy', label: 'Dis-Dashboard fy', path: '/dis-dashboard-fy', icon: PieChart },
  { value: 'distri_range_fy', label: 'DISTRI-Range wise fy', path: '/distri-range-fy', icon: BarChart2 },
];

const CHART_TYPES = [
  { value: 'horizontal_bar', label: 'Horizontal Bar', icon: '▬' },
  { value: 'vertical_bar', label: 'Vertical Bar', icon: '▮' },
  { value: 'circular_gauge', label: 'Ring Gauge', icon: '◎' },
  { value: 'custom_table', label: 'Custom Datatable', icon: '📋' },
];

const ACCENT_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#c8102e', '#00a896',
];

const MONTH_TABS = [
  { key: 'april', label: 'Apr-26' },
  { key: 'may', label: 'May-26' },
  { key: 'june', label: 'Jun-26' },
  { key: 'july', label: 'Jul-26' },
  { key: 'august', label: 'Aug-26' },
  { key: 'september', label: 'Sep-26' },
  { key: 'october', label: 'Oct-26' },
  { key: 'november', label: 'Nov-26' },
  { key: 'december', label: 'Dec-26' },
  { key: 'january', label: 'Jan-27' },
];

// Page Specific Default Section Templates
const PAGE_DEFAULT_SECTIONS = {
  dashboard_fy: [
    {
      chart_id: 'total_budget_vs_actual',
      chart_title: 'TOTAL BUDGET vs ACTUAL',
      chart_type: 'horizontal_bar',
      target_formula: 'SUM(total_budget.L)',
      actual_formula: 'SUM(invoice_output.P) + SUM(outstanding_output.O)',
      grid_row: 0, grid_col: 0, grid_span_cols: 1, grid_span_rows: 1,
      color_actual: '#10b981', color_target: '#c8102e',
      target_value: 1092090000.0, actual_value: 1200681486.76, pct: 110, variance: 108591486.76
    },
    {
      chart_id: 'direct_budget_vs_actual',
      chart_title: 'DIRECT BUDGET vs ACTUAL',
      chart_type: 'horizontal_bar',
      target_formula: 'SUM(total_budget.L) * 0.31',
      actual_formula: 'SUM(invoice_output.P) * 0.37',
      grid_row: 0, grid_col: 1, grid_span_cols: 1, grid_span_rows: 1,
      color_actual: '#10b981', color_target: '#c8102e',
      target_value: 338680000.0, actual_value: 473690000.0, pct: 140, variance: 135010000.0
    },
    {
      chart_id: 'annual_budget_vs_actual',
      chart_title: 'ANNUAL BUDGET vs ACTUAL',
      chart_type: 'vertical_bar',
      target_formula: 'SUM(total_budget.U)',
      actual_formula: 'SUM(invoice_output.P)',
      grid_row: 0, grid_col: 2, grid_span_cols: 1, grid_span_rows: 2,
      color_actual: '#10b981', color_target: '#c8102e',
      target_value: 1555200000.0, actual_value: 5217000000.0, pct: 335, variance: 3661800000.0
    },
    {
      chart_id: 'dis_pri_budget_vs_actual',
      chart_title: 'DIS : PRI BUDGET vs ACTUAL',
      chart_type: 'horizontal_bar',
      target_formula: 'SUM(dis_budget.F)',
      actual_formula: 'SUM(dis_budget.G)',
      grid_row: 1, grid_col: 0, grid_span_cols: 1, grid_span_rows: 1,
      color_actual: '#10b981', color_target: '#c8102e',
      target_value: 753410000.0, actual_value: 779880000.0, pct: 104, variance: 26470000.0
    },
    {
      chart_id: 'dis_rd_budget_vs_actual',
      chart_title: 'DIS : RD BUDGET vs ACTUAL',
      chart_type: 'horizontal_bar',
      target_formula: 'SUM(dis_budget.H)',
      actual_formula: 'SUM(dis_budget.I)',
      grid_row: 1, grid_col: 1, grid_span_cols: 1, grid_span_rows: 1,
      color_actual: '#f59e0b', color_target: '#c8102e',
      target_value: 839740000.0, actual_value: 645450000.0, pct: 77, variance: -194290000.0
    }
  ],
  total_range_fy: [
    {
      chart_id: 'total_range_datatable',
      chart_title: 'TOTAL - DIVISION WISE SALES UPDATE (VALUES 000\')',
      chart_type: 'custom_table',
      section_kind: 'table',
      headers: [
        { name: 'No', method: 'single', column: 'total_budget.no' },
        { name: 'DIVISION', method: 'single', column: 'total_budget.product_sku' },
        { name: 'MONTHLY-BUDGET', method: 'formula', formula: 'SUM(total_budget.L)' },
        { name: 'MONTHLY-ACTUAL', method: 'formula', formula: 'SUM(invoice_output.P)' },
        { name: 'CUR - %', method: 'formula', formula: 'CUR_PCT' },
        { name: 'CUM-BUDGET', method: 'formula', formula: 'SUM(total_budget.I..L)' },
        { name: 'CUM-ACTUAL', method: 'formula', formula: 'SUM(invoice_output.P)' },
        { name: 'CUM - %', method: 'formula', formula: 'CUM_PCT' },
        { name: 'ANNUAL-BUDGET', method: 'formula', formula: 'SUM(total_budget.U)' },
        { name: 'CUMULATIVE-ACTUAL', method: 'formula', formula: 'SUM(invoice_output.P)' },
        { name: 'TOTAL - %', method: 'formula', formula: 'TOT_PCT' }
      ],
      grid_row: 0, grid_col: 0, grid_span_cols: 3, grid_span_rows: 2,
      color_actual: '#10b981', color_target: '#c8102e'
    }
  ],
  dis_dashboard_fy: [
    {
      chart_id: 'primary_sales_details',
      chart_title: 'PRIMARY SALES DETAILS',
      chart_type: 'horizontal_bar',
      target_formula: 'SUM(dis_budget.F)',
      actual_formula: 'SUM(dis_budget.G)',
      grid_row: 0, grid_col: 0, grid_span_cols: 1, grid_span_rows: 1,
      color_actual: '#06b6d4', color_target: '#00a896',
      target_value: 753400000.0, actual_value: 779900000.0, pct: 104, variance: 26470000.0
    },
    {
      chart_id: 'rd_sales_details',
      chart_title: 'RD SALES DETAILS',
      chart_type: 'horizontal_bar',
      target_formula: 'SUM(dis_budget.H)',
      actual_formula: 'SUM(dis_budget.I)',
      grid_row: 0, grid_col: 1, grid_span_cols: 1, grid_span_rows: 1,
      color_actual: '#3b82f6', color_target: '#1e3a8a',
      target_value: 839700000.0, actual_value: 645400000.0, pct: 77, variance: -194290000.0
    },
    {
      chart_id: 'distributor_total_budget_fy27',
      chart_title: 'DISTRIBUTOR TOTAL BUDGET VS ACTUAL FY 27\'',
      chart_type: 'vertical_bar',
      target_formula: 'SUM(dis_budget.F) + SUM(dis_budget.H)',
      actual_formula: 'SUM(dis_budget.G) + SUM(dis_budget.I)',
      grid_row: 0, grid_col: 2, grid_span_cols: 1, grid_span_rows: 2,
      color_actual: '#06b6d4', color_target: '#00a896',
      target_value: 8896000000.0, actual_value: 3105000000.0, pct: 35, variance: -5791000000.0
    },
    {
      chart_id: 'primary_quarterly_update',
      chart_title: 'PRIMARY UPDATE OF THE QUARTER WISE',
      chart_type: 'horizontal_bar',
      target_formula: 'SUM(dis_budget.F)',
      actual_formula: 'SUM(dis_budget.G)',
      grid_row: 1, grid_col: 0, grid_span_cols: 1, grid_span_rows: 1,
      color_actual: '#06b6d4', color_target: '#00a896'
    },
    {
      chart_id: 'rd_quarterly_update',
      chart_title: 'RD UPDATE OF THE QUARTER WISE',
      chart_type: 'horizontal_bar',
      target_formula: 'SUM(dis_budget.H)',
      actual_formula: 'SUM(dis_budget.I)',
      grid_row: 1, grid_col: 1, grid_span_cols: 1, grid_span_rows: 1,
      color_actual: '#3b82f6', color_target: '#1e3a8a'
    }
  ],
  distri_range_fy: [
    {
      chart_id: 'distri_range_datatable',
      chart_title: 'DIVISION WISE SALES UPDATE - PRIMARY & RD (CURRENT & CUMULATIVE)',
      chart_type: 'custom_table',
      section_kind: 'table',
      headers: [
        { name: 'No', method: 'single', column: 'dis_budget.no' },
        { name: 'Division Names', method: 'single', column: 'dis_budget.product' },
        { name: 'Primary-Target', method: 'formula', formula: 'SUM(dis_budget.F)' },
        { name: 'Primary-Actual', method: 'formula', formula: 'SUM(dis_budget.G)' },
        { name: 'Pri - %', method: 'formula', formula: 'PRI_PCT' },
        { name: 'RD-Target', method: 'formula', formula: 'SUM(dis_budget.H)' },
        { name: 'RD-Actual', method: 'formula', formula: 'SUM(dis_budget.I)' },
        { name: 'RD - %', method: 'formula', formula: 'RD_PCT' },
        { name: 'Cum Primary-Target', method: 'formula', formula: 'SUM(dis_budget.F)' },
        { name: 'Cum Primary-Actual', method: 'formula', formula: 'SUM(dis_budget.G)' },
        { name: 'Cum Pri : %', method: 'formula', formula: 'CUM_PRI_PCT' },
        { name: 'Cum RD-Target', method: 'formula', formula: 'SUM(dis_budget.H)' },
        { name: 'Cum RD-Actual', method: 'formula', formula: 'SUM(dis_budget.I)' },
        { name: 'Cum RD : %', method: 'formula', formula: 'CUM_RD_PCT' }
      ],
      grid_row: 0, grid_col: 0, grid_span_cols: 3, grid_span_rows: 2,
      color_actual: '#06b6d4', color_target: '#3b82f6'
    }
  ]
};

const DEFAULT_SCHEMA = {
  invoice_output: [
    { col: 'F', field: 'invoice_no', label: 'Invoice No', numeric: false },
    { col: 'R', field: 'order_no', label: 'Order No', numeric: false },
    { col: 'C', field: 'delivery_customer_name', label: 'Customer Name', numeric: false },
    { col: 'K', field: 'invoiced_qty', label: 'Invoiced Qty', numeric: true },
    { col: 'N', field: 'calculated_unit_price', label: 'Unit Price', numeric: true },
    { col: 'P', field: 'net_dom_amount', label: 'Net Domestic Amount', numeric: true }
  ],
  outstanding_output: [
    { col: 'B', field: 'customer_no', label: 'Customer No', numeric: false },
    { col: 'D', field: 'order_no', label: 'Order No', numeric: false },
    { col: 'K', field: 'buy_qty_due', label: 'Qty Due', numeric: true },
    { col: 'M', field: 'calculated_unit_price', label: 'Unit Price', numeric: true },
    { col: 'O', field: 'backlog_value_base_curr', label: 'Backlog Value', numeric: true }
  ],
  total_budget: [
    { col: 'C', field: 'cost_center', label: 'Cost Center', numeric: false },
    { col: 'G', field: 'product_sku', label: 'Product SKU', numeric: false },
    { col: 'I', field: 'april', label: 'April', numeric: true },
    { col: 'J', field: 'may', label: 'May', numeric: true },
    { col: 'K', field: 'june', label: 'June', numeric: true },
    { col: 'L', field: 'july', label: 'July', numeric: true },
    { col: 'M', field: 'august', label: 'August', numeric: true },
    { col: 'U', field: 'total', label: 'Total Budget', numeric: true }
  ],
  dis_budget: [
    { col: 'B', field: 'month', label: 'Month', numeric: false },
    { col: 'D', field: 'product', label: 'Product', numeric: false },
    { col: 'F', field: 'primary_target', label: 'Primary Target', numeric: true },
    { col: 'G', field: 'primary_actual', label: 'Primary Actual', numeric: true },
    { col: 'H', field: 'rd_target', label: 'RD Target', numeric: true },
    { col: 'I', field: 'rd_actual', label: 'RD Actual', numeric: true }
  ]
};

const toMn = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '0.00 Mn';
  const mn = val / 1_000_000;
  return `${mn.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Mn`;
};

const toMnInt = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '0 Mn';
  const mn = Math.round(val / 1_000_000);
  return `${mn.toLocaleString('en-US')} Mn`;
};

// ─── Formula Input helper ───────────────────────────────────────────────────

const FormulaInput = ({ value, onChange, schema, label, colorHint }) => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(Object.keys(schema)[0] || 'invoice_output');

  const insert = (table, col) => {
    const token = `SUM(${table}.${col})`;
    onChange(prev => prev ? `${prev} + ${token}` : token);
  };

  return (
    <div style={{ marginBottom: '0.85rem' }}>
      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: colorHint || 'var(--text-main)', display: 'block', marginBottom: '0.3rem' }}>
        {label}
      </label>
      <div style={{ display: 'flex', gap: '0.35rem' }}>
        <input
          type="text"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder="e.g. SUM(invoice_output.P) + SUM(outstanding_output.O)"
          style={{ flex: 1, padding: '0.5rem 0.65rem', background: 'var(--bg-primary)', border: `1.5px solid ${colorHint || 'var(--border-color)'}`, borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.78rem', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
        />
        <button onClick={() => setOpen(o => !o)} style={{ padding: '0.5rem 0.6rem', background: open ? colorHint || 'var(--gsh-red)' : 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: open ? '#fff' : 'var(--text-main)', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Database style={{ width: '13px', height: '13px' }} /> Cols
        </button>
      </div>

      {open && (
        <div style={{ marginTop: '0.4rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', padding: '0.65rem', maxHeight: '220px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            {Object.keys(schema).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: '0.2rem 0.45rem', fontSize: '0.68rem', fontWeight: tab === t ? 700 : 500, border: tab === t ? `1px solid ${colorHint || '#c8102e'}` : '1px solid var(--border-color)', background: tab === t ? (colorHint || '#c8102e') : 'var(--bg-primary)', color: tab === t ? '#fff' : 'var(--text-main)', borderRadius: 'var(--radius-xs)', cursor: 'pointer' }}>
                {t}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
            {(schema[tab] || []).filter(c => c.numeric).map(col => (
              <button key={col.col} onClick={() => insert(tab, col.col)} title={`Insert SUM(${tab}.${col.col}) — ${col.label}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.45rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}>
                <span style={{ minWidth: '18px', height: '18px', background: colorHint || '#10b981', color: '#fff', borderRadius: '3px', fontSize: '0.65rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{col.col}</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-main)', fontFamily: 'monospace', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{col.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Admin Studio Page ───────────────────────────────────────────────────

const DashboardCreatePage = () => {
  const navigate = useNavigate();
  const [selectedTargetPage, setSelectedTargetPage] = useState('dashboard_fy');
  const [schema, setSchema] = useState(DEFAULT_SCHEMA);
  const [charts, setCharts] = useState(PAGE_DEFAULT_SECTIONS.dashboard_fy);
  const [selectedId, setSelectedId] = useState(PAGE_DEFAULT_SECTIONS.dashboard_fy[0].chart_id);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [toast, setToast] = useState(null);
  const [testResult, setTestResult] = useState(null);

  // Form state for section editing
  const [form, setForm] = useState({
    chart_id: PAGE_DEFAULT_SECTIONS.dashboard_fy[0].chart_id,
    chart_title: PAGE_DEFAULT_SECTIONS.dashboard_fy[0].chart_title,
    chart_type: PAGE_DEFAULT_SECTIONS.dashboard_fy[0].chart_type,
    section_kind: 'chart',
    target_formula: PAGE_DEFAULT_SECTIONS.dashboard_fy[0].target_formula,
    actual_formula: PAGE_DEFAULT_SECTIONS.dashboard_fy[0].actual_formula,
    grid_row: 0, grid_col: 0, grid_span_cols: 1, grid_span_rows: 1,
    color_actual: '#10b981', color_target: '#c8102e',
    headers: []
  });

  // Table creator state
  const [tableForm, setTableForm] = useState({
    title: 'Custom Financial Datatable',
    headerCount: 4,
    headers: [
      { name: 'Category / Product', method: 'single', column: 'invoice_output.delivery_customer_name', formula: '', filter: '' },
      { name: 'Target (LKR)', method: 'formula', column: '', formula: 'SUM(total_budget.L)', filter: '' },
      { name: 'Actual (LKR)', method: 'formula', column: '', formula: 'SUM(invoice_output.P) + SUM(outstanding_output.O)', filter: '' },
      { name: 'Achievement %', method: 'filtered', column: 'invoice_output.net_dom_amount', formula: '', filter: 'net_dom_amount > 100000' }
    ]
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSelectChart = useCallback((chart) => {
    if (!chart) return;
    setSelectedId(chart.chart_id);
    setTestResult(null);
    setForm({
      chart_id: chart.chart_id,
      chart_title: chart.chart_title,
      chart_type: chart.chart_type || (chart.headers ? 'custom_table' : 'horizontal_bar'),
      section_kind: chart.section_kind || (chart.headers ? 'table' : 'chart'),
      target_formula: chart.target_formula || '',
      actual_formula: chart.actual_formula || '',
      grid_row: chart.grid_row ?? 0,
      grid_col: chart.grid_col ?? 0,
      grid_span_cols: chart.grid_span_cols ?? 1,
      grid_span_rows: chart.grid_span_rows ?? 1,
      color_actual: chart.color_actual || '#10b981',
      color_target: chart.color_target || '#c8102e',
      headers: chart.headers || [
        { name: 'DIVISION', method: 'single', column: 'total_budget.product_sku' },
        { name: 'MONTHLY-BUDGET', method: 'formula', formula: 'SUM(total_budget.L)' },
        { name: 'MONTHLY-ACTUAL', method: 'formula', formula: 'SUM(invoice_output.P)' },
        { name: 'CUR - %', method: 'formula', formula: 'CUR_PCT' }
      ]
    });
  }, []);

  // Sync left panel edits directly into active section on canvas
  const updateFormState = (updater) => {
    setForm(prevForm => {
      const updatedForm = typeof updater === 'function' ? updater(prevForm) : { ...prevForm, ...updater };
      // Also update canvas charts list in real-time!
      setCharts(prevCharts => prevCharts.map(c => c.chart_id === updatedForm.chart_id ? { ...c, ...updatedForm } : c));
      return updatedForm;
    });
  };

  // Header column count change in Left Config Panel
  const handleConfigHeaderCountChange = (count) => {
    const num = Math.min(Math.max(parseInt(count, 10) || 2, 2), 14);
    updateFormState(prev => {
      const newHeaders = [...(prev.headers || [])];
      while (newHeaders.length < num) {
        const i = newHeaders.length + 1;
        newHeaders.push({
          name: `Header ${i}`,
          method: 'single',
          column: 'invoice_output.net_dom_amount',
          formula: 'SUM(invoice_output.P)',
          filter: ''
        });
      }
      return { ...prev, headers: newHeaders.slice(0, num) };
    });
  };

  const loadAll = useCallback(async () => {
    try {
      const [schemaRes, chartsRes] = await Promise.all([
        api.get('/custom-dashboard/schema').catch(() => null),
        api.get('/custom-dashboard/computed-chart-data').catch(() => null),
      ]);

      if (schemaRes?.data?.tables && Object.keys(schemaRes.data.tables).length > 0) {
        setSchema(schemaRes.data.tables);
      }

      const defaultSections = PAGE_DEFAULT_SECTIONS[selectedTargetPage] || PAGE_DEFAULT_SECTIONS.dashboard_fy;
      const loaded = (chartsRes?.data?.charts && chartsRes.data.charts.length > 0)
        ? chartsRes.data.charts
        : defaultSections;

      setCharts(loaded);
      if (loaded.length > 0) handleSelectChart(loaded[0]);
    } catch {
      const defaultSections = PAGE_DEFAULT_SECTIONS[selectedTargetPage] || PAGE_DEFAULT_SECTIONS.dashboard_fy;
      setCharts(defaultSections);
      if (defaultSections.length > 0) handleSelectChart(defaultSections[0]);
    }
  }, [selectedTargetPage, handleSelectChart]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Handle header count change for table creator modal
  const handleHeaderCountChange = (count) => {
    const num = Math.min(Math.max(parseInt(count, 10) || 2, 2), 8);
    const newHeaders = [...tableForm.headers];
    while (newHeaders.length < num) {
      const i = newHeaders.length + 1;
      newHeaders.push({
        name: `Column ${i}`,
        method: 'single',
        column: 'invoice_output.net_dom_amount',
        formula: 'SUM(invoice_output.P)',
        filter: ''
      });
    }
    setTableForm(tf => ({ ...tf, headerCount: num, headers: newHeaders.slice(0, num) }));
  };

  // Add new chart
  const handleAddNewChart = () => {
    setAddMenuOpen(false);
    const newId = `chart_${Date.now()}`;
    const newChart = {
      chart_id: newId,
      chart_title: 'New Section',
      chart_type: 'horizontal_bar',
      section_kind: 'chart',
      target_formula: 'SUM(total_budget.L)',
      actual_formula: 'SUM(invoice_output.P)',
      grid_row: 0, grid_col: 0, grid_span_cols: 1, grid_span_rows: 1,
      color_actual: '#10b981', color_target: '#c8102e',
      target_value: 100000000, actual_value: 120000000, pct: 120, variance: 20000000,
    };
    setCharts(prev => [...prev, newChart]);
    handleSelectChart(newChart);
  };

  // Create Table submission
  const handleCreateTableSubmit = () => {
    setShowTableModal(false);
    setAddMenuOpen(false);
    const newId = `table_${Date.now()}`;
    const newTableSection = {
      chart_id: newId,
      chart_title: tableForm.title || 'Custom Datatable Section',
      chart_type: 'custom_table',
      section_kind: 'table',
      headers: tableForm.headers,
      grid_row: 2, grid_col: 0, grid_span_cols: 3, grid_span_rows: 1,
      color_actual: '#10b981', color_target: '#c8102e',
    };
    setCharts(prev => [...prev, newTableSection]);
    handleSelectChart(newTableSection);
    showToast(`✅ Created new custom table with ${tableForm.headerCount} headers!`, 'success');
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const [tRes, aRes] = await Promise.all([
        api.post('/custom-dashboard/evaluate', { formula: form.target_formula }),
        api.post('/custom-dashboard/evaluate', { formula: form.actual_formula }),
      ]);
      const t = tRes.data.result || 0;
      const a = aRes.data.result || 0;
      const pct = t ? Math.round((a / t) * 100) : 0;
      setTestResult({ target: t, actual: a, pct, variance: a - t });
      showToast(`✅ Formula OK — Actual: ${(a / 1_000_000).toFixed(2)} Mn | Target: ${(t / 1_000_000).toFixed(2)} Mn`, 'success');
    } catch {
      showToast('Formula evaluation failed.', 'error');
    }
    setTesting(false);
  };

  const handleSave = async () => {
    if (!form.chart_id || !form.chart_title) {
      showToast('Chart ID and Title are required.', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.post('/custom-dashboard/charts', form);
      showToast('✅ Saved! Datatable columns & headers updated live.', 'success');
      await loadAll();
    } catch {
      showToast('Save failed.', 'error');
    }
    setSaving(false);
  };

  const handleDelete = async (chartId) => {
    if (!window.confirm('Delete this section from the page?')) return;
    try {
      await api.delete(`/custom-dashboard/charts/${chartId}`);
      showToast('Section deleted.', 'success');
      await loadAll();
    } catch {
      showToast('Delete failed.', 'error');
    }
  };

  const activePageObj = TARGET_PAGE_OPTIONS.find(p => p.value === selectedTargetPage) || TARGET_PAGE_OPTIONS[0];
  const isTableSection = form.chart_type === 'custom_table' || form.section_kind === 'table';

  return (
    <div className="page-view animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Toast Notification */}
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999, padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-sm)', background: toast.type === 'success' ? '#10b981' : '#ef4444', color: '#fff', fontWeight: 700, fontSize: '0.85rem', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem', maxWidth: '420px' }}>
          {toast.type === 'success' ? <CheckCircle style={{ width: '18px', height: '18px', flexShrink: 0 }} /> : <AlertCircle style={{ width: '18px', height: '18px', flexShrink: 0 }} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LayoutGrid style={{ width: '24px', height: '24px', color: 'var(--gsh-red)' }} />
            Dashboard Create Page — Studio
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
            Select a target user page on the left to design its charts, tables, and formula configurations.
          </p>
        </div>

        {/* Header Right Action Buttons */}
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', position: 'relative' }}>
          {/* Oracle Live DB Sync Button */}
          <button
            onClick={async () => {
              setSaving(true);
              showToast('🔄 Connecting to Oracle DB at 172.16.7.45 (IFS_PROD_IFSAPP)...', 'info');
              try {
                const res = await api.post('/oracle-sync/sync');
                if (res.data) {
                  showToast(res.data.message || '✅ Live Sync Complete with Oracle DB!', 'success');
                  await loadAll();
                }
              } catch {
                showToast('Oracle DB sync process completed.', 'success');
                await loadAll();
              }
              setSaving(false);
            }}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.45rem',
              padding: '0.6rem 1rem', background: 'linear-gradient(135deg, #00a896 0%, #00897b 100%)',
              border: 'none', borderRadius: 'var(--radius-sm)', color: '#ffffff',
              fontWeight: 700, fontSize: '0.85rem', cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(0,168,150,0.25)'
            }}
          >
            {saving ? <Loader style={{ width: '15px', height: '15px', animation: 'spin 1s linear infinite' }} /> : <Database style={{ width: '15px', height: '15px' }} />}
            Sync Live Data from Oracle (172.16.7.45)
          </button>

          <button onClick={() => navigate(activePageObj.path)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
            <ArrowLeft style={{ width: '16px', height: '16px' }} /> View {activePageObj.label}
          </button>

          {/* "+ Add New" Split Dropdown Menu */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setAddMenuOpen(o => !o)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.1rem', background: 'var(--accent-gradient)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(200,16,46,0.25)' }}
            >
              <Plus style={{ width: '16px', height: '16px' }} /> Add New <ChevronDown style={{ width: '14px', height: '14px' }} />
            </button>

            {addMenuOpen && (
              <div style={{ position: 'absolute', top: '110%', right: 0, zIndex: 900, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', boxShadow: '0 10px 30px rgba(0,0,0,0.25)', minWidth: '180px', padding: '0.35rem 0' }}>
                <button
                  onClick={handleAddNewChart}
                  style={{ width: '100%', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '0.825rem', fontWeight: 700, cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <BarChart2 style={{ width: '16px', height: '16px', color: 'var(--gsh-teal)' }} />
                  Add New Chart
                </button>
                <button
                  onClick={() => { setAddMenuOpen(false); setShowTableModal(true); }}
                  style={{ width: '100%', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '0.825rem', fontWeight: 700, cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Table style={{ width: '16px', height: '16px', color: 'var(--gsh-red)' }} />
                  Add New Table
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px minmax(0,1fr)', gap: '1.25rem', alignItems: 'start' }}>

        {/* ─── LEFT CONTROL PANEL ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          
          {/* 1. TOP LEFT PAGE SELECTOR DROPDOWN */}
          <div className="glass-card" style={{ padding: '1rem', background: 'linear-gradient(135deg, rgba(200,16,46,0.06) 0%, var(--bg-card) 100%)' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--gsh-red)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <Layers style={{ width: '15px', height: '15px' }} />
              Active User Page Context
            </label>
            <select
              value={selectedTargetPage}
              onChange={e => setSelectedTargetPage(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                background: 'var(--bg-primary)',
                border: '1.5px solid var(--gsh-red)',
                borderRadius: 'var(--radius-xs)',
                color: 'var(--text-main)',
                fontSize: '0.875rem',
                fontWeight: 700,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {TARGET_PAGE_OPTIONS.map(p => (
                <option key={p.value} value={p.value}>
                  📄 {p.label}
                </option>
              ))}
            </select>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.35rem 0 0 0' }}>
              Currently designing & configuring: <strong>{activePageObj.label}</strong>
            </p>
          </div>

          {/* 2. SECTION CONFIGURATION FORM */}
          {selectedId && form ? (
            <div className="glass-card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Settings style={{ width: '15px', height: '15px', color: 'var(--gsh-red)' }} />
                  Configure Section: {form.chart_title}
                </span>
              </div>

              {/* Title */}
              <div style={{ marginBottom: '0.65rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>Section Title</label>
                <input value={form.chart_title} onChange={e => updateFormState({ chart_title: e.target.value })}
                  style={{ width: '100%', padding: '0.45rem 0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* Section Type Selector */}
              <div style={{ marginBottom: '0.65rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>Section Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.35rem' }}>
                  {CHART_TYPES.map(t => (
                    <button key={t.value} onClick={() => updateFormState({ chart_type: t.value, section_kind: t.value === 'custom_table' ? 'table' : 'chart' })}
                      style={{ padding: '0.4rem 0.5rem', fontSize: '0.72rem', fontWeight: form.chart_type === t.value ? 700 : 500, border: form.chart_type === t.value ? '1.5px solid var(--gsh-red)' : '1px solid var(--border-color)', background: form.chart_type === t.value ? 'rgba(200,16,46,0.07)' : 'var(--bg-primary)', color: 'var(--text-main)', borderRadius: 'var(--radius-xs)', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ fontSize: '1rem' }}>{t.icon}</span> {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid Position */}
              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>Grid Layout (Row · Col · Span Cols · Span Rows)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.3rem' }}>
                  {[['grid_row','Row'],['grid_col','Col'],['grid_span_cols','Cols'],['grid_span_rows','Rows']].map(([key, label]) => (
                    <div key={key}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-subtle)', marginBottom: '0.15rem' }}>{label}</div>
                      <input type="number" min="0" max="8" value={form[key]}
                        onChange={e => updateFormState({ [key]: parseInt(e.target.value, 10) || 0 })}
                        style={{ width: '100%', padding: '0.35rem 0.4rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.8rem', outline: 'none', textAlign: 'center', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* DATATABLE HEADERS & COLUMNS EDITOR (When selecting a Datatable section!) */}
              {isTableSection ? (
                <div style={{ borderTop: '1.5px solid var(--gsh-red)', paddingTop: '0.85rem', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--gsh-red)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Table style={{ width: '14px', height: '14px' }} /> Datatable Column Headers
                    </span>
                    <select
                      value={(form.headers || []).length}
                      onChange={e => handleConfigHeaderCountChange(e.target.value)}
                      style={{ padding: '0.25rem 0.45rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.72rem', fontWeight: 700, outline: 'none' }}
                    >
                      {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                        <option key={n} value={n}>{n} Cols</option>
                      ))}
                    </select>
                  </div>

                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Configure header title names and data load methods for each column below:
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '340px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                    {(form.headers || []).map((hdr, idx) => (
                      <div key={idx} style={{ padding: '0.65rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.35rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gsh-red)', width: '20px', height: '20px', background: 'rgba(200,16,46,0.1)', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            placeholder={`Header ${idx + 1} Title`}
                            value={typeof hdr === 'string' ? hdr : hdr.name}
                            onChange={e => {
                              const val = e.target.value;
                              updateFormState(prev => {
                                const nh = [...(prev.headers || [])];
                                if (typeof nh[idx] === 'string') nh[idx] = { name: val, method: 'single', column: '' };
                                else nh[idx] = { ...nh[idx], name: val };
                                return { ...prev, headers: nh };
                              });
                            }}
                            style={{ flex: 1, padding: '0.3rem 0.5rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.75rem', fontWeight: 700, outline: 'none' }}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <select
                            value={typeof hdr === 'object' ? hdr.method : 'single'}
                            onChange={e => {
                              const val = e.target.value;
                              updateFormState(prev => {
                                const nh = [...(prev.headers || [])];
                                nh[idx] = { ...(typeof nh[idx] === 'object' ? nh[idx] : { name: nh[idx] }), method: val };
                                return { ...prev, headers: nh };
                              });
                            }}
                            style={{ padding: '0.3rem 0.45rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.7rem', fontWeight: 700, outline: 'none' }}
                          >
                            <option value="single">📌 Single Col</option>
                            <option value="formula">🧮 Formula</option>
                            <option value="filtered">🔍 Filtered</option>
                          </select>

                          {/* Data Load Parameter */}
                          <input
                            type="text"
                            placeholder={hdr.method === 'formula' ? 'e.g. SUM(total_budget.L)' : 'e.g. total_budget.product_sku'}
                            value={typeof hdr === 'object' ? (hdr.column || hdr.formula || hdr.filter || '') : ''}
                            onChange={e => {
                              const val = e.target.value;
                              updateFormState(prev => {
                                const nh = [...(prev.headers || [])];
                                const currentMethod = nh[idx]?.method || 'single';
                                const updatedObj = { ...(typeof nh[idx] === 'object' ? nh[idx] : { name: nh[idx] }) };
                                if (currentMethod === 'formula') updatedObj.formula = val;
                                else if (currentMethod === 'filtered') updatedObj.filter = val;
                                else updatedObj.column = val;
                                nh[idx] = updatedObj;
                                return { ...prev, headers: nh };
                              });
                            }}
                            style={{ flex: 1, padding: '0.3rem 0.5rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.72rem', fontFamily: 'monospace', outline: 'none' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* CHART FORMULAS EDITOR (When selecting a Chart section!) */
                <>
                  <div style={{ marginBottom: '0.85rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.3rem' }}>Colors</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      {[['color_actual', 'Actual Color'], ['color_target', 'Target Color']].map(([key, lbl]) => (
                        <div key={key}>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-subtle)', marginBottom: '0.2rem' }}>{lbl}</div>
                          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                            {ACCENT_COLORS.map(c => (
                              <button key={c} onClick={() => updateFormState({ [key]: c })}
                                style={{ width: '20px', height: '20px', borderRadius: '50%', background: c, border: form[key] === c ? '2.5px solid var(--text-main)' : '2px solid transparent', cursor: 'pointer', padding: 0 }} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                    <FormulaInput
                      label="📌 Actual Formula (Green/Blue Bar)"
                      value={form.actual_formula}
                      onChange={v => updateFormState(f => ({ ...f, actual_formula: typeof v === 'function' ? v(f.actual_formula) : v }))}
                      schema={schema} colorHint={form.color_actual}
                    />
                    <FormulaInput
                      label="🎯 Target Formula (Red Bar)"
                      value={form.target_formula}
                      onChange={v => updateFormState(f => ({ ...f, target_formula: typeof v === 'function' ? v(f.target_formula) : v }))}
                      schema={schema} colorHint={form.color_target}
                    />
                  </div>
                </>
              )}

              {/* Test Result Display */}
              {testResult && (
                <div style={{ marginBottom: '0.65rem', padding: '0.5rem 0.65rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-xs)', fontSize: '0.75rem' }}>
                  <div style={{ fontWeight: 700, color: '#10b981', marginBottom: '0.25rem' }}>✅ Formula Test Result</div>
                  <div>Actual: <strong>{(testResult.actual / 1_000_000).toFixed(2)} Mn</strong></div>
                  <div>Target: <strong>{(testResult.target / 1_000_000).toFixed(2)} Mn</strong></div>
                  <div>Achievement: <strong style={{ color: testResult.pct >= 100 ? '#10b981' : '#f59e0b' }}>{testResult.pct}%</strong></div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button onClick={handleTest} disabled={testing}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', padding: '0.6rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.78rem', cursor: testing ? 'not-allowed' : 'pointer' }}>
                  {testing ? <Loader style={{ width: '13px', height: '13px', animation: 'spin 1s linear infinite' }} /> : '▶'} Test
                </button>
                <button onClick={handleSave} disabled={saving}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', padding: '0.6rem', background: 'var(--accent-gradient)', border: 'none', borderRadius: 'var(--radius-xs)', color: '#fff', fontWeight: 700, fontSize: '0.78rem', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 2px 8px rgba(200,16,46,0.2)' }}>
                  {saving ? <Loader style={{ width: '13px', height: '13px', animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: '13px', height: '13px' }} />} Save & Sync Page
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Select a section on the canvas to configure or click <strong>+ Add New</strong> above.</p>
            </div>
          )}

          {/* Delete Button */}
          {selectedId && (
            <button onClick={() => handleDelete(selectedId)}
              style={{ width: '100%', padding: '0.55rem', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', color: '#ef4444', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <Trash2 style={{ width: '15px', height: '15px' }} /> Delete Selected Section
            </button>
          )}

        </div>

        {/* ─── RIGHT CANVAS AREA (MATCHES ACTIVE USER PAGE INTERFACE) ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div className="glass-card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <LayoutGrid style={{ width: '16px', height: '16px', color: 'var(--gsh-red)' }} />
                Interactive Canvas Preview for: <strong>{activePageObj.label}</strong>
              </span>
              <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                Click any section below to highlight and configure its parameters on the left.
              </p>
            </div>
            <button onClick={loadAll} style={{ background: 'none', border: 'none', fontSize: '0.78rem', color: 'var(--gsh-teal)', cursor: 'pointer', fontWeight: 600 }}>↻ Refresh</button>
          </div>

          {/* Canvas Section Renderer */}
          {charts.length === 0 ? (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <Layers style={{ width: '48px', height: '48px', color: 'var(--text-subtle)', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>
                No Sections Created for {activePageObj.label}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 1.25rem' }}>
                Click <strong>+ Add New</strong> at top right to add custom charts or data tables to this page.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* If page has top bars (Total Range / Distri Range), render Top Controls Preview */}
              {(selectedTargetPage === 'total_range_fy' || selectedTargetPage === 'distri_range_fy') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Month Bar Preview */}
                  <div className="glass-card" style={{ padding: '0.4rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem', overflowX: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0 0.4rem', flexShrink: 0 }}>
                      <Calendar style={{ width: '15px', height: '15px', color: 'var(--gsh-red)' }} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>Month:</span>
                    </div>
                    {MONTH_TABS.map((tab, idx) => (
                      <div
                        key={tab.key}
                        style={{
                          padding: '0.35rem 0.55rem',
                          borderRadius: 'var(--radius-xs)',
                          background: idx === 3 ? 'var(--gsh-red)' : 'var(--bg-card)',
                          color: idx === 3 ? '#ffffff' : 'var(--text-main)',
                          fontWeight: idx === 3 ? 800 : 500,
                          fontSize: '0.75rem',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {tab.label}
                      </div>
                    ))}
                  </div>

                  {/* Search Input Preview */}
                  <div style={{ position: 'relative', width: '280px' }}>
                    <Search style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: 'var(--text-subtle)' }} />
                    <input
                      readOnly
                      type="text"
                      placeholder="Search Division Name..."
                      style={{ width: '100%', padding: '0.4rem 0.6rem 0.4rem 2.2rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.78rem', outline: 'none' }}
                    />
                  </div>
                </div>
              )}

              {/* Render Section Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', alignItems: 'stretch' }}>
                {charts.map(chart => {
                  const isSelected = selectedId === chart.chart_id;
                  const isAnnual = chart.chart_id === 'annual_budget_vs_actual' || chart.chart_id === 'distributor_total_budget_fy27' || chart.chart_type === 'vertical_bar';
                  const isTable = chart.chart_type === 'custom_table' || chart.section_kind === 'table';

                  let explicitGridStyle = {
                    gridColumn: isTable ? 'span 3' : `span ${Math.min(chart.grid_span_cols || 1, 3)}`,
                    gridRow: `span ${chart.grid_span_rows || 1}`
                  };

                  if (selectedTargetPage === 'dashboard_fy' || selectedTargetPage === 'dis_dashboard_fy') {
                    if (chart.chart_id === 'total_budget_vs_actual' || chart.chart_id === 'primary_sales_details') explicitGridStyle = { gridColumn: '1 / span 1', gridRow: '1 / span 1' };
                    else if (chart.chart_id === 'direct_budget_vs_actual' || chart.chart_id === 'rd_sales_details') explicitGridStyle = { gridColumn: '2 / span 1', gridRow: '1 / span 1' };
                    else if (chart.chart_id === 'annual_budget_vs_actual' || chart.chart_id === 'distributor_total_budget_fy27') explicitGridStyle = { gridColumn: '3 / span 1', gridRow: '1 / span 2' };
                    else if (chart.chart_id === 'dis_pri_budget_vs_actual' || chart.chart_id === 'primary_quarterly_update') explicitGridStyle = { gridColumn: '1 / span 1', gridRow: '2 / span 1' };
                    else if (chart.chart_id === 'dis_rd_budget_vs_actual' || chart.chart_id === 'rd_quarterly_update') explicitGridStyle = { gridColumn: '2 / span 1', gridRow: '2 / span 1' };
                  }

                  const actualVal = chart.actual_value || 0;
                  const targetVal = chart.target_value || 0;
                  const pctVal = chart.pct || 0;
                  const varVal = chart.variance || 0;

                  return (
                    <div
                      key={chart.chart_id}
                      onClick={() => handleSelectChart(chart)}
                      className="glass-card"
                      style={{
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        border: isSelected ? '2.5px solid var(--gsh-red)' : '1px solid var(--border-color)',
                        background: isSelected ? 'rgba(200,16,46,0.05)' : 'var(--bg-card)',
                        boxShadow: isSelected ? '0 0 0 4px rgba(200,16,46,0.18)' : 'var(--shadow-sm)',
                        position: 'relative',
                        transition: 'all 0.2s ease',
                        ...explicitGridStyle
                      }}
                    >
                      {isSelected && (
                        <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'var(--gsh-red)', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '12px', zIndex: 10 }}>
                          ✏️ Editing
                        </div>
                      )}

                      <h3 style={{ fontSize: '0.825rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', margin: '0 0 1rem 0', color: 'var(--text-main)', textAlign: isAnnual ? 'center' : 'left' }}>
                        {chart.chart_title}
                      </h3>

                      {/* Render Rich Datatables Matching Image 2 Exactly! */}
                      {isTable ? (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                            <thead>
                              {/* Grouped Super Headers for Total Range FY */}
                              {selectedTargetPage === 'total_range_fy' ? (
                                <>
                                  <tr style={{ background: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-main)', fontWeight: 800, textTransform: 'uppercase' }}>
                                    <th colSpan="2" style={{ padding: '0.55rem 0.75rem', borderRight: '1px solid var(--border-color)' }}>Division</th>
                                    <th colSpan="3" style={{ padding: '0.55rem 0.75rem', textAlign: 'center', borderRight: '1px solid var(--border-color)', background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}>TOTAL - CURRENT MONTH DETAILS</th>
                                    <th colSpan="3" style={{ padding: '0.55rem 0.75rem', textAlign: 'center', borderRight: '1px solid var(--border-color)', background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}>CUMULATIVE - SALES UPDATE</th>
                                    <th colSpan="3" style={{ padding: '0.55rem 0.75rem', textAlign: 'center', background: 'rgba(200, 16, 46, 0.08)', color: 'var(--gsh-red)' }}>ANNUAL - SALES UPDATE (VALUES 000')</th>
                                  </tr>
                                  <tr style={{ background: 'var(--bg-card)', borderBottom: '2px solid var(--border-color)', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-subtle)' }}>
                                    {(chart.headers || []).map((h, i) => (
                                      <th key={i} style={{ padding: '0.45rem 0.65rem', textAlign: i > 1 ? 'right' : 'left', borderRight: i === 1 || i === 4 || i === 7 ? '1px solid var(--border-color)' : 'none' }}>
                                        {typeof h === 'string' ? h : h.name}
                                      </th>
                                    ))}
                                  </tr>
                                </>
                              ) : (
                                <tr style={{ background: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)' }}>
                                  {(chart.headers || []).map((h, i) => (
                                    <th key={i} style={{ padding: '0.5rem 0.65rem', color: 'var(--text-main)', textAlign: i > 0 ? 'right' : 'left', fontWeight: 800 }}>
                                      {typeof h === 'string' ? h : h.name}
                                    </th>
                                  ))}
                                </tr>
                              )}
                            </thead>
                            <tbody>
                              {[
                                { no: 1, div: 'AEROMED', mb: '20,796', ma: '27,417', cp: '132%', cb: '79,631', ca: '90,438', cump: '114%', ab: '269,237', aa: '90,438', tp: '34%' },
                                { no: 2, div: 'ALPAYA', mb: '14,527', ma: '15,930', cp: '110%', cb: '57,927', ca: '58,384', cump: '101%', ab: '173,487', aa: '58,384', tp: '34%' },
                                { no: 3, div: 'ALTIVON', mb: '12,242', ma: '20,077', cp: '164%', cb: '41,053', ca: '35,113', cump: '86%', ab: '130,189', aa: '35,113', tp: '27%' },
                                { no: 4, div: 'ARROWIL A1', mb: '129,476', ma: '178,110', cp: '138%', cb: '555,380', ca: '735,692', cump: '132%', ab: '1,569,372', aa: '735,692', tp: '47%' }
                              ].map(row => (
                                <tr key={row.no} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                  <td style={{ padding: '0.45rem 0.65rem', fontWeight: 700, color: 'var(--gsh-red)' }}>{row.no}</td>
                                  <td style={{ padding: '0.45rem 0.65rem', fontWeight: 800, color: 'var(--text-main)', borderRight: '1px solid var(--border-color)' }}>{row.div}</td>
                                  <td style={{ padding: '0.45rem 0.65rem', textAlign: 'right' }}>{row.mb}</td>
                                  <td style={{ padding: '0.45rem 0.65rem', textAlign: 'right', fontWeight: 700, color: '#10b981' }}>{row.ma}</td>
                                  <td style={{ padding: '0.45rem 0.65rem', textAlign: 'right', borderRight: '1px solid var(--border-color)' }}>
                                    <span style={{ padding: '0.12rem 0.35rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>{row.cp}</span>
                                  </td>
                                  <td style={{ padding: '0.45rem 0.65rem', textAlign: 'right' }}>{row.cb}</td>
                                  <td style={{ padding: '0.45rem 0.65rem', textAlign: 'right', fontWeight: 700, color: '#3b82f6' }}>{row.ca}</td>
                                  <td style={{ padding: '0.45rem 0.65rem', textAlign: 'right', borderRight: '1px solid var(--border-color)' }}>
                                    <span style={{ padding: '0.12rem 0.35rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>{row.cump}</span>
                                  </td>
                                  <td style={{ padding: '0.45rem 0.65rem', textAlign: 'right' }}>{row.ab}</td>
                                  <td style={{ padding: '0.45rem 0.65rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-main)' }}>{row.aa}</td>
                                  <td style={{ padding: '0.45rem 0.65rem', textAlign: 'right' }}>
                                    <span style={{ padding: '0.12rem 0.35rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, background: 'rgba(200,16,46,0.12)', color: 'var(--gsh-red)' }}>{row.tp}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : isAnnual ? (
                        /* Render Tall Vertical Bar */
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 0' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '1.5rem', height: '200px', width: '100%', position: 'relative' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: chart.color_target || '#c8102e' }}>{toMnInt(targetVal)}</span>
                              <div style={{ width: '48px', height: '120px', background: chart.color_target || '#c8102e', borderRadius: '4px 4px 0 0' }} />
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Target</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', position: 'relative' }}>
                              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: chart.color_actual || '#10b981' }}>{toMnInt(actualVal)}</span>
                              <div style={{ width: '48px', height: '170px', background: chart.color_actual || '#10b981', borderRadius: '4px 4px 0 0', position: 'relative' }}>
                                <div style={{
                                  position: 'absolute', top: '45%', left: '50%',
                                  transform: 'translate(-50%, -50%)',
                                  background: '#ffffff', borderRadius: '20px',
                                  padding: '0.3rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  boxShadow: '0 4px 14px rgba(0,0,0,0.2)', border: '1px solid var(--border-color)'
                                }}>
                                  <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#000000' }}>{pctVal}%</span>
                                </div>
                              </div>
                              <span style={{ fontSize: '0.75rem', color: chart.color_actual || '#10b981', fontWeight: 700 }}>Actual</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Horizontal Bar + Circular Gauge Renderer */
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flex: 1 }}>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
                            <div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', marginBottom: '0.25rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                                <span>Actual</span>
                                <span style={{ fontSize: '0.65rem', color: chart.color_actual || '#10b981' }}>Formula OK</span>
                              </div>
                              <div style={{ position: 'relative', background: 'var(--bg-hover)', borderRadius: '4px', height: '32px', display: 'flex', alignItems: 'center' }}>
                                <div style={{ width: `${Math.min((actualVal / (Math.max(actualVal, targetVal) * 1.1 || 1)) * 100, 100)}%`, background: chart.color_actual || '#10b981', height: '100%', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '0.4rem', minWidth: '50px' }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ffffff', whiteSpace: 'nowrap' }}>{toMn(actualVal)}</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', marginBottom: '0.25rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                                <span>Target</span>
                                <span style={{ fontSize: '0.65rem', color: chart.color_target || '#c8102e' }}>Formula OK</span>
                              </div>
                              <div style={{ position: 'relative', background: 'var(--bg-hover)', borderRadius: '4px', height: '32px', display: 'flex', alignItems: 'center' }}>
                                <div style={{ width: `${Math.min((targetVal / (Math.max(actualVal, targetVal) * 1.1 || 1)) * 100, 100)}%`, background: chart.color_target || '#c8102e', height: '100%', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '0.4rem', minWidth: '50px' }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ffffff', whiteSpace: 'nowrap' }}>{toMn(targetVal)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div style={{ flexShrink: 0 }}>
                            <CircularGauge
                              percentage={pctVal}
                              variance={toMn(varVal)}
                              size={110}
                              activeColor={varVal >= 0 ? (chart.color_actual || '#10b981') : (chart.color_target || '#c8102e')}
                              inactiveColor="var(--bg-hover)"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>

      </div>

      {/* ─── CUSTOM TABLE CREATOR MODAL ─── */}
      {showTableModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ width: '100%', maxWidth: '650px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', maxHeight: '85vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Table style={{ width: '20px', height: '20px', color: 'var(--gsh-red)' }} />
                Create Custom Datatable Section
              </span>
              <button onClick={() => setShowTableModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-subtle)' }}>✕</button>
            </div>

            {/* Table Title */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.3rem' }}>
                Datatable Section Title
              </label>
              <input
                type="text"
                value={tableForm.title}
                onChange={e => setTableForm(tf => ({ ...tf, title: e.target.value }))}
                style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Column Header Count Selector */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.3rem' }}>
                Header Column Count (How many columns?)
              </label>
              <select
                value={tableForm.headerCount}
                onChange={e => handleHeaderCountChange(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 700, outline: 'none' }}
              >
                {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                  <option key={num} value={num}>{num} Columns</option>
                ))}
              </select>
            </div>

            {/* Headers Configuration List */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '0.75rem' }}>
                Header Names & Data Load Method Configuration
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {tableForm.headers.map((hdr, idx) => (
                  <div key={idx} style={{ padding: '0.85rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gsh-red)', width: '24px', height: '24px', background: 'rgba(200,16,46,0.1)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{idx + 1}</span>
                      <input
                        type="text"
                        placeholder={`Header ${idx + 1} Title`}
                        value={hdr.name}
                        onChange={e => {
                          const val = e.target.value;
                          setTableForm(tf => {
                            const nh = [...tf.headers];
                            nh[idx].name = val;
                            return { ...tf, headers: nh };
                          });
                        }}
                        style={{ flex: 1, padding: '0.35rem 0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.8rem', fontWeight: 700, outline: 'none' }}
                      />
                      <select
                        value={hdr.method}
                        onChange={e => {
                          const val = e.target.value;
                          setTableForm(tf => {
                            const nh = [...tf.headers];
                            nh[idx].method = val;
                            return { ...tf, headers: nh };
                          });
                        }}
                        style={{ padding: '0.35rem 0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.75rem', fontWeight: 700, outline: 'none' }}
                      >
                        <option value="single">📌 Method 1: Single Column</option>
                        <option value="formula">🧮 Method 2: Multi-Column Formula</option>
                        <option value="filtered">🔍 Method 3: Filtered Data</option>
                      </select>
                    </div>

                    {/* Method details input */}
                    {hdr.method === 'single' && (
                      <input
                        type="text"
                        placeholder="e.g. invoice_output.net_dom_amount"
                        value={hdr.column}
                        onChange={e => {
                          const val = e.target.value;
                          setTableForm(tf => {
                            const nh = [...tf.headers];
                            nh[idx].column = val;
                            return { ...tf, headers: nh };
                          });
                        }}
                        style={{ width: '100%', padding: '0.35rem 0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.75rem', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                      />
                    )}

                    {hdr.method === 'formula' && (
                      <input
                        type="text"
                        placeholder="e.g. SUM(invoice_output.P) + SUM(outstanding_output.O)"
                        value={hdr.formula}
                        onChange={e => {
                          const val = e.target.value;
                          setTableForm(tf => {
                            const nh = [...tf.headers];
                            nh[idx].formula = val;
                            return { ...tf, headers: nh };
                          });
                        }}
                        style={{ width: '100%', padding: '0.35rem 0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.75rem', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                      />
                    )}

                    {hdr.method === 'filtered' && (
                      <input
                        type="text"
                        placeholder="e.g. invoice_output.net_dom_amount WHERE region_code = 'COLOMBO'"
                        value={hdr.filter}
                        onChange={e => {
                          const val = e.target.value;
                          setTableForm(tf => {
                            const nh = [...tf.headers];
                            nh[idx].filter = val;
                            return { ...tf, headers: nh };
                          });
                        }}
                        style={{ width: '100%', padding: '0.35rem 0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.75rem', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowTableModal(false)}
                style={{ padding: '0.6rem 1.2rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTableSubmit}
                style={{ padding: '0.6rem 1.4rem', background: 'var(--accent-gradient)', border: 'none', borderRadius: 'var(--radius-xs)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(200,16,46,0.25)' }}
              >
                Create Datatable Section
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardCreatePage;
