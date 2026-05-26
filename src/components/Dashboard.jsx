import React, { useState, useEffect } from 'react';
import { ArrowRight, Phone, Mail, Star, Quote } from 'lucide-react';
import BadgeList from './Gamification/BadgeList';
import { Link } from 'react-router-dom';
import { useAgent } from '../context/AgentContext';
import { useAuth } from '../context/AuthContext';

const quotes = [
  "Success is the sum of small efforts, repeated day in and day out.",
  "Your business grows to the extent that you do.",
  "The secret of getting ahead is getting started.",
  "Don't wait to buy real estate. Buy real estate and wait."
];

const Dashboard = () => {
  const { phases, xp, getRank, currentAgentData } = useAgent();
  const { currentUser } = useAuth();
  const [greeting, setGreeting] = useState('Good day');
  const [quote] = useState(quotes[Math.floor(Math.random() * quotes.length)]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Calculate dynamic progress
  const totalItems = phases.reduce((acc, phase) => acc + phase.items.length, 0);
  const completedItems = phases.reduce((acc, phase) => acc + phase.items.filter(i => i.completed).length, 0);
  const progressPercent = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

  // Find next step
  let nextStep = null;
  let currentPhaseTitle = phases[0].title;
  for (const phase of phases) {
    const uncompleted = phase.items.find(i => !i.completed);
    if (uncompleted) {
      nextStep = uncompleted;
      currentPhaseTitle = phase.title;
      break;
    }
  }

  const rank = getRank(xp);
  
  // Calculate stroke dashoffset for the circular progress ring
  const circleRadius = 40;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const circleOffset = circleCircumference - (progressPercent / 100) * circleCircumference;

  // Sponsor Info
  const sponsor = currentAgentData?.sponsor || { name: 'Brian Burds', phone: '(915) 256-6989', email: 'brian@brianburds.com' };
  const coSponsor = currentAgentData?.coSponsor;

  return (
    <div className="animate-fade-in flex-col gap-6" style={{ paddingBottom: '80px' }}>
      
      {/* Dynamic Hero Section */}
      <div style={styles.heroSection} className="card glowing-card delay-100">
        <div style={styles.heroContent}>
          <h1 className="text-3xl font-bold mb-2 text-gradient">
            {greeting}, {currentUser?.name?.split(' ')[0] || 'Agent'}!
          </h1>
          <p className="text-lg" style={{ color: 'var(--color-dark-navy)', opacity: 0.8 }}>
            Let's conquer your business goals today. You are currently in <strong>{currentPhaseTitle}</strong>.
          </p>
        </div>

        {/* Circular Rank & Progress Visualizer */}
        <div style={styles.rankVisualizer}>
          <div style={styles.progressRingWrapper}>
            <svg width="100" height="100" style={styles.progressRing}>
              <circle stroke="var(--color-border)" strokeWidth="6" fill="transparent" r={circleRadius} cx="50" cy="50" />
              <circle 
                stroke="var(--color-accent)" 
                strokeWidth="6" 
                fill="transparent" 
                r={circleRadius} cx="50" cy="50" 
                style={{
                  strokeDasharray: circleCircumference,
                  strokeDashoffset: circleOffset,
                  transition: 'stroke-dashoffset 1s ease-in-out',
                  transform: 'rotate(-90deg)',
                  transformOrigin: '50% 50%'
                }}
              />
            </svg>
            <div style={styles.progressRingText}>
              <span className="font-bold text-xl">{progressPercent}%</span>
            </div>
          </div>
          <div style={styles.rankInfo}>
            <div className="text-sm text-muted font-medium uppercase tracking-wider">Current Rank</div>
            <div className="text-xl font-bold" style={{ color: 'var(--color-dark-navy)' }}>{rank}</div>
            <div style={styles.xpBadge}><Star size={12} style={{marginRight: '4px'}}/> {xp} XP</div>
          </div>
        </div>
      </div>

      <div className="grid-layout">
        <div className="flex-col gap-6 animate-fade-in delay-200">
          
          {/* Actionable "Up Next" Card */}
          <div className="card" style={styles.upNextCard}>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg text-white m-0">Up Next</h2>
              <span style={styles.miniXp}>+{nextStep ? nextStep.xp : 0} XP</span>
            </div>
            
            {nextStep ? (
              <div className="flex-col gap-4">
                <div className="font-semibold text-xl text-white">{nextStep.text}</div>
                <div style={{color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem'}}>{nextStep.details}</div>
                <Link to="/checklist" className="btn-primary" style={styles.actionBtn}>
                  Go to Playbook <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <div className="flex-col gap-4">
                <div className="font-semibold text-xl text-white">🎉 You're fully launched!</div>
                <div style={{color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem'}}>You have completed all onboarding playbook tasks.</div>
              </div>
            )}
          </div>

          {/* Activity / Motivation Feed */}
          <div className="card">
            <div className="flex items-center gap-3 mb-2">
              <Quote size={20} color="var(--color-primary)" />
              <h2 className="text-lg m-0">Daily Motivation</h2>
            </div>
            <p className="text-lg italic mt-4" style={{ color: 'var(--color-dark-navy)' }}>
              "{quote}"
            </p>
          </div>
        </div>

        <div className="flex-col gap-6 animate-fade-in delay-300">
          {/* Sponsor Support */}
          <div className="card" style={{ backgroundColor: 'var(--color-card-bg)', borderTop: '3px solid var(--color-dark-navy)' }}>
            <h2 className="text-lg mb-1">Your Sponsor</h2>
            <p className="text-sm mb-4 font-semibold text-dark-navy">{sponsor.name}</p>
            <div className="flex-col gap-3">
              <a href={`tel:${sponsor.phone.replace(/[^0-9]/g, '')}`} style={styles.contactItem}>
                <div style={styles.iconBox}><Phone size={16} color="white" /></div>
                <span className="font-medium text-sm">{sponsor.phone}</span>
              </a>
              <a href={`mailto:${sponsor.email}`} style={styles.contactItem}>
                <div style={styles.iconBox}><Mail size={16} color="white" /></div>
                <span className="font-medium text-sm" style={{wordBreak: 'break-all'}}>{sponsor.email}</span>
              </a>
            </div>
            
            {coSponsor && (
              <div className="mt-6 pt-4 border-t" style={{borderColor: 'var(--color-border)'}}>
                <h2 className="text-md mb-1">Co-Sponsor</h2>
                <p className="text-sm mb-3 font-semibold text-dark-navy">{coSponsor.name}</p>
                <div className="flex-col gap-2">
                  <a href={`tel:${coSponsor.phone.replace(/[^0-9]/g, '')}`} style={{...styles.contactItem, padding: '0.5rem'}}>
                    <Phone size={14} color="var(--color-primary)" />
                    <span className="font-medium text-xs">{coSponsor.phone}</span>
                  </a>
                  <a href={`mailto:${coSponsor.email}`} style={{...styles.contactItem, padding: '0.5rem'}}>
                    <Mail size={14} color="var(--color-primary)" />
                    <span className="font-medium text-xs" style={{wordBreak: 'break-all'}}>{coSponsor.email}</span>
                  </a>
                </div>
              </div>
            )}
            
            <div style={styles.supportHint}>
              "Call or text your sponsor anytime. Don't sit stuck."
            </div>
          </div>
        </div>
      </div>

      {/* Gamification Area */}
      <div className="card animate-fade-in delay-300">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg mb-1">Phase Badges</h2>
            <p className="text-sm text-muted">Complete Playbook phases to unlock your badges.</p>
          </div>
          <Link to="/achievements" className="text-sm" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>View All</Link>
        </div>
        <BadgeList phases={phases} />
      </div>

      <style>{`
        .grid-layout {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }
        @media (max-width: 1024px) {
          .grid-layout { grid-template-columns: 1fr; }
          .heroSection { flex-direction: column; align-items: flex-start; gap: 2rem; }
        }
      `}</style>
    </div>
  );
};

const styles = {
  heroSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '2.5rem',
    background: 'linear-gradient(120deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.6) 100%)',
    marginBottom: '1.5rem',
  },
  heroContent: {
    maxWidth: '500px',
  },
  rankVisualizer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    backgroundColor: 'white',
    padding: '1rem 1.5rem 1rem 1rem',
    borderRadius: '100px',
    boxShadow: 'var(--shadow-md)',
  },
  progressRingWrapper: {
    position: 'relative',
    width: '100px',
    height: '100px',
  },
  progressRing: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  progressRingText: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-dark-navy)',
  },
  rankInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  xpBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: 'var(--color-accent)',
    color: 'white',
    padding: '0.2rem 0.5rem',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '700',
    marginTop: '0.25rem',
    boxShadow: 'var(--shadow-sm)'
  },
  upNextCard: {
    background: 'linear-gradient(135deg, var(--color-dark-navy), var(--color-charcoal-blue))',
    color: 'white',
    border: 'none',
    boxShadow: 'var(--shadow-glow)',
  },
  miniXp: {
    display: 'inline-block',
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '700',
  },
  actionBtn: {
    backgroundColor: 'white',
    color: 'var(--color-dark-navy)',
    marginTop: '1rem',
    alignSelf: 'flex-start',
    background: 'white',
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.75rem',
    backgroundColor: 'var(--color-background)',
    borderRadius: 'var(--border-radius-sm)',
    color: 'var(--color-dark-navy)',
    transition: 'transform var(--transition-fast)',
  },
  iconBox: {
    backgroundColor: 'var(--color-primary)',
    padding: '0.4rem',
    borderRadius: '6px',
    display: 'flex'
  },
  supportHint: {
    marginTop: '1.25rem',
    padding: '1rem',
    backgroundColor: 'rgba(80, 108, 170, 0.05)',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontStyle: 'italic',
    color: 'var(--color-text-main)',
    borderLeft: '3px solid var(--color-primary)'
  }
};

export default Dashboard;
