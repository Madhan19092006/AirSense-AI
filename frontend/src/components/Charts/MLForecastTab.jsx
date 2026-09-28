import React from 'react';
import { 
  ComposedChart, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { 
  Cpu, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight, 
  Sparkles, 
  Database, 
  Network, 
  LineChart as ChartIcon, 
  AlertTriangle, 
  Info,
  Clock,
  Layers,
  Activity,
  MapPin,
  ShieldCheck,
  Zap
} from 'lucide-react';
import Card3DTilt from '../3D/Card3DTilt';

export default function MLForecastTab({ predictionData, selectedLocation, isLoading }) {
  if (isLoading || !predictionData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[480px] text-center p-8 glass-panel-elevated rounded-3xl border border-slate-800/80 my-4 shadow-2xl relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-5 relative shadow-xl shadow-cyan-500/10">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2 font-['Outfit']">
          Computing XGBoost 24-Hour ML Forecast...
        </h3>
        <p className="text-xs text-slate-400 max-w-sm">
          Generating temporal feature matrix with diurnal oscillations, lag regressors, and meteorology.
        </p>
      </div>
    );
  }

  // Handle unavailable prediction state when required input data is missing
  if (predictionData.available === false) {
    const cityName = selectedLocation?.city || predictionData.city || 'this location';
    return (
      <div className="space-y-6">
        <div className="glass-panel p-10 rounded-3xl border border-amber-500/30 text-center max-w-xl mx-auto my-8 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2 font-['Outfit']">
            Forecast unavailable because required environmental data is not available.
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto mb-6">
            The XGBoost 24-hour predictive engine requires continuous atmospheric multi-pollutant inputs (PM2.5, PM10, NO2, SO2, CO, O3, temperature, humidity) for <span className="text-cyan-400 font-semibold">{cityName}</span> to ensure reliable inference without fabricating predictions.
          </p>
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center justify-center gap-2">
            <Info className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Forecasts are generated when complete environmental monitoring data is present.</span>
          </div>
        </div>
      </div>
    );
  }

  const { city, model_used, mae, rmse, r2, current_aqi, forecast, explainability } = predictionData;

  const cityName = selectedLocation?.city || city || 'Karur';
  const regionName = selectedLocation?.region || selectedLocation?.country || 'Tamil Nadu';

  // Calculate 24-Hour Next Horizon Hero Metrics
  const forecastList = forecast || [];
  const avgPredictedAQI = forecastList.length > 0 
    ? Math.round(forecastList.reduce((acc, f) => acc + f.predicted_aqi, 0) / forecastList.length) 
    : Math.round(current_aqi || 50);

  const peakForecast = forecastList.length > 0
    ? Math.round(Math.max(...forecastList.map(f => f.predicted_aqi)))
    : avgPredictedAQI;

  const minForecast = forecastList.length > 0
    ? Math.round(Math.min(...forecastList.map(f => f.predicted_aqi)))
    : avgPredictedAQI;

  const getCategoryForAQI = (val) => {
    if (val <= 50) return { label: 'Good', color: '#10B981' };
    if (val <= 100) return { label: 'Moderate', color: '#F59E0B' };
    if (val <= 150) return { label: 'Sensitive', color: '#F97316' };
    if (val <= 200) return { label: 'Unhealthy', color: '#EF4444' };
    return { label: 'Hazardous', color: '#881337' };
  };

  const heroCategory = getCategoryForAQI(avgPredictedAQI);

  // Compose chart data combining T=0 (Current / Historical anchor) + 24 predicted hours
  const initialAnchor = {
    time: 'Now (T=0)',
    actual: Math.round(current_aqi || 0),
    predicted: Math.round(current_aqi || 0),
    lower: Math.round(current_aqi || 0),
    upper: Math.round(current_aqi || 0),
  };

  const forecastPoints = forecastList.map((f) => ({
    time: f.timestamp ? f.timestamp.split(' ')[1] : `+${f.hour_ahead}h`,
    actual: null, // Historical stops at T=0
    predicted: Math.round(f.predicted_aqi),
    lower: Math.round(f.confidence_lower),
    upper: Math.round(f.confidence_upper),
    category: f.category,
    color: f.color
  }));

  const chartData = [initialAnchor, ...forecastPoints];

  return (
    <div className="space-y-8 pb-10">
      {/* ========================================================================= */}
      {/* 1. HEADER: AI AIR QUALITY FORECAST                                        */}
      {/* ========================================================================= */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Cpu className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white font-['Outfit'] tracking-tight">
              AI AIR QUALITY FORECAST
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold text-white">{cityName}</span>
            {regionName && <span>• {regionName}</span>}
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold">
              {model_used || 'XGBoost Regressor'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800 self-start md:self-auto">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Forecast Horizon: <strong className="text-slate-200">24 Hours</strong></span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. HERO METRIC: NEXT 24H PREDICTED AQI                                    */}
      {/* ========================================================================= */}
      <Card3DTilt maxTilt={3} scale={1.005} glowColor="rgba(6, 182, 212, 0.2)">
        <div className="glass-panel-elevated p-7 sm:p-9 rounded-3xl border border-slate-800 relative overflow-hidden shadow-2xl">
          {/* Ambient cyan glow */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
            {/* Hero Metric Left */}
            <div className="md:col-span-6 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-widest text-cyan-400 font-mono">
                NEXT 24H · PREDICTED AQI
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-6xl sm:text-7xl font-black font-['Outfit'] text-white tracking-tight">
                  {avgPredictedAQI}
                </span>
                <span className="text-2xl font-black text-slate-400 uppercase font-mono">
                  AQI
                </span>
                <span 
                  className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider text-slate-950 shadow-md ml-1"
                  style={{ backgroundColor: heroCategory.color }}
                >
                  {heroCategory.label}
                </span>
              </div>
              <p className="text-xs text-slate-300 max-w-md pt-1 leading-relaxed">
                Projected 24-hour weighted mean based on current atmospheric chemical inventory and predicted meteorological trends.
              </p>
            </div>

            {/* Hero Metric Right Stats Strip */}
            <div className="md:col-span-6 grid grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Current
                </span>
                <span className="text-2xl font-black text-white font-['Outfit'] block">
                  {Math.round(current_aqi || 0)}
                </span>
                <span className="text-[9px] text-slate-500 font-mono block mt-0.5">T=0 Base</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Expected Peak
                </span>
                <span className="text-2xl font-black text-amber-400 font-['Outfit'] block">
                  {peakForecast}
                </span>
                <span className="text-[9px] text-slate-500 font-mono block mt-0.5">24h Maximum</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Expected Low
                </span>
                <span className="text-2xl font-black text-emerald-400 font-['Outfit'] block">
                  {minForecast}
                </span>
                <span className="text-[9px] text-slate-500 font-mono block mt-0.5">24h Minimum</span>
              </div>
            </div>
          </div>
        </div>
      </Card3DTilt>

      {/* ========================================================================= */}
      {/* 3. LARGE PREDICTIVE CHART: ACTUAL VS PREDICTED WITH CONFIDENCE INTERVAL   */}
      {/* ========================================================================= */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800/80 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
              <ChartIcon className="w-4 h-4 text-cyan-400" />
              <span>Actual vs. Predicted 24-Hour Horizon</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Distinguishing current observed telemetry from ML inference with empirical confidence bounds.
            </p>
          </div>

          {/* Legend Indicators */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
              <span className="text-slate-300 font-medium">Historical / Observed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
              <span className="text-slate-300 font-medium">Predicted AQI</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 border-t border-dashed border-cyan-300" />
              <span className="text-slate-400 text-[11px]">Confidence Interval (±1σ)</span>
            </div>
          </div>
        </div>

        <div className="h-80 sm:h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="mlPredictedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
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
                  if (name === 'actual') return [`${val} AQI`, 'Historical Observed'];
                  if (name === 'predicted') return [`${val} AQI`, 'Predicted AQI'];
                  if (name === 'upper') return [`${val} AQI`, 'Upper Confidence (+1σ)'];
                  if (name === 'lower') return [`${val} AQI`, 'Lower Confidence (-1σ)'];
                  return [val, name];
                }}
              />
              
              {/* Confidence Interval Upper & Lower Lines */}
              <Line type="monotone" dataKey="upper" stroke="#06b6d4" strokeWidth={1} strokeDasharray="4 4" dot={false} name="upper" opacity={0.5} />
              <Line type="monotone" dataKey="lower" stroke="#06b6d4" strokeWidth={1} strokeDasharray="4 4" dot={false} name="lower" opacity={0.5} />

              {/* Predicted AQI Main Curve */}
              <Area type="monotone" dataKey="predicted" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#mlPredictedGrad)" name="predicted" />

              {/* Actual Historical / Current Anchor Point */}
              <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={4} dot={{ r: 6, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }} name="actual" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hourly progression timeline */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>24-Hour Forecast Timeline</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">Hourly Inferences</span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-3 pt-1 scrollbar-thin">
          {forecastList.map((f, i) => (
            <div
              key={i}
              className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shrink-0 min-w-[125px] flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 block mb-1">
                  +{f.hour_ahead}h ({f.timestamp ? f.timestamp.split(' ')[1] : ''})
                </span>
                <span className="text-xl font-black text-white font-['Outfit'] block">
                  {Math.round(f.predicted_aqi)}
                </span>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold text-slate-950 uppercase tracking-wider block text-center truncate"
                  style={{ backgroundColor: f.color || '#06b6d4' }}
                >
                  {f.category}
                </span>
                <span className="text-[9px] text-slate-500 font-mono block text-center mt-1">
                  ±{Math.round((f.confidence_upper - f.confidence_lower) / 2)} AQI
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODEL INTELLIGENCE PANEL                                               */}
      {/* MAE, RMSE, R²                                                             */}
      {/* Model: XGBoost, Features: 20 environmental and temporal features           */}
      {/* Forecast horizon: 24 hours                                                */}
      {/* ========================================================================= */}
      <div className="glass-panel p-7 sm:p-8 rounded-3xl border border-slate-800/80 shadow-2xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
          <div>
            <h3 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              <span>MODEL INTELLIGENCE</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Empirical validation metrics and architecture specifications.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            Validated Regressor
          </span>
        </div>

        {/* 3 Metric Cards: MAE, RMSE, R² */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              MAE (Mean Absolute Error)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-400 font-mono">{mae}</span>
              <span className="text-xs text-slate-500 font-mono">AQI points</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Average magnitude of prediction deviation across test holdout.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              RMSE (Root Mean Squared Error)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-cyan-400 font-mono">{rmse}</span>
              <span className="text-xs text-slate-500 font-mono">Standard deviation</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Penalizes larger peak estimation variances during high-pollution events.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              R² Score (Coefficient of Determination)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-400 font-mono">{r2}</span>
              <span className="text-xs text-slate-500 font-mono">Fit coefficient</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Empirical correlation with longitudinal holdout observations.
            </p>
          </div>
        </div>

        {/* Architecture Spec Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80 text-xs">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <Cpu className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 block">Model:</span>
              <strong className="text-white font-mono text-xs">XGBoost</strong>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <Layers className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 block">Features:</span>
              <strong className="text-white font-mono text-xs">20 environmental and temporal features</strong>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 block">Forecast horizon:</span>
              <strong className="text-white font-mono text-xs">24 hours</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
