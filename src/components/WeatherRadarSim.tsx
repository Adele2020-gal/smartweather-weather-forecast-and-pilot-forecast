import React, { useRef, useEffect, useState } from 'react';
import { Radio, Wind, Droplets, ShieldAlert, Layers, ZoomIn, ZoomOut } from 'lucide-react';
import { WeatherData, ExtremeWeatherEvent } from '../types';

interface WeatherRadarSimProps {
  weather: WeatherData;
  extremeState: ExtremeWeatherEvent;
}

export const WeatherRadarSim: React.FC<WeatherRadarSimProps> = ({ weather, extremeState }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeLayer, setActiveLayer] = useState<'radar' | 'wind' | 'hazard'>('radar');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 500);
    let height = (canvas.height = 260);

    const handleResize = () => {
      if (canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = 260;
      }
    };
    window.addEventListener('resize', handleResize);

    // Simulated particles for wind / rain
    const particles: Array<{ x: number; y: number; speed: number; size: number; alpha: number }> = [];
    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 1 + Math.random() * 2.5,
        size: 1 + Math.random() * 2,
        alpha: 0.3 + Math.random() * 0.7,
      });
    }

    let sweepAngle = 0;

    const render = () => {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // Draw radar range rings
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      const baseRadii = [35, 75, 115, 155];
      for (const r of baseRadii) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r * zoomLevel, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw crosshairs
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, height);
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      // Sweep line
      sweepAngle += 0.025;
      const sweepX = centerX + Math.cos(sweepAngle) * 160 * zoomLevel;
      const sweepY = centerY + Math.sin(sweepAngle) * 160 * zoomLevel;

      const grad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, 160 * zoomLevel);
      grad.addColorStop(0, extremeState.isExtreme ? 'rgba(239, 68, 68, 0.4)' : 'rgba(59, 130, 246, 0.3)');
      grad.addColorStop(1, 'transparent');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, 160 * zoomLevel, sweepAngle - 0.3, sweepAngle);
      ctx.closePath();
      ctx.fill();

      // Draw simulated precipitation/hazard cells
      const rainIntensity = weather.current.precipitationProbability / 100;
      const isExtreme = extremeState.isExtreme;

      // Cell 1: Local center cell
      const cell1Grad = ctx.createRadialGradient(
        centerX + 25 * zoomLevel,
        centerY - 20 * zoomLevel,
        0,
        centerX + 25 * zoomLevel,
        centerY - 20 * zoomLevel,
        50 * zoomLevel
      );
      if (isExtreme) {
        cell1Grad.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
        cell1Grad.addColorStop(0.5, 'rgba(249, 115, 22, 0.5)');
        cell1Grad.addColorStop(1, 'transparent');
      } else {
        cell1Grad.addColorStop(0, `rgba(59, 130, 246, ${0.4 + rainIntensity * 0.4})`);
        cell1Grad.addColorStop(0.6, `rgba(6, 182, 212, ${0.2 + rainIntensity * 0.3})`);
        cell1Grad.addColorStop(1, 'transparent');
      }
      ctx.fillStyle = cell1Grad;
      ctx.beginPath();
      ctx.arc(centerX + 25 * zoomLevel, centerY - 20 * zoomLevel, 50 * zoomLevel, 0, Math.PI * 2);
      ctx.fill();

      // Cell 2: Approaching front
      const cell2Grad = ctx.createRadialGradient(
        centerX - 60 * zoomLevel,
        centerY + 35 * zoomLevel,
        0,
        centerX - 60 * zoomLevel,
        centerY + 35 * zoomLevel,
        40 * zoomLevel
      );
      cell2Grad.addColorStop(0, isExtreme ? 'rgba(220, 38, 38, 0.7)' : 'rgba(16, 185, 129, 0.4)');
      cell2Grad.addColorStop(1, 'transparent');
      ctx.fillStyle = cell2Grad;
      ctx.beginPath();
      ctx.arc(centerX - 60 * zoomLevel, centerY + 35 * zoomLevel, 40 * zoomLevel, 0, Math.PI * 2);
      ctx.fill();

      // Particle rendering for wind vectors
      ctx.fillStyle = isExtreme ? '#fca5a5' : '#93c5fd';
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.globalAlpha = p.alpha;
        ctx.fill();

        p.x += (weather.current.windSpeed / 10) * p.speed * 0.5;
        p.y += (weather.current.windSpeed / 20) * p.speed * 0.2;

        if (p.x > width) p.x = 0;
        if (p.y > height) p.y = 0;
      }
      ctx.globalAlpha = 1.0;

      // Center location blip
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.stroke();

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [weather, extremeState, zoomLevel, activeLayer]);

  return (
    <div
      id="weather-radar-sim-panel"
      className="bg-slate-900/50 rounded-3xl border border-slate-800 p-6 sm:p-8 backdrop-blur-md relative overflow-hidden bg-bento-dots"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800/80 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
            <span className="text-xs uppercase font-bold text-cyan-400 tracking-widest">
              Hyper-Local Doppler
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-cyan-300 font-mono ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" /> LIVE SWEEP
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-light italic text-white tracking-tight">
            Atmospheric Reflectivity & Vector Flow
          </h2>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-slate-900/80 p-0.5 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveLayer('radar')}
              className={`px-3 py-1 rounded-lg font-mono text-xs transition-all ${
                activeLayer === 'radar'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              PRECIP RADAR
            </button>
            <button
              onClick={() => setActiveLayer('wind')}
              className={`px-3 py-1 rounded-lg font-mono text-xs transition-all ${
                activeLayer === 'wind'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              WIND ADVECTION
            </button>
          </div>

          <div className="flex items-center bg-slate-900/80 rounded-xl p-0.5 border border-slate-800">
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.2))}
              className="p-1.5 text-slate-400 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.2))}
              className="p-1.5 text-slate-400 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Canvas container */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
        <canvas ref={canvasRef} className="w-full block" />

        {/* Legend */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none bg-slate-950/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">dBZ:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-slate-400">Light</span>
              <span className="w-2 h-2 rounded-full bg-cyan-400 ml-1" />
              <span className="text-slate-400">Mod</span>
              <span className="w-2 h-2 rounded-full bg-amber-400 ml-1" />
              <span className="text-slate-400">Heavy</span>
              <span className="w-2 h-2 rounded-full bg-rose-500 ml-1" />
              <span className="text-rose-400 font-bold">Severe</span>
            </div>
          </div>
          <span className="text-slate-500">Scan Radius: 45 km</span>
        </div>
      </div>
    </div>
  );
};
