import React, { useState } from 'react';
import { Trophy } from 'lucide-react';
import { useAgent } from '../../context/AgentContext';
import { aggregateXpByWindow, getLevelInfo } from '../../utils/gamification';
import LevelBadge from './LevelBadge';

const Leaderboard = () => {
  const { agents, xpEvents, gamificationSettings } = useAgent();
  const [window, setWindow] = useState('7d'); // '7d' | '30d' | 'all'

  const rankedData = aggregateXpByWindow(agents, xpEvents, window);

  const getMedal = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  return (
    <div className="card" style={styles.card}>
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Trophy size={18} color="var(--color-accent)" />
          <h3 style={styles.title}>Leaderboard</h3>
        </div>

        {/* Time Window Selector */}
        <div style={styles.windowToggle}>
          <button 
            style={{ ...styles.toggleBtn, ...(window === '7d' ? styles.activeToggle : {}) }}
            onClick={() => setWindow('7d')}
          >
            7D
          </button>
          <button 
            style={{ ...styles.toggleBtn, ...(window === '30d' ? styles.activeToggle : {}) }}
            onClick={() => setWindow('30d')}
          >
            30D
          </button>
          <button 
            style={{ ...styles.toggleBtn, ...(window === 'all' ? styles.activeToggle : {}) }}
            onClick={() => setWindow('all')}
          >
            All-Time
          </button>
        </div>
      </div>

      <div style={styles.list}>
        {rankedData.slice(0, 10).map((item, index) => {
          const agent = item.agent;
          const levelInfo = getLevelInfo(agent.xp || 0, gamificationSettings?.levelThresholds);
          const isTopThree = index < 3;

          return (
            <div 
              key={agent.id} 
              style={{
                ...styles.row,
                backgroundColor: isTopThree ? 'rgba(0, 161, 224, 0.04)' : 'transparent',
                borderColor: isTopThree ? 'rgba(0, 161, 224, 0.15)' : 'transparent'
              }}
            >
              {/* Rank / Medal */}
              <div style={styles.rankCol}>
                <span style={{ fontSize: isTopThree ? '1.1rem' : '0.8rem', fontWeight: 'bold', color: 'var(--color-dark-navy)' }}>
                  {getMedal(index)}
                </span>
              </div>

              {/* Avatar + Level */}
              <div style={styles.avatarWrapper}>
                <div style={styles.avatar}>
                  {(agent.name || '?').charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Agent Name + Title */}
              <div style={styles.nameCol}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={styles.agentName}>{agent.name || 'Agent'}</span>
                  <LevelBadge 
                    level={levelInfo.level} 
                    thresholds={gamificationSettings?.levelThresholds} 
                    size="xs" 
                  />
                </div>
                <span style={styles.levelTitle}>{levelInfo.title}</span>
              </div>

              {/* XP */}
              <div style={styles.xpCol}>
                <span style={styles.xpText}>
                  {item.windowXp > 0 ? `+${item.windowXp}` : item.windowXp} XP
                </span>
              </div>
            </div>
          );
        })}

        {rankedData.length === 0 && (
          <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            No agent activity recorded yet.
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  card: {
    padding: '1.25rem',
    borderRadius: '12px',
    backgroundColor: 'var(--color-card-bg)',
    border: '1px solid var(--color-border)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    gap: '0.5rem',
    flexWrap: 'wrap'
  },
  title: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: '700',
    color: 'var(--color-dark-navy)'
  },
  windowToggle: {
    display: 'flex',
    backgroundColor: 'var(--color-background)',
    borderRadius: '20px',
    padding: '2px',
    border: '1px solid var(--color-border)'
  },
  toggleBtn: {
    border: 'none',
    background: 'transparent',
    padding: '3px 8px',
    fontSize: '0.72rem',
    fontWeight: '600',
    borderRadius: '16px',
    cursor: 'pointer',
    color: 'var(--color-text-muted)',
    transition: 'all 0.2s ease'
  },
  activeToggle: {
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    maxHeight: '340px',
    overflowY: 'auto',
    paddingRight: '2px'
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0.45rem 0.6rem',
    borderRadius: '8px',
    border: '1px solid transparent',
    transition: 'background-color 0.2s'
  },
  rankCol: {
    width: '24px',
    textAlign: 'center',
    flexShrink: 0
  },
  avatarWrapper: {
    position: 'relative',
    flexShrink: 0
  },
  avatar: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    fontWeight: 'bold',
  },
  nameCol: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column'
  },
  agentName: {
    fontSize: '0.82rem',
    fontWeight: '600',
    color: 'var(--color-dark-navy)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  levelTitle: {
    fontSize: '0.68rem',
    color: 'var(--color-text-muted)'
  },
  xpCol: {
    flexShrink: 0
  },
  xpText: {
    fontSize: '0.78rem',
    fontWeight: '700',
    color: 'var(--color-primary)',
    backgroundColor: 'rgba(0, 161, 224, 0.08)',
    padding: '0.15rem 0.45rem',
    borderRadius: '12px'
  }
};

export default Leaderboard;
