import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Plane,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Wind,
  Layers,
  Play,
  Pause,
  RotateCcw,
  Search,
  Compass,
  Radio,
  ExternalLink,
  Info,
  Clock,
  ChevronRight,
  TrendingUp,
  MapPin,
  Flame,
  CloudRain,
  Eye,
  Sliders,
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import { motion, AnimatePresence } from 'motion/react';
import {
  WeatherData,
  ExtremeWeatherEvent,
  AirTrafficZone,
  SimulatedAircraft,
  AirTrafficWeatherCorrelation,
} from '../types';
import {
  AIR_TRAFFIC_ZONES_SEED,
  INITIAL_SIMULATED_AIRCRAFT,
  SCENARIOS,
  correlateAirTrafficWithWeather,
  stepAirTrafficSimulation,
  getGeoDistanceKm,
} from '../utils/airTrafficDensityEngine';

interface AirTrafficDensityMapLayerProps {
  currentWeather: WeatherData;
  extremeState: ExtremeWeatherEvent;
}

export const AirTrafficDensityMapLayer: React.FC<AirTrafficDensityMapLayerProps> = ({
  currentWeather,
  extremeState,
}) => {
  // Google Maps API Key state
  const [mapsApiKey, setMapsApiKey] = useState<string>('');
  const [hasMapsKey, setHasMapsKey] = useState<boolean>(false);
  const [mapMode, setMapMode] = useState<'radar' | 'google'>('radar');

  // Simulation state
  const [scenarioId, setScenarioId] = useState<string>('standard');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [aircraft, setAircraft] = useState<SimulatedAircraft[]>(INITIAL_SIMULATED_AIRCRAFT);
  const [selectedAircraftId, setSelectedAircraftId] = useState<string | null>('ac-01');
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [phaseFilter, setPhaseFilter] = useState<string>('ALL');

  // Layer Visibility Toggles
  const [showDensityHeatmap, setShowDensityHeatmap] = useState<boolean>(true);
  const [showWeatherHazards, setShowWeatherHazards] = useState<boolean>(true);
  const [showFlightTrails, setShowFlightTrails] = useState<boolean>(true);
  const [showHoldingRacetracks, setShowHoldingRacetracks] = useState<boolean>(true);

  // Radar View Pan & Zoom
  const [radarZoom, setRadarZoom] = useState<number>(1.0);
  const [radarPan, setRadarPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Load Maps API Key
  useEffect(() => {
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

  // Compute live weather correlation and zones
  const { zones, correlation, updatedAircraft } = useMemo(() => {
    return correlateAirTrafficWithWeather(
      AIR_TRAFFIC_ZONES_SEED,
      aircraft,
      currentWeather,
      extremeState,
      scenarioId
    );
  }, [aircraft, currentWeather, extremeState, scenarioId]);

  // Simulation tick loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setAircraft((prev) => stepAirTrafficSimulation(prev, speedMultiplier));
    }, 1500);

    return () => clearInterval(interval);
  }, [isPlaying, speedMultiplier]);

  // Switch scenarios
  const handleScenarioChange = (newScenarioId: string) => {
    setScenarioId(newScenarioId);
    if (newScenarioId === 'convective-divert') {
      // Add extra holding flights at VASUR
      setAircraft((prev) => {
        const extraHolders: SimulatedAircraft[] = [
          {
            id: `ac-hold-${Date.now()}-1`,
            callsign: 'KQ 762',
            airline: 'Kenya Airways',
            aircraftType: 'B787-8',
            origin: 'HKJK (Nairobi)',
            destination: 'FAOR (Johannesburg)',
            flightPhase: 'HOLDING',
            lat: -26.2750,
            lng: 28.2160,
            altitudeFt: 11000,
            groundspeedKts: 220,
            verticalSpeedFpm: 0,
            headingDeg: 195,
            targetWaypoint: 'VASUR HOLD FL110',
            zoneId: 'zone-boksburg-vasur-hold',
            weatherImpact: { hasConflict: true, hazardTitle: 'Storm Divert Hold', severity: 'SEVERE', atcAdvisory: 'Holding at VASUR FL110. Convective microburst risk over Boksburg final.' },
            trail: [{ lat: -26.2700, lng: 28.2180 }],
          },
          {
            id: `ac-hold-${Date.now()}-2`,
            callsign: 'SA 040',
            airline: 'South African Airways',
            aircraftType: 'A330-300',
            origin: 'SBGR (São Paulo)',
            destination: 'FAOR (Johannesburg)',
            flightPhase: 'HOLDING',
            lat: -26.2840,
            lng: 28.2050,
            altitudeFt: 12000,
            groundspeedKts: 225,
            verticalSpeedFpm: 0,
            headingDeg: 15,
            targetWaypoint: 'VASUR HOLD FL120',
            zoneId: 'zone-boksburg-vasur-hold',
            weatherImpact: { hasConflict: true, hazardTitle: 'Storm Divert Hold', severity: 'SEVERE', atcAdvisory: 'Hold VASUR FL120, expect approach clearance in 25 mins.' },
            trail: [{ lat: -26.2900, lng: 28.2030 }],
          },
        ];
        return [...INITIAL_SIMULATED_AIRCRAFT, ...extraHolders];
      });
    } else if (newScenarioId === 'peak-rush') {
      setAircraft(INITIAL_SIMULATED_AIRCRAFT);
    } else {
      setAircraft(INITIAL_SIMULATED_AIRCRAFT);
    }
  };

  const selectedAircraft = updatedAircraft.find((a) => a.id === selectedAircraftId);
  const selectedZone = zones.find((z) => z.id === selectedZoneId);

  // Filtered aircraft list for inspector
  const filteredAircraft = updatedAircraft.filter((ac) => {
    const matchesSearch =
      ac.callsign.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ac.airline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ac.aircraftType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPhase = phaseFilter === 'ALL' || ac.flightPhase === phaseFilter;
    return matchesSearch && matchesPhase;
  });

  // Projection math for Tactical Radar Canvas centered on Boksburg & O.R. Tambo
  // Lat range: -26.05 to -26.35 (~33 km)
  // Lng range: 28.10 to 28.42 (~32 km)
  const projectGeo = (lat: number, lng: number) => {
    const minLat = -26.35;
    const maxLat = -26.05;
    const minLng = 28.10;
    const maxLng = 28.42;

    const x = ((lng - minLng) / (maxLng - minLng)) * 760 + 20;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 460 + 20;
    return { x, y };
  };

  const getDensityColor = (level: AirTrafficZone['densityLevel']) => {
    switch (level) {
      case 'CRITICAL':
        return '#f43f5e';
      case 'HIGH':
        return '#fb923c';
      case 'MODERATE':
        return '#facc15';
      default:
        return '#10b981';
    }
  };

  return (
    <div className="space-y-5 text-slate-100 font-sans">
      {/* 1. Header & Live Air Traffic Telemetry Status */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-950/80 border border-slate-800 shadow-xl backdrop-blur-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight font-mono">
                Boksburg & O.R. Tambo (FAOR) Air Traffic Density
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Real-Time Density Layer
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-500/10 text-blue-300 border border-blue-500/30">
                FAA / SACAA Correlated
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Correlating live terminal flight paths, Boksburg final approach (RWY 03L/R), VASUR holding stack, and convective weather constraints.
            </p>
          </div>
        </div>

        {/* View Switcher & Simulation Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-auto">
          {/* Map Mode Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl p-1 text-xs font-mono">
            <button
              onClick={() => setMapMode('radar')}
              className={`px-3 py-1.5 rounded-xl transition-all font-semibold flex items-center gap-1.5 ${
                mapMode === 'radar'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>Aero Tactical Radar</span>
            </button>
            <button
              onClick={() => setMapMode('google')}
              className={`px-3 py-1.5 rounded-xl transition-all font-semibold flex items-center gap-1.5 ${
                mapMode === 'google'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Google Maps Platform</span>
              {!hasMapsKey && <span className="text-[10px] text-amber-300 font-mono">(Demo)</span>}
            </button>
          </div>

          {/* Play/Pause & Speed */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl p-1 text-xs font-mono">
            <button
              onClick={() => setIsPlaying((p) => !p)}
              className={`p-2 rounded-xl transition-colors ${
                isPlaying ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}
              title={isPlaying ? 'Pause Simulation' : 'Resume Simulation'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setSpeedMultiplier((prev) => (prev === 1.0 ? 2.0 : prev === 2.0 ? 5.0 : 1.0))}
              className="px-2.5 py-1 text-slate-300 hover:text-white font-bold"
              title="Toggle Simulation Speed"
            >
              {speedMultiplier}x
            </button>
            <button
              onClick={() => {
                setAircraft(INITIAL_SIMULATED_AIRCRAFT);
                setScenarioId('standard');
              }}
              className="p-2 text-slate-400 hover:text-white"
              title="Reset Simulation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Air Traffic vs Weather Correlation Metrics HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        {/* Metric 1: Boksburg & FAOR Sector Density */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>BOKSBURG DENSITY</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-xl font-black ${
                correlation.boksburgSectorDensity === 'CRITICAL'
                  ? 'text-rose-400'
                  : correlation.boksburgSectorDensity === 'HIGH'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {correlation.boksburgSectorDensity}
            </span>
            <span className="text-xs text-slate-400">({updatedAircraft.length} active targets)</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 truncate">
            RWY 03L/R Final Corridor
          </div>
        </div>

        {/* Metric 2: Weather Constraint Index */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>WEATHER CONSTRAINT</span>
            <CloudRain className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-xl font-black ${
                correlation.weatherConstraintIndex > 70
                  ? 'text-rose-400'
                  : correlation.weatherConstraintIndex > 40
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {correlation.weatherConstraintIndex} / 100
            </span>
            <span className="text-xs text-slate-400">
              {correlation.weatherConstraintIndex > 70
                ? 'Severe'
                : correlation.weatherConstraintIndex > 40
                ? 'Moderate'
                : 'Nominal'}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 truncate">
            {currentWeather.current.weatherDescription} • {Math.round(currentWeather.current.windSpeed)} kts
          </div>
        </div>

        {/* Metric 3: ATC Spacing & Flow Rate */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>RADAR SPACING</span>
            <Wind className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-black text-white">
              {correlation.crosswindSeparationApplied || correlation.weatherConstraintIndex > 50
                ? '8 - 10 NM'
                : '5.0 NM'}
            </span>
            <span className="text-xs text-slate-400">
              {correlation.faorMovementRate} mvts/hr
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 truncate">
            {correlation.crosswindSeparationApplied ? 'Gust Envelope Expanded' : 'Standard ICAO Spacing'}
          </div>
        </div>

        {/* Metric 4: Holding Stack Depth & Average Delay */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>VASUR HOLDING DELAY</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-xl font-black ${
                correlation.averageDelayMinutes > 15 ? 'text-rose-400' : 'text-slate-200'
              }`}
            >
              +{correlation.averageDelayMinutes} MIN
            </span>
            <span className="text-xs text-slate-400">
              ({correlation.holdingCount} in hold)
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 truncate">
            {correlation.holdingStackActive ? 'VASUR Stack Engaged' : 'Holding Clear'}
          </div>
        </div>
      </div>

      {/* 3. Scenario Selector Bar */}
      <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="text-slate-400 font-bold uppercase tracking-wider">Simulate Traffic Scenario:</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              onClick={() => handleScenarioChange(sc.id)}
              className={`px-3 py-1.5 rounded-xl border transition-all ${
                scenarioId === sc.id
                  ? 'bg-blue-600/30 border-blue-400 text-blue-200 font-bold shadow-xs'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {sc.name}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Main Interactive Map & Radar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left / Center: Interactive Map Surface (8 Cols) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="relative rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl h-[520px] flex flex-col">
            {/* Top Left: Active Airspace Overlay Tag */}
            <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-700/80 font-mono text-[11px]">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-slate-200 font-bold">FAOR TERMINAL AIRSPACE</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">BOKSBURG CORRIDOR (124.50 MHz)</span>
            </div>

            {/* Top Right: Layer Visibility Control Toggles */}
            <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl border border-slate-700/80 font-mono text-[10px]">
              <button
                onClick={() => setShowDensityHeatmap((p) => !p)}
                className={`px-2 py-1 rounded-xl transition-colors ${
                  showDensityHeatmap ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Toggle Traffic Density Heatmap Contours"
              >
                Density Contours
              </button>
              <button
                onClick={() => setShowWeatherHazards((p) => !p)}
                className={`px-2 py-1 rounded-xl transition-colors ${
                  showWeatherHazards ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Toggle Weather Hazard Constraint Polygons"
              >
                Weather Hazards
              </button>
              <button
                onClick={() => setShowHoldingRacetracks((p) => !p)}
                className={`px-2 py-1 rounded-xl transition-colors ${
                  showHoldingRacetracks ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Toggle VASUR Holding Pattern Overlay"
              >
                Holding Racetrack
              </button>
            </div>

            {/* View Mode: Google Maps Platform SDK */}
            {mapMode === 'google' ? (
              <div className="w-full h-full relative">
                <APIProvider
                  apiKey={mapsApiKey || ''}
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                >
                  <Map
                    defaultCenter={{ lat: -26.2127, lng: 28.2575 }} // Boksburg Centered
                    defaultZoom={11}
                    mapId="DEMO_MAP_ID"
                    className="w-full h-full"
                    gestureHandling="greedy"
                    disableDefaultUI={false}
                  >
                    {/* Simulated Aircraft Markers */}
                    {updatedAircraft.map((ac) => {
                      const isSelected = ac.id === selectedAircraftId;
                      const hasConflict = ac.weatherImpact.hasConflict;

                      return (
                        <AdvancedMarker
                          key={ac.id}
                          position={{ lat: ac.lat, lng: ac.lng }}
                          onClick={() => setSelectedAircraftId(ac.id)}
                          title={`${ac.callsign} (${ac.aircraftType}) - ${ac.altitudeFt} ft`}
                        >
                          <div
                            className={`cursor-pointer transition-transform duration-200 select-none ${
                              isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-10'
                            }`}
                          >
                            <div className="relative flex flex-col items-center">
                              {/* Aircraft Icon rotated to heading */}
                              <div
                                style={{ transform: `rotate(${ac.headingDeg}deg)` }}
                                className={`w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-colors ${
                                  hasConflict
                                    ? 'bg-rose-600 text-white animate-pulse'
                                    : ac.flightPhase === 'HOLDING'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-sky-600 text-white'
                                }`}
                              >
                                <Plane className="w-4 h-4" />
                              </div>

                              {/* Callsign & Altitude Tag */}
                              <div className="mt-1 px-1.5 py-0.5 rounded bg-slate-950/90 border border-slate-700 text-[9px] font-mono text-white whitespace-nowrap shadow-md flex items-center gap-1">
                                <span className="font-bold text-sky-400">{ac.callsign}</span>
                                <span className="text-slate-400">FL{Math.round(ac.altitudeFt / 100)}</span>
                              </div>
                            </div>
                          </div>
                        </AdvancedMarker>
                      );
                    })}

                    {/* Zone Density Markers on Google Map */}
                    {showDensityHeatmap &&
                      zones.map((zone) => {
                        const isCrit = zone.constraintSeverity === 'CRITICAL';
                        const isWarn = zone.constraintSeverity === 'SEVERE' || zone.densityLevel === 'CRITICAL';

                        return (
                          <AdvancedMarker
                            key={zone.id}
                            position={zone.center}
                            onClick={() => setSelectedZoneId(zone.id)}
                            title={`${zone.name} - ${zone.densityLevel} Traffic`}
                          >
                            <div className="flex flex-col items-center cursor-pointer pointer-events-auto">
                              <div
                                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-lg transition-all ${
                                  isCrit
                                    ? 'bg-rose-500/25 border-rose-500 text-rose-300 animate-ping'
                                    : isWarn
                                    ? 'bg-amber-500/25 border-amber-400 text-amber-300'
                                    : 'bg-blue-500/20 border-blue-400 text-blue-300'
                                }`}
                              >
                                <span className="text-[10px] font-mono font-bold">
                                  {zone.activeCount} AC
                                </span>
                              </div>
                              <span className="mt-1 px-1.5 py-0.2 rounded bg-slate-900/90 text-[8px] font-mono font-bold text-slate-300 border border-slate-700 whitespace-nowrap">
                                {zone.shortLabel}
                              </span>
                            </div>
                          </AdvancedMarker>
                        );
                      })}

                    {/* Selected Aircraft Info Window */}
                    {selectedAircraft && (
                      <InfoWindow
                        position={{ lat: selectedAircraft.lat + 0.015, lng: selectedAircraft.lng }}
                        onCloseClick={() => setSelectedAircraftId(null)}
                      >
                        <div className="p-1 font-mono text-[11px] text-slate-900 space-y-1">
                          <div className="font-bold flex items-center justify-between gap-2">
                            <span>{selectedAircraft.callsign} ({selectedAircraft.aircraftType})</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-100 text-sky-800">
                              {selectedAircraft.flightPhase}
                            </span>
                          </div>
                          <div className="text-slate-600">
                            Alt: {selectedAircraft.altitudeFt} ft • Speed: {selectedAircraft.groundspeedKts} kts • Hdg: {selectedAircraft.headingDeg}°
                          </div>
                          <div className="text-slate-600">Route: {selectedAircraft.origin} ➔ {selectedAircraft.destination}</div>
                          {selectedAircraft.weatherImpact.hasConflict && (
                            <div className="p-1 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-semibold">
                              ⚠️ {selectedAircraft.weatherImpact.hazardTitle}
                            </div>
                          )}
                        </div>
                      </InfoWindow>
                    )}
                  </Map>
                </APIProvider>

                {!hasMapsKey && (
                  <div className="absolute bottom-2 left-2 right-2 bg-slate-900/90 backdrop-blur-md p-2 rounded-xl border border-blue-500/30 flex items-center justify-between text-[11px] font-mono text-blue-200 z-20">
                    <span className="truncate">Google Maps Preview Mode. Click above to switch to Aero Tactical Radar.</span>
                    <a
                      href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline shrink-0 ml-2 font-bold"
                    >
                      Get Maps Demo Key →
                    </a>
                  </div>
                )}
              </div>
            ) : (
              /* View Mode: Tactical Aeronautical Vector Radar View */
              <div className="w-full h-full relative bg-[#070c18] overflow-hidden flex items-center justify-center select-none">
                <svg
                  className="w-full h-full cursor-crosshair"
                  viewBox="0 0 800 500"
                  preserveAspectRatio="xMidYMid meet"
                  style={{
                    transform: `scale(${radarZoom}) translate(${radarPan.x}px, ${radarPan.y}px)`,
                    transition: 'transform 0.15s ease-out',
                  }}
                >
                  <defs>
                    {/* Gradients */}
                    <radialGradient id="highDensityGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                    </radialGradient>
                    <radialGradient id="moderateDensityGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                    </radialGradient>
                    <radialGradient id="nominalDensityGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </radialGradient>
                    <linearGradient id="glideslopeBevel" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#0284c7" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>

                  {/* Concentric Distance Range Rings from O.R. Tambo (FAOR) */}
                  {/* FAOR center in svg coordinates ~ x: 380, y: 155 */}
                  <circle cx="380" cy="155" r="50" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
                  <circle cx="380" cy="155" r="110" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
                  <circle cx="380" cy="155" r="180" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
                  <circle cx="380" cy="155" r="260" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />

                  {/* Range Labels */}
                  <text x="385" y="210" fill="#475569" fontSize="8" fontFamily="monospace">5 NM</text>
                  <text x="385" y="270" fill="#475569" fontSize="8" fontFamily="monospace">10 NM (Boksburg)</text>
                  <text x="385" y="340" fill="#475569" fontSize="8" fontFamily="monospace">15 NM</text>
                  <text x="385" y="420" fill="#475569" fontSize="8" fontFamily="monospace">20 NM</text>

                  {/* Extended Runway Final Approach Localizer Beams (RWY 03L and 03R) extending south directly over Boksburg */}
                  <line x1="380" y1="155" x2="395" y2="460" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.6" />
                  <line x1="410" y1="155" x2="425" y2="460" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.6" />

                  {/* Final Approach Funnel Polygon over Boksburg */}
                  <polygon
                    points="375,160 415,160 460,450 350,450"
                    fill="url(#glideslopeBevel)"
                    opacity="0.6"
                  />

                  {/* VASUR Holding Pattern Racetrack Shape over Boksburg South */}
                  {showHoldingRacetracks && (
                    <g>
                      <path
                        d="M 270,360 C 270,330 330,330 330,360 L 330,420 C 330,450 270,450 270,420 Z"
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                        opacity="0.8"
                      />
                      <text x="250" y="345" fill="#c084fc" fontSize="9" fontWeight="bold" fontFamily="monospace">
                        VASUR HOLD (BOKSBURG)
                      </text>
                      <text x="250" y="357" fill="#a855f7" fontSize="8" fontFamily="monospace">
                        Right turns • 230 kts max
                      </text>
                    </g>
                  )}

                  {/* Air Traffic Density Heatmap Contours */}
                  {showDensityHeatmap &&
                    zones.map((z) => {
                      const pos = projectGeo(z.center.lat, z.center.lng);
                      const isCritical = z.densityLevel === 'CRITICAL' || z.constraintSeverity === 'CRITICAL';
                      const isHigh = z.densityLevel === 'HIGH' || z.constraintSeverity === 'SEVERE';
                      const fillColor = isCritical
                        ? 'url(#highDensityGlow)'
                        : isHigh
                        ? 'url(#moderateDensityGlow)'
                        : 'url(#nominalDensityGlow)';
                      const strokeColor = isCritical ? '#f43f5e' : isHigh ? '#fb923c' : '#10b981';

                      return (
                        <g key={z.id} className="cursor-pointer" onClick={() => setSelectedZoneId(z.id)}>
                          <circle
                            cx={pos.x}
                            cy={pos.y}
                            r={z.radiusKm * 10}
                            fill={fillColor}
                            stroke={strokeColor}
                            strokeWidth="1.2"
                            strokeDasharray={isCritical ? 'none' : '3 3'}
                            opacity={isCritical ? 0.9 : 0.7}
                          />
                          <text
                            x={pos.x}
                            y={pos.y - z.radiusKm * 8}
                            fill={strokeColor}
                            fontSize="9"
                            fontWeight="bold"
                            fontFamily="monospace"
                            textAnchor="middle"
                          >
                            {z.shortLabel.toUpperCase()} [{z.activeCount} AC]
                          </text>
                        </g>
                      );
                    })}

                  {/* Weather Constraint Hazard Polygons (Convective Cell over East Rand / Boksburg if storm active) */}
                  {showWeatherHazards && correlation.weatherConstraintIndex > 40 && (
                    <g>
                      {/* Storm / Microburst Core */}
                      <circle
                        cx="450"
                        cy="320"
                        r="45"
                        fill="#ef4444"
                        fillOpacity="0.2"
                        stroke="#ef4444"
                        strokeWidth="1.8"
                        strokeDasharray="6 3"
                        className="animate-pulse"
                      />
                      <text x="450" y="315" fill="#f87171" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                        ⚡ CONVECTIVE CORE ALPHA
                      </text>
                      <text x="450" y="328" fill="#fca5a5" fontSize="8" fontFamily="monospace" textAnchor="middle">
                        Top FL380 • LLWS Threat
                      </text>
                    </g>
                  )}

                  {/* Major Landmarks: Boksburg & O.R. Tambo */}
                  {/* O.R. Tambo Airport Core */}
                  {(() => {
                    const faorPos = projectGeo(-26.1392, 28.2460);
                    return (
                      <g transform={`translate(${faorPos.x}, ${faorPos.y})`}>
                        {/* Runways */}
                        <line x1="-8" y1="-24" x2="8" y2="24" stroke="#e2e8f0" strokeWidth="3" />
                        <line x1="8" y1="-24" x2="24" y2="24" stroke="#e2e8f0" strokeWidth="3" />
                        <circle r="4" fill="#3b82f6" />
                        <text x="30" y="4" fill="#ffffff" fontSize="11" fontWeight="black" fontFamily="monospace">
                          FAOR / JNB
                        </text>
                        <text x="30" y="16" fill="#94a3b8" fontSize="8" fontFamily="monospace">
                          Elev 5,558 ft • Dual Runways
                        </text>
                      </g>
                    );
                  })()}

                  {/* Boksburg Town Landmark Center */}
                  {(() => {
                    const boksburgPos = projectGeo(-26.2127, 28.2575);
                    return (
                      <g transform={`translate(${boksburgPos.x}, ${boksburgPos.y})`}>
                        <circle r="5" fill="#38bdf8" />
                        <circle r="12" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
                        <text x="10" y="-8" fill="#38bdf8" fontSize="10" fontWeight="bold" fontFamily="monospace">
                          BOKSBURG CBD
                        </text>
                        <text x="10" y="4" fill="#7dd3fc" fontSize="8" fontFamily="monospace">
                          Under RWY 03L/R Final
                        </text>
                      </g>
                    );
                  })()}

                  {/* Aircraft Breadcrumb Trails */}
                  {showFlightTrails &&
                    updatedAircraft.map((ac) => (
                      <g key={`trail-${ac.id}`}>
                        {ac.trail.map((p, i) => {
                          if (i === 0) return null;
                          const p1 = projectGeo(ac.trail[i - 1].lat, ac.trail[i - 1].lng);
                          const p2 = projectGeo(p.lat, p.lng);
                          return (
                            <line
                              key={i}
                              x1={p1.x}
                              y1={p1.y}
                              x2={p2.x}
                              y2={p2.y}
                              stroke={ac.weatherImpact.hasConflict ? '#f43f5e' : '#38bdf8'}
                              strokeWidth="1.2"
                              strokeOpacity={0.15 + (i / ac.trail.length) * 0.45}
                            />
                          );
                        })}
                      </g>
                    ))}

                  {/* Simulated Aircraft Targets */}
                  {updatedAircraft.map((ac) => {
                    const pos = projectGeo(ac.lat, ac.lng);
                    const isSelected = ac.id === selectedAircraftId;
                    const hasConflict = ac.weatherImpact.hasConflict;
                    const isHolding = ac.flightPhase === 'HOLDING';

                    const targetColor = hasConflict
                      ? '#f43f5e'
                      : isHolding
                      ? '#c084fc'
                      : '#38bdf8';

                    return (
                      <g
                        key={ac.id}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        className="cursor-pointer group"
                        onClick={() => setSelectedAircraftId(ac.id)}
                      >
                        {/* Conflict or Selection Aura */}
                        {isSelected && (
                          <circle r="16" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 2" />
                        )}
                        {hasConflict && (
                          <circle r="14" fill="none" stroke="#f43f5e" strokeWidth="1.2" className="animate-ping opacity-50" />
                        )}

                        {/* Directional Velocity Vector Line */}
                        {(() => {
                          const rad = (ac.headingDeg * Math.PI) / 180;
                          const vectorLen = (ac.groundspeedKts / 200) * 22;
                          const vx = vectorLen * Math.sin(rad);
                          const vy = -vectorLen * Math.cos(rad);
                          return (
                            <line
                              x1="0"
                              y1="0"
                              x2={vx}
                              y2={vy}
                              stroke={targetColor}
                              strokeWidth="1.5"
                            />
                          );
                        })()}

                        {/* Aircraft Center Blip */}
                        <circle
                          r={isSelected ? '5.5' : '4'}
                          fill={targetColor}
                          stroke="#ffffff"
                          strokeWidth="1.2"
                          className="transition-transform group-hover:scale-125"
                        />

                        {/* Flight Callout Label */}
                        <g transform="translate(8, -6)">
                          <rect
                            x="-2"
                            y="-8"
                            width="68"
                            height="19"
                            rx="3"
                            fill="#090f1d"
                            fillOpacity="0.85"
                            stroke={isSelected ? '#38bdf8' : '#1e293b'}
                            strokeWidth="1"
                          />
                          <text x="1" y="0" fill={isSelected ? '#38bdf8' : '#e2e8f0'} fontSize="8" fontWeight="bold" fontFamily="monospace">
                            {ac.callsign}
                          </text>
                          <text x="1" y="8" fill="#94a3b8" fontSize="7" fontFamily="monospace">
                            {Math.round(ac.altitudeFt / 100)}k • {ac.groundspeedKts}kt
                          </text>
                        </g>
                      </g>
                    );
                  })}
                </svg>

                {/* Radar Zoom Controls */}
                <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700 font-mono text-xs">
                  <button
                    onClick={() => setRadarZoom((z) => Math.min(2.2, z + 0.25))}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-200"
                    title="Zoom In"
                  >
                    +
                  </button>
                  <button
                    onClick={() => setRadarZoom((z) => Math.max(0.8, z - 0.25))}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-200"
                    title="Zoom Out"
                  >
                    -
                  </button>
                  <button
                    onClick={() => {
                      setRadarZoom(1.0);
                      setRadarPan({ x: 0, y: 0 });
                    }}
                    className="px-2 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white text-[10px]"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Real-Time ATC Flow Advisories Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start gap-3 text-xs font-mono">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300">ACTIVE ATC AIRSPACE ADVISORIES</span>
                <span className="text-[10px] text-slate-400">FAJA Sector 3 (Highveld Flow)</span>
              </div>
              <ul className="space-y-0.5 text-slate-300 text-[11px]">
                {correlation.atcSystemAdvisories.map((adv, idx) => (
                  <li key={idx} className="leading-relaxed">
                    • {adv}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Zone Weather Correlation Matrix & Live Aircraft Telemetry (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Selected Aircraft Telemetry Inspector */}
          {selectedAircraft && (
            <div className="p-4 rounded-3xl bg-slate-950/80 border border-sky-500/40 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                    <Plane className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-mono text-sm font-bold text-white flex items-center gap-2">
                      <span>{selectedAircraft.callsign}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                        {selectedAircraft.aircraftType}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono">{selectedAircraft.airline}</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${
                    selectedAircraft.flightPhase === 'FINAL_APPROACH'
                      ? 'bg-blue-600 text-white'
                      : selectedAircraft.flightPhase === 'HOLDING'
                      ? 'bg-purple-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {selectedAircraft.flightPhase.replace('_', ' ')}
                </span>
              </div>

              {/* Aircraft Telemetry Grid */}
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs font-mono">
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="text-[10px] text-slate-500">ALTITUDE</div>
                  <div className="font-bold text-white">{selectedAircraft.altitudeFt.toLocaleString()} FT</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="text-[10px] text-slate-500">GROUNDSPEED</div>
                  <div className="font-bold text-white">{selectedAircraft.groundspeedKts} KTS</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="text-[10px] text-slate-500">VERTICAL RATE</div>
                  <div
                    className={`font-bold ${
                      selectedAircraft.verticalSpeedFpm < 0
                        ? 'text-sky-400'
                        : selectedAircraft.verticalSpeedFpm > 0
                        ? 'text-emerald-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {selectedAircraft.verticalSpeedFpm > 0 ? '+' : ''}
                    {selectedAircraft.verticalSpeedFpm} FPM
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="text-[10px] text-slate-500">HEADING</div>
                  <div className="font-bold text-white">{selectedAircraft.headingDeg}°</div>
                </div>
              </div>

              {/* Route & Waypoint */}
              <div className="mt-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] font-mono space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Routing:</span>
                  <span className="text-white font-bold">{selectedAircraft.origin} ➔ {selectedAircraft.destination}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Active Target:</span>
                  <span className="text-sky-300 font-bold">{selectedAircraft.targetWaypoint}</span>
                </div>
              </div>

              {/* Weather Constraint Impact for this Flight */}
              {selectedAircraft.weatherImpact.hasConflict ? (
                <div className="mt-3 p-3 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs font-mono space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>WEATHER HAZARD CORRELATION</span>
                  </div>
                  <p className="text-[11px] text-rose-200 leading-relaxed">
                    {selectedAircraft.weatherImpact.hazardTitle}
                  </p>
                  <p className="text-[10px] text-rose-300 pt-1 border-t border-rose-500/30">
                    {selectedAircraft.weatherImpact.atcAdvisory}
                  </p>
                </div>
              ) : (
                <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-[11px]">Flight path clear of active convective or windshear constraints.</span>
                </div>
              )}
            </div>
          )}

          {/* Zone Correlation Matrix List */}
          <div className="p-4 rounded-3xl bg-slate-950/80 border border-slate-800 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>AIRSPACE SECTOR CORRELATIONS</span>
              </h4>
              <span className="text-[10px] font-mono text-slate-500">Boksburg TMA</span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {zones.map((zone) => {
                const isSelected = zone.id === selectedZoneId;
                const isCrit = zone.constraintSeverity === 'CRITICAL';
                const isWarn = zone.constraintSeverity === 'SEVERE' || zone.densityLevel === 'CRITICAL';

                return (
                  <div
                    key={zone.id}
                    onClick={() => setSelectedZoneId(zone.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer text-xs font-mono ${
                      isSelected
                        ? 'bg-blue-900/30 border-blue-400 shadow-md'
                        : isCrit
                        ? 'bg-rose-950/30 border-rose-700/60 hover:border-rose-500'
                        : isWarn
                        ? 'bg-amber-950/20 border-amber-700/50 hover:border-amber-400'
                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white truncate mr-2">{zone.shortLabel}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                          zone.densityLevel === 'CRITICAL'
                            ? 'bg-rose-600 text-white'
                            : zone.densityLevel === 'HIGH'
                            ? 'bg-amber-600 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {zone.activeCount} AC • {zone.densityLevel}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 font-sans mt-1 line-clamp-2">
                      {zone.correlationStatus}
                    </p>

                    <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Rec. Spacing: {zone.recommendedSpacingNm} NM</span>
                      <span className={zone.delayMinutes > 10 ? 'text-amber-400' : 'text-slate-400'}>
                        +{zone.delayMinutes}m delay
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
