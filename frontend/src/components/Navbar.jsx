import React, { useState, useEffect } from 'react';
import { 
  Wind, 
  Bell, 
  Settings, 
  User, 
  ArrowRight, 
  Sparkles,
  MapPin,
  Radio,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import GlobalCitySearch from './Search/GlobalCitySearch';

export default function Navbar({
  isAuthenticated,
  user,
  currentView,
  setCurrentView,
  activeTab,
  setActiveTab,
  selectedLocation,
  onSelectLocation,
  selectedCity,
  setSelectedCity,
  onLogout
}) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isAppMode = currentView === 'app' && isAuthenticated;

  const getPageInfo = () => {
    const cityName = selectedLocation?.city || selectedCity || 'Karur';
    const regionName = selectedLocation?.region ? `${selectedLocation.region}, ${selectedLocation.country || ''}` : (selectedLocation?.country || 'Tamil Nadu');

    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'AIR QUALITY OVERVIEW',
          context: `${cityName}, ${regionName}`
        };
      case 'forecast':
        return {
          title: 'AI AIR QUALITY FORECAST',
          context: `XGBoost Predictive Matrix · 24H Horizon`
        };
      case 'heatmap':
        return {
          title: 'GEOSPATIAL HEATMAP',
          context: `${cityName} · Atmospheric Raster & Station Grid`
        };
      case 'route':
        return {
          title: 'SMART ROUTE INTELLIGENCE',
          context: `Corridor Exposure Estimation via OSRM`
        };
      case 'alerts':
        return {
          title: 'AIR QUALITY ALERTS',
          context: `Automated Multi-Pollutant Thresholds`
        };
      case 'settings':
        return {
          title: 'SYSTEM SETTINGS',
          context: `Preferences, Models & User Configuration`
        };
      default:
        return {
          title: 'AIR QUALITY OVERVIEW',
          context: `${cityName}, ${regionName}`
        };
    }
  };

  const pageInfo = getPageInfo();
  const userName = user?.name || 'Madhan K';

  return (
    <header 
      className={`sticky top-0 z-30 px-4 lg:px-8 py-3.5 transition-all duration-300 border-b ${
        isScrolled 
          ? 'bg-slate-950/85 backdrop-blur-2xl border-slate-800/80 shadow-2xl shadow-slate-950/70' 
          : 'bg-slate-950/60 backdrop-blur-xl border-slate-800/40'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: PAGE TITLE & CONTEXTUAL DESCRIPTION (App Mode)               */}
        {/* or BRAND LOGO (Public Mode / Landing)                                     */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-3 shrink-0 min-w-0">
          {isAppMode ? (
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white font-['Outfit']">
                  {pageInfo.title}
                </h1>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="font-medium text-slate-300 truncate max-w-[220px] sm:max-w-none">
                  {pageInfo.context}
                </span>
              </div>
            </div>
          ) : (
            /* Public Landing Brand Logo */
            <div
              onClick={() => setCurrentView('landing')}
              className="flex items-center gap-3 cursor-pointer select-none group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-400 via-teal-500 to-cyan-500 p-[1.5px] shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-all duration-300">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Wind className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-white font-['Outfit']">
                  AirSense<span className="text-emerald-400">.</span>ai
                </span>
                <p className="text-[10px] font-semibold text-slate-400 hidden sm:block">
                  Environmental Intelligence
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* CENTER COLUMN: LARGE GLOBAL LOCATION SEARCH (App Mode)                     */}
        {/* or NAV LINKS (Public Mode)                                                */}
        {/* ========================================================================= */}
        {isAppMode ? (
          <div className="flex-1 max-w-xl mx-2 sm:mx-6">
            <GlobalCitySearch
              selectedLocation={selectedLocation || { city: selectedCity }}
              onSelectLocation={onSelectLocation || ((loc) => setSelectedCity && setSelectedCity(loc.city))}
              placeholder="Search any city worldwide..."
            />
          </div>
        ) : (
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-300">
            <button
              onClick={() => {
                if (currentView !== 'landing') {
                  setCurrentView('landing');
                  setTimeout(() => {
                    document.getElementById('live-telemetry-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                } else {
                  document.getElementById('live-telemetry-section')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Explore Air Quality
            </button>
            <button
              onClick={() => {
                if (isAuthenticated) {
                  setCurrentView('app');
                  setActiveTab('heatmap');
                } else {
                  setCurrentView('login');
                }
              }}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              View Live Map
            </button>
            <button
              onClick={() => {
                if (currentView !== 'landing') {
                  setCurrentView('landing');
                  setTimeout(() => {
                    document.getElementById('platform-features-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                } else {
                  document.getElementById('platform-features-section')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Platform
            </button>
          </nav>
        )}

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: LIVE TELEMETRY INDICATOR, NOTIFICATIONS, PROFILE (App Mode)  */}
        {/* or SIGN IN / GET STARTED (Public Mode)                                    */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-3 shrink-0">
          {isAppMode ? (
            <>
              {/* LIVE TELEMETRY INDICATOR */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-bold text-slate-300 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="tracking-wider text-emerald-400 font-mono text-[10px] uppercase">
                  Live Telemetry
                </span>
              </div>

              {/* NOTIFICATIONS SHORTCUT */}
              <button
                onClick={() => setActiveTab('alerts')}
                className={`relative p-2.5 rounded-xl border transition-all cursor-pointer ${
                  activeTab === 'alerts'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-md shadow-amber-500/10'
                    : 'glass-panel text-slate-300 hover:text-white hover:border-slate-700'
                }`}
                title="Air Quality Alerts & Notifications"
                aria-label="Alerts"
              >
                <Bell className="w-4 h-4" />
                <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-2 right-2 animate-ping" />
                <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-2 right-2" />
              </button>

              {/* USER PROFILE CHIP */}
              <div
                onClick={() => setActiveTab('settings')}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl glass-panel hover:border-slate-700 transition-all cursor-pointer group select-none"
                title="User Profile & Preferences"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black text-xs font-['Outfit'] shadow-sm">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-white block max-w-[110px] truncate leading-tight">
                    {userName}
                  </span>
                </div>
              </div>
            </>
          ) : (
            /* Public CTAs */
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setCurrentView('login')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900/80 transition-all cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => setCurrentView('register')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
