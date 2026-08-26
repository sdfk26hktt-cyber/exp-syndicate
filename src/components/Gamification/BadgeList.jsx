import React from 'react';
import { ClipboardList, ShieldCheck, Zap, Rocket, Star, Lock, CheckCircle2 } from 'lucide-react';
import { useAgent } from '../../context/AgentContext';
import { getLevelInfo, getPhaseUnlockStatus } from '../../utils/gamification';

const BadgeList = ({ phases }) => {
  const { xp, gamificationSettings } = useAgent();
  const currentXp = Number(xp) || 0;
  const levelInfo = getLevelInfo(currentXp, gamificationSettings?.levelThresholds);
  const currentLevel = levelInfo.level;

  const fallbackPhases = [
    { id: 'apply', items: [{completed: false}] },
    { id: 'process', items: [{completed: false}] },
    { id: 'activate', items: [{completed: false}] },
    { id: 'launch', items: [{completed: false}] },
    { id: 'zillow', items: [{completed: false}] }
  ];

  const actualPhases = phases || fallbackPhases;

  const badges = [
    { id: 'apply', title: 'Phase 1: Applied', description: 'Application submitted and ICA signed.', icon: ClipboardList },
    { id: 'process', title: 'Phase 2: Processing', description: 'License verified and ICA countersigned.', icon: ShieldCheck },
    { id: 'activate', title: 'Phase 3: Activated', description: 'TREC transferred and systems live.', icon: Zap },
    { id: 'launch', title: 'Phase 4: Launched', description: 'Board joined and ready for business.', icon: Rocket },
    { id: 'zillow', title: 'Phase 5: Enrolled', description: 'Zillow Premier and FUB setup complete.', icon: Star },
  ];

  return (
    <div style={styles.grid}>
      {badges.map((badge, index) => {
        const phaseObj = actualPhases.find(p => p.id === badge.id);
        const isItemsCompleted = phaseObj && phaseObj.items && phaseObj.items.length > 0 && phaseObj.items.every(i => i.completed);
        
        const unlockStatus = getPhaseUnlockStatus(
          badge.id, 
          currentLevel, 
          currentXp, 
          gamificationSettings?.phaseUnlockLevels, 
          gamificationSettings?.levelThresholds
        );

        const isUnlocked = unlockStatus.isUnlocked;
        
        // Badge state: 'completed' | 'in_progress' | 'locked'
        let badgeState = 'locked';
        let statusText;
        let statusColor;

        if (isItemsCompleted) {
          badgeState = 'completed';
          statusText = 'Completed ★';
          statusColor = 'var(--color-success)';
        } else if (isUnlocked) {
          badgeState = 'in_progress';
          statusText = 'In Progress';
          statusColor = 'var(--color-primary)';
        } else {
          statusText = `Requires Lv. ${unlockStatus.requiredLevel} (${unlockStatus.xpRemaining} XP to go)`;
          statusColor = 'var(--color-text-muted)';
        }

        const isVisualActive = badgeState === 'completed' || badgeState === 'in_progress';

        return (
          <div 
            key={badge.id} 
            style={{
              ...styles.badgeCard,
              opacity: isVisualActive ? 1 : 0.65,
              borderColor: badgeState === 'completed' 
                ? 'var(--color-success)' 
                : isUnlocked 
                  ? 'var(--color-primary)' 
                  : 'var(--color-border)',
              backgroundColor: isVisualActive ? 'var(--color-card-bg)' : 'rgba(0,0,0,0.02)',
              animationDelay: `${index * 80}ms`
            }}
            title={badge.description}
            className="badge-hover animate-fade-in"
          >
            <div style={{
              ...styles.iconWrapper,
              background: badgeState === 'completed'
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : isUnlocked
                  ? 'linear-gradient(135deg, var(--color-primary), var(--color-dark-navy))'
                  : 'var(--color-frosted-blue)',
              color: isVisualActive ? 'white' : 'var(--color-moss-grey)',
              boxShadow: isVisualActive ? '0 4px 12px rgba(12, 15, 36, 0.15)' : 'none'
            }}>
              <badge.icon size={22} />
            </div>
            
            <div style={styles.badgeInfo}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.25rem' }}>
                <h4 style={styles.title}>{badge.title}</h4>
                {badgeState === 'completed' && <CheckCircle2 size={14} color="var(--color-success)" />}
                {badgeState === 'locked' && <Lock size={12} color="var(--color-text-muted)" />}
              </div>
              <span style={{
                ...styles.status,
                color: statusColor,
                fontWeight: isVisualActive ? '600' : '400'
              }}>
                {statusText}
              </span>
            </div>
          </div>
        );
      })}

      <style>{`
        .badge-hover {
          transition: transform var(--transition-fast), box-shadow var(--transition-fast);
        }
        .badge-hover:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-md);
        }
      `}</style>
    </div>
  );
};

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '1.25rem',
  },
  badgeCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1.1rem',
    backgroundColor: 'var(--color-card-bg)',
    borderRadius: 'var(--border-radius-sm)',
    border: '1px solid var(--color-border)',
    cursor: 'default',
  },
  iconWrapper: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.3s ease'
  },
  badgeInfo: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0
  },
  title: {
    fontSize: '0.88rem',
    fontWeight: '700',
    margin: 0,
    color: 'var(--color-text-main)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  status: {
    fontSize: '0.72rem',
    marginTop: '0.25rem',
    lineHeight: 1.3
  }
};

export default BadgeList;
