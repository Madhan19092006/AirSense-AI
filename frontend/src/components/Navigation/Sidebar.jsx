import React from 'react';
import { 
  Wind, 
  Activity, 
  Cpu, 
  Map, 
  Navigation, 
  Bell, 
  Settings, 
  LogOut, 
  Radio,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  selectedLocation,
  selectedCity,
  user,
  onLogout
}) {
  const monitoringItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity, badge: null },
    { id: 'forecast', label: 'ML Forecast', icon: Cpu, badge: '24H' },
    { id: 'heatmap', label: 'Heatmap', icon: Map, badge: 'Live' },
  ];

  const intelligenceItems = [
    { id: 'route', label: 'Cleaner Route', icon: Navigation, badge: 'OSRM' },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: 'Active' },
  ];

  const cityName = selectedLocation?.city || selectedCity || 'Active Station';
  const regionName = selectedLocation?.region || selectedLocation?.country || 'Tamil Nadu';

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-950/80 border-r border-slate-800/60 backdrop-blur-2xl h-screen sticky top-0 shrink-0 z-40 select-none transition-all duration-300">
      {/* Brand Header with Premium Animated Logo */}
      <div className="p-5 border-b border-slate-800/50 flex items-center gap-3.5 relative overflow-hidden">
        {/* Ambient subtle logo glow */}
        <div className="absolute -top-4 -left-4 w-24 h-24 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-400 via-teal-500 to-cyan-500 p-[1.5px] shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-400/40 transition-all duration-300">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Wind className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 absolute -bottom-0.5 -right-0.5 animate-ping" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 absolute -bottom-0.5 -right-0.5" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-black tracking-tight text-white font-['Outfit']">
              AirSense<span className="text-emerald-400">.</span>ai
            </span>
          </div>
          <p className="text-[10px] font-medium text-slate-400 tracking-wider uppercase">
            Environmental Intelligence
          </p>
        </div>
      </div>

      {/* Main Navigation with Floating Glass Pills */}
      <div className="flex-1 py-4 px-3 space-y-5 overflow-y-auto">
        {/* Section 1: Monitoring */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center justify-between">
            <span>Monitoring</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
          </div>

          <div className="space-y-1">
            {monitoringItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer group text-left relative ${
                    isActive
                      ? 'glass-pill-active text-emerald-300'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 border border-transparent'
                  }`}
                >
                  {/* Floating active side indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-emerald-400 to-cyan-400 rounded-r-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  )}

                  <div className={`p-1.5 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-emerald-500/20 text-emerald-400 shadow-sm shadow-emerald-500/20' 
                      : 'text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800/40'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <span className="flex-1 font-medium">{item.label}</span>

                  {item.badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md font-mono ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Environmental Intelligence */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center justify-between">
            <span>Spatial & Alerts</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
          </div>

          <div className="space-y-1">
            {intelligenceItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer group text-left relative ${
                    isActive
                      ? 'glass-pill-active text-emerald-300'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 border border-transparent'
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-emerald-400 to-cyan-400 rounded-r-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  )}

                  <div className={`p-1.5 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-emerald-500/20 text-emerald-400 shadow-sm shadow-emerald-500/20' 
                      : 'text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800/40'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <span className="flex-1 font-medium">{item.label}</span>

                  {item.badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md font-mono ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: System & Preferences */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center justify-between">
            <span>Preferences</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer group text-left relative ${
                activeTab === 'settings'
                  ? 'glass-pill-active text-teal-300'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              {activeTab === 'settings' && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-teal-400 to-cyan-400 rounded-r-full shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
              )}

              <div className={`p-1.5 rounded-lg transition-colors ${
                activeTab === 'settings' ? 'bg-teal-500/20 text-teal-400' : 'text-slate-400 group-hover:text-slate-200'
              }`}>
                <Settings className="w-4 h-4" />
              </div>
              <span className="flex-1 font-medium">Settings</span>
            </button>

            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400/90 hover:text-rose-300 hover:bg-rose-500/10 transition-all duration-200 cursor-pointer border border-transparent hover:border-rose-500/20 text-left group"
            >
              <div className="p-1.5 rounded-lg text-rose-400/80 group-hover:text-rose-300">
                <LogOut className="w-4 h-4" />
              </div>
              <span className="flex-1 font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Live Node Indicator */}
      <div className="p-3.5 border-t border-slate-800/50 bg-slate-950/50">
        <div className="glass-panel p-2.5 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-slate-200 truncate">{cityName}</div>
              <div className="text-[9px] text-slate-500 truncate">{regionName}</div>
            </div>
          </div>
          <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            ONLINE
          </span>
        </div>
      </div>
    </aside>
  );
}
