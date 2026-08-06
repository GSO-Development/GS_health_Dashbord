import React, { useState } from 'react';
import { Database, RefreshCw, CheckCircle, AlertTriangle, HardDrive, RotateCcw } from 'lucide-react';
import { reseedDatabase } from '../services/api';

const DatabaseStatus = ({ health, onCheckHealth }) => {
  const [isReseeding, setIsReseeding] = useState(false);
  const isConnected = health && health.status === 'connected';

  const handleReseed = async () => {
    setIsReseeding(true);
    await reseedDatabase();
    await onCheckHealth();
    setTimeout(() => setIsReseeding(false), 600);
  };

  return (
    <div style={{
      padding: '0.875rem 1.25rem',
      borderRadius: 'var(--radius-sm)',
      background: isConnected ? 'linear-gradient(135deg, rgba(0, 168, 150, 0.08) 0%, rgba(255,255,255,0.9) 100%)' : 'linear-gradient(135deg, rgba(200, 16, 46, 0.08) 0%, rgba(255,255,255,0.9) 100%)',
      border: `1px solid ${isConnected ? 'rgba(0, 168, 150, 0.3)' : 'rgba(200, 16, 46, 0.3)'}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '1rem',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: 'var(--radius-sm)',
          background: isConnected ? 'var(--gsh-teal)' : 'var(--gsh-red)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isConnected ? '0 4px 10px rgba(0, 168, 150, 0.3)' : '0 4px 10px rgba(200, 16, 46, 0.3)'
        }}>
          <Database style={{ width: '20px', height: '20px' }} />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              {isConnected ? 'FastAPI Backend & Database Live' : 'Database Disconnected'}
            </h4>
            {isConnected ? (
              <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>
                <CheckCircle style={{ width: '10px', height: '10px' }} /> Live Synced
              </span>
            ) : (
              <span className="badge badge-danger" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>
                <AlertTriangle style={{ width: '10px', height: '10px' }} /> Offline Fallback
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, marginTop: '0.15rem' }}>
            {isConnected 
              ? `Connected to XAMPP MySQL database \`gsh_dashboard\` (${health && health.total_records ? health.total_records.toLocaleString() : '19,216'} records in 2 active CSV data tables)`
              : 'FastAPI backend at http://localhost:8000 is unreachable.'}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button 
          onClick={handleReseed}
          disabled={isReseeding}
          className="btn btn-secondary"
          style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          title="Reseed SQLite / MySQL database with dummy data"
        >
          <RotateCcw style={{ width: '14px', height: '14px', animation: isReseeding ? 'spin 1s linear infinite' : 'none' }} />
          <span>Reseed DB Dummy Data</span>
        </button>

        <button 
          onClick={onCheckHealth}
          className="btn btn-secondary"
          style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <RefreshCw style={{ width: '14px', height: '14px' }} />
          <span>Sync Status</span>
        </button>
      </div>
    </div>
  );
};

export default DatabaseStatus;
