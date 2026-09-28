import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Navigation/Sidebar';
import BottomNav from './components/Navigation/BottomNav';
import LandingPage from './components/Landing/LandingPage';
import LoginPage from './components/Auth/LoginPage';
import RegisterPage from './components/Auth/RegisterPage';
import DashboardTab from './components/Dashboard/DashboardTab';
import MLForecastTab from './components/Charts/MLForecastTab';
import HeatMapTab from './components/HeatMap/HeatMapTab';
import RoutePlannerTab from './components/RoutePlanner/RoutePlannerTab';
import AlertsTab from './components/Alerts/AlertsTab';
import SettingsTab from './components/Settings/SettingsTab';
import { 
  fetchCurrentAQI, 
  fetchAQIHistory, 
  fetchPrediction, 
  fetchHeatmapPoints,
  getAuthSession,
  clearAuthSession
} from './services/api';

export default function App() {
  // Authentication State
  const [authSession, setAuthSessionState] = useState(() => getAuthSession());
  const isAuthenticated = Boolean(authSession.token);

  // View state: 'landing' | 'login' | 'register' | 'app'
  const [currentView, setCurrentView] = useState(() => {
    const session = getAuthSession();
    return session.token ? 'app' : 'landing';
  });

  // Protected App active tab: 'dashboard' | 'forecast' | 'heatmap' | 'route' | 'alerts' | 'settings'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCity, setSelectedCity] = useState(() => {
    return localStorage.getItem('airsense_default_city') || 'delhi';
  });
  const [selectedLocation, setSelectedLocation] = useState({
    city: 'Delhi',
    latitude: 28.6139,
    longitude: 77.2090,
    region: 'Delhi',
    country: 'India'
  });

  // Telemetry data states
  const [currentAQI, setCurrentAQI] = useState(null);
  const [historyAQI, setHistoryAQI] = useState([]);
  const [predictionData, setPredictionData] = useState(null);
  const [heatmapPoints, setHeatmapPoints] = useState([]);
  const [isLoadingCityData, setIsLoadingCityData] = useState(false);
  const [loadingStage, setLoadingStage] = useState(null);

  const loadCityData = useCallback(async (location) => {
    setIsLoadingCityData(true);
    const isObj = typeof location === 'object' && location !== null;
    const cityKey = isObj ? (location.city || 'delhi') : (location || 'delhi');
    const lat = isObj ? location.latitude : undefined;
    const lng = isObj ? location.longitude : undefined;
    const cityName = isObj ? (location.city || cityKey) : cityKey;

    try {
      // Step 1: Finding air-quality data
      setLoadingStage({
        step: 1,
        message: `Finding air-quality data for ${cityName}...`
      });

      const [curr, hist] = await Promise.all([
        fetchCurrentAQI(cityKey, lat, lng, cityName),
        fetchAQIHistory(cityKey, 24, lat, lng)
      ]);
      setCurrentAQI(curr);
      setHistoryAQI(hist);

      // Step 2: Loading weather data
      setLoadingStage({
        step: 2,
        message: 'Loading weather data...'
      });

      await new Promise((r) => setTimeout(r, 200));

      // Step 3: Preparing AQI forecast
      setLoadingStage({
        step: 3,
        message: 'Preparing AQI forecast...'
      });

      const centerLat = lat !== undefined ? lat : (curr?.lat || 28.6139);
      const centerLng = lng !== undefined ? lng : (curr?.lng || 77.2090);

      const [pred, maps] = await Promise.all([
        fetchPrediction(cityKey, lat, lng, cityName),
        fetchHeatmapPoints(centerLat, centerLng)
      ]);
      setPredictionData(pred);
      setHeatmapPoints(maps);
    } catch (err) {
      console.error('Error fetching city data:', err);
    } finally {
      setIsLoadingCityData(false);
      setLoadingStage(null);
    }
  }, []);

  const handleSelectLocation = useCallback((loc) => {
    if (!loc) return;
    setSelectedLocation(loc);
    setSelectedCity(loc.city);
    loadCityData(loc);
  }, [loadCityData]);

  // Initial load
  useEffect(() => {
    loadCityData(selectedLocation);
  }, []);

  // Handle successful login or registration
  const handleAuthSuccess = (user) => {
    const session = getAuthSession();
    setAuthSessionState(session);
    setCurrentView('app');
    setActiveTab('dashboard');
    if (!currentAQI) {
      loadCityData(selectedCity);
    }
  };

  // Handle logout
  const handleLogout = () => {
    clearAuthSession();
    setAuthSessionState({ token: null, user: null });
    setCurrentView('landing');
  };

  // Safe navigation wrapper: Protects dashboard/forecast/heatmap/route/alerts views
  const handleNavigateView = (view) => {
    if (view === 'app' && !isAuthenticated) {
      setCurrentView('login');
      return;
    }
    setCurrentView(view);
  };

  const handleSelectTab = (tabId) => {
    if (!isAuthenticated) {
      setCurrentView('login');
      return;
    }
    setCurrentView('app');
    setActiveTab(tabId);
  };

  const isAppShell = currentView === 'app' && isAuthenticated;

  return (
    <div className="min-h-screen atmospheric-bg text-slate-100 flex font-['Plus_Jakarta_Sans',sans-serif] relative selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Desktop Application Sidebar (Active only in Authenticated App View) */}
      {isAppShell && (
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedLocation={selectedLocation}
          selectedCity={selectedCity}
          user={authSession.user}
          onLogout={handleLogout}
        />
      )}

      {/* Main Content Area & Responsive Shell */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <Navbar
          isAuthenticated={isAuthenticated}
          user={authSession.user}
          currentView={currentView}
          setCurrentView={handleNavigateView}
          activeTab={activeTab}
          setActiveTab={handleSelectTab}
          selectedLocation={selectedLocation}
          onSelectLocation={handleSelectLocation}
          selectedCity={selectedCity}
          setSelectedCity={(city) => {
            setSelectedCity(city);
            loadCityData(city);
          }}
          onLogout={handleLogout}
        />

        {/* Page Container */}
        <main className={`flex-1 w-full p-4 sm:p-6 lg:p-8 ${isAppShell ? 'pb-24 md:pb-8' : ''}`}>
          {/* PUBLIC: Landing Page */}
          {currentView === 'landing' && (
            <div className="max-w-7xl mx-auto">
              <LandingPage
                onGetStarted={() => setCurrentView('register')}
                onLogin={() => setCurrentView('login')}
                onExploreMap={() => {
                  if (isAuthenticated) {
                    setCurrentView('app');
                    setActiveTab('heatmap');
                  } else {
                    setCurrentView('login');
                  }
                }}
                currentAQI={currentAQI}
                selectedLocation={selectedLocation}
              />
            </div>
          )}

          {/* PUBLIC: Login Page */}
          {currentView === 'login' && (
            <div className="max-w-6xl mx-auto">
              <LoginPage
                onLoginSuccess={handleAuthSuccess}
                onNavigateRegister={() => setCurrentView('register')}
                onNavigateHome={() => setCurrentView('landing')}
              />
            </div>
          )}

          {/* PUBLIC: Register Page */}
          {currentView === 'register' && (
            <div className="max-w-6xl mx-auto">
              <RegisterPage
                onRegisterSuccess={handleAuthSuccess}
                onNavigateLogin={() => setCurrentView('login')}
                onNavigateHome={() => setCurrentView('landing')}
              />
            </div>
          )}

          {/* PROTECTED: Authenticated App Tabs */}
          {currentView === 'app' && (
            <div className="max-w-7xl mx-auto">
              {!isAuthenticated ? (
                <div className="glass-card p-8 rounded-2xl border border-rose-500/30 text-center max-w-md mx-auto my-12 shadow-2xl">
                  <h3 className="text-lg font-bold text-white mb-2">Authentication Required</h3>
                  <p className="text-xs text-slate-400 mb-6">
                    Please sign in to access the AirSense AI monitoring suite, predictions, and cleaner routes.
                  </p>
                  <button
                    onClick={() => setCurrentView('login')}
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors cursor-pointer"
                  >
                    Proceed to Sign In
                  </button>
                </div>
              ) : (
                <>
                  {activeTab === 'dashboard' && (
                    <DashboardTab 
                      user={authSession.user}
                      currentData={currentAQI} 
                      historyData={historyAQI} 
                      predictionData={predictionData}
                      selectedLocation={selectedLocation}
                      isLoading={isLoadingCityData}
                      loadingStage={loadingStage}
                      onNavigateTab={setActiveTab}
                    />
                  )}

                  {activeTab === 'forecast' && (
                    <MLForecastTab 
                      predictionData={predictionData} 
                      selectedLocation={selectedLocation}
                      isLoading={isLoadingCityData}
                    />
                  )}

                  {activeTab === 'heatmap' && (
                    <HeatMapTab 
                      heatmapPoints={heatmapPoints} 
                      currentCity={selectedCity} 
                      selectedLocation={selectedLocation} 
                      isLoading={isLoadingCityData}
                    />
                  )}

                  {activeTab === 'route' && (
                    <RoutePlannerTab 
                      selectedLocation={selectedLocation}
                    />
                  )}

                  {activeTab === 'alerts' && (
                    <AlertsTab 
                      selectedCity={selectedCity} 
                      selectedLocation={selectedLocation}
                    />
                  )}

                  {activeTab === 'settings' && (
                    <SettingsTab
                      user={authSession.user}
                      selectedCity={selectedCity}
                      onSelectCity={(city) => {
                        setSelectedCity(city);
                        loadCityData(city);
                      }}
                      onLogout={handleLogout}
                    />
                  )}
                </>
              )}
            </div>
          )}
        </main>

        {/* Global Footer (shown on public landing or bottom of app) */}
        {!isAppShell && (
          <footer className="border-t border-slate-800/80 py-8 px-4 text-center text-xs text-slate-500 glass-card mt-16">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="font-bold text-slate-300">AirSense AI</span> — Predict Air. Plan Smart. Breathe Better.
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap justify-center">
                <span>FastAPI + XGBoost ML</span>
                <span>•</span>
                <span>React + Vite + Leaflet</span>
                <span>•</span>
                <span>JWT Secured</span>
                <span>•</span>
                <span>MongoDB Cloud Ready</span>
              </div>
            </div>
          </footer>
        )}

        {/* Mobile Bottom Navigation Dock in Authenticated App Mode */}
        {isAppShell && (
          <BottomNav 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
          />
        )}
      </div>
    </div>
  );
}
