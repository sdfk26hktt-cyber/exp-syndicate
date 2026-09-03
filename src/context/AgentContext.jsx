import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { 
  DEFAULT_LEVEL_THRESHOLDS, 
  DEFAULT_PHASE_UNLOCK_LEVELS, 
  getLevelInfo, 
  getPhaseUnlockStatus 
} from '../utils/gamification';
import { DEFAULT_COURSES } from '../utils/classroomDefaults';
import { DEFAULT_PHASES, DEFAULT_PLAYBOOK_CATALOG } from '../utils/playbookDefaults';

const AgentContext = createContext();

export const useAgent = () => useContext(AgentContext);

export const AgentProvider = ({ children }) => {
  const { currentUser } = useAuth();
  
  const [agents, setAgents] = useState([]);
  const [currentAgentData, setCurrentAgentData] = useState(null);
  const [playbookCatalog, setPlaybookCatalog] = useState(DEFAULT_PLAYBOOK_CATALOG);
  const [globalPlaybooks, setGlobalPlaybooks] = useState(DEFAULT_PHASES);
  const [phases, setPhases] = useState(DEFAULT_PHASES);
  const [xp, setXp] = useState(0);
  const [xpEvents, setXpEvents] = useState([]);
  
  const [adminSettings, setAdminSettings] = useState({
    defaultSponsor: { name: 'Brian Burds', phone: '(915) 256-6989', email: 'brian@brianburds.com' }
  });

  const [gamificationSettings, setGamificationSettings] = useState({
    levelThresholds: DEFAULT_LEVEL_THRESHOLDS,
    phaseUnlockLevels: DEFAULT_PHASE_UNLOCK_LEVELS
  });

  const [courses, setCourses] = useState(DEFAULT_COURSES);
  const [agentClassroomProgress, setAgentClassroomProgress] = useState({});

  const defaultProfile = {
    phone: '',
    altPhone: '',
    address: '',
    city: 'El Paso',
    state: 'TX',
    market: 'el_paso', // 'el_paso' | 'texas_other' | 'out_of_state'
    team_subrole: 'team_agent', // 'team_agent' | 'showing_partner'
    birthday: '',
    licenseNumber: '',
    website: '',
    instagram: '',
    linkedin: '',
    facebook: '',
    preferredContact: 'Phone Call',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
    interests: '',
    goals: ''
  };

  const loadAgents = async () => {
    const { data, error } = await supabase.from('agents').select('*');
    if (!error && data) {
      const realAgents = data.filter(a => !a.id?.startsWith('__SYSTEM_') && a.status !== 'system');
      setAgents(realAgents);
      return realAgents;
    }
    return [];
  };

  const loadGamificationSettings = async () => {
    try {
      const { data, error } = await supabase.from('agents').select('*').eq('id', '__SYSTEM_CONFIG_GAMIFICATION__').single();
      if (!error && data?.profile?.gamification) {
        const loaded = {
          levelThresholds: data.profile.gamification.levelThresholds || DEFAULT_LEVEL_THRESHOLDS,
          phaseUnlockLevels: data.profile.gamification.phaseUnlockLevels || DEFAULT_PHASE_UNLOCK_LEVELS
        };
        setGamificationSettings(loaded);
        localStorage.setItem('mockGamificationSettings', JSON.stringify(loaded));
        return loaded;
      }
    } catch (e) {
      console.log('Gamification settings lookup fallback:', e);
    }
    
    // Fallback to localStorage
    const saved = localStorage.getItem('mockGamificationSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setGamificationSettings(parsed);
        return parsed;
      } catch (err) {
        console.error('Error parsing mockGamificationSettings:', err);
      }
    }
    return {
      levelThresholds: DEFAULT_LEVEL_THRESHOLDS,
      phaseUnlockLevels: DEFAULT_PHASE_UNLOCK_LEVELS
    };
  };

  const loadXpEvents = async () => {
    try {
      const { data, error } = await supabase.from('xp_events').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        setXpEvents(data);
        localStorage.setItem('mockXpEvents', JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.log('xp_events table not found or error, using local fallback:', err);
    }
    const saved = localStorage.getItem('mockXpEvents');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setXpEvents(parsed);
        return parsed;
      } catch (err) {
        console.error('Error parsing mockXpEvents:', err);
      }
    }
    return [];
  };

  const loadPlaybookCatalog = async () => {
    try {
      const { data, error } = await supabase.from('agents').select('*').eq('id', '__SYSTEM_CONFIG_PLAYBOOK_CATALOG__').single();
      if (!error && data?.profile?.catalog && Array.isArray(data.profile.catalog) && data.profile.catalog.length > 0) {
        setPlaybookCatalog(data.profile.catalog);
        setGlobalPlaybooks(data.profile.catalog[0]?.phases || DEFAULT_PHASES);
        localStorage.setItem('syndicate_playbook_catalog', JSON.stringify(data.profile.catalog));
        return data.profile.catalog;
      }
    } catch (e) {
      console.log('Playbook catalog lookup fallback:', e);
    }

    // Check localStorage
    try {
      const saved = localStorage.getItem('syndicate_playbook_catalog');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPlaybookCatalog(parsed);
          setGlobalPlaybooks(parsed[0]?.phases || DEFAULT_PHASES);
          return parsed;
        }
      }
    } catch (e) {
      console.debug(e);
    }

    // Seed default catalog to Supabase if not present
    if (supabase) {
      try {
        await supabase.from('agents').upsert([{
          id: '__SYSTEM_CONFIG_PLAYBOOK_CATALOG__',
          name: 'Playbook Catalog Config',
          status: 'system',
          profile: { catalog: DEFAULT_PLAYBOOK_CATALOG, updated_at: new Date().toISOString() }
        }]);
      } catch (err) {
        console.debug('Error seeding default playbook catalog:', err);
      }
    }

    setPlaybookCatalog(DEFAULT_PLAYBOOK_CATALOG);
    setGlobalPlaybooks(DEFAULT_PLAYBOOK_CATALOG[0]?.phases || DEFAULT_PHASES);
    return DEFAULT_PLAYBOOK_CATALOG;
  };

  const loadGlobalPlaybooks = async () => {
    const catalog = await loadPlaybookCatalog();
    return catalog[0]?.phases || DEFAULT_PHASES;
  };

  const getPlaybookForAgent = (agent, catalog = playbookCatalog) => {
    const currentList = catalog && catalog.length > 0 ? catalog : DEFAULT_PLAYBOOK_CATALOG;
    if (!agent) return currentList[0];

    const assignedId = agent.profile?.playbook_id || agent.playbook_id;
    if (assignedId) {
      const found = currentList.find(p => p.id === assignedId);
      if (found) return found;
    }

    // Role-based smart fallback
    const subrole = agent.profile?.team_subrole;
    const status = agent.status;

    if (subrole === 'showing_partner') {
      const sp = currentList.find(p => p.id === 'pb-showing-partner' || p.targetRole === 'showing_partner');
      if (sp) return sp;
    }
    if (status === 'flex_agent' || subrole === 'flex_agent') {
      const flex = currentList.find(p => p.id === 'pb-flex-production' || p.targetRole === 'flex_agent');
      if (flex) return flex;
    }
    if (status === 'team_agent' || subrole === 'team_agent') {
      const team = currentList.find(p => p.id === 'pb-team-fast-track' || p.targetRole === 'team_agent');
      if (team) return team;
    }

    return currentList[0];
  };

  const savePlaybookCatalog = async (newCatalog) => {
    setPlaybookCatalog(newCatalog);
    setGlobalPlaybooks(newCatalog[0]?.phases || DEFAULT_PHASES);
    try {
      localStorage.setItem('syndicate_playbook_catalog', JSON.stringify(newCatalog));
    } catch (e) {
      console.debug(e);
    }

    if (supabase) {
      try {
        await supabase.from('agents').upsert([{
          id: '__SYSTEM_CONFIG_PLAYBOOK_CATALOG__',
          name: 'Playbook Catalog Config',
          status: 'system',
          profile: {
            catalog: newCatalog,
            updated_at: new Date().toISOString()
          }
        }]);
        // Also update legacy row for backward compatibility
        await supabase.from('agents').upsert([{
          id: '__SYSTEM_CONFIG_PLAYBOOKS__',
          name: 'Global Playbooks Config',
          status: 'system',
          profile: {
            playbooks: newCatalog[0]?.phases || DEFAULT_PHASES,
            updated_at: new Date().toISOString()
          }
        }]);
      } catch (err) {
        console.warn('Error saving playbook catalog to Supabase:', err);
      }
    }
  };

  const createPlaybook = async ({ title, description, targetRole, phases: newPhases }) => {
    const newPlaybook = {
      id: `pb-custom-${Date.now()}`,
      title: title || 'Custom Playbook',
      description: description || 'Custom milestone checklist for agents',
      targetRole: targetRole || 'all',
      isDefault: false,
      phases: newPhases || DEFAULT_PHASES
    };
    const nextCatalog = [...playbookCatalog, newPlaybook];
    await savePlaybookCatalog(nextCatalog);
    return newPlaybook;
  };

  const updatePlaybook = async (playbookId, updatedFields) => {
    const nextCatalog = playbookCatalog.map(pb => {
      if (pb.id === playbookId) {
        return { ...pb, ...updatedFields };
      }
      return pb;
    });
    await savePlaybookCatalog(nextCatalog);

    // If current agent is assigned this playbook, update their phases
    if (currentAgentData) {
      const myPlaybook = getPlaybookForAgent(currentAgentData, nextCatalog);
      if (myPlaybook.id === playbookId && updatedFields.phases) {
        setPhases(updatedFields.phases);
      }
    }
  };

  const deletePlaybook = async (playbookId) => {
    if (playbookCatalog.length <= 1) return;
    const nextCatalog = playbookCatalog.filter(pb => pb.id !== playbookId);
    await savePlaybookCatalog(nextCatalog);
  };

  const duplicatePlaybook = async (playbookId, newTitle) => {
    const source = playbookCatalog.find(pb => pb.id === playbookId) || playbookCatalog[0];
    const cloned = {
      ...source,
      id: `pb-clone-${Date.now()}`,
      title: newTitle || `${source.title} (Copy)`,
      isDefault: false,
      phases: JSON.parse(JSON.stringify(source.phases))
    };
    const nextCatalog = [...playbookCatalog, cloned];
    await savePlaybookCatalog(nextCatalog);
    return cloned;
  };

  const assignPlaybookToAgent = async (agentId, playbookId) => {
    const targetAgent = agents.find(a => a.id?.toLowerCase() === agentId?.toLowerCase());
    const selectedPb = playbookCatalog.find(p => p.id === playbookId) || playbookCatalog[0];
    if (!targetAgent || !selectedPb) return;

    const updatedProfile = {
      ...(targetAgent.profile || {}),
      playbook_id: playbookId
    };

    // Merge completed statuses if item IDs match
    const updatedPhases = selectedPb.phases.map(p => ({
      ...p,
      items: p.items.map(item => {
        const priorPhase = (targetAgent.phases || []).find(ph => ph.id === p.id);
        const priorItem = priorPhase?.items?.find(it => it.id === item.id);
        return priorItem ? { ...item, completed: priorItem.completed, currentStepIndex: priorItem.currentStepIndex || 0 } : item;
      })
    }));

    const updatedAgent = {
      ...targetAgent,
      profile: updatedProfile,
      phases: updatedPhases
    };

    if (supabase) {
      try {
        await supabase.from('agents').update({
          profile: updatedProfile,
          phases: updatedPhases
        }).ilike('id', agentId);
      } catch (err) {
        console.warn('Error saving assigned playbook to agent in Supabase:', err);
      }
    }

    setAgents(prev => prev.map(a => a.id?.toLowerCase() === agentId?.toLowerCase() ? updatedAgent : a));
    if (currentAgentData?.id?.toLowerCase() === agentId?.toLowerCase()) {
      setCurrentAgentData(updatedAgent);
      setPhases(updatedPhases);
    }
  };

  const batchAssignPlaybookToRole = async (targetRoleOrSubrole, playbookId) => {
    const selectedPb = playbookCatalog.find(p => p.id === playbookId);
    if (!selectedPb) return 0;

    const targetAgents = agents.filter(a => {
      if (a.status === 'system') return false;
      if (targetRoleOrSubrole === 'showing_partner') {
        return a.profile?.team_subrole === 'showing_partner';
      }
      if (targetRoleOrSubrole === 'team_agent') {
        return a.status === 'team_agent' || a.profile?.team_subrole === 'team_agent';
      }
      if (targetRoleOrSubrole === 'flex_agent') {
        return a.status === 'flex_agent' || a.profile?.team_subrole === 'flex_agent';
      }
      if (targetRoleOrSubrole === 'onboarding') {
        return a.status === 'onboarding' || a.status === 'pending';
      }
      return false;
    });

    for (const a of targetAgents) {
      await assignPlaybookToAgent(a.id, playbookId);
    }
    return targetAgents.length;
  };

  const CLASSROOM_CACHE_VERSION = '2026-08-27-v4';

  const loadCourses = async () => {
    try {
      // 1. Fetch from Supabase agents table system config row
      const { data, error } = await supabase.from('agents').select('*').eq('id', '__SYSTEM_CONFIG_CLASSROOM__').single();
      if (!error && data?.profile?.courses && Array.isArray(data.profile.courses) && data.profile.courses.length > 0) {
        setCourses(data.profile.courses);
        localStorage.setItem('mockClassroomCourses', JSON.stringify(data.profile.courses));
        localStorage.setItem('classroom_cache_version', CLASSROOM_CACHE_VERSION);
        return data.profile.courses;
      } else if (error && error.code === 'PGRST116') {
        // Seed default courses to Supabase
        await supabase.from('agents').upsert([{
          id: '__SYSTEM_CONFIG_CLASSROOM__',
          name: 'Classroom Courses Config',
          status: 'system',
          profile: { courses: DEFAULT_COURSES, updated_at: new Date().toISOString() }
        }]);
        setCourses(DEFAULT_COURSES);
        return DEFAULT_COURSES;
      }
    } catch (e) {
      console.log('Classroom courses cloud lookup fallback:', e);
    }

    // 2. Check cached courses in localStorage
    const cachedVersion = localStorage.getItem('classroom_cache_version');
    const saved = localStorage.getItem('mockClassroomCourses');
    
    if (saved && cachedVersion === CLASSROOM_CACHE_VERSION) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCourses(parsed);
          return parsed;
        }
      } catch (err) {
        console.error('Error parsing mockClassroomCourses:', err);
      }
    }

    // 3. Fallback to DEFAULT_COURSES
    setCourses(DEFAULT_COURSES);
    try {
      localStorage.setItem('mockClassroomCourses', JSON.stringify(DEFAULT_COURSES));
      localStorage.setItem('classroom_cache_version', CLASSROOM_CACHE_VERSION);
    } catch (e) {
      console.debug(e);
    }
    return DEFAULT_COURSES;
  };

  useEffect(() => {
    const init = async () => {
      const catalog = await loadPlaybookCatalog();
      const currentPlaybook = catalog[0]?.phases || DEFAULT_PHASES;
      const db = await loadAgents();
      await loadGamificationSettings();
      await loadXpEvents();
      await loadCourses();
      
      const settings = JSON.parse(localStorage.getItem('mockAdminSettings'));
      if (settings) setAdminSettings(settings);
      
      if (currentUser?.role === 'agent') {
        const myEmail = (currentUser.email || currentUser.id || '').toLowerCase();
        const myData = db.find(a => a.id?.toLowerCase() === myEmail);

        // Load classroom progress
        const savedProgressKey = `mockClassroomProgress_${myEmail}`;
        const localProg = localStorage.getItem(savedProgressKey);
        const remoteProgress = myData?.profile?.classroom_progress || (myData?.classroom_progress && typeof myData.classroom_progress === 'object' ? myData.classroom_progress : null);
        
        if (remoteProgress) {
          setAgentClassroomProgress(remoteProgress);
          localStorage.setItem(savedProgressKey, JSON.stringify(remoteProgress));
        } else if (localProg) {
          try {
            setAgentClassroomProgress(JSON.parse(localProg));
          } catch (e) {
            setAgentClassroomProgress({});
          }
        } else {
          setAgentClassroomProgress({});
        }
        
        if (myData) {
          const assignedPb = getPlaybookForAgent(myData, catalog);
          const assignedPhases = assignedPb?.phases || currentPlaybook;
          const savedPhases = myData.phases || assignedPhases;
          const mergedPhases = assignedPhases.map(assignedPhase => {
            const savedPhase = savedPhases.find(p => p.id === assignedPhase.id);
            if (!savedPhase) return assignedPhase;

            return {
              ...assignedPhase,
              items: assignedPhase.items.map(assignedItem => {
                const savedItem = savedPhase.items?.find(i => i.id === assignedItem.id);
                if (savedItem) {
                  return {
                    ...assignedItem,
                    completed: Boolean(savedItem.completed),
                    currentStepIndex: savedItem.currentStepIndex || 0
                  };
                }
                return assignedItem;
              })
            };
          });

          setPhases(mergedPhases);
          setXp(myData.xp || 0);
          setCurrentAgentData(myData);
        } else {
          // Init new agent
          const sponsorToUse = settings ? settings.defaultSponsor : adminSettings.defaultSponsor;
          const defaultPb = catalog[0] || DEFAULT_PLAYBOOK_CATALOG[0];
          const newAgent = { 
            id: currentUser.email || currentUser.id, 
            name: currentUser.name, 
            xp: 0, 
            phases: defaultPb.phases, 
            sponsor: sponsorToUse,
            profile: { ...defaultProfile, playbook_id: defaultPb.id },
            status: 'onboarding',
            current_phase: defaultPb.phases[0]?.id || 'apply'
          };
          
          await supabase.from('agents').insert([newAgent]);
          setPhases(defaultPb.phases);
          setXp(0);
          setCurrentAgentData(newAgent);
          setAgents([...db, newAgent]);
        }
      }
    };
    init();
  }, [currentUser]);

  /**
   * Records an XP event and updates agent total XP in real time
   */
  const recordXpEvent = async (agentId, amount, sourceType, sourceId = null, metadata = {}) => {
    if (!agentId || amount === 0) return;

    // Find agent current XP
    const targetAgent = agents.find(a => a.id?.toLowerCase() === agentId.toLowerCase());
    const currentAgentXp = targetAgent ? (Number(targetAgent.xp) || 0) : 0;
    const newTotalXp = Math.max(0, currentAgentXp + Number(amount));

    const newEvent = {
      id: `xp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      agent_id: agentId,
      source_type: sourceType,
      source_id: sourceId,
      xp_amount: Number(amount),
      metadata,
      created_at: new Date().toISOString()
    };

    // Update in-memory state immediately for instant responsive UI
    setXpEvents(prev => {
      const updated = [newEvent, ...prev];
      localStorage.setItem('mockXpEvents', JSON.stringify(updated));
      return updated;
    });

    setAgents(prevAgents => prevAgents.map(a => {
      if (a.id?.toLowerCase() === agentId.toLowerCase()) {
        return { ...a, xp: newTotalXp };
      }
      return a;
    }));

    if (currentAgentData && currentAgentData.id?.toLowerCase() === agentId.toLowerCase()) {
      setXp(newTotalXp);
      setCurrentAgentData(prev => ({ ...prev, xp: newTotalXp }));
    }

    // Persist to Supabase
    try {
      await supabase.from('agents').update({ xp: newTotalXp }).ilike('id', agentId);
      await supabase.from('xp_events').insert([newEvent]);
    } catch (err) {
      console.log('Error updating database for XP event:', err);
    }
  };

  /**
   * Admin Award XP
   */
  const awardAgentXp = async (agentId, amount, reason = 'Admin Bonus') => {
    await recordXpEvent(agentId, amount, 'manual_admin_award', null, { reason, awardedBy: currentUser?.name || 'Admin' });
  };

  /**
   * Update gamification settings
   */
  const updateGamificationSettings = async (newSettings) => {
    const updated = {
      levelThresholds: newSettings.levelThresholds || gamificationSettings.levelThresholds,
      phaseUnlockLevels: newSettings.phaseUnlockLevels || gamificationSettings.phaseUnlockLevels
    };
    setGamificationSettings(updated);
    localStorage.setItem('mockGamificationSettings', JSON.stringify(updated));

    try {
      await supabase.from('agents').upsert([{
        id: '__SYSTEM_CONFIG_GAMIFICATION__',
        name: 'Gamification Settings Config',
        status: 'system',
        profile: { gamification: updated, updated_at: new Date().toISOString() }
      }]);
    } catch (err) {
      console.error('Error saving gamification settings:', err);
    }
  };

  const toggleItem = async (phaseId, itemId) => {
    if (currentUser?.role !== 'agent' || !currentAgentData) return;

    let xpChange = 0;
    let targetItem = null;

    const newPhases = phases.map(phase => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          items: phase.items.map(item => {
            if (item.id === itemId) {
              targetItem = item;
              xpChange = item.completed ? -item.xp : item.xp;
              const isNowCompleted = !item.completed;
              return { 
                ...item, 
                completed: isNowCompleted,
                completedAt: isNowCompleted ? new Date().toISOString() : null
              };
            }
            return item;
          })
        };
      }
      return phase;
    });

    const newXp = Math.max(0, xp + xpChange);
    setPhases(newPhases);
    setXp(newXp);
    setCurrentAgentData(prev => ({ ...prev, phases: newPhases, xp: newXp }));

    // Record XP event
    if (targetItem) {
      const isCompleted = !targetItem.completed;
      const eventType = isCompleted ? 'playbook_task' : 'playbook_task_revert';
      await recordXpEvent(
        currentAgentData.id, 
        xpChange, 
        eventType, 
        itemId, 
        { phaseId, taskText: targetItem.text }
      );
    }

    await supabase.from('agents').update({ phases: newPhases, xp: newXp }).ilike('id', currentAgentData.id);
    loadAgents();
  };

  const updateTaskStep = async (phaseId, itemId, stepIndex) => {
    if (currentUser?.role !== 'agent' || !currentAgentData) return;

    const newPhases = phases.map(phase => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          items: phase.items.map(item => {
            if (item.id === itemId) {
              return { ...item, currentStepIndex: stepIndex };
            }
            return item;
          })
        };
      }
      return phase;
    });

    setPhases(newPhases);
    await supabase.from('agents').update({ phases: newPhases }).ilike('id', currentAgentData.id);
    loadAgents();
  };

  const getRank = (currentXp) => {
    const info = getLevelInfo(currentXp, gamificationSettings.levelThresholds);
    return info.title;
  };

  const getLevel = (currentXp) => {
    return getLevelInfo(currentXp, gamificationSettings.levelThresholds);
  };

  const getPhaseStatus = (phaseId, currentLevel, currentAgentXp) => {
    return getPhaseUnlockStatus(
      phaseId, 
      currentLevel, 
      currentAgentXp, 
      gamificationSettings.phaseUnlockLevels, 
      gamificationSettings.levelThresholds
    );
  };

  const addAgent = async (email, name, sponsorData, coSponsorData, initialPassword) => {
    const newAgent = { 
      id: email, 
      name: name, 
      xp: 0, 
      phases: globalPlaybooks,
      sponsor: sponsorData || adminSettings.defaultSponsor,
      co_sponsor: coSponsorData || null,
      profile: defaultProfile,
      status: 'onboarding',
      current_phase: 'col-1'
    };
    
    await supabase.from('agents').insert([newAgent]);
    loadAgents();

    if (initialPassword) {
      try {
        await supabase.auth.signUp({
          email: email,
          password: initialPassword
        });
      } catch (authErr) {
        console.log('Pre-signup notice:', authErr);
      }
    }

    try {
      await fetch('/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, name, password: initialPassword })
      });
    } catch (err) {
      console.error('Failed to trigger invite email:', err);
    }
  };

  const updateAdminSettings = (newSettings) => {
    const updated = { ...adminSettings, ...newSettings };
    setAdminSettings(updated);
    localStorage.setItem('mockAdminSettings', JSON.stringify(updated));
  };

  const updateAgentProfile = async (profileData, newName) => {
    if (!currentUser || currentUser.role !== 'agent' || !currentAgentData) return;
    
    const updatedProfile = { ...currentAgentData.profile, ...profileData };
    const updatedName = newName || currentAgentData.name;
    
    const { data } = await supabase.from('agents')
      .update({ name: updatedName, profile: updatedProfile })
      .ilike('id', currentAgentData.id)
      .select()
      .single();
      
    if (data) {
      setCurrentAgentData(data);
    }
    loadAgents();
  };

  const adminUpdateAgent = async (agentId, newName, profileData) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    const targetAgent = agents.find(a => a.id?.toLowerCase() === agentId.toLowerCase());
    if (!targetAgent) return;
    
    const updatedProfile = { ...(targetAgent.profile || {}), ...profileData };
    const updatedName = newName || targetAgent.name;
    
    await supabase.from('agents')
      .update({ name: updatedName, profile: updatedProfile })
      .ilike('id', agentId);
      
    if (currentAgentData?.id?.toLowerCase() === agentId.toLowerCase()) {
      setCurrentAgentData({ ...currentAgentData, name: updatedName, profile: updatedProfile });
    }
    loadAgents();
  };

  const adminChangeAgentEmail = async (oldEmail, newEmail, profileData = {}, newName = '') => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error("Unauthorized: Only administrators can update agent emails.");
    }
    const safeOldEmail = (oldEmail || '').toLowerCase().trim();
    const safeNewEmail = (newEmail || '').toLowerCase().trim();

    if (!safeNewEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeNewEmail)) {
      throw new Error("Please enter a valid email address.");
    }

    if (safeOldEmail === safeNewEmail) {
      // Just update profile and name if email unchanged
      return adminUpdateAgent(safeOldEmail, newName, profileData);
    }

    // 1. Try serverless endpoint first
    try {
      const response = await fetch('/api/admin/update-agent-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldEmail: safeOldEmail,
          newEmail: safeNewEmail,
          requestedBy: currentUser.email || currentUser.id
        })
      });

      if (response.ok) {
        const result = await response.json();
        // If we also have profileData or newName, update them on the new record
        if (Object.keys(profileData).length > 0 || newName) {
          const targetAgent = agents.find(a => a.id?.toLowerCase() === safeOldEmail) || {};
          const updatedProfile = { ...(targetAgent.profile || {}), ...profileData, email: safeNewEmail };
          const updatedName = newName || targetAgent.name || safeNewEmail.split('@')[0];
          await supabase.from('agents').update({ name: updatedName, profile: updatedProfile }).ilike('id', safeNewEmail);
        }
        await loadAgents();
        return result;
      } else {
        const errJson = await response.json().catch(() => ({}));
        if (response.status === 409 || errJson.error?.includes('already exists')) {
          throw new Error(errJson.error || `Email "${safeNewEmail}" is already in use.`);
        }
      }
    } catch (apiErr) {
      if (apiErr.message && (apiErr.message.includes('already') || apiErr.message.includes('Unauthorized') || apiErr.message.includes('valid email'))) {
        throw apiErr;
      }
      console.warn('API endpoint unavailable, falling back to direct database migration:', apiErr);
    }

    // 2. Direct client-side database migration fallback
    const { data: existingAgent } = await supabase.from('agents').select('id').ilike('id', safeNewEmail).maybeSingle();
    if (existingAgent && existingAgent.id.toLowerCase().trim() !== safeOldEmail) {
      throw new Error(`An account with email "${safeNewEmail}" already exists in the syndicate.`);
    }

    const targetAgent = agents.find(a => a.id?.toLowerCase() === safeOldEmail);
    const { data: oldAgentData } = await supabase.from('agents').select('*').ilike('id', safeOldEmail).maybeSingle();
    const sourceData = oldAgentData || targetAgent;

    if (sourceData) {
      const updatedProfile = { ...(sourceData.profile || {}), ...profileData, email: safeNewEmail };
      const updatedName = newName || sourceData.name || safeNewEmail.split('@')[0];
      const newAgentRecord = {
        ...sourceData,
        id: safeNewEmail,
        name: updatedName,
        profile: updatedProfile
      };

      await supabase.from('agents').upsert([newAgentRecord]);
      if (safeOldEmail !== safeNewEmail) {
        await supabase.from('agents').delete().ilike('id', safeOldEmail);
      }
    }

    try {
      const { data: adminRecord } = await supabase.from('admins').select('*').ilike('email', safeOldEmail).maybeSingle();
      if (adminRecord) {
        await supabase.from('admins').upsert([{ email: safeNewEmail }]);
        if (safeOldEmail !== safeNewEmail) {
          await supabase.from('admins').delete().ilike('email', safeOldEmail);
        }
      }
    } catch (admErr) {
      console.warn('Admin table migration fallback error:', admErr);
    }

    try {
      await supabase.from('open_house_bookings').update({ agent_email: safeNewEmail, claimed_by: safeNewEmail }).ilike('agent_email', safeOldEmail);
    } catch (ohErr) {
      console.warn('Open houses migration error:', ohErr);
    }

    try {
      await supabase.from('posts').update({ author_id: safeNewEmail }).ilike('author_id', safeOldEmail);
    } catch (postErr) {
      console.warn('Posts migration error:', postErr);
    }

    await loadAgents();
    return { success: true, oldEmail: safeOldEmail, newEmail: safeNewEmail };
  };

  const getAgentMarket = (agent) => {
    if (!agent) return 'el_paso';
    const p = agent.profile || {};
    if (p.market) return p.market;
    
    // Auto-infer from state/city/address if not explicitly specified
    const addr = (p.address || agent.address || '').toLowerCase();
    const state = (p.state || '').toUpperCase().trim();
    const city = (p.city || '').toLowerCase().trim();

    if (city.includes('el paso') || addr.includes('el paso') || addr.includes('799') || addr.includes('anthony') || addr.includes('canutillo') || addr.includes('horizon') || addr.includes('socorro')) {
      return 'el_paso';
    }
    if (state === 'TX' || state === 'TEXAS' || addr.includes(' texas') || addr.includes(', tx') || addr.includes(' tx ')) {
      return 'texas_other';
    }
    if (state && state !== 'TX' && state !== 'TEXAS') {
      return 'out_of_state';
    }
    return 'el_paso'; // Default to team HQ market
  };

  const getAgentMarketLabel = (agent) => {
    const m = getAgentMarket(agent);
    if (m === 'el_paso') return 'El Paso (In-Market)';
    if (m === 'texas_other') return 'Texas (Other TX)';
    if (m === 'out_of_state') return 'Out of State';
    return 'In-Market';
  };

  const getAgentRoleLabel = (agent) => {
    if (!agent) return 'Agent';
    const status = agent.status || (agent.profile?.role === 'Administrator' ? 'admin' : agent.role === 'guest' ? 'guest' : 'onboarding');
    if (status === 'admin' || agent.profile?.role === 'Administrator') return 'Administrator';
    if (status === 'guest' || agent.role === 'guest' || agent.profile?.role === 'Guest') return 'Guest';
    if (status === 'team_agent') {
      const subrole = agent.profile?.team_subrole || 'team_agent';
      return subrole === 'showing_partner' ? 'Showing Partner' : 'Team Agent';
    }
    if (status === 'flex_agent') return 'Flex Agent';
    if (status === 'onboarding') return 'Onboarding Agent';
    return 'Agent';
  };

  const isAgentInMarket = (agent) => getAgentMarket(agent) === 'el_paso';
  const isAgentTexas = (agent) => {
    const m = getAgentMarket(agent);
    return m === 'el_paso' || m === 'texas_other';
  };
  const isAgentOutOfMarket = (agent) => {
    const m = getAgentMarket(agent);
    return m === 'texas_other' || m === 'out_of_state';
  };

  const updateAgentStatus = async (agentId, newStatus) => {
    await supabase.from('agents').update({ status: newStatus }).ilike('id', agentId);
    if (currentAgentData?.id?.toLowerCase() === agentId.toLowerCase()) {
      setCurrentAgentData({ ...currentAgentData, status: newStatus });
    }
    loadAgents();
  };

  const adminUpdateAgentRoleAndMarket = async (agentId, newStatus, teamSubrole, market) => {
    const target = agents.find(a => a.id?.toLowerCase() === agentId.toLowerCase());
    const existingProfile = target?.profile || {};
    const updatedProfile = {
      ...existingProfile,
      ...(teamSubrole ? { team_subrole: teamSubrole } : {}),
      ...(market ? { market: market } : {})
    };

    const updatePayload = {
      ...(newStatus ? { status: newStatus } : {}),
      profile: updatedProfile
    };

    await supabase.from('agents').update(updatePayload).ilike('id', agentId);
    if (currentAgentData?.id?.toLowerCase() === agentId.toLowerCase()) {
      setCurrentAgentData({ ...currentAgentData, ...updatePayload });
    }
    loadAgents();
  };

  const updateAgentPhase = async (agentId, newPhaseId) => {
    await supabase.from('agents').update({ current_phase: newPhaseId }).ilike('id', agentId);
    if (currentAgentData?.id?.toLowerCase() === agentId.toLowerCase()) {
      setCurrentAgentData({ ...currentAgentData, current_phase: newPhaseId });
    }
    loadAgents();
  };

  const deleteAgent = async (agentId) => {
    await supabase.from('agents').delete().ilike('id', agentId);
    if (currentAgentData?.id?.toLowerCase() === agentId.toLowerCase()) {
      setCurrentAgentData(null);
    }
    loadAgents();
  };

  const updateGlobalPlaybooks = async (newPlaybook) => {
    setGlobalPlaybooks(newPlaybook);
    localStorage.setItem('mockGlobalPlaybooks', JSON.stringify(newPlaybook));
    try {
      await supabase.from('agents').upsert([{
        id: '__SYSTEM_CONFIG_PLAYBOOKS__',
        name: 'Global Playbooks Config',
        status: 'system',
        profile: { playbooks: newPlaybook, updated_at: new Date().toISOString() }
      }]);
    } catch (err) {
      console.error('Error saving global playbooks:', err);
    }
  };

  const toggleLessonCompletion = async (courseId, lessonId, xpAmount = 25, courseTitle = '', lessonTitle = '') => {
    if (!currentUser) return;
    const agentId = (currentAgentData?.id || currentUser.email || currentUser.id || '').toLowerCase();
    const currentCompleted = agentClassroomProgress[courseId] || [];
    const isCompleted = currentCompleted.includes(lessonId);

    let updatedCompleted;
    let xpChange;

    if (isCompleted) {
      // Uncomplete
      updatedCompleted = currentCompleted.filter(id => id !== lessonId);
      xpChange = -xpAmount;
    } else {
      // Complete
      updatedCompleted = [...currentCompleted, lessonId];
      xpChange = xpAmount;
    }

    const updatedProgress = {
      ...agentClassroomProgress,
      [courseId]: updatedCompleted
    };

    setAgentClassroomProgress(updatedProgress);
    localStorage.setItem(`mockClassroomProgress_${agentId}`, JSON.stringify(updatedProgress));

    // Record XP event
    if (xpChange !== 0) {
      const newXp = Math.max(0, xp + xpChange);
      setXp(newXp);
      const eventType = xpChange > 0 ? 'classroom_lesson_completed' : 'classroom_lesson_uncompleted';
      await recordXpEvent(
        agentId,
        xpChange,
        eventType,
        lessonId,
        { courseId, courseTitle, lessonTitle }
      );
    }

    // Persist to Supabase agents record inside profile JSONB
    try {
      const { data: currentAgent } = await supabase.from('agents').select('profile').ilike('id', agentId).single();
      const updatedProfile = {
        ...(currentAgent?.profile || {}),
        classroom_progress: updatedProgress
      };
      await supabase.from('agents').update({
        profile: updatedProfile
      }).ilike('id', agentId);
    } catch (err) {
      console.log('Error updating agent classroom_progress:', err);
    }
  };

  const updateGlobalCourses = async (newCourses) => {
    setCourses(newCourses);
    localStorage.setItem('mockClassroomCourses', JSON.stringify(newCourses));
    try {
      await supabase.from('agents').upsert([{
        id: '__SYSTEM_CONFIG_CLASSROOM__',
        name: 'Classroom Courses Config',
        status: 'system',
        profile: { courses: newCourses, updated_at: new Date().toISOString() }
      }]);
    } catch (err) {
      console.log('Error saving classroom courses to Supabase:', err);
    }
  };

  const activePlaybook = getPlaybookForAgent(currentAgentData, playbookCatalog);

  return (
    <AgentContext.Provider value={{ 
      agents, 
      phases, 
      globalPlaybooks, 
      playbookCatalog,
      activePlaybook,
      loadPlaybookCatalog,
      savePlaybookCatalog,
      createPlaybook,
      updatePlaybook,
      deletePlaybook,
      duplicatePlaybook,
      getPlaybookForAgent,
      assignPlaybookToAgent,
      batchAssignPlaybookToRole,
      xp, 
      xpEvents,
      gamificationSettings,
      courses,
      agentClassroomProgress,
      currentAgentData, 
      adminSettings, 
      toggleItem, 
      updateTaskStep, 
      toggleLessonCompletion,
      updateGlobalCourses,
      loadCourses,
      getRank, 
      getLevel,
      getPhaseStatus,
      recordXpEvent,
      awardAgentXp,
      updateGamificationSettings,
      addAgent, 
      updateAdminSettings, 
      updateAgentProfile, 
      adminUpdateAgent, 
      adminChangeAgentEmail, 
      updateAgentStatus, 
      adminUpdateAgentRoleAndMarket,
      getAgentMarket,
      getAgentMarketLabel,
      getAgentRoleLabel,
      isAgentInMarket,
      isAgentTexas,
      isAgentOutOfMarket,
      updateAgentPhase, 
      deleteAgent, 
      updateGlobalPlaybooks,
      loadAgents
    }}>
      {children}
    </AgentContext.Provider>
  );
};
