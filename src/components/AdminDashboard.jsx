import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAgent } from '../context/AgentContext';
import { useCommunity } from '../context/CommunityContext';
import { useOpenHouse } from '../context/OpenHouseContext';
import { UserPlus, Search, Shield, Video, Calendar, Plus, Check, X, MessageSquare, Send, Edit2, LogIn, Trash2, KeyRound, Lock, Eye, EyeOff, Sparkles, Award, Star, Trophy, GraduationCap, Home, Building, FileText, RefreshCw } from 'lucide-react';
import FullCalendar from './FullCalendar';
import CommunityFeed from './CommunityFeed';
import LocationAutocomplete from './LocationAutocomplete';
import ResourceBoard from './ResourceBoard';
import { supabase } from '../lib/supabase';
import ErrorBoundary from './ErrorBoundary';
import PlaybookManager from './PlaybookManager';
import ClassroomManager from './Classroom/ClassroomManager';
import OpenHouseWeeklyReport from './OpenHouses/OpenHouseWeeklyReport';
import AgentAutocomplete from './AgentAutocomplete';
import LevelBadge from './Gamification/LevelBadge';
import { DEFAULT_LEVEL_THRESHOLDS, DEFAULT_PHASE_UNLOCK_LEVELS } from '../utils/gamification';

const AdminDashboard = () => {
  const { currentUser, emulateUser, resetPasswordForEmail } = useAuth();
  const { 
    agents, 
    addAgent, 
    getRank, 
    adminSettings, 
    updateAgentStatus, 
    adminUpdateAgent, 
    deleteAgent, 
    currentAgentData,
    awardAgentXp,
    gamificationSettings,
    updateGamificationSettings
  } = useAgent();
  const { events, posts, addPost, updatePost, deletePost, addEvent, updateEvent, deleteEvent, approveEvent, rejectEvent, chats, sendMessage } = useCommunity();
  const userName = currentAgentData?.name || currentUser?.name || currentUser?.email || 'Admin';
  
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'community' | 'calendar' | 'inbox' | 'feed-preview' | 'admins' | 'playbooks'
  
  // Admin Management State
  const [adminsList, setAdminsList] = useState(() => {
    try {
      const saved = localStorage.getItem('syndicate_admins_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.debug(e);
    }
    return [
      { email: 'brian@brianburds.com', name: 'Brian Burds', role: 'Master Admin' },
      { email: 'brenda@brianburds.com', name: 'Brenda Faudoa', role: 'Master Admin' }
    ];
  });
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    let currentAdmins = [
      { email: 'brian@brianburds.com', name: 'Brian Burds', role: 'Master Admin' },
      { email: 'brenda@brianburds.com', name: 'Brenda Faudoa', role: 'Master Admin' }
    ];

    try {
      // 1. Try public.admins table
      const { data, error } = await supabase.from('admins').select('*');
      if (!error && Array.isArray(data) && data.length > 0) {
        const combined = [...currentAdmins];
        data.forEach(item => {
          if (!combined.some(a => a.email.toLowerCase() === item.email.toLowerCase())) {
            combined.push(item);
          }
        });
        currentAdmins = combined;
      } else {
        // 2. Fallback to global_settings snapshot
        const { data: snapshot } = await supabase
          .from('global_settings')
          .select('*')
          .eq('id', 'syndicate_admins_snapshot')
          .single();
        if (snapshot?.data && Array.isArray(snapshot.data)) {
          const combined = [...currentAdmins];
          snapshot.data.forEach(item => {
            const email = typeof item === 'string' ? item : item.email;
            if (email && !combined.some(a => a.email.toLowerCase() === email.toLowerCase())) {
              combined.push(typeof item === 'string' ? { email, name: email.split('@')[0] } : item);
            }
          });
          currentAdmins = combined;
        }
      }
    } catch (err) {
      console.debug('Error fetching admins from Supabase:', err);
    }

    setAdminsList(currentAdmins);
    try {
      localStorage.setItem('syndicate_admins_list', JSON.stringify(currentAdmins));
    } catch (e) {
      console.debug(e);
    }
    setLoadingAdmins(false);
  };

  React.useEffect(() => {
    fetchAdmins();
  }, [activeTab]);

  const saveAdminUser = async (email, name, password) => {
    const normalizedEmail = (email || '').toLowerCase().trim();
    if (!normalizedEmail) return false;

    const adminObj = {
      email: normalizedEmail,
      name: name || normalizedEmail.split('@')[0],
      created_at: new Date().toISOString()
    };

    // 1. Try inserting into admins table
    try {
      await supabase.from('admins').upsert([adminObj], { onConflict: 'email' });
    } catch (tableErr) {
      console.debug('admins table not available, using snapshot fallback:', tableErr);
    }

    // 2. Update global_settings snapshot
    const updatedList = [...adminsList];
    const existingIndex = updatedList.findIndex(a => a.email.toLowerCase() === normalizedEmail);
    if (existingIndex >= 0) {
      updatedList[existingIndex] = { ...updatedList[existingIndex], ...adminObj };
    } else {
      updatedList.push(adminObj);
    }

    try {
      await supabase.from('global_settings').upsert([{
        id: 'syndicate_admins_snapshot',
        data: updatedList,
        updated_at: new Date().toISOString()
      }], { onConflict: 'id' });
    } catch (snapshotErr) {
      console.debug('global_settings admin snapshot fallback:', snapshotErr);
    }

    // 3. Update localStorage and state
    try {
      localStorage.setItem('syndicate_admins_list', JSON.stringify(updatedList));
    } catch (e) {
      console.debug(e);
    }
    setAdminsList(updatedList);

    // 4. Ensure agent record exists with status 'admin'
    try {
      await supabase.from('agents').upsert([{
        id: normalizedEmail,
        name: name || normalizedEmail.split('@')[0],
        status: 'admin',
        xp: 0,
        profile: { phone: '', role: 'Administrator' }
      }], { onConflict: 'id' });
    } catch (agentErr) {
      console.debug('agents table upsert notice for admin:', agentErr);
    }

    // 5. Auth signup if password provided
    if (password) {
      try {
        await supabase.auth.signUp({
          email: normalizedEmail,
          password: password
        });
      } catch (authErr) {
        console.debug('Admin pre-signup notice:', authErr);
      }
    }

    // 6. Send welcome email via /api/invite
    try {
      await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          name: name || normalizedEmail.split('@')[0],
          password: password || undefined
        })
      });
    } catch (inviteErr) {
      console.warn('Failed to trigger admin invite email:', inviteErr);
    }

    return true;
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;
    const normalizedEmail = newAdminEmail.toLowerCase().trim();
    try {
      await saveAdminUser(normalizedEmail, normalizedEmail.split('@')[0]);
      setNewAdminEmail('');
      await fetchAdmins();
      setActionSuccessMsg(`Admin ${normalizedEmail} added successfully!`);
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (err) {
      alert('Error adding admin: ' + err.message);
    }
  };

  const handleRemoveAdmin = async (emailToRemove) => {
    const normalized = (emailToRemove || '').toLowerCase().trim();
    if (normalized === 'brian@brianburds.com' || normalized === 'brenda@brianburds.com') {
      alert("Cannot remove master admin.");
      return;
    }
    try {
      try {
        await supabase.from('admins').delete().eq('email', normalized);
      } catch (e) {
        console.debug(e);
      }

      const updatedList = adminsList.filter(a => a.email.toLowerCase() !== normalized);
      try {
        await supabase.from('global_settings').upsert([{
          id: 'syndicate_admins_snapshot',
          data: updatedList,
          updated_at: new Date().toISOString()
        }], { onConflict: 'id' });
      } catch (e) {
        console.debug(e);
      }

      try {
        localStorage.setItem('syndicate_admins_list', JSON.stringify(updatedList));
      } catch (e) {
        console.debug(e);
      }
      setAdminsList(updatedList);
      setActionSuccessMsg(`Admin ${normalized} removed successfully.`);
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (err) {
      alert('Error removing admin: ' + err.message);
    }
  };

  const [newAgentCoSponsor, setNewAgentCoSponsor] = useState('');
  
  // Edit Agent State
  const [editingAgent, setEditingAgent] = useState(null);
  const [editAgentName, setEditAgentName] = useState('');
  const [editAgentPhone, setEditAgentPhone] = useState('');
  const [editAgentAltPhone, setEditAgentAltPhone] = useState('');
  const [editAgentAddress, setEditAgentAddress] = useState('');
  const [editAgentLicense, setEditAgentLicense] = useState('');
  const [editAgentEmergencyName, setEditAgentEmergencyName] = useState('');
  const [editAgentEmergencyPhone, setEditAgentEmergencyPhone] = useState('');
  
  const handleEditAgentSubmit = async (e) => {
    e.preventDefault();
    if (!editingAgent) return;
    
    await adminUpdateAgent(editingAgent.id, editAgentName, {
      phone: editAgentPhone,
      altPhone: editAgentAltPhone,
      address: editAgentAddress,
      licenseNumber: editAgentLicense,
      emergencyName: editAgentEmergencyName,
      emergencyPhone: editAgentEmergencyPhone
    });
    setEditingAgent(null);
    setActionSuccessMsg(`Updated contact information for ${editAgentName || editingAgent.id}`);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  // Award XP State
  const [awardingAgent, setAwardingAgent] = useState(null);
  const [awardXpAmount, setAwardXpAmount] = useState(50);
  const [awardXpCustom, setAwardXpCustom] = useState('');
  const [awardXpReason, setAwardXpReason] = useState('Hosting Team Open House');

  const handleAwardXpSubmit = async (e) => {
    e.preventDefault();
    if (!awardingAgent) return;
    const finalAmount = awardXpCustom !== '' ? Number(awardXpCustom) : Number(awardXpAmount);
    if (isNaN(finalAmount) || finalAmount === 0) {
      alert('Please enter a valid non-zero XP amount.');
      return;
    }
    await awardAgentXp(awardingAgent.id, finalAmount, awardXpReason || 'Admin XP Award');
    setActionSuccessMsg(`Awarded ${finalAmount > 0 ? '+' : ''}${finalAmount} XP to ${awardingAgent.name || awardingAgent.id}!`);
    setTimeout(() => setActionSuccessMsg(''), 4000);
    setAwardingAgent(null);
    setAwardXpCustom('');
  };

  // Gamification Settings State
  const [editableLevels, setEditableLevels] = useState(gamificationSettings?.levelThresholds || DEFAULT_LEVEL_THRESHOLDS);
  const [editablePhaseUnlocks, setEditablePhaseUnlocks] = useState(gamificationSettings?.phaseUnlockLevels || DEFAULT_PHASE_UNLOCK_LEVELS);
  const [gamificationSavedMsg, setGamificationSavedMsg] = useState('');

  React.useEffect(() => {
    if (gamificationSettings?.levelThresholds) {
      setEditableLevels(gamificationSettings.levelThresholds);
    }
    if (gamificationSettings?.phaseUnlockLevels) {
      setEditablePhaseUnlocks(gamificationSettings.phaseUnlockLevels);
    }
  }, [gamificationSettings]);

  const handleSaveGamification = async (e) => {
    e.preventDefault();
    await updateGamificationSettings({
      levelThresholds: editableLevels,
      phaseUnlockLevels: editablePhaseUnlocks
    });
    setGamificationSavedMsg('Gamification settings saved successfully!');
    setTimeout(() => setGamificationSavedMsg(''), 4000);
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

  // Password for new agent/admin
  const [newAgentPassword, setNewAgentPassword] = useState('');
  const [showNewAgentPassword, setShowNewAgentPassword] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  const generateRandomPassword = () => {
    const words = ['Syndicate', 'Realty', 'Victory', 'Summit', 'Apex', 'Premier', 'Champion'];
    const word = words[Math.floor(Math.random() * words.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    const special = '!#$*'[Math.floor(Math.random() * 4)];
    setNewAgentPassword(`${word}${num}${special}`);
  };

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
  const [newEventInstructor, setNewEventInstructor] = useState('');
  const [newEventSubmittedBy, setNewEventSubmittedBy] = useState(userName);
  const [editingEventId, setEditingEventId] = useState(null);

  React.useEffect(() => {
    if (!editingEventId && (!newEventSubmittedBy || newEventSubmittedBy === 'Admin') && userName) {
      setNewEventSubmittedBy(userName);
    }
  }, [userName, editingEventId]);

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
  
  // Open House Coordination State
  const { 
    listings, 
    bookings, 
    pendingApprovals, 
    approveBooking, 
    rejectBooking, 
    syncSisuListings, 
    isSyncing, 
    lastSyncedAt, 
    weeklyReportConfig, 
    updateWeeklyReportConfig, 
    sendWeeklyReportPrompt,
    toggleListingOpenHouseAvailability 
  } = useOpenHouse();
  
  const [approvingBookingId, setApprovingBookingId] = useState(null);
  const [isSendingReportPrompt, setIsSendingReportPrompt] = useState(false);
  const [showOpenHouseReportModal, setShowOpenHouseReportModal] = useState(false);
  const [openHouseListingSearch, setOpenHouseListingSearch] = useState('');

  const handleApproveOpenHouse = async (bookingId) => {
    setApprovingBookingId(bookingId);
    try {
      await approveBooking(bookingId, userName);
      setActionSuccessMsg("✅ Open House approved! Calendar appointment created in Follow Up Boss & confirmation texted via LinqApp.");
      setTimeout(() => setActionSuccessMsg(''), 5000);
    } catch (e) {
      alert("Error approving booking: " + e.message);
    } finally {
      setApprovingBookingId(null);
    }
  };

  const handleRejectOpenHouse = async (bookingId) => {
    const reason = prompt("Enter reason for rejection (optional):", "Schedule adjustment / conflicts");
    if (reason !== null) {
      await rejectBooking(bookingId, reason, userName);
      setActionSuccessMsg("Open House request declined.");
      setTimeout(() => setActionSuccessMsg(''), 4000);
    }
  };

  const handleSisuSync = async () => {
    const res = await syncSisuListings();
    setActionSuccessMsg(`Sisu listings refreshed (${res.count || listings.length} active listings).`);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  const handleTriggerReportNotification = async () => {
    const targetPhone = weeklyReportConfig.coordinator_phone || '+1 (915) 256-6989';
    const targetName = weeklyReportConfig.coordinator_name || 'Listing Coordinator';
    const digitsOnly = targetPhone.replace(/\D/g, '');
    
    if (digitsOnly === '19154947984' || digitsOnly === '9154947984') {
      alert("Notice: +1 (915) 494-7984 is the system's outbound LinqApp sending line. Please enter your mobile phone number in 'Coordinator Phone' so LinqApp can deliver the SMS to your personal device.");
      return;
    }

    setIsSendingReportPrompt(true);
    const res = await sendWeeklyReportPrompt(targetPhone, targetName);
    setIsSendingReportPrompt(false);
    if (res?.success) {
      setActionSuccessMsg(`📱 LinqApp review prompt sent successfully to ${targetPhone}!`);
      setTimeout(() => setActionSuccessMsg(''), 5000);
    } else {
      alert(`SMS Notification Notice: ${res?.error || 'Failed to dispatch Linq SMS. Please verify coordinator phone.'}`);
    }
  };

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

  const renderOpenHouseApprovalsCard = () => {
    if (!pendingApprovals || pendingApprovals.length === 0) return null;

    return (
      <div className="card mb-6" style={{borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.05)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)'}}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{marginTop: 0, marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-dark-navy)', fontSize: '1.2rem', fontWeight: 700}}>
            <Home size={22} style={{ color: 'var(--color-success)' }} /> Action Required: Open House Approvals ({pendingApprovals.length})
          </h2>
          <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', backgroundColor: 'white', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            Approving auto-creates FUB event with seller & texts hosting agent via LinqApp
          </span>
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.5rem'}}>
          {pendingApprovals.map(booking => {
            const listing = listings.find(l => l.id === booking.listing_id || l.sisu_listing_id === booking.listing_id);
            const displayAddress = listing?.address || booking.listing_address || 'Listing Address';
            const displayPrice = listing?.price_formatted || booking.listing_price || 'Listing';
            const displayListingAgent = listing?.listing_agent_name || booking.listing_agent_name || 'Syndicate';
            const leadId = listing?.seller_contact_id || booking.seller_contact_id;
            const sellerName = listing?.seller_contact_name || booking.seller_contact_name;

            return (
              <div key={booking.id} style={styles.pendingEventCard}>
                <div style={{flexGrow: 1}}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{
                      backgroundColor: 'var(--color-dark-navy)',
                      color: 'white',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 700
                    }}>
                      {displayPrice}
                    </span>
                    <h4 style={{margin: 0, color: 'var(--color-dark-navy)', fontSize: '1.05rem'}}>
                      {displayAddress}
                    </h4>
                  </div>
                  <p style={{margin: '0.25rem 0', fontSize: '0.85rem', color: 'var(--color-text-muted)'}}>
                    📅 <strong>{booking.date}</strong> at <strong>{booking.start_time} - {booking.end_time}</strong>
                  </p>
                  {booking.notes && (
                    <p style={{margin: '0.25rem 0', fontSize: '0.85rem', color: 'var(--color-text-main)', fontStyle: 'italic'}}>
                      📝 "{booking.notes}"
                    </p>
                  )}
                  <div style={{marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--color-slate-blue)', display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center'}}>
                    <span><strong>Requested By:</strong> {booking.agent_name} ({booking.agent_phone || booking.agent_id})</span>
                    <span><strong>Listing Agent:</strong> {displayListingAgent}</span>
                    {sellerName && <span><strong>Seller:</strong> {sellerName}</span>}
                    {leadId && (
                      <a 
                        href={`https://brianburds.followupboss.com/2/people/view/${leadId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          color: 'var(--color-primary)',
                          fontWeight: 700,
                          textDecoration: 'none',
                          backgroundColor: 'rgba(0, 161, 224, 0.1)',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '4px',
                          border: '1px solid rgba(0, 161, 224, 0.25)'
                        }}
                        title={`Open FUB Lead #${leadId}`}
                      >
                        👤 View Lead in FUB ↗
                      </a>
                    )}
                  </div>
                </div>
                <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
                  <button 
                    onClick={() => handleApproveOpenHouse(booking.id)} 
                    disabled={approvingBookingId === booking.id}
                    className="btn-primary" 
                    style={{backgroundColor: 'var(--color-success)', padding: '0.5rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem'}}
                  >
                    <Check size={16} /> {approvingBookingId === booking.id ? 'Approving...' : 'Approve & Sync FUB'}
                  </button>
                  <button 
                    onClick={() => handleRejectOpenHouse(booking.id)} 
                    className="btn-primary" 
                    style={{backgroundColor: 'var(--color-error)', padding: '0.5rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem'}}
                  >
                    <X size={16} /> Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const handleAddAgent = async (e) => {
    e.preventDefault();
    const normalizedEmail = newAgentEmail.toLowerCase().trim();
    if (normalizedEmail && newAgentName) {
      if (newUserRole === 'admin') {
        try {
          await saveAdminUser(normalizedEmail, newAgentName, newAgentPassword);
          await fetchAdmins();
          setActionSuccessMsg(`Admin ${newAgentName} added successfully!`);
          setTimeout(() => setActionSuccessMsg(''), 4000);
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
        await addAgent(normalizedEmail, newAgentName, sponsorData, coSponsorData, newAgentPassword);
        setActionSuccessMsg(`Agent ${newAgentName} invited successfully!`);
        setTimeout(() => setActionSuccessMsg(''), 4000);
      }
      
      setNewAgentEmail('');
      setNewAgentName('');
      setNewAgentPassword('');
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
          description: newEventDesc,
          instructor: newEventInstructor,
          submittedBy: newEventSubmittedBy || currentUser?.name || 'Admin'
        });
        alert("Event updated successfully!");
      } else {
        addEvent(
          newEventTitle, 
          newEventDate, 
          newEventTime, 
          newEventEndTime, 
          newEventLocation, 
          newEventDesc, 
          'general', 
          newEventInstructor, 
          newEventSubmittedBy || currentUser?.name || 'Admin'
        );
        alert("Event scheduled successfully!");
      }
      
      setNewEventTitle('');
      setNewEventDate('');
      setNewEventTime('');
      setNewEventEndTime('');
      setNewEventLocation('');
      setNewEventDesc('');
      setNewEventInstructor('');
      setNewEventSubmittedBy(userName);
      setEditingEventId(null);
    }
  };

  const startEditingEvent = (evt) => {
    setEditingEventId(evt.id);
    setNewEventTitle(evt.title || '');
    setNewEventDate(evt.date || '');
    setNewEventTime(evt.time || '');
    setNewEventEndTime(evt.endTime || evt.end_time || '');
    setNewEventLocation(evt.location || '');
    setNewEventDesc(evt.description || '');
    setNewEventInstructor(evt.instructor || '');
    setNewEventSubmittedBy(evt.submitted_by || evt.submittedBy || userName);
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
          Community & Open Houses
          {pendingApprovals.length > 0 && (
            <span style={{
              marginLeft: '0.5rem',
              backgroundColor: '#10b981',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.15rem 0.5rem',
              borderRadius: '10px'
            }}>
              {pendingApprovals.length}
            </span>
          )}
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
          style={{...styles.tabBtn, ...(activeTab === 'classroom' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('classroom')}
        >
          Classroom Builder
        </button>
        <button 
          style={{...styles.tabBtn, ...(activeTab === 'inbox' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('inbox')}
        >
          Inbox
        </button>
      </div>

      {actionSuccessMsg && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          color: 'var(--color-success)',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--border-radius-sm)',
          marginBottom: '1rem',
          fontWeight: '600',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Check size={18} /> {actionSuccessMsg}
        </div>
      )}

      {activeTab === 'pipeline' && (
        <>
          {renderOpenHouseApprovalsCard()}

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

                <div style={styles.formSection}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <h4 className="text-sm font-semibold m-0 text-dark-navy flex items-center gap-1">
                      <Lock size={14} /> Initial Password (Optional)
                    </h4>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="btn-secondary"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'var(--color-white)' }}
                    >
                      <Sparkles size={12} color="var(--color-primary)" /> Generate Password
                    </button>
                  </div>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input 
                      type={showNewAgentPassword ? 'text' : 'password'} 
                      placeholder="Leave blank for code-only login, or set/generate a password" 
                      style={{...styles.input, width: '100%', paddingRight: '2.5rem'}} 
                      value={newAgentPassword} 
                      onChange={(e) => setNewAgentPassword(e.target.value)} 
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewAgentPassword(!showNewAgentPassword)}
                      style={{ position: 'absolute', right: '0.75rem', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      {showNewAgentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0 0' }}>
                    If provided, the password will be created and included in their welcome email. Users can also log in via OTP code at any time.
                  </p>
                </div>

                {newUserRole === 'agent' && (
                  <>
                <div style={styles.formSection}>
                  <h4 className="text-sm font-semibold mb-2 text-dark-navy">Primary Sponsor</h4>
                  <AgentAutocomplete 
                    agents={agents} 
                    placeholder="Search existing agents to auto-fill sponsor details..."
                    onSelect={(agent) => {
                      setSponsorName(agent.name || '');
                      setSponsorEmail(agent.id || '');
                      setSponsorPhone(agent.profile?.phone || '');
                    }}
                  />
                  <div style={styles.formGrid}>
                    <input type="text" placeholder="Sponsor Name" style={styles.input} value={sponsorName} onChange={(e) => setSponsorName(e.target.value)} required />
                    <input type="text" placeholder="Sponsor Phone" style={styles.input} value={sponsorPhone} onChange={(e) => setSponsorPhone(e.target.value)} required />
                    <input type="email" placeholder="Sponsor Email" style={styles.input} value={sponsorEmail} onChange={(e) => setSponsorEmail(e.target.value)} required />
                  </div>
                </div>

                <div style={styles.formSection}>
                  <h4 className="text-sm font-semibold mb-2 text-dark-navy">Co-Sponsor (Optional)</h4>
                  <AgentAutocomplete 
                    agents={agents} 
                    placeholder="Search existing agents to auto-fill co-sponsor details..."
                    onSelect={(agent) => {
                      setCoSponsorName(agent.name || '');
                      setCoSponsorEmail(agent.id || '');
                      setCoSponsorPhone(agent.profile?.phone || '');
                    }}
                  />
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
                              <div style={{display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap'}}>
                                <div style={{width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold'}}>
                                  {(a.name || '?').charAt(0)}
                                </div>
                                <span style={{ fontWeight: '500', color: 'var(--color-dark-navy)' }}>{a.name || 'Unknown Agent'}</span>
                                <LevelBadge 
                                  xp={a.xp || 0} 
                                  thresholds={gamificationSettings?.levelThresholds} 
                                  size="xs" 
                                />
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
                            <td style={styles.roleTd}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '700', color: 'var(--color-primary)', backgroundColor: 'rgba(0, 161, 224, 0.08)', padding: '3px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>
                                <Star size={12} fill="var(--color-primary)" /> {a.xp || 0} XP
                              </span>
                            </td>
                            <td style={styles.roleTd}>
                              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAwardingAgent(a);
                                    setAwardXpAmount(50);
                                    setAwardXpCustom('');
                                    setAwardXpReason('Hosting Team Open House');
                                  }}
                                  className="btn-secondary"
                                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', display: 'flex', gap: '0.25rem', alignItems: 'center', color: 'var(--color-primary)', borderColor: 'var(--color-primary)', backgroundColor: 'rgba(0, 161, 224, 0.05)' }}
                                  title="Award custom XP to this agent"
                                >
                                  <Award size={14} /> Award XP
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingAgent(a);
                                    setEditAgentName(a.name || '');
                                    setEditAgentPhone(a.profile?.phone || '');
                                    setEditAgentAltPhone(a.profile?.altPhone || '');
                                    setEditAgentAddress(a.profile?.address || '');
                                    setEditAgentLicense(a.profile?.licenseNumber || '');
                                    setEditAgentEmergencyName(a.profile?.emergencyName || '');
                                    setEditAgentEmergencyPhone(a.profile?.emergencyPhone || '');
                                  }}
                                  className="btn-secondary"
                                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
                                >
                                  <Edit2 size={14} /> Edit
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); emulateUser(a); }}
                                  className="btn-secondary"
                                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
                                >
                                  <LogIn size={14} /> Log In As
                                </button>
                                <button 
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`Send password reset email to ${a.id}?`)) {
                                      try {
                                        await resetPasswordForEmail(a.id);
                                        setActionSuccessMsg(`Password reset link sent to ${a.id}`);
                                        setTimeout(() => setActionSuccessMsg(''), 4000);
                                      } catch (err) {
                                        alert(`Failed to send password reset: ${err.message}`);
                                      }
                                    }
                                  }}
                                  className="btn-secondary"
                                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
                                  title="Send Password Reset Email"
                                >
                                  <KeyRound size={14} /> Reset Pass
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`Are you sure you want to delete ${a.name}? This action cannot be undone.`)) {
                                      deleteAgent(a.id);
                                    }
                                  }}
                                  className="btn-secondary"
                                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', display: 'flex', gap: '0.25rem', alignItems: 'center', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
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
                <div className="card" style={{ width: '90%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: 'var(--color-white)', position: 'relative' }}>
                  <button 
                    onClick={() => setEditingAgent(null)}
                    style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <X size={20} color="var(--color-text-muted)" />
                  </button>
                  <h2 style={{ marginTop: 0, marginBottom: '0.25rem', color: 'var(--color-dark-navy)' }}>Edit Agent Information</h2>
                  <p className="text-xs text-muted mb-4">Update contact information and profile for {editingAgent.name || editingAgent.id}</p>
                  
                  <form onSubmit={handleEditAgentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div style={styles.formGrid}>
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
                        <label style={styles.label}>Email Address (Read-only)</label>
                        <input 
                          type="text" 
                          value={editingAgent.id} 
                          style={{ ...styles.input, backgroundColor: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }} 
                          disabled 
                        />
                      </div>
                    </div>

                    <div style={styles.formGrid}>
                      <div>
                        <label style={styles.label}>Primary Phone</label>
                        <input 
                          type="tel" 
                          placeholder="(555) 000-0000"
                          value={editAgentPhone} 
                          onChange={(e) => setEditAgentPhone(e.target.value)} 
                          style={styles.input} 
                        />
                      </div>
                      <div>
                        <label style={styles.label}>Alternative Phone</label>
                        <input 
                          type="tel" 
                          placeholder="(555) 999-9999"
                          value={editAgentAltPhone} 
                          onChange={(e) => setEditAgentAltPhone(e.target.value)} 
                          style={styles.input} 
                        />
                      </div>
                    </div>

                    <div style={styles.formGrid}>
                      <div>
                        <label style={styles.label}>License Number</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 0748392"
                          value={editAgentLicense} 
                          onChange={(e) => setEditAgentLicense(e.target.value)} 
                          style={styles.input} 
                        />
                      </div>
                      <div>
                        <label style={styles.label}>Mailing / Office Address</label>
                        <input 
                          type="text" 
                          placeholder="123 Main St, City, ST, ZIP"
                          value={editAgentAddress} 
                          onChange={(e) => setEditAgentAddress(e.target.value)} 
                          style={styles.input} 
                        />
                      </div>
                    </div>

                    <div style={styles.formGrid}>
                      <div>
                        <label style={styles.label}>Emergency Contact Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Jane Doe"
                          value={editAgentEmergencyName} 
                          onChange={(e) => setEditAgentEmergencyName(e.target.value)} 
                          style={styles.input} 
                        />
                      </div>
                      <div>
                        <label style={styles.label}>Emergency Contact Phone</label>
                        <input 
                          type="tel" 
                          placeholder="(555) 000-0000"
                          value={editAgentEmergencyPhone} 
                          onChange={(e) => setEditAgentEmergencyPhone(e.target.value)} 
                          style={styles.input} 
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.75rem' }}>
                      <button type="button" className="btn-secondary" onClick={() => setEditingAgent(null)}>Cancel</button>
                      <button type="submit" className="btn-primary">Save Changes</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Award XP Modal */}
            {awardingAgent && (
              <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <div className="card" style={{ width: '90%', maxWidth: '480px', backgroundColor: 'var(--color-white)', position: 'relative' }}>
                  <button 
                    onClick={() => setAwardingAgent(null)}
                    style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <X size={20} color="var(--color-text-muted)" />
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <Award size={22} color="var(--color-primary)" />
                    <h2 style={{ margin: 0, color: 'var(--color-dark-navy)' }}>Award Agent XP</h2>
                  </div>
                  <p className="text-xs text-muted mb-4">Grant engagement, milestone, or achievement XP to <strong>{awardingAgent.name || awardingAgent.id}</strong>.</p>
                  
                  <form onSubmit={handleAwardXpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={styles.label}>Select Preset Amount</label>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {[10, 25, 50, 100, 250, 500].map(amt => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => { setAwardXpAmount(amt); setAwardXpCustom(''); }}
                            style={{
                              padding: '0.4rem 0.75rem',
                              borderRadius: '8px',
                              border: '1px solid var(--color-border)',
                              backgroundColor: (awardXpCustom === '' && awardXpAmount === amt) ? 'var(--color-primary)' : 'var(--color-background)',
                              color: (awardXpCustom === '' && awardXpAmount === amt) ? 'white' : 'var(--color-dark-navy)',
                              fontWeight: '600',
                              cursor: 'pointer',
                              fontSize: '0.85rem'
                            }}
                          >
                            +{amt} XP
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={styles.label}>Or Custom Amount (+ / -)</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 75, 150, -20" 
                        value={awardXpCustom} 
                        onChange={(e) => setAwardXpCustom(e.target.value)} 
                        style={styles.input} 
                      />
                    </div>

                    <div>
                      <label style={styles.label}>Reason / Note</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Hosting Open House, Live Training, Closed Listing" 
                        value={awardXpReason} 
                        onChange={(e) => setAwardXpReason(e.target.value)} 
                        style={styles.input} 
                        required 
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button type="button" onClick={() => setAwardingAgent(null)} className="btn-secondary">Cancel</button>
                      <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Sparkles size={16} /> Award {awardXpCustom !== '' ? awardXpCustom : `+${awardXpAmount}`} XP
                      </button>
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
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem' }}>Administrator</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.875rem' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-dark-navy)' }}>Brian Burds</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>brian@brianburds.com (Master Admin)</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981', backgroundColor: '#ecfdf5', padding: '2px 8px', borderRadius: '4px' }}>Active</span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-dark-navy)' }}>Brenda Faudoa</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>brenda@brianburds.com (Master Admin)</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981', backgroundColor: '#ecfdf5', padding: '2px 8px', borderRadius: '4px' }}>Active</span>
                      </td>
                    </tr>
                    {adminsList.map((admin, idx) => {
                      const email = (admin.email || '').toLowerCase().trim();
                      if (email === 'brian@brianburds.com' || email === 'brenda@brianburds.com') return null;
                      return (
                        <tr key={idx}>
                          <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>
                            <div style={{ fontWeight: 600, color: 'var(--color-dark-navy)' }}>{admin.name || email.split('@')[0]}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{email}</div>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', textAlign: 'right' }}>
                            <button 
                              onClick={() => handleRemoveAdmin(admin.email)}
                              style={{ color: 'var(--color-danger)', fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
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
          {showOpenHouseReportModal ? (
            <OpenHouseWeeklyReport onClose={() => setShowOpenHouseReportModal(false)} />
          ) : (
            <>
              {/* Open House Approvals Card */}
              {renderOpenHouseApprovalsCard()}

              {/* Sisu Inventory & Weekly Report Coordination Card */}
              <div className="card mb-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Building size={20} style={{ color: 'var(--color-primary)' }} />
                    <h3 style={{ margin: 0, color: 'var(--color-dark-navy)', fontSize: '1.15rem', fontWeight: 700 }}>
                      Open House Coordination & Sisu Inventory
                    </h3>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <button
                      onClick={() => setShowOpenHouseReportModal(true)}
                      style={{
                        padding: '0.5rem 0.85rem',
                        borderRadius: '8px',
                        border: '1px solid var(--color-primary)',
                        backgroundColor: 'rgba(0, 161, 224, 0.08)',
                        color: 'var(--color-primary)',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <FileText size={15} /> View Master Schedule
                    </button>

                    <button
                      onClick={handleSisuSync}
                      disabled={isSyncing}
                      className="btn-primary"
                      style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                    >
                      <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
                      {isSyncing ? 'Syncing Sisu...' : 'Refresh Listings from Sisu'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  {/* Sisu Inventory Snapshot */}
                  <div style={{ backgroundColor: 'var(--color-background)', padding: '1rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700, marginBottom: '0.5rem' }}>
                      Active Sisu Listings ({listings.length})
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-main)' }}>
                      <div>Last Synced: <strong>{new Date(lastSyncedAt).toLocaleString()}</strong></div>
                      <div style={{ marginTop: '0.35rem', color: 'var(--color-text-muted)' }}>
                        Toggle property availability below to allow or pause agent open house bookings.
                      </div>
                    </div>
                  </div>

                  {/* Weekly Report Deadline & LinqApp Config */}
                  <div style={{ backgroundColor: 'var(--color-background)', padding: '1rem', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                        Weekly Report Deadline (LinqApp Prompt)
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <select
                        value={weeklyReportConfig.deadline_day_of_week}
                        onChange={(e) => updateWeeklyReportConfig({ deadline_day_of_week: Number(e.target.value) })}
                        style={{ ...styles.input, width: 'auto', padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                      >
                        <option value={1}>Monday</option>
                        <option value={2}>Tuesday</option>
                        <option value={3}>Wednesday</option>
                        <option value={4}>Thursday</option>
                        <option value={5}>Friday</option>
                        <option value={6}>Saturday</option>
                        <option value={0}>Sunday</option>
                      </select>

                      <input
                        type="time"
                        value={weeklyReportConfig.deadline_time}
                        onChange={(e) => updateWeeklyReportConfig({ deadline_time: e.target.value })}
                        style={{ ...styles.input, width: 'auto', padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                      />

                      <button
                        onClick={handleTriggerReportNotification}
                        disabled={isSendingReportPrompt}
                        title="Send LinqApp SMS review prompt to coordinator"
                        style={{
                          padding: '0.4rem 0.75rem',
                          borderRadius: '6px',
                          border: '1px solid var(--color-border)',
                          backgroundColor: 'var(--color-surface)',
                          color: 'var(--color-text-main)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {isSendingReportPrompt ? 'Sending...' : '📱 Trigger Test SMS Prompt'}
                      </button>
                    </div>

                    {/* Coordinator Phone & Name Inputs */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                          Coordinator Mobile Phone (Recipient)
                        </label>
                        <input
                          type="tel"
                          value={weeklyReportConfig.coordinator_phone || ''}
                          placeholder="+1 (915) 256-6989"
                          onChange={(e) => updateWeeklyReportConfig({ coordinator_phone: e.target.value })}
                          style={{ ...styles.input, width: '100%', padding: '0.35rem 0.5rem', fontSize: '0.82rem' }}
                        />
                        {(weeklyReportConfig.coordinator_phone?.replace(/\D/g, '') === '19154947984' || weeklyReportConfig.coordinator_phone?.replace(/\D/g, '') === '9154947984') && (
                          <div style={{ fontSize: '0.7rem', color: '#f59e0b', marginTop: '0.2rem' }}>
                            ⚠️ This is the outbound sender line. Please enter your personal cell number so you can receive texts.
                          </div>
                        )}
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                          Coordinator Name
                        </label>
                        <input
                          type="text"
                          value={weeklyReportConfig.coordinator_name || ''}
                          placeholder="Listing Coordinator"
                          onChange={(e) => updateWeeklyReportConfig({ coordinator_name: e.target.value })}
                          style={{ ...styles.input, width: '100%', padding: '0.35rem 0.5rem', fontSize: '0.82rem' }}
                        />
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                          Outbound Linq Sender: <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>+1 (915) 494-7984</span>
                        </div>
                      </div>
                    </div>

                    {weeklyReportConfig.last_report_sent_at && (
                      <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.5rem', fontWeight: 500 }}>
                        ✓ Last SMS Notification Sent: {new Date(weeklyReportConfig.last_report_sent_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Listing Availability & FUB Lead Controls Table */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-dark-navy)', fontWeight: 700 }}>
                        Open House Availability & FUB Lead Sync
                      </h4>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        Turn toggle ON/OFF to control which properties agents can select for weekend open houses.
                      </p>
                    </div>

                    <input
                      type="text"
                      placeholder="Search property, agent, or seller..."
                      value={openHouseListingSearch}
                      onChange={(e) => setOpenHouseListingSearch(e.target.value)}
                      style={{ ...styles.input, width: '260px', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '480px', overflowY: 'auto' }}>
                    {listings
                      .filter(l => {
                        if (!openHouseListingSearch) return true;
                        const q = openHouseListingSearch.toLowerCase();
                        return (
                          (l.address || '').toLowerCase().includes(q) ||
                          (l.listing_agent_name || '').toLowerCase().includes(q) ||
                          (l.seller_contact_name || '').toLowerCase().includes(q) ||
                          (l.sisu_listing_id || '').toLowerCase().includes(q)
                        );
                      })
                      .map(listing => {
                        const isAvailable = listing.is_open_house_enabled !== false;
                        const leadId = listing.seller_contact_id;
                        return (
                          <div
                            key={listing.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.85rem 1rem',
                              borderRadius: '8px',
                              backgroundColor: isAvailable ? 'var(--color-background)' : 'rgba(239, 68, 68, 0.04)',
                              border: `1px solid ${isAvailable ? 'var(--color-border)' : 'rgba(239, 68, 68, 0.25)'}`,
                              gap: '1rem',
                              flexWrap: 'wrap'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: '280px', flex: '1 1 auto' }}>
                              {listing.cover_image && (
                                <img
                                  src={listing.cover_image}
                                  alt={listing.address}
                                  style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover' }}
                                />
                              )}
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ fontWeight: 700, color: 'var(--color-dark-navy)', fontSize: '0.95rem' }}>
                                    {listing.address}
                                  </span>
                                  <span style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    backgroundColor: 'var(--color-primary)',
                                    color: 'white',
                                    padding: '0.15rem 0.4rem',
                                    borderRadius: '4px'
                                  }}>
                                    {listing.price_formatted || `$${Number(listing.price || 0).toLocaleString()}`}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem', display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
                                  <span>Agent: <strong>{listing.listing_agent_name || 'Syndicate'}</strong></span>
                                  <span>Seller: <strong>{listing.seller_contact_name || 'On File'}</strong></span>
                                  <span>Stage: <strong>{listing.stage || 'Live'}</strong></span>
                                  {listing.sisu_listing_id && <span style={{ color: 'var(--color-slate-blue)' }}>{listing.sisu_listing_id}</span>}
                                </div>
                              </div>
                            </div>

                            {/* Lead & Toggle Controls */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              {leadId && (
                                <a
                                  href={`https://brianburds.followupboss.com/2/people/view/${leadId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    color: 'var(--color-primary)',
                                    fontWeight: 600,
                                    fontSize: '0.8rem',
                                    backgroundColor: 'rgba(0, 161, 224, 0.08)',
                                    border: '1px solid rgba(0, 161, 224, 0.2)',
                                    padding: '0.35rem 0.65rem',
                                    borderRadius: '6px',
                                    textDecoration: 'none'
                                  }}
                                  title={`Open FUB Lead #${leadId}`}
                                >
                                  👤 Lead #{leadId} ↗
                                </a>
                              )}

                              {/* Simple Toggle Switch */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', position: 'relative' }}>
                                  <input
                                    type="checkbox"
                                    checked={isAvailable}
                                    onChange={() => toggleListingOpenHouseAvailability(listing.id)}
                                    style={{
                                      width: '42px',
                                      height: '22px',
                                      appearance: 'none',
                                      backgroundColor: isAvailable ? '#10b981' : '#cbd5e1',
                                      borderRadius: '22px',
                                      position: 'relative',
                                      cursor: 'pointer',
                                      transition: 'background-color 0.2s ease',
                                      outline: 'none'
                                    }}
                                  />
                                  <span
                                    style={{
                                      position: 'absolute',
                                      top: '2px',
                                      left: isAvailable ? '22px' : '2px',
                                      width: '18px',
                                      height: '18px',
                                      borderRadius: '50%',
                                      backgroundColor: 'white',
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                      transition: 'left 0.2s ease',
                                      pointerEvents: 'none'
                                    }}
                                  />
                                </label>
                                <span style={{
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  color: isAvailable ? '#059669' : '#dc2626',
                                  minWidth: '85px'
                                }}>
                                  {isAvailable ? '🟢 Available' : '⏸️ Paused'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </>
          )}

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
                      {(evt.instructor || evt.submitted_by || evt.submittedBy) && (
                        <div style={{marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-slate-blue)', display: 'flex', gap: '1rem'}}>
                          {evt.instructor && <span><strong>Instructor:</strong> {evt.instructor}</span>}
                          {(evt.submitted_by || evt.submittedBy) && <span><strong>Suggested By:</strong> {evt.submitted_by || evt.submittedBy}</span>}
                        </div>
                      )}
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
                      {(evt.instructor || evt.submitted_by || evt.submittedBy) && (
                        <div style={{marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-slate-blue)', display: 'flex', gap: '1rem'}}>
                          {evt.instructor && <span><strong>Instructor:</strong> {evt.instructor}</span>}
                          {(evt.submitted_by || evt.submittedBy) && <span><strong>Suggested By:</strong> {evt.submitted_by || evt.submittedBy}</span>}
                        </div>
                      )}
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
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <div>
                  <label style={styles.label}>Instructor (Optional)</label>
                  <input type="text" placeholder="e.g., Brian Burds" value={newEventInstructor} onChange={(e) => setNewEventInstructor(e.target.value)} style={styles.input} />
                </div>
                <div>
                  <label style={styles.label}>Suggested By (Optional)</label>
                  <input type="text" placeholder="e.g., Admin" value={newEventSubmittedBy} onChange={(e) => setNewEventSubmittedBy(e.target.value)} style={styles.input} />
                </div>
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
                    setNewEventInstructor('');
                    setNewEventSubmittedBy(userName);
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

          {/* Gamification & Progression Settings Section */}
          <div className="card" style={{ gridColumn: '1 / -1', borderTop: '3px solid var(--color-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-dark-navy)' }}>
                  <Trophy size={20} color="var(--color-accent)" /> Gamification & Progressive Level Settings
                </h2>
                <p className="text-xs text-muted mt-1 mb-0">
                  Configure XP thresholds for all 9 progressive levels and set minimum unlock levels for Playbook phases.
                </p>
              </div>
              {gamificationSavedMsg && (
                <div style={{ padding: '0.4rem 0.8rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#059669', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600' }}>
                  ✓ {gamificationSavedMsg}
                </div>
              )}
            </div>

            <form onSubmit={handleSaveGamification} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                
                {/* 9 Level Thresholds Configuration */}
                <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1rem', backgroundColor: 'var(--color-background)' }}>
                  <h3 style={{ margin: 0, marginBottom: '0.75rem', fontSize: '0.95rem', color: 'var(--color-dark-navy)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sparkles size={16} color="var(--color-primary)" /> Level Thresholds (1 - 9)
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '380px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                    {editableLevels.map((lvl, idx) => (
                      <div key={lvl.level} style={{ display: 'grid', gridTemplateColumns: '50px 1fr 100px', gap: '0.5rem', alignItems: 'center', backgroundColor: 'var(--color-card-bg)', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--color-dark-navy)' }}>
                          Lv. {lvl.level}
                        </span>
                        <input 
                          type="text" 
                          value={lvl.title} 
                          onChange={(e) => {
                            const newLvls = [...editableLevels];
                            newLvls[idx] = { ...newLvls[idx], title: e.target.value };
                            setEditableLevels(newLvls);
                          }}
                          style={{ ...styles.input, padding: '0.3rem 0.5rem', fontSize: '0.82rem' }}
                          placeholder="Level Title"
                          required
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <input 
                            type="number" 
                            value={lvl.minXp} 
                            onChange={(e) => {
                              const newLvls = [...editableLevels];
                              newLvls[idx] = { ...newLvls[idx], minXp: Number(e.target.value) };
                              setEditableLevels(newLvls);
                            }}
                            style={{ ...styles.input, padding: '0.3rem 0.5rem', fontSize: '0.82rem', textAlign: 'right' }}
                            placeholder="Min XP"
                            disabled={lvl.level === 1}
                            required
                          />
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>XP</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Phase Gating Levels Configuration */}
                <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1rem', backgroundColor: 'var(--color-background)' }}>
                  <h3 style={{ margin: 0, marginBottom: '0.75rem', fontSize: '0.95rem', color: 'var(--color-dark-navy)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Lock size={16} color="var(--color-accent)" /> Playbook Phase Gating
                  </h3>
                  <p className="text-xs text-muted mb-3">Specify which minimum level an agent must reach to unlock each phase badge and content.</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {[
                      { id: 'apply', label: 'Phase 1: Apply (Application & ICA)' },
                      { id: 'process', label: 'Phase 2: Process (License & Setup)' },
                      { id: 'activate', label: 'Phase 3: Activate (TREC & Systems)' },
                      { id: 'launch', label: 'Phase 4: Launch (Board & Readiness)' },
                      { id: 'zillow', label: 'Phase 5: Enrolled (Zillow & Production)' },
                    ].map(p => (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-card-bg)', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--color-dark-navy)' }}>{p.label}</span>
                        <select 
                          value={editablePhaseUnlocks[p.id] || 1}
                          onChange={(e) => {
                            setEditablePhaseUnlocks({
                              ...editablePhaseUnlocks,
                              [p.id]: Number(e.target.value)
                            });
                          }}
                          style={{ ...styles.roleSelect, padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
                        >
                          {editableLevels.map(lvl => (
                            <option key={lvl.level} value={lvl.level}>
                              Level {lvl.level}: {lvl.title} ({lvl.minXp} XP)
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  onClick={() => {
                    setEditableLevels(DEFAULT_LEVEL_THRESHOLDS);
                    setEditablePhaseUnlocks(DEFAULT_PHASE_UNLOCK_LEVELS);
                  }} 
                  className="btn-secondary"
                  style={{ fontSize: '0.85rem' }}
                >
                  Reset Defaults
                </button>
                <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Check size={16} /> Save Gamification Settings
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

      {activeTab === 'classroom' && (
        <div className="mt-4">
          <ClassroomManager />
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
