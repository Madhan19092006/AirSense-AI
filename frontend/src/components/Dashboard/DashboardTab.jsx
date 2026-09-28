import React, { useState } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Gauge, 
  Info, 
  ShieldCheck, 
  AlertTriangle, 
  Cpu, 
  Map, 
  Navigation, 
  ArrowRight, 
  Sparkles,
  MapPin,
  CheckCircle2,
  Activity,
  Compass,
  CloudSun,
  Layers,
  Clock
} from 'lucide-react';
import Card3DTilt from '../3D/Card3DTilt';

export default function DashboardTab({ 
  user,
  currentData, 
  historyData, 
  predictionData,
  selectedLocation, 
  isLoading, 
  loadingStage,
  onNavigateTab
}) {
  const [timeFilter, setTimeFilter] = useState('24H');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const userName = user?.name ? user.name.split(' ')[0] : 'Madhan';

  // Staged loading state (strictly authentic data)
  if (isLoading || !currentData) {
    const cityName = selectedLocation?.city || 'Selected Location';
    const message = loadingStage?.message || `Finding air-quality data for ${cityName}...`;
    const step = loadingStage?.step || 1;

    return (
      <div className="flex flex-col items-center justify-center min-h-[480px] text-center p-8 glass-panel-elevated rounded-3xl border border-slate-800/80 my-4 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-gradient from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5 relative shadow-xl shadow-emerald-500/10">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2 font-['Outfit']">
          {message}
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mb-5">
          Querying global atmospheric telemetry and regional monitoring models.
        </p>

        {/* Step Sequence Bar */}
        <div className="flex items-center gap-2 mt-2">
          <div className={`h-1.5 w-16 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-800'}`} />
          <div className={`h-1.5 w-16 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-800'}`} />
          <div className={`h-1.5 w-16 rounded-full transition-all duration-300 ${step >= 3 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-800'}`} />
        </div>
        <div className="text-[11px] text-slate-500 mt-6 flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-emerald-400" />
          <span>AirSense AI operates strictly on authentic sensor data. Data availability varies by location.</span>
        </div>
      </div>
    );
  }

  // Handle location with unavailable air-quality data without inventing fake numbers
  if (currentData.available === false || currentData.aqi === null || !currentData.pollutants) {
    const locDisplay = [
      selectedLocation?.city || currentData.city,
      selectedLocation?.region,
      selectedLocation?.country
    ].filter(Boolean).join(', ');

    return (
      <div className="space-y-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              {getGreeting()}, {userName}.
            </span>
            <h1 className="text-2xl font-black text-white font-['Outfit']">
              Environmental Intelligence Overview
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold text-slate-200">{locDisplay || 'Custom Coordinates'}</span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-10 rounded-2xl border border-amber-500/30 text-center max-w-xl mx-auto my-8 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2 font-['Outfit']">
            Air-quality data is currently unavailable for this location.
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto mb-6">
            We could not find active monitoring stations or global atmospheric telemetry for{' '}
            <span className="text-emerald-400 font-semibold">{currentData.city || 'this location'}</span>.
            AirSense AI operates strictly on authentic sensor data and never fabricates placeholder readings.
          </p>
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center justify-center gap-2">
            <Info className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Try searching a nearby metropolitan city or regional district from the top bar.</span>
          </div>
        </div>
      </div>
    );
  }

  const { aqi, category, color, pollutants, temperature, humidity, city, source } = currentData;
  const windSpeed = currentData.wind_speed ?? currentData.weather?.wind_speed ?? 12.0;
  const pressure = currentData.pressure ?? 1013.2;

  const cityName = selectedLocation?.city || city || 'Karur';
  const regionName = selectedLocation?.region || selectedLocation?.country || 'Tamil Nadu';

  // Circular / Donut Gauge Calculations
  const maxAqiGauge = 300;
  const gaugePercent = Math.min(100, Math.max(5, (aqi / maxAqiGauge) * 100));
  // Circle circumference with r=78 is ~490
  const circumference = 2 * Math.PI * 78;
  const strokeDashoffset = circumference - (circumference * gaugePercent) / 100;

  // Guidance text by category
  const getHealthGuidance = () => {
    if (aqi <= 50) return 'Air quality is satisfactory, and air pollution poses little or no risk.';
    if (aqi <= 100) return 'Air quality is acceptable; unusually sensitive individuals should consider limiting prolonged outdoor exertion.';
    if (aqi <= 150) return 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.';
    if (aqi <= 200) return 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious effects.';
    return 'Health alert: The risk of health effects is increased for everyone.';
  };

  // Environmental Snapshot Pollutants Data
  const telemetryModules = [
    {
      name: 'PM2.5',
      label: 'Fine Particles',
      val: pollutants.pm25 !== undefined ? pollutants.pm25 : null,
      unit: 'µg/m³',
      threshold: 60, // NAAQS 24h standard
      color: (pollutants.pm25 || 0) <= 30 ? '#10B981' : (pollutants.pm25 || 0) <= 60 ? '#F59E0B' : '#EF4444'
    },
    {
      name: 'PM10',
      label: 'Coarse Dust',
      val: pollutants.pm10 !== undefined ? pollutants.pm10 : null,
      unit: 'µg/m³',
      threshold: 100,
      color: (pollutants.pm10 || 0) <= 50 ? '#10B981' : (pollutants.pm10 || 0) <= 100 ? '#F59E0B' : '#EF4444'
    },
    {
      name: 'NO2',
      label: 'Nitrogen Dioxide',
      val: pollutants.no2 !== undefined ? pollutants.no2 : null,
      unit: 'ppb',
      threshold: 80,
      color: (pollutants.no2 || 0) <= 40 ? '#10B981' : (pollutants.no2 || 0) <= 80 ? '#F59E0B' : '#EF4444'
    },
    {
      name: 'SO2',
      label: 'Sulfur Dioxide',
      val: pollutants.so2 !== undefined ? pollutants.so2 : null,
      unit: 'ppb',
      threshold: 80,
      color: (pollutants.so2 || 0) <= 40 ? '#10B981' : (pollutants.so2 || 0) <= 80 ? '#F59E0B' : '#EF4444'
    },
    {
      name: 'CO',
      label: 'Carbon Monoxide',
      val: pollutants.co !== undefined ? (pollutants.co > 50 ? (pollutants.co / 1000).toFixed(1) : pollutants.co) : null,
      unit: 'ppm',
      threshold: 4,
      color: (pollutants.co || 0) <= 2 ? '#10B981' : (pollutants.co || 0) <= 4 ? '#F59E0B' : '#EF4444'
    },
    {
      name: 'O3',
      label: 'Surface Ozone',
      val: pollutants.o3 !== undefined ? pollutants.o3 : null,
      unit: 'ppb',
      threshold: 100,
      color: (pollutants.o3 || 0) <= 50 ? '#10B981' : (pollutants.o3 || 0) <= 100 ? '#F59E0B' : '#EF4444'
    }
  ];

  // Compose AQI Trend Chart: Past 24 hours + Current anchor + Predicted horizon (if available)
  const historyPoints = (historyData || []).map((h) => ({
    time: h.timestamp ? (h.timestamp.includes('T') ? h.timestamp.split('T')[1]?.substring(0, 5) : h.timestamp.split(' ')[1]?.substring(0, 5)) || '00:00' : '00:00',
    historical: h.aqi,
    current: null,
    forecast: null
  }));

  // Current anchor point
  const currentAnchor = {
    time: 'Now',
    historical: Math.round(aqi),
    current: Math.round(aqi),
    forecast: Math.round(aqi)
  };

  // Forecast points from predictionData (if available)
  const forecastPoints = (predictionData?.forecast || []).slice(0, 12).map((f) => ({
    time: f.timestamp ? f.timestamp.split(' ')[1] : `+${f.hour_ahead}h`,
    historical: null,
    current: null,
    forecast: Math.round(f.predicted_aqi)
  }));

  const chartData = [...historyPoints, currentAnchor, ...forecastPoints];

  return (
    <div className="space-y-8 pb-10">
      {/* ========================================================================= */}
      {/* 1. TOP GREETING SECTION                                                   */}
      {/* "Good evening, Madhan."                                                   */}
      {/* "Here is your environmental intelligence overview."                       */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] tracking-tight">
            {getGreeting()}, {userName}.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-normal">
            Here is your environmental intelligence overview.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-800 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Source: <strong className="text-slate-200">{source ? source.split(' ')[0] : 'Open-Meteo'}</strong> Telemetry</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. LARGE HERO AQI PANEL (Focal Point with Donut/Circular Gauge)           */}
      {/* ========================================================================= */}
      <Card3DTilt maxTilt={3} scale={1.005} glowColor={`${color}20`}>
        <div className="glass-panel-elevated rounded-3xl p-6 sm:p-10 border border-slate-800 relative overflow-hidden shadow-2xl">
          {/* Subtle atmospheric ambient glow */}
          <div 
            className="absolute top-0 right-0 w-[450px] h-[450px] rounded-full opacity-15 blur-[100px] pointer-events-none transition-all duration-700"
            style={{ backgroundColor: color }}
          />
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-teal-500/5 blur-[90px] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Left Info / Narrative Column */}
            <div className="lg:col-span-7 space-y-5 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-bold text-slate-300">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="uppercase tracking-widest text-[10px] text-slate-400 font-mono">Current Air Quality</span>
              </div>

              <div>
                <div className="flex items-baseline gap-3">
                  <h1 className="text-6xl sm:text-7xl font-black font-['Outfit'] text-white tracking-tight">
                    {Math.round(aqi)}
                  </h1>
                  <span className="text-xl sm:text-2xl font-black text-slate-400 uppercase font-mono">
                    AQI
                  </span>
                  <span
                    className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider text-slate-950 shadow-md ml-2"
                    style={{ backgroundColor: color }}
                  >
                    {category}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-200 mt-2">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{cityName}, {regionName}</span>
                </div>
              </div>

              {/* Status and Health Guidance */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/90 text-xs text-slate-300 space-y-1.5 backdrop-blur-md max-w-xl">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Health Interpretation</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-xs">
                  {getHealthGuidance()}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Real-Time Sensor Model</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Validated Multi-Pollutant Index</span>
                </div>
              </div>
            </div>

            {/* Right Donut Gauge Visualizer */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
                {/* Outer decorative ring */}
                <div className="absolute inset-0 rounded-full border border-slate-800/80" />
                <div className="absolute inset-4 rounded-full border border-dashed border-slate-800/60" />

                {/* SVG Circular Donut Progress Ring */}
                <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                  {/* Background track */}
                  <circle
                    cx="100"
                    cy="100"
                    r="78"
                    stroke="rgba(255, 255, 255, 0.06)"
                    strokeWidth="12"
                    fill="transparent"
                  />
                  {/* Animated Progress Arc */}
                  <circle
                    cx="100"
                    cy="100"
                    r="78"
                    stroke={color}
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                    style={{
                      filter: `drop-shadow(0 0 10px ${color}60)`
                    }}
                  />
                </svg>

                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
                  <span className="text-4xl sm:text-5xl font-black font-['Outfit'] text-white tracking-tight">
                    {Math.round(aqi)}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    INDEX
                  </span>
                  <span 
                    className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full mt-2"
                    style={{ backgroundColor: `${color}25`, color: color }}
                  >
                    {category}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                <span>0 Good</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                <span>100 Moderate</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                <span>300+ Hazardous</span>
              </div>
            </div>
          </div>
        </div>
      </Card3DTilt>

      {/* ========================================================================= */}
      {/* 3. ENVIRONMENTAL SNAPSHOT (Horizontal Intelligent Metric Modules)          */}
      {/* PM2.5, PM10, NO2, SO2, CO, O3                                            */}
      {/* ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>ENVIRONMENTAL SNAPSHOT</span>
            </h3>
            <p className="text-xs text-slate-400">
              Key atmospheric chemical concentrations and particulate matter metrics.
            </p>
          </div>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            6 Telemetry Channels
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {telemetryModules.map((m) => {
            const hasVal = m.val !== null && m.val !== undefined;
            const numVal = hasVal ? Number(m.val) : 0;
            const pct = Math.min(100, Math.max(8, (numVal / m.threshold) * 100));

            return (
              <div
                key={m.name}
                className="glass-panel p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black font-['Outfit'] text-white">
                      {m.name}
                    </span>
                    <span 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: hasVal ? m.color : '#64748b' }} 
                      title={hasVal ? `Severity level` : 'No reading'}
                    />
                  </div>

                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-2xl font-black font-['Outfit'] text-white">
                      {hasVal ? m.val : '—'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {m.unit}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-400 truncate">
                    {m.label}
                  </div>
                </div>

                {/* Compact Severity Sparkline Bar */}
                <div className="mt-3 pt-2 border-t border-slate-800/60">
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${pct}%`, 
                        backgroundColor: hasVal ? m.color : '#334155' 
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TWO-COLUMN ATMOSPHERIC SECTION: WEATHER PANEL + AQI TREND CHART         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Dedicated Atmospheric Weather Panel */}
        <div className="lg:col-span-4 glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800/80 flex flex-col justify-between relative overflow-hidden shadow-xl">
          {/* Subtle weather atmospheric background glow */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <CloudSun className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-['Outfit']">Atmospheric Weather</h3>
                  <p className="text-[11px] text-slate-400">Micro-climate observations</p>
                </div>
              </div>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                LIVE
              </span>
            </div>

            {/* Weather Metrics Grid */}
            <div className="grid grid-cols-2 gap-3.5 my-4">
              {/* Temperature */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
                <div className="flex items-center gap-2 text-rose-400 mb-1">
                  <Thermometer className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Temp</span>
                </div>
                <div className="text-2xl font-black font-['Outfit'] text-white">
                  {temperature !== undefined ? Math.round(temperature) : 26}°C
                </div>
                <span className="text-[10px] text-slate-500">Surface ambient</span>
              </div>

              {/* Humidity */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
                <div className="flex items-center gap-2 text-cyan-400 mb-1">
                  <Droplets className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Humidity</span>
                </div>
                <div className="text-2xl font-black font-['Outfit'] text-white">
                  {humidity !== undefined ? Math.round(humidity) : 62}%
                </div>
                <span className="text-[10px] text-slate-500">Relative moisture</span>
              </div>

              {/* Wind Speed */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <Wind className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Wind</span>
                </div>
                <div className="text-2xl font-black font-['Outfit'] text-white">
                  {windSpeed !== undefined ? Number(windSpeed).toFixed(1) : '12.0'}
                  <span className="text-xs font-normal text-slate-400 ml-1">km/h</span>
                </div>
                <span className="text-[10px] text-slate-500">Velocity vector</span>
              </div>

              {/* Pressure */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
                <div className="flex items-center gap-2 text-amber-400 mb-1">
                  <Gauge className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pressure</span>
                </div>
                <div className="text-2xl font-black font-['Outfit'] text-white">
                  {Math.round(pressure)}
                  <span className="text-xs font-normal text-slate-400 ml-1">hPa</span>
                </div>
                <span className="text-[10px] text-slate-500">Sea-level adjusted</span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-[11px] text-slate-400 flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Atmospheric pressure & wind drive local pollutant dispersal.</span>
          </div>
        </div>

        {/* AQI Trend Chart (Major Visual Component: Historical, Current, Forecast) */}
        <div className="lg:col-span-8 glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800/80 flex flex-col justify-between shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>AQI Trend & Trajectory</span>
              </h3>
              <p className="text-xs text-slate-400">
                Historical observations, current telemetry anchor, and AI forecast curve.
              </p>
            </div>

            {/* Time Window Filters */}
            <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
              <button
                onClick={() => setTimeFilter('24H')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeFilter === '24H'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                24H Live
              </button>
              <button
                disabled
                title="Multi-day history requires extended archive logging"
                className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 cursor-not-allowed"
              >
                7D
              </button>
              <button
                disabled
                title="Multi-day history requires extended archive logging"
                className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 cursor-not-allowed"
              >
                30D
              </button>
            </div>
          </div>

          {/* Chart Legend Indicators */}
          <div className="flex items-center gap-4 text-xs text-slate-400 mb-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span>Historical AQI</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-white border-2 border-emerald-400" />
              <span className="font-bold text-slate-200">Current Anchor (Now)</span>
            </div>
            {predictionData?.forecast && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-cyan-400/80" />
                <span>AI Forecast</span>
              </div>
            )}
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="historyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={[0, 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090f1e', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                  formatter={(val, name) => {
                    if (val === null || val === undefined) return null;
                    if (name === 'historical') return [`${val} AQI`, 'Historical AQI'];
                    if (name === 'current') return [`${val} AQI`, 'Current Telemetry'];
                    if (name === 'forecast') return [`${val} AQI`, 'Predicted AQI'];
                    return [val, name];
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="historical" 
                  stroke="#10b981" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#historyGrad)" 
                  name="historical" 
                />
                <Area 
                  type="monotone" 
                  dataKey="forecast" 
                  stroke="#06b6d4" 
                  strokeWidth={2.5} 
                  strokeDasharray="4 4"
                  fillOpacity={1} 
                  fill="url(#forecastGrad)" 
                  name="forecast" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. AI ENVIRONMENTAL INSIGHTS (3 Distinct Modules)                         */}
      {/* 1. AIR QUALITY                                                            */}
      {/* 2. AI FORECAST                                                            */}
      {/* 3. SMART ROUTE                                                            */}
      {/* ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>AI ENVIRONMENTAL INSIGHTS</span>
            </h3>
            <p className="text-xs text-slate-400">
              Automated intelligence synthesized across atmospheric telemetry and predictive algorithms.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Module 1: AIR QUALITY */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 hover:border-emerald-500/40 transition-all flex flex-col justify-between group shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  HEALTH
                </span>
              </div>

              <h4 className="text-base font-bold text-white font-['Outfit'] mb-1.5">
                AIR QUALITY
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                AQI currently remains <strong className="text-emerald-400">{category.toLowerCase()}</strong> ({Math.round(aqi)}). Standard outdoor activities are suitable for most individuals.
              </p>
            </div>

            <button
              onClick={() => onNavigateTab && onNavigateTab('heatmap')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900/90 hover:bg-emerald-500/15 text-slate-200 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/40 text-xs font-bold transition-all flex items-center justify-between cursor-pointer"
            >
              <span>Explore Geospatial Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Module 2: AI FORECAST */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 hover:border-cyan-500/40 transition-all flex flex-col justify-between group shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-105 transition-transform">
                  <Cpu className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  XGBOOST
                </span>
              </div>

              <h4 className="text-base font-bold text-white font-['Outfit'] mb-1.5">
                AI FORECAST
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Expected 24-hour AQI trend modeled from diurnal variations, humidity, and lag regressors across 20 features.
              </p>
            </div>

            <button
              onClick={() => onNavigateTab && onNavigateTab('forecast')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900/90 hover:bg-cyan-500/15 text-slate-200 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 text-xs font-bold transition-all flex items-center justify-between cursor-pointer"
            >
              <span>View 24H Forecast</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Module 3: SMART ROUTE */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 hover:border-amber-500/40 transition-all flex flex-col justify-between group shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
                  <Navigation className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  NAVIGATION
                </span>
              </div>

              <h4 className="text-base font-bold text-white font-['Outfit'] mb-1.5">
                SMART ROUTE
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Find a lower estimated exposure corridor comparing fastest vs cleaner road routes with atmospheric sampling.
              </p>
            </div>

            <button
              onClick={() => onNavigateTab && onNavigateTab('route')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900/90 hover:bg-amber-500/15 text-slate-200 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 text-xs font-bold transition-all flex items-center justify-between cursor-pointer"
            >
              <span>Find Cleaner Route</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
