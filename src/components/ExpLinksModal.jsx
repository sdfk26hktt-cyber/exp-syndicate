import React from 'react';
import { ExternalLink, X } from 'lucide-react';

const ExpLinksModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const links = [
    {
      title: 'eXp Okta Dashboard',
      url: 'https://exprealty.okta.com/',
      desc: 'Access your primary eXp applications.'
    },
    {
      title: 'My eXp',
      url: 'https://my.exprealty.com/',
      desc: 'Your central hub for agent tools and resources.'
    },
    {
      title: 'eXp Hub',
      url: 'https://hub.exprealty.com/',
      desc: 'Company news, directory, and more.'
    }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(12, 15, 36, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
    }} className="animate-fade-in" onClick={onClose}>
      <div 
        style={{
          width: '90%',
          maxWidth: '450px',
          backgroundColor: 'var(--color-background)',
          borderRadius: 'var(--border-radius-md)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          backgroundColor: 'var(--color-dark-navy)',
          padding: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img src="/exp-syndicate-logo.png" alt="eXp Logo" style={{ height: '24px', objectFit: 'contain' }} />
            Quick Links
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>
        
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {links.map((link, idx) => (
            <a 
              key={idx}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                padding: '1rem',
                backgroundColor: 'white',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                textDecoration: 'none',
                color: 'var(--color-text-main)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-dark-navy)' }}>{link.title}</span>
                <ExternalLink size={16} color="var(--color-text-muted)" />
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{link.desc}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExpLinksModal;
