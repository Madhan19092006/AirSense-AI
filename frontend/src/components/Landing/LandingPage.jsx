import React, { useState, Suspense, lazy } from 'react';
import { 
  Wind, ArrowRight, ShieldCheck, Activity, Cpu, Map, Navigation, Bell, 
  Sparkles, CheckCircle2, TrendingUp, BarChart3, Layers, Compass, 
  ChevronRight, Thermometer, Droplets, Info, Search, Database, Cpu as ChipIcon,
  Eye, Zap, Check, ArrowDown
} from 'lucide-react';
import AirParticlesBackground from '../3D/AirParticlesBackground';
import Card3DTilt from '../3D/Card3DTilt';
import ScrollReveal from '../3D/ScrollReveal';

const HeroGlobe3D = lazy(() => import('../3D/HeroGlobe3D'));

export default function LandingPage({ onGetStarted, onLogin, onExploreMap, currentAQI, selectedLocation }) {
  const [previewCity, setPreviewCity] = useState('delhi');

  const BENCHMARKS = [
    { key: 'karur', name: 'Karur', region: 'Tamil Nadu, India', aqi: 58, cat: 'Moderate', color: '#F59E0B', pm25: 22.4, pm10: 48.2, no2: 18.4, o3: 32.1, temp: 29, hum: 55 },
    { key: 'delhi', name: 'New Delhi', region: 'Delhi, India', aqi: 184, cat: 'Unhealthy', color: '#EF4444', pm25: 78.4, pm10: 145.2, no2: 38.4, o3: 45.1, temp: 28, hum: 42 },
    { key: 'mumbai', name: 'Mumbai', region: 'Maharashtra, India', aqi: 92, cat: 'Moderate', color: '#F59E0B', pm25: 38.6, pm10: 71.4, no2: 24.5, o3: 38.2, temp: 31, hum: 75 },
    { key: 'bengaluru', name: 'Bengaluru', region: 'Karnataka, India', aqi: 48, cat: 'Good', color: '#10B981', pm25: 18.2, pm10: 34.0, no2: 18.1, o3: 29.5, temp: 24, hum: 60 },
    { key: 'newyork', name: 'New York', region: 'New York, USA', aqi: 36, cat: 'Good', color: '#10B981', pm25: 12.5, pm10: 22.1, no2: 15.2, o3: 31.0, temp: 18, hum: 55 },
    { key: 'london', name: 'London', region: 'Greater London, UK', aqi: 42, cat: 'Good', color: '#10B981', pm25: 15.0, pm10: 26.8, no2: 19.4, o3: 34.6, temp: 16, hum: 68 }
  ];

  const activeBenchmark = BENCHMARKS.find(b => b.key === previewCity) || BENCHMARKS[0];

  const liveCity = currentAQI?.city || selectedLocation?.city || activeBenchmark.name;
  const liveRegion = selectedLocation?.region ? `${selectedLocation.region}, ${selectedLocation.country || ''}` : activeBenchmark.region;
  const liveAqi = currentAQI?.aqi !== undefined && currentAQI?.aqi !== null ? Math.round(currentAQI.aqi) : activeBenchmark.aqi;
  const liveCategory = currentAQI?.category || activeBenchmark.cat;
  const liveColor = currentAQI?.color || activeBenchmark.color;
  const livePm25 = currentAQI?.pollutants?.pm25 ?? activeBenchmark.pm25;
  const livePm10 = currentAQI?.pollutants?.pm10 ?? activeBenchmark.pm10;
  const liveNo2 = currentAQI?.pollutants?.no2 ?? activeBenchmark.no2;
  const liveO3 = currentAQI?.pollutants?.o3 ?? activeBenchmark.o3;

  const scrollToLive = () => {
    const el = document.getElementById('live-air-quality-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      onGetStarted();
    }
  };

  return (
    <div className="space-y-28 py-4 relative">
      <AirParticlesBackground density="normal" opacity={0.35} />

      {/* ========================================================================= */}
      {/* 1. HERO SECTION                                                           */}
      {/* Left: Copy + CTAs                                                         */}
      {/* Right: Large Animated 3D Atmospheric Globe + Floating Telemetry Badges   */}
      {/* ========================================================================= */}
      <section className="relative px-2 pt-4 pb-12 sm:pt-10 sm:pb-16 overflow-hidden">
        {/* Ambient atmospheric radial glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-6xl h-[500px] bg-gradient-to-b from-emerald-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
          {/* Left Column: Hero Text & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <ScrollReveal direction="down" delay={50}>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-widest uppercase shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>AIR QUALITY INTELLIGENCE</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
              </div>
            </ScrollReveal>

            {/* Hero Main Heading */}
            <ScrollReveal direction="up" delay={150}>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white font-['Outfit'] tracking-tight leading-[1.06]">
                Predict Air.<br />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  Plan Smart.
                </span><br />
                Breathe Better.
              </h1>
            </ScrollReveal>

            {/* Supporting Text */}
            <ScrollReveal direction="up" delay={250}>
              <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Real-time atmospheric telemetry powered by trained XGBoost ML forecasting, continuous geospatial heatmaps, and pollution-aware route planning.
              </p>
            </ScrollReveal>

            {/* CTA Buttons */}
            <ScrollReveal direction="up" delay={350}>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={onGetStarted}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 text-slate-950 font-black text-xs hover:shadow-emerald-500/30 active:scale-[0.99] transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer group uppercase tracking-wider"
                >
                  <span>Launch Platform</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={scrollToLive}
                  className="w-full sm:w-auto px-7 py-4 rounded-2xl glass-panel text-slate-200 hover:text-white hover:border-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Explore Live Air Quality</span>
                </button>
              </div>
            </ScrollReveal>

            {/* Trust Badges */}
            <ScrollReveal direction="up" delay={450}>
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs text-slate-400 font-mono">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>XGBoost 24H Engine</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>OSRM Road Corridors</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Open-Meteo & ECMWF Data</span>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: 3D Earth Globe + Floating Indicators */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="w-full max-w-[480px] h-[400px] sm:h-[480px] relative">
              <Suspense fallback={
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                </div>
              }>
                <HeroGlobe3D />
              </Suspense>

              {/* Floating Badge 1: Top-Left (AQI Indicator) */}
              <div className="absolute top-4 left-0 sm:-left-4 z-20 animate-float-gentle pointer-events-none">
                <div className="glass-panel-elevated p-3 rounded-2xl border border-slate-800 shadow-2xl flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-xs font-['Outfit']">
                    {liveAqi}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">Current Index</span>
                    <span className="text-xs font-bold text-white">{liveCategory}</span>
                  </div>
                </div>
              </div>

              {/* Floating Badge 2: Top-Right (PM2.5) */}
              <div className="absolute top-12 -right-2 sm:-right-4 z-20 animate-float-slow pointer-events-none">
                <div className="glass-panel-elevated p-3 rounded-2xl border border-slate-800 shadow-2xl flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-xs font-mono">
                    PM
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">PM2.5 Concentration</span>
                    <span className="text-xs font-bold text-white">{livePm25} µg/m³</span>
                  </div>
                </div>
              </div>

              {/* Floating Badge 3: Bottom-Left (Temperature) */}
              <div className="absolute bottom-6 left-2 sm:-left-4 z-20 animate-float-slow pointer-events-none">
                <div className="glass-panel-elevated p-3 rounded-2xl border border-slate-800 shadow-2xl flex items-center gap-2.5">
                  <Thermometer className="w-5 h-5 text-cyan-400" />
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">Ambient Temp</span>
                    <span className="text-xs font-bold text-white">{activeBenchmark.temp}°C Micro-climate</span>
                  </div>
                </div>
              </div>

              {/* Floating Badge 4: Bottom-Right (Air Quality Status) */}
              <div className="absolute bottom-2 -right-2 sm:right-0 z-20 animate-float-gentle pointer-events-none">
                <div className="glass-panel-elevated p-3 rounded-2xl border border-emerald-500/30 shadow-2xl flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <div>
                    <span className="text-[10px] font-mono text-emerald-400 block uppercase font-bold">Telemetry Live</span>
                    <span className="text-xs font-bold text-white">{liveCity} Node</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. HOW AIRSENSE AI WORKS PIPELINE                                         */}
      {/* DATA SOURCES -> PROCESSING -> AI FORECAST -> SPATIAL -> SMART INSIGHTS   */}
      {/* ========================================================================= */}
      <section className="max-w-6xl mx-auto px-4">
        <ScrollReveal direction="up">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Architecture Pipeline
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] mt-1">
              How AirSense AI Works
            </h2>
            <p className="text-xs text-slate-400 mt-2">
              From global atmospheric sensing to local actionable decision making.
            </p>
          </div>
        </ScrollReveal>

        {/* 5-Step Visual Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
          {[
            {
              step: '01',
              title: 'DATA SOURCES',
              desc: 'Continuous ingestion from Open-Meteo, ECMWF models, and verified ground sensor nodes.',
              icon: Database,
              color: 'text-emerald-400'
            },
            {
              step: '02',
              title: 'PROCESSING',
              desc: 'Temporal normalization, lag regressions, diurnal cycle features, and multi-pollutant indexing.',
              icon: Layers,
              color: 'text-teal-400'
            },
            {
              step: '03',
              title: 'AI FORECAST',
              desc: 'Trained XGBoost regressor predicting 24-hour AQI curves with empirical error confidence bounds.',
              icon: Cpu,
              color: 'text-cyan-400'
            },
            {
              step: '04',
              title: 'SPATIAL INTELLIGENCE',
              desc: 'Continuous 2D raster heatmap interpolation across regional coordinates and monitoring pins.',
              icon: Map,
              color: 'text-indigo-400'
            },
            {
              step: '05',
              title: 'SMART INSIGHTS',
              desc: 'OSRM road corridor exposure reduction algorithms and automated safety alerts.',
              icon: Navigation,
              color: 'text-amber-400'
            }
          ].map((pipe, idx) => {
            const Icon = pipe.icon;
            return (
              <ScrollReveal key={idx} direction="up" delay={idx * 60}>
                <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between h-full relative group shadow-lg">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        {pipe.step}
                      </span>
                      <Icon className={`w-4 h-4 ${pipe.color}`} />
                    </div>
                    <h3 className="text-xs font-black tracking-wider text-white font-['Outfit'] uppercase mb-2">
                      {pipe.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {pipe.desc}
                    </p>
                  </div>

                  {idx < 4 && (
                    <div className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-700">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. 6 FEATURE CARDS                                                        */}
      {/* ========================================================================= */}
      <section className="max-w-6xl mx-auto px-4">
        <ScrollReveal direction="up">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Core Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] mt-1">
              End-to-End Environmental Intelligence
            </h2>
            <p className="text-xs text-slate-400 mt-2">
              Engineered for precision surveillance, predictive foresight, and cleaner commutes.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              num: '01',
              title: 'Real-Time AQI Telemetry',
              desc: 'Live multi-pollutant reporting covering PM2.5, PM10, NO2, SO2, CO, and O3 with authenticated sensor integrity.',
              icon: Activity,
              color: 'text-emerald-400',
              glow: 'rgba(16, 185, 129, 0.15)'
            },
            {
              num: '02',
              title: 'XGBoost ML Forecasting',
              desc: 'Native machine learning forecasting trained on 20 temporal and meteorological features with 24-hour prediction horizons.',
              icon: Cpu,
              color: 'text-cyan-400',
              glow: 'rgba(6, 182, 212, 0.15)'
            },
            {
              num: '03',
              title: 'Geospatial Heatmap',
              desc: 'Continuous spatial density raster overlays illustrating citywide pollution distribution and active monitoring stations.',
              icon: Map,
              color: 'text-teal-400',
              glow: 'rgba(20, 184, 166, 0.15)'
            },
            {
              num: '04',
              title: 'Cleaner Routes (OSRM)',
              desc: 'Turn-by-turn road navigation comparing fastest vs cleaner corridors with estimated atmospheric exposure reduction.',
              icon: Navigation,
              color: 'text-amber-400',
              glow: 'rgba(245, 158, 11, 0.15)'
            },
            {
              num: '05',
              title: 'Automated Threshold Alerts',
              desc: 'Real-time alert notifications dispatched whenever ambient air quality levels exceed custom safety boundaries.',
              icon: Bell,
              color: 'text-rose-400',
              glow: 'rgba(239, 68, 68, 0.15)'
            },
            {
              num: '06',
              title: 'Worldwide City Search',
              desc: 'High-speed geocoding search covering cities, regional municipalities, and geographic coordinates globally.',
              icon: Search,
              color: 'text-indigo-400',
              glow: 'rgba(99, 102, 241, 0.15)'
            }
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <ScrollReveal key={i} direction="up" delay={i * 60}>
                <Card3DTilt glowColor={f.glow} maxTilt={5}>
                  <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between h-full shadow-lg group">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Icon className={`w-5 h-5 ${f.color}`} />
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-500">
                          {f.num}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white font-['Outfit'] mb-2 group-hover:text-emerald-300 transition-colors">
                        {f.title}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {f.desc}
                      </p>
                    </div>
                  </div>
                </Card3DTilt>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. LIVE AQI PREVIEW SECTION                                               */}
      {/* ========================================================================= */}
      <section id="live-air-quality-section" className="max-w-6xl mx-auto px-4">
        <ScrollReveal direction="up">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Live Atmosphere
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] mt-1">
              Real-Time Atmospheric Preview
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Inspect current telemetry values retrieved from verified atmospheric monitoring models.
            </p>
          </div>
        </ScrollReveal>

        {/* City Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          {BENCHMARKS.map((b) => (
            <button
              key={b.key}
              onClick={() => setPreviewCity(b.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                previewCity === b.key
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>

        {/* Live Structure Card */}
        <Card3DTilt glowColor={`${liveColor}20`} maxTilt={3}>
          <div className="glass-panel-elevated p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-4">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                    Reporting Node
                  </span>
                  <h3 className="text-3xl font-black text-white font-['Outfit']">
                    {liveCity}
                  </h3>
                  <p className="text-xs text-slate-400">{liveRegion}</p>
                </div>

                <div className="flex items-baseline gap-4 pt-1">
                  <span className="text-6xl font-black font-['Outfit'] text-white">
                    {liveAqi}
                  </span>
                  <div>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-slate-950 block text-center"
                      style={{ backgroundColor: liveColor }}
                    >
                      {liveCategory}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1 block">Air Quality Index</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                  {liveAqi <= 50
                    ? 'Air quality is satisfactory with little to no risk.'
                    : liveAqi <= 100
                    ? 'Air quality is acceptable; sensitive groups should moderate prolonged exertion.'
                    : 'Elevated particle concentrations observed. Protective measures advised.'}
                </div>
              </div>

              {/* Chemical Concentrations */}
              <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">PM2.5</span>
                  <div className="text-2xl font-black text-white font-['Outfit'] mt-1">
                    {livePm25}
                  </div>
                  <span className="text-[10px] text-amber-400">µg/m³ Fine Dust</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">PM10</span>
                  <div className="text-2xl font-black text-white font-['Outfit'] mt-1">
                    {livePm10}
                  </div>
                  <span className="text-[10px] text-orange-400">µg/m³ Coarse Dust</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">NO2</span>
                  <div className="text-2xl font-black text-white font-['Outfit'] mt-1">
                    {liveNo2}
                  </div>
                  <span className="text-[10px] text-cyan-400">ppb Nitrogen</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">O3</span>
                  <div className="text-2xl font-black text-white font-['Outfit'] mt-1">
                    {liveO3}
                  </div>
                  <span className="text-[10px] text-teal-400">ppb Ozone</span>
                </div>
              </div>
            </div>
          </div>
        </Card3DTilt>
      </section>

      {/* ========================================================================= */}
      {/* 5. CLEANER ROUTE PREVIEW SECTION                                          */}
      {/* ========================================================================= */}
      <section className="max-w-6xl mx-auto px-4">
        <ScrollReveal direction="up">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Corridor Optimization
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] mt-1">
              Smarter, Cleaner Routes
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Compare real road corridors to lower estimated atmospheric pollution exposure.
            </p>
          </div>
        </ScrollReveal>

        <div className="glass-panel p-7 sm:p-8 rounded-3xl border border-slate-800 shadow-xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
              <span>OSRM ENGINE + AIR SAMPLING</span>
            </div>

            <h3 className="text-2xl font-black text-white font-['Outfit']">
              Avoid Highly Polluted Transit Arteries
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Standard GPS navigation directs you through high-density highway corridors with peak vehicular exhaust. AirSense AI samples atmospheric quality along alternative secondary corridors to present lower exposure options.
            </p>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-2">
              <div className="flex items-center justify-between font-bold text-emerald-400">
                <span>Estimated Exposure Reduction:</span>
                <span>−12% Average</span>
              </div>
              <p className="text-[11px] text-slate-400 italic">
                Based on available atmospheric AQI data along the route.
              </p>
            </div>

            <button
              onClick={onExploreMap}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <span>Try Route Planner</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Route Comparison Preview Mockup */}
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-400">🟡 Fastest Route</span>
                <span className="text-xs font-mono text-slate-300 font-bold">46 AQI Exposure</span>
              </div>
              <div className="text-xs text-slate-400 mb-2">135 km · 2h 14m</div>
              <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full w-[88%]" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/40 shadow-lg shadow-emerald-500/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-400">🟢 Cleaner Route</span>
                <span className="text-xs font-mono text-emerald-300 font-bold">42 AQI Exposure</span>
              </div>
              <div className="text-xs text-slate-400 mb-2">136 km · 2h 18m (+4m trade-off)</div>
              <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full w-[72%]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. FINAL CTA SECTION                                                      */}
      {/* ========================================================================= */}
      <section className="max-w-5xl mx-auto px-4 text-center">
        <div className="glass-panel-elevated p-8 sm:p-14 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-gradient from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

          <h2 className="text-3xl sm:text-5xl font-black text-white font-['Outfit'] tracking-tight mb-4">
            Breathe Better with AirSense AI
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto mb-8 leading-relaxed">
            Gain immediate access to verified sensor telemetry, 24-hour predictive machine learning curves, and pollution-conscious routing.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 text-slate-950 font-black text-xs hover:shadow-emerald-500/30 transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onLogin}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl glass-panel text-slate-200 hover:text-white hover:border-slate-700 font-bold text-xs transition-all cursor-pointer"
            >
              Sign In to Existing Account
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
