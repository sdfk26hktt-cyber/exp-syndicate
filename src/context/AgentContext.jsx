import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';

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
          { title: "Log into Passport", instruction: "Log into your new eXp Passport account to access your tools." },
          { title: "Open Gmail", instruction: "Open your new @exprealty.com Gmail inbox." },
          { title: "Go to Settings", instruction: "Click the gear icon in the top right, select 'See all settings', and navigate to the 'Forwarding and POP/IMAP' tab." },
          { title: "Add Forwarding", instruction: "Click 'Add a forwarding address' and input your personal/everyday email address. Verify the link sent to your personal email so you never miss a brokerage update!" }
        ]
      },
      { 
        id: '3-4', 
        text: 'Activate Passport, SkySlope, and eXp World', 
        completed: false, 
        xp: 50, 
        details: 'Passport is your SSO. SkySlope is for transactions. Jump into the browser-driven eXp World.',
        currentStepIndex: 0,
        steps: [
          { title: "Set Up Okta/Passport", instruction: "Your eXp Passport is your single-sign-on (SSO) for everything. Read the setup guide here.", link: "https://exptoolkit.com/us-realty-onboarding/#page-5" },
          { title: "Set Up SkySlope", instruction: "SkySlope is where all your transaction compliance happens. Watch this quick YouTube tutorial to get your account properly configured.", link: "https://youtu.be/R315wWjg3f0" },
          { title: "Enter eXp World", instruction: "eXp World is now fully browser-driven! You no longer need to download a heavy application. Jump straight in at exp.world to explore the campus.", link: "https://exp.world" }
        ]
      },
      { 
        id: '3-5', 
        text: 'Select and set up CRM of Choice', 
        completed: false, 
        xp: 50, 
        details: 'Pick BoldTrail (kvCORE), Lofty, or Cloze. Call Brian before committing so your setup matches the team.',
        currentStepIndex: 0,
        steps: [
          { title: "Research Options", instruction: "eXp provides several powerful CRMs including BoldTrail (formerly kvCORE), Lofty, and Cloze. Review the features of each.", link: "https://exptoolkit.com/crmofchoice" },
          { title: "Consult with Brian", instruction: "Before making a final choice, call or text Brian. It is highly recommended to pick the CRM that best aligns with the team's current lead flow and systems." },
          { title: "Activate CRM", instruction: "Once you have consulted with the team, go back to the CRM portal and officially activate your selection." }
        ]
      },
    ]
  },
  {
    id: 'launch',
    title: 'Phase 4: Launch',
    description: 'Join your Board/MLS, attend orientation, and launch your business.',
    items: [
      { 
        id: '4-1', 
        text: 'Join / transfer local Board & MLS', 
        completed: false, 
        xp: 100, 
        critical: true, 
        details: 'HARD DEADLINE: You have 2 weeks to join El Paso or Las Cruces association or your license will be released.',
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
  }
];

export const AgentProvider = ({ children }) => {
  const { currentUser } = useAuth();
  
  // Admin-level state (all agents)
  const [agents, setAgents] = useState([]);
  
  // Current user state
  const [currentAgentData, setCurrentAgentData] = useState(null);
  const [phases, setPhases] = useState(DEFAULT_PHASES);
  const [xp, setXp] = useState(0);
  
  // Admin Settings state
  const [adminSettings, setAdminSettings] = useState({
    defaultSponsor: { name: 'Brian Burds', phone: '(915) 256-6989', email: 'brian@brianburds.com' }
  });

  const defaultProfile = {
    phone: '',
    address: '',
    birthday: '',
    licenseNumber: '',
    interests: '',
    goals: ''
  };

  useEffect(() => {
    // Load mock database
    const db = JSON.parse(localStorage.getItem('mockAgentDb')) || [];
    setAgents(db);
    
    // Load Admin Settings
    const settings = JSON.parse(localStorage.getItem('mockAdminSettings'));
    if (settings) {
      setAdminSettings(settings);
    }
    
    if (currentUser?.role === 'agent') {
      const myData = db.find(a => a.id === currentUser.id);
      if (myData) {
        setPhases(myData.phases);
        setXp(myData.xp);
        
        // Ensure legacy agents get the profile object
        if (!myData.profile) myData.profile = defaultProfile;

        // Merge steps from DEFAULT_PHASES into legacy saved phases
        const mergedPhases = myData.phases.map(savedPhase => {
          const defaultPhase = DEFAULT_PHASES.find(p => p.id === savedPhase.id);
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
        setXp(myData.xp);
        setCurrentAgentData(myData);
      } else {
        // Init new agent with default sponsor if they login and aren't in DB yet
        const sponsorToUse = settings ? settings.defaultSponsor : adminSettings.defaultSponsor;
        const newAgent = { 
          id: currentUser.id, 
          name: currentUser.name, 
          xp: 0, 
          phases: DEFAULT_PHASES, 
          sponsor: sponsorToUse,
          profile: defaultProfile
        };
        setPhases(DEFAULT_PHASES);
        setXp(0);
        setCurrentAgentData(newAgent);
        const newDb = [...db, newAgent];
        setAgents(newDb);
        localStorage.setItem('mockAgentDb', JSON.stringify(newDb));
      }
    }
  }, [currentUser]);

  const toggleItem = (phaseId, itemId) => {
    if (currentUser?.role !== 'agent') return;

    let xpChange = 0;
    const newPhases = phases.map(phase => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          items: phase.items.map(item => {
            if (item.id === itemId) {
              xpChange = item.completed ? -item.xp : item.xp;
              return { ...item, completed: !item.completed };
            }
            return item;
          })
        };
      }
      return phase;
    });

    const newXp = xp + xpChange;
    setPhases(newPhases);
    setXp(newXp);

    // Persist to DB
    const newDb = agents.map(a => a.id === currentUser.id ? { ...a, phases: newPhases, xp: newXp } : a);
    setAgents(newDb);
    localStorage.setItem('mockAgentDb', JSON.stringify(newDb));
  };

  const updateTaskStep = (phaseId, itemId, stepIndex) => {
    if (currentUser?.role !== 'agent') return;

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

    // Persist to DB
    const newDb = agents.map(a => a.id === currentUser.id ? { ...a, phases: newPhases } : a);
    setAgents(newDb);
    localStorage.setItem('mockAgentDb', JSON.stringify(newDb));
  };

  const getRank = (currentXp) => {
    if (currentXp < 100) return 'Rookie';
    if (currentXp < 300) return 'Associate';
    if (currentXp < 500) return 'Syndicate Pro';
    return 'Capstone';
  };

  const addAgent = (email, name, sponsorData, coSponsorData) => {
    const newAgent = { 
      id: email, 
      name: name, 
      xp: 0, 
      phases: DEFAULT_PHASES,
      sponsor: sponsorData || adminSettings.defaultSponsor,
      coSponsor: coSponsorData || null,
      profile: defaultProfile
    };
    const newDb = [...agents, newAgent];
    setAgents(newDb);
    localStorage.setItem('mockAgentDb', JSON.stringify(newDb));
  };

  const updateAdminSettings = (newSettings) => {
    const updated = { ...adminSettings, ...newSettings };
    setAdminSettings(updated);
    localStorage.setItem('mockAdminSettings', JSON.stringify(updated));
  };

  const updateAgentProfile = (profileData, newName) => {
    if (!currentUser || currentUser.role !== 'agent') return;
    
    const newDb = agents.map(a => {
      if (a.id === currentUser.id) {
        const updatedAgent = { 
          ...a, 
          name: newName || a.name,
          profile: { ...a.profile, ...profileData } 
        };
        setCurrentAgentData(updatedAgent);
        return updatedAgent;
      }
      return a;
    });
    
    setAgents(newDb);
    localStorage.setItem('mockAgentDb', JSON.stringify(newDb));
  };

  return (
    <AgentContext.Provider value={{ agents, phases, xp, currentAgentData, adminSettings, toggleItem, updateTaskStep, getRank, addAgent, updateAdminSettings, updateAgentProfile }}>
      {children}
    </AgentContext.Provider>
  );
};
