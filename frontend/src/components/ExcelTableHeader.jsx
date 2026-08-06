import React from 'react';

/**
 * ExcelColHeader - renders a single Excel-style column header cell
 * Usage: <ExcelColHeader col="A" label="Invoice No" />
 */
export const ExcelColHeader = ({ col, label, align = 'left', minWidth, style = {} }) => (
  <th style={{
    padding: '0 0 0 0',
    whiteSpace: 'nowrap',
    minWidth: minWidth || undefined,
    textAlign: align,
    verticalAlign: 'bottom',
    border: 'none',
    ...style
  }}>
    {/* Excel column letter badge */}
    <div style={{
      fontSize: '0.65rem',
      fontWeight: 800,
      color: '#ffffff',
      background: '#c8102e',
      display: 'inline-block',
      padding: '0.1rem 0.35rem',
      borderRadius: '3px 3px 0 0',
      letterSpacing: '0.04em',
      minWidth: '20px',
      textAlign: 'center',
      lineHeight: 1.4,
      marginBottom: '1px'
    }}>
      {col}
    </div>
    {/* Column label row */}
    <div style={{
      padding: '0.45rem 1rem',
      background: 'var(--bg-hover)',
      borderTop: '2px solid #c8102e',
      fontWeight: 700,
      fontSize: '0.8rem',
      color: 'var(--text-main)',
      textAlign: align
    }}>
      {label}
    </div>
  </th>
);

/**
 * ExcelRowNum - renders a row number cell in the leftmost column
 * Usage: <ExcelRowNum num={1} />
 */
export const ExcelRowNum = ({ num }) => (
  <td style={{
    padding: '0.45rem 0.6rem',
    textAlign: 'center',
    fontSize: '0.7rem',
    fontWeight: 700,
    color: '#ffffff',
    background: '#c8102e',
    userSelect: 'none',
    borderBottom: '1px solid rgba(200, 16, 46, 0.3)',
    whiteSpace: 'nowrap',
    minWidth: '36px'
  }}>
    {num}
  </td>
);

/**
 * ExcelRowHeader - the top-left corner cell (blank, like Excel)
 */
export const ExcelRowHeader = () => (
  <th style={{
    padding: '0',
    minWidth: '36px',
    verticalAlign: 'bottom',
    border: 'none'
  }}>
    <div style={{
      fontSize: '0.65rem',
      fontWeight: 800,
      color: 'transparent',
      background: '#c8102e',
      padding: '0.1rem 0.35rem',
      borderRadius: '3px 3px 0 0',
      marginBottom: '1px',
      lineHeight: 1.4
    }}>#</div>
    <div style={{
      padding: '0.45rem 0.6rem',
      background: '#c8102e',
      borderTop: '2px solid #8b0000',
      fontWeight: 700,
      fontSize: '0.7rem',
      color: '#ffffff',
      textAlign: 'center'
    }}>#</div>
  </th>
);
