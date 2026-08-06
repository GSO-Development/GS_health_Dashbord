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
  Target, 
  Truck, 
  Store,
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Download,
  PieChart as PieIcon,
  Award,
  Layers
} from 'lucide-react';

const DistributorTargetVsActualDashboard = () => {
  const [activeCategory, setActiveCategory] = useState('primary'); // 'primary' or 'rd'
  const [viewMode, setViewMode] = useState('compare'); // 'compare', 'target', 'actual'
  const [selectedMonth, setSelectedMonth] = useState('July 2026');

  // 1. Primary Target vs Actual Data (Company to Distributor Billing)
  const primaryData = [
    { code: 'RD-01', name: 'Colombo Healthcare Dist', region: 'Western (Colombo)', target: 155.0, actual: 160.2, variance: 5.2, percent: 103.4 },
    { code: 'RD-02', name: 'Gampaha Pharma Agency', region: 'Western (Gampaha)', target: 102.0, actual: 105.8, variance: 3.8, percent: 103.7 },
    { code: 'RD-03', name: 'Central Hill Country Dist', region: 'Central (Kandy)', target: 82.0, actual: 83.5, variance: 1.5, percent: 101.8 },
    { code: 'RD-04', name: 'Southern Med Logistics', region: 'Southern (Galle)', target: 58.0, actual: 56.4, variance: -1.6, percent: 97.2 },
    { code: 'RD-05', name: 'Wayamba Agencies', region: 'North Western', target: 28.0, actual: 27.5, variance: -0.5, percent: 98.2 },
    { code: 'RD-06', name: 'Jaffna Health Express', region: 'Northern', target: 16.0, actual: 16.8, variance: 0.8, percent: 105.0 },
  ];

  // 2. RD Target vs Actual Data (Distributor Secondary Sales to Chemists)
  const rdData = [
    { code: 'RD-01', name: 'Colombo Healthcare Dist', region: 'Western (Colombo)', target: 148.0, actual: 152.4, variance: 4.4, percent: 103.0 },
    { code: 'RD-02', name: 'Gampaha Pharma Agency', region: 'Western (Gampaha)', target: 98.0, actual: 101.2, variance: 3.2, percent: 103.3 },
    { code: 'RD-03', name: 'Central Hill Country Dist', region: 'Central (Kandy)', target: 78.0, actual: 79.5, variance: 1.5, percent: 101.9 },
    { code: 'RD-04', name: 'Southern Med Logistics', region: 'Southern (Galle)', target: 55.0, actual: 53.8, variance: -1.2, percent: 97.8 },
    { code: 'RD-05', name: 'Wayamba Agencies', region: 'North Western', target: 26.0, actual: 25.4, variance: -0.6, percent: 97.7 },
    { code: 'RD-06', name: 'Jaffna Health Express', region: 'Northern', target: 15.0, actual: 15.6, variance: 0.6, percent: 104.0 },
  ];

  // Monthly Pipeline Trajectory Data (Primary vs RD Actual Sales)
  const monthlyPipelineData = [
    { month: 'Apr', primaryTarget: 410.0, primaryActual: 422.0, rdTarget: 390.0, rdActual: 401.0 },
    { month: 'May', primaryTarget: 420.0, primaryActual: 435.0, rdTarget: 400.0, rdActual: 412.0 },
    { month: 'Jun', primaryTarget: 430.0, primaryActual: 440.0, rdTarget: 410.0, rdActual: 420.0 },
    { month: 'Jul', primaryTarget: 441.0, primaryActual: 450.2, rdTarget: 420.0, rdActual: 427.9 },
  ];

  const currentDataset = activeCategory === 'primary' ? primaryData : rdData;
  const isPrimary = activeCategory === 'primary';

  // Donut Pie Share Data
  const pieData = currentDataset.map(d => ({
    name: d.name,
    value: d.actual
  }));

  const PIE_COLORS = ['#c8102e', '#00a896', '#f4c430', '#3b82f6', '#8b5cf6', '#059669'];

  // Totals
  const totalTarget = currentDataset.reduce((acc, curr) => acc + curr.target, 0);
  const totalActual = currentDataset.reduce((acc, curr) => acc + curr.actual, 0);
  const totalVariance = totalActual - totalTarget;
  const achievementRate = ((totalActual / totalTarget) * 100).toFixed(1);

  const getStatusBadge = (percent) => {
    if (percent >= 102) {
      return (
        <span className="badge badge-success">
          <CheckCircle2 style={{ width: '13px', height: '13px' }} /> Exceeded ({percent}%)
        </span>
      );
    } else if (percent >= 98) {
      return (
        <span className="badge badge-info">
          <Clock style={{ width: '13px', height: '13px' }} /> On Track ({percent}%)
        </span>
      );
    } else {
      return (
        <span className="badge badge-danger">
          <AlertCircle style={{ width: '13px', height: '13px' }} /> Below ({percent}%)
        </span>
      );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* 1. Header Title Banner Matching User Attached Image */}
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
            <Layers style={{ width: '28px', height: '28px', color: 'var(--gsh-red)' }} />
            <h1 style={{ 
              fontSize: '1.85rem', 
              fontWeight: 800, 
              color: '#1e293b', 
              letterSpacing: '-0.02em', 
              margin: 0,
              textTransform: 'uppercase',
              fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}>
              DISTRIBUTOR TARGET VS ACTUAL
            </h1>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0, paddingLeft: '2.3rem' }}>
            George Steuart Health &bull; Executive Target vs Actual Comparison (Primary Dispatches &amp; RD Secondary Sales)
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
              Target vs Actual
            </button>
            <button 
              onClick={() => setViewMode('target')}
              style={{
                padding: '0.4rem 0.875rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'target' ? 'var(--gsh-red)' : 'transparent',
                color: viewMode === 'target' ? '#ffffff' : 'var(--text-muted)',
                transition: 'all var(--transition-fast)'
              }}
            >
              Target Only
            </button>
            <button 
              onClick={() => setViewMode('actual')}
              style={{
                padding: '0.4rem 0.875rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'actual' ? 'var(--gsh-teal)' : 'transparent',
                color: viewMode === 'actual' ? '#ffffff' : 'var(--text-muted)',
                transition: 'all var(--transition-fast)'
              }}
            >
              Actual Only
            </button>
          </div>
        </div>
      </div>

      {/* 2. Primary 2 Category Switcher Banner (Main Request by User) */}
      <div className="glass-card animate-fade-in" style={{
        padding: '0.75rem 1rem',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        border: '1px solid var(--border-color)'
      }}>
        <button 
          onClick={() => setActiveCategory('primary')}
          style={{
            flex: 1,
            maxWidth: '380px',
            padding: '0.75rem 1.5rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: isPrimary ? 'var(--gsh-red)' : 'var(--bg-primary)',
            color: isPrimary ? '#ffffff' : 'var(--text-main)',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            boxShadow: isPrimary ? '0 4px 12px rgba(200, 16, 46, 0.3)' : 'none',
            transition: 'all var(--transition-fast)'
          }}
        >
          <Truck style={{ width: '20px', height: '20px' }} />
          1. Primary Target vs Actual
        </button>

        <button 
          onClick={() => setActiveCategory('rd')}
          style={{
            flex: 1,
            maxWidth: '380px',
            padding: '0.75rem 1.5rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: !isPrimary ? 'var(--gsh-teal)' : 'var(--bg-primary)',
            color: !isPrimary ? '#ffffff' : 'var(--text-main)',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            boxShadow: !isPrimary ? '0 4px 12px rgba(0, 168, 150, 0.3)' : 'none',
            transition: 'all var(--transition-fast)'
          }}
        >
          <Store style={{ width: '20px', height: '20px' }} />
          2. RD Target vs Actual
        </button>
      </div>

      {/* 3. Top Summary KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Card 1: Target Value */}
        <div className="glass-card animate-fade-in" style={{ padding: '1.25rem 1.5rem', borderTop: '4px solid var(--gsh-red)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              {isPrimary ? 'Primary Target' : 'RD Target'}
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'rgba(200, 16, 46, 0.1)', color: 'var(--gsh-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Target style={{ width: '20px', height: '20px' }} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            LKR {totalTarget.toFixed(1)}M
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', margin: '0.25rem 0 0 0' }}>
            {isPrimary ? 'Warehouse Billing Target' : 'Redistribution Sales Target'}
          </p>
        </div>

        {/* Card 2: Actual Value */}
        <div className="glass-card animate-fade-in" style={{ padding: '1.25rem 1.5rem', borderTop: '4px solid var(--gsh-teal)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              {isPrimary ? 'Primary Actual Sales' : 'RD Actual Sales'}
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'rgba(0, 168, 150, 0.1)', color: 'var(--gsh-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isPrimary ? <Truck style={{ width: '20px', height: '20px' }} /> : <Store style={{ width: '20px', height: '20px' }} />}
            </div>
          </div>
          <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            LKR {totalActual.toFixed(1)}M
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--gsh-teal)', margin: '0.25rem 0 0 0', fontWeight: 600 }}>Achieved Revenue</p>
        </div>

        {/* Card 3: Variance */}
        <div className="glass-card animate-fade-in" style={{ padding: '1.25rem 1.5rem', borderTop: `4px solid ${totalVariance >= 0 ? 'var(--success)' : 'var(--danger)'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Variance</span>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: totalVariance >= 0 ? 'var(--success-bg)' : 'var(--danger-bg)', color: totalVariance >= 0 ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {totalVariance >= 0 ? <TrendingUp style={{ width: '20px', height: '20px' }} /> : <TrendingDown style={{ width: '20px', height: '20px' }} />}
            </div>
          </div>
          <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: totalVariance >= 0 ? 'var(--success)' : 'var(--danger)', margin: 0 }}>
            {totalVariance >= 0 ? `+LKR ${totalVariance.toFixed(1)}M` : `-LKR ${Math.abs(totalVariance).toFixed(1)}M`}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', margin: '0.25rem 0 0 0' }}>
            {((totalVariance / totalTarget) * 100).toFixed(1)}% vs Target
          </p>
        </div>

        {/* Card 4: Achievement Rate */}
        <div className="glass-card animate-fade-in" style={{ padding: '1.25rem 1.5rem', borderTop: '4px solid var(--gsh-gold)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Achievement Rate</span>
            <Award style={{ width: '20px', height: '20px', color: 'var(--gsh-gold)' }} />
          </div>
          <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            {achievementRate}%
          </h3>
          <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: 'var(--radius-full)', marginTop: '0.75rem', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(achievementRate, 100)}%`, height: '100%', background: 'linear-gradient(90deg, var(--gsh-red), var(--gsh-teal))', borderRadius: 'var(--radius-full)' }} />
          </div>
        </div>
      </div>

      {/* 4. Main Graphical Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
        gap: '1.5rem'
      }}>

        {/* Chart 1: Distributor Target vs Actual Composed Chart */}
        <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                {isPrimary ? 'Primary Dispatches Target vs Actual' : 'RD Redistribution Target vs Actual'}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Target (Red) vs Actual Sales (Teal) per regional distributor for {selectedMonth}
              </p>
            </div>
          </div>

          <div style={{ width: '100%', height: 330 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={currentDataset} margin={{ top: 15, right: 15, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="code" stroke="var(--text-subtle)" fontSize={11} tickLine={false} />
                <YAxis yAxisId="left" stroke="var(--text-subtle)" fontSize={11} tickLine={false} unit="M" />
                <YAxis yAxisId="right" orientation="right" stroke="#d97706" fontSize={11} tickLine={false} unit="%" domain={[90, 110]} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: 'var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-md)',
                    color: '#0f172a'
                  }}
                  formatter={(value, name) => [name === 'Achievement %' ? `${value}%` : `LKR ${value}M`, name]}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                {(viewMode === 'compare' || viewMode === 'target') && (
                  <Bar yAxisId="left" dataKey="target" name={isPrimary ? 'Primary Target' : 'RD Target'} fill="#c8102e" radius={[4, 4, 0, 0]} barSize={24} />
                )}
                {(viewMode === 'compare' || viewMode === 'actual') && (
                  <Bar yAxisId="left" dataKey="actual" name={isPrimary ? 'Primary Actual' : 'RD Actual'} fill="#00a896" radius={[4, 4, 0, 0]} barSize={24} />
                )}
                <Line yAxisId="right" type="monotone" dataKey="percent" name="Achievement %" stroke="#d97706" strokeWidth={3} dot={{ r: 5, fill: '#f4c430' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Revenue Share Donut Chart */}
        <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                {isPrimary ? 'Primary Billing Share Donut' : 'RD Redistribution Share Donut'}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Regional distributor contribution to total actual sales
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
                  formatter={(value) => [`LKR ${value}M`, 'Actual Sales']}
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Row 2: Primary vs RD Sales Comparison Area Chart */}
      <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Primary Dispatches vs RD Redistribution Pipeline Comparison
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Primary warehouse dispatches (Red) vs secondary RD sales (Teal) (LKR Millions)
            </p>
          </div>
        </div>

        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyPipelineData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c8102e" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#c8102e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="rdGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00a896" stopOpacity={0.45}/>
                  <stop offset="95%" stopColor="#00a896" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--text-subtle)" fontSize={11} tickLine={false} />
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
              <Area type="monotone" dataKey="primaryActual" stroke="#c8102e" strokeWidth={2.5} fillOpacity={1} fill="url(#primaryGradient)" name="Primary Actual Billing" />
              <Area type="monotone" dataKey="rdActual" stroke="#00a896" strokeWidth={3} fillOpacity={1} fill="url(#rdGradient)" name="RD Actual Redistribution" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default DistributorTargetVsActualDashboard;
