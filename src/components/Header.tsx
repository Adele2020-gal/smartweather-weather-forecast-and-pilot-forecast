import React, { useState, useEffect, useRef } from 'react';
import {
  CloudLightning,
  Search,
  MapPin,
  Compass,
  AlertTriangle,
  Flame,
  Snowflake,
  Wind,
  Droplets,
  RotateCcw,
  Sparkles,
  Layers,
  X,
  History,
  Map,
  User,
  Bell,
  Home,
  Briefcase,
  Plane,
  Award,
} from 'lucide-react';
import { LocationData, UserPreferences, ExtremeWeatherEvent, ExtremeEventType, UserProfile, WeatherNotification, SavedLocation } from '../types';
import { WeatherNotificationBanner } from './WeatherNotificationBanner';

interface HeaderProps {
  currentLocation: LocationData;
  onSelectLocation: (loc: LocationData) => void;
  userPrefs: UserPreferences;
  onUpdatePrefs: (prefs: Partial<UserPreferences>) => void;
  extremeState: ExtremeWeatherEvent;
  simulatedEvent: ExtremeEventType | null;
  onSimulateExtreme: (type: ExtremeEventType | null) => void;
  isEscalated: boolean;
  onToggleEscalation: () => void;
  isLoading: boolean;
  onOpenChat: () => void;
  userProfile: UserProfile;
  onOpenProfile: () => void;
  onOpenHistorical: () => void;
  onOpenMaps: () => void;
  onOpenClimateImpact?: () => void;
  notifications: WeatherNotification[];
  onDismissNotification: (id: string) => void;
  onClearNotifications: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

const PRESET_CITIES: LocationData[] = [
  { name: 'Johannesburg', country: 'South Africa', admin1: 'Gauteng', latitude: -26.2041, longitude: 28.0473, timezone: 'Africa/Johannesburg' },
  { name: 'Cape Town', country: 'South Africa', admin1: 'Western Cape', latitude: -33.9249, longitude: 18.4241, timezone: 'Africa/Johannesburg' },
  { name: 'Durban', country: 'South Africa', admin1: 'KwaZulu-Natal', latitude: -29.8587, longitude: 31.0218, timezone: 'Africa/Johannesburg' },
  { name: 'Pretoria', country: 'South Africa', admin1: 'Gauteng', latitude: -25.7479, longitude: 28.2293, timezone: 'Africa/Johannesburg' },
  { name: 'Gqeberha', country: 'South Africa', admin1: 'Eastern Cape', latitude: -33.9608, longitude: 25.6022, timezone: 'Africa/Johannesburg' },
  { name: 'Bloemfontein', country: 'South Africa', admin1: 'Free State', latitude: -29.0852, longitude: 26.1596, timezone: 'Africa/Johannesburg' },
];

export const Header: React.FC<HeaderProps> = ({
  currentLocation,
  onSelectLocation,
  userPrefs,
  onUpdatePrefs,
  extremeState,
  simulatedEvent,
  onSimulateExtreme,
  isEscalated,
  onToggleEscalation,
  isLoading,
  onOpenChat,
  userProfile,
  onOpenProfile,
  onOpenHistorical,
  onOpenMaps,
  onOpenClimateImpact,
  notifications,
  onDismissNotification,
  onClearNotifications,
  soundEnabled,
  onToggleSound,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSimMenu, setShowSimMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const searchRef = useRef<HTMLDivElement>(null);

  // Running clock for Bento header
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/weather/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error('Search fetch failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close search dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUseGPS = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onSelectLocation({
            name: 'Current Location',
            country: 'Hyper-Local GPS',
            latitude: Number(pos.coords.latitude.toFixed(4)),
            longitude: Number(pos.coords.longitude.toFixed(4)),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'auto',
          });
        },
        (err) => {
          console.warn('Geolocation denied or failed:', err);
        }
      );
    }
  };

  const timeStr = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <header
      id="app-header"
      className={`sticky top-0 z-40 transition-colors duration-500 backdrop-blur-xl border-b ${
        extremeState.isExtreme || isEscalated
          ? 'bg-white/95 border-rose-400 shadow-lg shadow-rose-200/50'
          : 'bg-white/90 border-sky-200/80 shadow-[0_4px_20px_rgba(2,132,199,0.06)]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Logo, Hyper-Local Tag, and Station Badge */}
          <div className="flex items-center justify-between w-full lg:w-auto">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                  extremeState.isExtreme || isEscalated
                    ? 'bg-rose-600 text-white shadow-[0_4px_14px_rgba(225,29,72,0.4)] ring-2 ring-rose-300 animate-pulse'
                    : 'bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-[0_4px_12px_rgba(2,132,199,0.25)] ring-2 ring-sky-200'
                }`}
              >
                {extremeState.isExtreme || isEscalated ? (
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                ) : (
                  <CloudLightning className="w-6 h-6" />
                )}
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-sky-700 font-bold mb-0.5 flex items-center gap-1.5 font-mono">
                  <span>SMARTWEATHER SA</span>
                  <span>•</span>
                  <span>SOUTH AFRICA ONLY</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-light italic text-slate-900 tracking-tight">
                    {currentLocation.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg border border-sky-200 text-[10px] bg-sky-50 font-mono text-sky-800 font-semibold tracking-wider shadow-sm">
                    ZA-STATION
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                id="mobile-chat-btn"
                onClick={onOpenChat}
                className="p-2 rounded-xl bg-sky-100 border border-sky-300 text-sky-700 hover:bg-sky-200 shadow-sm"
                title="Open AI Weather Assistant"
              >
                <Sparkles className="w-5 h-5" />
              </button>
              <button
                id="mobile-escalate-btn"
                onClick={onToggleEscalation}
                className={`p-2 rounded-xl text-xs font-bold transition-all border ${
                  isEscalated
                    ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                    : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'
                }`}
                title="Toggle Extreme Event Intensity"
              >
                <AlertTriangle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Hyper-Local Search Bar */}
          <div ref={searchRef} className="relative w-full lg:max-w-md">
            <div className="relative flex items-center">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sky-500">
                <Search className="w-4 h-4 text-sky-500" />
              </div>
              <input
                id="location-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
                placeholder="Search South African city, town, or province..."
                className="w-full pl-10 pr-20 py-2.5 bg-sky-50/80 border border-sky-200/90 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:bg-white transition-all shadow-[inset_0_2px_4px_rgba(2,132,199,0.04)]"
              />
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  id="gps-btn"
                  onClick={handleUseGPS}
                  title="Detect hyper-local GPS position"
                  className="px-2 py-1 text-xs text-sky-700 hover:text-sky-900 bg-white hover:bg-sky-100 rounded-lg flex items-center gap-1 transition-colors border border-sky-200 shadow-xs"
                >
                  <MapPin className="w-3.5 h-3.5 text-sky-600" />
                  <span className="font-mono text-[10px] font-bold">GPS</span>
                </button>
              </div>
            </div>

            {/* Search Dropdown Results */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white/98 backdrop-blur-xl border border-sky-200 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-72 overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center text-xs text-sky-700 font-mono">Querying South Africa station network...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((loc, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        onSelectLocation(loc);
                        setSearchQuery('');
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-sky-50 transition-colors flex items-center justify-between border-b border-sky-100 last:border-0"
                    >
                      <div className="flex items-center gap-2.5">
                        <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
                        <div>
                          <div className="font-semibold text-sm text-slate-800">{loc.name}</div>
                          <div className="text-xs text-slate-500">
                            {[loc.admin1, loc.country].filter(Boolean).join(', ')}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-sky-700">
                        {loc.latitude.toFixed(2)}°, {loc.longitude.toFixed(2)}°
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500 font-mono">
                    No South African areas found matching "{searchQuery}".
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Action Tools: Digital Clock, Units, Extreme Simulator */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
            {/* Bento Digital Clock & Date */}
            <div className="hidden sm:block text-right pr-2 border-r border-sky-200">
              <p className="text-lg font-mono font-medium text-slate-800 tracking-wider leading-none">
                {timeStr}
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-semibold">
                {dateStr}
              </p>
            </div>

            {/* Unit Switcher */}
            <div className="flex items-center bg-sky-100/70 rounded-xl p-0.5 border border-sky-200 text-xs shadow-inner">
              <button
                id="unit-c-btn"
                onClick={() => onUpdatePrefs({ tempUnit: 'C' })}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  userPrefs.tempUnit === 'C' ? 'bg-white text-sky-700 shadow-xs border border-sky-200' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                °C
              </button>
              <button
                id="unit-f-btn"
                onClick={() => onUpdatePrefs({ tempUnit: 'F' })}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  userPrefs.tempUnit === 'F' ? 'bg-white text-sky-700 shadow-xs border border-sky-200' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                °F
              </button>
            </div>

            {/* Extreme Weather Escalation Intensity Simulator */}
            <div className="relative">
              <button
                id="extreme-intensity-trigger-btn"
                onClick={() => setShowSimMenu(!showSimMenu)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  extremeState.isExtreme || isEscalated
                    ? 'bg-rose-600 text-white border-rose-500 shadow-md animate-pulse'
                    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 shadow-xs'
                }`}
                title="Simulate Extreme Weather Severity Escalation"
              >
                <div className={`w-1.5 h-1.5 rounded-full ${isEscalated ? 'bg-white' : 'bg-rose-500'}`} />
                <span>
                  {simulatedEvent && simulatedEvent !== 'NONE'
                    ? `Sim: ${simulatedEvent.replace('_', ' ')}`
                    : isEscalated
                    ? 'Extreme Active'
                    : 'Intensity Simulator'}
                </span>
              </button>

              {/* Simulation Dropdown */}
              {showSimMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-sky-200 rounded-2xl shadow-2xl p-2 z-50">
                  <div className="text-[11px] font-bold text-slate-500 px-2 py-1 uppercase tracking-wider font-mono">
                    Extreme Event Escalation
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        onSimulateExtreme('HURRICANE_GALE');
                        setShowSimMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-rose-50 text-rose-800 flex items-center gap-2"
                    >
                      <Wind className="w-4 h-4 text-rose-600" />
                      <div>
                        <div className="font-semibold">Cape Southeaster / Gale</div>
                        <div className="text-[10px] text-slate-500">140 km/h coastal wind damage</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        onSimulateExtreme('HEATWAVE');
                        setShowSimMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-amber-50 text-amber-900 flex items-center gap-2"
                    >
                      <Flame className="w-4 h-4 text-amber-600" />
                      <div>
                        <div className="font-semibold">44°C Karoo / Highveld Heat</div>
                        <div className="text-[10px] text-slate-500">Hyperthermia & power grid emergency</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        onSimulateExtreme('BLIZZARD');
                        setShowSimMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-sky-50 text-sky-900 flex items-center gap-2"
                    >
                      <Snowflake className="w-4 h-4 text-sky-600" />
                      <div>
                        <div className="font-semibold">Drakensberg Snow Blizzard</div>
                        <div className="text-[10px] text-slate-500">Sub-zero pass road closures</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        onSimulateExtreme('FLASH_FLOOD');
                        setShowSimMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-blue-50 text-blue-900 flex items-center gap-2"
                    >
                      <Droplets className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="font-semibold">Flash Flood Deluge</div>
                        <div className="text-[10px] text-slate-500">45 mm/hr torrential storm surge</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        onSimulateExtreme('TORNADO_SUPERCELL');
                        setShowSimMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-indigo-50 text-indigo-900 flex items-center gap-2"
                    >
                      <CloudLightning className="w-4 h-4 text-indigo-600" />
                      <div>
                        <div className="font-semibold">Highveld Supercell & Hail</div>
                        <div className="text-[10px] text-slate-500">Severe vehicle & roof hail damage</div>
                      </div>
                    </button>
                    {simulatedEvent && (
                      <button
                        onClick={() => {
                          onSimulateExtreme(null);
                          setShowSimMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs rounded-xl bg-sky-50 text-sky-800 hover:bg-sky-100 flex items-center gap-2 font-medium border-t border-sky-100 mt-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-sky-600" />
                        <span>Reset to Live Sensors</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Historical Archive Trigger */}
            <button
              id="historical-archive-toggle-btn"
              onClick={onOpenHistorical}
              className="btn-3d-secondary px-3 py-1.5 text-xs font-mono font-semibold flex items-center gap-1.5"
              title="Query Historical Climate Data Archive"
            >
              <History className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Historical</span>
            </button>

            {/* Google Maps Transit & Shelters Trigger */}
            <button
              id="google-maps-toggle-btn"
              onClick={onOpenMaps}
              className="btn-3d-secondary px-3 py-1.5 text-xs font-mono font-semibold flex items-center gap-1.5"
              title="Google Maps Places & Weather Route Navigation"
            >
              <Compass className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden sm:inline">Maps & Safe Areas</span>
            </button>

            {/* Climate Impact & Badges Hub Trigger */}
            {onOpenClimateImpact && (
              <button
                id="climate-impact-header-btn"
                onClick={onOpenClimateImpact}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 transition-all shadow-xs group"
                title="Climate Impact, Decadal Trends & Badges Hub"
              >
                <Award className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Climate Impact</span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-200/80 text-[10px] text-emerald-900 font-bold">
                  {userProfile.preparedness?.currentStreak ?? 1}d
                </span>
              </button>
            )}

            {/* Weather Push Notification Center */}
            <WeatherNotificationBanner
              notifications={notifications}
              extremeEvent={extremeState}
              onDismiss={onDismissNotification}
              onClearAll={onClearNotifications}
              soundEnabled={soundEnabled}
              onToggleSound={onToggleSound}
            />

            {/* User Profile & Calibration Trigger */}
            <button
              id="user-profile-toggle-btn"
              onClick={onOpenProfile}
              className="btn-3d-secondary px-3 py-1.5 text-xs font-mono font-semibold flex items-center gap-1.5"
              title="User Profile, Saved Areas & Thermal Preferences"
            >
              <User className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden md:inline">{userProfile.username || 'Profile'}</span>
            </button>

            {/* AI Assistant Chat Trigger */}
            <button
              id="ai-assistant-toggle-btn"
              onClick={onOpenChat}
              className="btn-3d-primary hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Advisor</span>
            </button>
          </div>
        </div>

        {/* Preset City & Saved Locations Quick Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2 scrollbar-none text-xs border-t border-sky-100 mt-2">
          {/* User's Saved Locations */}
          {userProfile.savedLocations.length > 0 && (
            <>
              <span className="text-sky-700 text-[11px] font-mono font-bold uppercase tracking-wider shrink-0 pr-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-sky-600" />
                <span>My SA Areas:</span>
              </span>
              {userProfile.savedLocations.map((saved) => (
                <button
                  key={saved.id}
                  onClick={() =>
                    onSelectLocation({
                      name: saved.name,
                      country: saved.country,
                      latitude: saved.latitude,
                      longitude: saved.longitude,
                      timezone: saved.timezone,
                      admin1: saved.admin1,
                    })
                  }
                  className={`px-3 py-1 rounded-full whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                    currentLocation.name === saved.name
                      ? 'bg-sky-500 text-white border-sky-600 font-bold shadow-xs'
                      : 'bg-white border-sky-200 text-slate-700 hover:bg-sky-50 shadow-2xs'
                  }`}
                >
                  {saved.tag === 'Home' && <Home className="w-3 h-3 text-sky-600" />}
                  {saved.tag === 'Work' && <Briefcase className="w-3 h-3 text-blue-600" />}
                  {saved.tag === 'Travel' && <Plane className="w-3 h-3 text-amber-600" />}
                  {saved.tag === 'Custom' && <MapPin className="w-3 h-3 text-slate-500" />}
                  <span>{saved.label || saved.name}</span>
                </button>
              ))}
              <span className="text-sky-200 mx-1">|</span>
            </>
          )}

          <span className="text-slate-500 text-[11px] font-semibold shrink-0 pr-1">SA Hubs:</span>
          {PRESET_CITIES.map((city) => (
            <button
              key={city.name}
              onClick={() => onSelectLocation(city)}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all border ${
                currentLocation.name === city.name
                  ? 'bg-sky-600 text-white border-sky-700 font-semibold shadow-xs'
                  : 'bg-white border-sky-200 text-sky-900 hover:bg-sky-50'
              }`}
            >
              {city.name}
            </button>
          ))}
          <button
            onClick={handleUseGPS}
            className="px-2.5 py-1 rounded-full whitespace-nowrap bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 flex items-center gap-1 font-semibold"
          >
            <Compass className="w-3 h-3 text-emerald-600" />
            <span>My SA Lat/Lon</span>
          </button>
        </div>
      </div>
    </header>
  );
};
