import React, { useState } from 'react';
import { useAgent } from '../context/AgentContext';
import { Mail, Phone, Download, Search, User, MapPin, Award, Globe, Smartphone } from 'lucide-react';

const Directory = () => {
  const { agents } = useAgent();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter out any invalid agents and apply search filter
  const filteredAgents = agents.filter(agent => {
    if (!agent || (!agent.name && !agent.id)) return false;
    
    const searchString = searchTerm.toLowerCase();
    const nameMatch = agent.name?.toLowerCase().includes(searchString);
    const emailMatch = agent.id?.toLowerCase().includes(searchString);
    const phoneMatch = agent.profile?.phone?.toLowerCase().includes(searchString);
    const licenseMatch = agent.profile?.licenseNumber?.toLowerCase().includes(searchString);
    
    return nameMatch || emailMatch || phoneMatch || licenseMatch;
  });

  // Function to generate and download a vCard (.vcf)
  const downloadVCard = (agent) => {
    // Construct the vCard data
    const nameStr = agent.name || 'Unknown Agent';
    const nameParts = nameStr.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    
    const emailStr = agent.id || ''; // The id is typically their email
    const phoneStr = agent.profile?.phone || '';
    const altPhoneStr = agent.profile?.altPhone || '';
    const addressStr = agent.profile?.address || '';
    const websiteStr = agent.profile?.website || '';
    const licenseStr = agent.profile?.licenseNumber || '';
    
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:${lastName};${firstName};;;`,
      `FN:${nameStr}`,
      `ORG:eXp Syndicate`,
      licenseStr ? `TITLE:Real Estate Agent (Lic: ${licenseStr})` : 'TITLE:Real Estate Agent',
      phoneStr ? `TEL;TYPE=WORK,VOICE:${phoneStr}` : '',
      altPhoneStr ? `TEL;TYPE=CELL,VOICE:${altPhoneStr}` : '',
      emailStr ? `EMAIL;TYPE=PREF,INTERNET:${emailStr}` : '',
      addressStr ? `ADR;TYPE=WORK:;;${addressStr};;;;` : '',
      websiteStr ? `URL:${websiteStr}` : '',
      'END:VCARD'
    ].filter(Boolean).join('\n');

    // Create blob and trigger download
    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${nameStr.replace(/\s+/g, '_')}_Contact.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in" style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 className="text-2xl font-semibold mb-2 text-dark-navy">Syndicate Directory</h1>
          <p className="text-muted">Find and connect with fellow agents in the network.</p>
        </div>
        
        <div style={styles.searchContainer}>
          <Search size={20} style={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search by name, email, phone, or license..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      <div style={styles.grid}>
        {filteredAgents.map((agent) => (
          <div key={agent.id} className="card hover-lift" style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.avatar}>
                {agent.name ? agent.name.charAt(0).toUpperCase() : <User size={24} />}
              </div>
              <div style={styles.nameContainer}>
                <h3 style={styles.name}>{agent.name || 'No Name Provided'}</h3>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                  <span style={styles.roleBadge}>
                    {agent.role === 'admin' ? 'Admin' : 'Agent'}
                  </span>
                  {agent.profile?.licenseNumber && (
                    <span style={{ ...styles.roleBadge, backgroundColor: 'rgba(44, 90, 160, 0.1)', color: 'var(--color-primary)' }}>
                      Lic #{agent.profile.licenseNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={styles.contactInfo}>
              <div style={styles.infoRow}>
                <Mail size={15} color="var(--color-primary)" />
                <a href={`mailto:${agent.id}`} style={styles.link}>{agent.id}</a>
              </div>
              
              <div style={styles.infoRow}>
                <Phone size={15} color="var(--color-primary)" />
                {agent.profile?.phone ? (
                  <a href={`tel:${agent.profile.phone.replace(/[^0-9+]/g, '')}`} style={styles.link}>
                    {agent.profile.phone}
                  </a>
                ) : (
                  <span style={styles.noData}>No phone provided</span>
                )}
              </div>

              {agent.profile?.altPhone && (
                <div style={styles.infoRow}>
                  <Smartphone size={15} color="var(--color-primary)" />
                  <a href={`tel:${agent.profile.altPhone.replace(/[^0-9+]/g, '')}`} style={styles.link}>
                    {agent.profile.altPhone} (Mobile)
                  </a>
                </div>
              )}

              {agent.profile?.address && (
                <div style={styles.infoRow}>
                  <MapPin size={15} color="var(--color-primary)" />
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-main)' }}>{agent.profile.address}</span>
                </div>
              )}

              {agent.profile?.website && (
                <div style={styles.infoRow}>
                  <Globe size={15} color="var(--color-primary)" />
                  <a href={agent.profile.website.startsWith('http') ? agent.profile.website : `https://${agent.profile.website}`} target="_blank" rel="noopener noreferrer" style={styles.link}>
                    {agent.profile.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>

            <button 
              className="btn-primary" 
              style={styles.downloadBtn}
              onClick={() => downloadVCard(agent)}
            >
              <Download size={16} /> Save Contact (.vcf)
            </button>
          </div>
        ))}
        
        {filteredAgents.length === 0 && (
          <div style={styles.emptyState}>
            <User size={48} color="var(--color-border)" />
            <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>
              No agents found matching your search.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    paddingBottom: '2rem'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1.5rem'
  },
  searchContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: '350px'
  },
  searchIcon: {
    position: 'absolute',
    left: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--color-text-muted)'
  },
  searchInput: {
    width: '100%',
    padding: '0.75rem 1rem 0.75rem 3rem',
    borderRadius: '50px',
    border: '1px solid var(--color-border)',
    outline: 'none',
    fontSize: '0.95rem',
    boxShadow: 'var(--shadow-sm)',
    transition: 'all 0.2s'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    padding: '1.5rem',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.5rem'
  },
  avatar: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    fontWeight: 'bold'
  },
  nameContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '0.25rem'
  },
  name: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: '600',
    color: 'var(--color-dark-navy)'
  },
  roleBadge: {
    fontSize: '0.7rem',
    padding: '0.15rem 0.5rem',
    borderRadius: '50px',
    backgroundColor: 'var(--color-frosted-blue)',
    color: 'var(--color-slate-blue)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  contactInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1.5rem',
    flexGrow: 1
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  link: {
    color: 'var(--color-text-main)',
    textDecoration: 'none',
    fontSize: '0.95rem',
    wordBreak: 'break-all'
  },
  noData: {
    color: 'var(--color-text-muted)',
    fontSize: '0.95rem',
    fontStyle: 'italic'
  },
  downloadBtn: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    marginTop: 'auto'
  },
  emptyState: {
    gridColumn: '1 / -1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem',
    backgroundColor: 'var(--color-white)',
    borderRadius: 'var(--border-radius-lg)',
    border: '1px dashed var(--color-border)'
  }
};

export default Directory;
