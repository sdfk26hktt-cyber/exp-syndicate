import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Search, FileText, Video, Link as LinkIcon, Book, Plus, Trash2, Shield, Edit2 } from 'lucide-react';

const ResourceBoard = () => {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('resources');
  
  const [resources, setResources] = useState([]);
  const [quickRefs, setQuickRefs] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Admin form state
  const [showAddResource, setShowAddResource] = useState(false);
  const [showAddFaq, setShowAddFaq] = useState(false);
  const [showAddQuickRef, setShowAddQuickRef] = useState(false);
  
  const [editingResourceId, setEditingResourceId] = useState(null);
  const [editingQuickRefId, setEditingQuickRefId] = useState(null);
  const [editingFaqId, setEditingFaqId] = useState(null);
  
  const [resTitle, setResTitle] = useState('');
  const [resCategory, setResCategory] = useState('Training');
  const [resType, setResType] = useState('link');
  const [resUrl, setResUrl] = useState('');
  
  const [faqQ, setFaqQ] = useState('');
  const [faqA, setFaqA] = useState('');
  
  const [qRefLabel, setQRefLabel] = useState('');
  const [qRefValue, setQRefValue] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resData, faqData] = await Promise.all([
        supabase.from('resources').select('*'),
        supabase.from('faqs').select('*')
      ]);
      if (resData.data) {
        setResources(resData.data.filter(r => r.type !== 'quick_ref'));
        setQuickRefs(resData.data.filter(r => r.type === 'quick_ref').sort((a,b) => a.title.localeCompare(b.title)));
      }
      if (faqData.data) setFaqs(faqData.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddResource = async (e) => {
    e.preventDefault();
    const resDataPayload = {
      title: resTitle,
      category: resCategory,
      type: resType,
      url: resUrl,
      description: ''
    };
    
    try {
      if (editingResourceId) {
        const { error } = await supabase.from('resources').update(resDataPayload).eq('id', editingResourceId);
        if (error) throw error;
        setResources(resources.map(r => r.id === editingResourceId ? { ...r, ...resDataPayload } : r));
      } else {
        resDataPayload.id = `res-${Date.now()}`;
        const { error } = await supabase.from('resources').insert([resDataPayload]);
        if (error) throw error;
        setResources([...resources, resDataPayload]);
      }
      setShowAddResource(false);
      setEditingResourceId(null);
      setResTitle(''); setResUrl('');
    } catch (err) {
      alert(`Error ${editingResourceId ? 'updating' : 'adding'} resource: ` + err.message + "\n\nDid you run the features_schema.sql in Supabase?");
      console.error(err);
    }
  };

  const openEditResource = (res) => {
    setEditingResourceId(res.id);
    setResTitle(res.title);
    setResCategory(res.category);
    setResType(res.type);
    setResUrl(res.url);
    setShowAddResource(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteResource = async (id, isQuickRef = false) => {
    if (window.confirm("Delete this?")) {
      await supabase.from('resources').delete().eq('id', id);
      if (isQuickRef) {
        setQuickRefs(quickRefs.filter(r => r.id !== id));
      } else {
        setResources(resources.filter(r => r.id !== id));
      }
    }
  };

  const handleAddQuickRef = async (e) => {
    e.preventDefault();
    const qRefPayload = {
      title: qRefLabel,
      description: qRefValue,
      category: 'Quick Reference',
      type: 'quick_ref',
      url: '#'
    };
    try {
      if (editingQuickRefId) {
        const { error } = await supabase.from('resources').update(qRefPayload).eq('id', editingQuickRefId);
        if (error) throw error;
        setQuickRefs(quickRefs.map(r => r.id === editingQuickRefId ? { ...r, ...qRefPayload } : r));
      } else {
        qRefPayload.id = `qref-${Date.now()}`;
        const { error } = await supabase.from('resources').insert([qRefPayload]);
        if (error) throw error;
        setQuickRefs([...quickRefs, qRefPayload]);
      }
      setShowAddQuickRef(false);
      setEditingQuickRefId(null);
      setQRefLabel(''); setQRefValue('');
    } catch (err) {
      alert("Error saving quick reference: " + err.message);
      console.error(err);
    }
  };

  const openEditQuickRef = (ref) => {
    setEditingQuickRefId(ref.id);
    setQRefLabel(ref.title);
    setQRefValue(ref.description);
    setShowAddQuickRef(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddFaq = async (e) => {
    e.preventDefault();
    const faqPayload = {
      question: faqQ,
      answer: faqA
    };
    try {
      if (editingFaqId) {
        const { error } = await supabase.from('faqs').update(faqPayload).eq('id', editingFaqId);
        if (error) throw error;
        setFaqs(faqs.map(f => f.id === editingFaqId ? { ...f, ...faqPayload } : f));
      } else {
        faqPayload.id = `faq-${Date.now()}`;
        const { error } = await supabase.from('faqs').insert([faqPayload]);
        if (error) throw error;
        setFaqs([...faqs, faqPayload]);
      }
      setShowAddFaq(false);
      setEditingFaqId(null);
      setFaqQ(''); setFaqA('');
    } catch (err) {
      alert("Error saving FAQ: " + err.message + "\n\nDid you run the features_schema.sql in Supabase?");
      console.error(err);
    }
  };

  const openEditFaq = (faq) => {
    setEditingFaqId(faq.id);
    setFaqQ(faq.question);
    setFaqA(faq.answer);
    setShowAddFaq(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteFaq = async (id) => {
    if (window.confirm("Delete this FAQ?")) {
      await supabase.from('faqs').delete().eq('id', id);
      setFaqs(faqs.filter(f => f.id !== id));
    }
  };

  const categories = ['All', 'Tech Setup', 'Marketing', 'Training', 'Finance'];

  const filteredResources = resources.filter(resource => {
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

  const styles = {
    searchBox: {
      position: 'relative',
      flexGrow: 1,
      maxWidth: '400px'
    },
    searchInput: {
      width: '100%',
      padding: '0.75rem 1rem 0.75rem 2.5rem',
      borderRadius: '8px',
      border: '1px solid var(--color-border)',
      fontSize: '0.95rem'
    },
    controlsContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '1rem',
      marginBottom: '1.5rem',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    quickRefGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '1rem',
    },
    quickRefItem: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      padding: '1rem',
      borderRadius: '8px',
    },
    refLabel: {
      fontSize: '0.8rem',
      textTransform: 'uppercase',
      opacity: 0.8,
      marginBottom: '0.25rem'
    },
    refValue: {
      fontFamily: 'monospace',
      fontSize: '1.1rem',
      fontWeight: 'bold'
    },
    filterContainer: {
      display: 'flex',
      gap: '0.5rem',
      flexWrap: 'wrap'
    },
    tabContainer: {
      display: 'flex',
      borderBottom: '2px solid var(--color-border)',
      marginBottom: '2rem'
    },
    tabButton: {
      padding: '1rem 2rem',
      background: 'none',
      border: 'none',
      fontSize: '1rem',
      fontWeight: '600',
      color: 'var(--color-text-muted)',
      cursor: 'pointer',
      borderBottom: '3px solid transparent',
      marginBottom: '-2px'
    },
    activeTabButton: {
      color: 'var(--color-primary)',
      borderBottomColor: 'var(--color-primary)'
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      borderRadius: '8px',
      border: '1px solid var(--color-border)',
      marginBottom: '1rem'
    }
  };

  return (
    <div className="animate-fade-in p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Resource Board</h1>
          <p className="text-muted">Everything you need to grow your business, indexed and searchable.</p>
        </div>
      </div>

      {/* Quick Reference Directory */}
      <div className="card mb-6" style={{ backgroundColor: 'var(--color-slate-blue)', color: 'white', borderColor: 'var(--color-slate-blue)' }}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Book size={20} />
            <h2 className="text-lg" style={{color: 'white', margin: 0}}>Quick Reference Directory</h2>
          </div>
          </div>

        <div style={styles.quickRefGrid}>
          {quickRefs.map((ref) => (
            <div key={ref.id} style={{ ...styles.quickRefItem, position: 'relative' }}>
              <div style={styles.refLabel}>{ref.title}</div>
              <div style={styles.refValue}>{ref.description}</div>
            </div>
          ))}
          {quickRefs.length === 0 && <span className="opacity-70 text-sm">No quick references added yet.</span>}
        </div>
      </div>

      {/* Important Contacts Board */}
      <div className="card mb-6" style={{ border: '2px solid var(--color-primary)' }}>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--color-dark-navy)' }}>
          <Shield size={24} color="var(--color-primary)" /> Important Contacts & License Info
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div style={{ backgroundColor: 'var(--color-background-alt)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>eXp Texas Broker Team</h3>
            <p style={{ fontFamily: 'monospace', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Email: tx.broker@exprealty.net</p>
            <p style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>eXp Realty LLC License: 603392</p>
          </div>
          <div style={{ backgroundColor: 'var(--color-background-alt)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Agent Support</h3>
            <p style={{ fontFamily: 'monospace', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Support Email: support@exprealty.com</p>
            <p style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>Location: Tech Outpost in eXp World</p>
          </div>
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
        <div className="animate-fade-in mb-6">
          <div style={styles.controlsContainer}>
            <div style={styles.searchBox}>
              <Search size={18} color="var(--color-text-muted)" style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)'}} />
              <input 
                type="text" 
                placeholder="Search resources..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>
            <div style={styles.filterContainer}>
              {categories.map(cat => (
                <button 
                  key={cat}
                  className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${activeCategory === cat ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="text-muted">Loading resources...</p>
          ) : (
            <div className="grid-layout">
              {filteredResources.map(resource => (
                <a 
                  key={resource.id} 
                  href={resource.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="card flex items-start gap-4 hover:-translate-y-1 transition-transform"
                  style={{ textDecoration: 'none', color: 'inherit', position: 'relative' }}
                >
                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-background-alt)', borderRadius: '8px' }}>
                    {getIcon(resource.type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--color-dark-navy)' }}>{resource.title}</h3>
                    <div className="flex gap-2">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-semibold">{resource.category}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-semibold capitalize">{resource.type}</span>
                    </div>
                  </div>
                </a>
              ))}
              {filteredResources.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                  No resources found matching your criteria.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'faq' && (
        <div className="animate-fade-in">

          {loading ? (
            <p className="text-muted">Loading FAQs...</p>
          ) : (
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={faq.id} className="card relative p-6">
                  <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--color-dark-navy)' }}>{faq.question}</h3>
                  <p className="text-muted leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResourceBoard;
