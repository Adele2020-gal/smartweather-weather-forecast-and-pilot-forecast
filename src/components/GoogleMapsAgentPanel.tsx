import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  Compass,
  Search,
  ExternalLink,
  ShieldAlert,
  Car,
  Footprints,
  Bike,
  Train,
  Clock,
  ArrowRight,
  Sparkles,
  Coffee,
  Store,
  Building2,
  Hospital,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Key,
  Plane,
  Radio,
  Activity,
} from 'lucide-react';
import { GooglePlace, GoogleRoute, LocationData, WeatherData, ExtremeWeatherEvent } from '../types';
import { AviationNotamRadar } from './AviationNotamRadar';
import { AirTrafficDensityMapLayer } from './AirTrafficDensityMapLayer';
import { DroneFlightSafetyOverlay } from './DroneFlightSafetyOverlay';

interface GoogleMapsAgentPanelProps {
  currentWeather: WeatherData;
  extremeState: ExtremeWeatherEvent;
  onClose?: () => void;
}

export const GoogleMapsAgentPanel: React.FC<GoogleMapsAgentPanelProps> = ({
  currentWeather,
  extremeState,
  onClose,
}) => {
  const { location, current } = currentWeather;

  const [activeTab, setActiveTab] = useState<'drone' | 'traffic' | 'notams' | 'places' | 'routes'>('drone');

  // Places state
  const [placeQuery, setPlaceQuery] = useState('storm shelter dry indoor cafe');
  const [selectedCategory, setSelectedCategory] = useState<string>('shelter');
  const [places, setPlaces] = useState<GooglePlace[]>([]);
  const [isPlacesLoading, setIsPlacesLoading] = useState(false);
  const [placesAttribution, setPlacesAttribution] = useState<string>('Google Maps Platform Places API (New)');
  const [demoKeyPrompt, setDemoKeyPrompt] = useState<string | null>(null);

  // Routes state
  const [origin, setOrigin] = useState(`${location.name}`);
  const [destination, setDestination] = useState('Metro Civic Center');
  const [travelMode, setTravelMode] = useState<'DRIVE' | 'WALK' | 'BICYCLE' | 'TRANSIT'>('DRIVE');
  const [route, setRoute] = useState<GoogleRoute | null>(null);
  const [isRouteLoading, setIsRouteLoading] = useState(false);

  // Fetch Places
  const fetchPlaces = async (queryText: string, category: string) => {
    setIsPlacesLoading(true);
    try {
      const res = await fetch('/api/maps/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          location: { latitude: location.latitude, longitude: location.longitude },
          category,
        }),
      });
      const data = await res.json();
      if (data.places) {
        setPlaces(data.places);
      }
      if (data.attribution) {
        setPlacesAttribution(data.attribution);
      }
      if (data.demoKeyPrompt) {
        setDemoKeyPrompt(data.demoKeyPrompt);
      }
    } catch (err) {
      console.error('Failed to query places:', err);
    } finally {
      setIsPlacesLoading(false);
    }
  };

  // Fetch Routes
  const fetchRoute = async (mode = travelMode) => {
    setIsRouteLoading(true);
    try {
      const res = await fetch('/api/maps/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination,
          travelMode: mode,
          weatherConditions: {
            temperature: current.temperature,
            precipitation: current.precipitation,
            precipitationProbability: current.precipitationProbability,
            windSpeed: current.windSpeed,
            isExtreme: extremeState.isExtreme,
          },
        }),
      });
      const data = await res.json();
      setRoute(data);
      if (data.demoKeyPrompt) {
        setDemoKeyPrompt(data.demoKeyPrompt);
      }
    } catch (err) {
      console.error('Failed to compute route:', err);
    } finally {
      setIsRouteLoading(false);
    }
  };

  // Initial load
  React.useEffect(() => {
    fetchPlaces('storm shelter', 'shelter');
  }, [location.latitude, location.longitude]);

  return (
    <div
      id="google-maps-agent-panel"
      className="p-6 sm:p-8 rounded-3xl bg-slate-900/95 border border-slate-800 text-slate-100 shadow-2xl backdrop-blur-xl relative overflow-hidden"
    >
      {/* Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white">Google Maps Aeronautical & Transit Agent</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                ATNS/SACAA NOTAMs Connected
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time South African Notice to Airmen (NOTAM) aerodrome markers, flight corridor hazards, safe havens, and navigation routes
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="self-end md:self-auto px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
          >
            Close View
          </button>
        )}
      </div>

      {/* Demo Key Ready Info Notice */}
      {demoKeyPrompt && (
        <div className="my-4 p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-between gap-3 text-xs font-mono text-blue-200">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Google Maps Platform Integration: Ready for live production keys.</span>
          </div>
          <a
            href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold tracking-wider text-[11px] shrink-0 transition-colors flex items-center gap-1"
          >
            <span>Get Free Maps Demo Key</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 pt-4 pb-5 border-b border-slate-800/80 font-mono text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('drone')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'drone'
              ? 'bg-amber-500/20 border border-amber-400/60 text-amber-200 font-bold shadow-sm'
              : 'bg-slate-950/40 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>Drone / UAV Safety Overlay (Boksburg NFZ)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
            sUAS Part 101
          </span>
        </button>
        <button
          onClick={() => setActiveTab('traffic')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'traffic'
              ? 'bg-blue-500/20 border border-blue-400/60 text-blue-200 font-bold shadow-sm'
              : 'bg-slate-950/40 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Air Traffic Density (Boksburg & FAOR)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
            Live Layer
          </span>
        </button>
        <button
          onClick={() => setActiveTab('notams')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'notams'
              ? 'bg-blue-500/20 border border-blue-400/60 text-blue-200 font-bold shadow-sm'
              : 'bg-slate-950/40 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Plane className="w-4 h-4 text-sky-400" />
          <span>SA NOTAM Airspace Radar</span>
        </button>
        <button
          onClick={() => setActiveTab('places')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'places'
              ? 'bg-blue-500/20 border border-blue-400/60 text-blue-200 font-bold shadow-sm'
              : 'bg-slate-950/40 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Safe Havens & Shelters</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('routes');
            if (!route) fetchRoute('DRIVE');
          }}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'routes'
              ? 'bg-blue-500/20 border border-blue-400/60 text-blue-200 font-bold shadow-sm'
              : 'bg-slate-950/40 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span>Weather-Aware Route Navigation</span>
        </button>
      </div>

      {/* TAB 0: DRONE / UAV FLIGHT SAFETY & NO-FLY ZONE OVERLAY */}
      {activeTab === 'drone' && (
        <div className="py-4">
          <DroneFlightSafetyOverlay
            currentWeather={currentWeather}
            extremeState={extremeState}
          />
        </div>
      )}

      {/* TAB 1: BOKSBURG & O.R. TAMBO AIR TRAFFIC DENSITY LAYER */}
      {activeTab === 'traffic' && (
        <div className="py-4">
          <AirTrafficDensityMapLayer
            currentWeather={currentWeather}
            extremeState={extremeState}
          />
        </div>
      )}

      {/* TAB 1: SA NOTAM AIRSPACE RADAR */}
      {activeTab === 'notams' && (
        <div className="py-4">
          <AviationNotamRadar currentWeather={currentWeather} />
        </div>
      )}

      {/* TAB 1: PLACES */}
      {activeTab === 'places' && (
        <div className="py-4 space-y-5">
          {/* Quick categories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
            <span className="text-slate-500 text-[11px] uppercase tracking-wider shrink-0 mr-1">Find:</span>
            {[
              { id: 'shelter', label: '🛡️ Emergency Storm Shelters', query: 'emergency storm shelter high ground' },
              { id: 'cafe', label: '☕ Heated Indoor Dry Cafes', query: 'heated indoor dry cafe with wifi' },
              { id: 'gear', label: '🧥 All-Weather Gear & Outfitters', query: 'waterproof outerwear clothing store gear' },
              { id: 'transit', label: '🚇 Underground Transit Hubs', query: 'subway station underground transit concourse' },
              { id: 'hospital', label: '🏥 Medical & Urgent Care', query: 'urgent care hospital emergency room' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setPlaceQuery(cat.query);
                  fetchPlaces(cat.query, cat.id);
                }}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all border ${
                  selectedCategory === cat.id
                    ? 'bg-blue-500/20 border-blue-400/60 text-blue-200 font-bold'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchPlaces(placeQuery, selectedCategory);
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={placeQuery}
                onChange={(e) => setPlaceQuery(e.target.value)}
                placeholder="Search Google Places near current coordinates..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isPlacesLoading}
              className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs font-mono tracking-wider transition-all shadow-md shadow-blue-600/20 shrink-0 flex items-center gap-1.5"
            >
              {isPlacesLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>SEARCH</span>
            </button>
          </form>

          {/* Places Results */}
          {isPlacesLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
              <p className="text-xs font-mono text-slate-400 tracking-widest uppercase">
                Querying Google Maps Places API...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {places.map((place) => (
                <div
                  key={place.id}
                  className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-blue-500/40 transition-all flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-white leading-tight">{place.displayName}</h4>
                      {place.rating && (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-[11px] shrink-0 font-bold">
                          ★ {place.rating}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 mt-1 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span>{place.formattedAddress}</span>
                    </p>

                    {place.weatherRelevanceNote && (
                      <div className="mt-2.5 p-2 rounded-xl bg-blue-950/30 border border-blue-500/20 text-[11px] text-blue-300 font-mono flex items-start gap-1.5 leading-relaxed">
                        <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                        <span>{place.weatherRelevanceNote}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span className={place.openNow ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                      {place.openNow ? '● Open Now' : 'Closed'}
                    </span>
                    {place.nationalPhoneNumber && (
                      <span className="text-slate-400">{place.nationalPhoneNumber}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ROUTES */}
      {activeTab === 'routes' && (
        <div className="py-4 space-y-5">
          {/* Route Inputs Form */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                  Origin Departure
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="Current Location or Address"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                  Destination Safe Point
                </label>
                <div className="relative">
                  <Navigation className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Target Shelter or Destination"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-400 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Travel Mode Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-1.5">
                {[
                  { mode: 'DRIVE' as const, label: 'Drive', icon: <Car className="w-3.5 h-3.5" /> },
                  { mode: 'WALK' as const, label: 'Walk', icon: <Footprints className="w-3.5 h-3.5" /> },
                  { mode: 'BICYCLE' as const, label: 'Bike', icon: <Bike className="w-3.5 h-3.5" /> },
                  { mode: 'TRANSIT' as const, label: 'Transit', icon: <Train className="w-3.5 h-3.5" /> },
                ].map((item) => (
                  <button
                    key={item.mode}
                    type="button"
                    onClick={() => {
                      setTravelMode(item.mode);
                      fetchRoute(item.mode);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs flex items-center gap-1.5 border transition-all ${
                      travelMode === item.mode
                        ? 'bg-blue-500/20 border-blue-400 text-blue-200 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => fetchRoute()}
                disabled={isRouteLoading}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs font-mono tracking-wider transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5"
              >
                {isRouteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                <span>COMPUTE DIRECTIONS</span>
              </button>
            </div>
          </div>

          {/* Route Results */}
          {isRouteLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
              <p className="text-xs font-mono text-slate-400 tracking-widest uppercase">
                Calculating Google Routes API corridor hazards...
              </p>
            </div>
          ) : route ? (
            <div className="space-y-4">
              {/* Route Summary Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">Directions:</span>
                    <span className="font-bold text-white">{route.origin}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                    <span className="font-bold text-white">{route.destination}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 font-mono text-xs">
                    <span className="text-white font-bold text-base">{route.durationText}</span>
                    <span className="text-slate-400">({route.distanceText})</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                      {route.travelMode}
                    </span>
                  </div>
                </div>

                {/* Hazard Score */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right font-mono">
                    <div className="text-[10px] uppercase text-slate-500">Transit Hazard</div>
                    <div
                      className={`text-sm font-bold ${
                        route.weatherHazardScore === 'HIGH'
                          ? 'text-red-400'
                          : route.weatherHazardScore === 'MODERATE'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {route.weatherHazardScore} RISK
                    </div>
                  </div>
                </div>
              </div>

              {/* Weather Transit Advice Callout */}
              <div
                className={`p-3.5 rounded-2xl border text-xs font-mono flex items-start gap-2.5 ${
                  route.weatherHazardScore === 'HIGH'
                    ? 'bg-red-950/30 border-red-500/40 text-red-200'
                    : route.weatherHazardScore === 'MODERATE'
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                    : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                }`}
              >
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong>Meteorological Advisory:</strong> {route.weatherTransitAdvice}
                </div>
              </div>

              {/* Turn by turn steps */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Turn-by-Turn Waypoints with Environmental Sensors
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {route.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono flex items-center justify-center text-slate-400 shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="text-slate-200 font-medium">{step.instruction}</div>
                          {step.weatherWarning && (
                            <div className="mt-1 text-[11px] text-amber-400 font-mono flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>{step.weatherWarning}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right font-mono text-slate-500 shrink-0 text-[11px]">
                        <div>{step.distance}</div>
                        <div>{step.duration}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
