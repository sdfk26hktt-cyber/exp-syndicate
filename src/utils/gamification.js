/**
 * Gamification Core Configuration and Helper Utilities
 * Real Estate / eXp Syndicate Theme
 */

export const DEFAULT_LEVEL_THRESHOLDS = [
  { level: 1, xpRequired: 0, title: 'Rookie' },
  { level: 2, xpRequired: 50, title: 'Apprentice' },
  { level: 3, xpRequired: 125, title: 'Rising Agent' },
  { level: 4, xpRequired: 250, title: 'Producer' },
  { level: 5, xpRequired: 500, title: 'Senior Producer' },
  { level: 6, xpRequired: 1000, title: 'Premier Agent' },
  { level: 7, xpRequired: 2000, title: 'Syndicate Leader' },
  { level: 8, xpRequired: 3500, title: 'Top Producer' },
  { level: 9, xpRequired: 5000, title: 'Icon Agent' }
];

export const DEFAULT_PHASE_UNLOCK_LEVELS = {
  apply: 1,      // Phase 1: Apply (Level 1 / 0 XP)
  process: 2,    // Phase 2: Process (Level 2 / 50 XP)
  activate: 3,   // Phase 3: Activate (Level 3 / 125 XP)
  launch: 4,     // Phase 4: Launch (Level 4 / 250 XP)
  zillow: 5      // Phase 5: Zillow Enrollment (Level 5 / 500 XP)
};

/**
 * Computes level details from total XP
 * @param {number} totalXp 
 * @param {Array} thresholds 
 * @returns {object} Level info including current level, title, progress % to next level
 */
export const getLevelInfo = (totalXp = 0, thresholds = DEFAULT_LEVEL_THRESHOLDS) => {
  const currentThresholds = (thresholds && thresholds.length > 0) ? thresholds : DEFAULT_LEVEL_THRESHOLDS;
  const sorted = [...currentThresholds].sort((a, b) => a.level - b.level);
  const xp = Math.max(0, Number(totalXp) || 0);

  let currentLevelObj = sorted[0];
  let nextLevelObj = null;

  for (let i = 0; i < sorted.length; i++) {
    if (xp >= sorted[i].xpRequired) {
      currentLevelObj = sorted[i];
      nextLevelObj = sorted[i + 1] || null;
    } else {
      if (!nextLevelObj) nextLevelObj = sorted[i];
      break;
    }
  }

  const currentLevel = currentLevelObj.level;
  const title = currentLevelObj.title;
  const currentLevelXp = currentLevelObj.xpRequired;
  const nextLevelXp = nextLevelObj ? nextLevelObj.xpRequired : null;

  let progressPercent = 100;
  let xpToNextLevel = 0;

  if (nextLevelObj) {
    const range = nextLevelXp - currentLevelXp;
    const earnedInRange = xp - currentLevelXp;
    progressPercent = range > 0 ? Math.min(100, Math.max(0, Math.round((earnedInRange / range) * 100))) : 100;
    xpToNextLevel = Math.max(0, nextLevelXp - xp);
  }

  return {
    level: currentLevel,
    title,
    xp,
    currentLevelXp,
    nextLevelXp,
    nextLevelTitle: nextLevelObj ? nextLevelObj.title : null,
    xpToNextLevel,
    progressPercent,
    isMaxLevel: !nextLevelObj
  };
};

/**
 * Checks phase unlock status against current agent level
 */
export const getPhaseUnlockStatus = (
  phaseId,
  currentLevel = 1,
  currentXp = 0,
  phaseUnlockLevels = DEFAULT_PHASE_UNLOCK_LEVELS,
  thresholds = DEFAULT_LEVEL_THRESHOLDS
) => {
  const unlockMap = phaseUnlockLevels || DEFAULT_PHASE_UNLOCK_LEVELS;
  const currentThresholds = (thresholds && thresholds.length > 0) ? thresholds : DEFAULT_LEVEL_THRESHOLDS;
  const reqLevel = unlockMap[phaseId] || 1;
  const reqLevelObj = currentThresholds.find(t => t.level === reqLevel) || { level: reqLevel, xpRequired: 0, title: 'Rookie' };
  
  const isUnlocked = currentLevel >= reqLevel;
  const xpRemaining = Math.max(0, reqLevelObj.xpRequired - currentXp);

  return {
    requiredLevel: reqLevel,
    requiredLevelTitle: reqLevelObj.title,
    requiredXp: reqLevelObj.xpRequired,
    isUnlocked,
    xpRemaining
  };
};

/**
 * Aggregates XP events within a given timeframe (7d, 30d, all)
 */
export const aggregateXpByWindow = (agents = [], xpEvents = [], window = '7d') => {
  const now = Date.now();
  let cutoff = 0;

  if (window === '7d') {
    cutoff = now - 7 * 24 * 60 * 60 * 1000;
  } else if (window === '30d') {
    cutoff = now - 30 * 24 * 60 * 60 * 1000;
  }

  // Calculate window XP per agent
  const windowXpMap = {};

  if (window === 'all') {
    agents.forEach(a => {
      windowXpMap[a.id] = Number(a.xp) || 0;
    });
  } else {
    (xpEvents || []).forEach(evt => {
      const evtTime = new Date(evt.created_at).getTime();
      if (evtTime >= cutoff) {
        windowXpMap[evt.agent_id] = (windowXpMap[evt.agent_id] || 0) + (Number(evt.xp_amount) || 0);
      }
    });
  }

  // Build ranked array
  const ranked = (agents || []).map(agent => {
    const earnedXp = window === 'all' 
      ? (Number(agent.xp) || 0) 
      : (windowXpMap[agent.id] || 0);

    return {
      agent,
      windowXp: earnedXp,
      totalXp: Number(agent.xp) || 0
    };
  });

  // Sort descending by windowXp, fallback to totalXp
  ranked.sort((a, b) => b.windowXp - a.windowXp || b.totalXp - a.totalXp);

  return ranked;
};
