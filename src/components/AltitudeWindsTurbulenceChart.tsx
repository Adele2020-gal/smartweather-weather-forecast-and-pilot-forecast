import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import {
  Wind,
  Activity,
  AlertTriangle,
  Layers,
  Thermometer,
  ShieldCheck,
  Compass,
  ArrowUpRight,
  Info,
  Maximize2,
  Minimize2,
  Gauge,
  Sparkles,
  Zap,
} from 'lucide-react';
import { AltitudeWeatherProfilePoint } from '../types';

interface AltitudeWindsTurbulenceChartProps {
  profile: AltitudeWeatherProfilePoint[];
  freezingLevelFt: number;
  densityAltitudeFt: number;
  aerodromeIcao: string;
  aircraftType?: 'light_ga' | 'turboprop' | 'jet' | 'drone';
}

type AltitudeRangeFilter = 'all' | 'terminal' | 'cruise';

export const AltitudeWindsTurbulenceChart: React.FC<AltitudeWindsTurbulenceChartProps> = ({
  profile,
  freezingLevelFt,
  densityAltitudeFt,
  aerodromeIcao,
  aircraftType = 'light_ga',
}) => {
  const [rangeFilter, setRangeFilter] = useState<AltitudeRangeFilter>('all');
  const [showGusts, setShowGusts] = useState<boolean>(true);
  const [showSevereThreshold, setShowSevereThreshold] = useState<boolean>(true);
  const [showTable, setShowTable] = useState<boolean>(false);
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);

  // Filtered dataset according to user selection
  const filteredData = useMemo(() => {
    if (rangeFilter === 'terminal') {
      return profile.filter((p) => p.altitudeFt <= 12000);
    }
    if (rangeFilter === 'cruise') {
      return profile.filter((p) => p.altitudeFt >= 12000);
    }
    return profile;
  }, [profile, rangeFilter]);

  // Derived statistics
  const maxWindPoint = useMemo(() => {
    return profile.reduce((max, curr) => (curr.windSpeedKts > max.windSpeedKts ? curr : max), profile[0]);
  }, [profile]);

  const maxShearPoint = useMemo(() => {
    return profile.reduce((max, curr) => (curr.windShearKtsPer1000Ft > max.windShearKtsPer1000Ft ? curr : max), profile[0]);
  }, [profile]);

  const peakTurbulencePoint = useMemo(() => {
    return profile.reduce((max, curr) => (curr.turbulencePotential > max.turbulencePotential ? curr : max), profile[0]);
  }, [profile]);

  // Custom Recharts Tooltip for Pilots
  const CustomAviationTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: AltitudeWeatherProfilePoint = payload[0].payload;
      const isSevere = data.turbulencePotential >= 60;
      const isModerate = data.turbulencePotential >= 40 && data.turbulencePotential < 60;

      return (
        <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-xs w-72 sm:w-80 pointer-events-none z-50">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 font-mono font-bold text-xs border border-sky-500/40">
                {data.flightLevel}
              </span>
              <span className="text-white font-bold text-sm font-mono">
                {data.altitudeLabel}
              </span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black uppercase ${
                isSevere
                  ? 'bg-rose-500/30 text-rose-300 border border-rose-500/60'
                  : isModerate
                  ? 'bg-amber-500/30 text-amber-300 border border-amber-500/60'
                  : 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/60'
              }`}
            >
              {data.turbulenceCategory} TURB
            </span>
          </div>

          {/* Primary Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 mb-2.5">
            <div className="bg-slate-800/80 rounded-xl p-2 border border-slate-700/60">
              <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
                <Wind className="w-3 h-3 text-sky-400" />
                <span>WIND ALOFT</span>
              </div>
              <div className="text-sm font-mono font-bold text-sky-300 mt-0.5">
                {data.windSpeedKts} kts
                <span className="text-[11px] text-slate-400 font-normal ml-1">
                  ({String(data.windDirectionDeg).padStart(3, '0')}°)
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Gusts: {data.windGustKts} kts
              </div>
            </div>

            <div className="bg-slate-800/80 rounded-xl p-2 border border-slate-700/60">
              <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
                <Activity className="w-3 h-3 text-amber-400" />
                <span>TURB POTENTIAL</span>
              </div>
              <div
                className={`text-sm font-mono font-bold mt-0.5 ${
                  isSevere ? 'text-rose-400' : isModerate ? 'text-amber-300' : 'text-emerald-400'
                }`}
              >
                {data.turbulencePotential}%
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                EDR: {data.edrValue} m²/³s⁻¹
              </div>
            </div>
          </div>

          {/* Temperature & Vertical Shear */}
          <div className="grid grid-cols-2 gap-2 mb-2.5 text-[11px] font-mono">
            <div className="flex items-center justify-between bg-slate-800/50 px-2 py-1 rounded-lg border border-slate-700/40">
              <span className="text-slate-400 flex items-center gap-1">
                <Thermometer className="w-3 h-3 text-cyan-400" />
                OAT Temp:
              </span>
              <span className={`font-bold ${data.airTempC <= 0 ? 'text-cyan-300' : 'text-amber-300'}`}>
                {data.airTempC > 0 ? `+${data.airTempC}` : data.airTempC}°C
              </span>
            </div>
            <div className="flex items-center justify-between bg-slate-800/50 px-2 py-1 rounded-lg border border-slate-700/40">
              <span className="text-slate-400 flex items-center gap-1">
                <Gauge className="w-3 h-3 text-indigo-400" />
                Vert Shear:
              </span>
              <span className="font-bold text-slate-200">
                {data.windShearKtsPer1000Ft} kt/1k
              </span>
            </div>
          </div>

          {/* Layer Description & Hazard */}
          <div className="space-y-1.5 pt-1 border-t border-slate-800">
            <div className="text-[11px] text-slate-300 font-sans leading-snug">
              <strong className="text-slate-100 font-mono text-[10px] uppercase block text-sky-300">
                ATMOSPHERIC LAYER:
              </strong>
              {data.layerDescription}
            </div>

            <div className="text-[11px] text-amber-200/90 font-sans leading-snug bg-amber-950/40 border border-amber-800/50 p-2 rounded-xl">
              <div className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase text-amber-400 mb-0.5">
                <AlertTriangle className="w-3 h-3" />
                <span>PRIMARY HAZARD:</span>
              </div>
              {data.hazardType}
            </div>

            <div className="text-[10px] text-slate-400 font-mono italic">
              Pilot Advisory: {data.recommendedAction}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Header Bar */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse shadow-[0_0_10px_rgba(56,189,248,0.8)]" />
            <span className="text-xs font-mono font-bold uppercase text-sky-400 tracking-wider">
              HIGHVELD ATMOSPHERIC SOUNDING & ALOFT MODEL
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
              {aerodromeIcao} TERMINAL COLUMN
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Altitude Wind Speeds & Turbulence Potential Profile</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Continuous vertical gradient from Highveld surface (5,550 ft) to upper subtropical jet core (FL390)
          </p>
        </div>

        {/* Filter & Display Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Range Filter Pills */}
          <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setRangeFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[11px] transition-all ${
                rangeFilter === 'all'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ALL (SFC-FL390)
            </button>
            <button
              onClick={() => setRangeFilter('terminal')}
              className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[11px] transition-all ${
                rangeFilter === 'terminal'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              TMA (SFC-12k)
            </button>
            <button
              onClick={() => setRangeFilter('cruise')}
              className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[11px] transition-all ${
                rangeFilter === 'cruise'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              CRUISE (FL150+)
            </button>
          </div>

          {/* Toggle Gusts & Thresholds */}
          <button
            onClick={() => setShowGusts((prev) => !prev)}
            title="Toggle Wind Gust envelope on chart"
            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-mono font-bold transition-all flex items-center gap-1.5 ${
              showGusts
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-300'
            }`}
          >
            <Wind className="w-3 h-3" />
            <span>Gusts {showGusts ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setShowSevereThreshold((prev) => !prev)}
            title="Toggle Severe Turbulence (60%) hazard threshold"
            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-mono font-bold transition-all flex items-center gap-1.5 ${
              showSevereThreshold
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-300'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Warning Line</span>
          </button>

          <button
            onClick={() => setShowTable((prev) => !prev)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-3 h-3" />
            <span>{showTable ? 'Hide Matrix' : 'Data Matrix'}</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4 relative z-10">
        {/* Peak Wind Aloft */}
        <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase mb-1">
            <span>PEAK WIND ALOFT</span>
            <Wind className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-base font-bold font-mono text-white">
            {maxWindPoint.windSpeedKts} kts
            <span className="text-xs text-sky-300 font-normal ml-1">@{maxWindPoint.flightLevel}</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            Direction: {String(maxWindPoint.windDirectionDeg).padStart(3, '0')}° • Gusts {maxWindPoint.windGustKts}k
          </div>
        </div>

        {/* Max Wind Shear Gradient */}
        <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase mb-1">
            <span>MAX VERTICAL SHEAR</span>
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-base font-bold font-mono text-amber-300">
            {maxShearPoint.windShearKtsPer1000Ft} kt/1k ft
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            Layer: {maxShearPoint.flightLevel} ({maxShearPoint.altitudeLabel})
          </div>
        </div>

        {/* Peak Turbulence Zone */}
        <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase mb-1">
            <span>PEAK TURBULENCE RISK</span>
            <Activity className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div
            className={`text-base font-bold font-mono ${
              peakTurbulencePoint.turbulencePotential >= 60 ? 'text-rose-400' : 'text-amber-300'
            }`}
          >
            {peakTurbulencePoint.turbulencePotential}% ({peakTurbulencePoint.turbulenceCategory})
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            EDR: {peakTurbulencePoint.edrValue} @ {peakTurbulencePoint.flightLevel}
          </div>
        </div>

        {/* Freezing Level Isotherm */}
        <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase mb-1">
            <span>0°C FREEZING LEVEL</span>
            <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-base font-bold font-mono text-cyan-300">
            {freezingLevelFt.toLocaleString()} ft AMSL
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            Approx. FL{Math.round(freezingLevelFt / 1000) * 10} • Icing boundary
          </div>
        </div>
      </div>

      {/* Main Recharts Graph Visualizer */}
      <div className="relative z-10 bg-slate-950/60 rounded-2xl border border-slate-800/90 p-3 sm:p-4 mb-3">
        {/* Chart Legend & Units Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs mb-3 font-mono">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-sky-400 rounded-full" />
              <span className="text-sky-300 font-bold">Wind Speed (Knots)</span>
            </div>
            {showGusts && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-b border-dashed border-sky-300" />
                <span className="text-sky-200/70">Wind Gusts Aloft</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-gradient-to-r from-amber-400 to-rose-500 rounded-full" />
              <span className="text-amber-400 font-bold">Turbulence Potential (%)</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400" />
            <span>Cyan Line = Freezing Isotherm (FL150)</span>
          </div>
        </div>

        {/* Recharts Container with explicit height */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={filteredData}
              margin={{ top: 15, right: 12, left: -8, bottom: 5 }}
              onMouseMove={(state: any) => {
                if (state && state.activeTooltipIndex !== undefined) {
                  setActivePointIndex(state.activeTooltipIndex);
                }
              }}
              onMouseLeave={() => setActivePointIndex(null)}
            >
              <defs>
                {/* Wind Speed Area Gradient */}
                <linearGradient id="windSpeedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.02} />
                </linearGradient>

                {/* Turbulence Potential Gradient */}
                <linearGradient id="turbGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.45} />

              {/* X-Axis: Flight Levels & Altitudes */}
              <XAxis
                dataKey="flightLevel"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontFamily: 'monospace' }}
              />

              {/* Left Y-Axis: Wind Speed (kts) */}
              <YAxis
                yAxisId="wind"
                stroke="#0284c7"
                fontSize={11}
                tickLine={false}
                tick={{ fill: '#38bdf8', fontFamily: 'monospace' }}
                domain={[0, (dataMax: number) => Math.ceil((dataMax + 15) / 10) * 10]}
                unit=" kt"
              />

              {/* Right Y-Axis: Turbulence Potential (%) */}
              <YAxis
                yAxisId="turb"
                orientation="right"
                stroke="#f59e0b"
                fontSize={11}
                tickLine={false}
                tick={{ fill: '#fbbf24', fontFamily: 'monospace' }}
                domain={[0, 100]}
                unit="%"
              />

              <Tooltip content={<CustomAviationTooltip />} />

              {/* Severe Warning Reference Line at 60% */}
              {showSevereThreshold && (
                <ReferenceLine
                  yAxisId="turb"
                  y={60}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: 'SEVERE TURBULENCE THRESHOLD (60%)',
                    position: 'insideTopRight',
                    fill: '#f87171',
                    fontSize: 10,
                    fontFamily: 'monospace',
                  }}
                />
              )}

              {/* Freezing Level Reference Line (FL150) if present in view */}
              <ReferenceLine
                x="FL150"
                stroke="#22d3ee"
                strokeDasharray="3 3"
                strokeWidth={1.5}
                label={{
                  value: '0°C ISOTHERM',
                  position: 'insideTopLeft',
                  fill: '#22d3ee',
                  fontSize: 10,
                  fontFamily: 'monospace',
                }}
              />

              {/* Area fill under Wind Speed */}
              <Area
                yAxisId="wind"
                type="monotone"
                dataKey="windSpeedKts"
                fill="url(#windSpeedGradient)"
                stroke="none"
              />

              {/* Area fill under Turbulence */}
              <Area
                yAxisId="turb"
                type="monotone"
                dataKey="turbulencePotential"
                fill="url(#turbGradient)"
                stroke="none"
              />

              {/* Wind Gusts Line (Optional) */}
              {showGusts && (
                <Line
                  yAxisId="wind"
                  type="monotone"
                  dataKey="windGustKts"
                  stroke="#7dd3fc"
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={{ r: 4, stroke: '#38bdf8', strokeWidth: 1.5, fill: '#0369a1' }}
                  name="Wind Gusts Aloft (kts)"
                />
              )}

              {/* Primary Wind Speed Line */}
              <Line
                yAxisId="wind"
                type="monotone"
                dataKey="windSpeedKts"
                stroke="#0284c7"
                strokeWidth={3}
                dot={{ r: 4, fill: '#38bdf8', stroke: '#0369a1', strokeWidth: 1.5 }}
                activeDot={{ r: 7, fill: '#38bdf8', stroke: '#ffffff', strokeWidth: 2 }}
                name="Sustained Wind Speed (kts)"
              />

              {/* Turbulence Potential Line */}
              <Line
                yAxisId="turb"
                type="monotone"
                dataKey="turbulencePotential"
                stroke="#f59e0b"
                strokeWidth={2.8}
                dot={{ r: 4, fill: '#fbbf24', stroke: '#b45309', strokeWidth: 1.5 }}
                activeDot={{ r: 7, fill: '#ef4444', stroke: '#ffffff', strokeWidth: 2 }}
                name="Turbulence Potential (%)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend Explanations */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800 text-[11px] font-sans text-slate-400">
          <div className="flex items-start gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-400 mt-1 shrink-0" />
            <div>
              <strong className="text-slate-200">Veering Wind Vector:</strong> Surface wind turns clockwise with altitude due to Coriolis effect and friction reduction aloft.
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 mt-1 shrink-0" />
            <div>
              <strong className="text-slate-200">Highveld Thermal Inversion:</strong> Diurnal heating creates boundary turbulence below 9,500 ft (FL095).
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0" />
            <div>
              <strong className="text-slate-200">Jet Stream Shear (FL300-FL340):</strong> High vertical wind shear creates severe Clear Air Turbulence (CAT) hazards.
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Altitude Sounding Table / Matrix */}
      {showTable && (
        <div className="relative z-10 mt-3 pt-3 border-t border-slate-800 overflow-x-auto">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Full Altitude Sounding & Vertical Shear Matrix</span>
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">
              Computed for Highveld Elevation (5,550 ft)
            </span>
          </div>

          <table className="w-full text-left text-xs font-mono border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-400">
                <th className="py-2 px-2.5">Level / Alt</th>
                <th className="py-2 px-2.5">Wind Vector</th>
                <th className="py-2 px-2.5">Gusts</th>
                <th className="py-2 px-2.5">OAT Temp</th>
                <th className="py-2 px-2.5">Vert Shear</th>
                <th className="py-2 px-2.5">Turbulence & EDR</th>
                <th className="py-2 px-2.5">Layer & Operational Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredData.map((pt, idx) => {
                const isCrit = pt.turbulencePotential >= 60;
                const isWarn = pt.turbulencePotential >= 40 && pt.turbulencePotential < 60;

                return (
                  <tr
                    key={pt.flightLevel}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      activePointIndex === idx ? 'bg-sky-900/20' : ''
                    }`}
                  >
                    <td className="py-2 px-2.5 font-bold text-white">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-sky-300 text-[10px]">
                          {pt.flightLevel}
                        </span>
                        <span className="text-[11px] text-slate-300">{pt.altitudeLabel.split(' ')[0]}</span>
                      </div>
                    </td>

                    <td className="py-2 px-2.5 font-bold text-sky-300">
                      <div className="flex items-center gap-1">
                        <Compass
                          className="w-3.5 h-3.5 text-sky-400 shrink-0"
                          style={{ transform: `rotate(${pt.windDirectionDeg}deg)` }}
                        />
                        <span>{String(pt.windDirectionDeg).padStart(3, '0')}° @ {pt.windSpeedKts} kt</span>
                      </div>
                    </td>

                    <td className="py-2 px-2.5 text-slate-300">
                      {pt.windGustKts} kts
                    </td>

                    <td className="py-2 px-2.5 font-semibold">
                      <span className={pt.airTempC <= 0 ? 'text-cyan-300' : 'text-amber-300'}>
                        {pt.airTempC > 0 ? `+${pt.airTempC}` : pt.airTempC}°C
                      </span>
                    </td>

                    <td className="py-2 px-2.5 text-slate-300">
                      {pt.windShearKtsPer1000Ft} kt/1k ft
                    </td>

                    <td className="py-2 px-2.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            isCrit
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : isWarn
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {pt.turbulencePotential}%
                        </span>
                        <span className="text-[10px] text-slate-400">EDR {pt.edrValue}</span>
                      </div>
                    </td>

                    <td className="py-2 px-2.5 text-[11px] text-slate-300 font-sans max-w-xs truncate" title={pt.hazardType}>
                      <span className="text-slate-200 font-semibold">{pt.hazardType.split(';')[0]}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pilot Action Summary Banner */}
      <div className="relative z-10 mt-3 p-3 rounded-xl bg-gradient-to-r from-sky-950/60 to-blue-950/60 border border-sky-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0" />
          <div className="text-xs font-sans text-slate-300">
            <strong className="text-white font-mono uppercase text-[11px] block text-sky-300">
              OPTIMAL CRUISE FLIGHT LEVEL ADVISORY:
            </strong>
            Smooth laminar airflow modeled between <strong className="text-emerald-300 font-mono">FL240 - FL280</strong>. High CAT shear present above FL300 near jet core.
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-sky-900/60 text-sky-200 border border-sky-700/60">
            ICAO ANNEX 3 / WMO SPEC
          </span>
        </div>
      </div>
    </div>
  );
};
