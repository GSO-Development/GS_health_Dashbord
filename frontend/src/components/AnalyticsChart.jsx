import React from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

const AnalyticsChart = ({ data, title, subtitle }) => {
  const defaultData = [
    { month: 'Jan', records: 420, verified: 340 },
    { month: 'Feb', records: 680, verified: 590 },
    { month: 'Mar', records: 890, verified: 780 },
    { month: 'Apr', records: 1200, verified: 1050 },
    { month: 'May', records: 1020, verified: 960 },
    { month: 'Jun', records: 1540, verified: 1420 },
    { month: 'Jul', records: 1890, verified: 1750 }
  ];

  const chartData = data || defaultData;

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            {title || 'George Steuart Health Analytics'}
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
            {subtitle || 'Monthly record volume and verified transactions'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--gsh-red)' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#c8102e' }}></span> Total Records
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--gsh-teal)' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00a896' }}></span> Verified Health Logs
          </span>
        </div>
      </div>

      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorGshRed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#c8102e" stopOpacity={0.45}/>
                <stop offset="95%" stopColor="#c8102e" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorGshTeal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00a896" stopOpacity={0.45}/>
                <stop offset="95%" stopColor="#00a896" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
            <XAxis dataKey="month" stroke="var(--text-subtle)" fontSize={12} tickLine={false} />
            <YAxis stroke="var(--text-subtle)" fontSize={12} tickLine={false} />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-accent)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-main)',
                boxShadow: 'var(--shadow-md)'
              }}
            />
            <Area type="monotone" dataKey="records" stroke="#c8102e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorGshRed)" name="Total Entries" />
            <Area type="monotone" dataKey="verified" stroke="#00a896" strokeWidth={2.5} fillOpacity={1} fill="url(#colorGshTeal)" name="Verified Logs" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsChart;
