import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Mail, 
  MapPin, 
  Thermometer, 
  Bell, 
  Moon, 
  ShieldCheck, 
  LogOut, 
  Check, 
  Save, 
  Sparkles,
  KeyRound
} from 'lucide-react';
import Card3DTilt from '../3D/Card3DTilt';

export default function SettingsTab({ user, selectedCity, onSelectCity, onLogout }) {
  const [defaultCity, setDefaultCity] = useState(() => {
    return localStorage.getItem('airsense_default_city') || selectedCity || 'Delhi';
  });
  const [tempUnit, setTempUnit] = useState(() => {
    return localStorage.getItem('airsense_temp_unit') || 'C';
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('airsense_notifications') !== 'false';
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSavePreferences = (e) => {
    e.preventDefault();
    localStorage.setItem('airsense_default_city', defaultCity);
    localStorage.setItem('airsense_temp_unit', tempUnit);
    localStorage.setItem('airsense_notifications', String(notificationsEnabled));
    if (onSelectCity && defaultCity !== selectedCity) {
      onSelectCity(defaultCity);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const displayName = user?.name || 'AirSense User';
  const displayEmail = user?.email || 'user@airsense.ai';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Settings Header */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shadow-md shadow-teal-500/10">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-['Outfit']">Account & Platform Settings</h2>
            <p className="text-xs text-slate-400">Manage your profile, environmental units, and notification preferences</p>
          </div>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold animate-fade-in">
            <Check className="w-4 h-4" />
            <span>Preferences saved</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: User Profile Card */}
        <div className="space-y-6">
          <Card3DTilt maxTilt={5} scale={1.01} glowColor="rgba(20, 184, 166, 0.15)">
            <div className="glass-card p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black text-2xl shadow-xl shadow-teal-500/20 mb-4 font-['Outfit']">
                {displayName.charAt(0).toUpperCase()}
              </div>

              <h3 className="text-lg font-bold text-white font-['Outfit']">{displayName}</h3>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 mb-4">
                <Mail className="w-3.5 h-3.5 text-teal-400" />
                <span>{displayEmail}</span>
              </p>

              <div className="w-full bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-left text-xs space-y-2 mb-5">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Account Status</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Verified Active
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Security Tier</span>
                  <span className="text-cyan-400 font-semibold font-mono">JWT Bearer</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>ML Telemetry Access</span>
                  <span className="text-slate-200 font-medium">Standard Global</span>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of AirSense AI</span>
              </button>
            </div>
          </Card3DTilt>

          {/* Quick Platform Info */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800 text-xs space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>AirSense AI Platform</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Air quality estimates are generated using ECMWF atmospheric models, NOAA global data streams, and localized OSRM road geometry.
            </p>
          </div>
        </div>

        {/* Right 2 Columns: Application Preferences Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSavePreferences} className="space-y-6">
            {/* Preferences Card */}
            <div className="glass-card p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-400" />
                <span>Location & Units</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Default City */}
                <div>
                  <label className="text-xs text-slate-300 block mb-1.5 font-medium">
                    Default Active City
                  </label>
                  <input
                    type="text"
                    value={defaultCity}
                    onChange={(e) => setDefaultCity(e.target.value)}
                    placeholder="e.g. Delhi, London, Tokyo..."
                    className="w-full bg-slate-900/90 text-slate-100 text-xs rounded-xl p-3 border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    City loaded when signing into dashboard
                  </span>
                </div>

                {/* Temperature Unit */}
                <div>
                  <label className="text-xs text-slate-300 block mb-1.5 font-medium">
                    Temperature Measurement Unit
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTempUnit('C')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        tempUnit === 'C'
                          ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-sm'
                          : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <Thermometer className="w-3.5 h-3.5" />
                      <span>Celsius (°C)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTempUnit('F')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        tempUnit === 'F'
                          ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-sm'
                          : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <Thermometer className="w-3.5 h-3.5" />
                      <span>Fahrenheit (°F)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications & System Preferences */}
            <div className="glass-card p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Bell className="w-4 h-4 text-teal-400" />
                <span>Notification Preferences</span>
              </h3>

              <div className="flex items-center justify-between p-3.5 bg-slate-900/70 rounded-xl border border-slate-800">
                <div>
                  <span className="text-xs font-bold text-white block">Environmental Threshold Alerts</span>
                  <span className="text-[11px] text-slate-400">
                    Receive active notifications when AQI exceeds selected health guidelines
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    notificationsEnabled ? 'bg-teal-500' : 'bg-slate-800'
                  }`}
                  aria-label="Toggle notifications"
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      notificationsEnabled ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Appearance Theme Card */}
            <div className="glass-card p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Moon className="w-4 h-4 text-teal-400" />
                <span>Appearance & Theme</span>
              </h3>

              <div className="p-3.5 bg-slate-900/70 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Dark Atmospheric Theme</span>
                  <span className="text-[11px] text-slate-400">High-contrast, eye-friendly environmental palette</span>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30">
                  Active (Default)
                </span>
              </div>
            </div>

            {/* Save Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 active:scale-[0.99] transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Platform Preferences</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
