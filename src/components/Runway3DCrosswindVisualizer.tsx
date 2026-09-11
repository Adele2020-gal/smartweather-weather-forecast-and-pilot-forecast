import React, { useState, useMemo } from 'react';
import {
  Compass,
  Wind,
  Plane,
  Eye,
  Layers,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  CloudRain,
  CloudFog,
  CloudLightning,
  BellRing,
  RotateCw,
  Maximize2,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RunwayId, RunwaySubId, CrosswindEvaluation } from './CrosswindComponentCalculator';
import { WeatherData } from '../types';

export interface RunwayAlertInfo {
  type: 'LOW_VISIBILITY' | 'HEAVY_PRECIPITATION' | 'THUNDERSTORM_GUST' | 'NORMAL';
  level: 'CRITICAL' | 'WARNING' | 'ADVISORY' | 'NORMAL';
  title: string;
  badge: string;
  detail: string;
  rvrEstimatedMeters?: number;
  precipRateMm?: number;
  visibilityKm?: number;
}

interface Runway3DCrosswindVisualizerProps {
  evaluation: CrosswindEvaluation;
  selectedRunway: RunwayId;
  selectedSubRunway: RunwaySubId;
  weather?: WeatherData;
  onRunwayChange?: (runway: RunwayId) => void;
  className?: string;
}

export type ViewMode3D = 'approach' | 'isometric' | 'topdown';

export const Runway3DCrosswindVisualizer: React.FC<Runway3DCrosswindVisualizerProps> = ({
  evaluation,
  selectedRunway,
  selectedSubRunway,
  weather,
  onRunwayChange,
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<ViewMode3D>('approach');
  const [showParticles, setShowParticles] = useState(true);
  const [showCrabAircraft, setShowCrabAircraft] = useState(true);
  const [showAlertPopover, setShowAlertPopover] = useState(false);

  const {
    runwayHeadingDeg,
    windDirDeg,
    windSpeedKts,
    gustSpeedKts,
    crosswindKts,
    gustCrosswindKts,
    crosswindDirection,
    headwindKts,
    isHeadwind,
    warningTier,
    relativeAngleDeg,
  } = evaluation;

  // Derive dynamic Low-Visibility & Heavy Precipitation Runway Alerts directly for FAOR
  const runwayAlert = useMemo<RunwayAlertInfo | null>(() => {
    const current = weather?.current;
    if (!current) return null;

    const visMeters = current.visibility ?? 10000;
    const precipMm = current.precipitation ?? 0;
    const weatherCode = current.weatherCode ?? 0;
    const weatherDesc = (current.weatherDescription || '').toLowerCase();

    // 1. Critical Low-Visibility Operations (LVP / CAT II/III Alert)
    if (visMeters < 800) {
      return {
        type: 'LOW_VISIBILITY',
        level: 'CRITICAL',
        title: 'LVP IN FORCE • CAT II/III OPS',
        badge: 'RVR < 800m',
        detail: `Runway visual range critically degraded (${visMeters}m). Low Visibility Procedures active at FAOR. Autoland or CAT II/III ILS required on RWY 03R/21L.`,
        rvrEstimatedMeters: visMeters,
        visibilityKm: Math.round((visMeters / 1000) * 10) / 10,
      };
    }

    // 2. Heavy Thunderstorm / Severe Precipitation
    if (
      weatherCode >= 95 ||
      weatherDesc.includes('thunderstorm') ||
      precipMm >= 10 ||
      (weatherCode >= 65 && weatherCode <= 67)
    ) {
      return {
        type: 'HEAVY_PRECIPITATION',
        level: 'CRITICAL',
        title: 'SEVERE CONVECTIVE STORM / TSRA',
        badge: `${precipMm > 0 ? `${precipMm} mm/h` : 'TS ACTIVE'}`,
        detail: `Active thunderstorm over FAOR field. Standing water on runway, severe hydroplaning hazard, and convective microburst windshear risk. Braking action degraded (POOR).`,
        precipRateMm: precipMm,
        visibilityKm: Math.round((visMeters / 1000) * 10) / 10,
      };
    }

    // 3. Low Visibility Warning / Mist / Fog (800m - 3000m)
    if (visMeters < 3000 || weatherCode === 45 || weatherCode === 48 || weatherDesc.includes('fog')) {
      return {
        type: 'LOW_VISIBILITY',
        level: 'WARNING',
        title: 'LOW VISIBILITY WARNING • IFR ONLY',
        badge: `VIS ${(visMeters / 1000).toFixed(1)}km`,
        detail: `Visibility reduced to ${(visMeters / 1000).toFixed(1)}km in fog/mist/haze. VFR departures suspended. ILS precision approach mandatory for RWY ${selectedRunway}.`,
        rvrEstimatedMeters: visMeters,
        visibilityKm: Math.round((visMeters / 1000) * 10) / 10,
      };
    }

    // 4. Heavy Precipitation Warning (Rain / Downpour > 4mm/h)
    if (precipMm >= 4.0 || weatherDesc.includes('heavy rain') || (weatherCode >= 63 && weatherCode <= 65)) {
      return {
        type: 'HEAVY_PRECIPITATION',
        level: 'WARNING',
        title: 'HEAVY PRECIPITATION WARNING',
        badge: `${precipMm} mm/h RAIN`,
        detail: `Heavy rain rate (${precipMm} mm/h) causing wet runway surface conditions. Increased stopping distance (+40%) and hydroplaning risk. Crosswind limit reduced to 25 kts.`,
        precipRateMm: precipMm,
        visibilityKm: Math.round((visMeters / 1000) * 10) / 10,
      };
    }

    // 5. Moderate Visibility Advisory (3000m - 5000m)
    if (visMeters < 5000) {
      return {
        type: 'LOW_VISIBILITY',
        level: 'ADVISORY',
        title: 'MARGINAL VISIBILITY ADVISORY',
        badge: `VIS ${(visMeters / 1000).toFixed(1)}km`,
        detail: `Marginal visibility (${(visMeters / 1000).toFixed(1)}km) over FAOR Highveld basin. Caution for visual acquisition of runway environment and threshold lighting.`,
        rvrEstimatedMeters: visMeters,
        visibilityKm: Math.round((visMeters / 1000) * 10) / 10,
      };
    }

    // 6. Moderate Precipitation Advisory (1.5mm/h - 4mm/h)
    if (precipMm >= 1.5 || weatherDesc.includes('rain') || weatherDesc.includes('shower')) {
      return {
        type: 'HEAVY_PRECIPITATION',
        level: 'ADVISORY',
        title: 'WET RUNWAY ADVISORY',
        badge: `${precipMm} mm/h WET`,
        detail: `Moderate precipitation (${precipMm} mm/h). Runway surface classified as WET. Exercise caution on touchdown deceleration and reverse thrust application.`,
        precipRateMm: precipMm,
        visibilityKm: Math.round((visMeters / 1000) * 10) / 10,
      };
    }

    return null;
  }, [weather, selectedRunway]);

  // Calculate aircraft crab angle on final approach (assuming typical 70-130 kts approach speed)
  // Crab angle ≈ arcsin(Crosswind / Airspeed) in degrees
  const approachAirspeedKts = 90;
  const crabAngleDeg = useMemo(() => {
    const rawSin = Math.min(0.9, crosswindKts / approachAirspeedKts);
    const angle = (Math.asin(rawSin) * 180) / Math.PI;
    // Crab into the wind (positive = right rudder/left crab or vice versa)
    return crosswindDirection === 'RIGHT' ? angle : -angle;
  }, [crosswindKts, crosswindDirection]);

  // Color schemes based on warning tier
  const tierColors = useMemo(() => {
    switch (warningTier) {
      case 'CRITICAL':
        return {
          primary: '#e11d48', // rose-600
          glow: 'rgba(225, 29, 72, 0.45)',
          shadow: 'rgba(225, 29, 72, 0.3)',
          badge: 'bg-rose-500 text-white',
          border: 'border-rose-400',
          windColor: '#f43f5e',
        };
      case 'HIGH_RISK':
        return {
          primary: '#ea580c', // orange-600
          glow: 'rgba(234, 88, 12, 0.4)',
          shadow: 'rgba(234, 88, 12, 0.25)',
          badge: 'bg-orange-500 text-white',
          border: 'border-orange-400',
          windColor: '#fb923c',
        };
      case 'CAUTION':
        return {
          primary: '#d97706', // amber-600
          glow: 'rgba(217, 119, 6, 0.35)',
          shadow: 'rgba(217, 119, 6, 0.2)',
          badge: 'bg-amber-500 text-white',
          border: 'border-amber-400',
          windColor: '#f59e0b',
        };
      default:
        return {
          primary: '#059669', // emerald-600
          glow: 'rgba(5, 150, 105, 0.3)',
          shadow: 'rgba(5, 150, 105, 0.15)',
          badge: 'bg-emerald-500 text-white',
          border: 'border-emerald-400',
          windColor: '#10b981',
        };
    }
  }, [warningTier]);

  // Visual arrow rotation:
  // In Cockpit Approach 3D view:
  // The runway heads straight forward (towards top/horizon).
  // Runway heading is 0° reference (up).
  // Relative wind angle determines the crosswind vector:
  // relativeAngleDeg = windDir - runwayHeading.
  // When relativeAngleDeg is +90°, wind is blowing from exact right (3 o'clock) towards left.
  const arrowAngleApproachDeg = relativeAngleDeg;

  // Windsock deflection percentage based on gust speed (full deflection at 15-20 kts)
  const windsockDeflection = Math.min(100, Math.max(20, (gustSpeedKts / 25) * 100));

  return (
    <div
      id="runway-3d-crosswind-visualizer"
      className={`relative rounded-2xl bg-slate-950 text-slate-100 overflow-hidden border border-slate-800 shadow-xl ${className}`}
    >
      {/* 3D Visualizer Top Toolbar */}
      <div className="px-4 py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 font-mono text-xs font-bold">
            3D
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-bold text-white tracking-wide">
                FAOR RWY {selectedRunway} ({selectedSubRunway})
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-900/60 text-sky-300 border border-sky-700/50">
                HDG {String(runwayHeadingDeg).padStart(3, '0')}° MAG
              </span>
              <span
                className={`text-[9px] font-mono font-black uppercase px-1.5 py-0.2 rounded ${tierColors.badge}`}
              >
                {warningTier}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono block">
              O.R. Tambo Intl • Elevation 5,558' AMSL
            </span>
          </div>
        </div>

        {/* View Mode Controls and Runway Alert Badge */}
        <div className="flex items-center gap-2">
          {/* Dynamic Runway Alert Badge in Toolbar if Alert is Active */}
          {runwayAlert && (
            <button
              onClick={() => setShowAlertPopover(!showAlertPopover)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 ${
                runwayAlert.level === 'CRITICAL'
                  ? 'bg-rose-600/90 hover:bg-rose-600 text-white border border-rose-400 ring-2 ring-rose-500/40 animate-pulse'
                  : runwayAlert.level === 'WARNING'
                  ? 'bg-amber-600/90 hover:bg-amber-600 text-white border border-amber-400 ring-2 ring-amber-500/30'
                  : 'bg-sky-700/80 hover:bg-sky-700 text-sky-100 border border-sky-400/40'
              }`}
              title="Click to view full runway advisory & operational procedures"
            >
              {runwayAlert.type === 'LOW_VISIBILITY' ? (
                <CloudFog className="w-3.5 h-3.5" />
              ) : runwayAlert.title.includes('CONVECTIVE') ? (
                <CloudLightning className="w-3.5 h-3.5" />
              ) : (
                <CloudRain className="w-3.5 h-3.5" />
              )}
              <span>{runwayAlert.badge}</span>
              <AlertTriangle className="w-3 h-3 opacity-80" />
            </button>
          )}

          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-[11px] font-mono">
            <button
              onClick={() => setViewMode('approach')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'approach'
                  ? 'bg-sky-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Cockpit final approach 3D view down runway centerline"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>3D Approach</span>
            </button>

            <button
              onClick={() => setViewMode('isometric')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'isometric'
                  ? 'bg-sky-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="3D Isometric aerodrome overview showing both parallel runways"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>3D Isometric</span>
            </button>

            <button
              onClick={() => setViewMode('topdown')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'topdown'
                  ? 'bg-sky-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Aeronautical top-down runway vector chart"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>2D Radar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visual Canvas Area */}
      <div className="relative w-full h-80 sm:h-96 bg-gradient-to-b from-slate-900 via-slate-950 to-[#0a0f1d] overflow-hidden select-none flex items-center justify-center">
        {/* Dynamic Atmospheric Effects: Low-Visibility Fog Shroud or Heavy Rain Streaks */}
        {runwayAlert?.type === 'LOW_VISIBILITY' && (
          <div
            className="absolute inset-0 pointer-events-none z-20 backdrop-blur-[2px] transition-opacity duration-700"
            style={{
              background:
                runwayAlert.level === 'CRITICAL'
                  ? 'radial-gradient(ellipse at 50% 45%, rgba(203, 213, 225, 0.45) 0%, rgba(148, 163, 184, 0.65) 60%, rgba(30, 41, 59, 0.9) 100%)'
                  : 'radial-gradient(ellipse at 50% 40%, rgba(203, 213, 225, 0.25) 0%, rgba(148, 163, 184, 0.4) 60%, rgba(15, 23, 42, 0.7) 100%)',
            }}
          >
            {/* Drifting mist particles */}
            <motion.div
              className="absolute inset-0 bg-white/5"
              animate={{
                opacity: [0.3, 0.6, 0.3],
                x: [-15, 15, -15],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>
        )}

        {runwayAlert?.type === 'HEAVY_PRECIPITATION' && (
          <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
            {/* Wet Runway Surface Glaze */}
            <div className="absolute inset-0 bg-sky-950/20 mix-blend-overlay pointer-events-none" />
            {/* Diagonal Rain Streaks across Runway */}
            {[...Array(16)].map((_, i) => (
              <motion.div
                key={`rain-${i}`}
                className="absolute w-[1.5px] bg-gradient-to-b from-transparent via-sky-300/60 to-white/80 rounded-full"
                style={{
                  left: `${(i * 6.5) % 100}%`,
                  height: `${28 + (i % 5) * 8}px`,
                  transform: 'rotate(-15deg)',
                }}
                animate={{
                  y: [-40, 400],
                  opacity: [0, 0.75, 0],
                }}
                transition={{
                  duration: 0.65 + (i % 4) * 0.1,
                  repeat: Infinity,
                  delay: (i * 0.08) % 0.6,
                  ease: 'linear',
                }}
              />
            ))}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* PROMINENT DYNAMIC ALERT ICON OVERLAY ON RUNWAY VIEW            */}
        {/* ------------------------------------------------------------- */}
        {runwayAlert && (
          <div className="absolute top-3 left-3 z-30 pointer-events-auto max-w-[280px] sm:max-w-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.3, type: 'spring' }}
              onClick={() => setShowAlertPopover(!showAlertPopover)}
              className={`p-2.5 sm:p-3 rounded-2xl backdrop-blur-md border shadow-2xl transition-all cursor-pointer select-none group ${
                runwayAlert.level === 'CRITICAL'
                  ? 'bg-rose-950/90 border-rose-500/80 shadow-rose-900/50 hover:bg-rose-900/95'
                  : runwayAlert.level === 'WARNING'
                  ? 'bg-amber-950/90 border-amber-500/80 shadow-amber-900/50 hover:bg-amber-900/95'
                  : 'bg-slate-900/90 border-sky-500/60 shadow-sky-900/30 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {/* Flashing / Animated Alert Icon Frame */}
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-300 group-hover:scale-105 ${
                    runwayAlert.level === 'CRITICAL'
                      ? 'bg-rose-600 text-white border-rose-400 shadow-[0_0_15px_rgba(225,29,72,0.6)] animate-pulse'
                      : runwayAlert.level === 'WARNING'
                      ? 'bg-amber-500 text-white border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                      : 'bg-sky-600 text-white border-sky-400 shadow-[0_0_10px_rgba(2,132,199,0.4)]'
                  }`}
                >
                  {runwayAlert.type === 'LOW_VISIBILITY' ? (
                    <CloudFog className="w-5 h-5 stroke-[2.5]" />
                  ) : runwayAlert.title.includes('CONVECTIVE') ? (
                    <CloudLightning className="w-5 h-5 stroke-[2.5] animate-bounce" />
                  ) : runwayAlert.level === 'CRITICAL' ? (
                    <AlertOctagon className="w-5 h-5 stroke-[2.5]" />
                  ) : (
                    <CloudRain className="w-5 h-5 stroke-[2.5]" />
                  )}
                </div>

                {/* Alert Badge, Title & Short Metric */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[9px] font-mono font-black uppercase px-1.5 py-0.2 rounded-md tracking-wider text-white ${
                        runwayAlert.level === 'CRITICAL'
                          ? 'bg-rose-600'
                          : runwayAlert.level === 'WARNING'
                          ? 'bg-amber-600'
                          : 'bg-sky-600'
                      }`}
                    >
                      {runwayAlert.level} ALERT
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-200">
                      RWY {selectedRunway}
                    </span>
                  </div>

                  <h5
                    className={`text-xs font-mono font-bold mt-1 leading-snug tracking-tight truncate ${
                      runwayAlert.level === 'CRITICAL'
                        ? 'text-rose-200'
                        : runwayAlert.level === 'WARNING'
                        ? 'text-amber-200'
                        : 'text-sky-200'
                    }`}
                  >
                    {runwayAlert.title}
                  </h5>

                  <p className="text-[10px] font-sans text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                    {runwayAlert.detail}
                  </p>

                  <div className="mt-1.5 flex items-center justify-between text-[9px] font-mono text-slate-400">
                    <span className="text-slate-300 font-bold flex items-center gap-1">
                      {runwayAlert.rvrEstimatedMeters !== undefined && (
                        <span>RVR: {runwayAlert.rvrEstimatedMeters}m</span>
                      )}
                      {runwayAlert.precipRateMm !== undefined && (
                        <span>Precip: {runwayAlert.precipRateMm} mm/h</span>
                      )}
                    </span>
                    <span className="text-sky-400 underline underline-offset-2">
                      {showAlertPopover ? 'Hide Details ▲' : 'Procedures ▼'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Collapsible Operational Advisory Popover directly on Runway View */}
              <AnimatePresence>
                {showAlertPopover && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2.5 pt-2.5 border-t border-slate-700/80 text-[10px] font-mono text-slate-300 space-y-1.5 overflow-hidden"
                  >
                    <div className="flex items-center justify-between text-slate-400">
                      <span>RUNWAY SURFACE:</span>
                      <strong className="text-white">
                        {runwayAlert.type === 'HEAVY_PRECIPITATION' ? 'WET / CONTAMINATED' : 'LOW VIS CAT II/III'}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>BRAKING ACTION:</span>
                      <strong className={runwayAlert.level === 'CRITICAL' ? 'text-rose-400' : 'text-amber-400'}>
                        {runwayAlert.level === 'CRITICAL' ? 'MEDIUM TO POOR' : 'MEDIUM (FAOR ATIS)'}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>MAX X-WIND REC:</span>
                      <strong className="text-sky-300">
                        {runwayAlert.type === 'HEAVY_PRECIPITATION' ? '25 kts (Wet Limit)' : '20 kts (LVP)'}
                      </strong>
                    </div>
                    <p className="text-[9px] font-sans text-slate-400 italic pt-1 border-t border-slate-800">
                      * Refer to SACAA CAR Part 121 and FAOR Aerodrome Manual (AD 2.1) for mandatory LVP runway hold lines and taxiway routing.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
        {/* Subtle aeronautical grid background */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.15) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: COCKPIT 3D APPROACH VIEW                              */}
        {/* ------------------------------------------------------------- */}
        {viewMode === 'approach' && (
          <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
            {/* Horizon and Sky Gradient */}
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-slate-900 to-transparent pointer-events-none" />

            {/* Distant Highveld Horizon & Mountain Silhouette */}
            <div className="absolute top-16 inset-x-0 flex items-center justify-between px-6 opacity-30 text-[10px] font-mono text-slate-500">
              <span>◄ WEST (FAGM / RAND)</span>
              <span className="text-sky-400/80 font-bold">RUNWAY {selectedRunway} APPROACH AXIS ({String(runwayHeadingDeg).padStart(3, '0')}°)</span>
              <span>EAST (DELMAS) ►</span>
            </div>

            {/* Runway 3D Perspective Plane using CSS 3D Transforms */}
            <div
              className="relative w-full h-full flex items-center justify-center"
              style={{
                perspective: '550px',
                perspectiveOrigin: '50% 28%',
              }}
            >
              {/* 3D Ground Tarmac Container */}
              <div
                className="relative w-64 sm:w-80 h-96 flex flex-col items-center"
                style={{
                  transform: 'rotateX(68deg) translateY(-20px)',
                  transformOrigin: '50% 70%',
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Runway Safety Area / Grass Shoulder */}
                <div className="absolute inset-0 -inset-x-24 bg-gradient-to-b from-emerald-950/20 via-slate-900 to-slate-950 border-x border-slate-800/60 rounded-xl" />

                {/* Main Asphalt Runway Strip */}
                <div className="relative w-full h-full bg-gradient-to-b from-slate-800 via-slate-900 to-[#131b2e] border-x-4 border-slate-600 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col items-center justify-between py-3">
                  {/* Runway Threshold Green Lights (Approach End) */}
                  <div className="w-full flex justify-between px-1">
                    {[...Array(8)].map((_, i) => (
                      <span
                        key={i}
                        className="w-2.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"
                      />
                    ))}
                  </div>

                  {/* Runway Threshold Piano Keys */}
                  <div className="w-full flex justify-center gap-1.5 px-3 mt-1">
                    {[...Array(10)].map((_, i) => (
                      <span key={i} className="w-3 h-10 bg-white/90 rounded-2xs" />
                    ))}
                  </div>

                  {/* Runway Number Stenciled on Tarmac */}
                  <div className="text-center my-1">
                    <span className="text-4xl font-black font-mono text-white tracking-wider drop-shadow-md">
                      {selectedRunway}
                    </span>
                    <span className="block text-xs font-mono font-bold text-slate-300">
                      {selectedSubRunway === '03L/21R' ? (selectedRunway === '03' ? 'L' : 'R') : (selectedRunway === '03' ? 'R' : 'L')}
                    </span>
                  </div>

                  {/* Touchdown Zone Aiming Point Markings */}
                  <div className="w-full flex justify-between px-6 my-2">
                    <div className="w-7 h-16 bg-white/90 rounded-2xs" />
                    <div className="w-7 h-16 bg-white/90 rounded-2xs" />
                  </div>

                  {/* Centerline Dashes Receding into Perspective */}
                  <div className="flex-1 w-full flex flex-col items-center justify-around py-2">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="w-2.5 h-8 bg-white/85 shadow-sm" />
                    ))}
                  </div>

                  {/* Far End Threshold Lights */}
                  <div className="w-full flex justify-between px-1">
                    {[...Array(8)].map((_, i) => (
                      <span
                        key={i}
                        className="w-2 h-1 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e]"
                      />
                    ))}
                  </div>

                  {/* Runway Edge Lights Along Both Shoulders */}
                  <div className="absolute inset-y-0 -left-2 flex flex-col justify-between py-6">
                    {[...Array(12)].map((_, i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-amber-200 shadow-[0_0_6px_#fef08a]"
                      />
                    ))}
                  </div>
                  <div className="absolute inset-y-0 -right-2 flex flex-col justify-between py-6">
                    {[...Array(12)].map((_, i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-amber-200 shadow-[0_0_6px_#fef08a]"
                      />
                    ))}
                  </div>
                </div>

                {/* 3D Windsock on the Left/Right Shoulder */}
                <div
                  className="absolute -right-16 top-1/3 flex flex-col items-center pointer-events-none"
                  style={{
                    transform: 'rotateX(-68deg)',
                    transformOrigin: 'bottom center',
                  }}
                >
                  {/* Windsock Pole */}
                  <div className="w-1 h-14 bg-slate-400 rounded-full" />
                  {/* Swiveling Windsock Cone */}
                  <div
                    className="w-10 h-3 rounded-r-full bg-gradient-to-r from-orange-500 via-white to-orange-500 shadow-md origin-left transition-transform duration-500"
                    style={{
                      transform: `rotate(${relativeAngleDeg > 0 ? -25 : 25}deg) scaleX(${windsockDeflection / 100})`,
                    }}
                  />
                  <span className="text-[8px] font-mono text-slate-400 mt-1">WINDSOCK</span>
                </div>
              </div>
            </div>

            {/* ----------------------------------------------------------- */}
            {/* FLOATING 3D-STYLED CROSSWIND ARROW & VECTOR INDICATOR       */}
            {/* ----------------------------------------------------------- */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Animated Wind Ribbon Flow Across Runway */}
              {showParticles && crosswindKts > 2 && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(7)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute h-0.5 rounded-full"
                      style={{
                        top: `${28 + i * 9}%`,
                        backgroundColor: tierColors.windColor,
                        opacity: 0.55,
                        width: `${Math.min(180, Math.max(70, gustCrosswindKts * 4.5))}px`,
                        boxShadow: `0 0 8px ${tierColors.glow}`,
                      }}
                      initial={{
                        x: crosswindDirection === 'RIGHT' ? 320 : -320,
                        opacity: 0,
                      }}
                      animate={{
                        x: crosswindDirection === 'RIGHT' ? -320 : 320,
                        opacity: [0, 0.8, 0],
                      }}
                      transition={{
                        duration: Math.max(0.7, 2.2 - (gustSpeedKts / 45) * 1.5),
                        repeat: Infinity,
                        delay: i * 0.28,
                        ease: 'linear',
                      }}
                    />
                  ))}
                </div>
              )}

              {/* 3D Extruded Floating Crosswind Vector Arrow Overlay */}
              <div
                className="relative z-10 flex flex-col items-center justify-center transition-transform duration-500"
                style={{
                  transform: 'translateY(-10px)',
                }}
              >
                {/* 3D Arrow Container with Drop Shadow onto Tarmac */}
                <div className="relative">
                  {/* Projected 3D Shadow on Tarmac */}
                  <div
                    className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-48 h-8 rounded-full blur-md opacity-70 transition-all duration-300"
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.85)',
                      transform: `rotate(${arrowAngleApproachDeg}deg) scale(${1 + gustCrosswindKts / 30})`,
                    }}
                  />

                  {/* 3D Arrow Vector Glyph */}
                  <motion.div
                    className="relative px-5 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-md shadow-2xl border transition-all duration-300"
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.88)',
                      borderColor: tierColors.primary,
                      boxShadow: `0 12px 35px -5px ${tierColors.shadow}, 0 0 20px ${tierColors.glow}`,
                    }}
                    animate={{
                      y: [0, -4, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    {/* Rotating 3D Directional Wind Pointer */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shadow-inner transition-transform duration-500 border border-white/20"
                      style={{
                        backgroundColor: tierColors.primary,
                        transform: `rotate(${arrowAngleApproachDeg - 90}deg)`,
                      }}
                    >
                      <ArrowRight className="w-7 h-7 text-white stroke-[2.5]" />
                    </div>

                    {/* Telemetry Text readout inside the 3D HUD banner */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase font-black tracking-wider text-slate-300">
                          3D CROSSWIND VECTOR
                        </span>
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${tierColors.badge}`}
                        >
                          {crosswindDirection}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-2xl font-black font-mono text-white tracking-tight">
                          {crosswindKts}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-400">kts X-Wind</span>
                        <span className="text-xs font-mono font-bold text-rose-400 ml-1">
                          (Gust {gustCrosswindKts} kts)
                        </span>
                      </div>

                      <div className="text-[10px] font-mono text-slate-300 flex items-center gap-2 mt-0.5">
                        <span>
                          {isHeadwind ? 'Headwind' : 'Tailwind'}: <strong>{headwindKts} kt</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Angle: <strong>{Math.abs(relativeAngleDeg)}° off nose</strong>
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Approaching Aircraft Silhouette with Dynamic Crab Angle */}
                {showCrabAircraft && (
                  <div
                    className="mt-6 flex flex-col items-center transition-transform duration-500 pointer-events-auto cursor-pointer"
                    title={`Aircraft Approach Crab Angle: ${Math.abs(Math.round(crabAngleDeg))}° into the wind`}
                  >
                    <div
                      className="relative p-2 rounded-xl bg-slate-900/80 border border-slate-700/80 shadow-lg backdrop-blur-sm transition-transform duration-500 flex items-center gap-2"
                      style={{
                        transform: `rotate(${crabAngleDeg}deg)`,
                      }}
                    >
                      <Plane className="w-6 h-6 text-sky-400 fill-sky-400/20" />
                      <div className="text-[9px] font-mono leading-tight">
                        <span className="text-slate-400 block">APPROACH CRAB</span>
                        <span className="font-bold text-white">
                          {Math.abs(Math.round(crabAngleDeg))}° {crabAngleDeg >= 0 ? 'RIGHT' : 'LEFT'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom HUD bar for 3D Approach View */}
            <div className="absolute bottom-2 inset-x-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <span className="text-slate-200 font-bold">PAPI GLIDESLOPE: 3.0°</span>
                <span className="hidden sm:inline text-slate-600">|</span>
                <span className="hidden sm:inline">TODA: {evaluation.lengthMeters.toLocaleString()}m</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowParticles(!showParticles)}
                  className={`px-1.5 py-0.5 rounded text-[10px] ${
                    showParticles ? 'bg-sky-900/60 text-sky-300' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  Wind Ribbons
                </button>
                <button
                  onClick={() => setShowCrabAircraft(!showCrabAircraft)}
                  className={`px-1.5 py-0.5 rounded text-[10px] ${
                    showCrabAircraft ? 'bg-sky-900/60 text-sky-300' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  Crab Aircraft
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: 3D ISOMETRIC AERODROME VIEW                           */}
        {/* ------------------------------------------------------------- */}
        {viewMode === 'isometric' && (
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <svg
              viewBox="0 0 460 300"
              className="w-full h-full max-h-76 select-none overflow-visible drop-shadow-2xl"
            >
              <defs>
                {/* 3D Runway Gradient */}
                <linearGradient id="rwyGrad3D" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="50%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>

                {/* Wind Arrow Gradient */}
                <linearGradient id="windGrad3D" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={tierColors.primary} stopOpacity="0.4" />
                  <stop offset="100%" stopColor={tierColors.primary} stopOpacity="1" />
                </linearGradient>

                {/* Isometric Ground Mesh */}
                <pattern id="isoGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 15 L 30 30 Z" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                </pattern>
              </defs>

              {/* Isometric Ground Plane */}
              <polygon
                points="230,20 440,130 230,280 20,170"
                fill="#0b1120"
                stroke="#1e293b"
                strokeWidth="1.5"
              />

              {/* Parallel Runway 03L / 21R (4,418m • Main Runway) */}
              <g
                className="cursor-pointer transition-opacity"
                opacity={selectedSubRunway === '03L/21R' ? 1 : 0.6}
              >
                {/* 3D Tarmac slab */}
                <polygon
                  points="140,80 270,145 250,155 120,90"
                  fill="url(#rwyGrad3D)"
                  stroke="#475569"
                  strokeWidth="2"
                />
                {/* Centerline */}
                <line
                  x1="130"
                  y1="85"
                  x2="260"
                  y2="150"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
                {/* Threshold 03L Marker */}
                <circle cx="130" cy="85" r="5" fill="#38bdf8" />
                <text x="110" y="80" fill="#38bdf8" className="text-[9px] font-mono font-bold">
                  03L
                </text>
                {/* Threshold 21R Marker */}
                <circle cx="260" cy="150" r="5" fill="#38bdf8" />
                <text x="270" y="160" fill="#38bdf8" className="text-[9px] font-mono font-bold">
                  21R
                </text>
                <text x="180" y="125" fill="#94a3b8" className="text-[8px] font-mono">
                  03L/21R (4,418m)
                </text>
              </g>

              {/* Parallel Runway 03R / 21L (3,405m • Secondary Runway) */}
              <g
                className="cursor-pointer transition-opacity"
                opacity={selectedSubRunway === '03R/21L' ? 1 : 0.6}
              >
                {/* 3D Tarmac slab */}
                <polygon
                  points="190,120 300,175 285,183 175,128"
                  fill="url(#rwyGrad3D)"
                  stroke="#475569"
                  strokeWidth="2"
                />
                {/* Centerline */}
                <line
                  x1="182"
                  y1="124"
                  x2="292"
                  y2="179"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
                {/* Threshold 03R Marker */}
                <circle cx="182" cy="124" r="4" fill="#94a3b8" />
                <text x="165" y="120" fill="#94a3b8" className="text-[8px] font-mono">
                  03R
                </text>
                {/* Threshold 21L Marker */}
                <circle cx="292" cy="179" r="4" fill="#94a3b8" />
                <text x="300" y="190" fill="#94a3b8" className="text-[8px] font-mono">
                  21L
                </text>
                <text x="230" y="160" fill="#94a3b8" className="text-[8px] font-mono">
                  03R/21L (3,405m)
                </text>
              </g>

              {/* Terminal Complex & Apron Outline (3D extruded box) */}
              <polygon points="210,95 240,110 230,120 200,105" fill="#334155" stroke="#64748b" />
              <polygon points="210,95 210,88 240,103 240,110" fill="#475569" />
              <polygon points="240,103 240,110 230,120 230,113" fill="#1e293b" />
              <text x="215" y="106" fill="#f8fafc" className="text-[6px] font-mono font-bold">
                FAOR TERMINALS
              </text>

              {/* Dynamic 3D Wind Vector Arrow in Isometric Space */}
              {/* Runway 03 heading is 033° (up-right in this isometric projection) */}
              <g transform="translate(230, 140)">
                {/* Shadow */}
                <ellipse
                  cx="0"
                  cy="20"
                  rx={Math.max(25, gustCrosswindKts * 1.5)}
                  ry="8"
                  fill="rgba(0,0,0,0.6)"
                />

                {/* Floating 3D Arrow Shaft & Head */}
                <g
                  transform={`rotate(${relativeAngleDeg})`}
                  className="transition-transform duration-700"
                >
                  <line
                    x1="-45"
                    y1="0"
                    x2="45"
                    y2="0"
                    stroke={tierColors.primary}
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <polygon
                    points="45,-8 60,0 45,8"
                    fill={tierColors.primary}
                    filter="drop-shadow(0 0 6px rgba(255,255,255,0.4))"
                  />
                  <circle cx="0" cy="0" r="5" fill="#ffffff" />
                </g>

                {/* Crosswind component perpendicular line */}
                {crosswindKts > 2 && (
                  <g
                    transform={`rotate(${crosswindDirection === 'RIGHT' ? 90 : -90})`}
                    className="transition-transform duration-500"
                  >
                    <line
                      x1="0"
                      y1="0"
                      x2={Math.min(60, crosswindKts * 2)}
                      y2="0"
                      stroke="#f43f5e"
                      strokeWidth="2.5"
                      strokeDasharray="2 2"
                    />
                    <polygon
                      points={`${Math.min(60, crosswindKts * 2)}, -4 ${Math.min(60, crosswindKts * 2) + 8}, 0 ${Math.min(60, crosswindKts * 2)}, 4`}
                      fill="#f43f5e"
                    />
                  </g>
                )}
              </g>

              {/* North Arrow in Isometric plane */}
              <g transform="translate(50, 60)">
                <circle cx="0" cy="0" r="16" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                <polygon points="0,-12 4,0 0,-3 -4,0" fill="#38bdf8" />
                <polygon points="0,12 4,0 0,3 -4,0" fill="#64748b" />
                <text x="0" y="-14" textAnchor="middle" fill="#38bdf8" className="text-[7px] font-mono font-bold">
                  N (000°)
                </text>
              </g>
            </svg>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 3: 2D RADAR RUNWAY VECTOR                                */}
        {/* ------------------------------------------------------------- */}
        {viewMode === 'topdown' && (
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <svg viewBox="0 0 260 260" className="w-full h-full max-h-76 select-none">
              {/* Radar Circles */}
              <circle cx="130" cy="130" r="100" fill="#0b1120" stroke="#1e293b" strokeWidth="1" />
              <circle cx="130" cy="130" r="75" fill="none" stroke="#1e293b" strokeDasharray="2 3" />
              <circle cx="130" cy="130" r="45" fill="none" stroke="#1e293b" strokeDasharray="2 3" />

              {/* Crosshairs */}
              <line x1="130" y1="20" x2="130" y2="240" stroke="#1e293b" strokeWidth="1" />
              <line x1="20" y1="130" x2="240" y2="130" stroke="#1e293b" strokeWidth="1" />

              {/* Cardinal marks */}
              <text x="130" y="16" textAnchor="middle" className="text-[9px] font-mono font-bold fill-slate-400">
                000° N
              </text>
              <text x="245" y="133" textAnchor="middle" className="text-[9px] font-mono font-bold fill-slate-500">
                090° E
              </text>
              <text x="130" y="254" textAnchor="middle" className="text-[9px] font-mono font-bold fill-slate-500">
                180° S
              </text>
              <text x="15" y="133" textAnchor="middle" className="text-[9px] font-mono font-bold fill-slate-500">
                270° W
              </text>

              {/* Runway Strip rotated to exact magnetic heading: 033° / 213° */}
              <g transform="translate(130, 130) rotate(33)">
                {/* Asphalt */}
                <rect x="-8" y="-85" width="16" height="170" fill="#334155" rx="2" stroke="#64748b" strokeWidth="1" />
                {/* Centerline */}
                <line x1="0" y1="-80" x2="0" y2="80" stroke="#ffffff" strokeWidth="2" strokeDasharray="4 4" />
                {/* Runway 03 Label */}
                <text x="0" y="-68" textAnchor="middle" className="text-[8px] font-mono font-black fill-white">
                  03
                </text>
                {/* Runway 21 Label */}
                <text x="0" y="74" textAnchor="middle" className="text-[8px] font-mono font-black fill-white">
                  21
                </text>
              </g>

              {/* Wind incoming vector */}
              {(() => {
                const wRad = ((windDirDeg - 90) * Math.PI) / 180;
                const wx1 = 130 + 95 * Math.cos(wRad);
                const wy1 = 130 + 95 * Math.sin(wRad);
                const wx2 = 130 + 20 * Math.cos(wRad);
                const wy2 = 130 + 20 * Math.sin(wRad);
                return (
                  <g>
                    <line x1={wx1} y1={wy1} x2={wx2} y2={wy2} stroke={tierColors.primary} strokeWidth="3" strokeLinecap="round" />
                    <circle cx={wx2} cy={wy2} r="4" fill={tierColors.primary} />
                  </g>
                );
              })()}

              <circle cx="130" cy="130" r="4" fill="#38bdf8" />
            </svg>
          </div>
        )}
      </div>

      {/* Dynamic Runway 03/21 Crosswind Legend Bar */}
      <div className="p-3.5 bg-slate-900 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase">ACTIVE RUNWAY</span>
          <span className="text-white font-bold text-sm">
            RWY {selectedRunway} ({String(runwayHeadingDeg).padStart(3, '0')}°)
          </span>
        </div>

        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase">CROSSWIND (3D INTENSITY)</span>
          <span className="text-white font-bold text-sm flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: tierColors.primary }}
            />
            <span>
              {crosswindKts} kt <span className="text-rose-400 text-xs">G{gustCrosswindKts}kt</span>
            </span>
          </span>
        </div>

        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase">WIND INTERCEPT ANGLE</span>
          <span className="text-white font-bold text-sm">
            {Math.abs(relativeAngleDeg)}° off {crosswindDirection}
          </span>
        </div>

        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase">APPROACH CRAB DRIFT</span>
          <span className="text-sky-300 font-bold text-sm">
            {Math.abs(Math.round(crabAngleDeg))}° into wind
          </span>
        </div>
      </div>
    </div>
  );
};
