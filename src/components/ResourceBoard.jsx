import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { 
  Search, FileText, Video, Link as LinkIcon, Book, Plus, Trash2, 
  Shield, Edit2, CheckCircle2, ExternalLink, X, Save, Sparkles, FolderPlus 
} from 'lucide-react';

const DEFAULT_RESOURCES = [
  { id: 'res-1', title: 'eXp Enterprise Portal', category: 'Tech Setup', type: 'link', url: 'https://expenterprise.com', description: 'Single sign-on dashboard for all eXp apps and tools.' },
  { id: 'res-2', title: 'Follow Up Boss CRM', category: 'Tech Setup', type: 'link', url: 'https://crm.followupboss.com', description: 'Main team CRM for lead management and smart lists.' },
  { id: 'res-3', title: 'Sisu Production Dashboard', category: 'Finance', type: 'link', url: 'https://sisu.co', description: 'Track your daily conversations, appointments, and closed volume.' },
  { id: 'res-4', title: 'Sierra Interactive Search', category: 'Marketing', type: 'link', url: 'https://ephomesonline.com', description: 'Search portal and featured MLS listings for clients.' },
  { id: 'res-5', title: 'TREC Relationship Management Tool', category: 'Tech Setup', type: 'link', url: 'https://mylicense.trec.texas.gov/', description: 'Transfer or verify your license sponsorship under eXp Realty.' },
  { id: 'res-6', title: 'eXp World Virtual Campus', category: 'Training', type: 'link', url: 'https://expworldholdings.com/exp-world/', description: 'Download and enter the 3D virtual campus for tech support and broker rooms.' },
  { id: 'res-7', title: 'SkySlope Transaction Management', category: 'Finance', type: 'link', url: 'https://skyslope.com', description: 'Upload contracts, disclosures, and closing documents for brokerage compliance.' },
  { id: 'res-8', title: 'BuildASign Enterprise Portal', category: 'Marketing', type: 'link', url: 'https://www.buildasign.com/realestate/exp', description: 'Order your first 1,000 free business cards and yard signs.' }
];

const DEFAULT_QUICK_REFS = [
  { id: 'qref-1', title: 'eXp Realty Broker License #', description: '603392', category: 'Quick Reference', type: 'quick_ref', url: '#' },
  { id: 'qref-2', title: 'Brian Burds Cell / Launch Line', description: '(915) 256-6989', category: 'Quick Reference', type: 'quick_ref', url: '#' },
  { id: 'qref-3', title: 'Texas Broker Support Email', description: 'tx.broker@exprealty.net', category: 'Quick Reference', type: 'quick_ref', url: '#' },
  { id: 'qref-4', title: 'eXp World Tech Support', description: 'Tech Outpost in eXp World', category: 'Quick Reference', type: 'quick_ref', url: '#' }
];

const DEFAULT_FAQS = [
  { id: 'faq-1', question: 'How long does broker sponsorship transfer take in TREC?', answer: 'Once you submit your sponsorship request to eXp Realty LLC (License #603392) in TREC REALM, the Texas broker team usually approves it within 24 business hours. If delayed, email tx.broker@exprealty.net with your personal code.' },
  { id: 'faq-2', question: 'How do I claim and host Syndicate Open Houses?', answer: 'Navigate to the Open Houses tab in the portal. Find an active listing in your market area (El Paso or Texas), click Claim Slot, and prepare your sign-in QR and flyers.' },
  { id: 'faq-3', question: 'When do I get my @exprealty.com email and FUB access?', answer: 'Your eXp email is generated within 24 hours of ICA completion. Once active, reach out to David Bitoon or Brenda Faudoa to set up your Follow Up Boss seat.' },
  { id: 'faq-4', question: 'Where do I submit my completed transaction documents?', answer: 'All Texas contracts, addenda, and closing settlement statements must be uploaded to SkySlope under eXp Realty LLC for compliance review.' }
];

const ResourceBoard = () => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('resources');
  
  const [resources, setResources] = useState([]);
  const [quickRefs, setQuickRefs] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successToast, setSuccessToast] = useState('');

  // Admin form modals
  const [showAddResource, setShowAddResource] = useState(false);
  const [showAddFaq, setShowAddFaq] = useState(false);
  const [showAddQuickRef, setShowAddQuickRef] = useState(false);
  
  const [editingResourceId, setEditingResourceId] = useState(null);
  const [editingQuickRefId, setEditingQuickRefId] = useState(null);
  const [editingFaqId, setEditingFaqId] = useState(null);
  
  const [resTitle, setResTitle] = useState('');
  const [resCategory, setResCategory] = useState('Tech Setup');
  const [resType, setResType] = useState('link');
  const [resUrl, setResUrl] = useState('');
  const [resDesc, setResDesc] = useState('');
  
  const [faqQ, setFaqQ] = useState('');
  const [faqA, setFaqA] = useState('');
  
  const [qRefLabel, setQRefLabel] = useState('');
  const [qRefValue, setQRefValue] = useState('');

  const syncToFallbackConfig = async (updatedResources, updatedQuickRefs, updatedFaqs) => {
    try {
      localStorage.setItem('syndicate_resources_cache', JSON.stringify({
        resources: updatedResources,
        quickRefs: updatedQuickRefs,
        faqs: updatedFaqs
      }));

      if (supabase) {
        await supabase.from('agents').upsert([{
          id: '__SYSTEM_CONFIG_RESOURCES__',
          name: 'Resources & FAQs Config',
          status: 'system',
          profile: {
            resources: updatedResources,
            quickRefs: updatedQuickRefs,
            faqs: updatedFaqs,
            updated_at: new Date().toISOString()
          }
        }]);
      }
    } catch (e) {
      console.debug('Fallback sync:', e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    let loadedRes = [];
    let loadedQRef = [];
    let loadedFaq = [];

    try {
      if (supabase) {
        const [resData, faqData, sysConfig] = await Promise.all([
          supabase.from('resources').select('*'),
          supabase.from('faqs').select('*'),
          supabase.from('agents').select('*').eq('id', '__SYSTEM_CONFIG_RESOURCES__').maybeSingle()
        ]);

        if (resData.data && resData.data.length > 0) {
          loadedRes = resData.data.filter(r => r.type !== 'quick_ref');
          loadedQRef = resData.data.filter(r => r.type === 'quick_ref');
        } else if (sysConfig.data?.profile?.resources) {
          loadedRes = sysConfig.data.profile.resources;
          loadedQRef = sysConfig.data.profile.quickRefs || DEFAULT_QUICK_REFS;
        }

        if (faqData.data && faqData.data.length > 0) {
          loadedFaq = faqData.data;
        } else if (sysConfig.data?.profile?.faqs) {
          loadedFaq = sysConfig.data.profile.faqs;
        }
      }
    } catch (err) {
      console.debug('Supabase resource load error:', err);
    }

    // Fallback to local storage or defaults
    if (loadedRes.length === 0) {
      const cached = localStorage.getItem('syndicate_resources_cache');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          loadedRes = parsed.resources || DEFAULT_RESOURCES;
          loadedQRef = parsed.quickRefs || DEFAULT_QUICK_REFS;
          loadedFaq = parsed.faqs || DEFAULT_FAQS;
        } catch (e) {
          loadedRes = DEFAULT_RESOURCES;
          loadedQRef = DEFAULT_QUICK_REFS;
          loadedFaq = DEFAULT_FAQS;
        }
      } else {
        loadedRes = DEFAULT_RESOURCES;
        loadedQRef = DEFAULT_QUICK_REFS;
        loadedFaq = DEFAULT_FAQS;
      }
    }

    setResources(loadedRes);
    setQuickRefs(loadedQRef);
    setFaqs(loadedFaq);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  const handleSaveResource = async (e) => {
    e.preventDefault();
    const resDataPayload = {
      id: editingResourceId || `res-${Date.now()}`,
      title: resTitle,
      category: resCategory,
      type: resType,
      url: resUrl,
      description: resDesc
    };
    
    let updated;
    if (editingResourceId) {
      updated = resources.map(r => r.id === editingResourceId ? resDataPayload : r);
      if (supabase) {
        try { await supabase.from('resources').update(resDataPayload).eq('id', editingResourceId); } catch (e) { console.debug(e); }
      }
      showToast(`Updated "${resTitle}"`);
    } else {
      updated = [...resources, resDataPayload];
      if (supabase) {
        try { await supabase.from('resources').insert([resDataPayload]); } catch (e) { console.debug(e); }
      }
      showToast(`Added "${resTitle}"`);
    }

    setResources(updated);
    await syncToFallbackConfig(updated, quickRefs, faqs);
    setShowAddResource(false);
    setEditingResourceId(null);
    setResTitle(''); setResUrl(''); setResDesc('');
  };

  const openEditResource = (res) => {
    setEditingResourceId(res.id);
    setResTitle(res.title);
    setResCategory(res.category);
    setResType(res.type);
    setResUrl(res.url);
    setResDesc(res.description || '');
    setShowAddResource(true);
  };

  const handleDeleteResource = async (id, isQuickRef = false) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    if (isQuickRef) {
      const updated = quickRefs.filter(r => r.id !== id);
      setQuickRefs(updated);
      if (supabase) {
        try { await supabase.from('resources').delete().eq('id', id); } catch (e) { console.debug(e); }
      }
      await syncToFallbackConfig(resources, updated, faqs);
      showToast("Deleted quick reference.");
    } else {
      const updated = resources.filter(r => r.id !== id);
      setResources(updated);
      if (supabase) {
        try { await supabase.from('resources').delete().eq('id', id); } catch (e) { console.debug(e); }
      }
      await syncToFallbackConfig(updated, quickRefs, faqs);
      showToast("Deleted resource.");
    }
  };

  const handleSaveQuickRef = async (e) => {
    e.preventDefault();
    const qRefPayload = {
      id: editingQuickRefId || `qref-${Date.now()}`,
      title: qRefLabel,
      description: qRefValue,
      category: 'Quick Reference',
      type: 'quick_ref',
      url: '#'
    };

    let updated;
    if (editingQuickRefId) {
      updated = quickRefs.map(r => r.id === editingQuickRefId ? qRefPayload : r);
      if (supabase) {
        try { await supabase.from('resources').update(qRefPayload).eq('id', editingQuickRefId); } catch (e) { console.debug(e); }
      }
      showToast(`Updated quick reference "${qRefLabel}"`);
    } else {
      updated = [...quickRefs, qRefPayload];
      if (supabase) {
        try { await supabase.from('resources').insert([qRefPayload]); } catch (e) { console.debug(e); }
      }
      showToast(`Added quick reference "${qRefLabel}"`);
    }

    setQuickRefs(updated);
    await syncToFallbackConfig(resources, updated, faqs);
    setShowAddQuickRef(false);
    setEditingQuickRefId(null);
    setQRefLabel(''); setQRefValue('');
  };

  const openEditQuickRef = (ref) => {
    setEditingQuickRefId(ref.id);
    setQRefLabel(ref.title);
    setQRefValue(ref.description);
    setShowAddQuickRef(true);
  };

  const handleSaveFaq = async (e) => {
    e.preventDefault();
    const faqPayload = {
      id: editingFaqId || `faq-${Date.now()}`,
      question: faqQ,
      answer: faqA
    };

    let updated;
    if (editingFaqId) {
      updated = faqs.map(f => f.id === editingFaqId ? faqPayload : f);
      if (supabase) {
        try { await supabase.from('faqs').update(faqPayload).eq('id', editingFaqId); } catch (e) { console.debug(e); }
      }
      showToast(`Updated FAQ`);
    } else {
      updated = [...faqs, faqPayload];
      if (supabase) {
        try { await supabase.from('faqs').insert([faqPayload]); } catch (e) { console.debug(e); }
      }
      showToast(`Added FAQ`);
    }

    setFaqs(updated);
    await syncToFallbackConfig(resources, quickRefs, updated);
    setShowAddFaq(false);
    setEditingFaqId(null);
    setFaqQ(''); setFaqA('');
  };

  const openEditFaq = (faq) => {
    setEditingFaqId(faq.id);
    setFaqQ(faq.question);
    setFaqA(faq.answer);
    setShowAddFaq(true);
  };

  const handleDeleteFaq = async (id) => {
    if (!window.confirm("Are you sure you want to delete this FAQ?")) return;
    const updated = faqs.filter(f => f.id !== id);
    setFaqs(updated);
    if (supabase) {
      try { await supabase.from('faqs').delete().eq('id', id); } catch (e) { console.debug(e); }
    }
    await syncToFallbackConfig(resources, quickRefs, updated);
    showToast("Deleted FAQ.");
  };

  const categories = ['All', 'Tech Setup', 'Marketing', 'Training', 'Finance'];

  const filteredResources = resources.filter(resource => {
    const matchesSearch = (resource.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (resource.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || resource.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const getIcon = (type) => {
    switch(type) {
      case 'document': return <FileText size={22} color="var(--color-primary)" />;
      case 'video': return <Video size={22} color="var(--color-primary)" />;
      case 'link': return <LinkIcon size={22} color="var(--color-primary)" />;
      default: return <FileText size={22} color="var(--color-primary)" />;
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0.5rem 0' }}>
      
      {/* Success Notification */}
      {successToast && (
        <div style={{
          backgroundColor: '#ecfdf5',
          color: '#065f46',
          border: '1px solid #a7f3d0',
          padding: '0.85rem 1.25rem',
          borderRadius: '10px',
          marginBottom: '1.25rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle2 size={18} color="#059669" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header & Admin Controls */}
      <div style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '14px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>Syndicate Resource & Knowledge Board</h1>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              Indexed broker links, CRM logins, closing compliance tools, and support contacts.
            </p>
          </div>

          {isAdmin && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setEditingResourceId(null);
                  setResTitle(''); setResUrl(''); setResDesc(''); setResCategory('Tech Setup');
                  setShowAddResource(true);
                }}
                className="btn-primary"
                style={{ padding: '0.5rem 0.85rem', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Plus size={15} /> Add Resource Link
              </button>
              <button
                onClick={() => {
                  setEditingQuickRefId(null);
                  setQRefLabel(''); setQRefValue('');
                  setShowAddQuickRef(true);
                }}
                className="btn-secondary"
                style={{ padding: '0.5rem 0.85rem', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Plus size={15} /> Add Quick Ref
              </button>
              <button
                onClick={() => {
                  setEditingFaqId(null);
                  setFaqQ(''); setFaqA('');
                  setShowAddFaq(true);
                }}
                className="btn-secondary"
                style={{ padding: '0.5rem 0.85rem', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Plus size={15} /> Add FAQ
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Reference Directory Strip */}
      <div style={{
        backgroundColor: '#1e293b',
        color: '#ffffff',
        borderRadius: '14px',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Book size={18} color="#38bdf8" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>Quick Reference Directory</h2>
          </div>
          {isAdmin && (
            <button
              onClick={() => {
                setEditingQuickRefId(null);
                setQRefLabel(''); setQRefValue('');
                setShowAddQuickRef(true);
              }}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#ffffff',
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <Plus size={13} /> Add
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.85rem' }}>
          {quickRefs.map((ref) => (
            <div 
              key={ref.id} 
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                position: 'relative',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, marginBottom: '0.25rem' }}>
                {ref.title}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700, color: '#ffffff', wordBreak: 'break-all' }}>
                {ref.description}
              </div>
              {isAdmin && (
                <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.25rem' }}>
                  <button
                    onClick={() => openEditQuickRef(ref)}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.2rem' }}
                    title="Edit quick reference"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDeleteResource(ref.id, true)}
                    style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0.2rem' }}
                    title="Delete quick reference"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Important Contacts Board */}
      <div style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '14px',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-main)' }}>
          <Shield size={18} color="var(--color-primary)" /> Important Leadership & Support Contacts
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.85rem' }}>
          <div style={{ backgroundColor: 'var(--color-background)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700, margin: '0 0 0.35rem 0' }}>Texas Managing Broker</h3>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.15rem' }}>Karen Richards</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>tx.broker@exprealty.net</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>eXp Realty LLC Lic #603392</div>
          </div>
          <div style={{ backgroundColor: 'var(--color-background)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700, margin: '0 0 0.35rem 0' }}>Listing & Open House Coord</h3>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.15rem' }}>Lucy Elizando</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>915-320-5457</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>lucy@brianburds.com</div>
          </div>
          <div style={{ backgroundColor: 'var(--color-background)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700, margin: '0 0 0.35rem 0' }}>Lead & Zillow Manager</h3>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.15rem' }}>David Bitoon</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>915-800-7543</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>david@brianburds.com</div>
          </div>
          <div style={{ backgroundColor: 'var(--color-background)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700, margin: '0 0 0.35rem 0' }}>eXp Corporate Tech Support</h3>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.15rem' }}>Agent Tech Desk</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>support@exprealty.com</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>Tech Outpost in eXp World</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--color-border)', marginBottom: '1.5rem', gap: '1rem' }}>
        <button 
          style={{
            padding: '0.75rem 1.5rem',
            background: 'none',
            border: 'none',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            color: activeTab === 'resources' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            borderBottom: activeTab === 'resources' ? '3px solid var(--color-primary)' : '3px solid transparent',
            marginBottom: '-2px'
          }}
          onClick={() => setActiveTab('resources')}
        >
          Tools & Resource Links ({resources.length})
        </button>
        <button 
          style={{
            padding: '0.75rem 1.5rem',
            background: 'none',
            border: 'none',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            color: activeTab === 'faq' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            borderBottom: activeTab === 'faq' ? '3px solid var(--color-primary)' : '3px solid transparent',
            marginBottom: '-2px'
          }}
          onClick={() => setActiveTab('faq')}
        >
          Knowledge Base & FAQs ({faqs.length})
        </button>
      </div>

      {/* Tab 1: Resources & Links */}
      {activeTab === 'resources' && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '260px', maxWidth: '400px' }}>
              <Search size={16} color="var(--color-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search resources, documents, logins..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: activeCategory === cat ? 'var(--color-primary)' : 'var(--color-border)',
                    color: activeCategory === cat ? '#ffffff' : 'var(--color-text-muted)'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p style={{ color: 'var(--color-text-muted)', padding: '2rem', textAlign: 'center' }}>Loading resources...</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {filteredResources.map(resource => (
                <div 
                  key={resource.id} 
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    position: 'relative'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div style={{ padding: '0.5rem', backgroundColor: 'rgba(37, 99, 235, 0.08)', borderRadius: '8px' }}>
                        {getIcon(resource.type)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)', padding: '0.15rem 0.5rem', borderRadius: '999px' }}>
                          {resource.category}
                        </span>
                        {isAdmin && (
                          <div style={{ display: 'flex', gap: '0.2rem', marginLeft: '0.25rem' }}>
                            <button
                              onClick={() => openEditResource(resource)}
                              style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '0.2rem' }}
                              title="Edit Resource"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteResource(resource.id)}
                              style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '0.2rem' }}
                              title="Delete Resource"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 0.35rem 0', color: 'var(--color-text-main)' }}>
                      {resource.title}
                    </h3>
                    <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', margin: '0 0 1rem 0', lineHeight: 1.4 }}>
                      {resource.description || 'Access and manage this syndicate resource.'}
                    </p>
                  </div>

                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      padding: '0.5rem 1rem',
                      fontSize: '0.825rem',
                      textDecoration: 'none',
                      borderRadius: '8px'
                    }}
                  >
                    <span>Open {resource.type === 'video' ? 'Video' : resource.type === 'document' ? 'Document' : 'Resource'}</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: FAQs */}
      {activeTab === 'faq' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {faqs.map(faq => (
            <div 
              key={faq.id} 
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '1.25rem 1.5rem',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--color-text-main)' }}>
                  {faq.question}
                </h3>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      onClick={() => openEditFaq(faq)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '0.2rem' }}
                      title="Edit FAQ"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteFaq(faq.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '0.2rem' }}
                      title="Delete FAQ"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Resource Modal */}
      {showAddResource && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '14px',
            padding: '1.75rem', width: '100%', maxWidth: '520px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                {editingResourceId ? 'Edit Resource Link' : 'Add New Resource Link'}
              </h3>
              <button onClick={() => setShowAddResource(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveResource} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>Resource Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dotloop Compliance Login"
                  value={resTitle}
                  onChange={(e) => setResTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>Category</label>
                  <select
                    value={resCategory}
                    onChange={(e) => setResCategory(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                  >
                    <option value="Tech Setup">Tech Setup</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Training">Training</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>Resource Type</label>
                  <select
                    value={resType}
                    onChange={(e) => setResType(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                  >
                    <option value="link">Web Link</option>
                    <option value="document">Document / PDF</option>
                    <option value="video">Video Course</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>Destination URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={resUrl}
                  onChange={(e) => setResUrl(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>Short Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief note on what this link is used for..."
                  value={resDesc}
                  onChange={(e) => setResDesc(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAddResource(false)} className="btn-secondary" style={{ padding: '0.55rem 1rem' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '0.55rem 1.25rem' }}>
                  {editingResourceId ? 'Save Changes' : 'Create Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Quick Reference Modal */}
      {showAddQuickRef && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '14px',
            padding: '1.75rem', width: '100%', maxWidth: '480px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                {editingQuickRefId ? 'Edit Quick Reference' : 'Add Quick Reference'}
              </h3>
              <button onClick={() => setShowAddQuickRef(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveQuickRef} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>Reference Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. eXp Realty Texas Tax ID"
                  value={qRefLabel}
                  onChange={(e) => setQRefLabel(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>Value / Code / Contact *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 12-3456789"
                  value={qRefValue}
                  onChange={(e) => setQRefValue(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '8px', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAddQuickRef(false)} className="btn-secondary" style={{ padding: '0.55rem 1rem' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '0.55rem 1.25rem' }}>
                  {editingQuickRefId ? 'Save Changes' : 'Add Quick Reference'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit FAQ Modal */}
      {showAddFaq && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '14px',
            padding: '1.75rem', width: '100%', maxWidth: '520px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                {editingFaqId ? 'Edit Knowledge Base FAQ' : 'Add Knowledge Base FAQ'}
              </h3>
              <button onClick={() => setShowAddFaq(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveFaq} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>Question *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. How do I order sign riders?"
                  value={faqQ}
                  onChange={(e) => setFaqQ(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>Answer & Guidance *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Detailed answer explaining steps, contacts, or links..."
                  value={faqA}
                  onChange={(e) => setFaqA(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAddFaq(false)} className="btn-secondary" style={{ padding: '0.55rem 1rem' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '0.55rem 1.25rem' }}>
                  {editingFaqId ? 'Save Changes' : 'Create FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ResourceBoard;

