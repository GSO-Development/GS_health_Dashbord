import React, { useState, useEffect } from 'react';
import { FileText, RefreshCw, Search, CheckCircle, AlertCircle, Database, Server, Play, ChevronLeft, ChevronRight, Calendar, DollarSign, Filter } from 'lucide-react';
import api from '../services/api';

const fmt = (v) => (v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const MONTHS_LIST = [
  { num: 0, name: 'All Months' },
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

const YEARS_LIST = [
  { val: '', label: 'All Years' },
  { val: '2026', label: '2026' },
  { val: '2025', label: '2025' },
  { val: '2024', label: '2024' },
];

const InvoiceSyncPage = () => {
  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalNetAmount, setTotalNetAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [toast, setToast] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);

  // Date & Contract Filter State (Similar to Axienta)
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonthNum, setSelectedMonthNum] = useState(0); // 0 = All Months
  const [selectedContract, setSelectedContract] = useState('');
  const [contractOptions, setContractOptions] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const res = await api.get('/reports/contracts');
        if (res.data && Array.isArray(res.data.contracts)) {
          setContractOptions(res.data.contracts);
        }
      } catch {
        setContractOptions(['DIVSA', 'GSH1N', 'GSHD', 'GSIEX', 'GSTEA', 'GYM01', 'GYM02', 'KLN', 'LTS', 'MTL', 'VANSA']);
      }
    };
    fetchContracts();
  }, []);

  const loadInvoiceData = async () => {
    setLoading(true);
    try {
      const params = {
        search: searchTerm,
        limit: 500,
        page: 1,
      };

      if (selectedYear) params.year = selectedYear;
      if (selectedMonthNum > 0) params.month = selectedMonthNum;
      if (selectedContract) params.contract = selectedContract;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const [resData, resStatus] = await Promise.all([
        api.get('/reports/invoice-output', { params }),
        api.get('/oracle-sync/status')
      ]);

      if (resData.data) {
        const rows = resData.data.rows || resData.data.data || [];
        setData(rows);
        setTotalCount(resData.data.total_count || resData.data.total || rows.length);
        setTotalNetAmount(resData.data.total_net_amount || 0);
      }
      if (resStatus.data) {
        setSyncStatus(resStatus.data);
      }
    } catch {
      showToast('Failed to load invoice records.', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadInvoiceData();
  }, [selectedYear, selectedMonthNum, selectedContract, startDate, endDate]);

  const handleTriggerInvoiceSync = async () => {
    setSyncing(true);
    try {
      const periodLabel = selectedMonthNum > 0 
        ? `${MONTHS_LIST.find(m => m.num === selectedMonthNum)?.name} ${selectedYear}`
        : (selectedYear ? `Year ${selectedYear}` : 'All Periods');

      const contractLabel = selectedContract ? ` (${selectedContract})` : '';

      showToast(`Connecting to Oracle IFS (172.16.7.45) & syncing for ${periodLabel}${contractLabel}...`, 'info');

      const payload = {};
      if (selectedYear) payload.year = parseInt(selectedYear);
      if (selectedMonthNum > 0) payload.month = selectedMonthNum;
      if (selectedContract) payload.contract = selectedContract;
      if (startDate) payload.start_date = startDate;
      if (endDate) payload.end_date = endDate;

      const res = await api.post('/oracle-sync/sync-invoices', payload, { timeout: 180000 });
      if (res.data) {
        showToast(res.data.message || '✅ Invoice Sync Complete!');
        await loadInvoiceData();
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to execute Oracle invoice sync query.';
      showToast(`Sync Notice: ${msg}`, 'error');
    }
    setSyncing(false);
  };

  const clearFilters = () => {
    setSelectedYear('2026');
    setSelectedMonthNum(0);
    setSelectedContract('');
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
  };

  const filtered = data.filter(r => {
    if (!searchTerm.trim()) return true;
    const t = searchTerm.toLowerCase();
    return (
      (r.delivery_customer_name && r.delivery_customer_name.toLowerCase().includes(t)) ||
      (r.invoice_no && r.invoice_no.toLowerCase().includes(t)) ||
      (r.catalog_no && r.catalog_no.toLowerCase().includes(t)) ||
      (r.description && r.description.toLowerCase().includes(t)) ||
      (r.cust_grp && r.cust_grp.toLowerCase().includes(t))
    );
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="page-view animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Toast Notification */}
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 99999, padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-sm)', background: toast.type === 'success' ? '#10b981' : (toast.type === 'info' ? 'var(--gsh-teal)' : '#ef4444'), color: '#fff', fontWeight: 700, fontSize: '0.85rem', boxShadow: '0 8px 24px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {toast.type === 'success' ? <CheckCircle style={{ width: '18px', height: '18px' }} /> : <AlertCircle style={{ width: '18px', height: '18px' }} />}
          {toast.msg}
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText style={{ width: '24px', height: '24px', color: 'var(--gsh-red)' }} />
            Invoice Sync — Oracle IFS Data Connection (invoice_output)
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
            Read-only connection to Oracle Database (172.16.7.45) executing <code style={{ background: 'var(--bg-hover)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>ifsapp.gsh_invoice_report@IFS_PROD_IFSAPP</code>.
          </p>
        </div>
      </div>

      {/* Oracle Connection & Sync Trigger Card */}
      <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--gsh-red)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-xs)', background: 'rgba(200,16,46,0.1)', color: 'var(--gsh-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Server style={{ width: '24px', height: '24px' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Oracle IFS Production Database Connection
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Host: <strong>172.16.7.45:1521</strong> • Service: <strong>IFS_PROD_IFSAPP</strong> • Mode: <span style={{ color: '#10b981', fontWeight: 700 }}>STRICT READ-ONLY</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleTriggerInvoiceSync}
            disabled={syncing}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.65rem 1.4rem', background: syncing ? 'var(--bg-hover)' : 'var(--accent-gradient)',
              border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff',
              fontWeight: 800, fontSize: '0.85rem', cursor: syncing ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(200, 16, 46, 0.3)'
            }}
          >
            {syncing ? <RefreshCw className="animate-spin" style={{ width: '16px', height: '16px' }} /> : <Play style={{ width: '16px', height: '16px' }} />}
            {syncing ? 'Syncing Invoice Data...' : `Execute Oracle Sync (${selectedMonthNum > 0 ? MONTHS_LIST.find(m => m.num === selectedMonthNum)?.name : (selectedYear || 'All')})`}
          </button>
        </div>

        <div style={{ background: 'var(--bg-primary)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.8rem' }}>
          <div>
            <span style={{ color: 'var(--text-subtle)', fontWeight: 700 }}>Target Oracle Query: </span>
            <code style={{ color: 'var(--gsh-teal)', fontWeight: 700 }}>SELECT * FROM ifsapp.gsh_invoice_report@IFS_PROD_IFSAPP</code>
          </div>
          <div>
            <span style={{ color: 'var(--text-subtle)', fontWeight: 700 }}>Filtered Records: </span>
            <strong style={{ color: 'var(--gsh-red)', fontSize: '0.9rem' }}>{totalCount.toLocaleString()} Rows</strong>
          </div>
        </div>
      </div>

      {/* Date Filter & Control Bar (Like Axienta Data Page) */}
      <div className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700 }}>
            <Calendar style={{ width: '16px', height: '16px', color: 'var(--gsh-red)' }} />
            Period Filter:
          </div>

          {/* Year Dropdown */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{ padding: '0.45rem 0.85rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 700, outline: 'none' }}
          >
            {YEARS_LIST.map((y) => (
              <option key={y.val} value={y.val}>{y.label}</option>
            ))}
          </select>

          {/* Month Dropdown */}
          <select
            value={selectedMonthNum}
            onChange={(e) => setSelectedMonthNum(parseInt(e.target.value))}
            style={{ padding: '0.45rem 0.85rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 700, outline: 'none' }}
          >
            {MONTHS_LIST.map((m) => (
              <option key={m.num} value={m.num}>{m.name}</option>
            ))}
          </select>

          {/* Contract Dropdown */}
          <select
            value={selectedContract}
            onChange={(e) => setSelectedContract(e.target.value)}
            style={{ padding: '0.45rem 0.85rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 700, outline: 'none' }}
          >
            <option value="">All Contracts</option>
            {contractOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* From Date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: '0.4rem 0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.8rem', outline: 'none' }}
            />
          </div>

          {/* To Date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: '0.4rem 0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.8rem', outline: 'none' }}
            />
          </div>

          {(selectedYear || selectedMonthNum > 0 || selectedContract || startDate || endDate) && (
            <button
              onClick={clearFilters}
              style={{ padding: '0.4rem 0.75rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Total Net Invoiced Value Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(16, 185, 129, 0.1)', padding: '0.45rem 0.9rem', borderRadius: 'var(--radius-xs)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <DollarSign style={{ width: '16px', height: '16px', color: '#10b981' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Period Revenue:</span>
          <strong style={{ color: '#10b981', fontSize: '0.95rem' }}>Rs. {fmt(totalNetAmount)}</strong>
        </div>
      </div>

      {/* Search Bar & Pagination Meta */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ position: 'relative', width: '340px' }}>
          <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--text-subtle)' }} />
          <input
            type="text"
            placeholder="Search Customer, Invoice No, SKU, Region..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.4rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.85rem', outline: 'none' }}
          />
        </div>

        <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-muted)' }}>
          Showing <strong>{paginatedData.length}</strong> of <strong>{filtered.length}</strong> items (Page {currentPage} of {totalPages})
        </div>
      </div>

      {/* Invoice Data Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ maxHeight: '550px', overflowY: 'auto' }}>
          <table className="data-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={{ padding: '0.75rem 1rem' }}>Invoice No</th>
                <th style={{ padding: '0.75rem 1rem' }}>Contract</th>
                <th style={{ padding: '0.75rem 1rem' }}>Invoice Date</th>
                <th style={{ padding: '0.75rem 1rem' }}>Customer Name</th>
                <th style={{ padding: '0.75rem 1rem' }}>Catalog / SKU</th>
                <th style={{ padding: '0.75rem 1rem' }}>Description</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Invoiced Qty</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Unit Price</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Net Dom Amount</th>
                <th style={{ padding: '0.75rem 1rem' }}>Region / District</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <RefreshCw className="animate-spin" style={{ width: '24px', height: '24px', margin: '0 auto 0.5rem auto', color: 'var(--gsh-red)' }} />
                    <div>Loading filtered invoice records...</div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                      No invoice records found for {selectedMonthNum > 0 ? MONTHS_LIST.find(m => m.num === selectedMonthNum)?.name : ''} {selectedYear || ''}
                    </div>
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto 1rem auto', lineHeight: 1.4 }}>
                      The current database dataset contains <strong>19,046 invoice records for July 2026</strong>. 
                      Switch to <strong>July</strong> or <strong>All Months</strong> to view them.
                    </div>
                    <button
                      onClick={() => { setSelectedYear('2026'); setSelectedMonthNum(7); setSelectedContract(''); setStartDate(''); setEndDate(''); }}
                      style={{ padding: '0.5rem 1.2rem', background: 'var(--accent-gradient)', border: 'none', borderRadius: 'var(--radius-xs)', color: '#fff', fontSize: '0.825rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      View July 2026 Invoices (19,046 Records)
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => (
                  <tr key={row.id || idx} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {row.invoice_no || '-'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(200,16,46,0.1)', color: 'var(--gsh-red)', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>
                        {row.contract || '-'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {row.invoice_date ? String(row.invoice_date).substring(0, 10) : '-'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {row.delivery_customer_name || row.delivery_customer || '-'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ padding: '0.2rem 0.5rem', background: 'var(--bg-hover)', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.75rem' }}>
                        {row.catalog_no || '-'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.description}>
                      {row.description || '-'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-main)' }}>
                      {(row.invoiced_qty || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                      {fmt(row.calculated_unit_price)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 800, color: '#10b981' }}>
                      {fmt(row.net_dom_amount)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                      {row.region_code ? `${row.region_code} / ${row.district_code || ''}` : (row.cust_grp || '-')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-primary)', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              style={{ padding: '0.2rem 0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.8rem' }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ padding: '0.35rem 0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8rem' }}
            >
              <ChevronLeft style={{ width: '16px', height: '16px' }} /> Prev
            </button>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ padding: '0.35rem 0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8rem' }}
            >
              Next <ChevronRight style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default InvoiceSyncPage;
