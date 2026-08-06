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
  Store, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Download,
  PieChart as PieIcon,
  Award,
  BarChart2
} from 'lucide-react';

const DistributorRdAnnualDashboard = () => {
  const [viewMode, setViewMode] = useState('compare'); // 'compare', 'budget', 'actual'
  const [selectedFY, setSelectedFY] = useState('FY 2026/27');

  // Distributor RD vs Annual Budget Data (in LKR Millions)
  const distributorRdData = [
    { code: 'RD-01', name: 'Colombo Healthcare Dist', region: 'Western (Colombo)', annualBudget: 580.0, ytdTarget: 338.3, rdActual: 345.2, variance: 6.9, percent: 102.0, annualProgress: 59.5 },
    { code: 'RD-02', name: 'Gampaha Pharma Agency', region: 'Western (Gampaha)', annualBudget: 380.0, ytdTarget: 221.6, rdActual: 228.4, variance: 6.8, percent: 103.1, annualProgress: 60.1 },
    { code: 'RD-03', name: 'Central Hill Country Dist', region: 'Central (Kandy)', annualBudget: 300.0, ytdTarget: 175.0, rdActual: 178.6, variance: 3.6, percent: 102.1, annualProgress: 59.5 },
    { code: 'RD-04', name: 'Southern Med Logistics', region: 'Southern (Galle)', annualBudget: 220.0, ytdTarget: 128.3, rdActual: 125.1, variance: -3.2, percent: 97.5, annualProgress: 56.9 },
    { code: 'RD-05', name: 'Wayamba Agencies', region: 'North Western', annualBudget: 110.0, ytdTarget: 64.1, rdActual: 62.8, variance: -1.3, percent: 98.0, annualProgress: 57.1 },
    { code: 'RD-06', name: 'Jaffna Health Express', region: 'Northern', annualBudget: 60.0, ytdTarget: 35.0, rdActual: 36.3, variance: 1.3, percent: 103.7, annualProgress: 60.5 },
  ];

  // Donut Pie Share Data (RD Sales Contribution)
  const pieData = distributorRdData.map(d => ({
    name: d.name,
    value: d.rdActual
  }));

  const PIE_COLORS = ['#c8102e', '#00a896', '#f4c430', '#3b82f6', '#8b5cf6', '#059669'];

  // Monthly Cumulative RD Trajectory Data for FY (April to March)
  const monthlyRdTrajectoryData = [
    { month: 'Apr', annualBudgetPath: 137.5, rdActual: 142.0 },
    { month: 'May', annualBudgetPath: 275.0, rdActual: 284.5 },
    { month: 'Jun', annualBudgetPath: 412.5, rdActual: 425.2 },
    { month: 'Jul', annualBudgetPath: 550.0, rdActual: 568.4 },
    { month: 'Aug (F)', annualBudgetPath: 687.5, rdActual: 708.0 },
    { month: 'Sep (F)', annualBudgetPath: 825.0, rdActual: 849.5 },
    { month: 'Oct (F)', annualBudgetPath: 962.5, rdActual: 988.0 },
    { month: 'Nov (F)', annualBudgetPath: 1100.0, rdActual: 1128.5 },
    { month: 'Dec (F)', annualBudgetPath: 1237.5, rdActual: 1269.0 },
    { month: 'Jan (F)', annualBudgetPath: 1375.0, rdActual: 1409.0 },
    { month: 'Feb (F)', annualBudgetPath: 1512.5, rdActual: 1548.5 },
    { month: 'Mar (F)', annualBudgetPath: 1650.0, rdActual: 1688.0 },
  ];

  // Totals
  const totalAnnualBudget = distributorRdData.reduce((acc, curr) => acc + curr.annualBudget, 0);
  const totalYtdTarget = distributorRdData.reduce((acc, curr) => acc + curr.ytdTarget, 0);
  const totalRdActual = distributorRdData.reduce((acc, curr) => acc + curr.rdActual, 0);
  const totalVariance = totalRdActual - totalYtdTarget;
  const annualCompletionRate = ((totalRdActual / totalAnnualBudget) * 100).toFixed(1);
  const ytdAchievementRate = ((totalRdActual / totalYtdTarget) * 100).toFixed(1);

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
        borderLeft: '6px solid var(--gsh-teal)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <BarChart2 style={{ width: '28px', height: '28px', color: 'var(--gsh-teal)' }} />
            <h1 style={{ 
              fontSize: '1.85rem', 
              fontWeight: 800, 
              color: '#1e293b', 
              letterSpacing: '-0.02em', 
              margin: 0,
              fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}>
              Distributor RD vs Annual Budget
            </h1>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0, paddingLeft: '2.3rem' }}>
            George Steuart Health &bull; Regional Distributor Redistribution (RD) Actual VS Annual Budget Analysis
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
                background: viewMode === 'compare' ? 'var(--gsh-teal)' : 'transparent',
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
              RD Actual Only
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
        {/* Card 1: Full Year RD Budget */}
        <div className="glass-card animate-fade-in" style={{ padding: '1.25rem 1.5rem', borderTop: '4px solid var(--gsh-red)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Full Year RD Budget</span>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'rgba(200, 16, 46, 0.1)', color: 'var(--gsh-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Target style={{ width: '20px', height: '20px' }} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            LKR {totalAnnualBudget.toFixed(1)}M
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', margin: '0.25rem 0 0 0' }}>Approved Annual RD Target</p>
        </div>

        {/* Card 2: YTD RD Actual Sales */}
        <div className="glass-card animate-fade-in" style={{ padding: '1.25rem 1.5rem', borderTop: '4px solid var(--gsh-teal)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>YTD RD Actual Sales</span>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'rgba(0, 168, 150, 0.1)', color: 'var(--gsh-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store style={{ width: '20px', height: '20px' }} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            LKR {totalRdActual.toFixed(1)}M
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--gsh-teal)', margin: '0.25rem 0 0 0', fontWeight: 600 }}>Achieved Secondary Sales</p>
        </div>

        {/* Card 3: YTD RD Variance */}
        <div className="glass-card animate-fade-in" style={{ padding: '1.25rem 1.5rem', borderTop: `4px solid ${totalVariance >= 0 ? 'var(--success)' : 'var(--danger)'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>YTD RD Variance</span>
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

        {/* Card 4: Annual RD Progress */}
        <div className="glass-card animate-fade-in" style={{ padding: '1.25rem 1.5rem', borderTop: '4px solid var(--gsh-gold)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Annual RD Target Progress</span>
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

        {/* Chart 1: Distributor RD vs YTD Pro-Rata Target Composed Chart */}
        <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Distributor RD Sales vs Pro-Rata Target
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Pro-rata target (Red) vs actual RD sales (Teal) per regional distributor (LKR Millions)
              </p>
            </div>
            <Store style={{ width: '20px', height: '20px', color: 'var(--gsh-teal)' }} />
          </div>

          <div style={{ width: '100%', height: 330 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={distributorRdData} margin={{ top: 15, right: 15, left: -10, bottom: 10 }}>
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
                  <Bar yAxisId="left" dataKey="rdActual" name="YTD RD Actual Sales" fill="#00a896" radius={[4, 4, 0, 0]} barSize={24} />
                )}
                <Line yAxisId="right" type="monotone" dataKey="percent" name="YTD Target %" stroke="#d97706" strokeWidth={3} dot={{ r: 5, fill: '#f4c430' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Distributor RD Sales Distribution Donut Chart */}
        <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                RD Revenue Contribution Share
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Regional distributor contribution to total annual RD actuals
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
                  formatter={(value) => [`LKR ${value}M`, 'YTD RD Sales']}
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Row 2: Cumulative RD Sales vs Annual Budget Trajectory */}
      <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Distributor RD Sales vs Annual Budget Trajectory
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Full year linear budget path (Red) vs actual cumulative RD sales movement (Teal) (LKR Millions)
            </p>
          </div>
        </div>

        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyRdTrajectoryData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="annualBudgetGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c8102e" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#c8102e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="rdActualGradient" x1="0" y1="0" x2="0" y2="1">
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
              <Area type="monotone" dataKey="annualBudgetPath" stroke="#c8102e" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#annualBudgetGradient)" name="Annual Budget Path" />
              <Area type="monotone" dataKey="rdActual" stroke="#00a896" strokeWidth={3} fillOpacity={1} fill="url(#rdActualGradient)" name="Actual Cumulative RD Sales" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default DistributorRdAnnualDashboard;
