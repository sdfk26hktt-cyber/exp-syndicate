import React, { useState } from 'react';
import { useAgent } from '../context/AgentContext';
import { useCommunity } from '../context/CommunityContext';
import { UserPlus, Search, Shield, Video, Calendar, Plus, Check, X, MessageSquare, Send } from 'lucide-react';
import KanbanBoard from './KanbanBoard';
import FullCalendar from './FullCalendar';
import CommunityFeed from './CommunityFeed';

const AdminDashboard = () => {
  const { agents, addAgent, getRank, adminSettings } = useAgent();
  const { events, addPost, addEvent, approveEvent, rejectEvent, chats, sendMessage } = useCommunity();
  
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'community' | 'calendar' | 'inbox' | 'feed-preview'

  const [newAgentEmail, setNewAgentEmail] = useState('');
  const [newAgentName, setNewAgentName] = useState('');
  
  // Sponsor fields - initialized from global settings
  const [sponsorName, setSponsorName] = useState(adminSettings.defaultSponsor.name);
  const [sponsorPhone, setSponsorPhone] = useState(adminSettings.defaultSponsor.phone);
  const [sponsorEmail, setSponsorEmail] = useState(adminSettings.defaultSponsor.email);
  
  // Co-Sponsor fields
  const [coSponsorName, setCoSponsorName] = useState('');
  const [coSponsorPhone, setCoSponsorPhone] = useState('');
  const [coSponsorEmail, setCoSponsorEmail] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);

  // Community Feed State
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMedia, setNewPostMedia] = useState('');
  const [newPostAudio, setNewPostAudio] = useState('');
  const [newPostPresentation, setNewPostPresentation] = useState('');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');

  // Inbox State
  const [activeChatId, setActiveChatId] = useState(null);
  const [adminReply, setAdminReply] = useState('');

  const pendingEvents = events.filter(e => e.status === 'pending');

  const handleAddAgent = (e) => {
    e.preventDefault();
    if (newAgentEmail && newAgentName) {
      const sponsorData = { name: sponsorName, phone: sponsorPhone, email: sponsorEmail };
      let coSponsorData = null;
      if (coSponsorName) {
        coSponsorData = { name: coSponsorName, phone: coSponsorPhone, email: coSponsorEmail };
      }
      
      addAgent(newAgentEmail, newAgentName, sponsorData, coSponsorData);
      
      setNewAgentEmail('');
      setNewAgentName('');
      setCoSponsorName('');
      setCoSponsorPhone('');
      setCoSponsorEmail('');
      setShowAddForm(false);
    }
  };

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (newPostContent.trim() || newPostMedia.trim() || newPostAudio.trim() || newPostPresentation.trim()) {
      addPost(newPostContent, newPostMedia, newPostAudio, newPostPresentation);
      setNewPostContent('');
      setNewPostMedia('');
      setNewPostAudio('');
      setNewPostPresentation('');
      alert("Post published successfully!");
    }
  };

  const handleCreateEvent = (e) => {
    e.preventDefault();
    if (newEventTitle.trim() && newEventDate.trim() && newEventTime.trim()) {
      addEvent(newEventTitle, newEventDate, newEventTime, newEventDesc);
      setNewEventTitle('');
      setNewEventDate('');
      setNewEventTime('');
      setNewEventDesc('');
      alert("Event scheduled successfully!");
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Admin Dashboard</h1>
          <p className="text-muted">Manage your syndicate agents and track onboarding progress.</p>
        </div>
      </div>

      <div style={{ ...styles.tabsContainer, overflowX: 'auto', whiteSpace: 'nowrap' }}>
        <button 
          style={{...styles.tabBtn, ...(activeTab === 'pipeline' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('pipeline')}
        >
          Agent Pipeline
        </button>
        <button 
          style={{...styles.tabBtn, ...(activeTab === 'community' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('community')}
        >
          Community Manager
        </button>
        <button 
          style={{...styles.tabBtn, ...(activeTab === 'calendar' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('calendar')}
        >
          Calendar
        </button>
        <button 
          style={{...styles.tabBtn, ...(activeTab === 'inbox' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('inbox')}
        >
          Inbox
        </button>
        <button 
          style={{...styles.tabBtn, ...(activeTab === 'feed-preview' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('feed-preview')}
        >
          Feed Preview
        </button>
      </div>

      {activeTab === 'pipeline' && (
        <>
          <div className="flex justify-end mb-4">
            <button className="btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
              <UserPlus size={18} />
              Add Agent
            </button>
          </div>

          {showAddForm && (
            <div className="card mb-6" style={{backgroundColor: 'var(--color-frosted-blue)', borderColor: 'var(--color-slate-blue)'}}>
              <h3 className="text-lg mb-4 font-semibold text-dark-navy">Add New Agent</h3>
              <form onSubmit={handleAddAgent} style={styles.addForm}>
                <div style={styles.formSection}>
                  <h4 className="text-sm font-semibold mb-2 text-dark-navy">Agent Details</h4>
                  <div style={styles.formGrid}>
                    <input type="text" placeholder="Agent Name" style={styles.input} value={newAgentName} onChange={(e) => setNewAgentName(e.target.value)} required />
                    <input type="email" placeholder="Agent Email Address" style={styles.input} value={newAgentEmail} onChange={(e) => setNewAgentEmail(e.target.value)} required />
                  </div>
                </div>

                <div style={styles.formSection}>
                  <h4 className="text-sm font-semibold mb-2 text-dark-navy">Primary Sponsor</h4>
                  <div style={styles.formGrid}>
                    <input type="text" placeholder="Sponsor Name" style={styles.input} value={sponsorName} onChange={(e) => setSponsorName(e.target.value)} required />
                    <input type="text" placeholder="Sponsor Phone" style={styles.input} value={sponsorPhone} onChange={(e) => setSponsorPhone(e.target.value)} required />
                    <input type="email" placeholder="Sponsor Email" style={styles.input} value={sponsorEmail} onChange={(e) => setSponsorEmail(e.target.value)} required />
                  </div>
                </div>

                <div style={styles.formSection}>
                  <h4 className="text-sm font-semibold mb-2 text-dark-navy">Co-Sponsor (Optional)</h4>
                  <div style={styles.formGrid}>
                    <input type="text" placeholder="Co-Sponsor Name" style={styles.input} value={coSponsorName} onChange={(e) => setCoSponsorName(e.target.value)} />
                    <input type="text" placeholder="Co-Sponsor Phone" style={styles.input} value={coSponsorPhone} onChange={(e) => setCoSponsorPhone(e.target.value)} />
                    <input type="email" placeholder="Co-Sponsor Email" style={styles.input} value={coSponsorEmail} onChange={(e) => setCoSponsorEmail(e.target.value)} />
                  </div>
                </div>
                <button type="submit" className="btn-primary" style={{backgroundColor: 'var(--color-dark-navy)', marginTop: '1rem'}}>Invite Agent</button>
              </form>
            </div>
          )}

          <div className="card">
            <div style={styles.tableHeader}>
              <h2 className="text-lg m-0">Agent Kanban Pipeline</h2>
              <div style={styles.searchBox}>
                <Search size={18} color="var(--color-moss-grey)" style={{ marginLeft: '8px' }} />
                <input type="text" placeholder="Search agents..." style={styles.searchInput} />
              </div>
            </div>
            <KanbanBoard />
          </div>
        </>
      )}

      {activeTab === 'community' && (
        <>
          {pendingEvents.length > 0 && (
            <div className="card mb-6" style={{borderColor: 'var(--color-primary)', backgroundColor: 'rgba(0, 161, 224, 0.05)'}}>
              <h2 style={{marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-dark-navy)'}}>
                <Shield size={20} /> Pending Event Approvals
              </h2>
              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                {pendingEvents.map(evt => (
                  <div key={evt.id} style={styles.pendingEventCard}>
                    <div style={{flexGrow: 1}}>
                      <h4 style={{margin: 0, color: 'var(--color-dark-navy)'}}>{evt.title}</h4>
                      <p style={{margin: '0.25rem 0', fontSize: '0.85rem', color: 'var(--color-text-muted)'}}>
                        {new Date(evt.date).toLocaleDateString()} at {evt.time}
                      </p>
                      {evt.description && <p style={{margin: 0, fontSize: '0.85rem', color: 'var(--color-text-main)'}}>{evt.description}</p>}
                    </div>
                    <div style={{display: 'flex', gap: '0.5rem'}}>
                      <button onClick={() => approveEvent(evt.id)} className="btn-primary" style={{backgroundColor: 'var(--color-success)', padding: '0.5rem'}}>
                        <Check size={16} /> Approve
                      </button>
                      <button onClick={() => rejectEvent(evt.id)} className="btn-primary" style={{backgroundColor: 'var(--color-error)', padding: '0.5rem'}}>
                        <X size={16} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        <div style={styles.communityGrid}>
          {/* Create Post Section */}
          <div className="card">
            <h2 style={{marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-dark-navy)'}}>
              <Video size={20} /> Create Feed Post
            </h2>
            <form onSubmit={handleCreatePost} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <div>
                <label style={styles.label}>Post Content (Markdown Supported)</label>
                <textarea
                  placeholder="What do you want to share? Use # for headers, * for lists."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  style={styles.textArea}
                  rows={4}
                />
              </div>
              <div>
                <label style={styles.label}>Media URL or Embed Code</label>
                <textarea
                  placeholder="Paste a YouTube/Vimeo URL, OR a raw <iframe> embed code."
                  value={newPostMedia}
                  onChange={(e) => setNewPostMedia(e.target.value)}
                  style={styles.textArea}
                  rows={2}
                />
                <p style={styles.helpText}>Raw HTML like &lt;iframe&gt; or &lt;script&gt; is supported for advanced widgets.</p>
              </div>
              <div>
                <label style={styles.label}>Audio URL (e.g. NotebookLM Deep Dive)</label>
                <input
                  type="text"
                  placeholder="Paste a link to an .mp3 file"
                  value={newPostAudio}
                  onChange={(e) => setNewPostAudio(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>Presentation URL</label>
                <input
                  type="text"
                  placeholder="Paste a link to a PDF, Google Slide, or Canva deck"
                  value={newPostPresentation}
                  onChange={(e) => setNewPostPresentation(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                <button type="submit" className="btn-primary" disabled={!newPostContent.trim() && !newPostMedia.trim() && !newPostAudio.trim() && !newPostPresentation.trim()}>
                  Publish to Feed
                </button>
              </div>
            </form>
          </div>

          {/* Schedule Event Section */}
          <div className="card">
            <h2 style={{marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-dark-navy)'}}>
              <Calendar size={20} /> Schedule Training Event
            </h2>
            <form onSubmit={handleCreateEvent} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <div>
                <label style={styles.label}>Event Title</label>
                <input type="text" placeholder="e.g., Weekly Mastermind" value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} style={styles.input} required />
              </div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <div>
                  <label style={styles.label}>Date</label>
                  <input type="date" value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} style={styles.input} required />
                </div>
                <div>
                  <label style={styles.label}>Time</label>
                  <input type="time" value={newEventTime} onChange={(e) => setNewEventTime(e.target.value)} style={styles.input} required />
                </div>
              </div>
              <div>
                <label style={styles.label}>Description</label>
                <textarea placeholder="Event details..." value={newEventDesc} onChange={(e) => setNewEventDesc(e.target.value)} style={styles.textArea} rows={3} />
              </div>
              <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                <button type="submit" className="btn-primary" disabled={!newEventTitle.trim()}>
                  Schedule Event
                </button>
              </div>
            </form>
          </div>
          </div>
        </>
      )}

      {activeTab === 'calendar' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <FullCalendar />
        </div>
      )}

      {activeTab === 'inbox' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', height: '600px' }}>
          {/* Thread List */}
          <div style={{ width: '300px', borderRight: '1px solid var(--color-border)', overflowY: 'auto', backgroundColor: 'var(--color-background)' }}>
            <h3 style={{ padding: '1rem', margin: 0, borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-card-bg)' }}>
              Messages
            </h3>
            {Object.keys(chats).length === 0 ? (
              <p style={{ padding: '1rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>No messages yet.</p>
            ) : (
              Object.entries(chats).map(([agentId, chatData]) => (
                <div 
                  key={agentId} 
                  onClick={() => setActiveChatId(agentId)}
                  style={{
                    padding: '1rem', 
                    cursor: 'pointer', 
                    borderBottom: '1px solid var(--color-border)',
                    backgroundColor: activeChatId === agentId ? 'var(--color-white)' : 'transparent',
                    borderLeft: activeChatId === agentId ? '3px solid var(--color-primary)' : '3px solid transparent'
                  }}
                >
                  <div style={{ fontWeight: '600', color: 'var(--color-dark-navy)' }}>{chatData.agentName}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {chatData.messages[chatData.messages.length - 1]?.text || 'Started chat'}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Active Chat Window */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-white)' }}>
            {activeChatId && chats[activeChatId] ? (
              <>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MessageSquare size={18} /> Chatting with {chats[activeChatId].agentName}
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {chats[activeChatId].messages.map((msg, idx) => (
                    <div key={idx} style={{
                      alignSelf: msg.sender === 'Admin' ? 'flex-end' : 'flex-start',
                      backgroundColor: msg.sender === 'Admin' ? 'var(--color-primary)' : 'var(--color-frosted-blue)',
                      color: msg.sender === 'Admin' ? 'white' : 'var(--color-dark-navy)',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      maxWidth: '75%'
                    }}>
                      <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '0.25rem' }}>{msg.sender}</div>
                      <div>{msg.text}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    value={adminReply}
                    onChange={(e) => setAdminReply(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && adminReply.trim()) {
                        sendMessage(activeChatId, chats[activeChatId].agentName, adminReply, true);
                        setAdminReply('');
                      }
                    }}
                    placeholder="Type your reply..."
                    style={{ ...styles.input, flex: 1 }}
                  />
                  <button 
                    onClick={() => {
                      if (adminReply.trim()) {
                        sendMessage(activeChatId, chats[activeChatId].agentName, adminReply, true);
                        setAdminReply('');
                      }
                    }}
                    className="btn-primary"
                    disabled={!adminReply.trim()}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                Select a conversation to start messaging.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'feed-preview' && (
        <div style={{ borderRadius: 'var(--border-radius-md)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
          <CommunityFeed />
        </div>
      )}
    </div>
  );
};

const styles = {
  tabsContainer: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
    borderBottom: '1px solid var(--color-border)',
  },
  tabBtn: {
    padding: '0.75rem 1.5rem',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--color-moss-grey)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  activeTab: {
    color: 'var(--color-primary)',
    borderBottomColor: 'var(--color-primary)',
  },
  communityGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '1.5rem',
  },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--color-dark-navy)',
    marginBottom: '0.5rem',
  },
  pendingEventCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'var(--color-white)',
    padding: '1rem',
    borderRadius: 'var(--border-radius-sm)',
    border: '1px solid var(--color-border)',
  },
  textArea: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: 'var(--border-radius-sm)',
    border: '1px solid var(--color-border)',
    fontFamily: 'inherit',
    fontSize: '0.95rem',
    resize: 'vertical',
    outline: 'none',
  },
  helpText: {
    fontSize: '0.75rem',
    color: 'var(--color-text-muted)',
    marginTop: '0.25rem',
  },
  addForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  formSection: {
    marginBottom: '1rem',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
  },
  input: {
    padding: '0.6rem 1rem',
    borderRadius: 'var(--border-radius-sm)',
    border: '1px solid var(--color-border)',
    outline: 'none',
    width: '100%',
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--border-radius-sm)',
  },
  searchInput: {
    border: 'none',
    padding: '0.5rem',
    outline: 'none',
    background: 'transparent',
  }
};

export default AdminDashboard;
