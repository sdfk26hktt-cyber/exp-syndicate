import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAgent } from '../context/AgentContext';
import { useCommunity } from '../context/CommunityContext';
import { useOpenHouse } from '../context/OpenHouseContext';
import { UserPlus, Search, Shield, Video, Calendar, Plus, Check, X, MessageSquare, Send, Edit2, LogIn, Trash2, KeyRound, Lock, Eye, EyeOff, Sparkles, Award, Star, Trophy, GraduationCap, Home, Building, FileText, RefreshCw, Smartphone, Users, Radio, AlertCircle, CheckCircle2, MessageCircle, Info, MapPin, BookOpen } from 'lucide-react';
import FullCalendar from './FullCalendar';
import CommunityFeed from './CommunityFeed';
import LocationAutocomplete from './LocationAutocomplete';
import ResourceBoard from './ResourceBoard';
import { supabase } from '../lib/supabase';
import ErrorBoundary from './ErrorBoundary';
import PlaybookManager from './PlaybookManager';
import ClassroomManager from './Classroom/ClassroomManager';
import OpenHouseWeeklyReport from './OpenHouses/OpenHouseWeeklyReport';
import ListingEditModal from './OpenHouses/ListingEditModal';
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
    adminChangeAgentEmail, 
    adminUpdateAgentRoleAndMarket,
    getAgentMarket,
    getAgentMarketLabel,
    getAgentRoleLabel,
    isAgentInMarket,
    isAgentTexas,
    isAgentOutOfMarket,
    deleteAgent, 
    currentAgentData,
    awardAgentXp,
    gamificationSettings,
    updateGamificationSettings,
    loadAgents,
    playbookCatalog,
    assignPlaybookToAgent
  } = useAgent();
  const { events, posts, addPost, updatePost, deletePost, addEvent, updateEvent, deleteEvent, approveEvent, rejectEvent, chats, sendMessage } = useCommunity();
  const userName = currentAgentData?.name || currentUser?.name || currentUser?.email || 'Admin';
  
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'community' | 'calendar' | 'inbox' | 'feed-preview' | 'admins' | 'playbooks'
  const [resourceSubTab, setResourceSubTab] = useState('resources'); // 'resources' | 'playbooks'
  
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
      // 1. Fetch from live agents table where status = 'admin' or role = 'Administrator'
      const { data: dbAgents, error: agentErr } = await supabase.from('agents').select('*');
      if (!agentErr && Array.isArray(dbAgents)) {
        dbAgents.forEach(agent => {
          const isAgentAdmin = agent.status === 'admin' || agent.profile?.role === 'Administrator' || agent.role === 'admin';
          const email = (agent.id || agent.email || '').toLowerCase().trim();
          if (isAgentAdmin && email && !currentAdmins.some(a => a.email.toLowerCase() === email)) {
            currentAdmins.push({
              email,
              name: agent.name || email.split('@')[0],
              role: 'Administrator',
              phone: agent.profile?.phone || agent.phone || '',
              status: 'Active'
            });
          }
        });
      }

      // 2. Try public.admins table if it exists
      try {
        const { data: dbAdmins } = await supabase.from('admins').select('*');
        if (Array.isArray(dbAdmins)) {
          dbAdmins.forEach(item => {
            const email = (item.email || '').toLowerCase().trim();
            if (email && !currentAdmins.some(a => a.email.toLowerCase() === email)) {
              currentAdmins.push({
                email,
                name: item.name || email.split('@')[0],
                role: 'Administrator',
                status: 'Active'
              });
            }
          });
        }
      } catch (e) {
        // ignore
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

    // 1. Ensure agent record exists with status 'admin'
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

    // 2. Try inserting into admins table
    try {
      await supabase.from('admins').upsert([adminObj], { onConflict: 'email' });
    } catch (tableErr) {
      console.debug('admins table not available:', tableErr);
    }

    // 3. Reload agents in global React context
    if (typeof loadAgents === 'function') {
      try {
        await loadAgents();
      } catch (loadErr) {
        console.debug('loadAgents error:', loadErr);
      }
    }

    // 4. Update local state and localStorage
    const updatedList = [...adminsList];
    const existingIndex = updatedList.findIndex(a => a.email.toLowerCase() === normalizedEmail);
    if (existingIndex >= 0) {
      updatedList[existingIndex] = { ...updatedList[existingIndex], ...adminObj, role: 'Administrator' };
    } else {
      updatedList.push({ ...adminObj, role: 'Administrator' });
    }
    setAdminsList(updatedList);
    try {
      localStorage.setItem('syndicate_admins_list', JSON.stringify(updatedList));
    } catch (e) {
      console.debug(e);
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
      // 1. Update agents table status from 'admin' to 'onboarding'
      try {
        await supabase.from('agents').update({ status: 'onboarding', profile: { role: 'Agent' } }).ilike('id', normalized);
      } catch (e) {
        console.debug(e);
      }

      // 2. Try deleting from admins table
      try {
        await supabase.from('admins').delete().eq('email', normalized);
      } catch (e) {
        console.debug(e);
      }

      if (typeof loadAgents === 'function') {
        try {
          await loadAgents();
        } catch (loadErr) {
          console.debug(loadErr);
        }
      }

      const updatedList = adminsList.filter(a => a.email.toLowerCase() !== normalized);
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
  const [editAgentEmail, setEditAgentEmail] = useState('');
  const [editAgentPhone, setEditAgentPhone] = useState('');
  const [editAgentAltPhone, setEditAgentAltPhone] = useState('');
  const [editAgentAddress, setEditAgentAddress] = useState('');
  const [editAgentMarket, setEditAgentMarket] = useState('el_paso');
  const [editAgentCity, setEditAgentCity] = useState('El Paso');
  const [editAgentState, setEditAgentState] = useState('TX');
  const [editAgentStatus, setEditAgentStatus] = useState('onboarding');
  const [editAgentTeamSubrole, setEditAgentTeamSubrole] = useState('team_agent');
  const [editAgentPlaybookId, setEditAgentPlaybookId] = useState('');
  const [editAgentLicense, setEditAgentLicense] = useState('');
  const [editAgentEmergencyName, setEditAgentEmergencyName] = useState('');
  const [editAgentEmergencyPhone, setEditAgentEmergencyPhone] = useState('');
  const [isSavingAgentEdit, setIsSavingAgentEdit] = useState(false);
  const [editAgentError, setEditAgentError] = useState('');
  
  const handleEditAgentSubmit = async (e) => {
    e.preventDefault();
    if (!editingAgent) return;
    
    const cleanNewEmail = (editAgentEmail || editingAgent.id || '').toLowerCase().trim();
    const cleanOldEmail = (editingAgent.id || editingAgent.profile?.email || '').toLowerCase().trim();
    
    if (!cleanNewEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanNewEmail)) {
      setEditAgentError('Please enter a valid email address.');
      return;
    }

    setIsSavingAgentEdit(true);
    setEditAgentError('');

    const profileUpdates = {
      phone: editAgentPhone,
      altPhone: editAgentAltPhone,
      address: editAgentAddress,
      market: editAgentMarket,
      city: editAgentCity,
      state: editAgentState,
      team_subrole: editAgentTeamSubrole,
      playbook_id: editAgentPlaybookId || null,
      licenseNumber: editAgentLicense,
      emergencyName: editAgentEmergencyName,
      emergencyPhone: editAgentEmergencyPhone
    };

    try {
      const targetAgentId = cleanNewEmail !== cleanOldEmail ? cleanNewEmail : editingAgent.id;
      if (cleanNewEmail !== cleanOldEmail) {
        await adminChangeAgentEmail(cleanOldEmail, cleanNewEmail, profileUpdates, editAgentName);
        if (editAgentStatus) {
          await updateAgentStatus(cleanNewEmail, editAgentStatus);
        }
        setActionSuccessMsg(`Successfully updated profile and changed login email to ${cleanNewEmail}`);
      } else {
        await adminUpdateAgent(editingAgent.id, editAgentName, profileUpdates);
        if (editAgentStatus && editAgentStatus !== editingAgent.status) {
          await updateAgentStatus(editingAgent.id, editAgentStatus);
        }
        setActionSuccessMsg(`Updated contact information for ${editAgentName || editingAgent.id}`);
      }
      if (editAgentPlaybookId && typeof assignPlaybookToAgent === 'function') {
        try {
          await assignPlaybookToAgent(targetAgentId, editAgentPlaybookId);
        } catch (pbErr) {
          console.debug('Failed to assign playbook:', pbErr);
        }
      }
      setEditingAgent(null);
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setEditAgentError(err.message || 'Failed to update agent.');
    } finally {
      setIsSavingAgentEdit(false);
    }
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

  // Inbox & SMS Messaging State
  const [messagingSubTab, setMessagingSubTab] = useState('sms'); // 'sms' | 'chat'
  const [activeChatId, setActiveChatId] = useState(null);
  const [adminReply, setAdminReply] = useState('');

  // LinqApp SMS Broadcast State
  const [smsTargetType, setSmsTargetType] = useState('group'); // 'group' | 'market' | 'matrix' | 'all' | 'individual'
  const [smsSelectedAgent, setSmsSelectedAgent] = useState(null);
  const [smsCustomPhone, setSmsCustomPhone] = useState('');
  const [smsCustomName, setSmsCustomName] = useState('');
  const [smsSelectedGroup, setSmsSelectedGroup] = useState('team_agent'); // 'team_agent' | 'showing_partner' | 'flex_agent' | 'onboarding' | 'guest' | 'admin' | 'team_all'
  const [smsSelectedMarket, setSmsSelectedMarket] = useState('el_paso'); // 'el_paso' | 'texas_all' | 'texas_other' | 'out_of_market' | 'out_of_state'
  const [smsMatrixRole, setSmsMatrixRole] = useState('all'); // 'all' | 'team_agent' | 'showing_partner' | 'flex_agent' | 'onboarding' | 'guest' | 'admin'
  const [smsMatrixMarket, setSmsMatrixMarket] = useState('el_paso'); // 'all' | 'el_paso' | 'texas_all' | 'texas_other' | 'out_of_market' | 'out_of_state'
  const [smsMessage, setSmsMessage] = useState('');
  const [smsSending, setSmsSending] = useState(false);
  const [smsResult, setSmsResult] = useState(null);
  const [showRecipientsDrawer, setShowRecipientsDrawer] = useState(false);

  // Helper to compute target recipients for LinqApp SMS
  const getSmsRecipients = () => {
    if (smsTargetType === 'individual') {
      if (smsSelectedAgent) {
        return [{
          id: smsSelectedAgent.id,
          name: smsSelectedAgent.name || smsSelectedAgent.id,
          phone: smsSelectedAgent.profile?.phone || smsSelectedAgent.phone || '',
          role: getAgentRoleLabel(smsSelectedAgent),
          market: getAgentMarketLabel(smsSelectedAgent),
          city: smsSelectedAgent.profile?.city || '',
          state: smsSelectedAgent.profile?.state || '',
          group: smsSelectedAgent.status || 'Agent'
        }];
      }
      if (smsCustomPhone.trim()) {
        return [{
          id: 'custom',
          name: smsCustomName.trim() || 'Custom Contact',
          phone: smsCustomPhone.trim(),
          role: 'Contact',
          market: 'Custom',
          city: '',
          state: '',
          group: 'Custom'
        }];
      }
      return [];
    }

    if (smsTargetType === 'group') {
      return (agents || []).filter(a => {
        const s = a.status || (a.profile?.role === 'Administrator' ? 'admin' : a.role === 'guest' || a.profile?.role === 'Guest' ? 'guest' : 'onboarding');
        const subrole = a.profile?.team_subrole || 'team_agent';
        if (smsSelectedGroup === 'admin') return s === 'admin' || a.profile?.role === 'Administrator';
        if (smsSelectedGroup === 'flex_agent') return s === 'flex_agent';
        if (smsSelectedGroup === 'team_agent') return s === 'team_agent' && subrole !== 'showing_partner';
        if (smsSelectedGroup === 'showing_partner') return s === 'team_agent' && subrole === 'showing_partner';
        if (smsSelectedGroup === 'team_all') return s === 'team_agent';
        if (smsSelectedGroup === 'guest') return s === 'guest' || a.role === 'guest' || a.profile?.role === 'Guest';
        if (smsSelectedGroup === 'onboarding') return s === 'onboarding' || (!a.status && s !== 'admin' && s !== 'flex_agent' && s !== 'team_agent' && s !== 'guest');
        return false;
      }).map(a => ({
        id: a.id,
        name: a.name || a.id,
        phone: a.profile?.phone || a.phone || '',
        role: getAgentRoleLabel(a),
        market: getAgentMarketLabel(a),
        city: a.profile?.city || '',
        state: a.profile?.state || '',
        group: getAgentRoleLabel(a)
      }));
    }

    if (smsTargetType === 'market') {
      return (agents || []).filter(a => {
        const market = getAgentMarket(a);
        if (smsSelectedMarket === 'el_paso') return market === 'el_paso';
        if (smsSelectedMarket === 'texas_all') return market === 'el_paso' || market === 'texas_other';
        if (smsSelectedMarket === 'texas_other') return market === 'texas_other';
        if (smsSelectedMarket === 'out_of_market') return market === 'texas_other' || market === 'out_of_state';
        if (smsSelectedMarket === 'out_of_state') return market === 'out_of_state';
        return true;
      }).map(a => ({
        id: a.id,
        name: a.name || a.id,
        phone: a.profile?.phone || a.phone || '',
        role: getAgentRoleLabel(a),
        market: getAgentMarketLabel(a),
        city: a.profile?.city || '',
        state: a.profile?.state || '',
        group: getAgentMarketLabel(a)
      }));
    }

    if (smsTargetType === 'matrix') {
      return (agents || []).filter(a => {
        const s = a.status || (a.profile?.role === 'Administrator' ? 'admin' : a.role === 'guest' || a.profile?.role === 'Guest' ? 'guest' : 'onboarding');
        const subrole = a.profile?.team_subrole || 'team_agent';
        const market = getAgentMarket(a);

        // Role check
        let roleMatch = true;
        if (smsMatrixRole === 'team_agent') roleMatch = (s === 'team_agent' && subrole !== 'showing_partner');
        else if (smsMatrixRole === 'showing_partner') roleMatch = (s === 'team_agent' && subrole === 'showing_partner');
        else if (smsMatrixRole === 'team_all') roleMatch = (s === 'team_agent');
        else if (smsMatrixRole === 'flex_agent') roleMatch = (s === 'flex_agent');
        else if (smsMatrixRole === 'onboarding') roleMatch = (s === 'onboarding' || (!a.status && s !== 'admin' && s !== 'flex_agent' && s !== 'team_agent' && s !== 'guest'));
        else if (smsMatrixRole === 'guest') roleMatch = (s === 'guest' || a.role === 'guest' || a.profile?.role === 'Guest');
        else if (smsMatrixRole === 'admin') roleMatch = (s === 'admin' || a.profile?.role === 'Administrator');

        // Market check
        let marketMatch = true;
        if (smsMatrixMarket === 'el_paso') marketMatch = (market === 'el_paso');
        else if (smsMatrixMarket === 'texas_all') marketMatch = (market === 'el_paso' || market === 'texas_other');
        else if (smsMatrixMarket === 'texas_other') marketMatch = (market === 'texas_other');
        else if (smsMatrixMarket === 'out_of_market') marketMatch = (market === 'texas_other' || market === 'out_of_state');
        else if (smsMatrixMarket === 'out_of_state') marketMatch = (market === 'out_of_state');

        return roleMatch && marketMatch;
      }).map(a => ({
        id: a.id,
        name: a.name || a.id,
        phone: a.profile?.phone || a.phone || '',
        role: getAgentRoleLabel(a),
        market: getAgentMarketLabel(a),
        city: a.profile?.city || '',
        state: a.profile?.state || '',
        group: `${getAgentRoleLabel(a)} (${getAgentMarketLabel(a)})`
      }));
    }

    if (smsTargetType === 'all') {
      return (agents || []).map(a => ({
        id: a.id,
        name: a.name || a.id,
        phone: a.profile?.phone || a.phone || '',
        role: getAgentRoleLabel(a),
        market: getAgentMarketLabel(a),
        city: a.profile?.city || '',
        state: a.profile?.state || '',
        group: a.status || (a.profile?.role === 'Administrator' ? 'admin' : a.role === 'guest' ? 'guest' : 'agent')
      }));
    }

    return [];
  };

  const handleSendSmsBroadcast = async (e) => {
    e?.preventDefault();
    if (!smsMessage.trim()) {
      alert('Please enter a message to send.');
      return;
    }

    const allRecipients = getSmsRecipients();
    const validRecipients = allRecipients.filter(r => r.phone && r.phone.replace(/\D/g, '').length >= 10);

    if (validRecipients.length === 0) {
      alert('No valid recipients with 10-digit phone numbers found for this selection.');
      return;
    }

    const targetLabel = smsTargetType === 'all' ? 'the ENTIRE Directory'
      : smsTargetType === 'group' ? `all ${smsSelectedGroup.replace('_', ' ')} members`
      : smsTargetType === 'market' ? `all ${smsSelectedMarket.replace('_', ' ')} market agents`
      : smsTargetType === 'matrix' ? `segmented audience (${smsMatrixRole} in ${smsMatrixMarket})`
      : (validRecipients[0].name || validRecipients[0].phone);

    if (!window.confirm(`Are you sure you want to send this SMS broadcast via LinqApp to ${validRecipients.length} recipient(s) (${targetLabel})?`)) {
      return;
    }

    setSmsSending(true);
    setSmsResult(null);

    try {
      const res = await fetch('/api/messages/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: validRecipients,
          message: smsMessage,
          groupName: smsTargetType === 'all' ? 'Entire Directory' : smsTargetType === 'group' ? smsSelectedGroup : smsTargetType === 'market' ? smsSelectedMarket : 'Segmented Broadcast',
          senderName: userName
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSmsResult({
          success: true,
          sentCount: data.sentCount,
          failedCount: data.failedCount,
          total: validRecipients.length,
          results: data.results,
          timestamp: new Date().toLocaleTimeString()
        });
        setSmsMessage('');
        setActionSuccessMsg(`🚀 LinqApp SMS broadcast delivered! ${data.sentCount} sent successfully.`);
        setTimeout(() => setActionSuccessMsg(''), 5000);
      } else {
        setSmsResult({
          success: false,
          error: data.error || 'Failed to dispatch SMS'
        });
      }
    } catch (err) {
      console.error('SMS broadcast error:', err);
      setSmsResult({
        success: false,
        error: err.message || 'Network error dispatching SMS'
      });
    } finally {
      setSmsSending(false);
    }
  };

  // Directory Filter State
  const [directoryMarketFilter, setDirectoryMarketFilter] = useState('all'); // 'all' | 'el_paso' | 'texas_all' | 'texas_other' | 'out_of_market'
  const [directoryRoleFilter, setDirectoryRoleFilter] = useState('all'); // 'all' | 'team_agent' | 'showing_partner' | 'flex_agent' | 'onboarding' | 'guest' | 'admin'

  // Calendar Filter State
  const [eventFilterMonth, setEventFilterMonth] = useState(new Date().getMonth().toString());
  const [eventFilterYear, setEventFilterYear] = useState(new Date().getFullYear().toString());
  
  const [agentSearchQuery, setAgentSearchQuery] = useState('');
  const [expandedAgentGroups, setExpandedAgentGroups] = useState({
    admin: true,
    onboarding: true,
    flex_agent: false,
    team_agent: false,
    guest: true
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
    cancelBooking,
    syncSisuListings, 
    isSyncing, 
    lastSyncedAt, 
    weeklyReportConfig, 
    updateWeeklyReportConfig, 
    sendWeeklyReportPrompt,
    toggleListingOpenHouseAvailability 
  } = useOpenHouse();
  
  const [approvingBookingId, setApprovingBookingId] = useState(null);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [isSendingReportPrompt, setIsSendingReportPrompt] = useState(false);
  const [showOpenHouseReportModal, setShowOpenHouseReportModal] = useState(false);
  const [showListingEditModal, setShowListingEditModal] = useState(false);
  const [selectedListingForEdit, setSelectedListingForEdit] = useState(null);
  const [openHouseListingSearch, setOpenHouseListingSearch] = useState('');

  const handleApproveOpenHouse = async (bookingId) => {
    setApprovingBookingId(bookingId);
    try {
      await approveBooking(bookingId, userName);
      setActionSuccessMsg("✅ Open House approved! Appointment synced to owner in Follow Up Boss & confirmation texted via LinqApp.");
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

  const handleCancelOpenHouse = async (bookingId) => {
    const reason = prompt("Enter reason for cancellation (e.g. Agent conflict, Seller requested, Under contract):", "Schedule adjustment");
    if (reason !== null) {
      setCancellingBookingId(bookingId);
      try {
        await cancelBooking(bookingId, reason || 'Schedule adjustment', userName);
        setActionSuccessMsg("❌ Open House cancelled. Follow Up Boss appointment removed & agent notified.");
        setTimeout(() => setActionSuccessMsg(''), 5000);
      } catch (err) {
        alert("Error cancelling open house: " + err.message);
      } finally {
        setCancellingBookingId(null);
      }
    }
  };

  const handleSisuSync = async () => {
    const res = await syncSisuListings();
    if (res?.sierraCount || res?.sisuCount) {
      setActionSuccessMsg(`⚡ Successfully synced ${res.count || listings.length} active listings (${res.sisuCount || 0} Sisu/FUB deals + ${res.sierraCount || 0} Sierra MLS featured properties).`);
    } else {
      setActionSuccessMsg(`⚡ Listings feed refreshed (${res?.count || listings.length} active listings).`);
    }
    setTimeout(() => setActionSuccessMsg(''), 6000);
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
      } else if (newUserRole === 'guest') {
        await addAgent(normalizedEmail, newAgentName, null, null, newAgentPassword);
        await updateAgentStatus(normalizedEmail, 'guest');
        setActionSuccessMsg(`Guest account for ${newAgentName} created successfully!`);
        setTimeout(() => setActionSuccessMsg(''), 4000);
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
          📱 SMS & Messaging
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
              Add User / Admin
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
                      <option value="agent">Agent (Full Syndicate)</option>
                      <option value="guest">Guest User (Classroom Only)</option>
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
                <button type="submit" className="btn-primary" style={{backgroundColor: 'var(--color-dark-navy)', marginTop: '1rem'}}>
                  {newUserRole === 'admin' ? 'Add Administrator' : 'Invite Agent'}
                </button>
              </form>
            </div>
          )}



          <div className="card mt-6">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h2 className="text-lg m-0" style={{ color: 'var(--color-dark-navy)', fontWeight: 700 }}>Agent Directory & Roles</h2>
                <p className="text-muted text-sm" style={{ margin: '0.2rem 0 0 0' }}>Classify agents by market, segment showing partners, and manage team permissions.</p>
              </div>

              {/* Filter and Search Bar Container */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', flexGrow: 1, justifyContent: 'flex-end' }}>
                {/* Market Filter */}
                <select
                  value={directoryMarketFilter}
                  onChange={(e) => setDirectoryMarketFilter(e.target.value)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: directoryMarketFilter !== 'all' ? 'rgba(0, 161, 224, 0.08)' : 'var(--color-bg-secondary, #f8fafc)',
                    color: directoryMarketFilter !== 'all' ? 'var(--color-primary)' : 'var(--color-dark-navy)',
                    fontWeight: directoryMarketFilter !== 'all' ? '700' : '500',
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">🌐 All Markets</option>
                  <option value="el_paso">📍 El Paso (In-Market)</option>
                  <option value="texas_all">🤠 Texas (All TX)</option>
                  <option value="texas_other">🚗 Texas (Other TX)</option>
                  <option value="out_of_market">✈️ Out of Market (All)</option>
                  <option value="out_of_state">🗺️ Out of State</option>
                </select>

                {/* Role Filter */}
                <select
                  value={directoryRoleFilter}
                  onChange={(e) => setDirectoryRoleFilter(e.target.value)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: directoryRoleFilter !== 'all' ? 'rgba(0, 161, 224, 0.08)' : 'var(--color-bg-secondary, #f8fafc)',
                    color: directoryRoleFilter !== 'all' ? 'var(--color-primary)' : 'var(--color-dark-navy)',
                    fontWeight: directoryRoleFilter !== 'all' ? '700' : '500',
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">👥 All Roles</option>
                  <option value="team_agent">⭐ Team Agents (Full)</option>
                  <option value="showing_partner">🤝 Showing Partners</option>
                  <option value="team_all">🌟 All Team Agents & Partners</option>
                  <option value="flex_agent">⚡ Flex Agents</option>
                  <option value="onboarding">🚀 Onboarding</option>
                  <option value="guest">🎓 Guests</option>
                  <option value="admin">🛡️ Admins</option>
                </select>

                {/* Agent Search Bar */}
                <div style={{ position: 'relative', minWidth: '220px', maxWidth: '320px', flexGrow: 1 }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search name, phone, city..."
                    value={agentSearchQuery}
                    onChange={(e) => setAgentSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 2rem 0.5rem 2.2rem',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-bg-secondary, #f8fafc)',
                      color: 'var(--color-dark-navy)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  {agentSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setAgentSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--color-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '2px'
                      }}
                      title="Clear search"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div style={{overflowX: 'auto'}}>
              <table style={styles.roleTable}>
                <thead>
                  <tr>
                    <th style={styles.roleTh}>Agent Name & Market</th>
                    <th style={styles.roleTh}>Email / Contact</th>
                    <th style={styles.roleTh}>Current Role</th>
                    <th style={styles.roleTh}>XP</th>
                    <th style={styles.roleTh}>Actions</th>
                  </tr>
                </thead>
                <tbody>

                  {['admin', 'onboarding', 'flex_agent', 'team_agent', 'guest'].map(groupKey => {
                    const groupTitle = groupKey === 'admin' ? 'Administrators' 
                      : groupKey === 'onboarding' ? 'Onboarding Agents' 
                      : groupKey === 'flex_agent' ? 'Flex Agents' 
                      : groupKey === 'team_agent' ? 'Team Agents & Showing Partners' 
                      : 'Guest Users';
                    const groupAgents = agents
                      .filter(a => {
                        const s = a.status || (a.profile?.role === 'Administrator' ? 'admin' : a.role === 'guest' || a.profile?.role === 'Guest' ? 'guest' : 'onboarding');
                        const subrole = a.profile?.team_subrole || 'team_agent';
                        const market = getAgentMarket(a);

                        const matchesGroup = groupKey === 'admin' ? (s === 'admin' || a.profile?.role === 'Administrator')
                          : groupKey === 'flex_agent' ? s === 'flex_agent'
                          : groupKey === 'team_agent' ? s === 'team_agent'
                          : groupKey === 'guest' ? (s === 'guest' || a.role === 'guest' || a.profile?.role === 'Guest')
                          : (s !== 'flex_agent' && s !== 'team_agent' && s !== 'admin' && s !== 'guest' && a.role !== 'guest' && a.profile?.role !== 'Guest' && a.profile?.role !== 'Administrator');
                        
                        if (!matchesGroup) return false;

                        // Filter by Market
                        if (directoryMarketFilter === 'el_paso' && market !== 'el_paso') return false;
                        if (directoryMarketFilter === 'texas_all' && market !== 'el_paso' && market !== 'texas_other') return false;
                        if (directoryMarketFilter === 'texas_other' && market !== 'texas_other') return false;
                        if (directoryMarketFilter === 'out_of_market' && market !== 'texas_other' && market !== 'out_of_state') return false;
                        if (directoryMarketFilter === 'out_of_state' && market !== 'out_of_state') return false;

                        // Filter by Role / Subrole
                        if (directoryRoleFilter === 'team_agent' && (s !== 'team_agent' || subrole === 'showing_partner')) return false;
                        if (directoryRoleFilter === 'showing_partner' && (s !== 'team_agent' || subrole !== 'showing_partner')) return false;
                        if (directoryRoleFilter === 'team_all' && s !== 'team_agent') return false;
                        if (directoryRoleFilter === 'flex_agent' && s !== 'flex_agent') return false;
                        if (directoryRoleFilter === 'onboarding' && (s !== 'onboarding' && (s === 'admin' || s === 'flex_agent' || s === 'team_agent' || s === 'guest'))) return false;
                        if (directoryRoleFilter === 'guest' && s !== 'guest' && a.role !== 'guest' && a.profile?.role !== 'Guest') return false;
                        if (directoryRoleFilter === 'admin' && s !== 'admin' && a.profile?.role !== 'Administrator') return false;

                        if (!agentSearchQuery.trim()) return true;
                        const q = agentSearchQuery.toLowerCase().trim();
                        return (
                          (a.name || '').toLowerCase().includes(q) ||
                          (a.id || '').toLowerCase().includes(q) ||
                          (a.profile?.phone || '').includes(q) ||
                          (a.profile?.role || '').toLowerCase().includes(q) ||
                          (a.profile?.city || '').toLowerCase().includes(q) ||
                          (a.profile?.state || '').toLowerCase().includes(q) ||
                          (a.status || '').toLowerCase().includes(q)
                        );
                      })
                      .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
                    
                    const isGroupExpanded = expandedAgentGroups[groupKey] || (agentSearchQuery.trim().length > 0 && groupAgents.length > 0) || (directoryMarketFilter !== 'all' && groupAgents.length > 0) || (directoryRoleFilter !== 'all' && groupAgents.length > 0);

                    return (
                      <React.Fragment key={groupKey}>
                        <tr 
                          onClick={() => toggleAgentGroup(groupKey)}
                          style={{ cursor: 'pointer', backgroundColor: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}
                        >
                          <td colSpan="5" style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: 'var(--color-dark-navy)' }}>
                            {isGroupExpanded ? '▼' : '▶'} {groupTitle} ({groupAgents.length})
                          </td>
                        </tr>
                        {isGroupExpanded && groupAgents.length === 0 && (
                          <tr>
                            <td colSpan="5" style={{...styles.roleTd, textAlign: 'center', color: 'var(--color-text-muted)'}}>
                              {agentSearchQuery.trim() || directoryMarketFilter !== 'all' || directoryRoleFilter !== 'all' ? `No agents in ${groupTitle} matching current filters.` : 'No users in this group.'}
                            </td>
                          </tr>
                        )}
                        {isGroupExpanded && groupAgents.map(a => {
                          const agentMarket = getAgentMarket(a);
                          const isShowingPartner = a.status === 'team_agent' && a.profile?.team_subrole === 'showing_partner';

                          return (
                            <tr key={a.id} style={styles.roleTr}>
                              <td style={styles.roleTd}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap'}}>
                                  <div style={{width: '32px', height: '32px', borderRadius: '50%', backgroundColor: a.status === 'guest' || a.role === 'guest' ? '#64748b' : 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', flexShrink: 0}}>
                                    {(a.name || '?').charAt(0)}
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                      <span style={{ fontWeight: '600', color: 'var(--color-dark-navy)' }}>{a.name || 'Unknown Agent'}</span>
                                      {a.status === 'guest' || a.role === 'guest' ? (
                                        <span style={{ fontSize: '0.7rem', backgroundColor: '#e2e8f0', color: '#475569', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                                          GUEST
                                        </span>
                                      ) : (
                                        <LevelBadge 
                                          xp={a.xp || 0} 
                                          thresholds={gamificationSettings?.levelThresholds} 
                                          size="xs" 
                                        />
                                      )}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                                      {/* Market Badge */}
                                      {agentMarket === 'el_paso' ? (
                                        <span style={{ fontSize: '0.68rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '1px 5px', borderRadius: '4px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                          📍 El Paso
                                        </span>
                                      ) : agentMarket === 'texas_other' ? (
                                        <span style={{ fontSize: '0.68rem', backgroundColor: '#fef3c7', color: '#92400e', padding: '1px 5px', borderRadius: '4px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                          🤠 TX ({a.profile?.city || 'Out of Market'})
                                        </span>
                                      ) : (
                                        <span style={{ fontSize: '0.68rem', backgroundColor: '#f1f5f9', color: '#475569', padding: '1px 5px', borderRadius: '4px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                          ✈️ Out of Market {a.profile?.state ? `(${a.profile.state})` : ''}
                                        </span>
                                      )}

                                      {/* Showing Partner Pill */}
                                      {isShowingPartner && (
                                        <span style={{ fontSize: '0.68rem', backgroundColor: '#ecfdf5', color: '#047857', padding: '1px 5px', borderRadius: '4px', fontWeight: '700' }}>
                                          🤝 Showing Partner
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td style={styles.roleTd}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-dark-navy)' }}>{a.id}</div>
                                {a.profile?.phone && (
                                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>📞 {a.profile.phone}</div>
                                )}
                              </td>
                              <td style={styles.roleTd}>
                                <select 
                                  value={a.status || (a.profile?.role === 'Administrator' ? 'admin' : a.role === 'guest' ? 'guest' : 'onboarding')} 
                                  onChange={(e) => updateAgentStatus(a.id, e.target.value)}
                                  style={styles.roleSelect}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <option value="admin">Administrator</option>
                                  <option value="onboarding">Onboarding</option>
                                  <option value="flex_agent">Flex Agent</option>
                                  <option value="team_agent">Team Agent</option>
                                  <option value="guest">Guest User</option>
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
                                      setEditAgentEmail(a.id || a.profile?.email || '');
                                      setEditAgentError('');
                                      setEditAgentPhone(a.profile?.phone || a.phone || '');
                                      setEditAgentAltPhone(a.profile?.altPhone || '');
                                      setEditAgentAddress(a.profile?.address || '');
                                      setEditAgentMarket(a.profile?.market || getAgentMarket(a));
                                      setEditAgentCity(a.profile?.city || 'El Paso');
                                      setEditAgentState(a.profile?.state || 'TX');
                                      setEditAgentStatus(a.status || (a.profile?.role === 'Administrator' ? 'admin' : a.role === 'guest' ? 'guest' : 'onboarding'));
                                      setEditAgentTeamSubrole(a.profile?.team_subrole || 'team_agent');
                                      setEditAgentPlaybookId(a.profile?.playbook_id || '');
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
                          );
                        })}
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
                  <p className="text-xs text-muted mb-4">Update contact information and portal login for {editingAgent.name || editingAgent.id}</p>
                  
                  {editAgentError && (
                    <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#FEE2E2', border: '1px solid #F87171', borderRadius: 'var(--border-radius-sm)', color: '#991B1B', fontSize: '0.82rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <AlertCircle size={15} /> {editAgentError}
                    </div>
                  )}

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
                        <label style={styles.label}>
                          Login Email Address <span style={{ fontSize: '0.72rem', color: 'var(--color-primary)', fontWeight: '600' }}>(Portal ID)</span>
                        </label>
                        <input 
                          type="email" 
                          value={editAgentEmail} 
                          onChange={(e) => setEditAgentEmail(e.target.value)} 
                          style={styles.input} 
                          required 
                        />
                        {editAgentEmail.toLowerCase().trim() !== (editingAgent.id || '').toLowerCase().trim() && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--color-primary)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <AlertCircle size={12} /> Changing email will transfer all XP, playbooks & records to the new address.
                          </div>
                        )}
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

                    {/* Market & Role Classification */}
                    <div style={{ backgroundColor: 'var(--color-bg-secondary, #f8fafc)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--color-border)', marginTop: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.65rem' }}>
                        <MapPin size={16} color="var(--color-primary)" />
                        <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--color-dark-navy)' }}>
                          MARKET & ROLE CLASSIFICATION
                        </span>
                      </div>

                      <div style={styles.formGrid}>
                        <div>
                          <label style={styles.label}>Portal Role & Dashboard</label>
                          <select
                            value={editAgentStatus}
                            onChange={(e) => setEditAgentStatus(e.target.value)}
                            style={styles.input}
                          >
                            <option value="admin">🛡️ Administrator</option>
                            <option value="team_agent">⭐ Team Agent</option>
                            <option value="flex_agent">⚡ Flex Agent</option>
                            <option value="onboarding">🚀 Onboarding Agent</option>
                            <option value="guest">🎓 Guest User</option>
                          </select>
                        </div>

                        {editAgentStatus === 'team_agent' ? (
                          <div>
                            <label style={styles.label}>Team Specialization</label>
                            <select
                              value={editAgentTeamSubrole}
                              onChange={(e) => setEditAgentTeamSubrole(e.target.value)}
                              style={styles.input}
                            >
                              <option value="team_agent">⭐ Full Team Agent</option>
                              <option value="showing_partner">🤝 Showing Partner</option>
                            </select>
                          </div>
                        ) : (
                          <div>
                            <label style={styles.label}>Market Territory</label>
                            <select
                              value={editAgentMarket}
                              onChange={(e) => setEditAgentMarket(e.target.value)}
                              style={styles.input}
                            >
                              <option value="el_paso">📍 El Paso (In-Market HQ)</option>
                              <option value="texas_other">🤠 Texas (Other TX - Out of Market)</option>
                              <option value="out_of_state">✈️ Out of State (Out of Market)</option>
                            </select>
                          </div>
                        )}
                      </div>

                      {editAgentStatus === 'team_agent' && (
                        <div style={{ ...styles.formGrid, marginTop: '0.65rem' }}>
                          <div>
                            <label style={styles.label}>Market Territory</label>
                            <select
                              value={editAgentMarket}
                              onChange={(e) => setEditAgentMarket(e.target.value)}
                              style={styles.input}
                            >
                              <option value="el_paso">📍 El Paso (In-Market HQ)</option>
                              <option value="texas_other">🤠 Texas (Other TX - Out of Market)</option>
                              <option value="out_of_state">✈️ Out of State (Out of Market)</option>
                            </select>
                          </div>
                          <div>
                            <label style={styles.label}>City & State</label>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <input
                                type="text"
                                placeholder="City (e.g. El Paso)"
                                value={editAgentCity}
                                onChange={(e) => setEditAgentCity(e.target.value)}
                                style={{ ...styles.input, flex: 2 }}
                              />
                              <input
                                type="text"
                                placeholder="ST"
                                maxLength={2}
                                value={editAgentState}
                                onChange={(e) => setEditAgentState(e.target.value.toUpperCase())}
                                style={{ ...styles.input, flex: 1, textTransform: 'uppercase' }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {editAgentStatus !== 'team_agent' && (
                        <div style={{ ...styles.formGrid, marginTop: '0.65rem' }}>
                          <div>
                            <label style={styles.label}>City</label>
                            <input
                              type="text"
                              placeholder="City (e.g. Dallas, Austin, El Paso)"
                              value={editAgentCity}
                              onChange={(e) => setEditAgentCity(e.target.value)}
                              style={styles.input}
                            />
                          </div>
                          <div>
                            <label style={styles.label}>State (2-Letter Code)</label>
                            <input
                              type="text"
                              placeholder="TX"
                              maxLength={2}
                              value={editAgentState}
                              onChange={(e) => setEditAgentState(e.target.value.toUpperCase())}
                              style={{ ...styles.input, textTransform: 'uppercase' }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Playbook Assignment */}
                    <div style={{ backgroundColor: 'rgba(37, 99, 235, 0.04)', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(37, 99, 235, 0.2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.45rem' }}>
                        <BookOpen size={16} color="var(--color-primary)" />
                        <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--color-dark-navy)' }}>
                          ASSIGNED PLAYBOOK / ROADMAP
                        </span>
                      </div>
                      <div>
                        <select
                          value={editAgentPlaybookId}
                          onChange={(e) => setEditAgentPlaybookId(e.target.value)}
                          style={styles.input}
                        >
                          <option value="">⚡ Auto-Assign based on Role & Status (Default Track)</option>
                          {playbookCatalog && playbookCatalog.map(p => (
                            <option key={p.id} value={p.id}>
                              📋 {p.title} ({p.targetRole || 'general'}) — {p.phases?.length || 0} Phases
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-muted" style={{ margin: '0.35rem 0 0 0' }}>
                          Assigning a custom playbook dynamically updates this agent's dashboard checklist and phase milestones.
                        </p>
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
                      <button type="button" className="btn-secondary" onClick={() => setEditingAgent(null)} disabled={isSavingAgentEdit}>Cancel</button>
                      <button type="submit" className="btn-primary" disabled={isSavingAgentEdit}>
                        {isSavingAgentEdit ? 'Saving Changes...' : 'Save Changes'}
                      </button>
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
                    {[...adminsList]
                      .filter(admin => {
                        const email = (admin.email || '').toLowerCase().trim();
                        return email !== 'brian@brianburds.com' && email !== 'brenda@brianburds.com';
                      })
                      .sort((a, b) => (a.name || a.email || '').localeCompare(b.name || b.email || '', undefined, { sensitivity: 'base' }))
                      .map((admin, idx) => {
                        const email = (admin.email || '').toLowerCase().trim();
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

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => {
                        setSelectedListingForEdit(null);
                        setShowListingEditModal(true);
                      }}
                      style={{
                        padding: '0.5rem 0.85rem',
                        borderRadius: '8px',
                        border: '1px solid var(--color-primary)',
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-primary)',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <Plus size={15} /> Add Property
                    </button>

                    <button
                      onClick={() => setShowOpenHouseReportModal(true)}
                      style={{
                        padding: '0.5rem 0.85rem',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-text-main)',
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
                      title="Force pull newest listings from Sisu Sellers CRM and Sierra Interactive ephomesonline.com feed"
                    >
                      <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
                      {isSyncing ? 'Syncing Sisu & Sierra...' : '⚡ Force Refresh Listings (Sisu + Sierra)'}
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
                        Click <strong>"Edit & Connect CRM"</strong> on any property to link Follow Up Boss leads/deals or Sisu IDs.
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
                        Open House Availability & CRM Integration Feed
                      </h4>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        Manage property inventory, Follow Up Boss connections, Sisu IDs, and agent open house eligibility.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Search property, agent, or seller..."
                        value={openHouseListingSearch}
                        onChange={(e) => setOpenHouseListingSearch(e.target.value)}
                        style={{ ...styles.input, width: '240px', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '520px', overflowY: 'auto' }}>
                    {listings
                      .filter(l => {
                        if (!openHouseListingSearch) return true;
                        const q = openHouseListingSearch.toLowerCase();
                        return (
                          (l.address || '').toLowerCase().includes(q) ||
                          (l.listing_agent_name || '').toLowerCase().includes(q) ||
                          (l.seller_contact_name || '').toLowerCase().includes(q) ||
                          (l.sisu_listing_id || '').toLowerCase().includes(q) ||
                          (l.mls_number || '').toLowerCase().includes(q)
                        );
                      })
                      .map(listing => {
                        const isAvailable = listing.is_open_house_enabled !== false;
                        const leadId = listing.seller_contact_id;
                        const dealId = listing.fub_deal_id;
                        const hasFub = Boolean(leadId || dealId || listing.fub_link);
                        const fubUrl = listing.fub_link || (leadId ? `https://brianburds.followupboss.com/2/people/view/${leadId}` : (dealId ? `https://brianburds.followupboss.com/2/deals/view/${dealId}` : null));

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
                                  style={{ width: '52px', height: '52px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--color-border)' }}
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              )}
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
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

                                  {hasFub ? (
                                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#059669', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                                      ✓ FUB Connected
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#d97706', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                                      ⚠️ FUB Unlinked
                                    </span>
                                  )}
                                </div>

                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
                                  <span>Agent: <strong>{listing.listing_agent_name || 'Syndicate'}</strong></span>
                                  <span>Seller: <strong>{listing.seller_contact_name || 'On File'}</strong></span>
                                  <span>Specs: <strong>{listing.bedrooms || 3}b/{listing.bathrooms || 2}ba {listing.sqft ? `• ${listing.sqft.toLocaleString()} sqft` : ''}</strong></span>
                                  {listing.sisu_listing_id && <span style={{ color: 'var(--color-slate-blue)' }}>{listing.sisu_listing_id}</span>}
                                </div>
                              </div>
                            </div>

                            {/* Actions, CRM Links & Toggle Controls */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                              {/* Edit / Connect CRM Button */}
                              <button
                                onClick={() => {
                                  setSelectedListingForEdit(listing);
                                  setShowListingEditModal(true);
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  padding: '0.4rem 0.75rem',
                                  borderRadius: '6px',
                                  border: '1px solid var(--color-border)',
                                  backgroundColor: 'var(--color-surface)',
                                  color: 'var(--color-dark-navy)',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                                title="Edit listing details, Follow Up Boss link, and Sisu settings"
                              >
                                <Edit2 size={13} /> Edit / Connect CRM
                              </button>

                              {fubUrl && (
                                <a
                                  href={fubUrl}
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
                                  title="Open record in Follow Up Boss"
                                >
                                  FUB #{leadId || dealId || 'Link'} ↗
                                </a>
                              )}

                              {/* Simple Toggle Switch */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.25rem' }}>
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

              {/* Scheduled Open Houses & Cancellations */}
              <div className="card mt-6">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <h2 className="text-lg m-0" style={{ color: 'var(--color-dark-navy)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={20} style={{ color: 'var(--color-primary)' }} />
                      Scheduled Open Houses & Master Roster ({bookings.filter(b => b.status === 'approved' || b.status === 'pending').length})
                    </h2>
                    <p className="text-muted text-sm" style={{ margin: '0.2rem 0 0 0' }}>
                      Manage active host bookings, remove or cancel slots when agent/owner schedules adjust.
                    </p>
                  </div>
                </div>

                {bookings.filter(b => b.status === 'approved' || b.status === 'pending').length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
                    No active or pending open houses scheduled at this time.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {bookings
                      .filter(b => b.status === 'approved' || b.status === 'pending')
                      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
                      .map(booking => {
                        const listing = listings.find(l => l.id === booking.listing_id || l.sisu_listing_id === booking.listing_id);
                        const displayAddress = listing?.address || booking.listing_address || 'Listing Address';
                        const displayPrice = listing?.price_formatted || booking.listing_price || '';
                        const isApproved = booking.status === 'approved';
                        const fubEventId = booking.fub_event_id;

                        return (
                          <div
                            key={booking.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '1rem',
                              borderRadius: '8px',
                              backgroundColor: isApproved ? 'var(--color-background)' : 'rgba(245, 158, 11, 0.05)',
                              border: `1px solid ${isApproved ? 'var(--color-border)' : 'rgba(245, 158, 11, 0.3)'}`,
                              gap: '1rem',
                              flexWrap: 'wrap'
                            }}
                          >
                            <div style={{ flex: '1 1 auto', minWidth: '280px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                                <span style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  backgroundColor: isApproved ? '#10b981' : '#f59e0b',
                                  color: 'white',
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '4px',
                                  textTransform: 'uppercase'
                                }}>
                                  {isApproved ? '✓ Scheduled & Synced' : '⏳ Pending Approval'}
                                </span>
                                <span style={{ fontWeight: 700, color: 'var(--color-dark-navy)', fontSize: '0.95rem' }}>
                                  {displayAddress}
                                </span>
                                {displayPrice && (
                                  <span style={{ fontSize: '0.8rem', color: 'var(--color-slate-blue)', fontWeight: 600 }}>
                                    {displayPrice}
                                  </span>
                                )}
                              </div>

                              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <span>📅 <strong>{booking.date}</strong> ({booking.start_time} - {booking.end_time})</span>
                                <span>👤 Host: <strong>{booking.agent_name}</strong> {booking.agent_phone ? `(${booking.agent_phone})` : ''}</span>
                                {fubEventId && (
                                  <span style={{ color: '#059669', fontWeight: 600 }}>
                                    🗓️ FUB Appt #{String(fubEventId).replace(/\D/g, '')}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              {!isApproved && (
                                <button
                                  onClick={() => handleApproveOpenHouse(booking.id)}
                                  disabled={approvingBookingId === booking.id}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    padding: '0.45rem 0.8rem',
                                    borderRadius: '6px',
                                    border: 'none',
                                    backgroundColor: 'var(--color-success)',
                                    color: 'white',
                                    fontSize: '0.82rem',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                  }}
                                >
                                  <Check size={14} /> {approvingBookingId === booking.id ? 'Approving...' : 'Approve'}
                                </button>
                              )}

                              <button
                                onClick={() => handleCancelOpenHouse(booking.id)}
                                disabled={cancellingBookingId === booking.id}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  padding: '0.45rem 0.8rem',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                                  color: 'var(--color-danger)',
                                  fontSize: '0.82rem',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                                title="Cancel Open House and remove appointment from Follow Up Boss calendar"
                              >
                                <Trash2 size={14} /> {cancellingBookingId === booking.id ? 'Cancelling...' : 'Cancel Open House'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Listing Edit Modal */}
              <ListingEditModal
                isOpen={showListingEditModal}
                listing={selectedListingForEdit}
                onClose={() => {
                  setShowListingEditModal(false);
                  setSelectedListingForEdit(null);
                }}
              />
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Subtabs Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--color-bg-secondary)', padding: '4px', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
              <button
                type="button"
                onClick={() => setMessagingSubTab('sms')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.55rem 1.1rem',
                  borderRadius: '7px',
                  border: 'none',
                  backgroundColor: messagingSubTab === 'sms' ? 'var(--color-primary)' : 'transparent',
                  color: messagingSubTab === 'sms' ? 'white' : 'var(--color-text-secondary)',
                  fontWeight: messagingSubTab === 'sms' ? '700' : '500',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Smartphone size={17} /> Linq SMS Broadcast
              </button>
              <button
                type="button"
                onClick={() => setMessagingSubTab('chat')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.55rem 1.1rem',
                  borderRadius: '7px',
                  border: 'none',
                  backgroundColor: messagingSubTab === 'chat' ? 'var(--color-primary)' : 'transparent',
                  color: messagingSubTab === 'chat' ? 'white' : 'var(--color-text-secondary)',
                  fontWeight: messagingSubTab === 'chat' ? '700' : '500',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <MessageSquare size={17} /> Direct Portal Chats
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              <Radio size={15} color="#10b981" />
              <span>Official Linq Line: <strong style={{ color: 'var(--color-dark-navy)' }}>+1 (915) 494-7984</strong></span>
            </div>
          </div>

          {messagingSubTab === 'sms' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Broadcast Header & Target Selector Card */}
              <div className="card" style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-dark-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Smartphone size={22} color="var(--color-primary)" /> LinqApp SMS Broadcast Center
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', margin: '0.25rem 0 0 0' }}>
                      Send direct SMS text messages to individual agents, directory groups, or your entire roster simultaneously.
                    </p>
                  </div>

                  {/* Target Audience Mode Selector */}
                  <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setSmsTargetType('group')}
                      style={{
                        padding: '0.4rem 0.75rem',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: smsTargetType === 'group' ? 'var(--color-dark-navy)' : 'transparent',
                        color: smsTargetType === 'group' ? 'white' : 'var(--color-text-secondary)',
                        fontWeight: '700',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Users size={13} style={{ display: 'inline', marginRight: '4px' }} /> Role / Group
                    </button>
                    <button
                      type="button"
                      onClick={() => setSmsTargetType('market')}
                      style={{
                        padding: '0.4rem 0.75rem',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: smsTargetType === 'market' ? 'var(--color-dark-navy)' : 'transparent',
                        color: smsTargetType === 'market' ? 'white' : 'var(--color-text-secondary)',
                        fontWeight: '700',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      <MapPin size={13} style={{ display: 'inline', marginRight: '4px' }} /> Market / Territory
                    </button>
                    <button
                      type="button"
                      onClick={() => setSmsTargetType('matrix')}
                      style={{
                        padding: '0.4rem 0.75rem',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: smsTargetType === 'matrix' ? 'var(--color-dark-navy)' : 'transparent',
                        color: smsTargetType === 'matrix' ? 'white' : 'var(--color-text-secondary)',
                        fontWeight: '700',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Sparkles size={13} style={{ display: 'inline', marginRight: '4px' }} /> Matrix (Role + Market)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSmsTargetType('all')}
                      style={{
                        padding: '0.4rem 0.75rem',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: smsTargetType === 'all' ? 'var(--color-dark-navy)' : 'transparent',
                        color: smsTargetType === 'all' ? 'white' : 'var(--color-text-secondary)',
                        fontWeight: '700',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Radio size={13} style={{ display: 'inline', marginRight: '4px' }} /> Entire Directory
                    </button>
                    <button
                      type="button"
                      onClick={() => setSmsTargetType('individual')}
                      style={{
                        padding: '0.4rem 0.75rem',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: smsTargetType === 'individual' ? 'var(--color-dark-navy)' : 'transparent',
                        color: smsTargetType === 'individual' ? 'white' : 'var(--color-text-secondary)',
                        fontWeight: '700',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      Individual / Custom
                    </button>
                  </div>
                </div>

                {/* Target Configuration Sub-Section */}
                {smsTargetType === 'group' && (
                  <div style={{ marginBottom: '1.25rem', padding: '1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-dark-navy)', marginBottom: '0.5rem' }}>
                      Select Target Role / Specialization:
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {[
                        { id: 'team_agent', label: '⭐ Full Team Agents' },
                        { id: 'showing_partner', label: '🤝 Showing Partners' },
                        { id: 'team_all', label: '🌟 All Team Agents & Partners' },
                        { id: 'flex_agent', label: '⚡ Flex Agents' },
                        { id: 'onboarding', label: '🚀 Onboarding Agents' },
                        { id: 'guest', label: '🎓 Guest Users (Classroom)' },
                        { id: 'admin', label: '🛡️ Administrators' }
                      ].map(g => {
                        const count = (agents || []).filter(a => {
                          const s = a.status || (a.profile?.role === 'Administrator' ? 'admin' : a.role === 'guest' || a.profile?.role === 'Guest' ? 'guest' : 'onboarding');
                          const subrole = a.profile?.team_subrole || 'team_agent';
                          if (g.id === 'admin') return s === 'admin' || a.profile?.role === 'Administrator';
                          if (g.id === 'flex_agent') return s === 'flex_agent';
                          if (g.id === 'team_agent') return s === 'team_agent' && subrole !== 'showing_partner';
                          if (g.id === 'showing_partner') return s === 'team_agent' && subrole === 'showing_partner';
                          if (g.id === 'team_all') return s === 'team_agent';
                          if (g.id === 'guest') return s === 'guest' || a.role === 'guest' || a.profile?.role === 'Guest';
                          return s === 'onboarding' || (!a.status && s !== 'admin' && s !== 'flex_agent' && s !== 'team_agent' && s !== 'guest');
                        }).length;

                        return (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => setSmsSelectedGroup(g.id)}
                            style={{
                              padding: '0.45rem 0.85rem',
                              borderRadius: '6px',
                              border: smsSelectedGroup === g.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                              backgroundColor: smsSelectedGroup === g.id ? 'rgba(0, 161, 224, 0.1)' : 'white',
                              color: smsSelectedGroup === g.id ? 'var(--color-primary)' : 'var(--color-text-primary)',
                              fontWeight: smsSelectedGroup === g.id ? '800' : '500',
                              fontSize: '0.82rem',
                              cursor: 'pointer'
                            }}
                          >
                            {g.label} ({count})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {smsTargetType === 'market' && (
                  <div style={{ marginBottom: '1.25rem', padding: '1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-dark-navy)', marginBottom: '0.5rem' }}>
                      Select Target Market / Territory:
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {[
                        { id: 'el_paso', label: '📍 El Paso (In-Market HQ)' },
                        { id: 'texas_all', label: '🤠 Texas (All TX Markets)' },
                        { id: 'texas_other', label: '🚗 Texas (Non-El Paso Markets)' },
                        { id: 'out_of_market', label: '✈️ Out of Market (All Non-EP)' },
                        { id: 'out_of_state', label: '🗺️ Out of State (Non-TX)' }
                      ].map(m => {
                        const count = (agents || []).filter(a => {
                          const market = getAgentMarket(a);
                          if (m.id === 'el_paso') return market === 'el_paso';
                          if (m.id === 'texas_all') return market === 'el_paso' || market === 'texas_other';
                          if (m.id === 'texas_other') return market === 'texas_other';
                          if (m.id === 'out_of_market') return market === 'texas_other' || market === 'out_of_state';
                          if (m.id === 'out_of_state') return market === 'out_of_state';
                          return true;
                        }).length;

                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setSmsSelectedMarket(m.id)}
                            style={{
                              padding: '0.45rem 0.85rem',
                              borderRadius: '6px',
                              border: smsSelectedMarket === m.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                              backgroundColor: smsSelectedMarket === m.id ? 'rgba(0, 161, 224, 0.1)' : 'white',
                              color: smsSelectedMarket === m.id ? 'var(--color-primary)' : 'var(--color-text-primary)',
                              fontWeight: smsSelectedMarket === m.id ? '800' : '500',
                              fontSize: '0.82rem',
                              cursor: 'pointer'
                            }}
                          >
                            {m.label} ({count})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {smsTargetType === 'matrix' && (
                  <div style={{ marginBottom: '1.25rem', padding: '1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--color-dark-navy)', marginBottom: '0.35rem' }}>
                          1. Filter by Role / Specialization:
                        </label>
                        <select
                          value={smsMatrixRole}
                          onChange={(e) => setSmsMatrixRole(e.target.value)}
                          style={styles.input}
                        >
                          <option value="all">👥 All Roles</option>
                          <option value="team_agent">⭐ Full Team Agents</option>
                          <option value="showing_partner">🤝 Showing Partners</option>
                          <option value="team_all">🌟 All Team Agents & Partners</option>
                          <option value="flex_agent">⚡ Flex Agents</option>
                          <option value="onboarding">🚀 Onboarding Agents</option>
                          <option value="guest">🎓 Guest Users</option>
                          <option value="admin">🛡️ Administrators</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--color-dark-navy)', marginBottom: '0.35rem' }}>
                          2. Filter by Market / Territory:
                        </label>
                        <select
                          value={smsMatrixMarket}
                          onChange={(e) => setSmsMatrixMarket(e.target.value)}
                          style={styles.input}
                        >
                          <option value="all">🌐 All Markets</option>
                          <option value="el_paso">📍 El Paso (In-Market HQ)</option>
                          <option value="texas_all">🤠 Texas (All TX)</option>
                          <option value="texas_other">🚗 Texas (Non-El Paso Markets)</option>
                          <option value="out_of_market">✈️ Out of Market (All Non-EP)</option>
                          <option value="out_of_state">🗺️ Out of State</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {smsTargetType === 'all' && (
                  <div style={{ marginBottom: '1.25rem', padding: '1rem', backgroundColor: 'rgba(0, 161, 224, 0.06)', borderRadius: '8px', border: '1px solid rgba(0, 161, 224, 0.2)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Radio size={22} color="var(--color-primary)" />
                    <div>
                      <div style={{ fontWeight: '700', color: 'var(--color-dark-navy)', fontSize: '0.9rem' }}>
                        Entire Syndicate Directory Broadcast
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        This text message will be individually delivered to every active agent, guest, and administrator with a registered phone number.
                      </div>
                    </div>
                  </div>
                )}

                {smsTargetType === 'individual' && (
                  <div style={{ marginBottom: '1.25rem', padding: '1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-dark-navy)', marginBottom: '0.4rem' }}>
                          Select Registered Agent:
                        </label>
                        <AgentAutocomplete
                          agents={agents}
                          placeholder="Search agent by name, email, or phone..."
                          onSelect={(agent) => {
                            setSmsSelectedAgent(agent);
                            setSmsCustomPhone('');
                          }}
                        />
                        {smsSelectedAgent && (
                          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '0.82rem' }}>
                            <span><strong>{smsSelectedAgent.name}</strong> ({smsSelectedAgent.profile?.phone || smsSelectedAgent.phone || 'No phone'})</span>
                            <button type="button" onClick={() => setSmsSelectedAgent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}>
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-dark-navy)', marginBottom: '0.4rem' }}>
                          Or Custom Phone Number & Name:
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input
                            type="text"
                            placeholder="Full Name (optional)"
                            value={smsCustomName}
                            onChange={(e) => {
                              setSmsCustomName(e.target.value);
                              if (e.target.value) setSmsSelectedAgent(null);
                            }}
                            style={{ ...styles.input, flex: 1 }}
                          />
                          <input
                            type="text"
                            placeholder="+1 (915) 555-0199"
                            value={smsCustomPhone}
                            onChange={(e) => {
                              setSmsCustomPhone(e.target.value);
                              if (e.target.value) setSmsSelectedAgent(null);
                            }}
                            style={{ ...styles.input, flex: 1 }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recipient Statistics & Expand Drawer */}
                {(() => {
                  const targetRecipients = getSmsRecipients();
                  const validRecipients = targetRecipients.filter(r => r.phone && r.phone.replace(/\D/g, '').length >= 10);
                  const missingPhoneRecipients = targetRecipients.filter(r => !r.phone || r.phone.replace(/\D/g, '').length < 10);

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: '700' }}>
                            <CheckCircle2 size={14} /> {validRecipients.length} Recipient{validRecipients.length === 1 ? '' : 's'} Ready to Text
                          </span>
                          {missingPhoneRecipients.length > 0 && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: '600' }}>
                              <AlertCircle size={14} /> {missingPhoneRecipients.length} Missing Phone Number
                            </span>
                          )}
                        </div>

                        {targetRecipients.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setShowRecipientsDrawer(!showRecipientsDrawer)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--color-primary)',
                              fontSize: '0.82rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            {showRecipientsDrawer ? 'Hide Recipient List ▲' : `View All ${targetRecipients.length} Recipients ▼`}
                          </button>
                        )}
                      </div>

                      {/* Expandable Recipient List Drawer */}
                      {showRecipientsDrawer && (
                        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '8px', backgroundColor: '#fafafa', padding: '0.5rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.5rem' }}>
                            {targetRecipients.map((r, idx) => {
                              const hasPhone = r.phone && r.phone.replace(/\D/g, '').length >= 10;
                              return (
                                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '0.4rem 0.6rem', backgroundColor: 'white', borderRadius: '6px', border: hasPhone ? '1px solid #e2e8f0' : '1px dashed #fca5a5', fontSize: '0.78rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: '600', color: 'var(--color-dark-navy)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                      {r.name}
                                    </span>
                                    <span style={{ color: hasPhone ? 'var(--color-text-muted)' : '#ef4444', fontWeight: hasPhone ? '400' : '700', fontSize: '0.74rem' }}>
                                      {hasPhone ? r.phone : 'No Phone'}
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.68rem', backgroundColor: '#f1f5f9', color: '#475569', padding: '1px 5px', borderRadius: '3px' }}>
                                      {r.role || r.group}
                                    </span>
                                    {r.market && (
                                      <span style={{ fontSize: '0.68rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '1px 5px', borderRadius: '3px' }}>
                                        📍 {r.market}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Templates and Merge Tags Header */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--color-dark-navy)' }}>
                      ⚡ QUICK TEMPLATES:
                    </span>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {[
                        { label: '🎓 New Training', text: 'Hey {firstName}! 🎓 A new training session has just been released in the Syndicate Classroom. Watch it here: https://agentsyndicate.com/classroom' },
                        { label: '🏡 Open House Alert', text: 'Team Alert! 🏡 New open house opportunities are now open for claiming on the portal: https://agentsyndicate.com/open-houses' },
                        { label: '🤝 Showing Partner Alert', text: 'Hey {firstName}! 🤝 New showing assistance opportunities are open in {market}. Check the open house board to claim yours: https://agentsyndicate.com/open-houses' },
                        { label: '📍 Market Mastermind', text: 'Hey {firstName}! 🚀 Reminder that our {market} mastermind call begins shortly. Check the training feed and calendar for Zoom details!' },
                        { label: '👋 Guest Welcome', text: 'Welcome to eXp Syndicate {firstName}! 🌟 Your guest account is ready. Access our designated training classes here: https://agentsyndicate.com/classroom' }
                      ].map((tpl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSmsMessage(tpl.text)}
                          style={{
                            padding: '0.25rem 0.6rem',
                            borderRadius: '4px',
                            border: '1px solid var(--color-border)',
                            backgroundColor: '#f8fafc',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: 'var(--color-dark-navy)',
                            cursor: 'pointer'
                          }}
                        >
                          {tpl.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Merge Tags Quick Insert */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', backgroundColor: '#f1f5f9', padding: '0.4rem 0.75rem', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-text-secondary)' }}>
                      Merge Tags:
                    </span>
                    {['{firstName}', '{name}', '{role}', '{market}', '{city}', '{state}', '{group}', '{team}'].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSmsMessage(prev => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + tag + ' ')}
                        style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: 'white',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: 'var(--color-primary)',
                          cursor: 'pointer'
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
                      Tags auto-personalize for each recipient
                    </span>
                  </div>
                </div>

                {/* Message Textarea */}
                <div style={{ position: 'relative', marginBottom: '1rem' }}>
                  <textarea
                    rows={4}
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    placeholder="Type your SMS message here... Use {firstName} to personalize."
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      fontSize: '0.92rem',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                      lineHeight: '1.5'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                    <span>
                      Length: <strong style={{ color: smsMessage.length > 160 ? '#f59e0b' : 'inherit' }}>{smsMessage.length}</strong> chars
                      {' '}({smsMessage.length <= 160 ? (smsMessage.length > 0 ? '1' : '0') : Math.ceil(smsMessage.length / 153)} SMS segment{smsMessage.length > 160 ? 's' : ''})
                    </span>
                    {smsMessage.length > 300 && (
                      <span style={{ color: '#f59e0b' }}>
                        ⚠️ Multi-segment message. Standard SMS rates may apply.
                      </span>
                    )}
                  </div>
                </div>

                {/* Send Button & Live Results */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={handleSendSmsBroadcast}
                      disabled={smsSending || !smsMessage.trim() || getSmsRecipients().filter(r => r.phone && r.phone.replace(/\D/g, '').length >= 10).length === 0}
                      className="btn-primary"
                      style={{
                        padding: '0.65rem 1.4rem',
                        fontSize: '0.92rem',
                        fontWeight: '700',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        backgroundColor: smsSending ? '#94a3b8' : 'var(--color-primary)',
                        cursor: smsSending ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {smsSending ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" /> Dispatching via LinqApp...
                        </>
                      ) : (
                        <>
                          <Send size={16} /> Send Linq SMS ({getSmsRecipients().filter(r => r.phone && r.phone.replace(/\D/g, '').length >= 10).length})
                        </>
                      )}
                    </button>
                    {smsMessage && (
                      <button
                        type="button"
                        onClick={() => setSmsMessage('')}
                        style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '0.85rem', cursor: 'pointer', padding: '0.5rem' }}
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    Powered by <strong>LinqApp Partner API v3</strong>
                  </div>
                </div>

                {/* Broadcast Outcome Banner */}
                {smsResult && (
                  <div style={{
                    marginTop: '1.25rem',
                    padding: '1rem',
                    borderRadius: '8px',
                    backgroundColor: smsResult.success ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                    border: smsResult.success ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem'
                  }}>
                    {smsResult.success ? <CheckCircle2 size={20} color="var(--color-success)" /> : <AlertCircle size={20} color="var(--color-danger)" />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', color: 'var(--color-dark-navy)', fontSize: '0.9rem' }}>
                        {smsResult.success ? `Broadcast Successfully Sent at ${smsResult.timestamp}` : 'Broadcast Encountered Issues'}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--color-text-primary)', marginTop: '0.2rem' }}>
                        {smsResult.success ? (
                          `Delivered to ${smsResult.sentCount} recipient(s). Failed: ${smsResult.failedCount}.`
                        ) : (
                          `Error: ${smsResult.error}`
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Preview Mockup Card */}
              <div className="card" style={{ padding: '1.5rem', backgroundColor: '#f8fafc' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-dark-navy)', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Eye size={18} color="var(--color-primary)" /> Live Recipient Phone Preview
                </h3>

                <div style={{ maxWidth: '420px', margin: '0 auto', backgroundColor: 'white', borderRadius: '18px', border: '1px solid #cbd5e1', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                  {/* Phone Header */}
                  <div style={{ backgroundColor: '#0f172a', color: 'white', padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: '700' }}>+1 (915) 494-7984</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>eXp Syndicate Linq Line</div>
                  </div>

                  {/* Phone Message Body */}
                  <div style={{ padding: '1.25rem 1rem', minHeight: '140px', backgroundColor: '#f1f5f9', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <div style={{
                      alignSelf: 'flex-start',
                      backgroundColor: 'white',
                      padding: '0.75rem 1rem',
                      borderRadius: '16px 16px 16px 4px',
                      maxWidth: '85%',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                      fontSize: '0.85rem',
                      color: '#1e293b',
                      lineHeight: '1.4'
                    }}>
                      {smsMessage ? (
                        smsMessage
                          .replace(/{firstName}/g, 'Alex')
                          .replace(/{name}/g, 'Alex Rivera')
                          .replace(/{group}/g, smsSelectedGroup.replace('_', ' '))
                          .replace(/{team}/g, 'eXp Syndicate')
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                          Message preview will appear here as you type...
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.4rem', paddingLeft: '4px' }}>
                      Today • SMS via LinqApp
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Direct In-App Chat Threads */
            <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', height: '600px' }}>
              {/* Thread List */}
              <div style={{ width: '300px', borderRight: '1px solid var(--color-border)', overflowY: 'auto', backgroundColor: 'var(--color-background)' }}>
                <h3 style={{ padding: '1rem', margin: 0, borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-card-bg)' }}>
                  In-App Messages
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
        </div>
      )}

      {activeTab === 'resources' && (
        <div className="mt-4">
          {/* Sub-Navigation for Resources vs Playbooks */}
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            marginBottom: '1.5rem',
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: '0.75rem'
          }}>
            <button
              onClick={() => setResourceSubTab('resources')}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: resourceSubTab === 'resources' ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                color: resourceSubTab === 'resources' ? '#ffffff' : 'var(--color-text-muted)',
                boxShadow: resourceSubTab === 'resources' ? '0 2px 6px rgba(0, 161, 224, 0.3)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <FileText size={16} /> 📚 Resource & Knowledge Base Manager
            </button>
            <button
              onClick={() => setResourceSubTab('playbooks')}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: resourceSubTab === 'playbooks' ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                color: resourceSubTab === 'playbooks' ? '#ffffff' : 'var(--color-text-muted)',
                boxShadow: resourceSubTab === 'playbooks' ? '0 2px 6px rgba(0, 161, 224, 0.3)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <BookOpen size={16} /> 📋 Playbook Catalog & Track Editor ({playbookCatalog?.length || 0})
            </button>
          </div>

          {resourceSubTab === 'resources' ? (
            <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
              <ResourceBoard />
            </div>
          ) : (
            <div>
              <PlaybookManager />
            </div>
          )}
        </div>
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
