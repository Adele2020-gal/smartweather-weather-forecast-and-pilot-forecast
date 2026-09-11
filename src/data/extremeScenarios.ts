export interface ExtremeWeatherScenario3D {
  id: string;
  title: string;
  subtitle: string;
  category: 'SUPERCELL' | 'TORNADO' | 'CUT_OFF_LOW' | 'SQUALL_LINE';
  locationName: string;
  lat: number;
  lon: number;
  cloudTopFl: number; // e.g. 480 (FL480 = 48,000 ft AMSL)
  baseAltFt: number;
  capeJoules: number; // Convective Available Potential Energy
  updraftVelocityMs: number; // Vertical motion in m/s
  maxReflectivityDbz: number; // Radar reflectivity (dBZ)
  maxHailDiameterCm: number; // Ground hail size
  downburstWindKts: number; // Surface gust front speed
  srhM2s2: number; // 0-3km Storm-Relative Helicity
  pressureDeficitHpa: number; // Core meso-low pressure drop
  aviationWarning: string;
  synopticDescription: string;
  faorImpact: string;
  colorTheme: string;
}

export const EXTREME_WEATHER_SCENARIOS_3D: ExtremeWeatherScenario3D[] = [
  {
    id: 'supercell_hail_bok',
    title: 'Boksburg / Highveld Classic Supercell',
    subtitle: 'Right-Moving Mesocyclone with Giant Hail Core & Microburst',
    category: 'SUPERCELL',
    locationName: 'Boksburg & FAOR Runway Approach (Gauteng)',
    lat: -26.18,
    lon: 28.28,
    cloudTopFl: 480, // FL480 (48,000 ft)
    baseAltFt: 4200,
    capeJoules: 3450,
    updraftVelocityMs: 38,
    maxReflectivityDbz: 72,
    maxHailDiameterCm: 6.5,
    downburstWindKts: 68,
    srhM2s2: 380,
    pressureDeficitHpa: -18,
    aviationWarning: 'SIGMET 03: Severe turbulence, severe hail to FL480. Microburst windshear on FAOR approach.',
    synopticDescription:
      'Explosive Highveld dryline boundary meeting a moist subtropical low-level jet over Gauteng. Deep-layer 0–6 km wind shear exceeding 48 kts sustains an intense, rotating updraft mesocyclone with a bounded weak echo region (BWER).',
    faorImpact:
      'FAOR Runway 03L/21R operations suspended. Low-level windshear alert active. Diverting inbound flights to Bloemfontein (FABL).',
    colorTheme: 'from-rose-600 via-pink-600 to-amber-600',
  },
  {
    id: 'tornado_mesocyclone',
    title: 'Ekurhuleni Tornadic Mesocyclone',
    subtitle: 'Violent Rotating Wall Cloud & EF3 Funnel Vortex Tube',
    category: 'TORNADO',
    locationName: 'Boksburg - Springs Corridor (Gauteng)',
    lat: -26.22,
    lon: 28.35,
    cloudTopFl: 460, // FL460
    baseAltFt: 3800,
    capeJoules: 3100,
    updraftVelocityMs: 44,
    maxReflectivityDbz: 68,
    maxHailDiameterCm: 5.0,
    downburstWindKts: 85,
    srhM2s2: 460,
    pressureDeficitHpa: -48,
    aviationWarning: 'TORNADO EMERGENCY: Active condensation funnel contacting terrain. Total low-level TMA airspace closure.',
    synopticDescription:
      'Extreme clockwise-curving low-level hodograph with 0–1 km shear over 25 kts. Dynamic suction vortex within a lowered, rotating wall cloud, producing tornadic vortex signatures (TVS) on Doppler velocity radar.',
    faorImpact:
      'Total aerodrome ground stop. Ramp crews ordered to hardened shelters. All departure and missed approach corridors blocked.',
    colorTheme: 'from-purple-700 via-violet-600 to-rose-600',
  },
  {
    id: 'cutoff_low_torrent',
    title: 'Cut-Off Low (COL) Synoptic Gyre',
    subtitle: 'Deep Tropospheric Vortex & 3D Atmospheric River Torrent',
    category: 'CUT_OFF_LOW',
    locationName: 'KwaZulu-Natal Coast & Drakensberg Escarpment',
    lat: -29.85,
    lon: 31.02,
    cloudTopFl: 400, // FL400
    baseAltFt: 1800,
    capeJoules: 1850,
    updraftVelocityMs: 18,
    maxReflectivityDbz: 58,
    maxHailDiameterCm: 1.5,
    downburstWindKts: 52,
    srhM2s2: 220,
    pressureDeficitHpa: -28,
    aviationWarning: 'AIRWAY CONGESTION: Zero-ceiling coastal stratus, severe mountain wave turbulence over Drakensberg.',
    synopticDescription:
      'Deep cold-core cyclonic vortex detached from mid-latitude westerlies, stalled off the east coast. Intense Agulhas marine conveyor belt pumping tropical moisture into the Drakensberg escarpment, producing catastrophic 250 mm deluge.',
    faorImpact:
      'FAOR-FALE domestic corridor closed. Coastal airports (FALE King Shaka) experiencing severe crosswinds and hydroplaning conditions.',
    colorTheme: 'from-cyan-700 via-blue-600 to-indigo-700',
  },
  {
    id: 'squall_line_derecho',
    title: 'Highveld Severe Squall Line (Derecho)',
    subtitle: '300-km Linear Bow Echo & Advancing Arcus Shelf Cloud',
    category: 'SQUALL_LINE',
    locationName: 'Free State - Gauteng Boundary',
    lat: -26.8,
    lon: 27.5,
    cloudTopFl: 440, // FL440
    baseAltFt: 4500,
    capeJoules: 2800,
    updraftVelocityMs: 28,
    maxReflectivityDbz: 65,
    maxHailDiameterCm: 4.0,
    downburstWindKts: 65,
    srhM2s2: 290,
    pressureDeficitHpa: -14,
    aviationWarning: 'RAPID GUST FRONT: 120 km/h straight-line winds advancing at 35 kts. Rapid runway wind reversal.',
    synopticDescription:
      'Mesoscale convective system (MCS) with strong rear-inflow jet (RIJ) plunging dry mid-level momentum to the surface. A 3D multi-layered Arcus shelf cloud leads the boundary with sudden 40-kt wind directional jumps and severe barometric spikes.',
    faorImpact:
      'Sudden runway direction change from 03L to 21R. Severe mechanical turbulence below 3,000 ft AGL across Johannesburg TMA.',
    colorTheme: 'from-amber-600 via-orange-600 to-red-600',
  },
];
