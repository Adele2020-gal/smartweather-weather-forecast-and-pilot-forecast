export interface LocationData {
  id?: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone: string;
  elevation?: number;
  countryCode?: string;
}

export interface CurrentWeather {
  time: string;
  temperature: number;
  apparentTemperature: number;
  relativeHumidity: number;
  precipitation: number;
  precipitationProbability: number;
  weatherCode: number;
  weatherDescription: string;
  isDay: boolean;
  windSpeed: number;
  windDirection: number;
  surfacePressure: number;
  uvIndex: number;
  cloudCover: number;
  visibility: number;
  windGust?: number;
  dewPoint?: number;
}

export interface HourlyForecastItem {
  time: string;
  hourLabel: string;
  temperature: number;
  apparentTemperature: number;
  precipitationProbability: number;
  precipitation: number;
  weatherCode: number;
  windSpeed: number;
  humidity: number;
  uvIndex: number;
  isDay: boolean;
  windGust?: number;
  cloudCover?: number;
}

export interface DailyForecastItem {
  date: string;
  dayLabel: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  rainProbMax: number;
  precipitationSum: number;
  windSpeedMax: number;
  uvIndexMax: number;
  sunrise: string;
  sunset: string;
}

export interface WeatherData {
  location: LocationData;
  current: CurrentWeather;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  elevation?: number;
  lastUpdated: string;
}

export type ExtremeSeverity = 'NONE' | 'ADVISORY' | 'WATCH' | 'WARNING' | 'EMERGENCY';
export type ExtremeEventType = 'NONE' | 'HEATWAVE' | 'FLASH_FLOOD' | 'SEVERE_THUNDERSTORM' | 'BLIZZARD' | 'HURRICANE_GALE' | 'TORNADO_SUPERCELL';

export interface ExtremeWeatherEvent {
  isExtreme: boolean;
  severity: ExtremeSeverity;
  eventType: ExtremeEventType;
  intensityScore: number; // 0 to 100
  title: string;
  headline: string;
  description: string;
  dangerFactors: string[];
  safetyInstructions: string[];
  recommendedGear: string[];
  evacuateOrShelter: 'SAFE_OUTDOORS' | 'CAUTION_OUTDOORS' | 'SHELTER_INDOORS' | 'IMMEDIATE_SHELTER';
  activeUntil: string;
}

export interface SavedLocation {
  id: string;
  name: string;
  label: string;
  tag: 'Home' | 'Work' | 'Travel' | 'Custom';
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isDefault?: boolean;
}

export interface AlertSubscriptions {
  hurricanes: boolean;
  tornadoes: boolean;
  blizzards: boolean;
  heatwaves: boolean;
  flashFloods: boolean;
  severeStorms: boolean;
  highWinds: boolean;
}

export interface UserPreferences {
  activity: 'commute' | 'outdoor' | 'running' | 'formal' | 'cycling';
  thermalSensitivity: 'runs_cold' | 'neutral' | 'runs_hot';
  style: 'casual' | 'smart_casual' | 'athletic' | 'minimalist';
  waterproofSensitivity: 'high' | 'normal' | 'low';
  tempUnit: 'C' | 'F';
  precipUnit: 'mm' | 'in';
  windUnit: 'kmh' | 'mph' | 'ms';
  pressureUnit: 'hPa' | 'inHg';
  timeFormat: '12h' | '24h';
  alertSubscriptions: AlertSubscriptions;
  minAlertSeverity: 'ALL' | 'MODERATE_UP' | 'SEVERE_ONLY';
  soundAlerts: boolean;
  browserNotifications: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  savedLocations: SavedLocation[];
  preferences: UserPreferences;
  preparedness?: UserPreparednessState;
}

export interface WeatherBadge {
  id: string;
  name: string;
  description: string;
  iconName: string;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  category: 'CHECK_IN' | 'PREPARATION' | 'CLIMATE_AWARENESS' | 'ECO_TRANSIT';
  xpReward: number;
  unlockedAt?: string;
  progress: number; // 0 to 100
  targetCount: number;
  currentCount: number;
  requirement: string;
}

export interface PreparednessChecklist {
  goBagReady: boolean;
  emergencyContactsListed: boolean;
  powerBankCharged: boolean;
  waterSuppliesStored: boolean;
  shelterRouteIdentified: boolean;
  pushAlertsActive: boolean;
}

export interface UserPreparednessState {
  currentStreak: number;
  longestStreak: number;
  lastCheckInDate: string; // YYYY-MM-DD
  readinessXP: number;
  level: number;
  levelTitle: string;
  badges: WeatherBadge[];
  checklist: PreparednessChecklist;
  totalForecastChecks: number;
  extremePrepsCompleted: number;
  historicalAnalyzedCount: number;
  sheltersExploredCount: number;
}

export interface ClimateTrendDataPoint {
  period: string; // e.g., '2020', '2021', '2022', etc.
  avgTemp: number; // °C
  tempAnomaly: number; // °C deviation from 30-year norm
  extremeHeatDays: number;
  stormEvents: number;
  precipTotal: number; // mm
  precipAnomaly: number; // % deviation
}

export interface LocalClimateImpact {
  locationName: string;
  baselinePeriod: string;
  warmingTrendRate: number; // °C per decade
  currentAnomaly: number; // °C relative to baseline
  extremeEventsTrend: 'INCREASING' | 'STABLE' | 'ELEVATED';
  floodRiskIndex: number; // 0-100
  heatVulnerabilityIndex: number; // 0-100
  resilienceScore: number; // 0-100
  annualTrends: ClimateTrendDataPoint[];
  recentMonthlyAnomalies: Array<{
    month: string;
    temperatureAnomaly: number;
    precipitationDiff: number;
    extremeDays: number;
  }>;
  aiClimateInsight: string;
}

export interface WeatherNotification {
  id: string;
  title: string;
  category: 'HURRICANE' | 'TORNADO' | 'BLIZZARD' | 'HEATWAVE' | 'FLASH_FLOOD' | 'SEVERE_STORM' | 'GENERAL';
  severity: 'CRITICAL' | 'WARNING' | 'ADVISORY' | 'INFO';
  message: string;
  actionableAdvice: string;
  timestamp: string;
  expiresAt: string;
  locationName: string;
  isRead: boolean;
}

export interface HistoricalDailyRecord {
  date: string;
  dayLabel: string;
  tempMax: number;
  tempMin: number;
  tempMean: number;
  precipitationSum: number;
  rainSum: number;
  snowfallSum: number;
  windSpeedMax: number;
  windGustsMax: number;
  weatherCode: number;
}

export interface HistoricalHourlyRecord {
  time: string;
  hourLabel: string;
  temperature: number;
  precipitation: number;
  windSpeed: number;
  relativeHumidity: number;
  weatherCode: number;
}

export interface HistoricalData {
  location: LocationData;
  startDate: string;
  endDate: string;
  records: HistoricalDailyRecord[];
  hourly: HistoricalHourlyRecord[];
  aggregates: {
    avgTemp: number;
    maxTemp: number;
    minTemp: number;
    totalPrecipitation: number;
    rainyDaysCount: number;
    maxWindSpeed: number;
    snowSum: number;
    daysCount: number;
  };
  comparisonWithPresent?: {
    tempDelta: number;
    precipDelta: number;
    windDelta: number;
    headline: string;
    details: string;
  };
}

export interface GooglePlace {
  id: string;
  displayName: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  rating?: number;
  userRatingCount?: number;
  primaryType?: string;
  openNow?: boolean;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  weatherRelevanceNote?: string;
}

export interface GoogleRouteStep {
  instruction: string;
  distance: string;
  duration: string;
  travelMode: string;
  weatherWarning?: string;
}

export interface GoogleRoute {
  origin: string;
  destination: string;
  distanceMeters: number;
  duration: string;
  distanceText: string;
  durationText: string;
  travelMode: 'DRIVE' | 'WALK' | 'BICYCLE' | 'TRANSIT';
  polyline?: string;
  steps: GoogleRouteStep[];
  weatherHazardScore: 'LOW' | 'MODERATE' | 'HIGH';
  weatherTransitAdvice: string;
}

export interface ClothingRecommendation {
  summary: string;
  comfortIndex: number; // 0 - 100
  layers: {
    base: string[];
    mid?: string[];
    outer?: string[];
    bottoms: string[];
    footwear: string[];
    accessories: string[];
  };
  timeline: Array<{
    period: string;
    temperature: number;
    outfitTweak: string;
    rainRiskNote: string;
  }>;
  fabricAdvice: string;
  extremeGearNotes?: string[];
  mustPack: string[];
}

export interface ModelComparison {
  modelName: string;
  predictedTempNextHour: number;
  predictedTemp6Hour: number;
  predictedTemp24Hour: number;
  rainProbability: number;
  mae: number;
  rmse: number;
  r2: number;
  weightInEnsemble: number;
  color: string;
}

export interface ShapFactor {
  feature: string;
  category: 'temperature' | 'precipitation' | 'wind';
  impact: number; // e.g. +1.4 or -0.8
  description: string;
}

export interface ConfidenceMetrics {
  score: number; // 0 - 100%
  tier: 'HIGH' | 'MODERATE' | 'LOW';
  modelAgreement: number; // %
  historicalVariance: string;
  dataCompleteness: number; // %
  forecastHorizonConfidence: number; // %
  explanation: string;
}

export interface MLForecastData {
  models: ModelComparison[];
  ensembleTemp: number;
  ensembleRainProb: number;
  confidence: ConfidenceMetrics;
  shapFactors: ShapFactor[];
  comparisonAgainstActual: Array<{
    time: string;
    actual: number;
    baseline: number;
    rf: number;
    xgboost: number;
    lstm: number;
    ensemble: number;
  }>;
}

export interface FlightRuleCategory {
  category: 'VFR' | 'MVFR' | 'IFR' | 'LIFR';
  label: string;
  color: string;
  badgeBg: string;
  borderClass: string;
  textClass: string;
  description: string;
}

export interface RunwayAnalysis {
  ident: string;
  headingDeg: number;
  lengthMeters: number;
  headwindKts: number;
  crosswindKts: number;
  crosswindDirection: 'LEFT' | 'RIGHT' | 'HEAD';
  isPreferred: boolean;
  caution: string | null;
}

export interface HourlyFlightWindow {
  time: string;
  hour: number;
  category: 'VFR' | 'MVFR' | 'IFR' | 'LIFR';
  safetyRating: 'SAFE' | 'CAUTION' | 'HAZARDOUS' | 'GROUNDED';
  safetyScore: number;
  windKts: number;
  gustKts: number;
  crosswindKts: number;
  cloudBaseFeet: number;
  visKm: number;
  densityAltFeet: number;
  recommendation: string;
}

export interface FlightCorridorAssessment {
  id: string;
  routeName: string;
  originIcao: string;
  destinationIcao: string;
  destinationCity: string;
  distanceNm: number;
  enRouteTurbulence: 'NONE' | 'LIGHT' | 'MODERATE' | 'SEVERE';
  destinationCategory: 'VFR' | 'MVFR' | 'IFR';
  status: 'SAFE' | 'CAUTION' | 'RESTRICTED';
  keyPilotHazard: string;
}

export interface PilotCaution {
  severity: 'CRITICAL' | 'WARNING' | 'ADVISORY' | 'INFO';
  title: string;
  details: string;
  actionRequired: string;
}

export interface FlightWeatherAnalysis {
  aerodromeName: string;
  aerodromeIcao: string;
  elevationMeters: number;
  elevationFeet: number;
  category: 'VFR' | 'MVFR' | 'IFR' | 'LIFR';
  safetyRating: 'SAFE' | 'CAUTION' | 'HAZARDOUS' | 'GROUNDED';
  safetyScore: number; // 0 - 100
  flightStatusHeadline: string;
  summary: string;
  optimalFlightWindow: string;
  pilotCautions: PilotCaution[];
  parameters: {
    windSpeedKts: number;
    windGustKts: number;
    windDirectionDeg: number;
    visibilityKm: number;
    visibilityStatuteMiles: number;
    cloudBaseFeet: number;
    cloudCoverageDesc: string;
    freezingLevelFeet: number;
    densityAltitudeFeet: number;
    densityAltAnomalyFeet: number;
    qnhHpa: number;
    qnhInHg: number;
    turbulenceLevel: 'NONE' | 'LIGHT' | 'MODERATE' | 'SEVERE';
    icingRisk: 'NONE' | 'LIGHT' | 'MODERATE' | 'SEVERE';
    convectiveStormRisk: 'NONE' | 'LOW' | 'ELEVATED' | 'HIGH';
    windShearRisk: boolean;
  };
  metarRaw: string;
  tafRaw: string;
  runways: RunwayAnalysis[];
  hourlyFlightWindows: HourlyFlightWindow[];
  corridors: FlightCorridorAssessment[];
  altitudeProfile?: AltitudeWeatherProfilePoint[];
}

export interface AltitudeWeatherProfilePoint {
  altitudeFt: number;
  flightLevel: string;
  altitudeLabel: string;
  windSpeedKts: number;
  windGustKts: number;
  windDirectionDeg: number;
  windShearKtsPer1000Ft: number;
  turbulencePotential: number; // 0 - 100%
  turbulenceCategory: 'SMOOTH' | 'LIGHT' | 'MODERATE' | 'SEVERE';
  edrValue: number; // Eddy Dissipation Rate (0.00 - 0.70)
  airTempC: number;
  freezingStatus: 'ABOVE_FREEZING' | 'FREEZING_LEVEL' | 'SUB_ZERO';
  layerDescription: string;
  hazardType: string;
  recommendedAction: string;
}

export type NotamCategory =
  | 'RUNWAY'
  | 'AIRSPACE'
  | 'NAV_AIDS'
  | 'HAZARD_WEATHER'
  | 'OBSTACLE'
  | 'LIGHTING'
  | 'SERVICES';

export type NotamSeverity = 'CRITICAL' | 'WARNING' | 'ADVISORY' | 'INFO';

export interface AirportNotam {
  id: string; // e.g. "A1842/26"
  airportIcao: string;
  airportName: string;
  qCode: string; // e.g. "QMRLC", "QICAS", "QOBCE"
  category: NotamCategory;
  severity: NotamSeverity;
  title: string;
  rawText: string;
  decodedSummary: string;
  operationalImpact: string;
  validFrom: string;
  validTo: string;
  affectedRunway?: string;
  lowerFl?: number;
  upperFl?: number;
  coordinates?: { lat: number; lng: number };
  agentAnalysis: {
    pilotRecommendation: string;
    riskRating: number; // 1 to 10
    weatherCorrelation?: string;
  };
}

export interface SouthAfricanAirport {
  icao: string;
  iata: string;
  name: string;
  city: string;
  province: string;
  latitude: number;
  longitude: number;
  elevationFeet: number;
  runways: string[];
  activeNotams: AirportNotam[];
  activeNotamCount: number;
  highestSeverity: NotamSeverity;
}

export interface NotamAgentBriefing {
  overview: string;
  criticalAlertCount: number;
  warningAlertCount: number;
  advisoryAlertCount: number;
  highveldAssessment: string;
  coastalAssessment: string;
  keyActionItems: string[];
  lastUpdated: string;
}

export interface NotamAgentResponse {
  airports: SouthAfricanAirport[];
  notams: AirportNotam[];
  briefing: NotamAgentBriefing;
  source: string;
  attribution: string;
}

export interface AirTrafficZone {
  id: string;
  name: string;
  shortLabel: string;
  center: { lat: number; lng: number };
  radiusKm: number;
  capacityPerHour: number;
  activeCount: number;
  densityLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  dominantWeatherConstraint: string;
  constraintSeverity: 'NOMINAL' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
  correlationStatus: string;
  recommendedSpacingNm: number;
  delayMinutes: number;
  airspaceRestriction: 'OPEN' | 'SPACING_EXPANDED' | 'HOLDING_MANDATORY' | 'GROUND_STOP';
  flightPhasesPresent: string[];
}

export interface SimulatedAircraft {
  id: string;
  callsign: string;
  airline: string;
  aircraftType: string;
  origin: string;
  destination: string;
  flightPhase: 'FINAL_APPROACH' | 'INITIAL_APPROACH' | 'DEPARTURE_CLIMB' | 'EN_ROUTE' | 'HOLDING' | 'VFR_LOW_LEVEL';
  lat: number;
  lng: number;
  altitudeFt: number;
  groundspeedKts: number;
  verticalSpeedFpm: number;
  headingDeg: number;
  targetWaypoint: string;
  zoneId: string;
  weatherImpact: {
    hasConflict: boolean;
    hazardTitle: string;
    severity: 'NONE' | 'MODERATE' | 'SEVERE';
    atcAdvisory: string;
  };
  trail: Array<{ lat: number; lng: number }>;
}

export interface AirTrafficWeatherCorrelation {
  totalAircraft: number;
  boksburgSectorDensity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  faorMovementRate: number;
  weatherConstraintIndex: number; // 0-100
  averageDelayMinutes: number;
  holdingStackActive: boolean;
  holdingCount: number;
  crosswindSeparationApplied: boolean;
  activeWeatherHazards: Array<{
    zoneName: string;
    hazard: string;
    severity: 'MODERATE' | 'SEVERE' | 'CRITICAL';
    impact: string;
  }>;
  atcSystemAdvisories: string[];
}

export interface FlightRouteWaypoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distanceFromOriginNm: number;
  distanceToDestinationNm: number;
  elevationFt: number;
  assignedAltitudeFt: number;
  flightLevel: string;
  estimatedTimeMinutes: number;
  convectiveRisk: 'MINIMAL' | 'MODERATE' | 'HIGH' | 'EXTREME';
  radarReflectivityDbz: number;
  capeJkg: number;
  cloudTopFt: number;
  freezingLevelFt: number;
  hazardType?: string;
  hazardDescription?: string;
  windSpeedKts: number;
  windDirectionDeg: number;
  outsideAirTempC: number;
  recommendedDeviationNm?: number;
  isAvoidanceWaypoint?: boolean;
}

export interface ConvectiveStormHazardCell {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  radiusNm: number;
  maxReflectivityDbz: number;
  cloudTopsFt: number;
  severity: 'MODERATE' | 'SEVERE' | 'EXTREME';
  hazardType: 'SUPERCELL_HAIL' | 'SQUALL_LINE' | 'OROGRAPHIC_CB' | 'MICROBURST' | 'SEVERE_TURBULENCE';
  description: string;
  distanceFromRouteNm: number;
  interceptWaypointName?: string;
}

export interface FlightPlanAnalysis {
  originIcao: string;
  destinationIcao: string;
  originName: string;
  destinationName: string;
  originElevationFt: number;
  destinationElevationFt: number;
  aircraftType: string;
  cruiseAltitudeFt: number;
  cruiseSpeedKts: number;
  totalDistanceNm: number;
  estimatedFlightTimeMinutes: number;
  initialTrueTrackDeg: number;
  convectiveRiskRating: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
  convectiveRiskScore: number; // 0-100
  maxReflectivityDbz: number;
  hazardousWaypointsCount: number;
  activeStormCellsAlongRoute: ConvectiveStormHazardCell[];
  waypoints: FlightRouteWaypoint[];
  avoidanceRouteAvailable: boolean;
  avoidanceRouteDistanceNm?: number;
  avoidanceRouteAdditionalMinutes?: number;
  avoidanceWaypoints?: FlightRouteWaypoint[];
  recommendedAlternates: Array<{
    icao: string;
    name: string;
    distanceFromRouteNm: number;
    weatherStatus: 'CLEAR' | 'CAUTION' | 'MARGINAL';
    runwayLengthMeters: number;
  }>;
  pilotBriefingAdvisory: string;
  terrainProfile: Array<{
    distanceNm: number;
    groundElevationFt: number;
    minimumSafeAltFt: number;
    flightProfileAltFt: number;
    convectiveCloudTopFt?: number;
  }>;
}

// DRONE & sUAS SAFETY TYPES (BOKSBURG & HIGHVELD REGION)
export type DroneZoneCategory =
  | 'AIRPORT_CTR'
  | 'AIRPORT_ATZ'
  | 'PRISON_FACILITY'
  | 'CRITICAL_INFRASTRUCTURE'
  | 'HELIPORT'
  | 'RECREATIONAL_CAUTION'
  | 'ELECTROMAGNETIC_HAZARD';

export type DroneRestrictionLevel =
  | 'STRICT_PROHIBITED'
  | 'AUTHORIZATION_REQUIRED'
  | 'CAUTION_ALLOWED';

export interface DroneNoFlyZone {
  id: string;
  name: string;
  category: DroneZoneCategory;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  sacaaRule: string;
  restrictionLevel: DroneRestrictionLevel;
  description: string;
  maxPermittedAglFt: number;
  authorityContact?: string;
}

export type DroneTurbulenceType =
  | 'MINE_DUMP_ROTOR'
  | 'THERMAL_UPDRAFT'
  | 'GUST_FRONT_SHEAR'
  | 'URBAN_CANYON_WIND'
  | 'LAKE_BREEZE_SHEAR'
  | 'POWERLINE_EMI';

export interface DroneTurbulenceHotspot {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  hazardType: DroneTurbulenceType;
  turbulenceIntensity: 'MODERATE' | 'SEVERE' | 'EXTREME';
  edrValue: number;
  updraftVelocityMs: number;
  riskScore: number; // 0 - 100
  impactOnsUAS: string;
  pilotAdvice: string;
}

export type DroneWeightCategory = 'micro_250g' | 'standard_2kg' | 'commercial_25kg' | 'fpv';

export interface DroneFlightSafetyAssessment {
  droneCategory: DroneWeightCategory;
  overallStatus: 'GO_SAFE' | 'CAUTION_ADVISORY' | 'NO_GO_GROUNDED';
  score: number; // 0 - 100
  windStatus: {
    speedKts: number;
    gustKts: number;
    limitKts: number;
    isExceeded: boolean;
  };
  densityAltitudeImpact: {
    elevationFt: number;
    densityAltFt: number;
    batteryPenaltyPercent: number;
    liftLossPercent: number;
  };
  turbulenceRiskScore: number;
  activeHazardsCount: number;
  reasons: string[];
  advisories: string[];
}

// PILOT SAFETY LOG / PIREP (PILOT REPORT) TYPES
export type PirepTurbulenceIntensity = 'SMOOTH' | 'LIGHT' | 'MODERATE' | 'SEVERE' | 'EXTREME';
export type PirepTurbulenceType = 'CAT' | 'CHOP' | 'THERMAL' | 'MECHANICAL' | 'MOUNTAIN_WAVE' | 'NONE';
export type PirepVisibilityCategory = 'CAVOK' | 'HAZY_5_10KM' | 'MARGINAL_3_5KM' | 'LOW_VIS_UNDER_3KM' | 'ZERO_IMC';

export interface PilotSafetyReport {
  id: string;
  callsign: string;
  aircraftType: string;
  location: string;
  altitudeFt: number;
  flightLevel: string;
  timestamp: string; // ISO string
  turbulenceIntensity: PirepTurbulenceIntensity;
  turbulenceType: PirepTurbulenceType;
  visibilityCategory: PirepVisibilityCategory;
  visibilityKm: number;
  cloudCondition: 'CLEAR' | 'FEW' | 'SCATTERED' | 'BROKEN_IMC' | 'OVERCAST_IMC' | 'IN_CLOUD';
  icingIntensity?: 'NONE' | 'TRACE' | 'LIGHT' | 'MODERATE' | 'SEVERE';
  outsideAirTempC?: number;
  remarks: string;
  icaoRawCode: string;
  verifiedLocal: boolean;
}

