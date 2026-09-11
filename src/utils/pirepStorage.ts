import { PilotSafetyReport, PirepTurbulenceIntensity, PirepTurbulenceType, PirepVisibilityCategory } from '../types';

const STORAGE_KEY = 'smartweather_pilot_pireps_log';

/**
 * Format a standard ICAO / SACAA Pilot Weather Report (PIREP) string.
 * Example: FAOR UA /OV BOKSBURG 0845/FL075/TP C172/SK SCT060/WX FV07KM HZ/TB MOD CHOP/RM DOWNDRAFT LEE OF SLIMES DAM
 */
export function formatIcaoPirepString(report: Partial<PilotSafetyReport>): string {
  const timeUtc = report.timestamp
    ? new Date(report.timestamp).toISOString().substring(11, 16).replace(':', '')
    : '0830';
  
  const ov = report.location ? report.location.toUpperCase() : 'BOKSBURG';
  const fl = report.altitudeFt
    ? `FL${String(Math.round(report.altitudeFt / 100)).padStart(3, '0')}`
    : report.flightLevel || 'FL075';
  const tp = report.aircraftType || 'C172';
  const sk = report.cloudCondition || 'SCT';
  const wx = `FV${report.visibilityKm ? String(report.visibilityKm).padStart(2, '0') : '10'}KM ${
    report.visibilityCategory === 'HAZY_5_10KM' ? 'HZ' : report.visibilityCategory === 'LOW_VIS_UNDER_3KM' ? 'BR/FG' : ''
  }`.trim();
  const tb = `${report.turbulenceIntensity || 'LGT'} ${report.turbulenceType !== 'NONE' ? report.turbulenceType : ''}`.trim();
  const ic = report.icingIntensity && report.icingIntensity !== 'NONE' ? `/IC ${report.icingIntensity}` : '';
  const rm = report.remarks ? `/RM ${report.remarks.toUpperCase()}` : '';

  return `FAOR UA /OV ${ov} ${timeUtc}/${fl}/TP ${tp}/SK ${sk}/WX ${wx}/TB ${tb}${ic}${rm}`;
}

export const INITIAL_PRESEEDED_PIREPS: PilotSafetyReport[] = [
  {
    id: 'pirep-1',
    callsign: 'ZS-ECL',
    aircraftType: 'C172 Skyhawk',
    location: 'Boksburg Lake / 4NM S of FAOR',
    altitudeFt: 6800,
    flightLevel: 'FL068',
    timestamp: new Date(Date.now() - 38 * 60 * 1000).toISOString(),
    turbulenceIntensity: 'MODERATE',
    turbulenceType: 'THERMAL',
    visibilityCategory: 'HAZY_5_10KM',
    visibilityKm: 7.5,
    cloudCondition: 'SCATTERED',
    icingIntensity: 'NONE',
    outsideAirTempC: 19,
    remarks: 'Strong thermal convection updrafts (+650 fpm) transitioning over industrial Dunswart rooftops. Moderate chop on base leg.',
    icaoRawCode: 'FAOR UA /OV BOKSBURG-DUNSWART 0835/FL068/TP C172/SK SCT070/WX FV07KM HZ/TB MOD THERMAL/RM CONVECTIVE UPDRAFT +650FPM BASE TO FINAL',
    verifiedLocal: true,
  },
  {
    id: 'pirep-2',
    callsign: 'ZS-PLX',
    aircraftType: 'PC-12 NGX',
    location: 'Brakpan-Benoni (FABB) Inbound Corridor',
    altitudeFt: 8500,
    flightLevel: 'FL085',
    timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    turbulenceIntensity: 'LIGHT',
    turbulenceType: 'MECHANICAL',
    visibilityCategory: 'CAVOK',
    visibilityKm: 15,
    cloudCondition: 'FEW',
    icingIntensity: 'NONE',
    outsideAirTempC: 15,
    remarks: 'Lee-wave mechanical rotor observed downwind of ERPM mine dumps. Brief airspeed oscillations +/- 10 kts.',
    icaoRawCode: 'FAOR UA /OV FABB-ERPM 0725/FL085/TP PC12/SK FEW090/WX FV15KM/TB LGT MECH/RM ROTOR DOWNWIND OF TAILINGS DUMP +/-10KT IAS',
    verifiedLocal: true,
  },
  {
    id: 'pirep-3',
    callsign: 'DRONE-OPS-04',
    aircraftType: 'DJI Matrice 350 RTK (sUAS)',
    location: 'Sunward Park / Boksburg South',
    altitudeFt: 380,
    flightLevel: '380ft AGL',
    timestamp: new Date(Date.now() - 210 * 60 * 1000).toISOString(),
    turbulenceIntensity: 'SEVERE',
    turbulenceType: 'CHOP',
    visibilityCategory: 'MARGINAL_3_5KM',
    visibilityKm: 4.2,
    cloudCondition: 'BROKEN_IMC',
    icingIntensity: 'NONE',
    outsideAirTempC: 22,
    remarks: 'Sudden highveld microburst dust gust front at 350ft AGL. Rapid attitude deviation, commanded auto-RTH immediately.',
    icaoRawCode: 'FAOR UUA /OV BOKSBURG-SUNWARD 0540/AGL038/TP RPAS-M350/SK BKN040/WX FV04KM DS/TB SEV CHOP/RM GUST FRONT DOWNDRAFT CMD RTH',
    verifiedLocal: true,
  },
  {
    id: 'pirep-4',
    callsign: 'SAA-234',
    aircraftType: 'B737-800',
    location: 'FAOR Runway 03L Approach (Over Boksburg East)',
    altitudeFt: 7200,
    flightLevel: 'FL072',
    timestamp: new Date(Date.now() - 340 * 60 * 1000).toISOString(),
    turbulenceIntensity: 'LIGHT',
    turbulenceType: 'CAT',
    visibilityCategory: 'CAVOK',
    visibilityKm: 20,
    cloudCondition: 'CLEAR',
    icingIntensity: 'NONE',
    outsideAirTempC: 18,
    remarks: 'Clear air chop on localizer intercept between 7,000ft and 7,500ft. Stable on glideslope after passing Boksburg water tower.',
    icaoRawCode: 'FAOR UA /OV FAOR-03L-BOKSBURG 0330/FL072/TP B738/SK CLR/WX FV20KM/TB LGT CAT/RM LOC INTERCEPT CHOP STABLE GLIDESLOPE',
    verifiedLocal: true,
  },
];

export function getStoredPireps(): PilotSafetyReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PRESEEDED_PIREPS));
      return INITIAL_PRESEEDED_PIREPS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_PRESEEDED_PIREPS;
  } catch (e) {
    console.warn('Failed to load PIREPs from localStorage', e);
    return INITIAL_PRESEEDED_PIREPS;
  }
}

export function savePirepReport(
  reportData: Omit<PilotSafetyReport, 'id' | 'icaoRawCode' | 'timestamp'> & { timestamp?: string }
): PilotSafetyReport {
  const existing = getStoredPireps();
  const timestamp = reportData.timestamp || new Date().toISOString();
  
  const icaoRawCode = formatIcaoPirepString({
    ...reportData,
    timestamp,
  });

  const newReport: PilotSafetyReport = {
    id: `pirep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    ...reportData,
    timestamp,
    icaoRawCode,
  };

  const updated = [newReport, ...existing];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save PIREP to localStorage', e);
  }
  return newReport;
}

export function deletePirepReport(id: string): PilotSafetyReport[] {
  const existing = getStoredPireps();
  const updated = existing.filter((p) => p.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update PIREP storage after delete', e);
  }
  return updated;
}

export function clearAllPirepReports(): PilotSafetyReport[] {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear PIREPs', e);
  }
  return [];
}
