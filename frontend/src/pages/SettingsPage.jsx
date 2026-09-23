import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, RefreshCw, Zap, CheckCircle, AlertTriangle, 
  Clock, Database, Server, Shield, Layers, FileText, Truck,
  Activity, CheckSquare, Square, Info, Cpu, HardDrive
} from 'lucide-react';
import api from '../services/api';

const SettingsPage = () => {
  const [intervalSetting, setIntervalSetting] = useState('30m');
  const [services, setServices] = useState({
    ifs_invoices: true,
    ifs_outstanding: true,
    axienta: true
  });
  const [syncMode, setSyncMode] = useState('current_month');
  const [schedulerState, setSchedulerState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings');
      if (res.data) {
        const s = res.data.settings || {};
        if (s.auto_sync_interval) setIntervalSetting(s.auto_sync_interval.value);
        if (s.auto_sync_mode) setSyncMode(s.auto_sync_mode.value);
        if (s.auto_sync_services) {
          const sList = s.auto_sync_services.value.split(',').map(x => x.trim().toLowerCase());
          setServices({
            ifs_invoices: sList.includes('ifs_invoices'),
            ifs_outstanding: sList.includes('ifs_outstanding'),
            axienta: sList.includes('axienta')
          });
        }
        setSchedulerState(res.data.scheduler_state);
      }
    } catch {
      showToast('Failed to load system settings.', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const activeServices = [];
      if (services.ifs_invoices) activeServices.push('ifs_invoices');
      if (services.ifs_outstanding) activeServices.push('ifs_outstanding');
      if (services.axienta) activeServices.push('axienta');

      const payload = {
        auto_sync_interval: intervalSetting,
        auto_sync_services: activeServices.join(','),
        auto_sync_mode: syncMode
      };

      const res = await api.put('/settings', payload);
      if (res.data && res.data.status === 'success') {
        showToast('✅ Auto-sync settings saved successfully!');
        fetchSettings();
      } else {
        showToast('Failed to save settings.', 'error');
      }
    } catch {
      showToast('Error saving settings.', 'error');
    }
    setSaving(false);
  };

  const handleTriggerInstantSync = async () => {
    setTriggering(true);
    showToast('⚡ Initiating instant synchronization...', 'info');
    try {
      const res = await api.post('/settings/trigger-sync');
      if (res.data && res.data.status === 'success') {
        showToast(`✅ Instant sync completed! Synced ${res.data.total_records} records.`);
        fetchSettings();
      } else if (res.data && res.data.status === 'in_progress') {
        showToast('A sync job is already in progress.', 'info');
      } else {
        showToast('Sync completed with warnings.', 'warning');
      }
    } catch {
      showToast('Failed to trigger instant sync.', 'error');
    }
    setTriggering(false);
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
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', background: 'rgba(0, 168, 150, 0.12)', color: 'var(--gsh-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
              <Settings style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                System & Auto-Sync Settings
              </h1>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                Configure automated background synchronization intervals for IFS Oracle & Axienta SFA live databases.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleTriggerInstantSync}
              disabled={triggering || loading}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', fontWeight: 700, padding: '0.55rem 1rem', color: '#0284c7' }}
              title="Run delta sync right now"
            >
              <Zap style={{ width: '15px', height: '15px', animation: triggering ? 'spin 1s linear infinite' : 'none' }} />
              {triggering ? 'Syncing Now...' : 'Trigger Instant Sync'}
            </button>

            <button
              onClick={handleSaveSettings}
              disabled={saving || loading}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', fontWeight: 800, padding: '0.55rem 1.25rem' }}
            >
              <Save style={{ width: '15px', height: '15px' }} />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>

      {/* 2-Column Main Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        
        {/* COLUMN 1: Auto-Sync Configuration */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem' }}>
            <Clock style={{ width: '20px', height: '20px', color: 'var(--gsh-teal)' }} />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Automated Background Sync Schedule
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Select how frequently the system automatically pulls delta updates
              </span>
            </div>
          </div>

          {/* Sync Frequency Dropdown */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              ⏱️ Auto-Sync Frequency Interval:
            </label>
            <select
              value={intervalSetting}
              onChange={(e) => setIntervalSetting(e.target.value)}
              className="input-field"
              style={{ fontSize: '0.9rem', fontWeight: 700, padding: '0.65rem 0.85rem' }}
            >
              <option value="10m">10 Minutes (High Frequency - 10m)</option>
              <option value="30m">30 Minutes (Recommended - 30m)</option>
              <option value="1h">1 Hour (Hourly - 1h)</option>
              <option value="disabled">Disabled (Manual Sync Only)</option>
            </select>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
              * When enabled, the backend server will automatically fetch the latest data for the current month without requiring manual button presses.
            </span>
          </div>

          {/* Services to Include */}
          <div style={{ marginTop: '0.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.6rem' }}>
              📦 Services Included in Automated Sync:
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              
              {/* Service 1: IFS Invoices */}
              <label style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.75rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0',
                borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <FileText style={{ width: '18px', height: '18px', color: '#0284c7' }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Oracle IFS Invoices
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Table: `ifsapp.gsh_invoice_report@IFS_PROD_IFSAPP`
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={services.ifs_invoices}
                  onChange={(e) => setServices({ ...services, ifs_invoices: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--gsh-teal)', cursor: 'pointer' }}
                />
              </label>

              {/* Service 2: IFS Outstanding */}
              <label style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.75rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0',
                borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Truck style={{ width: '18px', height: '18px', color: '#f59e0b' }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Oracle IFS Outstanding Orders
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Table: `ifsapp.gsh_order_report@IFS_PROD_IFSAPP`
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={services.ifs_outstanding}
                  onChange={(e) => setServices({ ...services, ifs_outstanding: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--gsh-teal)', cursor: 'pointer' }}
                />
              </label>

              {/* Service 3: Axienta SFA */}
              <label style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.75rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0',
                borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Database style={{ width: '18px', height: '18px', color: '#10b981' }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Axienta SFA Secondary Sales
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      MS SQL: `SalesAndReturns_RPT (172.16.0.21)`
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={services.axienta}
                  onChange={(e) => setServices({ ...services, axienta: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--gsh-teal)', cursor: 'pointer' }}
                />
              </label>
            </div>
          </div>
        </div>

        {/* COLUMN 2: Live Runtime Status & Infrastructure */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Live Scheduler Runtime Status Card */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem' }}>
              <Activity style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
              <div>
                <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Background Daemon Runtime Status
                </h2>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Live status of the background auto-sync worker
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Worker Daemon State:</span>
                <span style={{
                  fontSize: '0.78rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '12px',
                  background: schedulerState?.is_running ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                  color: schedulerState?.is_running ? '#10b981' : '#ef4444'
                }}>
                  {schedulerState?.is_running ? '● Running (Active)' : '○ Stopped'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Last Auto-Sync Run:</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {schedulerState?.last_run || 'Never'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Last Execution Status:</span>
                <span style={{
                  fontSize: '0.78rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '12px',
                  background: schedulerState?.last_status === 'SUCCESS' ? 'rgba(16,185,129,0.12)' : (schedulerState?.last_status === 'IDLE' ? 'rgba(100,116,139,0.12)' : 'rgba(239,68,68,0.12)'),
                  color: schedulerState?.last_status === 'SUCCESS' ? '#10b981' : (schedulerState?.last_status === 'IDLE' ? '#64748b' : '#ef4444')
                }}>
                  {schedulerState?.last_status || 'IDLE'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Next Scheduled Trigger:</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0284c7' }}>
                  {schedulerState?.next_run || 'Calculating...'}
                </span>
              </div>

              {schedulerState?.last_summary && (
                <div style={{ padding: '0.65rem 0.85rem', background: 'rgba(0,168,150,0.06)', border: '1px solid rgba(0,168,150,0.2)', borderRadius: '8px', fontSize: '0.78rem', color: 'var(--gsh-teal)', fontWeight: 700 }}>
                  ℹ️ {schedulerState.last_summary}
                </div>
              )}
            </div>
          </div>

          {/* Infrastructure Topology Card */}
          <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 800 }}>
              <Server style={{ width: '17px', height: '17px', color: 'var(--gsh-red)' }} />
              Live Database Connectivity Details
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>MySQL Analytics DB:</span>
                <strong style={{ color: 'var(--text-main)' }}>localhost / gsh_dashboard (172.16.7.10)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Oracle IFS Prod DB:</span>
                <strong style={{ color: 'var(--text-main)' }}>172.16.7.45:1521/XE (Read-Only)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Axienta SFA MSSQL:</span>
                <strong style={{ color: 'var(--text-main)' }}>172.16.0.21:1433/GSH (Read-Only)</strong>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default SettingsPage;
