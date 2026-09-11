import { UserPreparednessState, WeatherBadge, PreparednessChecklist } from '../types';

export const INITIAL_BADGES: WeatherBadge[] = [
  {
    id: 'badge_streak_3',
    name: 'Meteorological Sentinel',
    description: 'Maintained proactive forecast awareness with a 3-day consecutive check-in streak.',
    iconName: 'Flame',
    tier: 'BRONZE',
    category: 'CHECK_IN',
    xpReward: 100,
    progress: 33,
    targetCount: 3,
    currentCount: 1,
    requirement: 'Check local weather 3 days consecutively',
  },
  {
    id: 'badge_streak_7',
    name: 'Week Forecaster',
    description: 'Consistently checked weather forecasts every day for a full 7-day cycle.',
    iconName: 'Zap',
    tier: 'SILVER',
    category: 'CHECK_IN',
    xpReward: 250,
    progress: 14,
    targetCount: 7,
    currentCount: 1,
    requirement: 'Reach a 7-day daily check-in streak',
  },
  {
    id: 'badge_streak_30',
    name: 'Climate Guardian',
    description: 'Achieved elite meteorological vigilance with a 30-day uninterrupted check-in streak.',
    iconName: 'Award',
    tier: 'GOLD',
    category: 'CHECK_IN',
    xpReward: 600,
    progress: 3,
    targetCount: 3,
    currentCount: 1,
    requirement: 'Reach a 30-day daily check-in streak',
  },
  {
    id: 'badge_storm_prep',
    name: 'Storm Prepper',
    description: 'Reviewed safety protocols and sheltered resources during extreme weather events.',
    iconName: 'ShieldAlert',
    tier: 'SILVER',
    category: 'PREPARATION',
    xpReward: 200,
    progress: 0,
    targetCount: 1,
    currentCount: 0,
    requirement: 'Review emergency safety plan during an active severe alert',
  },
  {
    id: 'badge_gobag',
    name: 'Go-Bag Certified',
    description: 'Verified and packed all essential supplies on the hyper-local emergency preparedness checklist.',
    iconName: 'CheckCircle2',
    tier: 'GOLD',
    category: 'PREPARATION',
    xpReward: 350,
    progress: 50,
    targetCount: 6,
    currentCount: 3,
    requirement: 'Complete all 6 essential items on emergency readiness checklist',
  },
  {
    id: 'badge_drill_master',
    name: 'Readiness Drill Master',
    description: 'Conducted emergency disaster readiness simulations to sharpen crisis response reflexes.',
    iconName: 'Sparkles',
    tier: 'PLATINUM',
    category: 'PREPARATION',
    xpReward: 500,
    progress: 0,
    targetCount: 3,
    currentCount: 0,
    requirement: 'Complete 3 simulated extreme weather readiness drills',
  },
  {
    id: 'badge_historical_scout',
    name: 'Climate Historian',
    description: 'Analyzed historical ERA5 climate telemetry to understand long-term baseline shifts.',
    iconName: 'History',
    tier: 'BRONZE',
    category: 'CLIMATE_AWARENESS',
    xpReward: 120,
    progress: 0,
    targetCount: 2,
    currentCount: 0,
    requirement: 'Query historical climate archive at least twice',
  },
  {
    id: 'badge_shelter_scout',
    name: 'Safe Haven Scout',
    description: 'Located designated emergency storm shelters and safe transit zones on Google Maps.',
    iconName: 'Compass',
    tier: 'SILVER',
    category: 'PREPARATION',
    xpReward: 180,
    progress: 0,
    targetCount: 1,
    currentCount: 0,
    requirement: 'Locate local emergency storm shelters on Google Maps',
  },
];

export const INITIAL_PREPAREDNESS_STATE: UserPreparednessState = {
  currentStreak: 1,
  longestStreak: 1,
  lastCheckInDate: '',
  readinessXP: 140,
  level: 1,
  levelTitle: 'Weather Novice',
  badges: INITIAL_BADGES,
  checklist: {
    goBagReady: true,
    emergencyContactsListed: true,
    powerBankCharged: true,
    waterSuppliesStored: false,
    shelterRouteIdentified: false,
    pushAlertsActive: true,
  },
  totalForecastChecks: 5,
  extremePrepsCompleted: 0,
  historicalAnalyzedCount: 0,
  sheltersExploredCount: 0,
};

// Level thresholds: [minXP, maxXP, title]
const LEVELS = [
  { level: 1, minXp: 0, maxXp: 200, title: 'Weather Novice' },
  { level: 2, minXp: 200, maxXp: 500, title: 'Forecast Observer' },
  { level: 3, minXp: 500, maxXp: 950, title: 'Storm Ready Scout' },
  { level: 4, minXp: 950, maxXp: 1600, title: 'Resilience Specialist' },
  { level: 5, minXp: 1600, maxXp: 2500, title: 'Climate Sentinel' },
];

export function getLevelDetails(xp: number) {
  const current = LEVELS.find((l) => xp >= l.minXp && xp < l.maxXp) || LEVELS[LEVELS.length - 1];
  const next = LEVELS.find((l) => l.level === current.level + 1);
  const nextXp = next ? next.minXp : current.maxXp;
  const range = nextXp - current.minXp;
  const progress = Math.min(100, Math.max(0, Math.round(((xp - current.minXp) / range) * 100)));

  return {
    level: current.level,
    levelTitle: current.title,
    currentLevelMinXp: current.minXp,
    nextLevelXp: nextXp,
    progressPercent: progress,
    remainingXp: Math.max(0, nextXp - xp),
  };
}

export function recordDailyCheckIn(prev: UserPreparednessState): {
  state: UserPreparednessState;
  alreadyCheckedIn: boolean;
  newStreak: number;
  xpEarned: number;
  unlockedBadgeNames: string[];
} {
  const today = new Date().toISOString().split('T')[0];
  if (prev.lastCheckInDate === today) {
    return {
      state: prev,
      alreadyCheckedIn: true,
      newStreak: prev.currentStreak,
      xpEarned: 0,
      unlockedBadgeNames: [],
    };
  }

  // Determine streak continuity
  let newStreak = 1;
  if (prev.lastCheckInDate) {
    const lastDate = new Date(prev.lastCheckInDate);
    const currentDate = new Date(today);
    const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      newStreak = prev.currentStreak + 1;
    } else if (diffDays === 0) {
      newStreak = prev.currentStreak;
    } else {
      newStreak = 1;
    }
  }

  const longestStreak = Math.max(prev.longestStreak, newStreak);
  const xpEarned = 50 + (newStreak > 1 ? Math.min(100, newStreak * 10) : 0);
  const newTotalChecks = prev.totalForecastChecks + 1;

  const unlockedBadgeNames: string[] = [];
  const updatedBadges = prev.badges.map((badge) => {
    let count = badge.currentCount;
    let unlockedAt = badge.unlockedAt;

    if (badge.id === 'badge_streak_3') {
      count = Math.min(badge.targetCount, newStreak);
    } else if (badge.id === 'badge_streak_7') {
      count = Math.min(badge.targetCount, newStreak);
    } else if (badge.id === 'badge_streak_30') {
      count = Math.min(badge.targetCount, newStreak);
    }

    const progress = Math.min(100, Math.round((count / badge.targetCount) * 100));
    if (!unlockedAt && count >= badge.targetCount) {
      unlockedAt = new Date().toLocaleDateString();
      unlockedBadgeNames.push(badge.name);
    }

    return { ...badge, currentCount: count, progress, unlockedAt };
  });

  const newXP = prev.readinessXP + xpEarned;
  const lvl = getLevelDetails(newXP);

  return {
    state: {
      ...prev,
      currentStreak: newStreak,
      longestStreak,
      lastCheckInDate: today,
      readinessXP: newXP,
      level: lvl.level,
      levelTitle: lvl.levelTitle,
      badges: updatedBadges,
      totalForecastChecks: newTotalChecks,
    },
    alreadyCheckedIn: false,
    newStreak,
    xpEarned,
    unlockedBadgeNames,
  };
}

export function recordExtremeEventPrep(prev: UserPreparednessState): {
  state: UserPreparednessState;
  unlockedBadgeNames: string[];
} {
  const newCount = prev.extremePrepsCompleted + 1;
  const xpReward = 150;
  const unlockedBadgeNames: string[] = [];

  const updatedBadges = prev.badges.map((badge) => {
    if (badge.id === 'badge_storm_prep') {
      const count = Math.min(badge.targetCount, newCount);
      const unlockedAt = !badge.unlockedAt && count >= badge.targetCount ? new Date().toLocaleDateString() : badge.unlockedAt;
      if (!badge.unlockedAt && unlockedAt) unlockedBadgeNames.push(badge.name);
      return { ...badge, currentCount: count, progress: 100, unlockedAt };
    }
    return badge;
  });

  const newXP = prev.readinessXP + xpReward;
  const lvl = getLevelDetails(newXP);

  return {
    state: {
      ...prev,
      extremePrepsCompleted: newCount,
      readinessXP: newXP,
      level: lvl.level,
      levelTitle: lvl.levelTitle,
      badges: updatedBadges,
    },
    unlockedBadgeNames,
  };
}

export function recordHistoricalAnalysis(prev: UserPreparednessState): UserPreparednessState {
  const newCount = prev.historicalAnalyzedCount + 1;
  const xpReward = 60;

  const updatedBadges = prev.badges.map((badge) => {
    if (badge.id === 'badge_historical_scout') {
      const count = Math.min(badge.targetCount, newCount);
      const unlockedAt = !badge.unlockedAt && count >= badge.targetCount ? new Date().toLocaleDateString() : badge.unlockedAt;
      return { ...badge, currentCount: count, progress: Math.min(100, Math.round((count / badge.targetCount) * 100)), unlockedAt };
    }
    return badge;
  });

  const newXP = prev.readinessXP + xpReward;
  const lvl = getLevelDetails(newXP);

  return {
    ...prev,
    historicalAnalyzedCount: newCount,
    readinessXP: newXP,
    level: lvl.level,
    levelTitle: lvl.levelTitle,
    badges: updatedBadges,
  };
}

export function recordShelterExplored(prev: UserPreparednessState): UserPreparednessState {
  const newCount = prev.sheltersExploredCount + 1;
  const xpReward = 80;

  const updatedBadges = prev.badges.map((badge) => {
    if (badge.id === 'badge_shelter_scout') {
      const count = Math.min(badge.targetCount, newCount);
      const unlockedAt = !badge.unlockedAt && count >= badge.targetCount ? new Date().toLocaleDateString() : badge.unlockedAt;
      return { ...badge, currentCount: count, progress: 100, unlockedAt };
    }
    return badge;
  });

  const newXP = prev.readinessXP + xpReward;
  const lvl = getLevelDetails(newXP);

  return {
    ...prev,
    sheltersExploredCount: newCount,
    readinessXP: newXP,
    level: lvl.level,
    levelTitle: lvl.levelTitle,
    badges: updatedBadges,
  };
}

export function toggleChecklist(
  prev: UserPreparednessState,
  key: keyof PreparednessChecklist
): { state: UserPreparednessState; allCompleted: boolean } {
  const updatedChecklist = {
    ...prev.checklist,
    [key]: !prev.checklist[key],
  };

  const completedCount = Object.values(updatedChecklist).filter(Boolean).length;
  const allCompleted = completedCount === Object.keys(updatedChecklist).length;
  let xpReward = prev.checklist[key] ? -25 : 25;
  if (allCompleted && !prev.badges.find((b) => b.id === 'badge_gobag')?.unlockedAt) {
    xpReward += 200;
  }

  const updatedBadges = prev.badges.map((badge) => {
    if (badge.id === 'badge_gobag') {
      const unlockedAt = allCompleted ? badge.unlockedAt || new Date().toLocaleDateString() : undefined;
      return {
        ...badge,
        currentCount: completedCount,
        progress: Math.round((completedCount / badge.targetCount) * 100),
        unlockedAt,
      };
    }
    return badge;
  });

  const newXP = Math.max(0, prev.readinessXP + xpReward);
  const lvl = getLevelDetails(newXP);

  return {
    state: {
      ...prev,
      checklist: updatedChecklist,
      readinessXP: newXP,
      level: lvl.level,
      levelTitle: lvl.levelTitle,
      badges: updatedBadges,
    },
    allCompleted,
  };
}

export function completeReadinessDrill(prev: UserPreparednessState): {
  state: UserPreparednessState;
  unlockedBadgeNames: string[];
} {
  const newCount = prev.extremePrepsCompleted + 1;
  const xpReward = 180;
  const unlockedBadgeNames: string[] = [];

  const updatedBadges = prev.badges.map((badge) => {
    if (badge.id === 'badge_drill_master') {
      const count = Math.min(badge.targetCount, badge.currentCount + 1);
      const unlockedAt = !badge.unlockedAt && count >= badge.targetCount ? new Date().toLocaleDateString() : badge.unlockedAt;
      if (!badge.unlockedAt && unlockedAt) unlockedBadgeNames.push(badge.name);
      return {
        ...badge,
        currentCount: count,
        progress: Math.round((count / badge.targetCount) * 100),
        unlockedAt,
      };
    }
    return badge;
  });

  const newXP = prev.readinessXP + xpReward;
  const lvl = getLevelDetails(newXP);

  return {
    state: {
      ...prev,
      extremePrepsCompleted: newCount,
      readinessXP: newXP,
      level: lvl.level,
      levelTitle: lvl.levelTitle,
      badges: updatedBadges,
    },
    unlockedBadgeNames,
  };
}
