import React, { useState, useEffect } from 'react';
import { Truck, RefreshCw, Search, CheckCircle, AlertCircle, Database, Server, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';

const fmt = (v) => (v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const OutstandingSyncPage = () => {
  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadOutstandingData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/outstanding-output', { params: { search: searchTerm, limit: 500 } });

      if (res.data && res.data.data) {
        setData(res.data.data);
        setTotalCount(res.data.total || res.data.data.length);
      }
    } catch {
      showToast('Failed to load outstanding backlog records.', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOutstandingData();
  }, [searchTerm]);

  const handleTriggerOutstandingSync = async () => {
    setSyncing(true);
    try {
      showToast('Connecting to Oracle IFS (172.16.7.45) & executing ifsapp.gsh_order_report query...', 'info');
      const res = await api.post('/oracle-sync/sync-outstanding');
      if (res.data) {
        showToast(res.data.message || '✅ Outstanding Backlog Sync Complete!');
        loadOutstandingData();
      }
    } catch {
      showToast('Failed to execute Oracle outstanding backlog sync query.', 'error');
    }
    setSyncing(false);
  };

  const filtered = data.filter(r => {
    if (!searchTerm.trim()) return true;
    const t = searchTerm.toLowerCase();
    return (
      (r.customer_name && r.customer_name.toLowerCase().includes(t)) ||
      (r.order_no && r.order_no.toLowerCase().includes(t)) ||
      (r.catalog_no && r.catalog_no.toLowerCase().includes(t)) ||
      (r.catalog_desc && r.catalog_desc.toLowerCase().includes(t)) ||
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
            <Truck style={{ width: '24px', height: '24px', color: 'var(--gsh-teal)' }} />
            Outstanding Sync — Oracle IFS Data Connection (outstanding_output)
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
            Read-only live connection to Oracle Database (172.16.7.45) executing <code style={{ background: 'var(--bg-hover)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>ifsapp.gsh_order_report@IFS_PROD_IFSAPP</code>.
          </p>
        </div>

        <button onClick={loadOutstandingData} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 0.9rem', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
          <RefreshCw style={{ width: '15px', height: '15px' }} /> Refresh
        </button>
      </div>

      {/* Oracle Connection & Sync Trigger Card */}
      <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--gsh-teal)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-xs)', background: 'rgba(0,168,150,0.1)', color: 'var(--gsh-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
            onClick={handleTriggerOutstandingSync}
            disabled={syncing}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.65rem 1.4rem', background: syncing ? 'var(--bg-hover)' : 'linear-gradient(135deg, #00a896 0%, #00897b 100%)',
              border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff',
              fontWeight: 800, fontSize: '0.85rem', cursor: syncing ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(0, 168, 150, 0.3)'
            }}
          >
            {syncing ? <RefreshCw className="animate-spin" style={{ width: '16px', height: '16px' }} /> : <Play style={{ width: '16px', height: '16px' }} />}
            {syncing ? 'Syncing Outstanding Data...' : 'Execute Oracle Outstanding Query Sync'}
          </button>
        </div>

        <div style={{ background: 'var(--bg-primary)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.8rem' }}>
          <div>
            <span style={{ color: 'var(--text-subtle)', fontWeight: 700 }}>Target Oracle Query: </span>
            <code style={{ color: 'var(--gsh-teal)', fontWeight: 700 }}>SELECT * FROM ifsapp.gsh_order_report@IFS_PROD_IFSAPP</code>
          </div>
          <div>
            <span style={{ color: 'var(--text-subtle)', fontWeight: 700 }}>Synced Local Records: </span>
            <strong style={{ color: 'var(--gsh-teal)', fontSize: '0.9rem' }}>{totalCount.toLocaleString()} Rows</strong>
          </div>
        </div>
      </div>

      {/* Search Bar & Pagination Meta */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--text-subtle)' }} />
          <input
            type="text"
            placeholder="Search Customer, Order No, Part No, Description..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.4rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: 'var(--text-main)', fontSize: '0.85rem', outline: 'none' }}
          />
        </div>

        <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-muted)' }}>
          Showing <strong>{paginatedData.length}</strong> of <strong>{filtered.length}</strong> items (Page {currentPage} of {totalPages})
        </div>
      </div>

      {/* Datatable for outstanding_output */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 350px)', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-hover)', borderBottom: '2px solid var(--border-color)' }}>
              <tr style={{ color: 'var(--text-main)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Customer Name</th>
                <th style={{ padding: '0.75rem 1rem', color: 'var(--gsh-teal)' }}>Order No</th>
                <th style={{ padding: '0.75rem 1rem' }}>Part No (Catalog No)</th>
                <th style={{ padding: '0.75rem 1rem' }}>Description</th>
                <th style={{ padding: '0.75rem 1rem' }}>Contract</th>
                <th style={{ padding: '0.75rem 1rem' }}>Planned Delivery Date</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--gsh-teal)' }}>Backlog Value (LKR)</th>
                <th style={{ padding: '0.75rem 1rem' }}>Cust Grp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading live outstanding_output backlog records...
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No backlog records matching "{searchTerm}".
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.6rem 1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {row.customer_name || 'General Customer'}
                    </td>
                    <td style={{ padding: '0.6rem 1rem', fontFamily: 'monospace', fontWeight: 800, color: 'var(--gsh-teal)' }}>
                      {row.order_no || '-'}
                    </td>
                    <td style={{ padding: '0.6rem 1rem', fontFamily: 'monospace', fontWeight: 800, color: 'var(--gsh-red)' }}>
                      {row.catalog_no || '-'}
                    </td>
                    <td style={{ padding: '0.6rem 1rem', color: 'var(--text-muted)', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {row.catalog_desc || '-'}
                    </td>
                    <td style={{ padding: '0.6rem 1rem', fontWeight: 700 }}>
                      <span style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', background: row.contract === 'GSTEA' ? 'rgba(239,68,68,0.1)' : 'rgba(0,168,150,0.1)', color: row.contract === 'GSTEA' ? '#ef4444' : 'var(--gsh-teal)', fontSize: '0.75rem' }}>
                        {row.contract || 'HO'}
                      </span>
                    </td>
                    <td style={{ padding: '0.6rem 1rem', color: 'var(--text-subtle)' }}>
                      {row.planned_delivery_date ? String(row.planned_delivery_date).substring(0, 10) : '-'}
                    </td>
                    <td style={{ padding: '0.6rem 1rem', textAlign: 'right', fontWeight: 800, color: 'var(--gsh-teal)' }}>
                      LKR {fmt(row.backlog_value_base_curr)}
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
              <button key={sz} onClick={() => { setPageSize(sz); setCurrentPage(1); }} style={{ padding: '0.25rem 0.55rem', background: pageSize === sz ? 'var(--gsh-teal)' : 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)', color: pageSize === sz ? '#fff' : 'var(--text-main)', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>
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

export default OutstandingSyncPage;
