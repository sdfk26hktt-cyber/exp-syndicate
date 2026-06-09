import React, { useState } from 'react';
import { useAgent } from '../context/AgentContext';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import { CheckCircle, Circle, AlertCircle, ChevronDown, ChevronUp, Star } from 'lucide-react';
import TaskRunnerModal from './TaskRunnerModal';

const Checklist = () => {
  const { phases, toggleItem, currentAgentData } = useAgent();
  const { currentUser } = useAuth();
  const { sendMessage } = useCommunity();
  const [expandedItems, setExpandedItems] = useState({});
  const [activeTaskRunner, setActiveTaskRunner] = useState(null);

  const toggleExpand = (itemId, e) => {
    e.stopPropagation();
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };
  
  const handleTaskClick = (phaseId, item) => {
    // If it has steps, open the runner
    if (item.steps) {
      setActiveTaskRunner({ phaseId, task: item });
    } else {
      // Otherwise fallback to simple toggle
      if (!item.completed && currentUser) {
        sendMessage(currentUser.id, currentUser.name, `Agent completed task: ${item.text}`, false, true);
      }
      toggleItem(phaseId, item.id);
    }
  };

  const sponsor = currentAgentData?.sponsor || { name: 'Brian Burds', phone: '(915) 256-6989', email: 'brian@brianburds.com' };

  return (
    <>
      {activeTaskRunner && (
        <TaskRunnerModal 
          phaseId={activeTaskRunner.phaseId} 
          task={activeTaskRunner.task} 
          onClose={() => setActiveTaskRunner(null)} 
        />
      )}
      <div className="animate-fade-in" style={{ paddingBottom: '80px' }}>
        
        <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">The Onboarding Playbook</h1>
        <p className="text-muted">Your step-by-step guide to joining eXp Realty in Texas.</p>
      </div>

      <div style={styles.grid}>
        <div style={styles.checklistContainer}>
          {phases.map(phase => {
            const completedCount = phase.items.filter(i => i.completed).length;
            const totalCount = phase.items.length;
            const isFullyComplete = completedCount === totalCount;

            return (
              <div key={phase.id} className="card" style={{...styles.phaseCard, opacity: isFullyComplete ? 0.7 : 1}}>
                <div style={styles.phaseHeader}>
                  <div>
                    <h2 className="text-xl" style={{ color: isFullyComplete ? 'var(--color-success)' : 'var(--color-dark-navy)' }}>
                      {phase.title}
                    </h2>
                    <p className="text-sm text-muted mt-1">{phase.description}</p>
                  </div>
                  <div style={styles.progressCounter}>
                    {completedCount} / {totalCount}
                  </div>
                </div>

                <div style={styles.itemsList}>
                  {phase.items.map(item => (
                    <div key={item.id} style={styles.itemWrapper}>
                      <div 
                        style={{...styles.itemRow, backgroundColor: expandedItems[item.id] ? 'rgba(0,0,0,0.02)' : 'transparent'}}
                        onClick={() => handleTaskClick(phase.id, item)}
                      >
                        <div style={styles.checkIcon}>
                          {item.completed ? (
                            <CheckCircle size={24} color="var(--color-success)" />
                          ) : (
                            <Circle size={24} color="var(--color-moss-grey)" />
                          )}
                        </div>
                        <div style={{...styles.itemContent, textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? 'var(--color-moss-grey)' : 'var(--color-text-main)'}}>
                          <span className="font-medium">
                            {item.text}
                            {item.steps && !item.completed && <span style={styles.interactiveBadge}>Interactive</span>}
                          </span>
                          <div className="flex gap-2 items-center mt-1">
                            <span style={styles.xpBadge}><Star size={10} style={{marginRight: '2px'}}/> +{item.xp} XP</span>
                            {item.critical && !item.completed && (
                              <span style={styles.criticalBadge}>
                                <AlertCircle size={10} style={{marginRight: '2px'}}/> Critical
                              </span>
                            )}
                          </div>
                        </div>
                        <button 
                          style={styles.expandBtn} 
                          onClick={(e) => toggleExpand(item.id, e)}
                        >
                          {expandedItems[item.id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                      </div>

                      {/* Deeper Context View */}
                      {expandedItems[item.id] && (
                        <div style={styles.itemDetails}>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-main)', lineHeight: '1.5' }}>
                            {item.details}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div style={styles.sidebar}>
          <div className="card" style={{ backgroundColor: 'var(--color-dark-navy)', color: 'white' }}>
            <h3 className="text-lg mb-2" style={{ color: 'white' }}>Stuck? Contact {sponsor.name.split(' ')[0]}</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--color-frosted-blue)' }}>
              "Day or night, application to first closing — if something looks off, text me first. I'd rather hear from you too early than too late."
            </p>
            <div style={styles.contactInfo}>
              <div style={styles.contactLabel}>Call or Text:</div>
              <div style={styles.contactValue}>
                <a href={`tel:${sponsor.phone.replace(/[^0-9]/g, '')}`} style={{color: 'white', textDecoration: 'none'}}>{sponsor.phone}</a>
              </div>
            </div>
            <div style={styles.contactInfo}>
              <div style={styles.contactLabel}>Email:</div>
              <div style={styles.contactValue}>
                <a href={`mailto:${sponsor.email}`} style={{color: 'white', textDecoration: 'none', wordBreak: 'break-all'}}>{sponsor.email}</a>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '1.5rem',
  },
  checklistContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  phaseCard: {
    padding: '1.5rem',
  },
  phaseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid var(--color-border)',
    paddingBottom: '1rem',
    marginBottom: '1rem',
  },
  progressCounter: {
    backgroundColor: 'var(--color-frosted-blue)',
    color: 'var(--color-slate-blue)',
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontWeight: '600',
    fontSize: '0.875rem',
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  itemWrapper: {
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--border-radius-sm)',
    overflow: 'hidden',
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    cursor: 'pointer',
    transition: 'background-color var(--transition-fast)',
  },
  checkIcon: {
    display: 'flex',
    alignItems: 'center',
  },
  itemContent: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  expandBtn: {
    padding: '0.5rem',
    color: 'var(--color-moss-grey)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDetails: {
    padding: '1rem 1rem 1rem 3.5rem',
    backgroundColor: 'rgba(80, 108, 170, 0.05)',
    borderTop: '1px solid var(--color-border)',
  },
  xpBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: 'var(--color-frosted-blue)',
    color: 'var(--color-slate-blue)',
    padding: '0.1rem 0.4rem',
    borderRadius: '4px',
    fontSize: '0.7rem',
    fontWeight: '600',
  },
  criticalBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    color: 'var(--color-warning)',
    padding: '0.1rem 0.4rem',
    borderRadius: '4px',
    fontSize: '0.7rem',
    fontWeight: '600',
  },
  interactiveBadge: {
    display: 'inline-flex',
    marginLeft: '8px',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    color: 'var(--color-success)',
    padding: '0.1rem 0.4rem',
    borderRadius: '4px',
    fontSize: '0.65rem',
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  contactInfo: {
    marginTop: '1rem',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: '0.75rem',
    borderRadius: 'var(--border-radius-sm)',
  },
  contactLabel: {
    fontSize: '0.75rem',
    color: 'var(--color-frosted-blue)',
    marginBottom: '0.25rem',
  },
  contactValue: {
    fontSize: '1rem',
    fontWeight: '600',
  }
};

export default Checklist;
