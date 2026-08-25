import React, { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';

const AgentAutocomplete = ({ agents, onSelect, placeholder = "Search agent directory..." }) => {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const filteredAgents = query.trim() === '' ? [] : agents.filter(agent => 
    (agent.name || '').toLowerCase().includes(query.toLowerCase()) || 
    (agent.id || '').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', marginBottom: '1rem' }}>
      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '0.75rem',
            paddingLeft: '2.2rem',
            borderRadius: '6px',
            border: '1px solid var(--color-border)',
            backgroundColor: 'white',
            color: 'var(--color-dark-navy)'
          }}
        />
      </div>

      {showResults && filteredAgents.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          maxHeight: '200px',
          overflowY: 'auto',
          zIndex: 50,
          marginTop: '4px'
        }}>
          {filteredAgents.map(agent => (
            <div 
              key={agent.id}
              onClick={() => {
                onSelect(agent);
                setQuery('');
                setShowResults(false);
              }}
              style={{
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              <span style={{ fontWeight: 'bold', color: 'var(--color-dark-navy)' }}>{agent.name || 'Unknown Agent'}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{agent.id}</span>
            </div>
          ))}
        </div>
      )}
      
      {showResults && query.trim() !== '' && filteredAgents.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          padding: '1rem',
          zIndex: 50,
          marginTop: '4px',
          color: 'var(--color-text-muted)',
          textAlign: 'center'
        }}>
          No agents found in directory.
        </div>
      )}
    </div>
  );
};

export default AgentAutocomplete;
