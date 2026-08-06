import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart,
  Bar, 
  Line,
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Truck, 
  DollarSign, 
  Calendar, 
  Store, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Download,
  PieChart as PieIcon,
  Package,
  Layers,
  Award
} from 'lucide-react';

const DistributorDetailsDashboard = () => {
  const [viewMode, setViewMode] = useState('compare'); // 'compare', 'primary', 'rd'
  const [selectedMonth, setSelectedMonth] = useState('July 2026');

  // Distributor Primary vs RD Sales Data (in LKR Millions)
  const distributorData = [
    { code: 'RD-01', name: 'Colombo Healthcare Dist', region: 'Western (Colombo)', primary: 48.5, rd: 46.8, variance: 1.7, percent: 96.5 },
    { code: 'RD-02', name: 'Gampaha Pharma Agency', region: 'Western (Gampaha)', primary: 32.0, rd: 31.5, variance: 0.5, percent: 98.4 },
    { code: 'RD-03', name: 'Central Hill Country Dist', region: 'Central (Kandy)', primary: 25.0, rd: 24.1, variance: 0.9, percent: 96.4 },
    { code: 'RD-04', name: 'Southern Med Logistics', region: 'Southern (Galle)', primary: 18.5, rd: 17.9, variance: 0.6, percent: 96.8 },
    { code: 'RD-05', name: 'Wayamba Agencies', region: 'North Western', primary: 12.0, rd: 11.2, variance: 0.8, percent: 93.3 },
    { code: 'RD-06', name: 'Jaffna Health Express', region: 'Northern', primary: 6.5, rd: 6.7, variance: -0.2, percent: 103.1 },
  ];

  // Donut Pie Distribution Data (RD Redistribution Share)
  const pieData = distributorData.map(d => ({
    name: d.name,
    value: d.rd
  }));

  const PIE_COLORS = ['#c8102e', '#00a896', '#f4c430', '#3b82f6', '#8b5cf6', '#059669'];

  // Daily Primary vs RD Movement Trajectory Data
  const dailyMovementData = [
    { day: 'Day 1', primary: 4.8, rd: 4.5 },
    { day: 'Day 5', target: 23.7, primary: 24.2, rd: 22.8 },
    { day: 'Day 10', target: 47.5, primary: 48.1, rd: 45.6 },
    { day: 'Day 15', target: 71.2, primary: 72.8, rd: 69.4 },
    { day: 'Day 20', target: 95.0, primary: 96.5, rd: 92.1 },
    { day: 'Day 25', target: 118.7, primary: 120.4, rd: 115.8 },
    { day: 'Day 30', target: 142.5, primary: 142.5, rd: 138.2 },
  ];

  // Totals
  const totalPrimary = distributorData.reduce((acc, curr) => acc + curr.primary, 0);
  const totalRD = distributorData.reduce((acc, curr) => acc + curr.rd, 0);
  const pipelineStock = totalPrimary - totalRD;
  const rdLiquidationRate = ((totalRD / totalPrimary) * 100).toFixed(1);

  const getStockHealthBadge = (percent) => {
    if (percent >= 100) {
      return (
        <span className="badge badge-success">
          <CheckCircle2 style={{ width: '13px', height: '13px' }} /> Fast Liquidation ({percent}%)
        </span>
      );
    } else if (percent >= 94) {
      return (
        <span className="badge badge-info">
          <Clock style={{ width: '13px', height: '13px' }} /> Optimal Stock ({percent}%)
        </span>
      );
    } else {
      return (
        <span className="badge badge-warning">
          <AlertCircle style={{ width: '13px', height: '13px' }} /> Stock Accumulation ({percent}%)
        </span>
      );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* 1. Header Banner Matching User Attached Image */}
      <div className="glass-card animate-fade-in" style={{
        padding: '1.5rem 2rem',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderLeft: '6px solid var(--gsh-red)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <Truck style={{ width: '28px', height: '28px', color: 'var(--gsh-red)' }} />
            <h1 style={{ 
              fontSize: '1.85rem', 
              fontWeight: 800, 
              color: '#1e293b', 
              letterSpacing: '-0.02em', 
              margin: 0,
              fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}>
              Distributor Details - Current Month
            </h1>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0, paddingLeft: '2.3rem' }}>
            George Steuart Health &bull; Primary Dispatches (Primers) VS Redistribution Sales (RD) Analytics
          </p>
        </div>

        {/* Controls & Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Month Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-primary)', padding: '0.5rem 0.875rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <Calendar style={{ width: '16px', height: '16px', color: 'var(--gsh-teal)' }} />
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.875rem', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
            >
              <option value="July 2026">July 2026 (Current)</option>
              <option value="June 2026">June 2026</option>
              <option value="May 2026">May 2026</option>
            </select>
          </div>

          {/* View Mode Toggle Button Group */}
          <div style={{ display: 'flex', background: 'var(--bg-primary)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <button 
              onClick={() => setViewMode('compare')}
              style={{
                padding: '0.4rem 0.875rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'compare' ? 'var(--gsh-red)' : 'transparent',
                color: viewMode === 'compare' ? '#ffffff' : 'var(--text-muted)',
                transition: 'all var(--transition-fast)'
              }}
            >
              Primary VS RD
            </button>
            <button 
              onClick={() => setViewMode('primary')}
              style={{
                padding: '0.4rem 0.875rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'primary' ? 'var(--gsh-red)' : 'transparent',
                color: viewMode === 'primary' ? '#ffffff' : 'var(--text-muted)',
                transition: 'all var(--transition-fast)'
              }}
            >
              Primary Only (Primers)
            </button>
            <button 
              onClick={() => setViewMode('rd')}
              style={{
                padding: '0.4rem 0.875rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'rd' ? 'var(--gsh-teal)' : 'transparent',
                color: viewMode === 'rd' ? '#ffffff' : 'var(--text-muted)',
                transition: 'all var(--transition-fast)'
              }}
            >
              RD Only (Redistribution)
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Card 1: Primary Sales (Primers) */}
        <div className="glass-card animate-fade-in" style={{ padding: '1.25rem 1.5rem', borderTop: '4px solid var(--gsh-red)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Primary Sales (Primers)</span>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'rgba(200, 16, 46, 0.1)', color: 'var(--gsh-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck style={{ width: '20px', height: '20px' }} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            LKR {totalPrimary.toFixed(1)}M
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', margin: '0.25rem 0 0 0' }}>GSH Warehouse Dispatches</p>
        </div>

        {/* Card 2: RD Sales (Redistribution) */}
        <div className="glass-card animate-fade-in" style={{ padding: '1.25rem 1.5rem', borderTop: '4px solid var(--gsh-teal)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>RD Sales (Redistribution)</span>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'rgba(0, 168, 150, 0.1)', color: 'var(--gsh-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store style={{ width: '20px', height: '20px' }} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            LKR {totalRD.toFixed(1)}M
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--gsh-teal)', margin: '0.25rem 0 0 0', fontWeight: 600 }}>Distributor Sales to Retail</p>
        </div>

        {/* Card 3: Pipeline Stock Variance */}
        <div className="glass-card animate-fade-in" style={{ padding: '1.25rem 1.5rem', borderTop: '4px solid var(--gsh-slate)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Distributor Stock In Trade</span>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'rgba(71, 85, 105, 0.1)', color: 'var(--gsh-slate)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package style={{ width: '20px', height: '20px' }} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            LKR {pipelineStock.toFixed(1)}M
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', margin: '0.25rem 0 0 0' }}>Primary - RD Stock Buffer</p>
        </div>

        {/* Card 4: RD Off-Take Liquidation Rate */}
        <div className="glass-card animate-fade-in" style={{ padding: '1.25rem 1.5rem', borderTop: '4px solid var(--gsh-gold)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>RD Off-take Efficiency</span>
            <Award style={{ width: '20px', height: '20px', color: 'var(--gsh-gold)' }} />
          </div>
          <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            {rdLiquidationRate}%
          </h3>
          <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: 'var(--radius-full)', marginTop: '0.75rem', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(rdLiquidationRate, 100)}%`, height: '100%', background: 'linear-gradient(90deg, var(--gsh-red), var(--gsh-teal))', borderRadius: 'var(--radius-full)' }} />
          </div>
        </div>
      </div>

      {/* 3. Main Graphical Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
        gap: '1.5rem'
      }}>

        {/* Chart 1: Primary VS RD Composed Chart across Distributors */}
        <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Regional Distributor Performance (Primary VS RD)
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Primary billing vs Redistribution sales per Regional Distributor (LKR Millions)
              </p>
            </div>
            <Truck style={{ width: '20px', height: '20px', color: 'var(--gsh-red)' }} />
          </div>

          <div style={{ width: '100%', height: 330 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={distributorData} margin={{ top: 15, right: 15, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="code" stroke="var(--text-subtle)" fontSize={11} tickLine={false} />
                <YAxis yAxisId="left" stroke="var(--text-subtle)" fontSize={11} tickLine={false} unit="M" />
                <YAxis yAxisId="right" orientation="right" stroke="#d97706" fontSize={11} tickLine={false} unit="%" domain={[85, 110]} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: 'var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-md)',
                    color: '#0f172a'
                  }}
                  formatter={(value, name) => [name === 'RD Liquidation %' ? `${value}%` : `LKR ${value}M`, name]}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                {(viewMode === 'compare' || viewMode === 'primary') && (
                  <Bar yAxisId="left" dataKey="primary" name="Primary Sales (Primers)" fill="#c8102e" radius={[4, 4, 0, 0]} barSize={24} />
                )}
                {(viewMode === 'compare' || viewMode === 'rd') && (
                  <Bar yAxisId="left" dataKey="rd" name="RD Sales (Redistribution)" fill="#00a896" radius={[4, 4, 0, 0]} barSize={24} />
                )}
                <Line yAxisId="right" type="monotone" dataKey="percent" name="RD Liquidation %" stroke="#d97706" strokeWidth={3} dot={{ r: 5, fill: '#f4c430' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: RD Sales Market Share Donut Chart */}
        <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                RD Redistribution Sales Share by Region
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Distribution of retail sales across regional distributors
              </p>
            </div>
            <PieIcon style={{ width: '20px', height: '20px', color: 'var(--gsh-teal)' }} />
          </div>

          <div style={{ width: '100%', height: 330, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={105}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="rgba(255,255,255,0.8)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: 'var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-md)',
                    color: '#0f172a'
                  }}
                  formatter={(value) => [`LKR ${value}M`, 'Actual RD Sales']}
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Row 2: Daily Cumulative Primary vs RD Trajectory Area Chart */}
      <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Primary Dispatches vs RD Redistribution Movement
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Daily accumulated Primary warehouse dispatches (Red) vs RD retail sales (Teal) (LKR Millions)
            </p>
          </div>
        </div>

        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyMovementData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="primaryAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c8102e" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#c8102e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="rdAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00a896" stopOpacity={0.45}/>
                  <stop offset="95%" stopColor="#00a896" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis dataKey="day" stroke="var(--text-subtle)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--text-subtle)" fontSize={11} tickLine={false} unit="M" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: 'var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-md)'
                }}
                formatter={(value) => [`LKR ${value}M`, '']}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Area type="monotone" dataKey="primary" stroke="#c8102e" strokeWidth={2.5} fillOpacity={1} fill="url(#primaryAreaGradient)" name="Primary Sales (Primers)" />
              <Area type="monotone" dataKey="rd" stroke="#00a896" strokeWidth={3} fillOpacity={1} fill="url(#rdAreaGradient)" name="RD Sales (Redistribution)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default DistributorDetailsDashboard;
