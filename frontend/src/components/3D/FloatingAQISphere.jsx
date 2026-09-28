import React, { useState, useEffect } from 'react';
import { Wind, ShieldAlert, Sparkles, Activity } from 'lucide-react';
import Card3DTilt from './Card3DTilt';

/**
 * Floating 3D AQI Visualization card & sphere
 * Displays dynamic or target AQI reading with animated counter, 3D tilt, and chromatic glow.
 */
export default function FloatingAQISphere({ 
  currentAQI, 
  targetVal = 262, 
  targetCategory = 'Very Unhealthy',
  targetColor = '#8B5CF6' 
}) {
  // Use real current data if available, fallback to 262 Very Unhealthy benchmark
  const displayVal = currentAQI?.aqi ? Math.round(currentAQI.aqi) : targetVal;
  const category = currentAQI?.category || targetCategory;
  const color = currentAQI?.color || targetColor;

  const [counter, setCounter] = useState(0);

  // Smooth number counting transition
  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const startTime = performance.now();

    const updateCounter = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCounter(Math.round(start + (displayVal - start) * easeOut));

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    };

    requestAnimationFrame(updateCounter);
  }, [displayVal]);

  return (
    <div className="relative group perspective-1000">
      {/* Outer ambient glow halo */}
      <div 
        className="absolute -inset-4 rounded-3xl opacity-50 blur-2xl transition-all duration-700 animate-pulse-atmosphere"
        style={{
          background: `radial-gradient(circle, ${color}33 0%, rgba(6, 182, 212, 0.1) 60%, transparent 80%)`
        }}
      />

      <Card3DTilt
        maxTilt={8}
        scale={1.03}
        glowColor={`${color}25`}
        className="glass-card-elevated p-6 rounded-2xl border border-slate-700/60 shadow-2xl relative z-10 backdrop-blur-2xl animate-float-gentle"
      >
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span 
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: color }}
              />
              <span 
                className="relative inline-flex rounded-full h-2.5 w-2.5"
                style={{ backgroundColor: color }}
              />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-300">
              Atmospheric Index
            </span>
          </div>

          <span 
            className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-slate-950 shadow-sm"
            style={{ backgroundColor: color }}
          >
            {category}
          </span>
        </div>

        {/* Counter Display with 3D Depth */}
        <div className="my-3 flex items-baseline gap-3">
          <span 
            className="text-6xl font-black font-['Outfit'] tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
          >
            {counter}
          </span>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400">AQI</span>
            <span className="text-[10px] text-slate-500">US EPA Standard</span>
          </div>
        </div>

        {/* Micro pollutant stream indicators */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 mt-2 text-[10px]">
          <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80 flex flex-col">
            <span className="text-slate-400 font-semibold">PM2.5</span>
            <span className="text-white font-bold mt-0.5">
              {currentAQI?.pollutants?.pm25 || (counter * 0.42).toFixed(1)} <span className="text-slate-500 font-normal">µg/m³</span>
            </span>
          </div>
          <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80 flex flex-col">
            <span className="text-slate-400 font-semibold">PM10</span>
            <span className="text-white font-bold mt-0.5">
              {currentAQI?.pollutants?.pm10 || (counter * 0.85).toFixed(1)} <span className="text-slate-500 font-normal">µg/m³</span>
            </span>
          </div>
          <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80 flex flex-col">
            <span className="text-slate-400 font-semibold">Sensor</span>
            <span className="text-emerald-400 font-bold mt-0.5 truncate">
              {currentAQI?.city ? currentAQI.city.split(',')[0] : 'Telemetry'}
            </span>
          </div>
        </div>
      </Card3DTilt>
    </div>
  );
}
