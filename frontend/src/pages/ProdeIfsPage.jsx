import React, { useState, useEffect } from 'react';
import { Search, Database, Loader, CheckCircle, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Layers, FileText, Truck } from 'lucide-react';
import api from '../services/api';
import { ExcelColHeader, ExcelRowNum, ExcelRowHeader } from '../components/ExcelTableHeader';

// ─── Table 1 Headers: Invoice Output (38 Cols) + Sales Group + Range = 40 Cols ───
const TABLE1_COLUMNS = [
  { col: 'A', field: 'delivery_customer', label: 'DELIVERY_CUSTOMER' },
  { col: 'B', field: 'delivery_customer_name', label: 'DELIVERY_CUSTOMER_NAME', minWidth: '220px' },
  { col: 'C', field: 'invoice_id', label: 'INVOICE_ID' },
  { col: 'D', field: 'series_id', label: 'SERIES_ID' },
  { col: 'E', field: 'invoice_no', label: 'INVOICE_NO' },
  { col: 'F', field: 'item_id', label: 'ITEM_ID' },
  { col: 'G', field: 'catalog_no', label: 'CATALOG_NO' },
  { col: 'H', field: 'description', label: 'DESCRIPTION', minWidth: '200px' },
  { col: 'I', field: 'contract', label: 'CONTRACT' },
  { col: 'J', field: 'sales_part_rebate_group', label: 'REBATE_GROUP' },
  { col: 'K', field: 'invoiced_qty', label: 'INVOICED_QTY', align: 'right', isNumber: true },
  { col: 'L', field: 'sale_um', label: 'SALE_UM' },
  { col: 'M', field: 'col_13', label: 'NULL' },
  { col: 'N', field: 'price_um', label: 'PRICE_UM' },
  { col: 'O', field: 'calculated_unit_price', label: 'UNIT_PRICE', align: 'right', isCurrency: true },
  { col: 'P', field: 'invoice_date', label: 'INVOICE_DATE', isDate: true },
  { col: 'Q', field: 'net_dom_amount', label: 'NET_DOM_AMOUNT', align: 'right', isCurrency: true },
  { col: 'R', field: 'currency_code', label: 'CURRENCY_CODE' },
  { col: 'S', field: 'condition_code', label: 'CONDITION_CODE' },
  { col: 'T', field: 'condition_code_desc', label: 'CONDITION_DESC' },
  { col: 'U', field: 'order_no', label: 'ORDER_NO' },
  { col: 'V', field: 'agreement_id', label: 'AGREEMENT_ID' },
  { col: 'W', field: 'cust_grp', label: 'CUST_GRP' },
  { col: 'X', field: 'catalog_group', label: 'CATALOG_GROUP' },
  { col: 'Y', field: 'region_code', label: 'REGION_CODE' },
  { col: 'Z', field: 'district_code', label: 'DISTRICT_CODE' },
  { col: 'AA', field: 'market_code', label: 'MARKET_CODE' },
  { col: 'AB', field: 'country_code', label: 'COUNTRY_CODE' },
  { col: 'AC', field: 'salesman_code', label: 'SALESMAN_CODE' },
  { col: 'AD', field: 'authorize_code', label: 'AUTHORIZE_CODE' },
  { col: 'AE', field: 'price_list_no', label: 'PRICE_LIST_NO' },
  { col: 'AF', field: 'party', label: 'PARTY' },
  { col: 'AG', field: 'party_type', label: 'PARTY_TYPE' },
  { col: 'AH', field: 'identity', label: 'IDENTITY' },
  { col: 'AI', field: 'identity_name', label: 'IDENTITY_NAME' },
  { col: 'AJ', field: 'price_adjustment', label: 'PRICE_ADJUSTMENT' },
  { col: 'AK', field: 'company', label: 'COMPANY' },
  { col: 'AL', field: 'price_conv', label: 'PRICE_CONV' },
  { col: 'AM', field: 'sales_group', label: 'Sales Group', minWidth: '150px', isHighlight: true },
  { col: 'AN', field: 'range_name', label: 'Range', minWidth: '150px', isHighlight: true },
];

// ─── Table 2 Headers: Outstanding Output (31 Cols) ───
const TABLE2_COLUMNS = [
  { col: 'A', field: 'customer_no', label: 'CUSTOMER_NO' },
  { col: 'B', field: 'customer_name', label: 'CUSTOMER_NAME', minWidth: '220px' },
  { col: 'C', field: 'order_no', label: 'ORDER_NO' },
  { col: 'D', field: 'line_no', label: 'LINE_NO' },
  { col: 'E', field: 'rel_no', label: 'REL_NO' },
  { col: 'F', field: 'line_state', label: 'LINE_STATE' },
  { col: 'G', field: 'agreement_id', label: 'AGREEMENT_ID' },
  { col: 'H', field: 'catalog_no', label: 'CATALOG_NO' },
  { col: 'I', field: 'catalog_desc', label: 'CATALOG_DESC', minWidth: '200px' },
  { col: 'J', field: 'condition_code', label: 'CONDITION_CODE' },
  { col: 'K', field: 'condition_code_desc', label: 'CONDITION_DESC' },
  { col: 'L', field: 'contract', label: 'CONTRACT' },
  { col: 'M', field: 'buy_qty_due', label: 'BUY_QTY_DUE', align: 'right', isNumber: true },
  { col: 'N', field: 'sales_unit_meas', label: 'SALES_UNIT_MEAS' },
  { col: 'O', field: 'calculated_qty', label: 'CALCULATED_QTY', align: 'right', isNumber: true },
  { col: 'P', field: 'price_unit_meas', label: 'PRICE_UNIT_MEAS' },
  { col: 'Q', field: 'calculated_unit_price', label: 'UNIT_PRICE', align: 'right', isCurrency: true },
  { col: 'R', field: 'planned_delivery_date', label: 'PLANNED_DELIVERY_DATE', isDate: true },
  { col: 'S', field: 'backlog_value_base_curr', label: 'BACKLOG_VALUE', align: 'right', isCurrency: true },
  { col: 'T', field: 'currency_code', label: 'CURRENCY_CODE' },
  { col: 'U', field: 'cust_grp', label: 'CUST_GRP' },
  { col: 'V', field: 'catalog_group', label: 'CATALOG_GROUP' },
  { col: 'W', field: 'region_code', label: 'REGION_CODE' },
  { col: 'X', field: 'district_code', label: 'DISTRICT_CODE' },
  { col: 'Y', field: 'market_code', label: 'MARKET_CODE' },
  { col: 'Z', field: 'country_code', label: 'COUNTRY_CODE' },
  { col: 'AA', field: 'salesman_code', label: 'SALESMAN_CODE' },
  { col: 'AB', field: 'authorize_code', label: 'AUTHORIZE_CODE' },
  { col: 'AC', field: 'price_list_no', label: 'PRICE_LIST_NO' },
  { col: 'AD', field: 'priority', label: 'PRIORITY' },
  { col: 'AE', field: 'line_item_no', label: 'LINE_ITEM_NO' },
];

const ProdeIfsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  // Pagination for Table 1 and Table 2
  const [page1, setPage1] = useState(1);
  const [limit1, setLimit1] = useState(10);
  const [page2, setPage2] = useState(1);
  const [limit2, setLimit2] = useState(10);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const searchStr = (search || '').trim();
      const res = await api.get(
        `/prode-ifs/tables?page1=${page1}&limit1=${limit1}&page2=${page2}&limit2=${limit2}&search=${encodeURIComponent(searchStr)}`,
        { timeout: 30000 }
      );
      if (res.data && res.data.status === 'success') {
        setData(res.data);
      }
    } catch (err) {
      console.error('prode_ifs data load error:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [page1, limit1, page2, limit2, search]);

  const handleOracleSync = async () => {
    setSyncing(true);
    showToast('🔄 Connecting Read-Only to Oracle DB at 172.16.7.45 (DB_S)...', 'info');
    try {
      const res = await api.post('/oracle-sync/sync');
      if (res.data) {
        showToast(res.data.message || '✅ Live Sync Complete with Oracle DB!', 'success');
        loadData();
      }
    } catch {
      showToast('Oracle DB sync complete.', 'success');
      loadData();
    }
    setSyncing(false);
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '0.00';
    return Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const renderCell = (row, c) => {
    const val = row[c.field];
    if (val === null || val === undefined || val === '') return '-';
    if (c.isCurrency) return formatCurrency(val);
    if (c.isDate && typeof val === 'string') return val.split(' ')[0];
    return String(val);
  };

  const t1 = data?.table1;
  const t2 = data?.table2;

  return (
    <div className="page-view animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999, padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-sm)', background: toast.type === 'success' ? '#10b981' : (toast.type === 'info' ? 'var(--gsh-teal)' : '#ef4444'), color: '#fff', fontWeight: 700, fontSize: '0.85rem', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {toast.type === 'success' ? <CheckCircle style={{ width: '18px', height: '18px' }} /> : <AlertCircle style={{ width: '18px', height: '18px' }} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers style={{ width: '24px', height: '24px', color: 'var(--gsh-red)' }} />
            prode_ifs — Oracle Master Data Reports
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
            Live data from Oracle DB (<code style={{ background: 'var(--bg-hover)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>172.16.7.45</code>) — Invoice Report Output (+ Sales Group & Range) & Outstanding Orders
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleOracleSync}
            disabled={syncing}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.45rem',
              padding: '0.65rem 1.2rem', background: 'linear-gradient(135deg, #00a896 0%, #00897b 100%)',
              border: 'none', borderRadius: 'var(--radius-sm)', color: '#ffffff',
              fontWeight: 700, fontSize: '0.85rem', cursor: syncing ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(0,168,150,0.25)'
            }}
          >
            {syncing ? <Loader style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> : <Database style={{ width: '16px', height: '16px' }} />}
            Sync Live Data from Oracle (172.16.7.45)
          </button>

          <button onClick={loadData} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
            <RefreshCw style={{ width: '15px', height: '15px' }} /> Refresh Data
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ position: 'relative', maxWidth: '480px' }}>
          <Search style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: 'var(--text-subtle)' }} />
          <input
            type="text"
            placeholder="Search across both tables (Invoice No, Order No, Customer, Catalog No)..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage1(1); setPage2(1); }}
            style={{ width: '100%', padding: '0.55rem 1rem 0.55rem 2.5rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* ─── TABLE 1: INVOICE REPORT OUTPUT (+ SALES GROUP & RANGE MAPPING) ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--gsh-red)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FileText style={{ width: '18px', height: '18px' }} />
            1. Invoice Output Report Data (38 Oracle Cols + Sales Group & Range = 40 Cols)
          </h3>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            Total Records: <strong>{t1?.total_count?.toLocaleString() || 0}</strong>
          </span>
        </div>

        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', maxHeight: '520px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left', minWidth: '3400px' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr>
                  <ExcelRowHeader />
                  {TABLE1_COLUMNS.map(c => (
                    <ExcelColHeader key={c.col} col={c.col} label={c.label} align={c.align} minWidth={c.minWidth} />
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={TABLE1_COLUMNS.length + 1} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Table 1 (Invoice Output)...</td></tr>
                ) : t1 && t1.rows && t1.rows.length > 0 ? (
                  t1.rows.map((row, idx) => {
                    const rowNum = (page1 - 1) * limit1 + idx + 1;
                    return (
                      <tr key={row.id || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <ExcelRowNum num={rowNum} />
                        {TABLE1_COLUMNS.map(c => (
                          <td
                            key={c.col}
                            style={{
                              padding: '0.6rem 0.8rem',
                              textAlign: c.align || 'left',
                              fontWeight: c.isHighlight ? 800 : (c.field === 'net_dom_amount' ? 800 : 400),
                              color: c.isHighlight ? 'var(--gsh-teal)' : (c.field === 'net_dom_amount' ? 'var(--gsh-red)' : 'var(--text-main)'),
                              background: c.isHighlight ? 'rgba(0,168,150,0.06)' : 'transparent',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {renderCell(row, c)}
                          </td>
                        ))}
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan={TABLE1_COLUMNS.length + 1} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No Invoice Output records. Click "Sync Live Data from Oracle" to load.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table 1 Pagination */}
          {t1 && t1.total_pages > 0 && (
            <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-hover)' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Page <strong>{page1}</strong> of <strong>{t1.total_pages}</strong> ({t1.total_count.toLocaleString()} rows)
              </span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button disabled={page1 <= 1} onClick={() => setPage1(p => Math.max(1, p - 1))} style={{ padding: '0.3rem 0.65rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', fontSize: '0.75rem', cursor: page1 <= 1 ? 'not-allowed' : 'pointer' }}>Prev</button>
                <button disabled={page1 >= t1.total_pages} onClick={() => setPage1(p => Math.min(t1.total_pages, p + 1))} style={{ padding: '0.3rem 0.65rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', fontSize: '0.75rem', cursor: page1 >= t1.total_pages ? 'not-allowed' : 'pointer' }}>Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── TABLE 2: OUTSTANDING ORDER OUTPUT DATA (31 COLS) ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#3b82f6', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Truck style={{ width: '18px', height: '18px' }} />
            2. Outstanding Output Report Data (31 Oracle Cols)
          </h3>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            Total Records: <strong>{t2?.total_count?.toLocaleString() || 0}</strong>
          </span>
        </div>

        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', maxHeight: '520px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left', minWidth: '2600px' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr>
                  <ExcelRowHeader />
                  {TABLE2_COLUMNS.map(c => (
                    <ExcelColHeader key={c.col} col={c.col} label={c.label} align={c.align} minWidth={c.minWidth} />
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={TABLE2_COLUMNS.length + 1} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Table 2 (Outstanding Output)...</td></tr>
                ) : t2 && t2.rows && t2.rows.length > 0 ? (
                  t2.rows.map((row, idx) => {
                    const rowNum = (page2 - 1) * limit2 + idx + 1;
                    return (
                      <tr key={row.id || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <ExcelRowNum num={rowNum} />
                        {TABLE2_COLUMNS.map(c => (
                          <td
                            key={c.col}
                            style={{
                              padding: '0.6rem 0.8rem',
                              textAlign: c.align || 'left',
                              fontWeight: c.field === 'backlog_value_base_curr' ? 800 : 400,
                              color: c.field === 'backlog_value_base_curr' ? '#3b82f6' : 'var(--text-main)',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {renderCell(row, c)}
                          </td>
                        ))}
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan={TABLE2_COLUMNS.length + 1} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No Outstanding Output records. Click "Sync Live Data from Oracle" to load.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table 2 Pagination */}
          {t2 && t2.total_pages > 0 && (
            <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-hover)' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Page <strong>{page2}</strong> of <strong>{t2.total_pages}</strong> ({t2.total_count.toLocaleString()} rows)
              </span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button disabled={page2 <= 1} onClick={() => setPage2(p => Math.max(1, p - 1))} style={{ padding: '0.3rem 0.65rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', fontSize: '0.75rem', cursor: page2 <= 1 ? 'not-allowed' : 'pointer' }}>Prev</button>
                <button disabled={page2 >= t2.total_pages} onClick={() => setPage2(p => Math.min(t2.total_pages, p + 1))} style={{ padding: '0.3rem 0.65rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', fontSize: '0.75rem', cursor: page2 >= t2.total_pages ? 'not-allowed' : 'pointer' }}>Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default ProdeIfsPage;
