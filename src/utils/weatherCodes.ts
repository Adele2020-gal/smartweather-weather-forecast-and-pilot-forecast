export interface WeatherCodeInfo {
  description: string;
  category: 'clear' | 'clouds' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'thunderstorm' | 'extreme';
  isExtremeCandidate: boolean;
  severityLevel: 'low' | 'moderate' | 'high' | 'severe';
  iconName: string;
}

export const WMO_WEATHER_CODES: Record<number, WeatherCodeInfo> = {
  0: { description: 'Clear Sky', category: 'clear', isExtremeCandidate: false, severityLevel: 'low', iconName: 'Sun' },
  1: { description: 'Mainly Clear', category: 'clear', isExtremeCandidate: false, severityLevel: 'low', iconName: 'SunMedium' },
  2: { description: 'Partly Cloudy', category: 'clouds', isExtremeCandidate: false, severityLevel: 'low', iconName: 'CloudSun' },
  3: { description: 'Overcast', category: 'clouds', isExtremeCandidate: false, severityLevel: 'low', iconName: 'Cloud' },
  45: { description: 'Foggy Conditions', category: 'fog', isExtremeCandidate: false, severityLevel: 'moderate', iconName: 'CloudFog' },
  48: { description: 'Depositing Rime Fog', category: 'fog', isExtremeCandidate: false, severityLevel: 'moderate', iconName: 'CloudFog' },
  51: { description: 'Light Drizzle', category: 'drizzle', isExtremeCandidate: false, severityLevel: 'low', iconName: 'CloudDrizzle' },
  53: { description: 'Moderate Drizzle', category: 'drizzle', isExtremeCandidate: false, severityLevel: 'low', iconName: 'CloudDrizzle' },
  55: { description: 'Dense Drizzle', category: 'drizzle', isExtremeCandidate: false, severityLevel: 'moderate', iconName: 'CloudDrizzle' },
  56: { description: 'Light Freezing Drizzle', category: 'drizzle', isExtremeCandidate: true, severityLevel: 'moderate', iconName: 'CloudSnow' },
  57: { description: 'Dense Freezing Drizzle', category: 'drizzle', isExtremeCandidate: true, severityLevel: 'high', iconName: 'CloudSnow' },
  61: { description: 'Slight Rain', category: 'rain', isExtremeCandidate: false, severityLevel: 'low', iconName: 'CloudRain' },
  63: { description: 'Moderate Rain', category: 'rain', isExtremeCandidate: false, severityLevel: 'moderate', iconName: 'CloudRain' },
  65: { description: 'Heavy Torrential Rain', category: 'rain', isExtremeCandidate: true, severityLevel: 'high', iconName: 'CloudRainWind' },
  66: { description: 'Freezing Rain (Slight)', category: 'rain', isExtremeCandidate: true, severityLevel: 'high', iconName: 'CloudSnow' },
  67: { description: 'Heavy Freezing Rain', category: 'rain', isExtremeCandidate: true, severityLevel: 'severe', iconName: 'CloudSnow' },
  71: { description: 'Slight Snow Fall', category: 'snow', isExtremeCandidate: false, severityLevel: 'low', iconName: 'CloudSnow' },
  73: { description: 'Moderate Snow Fall', category: 'snow', isExtremeCandidate: false, severityLevel: 'moderate', iconName: 'CloudSnow' },
  75: { description: 'Heavy Blizzard Snow', category: 'snow', isExtremeCandidate: true, severityLevel: 'severe', iconName: 'Snowflake' },
  77: { description: 'Snow Grains', category: 'snow', isExtremeCandidate: false, severityLevel: 'low', iconName: 'Snowflake' },
  80: { description: 'Light Rain Showers', category: 'rain', isExtremeCandidate: false, severityLevel: 'low', iconName: 'CloudDrizzle' },
  81: { description: 'Moderate Rain Showers', category: 'rain', isExtremeCandidate: false, severityLevel: 'moderate', iconName: 'CloudRain' },
  82: { description: 'Violent Rain Showers', category: 'rain', isExtremeCandidate: true, severityLevel: 'high', iconName: 'CloudRainWind' },
  85: { description: 'Slight Snow Showers', category: 'snow', isExtremeCandidate: false, severityLevel: 'moderate', iconName: 'CloudSnow' },
  86: { description: 'Heavy Snow Showers', category: 'snow', isExtremeCandidate: true, severityLevel: 'severe', iconName: 'Snowflake' },
  95: { description: 'Severe Thunderstorm', category: 'thunderstorm', isExtremeCandidate: true, severityLevel: 'high', iconName: 'CloudLightning' },
  96: { description: 'Thunderstorm with Hail', category: 'thunderstorm', isExtremeCandidate: true, severityLevel: 'severe', iconName: 'CloudHail' },
  99: { description: 'Severe Thunderstorm with Heavy Hail', category: 'thunderstorm', isExtremeCandidate: true, severityLevel: 'severe', iconName: 'CloudHail' },
};

export function getWeatherCodeInfo(code: number): WeatherCodeInfo {
  return WMO_WEATHER_CODES[code] || {
    description: 'Variable Weather',
    category: 'clouds',
    isExtremeCandidate: false,
    severityLevel: 'low',
    iconName: 'Cloud',
  };
}

export function formatTemp(tempC: number, unit: 'C' | 'F' = 'C', withUnit = true): string {
  const val = unit === 'F' ? Math.round((tempC * 9) / 5 + 32) : Math.round(tempC);
  return withUnit ? `${val}°${unit}` : `${val}°`;
}

export function formatWind(kmh: number, unit: 'kmh' | 'mph' | 'ms' = 'kmh'): string {
  if (unit === 'mph') {
    return `${Math.round(kmh * 0.621371)} mph`;
  }
  if (unit === 'ms') {
    return `${(kmh / 3.6).toFixed(1)} m/s`;
  }
  return `${Math.round(kmh)} km/h`;
}

export function formatPrecip(mm: number, unit: 'mm' | 'in' = 'mm'): string {
  if (unit === 'in') {
    return `${(mm * 0.0393701).toFixed(2)} in`;
  }
  return `${mm.toFixed(1)} mm`;
}

export function formatPressure(hPa: number, unit: 'hPa' | 'inHg' = 'hPa'): string {
  if (unit === 'inHg') {
    return `${(hPa * 0.02953).toFixed(2)} inHg`;
  }
  return `${Math.round(hPa)} hPa`;
}
