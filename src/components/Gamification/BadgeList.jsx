import React from 'react';
import { ClipboardList, ShieldCheck, Zap, Rocket, Star } from 'lucide-react';

const BadgeList = ({ phases }) => {
  // If phases aren't passed (e.g. from a static view), provide defaults
  const fallbackPhases = [
    { id: 'apply', items: [{completed: true}] },
    { id: 'process', items: [{completed: false}] },
    { id: 'activate', items: [{completed: false}] },
    { id: 'launch', items: [{completed: false}] },
    { id: 'zillow', items: [{completed: false}] }
  ];

  const actualPhases = phases || fallbackPhases;

  const isPhaseUnlocked = (phaseId) => {
    const phase = actualPhases.find(p => p.id === phaseId);
    if (!phase) return false;
    return phase.items.every(item => item.completed);
  };

  const badges = [
    { id: 'apply', title: 'Phase 1: Applied', description: 'Application submitted and ICA signed.', icon: ClipboardList, unlocked: isPhaseUnlocked('apply') },
    { id: 'process', title: 'Phase 2: Processing', description: 'License verified and ICA countersigned.', icon: ShieldCheck, unlocked: isPhaseUnlocked('process') },
    { id: 'activate', title: 'Phase 3: Activated', description: 'TREC transferred and systems live.', icon: Zap, unlocked: isPhaseUnlocked('activate') },
    { id: 'launch', title: 'Phase 4: Launched', description: 'Board joined and ready for business.', icon: Rocket, unlocked: isPhaseUnlocked('launch') },
    { id: 'zillow', title: 'Phase 5: Enrolled', description: 'Zillow Premier and FUB setup complete.', icon: Star, unlocked: isPhaseUnlocked('zillow') },
  ];

  return (
    <div style={styles.grid}>
      {badges.map((badge, index) => (
        <div 
          key={badge.id} 
          style={{
            ...styles.badgeCard,
            opacity: badge.unlocked ? 1 : 0.6,
            filter: badge.unlocked ? 'none' : 'grayscale(100%)',
            animationDelay: `${index * 100}ms` // stagger animation
          }}
          title={badge.description}
          className="badge-hover animate-fade-in"
        >
          <div style={{
            ...styles.iconWrapper,
            background: badge.unlocked ? 'linear-gradient(135deg, var(--color-primary), var(--color-dark-navy))' : 'var(--color-frosted-blue)',
            color: badge.unlocked ? 'white' : 'var(--color-moss-grey)',
            boxShadow: badge.unlocked ? '0 4px 12px rgba(12, 15, 36, 0.15)' : 'none'
          }}>
            <badge.icon size={24} />
          </div>
          <div style={styles.badgeInfo}>
            <h4 style={styles.title}>{badge.title}</h4>
            <span style={{
              ...styles.status,
              color: badge.unlocked ? 'var(--color-success)' : 'var(--color-text-muted)',
              fontWeight: badge.unlocked ? '600' : '400'
            }}>{badge.unlocked ? 'Unlocked' : 'Locked'}</span>
          </div>
        </div>
      ))}

      <style>{`
        .badge-hover {
          transition: transform var(--transition-fast), box-shadow var(--transition-fast);
        }
        .badge-hover:hover {
          transform: translateY(-4px);
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
    gap: '1.25rem',
    padding: '1.25rem',
    backgroundColor: 'var(--color-card-bg)',
    borderRadius: 'var(--border-radius-sm)',
    border: '1px solid var(--color-border)',
    cursor: 'default',
  },
  iconWrapper: {
    width: '48px',
    height: '48px',
    borderRadius: '12px', /* more modern than full circle */
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease'
  },
  badgeInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    fontSize: '0.9rem',
    fontWeight: '700',
    margin: 0,
    color: 'var(--color-text-main)'
  },
  status: {
    fontSize: '0.75rem',
    marginTop: '0.25rem'
  }
};

export default BadgeList;
