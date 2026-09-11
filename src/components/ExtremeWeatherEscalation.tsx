import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Flame,
  Snowflake,
  Wind,
  Droplets,
  ShieldAlert,
  Volume2,
  VolumeX,
  Radio,
  ArrowUpRight,
  CheckCircle2,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ExtremeWeatherEvent } from '../types';

interface ExtremeWeatherEscalationProps {
  extremeState: ExtremeWeatherEvent;
  isEscalated: boolean;
  onToggleEscalation: () => void;
  onReset: () => void;
}

export const ExtremeWeatherEscalation: React.FC<ExtremeWeatherEscalationProps> = ({
  extremeState,
  isEscalated,
  onToggleEscalation,
  onReset,
}) => {
  const [audioActive, setAudioActive] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  // Synthesize warning tone safely via Web Audio API when audio toggle is clicked
  const toggleAudioAlert = () => {
    if (audioActive) {
      if (audioContext) {
        audioContext.close();
        setAudioContext(null);
      }
      setAudioActive(false);
    } else {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        // Beep frequency modulation for hazard siren
        osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.3);
        osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.6);

        gain.gain.setValueAtTime(0.08, ctx.currentTime);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        // 3 beeps then pause
        setTimeout(() => {
          try {
            osc.stop();
            ctx.close();
            setAudioContext(null);
            setAudioActive(false);
          } catch (e) {}
        }, 1800);

        setAudioContext(ctx);
        setAudioActive(true);
      } catch (err) {
        console.warn('Audio alert error:', err);
      }
    }
  };

  // If no extreme weather and not escalated, do not render
  if (!extremeState.isExtreme && !isEscalated) {
    return null;
  }

  const getEventIcon = () => {
    switch (extremeState.eventType) {
      case 'HEATWAVE':
        return <Flame className="w-7 h-7 text-amber-300 animate-bounce" />;
      case 'BLIZZARD':
        return <Snowflake className="w-7 h-7 text-cyan-200 animate-spin" />;
      case 'HURRICANE_GALE':
        return <Wind className="w-7 h-7 text-red-200 animate-pulse" />;
      case 'FLASH_FLOOD':
        return <Droplets className="w-7 h-7 text-blue-300 animate-pulse" />;
      case 'TORNADO_SUPERCELL':
      default:
        return <AlertOctagon className="w-7 h-7 text-yellow-300 animate-pulse" />;
    }
  };

  const getSeverityBadge = () => {
    const s = extremeState.severity;
    if (s === 'EMERGENCY') {
      return (
        <span className="px-3 py-1 rounded-full bg-red-600 text-white font-extrabold text-xs tracking-wider uppercase border border-red-400 shadow-md shadow-red-500/50 animate-pulse">
          EMERGENCY LEVEL 4
        </span>
      );
    }
    if (s === 'WARNING') {
      return (
        <span className="px-3 py-1 rounded-full bg-amber-600 text-white font-extrabold text-xs tracking-wider uppercase border border-amber-400 shadow-md">
          WARNING LEVEL 3
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full bg-blue-600 text-white font-extrabold text-xs tracking-wider uppercase">
        ADVISORY LEVEL 2
      </span>
    );
  };

  return (
    <div
      id="extreme-escalation-panel"
      className="relative mb-6 rounded-3xl overflow-hidden border border-rose-500/50 bg-slate-900/90 backdrop-blur-md shadow-2xl glow-rose transition-all duration-300 bg-bento-dots"
    >
      {/* Top Warning Ribbon with Hazard Styling */}
      <div className="bg-gradient-to-r from-rose-900/80 via-rose-600/80 to-amber-900/80 px-6 py-2.5 flex items-center justify-between text-white text-xs font-mono tracking-wider border-b border-rose-500/40">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
          <span className="uppercase font-semibold text-[11px] tracking-widest text-rose-100">
            HIGH INTENSITY ALERT ESCALATION ACTIVE
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline font-mono opacity-90">{extremeState.activeUntil}</span>
          <button
            onClick={toggleAudioAlert}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-rose-500/40 transition-colors text-[11px] font-mono"
            title="Play/Stop Hazard Tone Siren"
          >
            {audioActive ? <Volume2 className="w-3.5 h-3.5 text-rose-300 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
            <span>{audioActive ? 'SIREN ACTIVE' : 'TEST SIREN'}</span>
          </button>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-rose-900/40">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-rose-950/50">
              {getEventIcon()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                {getSeverityBadge()}
                <span className="text-xs font-mono text-rose-300 bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-800">
                  Intensity Index: {extremeState.intensityScore}/100
                </span>
                <span className="text-xs font-mono font-semibold text-amber-300 px-2.5 py-0.5 rounded-full bg-amber-950/60 border border-amber-700/50">
                  {extremeState.evacuateOrShelter.replace('_', ' ')}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-light italic tracking-tight text-white">
                {extremeState.title}
              </h2>
              <p className="text-sm font-medium text-rose-200/90 mt-1 max-w-3xl">
                {extremeState.headline}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>COLLAPSE</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span>SURVIVAL PROTOCOLS</span>
                </>
              )}
            </button>
            <button
              onClick={onReset}
              className="px-4 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-200 text-xs font-mono transition-colors"
            >
              DE-ESCALATE
            </button>
          </div>
        </div>

        {/* Detailed protocols and danger vectors */}
        {isExpanded && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Critical Danger Factors */}
            <div className="p-5 rounded-2xl bg-rose-950/30 border border-rose-900/40">
              <div className="flex items-center gap-2 text-rose-300 font-mono text-xs uppercase tracking-wider mb-3">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Atmospheric Danger Vectors</span>
              </div>
              <ul className="space-y-2">
                {extremeState.dangerFactors.map((factor, idx) => (
                  <li key={idx} className="text-xs text-rose-200/80 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Life Safety Instructions */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-amber-500/40">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm mb-3">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Immediate Safety Directives</span>
              </div>
              <ul className="space-y-2">
                {extremeState.safetyInstructions.map((instruction, idx) => (
                  <li key={idx} className="text-xs text-slate-200 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{instruction}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Critical Emergency Equipment Mandate */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-blue-500/40">
              <div className="flex items-center gap-2 text-blue-300 font-bold text-sm mb-3">
                <ArrowUpRight className="w-4 h-4 text-blue-400" />
                <span>Emergency Safety & Flight Equipment</span>
              </div>
              <ul className="space-y-2">
                {extremeState.recommendedGear.map((gear, idx) => (
                  <li key={idx} className="text-xs text-slate-200 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                    <span className="font-medium">{gear}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
