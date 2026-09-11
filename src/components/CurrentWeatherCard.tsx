import React from 'react';
import {
  Sun,
  SunMedium,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  Snowflake,
  CloudLightning,
  CloudHail,
  Wind,
  Droplets,
  Gauge,
  Eye,
  Sunrise,
  Sunset,
  Navigation,
  Compass,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { WeatherData, UserPreferences } from '../types';
import { getWeatherCodeInfo, formatTemp, formatWind } from '../utils/weatherCodes';
import { CloudBaseAltitudeGauge } from './CloudBaseAltitudeGauge';

interface CurrentWeatherCardProps {
  weather: WeatherData;
  userPrefs: UserPreferences;
}

export const CurrentWeatherCard: React.FC<CurrentWeatherCardProps> = ({ weather, userPrefs }) => {
  const { current, location, daily } = weather;
  const info = getWeatherCodeInfo(current.weatherCode);

  const todayDaily = daily[0] || {
    tempMax: current.temperature + 2,
    tempMin: current.temperature - 4,
    sunrise: '06:15',
    sunset: '19:45',
  };

  const getWeatherIcon = (iconName: string, isDay: boolean) => {
    const props = { className: 'w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md text-amber-400' };
    switch (iconName) {
      case 'Sun':
        return <Sun {...props} className="w-16 h-16 sm:w-20 sm:h-20 text-amber-400 animate-[spin_20s_linear_infinite]" />;
      case 'SunMedium':
        return <SunMedium {...props} className="w-16 h-16 sm:w-20 sm:h-20 text-amber-300" />;
      case 'CloudSun':
        return <CloudSun {...props} className="w-16 h-16 sm:w-20 sm:h-20 text-sky-300" />;
      case 'Cloud':
        return <Cloud {...props} className="w-16 h-16 sm:w-20 sm:h-20 text-slate-300" />;
      case 'CloudFog':
        return <CloudFog {...props} className="w-16 h-16 sm:w-20 sm:h-20 text-slate-400" />;
      case 'CloudDrizzle':
        return <CloudDrizzle {...props} className="w-16 h-16 sm:w-20 sm:h-20 text-blue-300" />;
      case 'CloudRain':
        return <CloudRain {...props} className="w-16 h-16 sm:w-20 sm:h-20 text-blue-400" />;
      case 'CloudRainWind':
        return <CloudRainWind {...props} className="w-16 h-16 sm:w-20 sm:h-20 text-blue-500" />;
      case 'CloudSnow':
      case 'Snowflake':
        return <Snowflake {...props} className="w-16 h-16 sm:w-20 sm:h-20 text-cyan-200 animate-spin" />;
      case 'CloudLightning':
        return <CloudLightning {...props} className="w-16 h-16 sm:w-20 sm:h-20 text-yellow-400 animate-pulse" />;
      case 'CloudHail':
        return <CloudHail {...props} className="w-16 h-16 sm:w-20 sm:h-20 text-cyan-400" />;
      default:
        return <Cloud {...props} className="w-16 h-16 sm:w-20 sm:h-20 text-slate-300" />;
    }
  };

  const formatTimeStr = (isoOrTime: string) => {
    if (!isoOrTime) return '--:--';
    try {
      const d = new Date(isoOrTime);
      if (isNaN(d.getTime())) return isoOrTime;
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoOrTime;
    }
  };

  // Dew point approximation: T - ((100 - RH) / 5)
  const dewPoint = Math.round(current.temperature - (100 - current.relativeHumidity) / 5);

  return (
    <div
      id="current-weather-card"
      className="card-3d p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between"
    >
      {/* Subtle atmospheric ambient glow */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-72 h-72 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Status & Sensor Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-sky-100">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  current.precipitationProbability > 50
                    ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse'
                    : 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]'
                }`}
              />
              <span className="text-xs font-bold uppercase tracking-widest text-sky-700 font-mono">
                {current.precipitationProbability > 50 ? 'Precipitation Alert • Highveld Doppler' : 'Atmospheric Telemetry • South Africa'}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-light italic text-slate-900 tracking-tight">
                {location.name}
              </h1>
              {location.country && (
                <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-lg border border-sky-200 bg-sky-50 text-sky-800 font-bold shadow-2xs">
                  {location.country}
                </span>
              )}
            </div>
            <p className="text-[11px] font-mono text-slate-500 mt-1">
              LAT {location.latitude.toFixed(2)}° • LON {location.longitude.toFixed(2)}° • ELEV {location.elevation ?? 35}M • SAWS RADAR GRID
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono">
            <div className="flex items-center gap-1.5 bg-sky-50/90 px-3 py-1.5 rounded-xl border border-sky-200 text-slate-700 shadow-2xs">
              <Sunrise className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-semibold">{formatTimeStr(todayDaily.sunrise)}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-sky-50/90 px-3 py-1.5 rounded-xl border border-sky-200 text-slate-700 shadow-2xs">
              <Sunset className="w-3.5 h-3.5 text-indigo-500" />
              <span className="font-semibold">{formatTimeStr(todayDaily.sunset)}</span>
            </div>
          </div>
        </div>

        {/* Hero Temperature & Condition Section */}
        <div className="py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-baseline">
              <h2 className="text-7xl sm:text-8xl font-thin tracking-tighter text-slate-900 drop-shadow-xs">
                {formatTemp(current.temperature, userPrefs.tempUnit).replace(/[^0-9-]/g, '')}°
              </h2>
              <span className="text-3xl sm:text-4xl text-slate-400 font-light ml-1">
                /{formatTemp(todayDaily.tempMin, userPrefs.tempUnit).replace(/[^0-9-]/g, '')}°
              </span>
            </div>
            <p className="text-lg sm:text-xl text-sky-900 mt-2 font-medium">
              {info.description} • Feels like {formatTemp(current.apparentTemperature, userPrefs.tempUnit)}
            </p>
          </div>

          <div className="flex flex-col items-center sm:items-end justify-center">
            {getWeatherIcon(info.iconName, current.isDay)}
            <span className="text-[11px] font-mono text-sky-700 font-semibold mt-2">
              SURFACE OBS • {current.isDay ? 'DAY CYCLE' : 'NIGHT CYCLE'}
            </span>
          </div>
        </div>

        {/* Aeronautical Cloud Base Altitude & VFR Flight Ceiling Gauge */}
        <CloudBaseAltitudeGauge weather={weather} className="my-4" />
      </div>

      {/* Bento Vitals Grid with 3D Depth */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 pt-6 border-t border-sky-100">
        {/* Humidity */}
        <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-200/80 shadow-[0_2px_8px_rgba(2,132,199,0.05)] hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold tracking-wider text-sky-700 mb-1 font-mono">Humidity</p>
          <p className="text-xl sm:text-2xl font-light font-mono text-slate-900">{current.relativeHumidity}%</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Dew {formatTemp(dewPoint, userPrefs.tempUnit)}</p>
        </div>

        {/* Pressure */}
        <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-200/80 shadow-[0_2px_8px_rgba(2,132,199,0.05)] hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold tracking-wider text-sky-700 mb-1 font-mono">Barometer</p>
          <p className="text-xl sm:text-2xl font-light font-mono text-slate-900">{current.surfacePressure} <span className="text-xs text-slate-500 font-sans">hPa</span></p>
          <p className="text-[10px] text-slate-500 mt-0.5">{current.surfacePressure < 1012 ? 'Low Trough' : 'High Stable'}</p>
        </div>

        {/* Wind */}
        <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-200/80 shadow-[0_2px_8px_rgba(2,132,199,0.05)] hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold tracking-wider text-sky-700 mb-1 font-mono">Wind Speed</p>
          <p className="text-xl sm:text-2xl font-light font-mono text-rose-600 font-semibold">{formatWind(current.windSpeed, userPrefs.windUnit)}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{current.windDirection}° Azimuth</p>
        </div>

        {/* Rain Prob */}
        <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-200/80 shadow-[0_2px_8px_rgba(2,132,199,0.05)] hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold tracking-wider text-sky-700 mb-1 font-mono">Precip Risk</p>
          <p className="text-xl sm:text-2xl font-light font-mono text-sky-700 font-bold">{current.precipitationProbability}%</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{current.precipitation.toFixed(1)} mm/h rate</p>
        </div>

        {/* UV Index */}
        <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-200/80 shadow-[0_2px_8px_rgba(2,132,199,0.05)] hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold tracking-wider text-sky-700 mb-1 font-mono">UV Index</p>
          <p className="text-xl sm:text-2xl font-light font-mono text-amber-600 font-semibold">{current.uvIndex.toFixed(1)}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{current.uvIndex >= 6 ? 'High Exposure' : 'Safe/Moderate'}</p>
        </div>

        {/* Visibility */}
        <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-200/80 shadow-[0_2px_8px_rgba(2,132,199,0.05)] hover:shadow-md transition-shadow">
          <p className="text-[10px] uppercase font-bold tracking-wider text-sky-700 mb-1 font-mono">Visibility</p>
          <p className="text-xl sm:text-2xl font-light font-mono text-slate-900">{(current.visibility / 1000).toFixed(0)} <span className="text-xs text-slate-500 font-sans">km</span></p>
          <p className="text-[10px] text-slate-500 mt-0.5">{current.cloudCover}% clouds</p>
        </div>
      </div>
    </div>
  );
};
