import React, { useEffect, useRef, useState } from 'react';
import {
  RotateCcw,
  Layers,
  Wind,
  CloudRain,
  Eye,
  Compass,
  MapPin,
  Sparkles,
  Info,
  Plane,
  AlertTriangle,
  ShieldAlert,
  Flame,
  Zap,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Sliders,
  CheckCircle2,
  Crosshair,
  Gauge,
  Radio,
  Waves,
} from 'lucide-react';
import { LocationData, WeatherData, ExtremeWeatherEvent } from '../types';
import { EXTREME_WEATHER_SCENARIOS_3D, ExtremeWeatherScenario3D } from '../data/extremeScenarios';

interface ThreeDWeatherSphereProps {
  currentLocation: LocationData;
  onSelectLocation: (loc: { name: string; lat: number; lon: number; admin1: string }) => void;
  isRaining: boolean;
  weather?: WeatherData | null;
  extremeState?: ExtremeWeatherEvent | null;
}

interface SACity {
  name: string;
  admin1: string;
  lat: number;
  lon: number;
  temp: number;
  condition: string;
  rainProb: number;
  isHome?: boolean;
}

interface ConvectiveCell {
  id: string;
  name: string;
  sector: string;
  lat: number;
  lon: number;
  baseAltitudeFt: number;
  topAltitudeFt: number; // e.g. 46,000 ft (FL460)
  flightLevel: string; // 'FL460'
  capeJoules: number; // Convective Available Potential Energy (e.g. 2,300 J/kg)
  updraftVelocityMs: number; // e.g. +24 m/s
  hailRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  threatLevel: 'ADVISORY' | 'MODERATE' | 'SEVERE' | 'EXTREME';
  anvilSpreadRadiusKm: number;
  interceptedCorridors: string[];
  pilotAction: string;
}

interface FlightCorridor3D {
  id: string;
  code: string;
  fromName: string;
  fromIcao: string;
  fromLat: number;
  fromLon: number;
  toName: string;
  toIcao: string;
  toLat: number;
  toLon: number;
  cruiseFl: number; // e.g. 350 for FL350
  routeCode: string;
  threatLevel: 'CLEAR' | 'CAUTION' | 'HAZARDOUS';
  hazardDetails?: string;
  rerouteBearing?: string;
}

const SA_CITIES: SACity[] = [
  { name: 'Boksburg', admin1: 'Gauteng', lat: -26.2127, lon: 28.2575, temp: 24, condition: 'Convective Cell Forming', rainProb: 65, isHome: true },
  { name: 'Johannesburg', admin1: 'Gauteng', lat: -26.2041, lon: 28.0473, temp: 24, condition: 'Highveld CB Build-up', rainProb: 60 },
  { name: 'Pretoria', admin1: 'Gauteng', lat: -25.7479, lon: 28.2293, temp: 25, condition: 'Scattered Cu Congestus', rainProb: 40 },
  { name: 'Cape Town', admin1: 'Western Cape', lat: -33.9249, lon: 18.4241, temp: 21, condition: 'Coastal Inflow', rainProb: 15 },
  { name: 'Durban', admin1: 'KwaZulu-Natal', lat: -29.8587, lon: 31.0218, temp: 26, condition: 'Maritime Showers', rainProb: 70 },
  { name: 'Gqeberha', admin1: 'Eastern Cape', lat: -33.9608, lon: 25.6022, temp: 20, condition: 'Coastal Wind & Stratus', rainProb: 25 },
  { name: 'Bloemfontein', admin1: 'Free State', lat: -29.0852, lon: 26.1596, temp: 23, condition: 'Dry Line Convection', rainProb: 35 },
  { name: 'Mbombela', admin1: 'Mpumalanga', lat: -25.4753, lon: 30.9694, temp: 27, condition: 'Subtropical CB Tower', rainProb: 65 },
  { name: 'Polokwane', admin1: 'Limpopo', lat: -23.9045, lon: 29.4688, temp: 28, condition: 'Thermal Plumes', rainProb: 20 },
  { name: 'Kimberley', admin1: 'Northern Cape', lat: -28.7282, lon: 24.7499, temp: 26, condition: 'Clear Sky / High DA', rainProb: 5 },
];

// Active Convective Storm Build-ups across South Africa
const CONVECTIVE_BUILD_UPS: ConvectiveCell[] = [
  {
    id: 'cb_highveld_bok',
    name: 'Ekurhuleni / Boksburg Severe Supercell',
    sector: 'Gauteng Highveld Airspace (FAOR TMA)',
    lat: -26.18,
    lon: 28.28,
    baseAltitudeFt: 4200,
    topAltitudeFt: 46000,
    flightLevel: 'FL460',
    capeJoules: 2350,
    updraftVelocityMs: 26,
    hailRisk: 'EXTREME',
    threatLevel: 'EXTREME',
    anvilSpreadRadiusKm: 55,
    interceptedCorridors: ['FAOR-FALE (Durban)', 'FAOR-FACT (Cape Town Outbound)'],
    pilotAction: 'Enforce 20 NM minimum lateral separation upwind. Convective tops exceed all domestic cruise altitudes.',
  },
  {
    id: 'cb_drakensberg',
    name: 'Drakensberg Escarpment Orographic Line',
    sector: 'KZN / Lesotho Border Ridge',
    lat: -29.20,
    lon: 29.60,
    baseAltitudeFt: 6500,
    topAltitudeFt: 42000,
    flightLevel: 'FL420',
    capeJoules: 1900,
    updraftVelocityMs: 19,
    hailRisk: 'HIGH',
    threatLevel: 'SEVERE',
    anvilSpreadRadiusKm: 42,
    interceptedCorridors: ['FAOR-FALE (Durban)', 'FACT-FALE (Coastal)'],
    pilotAction: 'Severe mountain wave turbulence and downburst wind shear. Expect holding or western deviation via Ladysmith.',
  },
  {
    id: 'cb_lowveld_kruger',
    name: 'Lowveld Convective Cluster',
    sector: 'Mpumalanga / Kruger Basin',
    lat: -25.20,
    lon: 31.20,
    baseAltitudeFt: 2800,
    topAltitudeFt: 38000,
    flightLevel: 'FL380',
    capeJoules: 1650,
    updraftVelocityMs: 15,
    hailRisk: 'MODERATE',
    threatLevel: 'MODERATE',
    anvilSpreadRadiusKm: 35,
    interceptedCorridors: ['FAOR-FAKN (Kruger Corridor)'],
    pilotAction: 'Heavy precipitation attenuation on airborne weather radar; fly standard instrument arrival via Nelspruit.',
  },
  {
    id: 'cb_eastern_cape',
    name: 'Amatola / Winterberg Multicell Line',
    sector: 'Eastern Cape Interior',
    lat: -32.40,
    lon: 26.50,
    baseAltitudeFt: 3500,
    topAltitudeFt: 36000,
    flightLevel: 'FL360',
    capeJoules: 1400,
    updraftVelocityMs: 12,
    hailRisk: 'MODERATE',
    threatLevel: 'MODERATE',
    anvilSpreadRadiusKm: 30,
    interceptedCorridors: ['FAOR-FAPE (Gqeberha)'],
    pilotAction: 'Monitor cloud tops via satellite datalink; adjust cruise step climb above FL370 if aircraft envelope permits.',
  },
];

// Major Domestic Air Corridors in South Africa
const DOMESTIC_AIR_CORRIDORS: FlightCorridor3D[] = [
  {
    id: 'corr_jnb_cpt',
    code: 'UQ30',
    fromName: 'Boksburg / JNB (FAOR)',
    fromIcao: 'FAOR',
    fromLat: -26.1392,
    fromLon: 28.2460,
    toName: 'Cape Town (FACT)',
    toIcao: 'FACT',
    toLat: -33.9249,
    toLon: 18.4241,
    cruiseFl: 360,
    routeCode: 'UQ30 / V54',
    threatLevel: 'CAUTION',
    hazardDetails: 'Highveld Supercell anvil outflow crossing initial departure SID out of Boksburg.',
    rerouteBearing: 'Deviate 15 NM West via Klerksdorp (PKV)',
  },
  {
    id: 'corr_jnb_dur',
    code: 'UZ2',
    fromName: 'Boksburg / JNB (FAOR)',
    fromIcao: 'FAOR',
    fromLat: -26.1392,
    fromLon: 28.2460,
    toName: 'Durban King Shaka (FALE)',
    toIcao: 'FALE',
    toLat: -29.8587,
    toLon: 31.0218,
    cruiseFl: 330,
    routeCode: 'UZ2 / UQ18',
    threatLevel: 'HAZARDOUS',
    hazardDetails: 'DIRECT PENETRATION RISK: Towering CB tops to FL460 over Highveld and FL420 over Drakensberg.',
    rerouteBearing: 'Recommend 25 NM South-West deviation via Newcastle',
  },
  {
    id: 'corr_jnb_plz',
    code: 'UQ53',
    fromName: 'Boksburg / JNB (FAOR)',
    fromIcao: 'FAOR',
    fromLat: -26.1392,
    fromLon: 28.2460,
    toName: 'Gqeberha (FAPE)',
    toIcao: 'FAPE',
    toLat: -33.9608,
    toLon: 25.6022,
    cruiseFl: 350,
    routeCode: 'UQ53',
    threatLevel: 'CAUTION',
    hazardDetails: 'Isolated vertical build-ups FL360 over Eastern Cape interior.',
    rerouteBearing: 'Clear to cruise above cloud tops or vector 10 NM East',
  },
  {
    id: 'corr_jnb_kruger',
    code: 'W34',
    fromName: 'Boksburg / JNB (FAOR)',
    fromIcao: 'FAOR',
    fromLat: -26.1392,
    fromLon: 28.2460,
    toName: 'Kruger Mpumalanga (FAKN)',
    toIcao: 'FAKN',
    toLat: -25.3847,
    toLon: 31.1066,
    cruiseFl: 250,
    routeCode: 'W34 Direct',
    threatLevel: 'CLEAR',
    hazardDetails: 'Scattered thermal cumulus below FL220. Corridors clear.',
    rerouteBearing: 'Standard published airways flight plan',
  },
  {
    id: 'corr_cpt_dur',
    code: 'UQ2',
    fromName: 'Cape Town (FACT)',
    fromIcao: 'FACT',
    fromLat: -33.9249,
    fromLon: 18.4241,
    toName: 'Durban King Shaka (FALE)',
    toIcao: 'FALE',
    toLat: -29.8587,
    toLon: 31.0218,
    cruiseFl: 370,
    routeCode: 'UQ2 Coastal',
    threatLevel: 'CLEAR',
    hazardDetails: 'Stable coastal air mass south of Outeniqua mountains.',
    rerouteBearing: 'Standard coastal flight track',
  },
];

export const ThreeDWeatherSphere: React.FC<ThreeDWeatherSphereProps> = ({
  currentLocation,
  onSelectLocation,
  isRaining,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Active layer & vertical development toggle
  const [activeLayer, setActiveLayer] = useState<'convection' | 'radar' | 'clouds' | 'wind'>('convection');
  const [showVerticalRisks, setShowVerticalRisks] = useState<boolean>(true);
  const [selectedCell, setSelectedCell] = useState<ConvectiveCell | null>(CONVECTIVE_BUILD_UPS[0]);
  const [selectedCorridor, setSelectedCorridor] = useState<FlightCorridor3D | null>(DOMESTIC_AIR_CORRIDORS[1]);

  // 3D Extreme Weather Model State
  const [isExtremeModelActive, setIsExtremeModelActive] = useState<boolean>(true);
  const [selectedExtremeScenario, setSelectedExtremeScenario] = useState<ExtremeWeatherScenario3D>(
    EXTREME_WEATHER_SCENARIOS_3D[0]
  );
  const [showCoreSlice, setShowCoreSlice] = useState<boolean>(true);
  const [showMicroburstVectors, setShowMicroburstVectors] = useState<boolean>(true);
  const [showMesocycloneStreamlines, setShowMesocycloneStreamlines] = useState<boolean>(true);

  const [rotationX, setRotationX] = useState<number>(0.38); // tilt for South Africa
  const [rotationY, setRotationY] = useState<number>(-0.48); // longitude orientation
  const [autoRotate, setAutoRotate] = useState<boolean>(false); // default paused to facilitate inspecting flight paths

  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let clock = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const radius = Math.min(width, height) * 0.35;
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Slow auto-rotation if toggled
      if (autoRotate && !isDraggingRef.current) {
        setRotationY((prev) => prev + 0.002);
      }

      clock += 0.025;

      // 1. 3D Atmospheric Outer Blue Glow
      const glowGrad = ctx.createRadialGradient(cx, cy, radius * 0.88, cx, cy, radius * 1.32);
      glowGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
      glowGrad.addColorStop(0.5, 'rgba(14, 165, 233, 0.18)');
      glowGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.32, 0, Math.PI * 2);
      ctx.fill();

      // 2. 3D Globe Sphere Base with Shading
      const sphereGrad = ctx.createRadialGradient(
        cx - radius * 0.35,
        cy - radius * 0.35,
        radius * 0.08,
        cx,
        cy,
        radius
      );
      sphereGrad.addColorStop(0, '#e0f2fe'); // Light sky highlight
      sphereGrad.addColorStop(0.4, '#bae6fd');
      sphereGrad.addColorStop(0.75, '#0284c7');
      sphereGrad.addColorStop(1, '#0369a1'); // Rim dark ocean blue

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();

      ctx.fillStyle = sphereGrad;
      ctx.fillRect(0, 0, width, height);

      // 3. Coordinate Graticule Grid Lines (Latitudes & Longitudes)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 1;

      // Latitude parallels
      [-45, -30, -15, 0, 15].forEach((latDeg) => {
        const phi = (latDeg * Math.PI) / 180;
        const rLat = radius * Math.cos(phi);
        const yLat = cy - radius * Math.sin(phi) * Math.cos(rotationX);
        const rMajor = Math.max(0.1, Math.abs(rLat));
        const rMinor = Math.max(0.1, Math.abs(rLat * Math.sin(rotationX) * 0.35));
        ctx.beginPath();
        ctx.ellipse(cx, yLat, rMajor, rMinor, 0, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Longitude meridians
      for (let lonDeg = 0; lonDeg < 360; lonDeg += 30) {
        const theta = (lonDeg * Math.PI) / 180 + rotationY;
        if (Math.cos(theta) > 0) {
          const rMajor = Math.max(0.1, radius);
          const rMinor = Math.max(0.1, radius * Math.abs(Math.sin(theta)));
          ctx.beginPath();
          ctx.ellipse(cx, cy, rMinor, rMajor, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // 4. Render South Africa Landmass Polygon
      const saBoundary = [
        { lat: -22.1, lon: 29.8 }, // Limpopo border
        { lat: -22.4, lon: 31.3 }, // Kruger / Moz border
        { lat: -26.0, lon: 32.2 }, // Maputo border
        { lat: -28.0, lon: 32.5 }, // KZN north coast
        { lat: -29.8, lon: 31.1 }, // Durban
        { lat: -33.0, lon: 27.9 }, // East London
        { lat: -34.0, lon: 25.6 }, // Gqeberha
        { lat: -34.8, lon: 20.0 }, // Cape Agulhas
        { lat: -33.9, lon: 18.4 }, // Cape Town
        { lat: -31.5, lon: 18.1 }, // West Coast
        { lat: -28.6, lon: 16.5 }, // Orange River mouth
        { lat: -28.4, lon: 20.0 }, // Upington / Namibia
        { lat: -26.8, lon: 20.0 }, // Kalahari
        { lat: -25.0, lon: 25.7 }, // Botswana border
        { lat: -22.1, lon: 29.8 }, // Close loop
      ];

      ctx.beginPath();
      let firstPoint = true;
      saBoundary.forEach((pt) => {
        const phi = (pt.lat * Math.PI) / 180;
        const theta = (pt.lon * Math.PI) / 180 + rotationY;

        const x3d = radius * Math.cos(phi) * Math.sin(theta);
        const y3d = -radius * Math.sin(phi);
        const z3d = radius * Math.cos(phi) * Math.cos(theta);

        const yRot = y3d * Math.cos(rotationX) - z3d * Math.sin(rotationX);
        const zRot = y3d * Math.sin(rotationX) + z3d * Math.cos(rotationX);

        if (zRot > -radius * 0.3) {
          const screenX = cx + x3d;
          const screenY = cy + yRot;
          if (firstPoint) {
            ctx.moveTo(screenX, screenY);
            firstPoint = false;
          } else {
            ctx.lineTo(screenX, screenY);
          }
        }
      });
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Helper function to project 3D spherical coordinates with altitude
      const projectPoint = (lat: number, lon: number, altRadius: number) => {
        const phi = (lat * Math.PI) / 180;
        const theta = (lon * Math.PI) / 180 + rotationY;

        const x3d = altRadius * Math.cos(phi) * Math.sin(theta);
        const y3d = -altRadius * Math.sin(phi);
        const z3d = altRadius * Math.cos(phi) * Math.cos(theta);

        const yRot = y3d * Math.cos(rotationX) - z3d * Math.sin(rotationX);
        const zRot = y3d * Math.sin(rotationX) + z3d * Math.cos(rotationX);

        return {
          x: cx + x3d,
          y: cy + yRot,
          z: zRot,
          visible: zRot > -altRadius * 0.15,
        };
      };

      // 5. Render Active Meteorological Layers
      if (activeLayer === 'radar') {
        // Highveld & coastal precipitation radar reflections
        [
          { lat: -26.2, lon: 28.1, size: 30, color: 'rgba(2, 132, 199, 0.75)' },
          { lat: -29.8, lon: 31.0, size: 36, color: 'rgba(56, 189, 248, 0.7)' },
          { lat: -33.9, lon: 18.5, size: 22, color: 'rgba(14, 165, 233, 0.55)' },
        ].forEach((cell) => {
          const p = projectPoint(cell.lat, cell.lon, radius);
          if (p.visible) {
            const radGrad = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, cell.size);
            radGrad.addColorStop(0, cell.color);
            radGrad.addColorStop(0.7, 'rgba(56, 189, 248, 0.3)');
            radGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = radGrad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, cell.size + Math.sin(clock * 2) * 3, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      } else if (activeLayer === 'wind') {
        // Surface and upper atmospheric streamlines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = 1.5;
        for (let w = 0; w < 14; w++) {
          const lat = -34 + (w % 4) * 3;
          const lon = 18 + w * 1.1;
          const p = projectPoint(lat, lon, radius * 1.01);
          if (p.visible) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + Math.cos(clock + w) * 18, p.y + Math.sin(clock + w) * 9);
            ctx.stroke();
          }
        }
      } else if (activeLayer === 'clouds') {
        // Swirling synoptic clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        for (let i = 0; i < 9; i++) {
          const cLat = -24 - i * 1.3;
          const cLon = 20 + i * 1.8;
          const p = projectPoint(cLat, cLon, radius * 1.02);
          if (p.visible) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 16 + i * 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // 6. VOLUMETRIC 3D CONVECTIVE CUMULONIMBUS RENDERING
      // We render true 3D extruded storm columns towering above the sphere surface!
      // This directly identifies Convective & Cumulonimbus (CB) vertical build-ups.
      CONVECTIVE_BUILD_UPS.forEach((cell) => {
        // Vertical altitude math:
        // Base: ~4,000 ft AMSL -> radius * 1.015
        // Top: FL380-FL460 -> radius * (1.06 to 1.16)
        const baseRadius = radius * 1.015;
        const heightMultiplier = (cell.topAltitudeFt / 46000) * 0.16;
        const topRadius = radius * (1.02 + heightMultiplier);

        const baseP = projectPoint(cell.lat, cell.lon, baseRadius);
        const midP = projectPoint(cell.lat, cell.lon, radius * (1.02 + heightMultiplier * 0.55));
        const topP = projectPoint(cell.lat, cell.lon, topRadius);

        if (!baseP.visible && !topP.visible) return;

        const isSelected = selectedCell?.id === cell.id;

        // A. Draw Ground Radar Inflow Footprint
        ctx.beginPath();
        ctx.arc(baseP.x, baseP.y, 14, 0, Math.PI * 2);
        ctx.fillStyle =
          cell.threatLevel === 'EXTREME'
            ? 'rgba(225, 29, 72, 0.45)'
            : cell.threatLevel === 'SEVERE'
            ? 'rgba(234, 88, 12, 0.4)'
            : 'rgba(2, 132, 199, 0.35)';
        ctx.fill();
        ctx.strokeStyle =
          cell.threatLevel === 'EXTREME'
            ? 'rgba(225, 29, 72, 0.9)'
            : cell.threatLevel === 'SEVERE'
            ? 'rgba(234, 88, 12, 0.85)'
            : 'rgba(2, 132, 199, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // B. Draw Vertical Updraft Column (3D extruded volumetric shaft)
        const shaftGrad = ctx.createLinearGradient(baseP.x, baseP.y, topP.x, topP.y);
        if (cell.threatLevel === 'EXTREME') {
          shaftGrad.addColorStop(0, 'rgba(159, 18, 57, 0.85)'); // Dark convective base
          shaftGrad.addColorStop(0.4, 'rgba(225, 29, 72, 0.75)');
          shaftGrad.addColorStop(0.8, 'rgba(255, 255, 255, 0.9)'); // Glaciated ice crystal top
          shaftGrad.addColorStop(1, '#ffffff');
        } else if (cell.threatLevel === 'SEVERE') {
          shaftGrad.addColorStop(0, 'rgba(194, 65, 12, 0.8)');
          shaftGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.7)');
          shaftGrad.addColorStop(1, '#ffffff');
        } else {
          shaftGrad.addColorStop(0, 'rgba(3, 105, 161, 0.8)');
          shaftGrad.addColorStop(0.6, 'rgba(56, 189, 248, 0.7)');
          shaftGrad.addColorStop(1, '#ffffff');
        }

        // Draw connective 3D column hull
        ctx.fillStyle = shaftGrad;
        ctx.beginPath();
        const baseWidth = 10;
        const topWidth = 24; // Anvil flare
        ctx.moveTo(baseP.x - baseWidth, baseP.y);
        ctx.lineTo(topP.x - topWidth, topP.y);
        ctx.lineTo(topP.x + topWidth, topP.y);
        ctx.lineTo(baseP.x + baseWidth, baseP.y);
        ctx.closePath();
        ctx.fill();

        // C. Volumetric Billows (Cauliflower Convective Lobes in 3D)
        [0.2, 0.45, 0.7, 0.95].forEach((frac, idx) => {
          const billowR = radius * (1.02 + heightMultiplier * frac);
          const billowP = projectPoint(cell.lat, cell.lon, billowR);
          const lobeSize = 8 + frac * 12 + Math.sin(clock * 3 + idx) * 1.5;

          const lobeGrad = ctx.createRadialGradient(
            billowP.x - lobeSize * 0.3,
            billowP.y - lobeSize * 0.3,
            lobeSize * 0.1,
            billowP.x,
            billowP.y,
            lobeSize
          );
          lobeGrad.addColorStop(0, '#ffffff');
          lobeGrad.addColorStop(0.65, frac > 0.6 ? 'rgba(241, 245, 249, 0.9)' : 'rgba(203, 213, 225, 0.85)');
          lobeGrad.addColorStop(1, frac > 0.6 ? 'rgba(148, 163, 184, 0.6)' : 'rgba(71, 85, 105, 0.7)');

          ctx.fillStyle = lobeGrad;
          ctx.beginPath();
          ctx.arc(billowP.x, billowP.y, lobeSize, 0, Math.PI * 2);
          ctx.fill();
        });

        // D. Anvil Cirrus Outflow Head (Expanding Flat Top at FL400+)
        const anvilP = topP;
        const anvilSpread = Math.max(4, 28 + Math.sin(clock * 1.5) * 2);
        const anvilGrad = ctx.createRadialGradient(anvilP.x, anvilP.y - 3, 3, anvilP.x, anvilP.y, anvilSpread);
        anvilGrad.addColorStop(0, '#ffffff');
        anvilGrad.addColorStop(0.5, 'rgba(248, 250, 252, 0.95)');
        anvilGrad.addColorStop(0.85, 'rgba(226, 232, 240, 0.75)');
        anvilGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = anvilGrad;
        ctx.beginPath();
        ctx.ellipse(anvilP.x, anvilP.y, anvilSpread, Math.max(0.1, anvilSpread * 0.45), 0, 0, Math.PI * 2);
        ctx.fill();

        // E. In-Cloud Convective Lightning Pulse (Simulated)
        if (Math.random() > 0.82 && cell.threatLevel !== 'MODERATE') {
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(topP.x, topP.y);
          ctx.lineTo(midP.x + (Math.random() - 0.5) * 10, midP.y);
          ctx.lineTo(baseP.x + (Math.random() - 0.5) * 6, baseP.y);
          ctx.stroke();

          // Flash ambient illumination
          ctx.fillStyle = 'rgba(254, 240, 138, 0.35)';
          ctx.beginPath();
          ctx.arc(midP.x, midP.y, 22, 0, Math.PI * 2);
          ctx.fill();
        }

        // F. 3D Altitude Callout Tag
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = cell.threatLevel === 'EXTREME' ? '#e11d48' : '#0369a1';
        const tagText = `${cell.flightLevel} (${Math.round(cell.topAltitudeFt / 1000)}k ft)`;
        ctx.fillText(tagText, topP.x + 12, topP.y - 4);

        if (isSelected) {
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(topP.x, topP.y, 14 + Math.sin(clock * 4) * 3, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      // 6B. DEDICATED 3D EXTREME WEATHER MODEL RENDERING ENGINE
      if (isExtremeModelActive && selectedExtremeScenario) {
        const ext = selectedExtremeScenario;
        const baseRadius = radius * 1.015;
        const heightMultiplier = (ext.cloudTopFl / 480) * 0.22;
        const topRadius = radius * (1.02 + heightMultiplier);

        const baseP = projectPoint(ext.lat, ext.lon, baseRadius);
        const midP = projectPoint(ext.lat, ext.lon, radius * (1.02 + heightMultiplier * 0.52));
        const topP = projectPoint(ext.lat, ext.lon, topRadius);

        if (baseP.visible || topP.visible) {
          // A. 3D Surface Meso-Low / Inflow Trough & Swirling Ground Field
          ctx.beginPath();
          const mesoGlowRadius = 26 + Math.sin(clock * 3) * 3;
          const mesoGrad = ctx.createRadialGradient(baseP.x, baseP.y, 2, baseP.x, baseP.y, mesoGlowRadius);
          mesoGrad.addColorStop(0, 'rgba(244, 63, 94, 0.7)');
          mesoGrad.addColorStop(0.5, 'rgba(239, 68, 68, 0.35)');
          mesoGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = mesoGrad;
          ctx.arc(baseP.x, baseP.y, mesoGlowRadius, 0, Math.PI * 2);
          ctx.fill();

          // Meso-low pressure isobar rings & inward cyclonic inflow arrows
          ctx.strokeStyle = 'rgba(244, 63, 94, 0.85)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(baseP.x, baseP.y, 18, 0, Math.PI * 2);
          ctx.stroke();

          // Draw 4 inward spiraling inflow surface arrows
          for (let a = 0; a < 4; a++) {
            const angle = clock * 1.5 + a * (Math.PI / 2);
            const inX = baseP.x + Math.cos(angle) * 24;
            const inY = baseP.y + Math.sin(angle) * 16;
            ctx.strokeStyle = 'rgba(251, 146, 60, 0.8)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(inX, inY);
            ctx.lineTo(baseP.x + Math.cos(angle + 0.4) * 12, baseP.y + Math.sin(angle + 0.4) * 8);
            ctx.stroke();
          }

          // B. 3D Volumetric Mesocyclone Column (Convective Core Shaft)
          const coreGrad = ctx.createLinearGradient(baseP.x, baseP.y, topP.x, topP.y);
          coreGrad.addColorStop(0, '#881337'); // Dark severe rain base
          coreGrad.addColorStop(0.3, '#be123c'); // Reflectivity core
          coreGrad.addColorStop(0.65, '#f43f5e'); // Convective updraft
          coreGrad.addColorStop(0.9, '#ffffff'); // Glaciated ice crystal top
          coreGrad.addColorStop(1, '#ffffff');

          ctx.fillStyle = coreGrad;
          ctx.beginPath();
          ctx.moveTo(baseP.x - 14, baseP.y);
          ctx.lineTo(topP.x - 32, topP.y);
          ctx.lineTo(topP.x + 32, topP.y);
          ctx.lineTo(baseP.x + 14, baseP.y);
          ctx.closePath();
          ctx.fill();

          // C. 3D Helical Mesocyclone Streamlines & Rotating Updraft Particles
          if (showMesocycloneStreamlines) {
            for (let s = 0; s < 5; s++) {
              ctx.strokeStyle = s % 2 === 0 ? 'rgba(56, 189, 248, 0.85)' : 'rgba(251, 191, 36, 0.85)';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              let firstStreamPt = true;

              for (let step = 0; step <= 8; step++) {
                const frac = step / 8;
                const hRadius = radius * (1.018 + heightMultiplier * frac);
                const rotTheta = clock * 2.8 + s * ((Math.PI * 2) / 5) + frac * Math.PI * 2.2;
                const spread = 0.22 * (1 + frac * 1.5);
                const dLat = Math.cos(rotTheta) * spread;
                const dLon = Math.sin(rotTheta) * spread * 1.4;

                const pt = projectPoint(ext.lat + dLat, ext.lon + dLon, hRadius);
                if (pt.visible) {
                  if (firstStreamPt) {
                    ctx.moveTo(pt.x, pt.y);
                    firstStreamPt = false;
                  } else {
                    ctx.lineTo(pt.x, pt.y);
                  }
                }
              }
              ctx.stroke();

              // Tracer particles moving upward along the vortex
              const pFrac = ((clock * 0.8 + s * 0.2) % 1);
              const pRadius = radius * (1.018 + heightMultiplier * pFrac);
              const pTheta = clock * 2.8 + s * ((Math.PI * 2) / 5) + pFrac * Math.PI * 2.2;
              const pSpread = 0.22 * (1 + pFrac * 1.5);
              const pDLat = Math.cos(pTheta) * pSpread;
              const pDLon = Math.sin(pTheta) * pSpread * 1.4;
              const tracerPt = projectPoint(ext.lat + pDLat, ext.lon + pDLon, pRadius);
              if (tracerPt.visible) {
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(tracerPt.x, tracerPt.y, 2.5, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }

          // D. Tornado Condensation Funnel & Debris Cloud (If TORNADO scenario)
          if (ext.category === 'TORNADO') {
            const wallAltRadius = radius * (1.02 + heightMultiplier * 0.22);
            const wallPt = projectPoint(ext.lat, ext.lon, wallAltRadius);

            const wallGrad = ctx.createRadialGradient(wallPt.x, wallPt.y, 2, wallPt.x, wallPt.y, 22);
            wallGrad.addColorStop(0, '#0f172a');
            wallGrad.addColorStop(0.7, '#334155');
            wallGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = wallGrad;
            ctx.beginPath();
            ctx.ellipse(wallPt.x, wallPt.y, 22, 10, 0, 0, Math.PI * 2);
            ctx.fill();

            const funnelSway = Math.sin(clock * 4.5) * 4;
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.moveTo(wallPt.x - 8, wallPt.y);
            ctx.quadraticCurveTo(
              (wallPt.x + baseP.x) / 2 + funnelSway,
              (wallPt.y + baseP.y) / 2,
              baseP.x - 2,
              baseP.y
            );
            ctx.lineTo(baseP.x + 2, baseP.y);
            ctx.quadraticCurveTo(
              (wallPt.x + baseP.x) / 2 + funnelSway + 4,
              (wallPt.y + baseP.y) / 2,
              wallPt.x + 8,
              wallPt.y
            );
            ctx.closePath();
            ctx.fill();

            const debrisSize = 14 + Math.sin(clock * 6) * 3;
            const debrisGrad = ctx.createRadialGradient(baseP.x, baseP.y, 1, baseP.x, baseP.y, debrisSize);
            debrisGrad.addColorStop(0, 'rgba(120, 53, 15, 0.9)');
            debrisGrad.addColorStop(0.7, 'rgba(180, 83, 9, 0.5)');
            debrisGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = debrisGrad;
            ctx.beginPath();
            ctx.arc(baseP.x, baseP.y, debrisSize, 0, Math.PI * 2);
            ctx.fill();

            for (let d = 0; d < 6; d++) {
              const dAngle = clock * 7 + d * 1.05;
              const dx = baseP.x + Math.cos(dAngle) * (debrisSize * 0.8);
              const dy = baseP.y + Math.sin(dAngle) * (debrisSize * 0.5);
              ctx.fillStyle = '#78350f';
              ctx.fillRect(dx - 1.5, dy - 1.5, 3, 3);
            }

            ctx.font = 'bold 9px monospace';
            ctx.fillStyle = '#dc2626';
            ctx.fillText('EF3 FUNNEL TOUCHDOWN', baseP.x + 18, baseP.y + 4);
          }

          // E. Cut-Off Low Synoptic Spiral Bands (If CUT_OFF_LOW scenario)
          if (ext.category === 'CUT_OFF_LOW') {
            for (let arm = 0; arm < 2; arm++) {
              ctx.strokeStyle = arm === 0 ? 'rgba(6, 182, 212, 0.75)' : 'rgba(14, 165, 233, 0.65)';
              ctx.lineWidth = 3;
              ctx.beginPath();
              let firstArmPt = true;
              for (let a = 0; a < 14; a++) {
                const spiralR = 0.4 + a * 0.28;
                const spiralAngle = clock * 0.8 + arm * Math.PI + a * 0.35;
                const armLat = ext.lat + Math.cos(spiralAngle) * spiralR;
                const armLon = ext.lon + Math.sin(spiralAngle) * spiralR * 1.3;
                const armPt = projectPoint(armLat, armLon, radius * (1.02 + a * 0.005));
                if (armPt.visible) {
                  if (firstArmPt) {
                    ctx.moveTo(armPt.x, armPt.y);
                    firstArmPt = false;
                  } else {
                    ctx.lineTo(armPt.x, armPt.y);
                  }
                }
              }
              ctx.stroke();
            }
          }

          // F. Squall Line Arcus Shelf Cloud (If SQUALL_LINE scenario)
          if (ext.category === 'SQUALL_LINE') {
            const lineSegments = [
              { lat: -27.6, lon: 26.8, topFl: 410 },
              { lat: -27.1, lon: 27.2, topFl: 440 },
              { lat: -26.6, lon: 27.7, topFl: 460 },
              { lat: -26.1, lon: 28.3, topFl: 450 },
              { lat: -25.6, lon: 28.9, topFl: 400 },
            ];

            ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            let firstLinePt = true;
            lineSegments.forEach((seg) => {
              const segP = projectPoint(seg.lat, seg.lon, radius * (1.02 + (seg.topFl / 480) * 0.18));
              if (segP.visible) {
                if (firstLinePt) {
                  ctx.moveTo(segP.x, segP.y);
                  firstLinePt = false;
                } else {
                  ctx.lineTo(segP.x, segP.y);
                }
              }
            });
            ctx.stroke();

            ctx.font = 'bold 9px monospace';
            ctx.fillStyle = '#ea580c';
            ctx.fillText('300km ARCUS SHELF CLOUD (120 km/h GUST FRONT)', midP.x - 60, midP.y - 18);
          }

          // G. 3D Radar Reflectivity (dBZ) Vertical Core Slice
          if (showCoreSlice) {
            const sliceX = midP.x + 36;
            const sliceY = midP.y;

            ctx.save();
            ctx.translate(sliceX, sliceY);

            ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
            ctx.strokeStyle = 'rgba(244, 63, 94, 0.8)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.roundRect(-42, -55, 84, 110, 8);
            ctx.fill();
            ctx.stroke();

            ctx.font = 'bold 8px monospace';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('3D VERTICAL SLICE', -38, -43);

            // Freezing level line (0°C isotherm at FL140)
            ctx.strokeStyle = '#38bdf8';
            ctx.setLineDash([3, 2]);
            ctx.beginPath();
            ctx.moveTo(-38, 5);
            ctx.lineTo(38, 5);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.font = '7px monospace';
            ctx.fillStyle = '#38bdf8';
            ctx.fillText('0°C FL140', 8, 3);

            // Reflectivity cores:
            // Outer 40 dBZ (green)
            ctx.fillStyle = 'rgba(34, 197, 94, 0.7)';
            ctx.beginPath();
            ctx.ellipse(0, -10, 32, 38, 0, 0, Math.PI * 2);
            ctx.fill();

            // 55 dBZ Heavy Precipitation (red)
            ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
            ctx.beginPath();
            ctx.ellipse(0, -16, 22, 26, 0, 0, Math.PI * 2);
            ctx.fill();

            // 72 dBZ Giant Hail Core (Fuchsia / Magenta)
            ctx.fillStyle = 'rgba(217, 70, 239, 0.95)';
            ctx.beginPath();
            ctx.ellipse(0, -22, 14, 16, 0, 0, Math.PI * 2);
            ctx.fill();

            // Hailstones suspended aloft in the core
            ctx.fillStyle = '#ffffff';
            for (let h = 0; h < 5; h++) {
              const hAngle = clock * 3 + h * 1.2;
              ctx.beginPath();
              ctx.arc(Math.cos(hAngle) * 8, -22 + Math.sin(hAngle) * 8, 1.8, 0, Math.PI * 2);
              ctx.fill();
            }

            // Bounded Weak Echo Region (BWER) Updraft Vault
            ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
            ctx.beginPath();
            ctx.moveTo(-10, 35);
            ctx.lineTo(0, -6);
            ctx.lineTo(10, 35);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.font = 'bold 7px monospace';
            ctx.fillStyle = '#f59e0b';
            ctx.fillText('BWER VAULT', -24, 25);

            ctx.font = 'bold 7.5px monospace';
            ctx.fillStyle = '#fdf2f8';
            ctx.fillText(`${ext.maxReflectivityDbz} dBZ HAIL`, -26, -26);

            ctx.restore();
          }

          // H. 3D Microburst Downdraft & Outflow Windshear Vectors
          if (showMicroburstVectors) {
            for (let down = 0; down < 3; down++) {
              const arrowY = ((clock * 40 + down * 25) % 65);
              const curDownY = midP.y + arrowY * 0.5;
              ctx.fillStyle = 'rgba(56, 189, 248, 0.9)';
              ctx.beginPath();
              ctx.moveTo(midP.x - 4, curDownY);
              ctx.lineTo(midP.x + 4, curDownY);
              ctx.lineTo(midP.x, curDownY + 8);
              ctx.closePath();
              ctx.fill();
            }

            const ringR = 14 + ((clock * 22) % 26);
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(baseP.x, baseP.y, ringR, 0, Math.PI * 2);
            ctx.stroke();

            for (let v = 0; v < 6; v++) {
              const vAngle = v * (Math.PI / 3);
              const vStartR = ringR * 0.9;
              const vEndR = ringR + 12;
              const sx = baseP.x + Math.cos(vAngle) * vStartR;
              const sy = baseP.y + Math.sin(vAngle) * vStartR;
              const ex = baseP.x + Math.cos(vAngle) * vEndR;
              const ey = baseP.y + Math.sin(vAngle) * vEndR;

              ctx.strokeStyle = '#38bdf8';
              ctx.lineWidth = 1.8;
              ctx.beginPath();
              ctx.moveTo(sx, sy);
              ctx.lineTo(ex, ey);
              ctx.stroke();

              ctx.fillStyle = '#38bdf8';
              ctx.beginPath();
              ctx.arc(ex, ey, 2.2, 0, Math.PI * 2);
              ctx.fill();
            }

            ctx.font = 'bold 8.5px monospace';
            ctx.fillStyle = '#0284c7';
            ctx.fillText(
              `WINDSHEAR: ${ext.downburstWindKts} KTS (FAOR RWY 03L/21R)`,
              baseP.x - 80,
              baseP.y + ringR + 14
            );
          }

          // I. Massive Anvil Canopy with Overshooting Top
          const anvilR = Math.max(4, 40 + Math.sin(clock * 1.5) * 3);
          const anvilGrad = ctx.createRadialGradient(topP.x, topP.y - 4, 3, topP.x, topP.y, anvilR);
          anvilGrad.addColorStop(0, '#ffffff');
          anvilGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.95)');
          anvilGrad.addColorStop(0.75, 'rgba(241, 245, 249, 0.8)');
          anvilGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = anvilGrad;
          ctx.beginPath();
          ctx.ellipse(topP.x, topP.y, anvilR, Math.max(0.1, anvilR * 0.45), 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(topP.x, topP.y - 8, 11, 0, Math.PI * 2);
          ctx.fill();

          if (Math.random() > 0.72) {
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(topP.x, topP.y - 6);
            ctx.lineTo(midP.x + (Math.random() - 0.5) * 16, midP.y);
            ctx.lineTo(baseP.x + (Math.random() - 0.5) * 12, baseP.y);
            ctx.stroke();

            ctx.fillStyle = 'rgba(254, 240, 138, 0.45)';
            ctx.beginPath();
            ctx.arc(midP.x, midP.y, 35, 0, Math.PI * 2);
            ctx.fill();
          }

          // J. Overhead Billboard Callout Badge
          ctx.save();
          const calloutY = topP.y - 28;
          ctx.fillStyle = 'rgba(225, 29, 72, 0.95)';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(topP.x - 85, calloutY - 14, 170, 24, 6);
          ctx.fill();
          ctx.stroke();

          ctx.font = 'bold 9px monospace';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.fillText(`FL${ext.cloudTopFl} | +${ext.updraftVelocityMs} m/s | ${ext.maxReflectivityDbz} dBZ`, topP.x, calloutY - 1);
          ctx.font = '7.5px sans-serif';
          ctx.fillText(ext.title, topP.x, calloutY + 8);
          ctx.restore();
        }
      }

      // 7. 3D FLIGHT PATHS & VERTICAL DEVELOPMENT INTERCEPTION RISKS
      if (showVerticalRisks) {
        DOMESTIC_AIR_CORRIDORS.forEach((corridor) => {
          // Corridor cruise level mapped to radius: FL330-FL370 -> radius * 1.08
          const cruiseRadius = radius * (1.02 + (corridor.cruiseFl / 460) * 0.12);

          const startP = projectPoint(corridor.fromLat, corridor.fromLon, radius * 1.015);
          const endP = projectPoint(corridor.toLat, corridor.toLon, radius * 1.015);

          // Interpolate great-circle waypoints
          const numSteps = 16;
          const arcPoints: { x: number; y: number; visible: boolean }[] = [];

          let hasSevereThreat = corridor.threatLevel === 'HAZARDOUS';
          let hasCaution = corridor.threatLevel === 'CAUTION';

          for (let i = 0; i <= numSteps; i++) {
            const t = i / numSteps;
            const curLat = corridor.fromLat + (corridor.toLat - corridor.fromLat) * t;
            const curLon = corridor.fromLon + (corridor.toLon - corridor.fromLon) * t;

            // Climb-Cruise-Descent profile arc
            const profileFrac = Math.sin(t * Math.PI);
            const curRadius = radius * 1.015 + (cruiseRadius - radius * 1.015) * Math.pow(profileFrac, 0.4);

            const pt = projectPoint(curLat, curLon, curRadius);
            arcPoints.push(pt);
          }

          // Draw Flight Corridor Ribbon in 3D
          const isHazardous = corridor.threatLevel === 'HAZARDOUS';
          const isCautionState = corridor.threatLevel === 'CAUTION';

          ctx.strokeStyle = isHazardous
            ? `rgba(225, 29, 72, ${0.7 + Math.sin(clock * 5) * 0.3})`
            : isCautionState
            ? 'rgba(234, 88, 12, 0.85)'
            : 'rgba(16, 185, 129, 0.85)';

          ctx.lineWidth = isHazardous ? 3 : 2;
          ctx.setLineDash(isHazardous ? [6, 4] : isCautionState ? [8, 3] : []);

          ctx.beginPath();
          let started = false;
          arcPoints.forEach((pt) => {
            if (pt.visible) {
              if (!started) {
                ctx.moveTo(pt.x, pt.y);
                started = true;
              } else {
                ctx.lineTo(pt.x, pt.y);
              }
            }
          });
          ctx.stroke();
          ctx.setLineDash([]); // Reset dash

          // Draw mid-flight Cruise FL marker
          const midIndex = Math.floor(arcPoints.length / 2);
          const midPt = arcPoints[midIndex];
          if (midPt && midPt.visible) {
            ctx.fillStyle = isHazardous ? '#e11d48' : isCautionState ? '#ea580c' : '#059669';
            ctx.beginPath();
            ctx.arc(midPt.x, midPt.y, 4, 0, Math.PI * 2);
            ctx.fill();

            // Flight Code & Threat Label
            ctx.font = 'bold 8px monospace';
            ctx.fillStyle = isHazardous ? '#e11d48' : '#334155';
            ctx.fillText(`${corridor.fromIcao}-${corridor.toIcao} FL${corridor.cruiseFl}`, midPt.x + 6, midPt.y - 4);
          }
        });
      }

      // 8. Draw 3D South African City Pins (Boksburg, JNB, Cape Town, etc.)
      SA_CITIES.forEach((city) => {
        const p = projectPoint(city.lat, city.lon, radius * 1.01);
        if (p.visible) {
          const isSelected = city.name.toLowerCase() === currentLocation.name.toLowerCase();
          const isHome = city.isHome;

          // Pin marker
          ctx.beginPath();
          ctx.arc(p.x, p.y, isHome ? 7 : isSelected ? 6 : 4, 0, Math.PI * 2);
          ctx.fillStyle = isHome ? '#0284c7' : isSelected ? '#0369a1' : '#ffffff';
          ctx.fill();
          ctx.strokeStyle = isHome ? '#ffffff' : '#0284c7';
          ctx.lineWidth = isHome ? 2.5 : 1.5;
          ctx.stroke();

          // Label
          ctx.font = isHome ? 'bold 10px sans-serif' : isSelected ? 'bold 9px sans-serif' : '8px sans-serif';
          ctx.fillStyle = isHome ? '#0369a1' : isSelected ? '#0284c7' : '#1e293b';
          ctx.fillText(city.name, p.x + 7, p.y + 3);
        }
      });

      // 9. Specular 3D Glass Light Reflection
      const specGrad = ctx.createRadialGradient(
        cx - radius * 0.45,
        cy - radius * 0.45,
        0,
        cx - radius * 0.45,
        cy - radius * 0.45,
        radius * 0.55
      );
      specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
      specGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.15)');
      specGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = specGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore(); // Restore clip
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    rotationX,
    rotationY,
    autoRotate,
    activeLayer,
    showVerticalRisks,
    selectedCell,
    currentLocation,
    isExtremeModelActive,
    selectedExtremeScenario,
    showCoreSlice,
    showMicroburstVectors,
    showMesocycloneStreamlines,
  ]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    setAutoRotate(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - lastMousePosRef.current.x;
    const deltaY = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    setRotationY((prev) => prev + deltaX * 0.007);
    setRotationX((prev) => Math.max(-0.6, Math.min(0.8, prev + deltaY * 0.007)));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleFocusStorm = (lat: number, lon: number) => {
    const targetRotY = -((lon * Math.PI) / 180) + Math.PI / 2 - 0.15;
    const targetRotX = -((lat * Math.PI) / 180) - 0.1;
    setRotationY(targetRotY);
    setRotationX(Math.max(-0.6, Math.min(0.8, targetRotX)));
    setAutoRotate(false);
  };

  return (
    <div
      id="3d-weather-globe-panel"
      className="card-3d p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between"
    >
      {/* Ambient background blur */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-sky-200/40 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-sky-100">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.6)] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800 font-mono">
              3D VOLUMETRIC METEOROLOGICAL SPHERE
            </span>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold border border-sky-200">
              SOUTH AFRICA AIRSPACE
            </span>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-mono font-bold">
              EXTREME WEATHER MODEL 3D
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-light italic text-slate-900 tracking-tight">
            Volumetric Convection & Extreme Weather 3D Simulation
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            DRAG 3D SPHERE TO INSPECT SUPERCELL UPDRAFTS, TORNADIC MESOCYCLONES, HAIL CORES & FLIGHT CORRIDORS
          </p>
        </div>

        {/* Controls: Extreme 3D Model Toggle, Flight Risk Toggle, Layer Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 3D Extreme Weather Model Primary Toggle */}
          <button
            onClick={() => setIsExtremeModelActive(!isExtremeModelActive)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-mono font-bold transition-all border shadow-xs ${
              isExtremeModelActive
                ? 'bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 text-white border-rose-400 shadow-rose-600/30 ring-2 ring-rose-400/40'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ShieldAlert className={`w-3.5 h-3.5 ${isExtremeModelActive ? 'text-amber-300 animate-pulse' : 'text-rose-500'}`} />
            <span>Extreme Weather 3D Model</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                isExtremeModelActive ? 'bg-white text-rose-600' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {isExtremeModelActive ? 'ACTIVE' : 'OFF'}
            </span>
          </button>

          {/* Vertical Development Flight Risk Toggle */}
          <button
            onClick={() => setShowVerticalRisks(!showVerticalRisks)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-mono font-bold transition-all border shadow-xs ${
              showVerticalRisks
                ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white border-sky-400 shadow-sky-500/20'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            <span>Flight Risk Corridors</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                showVerticalRisks ? 'bg-white text-sky-700' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {showVerticalRisks ? 'ACTIVE' : 'OFF'}
            </span>
          </button>

          {/* 3D Atmospheric Layer Switcher */}
          <div className="flex items-center gap-1 bg-sky-50/80 p-1 rounded-2xl border border-sky-200">
            <button
              onClick={() => setActiveLayer('convection')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                activeLayer === 'convection' ? 'btn-3d-primary' : 'text-sky-800 hover:text-sky-950'
              }`}
            >
              <Zap className="w-3 h-3 text-amber-300" />
              <span>Convective CB</span>
            </button>
            <button
              onClick={() => setActiveLayer('radar')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeLayer === 'radar' ? 'btn-3d-primary' : 'text-sky-800 hover:text-sky-950'
              }`}
            >
              Radar
            </button>
            <button
              onClick={() => setActiveLayer('clouds')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeLayer === 'clouds' ? 'btn-3d-primary' : 'text-sky-800 hover:text-sky-950'
              }`}
            >
              Clouds
            </button>
            <button
              onClick={() => setActiveLayer('wind')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeLayer === 'wind' ? 'btn-3d-primary' : 'text-sky-800 hover:text-sky-950'
              }`}
            >
              Wind
            </button>
          </div>
        </div>
      </div>

      {/* 3D Extreme Weather Model Interactive Ribbon (Active when Extreme Model is enabled) */}
      {isExtremeModelActive && (
        <div className="my-3 p-3.5 rounded-2xl bg-gradient-to-r from-rose-950/90 via-slate-900/95 to-amber-950/90 text-white border border-rose-500/40 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-rose-500/30">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-rose-600 text-white shadow-xs">
                <ShieldAlert className="w-4 h-4 animate-pulse" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-rose-300">
                    3D EXTREME WEATHER PHENOMENON SIMULATOR
                  </h3>
                  <span className="px-2 py-0.2 rounded-full bg-rose-600/80 text-white font-mono text-[9px] font-bold">
                    HIGHVELD TORNADIC & SUPERCELL MESONET
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-sans mt-0.5">
                  Real-time 3D vertical kinetic modeling of South African high-impact convective storms
                </p>
              </div>
            </div>

            {/* Quick 3D Perspective Centering */}
            <button
              onClick={() => handleFocusStorm(selectedExtremeScenario.lat, selectedExtremeScenario.lon)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold transition-all shadow-xs shrink-0 self-start md:self-auto"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Center 3D View on Core</span>
            </button>
          </div>

          {/* Scenario Selector Tabs */}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {EXTREME_WEATHER_SCENARIOS_3D.map((scenario) => {
              const isCurrent = selectedExtremeScenario.id === scenario.id;
              return (
                <button
                  key={scenario.id}
                  onClick={() => {
                    setSelectedExtremeScenario(scenario);
                    handleFocusStorm(scenario.lat, scenario.lon);
                  }}
                  className={`p-2.5 rounded-xl text-left transition-all border flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-rose-600/90 text-white border-rose-400 shadow-md ring-1 ring-white/30'
                      : 'bg-slate-900/60 text-slate-300 border-slate-700 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase text-rose-200 truncate">
                      {scenario.category.replace('_', ' ')}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                        isCurrent ? 'bg-black/40 text-rose-100' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      FL{scenario.cloudTopFl}
                    </span>
                  </div>
                  <div className="text-xs font-bold font-sans line-clamp-1">
                    {scenario.title.split(' ')[0]} {scenario.title.split(' ')[1]}
                  </div>
                  <div className="text-[10px] font-mono opacity-80 mt-1 flex items-center justify-between">
                    <span>{scenario.maxReflectivityDbz} dBZ</span>
                    <span>+{scenario.updraftVelocityMs} m/s</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 3D Volumetric Physics Layer Toggles */}
          <div className="mt-3 pt-2.5 border-t border-rose-500/20 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-rose-400" />
              <span>3D VOLUMETRIC PHYSICS LAYERS:</span>
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowCoreSlice(!showCoreSlice)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                  showCoreSlice
                    ? 'bg-fuchsia-600 text-white border-fuchsia-400'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                Vertical dBZ Core Slice
              </button>
              <button
                onClick={() => setShowMicroburstVectors(!showMicroburstVectors)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                  showMicroburstVectors
                    ? 'bg-sky-600 text-white border-sky-400'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                Microburst Vectors
              </button>
              <button
                onClick={() => setShowMesocycloneStreamlines(!showMesocycloneStreamlines)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                  showMesocycloneStreamlines
                    ? 'bg-amber-600 text-white border-amber-400'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                Meso Updraft Streamlines
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3D Stage & Convective Flight Corridor / Extreme Model Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-4 items-center">
        {/* Left Column: 3D Interactive Canvas */}
        <div className="lg:col-span-7">
          <div
            className="relative w-full h-88 sm:h-96 flex items-center justify-center cursor-grab active:cursor-grabbing bg-gradient-to-b from-sky-50/70 to-white/90 rounded-3xl border border-sky-200/80 shadow-[inset_0_2px_6px_rgba(2,132,199,0.06)] overflow-hidden"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <canvas
              ref={canvasRef}
              width={520}
              height={440}
              className="w-full h-full object-contain"
            />

            {/* Quick Legend Overlay on Canvas Top-Left */}
            {isExtremeModelActive ? (
              <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-rose-500/50 text-[11px] font-mono space-y-1.5 shadow-md pointer-events-none text-white max-w-[240px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider">
                    EXTREME 3D SIMULATION
                  </span>
                </div>
                <div className="text-xs font-bold text-white leading-tight">
                  {selectedExtremeScenario.title}
                </div>
                {/* Radar dBZ Reflectivity Scale */}
                <div className="pt-1">
                  <div className="flex justify-between text-[8.5px] text-slate-300 font-mono">
                    <span>30 dBZ</span>
                    <span>55 dBZ</span>
                    <span className="text-rose-400 font-bold">{selectedExtremeScenario.maxReflectivityDbz} dBZ</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 via-rose-600 to-fuchsia-600 mt-0.5" />
                </div>
                <div className="flex items-center justify-between text-[9px] text-slate-300 pt-0.5 border-t border-slate-700/60">
                  <span>Updraft: +{selectedExtremeScenario.updraftVelocityMs} m/s</span>
                  <span>Top: FL{selectedExtremeScenario.cloudTopFl}</span>
                </div>
              </div>
            ) : (
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-2 rounded-2xl border border-sky-200/80 text-[11px] font-mono space-y-1 shadow-sm pointer-events-none">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">3D VOLUMETRIC KEY:</div>
                <div className="flex items-center gap-2 text-slate-800">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span>Extruded CB Tower (FL380 - FL460)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800">
                  <span className="w-4 h-0.5 bg-rose-500 inline-block border-t border-dashed" />
                  <span>Flight Corridor Intercept Risk</span>
                </div>
              </div>
            )}

            {/* View Reset and Auto-Rotate Controls on Canvas Bottom-Right */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-xl border border-sky-200 shadow-sm text-xs text-sky-800">
              <button
                onClick={() => {
                  setRotationX(0.38);
                  setRotationY(-0.48);
                }}
                className="hover:text-sky-950 p-1"
                title="Reset View"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setAutoRotate(!autoRotate)}
                className="text-[11px] font-mono px-2 py-0.5 bg-sky-100 rounded-lg hover:bg-sky-200 font-bold"
              >
                {autoRotate ? 'Pause 3D' : 'Play 3D'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: 3D Extreme Weather Model Telemetry OR Flight Corridors */}
        <div className="lg:col-span-5 space-y-4">
          {isExtremeModelActive ? (
            /* DEDICATED 3D EXTREME WEATHER MODEL TELEMETRY & COCKPIT DISPATCH PANEL */
            <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-rose-950/80 to-slate-950 text-white border border-rose-500/40 shadow-xl space-y-4">
              {/* Header Badge */}
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-rose-500/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold font-mono text-sm shadow-md">
                    <Flame className="w-4 h-4 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-mono leading-tight">
                      {selectedExtremeScenario.title}
                    </h4>
                    <span className="text-[10px] text-rose-300 font-mono">
                      {selectedExtremeScenario.sector} ({selectedExtremeScenario.lat.toFixed(2)}°S, {selectedExtremeScenario.lon.toFixed(2)}°E)
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-xl text-[9px] font-mono font-black uppercase bg-rose-600 text-white border border-rose-400 shadow-sm shrink-0">
                  {selectedExtremeScenario.category.replace('_', ' ')}
                </span>
              </div>

              {/* 6 Key Physical Telemetry Metrics */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 bg-slate-800/90 rounded-2xl border border-slate-700 text-center">
                  <span className="text-[9px] font-mono text-slate-400 uppercase block">UPDRAFT SPEED</span>
                  <span className="text-sm font-bold font-mono text-rose-400">+{selectedExtremeScenario.updraftVelocityMs} m/s</span>
                  <span className="text-[9px] text-slate-400 block font-mono">+{Math.round(selectedExtremeScenario.updraftVelocityMs * 1.944)} kts</span>
                </div>
                <div className="p-2.5 bg-slate-800/90 rounded-2xl border border-slate-700 text-center">
                  <span className="text-[9px] font-mono text-slate-400 uppercase block">REFLECTIVITY</span>
                  <span className="text-sm font-bold font-mono text-fuchsia-400">{selectedExtremeScenario.maxReflectivityDbz} dBZ</span>
                  <span className="text-[9px] text-fuchsia-300 block font-mono">Hail Shaft</span>
                </div>
                <div className="p-2.5 bg-slate-800/90 rounded-2xl border border-slate-700 text-center">
                  <span className="text-[9px] font-mono text-slate-400 uppercase block">HAIL DIAMETER</span>
                  <span className="text-sm font-bold font-mono text-amber-400">{selectedExtremeScenario.maxHailDiameterCm} cm</span>
                  <span className="text-[9px] text-amber-300 block font-mono">Surface Core</span>
                </div>
                <div className="p-2.5 bg-slate-800/90 rounded-2xl border border-slate-700 text-center">
                  <span className="text-[9px] font-mono text-slate-400 uppercase block">WINDSHEAR</span>
                  <span className="text-sm font-bold font-mono text-sky-400">{selectedExtremeScenario.downburstWindKts} kts</span>
                  <span className="text-[9px] text-sky-300 block font-mono">Microburst</span>
                </div>
                <div className="p-2.5 bg-slate-800/90 rounded-2xl border border-slate-700 text-center">
                  <span className="text-[9px] font-mono text-slate-400 uppercase block">0-3KM HELICITY</span>
                  <span className="text-sm font-bold font-mono text-emerald-400">{selectedExtremeScenario.srhM2s2} m²/s²</span>
                  <span className="text-[9px] text-emerald-300 block font-mono">SRH Vorticity</span>
                </div>
                <div className="p-2.5 bg-slate-800/90 rounded-2xl border border-slate-700 text-center">
                  <span className="text-[9px] font-mono text-slate-400 uppercase block">PRESSURE DEFICIT</span>
                  <span className="text-sm font-bold font-mono text-rose-400">-{selectedExtremeScenario.pressureDeficitHpa} hPa</span>
                  <span className="text-[9px] text-rose-300 block font-mono">Meso-Low</span>
                </div>
              </div>

              {/* Airport & Airspace Impact Box */}
              <div className="p-3 bg-rose-950/70 rounded-2xl border border-rose-500/50">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-rose-300 mb-1">
                  <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                  <span>OR TAMBO (FAOR) & BOKSBURG AIRSPACE IMPACT:</span>
                </div>
                <p className="text-xs text-slate-200 font-sans leading-relaxed">
                  {selectedExtremeScenario.faorImpact}
                </p>
              </div>

              {/* Synoptic Dynamics Mechanism */}
              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/80">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-300 mb-1">
                  <Waves className="w-3.5 h-3.5 text-amber-400" />
                  <span>SYNOPTIC ATMOSPHERIC MECHANISM:</span>
                </div>
                <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                  {selectedExtremeScenario.synopticDescription}
                </p>
              </div>

              {/* Aviation Cockpit Emergency Advisory */}
              <div className="p-3 bg-rose-900/60 rounded-2xl border border-rose-400/40">
                <strong className="text-rose-200 font-mono text-xs block mb-0.5">
                  PILOT OPERATIONAL MANDATE:
                </strong>
                <p className="text-xs text-rose-100 font-sans leading-relaxed">
                  {selectedExtremeScenario.aviationWarning}
                </p>
              </div>

              {/* Toggle Back to Standard View */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setIsExtremeModelActive(false)}
                  className="text-xs font-mono text-slate-400 hover:text-white underline underline-offset-2 flex items-center gap-1"
                >
                  <span>Switch to standard domestic airways view</span>
                </button>
                <button
                  onClick={() => handleFocusStorm(selectedExtremeScenario.lat, selectedExtremeScenario.lon)}
                  className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-semibold flex items-center gap-1 border border-slate-600"
                >
                  <Crosshair className="w-3 h-3 text-rose-400" />
                  <span>Re-center</span>
                </button>
              </div>
            </div>
          ) : (
            /* CONVECTIVE STORM INSPECTOR & DOMESTIC AIRWAYS RISK LIST (DEFAULT VIEW) */
            <>
              {/* Active Convective Cell Inspector Card */}
              {selectedCell && (
                <div className="p-4.5 rounded-2xl bg-gradient-to-br from-rose-50/60 via-amber-50/40 to-sky-50/50 border border-rose-200 shadow-xs">
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-rose-200/60">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold font-mono text-xs shadow-xs">
                        CB
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 font-mono">
                          {selectedCell.name}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-sans">{selectedCell.sector}</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-mono font-black uppercase bg-rose-600 text-white">
                      {selectedCell.threatLevel} HAZARD
                    </span>
                  </div>

                  {/* Convective Profile Metrics */}
                  <div className="grid grid-cols-3 gap-2 my-3">
                    <div className="p-2 bg-white/90 rounded-xl border border-rose-100 text-center">
                      <span className="text-[9px] font-mono text-slate-400 uppercase block">CLOUD TOP</span>
                      <span className="text-xs font-bold font-mono text-rose-700">{selectedCell.flightLevel}</span>
                      <span className="text-[9px] text-slate-500 block">46,000 ft</span>
                    </div>
                    <div className="p-2 bg-white/90 rounded-xl border border-rose-100 text-center">
                      <span className="text-[9px] font-mono text-slate-400 uppercase block">CAPE ENERGY</span>
                      <span className="text-xs font-bold font-mono text-amber-700">{selectedCell.capeJoules}</span>
                      <span className="text-[9px] text-slate-500 block">J/kg (Severe)</span>
                    </div>
                    <div className="p-2 bg-white/90 rounded-xl border border-rose-100 text-center">
                      <span className="text-[9px] font-mono text-slate-400 uppercase block">UPDRAFT V</span>
                      <span className="text-xs font-bold font-mono text-slate-900">+{selectedCell.updraftVelocityMs} m/s</span>
                      <span className="text-[9px] text-rose-600 font-bold block">Hail: {selectedCell.hailRisk}</span>
                    </div>
                  </div>

                  <div className="text-[11px] font-sans text-slate-700 bg-white/80 p-2.5 rounded-xl border border-rose-100 leading-relaxed">
                    <strong className="text-rose-800 font-mono">PILOT ADVISORY: </strong>
                    {selectedCell.pilotAction}
                  </div>
                </div>
              )}

              {/* Domestic Flight Corridor Interception Risk List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-600 px-1">
                  <span className="font-bold uppercase tracking-wider">FLIGHT PATH VERTICAL RISK STATUS</span>
                  <span className="text-[10px] text-slate-400">SAWS AIRWAYS RADAR</span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                  {DOMESTIC_AIR_CORRIDORS.map((corridor) => {
                    const isHaz = corridor.threatLevel === 'HAZARDOUS';
                    const isCaut = corridor.threatLevel === 'CAUTION';
                    const isSelected = selectedCorridor?.id === corridor.id;

                    return (
                      <button
                        key={corridor.id}
                        onClick={() => setSelectedCorridor(corridor)}
                        className={`w-full p-2.5 rounded-2xl text-left transition-all border flex items-center justify-between ${
                          isSelected
                            ? 'bg-sky-50 border-sky-400 shadow-sm'
                            : isHaz
                            ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
                            : isCaut
                            ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Plane
                            className={`w-4 h-4 shrink-0 ${
                              isHaz ? 'text-rose-600' : isCaut ? 'text-amber-600' : 'text-emerald-600'
                            }`}
                          />
                          <div>
                            <div className="text-xs font-mono font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{corridor.fromIcao} ➔ {corridor.toIcao}</span>
                              <span className="text-[10px] text-slate-500 font-normal">({corridor.routeCode})</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-sans truncate max-w-[200px]">
                              Cruise: FL{corridor.cruiseFl} • {corridor.hazardDetails?.split('.')[0]}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-black uppercase ${
                              isHaz
                                ? 'bg-rose-600 text-white'
                                : isCaut
                                ? 'bg-amber-600 text-white'
                                : 'bg-emerald-600 text-white'
                            }`}
                          >
                            {corridor.threatLevel}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Corridor Reroute Waypoint details */}
              {selectedCorridor && (
                <div className="p-3 rounded-2xl bg-sky-50/60 border border-sky-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-sky-800 uppercase block">
                      RECOMMENDED DISPATCH DEVIATION:
                    </span>
                    <span className="text-xs font-medium text-slate-800 font-sans">
                      {selectedCorridor.rerouteBearing}
                    </span>
                  </div>
                  <span className="px-2 py-1 rounded-xl bg-white border border-sky-200 font-mono text-[10px] text-sky-700 font-bold shadow-xs shrink-0">
                    CRUISE FL{selectedCorridor.cruiseFl}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Volumetric Convective Cloud Engine & Vertical Flight Risk Profile Active</span>
        </div>
        <div className="font-mono text-[11px] text-sky-700 font-semibold">
          SACAA / SAWS HIGHVELD CONVECTIVE MESH
        </div>
      </div>
    </div>
  );
};
