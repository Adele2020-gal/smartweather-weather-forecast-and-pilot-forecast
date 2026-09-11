import React, { useState } from 'react';
import {
  Cloud,
  Plane,
  Gauge,
  ShieldCheck,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Compass,
  ArrowUpRight,
} from 'lucide-react';
import { WeatherData } from '../types';

interface CloudBaseAltitudeGaugeProps {
  weather: WeatherData;
  className?: string;
}

// Precise Magnus formula for Dew Point
export function calculateDewPoint(tempC: number, rhPercent: number): number {
  const a = 17.27;
  const b = 237.7;
  const clampedRh = Math.max(1, Math.min(100, rhPercent));
  const alpha = (a * tempC) / (b + tempC) + Math.log(clampedRh / 100);
  const dp = (b * alpha) / (a - alpha);
  return Math.round(dp * 10) / 10;
}

export type VfrCondition = 'VFR' | 'MVFR' | 'IFR' | 'LIFR';

export interface CloudCeilingData {
  dewPoint: number;
  spread: number;
  baseFtAgl: number;
  baseFtAmsl: number;
  groundElevFt: number;
  condition: VfrCondition;
  conditionLabel: string;
  conditionDesc: string;
  badgeColor: string;
  droneClearance: 'CLEAR' | 'CAUTION' | 'RESTRICTED';
}

export function computeCloudCeiling(
  tempC: number,
  rhPercent: number,
  cloudCoverPercent: number,
  visibilityMeters: number,
  groundElevationM = 1600
): CloudCeilingData {
  const dewPoint = calculateDewPoint(tempC, rhPercent);
  const spread = Math.max(0, tempC - dewPoint);

  // Espy's Lifted Condensation Level (LCL): ~400 ft per °C of dew point depression
  let baseFtAgl = Math.round(spread * 400);

  // Surface saturation and cloud cover realism
  if (rhPercent >= 95) {
    baseFtAgl = Math.min(baseFtAgl, 350);
  } else if (rhPercent >= 88) {
    baseFtAgl = Math.min(baseFtAgl, 950);
  } else if (cloudCoverPercent < 15 && baseFtAgl < 6000) {
    // Clear Highveld skies: high convective condensation level
    baseFtAgl = Math.max(baseFtAgl, 7000);
  }

  // Ensure reasonable bounds
  baseFtAgl = Math.max(150, Math.min(15000, baseFtAgl));

  const groundElevFt = Math.round(groundElevationM * 3.28084); // ~5,250 ft for Boksburg
  const baseFtAmsl = baseFtAgl + groundElevFt;

  // Determine VFR Flight Condition Category based on Ceiling & Visibility
  let condition: VfrCondition = 'VFR';
  let conditionLabel = 'VFR • Visual Flight Rules';
  let conditionDesc = 'Ceiling > 3,000 ft AGL & clear visual range. Optimal for VFR cross-country and training.';
  let badgeColor = 'bg-emerald-500/15 text-emerald-700 border-emerald-300 dark:text-emerald-300';

  if (baseFtAgl < 500 || visibilityMeters < 1500) {
    condition = 'LIFR';
    conditionLabel = 'LIFR • Low Instrument Rules';
    conditionDesc = 'Ceiling < 500 ft AGL or visibility < 1.5 km. Dense fog/stratus hazard. Visual flights prohibited.';
    badgeColor = 'bg-purple-500/15 text-purple-700 border-purple-300 dark:text-purple-300';
  } else if (baseFtAgl < 1000 || visibilityMeters < 3000) {
    condition = 'IFR';
    conditionLabel = 'IFR • Instrument Flight Rules';
    conditionDesc = 'Ceiling 500 - 999 ft AGL or visibility 1.5 - 3 km. VFR flights grounded without IFR flight plan.';
    badgeColor = 'bg-rose-500/15 text-rose-700 border-rose-300 dark:text-rose-300';
  } else if (baseFtAgl < 3000 || visibilityMeters < 5000) {
    condition = 'MVFR';
    conditionLabel = 'MVFR • Marginal VFR';
    conditionDesc = 'Ceiling 1,000 - 2,999 ft AGL. Caution required for Highveld circuit and light aircraft operations.';
    badgeColor = 'bg-amber-500/15 text-amber-700 border-amber-300 dark:text-amber-300';
  }

  // Drone clearance check (400 ft AGL max legal limit)
  let droneClearance: 'CLEAR' | 'CAUTION' | 'RESTRICTED' = 'CLEAR';
  if (baseFtAgl <= 400) {
    droneClearance = 'RESTRICTED';
  } else if (baseFtAgl <= 700) {
    droneClearance = 'CAUTION';
  }

  return {
    dewPoint,
    spread: Math.round(spread * 10) / 10,
    baseFtAgl,
    baseFtAmsl,
    groundElevFt,
    condition,
    conditionLabel,
    conditionDesc,
    badgeColor,
    droneClearance,
  };
}

export const CloudBaseAltitudeGauge: React.FC<CloudBaseAltitudeGaugeProps> = ({
  weather,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [displayUnit, setDisplayUnit] = useState<'AGL' | 'AMSL'>('AGL');

  const { current, location } = weather;
  const groundElevationM = location.elevation ?? 1600;

  const data = computeCloudCeiling(
    current.temperature,
    current.relativeHumidity,
    current.cloudCover,
    current.visibility,
    groundElevationM
  );

  // SVG Gauge calculations
  // Gauge scale: 0 to 8,000 ft AGL
  // Angle range: -180 deg to 0 deg (semicircle arc from left to right)
  const maxGaugeAlt = 8000;
  const clampedAlt = Math.max(0, Math.min(maxGaugeAlt, data.baseFtAgl));
  const fillFraction = clampedAlt / maxGaugeAlt;
  
  // Angle in degrees from 180 to 0 (where 180 is left, 90 is top, 0 is right)
  // needle angle in radians: start = Math.PI, end = 0
  const needleAngle = Math.PI - fillFraction * Math.PI;

  const radius = 76;
  const cx = 100;
  const cy = 95;
  const needleLen = 58;
  const needleX = cx + needleLen * Math.cos(needleAngle);
  const needleY = cy - needleLen * Math.sin(needleAngle);

  // Arc threshold angles:
  // LIFR: 0 to 500 ft (fraction: 500 / 8000 = 0.0625)
  // IFR: 500 to 1000 ft (fraction: 1000 / 8000 = 0.125)
  // MVFR: 1000 to 3000 ft (fraction: 3000 / 8000 = 0.375)
  // VFR: 3000 to 8000 ft (fraction: 0.375 to 1.0)

  // Function to describe SVG arc
  const describeArc = (startFrac: number, endFrac: number, r: number, width: number) => {
    const a1 = Math.PI - startFrac * Math.PI;
    const a2 = Math.PI - endFrac * Math.PI;
    
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy - r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2);
    const y2 = cy - r * Math.sin(a2);

    const x3 = cx + (r - width) * Math.cos(a2);
    const y3 = cy - (r - width) * Math.sin(a2);
    const x4 = cx + (r - width) * Math.cos(a1);
    const y4 = cy - (r - width) * Math.sin(a1);

    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${r - width} ${r - width} 0 0 0 ${x4} ${y4} Z`;
  };

  return (
    <div
      id="cloud-base-altitude-gauge"
      className={`rounded-2xl bg-gradient-to-b from-sky-50/90 to-slate-50/90 border border-sky-200/80 shadow-[0_2px_12px_rgba(2,132,199,0.06)] overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Gauge Header */}
      <div className="p-4 sm:p-5 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-sky-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-300 flex items-center justify-center text-sky-700 shadow-2xs">
            <Cloud className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-sky-700 font-mono">
                Aeronautical Ceiling Gauge
              </span>
              <span
                className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold border ${data.badgeColor}`}
              >
                {data.condition}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-slate-800">
              Cloud Base Altitude & VFR Flight Ceiling
            </h3>
          </div>
        </div>

        {/* Altitude Unit Toggle */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-sky-100/70 p-1 rounded-xl border border-sky-200/80 text-xs font-mono">
          <button
            onClick={() => setDisplayUnit('AGL')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              displayUnit === 'AGL'
                ? 'bg-white text-sky-900 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ft AGL
          </button>
          <button
            onClick={() => setDisplayUnit('AMSL')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              displayUnit === 'AMSL'
                ? 'bg-white text-sky-900 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ft AMSL
          </button>
        </div>
      </div>

      {/* Main Dial & Telemetry Body */}
      <div className="p-4 sm:p-5 pt-3 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Left: Semi-circular SVG Meter Gauge */}
        <div className="md:col-span-5 flex flex-col items-center justify-center relative">
          <div className="relative w-48 h-28 flex items-center justify-center overflow-visible">
            <svg
              viewBox="0 15 200 95"
              className="w-full h-full drop-shadow-xs overflow-visible"
            >
              {/* Background track */}
              <path
                d={describeArc(0, 1, radius, 12)}
                className="fill-slate-200/80"
              />

              {/* LIFR segment (0 - 500 ft: 0 to 0.0625) */}
              <path
                d={describeArc(0, 500 / maxGaugeAlt, radius, 12)}
                className="fill-purple-500/80"
              />

              {/* IFR segment (500 - 1000 ft: 0.0625 to 0.125) */}
              <path
                d={describeArc(500 / maxGaugeAlt, 1000 / maxGaugeAlt, radius, 12)}
                className="fill-rose-500/80"
              />

              {/* MVFR segment (1000 - 3000 ft: 0.125 to 0.375) */}
              <path
                d={describeArc(1000 / maxGaugeAlt, 3000 / maxGaugeAlt, radius, 12)}
                className="fill-amber-400"
              />

              {/* VFR segment (3000 - 8000 ft: 0.375 to 1.0) */}
              <path
                d={describeArc(3000 / maxGaugeAlt, 1, radius, 12)}
                className="fill-emerald-500"
              />

              {/* Indicator needle line */}
              <line
                x1={cx}
                y1={cy}
                x2={needleX}
                y2={needleY}
                stroke="#0f172a"
                strokeWidth="3"
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />

              {/* Needle center hub */}
              <circle cx={cx} cy={cy} r="6" className="fill-slate-900" />
              <circle cx={cx} cy={cy} r="2.5" className="fill-sky-400" />

              {/* Altitude ticks labels */}
              <text x="18" y="103" className="text-[8px] font-mono fill-slate-500 font-bold">0'</text>
              <text x="68" y="38" className="text-[8px] font-mono fill-amber-600 font-bold">1k'</text>
              <text x="100" y="24" className="text-[8px] font-mono fill-emerald-600 font-bold" textAnchor="middle">3k'</text>
              <text x="175" y="103" className="text-[8px] font-mono fill-slate-500 font-bold">8k'+</text>
            </svg>
          </div>

          {/* Gauge Status Legend */}
          <div className="flex items-center justify-center gap-2 mt-1 text-[9px] font-mono">
            <span className="flex items-center gap-1 text-purple-700 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> LIFR
            </span>
            <span className="flex items-center gap-1 text-rose-700 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> IFR
            </span>
            <span className="flex items-center gap-1 text-amber-700 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> MVFR
            </span>
            <span className="flex items-center gap-1 text-emerald-700 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> VFR
            </span>
          </div>
        </div>

        {/* Right: Big Altitude Readout & Flight Safety Condition */}
        <div className="md:col-span-7 flex flex-col justify-center space-y-2.5">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-sky-600" />
              <span>Estimated Cloud Base (Ceiling)</span>
            </div>

            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl sm:text-4xl font-mono font-bold text-slate-900 tracking-tight">
                {displayUnit === 'AGL'
                  ? data.baseFtAgl.toLocaleString()
                  : data.baseFtAmsl.toLocaleString()}
              </span>
              <span className="text-sm sm:text-base font-mono font-semibold text-sky-700">
                {displayUnit === 'AGL' ? 'ft AGL' : 'ft AMSL'}
              </span>
              <span className="text-xs text-slate-500 font-mono ml-1">
                ({displayUnit === 'AGL' ? `${data.baseFtAmsl.toLocaleString()} ft AMSL` : `${data.baseFtAgl.toLocaleString()} ft AGL`})
              </span>
            </div>
          </div>

          {/* VFR Flight Assessment Banner */}
          <div className="p-3 rounded-xl bg-white/80 border border-sky-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                {data.condition === 'VFR' ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                )}
                <span>{data.conditionLabel}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                Boksburg (1,600m / 5,250' AMSL)
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              {data.conditionDesc}
            </p>
          </div>

          {/* Secondary Telemetry: Dew Point Spread & Drone Clearance */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 rounded-xl bg-sky-50/70 border border-sky-200/60">
              <span className="text-[10px] text-slate-500 block uppercase">Dew Point Spread</span>
              <span className="text-xs font-bold text-slate-800">
                Δ {data.spread}°C{' '}
                <span className="text-[10px] text-sky-600 font-normal">
                  (Dew: {data.dewPoint}°C)
                </span>
              </span>
            </div>

            <div className="p-2 rounded-xl bg-sky-50/70 border border-sky-200/60">
              <span className="text-[10px] text-slate-500 block uppercase">Drone AGL Ceiling</span>
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    data.droneClearance === 'CLEAR'
                      ? 'bg-emerald-500'
                      : data.droneClearance === 'CAUTION'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                />
                <span>
                  {data.droneClearance === 'CLEAR'
                    ? '400ft Max Legal Cleared'
                    : data.droneClearance === 'CAUTION'
                    ? 'Cloud Base <700ft AGL'
                    : 'Restricted (Cloud <400ft)'}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Aeronautical Aerodrome Details Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2.5 bg-sky-100/40 hover:bg-sky-100/70 border-t border-sky-200/70 flex items-center justify-between text-xs text-sky-800 font-mono transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-sky-600" />
          <span>Aeronautical Circuit & LCL Formula Reference</span>
        </div>
        <div className="flex items-center gap-1 font-semibold">
          <span>{isExpanded ? 'Hide Details' : 'View Altitudes'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* Expanded Technical Details Panel */}
      {isExpanded && (
        <div className="p-4 sm:p-5 bg-white/95 border-t border-sky-200/80 text-xs text-slate-700 space-y-3 font-sans animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px]">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] font-bold">O.R. TAMBO (FAOR) CTR</span>
              <span className="text-slate-900 font-bold block mt-0.5">Ceiling: SFC - 7,500' AMSL</span>
              <span className="text-[10px] text-slate-500">
                Pattern at 6,550' AMSL (1,000' AGL)
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] font-bold">BRAKPAN (FABB) VFR</span>
              <span className="text-slate-900 font-bold block mt-0.5">Circuit: 6,300' AMSL</span>
              <span className="text-[10px] text-slate-500">
                VFR light aircraft & glider circuit
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] font-bold">RAND AIRPORT (FAGM)</span>
              <span className="text-slate-900 font-bold block mt-0.5">Circuit: 6,500' AMSL</span>
              <span className="text-[10px] text-slate-500">
                Training circuit 1,000' AGL
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-200/80 text-[11px] text-slate-600 leading-relaxed font-sans">
            <p className="font-semibold text-sky-900 mb-1">
              Thermodynamic Espy LCL Formula:
            </p>
            <p>
              Calculated using Hennig-Espy’s Lifted Condensation Level:{' '}
              <code className="px-1.5 py-0.5 bg-white rounded border border-sky-200 font-mono text-slate-800">
                Base (ft AGL) ≈ (Temperature - Dew Point) × 400
              </code>
              . With Boksburg surface temperature at {current.temperature.toFixed(1)}°C and dew point at{' '}
              {data.dewPoint}°C (spread {data.spread}°C), convective cumulus condensation begins at{' '}
              <strong>{data.baseFtAgl.toLocaleString()} ft AGL</strong> ({data.baseFtAmsl.toLocaleString()} ft AMSL).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
