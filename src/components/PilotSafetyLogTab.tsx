import React, { useState, useEffect } from 'react';
import {
  Wind,
  Eye,
  Plus,
  Copy,
  Check,
  Trash2,
  AlertTriangle,
  Compass,
  Sparkles,
  Plane,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Info,
  ShieldAlert,
  CloudFog,
} from 'lucide-react';
import {
  PilotSafetyReport,
  PirepTurbulenceIntensity,
  PirepTurbulenceType,
  PirepVisibilityCategory,
  WeatherData,
} from '../types';
import {
  getStoredPireps,
  savePirepReport,
  deletePirepReport,
  formatIcaoPirepString,
  INITIAL_PRESEEDED_PIREPS,
} from '../utils/pirepStorage';

interface PilotSafetyLogTabProps {
  weather: WeatherData;
  onAnalyzeWithAI: (pirep: PilotSafetyReport) => void;
}

export const PilotSafetyLogTab: React.FC<PilotSafetyLogTabProps> = ({
  weather,
  onAnalyzeWithAI,
}) => {
  const [reports, setReports] = useState<PilotSafetyReport[]>([]);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'TURBULENCE' | 'VISIBILITY'>('ALL');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state for new PIREP
  const [callsign, setCallsign] = useState('ZS-');
  const [aircraftType, setAircraftType] = useState('C172 Skyhawk');
  const [location, setLocation] = useState('Boksburg TMA / FAOR South');
  const [altitudeFt, setAltitudeFt] = useState<number>(6500);
  const [turbIntensity, setTurbIntensity] = useState<PirepTurbulenceIntensity>('MODERATE');
  const [turbType, setTurbType] = useState<PirepTurbulenceType>('THERMAL');
  const [visCategory, setVisCategory] = useState<PirepVisibilityCategory>('HAZY_5_10KM');
  const [visKm, setVisKm] = useState<number>(8);
  const [cloudCondition, setCloudCondition] = useState<
    'CLEAR' | 'FEW' | 'SCATTERED' | 'BROKEN_IMC' | 'OVERCAST_IMC' | 'IN_CLOUD'
  >('SCATTERED');
  const [icingIntensity, setIcingIntensity] = useState<'NONE' | 'TRACE' | 'LIGHT' | 'MODERATE' | 'SEVERE'>('NONE');
  const [tempC, setTempC] = useState<number>(Math.round(weather.current.temperature));
  const [remarks, setRemarks] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    setReports(getStoredPireps());
  }, []);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: string) => {
    const updated = deletePirepReport(id);
    setReports(updated);
  };

  const handleResetDefaults = () => {
    localStorage.removeItem('smartweather_pilot_pireps_log');
    setReports(getStoredPireps());
  };

  const handleSubmitPirep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callsign.trim() || !location.trim()) return;

    const saved = savePirepReport({
      callsign: callsign.toUpperCase(),
      aircraftType,
      location,
      altitudeFt: Number(altitudeFt),
      flightLevel: altitudeFt >= 10000 ? `FL${Math.round(altitudeFt / 100)}` : `${altitudeFt}ft ALT`,
      turbulenceIntensity: turbIntensity,
      turbulenceType: turbType,
      visibilityCategory: visCategory,
      visibilityKm: Number(visKm),
      cloudCondition,
      icingIntensity,
      outsideAirTempC: Number(tempC),
      remarks: remarks.trim() || 'Observed during routine local flight operations.',
      verifiedLocal: true,
    });

    setReports((prev) => [saved, ...prev]);
    setFormSuccess(true);
    setTimeout(() => {
      setFormSuccess(false);
      setIsFormOpen(false);
      // Reset form
      setRemarks('');
    }, 1200);
  };

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    if (activeFilter === 'TURBULENCE') {
      return r.turbulenceIntensity !== 'SMOOTH';
    }
    if (activeFilter === 'VISIBILITY') {
      return r.visibilityCategory !== 'CAVOK';
    }
    return true;
  });

  // Calculate high-level statistics
  const severeTurbulenceCount = reports.filter(
    (r) => r.turbulenceIntensity === 'MODERATE' || r.turbulenceIntensity === 'SEVERE' || r.turbulenceIntensity === 'EXTREME'
  ).length;

  const lowVisCount = reports.filter((r) => r.visibilityCategory !== 'CAVOK').length;

  // Live draft ICAO string for preview
  const previewIcaoString = formatIcaoPirepString({
    location,
    altitudeFt: Number(altitudeFt),
    aircraftType,
    cloudCondition,
    visibilityKm: Number(visKm),
    visibilityCategory: visCategory,
    turbulenceIntensity: turbIntensity,
    turbulenceType: turbType,
    icingIntensity,
    remarks,
    timestamp: new Date().toISOString(),
  });

  const getTurbulenceBadgeColor = (intensity: PirepTurbulenceIntensity) => {
    switch (intensity) {
      case 'EXTREME':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/50';
      case 'SEVERE':
        return 'bg-red-500/20 text-red-300 border-red-500/50';
      case 'MODERATE':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/50';
      case 'LIGHT':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/50';
      case 'SMOOTH':
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
    }
  };

  const getVisibilityBadgeColor = (category: PirepVisibilityCategory) => {
    switch (category) {
      case 'ZERO_IMC':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/50';
      case 'LOW_VIS_UNDER_3KM':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/50';
      case 'MARGINAL_3_5KM':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/50';
      case 'HAZY_5_10KM':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
      case 'CAVOK':
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden font-sans">
      {/* Top Banner & Quick Metrics */}
      <div className="p-4 bg-slate-950/70 border-b border-slate-800 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Pilot Weather Reports (PIREPs)</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Highveld & Boksburg in-flight turbulence & visibility observations
            </p>
          </div>

          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isFormOpen ? 'Close Form' : 'Log PIREP'}</span>
          </button>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
            <div className="text-[10px] text-slate-400 font-mono">LOGGED PIREPS</div>
            <div className="text-base font-bold text-white mt-0.5 font-mono flex items-center gap-1">
              <span>{reports.length}</span>
              <span className="text-[10px] text-slate-500 font-normal">Active</span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
            <div className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
              <Wind className="w-3 h-3" />
              <span>TURB ALERTS</span>
            </div>
            <div className="text-base font-bold text-amber-300 mt-0.5 font-mono">
              {severeTurbulenceCount}
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
            <div className="text-[10px] text-sky-400 font-mono flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>VIS HAZARDS</span>
            </div>
            <div className="text-base font-bold text-sky-300 mt-0.5 font-mono">
              {lowVisCount}
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 mt-3 text-xs">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
              activeFilter === 'ALL'
                ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            All ({reports.length})
          </button>
          <button
            onClick={() => setActiveFilter('TURBULENCE')}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5 ${
              activeFilter === 'TURBULENCE'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            <Wind className="w-3 h-3" />
            <span>Turbulence Only</span>
          </button>
          <button
            onClick={() => setActiveFilter('VISIBILITY')}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5 ${
              activeFilter === 'VISIBILITY'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Visibility / IMC</span>
          </button>
        </div>
      </div>

      {/* PIREP Entry Form (Collapsible) */}
      {isFormOpen && (
        <div className="p-4 bg-slate-950 border-b border-amber-500/30 shrink-0 max-h-[50vh] overflow-y-auto scrollbar-thin">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
            <h4 className="text-xs font-bold font-mono text-amber-300 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              <span>Record Flight Observation (PIREP)</span>
            </h4>
            <span className="text-[10px] text-slate-500 font-mono">SACAA / ICAO Format</span>
          </div>

          <form onSubmit={handleSubmitPirep} className="space-y-3 text-xs font-sans">
            {/* Callsign & Aircraft */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">
                  Callsign / Tail ID
                </label>
                <input
                  type="text"
                  value={callsign}
                  onChange={(e) => setCallsign(e.target.value)}
                  placeholder="ZS-ABC or DRONE-1"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">
                  Aircraft Type
                </label>
                <select
                  value={aircraftType}
                  onChange={(e) => setAircraftType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="C172 Skyhawk">C172 Skyhawk (Light GA)</option>
                  <option value="PA28 Cherokee">PA28 Cherokee (Light GA)</option>
                  <option value="PC-12 NGX">PC-12 NGX (Turboprop)</option>
                  <option value="B200 King Air">B200 King Air</option>
                  <option value="B737-800">B737-800 (Commercial Jet)</option>
                  <option value="A320neo">A320neo (Commercial Jet)</option>
                  <option value="Bell 407 (Helicopter)">Bell 407 (Helicopter)</option>
                  <option value="DJI Matrice 350 (sUAS)">DJI Matrice 350 (sUAS)</option>
                  <option value="DJI Mavic 3 Enterprise">DJI Mavic 3 (sUAS)</option>
                </select>
              </div>
            </div>

            {/* Location & Altitude */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">
                  Position / Waypoint / Landmark
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Boksburg Lake / FAOR 03L final"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">
                  Altitude (ft AMSL)
                </label>
                <input
                  type="number"
                  value={altitudeFt}
                  onChange={(e) => setAltitudeFt(Number(e.target.value))}
                  min={100}
                  max={45000}
                  step={100}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Atmospheric Turbulence Section */}
            <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
              <div className="text-[10px] font-mono text-amber-400 uppercase font-bold flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5" />
                <span>1. Atmospheric Turbulence Report</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Turbulence Intensity</label>
                  <select
                    value={turbIntensity}
                    onChange={(e) => setTurbIntensity(e.target.value as PirepTurbulenceIntensity)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                  >
                    <option value="SMOOTH">SMOOTH (None)</option>
                    <option value="LIGHT">LIGHT (Slight chop)</option>
                    <option value="MODERATE">MODERATE (Definite strain)</option>
                    <option value="SEVERE">SEVERE (Large attitude variations)</option>
                    <option value="EXTREME">EXTREME (Structural hazard)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Turbulence Type / Cause</label>
                  <select
                    value={turbType}
                    onChange={(e) => setTurbType(e.target.value as PirepTurbulenceType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                  >
                    <option value="THERMAL">Thermal Updraft (Highveld Surface Heat)</option>
                    <option value="MECHANICAL">Mechanical Rotor (Tailings / Structures)</option>
                    <option value="CAT">Clear Air Turbulence (CAT)</option>
                    <option value="CHOP">In-Cloud Convective Chop</option>
                    <option value="MOUNTAIN_WAVE">Mountain / Ridge Wave</option>
                    <option value="NONE">None</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Visibility & Cloud Conditions Section */}
            <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
              <div className="text-[10px] font-mono text-sky-400 uppercase font-bold flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span>2. In-Flight Visibility & Sky Cover</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Flight Visibility Range</label>
                  <select
                    value={visCategory}
                    onChange={(e) => {
                      const cat = e.target.value as PirepVisibilityCategory;
                      setVisCategory(cat);
                      if (cat === 'CAVOK') setVisKm(15);
                      else if (cat === 'HAZY_5_10KM') setVisKm(7);
                      else if (cat === 'MARGINAL_3_5KM') setVisKm(4);
                      else if (cat === 'LOW_VIS_UNDER_3KM') setVisKm(2);
                      else setVisKm(0.8);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                  >
                    <option value="CAVOK">CAVOK (&gt;10 km clear visual)</option>
                    <option value="HAZY_5_10KM">HAZY (5 - 10 km smoke / dust)</option>
                    <option value="MARGINAL_3_5KM">MARGINAL VFR (3 - 5 km haze/rain)</option>
                    <option value="LOW_VIS_UNDER_3KM">LOW VISIBILITY (&lt;3 km mist/fog)</option>
                    <option value="ZERO_IMC">ZERO IMC (In cloud / blind)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Cloud State</label>
                  <select
                    value={cloudCondition}
                    onChange={(e) => setCloudCondition(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                  >
                    <option value="CLEAR">SKC / CLR (Clear Sky)</option>
                    <option value="FEW">FEW (1-2 oktas)</option>
                    <option value="SCATTERED">SCT (3-4 oktas)</option>
                    <option value="BROKEN_IMC">BKN (5-7 oktas - Ceiling)</option>
                    <option value="OVERCAST_IMC">OVC (8 oktas - Overcast)</option>
                    <option value="IN_CLOUD">IN-CLOUD (Operating in soup)</option>
                  </select>
                </div>
              </div>

              {/* Temperature & Visibility exact */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Visual Range (KM)</label>
                  <input
                    type="number"
                    value={visKm}
                    onChange={(e) => setVisKm(Number(e.target.value))}
                    min={0.1}
                    max={50}
                    step={0.5}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Outside Temp (°C)</label>
                  <input
                    type="number"
                    value={tempC}
                    onChange={(e) => setTempC(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Pilot Remarks */}
            <div>
              <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">
                Pilot Remarks / Tactical Hazards
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
                placeholder="e.g. Strong convective bump near Cinderella Dam; rapid airspeed decay +/- 12 kts on final 03L..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </div>

            {/* Live Raw ICAO PIREP string */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 font-mono text-[11px] text-slate-400">
              <span className="text-slate-500 block text-[9px] uppercase tracking-wider mb-1">
                Preview ICAO / SACAA PIREP Code:
              </span>
              <span className="text-amber-300 select-all break-all">{previewIcaoString}</span>
            </div>

            {/* Submit button */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className={`flex-1 py-2.5 rounded-xl font-bold font-mono text-xs flex items-center justify-center gap-2 transition-all ${
                  formSuccess
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                }`}
              >
                {formSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>PIREP Logged & Synchronized!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Save to Pilot Safety Log</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white text-xs font-mono"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reports List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin bg-bento-dots">
        {filteredReports.length === 0 ? (
          <div className="text-center py-12 px-4 bg-slate-950/40 border border-slate-800/80 rounded-2xl">
            <CloudFog className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <div className="text-sm font-bold text-slate-300 mb-1">No Matching Reports</div>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
              There are no pilot weather reports matching the selected filter in your local flight log.
            </p>
            <button
              onClick={() => setActiveFilter('ALL')}
              className="text-xs text-cyan-400 underline font-mono"
            >
              Reset filter to All
            </button>
          </div>
        ) : (
          filteredReports.map((pirep) => {
            const timeAgo = (() => {
              const diffMs = Date.now() - new Date(pirep.timestamp).getTime();
              const mins = Math.floor(diffMs / 60000);
              if (mins < 1) return 'Just now';
              if (mins < 60) return `${mins}m ago`;
              const hrs = Math.floor(mins / 60);
              return `${hrs}h ${mins % 60}m ago`;
            })();

            return (
              <div
                key={pirep.id}
                className="bg-slate-950/90 border border-slate-800/90 hover:border-slate-700/80 rounded-2xl p-3.5 space-y-2.5 transition-all shadow-md group"
              >
                {/* Header: Aircraft, Callsign, Time */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400">
                      <Plane className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                        <span>{pirep.callsign}</span>
                        <span className="text-[10px] font-normal text-slate-400">
                          ({pirep.aircraftType})
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <span>{pirep.location}</span>
                        <span>•</span>
                        <span className="text-cyan-300 font-bold">{pirep.altitudeFt} ft</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 font-mono">{timeAgo}</div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                      {new Date(pirep.timestamp).toISOString().substring(11, 16)} UTC
                    </span>
                  </div>
                </div>

                {/* Badges: Turbulence & Visibility */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {/* Turbulence Badge */}
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 font-bold ${getTurbulenceBadgeColor(
                      pirep.turbulenceIntensity
                    )}`}
                  >
                    <Wind className="w-3 h-3" />
                    <span>
                      {pirep.turbulenceIntensity} TURB ({pirep.turbulenceType})
                    </span>
                  </span>

                  {/* Visibility Badge */}
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 font-bold ${getVisibilityBadgeColor(
                      pirep.visibilityCategory
                    )}`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>
                      VIS: {pirep.visibilityKm} km ({pirep.visibilityCategory.replace(/_/g, ' ')})
                    </span>
                  </span>

                  {/* Cloud condition */}
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                    {pirep.cloudCondition}
                  </span>

                  {pirep.outsideAirTempC !== undefined && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                      {pirep.outsideAirTempC}°C OAT
                    </span>
                  )}
                </div>

                {/* Pilot Remarks / Observation Notes */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 text-xs text-slate-200 leading-relaxed">
                  <div className="text-[10px] font-mono uppercase text-slate-500 font-bold mb-0.5">
                    Pilot In-Flight Observation:
                  </div>
                  <p className="italic text-[11px] text-slate-300">"{pirep.remarks}"</p>
                </div>

                {/* Raw ICAO Code bar with Copy button */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-2 font-mono text-[10px]">
                  <div className="text-amber-400/90 truncate select-all">{pirep.icaoRawCode}</div>
                  <button
                    onClick={() => handleCopy(pirep.icaoRawCode, pirep.id)}
                    className="shrink-0 p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="Copy standard PIREP string"
                  >
                    {copiedId === pirep.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Action buttons footer */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                  <button
                    onClick={() => onAnalyzeWithAI(pirep)}
                    className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Analyze Impact with AI</span>
                  </button>

                  <button
                    onClick={() => handleDelete(pirep.id)}
                    className="flex items-center gap-1 text-[10px] font-mono text-slate-500 hover:text-rose-400 transition-colors"
                    title="Remove PIREP entry"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer / Reset action */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono shrink-0">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Stored locally in browser cache</span>
        </div>
        <button
          onClick={handleResetDefaults}
          className="hover:text-amber-400 flex items-center gap-1 transition-colors"
          title="Reset to pre-seeded Highveld PIREPs"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Restore Samples</span>
        </button>
      </div>
    </div>
  );
};
