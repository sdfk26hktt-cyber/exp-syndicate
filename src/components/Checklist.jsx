import React, { useState } from 'react';
import { useAgent } from '../context/AgentContext';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import { CheckCircle, Circle, AlertCircle, ChevronDown, ChevronUp, Star, Lock, Unlock } from 'lucide-react';
import TaskRunnerModal from './TaskRunnerModal';
import { getLevelInfo, getPhaseUnlockStatus } from '../utils/gamification';

const Checklist = () => {
  const { phases, toggleItem, xp, gamificationSettings, currentAgentData } = useAgent();
  const { currentUser } = useAuth();
  const { sendMessage } = useCommunity();
  const [expandedItems, setExpandedItems] = useState({});
  const [activeTaskRunner, setActiveTaskRunner] = useState(null);

  const currentXp = Number(xp) || 0;
  const levelInfo = getLevelInfo(currentXp, gamificationSettings?.levelThresholds);

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
        
        <div className="mb-6 flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold mb-2">The Onboarding Playbook</h1>
            <p className="text-muted m-0">Your step-by-step progressive guide to joining and launching with eXp Syndicate.</p>
          </div>
          <div style={styles.topLevelPill}>
            <span style={{ color: 'var(--color-primary)', fontWeight: '700' }}>Level {levelInfo.level}</span>
            <span style={{ color: 'var(--color-text-muted)' }}>•</span>
            <span>{levelInfo.title}</span>
            <span style={{ color: 'var(--color-text-muted)' }}>•</span>
            <span style={{ fontWeight: '600' }}>{currentXp} XP</span>
          </div>
        </div>

        <div style={styles.grid}>
          <div style={styles.checklistContainer}>
            {phases.map(phase => {
              const completedCount = phase.items.filter(i => i.completed).length;
              const totalCount = phase.items.length;
              const isFullyComplete = completedCount === totalCount && totalCount > 0;

              const unlockStatus = getPhaseUnlockStatus(
                phase.id,
                levelInfo.level,
                currentXp,
                gamificationSettings?.phaseUnlockLevels,
                gamificationSettings?.levelThresholds
              );

              const isPhaseUnlocked = unlockStatus.isUnlocked;

              return (
                <div 
                  key={phase.id} 
                  className="card" 
                  style={{
                    ...styles.phaseCard, 
                    opacity: isFullyComplete ? 0.8 : (isPhaseUnlocked ? 1 : 0.85),
                    borderColor: isFullyComplete ? 'var(--color-success)' : (isPhaseUnlocked ? 'var(--color-border)' : 'rgba(0,0,0,0.1)')
                  }}
                >
                  <div style={styles.phaseHeader}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <h2 className="text-xl" style={{ margin: 0, color: isFullyComplete ? 'var(--color-success)' : 'var(--color-dark-navy)' }}>
                          {phase.title}
                        </h2>

                        {/* Phase Gate Level Requirement Badge */}
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.72rem',
                          fontWeight: '600',
                          backgroundColor: isPhaseUnlocked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: isPhaseUnlocked ? '#059669' : '#dc2626',
                          border: isPhaseUnlocked ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)'
                        }}>
                          {isPhaseUnlocked ? (
                            <>
                              <Unlock size={11} /> Unlocked at Lv.{unlockStatus.requiredLevel} ({unlockStatus.requiredLevelTitle})
                            </>
                          ) : (
                            <>
                              <Lock size={11} /> Requires Lv.{unlockStatus.requiredLevel} ({unlockStatus.requiredLevelTitle}) • {unlockStatus.xpRemaining} XP to go
                            </>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted mt-1 mb-0">{phase.description}</p>
                    </div>
                    <div style={styles.progressCounter}>
                      {completedCount} / {totalCount}
                    </div>
                  </div>

                  <div style={styles.itemsList}>
                    {phase.items.map(item => (
                      <div key={item.id} style={styles.itemWrapper}>
                        <div 
                          style={{
                            ...styles.itemRow, 
                            backgroundColor: expandedItems[item.id] ? 'rgba(0,0,0,0.02)' : 'transparent',
                            cursor: 'pointer'
                          }}
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
                  <a href={`mailto:${sponsor.email}`} style={{color: 'white', textDecoration: 'none'}}>{sponsor.email}</a>
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
    gridTemplateColumns: '1fr',
    gap: '1.5rem',
  },
  checklistContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  phaseCard: {
    padding: '1.5rem',
    border: '1px solid var(--color-border)',
    transition: 'opacity var(--transition-fast)',
  },
  phaseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.25rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid var(--color-border)',
    gap: '1rem'
  },
  progressCounter: {
    backgroundColor: 'var(--color-frosted-blue)',
    color: 'var(--color-dark-navy)',
    padding: '0.35rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: '700',
    flexShrink: 0
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
    padding: '0.85rem 1rem',
    transition: 'background-color var(--transition-fast)',
  },
  checkIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  itemContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  xpBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 161, 224, 0.1)',
    color: 'var(--color-primary)',
    padding: '0.15rem 0.4rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: '600',
    width: 'fit-content',
  },
  criticalBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: 'var(--color-error)',
    padding: '0.15rem 0.4rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: '600',
    width: 'fit-content',
  },
  interactiveBadge: {
    marginLeft: '0.5rem',
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: 'rgba(44, 90, 160, 0.1)',
    color: 'var(--color-primary)',
    padding: '0.1rem 0.4rem',
    borderRadius: '4px',
    fontSize: '0.7rem',
    fontWeight: '600',
  },
  expandBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-text-muted)',
    padding: '0.25rem',
  },
  itemDetails: {
    padding: '1rem',
    backgroundColor: 'var(--color-frosted-blue)',
    borderTop: '1px solid var(--color-border)',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  contactInfo: {
    marginBottom: '1rem',
  },
  contactLabel: {
    fontSize: '0.75rem',
    color: 'var(--color-frosted-blue)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.25rem',
  },
  contactValue: {
    fontSize: '1rem',
    fontWeight: '500',
  },
  topLevelPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'var(--color-card-bg)',
    border: '1px solid var(--color-border)',
    padding: '0.4rem 0.9rem',
    borderRadius: '20px',
    fontSize: '0.85rem',
    boxShadow: 'var(--shadow-sm)'
  }
};

export default Checklist;
