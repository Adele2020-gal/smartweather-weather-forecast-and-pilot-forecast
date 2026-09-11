import React, { useState, useEffect } from 'react';
import {
  Award,
  Flame,
  Zap,
  ShieldAlert,
  CheckCircle2,
  Circle,
  Trophy,
  Calendar,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  ArrowUpRight,
  Activity,
  Droplets,
  Wind,
  Sun,
  Compass,
  History,
  RefreshCw,
  CheckCheck,
  Target,
  Layers,
  ChevronRight,
  ShieldCheck,
  Radio,
  Sliders,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  WeatherData,
  UserPreferences,
  UserPreparednessState,
  WeatherBadge,
  PreparednessChecklist,
  LocalClimateImpact,
} from '../types';
import {
  getLevelDetails,
  recordDailyCheckIn,
  toggleChecklist,
  completeReadinessDrill,
  INITIAL_PREPAREDNESS_STATE,
} from '../utils/preparednessEngine';

interface ClimateImpactDashboardProps {
  currentWeather: WeatherData;
  userPrefs: UserPreferences;
  preparednessState?: UserPreparednessState;
  onUpdatePreparedness: (state: UserPreparednessState) => void;
  onOpenHistorical?: () => void;
  onOpenMaps?: () => void;
}

export const ClimateImpactDashboard: React.FC<ClimateImpactDashboardProps> = ({
  currentWeather,
  userPrefs,
  preparednessState = INITIAL_PREPAREDNESS_STATE,
  onUpdatePreparedness,
  onOpenHistorical,
  onOpenMaps,
}) => {
  const { location, current } = currentWeather;

  const [activeTab, setActiveTab] = useState<'badges' | 'trends' | 'checklist'>('badges');
  const [badgeFilter, setBadgeFilter] = useState<'ALL' | 'UNLOCKED' | 'IN_PROGRESS'>('ALL');
  const [climateImpact, setClimateImpact] = useState<LocalClimateImpact | null>(null);
  const [isImpactLoading, setIsImpactLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedDrill, setSelectedDrill] = useState<string>('HURRICANE');
  const [isDrillRunning, setIsDrillRunning] = useState<boolean>(false);
  const [drillSuccess, setDrillSuccess] = useState<boolean>(false);

  // Calculate Level details
  const levelInfo = getLevelDetails(preparednessState.readinessXP);
  const today = new Date().toISOString().split('T')[0];
  const isCheckedInToday = preparednessState.lastCheckInDate === today;

  // Fetch local climate impact trends
  const fetchClimateImpact = async () => {
    setIsImpactLoading(true);
    try {
      const res = await fetch(
        `/api/climate/impact?lat=${location.latitude}&lon=${location.longitude}&name=${encodeURIComponent(
          location.name
        )}&country=${encodeURIComponent(location.country)}`
      );
      if (res.ok) {
        const data: LocalClimateImpact = await res.json();
        setClimateImpact(data);
      }
    } catch (err) {
      console.warn('Failed to fetch climate impact data:', err);
    } finally {
      setIsImpactLoading(false);
    }
  };

  useEffect(() => {
    fetchClimateImpact();
  }, [location.latitude, location.longitude]);

  // Show temporary toast message
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Handle Daily Check-in action
  const handleCheckIn = () => {
    const result = recordDailyCheckIn(preparednessState);
    onUpdatePreparedness(result.state);

    if (result.alreadyCheckedIn) {
      triggerToast('✓ Already checked in for today! Maintain your streak tomorrow.');
    } else {
      let msg = `🔥 Check-in logged! Streak: ${result.newStreak} days (+${result.xpEarned} XP)`;
      if (result.unlockedBadgeNames.length > 0) {
        msg += ` 🏆 Unlocked badge: ${result.unlockedBadgeNames.join(', ')}!`;
      }
      triggerToast(msg);
    }
  };

  // Handle Checklist item toggle
  const handleToggleChecklist = (key: keyof PreparednessChecklist) => {
    const result = toggleChecklist(preparednessState, key);
    onUpdatePreparedness(result.state);
    if (result.allCompleted) {
      triggerToast('🎉 Emergency Go-Bag checklist 100% complete! Awarded Go-Bag Certified badge & +200 XP!');
    }
  };

  // Run simulated extreme drill
  const handleRunDrill = () => {
    setIsDrillRunning(true);
    setDrillSuccess(false);

    setTimeout(() => {
      setIsDrillRunning(false);
      setDrillSuccess(true);
      const result = completeReadinessDrill(preparednessState);
      onUpdatePreparedness(result.state);
      triggerToast(`🚨 ${selectedDrill} Drill successfully executed! Preparedness reflexes verified (+180 XP)`);
    }, 1800);
  };

  // Filtered badges
  const filteredBadges = preparednessState.badges.filter((b) => {
    if (badgeFilter === 'UNLOCKED') return Boolean(b.unlockedAt);
    if (badgeFilter === 'IN_PROGRESS') return !b.unlockedAt;
    return true;
  });

  const unlockedCount = preparednessState.badges.filter((b) => b.unlockedAt).length;

  // Helper for Badge tier color
  const getBadgeTierStyle = (tier: WeatherBadge['tier'], unlocked: boolean) => {
    if (!unlocked) {
      return {
        badgeBorder: 'border-slate-800 bg-slate-900/40 text-slate-500',
        iconBg: 'bg-slate-800/60 text-slate-500',
        chipBg: 'bg-slate-800 text-slate-400',
      };
    }
    switch (tier) {
      case 'PLATINUM':
        return {
          badgeBorder: 'border-purple-500/50 bg-purple-950/20 shadow-lg shadow-purple-950/40 text-purple-200',
          iconBg: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
          chipBg: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
        };
      case 'GOLD':
        return {
          badgeBorder: 'border-amber-500/50 bg-amber-950/20 shadow-lg shadow-amber-950/40 text-amber-200',
          iconBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
          chipBg: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
        };
      case 'SILVER':
        return {
          badgeBorder: 'border-cyan-500/50 bg-cyan-950/20 shadow-lg shadow-cyan-950/40 text-cyan-200',
          iconBg: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
          chipBg: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
        };
      case 'BRONZE':
      default:
        return {
          badgeBorder: 'border-orange-500/40 bg-orange-950/15 shadow-md shadow-orange-950/30 text-orange-200',
          iconBg: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
          chipBg: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
        };
    }
  };

  const getBadgeIcon = (iconName: string, className = 'w-5 h-5') => {
    switch (iconName) {
      case 'Flame':
        return <Flame className={className} />;
      case 'Zap':
        return <Zap className={className} />;
      case 'Award':
        return <Award className={className} />;
      case 'ShieldAlert':
        return <ShieldAlert className={className} />;
      case 'CheckCircle2':
        return <CheckCircle2 className={className} />;
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'History':
        return <History className={className} />;
      case 'Compass':
        return <Compass className={className} />;
      default:
        return <Trophy className={className} />;
    }
  };

  return (
    <div
      id="climate-impact-dashboard"
      className="p-6 sm:p-8 rounded-3xl bg-slate-900/95 border border-slate-800 text-slate-100 shadow-2xl backdrop-blur-xl relative overflow-hidden space-y-8"
    >
      {/* Background radiant ambient glow */}
      <div className="absolute top-0 right-1/3 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Floating Toast Message */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 max-w-md p-4 rounded-2xl bg-slate-900 border-2 border-emerald-500 shadow-2xl shadow-emerald-950/60 text-white font-mono text-xs flex items-center gap-3 animate-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 animate-pulse" />
          <div className="flex-1">{toastMessage}</div>
        </div>
      )}

      {/* 1. Header & Proactive Preparedness Hero Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div className="flex items-start sm:items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-cyan-500/20 to-blue-500/20 border border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-950/30">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Climate Impact & Preparedness Hub
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold">
                {location.name} Decadal Trends
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Track local climate change telemetry over time, build proactive forecast streaks, and earn meteorological readiness badges.
            </p>
          </div>
        </div>

        {/* Daily Check-in & Action Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            id="claim-daily-weather-checkin-btn"
            onClick={handleCheckIn}
            className={`px-4 py-2.5 rounded-2xl text-xs font-mono font-bold tracking-wider transition-all flex items-center gap-2 shadow-lg ${
              isCheckedInToday
                ? 'bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 animate-pulse'
            }`}
          >
            {isCheckedInToday ? (
              <>
                <CheckCheck className="w-4 h-4 text-emerald-400" />
                <span>CHECKED IN TODAY (STREAK ACTIVE)</span>
              </>
            ) : (
              <>
                <Flame className="w-4 h-4 text-amber-300 animate-bounce" />
                <span>CLAIM TODAY'S FORECAST CHECK-IN (+50 XP)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Stats & Readiness Rank Bento Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: User Rank & Level */}
        <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>PREPAREDNESS RANK</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-bold">
                LVL {levelInfo.level}
              </span>
            </div>
            <div className="text-lg font-bold text-white mt-1.5 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>{levelInfo.levelTitle}</span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              {preparednessState.readinessXP} Total Preparedness XP
            </div>
          </div>

          {/* Level Progress Bar */}
          <div className="mt-4 pt-3 border-t border-slate-800/60">
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1.5">
              <span>Progress to Next Rank</span>
              <span className="font-bold text-white">{levelInfo.progressPercent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${levelInfo.progressPercent}%` }}
              />
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-1.5 text-right">
              {levelInfo.remainingXp} XP until next tier
            </div>
          </div>
        </div>

        {/* Card 2: Daily Check-In Streak */}
        <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>FORECAST STREAK</span>
              <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
            </div>
            <div className="text-2xl font-extrabold text-white mt-1.5 font-mono">
              {preparednessState.currentStreak} <span className="text-xs font-normal text-slate-400">Days</span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              Record Streak: {preparednessState.longestStreak} Days Active
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Total Inquiries:</span>
            <span className="text-cyan-300 font-bold">{preparednessState.totalForecastChecks} Checks</span>
          </div>
        </div>

        {/* Card 3: Badges Achieved */}
        <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>BADGES UNLOCKED</span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-white mt-1.5 font-mono">
              {unlockedCount} / {preparednessState.badges.length}
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              {Math.round((unlockedCount / preparednessState.badges.length) * 100)}% Readiness Portfolio
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Next Badge:</span>
            <span className="text-amber-300 font-bold truncate max-w-[130px]">
              {preparednessState.badges.find((b) => !b.unlockedAt)?.name || 'All Complete!'}
            </span>
          </div>
        </div>

        {/* Card 4: Local Climate Warming Trend */}
        <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>LOCAL DECADAL WARMING</span>
              <TrendingUp className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-extrabold text-rose-300 mt-1.5 font-mono">
              +{climateImpact?.warmingTrendRate ?? 0.31}°C
              <span className="text-xs font-normal text-slate-400"> / decade</span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              vs 1991–2020 WMO Baseline
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Resilience Rating:</span>
            <span className="text-emerald-400 font-bold">
              {climateImpact?.resilienceScore ?? 82} / 100
            </span>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-2 pt-2 border-b border-slate-800 font-mono text-xs overflow-x-auto pb-3">
        <button
          onClick={() => setActiveTab('badges')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'badges'
              ? 'bg-emerald-500/20 border border-emerald-400/60 text-emerald-200 font-bold'
              : 'bg-slate-950/40 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Award className="w-4 h-4 text-amber-400" />
          <span>Proactive Weather Badges ({unlockedCount}/{preparednessState.badges.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('trends')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'trends'
              ? 'bg-emerald-500/20 border border-emerald-400/60 text-emerald-200 font-bold'
              : 'bg-slate-950/40 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <span>Local Climate Trends & Anomalies</span>
        </button>

        <button
          onClick={() => setActiveTab('checklist')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'checklist'
              ? 'bg-emerald-500/20 border border-emerald-400/60 text-emerald-200 font-bold'
              : 'bg-slate-950/40 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>Emergency Prep Checklist & Drills</span>
        </button>
      </div>

      {/* 4. TAB CONTENT 1: BADGES SHOWCASE */}
      {activeTab === 'badges' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Badge Filter Controls */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-500 uppercase tracking-wider text-[11px]">Filter:</span>
              <button
                onClick={() => setBadgeFilter('ALL')}
                className={`px-3 py-1 rounded-xl border transition-all ${
                  badgeFilter === 'ALL'
                    ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300 font-bold'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                All Badges ({preparednessState.badges.length})
              </button>
              <button
                onClick={() => setBadgeFilter('UNLOCKED')}
                className={`px-3 py-1 rounded-xl border transition-all ${
                  badgeFilter === 'UNLOCKED'
                    ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300 font-bold'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Unlocked ({unlockedCount})
              </button>
              <button
                onClick={() => setBadgeFilter('IN_PROGRESS')}
                className={`px-3 py-1 rounded-xl border transition-all ${
                  badgeFilter === 'IN_PROGRESS'
                    ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300 font-bold'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                In Progress ({preparednessState.badges.length - unlockedCount})
              </button>
            </div>

            <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Earn badges by checking forecasts daily & completing emergency prep actions</span>
            </div>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredBadges.map((badge) => {
              const isUnlocked = Boolean(badge.unlockedAt);
              const styling = getBadgeTierStyle(badge.tier, isUnlocked);

              return (
                <div
                  key={badge.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 relative overflow-hidden ${
                    styling.badgeBorder
                  }`}
                >
                  {isUnlocked && (
                    <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
                  )}

                  <div>
                    {/* Header: Tier chip & XP */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${styling.chipBg}`}>
                        {badge.tier}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-amber-400">
                        +{badge.xpReward} XP
                      </span>
                    </div>

                    {/* Icon & Title */}
                    <div className="flex items-start gap-3 mt-3">
                      <div className={`p-2.5 rounded-xl shrink-0 ${styling.iconBg}`}>
                        {getBadgeIcon(badge.iconName, 'w-5 h-5')}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white leading-tight">{badge.name}</h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {badge.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Progress or Unlocked Timestamp */}
                  <div className="pt-3 border-t border-slate-800/80 font-mono text-xs">
                    {isUnlocked ? (
                      <div className="flex items-center justify-between text-emerald-400 text-[11px]">
                        <span className="flex items-center gap-1 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>UNLOCKED</span>
                        </span>
                        <span className="text-slate-400">{badge.unlockedAt}</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="text-slate-400">Progress:</span>
                          <span className="font-bold text-slate-200">
                            {badge.currentCount} / {badge.targetCount} ({badge.progress}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all duration-300"
                            style={{ width: `${badge.progress}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-500 truncate pt-0.5">
                          Target: {badge.requirement}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT 2: LOCAL CLIMATE TRENDS & ANOMALIES */}
      {activeTab === 'trends' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* AI Climate Insight Banner */}
          {climateImpact && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 flex items-start gap-3.5 text-xs font-mono">
              <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                    Meteorological Climate Trend Assessment ({climateImpact.locationName})
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                    ERA5 Reanalysis Grounded
                  </span>
                </div>
                <p className="leading-relaxed text-slate-200">{climateImpact.aiClimateInsight}</p>
              </div>
            </div>
          )}

          {/* Climate Charts Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart 1: Multi-Year Temperature Progression & Anomaly (7 Cols) */}
            <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-rose-400" />
                    <span>Annual Mean Temperature & Positive Anomalies</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    2020–2025 progression vs 1991–2020 WMO Climatological Normal
                  </p>
                </div>
                <div className="text-right font-mono text-xs text-rose-400 font-bold">
                  +{climateImpact?.currentAnomaly ?? 1.5}°C Current Delta
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={climateImpact?.annualTrends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="tempAnomalyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="avgTempGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="°C" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        color: '#f8fafc',
                      }}
                    />
                    <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
                    <Area
                      type="monotone"
                      dataKey="avgTemp"
                      name="Annual Mean Temp"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      fill="url(#avgTempGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="tempAnomaly"
                      name="Anomaly (°C)"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      fill="url(#tempAnomalyGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Extreme Days Frequency (5 Cols) */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-400" />
                    <span>Extreme Weather Events per Year</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    Heat spikes & severe storm occurrences
                  </p>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={climateImpact?.annualTrends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        color: '#f8fafc',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                    <Bar dataKey="extremeHeatDays" name="Extreme Heat (>32°C)" fill="#f97316" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="stormEvents" name="Severe Storms / Gales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Quick Action Links to Historical Archive & Google Maps */}
          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-400">
              <History className="w-4 h-4 text-amber-400" />
              <span>Deep dive into daily ECMWF/ERA5 atmospheric records:</span>
            </div>
            <div className="flex items-center gap-2.5">
              {onOpenHistorical && (
                <button
                  onClick={onOpenHistorical}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 transition-colors"
                >
                  Open Historical Weather Archive →
                </button>
              )}
              {onOpenMaps && (
                <button
                  onClick={onOpenMaps}
                  className="px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 transition-colors"
                >
                  View Local Storm Shelters →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB CONTENT 3: EMERGENCY PREP CHECKLIST & SIMULATED DRILLS */}
      {activeTab === 'checklist' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Essential Emergency Go-Bag Checklist (7 Cols) */}
            <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Emergency Survival Go-Bag Checklist</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    Verify home & vehicle provisions for severe atmospheric emergencies
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {Object.values(preparednessState.checklist).filter(Boolean).length} / 6 Verified
                </span>
              </div>

              {/* Interactive checklist items */}
              <div className="space-y-2.5">
                {[
                  {
                    key: 'goBagReady' as const,
                    label: 'Waterproof Survival Go-Bag Packed',
                    desc: 'First aid supplies, emergency whistle, and weatherproof document pouch.',
                  },
                  {
                    key: 'emergencyContactsListed' as const,
                    label: 'Emergency Contacts & Offline Plans Documented',
                    desc: 'Physical laminated contact card and predetermined family rendezvous point.',
                  },
                  {
                    key: 'powerBankCharged' as const,
                    label: 'Heavy-Duty Power Bank Charged (100%)',
                    desc: 'Minimum 20,000mAh portable charger, crank radio, and LED flashlight.',
                  },
                  {
                    key: 'waterSuppliesStored' as const,
                    label: '72-Hour Clean Drinking Water Reserve',
                    desc: 'Minimum 1 gallon per person per day plus non-perishable rations.',
                  },
                  {
                    key: 'shelterRouteIdentified' as const,
                    label: 'High-Ground Storm Shelter Route Mapped',
                    desc: 'Verified designated interior rooms or Google Maps emergency shelters.',
                  },
                  {
                    key: 'pushAlertsActive' as const,
                    label: 'SmartWeather Push & Siren Alerts Enabled',
                    desc: 'Active audio sirens for hurricane, tornado, and blizzard warnings.',
                  },
                ].map((item) => {
                  const isChecked = preparednessState.checklist[item.key];
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleToggleChecklist(item.key)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                        isChecked
                          ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isChecked ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className={`text-xs font-bold ${isChecked ? 'text-white' : 'text-slate-300'}`}>
                          {item.label}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5 leading-relaxed">
                          {item.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Extreme Weather Readiness Drill Simulator (5 Cols) */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
                    <span>Extreme Weather Readiness Drill</span>
                  </h4>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                    Simulation Engine
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Conduct periodic disaster readiness drills to practice emergency response times, test backup communications, and earn the <strong>Readiness Drill Master</strong> badge.
                </p>

                {/* Drill Type Selector */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-[11px] font-mono uppercase text-slate-400">Select Drill Protocol:</label>
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                    {[
                      { id: 'HURRICANE', label: 'Hurricane' },
                      { id: 'BLIZZARD', label: 'Blizzard' },
                      { id: 'FLASH_FLOOD', label: 'Flash Flood' },
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setSelectedDrill(d.id)}
                        className={`py-2 px-2 rounded-xl border text-center transition-all ${
                          selectedDrill === d.id
                            ? 'bg-rose-500/20 border-rose-400 text-rose-200 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Drill Steps Box */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono space-y-1.5 text-slate-300">
                  <div className="text-emerald-400 font-bold">Standard Simulation Protocol:</div>
                  <div>1. Verify immediate indoor refuge away from glass.</div>
                  <div>2. Check battery level and toggle backup siren.</div>
                  <div>3. Confirm family rendezvous check-in code.</div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-slate-800">
                <button
                  onClick={handleRunDrill}
                  disabled={isDrillRunning}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs font-mono tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-950/50 disabled:opacity-50"
                >
                  {isDrillRunning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>SIMULATING EMERGENCY DRILL PROTOCOL...</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-4 h-4" />
                      <span>START {selectedDrill} READINESS DRILL (+180 XP)</span>
                    </>
                  )}
                </button>
                {drillSuccess && (
                  <div className="text-center text-xs font-mono text-emerald-400 mt-2 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Drill validated and logged to your climate profile!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
