import { CurrentWeather, ExtremeWeatherEvent, ExtremeSeverity, ExtremeEventType } from '../types';

export function evaluateExtremeWeather(
  current: CurrentWeather,
  simulatedEvent?: ExtremeEventType | null
): ExtremeWeatherEvent {
  // If simulated event is forced
  if (simulatedEvent && simulatedEvent !== 'NONE') {
    return getSimulatedExtremeEvent(simulatedEvent, current.temperature);
  }

  const { temperature, apparentTemperature, windSpeed, precipitation, weatherCode, uvIndex } = current;

  // 1. Extreme Heatwave
  if (apparentTemperature >= 40 || temperature >= 38) {
    const isExtreme = apparentTemperature >= 44 || temperature >= 42;
    return {
      isExtreme: true,
      severity: isExtreme ? 'EMERGENCY' : 'WARNING',
      eventType: 'HEATWAVE',
      intensityScore: Math.min(100, Math.round(75 + (apparentTemperature - 40) * 5)),
      title: isExtreme ? 'CRITICAL HEAT DOME EMERGENCY' : 'EXCESSIVE HEAT WARNING',
      headline: `Dangerous heat index reaching ${Math.round(apparentTemperature)}°C. High risk of heatstroke & power grid stress.`,
      description: 'Hyper-local atmospheric sensors indicate prolonged solar radiation and trapped high-pressure heat dome. Outdoor physical exertion poses life-threatening heat illness risks.',
      dangerFactors: [
        'Rapid dehydration and hyperthermia within 20 minutes',
        'Asphalt and vehicle interior temperatures exceeding 60°C',
        'High ozone formation and respiratory distress',
        'Substation and AC grid load peaks',
      ],
      safetyInstructions: [
        'Stay in air-conditioned shelters between 11:00 AM and 6:00 PM',
        'Hydrate continuously with electrolyte solutions; avoid alcohol and caffeine',
        'Check on elderly neighbors, children, and pets immediately',
        'Never leave vulnerable persons or animals inside closed vehicles',
      ],
      recommendedGear: [
        'UPF 50+ UV-blocking long sleeves (loose linen/silk)',
        'Wide-brimmed sun hat & polarized UV400 sunglasses',
        'Insulated hydration flask with electrolyte replenisher',
        'Broad-spectrum SPF 50+ mineral sunscreen',
      ],
      evacuateOrShelter: 'SHELTER_INDOORS',
      activeUntil: 'Until 20:00 Local Time',
    };
  }

  // 2. Blizzard / Extreme Polar Vortex
  if (apparentTemperature <= -18 || (weatherCode === 75 && windSpeed > 35) || weatherCode === 67) {
    const isExtreme = apparentTemperature <= -25 || (weatherCode === 75 && windSpeed > 55);
    return {
      isExtreme: true,
      severity: isExtreme ? 'EMERGENCY' : 'WARNING',
      eventType: 'BLIZZARD',
      intensityScore: Math.min(100, Math.round(70 + Math.abs(apparentTemperature) * 1.5)),
      title: isExtreme ? 'LIFE-THREATENING BLIZZARD & POLAR VORTEX' : 'WINTER STORM & FREEZING RAIN WARNING',
      headline: `Severe sub-zero windchill (${Math.round(apparentTemperature)}°C) with zero-visibility whiteout conditions.`,
      description: 'Arctic blast interacting with moist frontal boundary creating rapid black ice accumulation, windblown drifts, and hypothermia danger.',
      dangerFactors: [
        'Frostbite possible on exposed skin in less than 10 minutes',
        'Black ice and severe road impassability',
        'Downed power lines under heavy ice loading',
        'Hypothermia hazard if stranded in vehicles',
      ],
      safetyInstructions: [
        'Avoid all non-essential road travel until plow operations clear arteries',
        'Keep emergency winter vehicle kit (blankets, flares, high-calorie food)',
        'Insulate home pipes to prevent bursting',
        'Ensure carbon monoxide detectors are operational if running backup heaters',
      ],
      recommendedGear: [
        'Thermal base layer (Merino wool 250gsm+)',
        'Heavy-duty insulated Gore-Tex down parka (-30°C rated)',
        'Wind-resistant balaclava and ski goggles for eye protection',
        'Waterproof Vibram Arctic Grip winter boots with ice cleats',
      ],
      evacuateOrShelter: 'IMMEDIATE_SHELTER',
      activeUntil: 'Until 18:00 Local Time Tomorrow',
    };
  }

  // 3. Hurricane / Severe Gale Winds
  if (windSpeed >= 65 || (windSpeed >= 50 && [95, 96, 99].includes(weatherCode))) {
    const isExtreme = windSpeed >= 85;
    return {
      isExtreme: true,
      severity: isExtreme ? 'EMERGENCY' : 'WARNING',
      eventType: 'HURRICANE_GALE',
      intensityScore: Math.min(100, Math.round(65 + windSpeed * 0.4)),
      title: isExtreme ? 'DESTRUCTIVE GALE FORCE / HURRICANE-FORCE WINDS' : 'HIGH WIND & STORM SURGE WATCH',
      headline: `Wind gusts clocked at ${Math.round(windSpeed)} km/h. Structural damage and flying debris imminent.`,
      description: 'Intense cyclonic depression causing gale-to-storm-force pressure gradient with high-velocity projectile hazards and uprooted trees.',
      dangerFactors: [
        'Flying sheet metal, roof tiles, and fractured branch projectiles',
        'Localized power blackouts and communication tower outages',
        'High-profile vehicles at risk of roll-over on exposed bridges',
        'Fallen live power cables on wet roadways',
      ],
      safetyInstructions: [
        'Move away from exterior glass windows and glass doors',
        'Take shelter in an interior room on the lowest floor',
        'Bring all patio furniture, trash cans, and bicycles inside',
        'Charge all communication devices and emergency flashlights',
      ],
      recommendedGear: [
        'Heavy-duty windproof storm shell with sealed seams',
        'Reinforced steel-toe work boots for debris clearance',
        'Impact-resistant protective eyewear/helmet if outdoors is unavoidable',
        'Emergency hand-crank NOAA weather radio & waterproof headlamp',
      ],
      evacuateOrShelter: 'IMMEDIATE_SHELTER',
      activeUntil: 'Next 8 Hours',
    };
  }

  // 4. Flash Flood / Torrential Deluge
  if (precipitation >= 12 || weatherCode === 82 || (precipitation >= 8 && weatherCode === 65)) {
    return {
      isExtreme: true,
      severity: 'WARNING',
      eventType: 'FLASH_FLOOD',
      intensityScore: 82,
      title: 'URGENT FLASH FLOOD EMERGENCY',
      headline: `Precipitation rate ${precipitation.toFixed(1)} mm/h overwhelming local stormwater infrastructure.`,
      description: 'Atmospheric river event dropping excessive rainfall in a narrow convergence zone, triggering rapid inundation of low-lying roadways and riverbanks.',
      dangerFactors: [
        '6 inches of fast-moving water can knock over an adult',
        '12 inches of water can float small cars; 24 inches can carry SUVs away',
        'Concealed sinkholes and open manholes beneath turbid floodwaters',
        'Contaminated runoff carrying biological and chemical debris',
      ],
      safetyInstructions: [
        'Turn Around, Don’t Drown! Never drive or walk through flooded roadways',
        'Seek higher ground immediately if located in canyon or ravine zones',
        'Disconnect electrical appliances if water reaches basement level',
        'Monitor local drainage basins and river level alerts continuously',
      ],
      recommendedGear: [
        'Heavy-gauge 100% waterproof seam-taped rain trench or poncho',
        'High-leg Neoprene rubber muck boots or waders with traction',
        'IPX8 waterproof floating dry bags for phones and critical documents',
        'High-visibility reflective storm vest for low-light road safety',
      ],
      evacuateOrShelter: 'SHELTER_INDOORS',
      activeUntil: 'Next 6 Hours',
    };
  }

  // 5. Severe Thunderstorm & Supercell Hail
  if ([95, 96, 99].includes(weatherCode)) {
    const hasHail = [96, 99].includes(weatherCode);
    return {
      isExtreme: true,
      severity: hasHail ? 'EMERGENCY' : 'WATCH',
      eventType: hasHail ? 'TORNADO_SUPERCELL' : 'SEVERE_THUNDERSTORM',
      intensityScore: hasHail ? 92 : 74,
      title: hasHail ? 'SEVERE SUPERCELL WITH DAMAGING HAIL' : 'SEVERE THUNDERSTORM WARNING',
      headline: `Rapid updrafts producing continuous cloud-to-ground lightning${hasHail ? ' and damaging golf-ball hail' : ''}.`,
      description: 'Severe convective instability with deep tropospheric wind shear capable of spawning microburst winds and destructive hail.',
      dangerFactors: [
        'Deadly cloud-to-ground lightning strikes within 10km radius',
        'Hail strikes capable of cracking windshields and puncturing skylights',
        'Sudden microburst downdrafts up to 100 km/h',
        'Flash power surges damaging ungrounded electronics',
      ],
      safetyInstructions: [
        'Move indoors immediately — when thunder roars, go indoors!',
        'Stay clear of plumbing fixtures, landline phones, and electrical sockets',
        'Park vehicles under covered garages or solid structures to avoid hail damage',
        'Unplug sensitive electronics and desktop computers',
      ],
      recommendedGear: [
        'Rubber-soled non-conductive footwear',
        'Stormproof windproof umbrella with fiberglass frame (do not use in open fields)',
        'Compact surge protector for essential medical equipment',
        'Waterproof hooded shell jacket',
      ],
      evacuateOrShelter: 'SHELTER_INDOORS',
      activeUntil: 'Next 3 Hours',
    };
  }

  // Default: Normal weather, no extreme alert
  return {
    isExtreme: false,
    severity: 'NONE',
    eventType: 'NONE',
    intensityScore: 12,
    title: 'Normal Weather Pattern',
    headline: 'No hazardous weather advisories currently active for this coordinate zone.',
    description: 'Atmospheric stability within standard parameters. Routine seasonal precautions apply.',
    dangerFactors: [],
    safetyInstructions: ['Monitor hyper-local forecast updates every 6 hours'],
    recommendedGear: ['Standard everyday seasonal attire'],
    evacuateOrShelter: 'SAFE_OUTDOORS',
    activeUntil: 'Ongoing',
  };
}

export function getSimulatedExtremeEvent(
  eventType: ExtremeEventType,
  baseTemp: number = 22
): ExtremeWeatherEvent {
  switch (eventType) {
    case 'HURRICANE_GALE':
      return {
        isExtreme: true,
        severity: 'EMERGENCY',
        eventType: 'HURRICANE_GALE',
        intensityScore: 96,
        title: 'CATEGORY 3 TROPICAL CYCLONE / HURRICANE-FORCE GALE',
        headline: 'Sustained winds 140 km/h with gusts exceeding 175 km/h. Catastrophic tree and roof damage expected.',
        description: 'Simulated landfall of a powerful storm system with torrential sea spray, rapid barometric drop to 948 hPa, and widespread power failure.',
        dangerFactors: [
          'High-velocity airborne projectiles from damaged infrastructure',
          'Widespread structural compromise to unreinforced buildings',
          'Severe coastal and river surge inundation',
          'Total loss of municipal grid and cellular services for 24-72 hours',
        ],
        safetyInstructions: [
          'Bunker down in the most interior, windowless room on the lowest floor',
          'Fill bathtubs with potable water for emergency sanitation needs',
          'Keep protective helmets or mattresses nearby to protect head from debris',
          'Do not venture outside during the eye of the storm; winds reverse violently',
        ],
        recommendedGear: [
          'Industrial ANSI-rated hard hat & shatterproof goggles',
          'Submersible survival gear pack with 72-hour emergency rations',
          'Heavy-duty puncture-proof steel shank combat boots',
          'Satellite communicator / emergency beacon',
        ],
        evacuateOrShelter: 'IMMEDIATE_SHELTER',
        activeUntil: 'Simulation Active',
      };
    case 'HEATWAVE':
      return {
        isExtreme: true,
        severity: 'EMERGENCY',
        eventType: 'HEATWAVE',
        intensityScore: 94,
        title: 'RECORD-BREAKING 44°C HEAT DOME EMERGENCY',
        headline: 'Extreme heat index exceeding 48°C. Wet-bulb temperatures approaching physiological survival thresholds.',
        description: 'Atmospheric ridge locking intense solar radiation over the metropolitan region with near-zero overnight radiative cooling (night lows > 30°C).',
        dangerFactors: [
          'Heatstroke and multi-organ failure within 30 minutes of direct sun exposure',
          'Widespread buckling of railway lines and asphalt melting',
          'High risk of localized wildland and brush fires',
          'Critical rolling brownouts due to unprecedented AC cooling demands',
        ],
        safetyInstructions: [
          'Douse body with cold water or damp towels if air conditioning fails',
          'Keep windows and blackout curtains closed during peak sunlight hours',
          'Drink 500ml of cool water every 45 minutes even without thirst sensation',
          'Zero strenuous outdoor activity permitted',
        ],
        recommendedGear: [
          'Phase-change active cooling neck vest & ice bandanas',
          'Ultra-breathable loose white linen clothing',
          'Polarized UV400 wrap-around safety sunglasses',
          'Personal portable evaporative mister with cold water reservoir',
        ],
        evacuateOrShelter: 'SHELTER_INDOORS',
        activeUntil: 'Simulation Active',
      };
    case 'BLIZZARD':
      return {
        isExtreme: true,
        severity: 'EMERGENCY',
        eventType: 'BLIZZARD',
        intensityScore: 95,
        title: 'HISTORIC POLAR VORTEX & -26°C WHITE-OUT BLIZZARD',
        headline: 'Heavy snowfall rates (8 cm/h) combined with 75 km/h arctic gales. Zero horizontal visibility.',
        description: 'Tropospheric polar vortex descent bringing life-threatening arctic air mass with extreme wind chill reaching -38°C.',
        dangerFactors: [
          'Severe frostbite in less than 5 minutes on exposed skin',
          'Complete spatial disorientation within 15 meters of leaving shelter',
          'Roof collapse hazard from excessive wet snow mass accumulation',
          'Freezing of domestic water mains and rapid indoor temperature drops',
        ],
        safetyInstructions: [
          'Seal interior doorways with blankets to conserve heat in a central room',
          'Never use gas ovens or charcoal grills indoors for heating (CO poisoning)',
          'Run faucets at a gentle trickle to prevent frozen burst pipes',
          'Stay strictly indoors until search and rescue teams declare roads open',
        ],
        recommendedGear: [
          '800-fill goose down expedition mountaineering parka with storm hood',
          'Triple-layer thermal underwear with wind-stopper polar fleece',
          'Heated battery-powered gloves & shearling lined snow boots',
          'Emergency foil space blankets & emergency bivvy sack',
        ],
        evacuateOrShelter: 'IMMEDIATE_SHELTER',
        activeUntil: 'Simulation Active',
      };
    case 'FLASH_FLOOD':
      return {
        isExtreme: true,
        severity: 'WARNING',
        eventType: 'FLASH_FLOOD',
        intensityScore: 88,
        title: 'CATASTROPHIC FLASH FLOOD EMERGENCY',
        headline: 'Torrential cloudburst dropping 45 mm of rain in 40 minutes. Streets converted into raging torrents.',
        description: 'Saturated soil unable to absorb extreme moisture influx, resulting in instant mudslides and rapid surge into underpasses and basements.',
        dangerFactors: [
          'Underpasses and subterranean parking structures flooding in seconds',
          'Hidden high-voltage electrical currents from submerged transformers',
          'Structural foundation erosion and retaining wall collapses',
          'Loss of municipal drinking water purity due to sewage overflow',
        ],
        safetyInstructions: [
          'Never enter basements or underground tunnels during active flash flood alerts',
          'If vehicle stalls in rising water, abandon it immediately and seek high ground',
          'Boil tap water for at least 3 minutes before consumption',
          'Stay away from all riverbanks, concrete channels, and storm drains',
        ],
        recommendedGear: [
          'High-visibility waterproof breathable offshore foul weather gear',
          'Automatic inflatable life vest (PFD) for water rescue zones',
          'Waterproof headlamp with emergency strobe function',
          'Whistle for emergency location signaling',
        ],
        evacuateOrShelter: 'SHELTER_INDOORS',
        activeUntil: 'Simulation Active',
      };
    case 'TORNADO_SUPERCELL':
      return {
        isExtreme: true,
        severity: 'EMERGENCY',
        eventType: 'TORNADO_SUPERCELL',
        intensityScore: 98,
        title: 'TORNADO EMERGENCY / DESTRUCTIVE SUPERCELL',
        headline: 'Confirmed rotating mesocyclone with baseball-sized hail (7cm diameter) moving at 60 km/h.',
        description: 'Extreme thermodynamic instability producing multiple vortex signatures and violent downdrafts capable of leveling structures.',
        dangerFactors: [
          'Direct impact from EF-3+ tornado rotational winds exceeding 220 km/h',
          'Baseball hail capable of shattering roofs, glass, and causing fatal trauma',
          'Debris cloud containing pulverized glass, wood, and concrete shards',
          'Explosive pressure drops causing structural wall failures',
        ],
        safetyInstructions: [
          'TAKE IMMEDIATE SHELTER in an underground storm cellar or reinforced safe room',
          'If no basement, take cover in an interior bathroom tub covered with mattresses',
          'Cover your head and neck with arms, thick blankets, or safety helmets',
          'Do NOT try to outrun a tornado in a vehicle',
        ],
        recommendedGear: [
          'Impact-resistant sports/construction helmet',
          'Sturdy closed-toe hiking shoes with leather uppers',
          'First aid trauma kit with tourniquets and sterile pressure bandages',
          'Heavy utility leather work gloves',
        ],
        evacuateOrShelter: 'IMMEDIATE_SHELTER',
        activeUntil: 'Simulation Active',
      };
    default:
      return evaluateExtremeWeather({
        time: new Date().toISOString(),
        temperature: baseTemp,
        apparentTemperature: baseTemp,
        relativeHumidity: 60,
        precipitation: 0,
        precipitationProbability: 10,
        weatherCode: 1,
        weatherDescription: 'Clear',
        isDay: true,
        windSpeed: 12,
        windDirection: 180,
        surfacePressure: 1013,
        uvIndex: 4,
        cloudCover: 20,
        visibility: 10000,
      });
  }
}
