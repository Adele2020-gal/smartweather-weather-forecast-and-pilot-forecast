import React, { useState, useMemo } from 'react';
import {
  Compass,
  Wind,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Plane,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertOctagon,
  Copy,
  Check,
  Info,
  ArrowUp,
  ArrowRight,
  ArrowDownRight,
  Navigation,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WeatherData } from '../types';
import { Runway3DCrosswindVisualizer } from './Runway3DCrosswindVisualizer';

interface CrosswindComponentCalculatorProps {
  weather: WeatherData;
  className?: string;
  defaultRunway?: '03' | '21';
  onRunwaySelect?: (runway: '03' | '21') => void;
}

export type RunwayId = '03' | '21';
export type RunwaySubId = '03L/21R' | '03R/21L';

export interface AircraftCrosswindLimit {
  category: string;
  name: string;
  maxCrosswindKts: number;
  description: string;
}

export const AIRCRAFT_LIMITS: AircraftCrosswindLimit[] = [
  {
    category: 'light_ga',
    name: 'Light GA (C172 / PA-28)',
    maxCrosswindKts: 15,
    description: 'Demonstrated crosswind limit 15 kts (FAA POH). Student solo limit typically 10-12 kts.',
  },
  {
    category: 'turboprop',
    name: 'Turboprop (B200 / Dash 8)',
    maxCrosswindKts: 22,
    description: 'Typical commuter turboprop dry runway crosswind limit: 20-25 kts.',
  },
  {
    category: 'jet',
    name: 'Airliner (B737 / A320)',
    maxCrosswindKts: 33,
    description: 'Boeing 737 / A320 dry runway max demonstrated crosswind: 33-35 kts. Wet runway limit: 25 kts.',
  },
  {
    category: 'drone',
    name: 'Commercial Drone / UAV',
    maxCrosswindKts: 10,
    description: 'SACAA Part 101 RPAS wind limit. Max operational crosswind typically 10-12 kts.',
  },
];

export interface CrosswindEvaluation {
  runway: RunwayId;
  runwayHeadingDeg: number;
  runwayName: string;
  lengthMeters: number;
  windDirDeg: number;
  windSpeedKts: number;
  gustSpeedKts: number;
  relativeAngleDeg: number;
  crosswindKts: number;
  gustCrosswindKts: number;
  crosswindDirection: 'LEFT' | 'RIGHT' | 'DIRECT';
  headwindKts: number;
  gustHeadwindKts: number;
  isHeadwind: boolean; // true = headwind, false = tailwind
  warningTier: 'NORMAL' | 'CAUTION' | 'HIGH_RISK' | 'CRITICAL';
  warningTitle: string;
  warningDesc: string;
  badgeStyle: {
    bg: string;
    text: string;
    border: string;
    ring: string;
    dot: string;
  };
  aircraftStatuses: Array<{
    aircraft: AircraftCrosswindLimit;
    sustainedExceeded: boolean;
    gustExceeded: boolean;
    marginKts: number;
  }>;
}

export function calculateCrosswind(
  runway: RunwayId,
  subRunway: RunwaySubId,
  windDirDeg: number,
  windSpeedKts: number,
  gustSpeedKts: number
): CrosswindEvaluation {
  // FAOR Magnetic Headings:
  // Runway 03: 033° magnetic
  // Runway 21: 213° magnetic
  const runwayHeadingDeg = runway === '03' ? 33 : 213;
  const runwayLength = subRunway === '03L/21R' ? 4418 : 3405;
  const runwayName = `Runway ${runway} (${subRunway}) - FAOR`;

  // Calculate relative wind angle in degrees (-180 to +180)
  let diff = (windDirDeg - runwayHeadingDeg + 360) % 360;
  if (diff > 180) diff -= 360;
  const relativeAngleDeg = Math.round(diff);

  const rad = (diff * Math.PI) / 180;

  // Crosswind: positive = from right, negative = from left
  const rawCrosswind = windSpeedKts * Math.sin(rad);
  const rawGustCrosswind = gustSpeedKts * Math.sin(rad);

  const crosswindKts = Math.round(Math.abs(rawCrosswind) * 10) / 10;
  const gustCrosswindKts = Math.round(Math.abs(rawGustCrosswind) * 10) / 10;

  let crosswindDirection: 'LEFT' | 'RIGHT' | 'DIRECT' = 'DIRECT';
  if (rawCrosswind > 0.4) {
    crosswindDirection = 'RIGHT';
  } else if (rawCrosswind < -0.4) {
    crosswindDirection = 'LEFT';
  }

  // Headwind / Tailwind: positive = headwind, negative = tailwind
  const rawHeadwind = windSpeedKts * Math.cos(rad);
  const rawGustHeadwind = gustSpeedKts * Math.cos(rad);

  const headwindKts = Math.round(Math.abs(rawHeadwind) * 10) / 10;
  const gustHeadwindKts = Math.round(Math.abs(rawGustHeadwind) * 10) / 10;
  const isHeadwind = rawHeadwind >= 0;

  // Warning System based on current gust speeds (aeronautical safety thresholds)
  let warningTier: 'NORMAL' | 'CAUTION' | 'HIGH_RISK' | 'CRITICAL' = 'NORMAL';
  let warningTitle = 'NORMAL • LOW CROSSWIND RISK';
  let warningDesc =
    'Crosswind gusts within normal operating limits for all aircraft classes including light GA and student solos.';
  let badgeStyle = {
    bg: 'bg-emerald-500/10 dark:bg-emerald-950/20',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-700/50',
    ring: 'ring-emerald-500/20',
    dot: 'bg-emerald-500',
  };

  if (gustCrosswindKts >= 35) {
    warningTier = 'CRITICAL';
    warningTitle = 'CRITICAL ALERT • GUST LIMIT EXCEEDED';
    warningDesc =
      'Peak crosswind gusts exceed maximum demonstrated limits for commercial airliners (B737/A320 ~33-35 kts). High risk of runway excursion or wingtip strike. Immediate go-around or alternate diversion advised.';
    badgeStyle = {
      bg: 'bg-rose-500/15 dark:bg-rose-950/30',
      text: 'text-rose-900 dark:text-rose-200',
      border: 'border-rose-400 dark:border-rose-600',
      ring: 'ring-rose-500/30',
      dot: 'bg-rose-600 animate-pulse',
    };
  } else if (gustCrosswindKts >= 25) {
    warningTier = 'HIGH_RISK';
    warningTitle = 'HIGH RISK • SEVERE GUST CROSSWIND';
    warningDesc =
      'Severe gust crosswind. Light aircraft strictly grounded. Turboprop and commuter operations approach maximum crosswind limits. Strong crab/sideslip required.';
    badgeStyle = {
      bg: 'bg-orange-500/15 dark:bg-orange-950/30',
      text: 'text-orange-900 dark:text-orange-200',
      border: 'border-orange-400 dark:border-orange-600',
      ring: 'ring-orange-500/30',
      dot: 'bg-orange-500',
    };
  } else if (gustCrosswindKts >= 15) {
    warningTier = 'CAUTION';
    warningTitle = 'CAUTION • MODERATE GUST WARNING';
    warningDesc =
      'Gust crosswind exceeds standard light GA demonstrated limit (15 kts). Student solos prohibited. Pilots must anticipate wing-low aileron into wind during flare.';
    badgeStyle = {
      bg: 'bg-amber-500/15 dark:bg-amber-950/30',
      text: 'text-amber-900 dark:text-amber-200',
      border: 'border-amber-400 dark:border-amber-600',
      ring: 'ring-amber-500/30',
      dot: 'bg-amber-500',
    };
  }

  // Evaluate against standard aircraft limits
  const aircraftStatuses = AIRCRAFT_LIMITS.map((ac) => {
    const sustainedExceeded = crosswindKts > ac.maxCrosswindKts;
    const gustExceeded = gustCrosswindKts > ac.maxCrosswindKts;
    const marginKts = Math.round((ac.maxCrosswindKts - gustCrosswindKts) * 10) / 10;
    return {
      aircraft: ac,
      sustainedExceeded,
      gustExceeded,
      marginKts,
    };
  });

  return {
    runway,
    runwayHeadingDeg,
    runwayName,
    lengthMeters: runwayLength,
    windDirDeg,
    windSpeedKts,
    gustSpeedKts,
    relativeAngleDeg,
    crosswindKts,
    gustCrosswindKts,
    crosswindDirection,
    headwindKts,
    gustHeadwindKts,
    isHeadwind,
    warningTier,
    warningTitle,
    warningDesc,
    badgeStyle,
    aircraftStatuses,
  };
}

export const CrosswindComponentCalculator: React.FC<CrosswindComponentCalculatorProps> = ({
  weather,
  className = '',
  defaultRunway = '03',
  onRunwaySelect,
}) => {
  const [selectedRunway, setSelectedRunway] = useState<RunwayId>(defaultRunway);
  const [selectedSubRunway, setSelectedSubRunway] = useState<RunwaySubId>('03L/21R');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simWindDir, setSimWindDir] = useState<number>(60);
  const [simWindSpeed, setSimWindSpeed] = useState<number>(18);
  const [simGustSpeed, setSimGustSpeed] = useState<number>(27);
  const [simVisibility, setSimVisibility] = useState<number>(10000); // meters
  const [simPrecipitation, setSimPrecipitation] = useState<number>(0); // mm/h
  const [copiedBrief, setCopiedBrief] = useState(false);

  // Real-time live weather derived speeds in knots
  const liveWindSpeedKts = useMemo(() => {
    // weather.current.windSpeed is typically km/h from Open-Meteo
    const kmh = weather?.current?.windSpeed ?? 20;
    return Math.round(kmh * 0.539957 * 10) / 10;
  }, [weather?.current?.windSpeed]);

  const liveGustSpeedKts = useMemo(() => {
    const kmh = weather?.current?.windGust ?? (weather?.current?.windSpeed ?? 20) * 1.35;
    return Math.max(liveWindSpeedKts, Math.round(kmh * 0.539957 * 10) / 10);
  }, [weather?.current?.windGust, weather?.current?.windSpeed, liveWindSpeedKts]);

  const liveWindDirDeg = weather?.current?.windDirection ?? 70;

  // Active inputs: live or simulation
  const effectiveWindDir = isSimulating ? simWindDir : liveWindDirDeg;
  const effectiveWindSpeed = isSimulating ? simWindSpeed : liveWindSpeedKts;
  const effectiveGustSpeed = isSimulating ? simGustSpeed : liveGustSpeedKts;

  // Synthesized effective weather data passed down to the visualizer for alerts
  const effectiveWeather = useMemo<WeatherData>(() => {
    if (!isSimulating) {
      return weather;
    }
    return {
      ...weather,
      current: {
        ...weather.current,
        windSpeed: effectiveWindSpeed / 0.539957,
        windGust: effectiveGustSpeed / 0.539957,
        windDirection: effectiveWindDir,
        visibility: simVisibility,
        precipitation: simPrecipitation,
        weatherDescription:
          simVisibility < 1000
            ? 'Dense Fog (LVP CAT II/III)'
            : simPrecipitation >= 10
            ? 'Heavy Thunderstorm with Rain'
            : simPrecipitation >= 4
            ? 'Heavy Rain Shower'
            : simPrecipitation > 0
            ? 'Light Rain Shower'
            : simVisibility < 4000
            ? 'Haze / Shallow Mist'
            : weather.current.weatherDescription,
        weatherCode:
          simPrecipitation >= 10
            ? 95
            : simPrecipitation >= 4
            ? 65
            : simVisibility < 1000
            ? 45
            : simVisibility < 3000
            ? 48
            : weather.current.weatherCode,
      },
    };
  }, [weather, isSimulating, effectiveWindSpeed, effectiveGustSpeed, effectiveWindDir, simVisibility, simPrecipitation]);

  // Current calculation for selected runway
  const evaluation = useMemo(() => {
    return calculateCrosswind(
      selectedRunway,
      selectedSubRunway,
      effectiveWindDir,
      effectiveWindSpeed,
      effectiveGustSpeed
    );
  }, [selectedRunway, selectedSubRunway, effectiveWindDir, effectiveWindSpeed, effectiveGustSpeed]);

  // Reciprocal runway calculation to check which end has headwind
  const reciprocalRunway: RunwayId = selectedRunway === '03' ? '21' : '03';
  const reciprocalEvaluation = useMemo(() => {
    return calculateCrosswind(
      reciprocalRunway,
      selectedSubRunway,
      effectiveWindDir,
      effectiveWindSpeed,
      effectiveGustSpeed
    );
  }, [reciprocalRunway, selectedSubRunway, effectiveWindDir, effectiveWindSpeed, effectiveGustSpeed]);

  const handleRunwayToggle = (rwy: RunwayId) => {
    setSelectedRunway(rwy);
    if (onRunwaySelect) {
      onRunwaySelect(rwy);
    }
  };

  const handleCopyBriefing = () => {
    const briefText = `FAOR BRIEF: RWY ${evaluation.runway} (${String(evaluation.runwayHeadingDeg).padStart(3, '0')}°) | Wind: ${String(effectiveWindDir).padStart(3, '0')}° @ ${effectiveWindSpeed}kt G${effectiveGustSpeed}kt | XWIND: ${evaluation.crosswindKts}kt (GUST ${evaluation.gustCrosswindKts}kt) from ${evaluation.crosswindDirection} | ${evaluation.isHeadwind ? 'HEADWIND' : 'TAILWIND'}: ${evaluation.headwindKts}kt | STATUS: ${evaluation.warningTier}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(briefText);
      setCopiedBrief(true);
      setTimeout(() => setCopiedBrief(false), 2000);
    }
  };

  // SVG Diagram calculations for Compass & Runway Orientation
  // Runway 03 heading is 033°. Compass center is (120, 120), radius 80.
  const cx = 110;
  const cy = 110;
  const compassRadius = 82;

  // Runway line angle in standard SVG coordinates:
  // In aviation: 0° is North (top), 90° East (right), 180° South (bottom), 270° West (left).
  // In SVG math: 0 rad is East (x+), so angleInSvgRad = (aviationDeg - 90) * (PI / 180).
  const runwayAngleDeg = evaluation.runwayHeadingDeg;
  const runwayAngleRad = ((runwayAngleDeg - 90) * Math.PI) / 180;

  // Runway strip coordinates (length = 130px)
  const halfLen = 65;
  const rwyX1 = cx - halfLen * Math.cos(runwayAngleRad);
  const rwyY1 = cy - halfLen * Math.sin(runwayAngleRad);
  const rwyX2 = cx + halfLen * Math.cos(runwayAngleRad);
  const rwyY2 = cy + halfLen * Math.sin(runwayAngleRad);

  // Wind incoming vector: wind blows FROM windDirDeg towards center
  const windDirRad = ((effectiveWindDir - 90) * Math.PI) / 180;
  const windSourceX = cx + (compassRadius - 6) * Math.cos(windDirRad);
  const windSourceY = cy + (compassRadius - 6) * Math.sin(windDirRad);
  // Arrow vector pointing into center
  const windArrowTargetX = cx + 18 * Math.cos(windDirRad);
  const windArrowTargetY = cy + 18 * Math.sin(windDirRad);

  // Crosswind vector: perpendicular to runway heading
  // If crosswind is from right, it pushes from right to left across runway
  const perpAngleDeg = evaluation.crosswindDirection === 'RIGHT' ? runwayAngleDeg + 90 : runwayAngleDeg - 90;
  const perpAngleRad = ((perpAngleDeg - 90) * Math.PI) / 180;
  const xwindArrowLen = Math.min(36, Math.max(14, evaluation.gustCrosswindKts * 1.2));
  const xwindTargetX = cx + xwindArrowLen * Math.cos(perpAngleRad);
  const xwindTargetY = cy + xwindArrowLen * Math.sin(perpAngleRad);

  return (
    <div
      id="crosswind-component-calculator"
      className={`rounded-3xl bg-white border border-sky-200/90 shadow-sm overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Header Bar */}
      <div className="p-4 sm:p-5 pb-3 border-b border-sky-100/90 bg-gradient-to-r from-sky-50/70 via-blue-50/40 to-slate-50/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 border border-sky-400 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-sky-800">
                O.R. TAMBO (FAOR) • BOKSBURG
              </span>
              <span
                className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${evaluation.badgeStyle.bg} ${evaluation.badgeStyle.text} ${evaluation.badgeStyle.border}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${evaluation.badgeStyle.dot}`} />
                {evaluation.warningTier} GUST WARNING
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Crosswind Component Calculator — Runway 03/21
            </h3>
          </div>
        </div>

        {/* Right side controls: Briefing copy and Sim mode */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
              isSimulating
                ? 'bg-amber-100/90 text-amber-900 border-amber-300 shadow-xs'
                : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
            }`}
            title="Toggle simulation mode to test crosswind scenarios & gust limits"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-600" />
            <span>{isSimulating ? 'Sim Mode: Active' : 'Simulate Gusts'}</span>
          </button>

          <button
            onClick={handleCopyBriefing}
            className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
            title="Copy formatted crosswind brief for flight log"
          >
            {copiedBrief ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedBrief ? 'Copied Brief' : 'Copy Brief'}</span>
          </button>
        </div>
      </div>

      {/* Simulation Controls Drawer (When active) */}
      <AnimatePresence>
        {isSimulating && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-amber-200 bg-amber-50/50 p-4 text-xs font-mono overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-700" />
                Crosswind & Gust Simulation Slider Sandbox
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => {
                    setSimWindDir(70);
                    setSimWindSpeed(14);
                    setSimGustSpeed(18);
                    setSimVisibility(10000);
                    setSimPrecipitation(0);
                  }}
                  className="px-2 py-0.5 rounded bg-white border border-amber-200 text-[10px] text-amber-800 hover:bg-amber-100"
                >
                  Light Highveld (18kt G)
                </button>
                <button
                  onClick={() => {
                    setSimWindDir(110);
                    setSimWindSpeed(22);
                    setSimGustSpeed(30);
                    setSimVisibility(4000);
                    setSimPrecipitation(2.5);
                  }}
                  className="px-2 py-0.5 rounded bg-white border border-amber-200 text-[10px] text-amber-800 hover:bg-amber-100"
                >
                  Wet Runway (30kt G)
                </button>
                <button
                  onClick={() => {
                    setSimWindDir(300);
                    setSimWindSpeed(28);
                    setSimGustSpeed(42);
                    setSimVisibility(2500);
                    setSimPrecipitation(8);
                  }}
                  className="px-2 py-0.5 rounded bg-rose-100 border border-rose-300 text-[10px] text-rose-800 hover:bg-rose-200"
                >
                  Heavy Rain & Gusts (42kt G)
                </button>
                <button
                  onClick={() => {
                    setSimWindDir(40);
                    setSimWindSpeed(6);
                    setSimGustSpeed(8);
                    setSimVisibility(600);
                    setSimPrecipitation(0);
                  }}
                  className="px-2 py-0.5 rounded bg-slate-200 border border-slate-400 text-[10px] text-slate-800 hover:bg-slate-300 font-bold"
                >
                  LVP CAT II/III Fog (600m)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div>
                <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                  <span>Wind Direction:</span>
                  <span className="font-bold text-slate-900">{simWindDir}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="359"
                  step="5"
                  value={simWindDir}
                  onChange={(e) => setSimWindDir(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                  <span>Sustained Wind:</span>
                  <span className="font-bold text-slate-900">{simWindSpeed} kts</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="45"
                  value={simWindSpeed}
                  onChange={(e) => {
                    const spd = Number(e.target.value);
                    setSimWindSpeed(spd);
                    if (simGustSpeed < spd) setSimGustSpeed(spd);
                  }}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                  <span>Peak Gust Speed:</span>
                  <span className="font-bold text-rose-700">{simGustSpeed} kts</span>
                </div>
                <input
                  type="range"
                  min={simWindSpeed}
                  max="60"
                  value={simGustSpeed}
                  onChange={(e) => setSimGustSpeed(Number(e.target.value))}
                  className="w-full accent-rose-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                  <span>Runway Visibility:</span>
                  <span className="font-bold text-slate-900">
                    {simVisibility < 1000 ? `${simVisibility}m (LVP)` : `${(simVisibility / 1000).toFixed(1)}km`}
                  </span>
                </div>
                <input
                  type="range"
                  min="300"
                  max="10000"
                  step="100"
                  value={simVisibility}
                  onChange={(e) => setSimVisibility(Number(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                  <span>Precipitation:</span>
                  <span className="font-bold text-sky-750">{simPrecipitation} mm/h</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.5"
                  value={simPrecipitation}
                  onChange={(e) => setSimPrecipitation(Number(e.target.value))}
                  className="w-full accent-sky-600 cursor-pointer"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Runway Selection Segment & Reciprocal Headwind Recommendation */}
      <div className="p-4 sm:p-5 pb-2 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Runway 03 vs 21 Selector Tabs */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-slate-500 uppercase">RUNWAY:</span>
          <div className="flex items-center p-1 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <button
              onClick={() => handleRunwayToggle('03')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                selectedRunway === '03'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>RWY 03 (033°)</span>
              {evaluation.runway === '03' && evaluation.isHeadwind && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500 text-white">HEADWIND</span>
              )}
            </button>

            <button
              onClick={() => handleRunwayToggle('21')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                selectedRunway === '21'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>RWY 21 (213°)</span>
              {evaluation.runway === '21' && evaluation.isHeadwind && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500 text-white">HEADWIND</span>
              )}
            </button>
          </div>

          {/* Sub-runway selector (03L/21R vs 03R/21L) */}
          <select
            value={selectedSubRunway}
            onChange={(e) => setSelectedSubRunway(e.target.value as RunwaySubId)}
            className="text-xs font-mono bg-white border border-slate-200 text-slate-700 py-1.5 px-2.5 rounded-xl shadow-2xs outline-none focus:border-blue-400"
          >
            <option value="03L/21R">03L/21R (4,418m • Main)</option>
            <option value="03R/21L">03R/21L (3,405m • Sec)</option>
          </select>
        </div>

        {/* Dynamic Headwind/Tailwind Advantage Advisory */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-500">Runway Recommendation:</span>
          {evaluation.isHeadwind ? (
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                RWY {selectedRunway} is FAVORABLE (+{evaluation.headwindKts}kt Headwind)
              </span>
            </span>
          ) : (
            <span className="text-amber-800 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>
                RWY {selectedRunway} has Tailwind ({evaluation.headwindKts}kt) — Prefer RWY {reciprocalRunway}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* 3D Visual Representation of Runway 03/21 at FAOR with 3D Crosswind Indicator */}
      <div className="p-4 sm:p-5 pb-0">
        <Runway3DCrosswindVisualizer
          evaluation={evaluation}
          selectedRunway={selectedRunway}
          selectedSubRunway={selectedSubRunway}
          weather={effectiveWeather}
          onRunwayChange={handleRunwayToggle}
        />
      </div>

      {/* Main Telemetry & Warning System Grid */}
      <div className="p-4 sm:p-5 pt-3 space-y-3.5">
        {/* Main Crosswind & Gust Warning Status Alert Box */}
          <div
            className={`p-4 rounded-2xl border transition-all duration-300 ${evaluation.badgeStyle.bg} ${evaluation.badgeStyle.border}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {evaluation.warningTier === 'CRITICAL' ? (
                  <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 animate-bounce" />
                ) : evaluation.warningTier === 'HIGH_RISK' ? (
                  <ShieldAlert className="w-5 h-5 text-orange-600 shrink-0" />
                ) : evaluation.warningTier === 'CAUTION' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-md text-white ${
                        evaluation.warningTier === 'CRITICAL'
                          ? 'bg-rose-600'
                          : evaluation.warningTier === 'HIGH_RISK'
                          ? 'bg-orange-600'
                          : evaluation.warningTier === 'CAUTION'
                          ? 'bg-amber-600'
                          : 'bg-emerald-600'
                      }`}
                    >
                      {evaluation.warningTier}
                    </span>
                    <span className="text-xs font-bold font-mono text-slate-900">
                      {evaluation.warningTitle}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">GUST INTENSITY</span>
                <span className="text-lg font-black font-mono text-rose-600">
                  {evaluation.gustCrosswindKts} kts
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-700 font-sans mt-2 leading-relaxed">
              {evaluation.warningDesc}
            </p>
          </div>

          {/* Dual Intensity Cards: Crosswind (Sustained vs Gust) and Head/Tailwind */}
          <div className="grid grid-cols-2 gap-3">
            {/* Crosswind Card */}
            <div className="p-3 rounded-2xl bg-white border border-sky-200/90 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono uppercase font-bold">
                <span>CROSSWIND COMPONENT</span>
                <span className="text-sky-700">{evaluation.crosswindDirection}</span>
              </div>

              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tracking-tight">
                  {evaluation.crosswindKts}
                </span>
                <span className="text-xs font-mono font-bold text-slate-600">kts</span>
                <span className="text-xs font-mono font-bold text-rose-600 ml-auto">
                  Gust {evaluation.gustCrosswindKts} kts
                </span>
              </div>

              {/* Progress bar with warning zones */}
              <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-500 ${
                    evaluation.gustCrosswindKts >= 35
                      ? 'bg-rose-600'
                      : evaluation.gustCrosswindKts >= 25
                      ? 'bg-orange-500'
                      : evaluation.gustCrosswindKts >= 15
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (evaluation.gustCrosswindKts / 45) * 100)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-1">
                <span>0kt</span>
                <span className="text-amber-600 font-bold">15kt GA</span>
                <span className="text-orange-600 font-bold">25kt TP</span>
                <span className="text-rose-600 font-bold">35kt Jet</span>
              </div>
            </div>

            {/* Headwind / Tailwind Card */}
            <div className="p-3 rounded-2xl bg-white border border-sky-200/90 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono uppercase font-bold">
                <span>{evaluation.isHeadwind ? 'HEADWIND COMPONENT' : 'TAILWIND COMPONENT'}</span>
                <span className={evaluation.isHeadwind ? 'text-emerald-700' : 'text-amber-700'}>
                  {evaluation.isHeadwind ? 'FAVORABLE' : 'UNFAVORABLE'}
                </span>
              </div>

              <div className="flex items-baseline gap-1.5 mt-1">
                <span
                  className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                    evaluation.isHeadwind ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {evaluation.headwindKts}
                </span>
                <span className="text-xs font-mono font-bold text-slate-600">kts</span>
                <span className="text-xs font-mono font-bold text-slate-500 ml-auto">
                  Gust {evaluation.gustHeadwindKts} kts
                </span>
              </div>

              <div className="mt-2 text-[10px] font-mono text-slate-600 flex items-center gap-1">
                {evaluation.isHeadwind ? (
                  <span className="text-emerald-700">Normal landing/takeoff deceleration</span>
                ) : (
                  <span className="text-amber-800 font-semibold">
                    Increases landing distance; standard max tailwind limit is 10-15 kts
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Aircraft Class Crosswind Tolerance Grid */}
          <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-200/80">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
              <span>AIRCRAFT FLEET DEMONSTRATED LIMITS</span>
              <span className="text-slate-400">FAOR ELEV 5,558'</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {evaluation.aircraftStatuses.map((stat, idx) => {
                const isExceeded = stat.gustExceeded;
                const isMarginal = !isExceeded && stat.marginKts < 5;

                return (
                  <div
                    key={idx}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      isExceeded
                        ? 'bg-rose-50 border-rose-300 text-rose-900'
                        : isMarginal
                        ? 'bg-amber-50 border-amber-300 text-amber-900'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="text-[10px] font-mono font-bold truncate" title={stat.aircraft.name}>
                      {stat.aircraft.name.split(' (')[0]}
                    </div>
                    <div className="text-xs font-black font-mono mt-0.5">
                      Max {stat.aircraft.maxCrosswindKts} kts
                    </div>
                    <span
                      className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                        isExceeded
                          ? 'bg-rose-600 text-white'
                          : isMarginal
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {isExceeded ? 'EXCEEDED' : isMarginal ? 'MARGINAL' : 'WITHIN LIMIT'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
  );
};
