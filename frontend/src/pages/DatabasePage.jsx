import React from 'react';

const DatabasePage = () => {
  return (
    <div className="glass-card animate-fade-in" style={{ padding: '2rem' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>MySQL XAMPP Database Overview</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        All legacy and former tables have been deleted from <code style={{ background: 'var(--bg-hover)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>gsh_dashboard</code> database. The database currently contains ONLY the 2 active data tables built from your Desktop folder <code style={{ background: 'var(--bg-hover)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>New folder (6)</code>.
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <div style={{ padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--gsh-red)', fontSize: '1.1rem' }}>invoice_output</h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>From: Invoice Output.csv</p>
          <p style={{ margin: '0.5rem 0 0 0', fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-main)' }}>19,046 Records</p>
          <span className="badge badge-primary" style={{ marginTop: '0.5rem' }}>39 SQL Columns</span>
        </div>
        <div style={{ padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#3b82f6', fontSize: '1.1rem' }}>outstanding_output</h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>From: Outstanding Output.csv</p>
          <p style={{ margin: '0.5rem 0 0 0', fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-main)' }}>170 Records</p>
          <span className="badge badge-info" style={{ marginTop: '0.5rem' }}>32 SQL Columns</span>
        </div>
      </div>
    </div>
  );
};

export default DatabasePage;
