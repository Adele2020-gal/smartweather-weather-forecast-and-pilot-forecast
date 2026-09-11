import React, { useState, useEffect } from 'react';
import {
  Calendar,
  History,
  TrendingUp,
  TrendingDown,
  Droplets,
  Wind,
  Thermometer,
  AlertCircle,
  Loader2,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Info,
  CalendarDays,
  Snowflake,
  Sun,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { WeatherData, UserPreferences, HistoricalData, LocationData } from '../types';
import { formatTemp, formatWind, formatPrecip, getWeatherCodeInfo } from '../utils/weatherCodes';

interface HistoricalWeatherPanelProps {
  currentWeather: WeatherData;
  userPrefs: UserPreferences;
  onClose?: () => void;
}

export const HistoricalWeatherPanel: React.FC<HistoricalWeatherPanelProps> = ({
  currentWeather,
  userPrefs,
  onClose,
}) => {
  const { location, current } = currentWeather;

  // Preset dates
  const today = new Date();
  const formatIsoDate = (d: Date) => d.toISOString().split('T')[0];

  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [mode, setMode] = useState<'single' | 'range'>('range');
  const [startDate, setStartDate] = useState<string>(formatIsoDate(sevenDaysAgo));
  const [endDate, setEndDate] = useState<string>(formatIsoDate(new Date(today.getTime() - 86400000))); // yesterday
  const [activePreset, setActivePreset] = useState<string>('7days');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData | null>(null);
  const [chartMetric, setChartMetric] = useState<'all' | 'temp' | 'precip' | 'wind'>('all');

  // Fetch historical data
  const fetchHistorical = async (start: string, end: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const url = `/api/weather/historical?lat=${location.latitude}&lon=${location.longitude}&start_date=${start}&end_date=${end}&timezone=${encodeURIComponent(location.timezone || 'auto')}&name=${encodeURIComponent(location.name)}&current_temp=${current.temperature}&current_precip=${current.precipitation}&current_wind=${current.windSpeed}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      const data: HistoricalData = await res.json();
      setHistoricalData(data);
    } catch (err: any) {
      console.error('Failed to load historical data:', err);
      setErrorMsg('Could not fetch historical climate data for this date range. Please select another date.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorical(startDate, endDate);
  }, [location.latitude, location.longitude]);

  // Handle Preset Selection
  const applyPreset = (presetKey: string) => {
    setActivePreset(presetKey);
    const now = new Date();
    let s = '';
    let e = '';

    if (presetKey === '1year') {
      const past = new Date(now);
      past.setFullYear(now.getFullYear() - 1);
      s = formatIsoDate(past);
      e = s; // single day
      setMode('single');
    } else if (presetKey === '7days') {
      const past = new Date(now);
      past.setDate(now.getDate() - 7);
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      s = formatIsoDate(past);
      e = formatIsoDate(yesterday);
      setMode('range');
    } else if (presetKey === '30days') {
      const past = new Date(now);
      past.setDate(now.getDate() - 30);
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      s = formatIsoDate(past);
      e = formatIsoDate(yesterday);
      setMode('range');
    } else if (presetKey === 'last_summer') {
      const year = now.getFullYear() - 1;
      s = `${year}-07-10`;
      e = `${year}-07-25`;
      setMode('range');
    } else if (presetKey === 'last_winter') {
      const year = now.getFullYear();
      s = `${year - 1}-12-15`;
      e = `${year - 1}-12-30`;
      setMode('range');
    }

    if (s && e) {
      setStartDate(s);
      setEndDate(e);
      fetchHistorical(s, e);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActivePreset('custom');
    fetchHistorical(startDate, mode === 'single' ? startDate : endDate);
  };

  return (
    <div
      id="historical-weather-panel"
      className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 text-slate-100 shadow-2xl backdrop-blur-xl relative overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <History className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white">Historical Climate Telemetry</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-amber-400/10 text-amber-300 border border-amber-400/20">
                ERA5 Reanalysis
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Query verified past temperatures, precipitation, and winds for <span className="text-slate-200 font-semibold">{location.name}, {location.country}</span>
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

      {/* Query Controls & Presets */}
      <div className="py-6 space-y-4">
        {/* Preset buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 font-mono text-[11px] uppercase tracking-wider shrink-0 mr-1">
            Quick Queries:
          </span>
          <button
            onClick={() => applyPreset('1year')}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs whitespace-nowrap transition-all border ${
              activePreset === '1year'
                ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-400'
            }`}
          >
            📅 Same Date 1 Year Ago
          </button>
          <button
            onClick={() => applyPreset('7days')}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs whitespace-nowrap transition-all border ${
              activePreset === '7days'
                ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-400'
            }`}
          >
            Past 7 Days
          </button>
          <button
            onClick={() => applyPreset('30days')}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs whitespace-nowrap transition-all border ${
              activePreset === '30days'
                ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-400'
            }`}
          >
            Past 30 Days Trend
          </button>
          <button
            onClick={() => applyPreset('last_summer')}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs whitespace-nowrap transition-all border ${
              activePreset === 'last_summer'
                ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-400'
            }`}
          >
            ☀️ Last Summer Peak
          </button>
          <button
            onClick={() => applyPreset('last_winter')}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs whitespace-nowrap transition-all border ${
              activePreset === 'last_winter'
                ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-400'
            }`}
          >
            ❄️ Last Winter Season
          </button>
        </div>

        {/* Custom Date Filter Form */}
        <form
          onSubmit={handleCustomSubmit}
          className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-wrap items-center gap-4 text-xs font-mono"
        >
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Mode:</span>
            <div className="inline-flex rounded-xl p-0.5 bg-slate-900 border border-slate-800">
              <button
                type="button"
                onClick={() => setMode('single')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  mode === 'single' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Single Date
              </button>
              <button
                type="button"
                onClick={() => setMode('range')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  mode === 'range' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Date Range
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">{mode === 'single' ? 'Date:' : 'From:'}</span>
            <input
              type="date"
              value={startDate}
              max={formatIsoDate(new Date(today.getTime() - 86400000))}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          {mode === 'range' && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400">To:</span>
              <input
                type="date"
                value={endDate}
                min={startDate}
                max={formatIsoDate(new Date(today.getTime() - 86400000))}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs tracking-wider transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Calendar className="w-3.5 h-3.5" />}
            <span>QUERY ARCHIVE</span>
          </button>
        </form>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-16 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          <p className="text-xs font-mono text-slate-400 tracking-widest uppercase">
            Fetching ECMWF & WMO climate historical reanalysis...
          </p>
        </div>
      )}

      {/* Error state */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 flex items-center gap-3 text-red-200 text-xs font-mono mb-4">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Results Content */}
      {!isLoading && historicalData && (
        <div className="space-y-6">
          {/* Comparison Delta Banner with Present Day */}
          {historicalData.comparisonWithPresent && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-amber-300 font-mono text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Climate Differential vs Today</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                    {historicalData.comparisonWithPresent.headline}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                    {historicalData.comparisonWithPresent.details}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
                  <div className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-500 uppercase">Temp Delta</div>
                    <div
                      className={`text-sm font-bold ${
                        historicalData.comparisonWithPresent.tempDelta > 0 ? 'text-amber-400' : 'text-cyan-400'
                      }`}
                    >
                      {historicalData.comparisonWithPresent.tempDelta > 0 ? '+' : ''}
                      {formatTemp(historicalData.comparisonWithPresent.tempDelta, userPrefs.tempUnit, false)}
                    </div>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-500 uppercase">Precip Delta</div>
                    <div className="text-sm font-bold text-blue-400">
                      {historicalData.comparisonWithPresent.precipDelta > 0 ? '+' : ''}
                      {formatPrecip(historicalData.comparisonWithPresent.precipDelta, userPrefs.precipUnit)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Historical Aggregate Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {/* Avg Temp */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider">Mean Temp</span>
                <Thermometer className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-mono font-bold text-white">
                {formatTemp(historicalData.aggregates.avgTemp, userPrefs.tempUnit)}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-1 flex items-center justify-between">
                <span>Low: {formatTemp(historicalData.aggregates.minTemp, userPrefs.tempUnit)}</span>
                <span>High: {formatTemp(historicalData.aggregates.maxTemp, userPrefs.tempUnit)}</span>
              </div>
            </div>

            {/* Total Precipitation */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider">Precipitation</span>
                <Droplets className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-mono font-bold text-blue-300">
                {formatPrecip(historicalData.aggregates.totalPrecipitation, userPrefs.precipUnit)}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-1">
                {historicalData.aggregates.rainyDaysCount} of {historicalData.aggregates.daysCount} days with rain
              </div>
            </div>

            {/* Max Wind Velocity */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider">Peak Wind Gust</span>
                <Wind className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-mono font-bold text-cyan-300">
                {formatWind(historicalData.aggregates.maxWindSpeed, userPrefs.windUnit)}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-1">
                {historicalData.aggregates.maxWindSpeed > 40 ? 'Gale event recorded' : 'Moderate breeze'}
              </div>
            </div>

            {/* Snowfall / Cold index */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider">Snow / Freezing</span>
                <Snowflake className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-mono font-bold text-indigo-200">
                {historicalData.aggregates.snowSum > 0
                  ? `${Math.round(historicalData.aggregates.snowSum)} cm`
                  : '0.0 cm'}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-1">
                {historicalData.aggregates.minTemp <= 0 ? 'Frost conditions met' : 'Above freezing'}
              </div>
            </div>
          </div>

          {/* Recharts Historical Trend */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-mono uppercase tracking-wider text-slate-200 font-semibold">
                  Atmospheric Timeline ({historicalData.startDate} → {historicalData.endDate})
                </h4>
                <p className="text-[11px] text-slate-500 font-mono">
                  Composite curves showing recorded temperature envelope, rainfall spikes, and wind speed.
                </p>
              </div>

              {/* Chart Metric Filter */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
                {(['all', 'temp', 'precip', 'wind'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setChartMetric(m)}
                    className={`px-2.5 py-1 rounded-lg uppercase tracking-wider transition-colors ${
                      chartMetric === m ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={
                    historicalData.records.length > 1
                      ? historicalData.records
                      : historicalData.hourly
                  }
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey={historicalData.records.length > 1 ? 'dayLabel' : 'hourLabel'}
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    domain={['auto', 'auto']}
                    unit={userPrefs.tempUnit === 'F' ? '°F' : '°C'}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    domain={[0, 'auto']}
                    unit={userPrefs.precipUnit}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090d16',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />

                  {(chartMetric === 'all' || chartMetric === 'temp') && (
                    <>
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey={historicalData.records.length > 1 ? 'tempMax' : 'temperature'}
                        name={`Max Temp (°${userPrefs.tempUnit})`}
                        stroke="#f59e0b"
                        fill="#f59e0b"
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                      {historicalData.records.length > 1 && (
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="tempMin"
                          name={`Min Temp (°${userPrefs.tempUnit})`}
                          stroke="#38bdf8"
                          strokeWidth={1.5}
                          dot={false}
                        />
                      )}
                    </>
                  )}

                  {(chartMetric === 'all' || chartMetric === 'precip') && (
                    <Bar
                      yAxisId="right"
                      dataKey={historicalData.records.length > 1 ? 'precipitationSum' : 'precipitation'}
                      name={`Precip (${userPrefs.precipUnit})`}
                      fill="#3b82f6"
                      opacity={0.8}
                      radius={[4, 4, 0, 0]}
                    />
                  )}

                  {(chartMetric === 'all' || chartMetric === 'wind') && (
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey={historicalData.records.length > 1 ? 'windSpeedMax' : 'windSpeed'}
                      name={`Wind (${userPrefs.windUnit})`}
                      stroke="#a855f7"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Records List */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Archived Daily Records Log ({historicalData.records.length} dates)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {historicalData.records.map((r) => {
                const info = getWeatherCodeInfo(r.weatherCode);
                return (
                  <div
                    key={r.date}
                    className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-white">{r.dayLabel}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
                        <span>{info.description}</span>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <div className="text-amber-300 font-bold">
                        {formatTemp(r.tempMax, userPrefs.tempUnit)}
                        <span className="text-slate-500 font-normal ml-1">
                          / {formatTemp(r.tempMin, userPrefs.tempUnit)}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center justify-end gap-2 mt-0.5">
                        <span className="text-blue-400">{formatPrecip(r.precipitationSum, userPrefs.precipUnit)}</span>
                        <span>•</span>
                        <span className="text-cyan-400">{formatWind(r.windSpeedMax, userPrefs.windUnit)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
