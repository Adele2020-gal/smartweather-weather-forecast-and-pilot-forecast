import React, { useState, useEffect, useRef } from 'react';
import {
  Plane,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Search,
  Radio,
  ExternalLink,
  ChevronRight,
  Info,
  Compass,
  Wind,
  Layers,
  Sparkles,
  Send,
  Loader2,
  Copy,
  Check,
  Eye,
  Maximize2,
  Minimize2,
  CornerDownRight,
  Key,
  Activity,
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import {
  AirportNotam,
  SouthAfricanAirport,
  NotamAgentBriefing,
  NotamCategory,
  NotamSeverity,
  WeatherData,
  SimulatedAircraft,
} from '../types';
import {
  INITIAL_SOUTH_AFRICAN_NOTAMS,
  getPopulatedAirports,
  generateDefaultBriefing,
} from '../data/southAfricaNotams';
import {
  INITIAL_SIMULATED_AIRCRAFT,
  stepAirTrafficSimulation,
} from '../utils/airTrafficDensityEngine';

interface AviationNotamRadarProps {
  currentWeather: WeatherData;
  onSelectAirport?: (airport: SouthAfricanAirport) => void;
}

export const AviationNotamRadar: React.FC<AviationNotamRadarProps> = ({
  currentWeather,
  onSelectAirport,
}) => {
  const [airports, setAirports] = useState<SouthAfricanAirport[]>(() =>
    getPopulatedAirports(INITIAL_SOUTH_AFRICAN_NOTAMS)
  );
  const [notams, setNotams] = useState<AirportNotam[]>(INITIAL_SOUTH_AFRICAN_NOTAMS);
  const [briefing, setBriefing] = useState<NotamAgentBriefing>(() =>
    generateDefaultBriefing(INITIAL_SOUTH_AFRICAN_NOTAMS)
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedAirportIcao, setSelectedAirportIcao] = useState<string>('FAOR');
  const [selectedNotam, setSelectedNotam] = useState<AirportNotam | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedNotamId, setCopiedNotamId] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleTimeString());

  // Google Maps API Key state
  const [mapsApiKey, setMapsApiKey] = useState<string>('');
  const [hasMapsKey, setHasMapsKey] = useState<boolean>(false);
  const [mapMode, setMapMode] = useState<'radar' | 'google' | 'hybrid'>('radar');

  // Air Traffic Density Layer state (Boksburg & FAOR Corridors)
  const [showTrafficDensityLayer, setShowTrafficDensityLayer] = useState<boolean>(true);
  const [trafficAircraft, setTrafficAircraft] = useState<SimulatedAircraft[]>(INITIAL_SIMULATED_AIRCRAFT);
  const [selectedTrafficAcId, setSelectedTrafficAcId] = useState<string | null>(null);

  // Air traffic continuous position simulation
  useEffect(() => {
    if (!showTrafficDensityLayer) return;
    const interval = setInterval(() => {
      setTrafficAircraft((prev) => stepAirTrafficSimulation(prev, 1.0));
    }, 2000);
    return () => clearInterval(interval);
  }, [showTrafficDensityLayer]);

  // Interactive AI NOTAM Dispatcher query state
  const [agentPrompt, setAgentPrompt] = useState<string>('');
  const [isAgentThinking, setIsAgentThinking] = useState<boolean>(false);
  const [agentHistory, setAgentHistory] = useState<Array<{ role: 'user' | 'agent'; text: string; time: string }>>([
    {
      role: 'agent',
      text: `AeroDispatch AI connected to ATNS/SACAA NOTAM data stream. Monitoring 14 South African aerodromes. Priority alerts: FAOR Runway 03R/21L maintenance, FAOR ILS 03L localizer outage (RNAV mandatory), and FALE short final RWY 06 windshear. Ask me any flight planning or aerodrome restriction questions.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Map viewport & pan state for Radar Canvas
  const [mapZoom, setMapZoom] = useState<number>(1);
  const [mapPan, setMapPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Fetch Maps configuration from backend
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

  // Fetch real-time NOTAM data from the server agent endpoint
  const pullRealTimeNotams = async (airportIcao?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (airportIcao && airportIcao !== 'ALL') params.append('airport', airportIcao);
      if (severityFilter !== 'ALL') params.append('severity', severityFilter);
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);

      const res = await fetch(`/api/airports/notams?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.airports) setAirports(data.airports);
        if (data.notams) setNotams(data.notams);
        if (data.briefing) setBriefing(data.briefing);
        setLastRefreshed(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.warn('Using local cached South African NOTAMs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit AI Dispatcher Query
  const handleAskAgent = async (customQuery?: string) => {
    const q = (customQuery || agentPrompt).trim();
    if (!q) return;

    const userMessageTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAgentHistory((prev) => [...prev, { role: 'user', text: q, time: userMessageTime }]);
    setAgentPrompt('');
    setIsAgentThinking(true);

    try {
      const res = await fetch('/api/airports/notams/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          airportIcao: selectedAirportIcao,
          weather: currentWeather,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAgentHistory((prev) => [
          ...prev,
          {
            role: 'agent',
            text: data.reply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        throw new Error('Agent returned non-200');
      }
    } catch (_err) {
      setAgentHistory((prev) => [
        ...prev,
        {
          role: 'agent',
          text: `[ATNS Offline Dispatcher] Analyzed active notices: ${selectedAirport?.name || 'Selected Airspace'} has ${selectedAirportNotams.length} active notices. Exercise caution on runway surface braking coefficients and adhere to published ICAO instrument approach minima.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsAgentThinking(false);
    }
  };

  const selectedAirport = airports.find((a) => a.icao === selectedAirportIcao) || airports[0];
  const selectedAirportNotams = notams.filter((n) => n.airportIcao === selectedAirportIcao);
  const selectedTrafficAc = trafficAircraft.find((a) => a.id === selectedTrafficAcId);

  // Filtered notams for active list
  const filteredNotams = notams.filter((n) => {
    if (selectedAirportIcao !== 'ALL' && n.airportIcao !== selectedAirportIcao) return false;
    if (severityFilter !== 'ALL' && n.severity !== severityFilter) return false;
    if (categoryFilter !== 'ALL' && n.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.id.toLowerCase().includes(q) ||
        n.decodedSummary.toLowerCase().includes(q) ||
        n.airportName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopyRaw = (notam: AirportNotam) => {
    navigator.clipboard.writeText(notam.rawText);
    setCopiedNotamId(notam.id);
    setTimeout(() => setCopiedNotamId(null), 2000);
  };

  const getSeverityBadgeClass = (sev: NotamSeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/50';
      case 'WARNING':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/50';
      case 'ADVISORY':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      default:
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
    }
  };

  const getSeverityMarkerColor = (sev: NotamSeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return '#ef4444'; // rose-500
      case 'WARNING':
        return '#f59e0b'; // amber-500
      case 'ADVISORY':
        return '#eab308'; // yellow-500
      default:
        return '#0284c7'; // sky-600
    }
  };

  // Convert GPS Coordinates to Radar Canvas SVG relative positions
  // South Africa bounding box: Lat -22 to -35, Lng 16 to 33
  const projectGeoToCanvas = (lat: number, lng: number) => {
    const minLat = -35.2;
    const maxLat = -22.0;
    const minLng = 16.0;
    const maxLng = 33.5;

    const x = ((lng - minLng) / (maxLng - minLng)) * 800;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 500;
    return { x, y };
  };

  const userLocationProjected = projectGeoToCanvas(
    currentWeather.location.latitude,
    currentWeather.location.longitude
  );

  return (
    <div className="space-y-6">
      {/* Top Status & Agent Control Bar */}
      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-400 animate-ping opacity-40" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-wider">SOUTH AFRICAN NOTAM AGENT RADAR</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                ATNS/SACAA TELEMETRY LIVE
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-0.5">
              <span>{airports.length} Aerodromes Monitored</span>
              <span>•</span>
              <span className="text-rose-400 font-bold">{briefing.criticalAlertCount} Critical</span>
              <span>•</span>
              <span className="text-amber-400">{briefing.warningAlertCount} Warnings</span>
              <span>•</span>
              <span>Refreshed: {lastRefreshed}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Map Style Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
            <button
              onClick={() => setMapMode('radar')}
              className={`px-2.5 py-1 rounded-lg text-[11px] transition-colors ${
                mapMode === 'radar'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tactical Radar
            </button>
            <button
              onClick={() => setMapMode('google')}
              className={`px-2.5 py-1 rounded-lg text-[11px] transition-colors flex items-center gap-1 ${
                mapMode === 'google'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Google Maps</span>
              {!hasMapsKey && <span className="text-[9px] text-amber-300 font-mono">(Demo)</span>}
            </button>
          </div>

          {/* Air Traffic Density Layer Toggle */}
          <button
            onClick={() => setShowTrafficDensityLayer((p) => !p)}
            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-mono transition-all flex items-center gap-1.5 ${
              showTrafficDensityLayer
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold shadow-xs'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Real-Time Air Traffic Density Overlay around Boksburg & O.R. Tambo"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Air Traffic Layer</span>
            {showTrafficDensityLayer && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => pullRealTimeNotams(selectedAirportIcao)}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600/90 hover:bg-blue-500 text-white font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Polling ATNS...' : 'Refresh Live Feed'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Map (Left) & Inspector / Airport Drawer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Interactive Maps & Tactical Overlay */}
        <div className="lg:col-span-7 space-y-4">
          {/* Map Container */}
          <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl h-[480px] flex flex-col">
            {/* Map Header Overlay */}
            <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 font-mono text-[11px]">
              <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span className="text-slate-200 font-bold">FAJA / FACA Airspace Sector</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">Gauteng Highveld Centered</span>
            </div>

            {/* Quick Zoom & Reset Controls */}
            <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 font-mono text-xs">
              <button
                onClick={() => setMapZoom((prev) => Math.min(prev + 0.25, 2.5))}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white"
                title="Zoom In"
              >
                +
              </button>
              <button
                onClick={() => setMapZoom((prev) => Math.max(prev - 0.25, 0.75))}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white"
                title="Zoom Out"
              >
                -
              </button>
              <button
                onClick={() => {
                  setMapZoom(1);
                  setMapPan({ x: 0, y: 0 });
                }}
                className="px-2 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white text-[10px]"
                title="Reset View"
              >
                Reset
              </button>
            </div>

            {/* Map Mode: Google Maps Platform SDK (@vis.gl/react-google-maps) */}
            {mapMode === 'google' ? (
              <div className="w-full h-full relative">
                <APIProvider
                  apiKey={mapsApiKey || ''}
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                >
                  <Map
                    defaultCenter={{
                      lat: selectedAirport?.latitude || -26.1392,
                      lng: selectedAirport?.longitude || 28.246,
                    }}
                    defaultZoom={6}
                    mapId="DEMO_MAP_ID"
                    className="w-full h-full"
                    gestureHandling="greedy"
                    disableDefaultUI={false}
                  >
                    {airports.map((airport) => {
                      const isSelected = airport.icao === selectedAirportIcao;
                      const hasCritical = airport.highestSeverity === 'CRITICAL';
                      const markerBg = getSeverityMarkerColor(airport.highestSeverity);

                      return (
                        <AdvancedMarker
                          key={airport.icao}
                          position={{ lat: airport.latitude, lng: airport.longitude }}
                          onClick={() => {
                            setSelectedAirportIcao(airport.icao);
                            if (onSelectAirport) onSelectAirport(airport);
                          }}
                          title={`${airport.name} (${airport.icao})`}
                        >
                          <div
                            className={`cursor-pointer transition-transform duration-200 ${
                              isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-10'
                            }`}
                          >
                            <div className="relative flex items-center justify-center">
                              {hasCritical && (
                                <div className="absolute -inset-2 rounded-full bg-rose-500/40 animate-ping" />
                              )}
                              <div
                                style={{ backgroundColor: markerBg }}
                                className="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white"
                              >
                                <Plane className="w-4 h-4 transform -rotate-45" />
                              </div>
                              <span className="absolute -bottom-4 px-1.5 py-0.2 rounded bg-slate-900/90 text-[9px] font-mono font-bold text-white border border-slate-700 shadow-sm whitespace-nowrap">
                                {airport.icao}
                                {airport.activeNotamCount > 0 && ` (${airport.activeNotamCount})`}
                              </span>
                            </div>
                          </div>
                        </AdvancedMarker>
                      );
                    })}

                    {/* Air Traffic Density Layer: Real-Time Aircraft Targets around Boksburg & O.R. Tambo */}
                    {showTrafficDensityLayer &&
                      trafficAircraft.map((ac) => {
                        const isSelected = ac.id === selectedTrafficAcId;
                        const hasConflict = ac.weatherImpact.hasConflict;

                        return (
                          <AdvancedMarker
                            key={`traffic-${ac.id}`}
                            position={{ lat: ac.lat, lng: ac.lng }}
                            onClick={() => setSelectedTrafficAcId(ac.id)}
                            title={`${ac.callsign} (${ac.aircraftType}) - ${ac.altitudeFt} ft`}
                          >
                            <div
                              className={`cursor-pointer transition-transform duration-200 select-none ${
                                isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-20'
                              }`}
                            >
                              <div className="relative flex flex-col items-center">
                                <div
                                  style={{ transform: `rotate(${ac.headingDeg}deg)` }}
                                  className={`w-7 h-7 rounded-full border border-white shadow-md flex items-center justify-center text-white transition-colors ${
                                    hasConflict
                                      ? 'bg-rose-600 animate-pulse'
                                      : ac.flightPhase === 'HOLDING'
                                      ? 'bg-purple-600'
                                      : 'bg-sky-600'
                                  }`}
                                >
                                  <Plane className="w-3.5 h-3.5" />
                                </div>
                                <span className="mt-0.5 px-1 py-0.2 rounded bg-slate-950/90 border border-slate-700 text-[8px] font-mono text-sky-300 font-bold whitespace-nowrap shadow">
                                  {ac.callsign} • FL{Math.round(ac.altitudeFt / 100)}
                                </span>
                              </div>
                            </div>
                          </AdvancedMarker>
                        );
                      })}

                    {/* Selected Air Traffic Info Window */}
                    {showTrafficDensityLayer && selectedTrafficAc && (
                      <InfoWindow
                        position={{
                          lat: selectedTrafficAc.lat + 0.015,
                          lng: selectedTrafficAc.lng,
                        }}
                        onCloseClick={() => setSelectedTrafficAcId(null)}
                      >
                        <div className="p-1 font-mono text-[11px] text-slate-900 space-y-1">
                          <div className="font-bold flex items-center justify-between gap-2">
                            <span>{selectedTrafficAc.callsign} ({selectedTrafficAc.aircraftType})</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-100 text-sky-800">
                              {selectedTrafficAc.flightPhase.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="text-slate-600">
                            Alt: {selectedTrafficAc.altitudeFt} ft • Speed: {selectedTrafficAc.groundspeedKts} kts • Hdg: {selectedTrafficAc.headingDeg}°
                          </div>
                          <div className="text-slate-600">Route: {selectedTrafficAc.origin} ➔ {selectedTrafficAc.destination}</div>
                          {selectedTrafficAc.weatherImpact.hasConflict && (
                            <div className="p-1 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-semibold">
                              ⚠️ {selectedTrafficAc.weatherImpact.hazardTitle}
                            </div>
                          )}
                        </div>
                      </InfoWindow>
                    )}

                    {/* Selected Airport Info Window */}
                    {selectedAirport && (
                      <InfoWindow
                        position={{
                          lat: selectedAirport.latitude + 0.05,
                          lng: selectedAirport.longitude,
                        }}
                        headerContent={
                          <div className="font-mono text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{selectedAirport.icao}</span>
                            <span className="text-slate-500">•</span>
                            <span>{selectedAirport.name}</span>
                          </div>
                        }
                      >
                        <div className="p-1 font-mono text-[11px] text-slate-800 space-y-1">
                          <div>Elev: {selectedAirport.elevationFeet} ft MSL</div>
                          <div>Active Notices: {selectedAirport.activeNotamCount}</div>
                          <div className="text-[10px] text-slate-600">
                            Runways: {selectedAirport.runways.join(', ')}
                          </div>
                        </div>
                      </InfoWindow>
                    )}
                  </Map>
                </APIProvider>

                {!hasMapsKey && (
                  <div className="absolute bottom-2 left-2 right-2 bg-slate-900/90 backdrop-blur-md p-2 rounded-xl border border-blue-500/30 flex items-center justify-between text-[11px] font-mono text-blue-200 z-20">
                    <span className="truncate">Google Maps Preview Mode. You can also view the Tactical Radar.</span>
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
              /* Map Mode: Tactical Aeronautical Vector Radar Canvas */
              <div className="w-full h-full relative bg-[#090f1d] overflow-hidden flex items-center justify-center select-none">
                {/* Tactical Radar Grid Lines */}
                <svg
                  className="w-full h-full cursor-grab active:cursor-grabbing"
                  viewBox="0 0 800 500"
                  preserveAspectRatio="xMidYMid meet"
                  style={{
                    transform: `scale(${mapZoom}) translate(${mapPan.x}px, ${mapPan.y}px)`,
                    transition: 'transform 0.15s ease-out',
                  }}
                >
                  <defs>
                    <radialGradient id="radarSweepGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.01" />
                    </radialGradient>
                    <linearGradient id="corridorLine" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>

                  {/* Concentric Radar Distance Rings from Gauteng (FAOR) */}
                  <circle cx="560" cy="160" r="80" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
                  <circle cx="560" cy="160" r="160" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
                  <circle cx="560" cy="160" r="260" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
                  <circle cx="560" cy="160" r="380" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />

                  {/* Range Labels */}
                  <text x="565" y="245" fill="#475569" fontSize="9" fontFamily="monospace">100 NM</text>
                  <text x="565" y="325" fill="#475569" fontSize="9" fontFamily="monospace">200 NM</text>
                  <text x="565" y="425" fill="#475569" fontSize="9" fontFamily="monospace">350 NM</text>

                  {/* South Africa Coastline / Border Silhouette */}
                  <path
                    d="M 120,440 C 130,460 210,480 320,485 C 440,490 530,460 630,420 C 690,380 710,310 700,240 C 690,190 670,160 680,120 C 620,110 570,100 520,110 C 460,95 380,110 320,150 C 260,190 200,220 160,260 C 130,310 110,380 120,440 Z"
                    fill="#0f172a"
                    stroke="#1e3a8a"
                    strokeWidth="1.5"
                    opacity="0.75"
                  />

                  {/* Flight Corridors Connecting Major Hubs */}
                  {/* JNB to CPT */}
                  <line x1="560" y1="160" x2="200" y2="455" stroke="url(#corridorLine)" strokeWidth="1.5" strokeDasharray="3 3" />
                  {/* JNB to DUR */}
                  <line x1="560" y1="160" x2="690" y2="290" stroke="url(#corridorLine)" strokeWidth="1.5" strokeDasharray="3 3" />
                  {/* JNB to PLZ */}
                  <line x1="560" y1="160" x2="440" y2="455" stroke="url(#corridorLine)" strokeWidth="1.5" strokeDasharray="3 3" />
                  {/* JNB to BFN */}
                  <line x1="560" y1="160" x2="470" y2="270" stroke="url(#corridorLine)" strokeWidth="1.5" strokeDasharray="3 3" />

                  {/* User Location Radar Blip (Boksburg) */}
                  <g transform={`translate(${userLocationProjected.x}, ${userLocationProjected.y})`}>
                    <circle r="6" fill="#3b82f6" opacity="0.3" className="animate-ping" />
                    <circle r="3" fill="#60a5fa" stroke="#ffffff" strokeWidth="1" />
                    <text x="7" y="-5" fill="#93c5fd" fontSize="9" fontWeight="bold" fontFamily="monospace">
                      HOME ({currentWeather.location.name})
                    </text>
                  </g>

                  {/* Airport Markers & NOTAM Alerts */}
                  {airports.map((apt) => {
                    const pos = projectGeoToCanvas(apt.latitude, apt.longitude);
                    const isSelected = apt.icao === selectedAirportIcao;
                    const isCritical = apt.highestSeverity === 'CRITICAL';
                    const isWarning = apt.highestSeverity === 'WARNING';
                    const markerColor = getSeverityMarkerColor(apt.highestSeverity);

                    return (
                      <g
                        key={apt.icao}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        className="cursor-pointer group"
                        onClick={() => {
                          setSelectedAirportIcao(apt.icao);
                          if (onSelectAirport) onSelectAirport(apt);
                        }}
                      >
                        {/* Hazard Ring Pulsing */}
                        {isCritical && (
                          <circle r="14" fill="none" stroke="#f43f5e" strokeWidth="1.5" className="animate-ping opacity-60" />
                        )}
                        {isWarning && (
                          <circle r="12" fill="none" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="2 2" />
                        )}

                        {/* Outer Selector Box */}
                        {isSelected && (
                          <circle r="16" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 2" />
                        )}

                        {/* Airport Dot */}
                        <circle
                          r={isSelected ? '6' : '4.5'}
                          fill={markerColor}
                          stroke="#ffffff"
                          strokeWidth="1.2"
                          className="transition-transform group-hover:scale-125"
                        />

                        {/* ICAO Label */}
                        <text
                          x="9"
                          y="3"
                          fill={isSelected ? '#38bdf8' : '#e2e8f0'}
                          fontSize={isSelected ? '11' : '9.5'}
                          fontWeight={isSelected ? 'bold' : 'normal'}
                          fontFamily="monospace"
                          className="transition-colors drop-shadow-md"
                        >
                          {apt.icao}
                          {apt.activeNotamCount > 0 && (
                            <tspan fill={isCritical ? '#f43f5e' : isWarning ? '#fbbf24' : '#94a3b8'} fontSize="8">
                              {' '}[{apt.activeNotamCount}]
                            </tspan>
                          )}
                        </text>

                        {/* Airport Subtitle on hover / selection */}
                        {isSelected && (
                          <text x="9" y="14" fill="#94a3b8" fontSize="8" fontFamily="monospace">
                            {apt.name.slice(0, 24)}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Map Legend on bottom right */}
                <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-md p-2 rounded-xl border border-slate-800 font-mono text-[10px] text-slate-400 space-y-1 z-10 pointer-events-none">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Critical Alert (ILS / Windshear)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Warning (Runway Maint / Fog)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    <span>Advisory / Normal Ops</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Airport Quick Selector Bar */}
          <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800">
            <div className="text-[11px] font-mono text-slate-400 mb-2 flex items-center justify-between">
              <span className="uppercase tracking-wider">Quick Switch Aerodrome:</span>
              <span className="text-slate-500">Gauteng, Coastal & Inland Hubs</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
              {airports.map((apt) => {
                const isSelected = apt.icao === selectedAirportIcao;
                const isCritical = apt.highestSeverity === 'CRITICAL';
                const isWarning = apt.highestSeverity === 'WARNING';

                return (
                  <button
                    key={apt.icao}
                    onClick={() => {
                      setSelectedAirportIcao(apt.icao);
                      if (onSelectAirport) onSelectAirport(apt);
                    }}
                    className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold border-blue-400 shadow-md scale-105'
                        : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <Plane className="w-3 h-3" />
                    <span>{apt.icao}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({apt.iata})</span>
                    {apt.activeNotamCount > 0 && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                          isCritical
                            ? 'bg-rose-500/30 text-rose-300'
                            : isWarning
                            ? 'bg-amber-500/30 text-amber-300'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {apt.activeNotamCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Selected Airport Telemetry & NOTAM Detail */}
        <div className="lg:col-span-5 space-y-4">
          {/* Selected Airport Header Card */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-lg relative overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold font-mono text-white tracking-wider">
                    {selectedAirport.icao}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/30 font-mono text-xs">
                    IATA: {selectedAirport.iata}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md font-mono text-[10px] uppercase font-bold border ${getSeverityBadgeClass(
                      selectedAirport.highestSeverity
                    )}`}
                  >
                    {selectedAirport.highestSeverity}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-200 mt-1 leading-snug">
                  {selectedAirport.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedAirport.city}, {selectedAirport.province}
                </p>
              </div>

              <div className="text-right font-mono text-xs">
                <div className="text-slate-400 text-[10px] uppercase">Field Elevation</div>
                <div className="text-white font-bold">{selectedAirport.elevationFeet} FT MSL</div>
                <div className="text-slate-400 text-[10px] mt-1 uppercase">Notices</div>
                <div className="text-blue-400 font-bold">{selectedAirportNotams.length} Active</div>
              </div>
            </div>

            {/* Runways Information */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 font-mono text-xs">
              <span className="text-slate-500 text-[10px] uppercase block mb-1">Available Runways:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {selectedAirport.runways.map((rwy, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-[11px]"
                  >
                    RWY {rwy}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* NOTAM Filter & Search Bar */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search NOTAMs by Q-code, runway, keyword..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 font-mono"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-950/80 border border-slate-800 text-slate-300 rounded-xl px-2.5 py-2 focus:outline-none focus:border-blue-400 text-xs font-mono"
            >
              <option value="ALL">All Categories</option>
              <option value="RUNWAY">Runways</option>
              <option value="NAV_AIDS">Nav Aids / ILS</option>
              <option value="HAZARD_WEATHER">Weather Hazards</option>
              <option value="AIRSPACE">Airspace / FIR</option>
              <option value="OBSTACLE">Obstacles</option>
              <option value="LIGHTING">Lighting</option>
            </select>
          </div>

          {/* Active NOTAMs List for Selected Aerodrome */}
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {filteredNotams.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-slate-800 text-slate-400 font-mono text-xs">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                <p>No active notices matching the selected criteria for this aerodrome.</p>
              </div>
            ) : (
              filteredNotams.map((notam) => {
                const isSelected = selectedNotam?.id === notam.id;

                return (
                  <div
                    key={notam.id}
                    className={`p-4 rounded-2xl transition-all border font-mono text-xs ${
                      isSelected
                        ? 'bg-slate-900 border-blue-400/80 shadow-lg'
                        : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    {/* Header: ID, Category, Severity */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-white tracking-wider">{notam.id}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400">{notam.airportIcao}</span>
                        <span className="text-slate-500">•</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[10px]">
                          {notam.category}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-blue-300 text-[10px]">
                          Q) {notam.qCode}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${getSeverityBadgeClass(
                          notam.severity
                        )}`}
                      >
                        {notam.severity}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="text-sm font-semibold text-slate-100 mt-2 font-sans">
                      {notam.title}
                    </h4>

                    {/* Decoded Plain Language Summary */}
                    <p className="text-xs text-slate-300 mt-1.5 font-sans leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                      {notam.decodedSummary}
                    </p>

                    {/* Operational Impact */}
                    <div className="mt-2.5 text-[11px] text-amber-300/90 flex items-start gap-2 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                      <span>
                        <strong className="text-amber-200">Flight Ops Impact:</strong> {notam.operationalImpact}
                      </span>
                    </div>

                    {/* Agent Pilot Advice */}
                    {notam.agentAnalysis && (
                      <div className="mt-2 text-[11px] text-sky-200 flex items-start gap-2 bg-sky-950/40 p-2 rounded-xl border border-sky-500/30">
                        <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-sky-400" />
                        <span>
                          <strong className="text-sky-300">Dispatcher Recommendation:</strong>{' '}
                          {notam.agentAnalysis.pilotRecommendation}
                        </span>
                      </div>
                    )}

                    {/* Footer: Valid times & Copy Raw Button */}
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                      <div>
                        Valid: {new Date(notam.validFrom).toLocaleDateString()} to{' '}
                        {new Date(notam.validTo).toLocaleDateString()}
                      </div>
                      <button
                        onClick={() => handleCopyRaw(notam)}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1"
                      >
                        {copiedNotamId === notam.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied ICAO</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Raw ICAO</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Interactive AI NOTAM Dispatcher Assistant Console */}
      <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">AeroDispatch AI: NOTAM & Airspace Flight Agent</h3>
              <p className="text-[11px] text-slate-400">
                Direct neural flight dispatch analysis grounded in live SACAA bulletins and Gauteng Highveld weather
              </p>
            </div>
          </div>
        </div>

        {/* Preset Prompt Suggestions */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
          <span className="text-slate-500 text-[10px] uppercase tracking-wider shrink-0">Quick Queries:</span>
          {[
            `Brief FAOR Runway 03R/21L closure & single-runway delays`,
            `Analyze FALE Durban short-final windshear hazard`,
            `Check FAGM Rand Airport grass runway condition`,
            `Flight corridor JNB (FAOR) to CPT (FACT) hazards`,
          ].map((promptText, i) => (
            <button
              key={i}
              onClick={() => handleAskAgent(promptText)}
              disabled={isAgentThinking}
              className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:border-blue-400/50 hover:text-white whitespace-nowrap transition-colors text-[11px]"
            >
              {promptText}
            </button>
          ))}
        </div>

        {/* Chat Stream View */}
        <div className="space-y-3 max-h-56 overflow-y-auto pr-2 font-mono text-xs">
          {agentHistory.map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-2xl flex items-start gap-2.5 ${
                item.role === 'user'
                  ? 'bg-blue-950/30 border border-blue-500/30 ml-8 text-blue-100'
                  : 'bg-slate-900/90 border border-slate-800 mr-4 text-slate-200'
              }`}
            >
              {item.role === 'agent' ? (
                <div className="p-1 rounded-lg bg-blue-500/20 text-blue-400 shrink-0 mt-0.5">
                  <Plane className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div className="p-1 rounded-lg bg-slate-800 text-slate-400 shrink-0 mt-0.5">
                  <Send className="w-3.5 h-3.5" />
                </div>
              )}
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-bold uppercase tracking-wider">
                    {item.role === 'agent' ? 'AeroDispatch AI' : 'Pilot In Command'}
                  </span>
                  <span>{item.time}</span>
                </div>
                <p className="text-xs whitespace-pre-wrap font-sans leading-relaxed">{item.text}</p>
              </div>
            </div>
          ))}

          {isAgentThinking && (
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3 text-xs font-mono text-sky-400">
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              <span>Analyzing ICAO NOTAM bulletins & aerodrome crosswind margins...</span>
            </div>
          )}
        </div>

        {/* Query Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskAgent();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={agentPrompt}
            onChange={(e) => setAgentPrompt(e.target.value)}
            placeholder={`Ask the NOTAM agent about ${selectedAirport?.icao || 'airports'}, flight corridors, or runway status...`}
            disabled={isAgentThinking}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 font-mono"
          />
          <button
            type="submit"
            disabled={isAgentThinking || !agentPrompt.trim()}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <span>Ask Dispatcher</span>
            <CornerDownRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
