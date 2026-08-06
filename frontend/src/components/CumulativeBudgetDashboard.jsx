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
  CheckCircle2, 
  AlertCircle,
  Clock,
  Download,
  PieChart as PieIcon,
  TrendingUp as GraphIcon,
  Award,
  Layers
} from 'lucide-react';

const CumulativeBudgetDashboard = () => {
  const [viewMode, setViewMode] = useState('cumulative'); // 'cumulative', 'monthly', 'forecast'
  const [selectedFY, setSelectedFY] = useState('FY 2026/27');

  // Month-by-Month Financial Year Data (Cumulative vs Monthly in LKR Millions)
  const monthlyData = [
    { month: 'Apr', targetMonthly: 230, actualMonthly: 235, cumTarget: 230, cumActual: 235, cumVariance: 5, percent: 102.2 },
    { month: 'May', targetMonthly: 235, actualMonthly: 240, cumTarget: 465, cumActual: 475, cumVariance: 10, percent: 102.2 },
    { month: 'Jun', targetMonthly: 240, actualMonthly: 238, cumTarget: 705, cumActual: 713, cumVariance: 8, percent: 101.1 },
    { month: 'Jul', targetMonthly: 250, actualMonthly: 248, cumTarget: 955, cumActual: 961, cumVariance: 6, percent: 100.6 },
    { month: 'Aug (F)', targetMonthly: 245, actualMonthly: 245, cumTarget: 1200, cumActual: 1206, cumVariance: 6, percent: 100.5 },
    { month: 'Sep (F)', targetMonthly: 250, actualMonthly: 252, cumTarget: 1450, cumActual: 1458, cumVariance: 8, percent: 100.6 },
    { month: 'Oct (F)', targetMonthly: 240, actualMonthly: 242, cumTarget: 1690, cumActual: 1700, cumVariance: 10, percent: 100.6 },
    { month: 'Nov (F)', targetMonthly: 230, actualMonthly: 232, cumTarget: 1920, cumActual: 1932, cumVariance: 12, percent: 100.6 },
    { month: 'Dec (F)', targetMonthly: 260, actualMonthly: 265, cumTarget: 2180, cumActual: 2197, cumVariance: 17, percent: 100.8 },
    { month: 'Jan (F)', targetMonthly: 220, actualMonthly: 222, cumTarget: 2400, cumActual: 2419, cumVariance: 19, percent: 100.8 },
    { month: 'Feb (F)', targetMonthly: 210, actualMonthly: 212, cumTarget: 2610, cumActual: 2631, cumVariance: 21, percent: 100.8 },
    { month: 'Mar (F)', targetMonthly: 240, actualMonthly: 244, cumTarget: 2850, cumActual: 2875, cumVariance: 25, percent: 100.9 },
  ];

  // Division YTD Cumulative Contribution Data
  const divisionCumData = [
    { division: 'Pharmaceuticals', cumActual: 360.5, share: '37.5%' },
    { division: 'Medical Devices', cumActual: 235.0, share: '24.5%' },
    { division: 'Consumer Health', cumActual: 190.2, share: '19.8%' },
    { division: 'Diagnostics', cumActual: 128.5, share: '13.4%' },
    { division: 'Surgical Care', cumActual: 46.8, share: '4.8%' },
  ];

  const pieData = divisionCumData.map(d => ({
    name: d.division,
    value: d.cumActual
  }));

  const PIE_COLORS = ['#c8102e', '#00a896', '#f4c430', '#3b82f6', '#8b5cf6'];

  // Current YTD Totals (as of July - 4 months completed)
  const fullYearBudget = 2850.0;
  const ytdTarget = 955.0;
  const ytdActual = 961.0;
  const ytdVariance = ytdActual - ytdTarget;
  const ytdCompletionRate = ((ytdActual / fullYearBudget) * 100).toFixed(1);
  const targetAchievement = ((ytdActual / ytdTarget) * 100).toFixed(1);

  const getStatusBadge = (percent) => {
    if (percent >= 100.5) {
      return (
        <span className="badge badge-success">
          <CheckCircle2 style={{ width: '13px', height: '13px' }} /> Ahead of Target ({percent}%)
        </span>
      );
    } else if (percent >= 98) {
      return (
        <span className="badge badge-info">
          <Clock style={{ width: '13px', height: '13px' }} /> On Target ({percent}%)
        </span>
      );
    } else {
      return (
        <span className="badge badge-danger">
          <AlertCircle style={{ width: '13px', height: '13px' }} /> Behind Target ({percent}%)
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
            <GraphIcon style={{ width: '28px', height: '28px', color: 'var(--gsh-red)' }} />
            <h1 style={{ 
              fontSize: '1.85rem', 
              fontWeight: 800, 
              color: '#1e293b', 
              letterSpacing: '-0.02em', 
              margin: 0,
              fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}>
              Total Budget vs Cumulative Actual
            </h1>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0, paddingLeft: '2.3rem' }}>
            George Steuart Health &bull; Financial Year YTD Cumulative Growth Trajectory &amp; Target Forecast
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
              onClick={() => setViewMode('cumulative')}
              style={{
                padding: '0.4rem 0.875rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'cumulative' ? 'var(--gsh-red)' : 'transparent',
                color: viewMode === 'cumulative' ? '#ffffff' : 'var(--text-muted)',
                transition: 'all var(--transition-fast)'
              }}
            >
              Cumulative Growth
            </button>
            <button 
              onClick={() => setViewMode('monthly')}
              style={{
                padding: '0.4rem 0.875rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'monthly' ? 'var(--gsh-teal)' : 'transparent',
                color: viewMode === 'monthly' ? '#ffffff' : 'var(--text-muted)',
                transition: 'all var(--transition-fast)'
              }}
            >
              Monthly Incremental
            </button>
            <button 
              onClick={() => setViewMode('forecast')}
              style={{
                padding: '0.4rem 0.875rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'forecast' ? 'var(--gsh-gold)' : 'transparent',
                color: viewMode === 'forecast' ? '#ffffff' : 'var(--text-muted)',
                transition: 'all var(--transition-fast)'
              }}
            >
              YTD Forecast
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
        {/* Card 1: Full Year Total Budget */}
        <div className="glass-card animate-fade-in" style={{ padding: '1.25rem 1.5rem', borderTop: '4px solid var(--gsh-red)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Full Year Total Budget</span>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'rgba(200, 16, 46, 0.1)', color: 'var(--gsh-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Target style={{ width: '20px', height: '20px' }} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            LKR {fullYearBudget.toFixed(1)}M
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', margin: '0.25rem 0 0 0' }}>Annual Total Target</p>
        </div>

        {/* Card 2: YTD Cumulative Actual */}
        <div className="glass-card animate-fade-in" style={{ padding: '1.25rem 1.5rem', borderTop: '4px solid var(--gsh-teal)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>YTD Cumulative Actual</span>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'rgba(0, 168, 150, 0.1)', color: 'var(--gsh-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign style={{ width: '20px', height: '20px' }} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            LKR {ytdActual.toFixed(1)}M
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--gsh-teal)', margin: '0.25rem 0 0 0', fontWeight: 600 }}>Achieved to Date (Apr-Jul)</p>
        </div>

        {/* Card 3: Cumulative Variance */}
        <div className="glass-card animate-fade-in" style={{ padding: '1.25rem 1.5rem', borderTop: `4px solid ${ytdVariance >= 0 ? 'var(--success)' : 'var(--danger)'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Cumulative YTD Variance</span>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: ytdVariance >= 0 ? 'var(--success-bg)' : 'var(--danger-bg)', color: ytdVariance >= 0 ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {ytdVariance >= 0 ? <TrendingUp style={{ width: '20px', height: '20px' }} /> : <TrendingDown style={{ width: '20px', height: '20px' }} />}
            </div>
          </div>
          <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: ytdVariance >= 0 ? 'var(--success)' : 'var(--danger)', margin: 0 }}>
            {ytdVariance >= 0 ? `+LKR ${ytdVariance.toFixed(1)}M` : `-LKR ${Math.abs(ytdVariance).toFixed(1)}M`}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', margin: '0.25rem 0 0 0' }}>
            {targetAchievement}% of YTD Target
          </p>
        </div>

        {/* Card 4: Annual Budget Progress */}
        <div className="glass-card animate-fade-in" style={{ padding: '1.25rem 1.5rem', borderTop: '4px solid var(--gsh-gold)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Annual Budget Completion</span>
            <Award style={{ width: '20px', height: '20px', color: 'var(--gsh-gold)' }} />
          </div>
          <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            {ytdCompletionRate}%
          </h3>
          <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: 'var(--radius-full)', marginTop: '0.75rem', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(ytdCompletionRate, 100)}%`, height: '100%', background: 'linear-gradient(90deg, var(--gsh-red), var(--gsh-gold), var(--gsh-teal))', borderRadius: 'var(--radius-full)' }} />
          </div>
        </div>
      </div>

      {/* 3. Main Graphical Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
        gap: '1.5rem'
      }}>

        {/* Chart 1: Month-by-Month Cumulative Growth Area Chart */}
        <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Total Budget vs Cumulative Actual Trajectory
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Accumulated budget target vs cumulative actual sales (Apr - Mar)
              </p>
            </div>
            <GraphIcon style={{ width: '20px', height: '20px', color: 'var(--gsh-red)' }} />
          </div>

          <div style={{ width: '100%', height: 330 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 15, right: 15, left: -10, bottom: 10 }}>
                <defs>
                  <linearGradient id="cumTargetGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c8102e" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#c8102e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="cumActualGradient" x1="0" y1="0" x2="0" y2="1">
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
                    boxShadow: 'var(--shadow-md)',
                    color: '#0f172a'
                  }}
                  formatter={(value) => [`LKR ${value}M`, '']}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Area type="monotone" dataKey="cumTarget" stroke="#c8102e" strokeWidth={2.5} strokeDasharray="4 4" fillOpacity={1} fill="url(#cumTargetGradient)" name="Total Cumulative Budget" />
                <Area type="monotone" dataKey="cumActual" stroke="#00a896" strokeWidth={3} fillOpacity={1} fill="url(#cumActualGradient)" name="Cumulative Actual Sales" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Division YTD Cumulative Contribution Donut Chart */}
        <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                YTD Cumulative Revenue Share by Division
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Cumulative sales distribution across GSH divisions to date
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
                  formatter={(value) => [`LKR ${value}M`, 'YTD Cumulative Actual']}
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Row 2: Monthly Incremental Budget vs Actual Composed Chart */}
      <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Monthly Incremental Target vs Actual Revenue
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Individual monthly billing targets (Red) vs actual monthly revenue (Teal) with YTD achievement % line
            </p>
          </div>
        </div>

        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthlyData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--text-subtle)" fontSize={11} tickLine={false} />
              <YAxis yAxisId="left" stroke="var(--text-subtle)" fontSize={11} tickLine={false} unit="M" />
              <YAxis yAxisId="right" orientation="right" stroke="#d97706" fontSize={11} tickLine={false} unit="%" domain={[90, 110]} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: 'var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-md)'
                }}
                formatter={(value, name) => [name === 'Achievement %' ? `${value}%` : `LKR ${value}M`, name]}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Bar yAxisId="left" dataKey="targetMonthly" name="Monthly Budget Target" fill="#c8102e" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar yAxisId="left" dataKey="actualMonthly" name="Monthly Actual Sales" fill="#00a896" radius={[4, 4, 0, 0]} barSize={20} />
              <Line yAxisId="right" type="monotone" dataKey="percent" name="Achievement %" stroke="#d97706" strokeWidth={3} dot={{ r: 4, fill: '#f4c430' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default CumulativeBudgetDashboard;
