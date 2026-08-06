import React, { useState, useEffect } from 'react';
import { fetchOutstandingOrders } from '../services/api';
import KpiCard from './KpiCard';
import { Truck, DollarSign, Users, Search, Package } from 'lucide-react';

const OutstandingOrdersDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    const result = await fetchOutstandingOrders(search);
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
              Distributor Reserved Sales - Outstanding Orders
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
              Individual MySQL Database Table: <code style={{ background: 'var(--bg-hover)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>outstanding_orders</code>
            </p>
          </div>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search customer, catalog..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                outline: 'none',
                fontSize: '0.875rem',
                width: '240px'
              }}
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-grid grid-kpi">
        <KpiCard
          title="TOTAL OUTSTANDING ORDERS"
          value={data ? data.total_count : '...'}
          subtext="Reserved Distributor Sales"
          icon={Package}
          color="#3b82f6"
        />
        <KpiCard
          title="TOTAL BASE AMOUNT"
          value={data ? formatCurrency(data.total_baseamt) : '...'}
          subtext="Sum of Order Base Amounts"
          icon={DollarSign}
          color="#10b981"
        />
        <KpiCard
          title="DISTRIBUTOR ACCOUNTS"
          value={data && data.rows ? new Set(data.rows.map(r => r.customer_no)).size : '...'}
          subtext="Unique Active Customers"
          icon={Users}
          color="#8b5cf6"
        />
      </div>

      {/* Group Breakdown */}
      {data && data.group_summary && data.group_summary.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {data.group_summary.map((grp, idx) => (
            <div key={idx} className="glass-card" style={{ padding: '1rem', borderLeft: '4px solid #3b82f6' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
                {grp.catalog_group || 'OTHER'}
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: '0.25rem 0' }}>
                {formatCurrency(grp.group_baseamt)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {grp.cnt} Outstanding Item(s)
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OutstandingOrdersDashboard;
