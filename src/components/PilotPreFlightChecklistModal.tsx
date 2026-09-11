import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Plane,
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  Square,
  ShieldCheck,
  ShieldAlert,
  Mountain,
  Wind,
  Eye,
  Thermometer,
  Gauge,
  Compass,
  FileText,
  Printer,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import { WeatherData, FlightWeatherAnalysis, PilotCaution } from '../types';

interface PilotPreFlightChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  weather: WeatherData;
  flightAnalysis: FlightWeatherAnalysis;
  selectedCaution?: PilotCaution | null;
  aircraftType: 'light_ga' | 'turboprop' | 'jet' | 'drone';
}

interface ChecklistItem {
  id: string;
  category: 'REGULATORY' | 'PERFORMANCE' | 'METEOROLOGY' | 'EMERGENCY';
  title: string;
  requirement: string;
  currentCondition: string;
  status: 'PASS' | 'CAUTION' | 'FAIL';
  detail: string;
}

export const PilotPreFlightChecklistModal: React.FC<PilotPreFlightChecklistModalProps> = ({
  isOpen,
  onClose,
  weather,
  flightAnalysis,
  selectedCaution,
  aircraftType,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'thresholds' | 'checklist' | 'highveld'>('thresholds');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [copiedBriefing, setCopiedBriefing] = useState(false);

  const { parameters, category, safetyRating } = flightAnalysis;
  const tempC = Math.round(weather.current.temperature);
  const qnh = weather.current.surfacePressure || 1018;
  const windKts = parameters.windSpeedKts;
  const windDir = parameters.windDirectionDeg;
  const gustKts = parameters.windGustKts;
  const densityAlt = parameters.densityAltitudeFeet;
  const cloudCeilingFt = parameters.cloudBaseFeet;
  const visKm = parameters.visibilityKm;

  // Compute VFR/IFR compliance
  const isVfrCeilingPass = cloudCeilingFt >= 3000;
  const isVfrVisPass = visKm >= 5.0;
  const isCrosswindManageable = parameters.maxCrosswindKts <= (aircraftType === 'light_ga' ? 15 : 25);
  const isDensityAltHigh = densityAlt > 7000;

  // Build Checklist Items
  const checklistItems: ChecklistItem[] = [
    {
      id: 'chk_vfr_ceiling',
      category: 'REGULATORY',
      title: 'Cloud Ceiling Minima (Boksburg TMA)',
      requirement: 'VFR: ≥ 3,000 ft AGL | MVFR: 1,000–3,000 ft | IFR: < 1,000 ft',
      currentCondition: `${cloudCeilingFt.toLocaleString()} ft AGL (${parameters.cloudCoverageDesc})`,
      status: isVfrCeilingPass ? 'PASS' : cloudCeilingFt >= 1000 ? 'CAUTION' : 'FAIL',
      detail:
        cloudCeilingFt >= 3000
          ? 'Cloud base comfortably exceeds standard Class C Visual Flight Rules ceiling.'
          : 'Low cloud ceiling mandates instrument rating or special VFR clearance.',
    },
    {
      id: 'chk_vfr_vis',
      category: 'REGULATORY',
      title: 'Flight Ground Visibility',
      requirement: 'VFR Min: ≥ 5.0 km (Day VFR) | SACAA Class C TMA Min: ≥ 8.0 km',
      currentCondition: `${visKm.toFixed(1)} km`,
      status: isVfrVisPass ? 'PASS' : visKm >= 3.0 ? 'CAUTION' : 'FAIL',
      detail:
        visKm >= 8.0
          ? 'Unrestricted horizontal visibility for visual approach and landmark pilotage.'
          : 'Reduced visibility due to haze, precipitation, or mist. Keep VMC lookout.',
    },
    {
      id: 'chk_density_altitude',
      category: 'PERFORMANCE',
      title: 'Highveld Density Altitude & Takeoff Roll',
      requirement: 'Field Elev 5,558 ft. Density Altitude threshold: < 7,500 ft',
      currentCondition: `${densityAlt.toLocaleString()} ft (+${parameters.densityAltAnomalyFeet.toLocaleString()} ft vs Field)`,
      status: isDensityAltHigh ? 'CAUTION' : 'PASS',
      detail: `At ${tempC}°C on the Highveld, air density is equivalent to ${densityAlt.toLocaleString()} ft AMSL. Expect +35% increased takeoff ground run and reduced climb gradient. Adjust mixture leaning.`,
    },
    {
      id: 'chk_runway_crosswind',
      category: 'PERFORMANCE',
      title: 'Runway Crosswind Component',
      requirement: `Max demonstrated for ${aircraftType === 'light_ga' ? 'Light GA (15 kts)' : 'Aircraft Class (25 kts)'}`,
      currentCondition: `${parameters.maxCrosswindKts} kts crosswind on FAOR Rwy 03L/21R`,
      status: isCrosswindManageable ? 'PASS' : 'FAIL',
      detail: `Winds ${String(windDir).padStart(3, '0')}° at ${windKts} kts (gusts ${gustKts} kts). Runway 03L alignment provides favorable headwind component.`,
    },
    {
      id: 'chk_convection_thunderstorm',
      category: 'METEOROLOGY',
      title: 'Convective Activity & Lightning Alert',
      requirement: 'Zero CB thunderstorm cells within 15 NM of departure / arrival path',
      currentCondition:
        flightAnalysis.pilotCautions.some((c) => c.severity === 'CRITICAL')
          ? 'ACTIVE CONVECTIVE WARNING IN TMA'
          : 'Isolated cumulus / No active supercell on field',
      status: flightAnalysis.pilotCautions.some((c) => c.severity === 'CRITICAL') ? 'FAIL' : 'PASS',
      detail:
        'Verify weather radar for afternoon Highveld thermal initiation and anvil outflow boundaries.',
    },
    {
      id: 'chk_alternate_fuel',
      category: 'EMERGENCY',
      title: 'Alternate Aerodrome & Reserves',
      requirement: 'FAOR/FAGM departures require 45 min Day VFR / 60 min IFR reserve fuel',
      currentCondition: 'FALA (Lanseria) or FAKR (Krugersdorp) accessible as alternates',
      status: 'PASS',
      detail: 'Ensure adequate fuel for holding in case of sudden Highveld line squall closures.',
    },
  ];

  const handleToggleCheck = (id: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCheckAll = () => {
    const allChecked: Record<string, boolean> = {};
    checklistItems.forEach((item) => {
      allChecked[item.id] = true;
    });
    setCheckedItems(allChecked);
  };

  const totalItems = checklistItems.length;
  const completedItems = Object.values(checkedItems).filter(Boolean).length;
  const progressPercent = Math.round((completedItems / totalItems) * 100);

  const handleCopyBriefing = () => {
    const text = `=== PILOT PRE-FLIGHT BRIEFING & VFR/IFR CHECKLIST ===
Aerodrome: FAOR / FAGM (Boksburg / Ekurhuleni Airspace)
Current Time: ${new Date().toUTCString()}
Flight Category: ${category} (${safetyRating})
Temperature: ${tempC}°C | QNH: ${qnh} hPa
Surface Wind: ${String(windDir).padStart(3, '0')}° at ${windKts} kts (Gust: ${gustKts} kts)
Density Altitude: ${densityAlt} ft (Field: 5,558 ft, Anomaly: +${parameters.densityAltAnomalyFeet} ft)
Cloud Base: ${cloudCeilingFt} ft AGL | Visibility: ${visKm} km
Active Pilot Cautions:
${flightAnalysis.pilotCautions.map((c) => `- [${c.severity}] ${c.title}: ${c.details}`).join('\n')}
Pre-Flight Verification Status: ${completedItems}/${totalItems} items signed off.
===================================================`;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedBriefing(true);
      setTimeout(() => setCopiedBriefing(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div
        id="pilot-preflight-checklist-modal"
        className="relative w-full max-w-4xl bg-white rounded-3xl border border-sky-200 shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]"
      >
        {/* Top Accent Strip */}
        <div
          className={`h-2.5 w-full ${
            category === 'VFR'
              ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500'
              : category === 'MVFR'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500'
              : 'bg-gradient-to-r from-rose-600 to-red-700'
          }`}
        />

        {/* Modal Header */}
        <div className="p-6 border-b border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-b from-sky-50/60 to-white">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-sky-600/20 shrink-0">
              <Plane className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight font-sans">
                  Pilot Pre-Flight Weather & Safety Checklist
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200">
                  SACAA / ICAO COMPLIANCE
                </span>
              </div>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Aerodrome: <strong className="text-slate-800">FAOR / FAGM (Boksburg / Ekurhuleni)</strong> • Field Elev: 5,558 ft
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyBriefing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold bg-white hover:bg-sky-50 text-sky-800 border border-sky-200 shadow-xs transition-all"
            >
              {copiedBriefing ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedBriefing ? 'COPIED BRIEFING' : 'COPY DISPATCH'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Highlighted Trigger Caution (if user clicked on a specific caution) */}
        {selectedCaution && (
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{
              opacity: 1,
              x: 0,
              boxShadow:
                selectedCaution.severity === 'CRITICAL'
                  ? [
                      '0 0 0 1px rgba(225, 29, 72, 0.35), 0 2px 8px -2px rgba(225, 29, 72, 0.12)',
                      '0 0 0 2.5px rgba(225, 29, 72, 0.72), 0 6px 20px -2px rgba(225, 29, 72, 0.28)',
                      '0 0 0 1px rgba(225, 29, 72, 0.35), 0 2px 8px -2px rgba(225, 29, 72, 0.12)',
                    ]
                  : selectedCaution.severity === 'WARNING'
                  ? [
                      '0 0 0 1px rgba(245, 158, 11, 0.25), 0 2px 6px -2px rgba(245, 158, 11, 0.08)',
                      '0 0 0 2px rgba(245, 158, 11, 0.6), 0 4px 14px -2px rgba(245, 158, 11, 0.18)',
                      '0 0 0 1px rgba(245, 158, 11, 0.25), 0 2px 6px -2px rgba(245, 158, 11, 0.08)',
                    ]
                  : undefined,
            }}
            transition={{
              x: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
              opacity: { duration: 0.35 },
              boxShadow: { repeat: Infinity, duration: 2.8, ease: 'easeInOut' },
            }}
            className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-300 flex items-start gap-3 relative overflow-hidden shadow-xs"
          >
            {/* Ambient breathing aura glow */}
            <motion.div
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
              className="absolute -right-6 -top-6 w-28 h-28 bg-rose-500/20 rounded-full blur-xl pointer-events-none"
            />

            <div className="relative flex items-center justify-center shrink-0 mt-0.5">
              <motion.span
                animate={{ scale: [1, 2, 1], opacity: [0.85, 0.1, 0.85] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                className="absolute inline-flex h-full w-full rounded-full bg-rose-400"
              />
              <ShieldAlert className="w-5 h-5 text-rose-600 relative z-10" />
            </div>

            <div className="text-xs relative z-10 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-mono font-bold text-[10px] tracking-wider">
                  {selectedCaution.severity} TRIGGER
                </span>
                <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-mono font-bold text-[9px] uppercase border border-rose-300">
                  FLIGHT-PATH SAFETY DIRECTIVE
                </span>
                <span className="font-bold text-slate-900 font-mono">{selectedCaution.title}</span>
              </div>
              <p className="text-slate-700 mt-1 leading-relaxed">{selectedCaution.details}</p>
              <div className="mt-2 pt-2 border-t border-rose-200/70 text-[11px] font-mono text-rose-900 font-semibold flex items-center gap-1.5">
                <span className="bg-rose-200/80 text-rose-900 px-1.5 py-0.5 rounded text-[10px] font-bold">
                  MANDATORY ACTION:
                </span>
                <span>{selectedCaution.actionRequired}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Current Weather Threshold Summary Banner */}
        <div className="mx-6 mt-4 p-4 rounded-2xl bg-gradient-to-r from-sky-50 via-slate-50 to-blue-50 border border-sky-200/70 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="p-2 bg-white rounded-xl border border-sky-100 shadow-2xs">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">FLIGHT RULES</span>
            <span
              className={`text-sm font-black font-mono block ${
                category === 'VFR' ? 'text-emerald-700' : category === 'MVFR' ? 'text-amber-700' : 'text-rose-700'
              }`}
            >
              {category}
            </span>
            <span className="text-[10px] text-slate-500 block">{safetyRating}</span>
          </div>

          <div className="p-2 bg-white rounded-xl border border-sky-100 shadow-2xs">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">CLOUD BASE</span>
            <span className="text-sm font-bold font-mono text-slate-800 block">{cloudCeilingFt.toLocaleString()} ft</span>
            <span className="text-[10px] text-emerald-600 font-mono block">VFR &gt; 3,000 ft</span>
          </div>

          <div className="p-2 bg-white rounded-xl border border-sky-100 shadow-2xs">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">VISIBILITY</span>
            <span className="text-sm font-bold font-mono text-slate-800 block">{visKm.toFixed(1)} km</span>
            <span className="text-[10px] text-emerald-600 font-mono block">VFR &gt; 5.0 km</span>
          </div>

          <div className="p-2 bg-white rounded-xl border border-sky-100 shadow-2xs">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">DENSITY ALT</span>
            <span className="text-sm font-bold font-mono text-amber-700 block">{densityAlt.toLocaleString()} ft</span>
            <span className="text-[10px] text-amber-700 font-mono block">Highveld +{parameters.densityAltAnomalyFeet} ft</span>
          </div>

          <div className="p-2 bg-white rounded-xl border border-sky-100 shadow-2xs col-span-2 sm:col-span-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">MAX X-WIND</span>
            <span className="text-sm font-bold font-mono text-slate-800 block">{parameters.maxCrosswindKts} kts</span>
            <span className="text-[10px] text-slate-500 font-mono block">Lim: {aircraftType === 'light_ga' ? '15 kts' : '25 kts'}</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-sky-100">
          <button
            onClick={() => setActiveTab('thresholds')}
            className={`pb-2.5 px-3 text-xs font-mono font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'thresholds'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>VFR / IFR Threshold Matrix</span>
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`pb-2.5 px-3 text-xs font-mono font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'checklist'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Interactive Pre-Flight Items ({completedItems}/{totalItems})</span>
          </button>
          <button
            onClick={() => setActiveTab('highveld')}
            className={`pb-2.5 px-3 text-xs font-mono font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'highveld'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mountain className="w-3.5 h-3.5" />
            <span>Highveld Hot & High Performance</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 scrollbar-thin">
          {/* TAB 1: Thresholds Matrix */}
          {activeTab === 'thresholds' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-mono font-bold uppercase tracking-wider">
                  BOKSBURG METEOROLOGICAL CONDITIONS VS SAFETY CRITERIA
                </span>
                <span className="text-[11px] text-sky-700 font-mono">SACAA PART 91 REGULATION</span>
              </div>

              <div className="divide-y divide-sky-100 border border-sky-200/80 rounded-2xl overflow-hidden bg-white shadow-xs">
                {checklistItems.map((item) => {
                  const isPass = item.status === 'PASS';
                  const isCaut = item.status === 'CAUTION';

                  return (
                    <div key={item.id} className="p-4 hover:bg-sky-50/40 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold font-mono ${
                              isPass
                                ? 'bg-emerald-100 text-emerald-700'
                                : isCaut
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {isPass ? 'OK' : isCaut ? '!' : 'X'}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 font-mono">{item.title}</h4>
                            <span className="text-[11px] text-slate-500 font-sans">{item.requirement}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-xs font-mono font-bold text-slate-800">{item.currentCondition}</div>
                            <span
                              className={`text-[10px] font-mono font-black uppercase ${
                                isPass ? 'text-emerald-600' : isCaut ? 'text-amber-600' : 'text-rose-600'
                              }`}
                            >
                              {item.status === 'PASS'
                                ? 'MEETS VFR STANDARDS'
                                : item.status === 'CAUTION'
                                ? 'PILOT CAUTION'
                                : 'RESTRICTED / IFR'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 font-sans mt-2 pl-9 leading-relaxed bg-slate-50/60 p-2 rounded-xl border border-slate-100">
                        {item.detail}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Interactive Checklist */}
          {activeTab === 'checklist' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
                    MANDATORY PRE-DEPARTURE SIGN-OFF
                  </h4>
                  <p className="text-xs text-slate-500">
                    Verify each safety item prior to engine start and runway taxi clearance.
                  </p>
                </div>
                <button
                  onClick={handleCheckAll}
                  className="px-3 py-1.5 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-800 font-mono text-xs font-bold transition-colors"
                >
                  Sign Off All
                </button>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono text-slate-600">
                  <span>Pre-Flight Readiness:</span>
                  <span className="font-bold">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      progressPercent === 100
                        ? 'bg-emerald-500'
                        : progressPercent > 50
                        ? 'bg-sky-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Checkbox List */}
              <div className="space-y-2.5">
                {checklistItems.map((item, idx) => {
                  const isChecked = !!checkedItems[item.id];
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggleCheck(item.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                        isChecked
                          ? 'bg-emerald-50/60 border-emerald-300 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-sky-300 hover:bg-sky-50/20'
                      }`}
                    >
                      <button className="mt-0.5 text-slate-400 hover:text-sky-600 transition-colors">
                        {isChecked ? (
                          <CheckSquare className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300" />
                        )}
                      </button>

                      <div className="flex-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className={`font-mono font-bold ${isChecked ? 'text-slate-900 line-through' : 'text-slate-800'}`}>
                            {idx + 1}. {item.title}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">{item.category}</span>
                        </div>
                        <div className="text-slate-600 font-sans mt-0.5">{item.detail}</div>
                        <div className="mt-1 font-mono text-[11px] text-sky-700 font-semibold">
                          Live Reading: {item.currentCondition}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Highveld Performance Calculator */}
          {activeTab === 'highveld' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start gap-3">
                <Mountain className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <h4 className="font-bold text-amber-900 font-mono text-sm">
                    Highveld 'Hot and High' Atmospheric Phenomenon
                  </h4>
                  <p className="text-slate-700 mt-1 leading-relaxed">
                    Boksburg and O. R. Tambo (FAOR) sit at an elevation of <strong>5,558 ft (1,694 m)</strong>. When surface temperatures reach <strong>{tempC}°C</strong>, the air thins dramatically, yielding a Density Altitude of <strong>{densityAlt.toLocaleString()} ft</strong>.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-white border border-sky-100 shadow-xs space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">
                    TAKEOFF ROLL IMPACT
                  </span>
                  <div className="text-2xl font-bold font-mono text-rose-600">+38%</div>
                  <p className="text-xs text-slate-600">
                    Aircraft ground roll increases by approximately 10% per 1,000 ft density altitude above sea level. Ensure runway length exceeds 1,400 m for light piston singles.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-sky-100 shadow-xs space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">
                    CLIMB RATE PENALTY
                  </span>
                  <div className="text-2xl font-bold font-mono text-amber-600">-30% to -45%</div>
                  <p className="text-xs text-slate-600">
                    Reduced engine oxygen intake and thinner air reduce propeller thrust. Maintain Vy best rate of climb and lean mixture for maximum power prior to takeoff roll.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <span className="font-mono font-bold uppercase text-slate-800 block">
                  SACAA Highveld Operational Rules:
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Never perform a full rich mixture takeoff on the Highveld above 20°C; lean to best power on run-up.</li>
                  <li>Calculate accelerate-stop distance (ASDR) using active OAT ({tempC}°C) and QNH ({qnh} hPa).</li>
                  <li>Schedule departures before 11:30 AM local time to avoid peak solar thermal heating and severe afternoon convective supercells.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-sky-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Pre-Flight Checklist compliant with SACAA AIP & ICAO Annex 3.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-mono text-xs font-bold transition-colors shadow-xs"
            >
              CLOSE & RESUME COCKPIT BRIEFING
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
