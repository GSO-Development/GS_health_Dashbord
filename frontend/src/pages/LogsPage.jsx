import React, { useState, useEffect, useMemo } from 'react';
import { 
  ScrollText, Search, Filter, RefreshCw, Calendar, 
  CheckCircle, AlertTriangle, XCircle, Shield, User,
  Database, RefreshCcw, Layers, Settings, Eye, Trash2,
  ChevronLeft, ChevronRight, Hash, Clock, Globe
} from 'lucide-react';
import api from '../services/api';

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total_logs: 0, logins_today: 0, syncs_today: 0, errors_today: 0, action_breakdown: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchLogs = async (pageNum = page) => {
    setLoading(true);
    try {
      const params = {
        page: pageNum,
        page_size: pageSize
      };
      if (actionFilter !== 'all') params.action_type = actionFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const [resLogs, resStats] = await Promise.all([
        api.get('/logs', { params }),
        api.get('/logs/stats')
      ]);

      if (resLogs.data) {
        setLogs(resLogs.data.data || []);
        setTotalCount(resLogs.data.total || 0);
        setTotalPages(resLogs.data.total_pages || 1);
        setPage(resLogs.data.page || 1);
      }
      if (resStats.data) {
        setStats(resStats.data);
      }
    } catch {
      showToast('Failed to fetch system logs.', 'error');
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchLogs(1);
  }, [actionFilter, statusFilter, pageSize]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    fetchLogs(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setActionFilter('all');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
    fetchLogs(1);
  };

  const handlePruneLogs = async () => {
    if (!window.confirm('Are you sure you want to prune logs older than 30 days?')) return;
    try {
      const res = await api.delete('/logs/clear', { params: { days: 30 } });
      if (res.data) {
        showToast(res.data.message || 'Old logs pruned successfully!');
        fetchLogs(1);
      }
    } catch {
      showToast('Failed to prune logs.', 'error');
    }
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'LOGIN':
        return { bg: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)', label: 'User Login' };
      case 'AUTO_SYNC':
        return { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)', label: 'Auto Sync' };
      case 'MANUAL_SYNC':
      case 'SYNC_IFS_INVOICE':
      case 'SYNC_IFS_OUTSTANDING':
      case 'SYNC_AXIENTA':
        return { bg: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4', border: 'rgba(6, 182, 212, 0.3)', label: action.replace('SYNC_', '') };
      case 'UPLOAD_BUDGET':
        return { bg: 'rgba(245, 158, 11, 0.12)', color: '#d97706', border: 'rgba(245, 158, 11, 0.3)', label: 'Budget Upload' };
      case 'SETTINGS_UPDATE':
        return { bg: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6', border: 'rgba(139, 92, 246, 0.3)', label: 'Settings' };
      case 'MAP_DIVISION':
        return { bg: 'rgba(236, 72, 153, 0.12)', color: '#ec4899', border: 'rgba(236, 72, 153, 0.3)', label: 'Map Division' };
      default:
        return { bg: 'rgba(100, 116, 139, 0.12)', color: '#64748b', border: 'rgba(100, 116, 139, 0.3)', label: action };
    }
  };

  return (
    <div className="page-view animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2.5rem' }}>
      
      {/* Toast Alert */}
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 999999, padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-sm)', background: toast.type === 'success' ? '#10b981' : (toast.type === 'info' ? 'var(--gsh-teal)' : '#ef4444'), color: '#fff', fontWeight: 700, fontSize: '0.85rem', boxShadow: '0 8px 24px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {toast.type === 'success' ? <CheckCircle style={{ width: '18px', height: '18px' }} /> : <AlertTriangle style={{ width: '18px', height: '18px' }} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', background: 'rgba(200, 16, 46, 0.1)', color: 'var(--gsh-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
              <ScrollText style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                System Activity & Audit Logs
              </h1>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                Real-time audit records tracking user logins, automated delta syncs, data imports, and configuration updates.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => { setRefreshing(true); fetchLogs(page); }}
              disabled={loading}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 700, padding: '0.5rem 0.85rem' }}
            >
              <RefreshCw style={{ width: '15px', height: '15px', animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              Refresh
            </button>

            <button
              onClick={handlePruneLogs}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 700, padding: '0.5rem 0.85rem', color: '#e11d48' }}
              title="Prune logs older than 30 days"
            >
              <Trash2 style={{ width: '15px', height: '15px' }} />
              Prune (&gt;30d)
            </button>
          </div>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        
        {/* Total Logs */}
        <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--gsh-teal)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Audit Logs</span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0.35rem 0 0 0', color: 'var(--text-main)' }}>
                {stats.total_logs?.toLocaleString() || 0}
              </h3>
            </div>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(0,168,150,0.1)', color: 'var(--gsh-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ScrollText style={{ width: '20px', height: '20px' }} />
            </div>
          </div>
        </div>

        {/* Logins Today */}
        <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Logins Today</span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0.35rem 0 0 0', color: '#3b82f6' }}>
                {stats.logins_today || 0}
              </h3>
            </div>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User style={{ width: '20px', height: '20px' }} />
            </div>
          </div>
        </div>

        {/* Syncs Today */}
        <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sync Jobs Today</span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0.35rem 0 0 0', color: '#10b981' }}>
                {stats.syncs_today || 0}
              </h3>
            </div>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RefreshCcw style={{ width: '20px', height: '20px' }} />
            </div>
          </div>
        </div>

        {/* Failed / Errors Today */}
        <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Errors / Failed</span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0.35rem 0 0 0', color: stats.errors_today > 0 ? '#ef4444' : '#10b981' }}>
                {stats.errors_today || 0}
              </h3>
            </div>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle style={{ width: '20px', height: '20px' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 280px' }}>
              <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search username, description, IP address..."
                className="input-field"
                style={{ paddingLeft: '2.25rem', fontSize: '0.85rem' }}
              />
            </div>

            {/* Action Type Filter */}
            <div style={{ minWidth: '160px' }}>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="input-field"
                style={{ fontSize: '0.85rem' }}
              >
                <option value="all">All Actions</option>
                <option value="LOGIN">User Logins</option>
                <option value="AUTO_SYNC">Auto Sync Jobs</option>
                <option value="MANUAL_SYNC">Manual Sync Jobs</option>
                <option value="SYNC_IFS_INVOICE">IFS Invoices</option>
                <option value="SYNC_IFS_OUTSTANDING">IFS Outstanding</option>
                <option value="SYNC_AXIENTA">Axienta Sync</option>
                <option value="UPLOAD_BUDGET">Budget Uploads</option>
                <option value="SETTINGS_UPDATE">Settings Updates</option>
                <option value="MAP_DIVISION">Division Mappings</option>
              </select>
            </div>

            {/* Status Filter */}
            <div style={{ minWidth: '130px' }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field"
                style={{ fontSize: '0.85rem' }}
              >
                <option value="all">All Statuses</option>
                <option value="SUCCESS">Success Only</option>
                <option value="FAILED">Failed Only</option>
                <option value="WARNING">Warning Only</option>
              </select>
            </div>

            {/* Start Date */}
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field"
              style={{ fontSize: '0.82rem', width: 'auto' }}
              title="From Date"
            />

            {/* End Date */}
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field"
              style={{ fontSize: '0.82rem', width: 'auto' }}
              title="To Date"
            />

            <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: 800 }}>
              Search
            </button>

            {(searchTerm || actionFilter !== 'all' || statusFilter !== 'all' || startDate || endDate) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 0.85rem', fontSize: '0.82rem' }}
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Logs Data Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.835rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                <th style={{ padding: '0.85rem 1.25rem' }}>Timestamp</th>
                <th style={{ padding: '0.85rem 1rem' }}>User</th>
                <th style={{ padding: '0.85rem 1rem' }}>Action</th>
                <th style={{ padding: '0.85rem 1rem' }}>Description</th>
                <th style={{ padding: '0.85rem 1rem' }}>IP Address</th>
                <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1.25rem', textAlign: 'center' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <RefreshCw style={{ width: '24px', height: '24px', animation: 'spin 1s linear infinite', margin: '0 auto 0.5rem auto', color: 'var(--gsh-teal)' }} />
                    Loading system audit records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No audit records found matching your filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const badge = getActionBadge(log.action_type);
                  return (
                    <tr
                      key={log.id}
                      style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Timestamp */}
                      <td style={{ padding: '0.75rem 1.25rem', color: '#64748b', whiteSpace: 'nowrap', fontWeight: 600, fontSize: '0.78rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Clock style={{ width: '13px', height: '13px', color: '#94a3b8' }} />
                          {log.created_at}
                        </div>
                      </td>

                      {/* User */}
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <div style={{
                            width: '24px', height: '24px', borderRadius: '50%',
                            background: log.username === 'SYSTEM' || log.username === 'AUTO_SCHEDULER' ? 'rgba(0,168,150,0.15)' : 'rgba(59,130,246,0.15)',
                            color: log.username === 'SYSTEM' || log.username === 'AUTO_SCHEDULER' ? 'var(--gsh-teal)' : '#3b82f6',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.7rem'
                          }}>
                            {log.username ? log.username[0].toUpperCase() : 'U'}
                          </div>
                          <strong style={{ color: 'var(--text-main)', fontSize: '0.82rem' }}>
                            {log.username}
                          </strong>
                        </div>
                      </td>

                      {/* Action */}
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                        <span style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '12px',
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          textTransform: 'uppercase'
                        }}>
                          {badge.label}
                        </span>
                      </td>

                      {/* Description */}
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-main)', maxWidth: '380px' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                          {log.description}
                        </div>
                      </td>

                      {/* IP Address */}
                      <td style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.76rem', whiteSpace: 'nowrap' }}>
                        {log.ip_address || '—'}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                        {log.status === 'SUCCESS' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#10b981', fontWeight: 800, fontSize: '0.76rem' }}>
                            <CheckCircle style={{ width: '14px', height: '14px' }} />
                            Success
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#ef4444', fontWeight: 800, fontSize: '0.76rem' }}>
                            <XCircle style={{ width: '14px', height: '14px' }} />
                            Failed
                          </span>
                        )}
                      </td>

                      {/* Details View */}
                      <td style={{ padding: '0.75rem 1.25rem', textAlign: 'center' }}>
                        {log.details ? (
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', fontWeight: 700 }}
                            title="View full payload / details"
                          >
                            <Eye style={{ width: '13px', height: '13px' }} />
                            View
                          </button>
                        ) : (
                          <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.25rem', borderTop: '1px solid #e2e8f0', background: '#fafafa', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing <strong>{logs.length > 0 ? (page - 1) * pageSize + 1 : 0}</strong> to <strong>{Math.min(page * pageSize, totalCount)}</strong> of <strong>{totalCount}</strong> logs
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="input-field"
              style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.78rem' }}
            >
              <option value="15">15 / page</option>
              <option value="25">25 / page</option>
              <option value="50">50 / page</option>
              <option value="100">100 / page</option>
            </select>

            <button
              onClick={() => fetchLogs(page - 1)}
              disabled={page <= 1 || loading}
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.65rem' }}
            >
              <ChevronLeft style={{ width: '15px', height: '15px' }} />
            </button>

            <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '0 0.4rem', color: 'var(--text-main)' }}>
              {page} / {totalPages}
            </span>

            <button
              onClick={() => fetchLogs(page + 1)}
              disabled={page >= totalPages || loading}
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.65rem' }}
            >
              <ChevronRight style={{ width: '15px', height: '15px' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999999, padding: '1rem'
        }}>
          <div className="glass-card animate-fade-in" style={{
            background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '640px',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Audit Log Details #{selectedLog.id}
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {selectedLog.created_at} • by {selectedLog.username}
                </span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#94a3b8', padding: '0.2rem' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <strong style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Description:</strong>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                  {selectedLog.description}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                <div>
                  <strong style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Action Type:</strong>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.1rem' }}>
                    {selectedLog.action_type}
                  </div>
                </div>
                <div>
                  <strong style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>IP Address:</strong>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.1rem' }}>
                    {selectedLog.ip_address || 'N/A'}
                  </div>
                </div>
              </div>

              <div>
                <strong style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Payload / JSON Details:</strong>
                <pre style={{
                  background: '#0f172a', color: '#38bdf8', padding: '0.85rem',
                  borderRadius: '8px', fontSize: '0.78rem', marginTop: '0.4rem',
                  overflowX: 'auto', maxHeight: '280px', lineHeight: '1.4'
                }}>
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(selectedLog.details), null, 2);
                    } catch {
                      return selectedLog.details;
                    }
                  })()}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedLog(null)}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 1.25rem', fontSize: '0.85rem', fontWeight: 700 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LogsPage;
