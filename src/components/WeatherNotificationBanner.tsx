import React, { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  Flame,
  Snowflake,
  Wind,
  CloudLightning,
  Droplets,
  X,
  ChevronRight,
  ShieldAlert,
  Clock,
  CheckCheck,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { WeatherNotification, ExtremeWeatherEvent } from '../types';

interface WeatherNotificationBannerProps {
  notifications: WeatherNotification[];
  extremeEvent: ExtremeWeatherEvent;
  onDismiss: (id: string) => void;
  onClearAll: () => void;
  onOpenSafetyPlan?: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const WeatherNotificationBanner: React.FC<WeatherNotificationBannerProps> = ({
  notifications,
  extremeEvent,
  onDismiss,
  onClearAll,
  onOpenSafetyPlan,
  soundEnabled,
  onToggleSound,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'HEATWAVE':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'BLIZZARD':
        return <Snowflake className="w-4 h-4 text-cyan-300" />;
      case 'HURRICANE':
        return <Wind className="w-4 h-4 text-rose-400" />;
      case 'TORNADO':
        return <Wind className="w-4 h-4 text-red-400 animate-spin" />;
      case 'FLASH_FLOOD':
        return <Droplets className="w-4 h-4 text-blue-400" />;
      case 'SEVERE_STORM':
        return <CloudLightning className="w-4 h-4 text-amber-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    }
  };

  const latestNotification = notifications[0];

  return (
    <>
      {/* 1. Critical Floating Push Alert Toast (if extreme weather alert is active) */}
      {extremeEvent.isExtreme && latestNotification && (
        <div
          id="extreme-weather-push-toast"
          className="fixed bottom-5 right-5 z-40 max-w-md w-[calc(100vw-2.5rem)] animate-in slide-in-from-bottom-5 duration-300"
        >
          <div className="p-4 rounded-2xl bg-slate-900/95 border-2 border-red-500/80 shadow-2xl shadow-red-950/60 backdrop-blur-xl text-white relative overflow-hidden">
            {/* Pulsing indicator */}
            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-red-500 via-rose-500 to-amber-500 animate-pulse" />

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-red-500/20 text-red-400 shrink-0 mt-0.5 animate-bounce">
                  {getCategoryIcon(latestNotification.category)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500 text-slate-950 uppercase tracking-wider">
                      URGENT PUSH
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {latestNotification.locationName}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1 leading-tight">
                    {latestNotification.title}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {latestNotification.message}
                  </p>

                  {/* Actionable Advice Box */}
                  <div className="mt-2 p-2 rounded-lg bg-red-950/40 border border-red-500/30 text-[11px] text-red-200 font-mono flex items-start gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                    <span>Action: {latestNotification.actionableAdvice}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onDismiss(latestNotification.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <Clock className="w-3 h-3" />
                <span>Expires: {latestNotification.expiresAt}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleSound}
                  className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                  title={soundEnabled ? 'Disable audio alerts' : 'Enable audio alerts'}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
                {onOpenSafetyPlan && (
                  <button
                    onClick={onOpenSafetyPlan}
                    className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] transition-colors"
                  >
                    View Shelter Plan →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Notification Center Drawer / Trigger Button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all shadow-sm"
          title="Push Notification Center"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-slate-950 font-mono text-[10px] font-bold flex items-center justify-center animate-pulse shadow-md shadow-red-500/40">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown panel */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl z-50 p-4 text-slate-100 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono uppercase font-bold tracking-wider text-white">
                  Weather Alert Feed
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                  {notifications.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={onClearAll}
                    className="text-[11px] font-mono text-slate-400 hover:text-cyan-300 transition-colors"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="py-2 space-y-2.5 max-h-80 overflow-y-auto pr-1 mt-2">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs font-mono text-slate-500">
                  No active extreme weather alerts for this hyper-local area.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-2xl border text-xs transition-all ${
                      n.severity === 'CRITICAL'
                        ? 'bg-red-950/30 border-red-500/40'
                        : n.severity === 'WARNING'
                        ? 'bg-amber-950/30 border-amber-500/40'
                        : 'bg-slate-950/40 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(n.category)}
                        <span className="font-bold text-white leading-tight">{n.title}</span>
                      </div>
                      <button
                        onClick={() => onDismiss(n.id)}
                        className="text-slate-500 hover:text-slate-300 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">{n.message}</p>

                    <div className="mt-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-[10px] text-amber-300 font-mono">
                      ⚡ <strong>Advice:</strong> {n.actionableAdvice}
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-2">
                      <span>{n.timestamp}</span>
                      <span className="text-slate-400">{n.locationName}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
