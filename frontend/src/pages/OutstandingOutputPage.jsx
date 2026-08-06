import React, { useState, useEffect } from 'react';
import { fetchOutstandingOutput } from '../services/api';
import KpiCard from '../components/KpiCard';
import { Search, Truck, DollarSign, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { ExcelColHeader, ExcelRowNum, ExcelRowHeader } from '../components/ExcelTableHeader';

const ALL_OUTSTANDING_COLUMNS = [
  { col: 'A', field: 'customer_no', label: 'Customer No' },
  { col: 'B', field: 'customer_name', label: 'Customer Name', minWidth: '220px' },
  { col: 'C', field: 'order_no', label: 'Order No' },
  { col: 'D', field: 'line_no', label: 'Line No' },
  { col: 'E', field: 'rel_no', label: 'Rel No' },
  { col: 'F', field: 'line_state', label: 'Line State' },
  { col: 'G', field: 'agreement_id', label: 'Agreement ID' },
  { col: 'H', field: 'catalog_no', label: 'Catalog No' },
  { col: 'I', field: 'catalog_desc', label: 'Description', minWidth: '200px' },
  { col: 'J', field: 'condition_code', label: 'Condition Code' },
  { col: 'K', field: 'condition_code_desc', label: 'Condition Desc' },
  { col: 'L', field: 'contract', label: 'Contract' },
  { col: 'M', field: 'buy_qty_due', label: 'Buy Qty Due', align: 'right', isNumber: true },
  { col: 'N', field: 'sales_unit_meas', label: 'Sales Unit Meas' },
  { col: 'O', field: 'calculated_qty', label: 'Calculated Qty', align: 'right', isNumber: true },
  { col: 'P', field: 'price_unit_meas', label: 'Price Unit Meas' },
  { col: 'Q', field: 'calculated_unit_price', label: 'Unit Price', align: 'right', isCurrency: true },
  { col: 'R', field: 'planned_delivery_date', label: 'Planned Delivery Date', isDate: true },
  { col: 'S', field: 'backlog_value_base_curr', label: 'Backlog Value', align: 'right', isCurrency: true },
  { col: 'T', field: 'currency_code', label: 'Currency' },
  { col: 'U', field: 'cust_grp', label: 'Cust Group' },
  { col: 'V', field: 'catalog_group', label: 'Catalog Group' },
  { col: 'W', field: 'region_code', label: 'Region Code' },
  { col: 'X', field: 'district_code', label: 'District Code' },
  { col: 'Y', field: 'market_code', label: 'Market Code' },
  { col: 'Z', field: 'country_code', label: 'Country Code' },
  { col: 'AA', field: 'salesman_code', label: 'Salesman Code' },
  { col: 'AB', field: 'authorize_code', label: 'Authorize Code' },
  { col: 'AC', field: 'price_list_no', label: 'Price List No' },
  { col: 'AD', field: 'priority', label: 'Priority' },
  { col: 'AE', field: 'line_item_no', label: 'Line Item No' },
];

const OutstandingOutputPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(false);
    const result = await fetchOutstandingOutput(page, limit, search);
    if (!result) {
      setError(true);
      setData(null);
    } else {
      setData(result);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [page, limit, search]);

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '0.00';
    return Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  const renderCellValue = (row, c) => {
    const val = row[c.field];
    if (val === null || val === undefined || val === '') return '-';
    if (c.isCurrency) return formatCurrency(val);
    if (c.isDate && typeof val === 'string') return val.split(' ')[0];
    return String(val);
  };

  return (
    <div className="page-view animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
          Outstanding Output Report (All 31 Columns)
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
          Complete 31 columns from <code style={{ background: 'var(--bg-hover)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>Outstanding Output.csv</code> (170 Records) — Excel Coordinates (A to AE)
        </p>
      </div>

      {error && (
        <div style={{ padding: '1rem 1.25rem', borderRadius: 'var(--radius-sm)', background: 'rgba(200, 16, 46, 0.08)', border: '1px solid rgba(200, 16, 46, 0.3)', display: 'flex', alignItems: 'center', gap: '0.85rem', color: 'var(--gsh-red)' }}>
          <AlertCircle style={{ width: '22px', height: '22px', flexShrink: 0 }} />
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>Backend Connection Failed</p>
            <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-muted)' }}>Cannot reach <code>http://localhost:8000</code>. Run <code>python main.py</code> inside <code>backend/</code>.</p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <KpiCard
          title="Total Backlog Value"
          value={data ? `LKR ${formatCurrency(data.total_backlog_value)}` : (error ? 'Offline' : 'Loading...')}
          subtext="Total Outstanding Order Backlog (Col S)"
          icon={DollarSign}
          accentColor="#3b82f6"
        />
        <KpiCard
          title="Total Backlog Orders"
          value={data ? `${data.total_count.toLocaleString()} Orders` : (error ? 'Offline' : 'Loading...')}
          subtext="Active Pending Order Lines"
          icon={Truck}
          accentColor="var(--gsh-gold)"
        />
      </div>

      <div className="glass-card" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '480px' }}>
          <Search style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: 'var(--text-subtle)' }} />
          <input
            type="text"
            placeholder="Search Customer No, Customer Name, Order No, Catalog No, Description..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: '100%', padding: '0.55rem 1rem 0.55rem 2.5rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Main Datatable with Excel-Style Headers for All 31 Columns */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', maxHeight: '600px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left', minWidth: '2600px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <ExcelRowHeader />
                {ALL_OUTSTANDING_COLUMNS.map(c => (
                  <ExcelColHeader key={c.col} col={c.col} label={c.label} align={c.align} minWidth={c.minWidth} />
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={ALL_OUTSTANDING_COLUMNS.length + 1} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Outstanding Output records...</td></tr>
              ) : data && data.rows && data.rows.length > 0 ? (
                data.rows.map((row, idx) => {
                  const rowNum = (page - 1) * limit + idx + 1;
                  return (
                    <tr
                      key={row.id || idx}
                      style={{ borderBottom: '1px solid var(--border-color)', transition: 'background var(--transition-fast)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <ExcelRowNum num={rowNum} />
                      {ALL_OUTSTANDING_COLUMNS.map(c => (
                        <td
                          key={c.col}
                          style={{
                            padding: '0.65rem 0.85rem',
                            textAlign: c.align || 'left',
                            fontWeight: c.field === 'backlog_value_base_curr' ? 800 : (c.field === 'order_no' || c.field === 'customer_no' ? 700 : 400),
                            color: c.field === 'backlog_value_base_curr' ? '#3b82f6' : 'var(--text-main)',
                            fontFamily: c.field === 'order_no' || c.field === 'customer_no' || c.field === 'catalog_no' ? 'monospace' : 'inherit',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {renderCellValue(row, c)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={ALL_OUTSTANDING_COLUMNS.length + 1} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {error ? 'Backend offline.' : 'No records matching search criteria.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {data && data.total_pages > 0 && (
          <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Showing <strong>{((page - 1) * limit) + 1}</strong> to <strong>{Math.min(page * limit, data.total_count)}</strong> of <strong>{data.total_count.toLocaleString()}</strong> records
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rows:</span>
                {[10, 25, 50, 100].map((size) => (
                  <button key={size} onClick={() => handleLimitChange(size)} style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: limit === size ? '#3b82f6' : 'var(--bg-primary)', color: limit === size ? '#fff' : 'var(--text-main)', cursor: 'pointer', fontWeight: limit === size ? 700 : 400 }}>
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-main)', fontSize: '0.85rem', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}>
                <ChevronLeft style={{ width: '16px', height: '16px' }} /> Prev
              </button>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Page {page} of {data.total_pages}</span>
              <button disabled={page >= data.total_pages} onClick={() => setPage(p => Math.min(data.total_pages, p + 1))} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-main)', fontSize: '0.85rem', cursor: page >= data.total_pages ? 'not-allowed' : 'pointer', opacity: page >= data.total_pages ? 0.5 : 1 }}>
                Next <ChevronRight style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutstandingOutputPage;
