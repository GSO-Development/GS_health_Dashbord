import React, { useState, useEffect } from 'react';
import { fetchCustomerInvoiceLines } from '../services/api';
import KpiCard from './KpiCard';
import { FileText, DollarSign, Search, Hash, Building } from 'lucide-react';

const CustomerInvoiceLinesDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const loadData = async () => {
    setLoading(true);
    const result = await fetchCustomerInvoiceLines(page, limit, search);
    if (result) {
      setData(result);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [page, limit, search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return 'LKR 0.00';
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 2 }).format(val);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(200, 16, 46, 0.05) 0%, rgba(0, 168, 150, 0.05) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText style={{ color: 'var(--gsh-red)' }} />
              MTL Sales - Customer Invoice Lines
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
              Individual MySQL Database Table: <code style={{ background: 'var(--bg-hover)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>customer_invoice_lines</code>
            </p>
          </div>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search Order, Identity..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
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
            <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Search</button>
          </form>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-grid grid-kpi">
        <KpiCard
          title="TOTAL INVOICE RECORDS"
          value={data ? data.total_count.toLocaleString() : '...'}
          subtext="MySQL Customer Invoice Lines"
          icon={Hash}
          color="#c8102e"
        />
        <KpiCard
          title="TOTAL NET SALES AMOUNT"
          value={data ? formatCurrency(data.total_net_amount) : '...'}
          subtext="Cumulative Net Currency Sales"
          icon={DollarSign}
          color="#00a896"
        />
        <KpiCard
          title="TOTAL PAGES"
          value={data ? `${data.total_pages}` : '...'}
          subtext="Available Data Batches"
          icon={Building}
          color="#3b82f6"
        />
      </div>
    </div>
  );
};

export default CustomerInvoiceLinesDashboard;
