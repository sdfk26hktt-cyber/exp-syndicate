import React from 'react';
import { getLevelInfo, DEFAULT_LEVEL_THRESHOLDS } from '../../utils/gamification';

const TIER_STYLES = {
  tier1: {
    // Level 1-2
    bg: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
    color: '#334155',
    border: '1px solid #94a3b8',
    glow: 'none'
  },
  tier2: {
    // Level 3-4
    bg: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
    color: '#0369a1',
    border: '1px solid #38bdf8',
    glow: '0 0 6px rgba(56, 189, 248, 0.2)'
  },
  tier3: {
    // Level 5-6
    bg: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
    color: '#6d28d9',
    border: '1px solid #a78bfa',
    glow: '0 0 8px rgba(167, 139, 250, 0.25)'
  },
  tier4: {
    // Level 7-8
    bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    color: '#b45309',
    border: '1px solid #f59e0b',
    glow: '0 0 10px rgba(245, 158, 11, 0.3)'
  },
  tier5: {
    // Level 9
    bg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
    color: '#b91c1c',
    border: '1px solid #ef4444',
    glow: '0 0 12px rgba(239, 68, 68, 0.35)'
  }
};

const getTierStyle = (level) => {
  if (level >= 9) return TIER_STYLES.tier5;
  if (level >= 7) return TIER_STYLES.tier4;
  if (level >= 5) return TIER_STYLES.tier3;
  if (level >= 3) return TIER_STYLES.tier2;
  return TIER_STYLES.tier1;
};

const LevelBadge = ({ 
  level, 
  xp, 
  thresholds = DEFAULT_LEVEL_THRESHOLDS, 
  size = 'sm', 
  showTitle = false,
  className = '',
  style = {}
}) => {
  // If level not passed directly, derive from xp
  let currentLevel = level;
  let levelTitle;

  if (currentLevel === undefined || currentLevel === null) {
    const info = getLevelInfo(xp || 0, thresholds);
    currentLevel = info.level;
    levelTitle = info.title;
  } else {
    const matched = (thresholds || DEFAULT_LEVEL_THRESHOLDS).find(t => t.level === currentLevel);
    levelTitle = matched ? matched.title : `Level ${currentLevel}`;
  }

  const tier = getTierStyle(currentLevel);

  const sizeStyles = {
    xs: {
      padding: '1px 6px',
      fontSize: '0.65rem',
      fontWeight: '700',
      borderRadius: '999px',
      height: '18px',
      gap: '3px'
    },
    sm: {
      padding: '2px 8px',
      fontSize: '0.72rem',
      fontWeight: '700',
      borderRadius: '999px',
      height: '22px',
      gap: '4px'
    },
    md: {
      padding: '3px 10px',
      fontSize: '0.8rem',
      fontWeight: '700',
      borderRadius: '999px',
      height: '26px',
      gap: '5px'
    },
    lg: {
      padding: '5px 14px',
      fontSize: '0.9rem',
      fontWeight: '800',
      borderRadius: '999px',
      height: '32px',
      gap: '6px'
    }
  };

  const selectedSize = sizeStyles[size] || sizeStyles.sm;

  return (
    <span
      className={`level-badge ${className}`}
      title={`Level ${currentLevel} • ${levelTitle}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: tier.bg,
        color: tier.color,
        border: tier.border,
        boxShadow: tier.glow,
        letterSpacing: '0.02em',
        lineHeight: 1,
        whiteSpace: 'nowrap',
        userSelect: 'none',
        flexShrink: 0,
        ...selectedSize,
        ...style
      }}
    >
      <span style={{ opacity: 0.9 }}>Lv.{currentLevel}</span>
      {showTitle && (
        <span style={{ fontWeight: '600', opacity: 0.9 }}>
          {levelTitle}
        </span>
      )}
    </span>
  );
};

export default LevelBadge;
