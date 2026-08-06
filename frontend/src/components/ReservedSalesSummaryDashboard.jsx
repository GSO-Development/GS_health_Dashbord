import React, { useState, useEffect } from 'react';
import { fetchReservedSalesSummary } from '../services/api';
import KpiCard from './KpiCard';
import { Award, DollarSign, Layers, CheckCircle } from 'lucide-react';

const ReservedSalesSummaryDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const result = await fetchReservedSalesSummary();
    if (result) {
      setData(result);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return 'LKR 0.00';
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 2 }).format(val);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(200, 16, 46, 0.05) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award style={{ color: '#8b5cf6' }} />
              Total GSH 1 Reserved Sales Summary (GSHD / GSH1N)
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
              Individual MySQL Database Table: <code style={{ background: 'var(--bg-hover)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>reserved_sales_summary</code>
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-grid grid-kpi">
        <KpiCard
          title="GRAND TOTAL PRODUCT CATEGORY"
          value={data ? formatCurrency(data.grand_total_product_category) : '...'}
          subtext="Total Category Reserved Volume"
          icon={DollarSign}
          color="#8b5cf6"
        />
        <KpiCard
          title="GRAND TOTAL BY SALES GROUP"
          value={data ? formatCurrency(data.grand_total_sales_group) : '...'}
          subtext="Summed Sales Group Reserved Volume"
          icon={Layers}
          color="#00a896"
        />
        <KpiCard
          title="SUMMARY RECORDS"
          value={data ? data.total_count : '...'}
          subtext="Category Aggregations"
          icon={CheckCircle}
          color="#c8102e"
        />
      </div>
    </div>
  );
};

export default ReservedSalesSummaryDashboard;
