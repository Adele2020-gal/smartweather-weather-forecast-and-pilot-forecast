import {
  WeatherData,
  CurrentWeather,
  HourlyForecastItem,
  ExtremeWeatherEvent,
  FlightWeatherAnalysis,
  RunwayAnalysis,
  HourlyFlightWindow,
  FlightCorridorAssessment,
  AltitudeWeatherProfilePoint,
} from '../types';

/**
 * Aerodromes in Gauteng & South Africa
 */
const SOUTH_AFRICAN_AERODROMES = [
  {
    icao: 'FAOR',
    name: 'O. R. Tambo International Airport',
    city: 'Boksburg / Ekurhuleni',
    elevationM: 1694,
    elevationFt: 5558,
    runways: [
      { ident: '03L/21R', heading: 33, reciprocalHeading: 213, lengthM: 4418 },
      { ident: '03R/21L', heading: 33, reciprocalHeading: 213, lengthM: 3405 },
    ],
  },
  {
    icao: 'FAGM',
    name: 'Rand Airport (General Aviation Hub)',
    city: 'Germiston / Boksburg Border',
    elevationM: 1671,
    elevationFt: 5482,
    runways: [
      { ident: '11/29', heading: 110, reciprocalHeading: 290, lengthM: 1709 },
      { ident: '17/35', heading: 170, reciprocalHeading: 350, lengthM: 1463 },
    ],
  },
  {
    icao: 'FALA',
    name: 'Lanseria International Airport',
    city: 'Johannesburg North',
    elevationM: 1373,
    elevationFt: 4513,
    runways: [
      { ident: '07/25', heading: 70, reciprocalHeading: 250, lengthM: 3047 },
    ],
  },
  {
    icao: 'FACT',
    name: 'Cape Town International Airport',
    city: 'Cape Town',
    elevationM: 46,
    elevationFt: 151,
    runways: [
      { ident: '01/19', heading: 10, reciprocalHeading: 190, lengthM: 3201 },
      { ident: '16/34', heading: 160, reciprocalHeading: 340, lengthM: 1701 },
    ],
  },
  {
    icao: 'FALE',
    name: 'King Shaka International Airport',
    city: 'Durban',
    elevationM: 93,
    elevationFt: 305,
    runways: [
      { ident: '06/24', heading: 60, reciprocalHeading: 240, lengthM: 3700 },
    ],
  },
];

/**
 * Calculate Density Altitude (feet)
 * Pressure Altitude = Field Elevation + (1013.25 - QNH) * 30
 * ISA Temp at PA = 15 - 1.98 * (PA / 1000)
 * Density Altitude = PA + 120 * (OAT - ISA Temp)
 */
export function calculateDensityAltitude(
  elevationFt: number,
  tempC: number,
  qnhHpa: number
): { densityAltFt: number; deltaFromFieldFt: number } {
  const pressureAlt = elevationFt + (1013.25 - qnhHpa) * 30;
  const isaTemp = 15 - 1.98 * (pressureAlt / 1000);
  const densityAlt = Math.round(pressureAlt + 120 * (tempC - isaTemp));
  return {
    densityAltFt: densityAlt,
    deltaFromFieldFt: densityAlt - elevationFt,
  };
}

/**
 * Estimate Cloud Base (feet AGL) using Dew Point Depression
 * Base ~ (Temp - DewPoint) * 400 ft
 */
export function estimateCloudBase(
  tempC: number,
  dewPointC: number,
  cloudCoverPct: number
): { cloudBaseFt: number; cloudLayerCode: string; description: string } {
  const depression = Math.max(0.5, tempC - dewPointC);
  let baseFt = Math.round(depression * 400);

  // High clouds or clear skies adjustment
  if (cloudCoverPct < 15) {
    baseFt = Math.max(baseFt, 12000);
    return { cloudBaseFt: baseFt, cloudLayerCode: 'SKC', description: 'Sky Clear / CAVOK' };
  } else if (cloudCoverPct < 30) {
    baseFt = Math.max(baseFt, 5500);
    return { cloudBaseFt: baseFt, cloudLayerCode: 'FEW', description: `Few clouds at ${baseFt.toLocaleString()} ft AGL` };
  } else if (cloudCoverPct < 60) {
    baseFt = Math.max(baseFt, 3800);
    return { cloudBaseFt: baseFt, cloudLayerCode: 'SCT', description: `Scattered clouds at ${baseFt.toLocaleString()} ft AGL` };
  } else if (cloudCoverPct < 85) {
    baseFt = Math.max(1200, Math.min(baseFt, 4200));
    return { cloudBaseFt: baseFt, cloudLayerCode: 'BKN', description: `Broken ceiling at ${baseFt.toLocaleString()} ft AGL (Flight Ceiling)` };
  } else {
    baseFt = Math.max(600, Math.min(baseFt, 2500));
    return { cloudBaseFt: baseFt, cloudLayerCode: 'OVC', description: `Overcast ceiling at ${baseFt.toLocaleString()} ft AGL (Strict Ceiling)` };
  }
}

/**
 * Determine FAA/ICAO Flight Category
 * VFR: Ceiling > 3,000 ft and Visibility > 5 sm (> 8 km)
 * MVFR: Ceiling 1,000 to 3,000 ft and/or Visibility 3 to 5 sm (5 to 8 km)
 * IFR: Ceiling 500 to < 1,000 ft and/or Visibility 1 to < 3 sm (1.6 to 5 km)
 * LIFR: Ceiling < 500 ft and/or Visibility < 1 sm (< 1.6 km)
 */
export function getFlightCategory(
  cloudBaseFt: number,
  visibilityKm: number,
  precipitationProb: number,
  isThunderstorm: boolean
): { category: 'VFR' | 'MVFR' | 'IFR' | 'LIFR'; safetyRating: 'SAFE' | 'CAUTION' | 'HAZARDOUS' | 'GROUNDED' } {
  if (isThunderstorm) {
    return { category: 'IFR', safetyRating: 'GROUNDED' };
  }

  const visSm = visibilityKm * 0.621371;

  if (cloudBaseFt < 500 || visSm < 1.0) {
    return { category: 'LIFR', safetyRating: 'GROUNDED' };
  }
  if (cloudBaseFt < 1000 || visSm < 3.0) {
    return { category: 'IFR', safetyRating: 'HAZARDOUS' };
  }
  if (cloudBaseFt <= 3000 || visSm <= 5.0 || precipitationProb > 65) {
    return { category: 'MVFR', safetyRating: 'CAUTION' };
  }
  return { category: 'VFR', safetyRating: 'SAFE' };
}

/**
 * Calculate Runway Wind Vectors (Headwind and Crosswind)
 */
export function calculateRunwayWind(
  windSpeedKts: number,
  windDirDeg: number,
  runwayHeadingDeg: number
): {
  headwindKts: number;
  crosswindKts: number;
  crosswindDirection: 'LEFT' | 'RIGHT' | 'HEAD';
  isFavorable: boolean;
} {
  const rad = ((windDirDeg - runwayHeadingDeg) * Math.PI) / 180;
  const headwind = Math.round(windSpeedKts * Math.cos(rad));
  const crosswind = Math.round(windSpeedKts * Math.sin(rad));

  const absCross = Math.abs(crosswind);
  let crossDir: 'LEFT' | 'RIGHT' | 'HEAD' = 'HEAD';
  if (crosswind > 1) crossDir = 'RIGHT';
  else if (crosswind < -1) crossDir = 'LEFT';

  return {
    headwindKts: headwind, // Positive = headwind, Negative = tailwind
    crosswindKts: absCross,
    crosswindDirection: crossDir,
    isFavorable: headwind >= 0 && absCross <= 15,
  };
}

/**
 * Generate standard ICAO METAR string
 */
export function generateIcaoMetar(
  icao: string,
  tempC: number,
  dewPointC: number,
  qnhHpa: number,
  windDirDeg: number,
  windSpeedKts: number,
  gustKts: number,
  visibilityKm: number,
  cloudLayerCode: string,
  cloudBaseFt: number,
  isThunderstorm: boolean
): string {
  const now = new Date();
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hour = String(now.getUTCHours()).padStart(2, '0');
  const min = '00';
  const timeStamp = `${day}${hour}${min}Z`;

  const windDirStr = String(Math.round(windDirDeg / 10) * 10).padStart(3, '0');
  const windSpdStr = String(Math.round(windSpeedKts)).padStart(2, '0');
  const gustStr = gustKts > windSpeedKts + 7 ? `G${Math.round(gustKts)}` : '';
  const windToken = `${windDirStr}${windSpdStr}${gustStr}KT`;

  let visToken = '9999';
  if (visibilityKm < 1) visToken = '0800';
  else if (visibilityKm < 5) visToken = '4000';
  else if (visibilityKm < 10) visToken = `${Math.round(visibilityKm * 1000)}`;

  let weatherToken = '';
  if (isThunderstorm) weatherToken = '+TSRA ';
  else if (visibilityKm < 5) weatherToken = 'HZ ';

  let cloudToken = 'CAVOK';
  if (cloudLayerCode !== 'SKC') {
    const flightLevel = String(Math.round(cloudBaseFt / 100)).padStart(3, '0');
    const cb = isThunderstorm ? 'CB' : '';
    cloudToken = `${cloudLayerCode}${flightLevel}${cb}`;
  }

  const tempStr = tempC < 0 ? `M${Math.abs(Math.round(tempC))}` : String(Math.round(tempC)).padStart(2, '0');
  const dewStr = dewPointC < 0 ? `M${Math.abs(Math.round(dewPointC))}` : String(Math.round(dewPointC)).padStart(2, '0');
  const tempToken = `${tempStr}/${dewStr}`;

  const qnhToken = `Q${Math.round(qnhHpa)}`;

  return `${icao} ${timeStamp} ${windToken} ${visToken} ${weatherToken}${cloudToken} ${tempToken} ${qnhToken} NOSIG`;
}

/**
 * Generate standard ICAO TAF string
 */
export function generateIcaoTaf(
  icao: string,
  windDirDeg: number,
  windSpeedKts: number,
  isThunderstorm: boolean
): string {
  const now = new Date();
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hour = String(now.getUTCHours()).padStart(2, '0');
  const validStart = `${day}${hour}00`;
  const validEnd = `${day}${String((now.getUTCHours() + 24) % 24).padStart(2, '0')}00`;

  const windDirStr = String(Math.round(windDirDeg / 10) * 10).padStart(3, '0');
  const windSpdStr = String(Math.round(windSpeedKts)).padStart(2, '0');

  const tempoGroup = isThunderstorm
    ? `TEMPO 1216 4000 +TSRA BKN020CB`
    : `TEMPO 1418 24018G28KT 7000 SCT035`;

  return `TAF ${icao} ${validStart}Z ${validStart}/${validEnd} ${windDirStr}${windSpdStr}KT 9999 SCT040 ${tempoGroup} BECMG 1921 VRB03KT CAVOK`;
}

/**
 * Assess major South African domestic flight routes
 */
export function evaluateFlightCorridors(
  originIcao: string,
  currentWeather: CurrentWeather,
  isThunderstorm: boolean
): FlightCorridorAssessment[] {
  return [
    {
      id: 'corridor-jnb-cpt',
      routeName: 'JNB/Boksburg (FAOR) ➔ Cape Town (FACT)',
      originIcao,
      destinationIcao: 'FACT',
      destinationCity: 'Cape Town',
      distanceNm: 686,
      enRouteTurbulence: isThunderstorm ? 'SEVERE' : 'LIGHT',
      destinationCategory: 'VFR',
      status: isThunderstorm ? 'CAUTION' : 'SAFE',
      keyPilotHazard: 'Mountain wave turbulence along Swartberg & Cape Fold mountain approach into Runway 19.',
    },
    {
      id: 'corridor-jnb-dur',
      routeName: 'JNB/Boksburg (FAOR) ➔ Durban (FALE)',
      originIcao,
      destinationIcao: 'FALE',
      destinationCity: 'Durban King Shaka',
      distanceNm: 268,
      enRouteTurbulence: isThunderstorm ? 'SEVERE' : 'MODERATE',
      destinationCategory: currentWeather.precipitationProbability > 40 ? 'MVFR' : 'VFR',
      status: isThunderstorm ? 'RESTRICTED' : 'SAFE',
      keyPilotHazard: 'Drakensberg orographic lift & coastal moisture inversion on descent through coastal ridge.',
    },
    {
      id: 'corridor-jnb-plz',
      routeName: 'JNB/Boksburg (FAOR) ➔ Gqeberha (FAPE)',
      originIcao,
      destinationIcao: 'FAPE',
      destinationCity: 'Gqeberha / Port Elizabeth',
      distanceNm: 492,
      enRouteTurbulence: 'LIGHT',
      destinationCategory: 'VFR',
      status: 'SAFE',
      keyPilotHazard: 'Strong coastal south-westerly wind shear on final approach into Algoa Bay.',
    },
    {
      id: 'corridor-jnb-kmia',
      routeName: 'JNB/Boksburg (FAOR) ➔ Kruger Mpumalanga (FAKN)',
      originIcao,
      destinationIcao: 'FAKN',
      destinationCity: 'Nelspruit / Kruger',
      distanceNm: 161,
      enRouteTurbulence: isThunderstorm ? 'MODERATE' : 'LIGHT',
      destinationCategory: 'VFR',
      status: 'SAFE',
      keyPilotHazard: 'Escarpment drop-off turbulence and Lowveld valley morning radiation fog.',
    },
  ];
}

/**
 * Main Flight Weather Evaluation Engine
 */
export function evaluateFlightWeather(
  weather: WeatherData,
  extremeState?: ExtremeWeatherEvent | null
): FlightWeatherAnalysis {
  const current = weather.current;
  const isHighveld = weather.location.latitude < -25 && weather.location.latitude > -27;
  const isThunderstorm =
    extremeState?.eventType === 'SEVERE_THUNDERSTORM' ||
    extremeState?.eventType === 'TORNADO_SUPERCELL' ||
    current.weatherCode >= 95;

  // Selected default hub: O.R. Tambo (FAOR) right next to Boksburg, or Rand (FAGM)
  const aerodrome = SOUTH_AFRICAN_AERODROMES[0]; // FAOR Boksburg/JNB
  const elevationFt = aerodrome.elevationFt;

  // Meteorological conversions
  const windSpeedKts = Math.round(current.windSpeed * 0.539957);
  const gustKts = Math.round((current.windGust ?? current.windSpeed * 1.3) * 0.539957);
  const windDirDeg = current.windDirection;
  const qnhHpa = current.surfacePressure || 1018;
  const qnhInHg = Number((qnhHpa * 0.02953).toFixed(2));
  const dewPointC = current.dewPoint ?? Number((current.temperature - ((100 - current.relativeHumidity) / 5)).toFixed(1));
  const visKm = current.visibility ? current.visibility / 1000 : 10;
  const visSm = Number((visKm * 0.621371).toFixed(1));

  // Density Altitude calculation
  const { densityAltFt, deltaFromFieldFt } = calculateDensityAltitude(elevationFt, current.temperature, qnhHpa);

  // Cloud Ceiling & Category
  const { cloudBaseFt, cloudLayerCode, description: cloudCoverageDesc } = estimateCloudBase(
    current.temperature,
    dewPointC,
    current.cloudCover
  );

  const { category, safetyRating } = getFlightCategory(cloudBaseFt, visKm, current.precipitationProbability, isThunderstorm);

  // Freezing level calculation (approx 2°C drop per 1000 ft above field)
  const freezingLevelFt = Math.round(elevationFt + (Math.max(0, current.temperature) / 2) * 1000);

  // Turbulence & Icing estimation
  let turbulenceLevel: 'NONE' | 'LIGHT' | 'MODERATE' | 'SEVERE' = 'NONE';
  if (isThunderstorm || gustKts > 35) turbulenceLevel = 'SEVERE';
  else if (gustKts > 24 || (isHighveld && current.temperature > 28)) turbulenceLevel = 'MODERATE';
  else if (windSpeedKts > 12) turbulenceLevel = 'LIGHT';

  let icingRisk: 'NONE' | 'LIGHT' | 'MODERATE' | 'SEVERE' = 'NONE';
  if (isThunderstorm) icingRisk = 'SEVERE';
  else if (current.precipitation > 0 && current.temperature < 4) icingRisk = 'MODERATE';
  else if (current.cloudCover > 70 && current.temperature < 7) icingRisk = 'LIGHT';

  const windShearRisk = gustKts - windSpeedKts >= 12 || isThunderstorm;

  // Runways analysis for FAOR / Boksburg
  const runways: RunwayAnalysis[] = aerodrome.runways.flatMap((r) => {
    // Check both runway directions
    const calc1 = calculateRunwayWind(windSpeedKts, windDirDeg, r.heading);
    const calc2 = calculateRunwayWind(windSpeedKts, windDirDeg, r.reciprocalHeading);

    const [primaryHeading, primaryIdent, chosenCalc] =
      calc1.headwindKts >= calc2.headwindKts
        ? [r.heading, r.ident.split('/')[0], calc1]
        : [r.reciprocalHeading, r.ident.split('/')[1] || r.ident, calc2];

    const caution =
      chosenCalc.crosswindKts > 20
        ? `Severe crosswind component (${chosenCalc.crosswindKts} kts) exceeds general aviation limits.`
        : chosenCalc.crosswindKts > 14
        ? `Moderate crosswind (${chosenCalc.crosswindKts} kts). Pilot rudder crab required.`
        : null;

    return [
      {
        ident: primaryIdent,
        headingDeg: primaryHeading,
        lengthMeters: r.lengthM,
        headwindKts: chosenCalc.headwindKts,
        crosswindKts: chosenCalc.crosswindKts,
        crosswindDirection: chosenCalc.crosswindDirection,
        isPreferred: chosenCalc.headwindKts >= 0 && chosenCalc.crosswindKts <= 15,
        caution,
      },
    ];
  });

  // Calculate composite Flight Safety Score (0 - 100)
  let safetyScore = 100;
  if (category === 'LIFR') safetyScore -= 65;
  else if (category === 'IFR') safetyScore -= 45;
  else if (category === 'MVFR') safetyScore -= 25;

  if (isThunderstorm) safetyScore -= 50;
  if (turbulenceLevel === 'SEVERE') safetyScore -= 30;
  else if (turbulenceLevel === 'MODERATE') safetyScore -= 15;

  if (deltaFromFieldFt > 2000) safetyScore -= 12; // High density altitude penalty
  if (windShearRisk) safetyScore -= 15;
  if (icingRisk === 'MODERATE' || icingRisk === 'SEVERE') safetyScore -= 20;
  safetyScore = Math.max(10, Math.min(100, safetyScore));

  // Pilot Cautions generation
  const pilotCautions: FlightWeatherAnalysis['pilotCautions'] = [];

  if (isThunderstorm) {
    pilotCautions.push({
      severity: 'CRITICAL',
      title: 'SEVERE CONVECTIVE THUNDERSTORM / HAIL HAZARD',
      details: 'Active cumulonimbus (CB) cells detected in the Boksburg / East Rand sector. Severe updrafts, microburst downdrafts, and large hail reported.',
      actionRequired: 'Ground stop advised for light aircraft. Minimum 20 nautical mile radar avoidance required for all instrument operations.',
    });
  }

  if (deltaFromFieldFt > 1800) {
    pilotCautions.push({
      severity: 'WARNING',
      title: `HIGH DENSITY ALTITUDE ADVISORY (${densityAltFt.toLocaleString()} FT DA)`,
      details: `Field elevation is 5,558 ft, but thin warm Highveld air creates an effective density altitude of ${densityAltFt.toLocaleString()} ft (+${deltaFromFieldFt.toLocaleString()} ft above field).`,
      actionRequired: 'Expect lengthened takeoff ground roll (+25-40%), diminished rate of climb, and longer landing roll. Lean fuel mixture for max takeoff power.',
    });
  }

  if (windShearRisk) {
    pilotCautions.push({
      severity: 'WARNING',
      title: `LOW-LEVEL WIND SHEAR & GUST SPREAD (${gustKts} KTS)`,
      details: `Gust factor exceeds sustained wind by ${gustKts - windSpeedKts} knots on final approach corridor.`,
      actionRequired: 'Add half the gust factor (+5 to 8 kts) to approach reference speed (Vref). Be prepared for immediate go-around.',
    });
  }

  const maxCross = Math.max(...runways.map((r) => r.crosswindKts));
  if (maxCross > 15) {
    pilotCautions.push({
      severity: 'ADVISORY',
      title: `CROSSWIND COMPONENT ALERT (${maxCross} KTS)`,
      details: `Crosswind velocity on active runways is near or above the demonstrated crosswind limit for single-engine trainer aircraft (C172 / PA-28).`,
      actionRequired: 'Execute wing-low / slip or crab decrab technique. Request runway into prevailing wind if available.',
    });
  }

  if (freezingLevelFt < 10000 && current.precipitation > 0) {
    pilotCautions.push({
      severity: 'WARNING',
      title: `STRUCTURAL ICING RISK (FREEZING LEVEL AT ${freezingLevelFt.toLocaleString()} FT AMSL)`,
      details: 'Freezing level is within typical descent altitudes with visible atmospheric moisture present.',
      actionRequired: 'Pitot heat ON prior to cloud entry. Non-FIKI certified aircraft strictly prohibited from prolonged flight in visible moisture.',
    });
  }

  if (category === 'VFR' && pilotCautions.length === 0) {
    pilotCautions.push({
      severity: 'INFO',
      title: 'OPTIMAL VFR FLIGHT CONDITIONS CONFIRMED',
      details: `Clear visibility (${visKm} km) with stable cloud base above 3,500 ft AGL and manageable winds.`,
      actionRequired: 'Maintain visual flight vigilance and standard radio position broadcasts on Johannesburg Special Rules Frequency 125.8 MHz.',
    });
  }

  // Generate 12-Hour Flight Safety Timeline
  const hourlyWindows: HourlyFlightWindow[] = (weather.hourly || []).slice(0, 12).map((h, idx) => {
    const hHour = new Date(h.time).getHours();
    const hTimeStr = `${String(hHour).padStart(2, '0')}:00`;
    const hWindKts = Math.round(h.windSpeed * 0.539957);
    const hGustKts = Math.round((h.windGust ?? h.windSpeed * 1.3) * 0.539957);
    const hDew = h.temperature - 7;
    const hCloud = estimateCloudBase(h.temperature, hDew, h.cloudCover ?? (h.precipitationProbability > 40 ? 70 : 25));
    const hVisKm = h.precipitation > 0 ? 6 : 10;
    const hStorm = h.precipitationProbability > 60 || h.weatherCode >= 95;
    const hCat = getFlightCategory(hCloud.cloudBaseFt, hVisKm, h.precipitationProbability, hStorm);

    const { densityAltFt: hDA } = calculateDensityAltitude(elevationFt, h.temperature, qnhHpa);

    let rec = 'Safe for standard VFR operations';
    if (hCat.safetyRating === 'GROUNDED') rec = 'Flight Grounding: Thunderstorm cells / hazardous ceiling';
    else if (hCat.safetyRating === 'HAZARDOUS') rec = 'IFR only: Low cloud base and reduced visibility';
    else if (hCat.safetyRating === 'CAUTION') rec = 'Pilot Caution: Convective thermal updrafts & moderate crosswind';

    return {
      time: hTimeStr,
      hour: hHour,
      category: hCat.category,
      safetyRating: hCat.safetyRating,
      safetyScore: hCat.safetyRating === 'SAFE' ? 95 - idx * 2 : hCat.safetyRating === 'CAUTION' ? 65 : 30,
      windKts: hWindKts,
      gustKts: hGustKts,
      crosswindKts: Math.round(hWindKts * 0.6),
      cloudBaseFeet: hCloud.cloudBaseFt,
      visKm: hVisKm,
      densityAltFeet: hDA,
      recommendation: rec,
    };
  });

  // Calculate Optimal Flight Window
  const safeHours = hourlyWindows.filter((w) => w.safetyRating === 'SAFE');
  let optimalWindow = 'Morning window (07:00 - 11:30 SAST) recommended prior to convective afternoon buildup';
  if (safeHours.length > 0) {
    optimalWindow = `${safeHours[0].time} - ${safeHours[safeHours.length - 1].time} SAST (VFR conditions optimal)`;
  }

  // Generate Raw METAR & TAF
  const metarRaw = generateIcaoMetar(
    aerodrome.icao,
    current.temperature,
    dewPointC,
    qnhHpa,
    windDirDeg,
    windSpeedKts,
    gustKts,
    visKm,
    cloudLayerCode,
    cloudBaseFt,
    isThunderstorm
  );

  const tafRaw = generateIcaoTaf(aerodrome.icao, windDirDeg, windSpeedKts, isThunderstorm);

  const corridors = evaluateFlightCorridors(aerodrome.icao, current, isThunderstorm);

  const altitudeProfile = generateAltitudeWeatherProfile(
    elevationFt,
    windSpeedKts,
    gustKts,
    windDirDeg,
    current.temperature,
    freezingLevelFt,
    isThunderstorm,
    turbulenceLevel,
    extremeState
  );

  return {
    aerodromeName: aerodrome.name,
    aerodromeIcao: aerodrome.icao,
    elevationMeters: aerodrome.elevationM,
    elevationFeet: aerodrome.elevationFt,
    category,
    safetyRating,
    safetyScore,
    flightStatusHeadline:
      safetyRating === 'SAFE'
        ? 'VFR FLIGHT CLEARANCE — ATMOSPHERIC STABILITY OPTIMAL'
        : safetyRating === 'CAUTION'
        ? 'PILOT CAUTION ADVISED — HIGH DENSITY ALTITUDE & GUST ENVELOPES'
        : safetyRating === 'HAZARDOUS'
        ? 'IFR ONLY — ADVERSE MARGINS FOR VISUAL OPERATIONS'
        : 'FLIGHT GROUNDING ADVISED — ACTIVE SEVERE CONVECTION',
    summary: `Current aerodrome weather at ${aerodrome.icao} (${weather.location.name}, Gauteng) indicates ${category} flight rules. Field elevation is ${elevationFt} ft with density altitude evaluated at ${densityAltFt.toLocaleString()} ft. Surface winds from ${String(windDirDeg).padStart(3, '0')}° at ${windSpeedKts} kts (gusts ${gustKts} kts).`,
    optimalFlightWindow: optimalWindow,
    pilotCautions,
    parameters: {
      windSpeedKts,
      windGustKts: gustKts,
      windDirectionDeg: windDirDeg,
      visibilityKm: visKm,
      visibilityStatuteMiles: visSm,
      cloudBaseFeet: cloudBaseFt,
      cloudCoverageDesc,
      freezingLevelFeet: freezingLevelFt,
      densityAltitudeFeet: densityAltFt,
      densityAltAnomalyFeet: deltaFromFieldFt,
      qnhHpa: Math.round(qnhHpa),
      qnhInHg,
      turbulenceLevel,
      icingRisk,
      convectiveStormRisk: isThunderstorm ? 'HIGH' : current.precipitationProbability > 40 ? 'ELEVATED' : 'LOW',
      windShearRisk,
    },
    metarRaw,
    tafRaw,
    runways,
    hourlyFlightWindows: hourlyWindows,
    corridors,
    altitudeProfile,
  };
}

/**
 * Generate high-resolution South African Highveld atmospheric sounding profile
 * modeling altitude-specific wind speeds, gusts, shear gradients, and turbulence potential
 */
export function generateAltitudeWeatherProfile(
  fieldElevationFt: number,
  surfaceWindKts: number,
  surfaceGustKts: number,
  surfaceWindDirDeg: number,
  surfaceTempC: number,
  freezingLevelFt: number,
  isThunderstorm: boolean,
  baseTurbulence: 'NONE' | 'LIGHT' | 'MODERATE' | 'SEVERE',
  extremeState?: ExtremeWeatherEvent | null
): AltitudeWeatherProfilePoint[] {
  const levels = [
    {
      altitudeFt: 5550,
      flightLevel: 'SFC (5.5k)',
      altitudeLabel: '5,550 ft (AMSL)',
      windFactor: 1.0,
      gustAdd: surfaceGustKts - surfaceWindKts,
      dirOffset: 0,
      shearRate: surfaceGustKts > 20 ? 5.2 : 2.1,
      turbBase: isThunderstorm ? 68 : surfaceGustKts > 20 ? 38 : 15,
      edrBase: isThunderstorm ? 0.42 : 0.12,
      layerDescription: 'Terminal Surface Boundary Layer (Highveld Plateau)',
      hazardType: isThunderstorm
        ? 'Microburst / LLWS Hazard'
        : surfaceGustKts > 20
        ? 'Surface Gust Spread & Mechanical Shear'
        : 'Laminar Terminal Flow',
      action: 'Adhere to approach ref speeds. Active crosswind crab required.',
    },
    {
      altitudeFt: 7500,
      flightLevel: 'FL075',
      altitudeLabel: '7,500 ft (AMSL)',
      windFactor: 1.35,
      gustAdd: 6,
      dirOffset: 15,
      shearRate: 3.8,
      turbBase: isThunderstorm ? 74 : 32,
      edrBase: isThunderstorm ? 0.48 : 0.18,
      layerDescription: 'East Rand Circuit & Lower Terminal Airspace',
      hazardType: isThunderstorm
        ? 'Severe Convective Updrafts'
        : 'Highveld Diurnal Thermal Inversion Shear',
      action: 'Expect moderate thermal bumping during afternoon heating cycle.',
    },
    {
      altitudeFt: 9500,
      flightLevel: 'FL095',
      altitudeLabel: '9,500 ft (AMSL)',
      windFactor: 1.6,
      gustAdd: 8,
      dirOffset: 25,
      shearRate: 4.6,
      turbBase: isThunderstorm ? 79 : 36,
      edrBase: isThunderstorm ? 0.52 : 0.22,
      layerDescription: 'VASUR Terminal Holding Stack & Approach Gate',
      hazardType: isThunderstorm
        ? 'Lightning & Torrential Convection'
        : 'Terminal Approach Spacing Wake & Shear',
      action: 'Maintain speed margins in holding pattern. Verify altimeter subscale.',
    },
    {
      altitudeFt: 12000,
      flightLevel: 'FL120',
      altitudeLabel: '12,000 ft (AMSL)',
      windFactor: 1.85,
      gustAdd: 10,
      dirOffset: 35,
      shearRate: 4.1,
      turbBase: isThunderstorm ? 72 : 28,
      edrBase: isThunderstorm ? 0.46 : 0.16,
      layerDescription: 'TMA Ceiling & Escarpment Clearance Layer',
      hazardType: isThunderstorm
        ? 'Convective Cloud Tops & Heavy Rain'
        : 'Magaliesberg / Ridge Mountain Waves',
      action: 'Trim autopilot for minor wave oscillations.',
    },
    {
      altitudeFt: 15000,
      flightLevel: 'FL150',
      altitudeLabel: '15,000 ft (AMSL)',
      windFactor: 2.15,
      gustAdd: 12,
      dirOffset: 45,
      shearRate: 4.8,
      turbBase: isThunderstorm ? 82 : 34,
      edrBase: isThunderstorm ? 0.56 : 0.21,
      layerDescription: 'Highveld Freezing Level (0°C Isotherm)',
      hazardType: 'Mixed-Phase Supercooled Cloud Droplets / Structural Icing',
      action: 'Activate pitot heat, wing de-ice, and prop anti-icing boots.',
    },
    {
      altitudeFt: 18000,
      flightLevel: 'FL180',
      altitudeLabel: '18,000 ft (AMSL)',
      windFactor: 2.45,
      gustAdd: 14,
      dirOffset: 55,
      shearRate: 5.4,
      turbBase: isThunderstorm ? 88 : 38,
      edrBase: isThunderstorm ? 0.62 : 0.24,
      layerDescription: 'Mid-Tropospheric Convective Buildup Zone',
      hazardType: isThunderstorm
        ? 'Severe Hail Shafts & Multi-Cell Squalls'
        : 'Cloud Layer Shear & Minor Chop',
      action: 'Minimum 20 NM airborne radar diversion around convective cores.',
    },
    {
      altitudeFt: 24000,
      flightLevel: 'FL240',
      altitudeLabel: '24,000 ft (AMSL)',
      windFactor: 2.85,
      gustAdd: 16,
      dirOffset: 65,
      shearRate: 5.9,
      turbBase: isThunderstorm ? 65 : 30,
      edrBase: isThunderstorm ? 0.45 : 0.19,
      layerDescription: 'Upper Airway Transition Layer (FL240)',
      hazardType: 'Upper Transition Wind Shear & Frontal Boundary',
      action: 'Monitor cabin pressure differential and Mach buffet boundary.',
    },
    {
      altitudeFt: 30000,
      flightLevel: 'FL300',
      altitudeLabel: '30,000 ft (AMSL)',
      windFactor: 3.35,
      gustAdd: 20,
      dirOffset: 75,
      shearRate: 7.2,
      turbBase: isThunderstorm ? 76 : 48,
      edrBase: isThunderstorm ? 0.54 : 0.32,
      layerDescription: 'Subtropical Jet Stream Shear Inflow (CAT Zone)',
      hazardType: 'Clear Air Turbulence (CAT) along jet boundary',
      action: 'Illuminate passenger seatbelt signs. Reduce airspeed to turbulence penetration speed (Vra).',
    },
    {
      altitudeFt: 34000,
      flightLevel: 'FL340',
      altitudeLabel: '34,000 ft (AMSL)',
      windFactor: 3.75,
      gustAdd: 24,
      dirOffset: 80,
      shearRate: 8.5,
      turbBase: isThunderstorm ? 85 : 55,
      edrBase: isThunderstorm ? 0.65 : 0.38,
      layerDescription: 'Subtropical Jet Stream Core Velocity Peak',
      hazardType: 'Peak Horizontal & Vertical Wind Shear (CAT Risk)',
      action: 'Request step-climb or descent by 2,000 ft to escape jet core shear layer.',
    },
    {
      altitudeFt: 39000,
      flightLevel: 'FL390',
      altitudeLabel: '39,000 ft (AMSL)',
      windFactor: 3.2,
      gustAdd: 18,
      dirOffset: 85,
      shearRate: 4.2,
      turbBase: 24,
      edrBase: 0.14,
      layerDescription: 'Tropopause / Lower Stratospheric Laminar Layer',
      hazardType: 'Smooth Laminar Airflow; Coffin Corner Margin',
      action: 'Stable long-haul cruising regime. Monitor fuel temperature.',
    },
  ];

  return levels.map((lvl) => {
    const rawWind = Math.round(surfaceWindKts * lvl.windFactor + (lvl.altitudeFt > 20000 ? 15 : 2));
    const calculatedWind = Math.max(8, Math.min(125, rawWind));
    const calculatedGust = calculatedWind + Math.max(4, Math.round(lvl.gustAdd));
    const calculatedDir = (surfaceWindDirDeg + lvl.dirOffset) % 360;

    // Lapse rate: ~2°C drop per 1,000 ft above field elevation
    const altAboveFieldThousands = (lvl.altitudeFt - fieldElevationFt) / 1000;
    const oatTemp = Math.round(surfaceTempC - altAboveFieldThousands * 1.98);

    // Turbulence severity classification
    const turbPotential = Math.min(98, Math.max(10, lvl.turbBase + (extremeState ? 14 : 0)));
    const turbCat: AltitudeWeatherProfilePoint['turbulenceCategory'] =
      turbPotential >= 65
        ? 'SEVERE'
        : turbPotential >= 45
        ? 'MODERATE'
        : turbPotential >= 22
        ? 'LIGHT'
        : 'SMOOTH';

    const freezingStatus: AltitudeWeatherProfilePoint['freezingStatus'] =
      lvl.altitudeFt < freezingLevelFt - 1000
        ? 'ABOVE_FREEZING'
        : lvl.altitudeFt <= freezingLevelFt + 1000
        ? 'FREEZING_LEVEL'
        : 'SUB_ZERO';

    return {
      altitudeFt: lvl.altitudeFt,
      flightLevel: lvl.flightLevel,
      altitudeLabel: lvl.altitudeLabel,
      windSpeedKts: calculatedWind,
      windGustKts: calculatedGust,
      windDirectionDeg: calculatedDir,
      windShearKtsPer1000Ft: lvl.shearRate,
      turbulencePotential: turbPotential,
      turbulenceCategory: turbCat,
      edrValue: Number((lvl.edrBase * (turbPotential / lvl.turbBase)).toFixed(2)),
      airTempC: oatTemp,
      freezingStatus,
      layerDescription: lvl.layerDescription,
      hazardType: lvl.hazardType,
      recommendedAction: lvl.action,
    };
  });
}
