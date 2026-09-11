import React, { useState } from 'react';
import {
  User,
  Settings,
  MapPin,
  Plus,
  Trash2,
  Check,
  Bell,
  Thermometer,
  CloudRain,
  Wind,
  Shirt,
  Flame,
  Volume2,
  ShieldAlert,
  Home,
  Briefcase,
  Plane,
  Tag,
  Clock,
  Sparkles,
  X,
  Award,
  ShieldCheck,
} from 'lucide-react';
import { UserProfile, SavedLocation, UserPreferences, AlertSubscriptions, LocationData } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  currentLocation: LocationData;
  onUpdateProfile: (updated: UserProfile) => void;
  onSelectLocation: (loc: SavedLocation) => void;
  onRequestPushPermission: () => Promise<boolean>;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  currentLocation,
  onUpdateProfile,
  onSelectLocation,
  onRequestPushPermission,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'profile' | 'locations' | 'units' | 'alerts' | 'comfort'>('profile');
  const [username, setUsername] = useState(profile.username);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>(profile.savedLocations);
  const [preferences, setPreferences] = useState<UserPreferences>(profile.preferences);
  const [notificationStatus, setNotificationStatus] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  // New location form state
  const [newLocName, setNewLocName] = useState('');
  const [newLocTag, setNewLocTag] = useState<'Home' | 'Work' | 'Travel' | 'Custom'>('Home');

  const handleSave = () => {
    onUpdateProfile({
      ...profile,
      username,
      savedLocations,
      preferences,
    });
    onClose();
  };

  const handleAddCurrentLocation = () => {
    const newLoc: SavedLocation = {
      id: `loc_${Date.now()}`,
      name: newLocName.trim() || currentLocation.name,
      label: newLocName.trim() || currentLocation.name,
      tag: newLocTag,
      country: currentLocation.country,
      admin1: currentLocation.admin1,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      timezone: currentLocation.timezone,
      isDefault: savedLocations.length === 0,
    };
    setSavedLocations([...savedLocations, newLoc]);
    setNewLocName('');
  };

  const handleRemoveLocation = (id: string) => {
    setSavedLocations(savedLocations.filter((l) => l.id !== id));
  };

  const handleSetDefaultLocation = (id: string) => {
    setSavedLocations(
      savedLocations.map((l) => ({
        ...l,
        isDefault: l.id === id,
      }))
    );
  };

  const handleAlertToggle = (alertKey: keyof AlertSubscriptions) => {
    setPreferences({
      ...preferences,
      alertSubscriptions: {
        ...preferences.alertSubscriptions,
        [alertKey]: !preferences.alertSubscriptions[alertKey],
      },
    });
  };

  const handleRequestPush = async () => {
    const granted = await onRequestPushPermission();
    if (granted) {
      setNotificationStatus('granted');
      setPreferences({
        ...preferences,
        browserNotifications: true,
      });
    } else {
      setNotificationStatus(Notification.permission);
    }
  };

  return (
    <div
      id="user-profile-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
    >
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">User Profile & Meteorological Preferences</h3>
              <p className="text-xs text-slate-400">Manage hyper-local areas, thermal tuning, units, and push alert triggers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-slate-800/80 overflow-x-auto gap-2 bg-slate-950/40 text-xs font-mono">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3 border-b-2 font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>
          <button
            onClick={() => setActiveTab('locations')}
            className={`py-3 px-3 border-b-2 font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'locations'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Saved Areas ({savedLocations.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('units')}
            className={`py-3 px-3 border-b-2 font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'units'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>Units & Measures</span>
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`py-3 px-3 border-b-2 font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'alerts'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Alert Triggers</span>
          </button>
          <button
            onClick={() => setActiveTab('comfort')}
            className={`py-3 px-3 border-b-2 font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'comfort'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shirt className="w-3.5 h-3.5" />
            <span>Thermal Comfort</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: Profile Details */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Display / Account Name
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Alex Traveler"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-semibold">
                  <Sparkles className="w-4 h-4" />
                  <span>Personalized Model Sync</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your saved areas, units, thermal calibrations, and alert subscriptions are synchronized with both the local browser storage and the server-side Gemini meteorological advisor.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 text-xs font-mono">
                  <span className="text-slate-500">Active Saved Areas:</span>
                  <div className="text-sm font-bold text-white mt-0.5">{savedLocations.length} locations</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 text-xs font-mono">
                  <span className="text-slate-500">Alert Subscriptions:</span>
                  <div className="text-sm font-bold text-amber-400 mt-0.5">
                    {Object.values(preferences.alertSubscriptions).filter(Boolean).length} / 7 active
                  </div>
                </div>
              </div>

              {/* Climate Preparedness & Badge Stats */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/30 to-slate-950/60 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Climate Preparedness Rank</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    LVL {profile.preparedness?.level ?? 1} • {profile.preparedness?.levelTitle ?? 'Weather Novice'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-[10px] text-slate-500">Streak</div>
                    <div className="text-sm font-bold text-amber-400 flex items-center justify-center gap-1 mt-0.5">
                      <Flame className="w-3.5 h-3.5" />
                      <span>{profile.preparedness?.currentStreak ?? 1}d</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-[10px] text-slate-500">Badges</div>
                    <div className="text-sm font-bold text-cyan-400 flex items-center justify-center gap-1 mt-0.5">
                      <Award className="w-3.5 h-3.5" />
                      <span>
                        {profile.preparedness?.badges.filter((b) => b.unlockedAt).length ?? 0} /{' '}
                        {profile.preparedness?.badges.length ?? 8}
                      </span>
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-[10px] text-slate-500">XP</div>
                    <div className="text-sm font-bold text-emerald-400 mt-0.5">
                      {profile.preparedness?.readinessXP ?? 140} XP
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Saved Locations */}
          {activeTab === 'locations' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                  Add Current Location to Saved Areas
                </h4>
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    <span>
                      Current: <strong>{currentLocation.name}, {currentLocation.country}</strong> ({currentLocation.latitude.toFixed(3)}, {currentLocation.longitude.toFixed(3)})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Custom Label (e.g., Downtown Flat)"
                      value={newLocName}
                      onChange={(e) => setNewLocName(e.target.value)}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />

                    <div className="flex items-center gap-1.5">
                      {(['Home', 'Work', 'Travel', 'Custom'] as const).map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setNewLocTag(tag)}
                          className={`flex-1 py-1.5 rounded-xl text-[11px] font-mono border transition-colors ${
                            newLocTag === tag
                              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddCurrentLocation}
                    className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wider transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>SAVE CURRENT HYPER-LOCAL AREA</span>
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                  Configured Saved Areas ({savedLocations.length})
                </h4>
                {savedLocations.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-4 text-center border border-dashed border-slate-800 rounded-2xl">
                    No saved locations yet. Save your current hyper-local area above to quickly switch between Home, Work, and Travel destinations.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {savedLocations.map((loc) => (
                      <div
                        key={loc.id}
                        className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 text-xs transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400">
                            {loc.tag === 'Home' && <Home className="w-4 h-4" />}
                            {loc.tag === 'Work' && <Briefcase className="w-4 h-4" />}
                            {loc.tag === 'Travel' && <Plane className="w-4 h-4" />}
                            {loc.tag === 'Custom' && <MapPin className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">{loc.label || loc.name}</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                                {loc.tag}
                              </span>
                              {loc.isDefault && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {loc.name}, {loc.country} ({loc.latitude.toFixed(2)}, {loc.longitude.toFixed(2)})
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectLocation(loc);
                              onClose();
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors"
                          >
                            Load Now
                          </button>
                          {!loc.isDefault && (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultLocation(loc.id)}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 text-xs font-mono transition-colors"
                              title="Set as default start area"
                            >
                              Make Default
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveLocation(loc.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                            title="Remove saved area"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Units & Measures */}
          {activeTab === 'units' && (
            <div className="space-y-4">
              {/* Temperature Unit */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Temperature Scale</div>
                  <div className="text-[11px] text-slate-400 font-mono">Format for ambient and apparent feels-like temperatures</div>
                </div>
                <div className="inline-flex rounded-xl p-1 bg-slate-900 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPreferences({ ...preferences, tempUnit: 'C' })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                      preferences.tempUnit === 'C' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Celsius (°C)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreferences({ ...preferences, tempUnit: 'F' })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                      preferences.tempUnit === 'F' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Fahrenheit (°F)
                  </button>
                </div>
              </div>

              {/* Precipitation Unit */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Precipitation Accumulation</div>
                  <div className="text-[11px] text-slate-400 font-mono">Rain and snowfall accumulation depth</div>
                </div>
                <div className="inline-flex rounded-xl p-1 bg-slate-900 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPreferences({ ...preferences, precipUnit: 'mm' })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                      preferences.precipUnit === 'mm' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Millimeters (mm)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreferences({ ...preferences, precipUnit: 'in' })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                      preferences.precipUnit === 'in' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Inches (in)
                  </button>
                </div>
              </div>

              {/* Wind Speed Unit */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Wind Speed Velocity</div>
                  <div className="text-[11px] text-slate-400 font-mono">10-meter wind velocity and gust measurements</div>
                </div>
                <div className="inline-flex rounded-xl p-1 bg-slate-900 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPreferences({ ...preferences, windUnit: 'kmh' })}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                      preferences.windUnit === 'kmh' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    km/h
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreferences({ ...preferences, windUnit: 'mph' })}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                      preferences.windUnit === 'mph' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    mph
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreferences({ ...preferences, windUnit: 'ms' })}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                      preferences.windUnit === 'ms' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    m/s
                  </button>
                </div>
              </div>

              {/* Pressure Unit */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Barometric Surface Pressure</div>
                  <div className="text-[11px] text-slate-400 font-mono">Atmospheric pressure gauge metric</div>
                </div>
                <div className="inline-flex rounded-xl p-1 bg-slate-900 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPreferences({ ...preferences, pressureUnit: 'hPa' })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                      preferences.pressureUnit === 'hPa' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    hPa / mbar
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreferences({ ...preferences, pressureUnit: 'inHg' })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                      preferences.pressureUnit === 'inHg' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    inHg
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Alert Triggers & Push System */}
          {activeTab === 'alerts' && (
            <div className="space-y-4">
              {/* Push Permission Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-500/30 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-cyan-300 text-xs font-mono font-semibold">
                    <Bell className="w-4 h-4" />
                    <span>Browser Web Push Notifications</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Receive immediate desktop/mobile push banners for urgent hurricane, tornado, and blizzard alerts.
                  </p>
                  <div className="text-[11px] font-mono mt-1 text-slate-500">
                    Current status:{' '}
                    <span
                      className={`font-semibold ${
                        notificationStatus === 'granted'
                          ? 'text-emerald-400'
                          : notificationStatus === 'denied'
                          ? 'text-red-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {notificationStatus.toUpperCase()}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRequestPush}
                  disabled={notificationStatus === 'granted'}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-colors shrink-0 ${
                    notificationStatus === 'granted'
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 cursor-default'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                  }`}
                >
                  {notificationStatus === 'granted' ? 'ENABLED' : 'REQUEST PERMISSION'}
                </button>
              </div>

              {/* Alert Category Subscriptions */}
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                  Extreme Weather Event Subscriptions
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(
                    [
                      { key: 'hurricanes', label: 'Hurricanes & Tropical Gales', desc: 'Category 1-5 winds and storm surge' },
                      { key: 'tornadoes', label: 'Tornadoes & Supercells', desc: 'Doppler mesocyclone detections' },
                      { key: 'blizzards', label: 'Blizzards & Ice Storms', desc: 'Whiteout snow and freezing rain' },
                      { key: 'heatwaves', label: 'Extreme Heatwaves', desc: 'Dangerous heat index > 38°C' },
                      { key: 'flashFloods', label: 'Flash Floods & Torrential Rain', desc: 'Rapid accumulation inundation' },
                      { key: 'severeStorms', label: 'Severe Thunderstorms & Hail', desc: 'Damaging lightning and large hail' },
                      { key: 'highWinds', label: 'High Wind Advisories', desc: 'Sustained gusts exceeding 60 km/h' },
                    ] as const
                  ).map((item) => {
                    const isChecked = preferences.alertSubscriptions[item.key];
                    return (
                      <div
                        key={item.key}
                        onClick={() => handleAlertToggle(item.key)}
                        className={`p-3 rounded-2xl border cursor-pointer select-none transition-all flex items-start justify-between gap-3 ${
                          isChecked
                            ? 'bg-cyan-950/30 border-cyan-500/40 text-white'
                            : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold">{item.label}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.desc}</div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 mt-0.5 ${
                            isChecked
                              ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                              : 'border-slate-700 bg-slate-900'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sound & Audio Warning */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Auditory Weather Alert Ping</div>
                    <div className="text-[11px] text-slate-400 font-mono">Play audible tone on severe emergency triggers</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreferences({ ...preferences, soundAlerts: !preferences.soundAlerts })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    preferences.soundAlerts ? 'bg-cyan-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform transform ${
                      preferences.soundAlerts ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: Thermal Comfort & Clothing Preferences */}
          {activeTab === 'comfort' && (
            <div className="space-y-5">
              {/* Thermal Sensitivity */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Personal Thermal Sensitivity (Metabolism)
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(
                    [
                      { id: 'runs_cold', label: 'Runs Cold', desc: 'Needs extra layers & thermal warmth (+4° offset)' },
                      { id: 'neutral', label: 'Neutral', desc: 'Standard comfortable baseline response' },
                      { id: 'runs_hot', label: 'Runs Hot', desc: 'Overheats easily, prefers lighter breathable gear (-4° offset)' },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPreferences({ ...preferences, thermalSensitivity: t.id })}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        preferences.thermalSensitivity === t.id
                          ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                          : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-bold">{t.label}</div>
                      <div className="text-[10px] text-slate-500 mt-1 font-mono leading-tight">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity Level */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Default Activity Planned
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'commute', label: 'Commute / Work' },
                      { id: 'outdoor', label: 'Outdoor / Hiking' },
                      { id: 'running', label: 'Running / Cardio' },
                      { id: 'cycling', label: 'Cycling / Commute' },
                      { id: 'formal', label: 'Formal / Business' },
                    ] as const
                  ).map((act) => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setPreferences({ ...preferences, activity: act.id })}
                      className={`p-2.5 rounded-xl border text-center font-mono text-xs transition-colors ${
                        preferences.activity === act.id
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                          : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Waterproof Sensitivity */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Waterproof & Rain Shell Sensitivity
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(
                    [
                      { id: 'high', label: 'High (Rain Phobic)', desc: 'Recommends waterproof outer shell at 20% rain probability' },
                      { id: 'normal', label: 'Normal (Balanced)', desc: 'Standard 35% rain trigger threshold' },
                      { id: 'low', label: 'Low (Tolerant)', desc: 'Prefers to avoid umbrellas until steady rain (>55%)' },
                    ] as const
                  ).map((wp) => (
                    <button
                      key={wp.id}
                      type="button"
                      onClick={() => setPreferences({ ...preferences, waterproofSensitivity: wp.id })}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        preferences.waterproofSensitivity === wp.id
                          ? 'bg-blue-500/20 border-blue-400/60 text-blue-200'
                          : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-bold">{wp.label}</div>
                      <div className="text-[10px] text-slate-500 mt-1 font-mono leading-tight">{wp.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Style Aesthetic */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Wardrobe Style Aesthetic
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { id: 'casual', label: 'Casual' },
                      { id: 'smart_casual', label: 'Smart Casual' },
                      { id: 'athletic', label: 'Athletic / Tech' },
                      { id: 'minimalist', label: 'Minimalist' },
                    ] as const
                  ).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setPreferences({ ...preferences, style: st.id })}
                      className={`p-2.5 rounded-xl border text-center font-mono text-xs transition-colors ${
                        preferences.style === st.id
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                          : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-mono transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono tracking-wider transition-all shadow-md shadow-cyan-500/20"
          >
            SAVE PROFILE SETTINGS
          </button>
        </div>
      </div>
    </div>
  );
};
