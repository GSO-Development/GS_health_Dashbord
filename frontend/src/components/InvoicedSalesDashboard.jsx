import React, { useState, useEffect } from 'react';
import { fetchInvoicedSales } from '../services/api';
import KpiCard from './KpiCard';
import { ShoppingBag, DollarSign, Layers, Search, Filter } from 'lucide-react';

const InvoicedSalesDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    const result = await fetchInvoicedSales(search);
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
      <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(0, 168, 150, 0.05) 0%, rgba(200, 16, 46, 0.05) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingBag style={{ color: 'var(--gsh-teal)' }} />
              Divasa - Invoiced Sales (Group Wise)
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
              Individual MySQL Database Table: <code style={{ background: 'var(--bg-hover)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>invoiced_sales</code>
            </p>
          </div>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search catalog no, group..."
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
          title="TOTAL INVOICED SALES ROWS"
          value={data ? data.total_count : '...'}
          subtext="Divasa & GSHD Sales Records"
          icon={Layers}
          color="#00a896"
        />
        <KpiCard
          title="TOTAL NET CURRENCY AMOUNT"
          value={data ? formatCurrency(data.total_net_amount) : '...'}
          subtext="Net Sales Across Catalog Groups"
          icon={DollarSign}
          color="#c8102e"
        />
        <KpiCard
          title="CATALOG GROUPS COUNT"
          value={data && data.group_summary ? data.group_summary.length : '...'}
          subtext="Product Group Categories"
          icon={Filter}
          color="#8b5cf6"
        />
      </div>

      {/* Group Summary Breakdown Cards */}
      {data && data.group_summary && data.group_summary.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {data.group_summary.map((grp, idx) => (
            <div key={idx} className="glass-card" style={{ padding: '1rem', borderLeft: '4px solid var(--gsh-teal)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
                {grp.catalog_group || 'UNCATEGORIZED'}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: '0.25rem 0' }}>
                {formatCurrency(grp.group_total)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {grp.cnt} Sales Records
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvoicedSalesDashboard;
