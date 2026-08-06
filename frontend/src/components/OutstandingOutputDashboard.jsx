import React, { useState, useEffect } from 'react';
import { fetchOutstandingOutput } from '../services/api';
import KpiCard from './KpiCard';
import { Truck, DollarSign, Search, Package, Users, Building } from 'lucide-react';

const OutstandingOutputDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    const result = await fetchOutstandingOutput(search);
    if (result) {
      setData(result);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return 'LKR 0.00';
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 2 }).format(val);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(0, 168, 150, 0.05) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Truck style={{ color: '#3b82f6' }} />
              Outstanding Output Report
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
              Active MySQL Database Table: <code style={{ background: 'var(--bg-hover)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>outstanding_output</code> (170 Records)
            </p>
          </div>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search Customer, Catalog, Order..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                outline: 'none',
                fontSize: '0.875rem',
                width: '260px'
              }}
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-grid grid-kpi">
        <KpiCard
          title="TOTAL OUTSTANDING ITEMS"
          value={data ? data.total_count : '...'}
          subtext="MySQL outstanding_output Table"
          icon={Package}
          color="#3b82f6"
        />
        <KpiCard
          title="TOTAL BACKLOG VALUE"
          value={data ? formatCurrency(data.total_backlog_value) : '...'}
          subtext="Sum of Outstanding Backlog"
          icon={DollarSign}
          color="#10b981"
        />
        <KpiCard
          title="DISTRIBUTOR ACCOUNTS"
          value={data && data.rows ? new Set(data.rows.map(r => r.customer_no)).size : '...'}
          subtext="Unique Customers"
          icon={Users}
          color="#8b5cf6"
        />
      </div>

      {/* Metrics Breakdown */}
      <div className="glass-card animate-fade-in" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Outstanding Summary Metrics</h3>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading outstanding_output data...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Filtered Item Count</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>{data ? data.total_count : 0}</div>
            </div>
            <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Backlog Currency</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981', marginTop: '0.25rem' }}>{data ? formatCurrency(data.total_backlog_value) : 'LKR 0.00'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutstandingOutputDashboard;
