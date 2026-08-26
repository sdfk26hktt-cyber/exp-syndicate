/**
 * Default Real Estate Training Courses for eXp Syndicate Classroom
 */

export const DEFAULT_COURSES = [
  {
    id: 'course-onboarding-101',
    title: 'eXp & Syndicate Onboarding 101',
    description: 'The definitive step-by-step guide to transferring your license, setting up eXp Enterprise, accessing eXp World, and launching your business.',
    category: 'Onboarding',
    coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    unlockLevel: 1, // Level 1: Rookie (Unlocked for everyone)
    estimatedHours: '3.5 Hours',
    modules: [
      {
        id: 'mod-onb-1',
        title: 'Module 1: Enterprise Setup & License Transfer',
        description: 'Complete your administrative onboarding with TREC and eXp Realty.',
        lessons: [
          {
            id: 'les-onb-1-1',
            title: 'Welcome to eXp Syndicate & Your First 48 Hours',
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            xp: 25,
            duration: '12 min',
            description: 'Welcome to the Syndicate! In this orientation video, Brian Burds covers our team culture, how to navigate this dashboard, and the critical priorities for your first 48 hours.',
            steps: [
              {
                title: 'Confirm eXp Welcome Email',
                instruction: 'Check your personal inbox for the email titled "Welcome to eXp Realty — Let\'s get started". Note your eXp Passport login details.',
                link: 'https://expenterprise.com'
              },
              {
                title: 'Join Syndicate Workplace Group',
                instruction: 'Accept the invitation to our private eXp Syndicate group on Workplace by Meta.',
                link: 'https://exprealty.workplace.com'
              },
              {
                title: 'Save Team Support Contacts',
                instruction: 'Save Brian Burds and team leadership phone numbers and emails to your contacts list.'
              }
            ],
            resources: [
              { name: 'Syndicate Onboarding Checklist PDF', url: 'https://exprealty.com', type: 'pdf' },
              { name: 'Team Contact Sheet', url: 'https://exprealty.com', type: 'doc' }
            ]
          },
          {
            id: 'les-onb-1-2',
            title: 'Setting Up eXp World & Accessing Broker Support',
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            xp: 25,
            duration: '15 min',
            description: 'Learn how to download and use eXp World (the virtual campus), find Texas Broker support in the state room, and access accounting/onboarding desks.',
            steps: [
              {
                title: 'Download eXp World Application',
                instruction: 'Download and install the eXp World application on your desktop or laptop computer.',
                link: 'https://download.expworld.com'
              },
              {
                title: 'Visit the Texas State Broker Room',
                instruction: 'Log into eXp World, open the Navigator, go to "State Broker Rooms", and select Texas to meet your managing broker.'
              },
              {
                title: 'Take a Virtual Campus Tour',
                instruction: 'Visit the Tech Outpost, Accounting Support, and Training Auditoriums.'
              }
            ],
            resources: [
              { name: 'eXp World Navigation Guide', url: 'https://expenterprise.com', type: 'pdf' }
            ]
          }
        ]
      },
      {
        id: 'mod-onb-2',
        title: 'Module 2: Essential Tech Stack Configuration',
        description: 'Connect Follow Up Boss, kvCORE, SkySlope, and Google Workspace.',
        lessons: [
          {
            id: 'les-onb-2-1',
            title: 'Configuring Your Follow Up Boss Account',
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            xp: 30,
            duration: '20 min',
            description: 'Step-by-step walkthrough of connecting your phone number, email 2-way sync, downloading the FUB mobile app, and setting up lead alerts.',
            steps: [
              {
                title: 'Accept Team FUB Invitation',
                instruction: 'Check your email for the Follow Up Boss invitation link from Brian Burds and set your password.',
                link: 'https://followupboss.com'
              },
              {
                title: 'Download Follow Up Boss Mobile App',
                instruction: 'Install the iOS or Android FUB app and enable notifications for incoming calls and texts.'
              },
              {
                title: 'Connect Email & Google Calendar',
                instruction: 'In FUB Settings > Integrations, link your primary Gmail or Google Workspace account for bidirectional email and calendar syncing.'
              }
            ],
            resources: [
              { name: 'FUB Quick Start Playbook', url: 'https://followupboss.com', type: 'pdf' },
              { name: 'Lead Routing & Notification Guide', url: 'https://followupboss.com', type: 'doc' }
            ]
          },
          {
            id: 'les-onb-2-2',
            title: 'SkySlope Transaction Management Setup',
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            xp: 25,
            duration: '18 min',
            description: 'How to log into SkySlope via eXp Passport, configure DigiSign, and understand the required contract compliance documents.',
            steps: [
              {
                title: 'Log Into SkySlope via Passport',
                instruction: 'Navigate to skyslope.com and sign in using your eXp Passport credentials.',
                link: 'https://skyslope.com'
              },
              {
                title: 'Set Up DigiSign Signature',
                instruction: 'Create and save your standard electronic signature inside DigiSign.'
              }
            ],
            resources: [
              { name: 'SkySlope Compliance Checklist', url: 'https://skyslope.com', type: 'pdf' }
            ]
          }
        ]
      },
      {
        id: 'mod-onb-3',
        title: 'Module 3: 30-Day Launch & SOI Outreach',
        description: 'Announce your move, reach out to your sphere, and secure your first transaction.',
        lessons: [
          {
            id: 'les-onb-3-1',
            title: 'The Sphere of Influence 100-Contact Challenge',
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            xp: 50,
            duration: '25 min',
            description: 'How to build your 100-person database, export from your phone/social channels into Follow Up Boss, and execute the 5-day announcement sequence.',
            steps: [
              {
                title: 'Export Phone Contacts',
                instruction: 'Use an address book export tool or manual CSV to compile 100 friends, family, and past colleagues.'
              },
              {
                title: 'Import CSV into Follow Up Boss',
                instruction: 'Tag the contacts as "Sphere" and assign the "New Brokerage Announcement" smart list.',
                link: 'https://followupboss.com'
              },
              {
                title: 'Send Personal Text Message Sequence',
                instruction: 'Use the provided Syndicate SOI text script to send 20 personalized messages per day for 5 days.'
              }
            ],
            resources: [
              { name: '100-Contact Database Template (CSV)', url: 'https://google.com', type: 'sheet' },
              { name: 'SOI Text & Email Scripts', url: 'https://google.com', type: 'doc' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'course-fub-mastery',
    title: 'Follow Up Boss & Lead Conversion Machine',
    description: 'Master daily smart lists, the 5-minute speed-to-lead protocol, and Zillow Flex live transfers to convert at the highest rate in the industry.',
    category: 'Lead Gen & Conversion',
    coverImage: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80',
    unlockLevel: 2, // Level 2: Apprentice (50 XP)
    estimatedHours: '4.0 Hours',
    modules: [
      {
        id: 'mod-fub-1',
        title: 'Module 1: Daily Smart Lists & Morning Routine',
        description: 'Organize your workday for maximum dollar-productive efficiency.',
        lessons: [
          {
            id: 'les-fub-1-1',
            title: 'The 4 Core Smart Lists Every Producer Uses',
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            xp: 30,
            duration: '16 min',
            description: 'Why working out of random inbox views kills conversion. Build the 4 standard Syndicate Smart Lists: New Leads, Hot & Pending, Recent Activity, and Stalled.',
            steps: [
              {
                title: 'Create Smart List #1: 0-24hr New Leads',
                instruction: 'Filter: Stage = Lead, Created < 24 hrs, Last Activity > 1 hr. Save as primary tab.'
              },
              {
                title: 'Create Smart List #2: Hot Prospects',
                instruction: 'Filter: Stage = Hot / Showing, Next Task Due = Today. Pin to your top bar.'
              },
              {
                title: 'Create Smart List #3: Website / Search Activity',
                instruction: 'Filter: Recent site visits or property saves within the last 7 days.'
              }
            ],
            resources: [
              { name: 'Smart List Filter Blueprint', url: 'https://followupboss.com', type: 'pdf' }
            ]
          }
        ]
      },
      {
        id: 'mod-fub-2',
        title: 'Module 2: Speed-to-Lead & Live Transfer Protocol',
        description: 'Handling incoming Zillow and PPC inquiries in under 5 minutes.',
        lessons: [
          {
            id: 'les-fub-2-1',
            title: 'The ALM Method: Appointment, Location, Motivation',
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            xp: 40,
            duration: '22 min',
            description: 'Never get stuck in interrogation mode. Learn the ALM framework to lock in an in-person showing appointment on your first 60 seconds on the phone.',
            steps: [
              {
                title: 'Memorize the ALM Opener',
                instruction: '"Hi [Name], this is [Your Name] with Brian Burds eXp Realty. I see you requested to tour [Address]! Are you looking to see it today or tomorrow afternoon?"'
              },
              {
                title: 'Practice Appointment Pivot',
                instruction: 'Roleplay the scenario where the home is under contract: immediately offer 2 alternative neighborhood properties.'
              }
            ],
            resources: [
              { name: 'ALM Live Call Script Cheat Sheet', url: 'https://google.com', type: 'pdf' },
              { name: 'Objection Handling Audio Recordings', url: 'https://google.com', type: 'audio' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'course-open-house',
    title: 'Open House High-Conversion Playbook',
    description: 'Transform every weekend open house into 3-5 qualified buyer and seller leads with digital sign-ins and 24-hour follow-up cadences.',
    category: 'Lead Gen & Conversion',
    coverImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80',
    unlockLevel: 2, // Level 2: Apprentice (50 XP)
    estimatedHours: '2.5 Hours',
    modules: [
      {
        id: 'mod-oh-1',
        title: 'Module 1: Pre-Open House Marketing & Preparation',
        description: 'Ensure 15-30 visitor parties walk through the door.',
        lessons: [
          {
            id: 'les-oh-1-1',
            title: 'The 20-Sign Placement Strategy & Directional Map',
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            xp: 25,
            duration: '14 min',
            description: 'How to map high-traffic intersections, place branded Syndicate A-frame signs, and comply with local HOA ordinances.',
            steps: [
              {
                title: 'Map Out 20 Intersection Waypoints',
                instruction: 'Open Google Maps and pin major thoroughfares within a 2-mile radius of the property.'
              },
              {
                title: 'Place Signs by 10:00 AM on Open House Day',
                instruction: 'Drive the route and plant signs with clear directional arrows pointing toward the house.'
              }
            ],
            resources: [
              { name: 'Sign Route Planner Template', url: 'https://google.com', type: 'sheet' }
            ]
          }
        ]
      },
      {
        id: 'mod-oh-2',
        title: 'Module 2: Live Day Execution & Follow-Up',
        description: 'Engage visitors without being pushy and secure contact details.',
        lessons: [
          {
            id: 'les-oh-2-1',
            title: 'Digital Sign-In & The 3 Qualifying Questions',
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            xp: 35,
            duration: '18 min',
            description: 'Set up an iPad with the digital registration form. Ask the 3 key questions: "How long have you been looking?", "Do you have a home to sell first?", and "Are you working exclusively with an agent?"',
            steps: [
              {
                title: 'Configure iPad / QR Code Sign-In',
                instruction: 'Open the Syndicate Open House digital registration form on your tablet.'
              },
              {
                title: 'Send Same-Evening Video Text',
                instruction: 'Send a quick 15-second personalized video text thanking each party for visiting and sending the property disclosure packet.'
              }
            ],
            resources: [
              { name: 'Open House QR Code Poster Template', url: 'https://canva.com', type: 'canva' },
              { name: '24-Hour Post Open House Text Sequence', url: 'https://google.com', type: 'doc' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'course-buyer-listing',
    title: 'Buyer & Listing Presentation Blueprint',
    description: 'Close both sides of the transaction with unmatched confidence: winning buyer representation agreements and winning listings at full commission.',
    category: 'Presentations & Closing',
    coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    unlockLevel: 3, // Level 3: Rising Agent (125 XP)
    estimatedHours: '5.0 Hours',
    modules: [
      {
        id: 'mod-bl-1',
        title: 'Module 1: The Modern Buyer Consultation',
        description: 'Secure signed Buyer Representation Agreements and navigate new NAR practice changes.',
        lessons: [
          {
            id: 'les-bl-1-1',
            title: 'The Buyer Value Proposition & Fee Agreement',
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            xp: 50,
            duration: '28 min',
            description: 'Walk buyers through your comprehensive 28-point service plan, explain how compensation works, and obtain written agreement before touring homes.',
            steps: [
              {
                title: 'Customize Your Buyer Guide Presentation',
                instruction: 'Add your photo, bio, and past client testimonials to the Syndicate Buyer Guide deck.'
              },
              {
                title: 'Conduct Mock Buyer Consultation',
                instruction: 'Schedule a 30-minute practice consultation with a team mentor or accountability partner.'
              }
            ],
            resources: [
              { name: 'Syndicate Buyer Presentation Slides (Keynote/PPT)', url: 'https://google.com', type: 'slides' },
              { name: 'TREC Buyer Representation Agreement Explainer', url: 'https://trec.texas.gov', type: 'pdf' }
            ]
          }
        ]
      },
      {
        id: 'mod-bl-2',
        title: 'Module 2: The 7-Figure Listing Presentation',
        description: 'Pricing strategy, professional CMA decks, and handling commission objections.',
        lessons: [
          {
            id: 'les-bl-2-1',
            title: 'The 3-Step Pricing Strategy & Presentation Script',
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            xp: 50,
            duration: '32 min',
            description: 'How to present competitive market analysis without arguing with the seller, positioning their home for maximum traffic, and securing the exclusive listing agreement.',
            steps: [
              {
                title: 'Build a Comparative Market Analysis (CMA)',
                instruction: 'Pull 3 active, 3 pending, and 3 closed comparable sales in Cloud CMA or MLS.'
              },
              {
                title: 'Review The Commission Defense Script',
                instruction: 'Master the response when a seller asks: "Will you reduce your fee?"'
              }
            ],
            resources: [
              { name: 'Listing Presentation Slide Deck', url: 'https://google.com', type: 'slides' },
              { name: 'Net Sheet Calculator Spreadsheet', url: 'https://google.com', type: 'sheet' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'course-scaling-team',
    title: 'Advanced Team Production & Scaling',
    description: 'Scale from solo agent to multi-million dollar producer, leverage leverage, build your referral network, and build long-term wealth.',
    category: 'Production & Wealth',
    coverImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
    unlockLevel: 5, // Level 5: Senior Producer (500 XP)
    estimatedHours: '6.0 Hours',
    modules: [
      {
        id: 'mod-scale-1',
        title: 'Module 1: Sphere Multiplication & Referral Systems',
        description: 'Turn past clients into a predictable referral flywheel.',
        lessons: [
          {
            id: 'les-scale-1-1',
            title: 'The 33-Touch Annual Client Experience System',
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            xp: 75,
            duration: '35 min',
            description: 'Set up automated quarterly gifts, home anniversary check-ins, annual property review consultations (CMA reviews), and VIP client appreciation events.',
            steps: [
              {
                title: 'Schedule 4 Annual Client Events',
                instruction: 'Plan Q1 Pie Giveaway, Q2 Summer BBQ, Q3 Shredding Event, Q4 Holiday Photos.'
              },
              {
                title: 'Automate Annual Equity Review Reminders',
                instruction: 'Set recurring Follow Up Boss tasks on the 1-year anniversary of each past buyer closing.'
              }
            ],
            resources: [
              { name: '33-Touch Marketing Calendar Template', url: 'https://google.com', type: 'sheet' },
              { name: 'Annual Property Equity Review Script', url: 'https://google.com', type: 'doc' }
            ]
          }
        ]
      }
    ]
  }
];
