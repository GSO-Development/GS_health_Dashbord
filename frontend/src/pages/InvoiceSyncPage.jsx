import React, { useState, useEffect } from 'react';
import { FileText, RefreshCw, Search, CheckCircle, AlertCircle, Database, Server, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';

const fmt = (v) => (v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const InvoiceSyncPage = () => {
  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [toast, setToast] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadInvoiceData = async () => {
    setLoading(true);
    try {
      const [resData, resStatus] = await Promise.all([
        api.get('/invoice-output', { params: { search: searchTerm, limit: 500 } }),
        api.get('/oracle-sync/status')
      ]);

      if (resData.data && resData.data.data) {
        setData(resData.data.data);
        setTotalCount(resData.data.total || resData.data.data.length);
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
  }, [searchTerm]);

  const handleTriggerInvoiceSync = async () => {
    setSyncing(true);
    try {
      showToast('Connecting to Oracle IFS (172.16.7.45) & executing ifsapp.gsh_invoice_report query...', 'info');
      const res = await api.post('/oracle-sync/sync-invoices');
      if (res.data) {
        showToast(res.data.message || '✅ Invoice Sync Complete!');
        loadInvoiceData();
      }
    } catch {
      showToast('Failed to execute Oracle invoice sync query.', 'error');
    }
    setSyncing(false);
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
            Read-only live connection to Oracle Database (172.16.7.45) executing <code style={{ background: 'var(--bg-hover)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>ifsapp.gsh_invoice_report@IFS_PROD_IFSAPP</code>.
          </p>
        </div>

        <button onClick={loadInvoiceData} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 0.9rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
          <RefreshCw style={{ width: '15px', height: '15px' }} /> Refresh
        </button>
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
            {syncing ? 'Syncing Invoice Data...' : 'Execute Oracle Invoice Query Sync'}
          </button>
        </div>

        <div style={{ background: 'var(--bg-primary)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.8rem' }}>
          <div>
            <span style={{ color: 'var(--text-subtle)', fontWeight: 700 }}>Target Oracle Query: </span>
            <code style={{ color: 'var(--gsh-teal)', fontWeight: 700 }}>SELECT * FROM ifsapp.gsh_invoice_report@IFS_PROD_IFSAPP</code>
          </div>
          <div>
            <span style={{ color: 'var(--text-subtle)', fontWeight: 700 }}>Synced Local Records: </span>
            <strong style={{ color: 'var(--gsh-red)', fontSize: '0.9rem' }}>{totalCount.toLocaleString()} Rows</strong>
          </div>
        </div>
      </div>

      {/* Search Bar & Pagination Meta */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--text-subtle)' }} />
          <input
            type="text"
            placeholder="Search Customer, Invoice No, Part No, SKU..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.4rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.85rem', outline: 'none' }}
          />
        </div>

        <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-muted)' }}>
          Showing <strong>{paginatedData.length}</strong> of <strong>{filtered.length}</strong> items (Page {currentPage} of {totalPages})
        </div>
      </div>

      {/* Datatable for invoice_output */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 350px)', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-hover)', borderBottom: '2px solid var(--border-color)' }}>
              <tr style={{ color: 'var(--text-main)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Customer Name</th>
                <th style={{ padding: '0.75rem 1rem', color: 'var(--gsh-red)' }}>Invoice No</th>
                <th style={{ padding: '0.75rem 1rem' }}>Part No (Catalog No)</th>
                <th style={{ padding: '0.75rem 1rem' }}>Description</th>
                <th style={{ padding: '0.75rem 1rem' }}>Contract</th>
                <th style={{ padding: '0.75rem 1rem' }}>Invoice Date</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#10b981' }}>Net Dom Amount (LKR)</th>
                <th style={{ padding: '0.75rem 1rem' }}>Cust Grp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading live invoice_output records...
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No invoice records matching "{searchTerm}".
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.6rem 1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {row.delivery_customer_name || 'General Customer'}
                    </td>
                    <td style={{ padding: '0.6rem 1rem', fontFamily: 'monospace', fontWeight: 800, color: 'var(--gsh-red)' }}>
                      {row.invoice_no || '-'}
                    </td>
                    <td style={{ padding: '0.6rem 1rem', fontFamily: 'monospace', fontWeight: 800, color: 'var(--gsh-teal)' }}>
                      {row.catalog_no || '-'}
                    </td>
                    <td style={{ padding: '0.6rem 1rem', color: 'var(--text-muted)', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {row.description || '-'}
                    </td>
                    <td style={{ padding: '0.6rem 1rem', fontWeight: 700 }}>
                      <span style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', background: row.contract === 'GSTEA' ? 'rgba(239,68,68,0.1)' : 'rgba(0,168,150,0.1)', color: row.contract === 'GSTEA' ? '#ef4444' : 'var(--gsh-teal)', fontSize: '0.75rem' }}>
                        {row.contract || 'HO'}
                      </span>
                    </td>
                    <td style={{ padding: '0.6rem 1rem', color: 'var(--text-subtle)' }}>
                      {row.invoice_date ? String(row.invoice_date).substring(0, 10) : '-'}
                    </td>
                    <td style={{ padding: '0.6rem 1rem', textAlign: 'right', fontWeight: 800, color: '#10b981' }}>
                      LKR {fmt(row.net_dom_amount)}
                    </td>
                    <td style={{ padding: '0.6rem 1rem' }}>
                      <span style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', background: row.cust_grp === 'DISTRI' ? 'rgba(200,16,46,0.1)' : 'var(--bg-hover)', color: row.cust_grp === 'DISTRI' ? 'var(--gsh-red)' : 'var(--text-main)', fontWeight: 700, fontSize: '0.75rem' }}>
                        {row.cust_grp || 'STANDARD'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', padding: '0.75rem 1rem', background: 'var(--bg-hover)', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Rows per page:</span>
            {[25, 50, 100, 200].map(sz => (
              <button key={sz} onClick={() => { setPageSize(sz); setCurrentPage(1); }} style={{ padding: '0.25rem 0.55rem', background: pageSize === sz ? 'var(--gsh-red)' : 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: pageSize === sz ? '#fff' : 'var(--text-main)', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>
                {sz}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} style={{ padding: '0.35rem 0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.8rem', fontWeight: 700, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}>
              <ChevronLeft style={{ width: '14px', height: '14px' }} /> Prev
            </button>
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} style={{ padding: '0.35rem 0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.8rem', fontWeight: 700, cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', opacity: currentPage >= totalPages ? 0.5 : 1 }}>
              Next <ChevronRight style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default InvoiceSyncPage;
