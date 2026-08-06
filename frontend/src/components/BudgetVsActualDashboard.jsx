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
  BarChart2, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Download,
  PieChart as PieIcon,
  Activity,
  Layers,
  Award
} from 'lucide-react';

const BudgetVsActualDashboard = () => {
  const [viewMode, setViewMode] = useState('compare'); // 'compare', 'budget', 'actual'
  const [selectedMonth, setSelectedMonth] = useState('July 2026');

  // Division-wise Budget vs Actual Data
  const divisionData = [
    { division: 'Pharmaceuticals', budget: 85.0, actual: 88.5, variance: 3.5, percent: 104.1 },
    { division: 'Medical Devices', budget: 62.0, actual: 58.2, variance: -3.8, percent: 93.8 },
    { division: 'Consumer Health', budget: 45.0, actual: 47.1, variance: 2.1, percent: 104.6 },
    { division: 'Diagnostics', budget: 35.0, actual: 31.8, variance: -3.2, percent: 90.8 },
    { division: 'Surgical Care', budget: 23.0, actual: 22.9, variance: -0.1, percent: 99.5 },
  ];

  // Donut Pie Distribution Data
  const pieData = divisionData.map(d => ({
    name: d.division,
    value: d.actual
  }));

  // GSH Brand Palette Colors for Donut Pie
  const PIE_COLORS = ['#c8102e', '#00a896', '#f4c430', '#3b82f6', '#8b5cf6'];

  // Daily Cumulative Progress Data for Current Month
  const dailyProgressData = [
    { day: 'Day 1', target: 8.3, actual: 7.9, dailyTarget: 8.3, dailyActual: 7.9 },
    { day: 'Day 5', target: 41.6, actual: 43.2, dailyTarget: 8.3, dailyActual: 8.8 },
    { day: 'Day 10', target: 83.3, actual: 81.0, dailyTarget: 8.3, dailyActual: 7.6 },
    { day: 'Day 15', target: 125.0, actual: 128.4, dailyTarget: 8.3, dailyActual: 9.5 },
    { day: 'Day 20', target: 166.6, actual: 162.1, dailyTarget: 8.3, dailyActual: 6.7 },
    { day: 'Day 25', target: 208.3, actual: 209.5, dailyTarget: 8.3, dailyActual: 9.5 },
    { day: 'Day 30', target: 250.0, actual: 248.5, dailyTarget: 8.3, dailyActual: 7.8 },
  ];

  // Calculated totals
  const totalBudget = divisionData.reduce((acc, curr) => acc + curr.budget, 0);
  const totalActual = divisionData.reduce((acc, curr) => acc + curr.actual, 0);
  const totalVariance = totalActual - totalBudget;
  const achievementRate = ((totalActual / totalBudget) * 100).toFixed(1);

  const getStatusBadge = (percent) => {
    if (percent >= 100) {
      return (
        <span className="badge badge-success">
          <CheckCircle2 style={{ width: '13px', height: '13px' }} /> Exceeded ({percent}%)
        </span>
      );
    } else if (percent >= 93) {
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
      
      {/* 1. Header Title Banner */}
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
            <BarChart2 style={{ width: '28px', height: '28px', color: 'var(--gsh-red)' }} />
            <h1 style={{ 
              fontSize: '1.85rem', 
              fontWeight: 800, 
              color: '#1e293b', 
              letterSpacing: '-0.02em', 
              margin: 0,
              fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}>
              Total Sales Details - Current Month
            </h1>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0, paddingLeft: '2.3rem' }}>
            George Steuart Health &bull; Graphical Analytics &amp; Budget VS Actual Performance Reports
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
              Budget VS Actual
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
              Budget Only
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

      {/* 2. Top Summary KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Card 1: Total Budget */}
        <div className="glass-card animate-fade-in" style={{ padding: '1.25rem 1.5rem', borderTop: '4px solid var(--gsh-red)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Target Budget Target</span>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'rgba(200, 16, 46, 0.1)', color: 'var(--gsh-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Target style={{ width: '20px', height: '20px' }} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            LKR {totalBudget.toFixed(1)}M
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', margin: '0.25rem 0 0 0' }}>Monthly Approved Target</p>
        </div>

        {/* Card 2: Total Actual Sales */}
        <div className="glass-card animate-fade-in" style={{ padding: '1.25rem 1.5rem', borderTop: '4px solid var(--gsh-teal)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Actual Sales Achieved</span>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'rgba(0, 168, 150, 0.1)', color: 'var(--gsh-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign style={{ width: '20px', height: '20px' }} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            LKR {totalActual.toFixed(1)}M
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--gsh-teal)', margin: '0.25rem 0 0 0', fontWeight: 600 }}>Real-time Total Achieved</p>
        </div>

        {/* Card 3: Variance */}
        <div className="glass-card animate-fade-in" style={{ padding: '1.25rem 1.5rem', borderTop: `4px solid ${totalVariance >= 0 ? 'var(--success)' : 'var(--danger)'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Sales Variance</span>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: totalVariance >= 0 ? 'var(--success-bg)' : 'var(--danger-bg)', color: totalVariance >= 0 ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {totalVariance >= 0 ? <TrendingUp style={{ width: '20px', height: '20px' }} /> : <TrendingDown style={{ width: '20px', height: '20px' }} />}
            </div>
          </div>
          <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: totalVariance >= 0 ? 'var(--success)' : 'var(--danger)', margin: 0 }}>
            {totalVariance >= 0 ? `+LKR ${totalVariance.toFixed(1)}M` : `-LKR ${Math.abs(totalVariance).toFixed(1)}M`}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', margin: '0.25rem 0 0 0' }}>
            {((totalVariance / totalBudget) * 100).toFixed(1)}% vs Budget
          </p>
        </div>

        {/* Card 4: Achievement % Progress */}
        <div className="glass-card animate-fade-in" style={{ padding: '1.25rem 1.5rem', borderTop: '4px solid var(--gsh-gold)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Target Achievement Rate</span>
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

      {/* 3. Main Graphical Charts Grid */}

      {/* Row 1: Dual Graphical View - Multi-Axis Composed Chart & Sales Donut Distribution */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
        gap: '1.5rem'
      }}>

        {/* Chart 1: Composed Bar + Achievement Line Chart */}
        <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Division Performance &amp; Achievement Rate
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Budget (Bars) vs Actual Sales (Bars) with % Achievement Overlay (Line)
              </p>
            </div>
            <span className="badge badge-brand">Composed Analytics</span>
          </div>

          <div style={{ width: '100%', height: 330 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={divisionData} margin={{ top: 15, right: 15, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="division" stroke="var(--text-subtle)" fontSize={11} tickLine={false} />
                <YAxis yAxisId="left" stroke="var(--text-subtle)" fontSize={11} tickLine={false} unit="M" />
                <YAxis yAxisId="right" orientation="right" stroke="#d97706" fontSize={11} tickLine={false} unit="%" domain={[80, 115]} />
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
                {(viewMode === 'compare' || viewMode === 'budget') && (
                  <Bar yAxisId="left" dataKey="budget" name="Budget Target (LKR)" fill="#c8102e" radius={[4, 4, 0, 0]} barSize={24} />
                )}
                {(viewMode === 'compare' || viewMode === 'actual') && (
                  <Bar yAxisId="left" dataKey="actual" name="Actual Sales (LKR)" fill="#00a896" radius={[4, 4, 0, 0]} barSize={24} />
                )}
                <Line yAxisId="right" type="monotone" dataKey="percent" name="Achievement %" stroke="#d97706" strokeWidth={3} dot={{ r: 5, fill: '#f4c430' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Division Sales Share Donut Chart */}
        <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Actual Sales Share by Division
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Proportional contribution to current month revenue
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

      {/* Row 2: Monthly Cumulative Growth Trajectory Area Chart */}
      <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Current Month Cumulative Sales Trajectory (Daily Progress)
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Linear target path vs actual day-by-day accumulated sales (LKR Millions)
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--gsh-red)' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#c8102e' }}></span> Target Linear Path
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--gsh-teal)' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00a896' }}></span> Actual Sales Path
            </span>
          </div>
        </div>

        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyProgressData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00a896" stopOpacity={0.45}/>
                  <stop offset="95%" stopColor="#00a896" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c8102e" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#c8102e" stopOpacity={0}/>
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
              <Area type="monotone" dataKey="target" stroke="#c8102e" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#targetGradient)" name="Linear Target Path" />
              <Area type="monotone" dataKey="actual" stroke="#00a896" strokeWidth={3} fillOpacity={1} fill="url(#actualGradient)" name="Actual Cumulative Sales" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default BudgetVsActualDashboard;
