import {
  WeatherData,
  ExtremeWeatherEvent,
  DroneNoFlyZone,
  DroneTurbulenceHotspot,
  DroneFlightSafetyAssessment,
  DroneWeightCategory,
} from '../types';

// Boksburg Geographic Reference Center
export const BOKSBURG_CENTER = {
  lat: -26.213,
  lng: 28.256,
  elevationMeters: 1600,
  elevationFt: 5250,
};

// Seed No-Fly Zones & Airspace Restrictions in Boksburg & Surrounds (SACAA Part 101)
export const BOKSBURG_DRONE_NO_FLY_ZONES: DroneNoFlyZone[] = [
  {
    id: 'nfz-faor-ctr',
    name: 'O. R. Tambo Intl (FAOR) 10km Aerodrome Exclusion',
    category: 'AIRPORT_CTR',
    centerLat: -26.136,
    centerLng: 28.241,
    radiusKm: 10.0,
    sacaaRule: 'SACAA CAR Part 101.05.9(1)(a) - Strict 10km Aerodrome Buffer',
    restrictionLevel: 'STRICT_PROHIBITED',
    description: 'Class C Controlled Airspace. High-density commercial jet traffic on Runway 03L/21R & 03R/21L. Unregistered drone operations carry criminal prosecution under the Civil Aviation Act.',
    maxPermittedAglFt: 0,
    authorityContact: 'ATNS FAOR Approach Radar / SACAA RPAS Desk',
  },
  {
    id: 'nfz-fagm-atz',
    name: 'Rand Airport (FAGM) 5km Approach Buffer',
    category: 'AIRPORT_ATZ',
    centerLat: -26.242,
    centerLng: 28.151,
    radiusKm: 5.0,
    sacaaRule: 'SACAA CAR Part 101.05.9 - 5km Secondary Aerodrome ATZ',
    restrictionLevel: 'AUTHORIZATION_REQUIRED',
    description: 'Active light general aviation, helicopter flight training, and vintage multi-engine piston circuits between 6,000 ft and 7,500 ft AMSL.',
    maxPermittedAglFt: 150,
    authorityContact: 'Rand Tower (118.70 MHz)',
  },
  {
    id: 'nfz-fabb-atz',
    name: 'Brakpan-Benoni Airfield (FABB) 5km VFR Buffer',
    category: 'AIRPORT_ATZ',
    centerLat: -26.241,
    centerLng: 28.301,
    radiusKm: 4.5,
    sacaaRule: 'SACAA CAR Part 101.05.9 - 5km Uncontrolled Aerodrome Safety Ring',
    restrictionLevel: 'AUTHORIZATION_REQUIRED',
    description: 'VFR light aircraft, gliders, and skydiving jump operations. Extreme low-level traffic on base leg and final approach.',
    maxPermittedAglFt: 150,
    authorityContact: 'Brakpan Radio (122.70 MHz)',
  },
  {
    id: 'nfz-boksburg-prison',
    name: 'Boksburg Correctional Services Facility',
    category: 'PRISON_FACILITY',
    centerLat: -26.208,
    centerLng: 28.261,
    radiusKm: 1.5,
    sacaaRule: 'National Key Point / Department of Correctional Services Prohibited Airspace',
    restrictionLevel: 'STRICT_PROHIBITED',
    description: 'Maximum and Medium Security Prison Complex. Drone overflights are strictly prohibited by South African statutory law; unauthorized sUAS are subject to RF jamming and confiscation.',
    maxPermittedAglFt: 0,
    authorityContact: 'SAPS Boksburg / Dept Correctional Services',
  },
  {
    id: 'nfz-tambo-memorial-heli',
    name: 'Tambo Memorial Hospital Heliport (Medevac)',
    category: 'HELIPORT',
    centerLat: -26.216,
    centerLng: 28.238,
    radiusKm: 1.2,
    sacaaRule: 'SACAA CAR Part 101.05.9(2) - Registered Heliport Buffer',
    restrictionLevel: 'STRICT_PROHIBITED',
    description: 'Emergency trauma medevac helicopter funnel. Air ambulances (Netcare 911 / HALO) approach and depart at tree-top altitude (50-200 ft AGL).',
    maxPermittedAglFt: 0,
    authorityContact: 'ER24 / Netcare Flight Operations',
  },
  {
    id: 'nfz-sunward-park-heli',
    name: 'Netcare Sunward Park Hospital Helipad',
    category: 'HELIPORT',
    centerLat: -26.257,
    centerLng: 28.266,
    radiusKm: 1.2,
    sacaaRule: 'SACAA CAR Part 101.05.9(2) - Registered Heliport Buffer',
    restrictionLevel: 'STRICT_PROHIBITED',
    description: 'Active emergency aeromedical landing site for critically ill trauma and ICU patient transfer helicopters.',
    maxPermittedAglFt: 0,
    authorityContact: 'Netcare Aeromedical Dispatch',
  },
  {
    id: 'nfz-eskom-substation',
    name: 'Eskom Highveld High-Voltage Grid & Substation',
    category: 'ELECTROMAGNETIC_HAZARD',
    centerLat: -26.228,
    centerLng: 28.281,
    radiusKm: 1.8,
    sacaaRule: 'Critical Infrastructure / High-Voltage EMI Safety Advisory',
    restrictionLevel: 'AUTHORIZATION_REQUIRED',
    description: '400kV / 275kV transmission lines and step-down substation. Severe magnetic flux causes IMU compass distortion, GPS lock loss, and uncommanded UAV flyaways.',
    maxPermittedAglFt: 100,
    authorityContact: 'Eskom Highveld Dispatch',
  },
  {
    id: 'nfz-fuel-depot',
    name: 'East Rand Petrochemical & Jet Fuel Depot',
    category: 'CRITICAL_INFRASTRUCTURE',
    centerLat: -26.155,
    centerLng: 28.252,
    radiusKm: 1.5,
    sacaaRule: 'National Key Points Act No 102 - Flammable Hazards Buffer',
    restrictionLevel: 'STRICT_PROHIBITED',
    description: 'Aviation fuel reserves supplying FAOR. Explosive vapor zones and heavy security surveillance.',
    maxPermittedAglFt: 0,
    authorityContact: 'Airports Company SA (ACSA) Security',
  },
];

// Seed Micro-Turbulence Hotspots across Boksburg
export const BOKSBURG_TURBULENCE_HOTSPOTS_SEED: DroneTurbulenceHotspot[] = [
  {
    id: 'turb-erpm-slimes',
    name: 'ERPM Mine Tailings & Slimes Dam Rotors',
    centerLat: -26.235,
    centerLng: 28.245,
    radiusKm: 2.2,
    hazardType: 'MINE_DUMP_ROTOR',
    turbulenceIntensity: 'SEVERE',
    edrValue: 0.38,
    updraftVelocityMs: 3.8,
    riskScore: 78,
    impactOnsUAS: 'Steep artificial sand cliffs generate powerful mechanical downwash and vortex shedding on the downwind side. Rapid altitude loss for small drones (<2kg).',
    pilotAdvice: 'Maintain at least 150m clearance downwind of the mine dump crest. Expect sudden negative vertical g-forces.',
  },
  {
    id: 'turb-dunswart-industrial',
    name: 'Dunswart Heavy Industrial Thermal Plumes',
    centerLat: -26.201,
    centerLng: 28.285,
    radiusKm: 1.8,
    hazardType: 'THERMAL_UPDRAFT',
    turbulenceIntensity: 'MODERATE',
    edrValue: 0.29,
    updraftVelocityMs: 4.2,
    riskScore: 65,
    impactOnsUAS: 'Extensive corrugated iron roofs heat up rapidly under Highveld solar radiation, producing violent micro-thermals that push drones upward uncontrollably.',
    pilotAdvice: 'Limit flight ceiling to 200 ft AGL. Avoid hovering directly over dark metallic roof ridges in direct midday sun.',
  },
  {
    id: 'turb-cinderella-lake',
    name: 'Cinderella Dam & Boksburg Lake Boundary Shear',
    centerLat: -26.225,
    centerLng: 28.254,
    radiusKm: 1.4,
    hazardType: 'LAKE_BREEZE_SHEAR',
    turbulenceIntensity: 'MODERATE',
    edrValue: 0.22,
    updraftVelocityMs: 2.1,
    riskScore: 48,
    impactOnsUAS: 'Water-to-land thermal contrast generates a localized boundary convergence line. Mild wind roll and water mist spray during windy spells.',
    pilotAdvice: 'Ensure Return-to-Home (RTH) altitude is set above lakeside eucalyptus trees (min 60m AGL).',
  },
  {
    id: 'turb-jetpark-convective',
    name: 'Jet Park / R21 Logistics Corridor Wind Canyon',
    centerLat: -26.168,
    centerLng: 28.232,
    radiusKm: 1.6,
    hazardType: 'URBAN_CANYON_WIND',
    turbulenceIntensity: 'SEVERE',
    edrValue: 0.35,
    updraftVelocityMs: 3.2,
    riskScore: 72,
    impactOnsUAS: 'Tall distribution warehouses channel surface wind into high-velocity venturi jets between buildings, creating crosswind shear at low altitudes.',
    pilotAdvice: 'Beware of sudden lateral wind shifts when clearing building rooflines.',
  },
];

// Helper: Calculate Great Circle Distance in Kilometers
export function calculateGeoDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
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

// Evaluate Drone Flight Safety & Micro-Turbulence in Boksburg
export function evaluateDroneFlightSafety(
  weather: WeatherData,
  extremeState: ExtremeWeatherEvent | null | undefined,
  droneCategory: DroneWeightCategory = 'micro_250g'
): {
  assessment: DroneFlightSafetyAssessment;
  hotspots: DroneTurbulenceHotspot[];
  noFlyZones: DroneNoFlyZone[];
} {
  const windKts = weather.current.windSpeed;
  const gustKts = weather.current.windGust || Math.round(windKts * 1.35);
  const tempC = weather.current.temperature;
  const pressureHpa = weather.current.surfacePressure || 1018;

  // Drone specs by category
  const limits = {
    micro_250g: { maxWind: 15, maxGust: 19, name: 'Micro Drone (<250g, e.g. DJI Mini)' },
    standard_2kg: { maxWind: 21, maxGust: 27, name: 'Standard sUAS (<2kg, e.g. DJI Air/Mavic)' },
    commercial_25kg: { maxWind: 28, maxGust: 34, name: 'Commercial RPAS (2-25kg, e.g. Matrice/Wingtra)' },
    fpv: { maxWind: 23, maxGust: 30, name: 'FPV / Custom Racing Drone' },
  }[droneCategory];

  // Calculate Highveld Density Altitude for Boksburg (Elev: ~5,250 ft / 1,600m)
  // Standard Temp at 5,250 ft is ~4.5°C
  const isaTempAtElevation = 15 - 1.98 * (5250 / 1000); // approx 4.6°C
  const tempDeviation = tempC - isaTempAtElevation;
  const pressureAlt = 5250 + 27 * (1013.25 - pressureHpa);
  const densityAltFt = Math.round(pressureAlt + 120 * tempDeviation);

  // Highveld Battery & Lift Penalties for sUAS
  // Air density decreases ~3% per 1,000 ft above sea level.
  const densityRatio = Math.max(0.7, 1 - (densityAltFt / 1000) * 0.032);
  const liftLossPercent = Math.round((1 - densityRatio) * 100);
  const batteryPenaltyPercent = Math.min(35, Math.round(liftLossPercent * 1.3));

  // Determine Hotspots with real-time weather amplification
  const windFactor = Math.min(2.0, Math.max(0.6, windKts / 12));
  const tempFactor = Math.min(1.8, Math.max(0.8, tempC / 20));
  const isExtreme = extremeState?.isExtreme || false;

  const dynamicHotspots: DroneTurbulenceHotspot[] = BOKSBURG_TURBULENCE_HOTSPOTS_SEED.map((spot) => {
    let score = spot.riskScore;
    if (spot.hazardType === 'MINE_DUMP_ROTOR' || spot.hazardType === 'URBAN_CANYON_WIND') {
      score = Math.min(99, Math.round(score * windFactor));
    } else if (spot.hazardType === 'THERMAL_UPDRAFT') {
      score = Math.min(99, Math.round(score * tempFactor));
    }
    if (isExtreme) {
      score = Math.min(99, score + 18);
    }

    let intensity: 'MODERATE' | 'SEVERE' | 'EXTREME' = 'MODERATE';
    if (score >= 75) intensity = 'EXTREME';
    else if (score >= 55) intensity = 'SEVERE';

    return {
      ...spot,
      riskScore: score,
      turbulenceIntensity: intensity,
      updraftVelocityMs: Number((spot.updraftVelocityMs * windFactor).toFixed(1)),
      edrValue: Number((spot.edrValue * windFactor).toFixed(2)),
    };
  });

  // Calculate overall safety score
  const reasons: string[] = [];
  const advisories: string[] = [];
  let score = 100;

  // Wind checks
  const isWindExceeded = windKts > limits.maxWind || gustKts > limits.maxGust;
  if (isWindExceeded) {
    score -= 40;
    reasons.push(
      `Sustained wind (${windKts} kts) or gusts (${gustKts} kts) exceed safe manufacturer limit for ${limits.name} (${limits.maxWind} / ${limits.maxGust} kts).`
    );
    advisories.push('Ground all lightweight sUAS until gusts subside below 15 knots.');
  } else if (windKts > limits.maxWind * 0.75) {
    score -= 15;
    reasons.push(
      `Moderate Highveld winds (${windKts} kts) approaching maximum threshold for ${limits.name}.`
    );
    advisories.push('Fly only in low-altitude obstacle-sheltered zones; avoid high AGL hover.');
  }

  // Highveld Density Altitude check
  if (densityAltFt >= 7500) {
    score -= 15;
    reasons.push(
      `High density altitude (${densityAltFt.toLocaleString()} ft AMSL) reduces propeller thrust by ~${liftLossPercent}% and accelerates battery discharge by ~${batteryPenaltyPercent}%.`
    );
    advisories.push(
      'Derate flight times by 25%: trigger Return-To-Home (RTH) at 35% battery instead of default 20%.'
    );
  } else {
    advisories.push(
      `Highveld elevation factor: Plan on ~${batteryPenaltyPercent}% reduced hover time compared to sea-level flight specs.`
    );
  }

  // Extreme weather check
  if (isExtreme) {
    score -= 45;
    reasons.push(
      `Active extreme weather event (${extremeState?.eventType || 'Storm'}): convective microbursts and lightning hazard.`
    );
    advisories.push('CRITICAL: All unmanned aerial operations prohibited under SACAA storm rules.');
  }

  // Turbulence score
  const avgTurbScore = Math.round(
    dynamicHotspots.reduce((acc, curr) => acc + curr.riskScore, 0) / dynamicHotspots.length
  );
  if (avgTurbScore >= 70) {
    score -= 15;
    reasons.push('High localized mechanical turbulence and thermal boundary layer activity in Boksburg.');
  }

  score = Math.max(10, Math.min(100, score));

  // Overall status
  let overallStatus: 'GO_SAFE' | 'CAUTION_ADVISORY' | 'NO_GO_GROUNDED' = 'GO_SAFE';
  if (score < 50 || isWindExceeded || isExtreme) {
    overallStatus = 'NO_GO_GROUNDED';
  } else if (score < 80) {
    overallStatus = 'CAUTION_ADVISORY';
  }

  // Legal rule reminder
  advisories.push('SACAA Part 101 reminder: Maximum legal altitude is 400 ft (120m) AGL; maintain Visual Line of Sight (VLOS).');

  return {
    assessment: {
      droneCategory,
      overallStatus,
      score,
      windStatus: {
        speedKts: windKts,
        gustKts,
        limitKts: limits.maxWind,
        isExceeded: isWindExceeded,
      },
      densityAltitudeImpact: {
        elevationFt: 5250,
        densityAltFt,
        batteryPenaltyPercent,
        liftLossPercent,
      },
      turbulenceRiskScore: avgTurbScore,
      activeHazardsCount: dynamicHotspots.length,
      reasons,
      advisories,
    },
    hotspots: dynamicHotspots,
    noFlyZones: BOKSBURG_DRONE_NO_FLY_ZONES,
  };
}

// Point Airspace Check: Determine if a specific lat/lng in Boksburg is inside an NFZ or Turbulence Hotspot
export interface PointAirspaceCheckResult {
  latitude: number;
  longitude: number;
  isInsideStrictNFZ: boolean;
  isInsideAuthorizationZone: boolean;
  isInsideTurbulenceZone: boolean;
  clearanceStatus: 'CLEARED_GREEN' | 'AUTHORIZATION_AMBER' | 'PROHIBITED_RED';
  closestNfz: {
    zone: DroneNoFlyZone;
    distanceKm: number;
    isInside: boolean;
  };
  closestTurbulenceHotspot?: {
    hotspot: DroneTurbulenceHotspot;
    distanceKm: number;
    isInside: boolean;
  };
  maxLegalAglFt: number;
  sacaaSummary: string;
}

export function checkPointAirspaceInBoksburg(
  lat: number,
  lng: number,
  hotspots: DroneTurbulenceHotspot[] = BOKSBURG_TURBULENCE_HOTSPOTS_SEED,
  noFlyZones: DroneNoFlyZone[] = BOKSBURG_DRONE_NO_FLY_ZONES
): PointAirspaceCheckResult {
  let closestNfz = {
    zone: noFlyZones[0],
    distanceKm: calculateGeoDistanceKm(lat, lng, noFlyZones[0].centerLat, noFlyZones[0].centerLng),
    isInside: false,
  };
  closestNfz.isInside = closestNfz.distanceKm <= closestNfz.zone.radiusKm;

  let isInsideStrict = false;
  let isInsideAuth = false;

  for (const nfz of noFlyZones) {
    const dist = calculateGeoDistanceKm(lat, lng, nfz.centerLat, nfz.centerLng);
    const inside = dist <= nfz.radiusKm;
    if (inside) {
      if (nfz.restrictionLevel === 'STRICT_PROHIBITED') {
        isInsideStrict = true;
      } else if (nfz.restrictionLevel === 'AUTHORIZATION_REQUIRED') {
        isInsideAuth = true;
      }
    }
    if (dist < closestNfz.distanceKm) {
      closestNfz = {
        zone: nfz,
        distanceKm: dist,
        isInside: inside,
      };
    }
  }

  // Check turbulence hotspots
  let closestTurb = {
    hotspot: hotspots[0],
    distanceKm: calculateGeoDistanceKm(lat, lng, hotspots[0].centerLat, hotspots[0].centerLng),
    isInside: false,
  };
  closestTurb.isInside = closestTurb.distanceKm <= closestTurb.hotspot.radiusKm;

  let isInsideTurb = false;
  for (const hot of hotspots) {
    const dist = calculateGeoDistanceKm(lat, lng, hot.centerLat, hot.centerLng);
    const inside = dist <= hot.radiusKm;
    if (inside) isInsideTurb = true;
    if (dist < closestTurb.distanceKm) {
      closestTurb = {
        hotspot: hot,
        distanceKm: dist,
        isInside: inside,
      };
    }
  }

  let clearanceStatus: 'CLEARED_GREEN' | 'AUTHORIZATION_AMBER' | 'PROHIBITED_RED' = 'CLEARED_GREEN';
  let maxLegalAglFt = 400; // standard SACAA 400ft AGL
  let sacaaSummary = 'Outside restricted airport buffers. Standard Part 101 hobby/commercial rules apply (max 400 ft AGL, 50m from people/structures).';

  if (isInsideStrict) {
    clearanceStatus = 'PROHIBITED_RED';
    maxLegalAglFt = 0;
    sacaaSummary = `CRITICAL NO-FLY ZONE: Inside ${closestNfz.zone.name}. Drone flight strictly prohibited without SACAA ROC & ATNS special dispensation.`;
  } else if (isInsideAuth) {
    clearanceStatus = 'AUTHORIZATION_AMBER';
    maxLegalAglFt = closestNfz.zone.maxPermittedAglFt || 150;
    sacaaSummary = `RESTRICTED BUFFER: Inside ${closestNfz.zone.name}. Commercial flight authorization / ATC approval mandatory. Max altitude restricted to ${maxLegalAglFt} ft AGL.`;
  }

  return {
    latitude: lat,
    longitude: lng,
    isInsideStrictNFZ: isInsideStrict,
    isInsideAuthorizationZone: isInsideAuth,
    isInsideTurbulenceZone: isInsideTurb,
    clearanceStatus,
    closestNfz,
    closestTurbulenceHotspot: closestTurb,
    maxLegalAglFt,
    sacaaSummary,
  };
}
