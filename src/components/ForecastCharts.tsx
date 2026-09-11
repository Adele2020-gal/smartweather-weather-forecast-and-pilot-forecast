import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Bar,
  ComposedChart,
} from 'recharts';
import {
  Calendar,
  Clock,
  Droplets,
  Wind,
  Sun,
  ChevronRight,
  CloudRain,
} from 'lucide-react';
import { WeatherData, UserPreferences } from '../types';
import { getWeatherCodeInfo, formatTemp, formatWind } from '../utils/weatherCodes';

interface ForecastChartsProps {
  weather: WeatherData;
  userPrefs: UserPreferences;
}

export const ForecastCharts: React.FC<ForecastChartsProps> = ({ weather, userPrefs }) => {
  const [viewMode, setViewMode] = useState<'hourly' | 'daily'>('hourly');
  const { hourly, daily } = weather;

  // Prepare chart data for the next 24 hours
  const hourlyChartData = hourly.slice(0, 24).map((item) => ({
    hour: item.hourLabel,
    temperature: Math.round(
      userPrefs.tempUnit === 'F' ? (item.temperature * 9) / 5 + 32 : item.temperature
    ),
    apparentTemp: Math.round(
      userPrefs.tempUnit === 'F' ? (item.apparentTemperature * 9) / 5 + 32 : item.apparentTemperature
    ),
    rainProb: item.precipitationProbability,
    rawTemp: item.temperature,
    wind: item.windSpeed,
    code: item.weatherCode,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs">
          <div className="font-bold text-white mb-1">{label}</div>
          <div className="text-blue-400 font-bold">
            Temp: {data.temperature}°{userPrefs.tempUnit} (Feels: {data.apparentTemp}°
            {userPrefs.tempUnit})
          </div>
          <div className="text-cyan-300 font-medium">
            Precipitation Risk: {data.rainProb}%
          </div>
          <div className="text-slate-400">
            Wind: {formatWind(data.wind, userPrefs.windUnit)}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="forecast-charts-panel"
      className="bg-slate-900/50 rounded-3xl border border-slate-800 p-6 sm:p-8 backdrop-blur-md relative overflow-hidden bg-bento-dots"
    >
      {/* Header with Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
            <span className="text-xs uppercase font-bold text-cyan-400 tracking-widest">
              Atmospheric Projections
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-light italic text-white tracking-tight">
            Hourly Precision Timeline & 10-Day Outlook
          </h2>
        </div>

        <div className="flex items-center bg-slate-900/80 p-0.5 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setViewMode('hourly')}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-all ${
              viewMode === 'hourly'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-500 hover:text-white'
            }`}
          >
            24H HOURLY
          </button>
          <button
            onClick={() => setViewMode('daily')}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-all ${
              viewMode === 'daily'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-500 hover:text-white'
            }`}
          >
            10-DAY OUTLOOK
          </button>
        </div>
      </div>

      {viewMode === 'hourly' ? (
        <div>
          {/* Temperature & Rain Recharts Visualizer */}
          <div className="h-64 w-full mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={hourlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="rainGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis yAxisId="left" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#06b6d4"
                  fontSize={11}
                  tickLine={false}
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  yAxisId="right"
                  dataKey="rainProb"
                  fill="url(#rainGradient)"
                  radius={[4, 4, 0, 0]}
                  barSize={12}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="temperature"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fill="url(#tempGradient)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Horizontal scrollable hourly cards */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
            {hourly.slice(0, 24).map((item, idx) => {
              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center justify-between min-w-[80px] shrink-0 text-center hover:border-slate-700 transition-colors"
                >
                  <span className="text-[10px] font-mono uppercase text-slate-500">{item.hourLabel}</span>
                  <div className="my-2">
                    <span className="text-base font-light font-mono text-white">
                      {formatTemp(item.temperature, userPrefs.tempUnit)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-cyan-300 font-mono">
                    <Droplets className="w-2.5 h-2.5" />
                    <span>{item.precipitationProbability}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 10-Day Multi-day Outlook */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {daily.map((day, idx) => {
            const info = getWeatherCodeInfo(day.weatherCode);
            return (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-cyan-400 font-semibold uppercase">{day.dayLabel}</span>
                  {day.rainProbMax > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-cyan-300 font-mono">
                      <Droplets className="w-2.5 h-2.5" />
                      {day.rainProbMax}%
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 truncate mb-3">
                  {info.description}
                </p>

                <div className="flex items-baseline justify-between font-mono text-sm border-t border-slate-800/80 pt-2">
                  <span className="text-white font-light text-base">
                    {formatTemp(day.tempMax, userPrefs.tempUnit)}
                  </span>
                  <span className="text-slate-500 font-light text-xs">
                    {formatTemp(day.tempMin, userPrefs.tempUnit)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
