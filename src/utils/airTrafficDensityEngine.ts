import { AirTrafficZone, SimulatedAircraft, AirTrafficWeatherCorrelation, WeatherData, ExtremeWeatherEvent } from '../types';

export interface AirTrafficScenario {
  id: string;
  name: string;
  description: string;
  aircraftSpawnCount: number;
  holdingStackMultiplier: number;
}

export const SCENARIOS: AirTrafficScenario[] = [
  {
    id: 'standard',
    name: 'Real-Time Highveld Standard',
    description: 'Typical scheduled domestic & regional traffic flow into O.R. Tambo and Boksburg airspace.',
    aircraftSpawnCount: 16,
    holdingStackMultiplier: 1.0,
  },
  {
    id: 'peak-rush',
    name: 'Peak Inbound Bank Rush',
    description: 'Heavy European & domestic evening arrival rush with high traffic density over Boksburg.',
    aircraftSpawnCount: 26,
    holdingStackMultiplier: 1.8,
  },
  {
    id: 'convective-divert',
    name: 'Convective Storm Cell & Diversions',
    description: 'High traffic density forced into the Boksburg VASUR holding stack due to thunderstorms over FAOR.',
    aircraftSpawnCount: 22,
    holdingStackMultiplier: 3.2,
  },
];

export const AIR_TRAFFIC_ZONES_SEED: Array<Omit<AirTrafficZone, 'activeCount' | 'densityLevel' | 'dominantWeatherConstraint' | 'constraintSeverity' | 'correlationStatus' | 'recommendedSpacingNm' | 'delayMinutes' | 'airspaceRestriction' | 'flightPhasesPresent'>> = [
  {
    id: 'zone-faor-final-boksburg',
    name: 'Boksburg Southern Final Approach Corridor (RWY 03L / 03R)',
    shortLabel: 'Boksburg Final (03L/R)',
    center: { lat: -26.2300, lng: 28.2600 },
    radiusKm: 7.0,
    capacityPerHour: 36,
  },
  {
    id: 'zone-boksburg-vasur-hold',
    name: 'Boksburg VASUR / WIVIS Holding Stack',
    shortLabel: 'VASUR Hold (Boksburg)',
    center: { lat: -26.2800, lng: 28.2100 },
    radiusKm: 6.5,
    capacityPerHour: 18,
  },
  {
    id: 'zone-faor-departure-climb',
    name: 'FAOR Northern Departure & Climbout Sector (RWY 03L / 21R)',
    shortLabel: 'FAOR Climbout Sector',
    center: { lat: -26.0900, lng: 28.2300 },
    radiusKm: 7.5,
    capacityPerHour: 38,
  },
  {
    id: 'zone-boksburg-north-transit',
    name: 'Boksburg North & Benoni Intermediate Base Leg Sector',
    shortLabel: 'Boksburg Base Leg',
    center: { lat: -26.1800, lng: 28.2900 },
    radiusKm: 6.0,
    capacityPerHour: 28,
  },
  {
    id: 'zone-rand-eastrand-vfr',
    name: 'East Rand Low-Level General Aviation Corridor (Rand FAGM - Boksburg)',
    shortLabel: 'East Rand VFR Corridor',
    center: { lat: -26.2400, lng: 28.1700 },
    radiusKm: 5.5,
    capacityPerHour: 22,
  },
  {
    id: 'zone-faor-core-runway',
    name: 'O.R. Tambo International Airport Core (FAOR Complex)',
    shortLabel: 'FAOR Terminal Core',
    center: { lat: -26.1392, lng: 28.2460 },
    radiusKm: 4.5,
    capacityPerHour: 45,
  },
];

export const INITIAL_SIMULATED_AIRCRAFT: SimulatedAircraft[] = [
  {
    id: 'ac-01',
    callsign: 'SAA 324',
    airline: 'South African Airways',
    aircraftType: 'A350-900',
    origin: 'FACT (Cape Town)',
    destination: 'FAOR (Johannesburg)',
    flightPhase: 'FINAL_APPROACH',
    lat: -26.2380,
    lng: 28.2580,
    altitudeFt: 6200,
    groundspeedKts: 148,
    verticalSpeedFpm: -720,
    headingDeg: 28,
    targetWaypoint: 'FAOR RWY 03L',
    zoneId: 'zone-faor-final-boksburg',
    weatherImpact: { hasConflict: false, hazardTitle: '', severity: 'NONE', atcAdvisory: 'Cleared ILS 03L approach, maintain 150 kts to 4 DME.' },
    trail: [
      { lat: -26.2550, lng: 28.2520 },
      { lat: -26.2465, lng: 28.2550 },
      { lat: -26.2380, lng: 28.2580 },
    ],
  },
  {
    id: 'ac-02',
    callsign: 'FA 204',
    airline: 'FlySafair',
    aircraftType: 'B737-800',
    origin: 'FALE (Durban King Shaka)',
    destination: 'FAOR (Johannesburg)',
    flightPhase: 'FINAL_APPROACH',
    lat: -26.2650,
    lng: 28.2680,
    altitudeFt: 7100,
    groundspeedKts: 160,
    verticalSpeedFpm: -750,
    headingDeg: 26,
    targetWaypoint: 'FAOR RWY 03R',
    zoneId: 'zone-faor-final-boksburg',
    weatherImpact: { hasConflict: false, hazardTitle: '', severity: 'NONE', atcAdvisory: 'Established localizer 03R, number 2 in sequence.' },
    trail: [
      { lat: -26.2850, lng: 28.2610 },
      { lat: -26.2750, lng: 28.2645 },
      { lat: -26.2650, lng: 28.2680 },
    ],
  },
  {
    id: 'ac-03',
    callsign: '4Z 812',
    airline: 'Airlink',
    aircraftType: 'E195-E2',
    origin: 'FAGG (George)',
    destination: 'FAOR (Johannesburg)',
    flightPhase: 'INITIAL_APPROACH',
    lat: -26.1950,
    lng: 28.3150,
    altitudeFt: 7800,
    groundspeedKts: 185,
    verticalSpeedFpm: -900,
    headingDeg: 265,
    targetWaypoint: 'WIVIS (Boksburg East)',
    zoneId: 'zone-boksburg-north-transit',
    weatherImpact: { hasConflict: false, hazardTitle: '', severity: 'NONE', atcAdvisory: 'Turn left heading 240, intercept final approach course over Benoni.' },
    trail: [
      { lat: -26.1900, lng: 28.3450 },
      { lat: -26.1925, lng: 28.3300 },
      { lat: -26.1950, lng: 28.3150 },
    ],
  },
  {
    id: 'ac-04',
    callsign: 'EK 761',
    airline: 'Emirates',
    aircraftType: 'B777-300ER',
    origin: 'OMDB (Dubai)',
    destination: 'FAOR (Johannesburg)',
    flightPhase: 'HOLDING',
    lat: -26.2780,
    lng: 28.2120,
    altitudeFt: 9000,
    groundspeedKts: 210,
    verticalSpeedFpm: 0,
    headingDeg: 190,
    targetWaypoint: 'VASUR (Boksburg South Hold)',
    zoneId: 'zone-boksburg-vasur-hold',
    weatherImpact: { hasConflict: true, hazardTitle: 'Traffic Congestion Hold', severity: 'MODERATE', atcAdvisory: 'VASUR hold FL090 right hand turns, expected approach time 18 mins.' },
    trail: [
      { lat: -26.2620, lng: 28.2180 },
      { lat: -26.2700, lng: 28.2150 },
      { lat: -26.2780, lng: 28.2120 },
    ],
  },
  {
    id: 'ac-05',
    callsign: 'BA 055',
    airline: 'British Airways',
    aircraftType: 'A380-800',
    origin: 'EGLL (London Heathrow)',
    destination: 'FAOR (Johannesburg)',
    flightPhase: 'HOLDING',
    lat: -26.2920,
    lng: 28.2040,
    altitudeFt: 10000,
    groundspeedKts: 220,
    verticalSpeedFpm: 0,
    headingDeg: 350,
    targetWaypoint: 'VASUR (Boksburg South Hold)',
    zoneId: 'zone-boksburg-vasur-hold',
    weatherImpact: { hasConflict: true, hazardTitle: 'Sequencing Delay', severity: 'MODERATE', atcAdvisory: 'Hold at VASUR FL100, spacing expanded due to gusting crosswinds.' },
    trail: [
      { lat: -26.3050, lng: 28.2090 },
      { lat: -26.2980, lng: 28.2065 },
      { lat: -26.2920, lng: 28.2040 },
    ],
  },
  {
    id: 'ac-06',
    callsign: 'CLX 782',
    airline: 'Cargolux',
    aircraftType: 'B747-8F',
    origin: 'FAOR (Johannesburg)',
    destination: 'ELLX (Luxembourg)',
    flightPhase: 'DEPARTURE_CLIMB',
    lat: -26.0820,
    lng: 28.2280,
    altitudeFt: 8400,
    groundspeedKts: 240,
    verticalSpeedFpm: 1600,
    headingDeg: 355,
    targetWaypoint: 'LIVTO (Northbound SID)',
    zoneId: 'zone-faor-departure-climb',
    weatherImpact: { hasConflict: false, hazardTitle: '', severity: 'NONE', atcAdvisory: 'Climb unrestricted FL150, contact Johannesburg Radar 124.50.' },
    trail: [
      { lat: -26.1150, lng: 28.2390 },
      { lat: -26.0985, lng: 28.2335 },
      { lat: -26.0820, lng: 28.2280 },
    ],
  },
  {
    id: 'ac-07',
    callsign: '5Z 311',
    airline: 'CemAir',
    aircraftType: 'CRJ-900',
    origin: 'FAOR (Johannesburg)',
    destination: 'FABL (Bloemfontein)',
    flightPhase: 'DEPARTURE_CLIMB',
    lat: -26.1950,
    lng: 28.2200,
    altitudeFt: 7500,
    groundspeedKts: 220,
    verticalSpeedFpm: 1400,
    headingDeg: 205,
    targetWaypoint: 'GERMISTON (Southbound SID)',
    zoneId: 'zone-faor-final-boksburg',
    weatherImpact: { hasConflict: false, hazardTitle: '', severity: 'NONE', atcAdvisory: 'Turn right heading 210, climb FL100 over Boksburg.' },
    trail: [
      { lat: -26.1550, lng: 28.2380 },
      { lat: -26.1750, lng: 28.2290 },
      { lat: -26.1950, lng: 28.2200 },
    ],
  },
  {
    id: 'ac-08',
    callsign: 'ZS-RPS',
    airline: 'Netcare 911 Medevac',
    aircraftType: 'Bell 430 Helicopter',
    origin: 'Netcare Sunward Park Hospital',
    destination: 'Rand Airport (FAGM)',
    flightPhase: 'VFR_LOW_LEVEL',
    lat: -26.2420,
    lng: 28.1850,
    altitudeFt: 5800,
    groundspeedKts: 110,
    verticalSpeedFpm: 0,
    headingDeg: 290,
    targetWaypoint: 'FAGM Helipad',
    zoneId: 'zone-rand-eastrand-vfr',
    weatherImpact: { hasConflict: false, hazardTitle: '', severity: 'NONE', atcAdvisory: 'Special VFR transit approved south of Boksburg CBD below 6,000 ft.' },
    trail: [
      { lat: -26.2360, lng: 28.2200 },
      { lat: -26.2390, lng: 28.2025 },
      { lat: -26.2420, lng: 28.1850 },
    ],
  },
  {
    id: 'ac-09',
    callsign: 'QR 1363',
    airline: 'Qatar Airways',
    aircraftType: 'A350-1000',
    origin: 'OTHH (Doha)',
    destination: 'FAOR (Johannesburg)',
    flightPhase: 'INITIAL_APPROACH',
    lat: -26.1620,
    lng: 28.3380,
    altitudeFt: 8200,
    groundspeedKts: 190,
    verticalSpeedFpm: -800,
    headingDeg: 235,
    targetWaypoint: 'BENONI INTERCEPT',
    zoneId: 'zone-boksburg-north-transit',
    weatherImpact: { hasConflict: false, hazardTitle: '', severity: 'NONE', atcAdvisory: 'Reduce speed 180 kts, sequence behind Airlink E195.' },
    trail: [
      { lat: -26.1480, lng: 28.3680 },
      { lat: -26.1550, lng: 28.3530 },
      { lat: -26.1620, lng: 28.3380 },
    ],
  },
  {
    id: 'ac-10',
    callsign: 'FA 112',
    airline: 'FlySafair',
    aircraftType: 'B737-800',
    origin: 'FAPE (Gqeberha / Port Elizabeth)',
    destination: 'FAOR (Johannesburg)',
    flightPhase: 'EN_ROUTE',
    lat: -26.3150,
    lng: 28.2750,
    altitudeFt: 8800,
    groundspeedKts: 215,
    verticalSpeedFpm: -1000,
    headingDeg: 12,
    targetWaypoint: 'BOKSBURG INBOUND GATE',
    zoneId: 'zone-faor-final-boksburg',
    weatherImpact: { hasConflict: false, hazardTitle: '', severity: 'NONE', atcAdvisory: 'Descend to 7,000 ft QNH 1024, direct Boksburg South.' },
    trail: [
      { lat: -26.3450, lng: 28.2820 },
      { lat: -26.3300, lng: 28.2785 },
      { lat: -26.3150, lng: 28.2750 },
    ],
  },
  {
    id: 'ac-11',
    callsign: 'ZS-FGL',
    airline: 'Rand Flight Academy',
    aircraftType: 'Cessna 172 Skyhawk',
    origin: 'FAGM (Rand Airport)',
    destination: 'FAGM Local Training',
    flightPhase: 'VFR_LOW_LEVEL',
    lat: -26.2550,
    lng: 28.1580,
    altitudeFt: 5600,
    groundspeedKts: 92,
    verticalSpeedFpm: 0,
    headingDeg: 110,
    targetWaypoint: 'Boksburg West VFR Boundary',
    zoneId: 'zone-rand-eastrand-vfr',
    weatherImpact: { hasConflict: false, hazardTitle: '', severity: 'NONE', atcAdvisory: 'Remain clear of FAOR Class C airspace, monitor 118.70.' },
    trail: [
      { lat: -26.2520, lng: 28.1350 },
      { lat: -26.2535, lng: 28.1465 },
      { lat: -26.2550, lng: 28.1580 },
    ],
  },
  {
    id: 'ac-12',
    callsign: 'LH 572',
    airline: 'Lufthansa',
    aircraftType: 'B747-8i',
    origin: 'EDDF (Frankfurt)',
    destination: 'FAOR (Johannesburg)',
    flightPhase: 'FINAL_APPROACH',
    lat: -26.1550,
    lng: 28.2490,
    altitudeFt: 5680,
    groundspeedKts: 142,
    verticalSpeedFpm: -680,
    headingDeg: 28,
    targetWaypoint: 'TOUCHDOWN RWY 03L',
    zoneId: 'zone-faor-core-runway',
    weatherImpact: { hasConflict: false, hazardTitle: '', severity: 'NONE', atcAdvisory: 'Wind 040 at 14 kts, cleared to land RWY 03L.' },
    trail: [
      { lat: -26.1950, lng: 28.2540 },
      { lat: -26.1750, lng: 28.2515 },
      { lat: -26.1550, lng: 28.2490 },
    ],
  },
];

/**
 * Calculates distance in kilometers between two geo coordinates using Haversine formula
 */
export function getGeoDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Evaluates real-time weather constraints and correlates them with air traffic zones
 */
export function correlateAirTrafficWithWeather(
  zonesSeed: typeof AIR_TRAFFIC_ZONES_SEED,
  aircraft: SimulatedAircraft[],
  weather: WeatherData,
  extremeState: ExtremeWeatherEvent,
  scenarioId = 'standard'
): {
  zones: AirTrafficZone[];
  correlation: AirTrafficWeatherCorrelation;
  updatedAircraft: SimulatedAircraft[];
} {
  const current = weather.current;
  const windKts = current.windSpeed;
  const windGustKts = current.windGust || current.windSpeed * 1.35;
  const isExtreme = extremeState.isExtreme;
  const weatherDesc = current.weatherDescription || '';
  const isThunderstorm =
    extremeState.eventType === 'SEVERE_THUNDERSTORM' ||
    extremeState.eventType === 'TORNADO_SUPERCELL' ||
    weatherDesc.toLowerCase().includes('thunder') ||
    weatherDesc.toLowerCase().includes('storm');

  const isRain = current.precipitation > 0.5 || weatherDesc.toLowerCase().includes('rain');
  const tempC = current.temperature;
  const isHighDensityAlt = tempC >= 28; // Highveld summer heat reduces climb gradients

  // Sector weather constraint index 0 - 100
  let constraintScore = 15;
  if (isThunderstorm) constraintScore += 55;
  if (windGustKts > 25) constraintScore += 20;
  if (isRain) constraintScore += 12;
  if (isHighDensityAlt) constraintScore += 8;
  const weatherConstraintIndex = Math.min(100, constraintScore);

  // Crosswind on RWY 03/21 (heading ~030°)
  const crosswindSeparationApplied = windGustKts >= 22;

  // Process zones
  const zones: AirTrafficZone[] = zonesSeed.map((seed) => {
    // Filter aircraft whose position is within zone radius
    const zoneAcft = aircraft.filter((ac) => {
      const dist = getGeoDistanceKm(ac.lat, ac.lng, seed.center.lat, seed.center.lng);
      return dist <= seed.radiusKm;
    });

    const activeCount = zoneAcft.length;
    const loadFactor = activeCount / Math.max(1, seed.capacityPerHour / 3);

    let densityLevel: AirTrafficZone['densityLevel'] = 'LOW';
    if (loadFactor >= 0.85 || activeCount >= 4) densityLevel = 'CRITICAL';
    else if (loadFactor >= 0.55 || activeCount >= 3) densityLevel = 'HIGH';
    else if (loadFactor >= 0.3 || activeCount >= 2) densityLevel = 'MODERATE';

    // Weather constraint for this specific sector
    let dominantWeatherConstraint = 'Nominal VFR / Highveld Atmospheric Stability';
    let constraintSeverity: AirTrafficZone['constraintSeverity'] = 'NOMINAL';
    let correlationStatus = 'Optimal traffic throughput with standard radar separation';
    let recommendedSpacingNm = 5.0;
    let delayMinutes = 2;
    let airspaceRestriction: AirTrafficZone['airspaceRestriction'] = 'OPEN';

    if (seed.id === 'zone-faor-final-boksburg') {
      if (isThunderstorm) {
        dominantWeatherConstraint = 'Convective Storm Cell & Low-Level Windshear (LLWS) over Boksburg';
        constraintSeverity = 'CRITICAL';
        correlationStatus = 'HIGH CONGESTION + CONVECTIVE UPDRAFTS: Mandatory 9-11 NM radar separation applied over Boksburg South';
        recommendedSpacingNm = 10.0;
        delayMinutes = 24;
        airspaceRestriction = 'SPACING_EXPANDED';
      } else if (crosswindSeparationApplied) {
        dominantWeatherConstraint = `Approach Gust Factor (${Math.round(windGustKts)} kts) & Surface Friction`;
        constraintSeverity = 'MODERATE';
        correlationStatus = 'Approach spacing expanded to 7 NM to compensate for gust envelope & go-around risk';
        recommendedSpacingNm = 7.0;
        delayMinutes = 12;
        airspaceRestriction = 'SPACING_EXPANDED';
      } else if (isRain) {
        dominantWeatherConstraint = 'Wet Runway Friction & Reduced Braking Action Coefficient';
        constraintSeverity = 'MODERATE';
        correlationStatus = 'Extended runway rollouts require staggered arrival releases';
        recommendedSpacingNm = 6.5;
        delayMinutes = 8;
      }
    } else if (seed.id === 'zone-boksburg-vasur-hold') {
      if (isThunderstorm || scenarioId === 'convective-divert') {
        dominantWeatherConstraint = 'Terminal Flow Inbound Throttling & Storm Cell Stand-off';
        constraintSeverity = 'CRITICAL';
        correlationStatus = 'HOLDING STACK ACTIVE: Multi-level sequencing stack at VASUR (FL080 - FL140) over Boksburg';
        recommendedSpacingNm = 8.0;
        delayMinutes = 28;
        airspaceRestriction = 'HOLDING_MANDATORY';
      } else if (densityLevel === 'HIGH' || densityLevel === 'CRITICAL') {
        dominantWeatherConstraint = 'Arrival Metering & Sequence Buffering';
        constraintSeverity = 'MODERATE';
        correlationStatus = 'Traffic metering stack engaged to relieve FAOR touchdown saturation';
        recommendedSpacingNm = 6.0;
        delayMinutes = 14;
      }
    } else if (seed.id === 'zone-faor-departure-climb') {
      if (isHighDensityAlt) {
        dominantWeatherConstraint = 'High Density Altitude (+2,400 ft) — Reduced Heavy Aircraft Climb Gradient';
        constraintSeverity = 'MODERATE';
        correlationStatus = 'Heavy widebodies (A380/B777/B747) climbing slower through 8,000 ft over Gauteng';
        recommendedSpacingNm = 6.5;
        delayMinutes = 6;
      }
      if (isThunderstorm) {
        dominantWeatherConstraint = 'Convective Updraft Core & Severe Turbulence Aladdins';
        constraintSeverity = 'SEVERE';
        airspaceRestriction = 'SPACING_EXPANDED';
        delayMinutes = 18;
      }
    } else if (seed.id === 'zone-rand-eastrand-vfr') {
      if (isRain || isThunderstorm) {
        dominantWeatherConstraint = 'Marginal VFR / Sub-1,000 ft Cloud Ceiling over Boksburg West';
        constraintSeverity = 'SEVERE';
        correlationStatus = 'VFR flight rules suspended; GA traffic diverted to Rand Airport (FAGM)';
        airspaceRestriction = 'GROUND_STOP';
        delayMinutes = 35;
      }
    }

    const flightPhasesPresent = Array.from(new Set(zoneAcft.map((a) => a.flightPhase)));

    return {
      ...seed,
      activeCount,
      densityLevel,
      dominantWeatherConstraint,
      constraintSeverity,
      correlationStatus,
      recommendedSpacingNm,
      delayMinutes,
      airspaceRestriction,
      flightPhasesPresent,
    };
  });

  // Check holding stack depth
  const holdingCount = aircraft.filter((a) => a.flightPhase === 'HOLDING').length;
  const holdingStackActive = holdingCount > 0;

  // Boksburg sector density
  const boksburgFinalZone = zones.find((z) => z.id === 'zone-faor-final-boksburg');
  const boksburgSectorDensity = boksburgFinalZone ? boksburgFinalZone.densityLevel : 'MODERATE';

  // Overall delays
  const avgDelay = Math.round(
    zones.reduce((sum, z) => sum + z.delayMinutes * Math.max(1, z.activeCount), 0) /
      Math.max(1, aircraft.length)
  );

  // Active weather hazards list
  const activeWeatherHazards = zones
    .filter((z) => z.constraintSeverity !== 'NOMINAL')
    .map((z) => ({
      zoneName: z.shortLabel,
      hazard: z.dominantWeatherConstraint,
      severity: z.constraintSeverity as 'MODERATE' | 'SEVERE' | 'CRITICAL',
      impact: z.correlationStatus,
    }));

  const atcSystemAdvisories: string[] = [];
  if (isThunderstorm) {
    atcSystemAdvisories.push(
      'CONVECTIVE WEATHER SIGMET: Active cumulonimbus cells over East Rand / Boksburg corridor. RNAV standard arrivals subject to 20° weather avoidance.'
    );
  }
  if (crosswindSeparationApplied) {
    atcSystemAdvisories.push(
      `SURFACE GUST ADVISORY: Peak gusts ${Math.round(windGustKts)} kts detected at FAOR 03L/R. Spacing expanded to 8 NM minimum over Boksburg final.`
    );
  }
  if (holdingStackActive) {
    atcSystemAdvisories.push(
      `HOLDING STACK IN EFFECT: ${holdingCount} aircraft holding at VASUR fix (Boksburg South). Average sequencing delay ${avgDelay} minutes.`
    );
  }
  if (atcSystemAdvisories.length === 0) {
    atcSystemAdvisories.push(
      'FAOR AIRSPACE NOMINAL: Highveld visual conditions, all runway movements on time with nominal 5 NM spacing.'
    );
  }

  // Update aircraft weather conflict tags based on zone presence
  const updatedAircraft = aircraft.map((ac) => {
    // Find closest zone
    let assignedZone = zones[0];
    let minD = 99999;
    for (const z of zones) {
      const d = getGeoDistanceKm(ac.lat, ac.lng, z.center.lat, z.center.lng);
      if (d < minD) {
        minD = d;
        assignedZone = z;
      }
    }

    let hasConflict = false;
    let hazardTitle = '';
    let severity: 'NONE' | 'MODERATE' | 'SEVERE' = 'NONE';
    let atcAdvisory = ac.weatherImpact.atcAdvisory;

    if (assignedZone.constraintSeverity === 'CRITICAL' || assignedZone.constraintSeverity === 'SEVERE') {
      hasConflict = true;
      hazardTitle = assignedZone.dominantWeatherConstraint;
      severity = assignedZone.constraintSeverity === 'CRITICAL' ? 'SEVERE' : 'MODERATE';
      atcAdvisory = `[ATC ALERT] ${assignedZone.shortLabel}: Maintain ${assignedZone.recommendedSpacingNm} NM separation. ${assignedZone.dominantWeatherConstraint}.`;
    } else if (assignedZone.constraintSeverity === 'MODERATE') {
      hasConflict = true;
      hazardTitle = assignedZone.dominantWeatherConstraint;
      severity = 'MODERATE';
    }

    return {
      ...ac,
      zoneId: assignedZone.id,
      weatherImpact: {
        hasConflict,
        hazardTitle,
        severity,
        atcAdvisory,
      },
    };
  });

  const correlation: AirTrafficWeatherCorrelation = {
    totalAircraft: aircraft.length,
    boksburgSectorDensity,
    faorMovementRate: isThunderstorm ? 22 : windGustKts > 22 ? 30 : 42,
    weatherConstraintIndex,
    averageDelayMinutes: avgDelay,
    holdingStackActive,
    holdingCount,
    crosswindSeparationApplied,
    activeWeatherHazards,
    atcSystemAdvisories,
  };

  return {
    zones,
    correlation,
    updatedAircraft,
  };
}

/**
 * Advance aircraft simulation positions smoothly along their paths
 */
export function stepAirTrafficSimulation(
  aircraftList: SimulatedAircraft[],
  speedFactor = 1.0
): SimulatedAircraft[] {
  // Delta coordinates per second at ~150-250 kts
  // 1 knot ≈ 0.000514 km/s. In lat/lng terms, 1 deg lat ≈ 111 km.
  // We advance positions in small realistic steps.
  const timeStepSeconds = 1.5 * speedFactor;

  return aircraftList.map((ac) => {
    let newLat = ac.lat;
    let newLng = ac.lng;
    let newAltitude = ac.altitudeFt;
    let newHeading = ac.headingDeg;
    let newPhase = ac.flightPhase;

    // Movement calculation
    const speedKmS = (ac.groundspeedKts * 1.852) / 3600; // km per second
    const distanceTraveledKm = speedKmS * timeStepSeconds;

    if (ac.flightPhase === 'FINAL_APPROACH') {
      // Flying heading ~028° into FAOR (lat -26.1392, lng 28.2460)
      const rad = (ac.headingDeg * Math.PI) / 180;
      const dLat = (distanceTraveledKm * Math.cos(rad)) / 111;
      const dLng = (distanceTraveledKm * Math.sin(rad)) / (111 * Math.cos((ac.lat * Math.PI) / 180));

      newLat += dLat;
      newLng += dLng;
      newAltitude = Math.max(5558, newAltitude + (ac.verticalSpeedFpm / 60) * timeStepSeconds);

      // If reached runway threshold, recycle back to outer Boksburg entry gate
      if (newLat >= -26.1392 || newAltitude <= 5600) {
        newLat = -26.3300 + (Math.random() - 0.5) * 0.04;
        newLng = 28.2600 + (Math.random() - 0.5) * 0.04;
        newAltitude = 8200;
        newHeading = 26 + (Math.random() - 0.5) * 6;
      }
    } else if (ac.flightPhase === 'HOLDING') {
      // Orbiting around VASUR fix (lat -26.2800, lng 28.2100) in an oval racetrack
      // Turn rate ~ 3 degrees per second (standard rate one turn = 2 mins)
      const turnRate = 2.5 * timeStepSeconds;
      newHeading = (newHeading + turnRate) % 360;

      const rad = (newHeading * Math.PI) / 180;
      const dLat = (distanceTraveledKm * Math.cos(rad)) / 111;
      const dLng = (distanceTraveledKm * Math.sin(rad)) / (111 * Math.cos((ac.lat * Math.PI) / 180));

      newLat += dLat;
      newLng += dLng;
      // Slight clamp to keep inside Boksburg holding stack
      if (getGeoDistanceKm(newLat, newLng, -26.2800, 28.2100) > 8.0) {
        newLat = -26.2800 + (Math.random() - 0.5) * 0.03;
        newLng = 28.2100 + (Math.random() - 0.5) * 0.03;
      }
    } else if (ac.flightPhase === 'DEPARTURE_CLIMB') {
      // Climbing north/north-west out of FAOR
      const rad = (ac.headingDeg * Math.PI) / 180;
      const dLat = (distanceTraveledKm * Math.cos(rad)) / 111;
      const dLng = (distanceTraveledKm * Math.sin(rad)) / (111 * Math.cos((ac.lat * Math.PI) / 180));

      newLat += dLat;
      newLng += dLng;
      newAltitude = Math.min(18000, newAltitude + (ac.verticalSpeedFpm / 60) * timeStepSeconds);

      // Once far north, recycle to a new departure from FAOR
      if (newLat <= -26.0200 || newAltitude >= 14000) {
        newLat = -26.1350;
        newLng = 28.2430;
        newAltitude = 5650;
        newHeading = 355 + (Math.random() - 0.5) * 10;
      }
    } else if (ac.flightPhase === 'INITIAL_APPROACH') {
      // Inbound turning towards Boksburg final
      const rad = (ac.headingDeg * Math.PI) / 180;
      const dLat = (distanceTraveledKm * Math.cos(rad)) / 111;
      const dLng = (distanceTraveledKm * Math.sin(rad)) / (111 * Math.cos((ac.lat * Math.PI) / 180));

      newLat += dLat;
      newLng += dLng;
      newAltitude = Math.max(6800, newAltitude + (ac.verticalSpeedFpm / 60) * timeStepSeconds);

      // Turn towards Boksburg final approach course if near 28.26
      if (newLng <= 28.2650) {
        newHeading = 28;
        newPhase = 'FINAL_APPROACH';
      }
    } else {
      // General movement
      const rad = (ac.headingDeg * Math.PI) / 180;
      const dLat = (distanceTraveledKm * Math.cos(rad)) / 111;
      const dLng = (distanceTraveledKm * Math.sin(rad)) / (111 * Math.cos((ac.lat * Math.PI) / 180));

      newLat += dLat;
      newLng += dLng;

      // Keep within bounds
      if (newLat > -26.00 || newLat < -26.40 || newLng < 28.05 || newLng > 28.45) {
        newHeading = (newHeading + 180) % 360;
      }
    }

    // Keep breadcrumb trail
    const updatedTrail = [...ac.trail, { lat: newLat, lng: newLng }];
    if (updatedTrail.length > 7) {
      updatedTrail.shift();
    }

    return {
      ...ac,
      lat: Number(newLat.toFixed(5)),
      lng: Number(newLng.toFixed(5)),
      altitudeFt: Math.round(newAltitude),
      headingDeg: Math.round(newHeading),
      flightPhase: newPhase,
      trail: updatedTrail,
    };
  });
}
