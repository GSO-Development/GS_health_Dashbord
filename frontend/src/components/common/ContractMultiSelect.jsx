import React, { useState, useEffect, useRef } from 'react';
import { Filter, Check, ChevronDown, X, Search, Layers } from 'lucide-react';
import api from '../../services/api';

const ContractMultiSelect = ({ selectedContracts = [], onChange, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [contractOptions, setContractOptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchContracts = async () => {
      setLoading(true);
      try {
        const res = await api.get('/reports/contracts');
        if (res.data && Array.isArray(res.data.contracts)) {
          setContractOptions(res.data.contracts);
        }
      } catch (err) {
        console.error('Failed to load contract list:', err);
        // Fallback default list from known database contracts
        setContractOptions(['DIVSA', 'GSH1N', 'GSHD', 'GSIEX', 'GSTEA', 'GYM01', 'GYM02', 'KLN', 'LTS', 'MTL', 'VANSA']);
      }
      setLoading(false);
    };

    fetchContracts();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleContract = (contract) => {
    let updated;
    if (selectedContracts.includes(contract)) {
      updated = selectedContracts.filter((c) => c !== contract);
    } else {
      updated = [...selectedContracts, contract];
    }
    onChange(updated);
  };

  const handleSelectAll = () => {
    onChange([...contractOptions]);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const filteredOptions = contractOptions.filter((c) =>
    c.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const isAllSelected = contractOptions.length > 0 && selectedContracts.length === contractOptions.length;
  const isNoneSelected = selectedContracts.length === 0;

  // Label text calculation
  let buttonLabel = 'All Contracts';
  if (isNoneSelected) {
    buttonLabel = 'All Contracts (Default)';
  } else if (isAllSelected) {
    buttonLabel = `All Contracts (${contractOptions.length})`;
  } else if (selectedContracts.length === 1) {
    buttonLabel = `Contract: ${selectedContracts[0]}`;
  } else if (selectedContracts.length <= 2) {
    buttonLabel = `Contracts: ${selectedContracts.join(', ')}`;
  } else {
    buttonLabel = `Contracts: ${selectedContracts.slice(0, 2).join(', ')} (+${selectedContracts.length - 2})`;
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.42rem 0.85rem',
          background: selectedContracts.length > 0
            ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%)'
            : 'var(--bg-card, #ffffff)',
          border: selectedContracts.length > 0
            ? '1.5px solid #06b6d4'
            : '1px solid var(--border-color, #e2e8f0)',
          borderRadius: '8px',
          color: selectedContracts.length > 0 ? '#0891b2' : 'var(--text-main, #1e293b)',
          fontSize: '0.78rem',
          fontWeight: 700,
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: selectedContracts.length > 0 ? '0 2px 8px rgba(6, 182, 212, 0.2)' : '0 1px 3px rgba(0,0,0,0.04)',
          transition: 'all 0.2s ease',
          whiteSpace: 'nowrap'
        }}
      >
        <Layers style={{ width: '14px', height: '14px', color: selectedContracts.length > 0 ? '#06b6d4' : 'var(--text-subtle, #64748b)' }} />
        <span>{buttonLabel}</span>
        {selectedContracts.length > 0 && (
          <span
            style={{
              background: '#06b6d4',
              color: '#ffffff',
              fontSize: '0.68rem',
              fontWeight: 800,
              borderRadius: '10px',
              padding: '0.05rem 0.4rem',
              marginLeft: '0.15rem'
            }}
          >
            {selectedContracts.length}
          </span>
        )}
        <ChevronDown
          style={{
            width: '14px',
            height: '14px',
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            color: 'var(--text-subtle, #64748b)'
          }}
        />
      </button>

      {/* Dropdown Menu Modal */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            zIndex: 9999,
            minWidth: '260px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            padding: '0.5rem',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          {/* Header with Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.25rem 0.4rem 0.5rem', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>
              Filter by Contract
            </span>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={handleSelectAll}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '0.15rem 0.4rem',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: '#0284c7',
                  cursor: 'pointer'
                }}
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '0.15rem 0.4rem',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: '#64748b',
                  cursor: 'pointer'
                }}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', margin: '0.45rem 0' }}>
            <Search style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', width: '13px', height: '13px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search Contract code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.35rem 0.5rem 0.35rem 2rem',
                fontSize: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                outline: 'none',
                background: '#f8fafc',
                color: '#1e293b'
              }}
            />
          </div>

          {/* Contract Items List */}
          <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
                No contracts found
              </div>
            ) : (
              filteredOptions.map((contract) => {
                const isChecked = selectedContracts.includes(contract);
                return (
                  <label
                    key={contract}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.38rem 0.5rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: isChecked ? 'rgba(6, 182, 212, 0.08)' : 'transparent',
                      transition: 'background 0.12s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isChecked) e.currentTarget.style.background = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      if (!isChecked) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleContract(contract)}
                        style={{
                          width: '14px',
                          height: '14px',
                          accentColor: '#06b6d4',
                          cursor: 'pointer'
                        }}
                      />
                      <span style={{ fontSize: '0.78rem', fontWeight: isChecked ? 800 : 600, color: isChecked ? '#0891b2' : '#334155' }}>
                        {contract}
                      </span>
                    </div>
                    {isChecked && (
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#06b6d4', background: 'rgba(6, 182, 212, 0.15)', padding: '0.05rem 0.35rem', borderRadius: '4px' }}>
                        Selected
                      </span>
                    )}
                  </label>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.4rem', marginTop: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
              {selectedContracts.length === 0 ? 'Showing all contracts' : `${selectedContracts.length} selected`}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: '#06b6d4',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '0.2rem 0.6rem',
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractMultiSelect;
