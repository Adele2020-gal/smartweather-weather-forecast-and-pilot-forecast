import React, { useState, useMemo, useRef } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Wind,
  Layers,
  MapPin,
  Compass,
  Radio,
  Flame,
  Activity,
  Zap,
  Info,
  ChevronRight,
  Sparkles,
  Gauge,
  Thermometer,
  RotateCcw,
  Sliders,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Target,
  Maximize2,
  Crosshair,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import {
  WeatherData,
  ExtremeWeatherEvent,
  DroneNoFlyZone,
  DroneTurbulenceHotspot,
  DroneWeightCategory,
} from '../types';
import {
  BOKSBURG_CENTER,
  BOKSBURG_DRONE_NO_FLY_ZONES,
  BOKSBURG_TURBULENCE_HOTSPOTS_SEED,
  evaluateDroneFlightSafety,
  checkPointAirspaceInBoksburg,
  PointAirspaceCheckResult,
} from '../utils/droneSafetyEngine';

interface DroneFlightSafetyOverlayProps {
  currentWeather: WeatherData;
  extremeState?: ExtremeWeatherEvent | null;
}

export const DroneFlightSafetyOverlay: React.FC<DroneFlightSafetyOverlayProps> = ({
  currentWeather,
  extremeState,
}) => {
  // Drone category selection
  const [droneCategory, setDroneCategory] = useState<DroneWeightCategory>('micro_250g');

  // Layer toggles
  const [showNfz, setShowNfz] = useState<boolean>(true);
  const [showTurbulenceHotspots, setShowTurbulenceHotspots] = useState<boolean>(true);
  const [showAglCeilings, setShowAglCeilings] = useState<boolean>(true);
  const [showEmiZones, setShowEmiZones] = useState<boolean>(true);

  // Selected Zone / Hotspot
  const [selectedNfz, setSelectedNfz] = useState<DroneNoFlyZone | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<DroneTurbulenceHotspot | null>(null);

  // Interactive Clicked Coordinate Inspector (Defaulted to Boksburg CBD)
  const [inspectedPoint, setInspectedPoint] = useState<{ lat: number; lng: number }>({
    lat: BOKSBURG_CENTER.lat,
    lng: BOKSBURG_CENTER.lng,
  });

  // Radar Zoom & Pan State
  const [radarZoom, setRadarZoom] = useState<number>(1.1);
  const [radarPan, setRadarPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Maps API Key state
  const [mapsApiKey, setMapsApiKey] = useState<string>('');
  const [hasMapsKey, setHasMapsKey] = useState<boolean>(false);
  const [mapMode, setMapMode] = useState<'radar' | 'google'>('radar');

  // Load Maps API Key
  React.useEffect(() => {
    fetch('/api/maps/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.hasMapsKey && data.mapsApiKey) {
          setHasMapsKey(true);
          setMapsApiKey(data.mapsApiKey);
          setMapMode('google');
        }
      })
      .catch(() => {});
  }, []);

  // Compute safety assessment and dynamic hotspots
  const { assessment, hotspots, noFlyZones } = useMemo(() => {
    return evaluateDroneFlightSafety(currentWeather, extremeState, droneCategory);
  }, [currentWeather, extremeState, droneCategory]);

  // Point check at inspected coordinate
  const pointCheckResult: PointAirspaceCheckResult = useMemo(() => {
    return checkPointAirspaceInBoksburg(
      inspectedPoint.lat,
      inspectedPoint.lng,
      hotspots,
      noFlyZones
    );
  }, [inspectedPoint, hotspots, noFlyZones]);

  // Radar coordinate conversion: 1 deg lat ~ 111km, 1 deg lng ~ 99km at -26°
  const mapCenter = { lat: -26.213, lng: 28.256 };
  const radarScale = 22 * radarZoom; // pixels per km
  const radarWidth = 650;
  const radarHeight = 440;

  const latLngToRadarXY = (lat: number, lng: number) => {
    const dLatKm = (lat - mapCenter.lat) * 111;
    const dLngKm = (lng - mapCenter.lng) * 99;
    // Y is inverted (North is up)
    const x = radarWidth / 2 + dLngKm * radarScale + radarPan.x;
    const y = radarHeight / 2 - dLatKm * radarScale + radarPan.y;
    return { x, y };
  };

  const radarXYToLatLng = (x: number, y: number) => {
    const dLngKm = (x - radarWidth / 2 - radarPan.x) / radarScale;
    const dLatKm = -(y - radarHeight / 2 - radarPan.y) / radarScale;
    const lat = mapCenter.lat + dLatKm / 111;
    const lng = mapCenter.lng + dLngKm / 99;
    return { lat, lng };
  };

  const handleRadarClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const coords = radarXYToLatLng(clickX, clickY);
    setInspectedPoint({
      lat: Number(coords.lat.toFixed(4)),
      lng: Number(coords.lng.toFixed(4)),
    });
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 p-4 sm:p-7 shadow-2xl relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Header Bar */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-mono font-bold uppercase text-amber-400 tracking-wider">
              SACAA CAR PART 101 COMPLIANCE & SAFETY RADAR
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              BOKSBURG & EAST RAND CTR
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Drone & sUAS Flight Safety Overlay</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Real-time no-fly zones (NFZs), hospital heliport corridors, prison buffers, Highveld density altitude lift penalties, and localized micro-turbulence rotors across Boksburg.
          </p>
        </div>

        {/* Map Mode Switcher (if Google Maps API Key is available) */}
        <div className="flex items-center gap-2">
          {hasMapsKey && (
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-mono">
              <button
                onClick={() => setMapMode('google')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  mapMode === 'google'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Google Maps
              </button>
              <button
                onClick={() => setMapMode('radar')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  mapMode === 'radar'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tactical GIS
              </button>
            </div>
          )}

          <div className="px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-[11px] font-mono text-slate-300 flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Highveld Base: 5,250 ft</span>
          </div>
        </div>
      </div>

      {/* Drone Category Selector Tabs */}
      <div className="relative z-10 my-4 p-1.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 px-2 font-bold">
            sUAS Aircraft Category:
          </span>
          {[
            { id: 'micro_250g', label: 'Micro (<250g)', desc: 'DJI Mini / Avata' },
            { id: 'standard_2kg', label: 'Standard (<2kg)', desc: 'DJI Air / Mavic 3' },
            { id: 'commercial_25kg', label: 'Commercial (2-25kg)', desc: 'Matrice / Wingtra' },
            { id: 'fpv', label: 'FPV / Racing', desc: 'Custom Freestyle' },
          ].map((cat) => {
            const isSelected = droneCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setDroneCategory(cat.id as DroneWeightCategory)}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] ${isSelected ? 'text-slate-900/80' : 'text-slate-500'}`}>
                  • {cat.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* Status Pill */}
        <div className="px-3 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-2">
          {assessment.overallStatus === 'GO_SAFE' && (
            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" />
              <span>GO: SAFE TO FLY</span>
            </span>
          )}
          {assessment.overallStatus === 'CAUTION_ADVISORY' && (
            <span className="flex items-center gap-1.5 text-amber-300 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/30">
              <AlertTriangle className="w-4 h-4" />
              <span>CAUTION: TURBULENCE ADVISORY</span>
            </span>
          )}
          {assessment.overallStatus === 'NO_GO_GROUNDED' && (
            <span className="flex items-center gap-1.5 text-rose-400 bg-rose-500/10 px-3 py-1 rounded-xl border border-rose-500/30 animate-pulse">
              <ShieldAlert className="w-4 h-4" />
              <span>NO-GO: GROUND DRONES</span>
            </span>
          )}
        </div>
      </div>

      {/* Safety Matrix Cards: Wind, Density Alt, Hotspots */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {/* Card 1: Wind & Gust Status */}
        <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-400 mb-1">
            <span className="flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-sky-400" />
              WIND & GUST TOLERANCE
            </span>
            <span className={assessment.windStatus.isExceeded ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
              {assessment.windStatus.isExceeded ? 'EXCEEDED' : 'WITHIN LIMITS'}
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-white">
            {assessment.windStatus.speedKts} kts
            <span className="text-xs text-slate-400 font-normal ml-1">
              (Gusts: {assessment.windStatus.gustKts} kts)
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            Aircraft Max: {assessment.windStatus.limitKts} kts sustained
          </div>
        </div>

        {/* Card 2: Highveld Density Altitude Penalty */}
        <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-400 mb-1">
            <span className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              HIGHVELD DENSITY ALTITUDE
            </span>
            <span className="text-amber-400 font-mono font-bold">
              {assessment.densityAltitudeImpact.densityAltFt.toLocaleString()} ft
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-amber-300">
            -{assessment.densityAltitudeImpact.batteryPenaltyPercent}% Battery Life
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            Propeller thrust loss: ~{assessment.densityAltitudeImpact.liftLossPercent}% vs Sea Level
          </div>
        </div>

        {/* Card 3: Local Turbulence Rating */}
        <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-400 mb-1">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-rose-400" />
              MICRO-TURBULENCE INDEX
            </span>
            <span className="text-xs font-mono font-bold text-rose-400">
              {assessment.turbulenceRiskScore}/100
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-rose-300">
            {assessment.turbulenceRiskScore >= 70
              ? 'High Boundary Shear'
              : assessment.turbulenceRiskScore >= 45
              ? 'Moderate Slimes Rotors'
              : 'Light Thermal Updrafts'}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            Active micro-weather hotspots: {assessment.activeHazardsCount}
          </div>
        </div>

        {/* Card 4: SACAA Part 101 Compliance Limit */}
        <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-400 mb-1">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              MAX LEGAL AGL CEILING
            </span>
            <span className="text-indigo-300 font-mono font-bold">SACAA RULE</span>
          </div>
          <div className="text-lg font-bold font-mono text-indigo-300">
            400 ft (120 m) AGL
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            Visual Line of Sight (VLOS) mandatory
          </div>
        </div>
      </div>

      {/* Main Map & Interactive Airspace Inspector Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 relative z-10">
        {/* Map Visualization Column (2 cols on large screens) */}
        <div className="lg:col-span-2 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden relative shadow-inner">
          {/* Map Controls Header */}
          <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px] uppercase">Layer Overlays:</span>
              <button
                onClick={() => setShowNfz((v) => !v)}
                className={`px-2 py-1 rounded-lg border text-[11px] transition-all flex items-center gap-1 ${
                  showNfz
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                <span>No-Fly Zones</span>
              </button>
              <button
                onClick={() => setShowTurbulenceHotspots((v) => !v)}
                className={`px-2 py-1 rounded-lg border text-[11px] transition-all flex items-center gap-1 ${
                  showTurbulenceHotspots
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                <span>Turbulence Hotspots</span>
              </button>
              <button
                onClick={() => setShowEmiZones((v) => !v)}
                className={`px-2 py-1 rounded-lg border text-[11px] transition-all flex items-center gap-1 ${
                  showEmiZones
                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40 font-bold'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                <span>Eskom EMI Grid</span>
              </button>
            </div>

            {/* Radar Zoom Controls */}
            {mapMode === 'radar' && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setRadarZoom((z) => Math.min(2.0, z + 0.2))}
                  className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold"
                  title="Zoom In"
                >
                  +
                </button>
                <button
                  onClick={() => setRadarZoom((z) => Math.max(0.7, z - 0.2))}
                  className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold"
                  title="Zoom Out"
                >
                  -
                </button>
                <button
                  onClick={() => {
                    setRadarZoom(1.1);
                    setRadarPan({ x: 0, y: 0 });
                  }}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                  title="Reset View"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Radar / GIS Interactive Canvas */}
          {mapMode === 'radar' ? (
            <div className="relative w-full h-[450px] bg-slate-950 cursor-crosshair select-none overflow-hidden">
              {/* Instructions banner */}
              <div className="absolute top-2 left-2 z-20 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-sm border border-slate-700/60 text-[10px] font-mono text-slate-300 flex items-center gap-1.5 pointer-events-none">
                <Crosshair className="w-3 h-3 text-amber-400" />
                <span>Click map to inspect any Boksburg coordinate</span>
              </div>

              {/* Coordinate readout */}
              <div className="absolute top-2 right-2 z-20 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-sm border border-slate-700/60 text-[10px] font-mono text-slate-300 pointer-events-none">
                Inspecting: {inspectedPoint.lat.toFixed(4)}°, {inspectedPoint.lng.toFixed(4)}°
              </div>

              <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${radarWidth} ${radarHeight}`}
                className="w-full h-full"
                onClick={handleRadarClick}
              >
                <defs>
                  {/* Grid pattern */}
                  <pattern id="radarGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.8" opacity="0.6" />
                  </pattern>

                  {/* FAOR CTR Radial Gradient */}
                  <radialGradient id="faorGradient">
                    <stop offset="60%" stopColor="#f43f5e" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.32" />
                  </radialGradient>

                  {/* Turbulence Hazard Gradient */}
                  <radialGradient id="turbHazardGradient">
                    <stop offset="30%" stopColor="#f59e0b" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
                  </radialGradient>
                </defs>

                {/* Grid Background */}
                <rect width="100%" height="100%" fill="url(#radarGrid)" />

                {/* Range Rings from Boksburg Center (5km, 10km, 15km) */}
                {[5, 10, 15].map((km) => {
                  const centerXY = latLngToRadarXY(BOKSBURG_CENTER.lat, BOKSBURG_CENTER.lng);
                  const radiusPx = km * radarScale;
                  return (
                    <g key={km}>
                      <circle
                        cx={centerXY.x}
                        cy={centerXY.y}
                        r={radiusPx}
                        fill="none"
                        stroke="#334155"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                        opacity="0.5"
                      />
                      <text
                        x={centerXY.x + radiusPx + 4}
                        y={centerXY.y - 4}
                        fill="#475569"
                        fontSize="9"
                        fontFamily="monospace"
                      >
                        {km} km
                      </text>
                    </g>
                  );
                })}

                {/* 1. NO-FLY ZONES (NFZs) */}
                {showNfz &&
                  noFlyZones.map((nfz) => {
                    const pos = latLngToRadarXY(nfz.centerLat, nfz.centerLng);
                    const radiusPx = nfz.radiusKm * radarScale;
                    const isSelected = selectedNfz?.id === nfz.id;
                    const isStrict = nfz.restrictionLevel === 'STRICT_PROHIBITED';

                    return (
                      <g
                        key={nfz.id}
                        className="cursor-pointer transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNfz(nfz);
                          setSelectedHotspot(null);
                        }}
                      >
                        {/* Shaded restriction area */}
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={radiusPx}
                          fill={isStrict ? '#ef4444' : '#f59e0b'}
                          fillOpacity={isSelected ? 0.28 : 0.12}
                          stroke={isStrict ? '#ef4444' : '#f59e0b'}
                          strokeWidth={isSelected ? 2.5 : 1.5}
                          strokeDasharray={isStrict ? 'none' : '5 4'}
                        />

                        {/* Zone center pin */}
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={4}
                          fill={isStrict ? '#f43f5e' : '#f59e0b'}
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />

                        {/* Label */}
                        <text
                          x={pos.x + 6}
                          y={pos.y - 6}
                          fill={isStrict ? '#f87171' : '#fbbf24'}
                          fontSize="10"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {nfz.name.split('(')[0]}
                        </text>
                      </g>
                    );
                  })}

                {/* 2. LOCAL MICRO-TURBULENCE HOTSPOTS */}
                {showTurbulenceHotspots &&
                  hotspots.map((spot) => {
                    const pos = latLngToRadarXY(spot.centerLat, spot.centerLng);
                    const radiusPx = spot.radiusKm * radarScale;
                    const isSelected = selectedHotspot?.id === spot.id;

                    return (
                      <g
                        key={spot.id}
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedHotspot(spot);
                          setSelectedNfz(null);
                        }}
                      >
                        {/* Hazard glow */}
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={radiusPx}
                          fill="url(#turbHazardGradient)"
                          stroke="#f59e0b"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                        />

                        {/* Center Rotor icon indicator */}
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={5}
                          fill="#f59e0b"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />

                        <text
                          x={pos.x + 7}
                          y={pos.y + 12}
                          fill="#fbbf24"
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          {spot.name.split(' ')[0]} ({spot.turbulenceIntensity})
                        </text>
                      </g>
                    );
                  })}

                {/* 3. BOKSBURG CBD REFERENCE MARKER */}
                {(() => {
                  const pos = latLngToRadarXY(BOKSBURG_CENTER.lat, BOKSBURG_CENTER.lng);
                  return (
                    <g>
                      <circle cx={pos.x} cy={pos.y} r={6} fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                      <text
                        x={pos.x + 8}
                        y={pos.y + 4}
                        fill="#38bdf8"
                        fontSize="11"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        BOKSBURG CBD (Elev 5,250 ft)
                      </text>
                    </g>
                  );
                })()}

                {/* 4. USER INSPECTED COORDINATE TARGET RETICLE */}
                {(() => {
                  const pos = latLngToRadarXY(inspectedPoint.lat, inspectedPoint.lng);
                  const isRed = pointCheckResult.clearanceStatus === 'PROHIBITED_RED';
                  const isAmber = pointCheckResult.clearanceStatus === 'AUTHORIZATION_AMBER';
                  const color = isRed ? '#ef4444' : isAmber ? '#f59e0b' : '#10b981';

                  return (
                    <g>
                      {/* Reticle crosshairs */}
                      <circle cx={pos.x} cy={pos.y} r={12} fill="none" stroke={color} strokeWidth="1.5" />
                      <line x1={pos.x - 18} y1={pos.y} x2={pos.x + 18} y2={pos.y} stroke={color} strokeWidth="1.5" />
                      <line x1={pos.x} y1={pos.y - 18} x2={pos.x} y2={pos.y + 18} stroke={color} strokeWidth="1.5" />
                      <circle cx={pos.x} cy={pos.y} r={3} fill={color} />
                      <text
                        x={pos.x + 14}
                        y={pos.y - 10}
                        fill={color}
                        fontSize="10"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        INSPECTION TARGET
                      </text>
                    </g>
                  );
                })()}
              </svg>
            </div>
          ) : (
            /* Google Maps View (if API key available) */
            <div className="w-full h-[450px]">
              <APIProvider apiKey={mapsApiKey}>
                <Map
                  defaultCenter={{ lat: BOKSBURG_CENTER.lat, lng: BOKSBURG_CENTER.lng }}
                  defaultZoom={12}
                  mapId="boksburg_drone_safety_map"
                  className="w-full h-full"
                  onClick={(e) => {
                    if (e.detail?.latLng) {
                      setInspectedPoint({
                        lat: Number(e.detail.latLng.lat.toFixed(4)),
                        lng: Number(e.detail.latLng.lng.toFixed(4)),
                      });
                    }
                  }}
                >
                  {/* Boksburg CBD Marker */}
                  <AdvancedMarker position={{ lat: BOKSBURG_CENTER.lat, lng: BOKSBURG_CENTER.lng }}>
                    <div className="px-2 py-1 rounded-lg bg-sky-600 text-white font-mono text-[10px] font-bold border border-white shadow-lg">
                      Boksburg CBD
                    </div>
                  </AdvancedMarker>

                  {/* Target Marker */}
                  <AdvancedMarker position={{ lat: inspectedPoint.lat, lng: inspectedPoint.lng }}>
                    <div className="px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 font-mono text-xs font-bold border-2 border-white shadow-xl flex items-center gap-1">
                      <Target className="w-3.5 h-3.5" />
                      <span>Target Point</span>
                    </div>
                  </AdvancedMarker>

                  {/* NFZ Markers */}
                  {noFlyZones.map((nfz) => (
                    <AdvancedMarker
                      key={nfz.id}
                      position={{ lat: nfz.centerLat, lng: nfz.centerLng }}
                      onClick={() => setSelectedNfz(nfz)}
                    >
                      <div
                        className={`p-1.5 rounded-full border-2 border-white shadow-lg ${
                          nfz.restrictionLevel === 'STRICT_PROHIBITED' ? 'bg-rose-600' : 'bg-amber-500'
                        }`}
                      >
                        <ShieldAlert className="w-4 h-4 text-white" />
                      </div>
                    </AdvancedMarker>
                  ))}
                </Map>
              </APIProvider>
            </div>
          )}

          {/* Map Footer Legend */}
          <div className="p-3 bg-slate-900/95 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex flex-wrap items-center gap-4 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500 border border-rose-300" />
                <span className="text-rose-300">Strict No-Fly Zone (FAOR CTR / Prison)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-300" />
                <span className="text-amber-300">ATC Authorization Buffer (5km ATZ)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-200" />
                <span className="text-yellow-300">Micro-Turbulence Rotor Hotspot</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400">
              SACAA Part 101 / WGS-84 GIS Datum
            </div>
          </div>
        </div>

        {/* Airspace Inspection & Clearance Sidebar (1 col on large screens) */}
        <div className="space-y-4">
          {/* Target Clearance Result Card */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              pointCheckResult.clearanceStatus === 'PROHIBITED_RED'
                ? 'bg-rose-950/40 border-rose-500/50 text-rose-100'
                : pointCheckResult.clearanceStatus === 'AUTHORIZATION_AMBER'
                ? 'bg-amber-950/40 border-amber-500/50 text-amber-100'
                : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-100'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-2 mb-2.5 border-current/20">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4" />
                <span className="font-mono font-bold text-xs uppercase">
                  POINT CLEARANCE CHECK
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black uppercase ${
                  pointCheckResult.clearanceStatus === 'PROHIBITED_RED'
                    ? 'bg-rose-500 text-white'
                    : pointCheckResult.clearanceStatus === 'AUTHORIZATION_AMBER'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-emerald-500 text-slate-950'
                }`}
              >
                {pointCheckResult.clearanceStatus === 'PROHIBITED_RED'
                  ? 'NO-FLY ZONE (RED)'
                  : pointCheckResult.clearanceStatus === 'AUTHORIZATION_AMBER'
                  ? 'PERMIT REQ (AMBER)'
                  : 'CLEARED (GREEN)'}
              </span>
            </div>

            <div className="text-xs font-mono space-y-1.5">
              <div>
                <span className="text-slate-400">Coordinates: </span>
                <span className="font-bold text-white">
                  {pointCheckResult.latitude.toFixed(4)}°, {pointCheckResult.longitude.toFixed(4)}°
                </span>
              </div>
              <div>
                <span className="text-slate-400">Max Permitted Ceiling: </span>
                <span className="font-bold text-white">
                  {pointCheckResult.maxLegalAglFt > 0 ? `${pointCheckResult.maxLegalAglFt} ft AGL` : '0 ft (GROUNDED)'}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Closest NFZ Boundary: </span>
                <span className="font-bold text-white">
                  {pointCheckResult.closestNfz.zone.name} ({pointCheckResult.closestNfz.distanceKm.toFixed(1)} km)
                </span>
              </div>
              {pointCheckResult.closestTurbulenceHotspot && (
                <div>
                  <span className="text-slate-400">Turbulence Threat: </span>
                  <span className="font-bold text-amber-300">
                    {pointCheckResult.closestTurbulenceHotspot.hotspot.name} ({pointCheckResult.closestTurbulenceHotspot.distanceKm.toFixed(1)} km)
                  </span>
                </div>
              )}
            </div>

            <p className="text-[11px] font-sans mt-3 pt-2 border-t border-current/20 leading-relaxed">
              {pointCheckResult.sacaaSummary}
            </p>
          </div>

          {/* Selected Zone / Hotspot Detail Inspector */}
          {selectedNfz ? (
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase text-rose-400 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  NO-FLY ZONE INSPECTION
                </span>
                <button
                  onClick={() => setSelectedNfz(null)}
                  className="text-slate-400 hover:text-white font-mono text-[10px]"
                >
                  ✕ Close
                </button>
              </div>
              <h4 className="font-bold text-sm text-white">{selectedNfz.name}</h4>
              <p className="text-slate-300 text-[11px] leading-relaxed font-sans">{selectedNfz.description}</p>
              <div className="p-2 rounded-xl bg-slate-900 font-mono text-[10px] text-slate-400 space-y-1">
                <div>
                  <strong>SACAA Rule:</strong> {selectedNfz.sacaaRule}
                </div>
                <div>
                  <strong>Airspace Buffer Radius:</strong> {selectedNfz.radiusKm} km
                </div>
                <div>
                  <strong>Authority Contact:</strong> {selectedNfz.authorityContact || 'ATNS Tower'}
                </div>
              </div>
            </div>
          ) : selectedHotspot ? (
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase text-amber-400 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" />
                  TURBULENCE HOTSPOT
                </span>
                <button
                  onClick={() => setSelectedHotspot(null)}
                  className="text-slate-400 hover:text-white font-mono text-[10px]"
                >
                  ✕ Close
                </button>
              </div>
              <h4 className="font-bold text-sm text-amber-300">{selectedHotspot.name}</h4>
              <p className="text-slate-300 text-[11px] leading-relaxed font-sans">{selectedHotspot.impactOnsUAS}</p>
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 font-mono text-[10px] text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span>Updraft Velocity:</span>
                  <span className="font-bold text-amber-300">+{selectedHotspot.updraftVelocityMs} m/s</span>
                </div>
                <div className="flex justify-between">
                  <span>Eddy Dissipation (EDR):</span>
                  <span className="font-bold text-white">{selectedHotspot.edrValue} m²/³s⁻¹</span>
                </div>
                <div className="flex justify-between">
                  <span>Hazard Class:</span>
                  <span className="font-bold text-rose-400">{selectedHotspot.hazardType}</span>
                </div>
              </div>
              <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-700/50 text-amber-200 text-[10px] font-sans">
                <strong>Pilot Advice:</strong> {selectedHotspot.pilotAdvice}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 text-xs text-slate-400">
              <div className="flex items-center gap-2 text-slate-300 font-mono font-bold text-[11px] uppercase mb-1">
                <Info className="w-3.5 h-3.5 text-sky-400" />
                <span>Zone Selection Hint</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Click any circle on the radar map to view its detailed SACAA restriction rules, obstacle clearances, and localized micro-turbulence hazards.
              </p>
            </div>
          )}

          {/* SACAA Part 101 Operating Rules Card */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 text-xs">
            <h4 className="font-mono font-bold uppercase text-[11px] text-slate-300 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>SACAA Part 101 Rules for Boksburg</span>
            </h4>
            <ul className="space-y-1.5 text-[11px] text-slate-400 font-sans">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Max legal flight ceiling is <strong>400 ft (120 m) AGL</strong>.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-rose-400 font-bold">•</span>
                <span>Stay <strong>10 km clear</strong> of O.R. Tambo (FAOR) without ATC ROC.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-amber-400 font-bold">•</span>
                <span>Stay <strong>50 m clear</strong> of non-consenting persons and buildings.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-sky-400 font-bold">•</span>
                <span>Day VMC only unless certified for Night Operations.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
