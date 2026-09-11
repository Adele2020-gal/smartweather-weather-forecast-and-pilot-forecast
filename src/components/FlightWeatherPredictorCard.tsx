import React, { useState } from 'react';
import {
  Plane,
  AlertTriangle,
  ShieldCheck,
  Compass,
  Wind,
  Gauge,
  CloudRain,
  Eye,
  Thermometer,
  Layers,
  Clock,
  ArrowUpRight,
  Info,
  CheckCircle2,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
  Mountain,
  Navigation,
  FileText,
  Radio,
  ShieldAlert,
  Zap,
  Activity,
  TrendingUp,
  BarChart2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WeatherData, UserPreferences, ExtremeWeatherEvent, FlightWeatherAnalysis, PilotCaution } from '../types';
import { evaluateFlightWeather } from '../utils/aviationEngine';
import { PilotPreFlightChecklistModal } from './PilotPreFlightChecklistModal';
import { AltitudeWindsTurbulenceChart } from './AltitudeWindsTurbulenceChart';
import { CrosswindComponentCalculator } from './CrosswindComponentCalculator';

interface FlightWeatherPredictorCardProps {
  weather: WeatherData;
  userPrefs: UserPreferences;
  extremeState?: ExtremeWeatherEvent | null;
}

type AircraftType = 'light_ga' | 'turboprop' | 'jet' | 'drone';

export const FlightWeatherPredictorCard: React.FC<FlightWeatherPredictorCardProps> = ({
  weather,
  userPrefs,
  extremeState,
}) => {
  const [selectedAerodrome, setSelectedAerodrome] = useState<'FAOR' | 'FAGM' | 'FALA'>('FAOR');
  const [aircraftType, setAircraftType] = useState<AircraftType>('light_ga');
  const [activeTab, setActiveTab] = useState<'overview' | 'altitude' | 'runways' | 'hourly' | 'metar' | 'corridors'>('overview');
  const [copiedMetar, setCopiedMetar] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [selectedCautionForChecklist, setSelectedCautionForChecklist] = useState<PilotCaution | null>(null);
  const [simulateCriticalThreat, setSimulateCriticalThreat] = useState(false);

  // Compute flight weather intelligence
  const flightAnalysis: FlightWeatherAnalysis = evaluateFlightWeather(weather, extremeState);

  // Combine real evaluated pilot cautions with optional simulated critical flight-path threat for testing animations
  const displayCautions: PilotCaution[] = React.useMemo(() => {
    const list = [...flightAnalysis.pilotCautions];
    if (simulateCriticalThreat && !list.some((c) => c.severity === 'CRITICAL')) {
      list.unshift({
        severity: 'CRITICAL',
        title: 'MICROBURST & LOW-LEVEL WINDSHEAR (LLWS) FLIGHT-PATH THREAT',
        details: 'Active severe convective downdraft (> 35 kts) and rapid 180° wind shift detected intersecting the FAOR / East Rand terminal departure and approach corridor.',
        actionRequired: 'Mandatory go-around / missed approach on active flight path. All visual and instrument departures temporarily held.',
      });
    }
    return list;
  }, [flightAnalysis.pilotCautions, simulateCriticalThreat]);

  const criticalCaution = displayCautions.find((c) => c.severity === 'CRITICAL');
  const hasCriticalThreat = Boolean(criticalCaution);

  const handleOpenChecklist = (caution?: PilotCaution) => {
    setSelectedCautionForChecklist(caution || null);
    setIsChecklistOpen(true);
  };

  // Adjust safety threshold based on selected aircraft type
  const crosswindLimit =
    aircraftType === 'light_ga' ? 15 : aircraftType === 'turboprop' ? 22 : aircraftType === 'jet' ? 33 : 10;

  const handleCopyMetar = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(flightAnalysis.metarRaw);
      setCopiedMetar(true);
      setTimeout(() => setCopiedMetar(false), 2000);
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'VFR':
        return {
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-700',
          border: 'border-emerald-500/30',
          dot: 'bg-emerald-500',
          desc: 'Visual Flight Rules (Ceiling > 3,000 ft, Vis > 8 km)',
        };
      case 'MVFR':
        return {
          bg: 'bg-amber-500/10',
          text: 'text-amber-700',
          border: 'border-amber-500/30',
          dot: 'bg-amber-500',
          desc: 'Marginal VFR — Pilot Caution Advised',
        };
      case 'IFR':
        return {
          bg: 'bg-orange-500/10',
          text: 'text-orange-700',
          border: 'border-orange-500/30',
          dot: 'bg-orange-500',
          desc: 'Instrument Flight Rules Only',
        };
      case 'LIFR':
      default:
        return {
          bg: 'bg-rose-500/10',
          text: 'text-rose-700',
          border: 'border-rose-500/30',
          dot: 'bg-rose-500',
          desc: 'Low IFR — Flight Grounding / Hazardous Conditions',
        };
    }
  };

  const catStyle = getCategoryBadge(flightAnalysis.category);

  return (
    <div
      id="flight-weather-card"
      className="card-3d bg-white rounded-3xl p-6 sm:p-7 border border-sky-200/80 shadow-md relative overflow-hidden flex flex-col justify-between"
    >
      {/* Top Ambient Glow Gradient */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-sky-400/10 via-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      <div>
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-sky-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 border border-sky-400">
              <Plane className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Aviation Flight Weather & Pilot Intelligence
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-sky-100 text-sky-700 border border-sky-200">
                  FAA / SACAA RULES
                </span>
              </div>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Hyper-local flight rule assessment, safe departure windows, and crosswind calculations for{' '}
                <strong className="text-slate-800">Boksburg / Ekurhuleni Airspace</strong>
              </p>
            </div>
          </div>

          {/* Flight Category & Safety Status */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleOpenChecklist()}
              title="Click to open Pilot Pre-Flight Checklist"
              className={`px-3.5 py-1.5 rounded-2xl border flex items-center gap-2 transition-all hover:scale-105 cursor-pointer shadow-2xs ${catStyle.bg} ${catStyle.border}`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${catStyle.dot} animate-pulse`} />
              <div className="text-left">
                <span className={`text-xs font-mono font-black tracking-wider ${catStyle.text}`}>
                  {flightAnalysis.category}
                </span>
                <span className="text-[10px] text-slate-500 font-sans ml-1.5 hidden sm:inline">
                  {flightAnalysis.safetyRating === 'SAFE' ? 'Safe for Flight' : 'Pilot Caution'}
                </span>
              </div>
            </button>

            <div className="px-3 py-1.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-sky-600" />
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-slate-900">{flightAnalysis.safetyScore}</span>
                <span className="text-[10px] text-slate-400 font-mono">/100</span>
              </div>
            </div>

            <button
              onClick={() => {
                const el = document.getElementById('google-maps-agent-panel');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              title="Open Live SA NOTAM Radar on Google Maps Panel"
              className="px-3 py-1.5 rounded-2xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 flex items-center gap-1.5 transition-all text-xs font-mono font-bold cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
              <span className="hidden sm:inline">NOTAM Radar</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </button>
          </div>
        </div>

        {/* Aerodrome & Aircraft Selector Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
          {/* Aerodrome Hub Selector */}
          <div className="flex items-center gap-2 p-1.5 bg-sky-50/60 rounded-2xl border border-sky-100">
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase px-2">AERODROME:</span>
            <button
              onClick={() => setSelectedAerodrome('FAOR')}
              className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-mono font-bold transition-all text-center ${
                selectedAerodrome === 'FAOR'
                  ? 'bg-white text-sky-700 shadow-xs border border-sky-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              FAOR (OR Tambo, Boksburg)
            </button>
            <button
              onClick={() => setSelectedAerodrome('FAGM')}
              className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-mono font-bold transition-all text-center ${
                selectedAerodrome === 'FAGM'
                  ? 'bg-white text-sky-700 shadow-xs border border-sky-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              FAGM (Rand Airport)
            </button>
          </div>

          {/* Aircraft Class Selector */}
          <div className="flex items-center gap-2 p-1.5 bg-sky-50/60 rounded-2xl border border-sky-100">
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase px-2">AIRCRAFT:</span>
            {(
              [
                { id: 'light_ga', label: 'Light GA (C172)' },
                { id: 'turboprop', label: 'Turboprop' },
                { id: 'jet', label: 'Airliner (B737)' },
                { id: 'drone', label: 'UAV / Drone' },
              ] as const
            ).map((ac) => (
              <button
                key={ac.id}
                onClick={() => setAircraftType(ac.id)}
                className={`flex-1 py-1.5 px-1.5 rounded-xl text-[11px] font-sans font-semibold transition-all text-center ${
                  aircraftType === ac.id
                    ? 'bg-white text-blue-700 shadow-xs border border-sky-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {ac.label}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b border-sky-100 mt-4 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'overview', label: 'Flight Overview & Cautions', icon: AlertTriangle },
            { id: 'altitude', label: 'Altitude Winds & Turbulence', icon: Activity },
            { id: 'runways', label: 'Runway 03/21 Crosswinds', icon: Compass },
            { id: 'hourly', label: '12-Hr Safe Windows', icon: Clock },
            { id: 'metar', label: 'METAR & TAF Briefing', icon: Gauge },
            { id: 'corridors', label: 'SA Flight Corridors', icon: Navigation },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-sky-500 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-sky-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: Overview & Active Pilot Cautions */}
        {activeTab === 'overview' && (
          <div className="mt-4 space-y-4">
            {/* Safe Flight Window Recommendation Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-sky-200/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white shadow-xs border border-sky-200 flex items-center justify-center text-sky-600 shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-800">
                    PREDICTED SAFE FLIGHT DEPARTURE WINDOW
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {flightAnalysis.optimalFlightWindow}
                  </div>
                </div>
              </div>
              <span className="hidden sm:inline-block px-3 py-1 rounded-xl text-xs font-mono font-bold bg-white text-sky-800 border border-sky-200 shadow-xs">
                MAX CROSSWIND TOLERANCE: {crosswindLimit} KTS
              </span>
            </div>

            {/* Pilot Cautions Feed */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <AlertTriangle className={`w-3.5 h-3.5 ${hasCriticalThreat ? 'text-rose-600 animate-pulse' : 'text-amber-500'}`} />
                    <span>ACTIVE PILOT CAUTIONS & ADVISORIES ({displayCautions.length})</span>
                  </h4>
                  {hasCriticalThreat && (
                    <span className="relative flex h-2 w-2">
                      <motion.span
                        animate={{ scale: [1, 2, 1], opacity: [0.9, 0, 0.9] }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                        className="absolute inline-flex h-full w-full rounded-full bg-rose-500"
                      />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600" />
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSimulateCriticalThreat((prev) => !prev)}
                    title="Toggle simulated critical flight-path threat to observe slide-in transition and breathing animation"
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                      simulateCriticalThreat
                        ? 'bg-rose-50 text-rose-800 border-rose-300 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    <Zap className={`w-3 h-3 ${simulateCriticalThreat ? 'text-rose-600 fill-rose-600' : 'text-slate-400'}`} />
                    <span>{simulateCriticalThreat ? 'Threat Alert Sim: ON' : 'Test Threat Alert'}</span>
                  </button>
                  <button
                    onClick={() => handleOpenChecklist(criticalCaution || undefined)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-sky-600 hover:bg-sky-700 text-white transition-all shadow-xs cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Open Pre-Flight Checklist</span>
                  </button>
                  <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">SACAA / ICAO SPEC</span>
                </div>
              </div>

              {/* Critical Flight-Path Threat Prompt Banner (Breathing & Slide-In) */}
              <AnimatePresence>
                {hasCriticalThreat && criticalCaution && (
                  <motion.div
                    initial={{ opacity: 0, y: -14, x: -16, scale: 0.98 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      x: 0,
                      scale: 1,
                      boxShadow: [
                        '0 0 0 1px rgba(225, 29, 72, 0.35), 0 2px 8px rgba(225, 29, 72, 0.08)',
                        '0 0 0 2.5px rgba(225, 29, 72, 0.75), 0 6px 18px rgba(225, 29, 72, 0.22)',
                        '0 0 0 1px rgba(225, 29, 72, 0.35), 0 2px 8px rgba(225, 29, 72, 0.08)',
                      ],
                    }}
                    exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                    transition={{
                      x: { duration: 0.42, ease: [0.16, 1, 0.3, 1] },
                      y: { duration: 0.42, ease: [0.16, 1, 0.3, 1] },
                      opacity: { duration: 0.3 },
                      boxShadow: { repeat: Infinity, duration: 2.8, ease: 'easeInOut' },
                    }}
                    className="p-3.5 mb-3 rounded-2xl bg-gradient-to-r from-rose-500/15 via-rose-500/10 to-amber-500/10 border border-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="relative flex h-3.5 w-3.5 shrink-0 mt-0.5 sm:mt-0">
                        <motion.span
                          animate={{ scale: [1, 2.2, 1], opacity: [0.85, 0, 0.85] }}
                          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                          className="absolute inline-flex h-full w-full rounded-full bg-rose-500"
                        />
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-300">
                            CRITICAL FLIGHT-PATH THREAT DETECTED
                          </span>
                          <span className="text-[10px] font-mono text-rose-700 hidden md:inline">
                            SACAA ANNEX 2 HAZARD
                          </span>
                        </div>
                        <p className="text-xs text-rose-950 font-medium mt-0.5">
                          Severe convective or windshear hazards along terminal departure path require immediate checklist review.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenChecklist(criticalCaution)}
                      className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono font-bold shadow-xs whitespace-nowrap transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Review Threat Checklist →</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Pilot Caution Cards Feed with Slide-in Transition & Breathing Animations */}
              <div className="space-y-2.5">
                <AnimatePresence mode="popLayout">
                  {displayCautions.map((caution, idx) => {
                    const isCrit = caution.severity === 'CRITICAL';
                    const isWarn = caution.severity === 'WARNING';
                    const isAdv = caution.severity === 'ADVISORY';

                    const badgeColor = isCrit
                      ? 'bg-rose-50 hover:bg-rose-100/70 border-rose-300 text-rose-900'
                      : isWarn
                      ? 'bg-amber-50 hover:bg-amber-100/70 border-amber-300 text-amber-900'
                      : isAdv
                      ? 'bg-sky-50 hover:bg-sky-100/70 border-sky-200 text-sky-900'
                      : 'bg-emerald-50 hover:bg-emerald-100/70 border-emerald-200 text-emerald-900';

                    const tagColor = isCrit
                      ? 'bg-rose-600 text-white'
                      : isWarn
                      ? 'bg-amber-600 text-white'
                      : isAdv
                      ? 'bg-sky-600 text-white'
                      : 'bg-emerald-600 text-white';

                    return (
                      <motion.div
                        key={caution.title + idx}
                        initial={{ opacity: 0, x: -28, scale: 0.98 }}
                        animate={
                          isCrit
                            ? {
                                opacity: 1,
                                x: 0,
                                scale: [1, 1.008, 1],
                                boxShadow: [
                                  '0 0 0 1px rgba(225, 29, 72, 0.35), 0 2px 8px -2px rgba(225, 29, 72, 0.12)',
                                  '0 0 0 2.5px rgba(225, 29, 72, 0.72), 0 6px 20px -2px rgba(225, 29, 72, 0.28)',
                                  '0 0 0 1px rgba(225, 29, 72, 0.35), 0 2px 8px -2px rgba(225, 29, 72, 0.12)',
                                ],
                              }
                            : isWarn
                            ? {
                                opacity: 1,
                                x: 0,
                                scale: [1, 1.004, 1],
                                boxShadow: [
                                  '0 0 0 1px rgba(245, 158, 11, 0.25), 0 2px 6px -2px rgba(245, 158, 11, 0.08)',
                                  '0 0 0 2px rgba(245, 158, 11, 0.6), 0 4px 14px -2px rgba(245, 158, 11, 0.18)',
                                  '0 0 0 1px rgba(245, 158, 11, 0.25), 0 2px 6px -2px rgba(245, 158, 11, 0.08)',
                                ],
                              }
                            : {
                                opacity: 1,
                                x: 0,
                                scale: 1,
                              }
                        }
                        exit={{ opacity: 0, x: 28, scale: 0.96, transition: { duration: 0.25 } }}
                        transition={
                          isCrit
                            ? {
                                x: { duration: 0.42, delay: idx * 0.07, ease: [0.16, 1, 0.3, 1] },
                                opacity: { duration: 0.35, delay: idx * 0.07 },
                                scale: { repeat: Infinity, duration: 2.8, ease: 'easeInOut', delay: idx * 0.1 },
                                boxShadow: { repeat: Infinity, duration: 2.8, ease: 'easeInOut', delay: idx * 0.1 },
                              }
                            : isWarn
                            ? {
                                x: { duration: 0.42, delay: idx * 0.07, ease: [0.16, 1, 0.3, 1] },
                                opacity: { duration: 0.35, delay: idx * 0.07 },
                                scale: { repeat: Infinity, duration: 3.2, ease: 'easeInOut', delay: idx * 0.1 },
                                boxShadow: { repeat: Infinity, duration: 3.2, ease: 'easeInOut', delay: idx * 0.1 },
                              }
                            : {
                                duration: 0.4,
                                delay: idx * 0.07,
                                ease: [0.16, 1, 0.3, 1],
                              }
                        }
                        onClick={() => handleOpenChecklist(caution)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer hover:shadow-lg group active:scale-[0.99] relative overflow-hidden ${badgeColor}`}
                        title="Click to open Pilot Pre-Flight Checklist with this warning highlighted"
                      >
                        {/* Ambient subtle breathing backlight glow for critical threats */}
                        {isCrit && (
                          <motion.div
                            animate={{ opacity: [0.12, 0.28, 0.12] }}
                            transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
                            className="absolute -right-8 -top-8 w-32 h-32 bg-rose-500/20 rounded-full blur-xl pointer-events-none"
                          />
                        )}

                        <div className="flex items-start justify-between gap-2 relative z-10">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Breathing Beacon for Critical and Warning hazards */}
                            {isCrit && (
                              <span className="relative flex h-2.5 w-2.5 shrink-0" title="Active critical flight-path threat">
                                <motion.span
                                  animate={{ scale: [1, 2.2, 1], opacity: [0.85, 0.1, 0.85] }}
                                  transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                                  className="absolute inline-flex h-full w-full rounded-full bg-rose-500"
                                />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600" />
                              </span>
                            )}
                            {isWarn && (
                              <span className="relative flex h-2 w-2 shrink-0">
                                <motion.span
                                  animate={{ scale: [1, 1.8, 1], opacity: [0.7, 0.15, 0.7] }}
                                  transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
                                  className="absolute inline-flex h-full w-full rounded-full bg-amber-500"
                                />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600" />
                              </span>
                            )}

                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-wider ${tagColor}`}>
                              {caution.severity}
                            </span>

                            {isCrit && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
                                <ShieldAlert className="w-2.5 h-2.5 text-rose-600" />
                                FLIGHT-PATH THREAT
                              </span>
                            )}

                            <span className="text-xs font-bold font-mono group-hover:text-sky-900 transition-colors">
                              {caution.title}
                            </span>
                          </div>

                          <span className="text-[10px] font-mono text-sky-700 opacity-80 group-hover:opacity-100 flex items-center gap-0.5 shrink-0">
                            Pre-Flight Checklist ➔
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 font-sans mt-1 leading-relaxed relative z-10">
                          {caution.details}
                        </p>

                        <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2 text-[11px] font-mono font-medium text-slate-800 relative z-10">
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <span className={`font-bold shrink-0 ${isCrit ? 'text-rose-700' : isWarn ? 'text-amber-700' : 'text-sky-700'}`}>
                              PILOT ACTION:
                            </span>
                            <span className="truncate">{caution.actionRequired}</span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border shrink-0 transition-colors ${
                              isCrit
                                ? 'text-rose-700 bg-white/90 border-rose-300 group-hover:bg-rose-600 group-hover:text-white'
                                : 'text-sky-700 bg-white/80 border-sky-200/80 group-hover:bg-sky-600 group-hover:text-white'
                            }`}
                          >
                            Inspect Checklist ➔
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

            {/* Aeronautical Key Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              {/* Density Altitude */}
              <div className="p-3 rounded-2xl bg-sky-50/40 border border-sky-100">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[10px] font-mono font-bold uppercase">DENSITY ALTITUDE</span>
                  <Mountain className="w-3.5 h-3.5 text-sky-600" />
                </div>
                <div className="text-base font-bold font-mono text-slate-900">
                  {flightAnalysis.parameters.densityAltitudeFeet.toLocaleString()} ft
                </div>
                <div className="text-[10px] text-amber-700 font-mono mt-0.5">
                  +{flightAnalysis.parameters.densityAltAnomalyFeet.toLocaleString()} ft vs Field
                </div>
              </div>

              {/* Surface Wind & Gusts */}
              <div className="p-3 rounded-2xl bg-sky-50/40 border border-sky-100">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[10px] font-mono font-bold uppercase">SURFACE WIND</span>
                  <Wind className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="text-base font-bold font-mono text-slate-900">
                  {String(flightAnalysis.parameters.windDirectionDeg).padStart(3, '0')}° @ {flightAnalysis.parameters.windSpeedKts} kts
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Gusting to {flightAnalysis.parameters.windGustKts} kts
                </div>
              </div>

              {/* Cloud Base / Ceiling */}
              <div className="p-3 rounded-2xl bg-sky-50/40 border border-sky-100">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[10px] font-mono font-bold uppercase">CLOUD CEILING</span>
                  <Layers className="w-3.5 h-3.5 text-sky-600" />
                </div>
                <div className="text-base font-bold font-mono text-slate-900">
                  {flightAnalysis.parameters.cloudBaseFeet.toLocaleString()} ft
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {flightAnalysis.parameters.cloudCoverageDesc.split(' at ')[0] || 'Clear'}
                </div>
              </div>

              {/* QNH Altimeter Setting */}
              <div className="p-3 rounded-2xl bg-sky-50/40 border border-sky-100">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[10px] font-mono font-bold uppercase">QNH BARO</span>
                  <Gauge className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <div className="text-base font-bold font-mono text-slate-900">
                  {flightAnalysis.parameters.qnhHpa} hPa
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {flightAnalysis.parameters.qnhInHg} inHg
                </div>
              </div>
            </div>

            {/* Quick Altitude Sounding Callout Banner in Overview */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-700/80 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0">
                  <Activity className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400">
                      ALTITUDE WINDS & TURBULENCE PROFILE
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-sky-900/60 text-sky-200 border border-sky-700/60">
                      SFC - FL390
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-sans mt-0.5">
                    Modeled vertical wind shear gradients, thermal boundary turbulence, and upper subtropical jet stream velocity.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('altitude')}
                className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-mono font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <span>Inspect Recharts Graph</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Runway 03/21 Crosswind Calculator Callout Banner in Overview */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border border-blue-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-sky-600 text-white shadow-xs flex items-center justify-center shrink-0 border border-blue-400">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-950">
                      3D RUNWAY 03/21 VISUALIZER • FAOR O.R. TAMBO
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-300">
                      3D CROSSWIND VECTOR
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-sans mt-0.5">
                    Visual representation of FAOR Runway 03/21 with 3D-styled indicator for crosswind direction, crab angle drift, and gust intensity warning system.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('runways')}
                className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <span>View 3D Runway & Crosswinds</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Altitude-Specific Wind Speeds & Turbulence Potential (Recharts Line Graph) */}
        {activeTab === 'altitude' && (
          <div className="mt-4 space-y-4">
            <AltitudeWindsTurbulenceChart
              profile={flightAnalysis.altitudeProfile || []}
              freezingLevelFt={flightAnalysis.parameters.freezingLevelFeet}
              densityAltitudeFt={flightAnalysis.parameters.densityAltitudeFeet}
              aerodromeIcao={flightAnalysis.aerodromeIcao}
              aircraftType={aircraftType}
            />
          </div>
        )}

        {/* TAB 3: Runway Crosswinds & Vector Analysis */}
        {activeTab === 'runways' && (
          <div className="mt-4 space-y-4">
            {/* Real-time Crosswind Component Calculator for Runway 03/21 with Gust Warning System */}
            <CrosswindComponentCalculator
              weather={weather}
              defaultRunway="03"
            />

            <div className="flex items-center justify-between pt-2">
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                  {selectedAerodrome === 'FAOR' ? 'O. R. Tambo Intl (FAOR, Boksburg)' : 'Rand Airport (FAGM, Germiston)'} Runway Vector Status
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Crosswind component calculated against surface wind {String(flightAnalysis.parameters.windDirectionDeg).padStart(3, '0')}° at {flightAnalysis.parameters.windSpeedKts} kts
                </p>
              </div>
              <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-sky-100 text-sky-800 border border-sky-200">
                Aircraft Limit: {crosswindLimit} kts
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {flightAnalysis.runways.map((runway, idx) => {
                const exceedsLimit = runway.crosswindKts > crosswindLimit;
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      exceedsLimit
                        ? 'bg-rose-50/60 border-rose-300'
                        : runway.isPreferred
                        ? 'bg-emerald-50/50 border-emerald-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black font-mono px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-xs text-slate-900">
                          RWY {runway.ident}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          Heading: {String(runway.headingDeg).padStart(3, '0')}°
                        </span>
                      </div>
                      {runway.isPreferred && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-600 text-white">
                          PREFERRED
                        </span>
                      )}
                      {exceedsLimit && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-600 text-white">
                          LIMIT EXCEEDED
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200/80">
                      <div>
                        <div className="text-[10px] font-mono text-slate-500 uppercase">
                          {runway.headwindKts >= 0 ? 'HEADWIND' : 'TAILWIND'}
                        </div>
                        <div className={`text-base font-bold font-mono ${runway.headwindKts >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {Math.abs(runway.headwindKts)} kts
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-slate-500 uppercase">
                          CROSSWIND ({runway.crosswindDirection})
                        </div>
                        <div className={`text-base font-bold font-mono ${exceedsLimit ? 'text-rose-700' : 'text-slate-800'}`}>
                          {runway.crosswindKts} kts
                        </div>
                      </div>
                    </div>

                    {runway.caution && (
                      <p className="text-[11px] text-amber-800 font-mono mt-2 pt-2 border-t border-slate-200/60 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>{runway.caution}</span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: 12-Hour Safe Flight Prediction Windows */}
        {activeTab === 'hourly' && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                  12-Hour Flight Condition Forecast
                </h4>
                <p className="text-xs text-slate-500">
                  Predicted flight category, density altitude, and pilot safety window
                </p>
              </div>
            </div>

            <div className="overflow-x-auto scrollbar-thin">
              <div className="flex gap-2.5 min-w-[700px] pb-2">
                {flightAnalysis.hourlyFlightWindows.map((hourSlot, idx) => {
                  const isSafe = hourSlot.safetyRating === 'SAFE';
                  const isCaution = hourSlot.safetyRating === 'CAUTION';
                  const isGrounded = hourSlot.safetyRating === 'GROUNDED' || hourSlot.safetyRating === 'HAZARDOUS';

                  const badgeBorder = isSafe
                    ? 'border-emerald-300 bg-emerald-50/40'
                    : isCaution
                    ? 'border-amber-300 bg-amber-50/40'
                    : 'border-rose-300 bg-rose-50/40';

                  return (
                    <div
                      key={idx}
                      className={`flex-1 p-3 rounded-2xl border text-center transition-all ${badgeBorder}`}
                    >
                      <div className="text-xs font-mono font-bold text-slate-800">{hourSlot.time}</div>
                      <span
                        className={`inline-block my-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-black ${
                          isSafe
                            ? 'bg-emerald-600 text-white'
                            : isCaution
                            ? 'bg-amber-600 text-white'
                            : 'bg-rose-600 text-white'
                        }`}
                      >
                        {hourSlot.category}
                      </span>
                      <div className="text-[11px] font-mono font-bold text-slate-900 mt-1">
                        {hourSlot.windKts} kts
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        DA: {Math.round(hourSlot.densityAltFeet / 100) * 100} ft
                      </div>
                      <div className="text-[9px] text-slate-600 font-sans mt-1.5 line-clamp-2 leading-tight">
                        {hourSlot.recommendation}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: METAR & TAF Briefing */}
        {activeTab === 'metar' && (
          <div className="mt-4 space-y-3.5">
            {/* Raw METAR */}
            <div className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs border border-slate-800 shadow-inner">
              <div className="flex items-center justify-between mb-2 text-slate-400 text-[10px] uppercase">
                <span>OFFICIAL ICAO METAR STRING</span>
                <button
                  onClick={handleCopyMetar}
                  className="flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors"
                >
                  {copiedMetar ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedMetar ? 'COPIED' : 'COPY'}</span>
                </button>
              </div>
              <div className="text-emerald-300 font-bold tracking-wide break-all select-all">
                {flightAnalysis.metarRaw}
              </div>
            </div>

            {/* Raw TAF */}
            <div className="p-4 rounded-2xl bg-slate-950 text-cyan-300 font-mono text-xs border border-slate-800 shadow-inner">
              <div className="text-slate-400 text-[10px] uppercase mb-2">
                TERMINAL AERODROME FORECAST (TAF)
              </div>
              <div className="font-bold tracking-wide break-all select-all">
                {flightAnalysis.tafRaw}
              </div>
            </div>

            {/* Decoded Key */}
            <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100 text-xs text-slate-700 font-sans space-y-1.5">
              <div className="font-bold text-sky-900 font-mono text-[11px] uppercase">
                DECODED METEOROLOGICAL SUMMARY:
              </div>
              <p>• Aerodrome: <strong>{flightAnalysis.aerodromeName} ({flightAnalysis.aerodromeIcao})</strong></p>
              <p>• Wind: <strong>{flightAnalysis.parameters.windDirectionDeg}° at {flightAnalysis.parameters.windSpeedKts} kts (Gusts {flightAnalysis.parameters.windGustKts} kts)</strong></p>
              <p>• Surface Visibility: <strong>{flightAnalysis.parameters.visibilityKm} km ({flightAnalysis.parameters.visibilityStatuteMiles} statute miles)</strong></p>
              <p>• Cloud Coverage: <strong>{flightAnalysis.parameters.cloudCoverageDesc}</strong></p>
              <p>• Barometer Setting: <strong>QNH {flightAnalysis.parameters.qnhHpa} hPa ({flightAnalysis.parameters.qnhInHg} inHg)</strong></p>
            </div>
          </div>
        )}

        {/* TAB 5: Domestic South African Flight Corridors */}
        {activeTab === 'corridors' && (
          <div className="mt-4 space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
              Inter-City Flight Corridors from Johannesburg / Boksburg (FAOR)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {flightAnalysis.corridors.map((corridor, idx) => {
                const isCautionThreat = corridor.status !== 'SAFE';

                return (
                  <motion.div
                    key={corridor.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={
                      isCautionThreat
                        ? {
                            opacity: 1,
                            x: 0,
                            scale: [1, 1.004, 1],
                            boxShadow: [
                              '0 0 0 1px rgba(245, 158, 11, 0.25), 0 2px 6px -2px rgba(245, 158, 11, 0.08)',
                              '0 0 0 2px rgba(245, 158, 11, 0.6), 0 4px 14px -2px rgba(245, 158, 11, 0.18)',
                              '0 0 0 1px rgba(245, 158, 11, 0.25), 0 2px 6px -2px rgba(245, 158, 11, 0.08)',
                            ],
                          }
                        : { opacity: 1, x: 0 }
                    }
                    transition={
                      isCautionThreat
                        ? {
                            x: { duration: 0.35, delay: idx * 0.06 },
                            opacity: { duration: 0.35, delay: idx * 0.06 },
                            scale: { repeat: Infinity, duration: 3.2, ease: 'easeInOut' },
                            boxShadow: { repeat: Infinity, duration: 3.2, ease: 'easeInOut' },
                          }
                        : { duration: 0.35, delay: idx * 0.06 }
                    }
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isCautionThreat
                        ? 'bg-amber-50/40 border-amber-300 hover:border-amber-400'
                        : 'bg-slate-50 border-slate-200 hover:border-sky-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {isCautionThreat && (
                          <span className="relative flex h-2 w-2">
                            <motion.span
                              animate={{ scale: [1, 1.8, 1], opacity: [0.7, 0.2, 0.7] }}
                              transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
                              className="absolute inline-flex h-full w-full rounded-full bg-amber-500"
                            />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600" />
                          </span>
                        )}
                        <span className="text-xs font-bold text-slate-900 font-mono">
                          {corridor.routeName}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                          corridor.status === 'SAFE'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-600 text-white'
                        }`}
                      >
                        {corridor.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 mt-1.5">
                      <span>Dist: {corridor.distanceNm} NM</span>
                      <span>•</span>
                      <span>Turbulence: {corridor.enRouteTurbulence}</span>
                      <span>•</span>
                      <span>Dest: {corridor.destinationCategory}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-sans mt-2 pt-2 border-t border-slate-200">
                      <strong className="text-slate-800">En-Route Hazard:</strong> {corridor.keyPilotHazard}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Status */}
      <div className="mt-5 pt-4 border-t border-sky-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-sans">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Real-time Highveld Convective Radar & SACAA Metar Feed Active</span>
        </div>
        <div className="font-mono text-[11px] text-sky-700 font-semibold">
          ELEVATION: {flightAnalysis.elevationFeet} FT AMSL
        </div>
      </div>

      {/* Pilot Pre-Flight Checklist Modal */}
      <PilotPreFlightChecklistModal
        isOpen={isChecklistOpen}
        onClose={() => setIsChecklistOpen(false)}
        weather={weather}
        flightAnalysis={flightAnalysis}
        selectedCaution={selectedCautionForChecklist}
        aircraftType={aircraftType}
      />
    </div>
  );
};
