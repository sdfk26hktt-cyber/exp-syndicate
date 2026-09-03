export const DEFAULT_PHASES = [
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
          { title: "Sign Digitally", instruction: "Sign and submit your completed ICA to officially process your joining packet." }
        ]
      },
      { id: '1-6', text: 'Confirm Broker Review & State Sign-Off', completed: false, xp: 10, details: 'Wait for Texas managing broker review. Check onboarding tracker with your Personal Code.' }
    ]
  },
  {
    id: 'transfer',
    title: 'Phase 2: Transfer License to Broker',
    description: 'Complete TREC license sponsorship transfer, MLS affiliation, and association setup.',
    items: [
      { id: '2-1', text: 'Log in to TREC Relationship Management Tool', completed: false, xp: 20, details: 'Log in to your Texas Real Estate Commission account to initiate broker sponsorship transfer.' },
      { id: '2-2', text: 'Request broker sponsorship under EXP REALTY LLC (License #603392)', completed: false, xp: 50, details: 'Submit the formal sponsorship request to EXP REALTY LLC. State managing broker will accept.' },
      { id: '2-3', text: 'Transfer MLS & Local Association Board Affiliation to eXp', completed: false, xp: 35, details: 'Contact your local board (GEPAR / CCAR / HAR / ABOR / MetroTex) and update broker designation.' },
      { id: '2-4', text: 'Confirm active status in TREC public database', completed: false, xp: 25, details: 'Verify your license reflects EXP REALTY LLC as your managing broker on trec.texas.gov.' }
    ]
  },
  {
    id: 'passport',
    title: 'Phase 3: eXp Passport & Portal Setup',
    description: 'Set up your @exprealty.com email, eXp World, workplace, and enterprise single sign-on.',
    items: [
      { id: '3-1', text: 'Activate eXp Passport Single Sign-On Account', completed: false, xp: 20, details: 'Follow the welcome email instructions to configure your master eXp Passport SSO password.' },
      { id: '3-2', text: 'Configure eXp Google Workspace (@exprealty.com email)', completed: false, xp: 25, details: 'Log into Google Workspace using your official @exprealty.com credentials and set up 2FA.' },
      { id: '3-3', text: 'Install eXp World Desktop Application', completed: false, xp: 25, details: 'Download and configure eXp World virtual campus for broker support, tech desk, and national masterminds.' },
      { id: '3-4', text: 'Join eXp Workplace & Team Group Channels', completed: false, xp: 20, details: 'Sign into Workplace by Meta and join the Brian Burds Syndicate and Texas Broker state groups.' }
    ]
  },
  {
    id: 'syndicate',
    title: 'Phase 4: Syndicate Portal & CRM Setup',
    description: 'Configure Follow Up Boss, Sisu tracking, LinqApp SMS, and complete profile setup.',
    items: [
      { id: '4-1', text: 'Complete Syndicate Portal Profile & Headshot', completed: false, xp: 25, details: 'Fill out your full agent profile, contact information, bio, and upload high-resolution headshot in Settings.' },
      { id: '4-2', text: 'Set Up Follow Up Boss (FUB) Login & Phone App', completed: false, xp: 40, details: 'Download FUB on iOS/Android, verify your inbound call forwarding and custom signature.' },
      { id: '4-3', text: 'Connect Sisu Production & Activity Tracker', completed: false, xp: 35, details: 'Log in to Sisu, sync your pipeline goals, and connect your FUB activity metrics.' },
      { id: '4-4', text: 'Verify LinqApp SMS Receiving & Notification Settings', completed: false, xp: 20, details: 'Confirm that team broadcast SMS alerts and open house notifications are actively delivering to your device.' }
    ]
  },
  {
    id: 'launch',
    title: 'Phase 5: Lead Generation Fast Track',
    description: 'Schedule appointments, claim your first Open House, and complete launch milestone.',
    items: [
      { 
        id: '5-1', 
        text: 'Text David Bitoon for Zillow Premier Agent Setup', 
        completed: false, 
        xp: 50, 
        details: 'Contact David Bitoon by text at (915) 800-7543 for your Zillow Premier agent account setup.',
        currentStepIndex: 0,
        steps: [
          { title: "Text David Bitoon", instruction: "Send a text message to David at (915) 800-7543 letting him know you are ready to be added to Zillow Premier." }
        ]
      },
      { id: '5-2', text: 'Schedule 1-on-1 Onboarding Call with Brenda Faudoa', completed: false, xp: 50, details: 'Meet with Brenda to get fully onboarded to Follow Up Boss workflows and View El Paso Homes lead routing.' },
      { id: '5-3', text: 'Claim & Host Your First Syndicate Open House', completed: false, xp: 75, details: 'Go to the Open Houses tab, select an active listing in your market, and reserve your hosting time slot.' },
      { id: '5-4', text: 'Complete Classroom: Follow Up Boss Speed-to-Lead Compliance', completed: false, xp: 50, details: 'Watch the required compliance training module in the Classroom Hub to maintain active lead distribution.' }
    ]
  }
];

export const TEAM_AGENT_PHASES = [
  {
    id: 'team-prod-1',
    title: 'Phase 1: Daily Production Cadence & CRM Rigor',
    description: 'Establish the core operating rhythm, smart lists, and prospecting habits.',
    items: [
      { id: 'tp-1-1', text: 'Configure FUB Daily Smart Lists (Hot, Warm, Past Clients)', completed: false, xp: 25, details: 'Set up 5 core smart lists in Follow Up Boss for morning calls and lead follow-ups.' },
      { id: 'tp-1-2', text: 'Execute Daily 10-4 Prospecting Rhythm (10 calls, 10 texts, 4 notes)', completed: false, xp: 40, details: 'Log daily outreach in Sisu before 11:00 AM.' },
      { id: 'tp-1-3', text: 'Attend Morning Syndicate Script & Objection Huddle', completed: false, xp: 30, details: 'Participate in the live team script practice to sharpen buyer & seller objection handling.' },
      { id: 'tp-1-4', text: 'Sync Sisu Weekly Volume & Conversion Targets', completed: false, xp: 25, details: 'Input your monthly closing goals and lead conversion milestones in Sisu.' }
    ]
  },
  {
    id: 'team-prod-2',
    title: 'Phase 2: Buyer Consultation & Appointment Mastery',
    description: 'Master in-person buyer consultations and sign exclusive representation agreements.',
    items: [
      { id: 'tp-2-1', text: 'Deliver Syndicate Buyer Presentation in Office or Zoom', completed: false, xp: 50, details: 'Walk prospective buyers through our proven VIP buyer guide and market insights.' },
      { id: 'tp-2-2', text: 'Execute TREC Buyer Representation Agreement & Disclosures', completed: false, xp: 50, details: 'Secure signed representation before scheduling private showings.' },
      { id: 'tp-2-3', text: 'Coordinate Lender Pre-Approval with Preferred Lending Partner', completed: false, xp: 35, details: 'Connect buyers with our trusted mortgage specialists for strong approval letters.' },
      { id: 'tp-2-4', text: 'Execute 3 Targeted Home Showing Tours', completed: false, xp: 60, details: 'Lead curated property showings utilizing Sentrilock and route optimization.' }
    ]
  },
  {
    id: 'team-prod-3',
    title: 'Phase 3: Listing Domination & Mega Open Houses',
    description: 'Master listing presentations, pricing strategies, and syndicate open houses.',
    items: [
      { id: 'tp-3-1', text: 'Prepare Professional Comparative Market Analysis (CMA)', completed: false, xp: 45, details: 'Generate a comprehensive CMA with market comps, price bands, and absorption rates.' },
      { id: 'tp-3-2', text: 'Deliver Listing Presentation & Secure Exclusive Listing Agreement', completed: false, xp: 75, details: 'Present the team marketing plan, staging checklist, and negotiate commission.' },
      { id: 'tp-3-3', text: 'Host Mega Open House with Digital Sign-in & Directional Signs', completed: false, xp: 60, details: 'Place 15+ signs, use the digital registration QR, and capture prospective unrepresented buyers.' },
      { id: 'tp-3-4', text: 'Execute 24-Hour Open House Lead Follow-Up Blitz', completed: false, xp: 40, details: 'Follow up with all attendees within 24 hours via personalized video and text.' }
    ]
  },
  {
    id: 'team-prod-4',
    title: 'Phase 4: Contract Negotiation & Client for Life Loop',
    description: 'Contract-to-close excellence, repair negotiations, and 5-star review collection.',
    items: [
      { id: 'tp-4-1', text: 'Draft & Submit 1-4 Family TREC Contract with Strong Addenda', completed: false, xp: 50, details: 'Submit clean offers with financing addenda, third-party approvals, and seller concessions.' },
      { id: 'tp-4-2', text: 'Manage Inspection Period & Negotiate Repair Amendments', completed: false, xp: 40, details: 'Coordinate inspection report review and draft Amendment for repairs or seller credit.' },
      { id: 'tp-4-3', text: 'Attend Closing & Deliver Closing Gift', completed: false, xp: 75, details: 'Celebrate with clients at title, deliver custom closing basket, and take closing photo.' },
      { id: 'tp-4-4', text: 'Collect 5-Star Google Review & Enroll in VIP Past Client Club', completed: false, xp: 50, details: 'Request verified Google review and tag in FUB for ongoing quarterly client touches.' }
    ]
  }
];

export const FLEX_AGENT_PHASES = [
  {
    id: 'flex-1',
    title: 'Phase 1: Flex Foundation & Platform Setup',
    description: 'Get your CRM, tools, and lead pipelines activated for maximum flexibility.',
    items: [
      { id: 'fx-1-1', text: 'Configure Follow Up Boss Smart Lists & Saved Searches', completed: false, xp: 25, details: 'Organize your personal database inside Follow Up Boss.' },
      { id: 'fx-1-2', text: 'Bookmark Syndicate Resource Board & Classroom Hub', completed: false, xp: 15, details: 'Access all team contracts, marketing scripts, and video courses anytime.' },
      { id: 'fx-1-3', text: 'Set Up Sierra Interactive Lead Search Portal', completed: false, xp: 25, details: 'Set up your agent website subdomain and custom property alerts for clients.' },
      { id: 'fx-1-4', text: 'Review Open House Booking Guidelines & Schedule', completed: false, xp: 20, details: 'Understand reservation deadlines, sign-in procedures, and coordinator approval flow.' }
    ]
  },
  {
    id: 'flex-2',
    title: 'Phase 2: Open House Lead Generation Machine',
    description: 'Claim, host, and convert buyer leads from Syndicate active listings.',
    items: [
      { id: 'fx-2-1', text: 'Claim an Open House in the Open Houses Tab', completed: false, xp: 30, details: 'Browse active team inventory in your target market and reserve a slot.' },
      { id: 'fx-2-2', text: 'Set Up Open House QR Registration & Flyer Packet', completed: false, xp: 25, details: 'Print property spec sheets and configure the digital check-in page.' },
      { id: 'fx-2-3', text: 'Host Open House & Engage All Visitors', completed: false, xp: 50, details: 'Engage visitors, answer neighborhood questions, and identify unrepresented buyers.' },
      { id: 'fx-2-4', text: 'Log All Captured Leads in FUB with Open House Tag', completed: false, xp: 35, details: 'Import contact info and start the 10-day Open House follow-up campaign.' }
    ]
  },
  {
    id: 'flex-3',
    title: 'Phase 3: Sphere of Influence (SOI) 100-Person Blitz',
    description: 'Build a repeatable referral database from friends, family, and local network.',
    items: [
      { id: 'fx-3-1', text: 'Compile Top 100 Sphere Contacts with Phone & Email', completed: false, xp: 50, details: 'Gather contacts from phone, social media, and previous career network.' },
      { id: 'fx-3-2', text: 'Send Personal Announcement Video/Message via Linq/Text', completed: false, xp: 40, details: 'Announce your real estate business with eXp Syndicate to your entire sphere.' },
      { id: 'fx-3-3', text: 'Conduct 20 Casual "Catch-Up" Real Estate Coffee/Phone Chats', completed: false, xp: 60, details: 'Check in with past colleagues and friends to offer home valuation updates.' },
      { id: 'fx-3-4', text: 'Enroll Sphere in Monthly Market Snapshot Email', completed: false, xp: 25, details: 'Keep your database engaged with local housing trends and market data.' }
    ]
  },
  {
    id: 'flex-4',
    title: 'Phase 4: Contract Mastery & Closing First Deal',
    description: 'Execute error-free contracts, leverage team support, and close transactions.',
    items: [
      { id: 'fx-4-1', text: 'Complete Contract Writing Workshop in Classroom', completed: false, xp: 40, details: 'Master TREC 1-4 Family provisions, option periods, and earnest money.' },
      { id: 'fx-4-2', text: 'Review First Offer with Broker or Team Lead Before Submitting', completed: false, xp: 35, details: 'Ensure all disclosures and terms protect your buyer client.' },
      { id: 'fx-4-3', text: 'Close First Flex Transaction & Submit Brokermint File', completed: false, xp: 100, details: 'Upload all executed docs to Brokermint compliance and celebrate your closing!' },
      { id: 'fx-4-4', text: 'Post Social Media Closing Story & Request Google Review', completed: false, xp: 30, details: 'Build social proof and gather your first verified review.' }
    ]
  }
];

export const SHOWING_PARTNER_PHASES = [
  {
    id: 'sp-1',
    title: 'Phase 1: Safety, Access & Showing Protocol',
    description: 'Master lockbox tools, showing safety, and punctual arrival standards.',
    items: [
      { id: 'sp-1-1', text: 'Download & Activate SentriKey / Supra EKey Application', completed: false, xp: 25, details: 'Verify Bluetooth access and electronic lockbox permissions with local board.' },
      { id: 'sp-1-2', text: 'Review Syndicate Showing Safety & Security Protocol', completed: false, xp: 25, details: 'Learn daytime showing standards, emergency contacts, and situational awareness.' },
      { id: 'sp-1-3', text: 'Master Property Tour Route Planning & ShowingTime Scheduling', completed: false, xp: 30, details: 'Optimize multi-home driving routes and buffer 15-minute travel windows.' },
      { id: 'sp-1-4', text: 'Prepare Showing Kit (Shoe Covers, Flashlight, Measuring Tape)', completed: false, xp: 20, details: 'Keep your vehicle stocked with professional showing essentials.' }
    ]
  },
  {
    id: 'sp-2',
    title: 'Phase 2: Client Experience & Field Etiquette',
    description: 'Deliver 5-star home tours while upholding team representation standards.',
    items: [
      { id: 'sp-2-1', text: 'Arrive 10 Minutes Early & Turn On Lights Before Buyer Arrival', completed: false, xp: 30, details: 'Ensure property is welcoming, unlocked, and well-lit before clients pull up.' },
      { id: 'sp-2-2', text: 'Conduct Property Tour Highlighting Upgrades & Systems', completed: false, xp: 40, details: 'Point out HVAC age, roof condition, neighborhood amenities, and lot features.' },
      { id: 'sp-2-3', text: 'Ask Key Discovery Questions During Tour', completed: false, xp: 35, details: 'Assess buyer budget, move-in timeline, must-haves, and dealbreakers.' },
      { id: 'sp-2-4', text: 'Secure Property & Verify Lockbox / Deadbolts Closed', completed: false, xp: 25, details: 'Double check all doors and windows before departing every listing.' }
    ]
  },
  {
    id: 'sp-3',
    title: 'Phase 3: CRM Documentation & Team Handoff',
    description: 'Document buyer reactions and alert lead agents for immediate contract drafting.',
    items: [
      { id: 'sp-3-1', text: 'Log Detailed Tour Notes in Follow Up Boss within 1 Hour', completed: false, xp: 35, details: 'Record buyer feedback, favorite homes, and specific objections on the FUB contact record.' },
      { id: 'sp-3-2', text: 'Rate Buyer Interest Level (1-10) and Identify Offer Readiness', completed: false, xp: 30, details: 'Tag lead with "Ready to Offer" or "Needs More Showings" in FUB.' },
      { id: 'sp-3-3', text: 'Send Lead Agent Voice Memo / Text Summary', completed: false, xp: 25, details: 'Notify the assigned listing/lead agent with key client takeaways.' },
      { id: 'sp-3-4', text: 'Follow Up with Buyer via Text with Property Summary Links', completed: false, xp: 25, details: 'Send thank you text with direct Sierra links to the top 2 homes toured.' }
    ]
  },
  {
    id: 'sp-4',
    title: 'Phase 4: Showing Milestones & Production Growth',
    description: 'Reach showing volume milestones and transition towards full deal writing.',
    items: [
      { id: 'sp-4-1', text: 'Complete 25 Professional Buyer Showing Tours', completed: false, xp: 75, details: 'Achieve the 25-tour milestone with positive client feedback.' },
      { id: 'sp-4-2', text: 'Assist in Drafting Comparative Market Analysis for Offer', completed: false, xp: 40, details: 'Work with lead agent on pricing strategy for a buyer ready to submit.' },
      { id: 'sp-4-3', text: 'Attend Contract Signing & Home Inspection with Lead Agent', completed: false, xp: 50, details: 'Shadow the contract walkthrough and home inspection report review.' },
      { id: 'sp-4-4', text: 'Achieve Showing Partner Certification Level', completed: false, xp: 100, details: 'Earn full team certification and unlock higher split / bonus incentives.' }
    ]
  }
];

export const DEFAULT_PLAYBOOK_CATALOG = [
  {
    id: 'pb-onboarding-default',
    title: 'The Onboarding Playbook (90-Day Launch)',
    description: 'Your step-by-step progressive guide to joining, licensing transfer, and launching with eXp Syndicate.',
    targetRole: 'onboarding',
    isDefault: true,
    phases: DEFAULT_PHASES
  },
  {
    id: 'pb-team-fast-track',
    title: 'Team Agent Fast-Track (Production Mastery)',
    description: 'Core daily operating rhythm, appointment conversion, listing mastery, and transaction management for full Syndicate Team Agents.',
    targetRole: 'team_agent',
    isDefault: false,
    phases: TEAM_AGENT_PHASES
  },
  {
    id: 'pb-flex-production',
    title: 'Flex Agent Production Playbook',
    description: 'Self-generated pipeline acceleration, open house opportunities, sphere conversion, and independent closing mastery for Flex Agents.',
    targetRole: 'flex_agent',
    isDefault: false,
    phases: FLEX_AGENT_PHASES
  },
  {
    id: 'pb-showing-partner',
    title: 'Showing Partner Fundamentals',
    description: 'Field execution, electronic lockbox safety, showing etiquette, CRM logging, and lead agent feedback loops for Showing Partners.',
    targetRole: 'showing_partner',
    isDefault: false,
    phases: SHOWING_PARTNER_PHASES
  }
];
