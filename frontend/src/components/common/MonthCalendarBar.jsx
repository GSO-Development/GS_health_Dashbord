import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Calendar } from 'lucide-react';

const MONTH_TABS = [
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

const MonthCalendarBar = ({ selectedMonth, onSelectMonth, selectedDate, onSelectDate }) => {
  const [hoveredMonthKey, setHoveredMonthKey] = useState(null);
  const [activePopoverKey, setActivePopoverKey] = useState(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  
  const containerRef = useRef(null);
  const buttonRefs = useRef({});

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        const popoverEl = document.getElementById('month-calendar-portal');
        if (popoverEl && popoverEl.contains(e.target)) return;
        setActivePopoverKey(null);
        setHoveredMonthKey(null);
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
        left: Math.max(140, Math.min(window.innerWidth - 140, rect.left + rect.width / 2))
      });
    }
  };

  const handleMouseEnter = (key) => {
    setHoveredMonthKey(key);
    updatePos(key);
  };

  const handleMonthClick = (tab) => {
    onSelectMonth(tab.key);
    if (onSelectDate) onSelectDate(null); // Reset date to full month
    setActivePopoverKey(null);
    setHoveredMonthKey(null);
  };

  const getCalendarDays = (year, monthNum) => {
    const firstDay = new Date(year, monthNum - 1, 1).getDay();
    const totalDays = new Date(year, monthNum, 0).getDate();
    return { firstDay, totalDays };
  };

  const activeTabObj = MONTH_TABS.find(t => t.key === selectedMonth) || MONTH_TABS[3];
  const popoverTabObj = MONTH_TABS.find(t => t.key === visiblePopoverKey);

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
      
      {/* 12-Month Selector Bar */}
      <div className="glass-card" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0 0.5rem', flexShrink: 0 }}>
          <Calendar style={{ width: '18px', height: '18px', color: 'var(--gsh-red)' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>Month:</span>
        </div>

        {MONTH_TABS.map((tab) => {
          const isActive = selectedMonth === tab.key;

          return (
            <div key={tab.key} style={{ flex: 1, minWidth: '82px' }}>
              <button
                ref={el => buttonRefs.current[tab.key] = el}
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
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease-in-out',
                  boxShadow: isActive ? '0 2px 8px rgba(200,16,46,0.25)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem'
                }}
              >
                <span>{tab.label}</span>
                {isActive && selectedDate && <span style={{ fontSize: '0.65rem', background: '#fff', color: 'var(--gsh-red)', padding: '0 0.3rem', borderRadius: '4px', fontWeight: 900 }}>📅 Day</span>}
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
          onMouseLeave={() => setHoveredMonthKey(null)}
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
            width: '270px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.45rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gsh-teal)' }}>
              📅 {popoverTabObj.fullName}
            </div>
            <button
              onClick={() => handleMonthClick(popoverTabObj)}
              style={{ padding: '0.25rem 0.55rem', background: 'var(--gsh-teal)', border: 'none', borderRadius: '4px', color: '#ffffff', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}
            >
              Select Full Month
            </button>
          </div>

          {/* Day Headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.2rem', textAlign: 'center', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>
            <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
          </div>

          {/* Days Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem' }}>
            {/* Empty slots before day 1 */}
            {Array.from({ length: getCalendarDays(popoverTabObj.year, popoverTabObj.monthNum).firstDay }).map((_, i) => (
              <div key={`empty_${i}`} />
            ))}

            {/* Day Buttons */}
            {Array.from({ length: getCalendarDays(popoverTabObj.year, popoverTabObj.monthNum).totalDays }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${popoverTabObj.year}-${String(popoverTabObj.monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isDateSelected = selectedDate === dateStr;

              return (
                <button
                  key={dayNum}
                  onClick={() => {
                    onSelectMonth(popoverTabObj.key);
                    if (onSelectDate) onSelectDate(dateStr);
                    setActivePopoverKey(null);
                    setHoveredMonthKey(null);
                  }}
                  style={{
                    padding: '0.35rem 0',
                    borderRadius: '4px',
                    border: isDateSelected ? '1.5px solid var(--gsh-red)' : '1px solid #cbd5e1',
                    background: isDateSelected ? 'var(--gsh-red)' : '#f8fafc',
                    color: isDateSelected ? '#ffffff' : '#0f172a',
                    fontSize: '0.75rem',
                    fontWeight: isDateSelected ? 900 : 700,
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Footer Note */}
          <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.4rem' }}>
            Click any day to filter report by exact date.
          </div>
        </div>,
        document.body
      )}

      {/* Selected Date Indicator Badge */}
      {selectedDate && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,168,150,0.08)', border: '1px solid rgba(0,168,150,0.3)', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-xs)', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gsh-teal)', fontWeight: 800 }}>
            <Calendar style={{ width: '16px', height: '16px' }} />
            Filtered by Single Date: <strong>{selectedDate}</strong> ({activeTabObj.fullName})
          </div>
          <button
            onClick={() => onSelectDate(null)}
            style={{ padding: '0.2rem 0.6rem', background: 'var(--gsh-teal)', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}
          >
            Clear Date Filter (Show Full Month)
          </button>
        </div>
      )}

    </div>
  );
};

export default MonthCalendarBar;
