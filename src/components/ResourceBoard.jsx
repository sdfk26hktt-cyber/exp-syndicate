import React, { useState } from 'react';
import { Search, FileText, Video, Link as LinkIcon, Filter, Phone, Book, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

const mockResources = [
  { id: 1, title: 'Join Application', category: 'Tech Setup', type: 'link', url: 'https://join.exprealty.com' },
  { id: 2, title: 'Onboarding Status Tracker', category: 'Tech Setup', type: 'link', url: 'https://onboardingstatus.expenterprise.com' },
  { id: 3, title: 'eXp World Download', category: 'Tech Setup', type: 'link', url: 'https://download.exprealty.com' },
  { id: 4, title: 'New Agent Toolkit', category: 'Training', type: 'link', url: 'https://exptoolkit.com/us-realty-onboarding' },
  { id: 5, title: 'CRM of Choice Guide', category: 'Tech Setup', type: 'link', url: 'https://exptoolkit.com/crmofchoice' },
  { id: 6, title: 'Texas Agent Center', category: 'Training', type: 'link', url: 'https://us.exprealty.com/states/texas' },
  { id: 7, title: 'W-9 Toolkit', category: 'Finance', type: 'link', url: 'https://exptoolkit.com/w9' },
  { id: 8, title: 'TREC REALM Portal', category: 'Tech Setup', type: 'link', url: 'https://mylicense.trec.texas.gov/' },
];

const mockFaqs = [
  { question: "How long does the whole application process take?", answer: "Once your application and license transfer are complete, we can activate your account within one business day. Delays usually happen due to name mismatches on your application vs TREC." },
  { question: "What if I don't know my license number yet?", answer: "If you are a new licensee and do not have your license number or expiration date yet, you can still move forward with your application. Provide the information you have, and we can update these details once the state issues them." },
  { question: "I am a returning agent, do I get a new account or reactivate my old one?", answer: "If it has been more than one year since you left, you will be considered a new agent with eXp. If you are returning within one year, your previous account can be reactivated." },
  { question: "Can agents name me as a sponsor before my license is active?", answer: "Yes! Once your ICA is signed, it acts as a placeholder. Other agents can onboard and name you as their sponsor while you remain in the joining queue, even before you officially transfer your license." },
  { question: "What do I do if my application stalls or needs revision?", answer: "If revisions are needed, look for emails from onboarding with a secure sign link for quick corrections. If your application stalls past 24 hours in the process phase, contact the Texas Broker Team immediately." }
];

const categories = ['All', 'Tech Setup', 'Marketing', 'Training', 'Finance'];

const quickReferences = [
  { label: 'eXp Brokerage TREC License', value: '603392-BB' },
  { label: 'eXp NRDS Number', value: '080528182' },
  { label: 'HUD NAID', value: 'EXPRLT9462' },
  { label: 'Tax ID', value: '20-8369429' },
  { label: 'Contracts Address', value: '9600 Great Hills Trail, Ste 150W, Austin, TX 78759' },
  { label: 'Texas Broker Team Email', value: 'tx.broker@exprealty.net' },
  { label: 'Texas Broker Hotline', value: '888-519-7431' },
  { label: 'eXpert Care Desk', value: '903-500-4397 / 833-303-0610' }
];

const ResourceBoard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('resources'); // 'resources' | 'faq'
  const [expandedFaq, setExpandedFaq] = useState(null);

  const filteredResources = mockResources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || resource.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const getIcon = (type) => {
    switch(type) {
      case 'document': return <FileText size={24} color="var(--color-slate-blue)" />;
      case 'video': return <Video size={24} color="var(--color-slate-blue)" />;
      case 'link': return <LinkIcon size={24} color="var(--color-slate-blue)" />;
      default: return <FileText size={24} color="var(--color-slate-blue)" />;
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Resource Board</h1>
        <p className="text-muted">Everything you need to grow your business, indexed and searchable.</p>
      </div>

      <div className="grid-layout mb-6">
        <div style={{gridColumn: '1 / -1'}}>
          {/* Quick Reference Directory */}
          <div className="card mb-6" style={{ backgroundColor: 'var(--color-slate-blue)', color: 'white', borderColor: 'var(--color-slate-blue)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Book size={20} />
              <h2 className="text-lg" style={{color: 'white', margin: 0}}>Quick Reference Directory</h2>
            </div>
            <div style={styles.quickRefGrid}>
              {quickReferences.map((ref, idx) => (
                <div key={idx} style={styles.quickRefItem}>
                  <div style={styles.refLabel}>{ref.label}</div>
                  <div style={styles.refValue}>{ref.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.tabContainer}>
            <button 
              style={{...styles.tabButton, ...(activeTab === 'resources' ? styles.activeTabButton : {})}}
              onClick={() => setActiveTab('resources')}
            >
              Resources & Links
            </button>
            <button 
              style={{...styles.tabButton, ...(activeTab === 'faq' ? styles.activeTabButton : {})}}
              onClick={() => setActiveTab('faq')}
            >
              Onboarding FAQ
            </button>
          </div>

          {activeTab === 'resources' && (
            <div className="card animate-fade-in mb-6">
              <div style={styles.controlsContainer}>
                <div style={styles.searchBox}>
                  <Search size={20} color="var(--color-moss-grey)" style={{ marginLeft: '10px' }} />
                  <input 
                    type="text" 
                    placeholder="Search resources..." 
                    style={styles.searchInput}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div style={styles.filterContainer}>
                  <Filter size={20} color="var(--color-moss-grey)" />
                  <div style={styles.categories}>
                    {categories.map(cat => (
                      <button 
                        key={cat} 
                        style={{
                          ...styles.categoryPill, 
                          ...(activeCategory === cat ? styles.categoryPillActive : {})
                        }}
                        onClick={() => setActiveCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {activeTab === 'resources' ? (
        <div className="animate-fade-in" style={styles.grid}>
          {filteredResources.length > 0 ? (
            filteredResources.map(resource => (
              <a 
                key={resource.id} 
                href={resource.url || '#'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="card" 
                style={{ ...styles.resourceCard, textDecoration: 'none' }}
              >
                <div style={styles.iconContainer}>
                  {getIcon(resource.type)}
                </div>
                <div style={{ flexGrow: 1 }}>
                  <h3 className="font-semibold" style={{ color: 'var(--color-text-main)' }}>{resource.title}</h3>
                  <span style={styles.tag}>{resource.category}</span>
                </div>
              </a>
            ))
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-moss-grey)', gridColumn: '1 / -1' }}>
              No resources found matching your criteria.
            </div>
          )}
        </div>
      ) : (
        <div className="animate-fade-in" style={styles.faqContainer}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-dark-navy)' }}>Frequently Asked Questions</h2>
          <div style={styles.faqList}>
            {mockFaqs.map((faq, idx) => (
              <div key={idx} className="card" style={styles.faqCard} onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}>
                <div style={styles.faqHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <HelpCircle size={20} color="var(--color-brand-blue)" />
                    <h3 className="font-semibold" style={{ margin: 0, color: 'var(--color-dark-navy)' }}>{faq.question}</h3>
                  </div>
                  {expandedFaq === idx ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
                {expandedFaq === idx && (
                  <div style={styles.faqAnswer}>
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .grid-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
      `}</style>
    </div>
  );
};

const styles = {
  quickRefGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1rem',
  },
  quickRefItem: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: '0.75rem',
    borderRadius: 'var(--border-radius-sm)',
  },
  refLabel: {
    fontSize: '0.75rem',
    color: 'var(--color-frosted-blue)',
    marginBottom: '0.25rem',
  },
  refValue: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'white',
  },
  controlsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--color-background)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--border-radius-sm)',
    padding: '0.25rem',
  },
  searchInput: {
    border: 'none',
    backgroundColor: 'transparent',
    padding: '0.75rem',
    width: '100%',
    outline: 'none',
    fontFamily: 'inherit',
    fontSize: '1rem',
  },
  filterContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    overflowX: 'auto',
    paddingBottom: '0.5rem',
  },
  categories: {
    display: 'flex',
    gap: '0.5rem',
  },
  categoryPill: {
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    border: '1px solid var(--color-border)',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--color-text-main)',
    whiteSpace: 'nowrap',
  },
  categoryPillActive: {
    backgroundColor: 'var(--color-slate-blue)',
    color: 'white',
    borderColor: 'var(--color-slate-blue)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  resourceCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    cursor: 'pointer',
  },
  iconContainer: {
    backgroundColor: 'var(--color-frosted-blue)',
    padding: '0.75rem',
    borderRadius: 'var(--border-radius-sm)',
    display: 'flex',
  },
  tag: {
    display: 'inline-block',
    fontSize: '0.75rem',
    padding: '0.25rem 0.5rem',
    backgroundColor: 'var(--color-background)',
    color: 'var(--color-text-muted)',
    borderRadius: '4px',
    marginTop: '0.5rem',
  },
  tabContainer: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
    borderBottom: '2px solid var(--color-border)',
  },
  tabButton: {
    padding: '0.75rem 1.5rem',
    background: 'none',
    border: 'none',
    color: 'var(--color-moss-grey)',
    fontWeight: '600',
    fontSize: '1rem',
    cursor: 'pointer',
    borderBottom: '3px solid transparent',
    marginBottom: '-2px',
    transition: 'all 0.2s',
  },
  activeTabButton: {
    color: 'var(--color-brand-blue)',
    borderBottom: '3px solid var(--color-brand-blue)',
  },
  faqContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  faqList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  faqCard: {
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  faqHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqAnswer: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid var(--color-border)',
    color: 'var(--color-text-muted)',
    lineHeight: '1.6',
  }
};

export default ResourceBoard;
