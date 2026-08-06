import React, { useState, useEffect } from 'react';
import { fetchInvoiceOutput } from '../services/api';
import KpiCard from '../components/KpiCard';
import { Search, FileText, DollarSign, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { ExcelColHeader, ExcelRowNum, ExcelRowHeader } from '../components/ExcelTableHeader';

const ALL_INVOICE_COLUMNS = [
  { col: 'A', field: 'delivery_customer', label: 'Delivery Customer' },
  { col: 'B', field: 'delivery_customer_name', label: 'Customer Name', minWidth: '220px' },
  { col: 'C', field: 'invoice_id', label: 'Invoice ID' },
  { col: 'D', field: 'series_id', label: 'Series ID' },
  { col: 'E', field: 'invoice_no', label: 'Invoice No' },
  { col: 'F', field: 'item_id', label: 'Item ID' },
  { col: 'G', field: 'catalog_no', label: 'Catalog No' },
  { col: 'H', field: 'description', label: 'Description', minWidth: '200px' },
  { col: 'I', field: 'contract', label: 'Contract' },
  { col: 'J', field: 'sales_part_rebate_group', label: 'Rebate Group' },
  { col: 'K', field: 'invoiced_qty', label: 'Invoiced Qty', align: 'right', isNumber: true },
  { col: 'L', field: 'sale_um', label: 'Sale UM' },
  { col: 'M', field: 'col_13', label: 'Col 13' },
  { col: 'N', field: 'price_um', label: 'Price UM' },
  { col: 'O', field: 'calculated_unit_price', label: 'Unit Price', align: 'right', isCurrency: true },
  { col: 'P', field: 'invoice_date', label: 'Invoice Date', isDate: true },
  { col: 'Q', field: 'net_dom_amount', label: 'Net Dom Amount', align: 'right', isCurrency: true },
  { col: 'R', field: 'currency_code', label: 'Currency' },
  { col: 'S', field: 'condition_code', label: 'Condition Code' },
  { col: 'T', field: 'condition_code_desc', label: 'Condition Desc' },
  { col: 'U', field: 'order_no', label: 'Order No' },
  { col: 'V', field: 'agreement_id', label: 'Agreement ID' },
  { col: 'W', field: 'cust_grp', label: 'Cust Group' },
  { col: 'X', field: 'catalog_group', label: 'Catalog Group' },
  { col: 'Y', field: 'region_code', label: 'Region Code' },
  { col: 'Z', field: 'district_code', label: 'District Code' },
  { col: 'AA', field: 'market_code', label: 'Market Code' },
  { col: 'AB', field: 'country_code', label: 'Country Code' },
  { col: 'AC', field: 'salesman_code', label: 'Salesman Code' },
  { col: 'AD', field: 'authorize_code', label: 'Authorize Code' },
  { col: 'AE', field: 'price_list_no', label: 'Price List No' },
  { col: 'AF', field: 'party', label: 'Party' },
  { col: 'AG', field: 'party_type', label: 'Party Type' },
  { col: 'AH', field: 'identity', label: 'Identity' },
  { col: 'AI', field: 'identity_name', label: 'Identity Name' },
  { col: 'AJ', field: 'price_adjustment', label: 'Price Adjustment' },
  { col: 'AK', field: 'company', label: 'Company' },
  { col: 'AL', field: 'price_conv', label: 'Price Conv' },
];

const InvoiceOutputPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(false);
    const result = await fetchInvoiceOutput(page, limit, search);
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
      {/* Title Header */}
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
          Invoice Output Report (All 38 Columns)
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
          Complete 38 columns from <code style={{ background: 'var(--bg-hover)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>Invoice Output.csv</code> (19,046 Records) — Excel Coordinates (A to AL)
        </p>
      </div>

      {/* Backend Error Alert */}
      {error && (
        <div style={{
          padding: '1rem 1.25rem', borderRadius: 'var(--radius-sm)',
          background: 'rgba(200, 16, 46, 0.08)', border: '1px solid rgba(200, 16, 46, 0.3)',
          display: 'flex', alignItems: 'center', gap: '0.85rem', color: 'var(--gsh-red)'
        }}>
          <AlertCircle style={{ width: '22px', height: '22px', flexShrink: 0 }} />
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>Backend Connection Failed</p>
            <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Cannot reach <code>http://localhost:8000</code>. Run <code>python main.py</code> inside <code>backend/</code>.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <KpiCard
          title="Total Net Amount"
          value={data ? `LKR ${formatCurrency(data.total_net_amount)}` : (error ? 'Offline' : 'Loading...')}
          subtext="Net Domestic Invoiced Amount (Col Q)"
          icon={DollarSign}
          accentColor="var(--gsh-red)"
        />
        <KpiCard
          title="Total Invoice Rows"
          value={data ? `${data.total_count.toLocaleString()} Rows` : (error ? 'Offline' : 'Loading...')}
          subtext="Unique Invoiced Transactions"
          icon={FileText}
          accentColor="var(--gsh-teal)"
        />
      </div>

      {/* Search Controls */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '480px' }}>
          <Search style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: 'var(--text-subtle)' }} />
          <input
            type="text"
            placeholder="Search Invoice No, Order No, Customer, Catalog No, Description..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: '100%', padding: '0.55rem 1rem 0.55rem 2.5rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Main Datatable with Excel-Style Headers for All 38 Columns */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', maxHeight: '600px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left', minWidth: '3200px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <ExcelRowHeader />
                {ALL_INVOICE_COLUMNS.map(c => (
                  <ExcelColHeader key={c.col} col={c.col} label={c.label} align={c.align} minWidth={c.minWidth} />
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={ALL_INVOICE_COLUMNS.length + 1} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Invoice Output records...</td></tr>
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
                      {ALL_INVOICE_COLUMNS.map(c => (
                        <td
                          key={c.col}
                          style={{
                            padding: '0.65rem 0.85rem',
                            textAlign: c.align || 'left',
                            fontWeight: c.field === 'net_dom_amount' ? 800 : (c.field === 'invoice_no' || c.field === 'order_no' ? 700 : 400),
                            color: c.field === 'net_dom_amount' ? 'var(--gsh-red)' : 'var(--text-main)',
                            fontFamily: c.field === 'invoice_no' || c.field === 'order_no' || c.field === 'catalog_no' ? 'monospace' : 'inherit',
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
                <tr><td colSpan={ALL_INVOICE_COLUMNS.length + 1} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No Invoice Output records found.</td></tr>
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
                  <button key={size} onClick={() => handleLimitChange(size)} style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: limit === size ? 'var(--gsh-red)' : 'var(--bg-primary)', color: limit === size ? '#fff' : 'var(--text-main)', cursor: 'pointer', fontWeight: limit === size ? 700 : 400 }}>
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

export default InvoiceOutputPage;
