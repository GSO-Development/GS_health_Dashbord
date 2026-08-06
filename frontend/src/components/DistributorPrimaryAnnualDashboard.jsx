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
  DollarSign, 
  Calendar, 
  Truck, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Download,
  PieChart as PieIcon,
  Award,
  PackageCheck
} from 'lucide-react';

const DistributorPrimaryAnnualDashboard = () => {
  const [viewMode, setViewMode] = useState('compare'); // 'compare', 'budget', 'actual'
  const [selectedFY, setSelectedFY] = useState('FY 2026/27');

  // Distributor Primary vs Annual Budget Data (in LKR Millions)
  const distributorPrimaryData = [
    { code: 'RD-01', name: 'Colombo Healthcare Dist', region: 'Western (Colombo)', annualBudget: 620.0, ytdTarget: 361.6, primaryActual: 372.5, variance: 10.9, percent: 103.0, annualProgress: 60.1 },
    { code: 'RD-02', name: 'Gampaha Pharma Agency', region: 'Western (Gampaha)', annualBudget: 400.0, ytdTarget: 233.3, rdActual: 239.5, primaryActual: 241.2, variance: 7.9, percent: 103.4, annualProgress: 60.3 },
    { code: 'RD-03', name: 'Central Hill Country Dist', region: 'Central (Kandy)', annualBudget: 320.0, ytdTarget: 186.6, primaryActual: 189.8, variance: 3.2, percent: 101.7, annualProgress: 59.3 },
    { code: 'RD-04', name: 'Southern Med Logistics', region: 'Southern (Galle)', annualBudget: 230.0, ytdTarget: 134.1, primaryActual: 131.0, variance: -3.1, percent: 97.7, annualProgress: 57.0 },
    { code: 'RD-05', name: 'Wayamba Agencies', region: 'North Western', annualBudget: 115.0, ytdTarget: 67.0, primaryActual: 65.8, variance: -1.2, percent: 98.2, annualProgress: 57.2 },
    { code: 'RD-06', name: 'Jaffna Health Express', region: 'Northern', annualBudget: 65.0, ytdTarget: 37.9, primaryActual: 39.2, variance: 1.3, percent: 103.4, annualProgress: 60.3 },
  ];

  // Donut Pie Share Data (Primary Sales Contribution)
  const pieData = distributorPrimaryData.map(d => ({
    name: d.name,
    value: d.primaryActual
  }));

  const PIE_COLORS = ['#c8102e', '#00a896', '#f4c430', '#3b82f6', '#8b5cf6', '#059669'];

  // Monthly Cumulative Primary Trajectory Data for FY (April to March)
  const monthlyPrimaryTrajectoryData = [
    { month: 'Apr', annualBudgetPath: 145.8, primaryActual: 151.0 },
    { month: 'May', annualBudgetPath: 291.6, primaryActual: 302.5 },
    { month: 'Jun', annualBudgetPath: 437.5, primaryActual: 452.8 },
    { month: 'Jul', annualBudgetPath: 583.3, primaryActual: 603.8 },
    { month: 'Aug (F)', annualBudgetPath: 729.1, primaryActual: 752.0 },
    { month: 'Sep (F)', annualBudgetPath: 875.0, primaryActual: 902.5 },
    { month: 'Oct (F)', annualBudgetPath: 1020.8, primaryActual: 1050.0 },
    { month: 'Nov (F)', annualBudgetPath: 1166.6, primaryActual: 1200.5 },
    { month: 'Dec (F)', annualBudgetPath: 1312.5, primaryActual: 1350.0 },
    { month: 'Jan (F)', annualBudgetPath: 1458.3, primaryActual: 1498.0 },
    { month: 'Feb (F)', annualBudgetPath: 1604.1, primaryActual: 1645.5 },
    { month: 'Mar (F)', annualBudgetPath: 1750.0, primaryActual: 1792.0 },
  ];

  // Totals
  const totalAnnualBudget = distributorPrimaryData.reduce((acc, curr) => acc + curr.annualBudget, 0);
  const totalYtdTarget = distributorPrimaryData.reduce((acc, curr) => acc + curr.ytdTarget, 0);
  const totalPrimaryActual = distributorPrimaryData.reduce((acc, curr) => acc + curr.primaryActual, 0);
  const totalVariance = totalPrimaryActual - totalYtdTarget;
  const annualCompletionRate = ((totalPrimaryActual / totalAnnualBudget) * 100).toFixed(1);
  const ytdAchievementRate = ((totalPrimaryActual / totalYtdTarget) * 100).toFixed(1);

  const getStatusBadge = (percent) => {
    if (percent >= 101) {
      return (
        <span className="badge badge-success">
          <CheckCircle2 style={{ width: '13px', height: '13px' }} /> Exceeded ({percent}%)
        </span>
      );
    } else if (percent >= 97) {
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
              Distributor Primary vs Annual Budget
            </h1>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0, paddingLeft: '2.3rem' }}>
            George Steuart Health &bull; Central Warehouse Billing (Primary) Actual VS Annual Budget Analysis
          </p>
        </div>

        {/* Controls & Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* FY Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-primary)', padding: '0.5rem 0.875rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <Calendar style={{ width: '16px', height: '16px', color: 'var(--gsh-teal)' }} />
            <select 
              value={selectedFY} 
              onChange={(e) => setSelectedFY(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.875rem', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
            >
              <option value="FY 2026/27">FY 2026/27 (Current)</option>
              <option value="FY 2025/26">FY 2025/26</option>
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
              Actual VS Budgeted
            </button>
            <button 
              onClick={() => setViewMode('budget')}
              style={{
                padding: '0.4rem 0.875rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'budget' ? 'var(--gsh-red)' : 'transparent',
                color: viewMode === 'budget' ? '#ffffff' : 'var(--text-muted)',
                transition: 'all var(--transition-fast)'
              }}
            >
              Annual Budgeted Only
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
              Primary Actual Only
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
        {/* Card 1: Full Year Primary Budget */}
        <div className="glass-card animate-fade-in" style={{ padding: '1.25rem 1.5rem', borderTop: '4px solid var(--gsh-red)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Full Year Primary Budget</span>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'rgba(200, 16, 46, 0.1)', color: 'var(--gsh-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Target style={{ width: '20px', height: '20px' }} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            LKR {totalAnnualBudget.toFixed(1)}M
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', margin: '0.25rem 0 0 0' }}>Approved Primary Annual Target</p>
        </div>

        {/* Card 2: YTD Primary Actual Sales */}
        <div className="glass-card animate-fade-in" style={{ padding: '1.25rem 1.5rem', borderTop: '4px solid var(--gsh-teal)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>YTD Primary Actual Sales</span>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'rgba(0, 168, 150, 0.1)', color: 'var(--gsh-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PackageCheck style={{ width: '20px', height: '20px' }} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            LKR {totalPrimaryActual.toFixed(1)}M
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--gsh-teal)', margin: '0.25rem 0 0 0', fontWeight: 600 }}>Achieved Warehouse Billing</p>
        </div>

        {/* Card 3: YTD Primary Variance */}
        <div className="glass-card animate-fade-in" style={{ padding: '1.25rem 1.5rem', borderTop: `4px solid ${totalVariance >= 0 ? 'var(--success)' : 'var(--danger)'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>YTD Primary Variance</span>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: totalVariance >= 0 ? 'var(--success-bg)' : 'var(--danger-bg)', color: totalVariance >= 0 ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {totalVariance >= 0 ? <TrendingUp style={{ width: '20px', height: '20px' }} /> : <TrendingDown style={{ width: '20px', height: '20px' }} />}
            </div>
          </div>
          <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: totalVariance >= 0 ? 'var(--success)' : 'var(--danger)', margin: 0 }}>
            {totalVariance >= 0 ? `+LKR ${totalVariance.toFixed(1)}M` : `-LKR ${Math.abs(totalVariance).toFixed(1)}M`}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', margin: '0.25rem 0 0 0' }}>
            {ytdAchievementRate}% vs Pro-Rata Target
          </p>
        </div>

        {/* Card 4: Annual Primary Target Completion */}
        <div className="glass-card animate-fade-in" style={{ padding: '1.25rem 1.5rem', borderTop: '4px solid var(--gsh-gold)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Annual Primary Progress</span>
            <Award style={{ width: '20px', height: '20px', color: 'var(--gsh-gold)' }} />
          </div>
          <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            {annualCompletionRate}%
          </h3>
          <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: 'var(--radius-full)', marginTop: '0.75rem', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(annualCompletionRate, 100)}%`, height: '100%', background: 'linear-gradient(90deg, var(--gsh-red), var(--gsh-gold), var(--gsh-teal))', borderRadius: 'var(--radius-full)' }} />
          </div>
        </div>
      </div>

      {/* 3. Main Graphical Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
        gap: '1.5rem'
      }}>

        {/* Chart 1: Distributor Primary vs YTD Pro-Rata Target Composed Chart */}
        <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Distributor Primary Sales vs Pro-Rata Target
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Pro-rata target (Red) vs actual Primary billing (Teal) per regional distributor (LKR Millions)
              </p>
            </div>
            <Truck style={{ width: '20px', height: '20px', color: 'var(--gsh-red)' }} />
          </div>

          <div style={{ width: '100%', height: 330 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={distributorPrimaryData} margin={{ top: 15, right: 15, left: -10, bottom: 10 }}>
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
                  formatter={(value, name) => [name === 'YTD Target %' ? `${value}%` : `LKR ${value}M`, name]}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                {(viewMode === 'compare' || viewMode === 'budget') && (
                  <Bar yAxisId="left" dataKey="ytdTarget" name="Pro-Rata YTD Target" fill="#c8102e" radius={[4, 4, 0, 0]} barSize={24} />
                )}
                {(viewMode === 'compare' || viewMode === 'actual') && (
                  <Bar yAxisId="left" dataKey="primaryActual" name="YTD Primary Actual Sales" fill="#00a896" radius={[4, 4, 0, 0]} barSize={24} />
                )}
                <Line yAxisId="right" type="monotone" dataKey="percent" name="YTD Target %" stroke="#d97706" strokeWidth={3} dot={{ r: 5, fill: '#f4c430' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Distributor Primary Sales Distribution Donut Chart */}
        <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Primary Revenue Share Distribution
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Regional distributor share of total central warehouse dispatches
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
                  formatter={(value) => [`LKR ${value}M`, 'YTD Primary Sales']}
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Row 2: Cumulative Primary Sales vs Annual Budget Trajectory */}
      <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Distributor Primary Sales vs Annual Budget Trajectory
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Full year linear budget path (Red) vs actual cumulative Primary sales movement (Teal) (LKR Millions)
            </p>
          </div>
        </div>

        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyPrimaryTrajectoryData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="primaryBudgetGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c8102e" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#c8102e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="primaryActualGradient" x1="0" y1="0" x2="0" y2="1">
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
              <Area type="monotone" dataKey="annualBudgetPath" stroke="#c8102e" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#primaryBudgetGradient)" name="Annual Primary Budget Path" />
              <Area type="monotone" dataKey="primaryActual" stroke="#00a896" strokeWidth={3} fillOpacity={1} fill="url(#primaryActualGradient)" name="Actual Cumulative Primary Sales" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default DistributorPrimaryAnnualDashboard;
