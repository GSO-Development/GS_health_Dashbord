import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Calendar, CheckCircle, ChevronRight, X, ArrowRight, Zap, Target } from 'lucide-react';

export const MONTH_TABS = [
  { key: 'april', label: 'Apr-26', monthNum: 4, year: 2026, fullName: 'April 2026' },
  { key: 'may', label: 'May-26', monthNum: 5, year: 2026, fullName: 'May 2026' },
  { key: 'june', label: 'Jun-26', monthNum: 6, year: 2026, fullName: 'June 2026' },
  { key: 'july', label: 'Jul-26', monthNum: 7, year: 2026, fullName: 'July 2026' },
  { key: 'august', label: 'Aug-26', monthNum: 8, year: 2026, fullName: 'August 2026' },
  { key: 'september', label: 'Sep-26', monthNum: 9, year: 2026, fullName: 'September 2026' },
  { key: 'october', label: 'Oct-26', monthNum: 10, year: 2026, fullName: 'October 2026' },
  { key: 'november', label: 'Nov-26', monthNum: 11, year: 2026, fullName: 'November 2026' },
  { key: 'december', label: 'Dec-26', monthNum: 12, year: 2026, fullName: 'December 2026' },
  { key: 'january', label: 'Jan-27', monthNum: 1, year: 2027, fullName: 'January 2027' },
  { key: 'february', label: 'Feb-27', monthNum: 2, year: 2027, fullName: 'February 2027' },
  { key: 'march', label: 'Mar-27', monthNum: 3, year: 2027, fullName: 'March 2027' },
];

export const getCurrentMonthKey = () => {
  const d = new Date();
  const m = d.getMonth(); // 0 = Jan, 1 = Feb, ... 8 = Sep
  const monthMap = {
    3: 'april', 4: 'may', 5: 'june', 6: 'july',
    7: 'august', 8: 'september', 9: 'october', 10: 'november',
    11: 'december', 0: 'january', 1: 'february', 2: 'march'
  };
  return monthMap[m] || 'september';
};

const MonthCalendarBar = ({
  selectedMonth,
  onSelectMonth,
  startDate,
  endDate,
  selectedDate, // backward compatibility
  onSelectDateRange,
  onSelectDate, // backward compatibility
  loading = false
}) => {
  const [hoveredMonthKey, setHoveredMonthKey] = useState(null);
  const [activePopoverKey, setActivePopoverKey] = useState(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });

  // Popover internal state
  const [selectionMode, setSelectionMode] = useState('mtd'); // 'single' | 'mtd' | 'range'
  const [rangeStartDay, setRangeStartDay] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);

  const containerRef = useRef(null);
  const buttonRefs = useRef({});

  // Resolve active start/end date
  const effectiveStartDate = startDate || (selectedDate ? selectedDate : null);
  const effectiveEndDate = endDate || (selectedDate ? selectedDate : null);
  const isSingleDay = effectiveStartDate && effectiveEndDate && effectiveStartDate === effectiveEndDate;
  const isRange = effectiveStartDate && effectiveEndDate && effectiveStartDate !== effectiveEndDate;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        const popoverEl = document.getElementById('month-calendar-portal');
        if (popoverEl && popoverEl.contains(e.target)) return;
        setActivePopoverKey(null);
        setHoveredMonthKey(null);
        setRangeStartDay(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const visiblePopoverKey = activePopoverKey || hoveredMonthKey;

  const updatePos = (key) => {
    const btn = buttonRefs.current[key];
    if (btn) {
      const rect = btn.getBoundingClientRect();
      setPopoverPos({
        top: rect.bottom + 6,
        left: Math.max(160, Math.min(window.innerWidth - 160, rect.left + rect.width / 2))
      });
    }
  };

  const handleMouseEnter = (key) => {
    if (loading) return;
    setHoveredMonthKey(key);
    updatePos(key);
  };

  const handleMonthClick = (tab) => {
    if (loading) return;
    onSelectMonth(tab.key);
    if (onSelectDateRange) {
      onSelectDateRange(null, null);
    } else if (onSelectDate) {
      onSelectDate(null);
    }
    setActivePopoverKey(null);
    setHoveredMonthKey(null);
    setRangeStartDay(null);
  };

  const getCalendarDays = (year, monthNum) => {
    const firstDay = new Date(year, monthNum - 1, 1).getDay();
    const totalDays = new Date(year, monthNum, 0).getDate();
    return { firstDay, totalDays };
  };

  const activeTabObj = MONTH_TABS.find(t => t.key === selectedMonth) || MONTH_TABS[5];
  const popoverTabObj = MONTH_TABS.find(t => t.key === visiblePopoverKey);

  const applyRange = (mTab, sDay, eDay) => {
    const minDay = Math.min(sDay, eDay);
    const maxDay = Math.max(sDay, eDay);
    const sStr = `${mTab.year}-${String(mTab.monthNum).padStart(2, '0')}-${String(minDay).padStart(2, '0')}`;
    const eStr = `${mTab.year}-${String(mTab.monthNum).padStart(2, '0')}-${String(maxDay).padStart(2, '0')}`;

    onSelectMonth(mTab.key);
    if (onSelectDateRange) {
      onSelectDateRange(sStr, eStr);
    } else if (onSelectDate) {
      onSelectDate(sStr, eStr);
    }
    setActivePopoverKey(null);
    setHoveredMonthKey(null);
    setRangeStartDay(null);
  };

  const handleDayClick = (mTab, dayNum) => {
    if (selectionMode === 'single') {
      applyRange(mTab, dayNum, dayNum);
    } else if (selectionMode === 'mtd') {
      // 1st of month to clicked day
      applyRange(mTab, 1, dayNum);
    } else if (selectionMode === 'range') {
      if (!rangeStartDay) {
        setRangeStartDay(dayNum);
      } else {
        applyRange(mTab, rangeStartDay, dayNum);
      }
    }
  };

  const calculateDaysCount = () => {
    if (!effectiveStartDate || !effectiveEndDate) return 0;
    try {
      const d1 = new Date(effectiveStartDate);
      const d2 = new Date(effectiveEndDate);
      const diffTime = Math.abs(d2 - d1);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    } catch (e) {
      return 1;
    }
  };

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', opacity: loading ? 0.75 : 1, transition: 'opacity 0.2s ease', pointerEvents: loading ? 'none' : 'auto' }}>
      
      {/* 12-Month Selector Bar */}
      <div className="glass-card" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0 0.5rem', flexShrink: 0 }}>
          <Calendar style={{ width: '18px', height: '18px', color: 'var(--gsh-red)' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>Month:</span>
        </div>

        {MONTH_TABS.map((tab) => {
          const isActive = selectedMonth === tab.key;
          const hasActiveDateInThisMonth = isActive && (effectiveStartDate || effectiveEndDate);

          return (
            <div key={tab.key} style={{ flex: 1, minWidth: '82px' }}>
              <button
                ref={el => buttonRefs.current[tab.key] = el}
                disabled={loading}
                onClick={() => handleMonthClick(tab)}
                onMouseEnter={() => handleMouseEnter(tab.key)}
                onMouseLeave={() => setHoveredMonthKey(null)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.55rem',
                  borderRadius: 'var(--radius-xs)',
                  border: isActive ? '1.5px solid var(--gsh-red)' : '1px solid var(--border-color)',
                  background: isActive ? 'var(--gsh-red)' : 'var(--bg-card)',
                  color: isActive ? '#ffffff' : 'var(--text-main)',
                  fontWeight: isActive ? 800 : 700,
                  fontSize: '0.8rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 2px 8px rgba(200, 16, 46, 0.3)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem'
                }}
              >
                <span>{tab.label}</span>
                {hasActiveDateInThisMonth && (
                  <span style={{ fontSize: '0.62rem', background: '#fff', color: 'var(--gsh-red)', padding: '0.05rem 0.3rem', borderRadius: '4px', fontWeight: 900 }}>
                    {isSingleDay ? '🎯 Day' : '📈 MTD'}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* PORTAL CALENDAR POPOVER FLOATING ON TOP OF BODY */}
      {visiblePopoverKey && popoverTabObj && ReactDOM.createPortal(
        <div
          id="month-calendar-portal"
          onMouseEnter={() => setHoveredMonthKey(visiblePopoverKey)}
          onMouseLeave={() => {
            setHoveredMonthKey(null);
            setHoveredDay(null);
          }}
          style={{
            position: 'fixed',
            top: `${popoverPos.top}px`,
            left: `${popoverPos.left}px`,
            transform: 'translateX(-50%)',
            zIndex: 999999,
            background: '#ffffff',
            border: '2px solid var(--gsh-teal)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.15)',
            padding: '0.85rem',
            width: '320px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem'
          }}
        >
          {/* Header with Full Month button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.45rem' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--gsh-teal)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar style={{ width: '16px', height: '16px' }} />
              {popoverTabObj.fullName}
            </div>
            <button
              onClick={() => handleMonthClick(popoverTabObj)}
              style={{
                padding: '0.25rem 0.55rem',
                background: 'linear-gradient(135deg, var(--gsh-teal), #007a6c)',
                border: 'none',
                borderRadius: '4px',
                color: '#ffffff',
                fontSize: '0.72rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem'
              }}
            >
              Full Month (1-{getCalendarDays(popoverTabObj.year, popoverTabObj.monthNum).totalDays})
            </button>
          </div>

          {/* Mode Selection Pills */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.2rem', borderRadius: '6px', gap: '0.2rem' }}>
            <button
              onClick={() => {
                setSelectionMode('mtd');
                setRangeStartDay(null);
              }}
              style={{
                flex: 1,
                padding: '0.3rem 0.2rem',
                border: 'none',
                borderRadius: '4px',
                background: selectionMode === 'mtd' ? '#ffffff' : 'transparent',
                color: selectionMode === 'mtd' ? 'var(--gsh-teal)' : 'var(--text-muted)',
                fontWeight: selectionMode === 'mtd' ? 800 : 600,
                fontSize: '0.68rem',
                cursor: 'pointer',
                boxShadow: selectionMode === 'mtd' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.2rem'
              }}
            >
              <Zap style={{ width: '12px', height: '12px' }} />
              1 to Day (MTD)
            </button>

            <button
              onClick={() => {
                setSelectionMode('single');
                setRangeStartDay(null);
              }}
              style={{
                flex: 1,
                padding: '0.3rem 0.2rem',
                border: 'none',
                borderRadius: '4px',
                background: selectionMode === 'single' ? '#ffffff' : 'transparent',
                color: selectionMode === 'single' ? 'var(--gsh-teal)' : 'var(--text-muted)',
                fontWeight: selectionMode === 'single' ? 800 : 600,
                fontSize: '0.68rem',
                cursor: 'pointer',
                boxShadow: selectionMode === 'single' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.2rem'
              }}
            >
              <Target style={{ width: '12px', height: '12px' }} />
              Only 1 Day
            </button>

            <button
              onClick={() => {
                setSelectionMode('range');
                setRangeStartDay(null);
              }}
              style={{
                flex: 1,
                padding: '0.3rem 0.2rem',
                border: 'none',
                borderRadius: '4px',
                background: selectionMode === 'range' ? '#ffffff' : 'transparent',
                color: selectionMode === 'range' ? 'var(--gsh-teal)' : 'var(--text-muted)',
                fontWeight: selectionMode === 'range' ? 800 : 600,
                fontSize: '0.68rem',
                cursor: 'pointer',
                boxShadow: selectionMode === 'range' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.2rem'
              }}
            >
              <ArrowRight style={{ width: '12px', height: '12px' }} />
              Custom Range
            </button>
          </div>

          {/* Mode Hint Text */}
          <div style={{ fontSize: '0.68rem', color: '#475569', background: '#f8fafc', padding: '0.3rem 0.5rem', borderRadius: '4px', textAlign: 'center', fontWeight: 600 }}>
            {selectionMode === 'mtd' && '💡 Click any day (e.g. 17) to filter from Day 1 to 17.'}
            {selectionMode === 'single' && '💡 Click any day (e.g. 17) to filter ONLY that exact day.'}
            {selectionMode === 'range' && (rangeStartDay ? `🚩 Start Day is ${rangeStartDay}. Now click End Day!` : '💡 Click Start Day, then click End Day to pick a custom range.')}
          </div>

          {/* Day Names Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.2rem', textAlign: 'center', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>
            <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
          </div>

          {/* Days Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.2rem' }}>
            {/* Empty slots before day 1 */}
            {Array.from({ length: getCalendarDays(popoverTabObj.year, popoverTabObj.monthNum).firstDay }).map((_, i) => (
              <div key={`empty_${i}`} />
            ))}

            {/* Day Buttons */}
            {Array.from({ length: getCalendarDays(popoverTabObj.year, popoverTabObj.monthNum).totalDays }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${popoverTabObj.year}-${String(popoverTabObj.monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              
              // Active check
              const isStart = effectiveStartDate === dateStr;
              const isEnd = effectiveEndDate === dateStr;
              const isWithinActiveRange = effectiveStartDate && effectiveEndDate && dateStr >= effectiveStartDate && dateStr <= effectiveEndDate;

              // Hover preview in MTD mode
              const isHoveredMtd = selectionMode === 'mtd' && hoveredDay && dayNum <= hoveredDay;
              
              // Hover preview in Range mode
              const isHoveredRange = selectionMode === 'range' && rangeStartDay && hoveredDay && (
                (dayNum >= Math.min(rangeStartDay, hoveredDay) && dayNum <= Math.max(rangeStartDay, hoveredDay))
              );

              const isHighlighted = isWithinActiveRange || isHoveredMtd || isHoveredRange;
              const isEndpoint = isStart || isEnd || (selectionMode === 'range' && rangeStartDay === dayNum);

              return (
                <button
                  key={dayNum}
                  onClick={() => handleDayClick(popoverTabObj, dayNum)}
                  onMouseEnter={() => setHoveredDay(dayNum)}
                  style={{
                    padding: '0.35rem 0',
                    borderRadius: isEndpoint ? '4px' : '2px',
                    border: isEndpoint ? '1.5px solid var(--gsh-red)' : (isHighlighted ? '1px solid rgba(0,168,150,0.5)' : '1px solid #e2e8f0'),
                    background: isEndpoint ? 'var(--gsh-red)' : (isHighlighted ? 'rgba(0,168,150,0.18)' : '#f8fafc'),
                    color: isEndpoint ? '#ffffff' : (isHighlighted ? 'var(--gsh-teal)' : '#0f172a'),
                    fontSize: '0.75rem',
                    fontWeight: isEndpoint || isHighlighted ? 900 : 600,
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.1s ease'
                  }}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Quick Click Pill Buttons on Hovered Day */}
          {hoveredDay && (
            <div style={{ display: 'flex', gap: '0.35rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.45rem', marginTop: '0.2rem' }}>
              <button
                onClick={() => applyRange(popoverTabObj, hoveredDay, hoveredDay)}
                style={{
                  flex: 1,
                  padding: '0.25rem',
                  borderRadius: '4px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: 'var(--text-main)',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🎯 Only {hoveredDay}
              </button>
              <button
                onClick={() => applyRange(popoverTabObj, 1, hoveredDay)}
                style={{
                  flex: 1,
                  padding: '0.25rem',
                  borderRadius: '4px',
                  background: 'rgba(0,168,150,0.1)',
                  border: '1px solid var(--gsh-teal)',
                  color: 'var(--gsh-teal)',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                ⚡ 1 to {hoveredDay} (MTD)
              </button>
            </div>
          )}
        </div>,
        document.body
      )}

      {/* Selected Filter Indicator Badge */}
      {(effectiveStartDate || effectiveEndDate) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0,168,150,0.08)',
          border: '1px solid rgba(0,168,150,0.3)',
          padding: '0.45rem 0.85rem',
          borderRadius: 'var(--radius-xs)',
          fontSize: '0.82rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gsh-teal)', fontWeight: 800 }}>
            <Calendar style={{ width: '16px', height: '16px' }} />
            {isSingleDay ? (
              <span>Filtered by Single Day: <strong>{effectiveStartDate}</strong> ({activeTabObj.fullName})</span>
            ) : (
              <span>Filtered Date Range: <strong>{effectiveStartDate}</strong> to <strong>{effectiveEndDate}</strong> ({calculateDaysCount()} Days MTD - {activeTabObj.fullName})</span>
            )}
          </div>
          <button
            onClick={() => {
              if (onSelectDateRange) onSelectDateRange(null, null);
              if (onSelectDate) onSelectDate(null);
            }}
            style={{
              padding: '0.25rem 0.65rem',
              background: 'var(--gsh-teal)',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '0.72rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <X style={{ width: '12px', height: '12px' }} />
            Clear Filter (Show Full Month)
          </button>
        </div>
      )}

    </div>
  );
};

export default MonthCalendarBar;
