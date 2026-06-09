import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAgent } from '../context/AgentContext';
import { useCommunity } from '../context/CommunityContext';
import { UserPlus, Search, Shield, Video, Calendar, Plus, Check, X, MessageSquare, Send, Edit2, LogIn, Trash2 } from 'lucide-react';
import FullCalendar from './FullCalendar';
import CommunityFeed from './CommunityFeed';
import LocationAutocomplete from './LocationAutocomplete';
import ResourceBoard from './ResourceBoard';
import { supabase } from '../lib/supabase';
import ErrorBoundary from './ErrorBoundary';
import PlaybookManager from './PlaybookManager';

const AdminDashboard = () => {
  const { emulateUser } = useAuth();
  const { agents, addAgent, getRank, adminSettings, updateAgentStatus, adminUpdateAgent, deleteAgent } = useAgent();
  const { events, posts, addPost, updatePost, deletePost, addEvent, updateEvent, deleteEvent, approveEvent, rejectEvent, chats, sendMessage } = useCommunity();
  
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'community' | 'calendar' | 'inbox' | 'feed-preview' | 'admins' | 'playbooks'
  
  // Admin Management State
  const [adminsList, setAdminsList] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const { data, error } = await supabase.from('admins').select('*');
      if (error) {
        if (error.code === '42P01') {
           // Table does not exist yet
           setAdminsList([{email: 'Table not created yet. Check instructions.'}]);
        } else {
          console.error(error);
        }
      } else if (data) {
        setAdminsList(data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoadingAdmins(false);
  };

  React.useEffect(() => {
    if (activeTab === 'admins') {
      fetchAdmins();
    }
  }, [activeTab]);

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;
    try {
      const { error } = await supabase.from('admins').insert([{ email: newAdminEmail }]);
      if (error) throw error;
      setNewAdminEmail('');
      fetchAdmins();
      alert('Admin added successfully!');
    } catch (err) {
      alert('Error adding admin: ' + err.message);
    }
  };

  const handleRemoveAdmin = async (emailToRemove) => {
    if(emailToRemove === 'brian@brianburds.com' || emailToRemove === 'brenda@brianburds.com') {
      alert("Cannot remove master admin.");
      return;
    }
    try {
      const { error } = await supabase.from('admins').delete().eq('email', emailToRemove);
      if (error) throw error;
      fetchAdmins();
    } catch (err) {
      alert('Error removing admin: ' + err.message);
    }
  };

  const [newAgentCoSponsor, setNewAgentCoSponsor] = useState('');
  
  // Edit Agent State
  const [editingAgent, setEditingAgent] = useState(null);
  const [editAgentName, setEditAgentName] = useState('');
  const [editAgentPhone, setEditAgentPhone] = useState('');
  const [editAgentLicense, setEditAgentLicense] = useState('');
  
  const handleEditAgentSubmit = async (e) => {
    e.preventDefault();
    if (!editingAgent) return;
    
    await adminUpdateAgent(editingAgent.id, editAgentName, {
      phone: editAgentPhone,
      licenseNumber: editAgentLicense
    });
    setEditingAgent(null);
    alert("Agent updated successfully!");
  };
  const [newAgentEmail, setNewAgentEmail] = useState('');
  const [newAgentName, setNewAgentName] = useState('');
  const [newUserRole, setNewUserRole] = useState('agent');
  
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
  const [newPostTags, setNewPostTags] = useState('');
  const [newPostResources, setNewPostResources] = useState([]);
  const [availableResources, setAvailableResources] = useState([]);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventEndTime, setNewEventEndTime] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [editingEventId, setEditingEventId] = useState(null);

  // Post Management State
  const [editingPostId, setEditingPostId] = useState(null);
  const [editPostForm, setEditPostForm] = useState({ text: '', media: '', audio: '', presentation: '', tags: '' });

  // Inbox State
  const [activeChatId, setActiveChatId] = useState(null);
  const [adminReply, setAdminReply] = useState('');

  // Calendar Filter State
  const [eventFilterMonth, setEventFilterMonth] = useState(new Date().getMonth().toString());
  const [eventFilterYear, setEventFilterYear] = useState(new Date().getFullYear().toString());
  
  const [expandedAgentGroups, setExpandedAgentGroups] = useState({
    onboarding: true,
    flex_agent: false,
    team_agent: false
  });
  
  const toggleAgentGroup = (group) => {
    setExpandedAgentGroups(prev => ({...prev, [group]: !prev[group]}));
  };

  const pendingEvents = events.filter(e => e.status === 'pending');
  
  const approvedEvents = events.filter(e => {
    if (e.status !== 'approved') return false;
    if (eventFilterMonth === 'all' && eventFilterYear === 'all') return true;
    
    // Parse event date reliably without timezone shifting
    let eDate;
    if (e.date && e.date.includes('-')) {
      const [y, m, d] = e.date.split('-');
      eDate = new Date(y, m - 1, d);
    } else {
      eDate = new Date(e.date);
    }

    if (isNaN(eDate.getTime())) return true; // Show if invalid date to be safe

    const matchMonth = eventFilterMonth === 'all' || eDate.getMonth().toString() === eventFilterMonth;
    const matchYear = eventFilterYear === 'all' || eDate.getFullYear().toString() === eventFilterYear;
    return matchMonth && matchYear;
  });

  React.useEffect(() => {
    const fetchResources = async () => {
      try {
        const { data } = await supabase.from('resources').select('*');
        if (data) setAvailableResources(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchResources();
  }, []);

  const handleAddAgent = async (e) => {
    e.preventDefault();
    if (newAgentEmail && newAgentName) {
      if (newUserRole === 'admin') {
        try {
          const { error } = await supabase.from('admins').insert([{ email: newAgentEmail }]);
          if (error) throw error;
          fetchAdmins();
          alert('Admin added successfully!');
        } catch (err) {
          alert('Error adding admin: ' + err.message);
          return;
        }
      } else {
        const sponsorData = { name: sponsorName, phone: sponsorPhone, email: sponsorEmail };
        let coSponsorData = null;
        if (coSponsorName) {
          coSponsorData = { name: coSponsorName, phone: coSponsorPhone, email: coSponsorEmail };
        }
        addAgent(newAgentEmail, newAgentName, sponsorData, coSponsorData);
      }
      
      setNewAgentEmail('');
      setNewAgentName('');
      setCoSponsorName('');
      setCoSponsorPhone('');
      setCoSponsorEmail('');
      setNewUserRole('agent');
      setShowAddForm(false);
    }
  };

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (newPostContent.trim() || newPostMedia.trim() || newPostAudio.trim() || newPostPresentation.trim()) {
      const tagsArray = newPostTags.split(',').map(t => t.trim()).filter(t => t);
      const selectedResourceObjects = availableResources.filter(r => newPostResources.includes(r.id));
      addPost(newPostContent, newPostMedia, newPostAudio, newPostPresentation, tagsArray, selectedResourceObjects);
      setNewPostContent('');
      setNewPostMedia('');
      setNewPostAudio('');
      setNewPostPresentation('');
      setNewPostTags('');
      setNewPostResources([]);
      alert("Post published successfully!");
    }
  };

  const startEditPost = (post) => {
    setEditingPostId(post.id);
    setEditPostForm({
      text: post.content || '',
      media: post.videoUrl || '',
      audio: post.audioUrl || '',
      presentation: post.presentationUrl || '',
      tags: post.tags ? post.tags.join(', ') : ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const savePostEdit = (postId) => {
    updatePost(postId, {
      text: editPostForm.text,
      media: editPostForm.media,
      audio: editPostForm.audio,
      presentation: editPostForm.presentation,
      tags: editPostForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      attached_resources: posts.find(p => p.id === postId)?.attachedResources || []
    });
    setEditingPostId(null);
    alert("Post updated successfully!");
  };

  const handleCreateEvent = (e) => {
    e.preventDefault();
    if (newEventTitle.trim() && newEventDate.trim() && newEventTime.trim()) {
      if (editingEventId) {
        updateEvent(editingEventId, {
          title: newEventTitle,
          date: newEventDate,
          time: newEventTime,
          endTime: newEventEndTime,
          location: newEventLocation,
          description: newEventDesc
        });
        alert("Event updated successfully!");
      } else {
        addEvent(newEventTitle, newEventDate, newEventTime, newEventEndTime, newEventLocation, newEventDesc);
        alert("Event scheduled successfully!");
      }
      
      setNewEventTitle('');
      setNewEventDate('');
      setNewEventTime('');
      setNewEventEndTime('');
      setNewEventLocation('');
      setNewEventDesc('');
      setEditingEventId(null);
    }
  };

  const startEditingEvent = (evt) => {
    setEditingEventId(evt.id);
    setNewEventTitle(evt.title || '');
    setNewEventDate(evt.date || '');
    setNewEventTime(evt.time || '');
    setNewEventEndTime(evt.endTime || '');
    setNewEventLocation(evt.location || '');
    setNewEventDesc(evt.description || '');
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
          Agent Pipeline & Admins
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
          style={{...styles.tabBtn, ...(activeTab === 'resources' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('resources')}
        >
          Resources & Playbooks
        </button>
        <button 
          style={{...styles.tabBtn, ...(activeTab === 'inbox' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('inbox')}
        >
          Inbox
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
              <h3 className="text-lg mb-4 font-semibold text-dark-navy">Add New User</h3>
              <form onSubmit={handleAddAgent} style={styles.addForm}>
                <div style={styles.formSection}>
                  <h4 className="text-sm font-semibold mb-2 text-dark-navy">User Details</h4>
                  <div style={{...styles.formGrid, gridTemplateColumns: '1fr 1fr 1fr'}}>
                    <select style={styles.input} value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)}>
                      <option value="agent">Agent</option>
                      <option value="admin">Administrator</option>
                    </select>
                    <input type="text" placeholder="Full Name" style={styles.input} value={newAgentName} onChange={(e) => setNewAgentName(e.target.value)} required />
                    <input type="email" placeholder="Email Address" style={styles.input} value={newAgentEmail} onChange={(e) => setNewAgentEmail(e.target.value)} required />
                  </div>
                </div>

                {newUserRole === 'agent' && (
                  <>
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
                  </>
              )}
                <button type="submit" className="btn-primary" style={{backgroundColor: 'var(--color-dark-navy)', marginTop: '1rem'}}>Invite Agent</button>
              </form>
            </div>
          )}



          <div className="card mt-6">
            <div style={styles.tableHeader}>
              <h2 className="text-lg m-0">Agent Directory & Roles</h2>
              <p className="text-muted text-sm" style={{margin: 0}}>Graduate agents to specialized dashboards.</p>
            </div>
            <div style={{overflowX: 'auto'}}>
              <table style={styles.roleTable}>
                <thead>
                  <tr>
                    <th style={styles.roleTh}>Agent Name</th>
                    <th style={styles.roleTh}>Email</th>
                    <th style={styles.roleTh}>Current Role</th>
                    <th style={styles.roleTh}>XP</th>
                    <th style={styles.roleTh}>Actions</th>
                  </tr>
                </thead>
                <tbody>

                  {['onboarding', 'flex_agent', 'team_agent'].map(groupKey => {
                    const groupTitle = groupKey === 'onboarding' ? 'Onboarding' : groupKey === 'flex_agent' ? 'Flex Agents' : 'Team Agents';
                    const groupAgents = agents.filter(a => {
                      const s = a.status || 'onboarding';
                      if (groupKey === 'flex_agent') return s === 'flex_agent';
                      if (groupKey === 'team_agent') return s === 'team_agent';
                      return s !== 'flex_agent' && s !== 'team_agent';
                    });
                    
                    return (
                      <React.Fragment key={groupKey}>
                        <tr 
                          onClick={() => toggleAgentGroup(groupKey)}
                          style={{ cursor: 'pointer', backgroundColor: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}
                        >
                          <td colSpan="5" style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: 'var(--color-dark-navy)' }}>
                            {expandedAgentGroups[groupKey] ? '▼' : '▶'} {groupTitle} ({groupAgents.length})
                          </td>
                        </tr>
                        {expandedAgentGroups[groupKey] && groupAgents.length === 0 && (
                          <tr>
                            <td colSpan="5" style={{...styles.roleTd, textAlign: 'center', color: 'var(--color-text-muted)'}}>No agents in this group.</td>
                          </tr>
                        )}
                        {expandedAgentGroups[groupKey] && groupAgents.map(a => (
                          <tr key={a.id} style={styles.roleTr}>
                            <td style={styles.roleTd}>
                              <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                                <div style={{width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold'}}>
                                  {(a.name || '?').charAt(0)}
                                </div>
                                {a.name || 'Unknown Agent'}
                              </div>
                            </td>
                            <td style={styles.roleTd}>{a.id}</td>
                            <td style={styles.roleTd}>
                              <select 
                                value={a.status || 'onboarding'} 
                                onChange={(e) => updateAgentStatus(a.id, e.target.value)}
                                style={styles.roleSelect}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <option value="onboarding">Onboarding</option>
                                <option value="flex_agent">Flex Agent</option>
                                <option value="team_agent">Team Agent</option>
                              </select>
                            </td>
                            <td style={styles.roleTd}>{a.xp || 0}</td>
                            <td style={styles.roleTd}>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingAgent(a);
                                    setEditAgentName(a.name || '');
                                    setEditAgentPhone(a.profile?.phone || '');
                                    setEditAgentLicense(a.profile?.licenseNumber || '');
                                  }}
                                  className="btn-secondary"
                                  style={{ padding: '0.4rem', fontSize: '0.8rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
                                >
                                  <Edit2 size={14} /> Edit
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); emulateUser(a); }}
                                  className="btn-secondary"
                                  style={{ padding: '0.4rem', fontSize: '0.8rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
                                >
                                  <LogIn size={14} /> Log In As
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`Are you sure you want to delete ${a.name}? This action cannot be undone.`)) {
                                      deleteAgent(a.id);
                                    }
                                  }}
                                  className="btn-secondary"
                                  style={{ padding: '0.4rem', fontSize: '0.8rem', display: 'flex', gap: '0.25rem', alignItems: 'center', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                                >
                                  <Trash2 size={14} /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                  {agents.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{...styles.roleTd, textAlign: 'center', color: 'var(--color-text-muted)'}}>No agents found. Invite one above!</td>
                    </tr>
                  )}

                </tbody>
              </table>
            </div>

            {/* Edit Agent Modal */}
            {editingAgent && (
              <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <div className="card" style={{ width: '90%', maxWidth: '500px', backgroundColor: 'var(--color-white)', position: 'relative' }}>
                  <button 
                    onClick={() => setEditingAgent(null)}
                    style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <X size={20} color="var(--color-text-muted)" />
                  </button>
                  <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--color-dark-navy)' }}>Edit Agent Info</h2>
                  
                  <form onSubmit={handleEditAgentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={styles.label}>Agent Name</label>
                      <input 
                        type="text" 
                        value={editAgentName} 
                        onChange={(e) => setEditAgentName(e.target.value)} 
                        style={styles.input} 
                        required 
                      />
                    </div>
                    <div>
                      <label style={styles.label}>Email Address (Cannot be changed)</label>
                      <input 
                        type="text" 
                        value={editingAgent.id} 
                        style={{ ...styles.input, backgroundColor: '#f5f5f5', color: '#999' }} 
                        disabled 
                      />
                    </div>
                    <div>
                      <label style={styles.label}>Phone Number</label>
                      <input 
                        type="tel" 
                        value={editAgentPhone} 
                        onChange={(e) => setEditAgentPhone(e.target.value)} 
                        style={styles.input} 
                      />
                    </div>
                    <div>
                      <label style={styles.label}>License Number</label>
                      <input 
                        type="text" 
                        value={editAgentLicense} 
                        onChange={(e) => setEditAgentLicense(e.target.value)} 
                        style={styles.input} 
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                      <button type="button" className="btn-secondary" onClick={() => setEditingAgent(null)}>Cancel</button>
                      <button type="submit" className="btn-primary">Save Changes</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
          
          <div className="card mt-8">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Shield size={20} className="text-primary"/> Administrator List</h3>
            {loadingAdmins ? (
              <p>Loading...</p>
            ) : (
              <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                    <tr>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem' }}>Email</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.875rem' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>brian@brianburds.com (Master)</td>
                      <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', textAlign: 'right' }}>--</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>brenda@brianburds.com (Master)</td>
                      <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', textAlign: 'right' }}>--</td>
                    </tr>
                    {adminsList.map((admin, idx) => {
                      if (admin.email === 'brian@brianburds.com' || admin.email === 'brenda@brianburds.com') return null;
                      return (
                        <tr key={idx}>
                          <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>{admin.email}</td>
                          <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', textAlign: 'right' }}>
                            <button 
                              onClick={() => handleRemoveAdmin(admin.email)}
                              style={{ color: 'var(--color-danger)', fontSize: '0.875rem' }}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'community' && (
        <ErrorBoundary>
        <>
          {pendingEvents.length > 0 && (
            <div className="card mb-6" style={{borderColor: 'var(--color-primary)', backgroundColor: 'rgba(0, 161, 224, 0.05)'}}>
              <h2 style={{marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-dark-navy)'}}>
                <Shield size={20} /> Pending Event Approvals
              </h2>
              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem'}}>
                {pendingEvents.map(evt => (
                  <div key={evt.id} style={styles.pendingEventCard}>
                    <div style={{flexGrow: 1}}>
                      <h4 style={{margin: 0, color: 'var(--color-dark-navy)'}}>{evt.title}</h4>
                      <p style={{margin: '0.25rem 0', fontSize: '0.85rem', color: 'var(--color-text-muted)'}}>
                        {evt.date && !isNaN(new Date(evt.date + 'T12:00:00').getTime()) ? new Date(evt.date + 'T12:00:00').toLocaleDateString() : (evt.date || 'No Date')} {evt.time && `at ${evt.time}`} {evt.endTime && `- ${evt.endTime}`} {evt.location && `| ${evt.location}`}
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

          {events.some(e => e.status === 'approved') && (
            <div className="card mb-6" style={{borderColor: 'var(--color-primary)', backgroundColor: 'rgba(0, 161, 224, 0.05)'}}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-dark-navy)'}}>
                  <Calendar size={20} /> Manage Calendar Events
                </h2>
                
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <select 
                    value={eventFilterMonth} 
                    onChange={(e) => setEventFilterMonth(e.target.value)}
                    style={{...styles.input, width: 'auto', padding: '0.4rem'}}
                  >
                    <option value="all">All Months</option>
                    <option value="0">January</option>
                    <option value="1">February</option>
                    <option value="2">March</option>
                    <option value="3">April</option>
                    <option value="4">May</option>
                    <option value="5">June</option>
                    <option value="6">July</option>
                    <option value="7">August</option>
                    <option value="8">September</option>
                    <option value="9">October</option>
                    <option value="10">November</option>
                    <option value="11">December</option>
                  </select>
                  
                  <select 
                    value={eventFilterYear} 
                    onChange={(e) => setEventFilterYear(e.target.value)}
                    style={{...styles.input, width: 'auto', padding: '0.4rem'}}
                  >
                    <option value="all">All Years</option>
                    {[0, 1, 2, 3].map(offset => {
                      const y = new Date().getFullYear() + offset - 1; // Show last year, this year, next two years
                      return <option key={y} value={y.toString()}>{y}</option>
                    })}
                  </select>
                </div>
              </div>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem'}}>
                {approvedEvents.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No events found for this timeframe.</p>
                ) : (
                  approvedEvents.map(evt => (
                  <div key={evt.id} style={styles.pendingEventCard}>
                    <div style={{flexGrow: 1}}>
                      <h4 style={{margin: 0, color: 'var(--color-dark-navy)'}}>{evt.title}</h4>
                      <p style={{margin: '0.25rem 0', fontSize: '0.85rem', color: 'var(--color-text-muted)'}}>
                        {evt.date && !isNaN(new Date(evt.date + 'T12:00:00').getTime()) ? new Date(evt.date + 'T12:00:00').toLocaleDateString() : (evt.date || 'No Date')} {evt.time && `at ${evt.time}`} {evt.endTime && `- ${evt.endTime}`} {evt.location && `| ${evt.location}`}
                      </p>
                      {evt.description && <p style={{margin: 0, fontSize: '0.85rem', color: 'var(--color-text-main)'}}>{evt.description}</p>}
                    </div>
                    <div style={{display: 'flex', gap: '0.5rem'}}>
                      <button onClick={() => startEditingEvent(evt)} className="btn-primary" style={{backgroundColor: 'var(--color-primary)', padding: '0.5rem'}}>
                        Edit
                      </button>
                      <button onClick={() => deleteEvent(evt.id)} className="btn-primary" style={{backgroundColor: 'var(--color-error)', padding: '0.5rem'}}>
                        <X size={16} /> Delete
                      </button>
                    </div>
                  </div>
                  ))
                )}
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
                  placeholder="Paste a link to a presentation (Canva, Google Slides, PDF)"
                  value={newPostPresentation}
                  onChange={(e) => setNewPostPresentation(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>Tags</label>
                <input
                  type="text"
                  placeholder="e.g. skyslope, onboarding, marketing"
                  value={newPostTags}
                  onChange={(e) => setNewPostTags(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>Attach Resources</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--color-border)', padding: '0.5rem', borderRadius: '8px' }}>
                  {availableResources.length === 0 ? <span className="text-muted text-sm">No resources available. Add some in the Resource Board.</span> : null}
                  {availableResources.map(res => (
                    <label key={res.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                      <input 
                        type="checkbox" 
                        checked={newPostResources.includes(res.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewPostResources([...newPostResources, res.id]);
                          } else {
                            setNewPostResources(newPostResources.filter(id => id !== res.id));
                          }
                        }}
                      />
                      {res.title} <span className="text-muted text-xs">({res.category})</span>
                    </label>
                  ))}
                </div>
              </div>
              <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                <button type="submit" className="btn-primary" disabled={!newPostContent.trim() && !newPostMedia.trim() && !newPostAudio.trim() && !newPostPresentation.trim()}>
                  Publish to Feed
                </button>
              </div>
            </form>
          </div>

          {/* Manage Published Posts Section */}
          <div className="card">
            <h2 style={{marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-dark-navy)'}}>
              <MessageSquare size={20} /> Manage Published Posts
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {posts.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No posts published yet.</p>
              ) : (
                posts.map(post => (
                  <div key={post.id} style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: '8px', backgroundColor: 'var(--color-bg-secondary)' }}>
                    {editingPostId === post.id ? (
                      <div className="flex flex-col gap-3">
                        <textarea 
                          value={editPostForm.text} 
                          onChange={e => setEditPostForm({...editPostForm, text: e.target.value})}
                          className="w-full p-2 border rounded resize-y"
                          rows={4}
                          placeholder="Post Content"
                        />
                        <input 
                          value={editPostForm.media} 
                          onChange={e => setEditPostForm({...editPostForm, media: e.target.value})}
                          className="w-full p-2 border rounded"
                          placeholder="Video URL (YouTube, Vimeo, Loom)"
                        />
                        <input 
                          value={editPostForm.audio} 
                          onChange={e => setEditPostForm({...editPostForm, audio: e.target.value})}
                          className="w-full p-2 border rounded"
                          placeholder="Audio URL"
                        />
                        <input 
                          value={editPostForm.presentation} 
                          onChange={e => setEditPostForm({...editPostForm, presentation: e.target.value})}
                          className="w-full p-2 border rounded"
                          placeholder="Presentation PDF URL"
                        />
                        <input 
                          value={editPostForm.tags} 
                          onChange={e => setEditPostForm({...editPostForm, tags: e.target.value})}
                          className="w-full p-2 border rounded"
                          placeholder="Tags (comma separated)"
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button onClick={() => setEditingPostId(null)} className="btn-secondary">Cancel</button>
                          <button onClick={() => savePostEdit(post.id)} className="btn-primary">Save Changes</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-bold text-dark-navy">{post.authorName}</span>
                            <span className="text-muted text-sm ml-2">{new Date(post.timestamp).toLocaleDateString()}</span>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => startEditPost(post)} className="text-gray-400 hover:text-primary transition-colors">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => { if(window.confirm('Delete this post?')) deletePost(post.id); }} className="text-red hover:opacity-80 transition-colors">
                              <Trash2 size={16} color="var(--color-alert)" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">
                          {post.content || <span className="italic text-muted">No text content</span>}
                        </p>
                        <div className="mt-2 flex gap-2">
                          {post.videoUrl && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Media</span>}
                          {post.audioUrl && <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Audio</span>}
                          {post.presentationUrl && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Presentation</span>}
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Schedule Event Section */}
          <div className="card">
            <h2 style={{marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-dark-navy)'}}>
              <Calendar size={20} /> {editingEventId ? 'Edit Training Event' : 'Create Training Event'}
            </h2>
            <form onSubmit={handleCreateEvent} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <div>
                <label style={styles.label}>Event Title</label>
                <input type="text" placeholder="e.g., Weekly Mastermind" value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} style={styles.input} required />
              </div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem'}}>
                <div>
                  <label style={styles.label}>Date</label>
                  <input type="date" value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} style={styles.input} required />
                </div>
                <div>
                  <label style={styles.label}>Start Time</label>
                  <input type="time" value={newEventTime} onChange={(e) => setNewEventTime(e.target.value)} style={styles.input} required />
                </div>
                <div>
                  <label style={styles.label}>End Time (Optional)</label>
                  <input type="time" value={newEventEndTime} onChange={(e) => setNewEventEndTime(e.target.value)} style={styles.input} />
                </div>
              </div>
              <div>
                <label style={styles.label}>Location / Link (Optional)</label>
                <LocationAutocomplete 
                  value={newEventLocation} 
                  onChange={setNewEventLocation} 
                  style={styles.input} 
                  placeholder="e.g., eXp World, Zoom link, or Office address"
                />
              </div>
              <div>
                <label style={styles.label}>Description</label>
                <textarea placeholder="Event details..." value={newEventDesc} onChange={(e) => setNewEventDesc(e.target.value)} style={styles.textArea} rows={3} />
              </div>
              <div style={{display: 'flex', justifyContent: 'flex-end', gap: '1rem'}}>
                {editingEventId && (
                  <button type="button" className="btn-secondary" onClick={() => {
                    setEditingEventId(null);
                    setNewEventTitle('');
                    setNewEventDate('');
                    setNewEventTime('');
                    setNewEventEndTime('');
                    setNewEventLocation('');
                    setNewEventDesc('');
                  }}>
                    Cancel Edit
                  </button>
                )}
                <button type="submit" className="btn-primary" disabled={!newEventTitle.trim()}>
                  {editingEventId ? 'Update Event' : 'Schedule Event'}
                </button>
              </div>
            </form>
          </div>
          </div>
        </>
        </ErrorBoundary>
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
                  {chats[activeChatId].messages.map((msg, idx) => {
                    if (msg.isSystemMessage) {
                      return (
                        <div key={idx} style={{
                          alignSelf: 'center',
                          backgroundColor: 'rgba(0,0,0,0.05)',
                          color: 'var(--color-text-muted)',
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                          fontWeight: '500',
                          maxWidth: '90%',
                          textAlign: 'center'
                        }}>
                          {msg.text}
                        </div>
                      )
                    }
                    
                    return (
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
                    );
                  })}
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

      {activeTab === 'resources' && (
        <>
          <div className="mt-4 border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
            <ResourceBoard />
          </div>

          <div className="mt-8">
            <PlaybookManager />
          </div>
        </>
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
  },
  roleTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '1rem',
  },
  roleTh: {
    textAlign: 'left',
    padding: '0.75rem',
    borderBottom: '2px solid var(--color-border)',
    color: 'var(--color-dark-navy)',
    fontWeight: '600',
  },
  roleTr: {
    borderBottom: '1px solid var(--color-border)',
  },
  roleTd: {
    padding: '1rem 0.75rem',
    verticalAlign: 'middle',
  },
  roleSelect: {
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid var(--color-border)',
    outline: 'none',
    backgroundColor: 'var(--color-background)',
    color: 'var(--color-dark-navy)',
    fontWeight: '500',
    cursor: 'pointer'
  }
};

export default AdminDashboard;
