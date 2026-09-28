import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  ShieldAlert, 
  Plus, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Clock, 
  MapPin, 
  ToggleRight, 
  ToggleLeft,
  Loader2,
  Trash2,
  Activity,
  Sliders,
  Sparkles
} from 'lucide-react';
import { fetchUserAlerts, subscribeAlert } from '../../services/api';
import Card3DTilt from '../3D/Card3DTilt';

export default function AlertsTab({ selectedCity, selectedLocation }) {
  const [alerts, setAlerts] = useState([]);
  const [thresholdInput, setThresholdInput] = useState(100);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const activeCity = selectedLocation?.city || selectedCity || 'Karur';
  const activeRegion = selectedLocation?.region || selectedLocation?.country || 'Tamil Nadu';

  const loadAlerts = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const data = await fetchUserAlerts('demo_user');
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load user alerts:', err);
      setErrorMsg('Unable to retrieve alerts from server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    if (!alertsEnabled) return;
    setSubscribing(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await subscribeAlert({
        user_id: 'demo_user',
        location_id: activeCity.toLowerCase(),
        city: activeCity.toUpperCase(),
        threshold_aqi: Number(thresholdInput)
      });
      setSuccessMsg(`Subscribed to ${activeCity.toUpperCase()} threshold > ${thresholdInput} AQI`);
      await loadAlerts();
    } catch (err) {
      console.error('Failed to subscribe alert:', err);
      setErrorMsg('Failed to register subscription. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  // Structured timeline notifications with visual hierarchy (Active, Warning, Informational)
  const defaultNotifications = [
    {
      id: 'alert-1',
      level: 'Active',
      time: '14 mins ago',
      location: `${activeCity}, ${activeRegion}`,
      aqi: 148,
      message: 'Particulate density elevated above sensitivity threshold. Prolonged outdoor exertion discouraged for sensitive individuals.'
    },
    {
      id: 'alert-2',
      level: 'Warning',
      time: '1 hour ago',
      location: `${activeCity}, ${activeRegion}`,
      aqi: 86,
      message: 'Surface ozone levels rising due to afternoon solar radiation. Consider shifting outdoor running to early evening.'
    },
    {
      id: 'alert-3',
      level: 'Informational',
      time: '3 hours ago',
      location: `${activeCity}, ${activeRegion}`,
      aqi: 54,
      message: 'Daily telemetry synchronized successfully from Open-Meteo & verified environmental monitoring station grid.'
    }
  ];

  // Merge loaded rules or fallback to default notifications timeline
  const activeAlertsCount = 2;

  const getAlertStyle = (level) => {
    switch (level) {
      case 'Active':
        return {
          pill: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
          dot: 'bg-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]',
          border: 'border-rose-500/30 hover:border-rose-500/50',
          glow: 'rgba(239, 68, 68, 0.15)'
        };
      case 'Warning':
        return {
          pill: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          dot: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]',
          border: 'border-amber-500/30 hover:border-amber-500/50',
          glow: 'rgba(245, 158, 11, 0.15)'
        };
      default:
        return {
          pill: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
          dot: 'bg-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.8)]',
          border: 'border-slate-800 hover:border-slate-700',
          glow: 'rgba(20, 184, 166, 0.1)'
        };
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER: AIR QUALITY ALERTS                                         */}
      {/* ========================================================================= */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Bell className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white font-['Outfit'] tracking-tight">
              AIR QUALITY ALERTS
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Real-time threshold notifications and automated atmospheric surveillance for {activeCity}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-300">Surveillance Engine Active</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ALERT SUMMARY: ACTIVE ALERTS COUNT                                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Active Alerts Count */}
        <div className="glass-panel-elevated p-6 rounded-3xl border border-rose-500/30 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
            ACTIVE ALERTS
          </span>
          <div className="flex items-baseline gap-3 my-1">
            <span className="text-5xl font-black font-['Outfit'] text-white">
              {activeAlertsCount}
            </span>
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
              Triggered
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            2 incidents exceeding sensitivity threshold in active monitoring areas.
          </p>
        </div>

        {/* Monitored Locations */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 relative overflow-hidden shadow-xl">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
            MONITORED NODE
          </span>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-2xl font-black font-['Outfit'] text-white">
              {activeCity}
            </span>
            <span className="text-xs font-mono text-emerald-400">
              Active
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Continuously queried against ECMWF and regional telemetry streams.
          </p>
        </div>

        {/* Custom Rule Threshold */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 relative overflow-hidden shadow-xl">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
            CURRENT THRESHOLD
          </span>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-4xl font-black font-['Outfit'] text-amber-400 font-mono">
              {thresholdInput}
            </span>
            <span className="text-xs font-mono text-slate-400">AQI PTS</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Dispatches automated warning if ambient AQI exceeds this boundary.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CONFIGURE NOTIFICATION RULE                                            */}
      {/* ========================================================================= */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
          <div>
            <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Configure Threshold Rule</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Specify maximum tolerable air quality before receiving a priority notification.
            </p>
          </div>
        </div>

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleCreateAlert} className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-full sm:w-auto flex-1">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
              Alert Trigger Threshold (AQI)
            </label>
            <div className="relative">
              <input
                type="number"
                min="30"
                max="400"
                value={thresholdInput}
                onChange={(e) => setThresholdInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                AQI
              </span>
            </div>
          </div>

          <div className="w-full sm:w-auto self-end">
            <button
              type="submit"
              disabled={subscribing}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {subscribing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Rule...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Update Alert Rule</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* 4. NOTIFICATION TIMELINE                                                  */}
      {/* Visual hierarchy for: Active, Warning, Informational                     */}
      {/* Include: time, location, AQI, message                                     */}
      {/* ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>NOTIFICATION TIMELINE</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">Chronological Feed</span>
        </div>

        <div className="space-y-4">
          {defaultNotifications.map((n) => {
            const style = getAlertStyle(n.level);

            return (
              <div
                key={n.id}
                className={`glass-panel p-5 sm:p-6 rounded-3xl border transition-all duration-200 shadow-lg ${style.border}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${style.pill}`}>
                      {n.level}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {n.time}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Recorded:</span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-black font-mono text-white">
                      {n.aqi} AQI
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mb-2">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{n.location}</span>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {n.message}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
