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

const AgentContext = createContext();

export const useAgent = () => useContext(AgentContext);

const DEFAULT_PHASES = [
  {
    id: 'apply',
    title: 'Phase 1: Apply',
    description: 'Submit your application, name your sponsor, and sign your ICA.',
    items: [
      { id: '1-1', text: 'Gather license #, banking, payment, and intended board/MLS', completed: false, xp: 10, details: 'Have this ready: Texas real estate license number, commission preference, direct deposit info, set-up fee payment method.' },
      { 
        id: '1-2', 
        text: 'Submit Join Application at join.exprealty.com', 
        completed: false, 
        xp: 25, 
        details: 'Go to join.exprealty.com. Mismatches in names are the #1 cause of onboarding delays. Ensure it exactly matches your TREC license.',
        currentStepIndex: 0,
        steps: [
          { title: "Navigate to Join Portal", instruction: "Open a new tab and go to join.exprealty.com.", link: "https://join.exprealty.com" },
          { title: "Select 'Apply as Agent'", instruction: "On the top right of the page, click the button that says 'Apply as Agent'." },
          { title: "Create Guest Account", instruction: "Enter your email address to create a guest account. You will receive a pin code to verify." },
          { title: "Fill Application", instruction: "Fill out the application. IMPORTANT: Ensure your name EXACTLY matches your TREC license. Mismatches are the #1 cause of delays." },
          { title: "Submit & Save", instruction: "Submit the application. You will receive a confirmation email. Save the Guest Pass and Personal Code from that email." }
        ]
      },
      { id: '1-3', text: 'Name Brian Burds as sponsor (confirm photo)', completed: false, xp: 50, details: 'When asked who was most responsible for your decision, search and select Brian Burds. This unlocks our team\'s support.' },
      { id: '1-4', text: 'Save Guest Pass + Personal Code from first email', completed: false, xp: 10, details: 'You will receive a Guest Pass for eXp World and a Personal Code to track onboarding status.' },
      { 
        id: '1-5', 
        text: 'Sign the Independent Contractor Agreement (ICA)', 
        completed: false, 
        xp: 25, 
        details: '33-page document sent via e-signature. You must keep a payment source on file.',
        currentStepIndex: 0,
        steps: [
          { title: "Wait for Email", instruction: "Keep an eye on your inbox for the Independent Contractor Agreement (ICA) from eXp." },
          { title: "Review Document", instruction: "Carefully review the 33-page document outlining your commission splits and responsibilities." },
          { title: "Payment Source", instruction: "You will need to input a payment source to keep on file for your monthly tech/brokerage fees." },
          { title: "Sign & Submit", instruction: "Sign the document via the e-signature portal and submit it." }
        ]
      },
    ]
  },
  {
    id: 'process',
    title: 'Phase 2: Process',
    description: 'eXp verifies your license and countersigns your ICA.',
    items: [
      { id: '2-1', text: 'ICA countersigned by eXp', completed: false, xp: 10, details: 'You will get an email saying "Welcome to eXp Realty — Let\'s get started".' },
      { 
        id: '2-2', 
        text: 'Check status at onboardingstatus.expenterprise.com', 
        completed: false, 
        xp: 10, 
        details: 'Use your Personal Code to check your live status. If it stalls past 24 hours, contact the Texas Broker Team.',
        currentStepIndex: 0,
        steps: [
          { title: "Navigate to Status Portal", instruction: "Go to the eXp Enterprise Onboarding Status portal.", link: "https://onboardingstatus.expenterprise.com" },
          { title: "Enter Code", instruction: "Input the Personal Code you received in your initial welcome email." },
          { title: "Check Status", instruction: "Review what stage your application is currently in." },
          { title: "Escalate if Stalled", instruction: "If your status has not changed in over 24 hours, immediately email tx.broker@exprealty.net for an update." }
        ]
      },
      { id: '2-3', text: 'Receive Texas Broker Team license-transfer email', completed: false, xp: 10, details: 'State-specific instructions will arrive within 24-48 hours.' },
    ]
  },
  {
    id: 'activate',
    title: 'Phase 3: Activate',
    description: 'Transfer your license, set up email, and activate core systems.',
    items: [
      { 
        id: '3-1', 
        text: 'Request sponsorship in TREC under eXp (603392-BB)', 
        completed: false, 
        xp: 100, 
        critical: true, 
        details: 'Log into TREC REALM Portal. Request sponsorship under eXp Realty LLC (License: 603392-BB). Call Brian if you need help walking through this!',
        currentStepIndex: 0,
        steps: [
          { title: "Log into TREC", instruction: "Go to the Texas Real Estate Commission (TREC) website and log into your REALM Portal.", link: "https://mylicense.trec.texas.gov/" },
          { title: "Manage Sponsorship", instruction: "From your dashboard, find the 'Manage My Sponsorship' dropdown or section." },
          { title: "Request eXp Realty", instruction: "Submit a request to be sponsored by eXp Realty LLC. Enter license number: 603392-BB." },
          { title: "Pay Fee", instruction: "Pay the required TREC transfer fee (usually around $10)." },
          { title: "Wait for Approval", instruction: "Once submitted, eXp's Texas Broker Team will approve it, usually within 24 hours. If it stalls, email tx.broker@exprealty.net." }
        ]
      },
      { id: '3-2', text: 'Confirm license moved to eXp in TREC', completed: false, xp: 20, details: 'If it hasn\'t moved in 24 hours, email tx.broker@exprealty.net.' },
      { 
        id: '3-3', 
        text: 'Set up eXp email + forwarding', 
        completed: false, 
        xp: 25, 
        details: 'Crucial: set up forwarding to your everyday inbox so you never miss a message.',
        currentStepIndex: 0,
        steps: [
          { title: "Login to Enterprise", instruction: "Go to expenterprise.com and log in with your new eXp credentials." },
          { title: "Access Email", instruction: "Click on the 'eXp Email' tab to activate your @exprealty.com email address." },
          { title: "Set Forwarding", instruction: "In your eXp email settings, configure mail forwarding to send all emails to your primary personal inbox so you never miss a message." }
        ]
      },
      { id: '3-4', text: 'Log into eXp Enterprise', completed: false, xp: 10, details: 'This is your central hub for all eXp apps and services.' },
      { id: '3-5', text: 'Set up Skyslope', completed: false, xp: 25, details: 'This is where you will submit your transactions for compliance and payment.' },
    ]
  },
  {
    id: 'launch',
    title: 'Phase 4: Launch',
    description: 'Join your local board, set up marketing, and schedule your launch call.',
    items: [
      { 
        id: '4-1', 
        text: 'Join Local Association (GEPAR / Las Cruces)', 
        completed: false, 
        xp: 50, 
        critical: true, 
        details: 'Mandatory: you have 2 weeks to join the board or your license gets returned to TREC.',
        currentStepIndex: 0,
        steps: [
          { title: "Choose Association", instruction: "Decide whether you are joining the Greater El Paso Association of Realtors (GEPAR) or the Las Cruces association." },
          { title: "Download Forms", instruction: "Go to their respective website and download the New Member or Transfer forms." },
          { title: "Fill Details", instruction: "Fill out the forms using eXp's Texas West Broker details: Rick Snow, rick.snow@exprealty.net, 915-260-6131." },
          { title: "Submit & Pay", instruction: "Submit the forms and pay any required board dues. IMPORTANT: You must complete this within 2 weeks of joining eXp or your license will be returned to TREC." }
        ]
      },
      { id: '4-2', text: 'Enroll in Mentor Program (if applicable)', completed: false, xp: 20, details: 'Required if you have had fewer than 3 transactions in the last 12 months.' },
      { id: '4-3', text: 'Attend New Agent Orientation in eXp World', completed: false, xp: 20, details: 'Texas State Meeting is Tuesdays at 9AM CST. Orientation is 2nd & 4th Tuesday.' },
      { id: '4-4', text: 'Order New Agent Starter Kit', completed: false, xp: 20, details: 'First 1,000 business cards are free via BuildASign Enterprise.' },
      { 
        id: '4-5', 
        text: 'Add IABS/CPN to email + social', 
        completed: false, 
        xp: 25, 
        details: 'Texas law requires all agents to provide written notice via the IABS form.',
        currentStepIndex: 0,
        steps: [
          { title: "Locate the Form", instruction: "The most recent version of the eXp Prefilled IABS can be found in SkySlope Forms under the 'eXp Texas Broker Library'." },
          { title: "Email Signature", instruction: "Attach or link the IABS to your professional email signature to satisfy TREC representation disclosure guidelines." },
          { title: "Facebook & LinkedIn", instruction: "For FB: Upload the IABS/CPN as photos to your business page and pin them to the top. For LinkedIn: Upload the documents or add links in your About section." },
          { title: "Instagram & Twitter", instruction: "Ensure your primary website URL is clearly visible in your bio. Your website MUST prominently feature the IABS/CPN links." },
          { title: "TikTok", instruction: "Switch your account to a Business Account. Go to Edit Profile -> Add your website. Paste your website URL (which contains your IABS) into the bio link." }
        ]
      },
      { 
        id: '4-6', 
        text: 'Text Brian to schedule team launch call', 
        completed: false, 
        xp: 50, 
        details: 'Text (915) 256-6989 to build your 30/60/90-day plan and get into lead flow.',
        currentStepIndex: 0,
        steps: [
          { title: "Draft Text", instruction: "Draft a text letting Brian know you have officially completed all major onboarding phases." },
          { title: "Send to Brian", instruction: "Send the text to (915) 256-6989." },
          { title: "Schedule Call", instruction: "Find a time to sit down and map out your 30/60/90-day launch plan." },
          { title: "Start Lead Flow", instruction: "During your call, get integrated into the team's lead flow systems so you can start closing deals!" }
        ]
      },
    ]
  },
  {
    id: 'zillow',
    title: 'Phase 5: Zillow Enrollment',
    description: 'Get onboarded to Follow Up Boss and added to Zillow Premier.',
    items: [
      { 
        id: '5-1', 
        text: 'Reach out to David Bitoon to get added to Zillow Premier', 
        completed: false, 
        xp: 50, 
        details: 'Contact David Bitoon by text at (915) 800-7543 for your Zillow Premier agent account setup.',
        currentStepIndex: 0,
        steps: [
          { title: "Text David Bitoon", instruction: "Send a text message to David at (915) 800-7543 letting him know you are ready to be added to Zillow Premier." }
        ]
      },
      { id: '5-2', text: 'Schedule appointment with Brenda Faudoa', completed: false, xp: 50, details: 'Meet with Brenda to get onboarded to Follow Up Boss and View El Paso Homes.' },
      { id: '5-3', text: 'Watch Training on Follow Up Boss compliance', completed: false, xp: 50, details: 'Watch the required training to maintain compliance with your Zillow leads inside Follow Up Boss.' },
    ]
  }
];

export const AgentProvider = ({ children }) => {
  const { currentUser } = useAuth();
  
  const [agents, setAgents] = useState([]);
  const [currentAgentData, setCurrentAgentData] = useState(null);
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
      setAgents(data);
      return data;
    }
    return [];
  };

  const loadGamificationSettings = async () => {
    try {
      const { data, error } = await supabase.from('global_settings').select('*').eq('id', 'gamification_settings').single();
      if (!error && data?.data) {
        const loaded = {
          levelThresholds: data.data.levelThresholds || DEFAULT_LEVEL_THRESHOLDS,
          phaseUnlockLevels: data.data.phaseUnlockLevels || DEFAULT_PHASE_UNLOCK_LEVELS
        };
        setGamificationSettings(loaded);
        localStorage.setItem('mockGamificationSettings', JSON.stringify(loaded));
        return loaded;
      } else if (error && error.code === 'PGRST116') {
        const defaultSettings = {
          levelThresholds: DEFAULT_LEVEL_THRESHOLDS,
          phaseUnlockLevels: DEFAULT_PHASE_UNLOCK_LEVELS
        };
        await supabase.from('global_settings').insert([{ id: 'gamification_settings', data: defaultSettings }]);
        setGamificationSettings(defaultSettings);
        return defaultSettings;
      }
    } catch (e) {
      console.error('Failed to load gamification settings:', e);
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

  const loadGlobalPlaybooks = async () => {
    try {
      const { data, error } = await supabase.from('global_settings').select('*').eq('id', 'global_playbook').single();
      if (!error && data?.data) {
        setGlobalPlaybooks(data.data);
        return data.data;
      } else if (error && error.code === 'PGRST116') {
        await supabase.from('global_settings').insert([{ id: 'global_playbook', data: DEFAULT_PHASES }]);
        setGlobalPlaybooks(DEFAULT_PHASES);
        return DEFAULT_PHASES;
      }
      return DEFAULT_PHASES;
    } catch (e) {
      console.error(e);
      return DEFAULT_PHASES;
    }
  };

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase.from('global_settings').select('*').eq('id', 'classroom_courses').single();
      if (!error && data?.data && Array.isArray(data.data)) {
        setCourses(data.data);
        localStorage.setItem('mockClassroomCourses', JSON.stringify(data.data));
        return data.data;
      } else if (error && error.code === 'PGRST116') {
        await supabase.from('global_settings').insert([{ id: 'classroom_courses', data: DEFAULT_COURSES }]);
        setCourses(DEFAULT_COURSES);
        return DEFAULT_COURSES;
      }
    } catch (e) {
      console.log('Classroom courses settings table lookup fallback:', e);
    }
    const saved = localStorage.getItem('mockClassroomCourses');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCourses(parsed);
        return parsed;
      } catch (err) {
        console.error('Error parsing mockClassroomCourses:', err);
      }
    }
    return DEFAULT_COURSES;
  };

  useEffect(() => {
    const init = async () => {
      const currentPlaybook = await loadGlobalPlaybooks();
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
        if (myData?.classroom_progress && typeof myData.classroom_progress === 'object') {
          setAgentClassroomProgress(myData.classroom_progress);
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
          const savedPhases = myData.phases || currentPlaybook;
          const mergedPhases = savedPhases.map(savedPhase => {
            const defaultPhase = currentPlaybook.find(p => p.id === savedPhase.id);
            if (!defaultPhase) return savedPhase;

            return {
              ...savedPhase,
              items: savedPhase.items.map(savedItem => {
                const defaultItem = defaultPhase.items.find(i => i.id === savedItem.id);
                if (defaultItem && defaultItem.steps) {
                  return { 
                    ...savedItem, 
                    steps: defaultItem.steps, 
                    currentStepIndex: savedItem.currentStepIndex || 0 
                  };
                }
                return savedItem;
              })
            };
          });

          setPhases(mergedPhases);
          setXp(myData.xp || 0);
          setCurrentAgentData(myData);
        } else {
          // Init new agent
          const sponsorToUse = settings ? settings.defaultSponsor : adminSettings.defaultSponsor;
          const newAgent = { 
            id: currentUser.email || currentUser.id, 
            name: currentUser.name, 
            xp: 0, 
            phases: currentPlaybook, 
            sponsor: sponsorToUse,
            profile: defaultProfile,
            status: 'onboarding',
            current_phase: 'apply'
          };
          
          await supabase.from('agents').insert([newAgent]);
          setPhases(currentPlaybook);
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
      await supabase.from('global_settings').upsert([{ id: 'gamification_settings', data: updated }]);
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

  const updateAgentStatus = async (agentId, newStatus) => {
    await supabase.from('agents').update({ status: newStatus }).ilike('id', agentId);
    if (currentAgentData?.id?.toLowerCase() === agentId.toLowerCase()) {
      setCurrentAgentData({ ...currentAgentData, status: newStatus });
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
    await supabase.from('global_settings').upsert([{ id: 'global_playbook', data: newPlaybook }]);
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

    // Persist to Supabase agents record if possible
    try {
      await supabase.from('agents').update({
        classroom_progress: updatedProgress
      }).ilike('id', agentId);
    } catch (err) {
      console.log('Error updating agent classroom_progress:', err);
    }
  };

  const updateGlobalCourses = async (newCourses) => {
    setCourses(newCourses);
    localStorage.setItem('mockClassroomCourses', JSON.stringify(newCourses));
    try {
      await supabase.from('global_settings').upsert([{ id: 'classroom_courses', data: newCourses }]);
    } catch (err) {
      console.log('Error saving classroom courses to Supabase:', err);
    }
  };

  return (
    <AgentContext.Provider value={{ 
      agents, 
      phases, 
      globalPlaybooks, 
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
      updateAgentStatus, 
      updateAgentPhase, 
      deleteAgent, 
      updateGlobalPlaybooks,
      loadAgents
    }}>
      {children}
    </AgentContext.Provider>
  );
};
