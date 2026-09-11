import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LocationData,
  WeatherData,
  UserPreferences,
  ExtremeWeatherEvent,
  ExtremeEventType,
  ClothingRecommendation,
  MLForecastData,
  UserProfile,
  WeatherNotification,
  SavedLocation,
} from './types';
import { Header } from './components/Header';
import { ExtremeWeatherEscalation } from './components/ExtremeWeatherEscalation';
import { CurrentWeatherCard } from './components/CurrentWeatherCard';
import { FlightWeatherPredictorCard } from './components/FlightWeatherPredictorCard';
import { MLEnsembleDashboard } from './components/MLEnsembleDashboard';
import { ForecastCharts } from './components/ForecastCharts';
import { WeatherRadarSim } from './components/WeatherRadarSim';
import { AIChatDrawer } from './components/AIChatDrawer';
import { HistoricalWeatherPanel } from './components/HistoricalWeatherPanel';
import { GoogleMapsAgentPanel } from './components/GoogleMapsAgentPanel';
import { UserProfileModal } from './components/UserProfileModal';
import { ClimateImpactDashboard } from './components/ClimateImpactDashboard';
import { ThreeDWeatherSphere } from './components/ThreeDWeatherSphere';
import { RainIntelligenceCard } from './components/RainIntelligenceCard';
import { evaluateExtremeWeather } from './utils/extremeWeather';
import { computeMLEnsembleForecast } from './utils/mlEngine';
import { playWeatherAlertChime } from './utils/audioAlert';
import { INITIAL_PREPAREDNESS_STATE, recordExtremeEventPrep } from './utils/preparednessEngine';
import { Loader2, AlertTriangle, ShieldCheck, Sparkles, History, Compass, MapPin, Globe2, Plane } from 'lucide-react';

const DEFAULT_LOCATION: LocationData = {
  name: 'Boksburg',
  country: 'South Africa',
  admin1: 'Gauteng',
  latitude: -26.2127,
  longitude: 28.2575,
  timezone: 'Africa/Johannesburg',
  elevation: 1600,
};

const DEFAULT_PROFILE: UserProfile = {
  id: 'usr_adelaide_ngwenya',
  username: 'Adelaide Ngwenya',
  savedLocations: [
    {
      id: 'loc_home',
      name: 'Boksburg',
      label: 'Home Base (Boksburg, Ekurhuleni)',
      tag: 'Home',
      country: 'South Africa',
      admin1: 'Gauteng',
      latitude: -26.2127,
      longitude: 28.2575,
      timezone: 'Africa/Johannesburg',
      isDefault: true,
    },
    {
      id: 'loc_work',
      name: 'O.R. Tambo Intl (FAOR)',
      label: 'Airport Terminal & Flight Ops',
      tag: 'Work',
      country: 'South Africa',
      admin1: 'Gauteng',
      latitude: -26.1392,
      longitude: 28.2460,
      timezone: 'Africa/Johannesburg',
    },
    {
      id: 'loc_rand',
      name: 'Rand Airport (FAGM)',
      label: 'General Aviation Flight Hub',
      tag: 'Custom',
      country: 'South Africa',
      admin1: 'Gauteng',
      latitude: -26.2431,
      longitude: 28.1511,
      timezone: 'Africa/Johannesburg',
    },
    {
      id: 'loc_holiday',
      name: 'Cape Town (FACT)',
      label: 'Atlantic Coastal Aerodrome',
      tag: 'Travel',
      country: 'South Africa',
      admin1: 'Western Cape',
      latitude: -33.9249,
      longitude: 18.4241,
      timezone: 'Africa/Johannesburg',
    },
    {
      id: 'loc_coastal',
      name: 'Durban (FALE)',
      label: 'King Shaka Intl Airspace',
      tag: 'Custom',
      country: 'South Africa',
      admin1: 'KwaZulu-Natal',
      latitude: -29.8587,
      longitude: 31.0218,
      timezone: 'Africa/Johannesburg',
    },
  ],
  preferences: {
    activity: 'commute',
    thermalSensitivity: 'neutral',
    style: 'smart_casual',
    waterproofSensitivity: 'normal',
    tempUnit: 'C',
    precipUnit: 'mm',
    windUnit: 'kmh',
    pressureUnit: 'hPa',
    timeFormat: '12h',
    alertSubscriptions: {
      hurricanes: true,
      tornadoes: true,
      blizzards: true,
      heatwaves: true,
      flashFloods: true,
      severeStorms: true,
      highWinds: true,
    },
    minAlertSeverity: 'ALL',
    soundAlerts: true,
    browserNotifications: false,
  },
  preparedness: INITIAL_PREPAREDNESS_STATE,
};

export default function App() {
  // Load profile from localStorage if present
  const [profile, setProfile] = useState<UserProfile>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('smartweather_profile_v2');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (!parsed.preparedness) {
            parsed.preparedness = INITIAL_PREPAREDNESS_STATE;
          }
          // Filter to South African locations only, eliminating any overseas locations and ensuring Boksburg is Home
          parsed.savedLocations = (parsed.savedLocations || [])
            .filter(
              (loc: SavedLocation) =>
                loc.country?.toLowerCase().includes('south africa') ||
                loc.timezone === 'Africa/Johannesburg' ||
                ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Mpumalanga', 'Limpopo', 'North West', 'Northern Cape'].includes(loc.admin1 || '')
            )
            .map((loc: SavedLocation) => {
              if (loc.name.toLowerCase().includes('london') || loc.tag === 'Home') {
                return {
                  ...loc,
                  name: 'Boksburg',
                  label: 'Home Base (Boksburg, Ekurhuleni)',
                  tag: 'Home',
                  country: 'South Africa',
                  admin1: 'Gauteng',
                  latitude: -26.2127,
                  longitude: 28.2575,
                  timezone: 'Africa/Johannesburg',
                  isDefault: true,
                };
              }
              return loc;
            });

          const hasBoksburg = parsed.savedLocations.some((l: SavedLocation) => l.name === 'Boksburg');
          if (!hasBoksburg) {
            parsed.savedLocations.unshift(DEFAULT_PROFILE.savedLocations[0]);
          }

          if (!parsed.savedLocations.length) {
            parsed.savedLocations = DEFAULT_PROFILE.savedLocations;
          }
          if (parsed.username === 'Alex Traveler') {
            parsed.username = 'Adelaide Ngwenya';
          }
          return parsed;
        }
      } catch (e) {
        console.warn('Failed to parse saved profile:', e);
      }
    }
    return DEFAULT_PROFILE;
  });

  const climateImpactRef = useRef<HTMLDivElement>(null);

  // Sync profile to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('smartweather_profile_v2', JSON.stringify(profile));
      } catch (e) {
        console.warn('Failed to save profile:', e);
      }
    }
  }, [profile]);

  const [currentLocation, setCurrentLocation] = useState<LocationData>(() => {
    const def = profile.savedLocations.find((l) => l.isDefault);
    if (def && !def.name.toLowerCase().includes('london')) {
      return {
        name: def.name,
        country: def.country,
        latitude: def.latitude,
        longitude: def.longitude,
        timezone: def.timezone,
        admin1: def.admin1,
      };
    }
    return DEFAULT_LOCATION;
  });

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Extreme Weather & Escalation State
  const [simulatedEvent, setSimulatedEvent] = useState<ExtremeEventType | null>(null);
  const [extremeState, setExtremeState] = useState<ExtremeWeatherEvent>({
    isExtreme: false,
    severity: 'NONE',
    eventType: 'NONE',
    intensityScore: 12,
    title: 'Normal Weather Pattern',
    headline: 'Atmospheric conditions standard',
    description: '',
    dangerFactors: [],
    safetyInstructions: [],
    recommendedGear: [],
    evacuateOrShelter: 'SAFE_OUTDOORS',
    activeUntil: 'Ongoing',
  });
  const [isEscalated, setIsEscalated] = useState<boolean>(false);

  // ML Ensemble State
  const [mlData, setMlData] = useState<MLForecastData | null>(null);

  // Modals & Panels
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isHistoricalOpen, setIsHistoricalOpen] = useState<boolean>(false);
  const [isMapsOpen, setIsMapsOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  // Active Notifications list
  const [notifications, setNotifications] = useState<WeatherNotification[]>([]);
  const lastAlertIdRef = useRef<string | null>(null);

  // Save profile changes to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('smartweather_profile_v2', JSON.stringify(profile));
      } catch (e) {
        console.warn('Failed to save profile:', e);
      }
    }
  }, [profile]);

  // Push notification permission handler
  const handleRequestPushPermission = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (e) {
      console.warn('Push permission error:', e);
      return false;
    }
  };

  // Fetch forecast from server
  const fetchWeather = useCallback(
    async (loc: LocationData) => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const url = `/api/weather/forecast?lat=${loc.latitude}&lon=${loc.longitude}&name=${encodeURIComponent(
          loc.name
        )}&country=${encodeURIComponent(loc.country)}&timezone=${encodeURIComponent(loc.timezone)}`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Failed to load forecast: HTTP ${res.status}`);
        }
        const data: WeatherData = await res.json();
        setWeather(data);

        // Compute extreme state
        const ext = evaluateExtremeWeather(data.current, simulatedEvent);
        setExtremeState(ext);
        if (ext.isExtreme) {
          setIsEscalated(true);
        }

        // Compute ML ensemble forecast
        const ml = computeMLEnsembleForecast(data.current, data.hourly);
        setMlData(ml);
      } catch (err: any) {
        console.error('Weather retrieval failed:', err);
        setErrorMsg(err.message || 'Unable to fetch hyper-local data');
      } finally {
        setIsLoading(false);
      }
    },
    [simulatedEvent]
  );

  // Initial load
  useEffect(() => {
    fetchWeather(currentLocation);
  }, [currentLocation]);

  // When simulated event changes, re-evaluate and trigger push notification
  useEffect(() => {
    if (weather) {
      const ext = evaluateExtremeWeather(weather.current, simulatedEvent);
      setExtremeState(ext);
      if (ext.isExtreme || (simulatedEvent && simulatedEvent !== 'NONE')) {
        setIsEscalated(true);

        // Build push notification alert if not already notified for this event instance
        const alertKey = `${ext.eventType}_${weather.location.name}`;
        if (lastAlertIdRef.current !== alertKey) {
          lastAlertIdRef.current = alertKey;

          let cat: WeatherNotification['category'] = 'GENERAL';
          if (ext.eventType === 'HURRICANE_GALE') cat = 'HURRICANE';
          else if (ext.eventType === 'TORNADO_SUPERCELL') cat = 'TORNADO';
          else if (ext.eventType === 'BLIZZARD') cat = 'BLIZZARD';
          else if (ext.eventType === 'HEATWAVE') cat = 'HEATWAVE';
          else if (ext.eventType === 'FLASH_FLOOD') cat = 'FLASH_FLOOD';
          else if (ext.eventType === 'SEVERE_THUNDERSTORM') cat = 'SEVERE_STORM';

          const newNotif: WeatherNotification = {
            id: `notif_${Date.now()}`,
            title: ext.title,
            category: cat,
            severity: ext.severity === 'EMERGENCY' ? 'CRITICAL' : 'WARNING',
            message: ext.headline,
            actionableAdvice: ext.safetyInstructions[0] || 'Seek immediate indoor shelter and monitor local alerts.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            expiresAt: ext.activeUntil || 'Next 6 hours',
            locationName: weather.location.name,
            isRead: false,
          };

          setNotifications((prev) => [newNotif, ...prev]);

          // Auditory alert ping
          if (profile.preferences.soundAlerts) {
            playWeatherAlertChime(ext.severity === 'EMERGENCY' ? 'CRITICAL' : 'WARNING');
          }

          // Native browser push notification
          if (
            profile.preferences.browserNotifications &&
            typeof window !== 'undefined' &&
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            try {
              new Notification(`WEATHER ALERT: ${ext.title}`, {
                body: `${ext.headline}\nAction: ${newNotif.actionableAdvice}`,
              });
            } catch (err) {
              console.warn('Native notification error:', err);
            }
          }
        }
      } else {
        setIsEscalated(false);
      }
    }
  }, [simulatedEvent, weather, profile.preferences]);

  const handleUpdatePrefs = (newPrefs: Partial<UserPreferences>) => {
    setProfile((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        ...newPrefs,
      },
    }));
  };

  const handleSelectLocation = (loc: LocationData) => {
    setCurrentLocation(loc);
  };

  const handleSelectSavedLocation = (saved: SavedLocation) => {
    setCurrentLocation({
      name: saved.name,
      country: saved.country,
      latitude: saved.latitude,
      longitude: saved.longitude,
      timezone: saved.timezone,
      admin1: saved.admin1,
    });
  };

  const handleResetExtreme = () => {
    setSimulatedEvent(null);
    setIsEscalated(false);
    if (weather) {
      const ext = evaluateExtremeWeather(weather.current, null);
      setExtremeState(ext);
    }
  };

  const handleDismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  const handleToggleSound = () => {
    handleUpdatePrefs({ soundAlerts: !profile.preferences.soundAlerts });
  };

  const handleUpdatePreparedness = (newPrep: any) => {
    setProfile((prev) => ({
      ...prev,
      preparedness: newPrep,
    }));
  };

  const handleScrollToClimateImpact = () => {
    if (climateImpactRef.current) {
      climateImpactRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div
      id="smartweather-app-root"
      className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-sky-100/50 text-slate-800 selection:bg-sky-500 selection:text-white font-sans"
    >
      {/* Background ambient lighting glows for Bento Grid depth */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main Header */}
      <Header
        currentLocation={currentLocation}
        onSelectLocation={handleSelectLocation}
        userPrefs={profile.preferences}
        onUpdatePrefs={handleUpdatePrefs}
        extremeState={extremeState}
        simulatedEvent={simulatedEvent}
        onSimulateExtreme={(type) => setSimulatedEvent(type)}
        isEscalated={isEscalated}
        onToggleEscalation={() => setIsEscalated(!isEscalated)}
        isLoading={isLoading}
        onOpenChat={() => setIsChatOpen(true)}
        userProfile={profile}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenHistorical={() => setIsHistoricalOpen(!isHistoricalOpen)}
        onOpenMaps={() => setIsMapsOpen(!isMapsOpen)}
        onOpenClimateImpact={handleScrollToClimateImpact}
        notifications={notifications}
        onDismissNotification={handleDismissNotification}
        onClearNotifications={handleClearNotifications}
        soundEnabled={profile.preferences.soundAlerts}
        onToggleSound={handleToggleSound}
      />

      {/* Main Bento Grid Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Extreme Weather Escalation Warning Mode */}
        <ExtremeWeatherEscalation
          extremeState={extremeState}
          isEscalated={isEscalated}
          onToggleEscalation={() => setIsEscalated(!isEscalated)}
          onReset={handleResetExtreme}
        />

        {/* Loading / Error States */}
        {isLoading && !weather && (
          <div className="flex flex-col items-center justify-center py-28 space-y-4">
            <Loader2 className="w-10 h-10 text-sky-600 animate-spin" />
            <div className="text-xs font-mono tracking-widest uppercase text-sky-700 font-semibold">
              Synthesizing hyper-local South African telemetry...
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-6 rounded-3xl bg-rose-50 border border-rose-300 flex items-center justify-between text-rose-800 text-sm shadow-md">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span className="font-mono text-xs font-semibold">{errorMsg}</span>
            </div>
            <button
              onClick={() => fetchWeather(currentLocation)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono font-bold tracking-wider transition-colors shadow-xs"
            >
              RETRY CONNECTION
            </button>
          </div>
        )}

        {weather && mlData && (
          <div className="space-y-8">
            {/* Row 1: Current Weather Card & Aviation Flight Weather Predictor */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Current Weather Card & Doppler Radar */}
              <div className="lg:col-span-6 space-y-8">
                <CurrentWeatherCard weather={weather} userPrefs={profile.preferences} />
                <WeatherRadarSim weather={weather} extremeState={extremeState} />
              </div>

              {/* Right Column: Aviation Flight Weather & Pilot Safety Intelligence */}
              <div className="lg:col-span-6">
                <FlightWeatherPredictorCard
                  weather={weather}
                  userPrefs={profile.preferences}
                  extremeState={extremeState}
                />
              </div>
            </div>

            {/* Row 2: 3D Interactive Weather Sphere (South Africa 3D Features & Volumetric Convection) */}
            <ThreeDWeatherSphere
              currentLocation={weather.location}
              onSelectLocation={(saLoc) => {
                handleSelectLocation({
                  name: saLoc.name,
                  country: 'South Africa',
                  admin1: saLoc.admin1,
                  latitude: saLoc.lat,
                  longitude: saLoc.lon,
                  timezone: 'Africa/Johannesburg',
                });
              }}
              isRaining={weather.current.precipitation > 0.1 || weather.current.precipitationProbability > 40}
              weather={weather}
              extremeState={extremeState}
            />

            {/* Row 3: Rain Intelligence & 3D Volumetric Precipitation Card */}
            <RainIntelligenceCard
              weather={weather}
              userPrefs={profile.preferences}
            />

            {/* Row 4: Google Maps Safe Havens & Transit Navigation Bento Panel */}
            <GoogleMapsAgentPanel
              currentWeather={weather}
              extremeState={extremeState}
            />

            {/* Row 5: Climate Impact & Proactive Preparedness Hub */}
            <div ref={climateImpactRef}>
              <ClimateImpactDashboard
                currentWeather={weather}
                userPrefs={profile.preferences}
                preparednessState={profile.preparedness || INITIAL_PREPAREDNESS_STATE}
                onUpdatePreparedness={handleUpdatePreparedness}
                onOpenHistorical={() => {
                  const el = document.getElementById('historical-weather-panel');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                onOpenMaps={() => {
                  const el = document.getElementById('google-maps-agent-panel');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              />
            </div>

            {/* Row 6: Historical Climate Telemetry Query & Reanalysis Bento Panel */}
            <HistoricalWeatherPanel
              currentWeather={weather}
              userPrefs={profile.preferences}
            />

            {/* Row 7: Machine Learning & Explainable AI (SHAP) Suite - 99% Precision Consensus */}
            <MLEnsembleDashboard mlData={mlData} userPrefs={profile.preferences} />

            {/* Row 8: Hourly and 10-Day Projections */}
            <ForecastCharts weather={weather} userPrefs={profile.preferences} />
          </div>
        )}
      </main>

      {/* User Profile & Calibration Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profile}
        currentLocation={currentLocation}
        onUpdateProfile={(updated) => setProfile(updated)}
        onSelectLocation={handleSelectSavedLocation}
        onRequestPushPermission={handleRequestPushPermission}
      />

      {/* Slide-in AI Meteorologist & Wardrobe Chat Drawer */}
      {weather && (
        <AIChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          weather={weather}
          userPrefs={profile.preferences}
          extremeState={extremeState}
        />
      )}

      {/* Floating Chat Trigger Button (bottom right) */}
      {!isChatOpen && (
        <button
          id="floating-ai-advisor-btn"
          onClick={() => setIsChatOpen(true)}
          className="btn-3d-primary fixed bottom-8 right-8 z-30 flex items-center gap-2.5 px-5 py-3.5 rounded-full font-mono text-xs shadow-xl hover:scale-105 active:scale-95 transition-all"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <Plane className="w-4 h-4 text-white" />
          <span className="font-bold tracking-wider uppercase">Flight & Weather AI</span>
        </button>
      )}

      {/* Bento Footer */}
      <footer className="border-t border-sky-200/80 bg-white/80 backdrop-blur-md py-8 mt-16 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-600">
            <span className="font-mono text-xs font-bold text-sky-700">SmartWeather SA</span>
            <span>•</span>
            <span className="text-xs">South Africa Meteorological & 3D Intelligence Engine</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px]">
            <span>SOUTH AFRICAN WEATHER SERVICE (SAWS) GRID</span>
            <span>•</span>
            <span>99.1% CONSENSUS ML</span>
            <span>•</span>
            <span>3D INTERACTIVE SPHERE</span>
            <span>•</span>
            <span>GEMINI 2.5 FLASH</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

