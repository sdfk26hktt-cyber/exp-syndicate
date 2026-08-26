import React, { useState } from 'react';
import { useAgent } from '../context/AgentContext';
import { Mail, Phone, Download, Search, User, MapPin, Globe, Smartphone, Heart, Sparkles } from 'lucide-react';
import LevelBadge from './Gamification/LevelBadge';

const Directory = () => {
  const { agents, gamificationSettings } = useAgent();
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
    const nameStr = agent.name || 'Unknown Agent';
    const nameParts = nameStr.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    
    const emailStr = agent.id || '';
    const phoneStr = agent.profile?.phone || '';
    const altPhoneStr = agent.profile?.altPhone || '';
    const addressStr = agent.profile?.address || '';
    const licenseStr = agent.profile?.licenseNumber || '';
    const websiteStr = agent.profile?.website || '';

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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <h3 style={styles.name}>{agent.name || 'No Name Provided'}</h3>
                  <LevelBadge 
                    xp={agent.xp || 0} 
                    thresholds={gamificationSettings?.levelThresholds} 
                    size="xs" 
                  />
                </div>
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
                    Website
                  </a>
                </div>
              )}

              {/* Social / Extra Profile Info */}
              {(agent.profile?.instagram || agent.profile?.linkedin || agent.profile?.facebook) && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  {agent.profile.instagram && (
                    <a href={agent.profile.instagram.startsWith('http') ? agent.profile.instagram : `https://instagram.com/${agent.profile.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={styles.socialLink}>
                      Instagram
                    </a>
                  )}
                  {agent.profile.linkedin && (
                    <a href={agent.profile.linkedin.startsWith('http') ? agent.profile.linkedin : `https://${agent.profile.linkedin}`} target="_blank" rel="noopener noreferrer" style={styles.socialLink}>
                      LinkedIn
                    </a>
                  )}
                  {agent.profile.facebook && (
                    <a href={agent.profile.facebook.startsWith('http') ? agent.profile.facebook : `https://${agent.profile.facebook}`} target="_blank" rel="noopener noreferrer" style={styles.socialLink}>
                      Facebook
                    </a>
                  )}
                </div>
              )}

              {/* Bio / Interests & Goals */}
              {(agent.profile?.interests || agent.profile?.goals) && (
                <div style={styles.bioContainer}>
                  {agent.profile?.interests && (
                    <div style={styles.bioSnippet}>
                      <Heart size={12} color="var(--color-accent)" />
                      <span><strong>Interests:</strong> {agent.profile.interests}</span>
                    </div>
                  )}
                  {agent.profile?.goals && (
                    <div style={styles.bioSnippet}>
                      <Sparkles size={12} color="var(--color-primary)" />
                      <span><strong>Goals:</strong> {agent.profile.goals}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button 
              onClick={() => downloadVCard(agent)} 
              className="btn-secondary"
              style={styles.vcardButton}
            >
              <Download size={15} /> Save Contact (.vcf)
            </button>
          </div>
        ))}
      </div>

      {filteredAgents.length === 0 && (
        <div style={styles.emptyState}>
          <p>No agents found matching your search.</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    paddingBottom: '80px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  searchContainer: {
    position: 'relative',
    minWidth: '280px',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--color-text-muted)',
  },
  searchInput: {
    width: '100%',
    padding: '0.6rem 1rem 0.6rem 2.4rem',
    borderRadius: '20px',
    border: '1px solid var(--color-border)',
    fontSize: '0.9rem',
    outline: 'none',
    backgroundColor: 'var(--color-card-bg)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.25rem',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '1.25rem',
    borderRadius: '12px',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-card-bg)',
    gap: '1rem',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  avatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '1.1rem',
    flexShrink: 0,
  },
  nameContainer: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  name: {
    fontSize: '1.05rem',
    fontWeight: '600',
    margin: 0,
    color: 'var(--color-dark-navy)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  roleBadge: {
    fontSize: '0.7rem',
    padding: '0.15rem 0.5rem',
    borderRadius: '12px',
    backgroundColor: 'var(--color-frosted-blue)',
    color: 'var(--color-dark-navy)',
    fontWeight: '500',
  },
  contactInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    fontSize: '0.85rem',
    overflow: 'hidden',
  },
  link: {
    color: 'var(--color-text-main)',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  noData: {
    color: 'var(--color-text-muted)',
    fontStyle: 'italic',
  },
  socialLink: {
    fontSize: '0.75rem',
    color: 'var(--color-primary)',
    backgroundColor: 'rgba(0, 161, 224, 0.08)',
    padding: '0.15rem 0.45rem',
    borderRadius: '4px',
    textDecoration: 'none',
    fontWeight: '500'
  },
  bioContainer: {
    marginTop: '0.4rem',
    paddingTop: '0.4rem',
    borderTop: '1px solid var(--color-border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
  },
  bioSnippet: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.4rem',
    fontSize: '0.78rem',
    color: 'var(--color-text-main)',
    lineHeight: 1.3
  },
  vcardButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.5rem',
    fontSize: '0.85rem',
    marginTop: '0.25rem',
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem',
    color: 'var(--color-text-muted)',
  }
};

export default Directory;
