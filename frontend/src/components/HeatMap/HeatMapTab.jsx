import React, { useState, useEffect, useRef } from 'react';
import { 
  Map as MapIcon, 
  Layers, 
  Eye, 
  AlertCircle, 
  Compass, 
  Shield, 
  Sparkles,
  Info,
  Filter,
  MapPin,
  Crosshair,
  X,
  Sliders
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const CITY_COORDS = {
  karur: [10.9601, 78.0766],
  delhi: [28.6139, 77.2090],
  mumbai: [19.0760, 72.8777],
  bengaluru: [12.9716, 77.5946],
  newyork: [40.7128, -74.0060],
  london: [51.5074, -0.1278],
  tokyo: [35.6762, 139.6503]
};

const AQI_GRADIENT = {
  0.15: '#10B981', // Good (Emerald)
  0.30: '#F59E0B', // Moderate (Amber)
  0.50: '#F97316', // Sensitive (Orange)
  0.70: '#EF4444', // Unhealthy (Red)
  0.85: '#8B5CF6', // Very Unhealthy (Purple)
  1.0: '#881337'   // Hazardous (Maroon)
};

export default function HeatMapTab({ heatmapPoints, currentCity, selectedLocation, isLoading }) {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [heatRadius, setHeatRadius] = useState(32);
  const [activeMetric, setActiveMetric] = useState('AQI'); // 'AQI' | 'PM2.5' | 'PM10' | 'NO2'

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const heatLayerRef = useRef(null);
  const markersLayerGroupRef = useRef(null);

  const points = heatmapPoints || [];
  const cityName = selectedLocation?.city || currentCity || 'Active Area';
  const regionName = selectedLocation?.region || selectedLocation?.country || 'Tamil Nadu';

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (typeof window !== 'undefined' && !window.L) {
      window.L = L;
    }

    const defaultCenter = (selectedLocation?.latitude && selectedLocation?.longitude)
      ? [selectedLocation.latitude, selectedLocation.longitude]
      : (CITY_COORDS[cityName.toLowerCase()] || CITY_COORDS['delhi']);

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 11,
      zoomControl: false,
      attributionControl: false
    });

    // Dark styled OSM tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    // Zoom control in bottom-left or custom position
    L.control.zoom({ position: 'topright' }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerGroupRef.current = markersGroup;
    mapInstanceRef.current = map;

    const resizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(resizeTimer);
      map.remove();
      mapInstanceRef.current = null;
      heatLayerRef.current = null;
      markersLayerGroupRef.current = null;
    };
  }, []);

  // Update map center when currentCity or selectedLocation changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (selectedLocation?.latitude && selectedLocation?.longitude) {
      mapInstanceRef.current.flyTo([selectedLocation.latitude, selectedLocation.longitude], 11, {
        duration: 1.2,
        easeLinearity: 0.25
      });
      return;
    }
    const targetCenter = CITY_COORDS[cityName.toLowerCase()];
    if (targetCenter) {
      mapInstanceRef.current.flyTo(targetCenter, 11, {
        duration: 1.2,
        easeLinearity: 0.25
      });
    }
  }, [currentCity, selectedLocation, cityName]);

  // Update HeatLayer and Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    let isMounted = true;

    const setupLayers = async () => {
      // 1. Manage HeatLayer
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }

      if (showHeatmap && points.length > 0) {
        try {
          if (!L.heatLayer) {
            window.L = L;
            await import('leaflet.heat');
          }

          if (isMounted && L.heatLayer) {
            const heatData = points.map((p) => [
              p.lat,
              p.lng,
              Math.min(1.0, Math.max(0.1, p.aqi / 300))
            ]);

            const heat = L.heatLayer(heatData, {
              radius: heatRadius,
              blur: 24,
              maxZoom: 15,
              max: 1.0,
              minOpacity: 0.35,
              gradient: AQI_GRADIENT
            });

            heat.addTo(map);
            heatLayerRef.current = heat;
          }
        } catch (err) {
          console.error('Failed to load leaflet.heat:', err);
        }
      }

      // 2. Manage Station Markers
      if (markersLayerGroupRef.current) {
        markersLayerGroupRef.current.clearLayers();

        if (showMarkers && points.length > 0) {
          points.forEach((pt) => {
            const markerRadius = Math.max(6, Math.min(13, 6 + (pt.aqi / 45)));

            const marker = L.circleMarker([pt.lat, pt.lng], {
              radius: markerRadius,
              fillColor: pt.color || '#10B981',
              color: '#ffffff',
              weight: 1.5,
              opacity: 0.95,
              fillOpacity: 0.88
            });

            marker.on('click', () => {
              setSelectedPoint(pt);
            });

            markersLayerGroupRef.current.addLayer(marker);
          });
        }
      }
    };

    setupLayers();

    return () => {
      isMounted = false;
    };
  }, [points, showHeatmap, showMarkers, heatRadius]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      const targetCenter = (selectedLocation?.latitude && selectedLocation?.longitude)
        ? [selectedLocation.latitude, selectedLocation.longitude]
        : (CITY_COORDS[cityName.toLowerCase()] || CITY_COORDS['delhi']);
      mapInstanceRef.current.flyTo(targetCenter, 11, { duration: 1.0 });
    }
  };

  return (
    <div className="relative w-full h-[76vh] min-h-[620px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      {/* 1. DOMINANT MAP (Occupies entire viewport area) */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* ========================================================================= */}
      {/* 2. FLOATING GLASS OVERLAY: TOP-LEFT (Search / Active Location Badge)       */}
      {/* ========================================================================= */}
      <div className="absolute top-4 left-4 z-20 max-w-sm pointer-events-auto">
        <div className="glass-panel-elevated p-3.5 sm:p-4 rounded-2xl border border-slate-800 shadow-2xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
            <MapIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white font-['Outfit'] truncate">
                {cityName}
              </h2>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {regionName} · {points.length} telemetry stations
            </p>
          </div>
          <button
            onClick={handleRecenter}
            title="Recenter Map"
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <Crosshair className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FLOATING GLASS OVERLAY: TOP-RIGHT (Layer Selectors: AQI, PM2.5, ...)    */}
      {/* ========================================================================= */}
      <div className="absolute top-4 right-14 z-20 pointer-events-auto">
        <div className="glass-panel-elevated p-1.5 rounded-2xl border border-slate-800 shadow-2xl flex items-center gap-1.5">
          {['AQI', 'PM2.5', 'PM10', 'NO2'].map((m) => (
            <button
              key={m}
              onClick={() => setActiveMetric(m)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeMetric === m
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 shadow-md font-mono'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/80 font-mono'
              }`}
            >
              {m}
            </button>
          ))}

          <div className="h-4 w-[1px] bg-slate-800 mx-1" />

          {/* Toggle Heatmap */}
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            title="Toggle Continuous Heatmap Density"
            className={`p-2 rounded-xl transition-all border cursor-pointer ${
              showHeatmap
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                : 'bg-slate-900/80 text-slate-400 border-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Toggle Station Markers */}
          <button
            onClick={() => setShowMarkers(!showMarkers)}
            title="Toggle Station Markers"
            className={`p-2 rounded-xl transition-all border cursor-pointer ${
              showMarkers
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 shadow-sm'
                : 'bg-slate-900/80 text-slate-400 border-slate-800'
            }`}
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. FLOATING GLASS OVERLAY: BOTTOM-LEFT (Selected Location Information)     */}
      {/* ========================================================================= */}
      <div className="absolute bottom-4 left-4 z-20 max-w-sm pointer-events-auto">
        {selectedPoint ? (
          <div className="glass-panel-elevated p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-2xl relative animate-in fade-in slide-in-from-bottom-3 duration-200">
            <button
              onClick={() => setSelectedPoint(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
              Station Telemetry
            </span>
            <h3 className="text-lg font-bold text-white font-['Outfit'] pr-6">
              {selectedPoint.city}
            </h3>

            <div className="flex items-center gap-3 my-3">
              <span className="text-3xl font-black font-['Outfit'] text-white">
                {Math.round(selectedPoint.aqi)}
              </span>
              <div>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-950 uppercase tracking-wider block text-center"
                  style={{ backgroundColor: selectedPoint.color || '#10B981' }}
                >
                  {selectedPoint.category}
                </span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                  {selectedPoint.lat.toFixed(3)}°, {selectedPoint.lng.toFixed(3)}°
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>Authentic continuous reporting node.</span>
            </div>
          </div>
        ) : (
          <div className="glass-panel p-3.5 rounded-2xl border border-slate-800/90 shadow-xl flex items-center gap-2 text-xs text-slate-300">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Click any reporting station pin to inspect real-time sensor metrics.</span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. FLOATING GLASS OVERLAY: BOTTOM-RIGHT (AQI Legend)                       */}
      {/* ========================================================================= */}
      <div className="absolute bottom-4 right-4 z-20 pointer-events-auto">
        <div className="glass-panel-elevated p-2.5 sm:p-3 rounded-2xl border border-slate-800 shadow-2xl flex items-center gap-2 flex-wrap text-[11px]">
          {[
            { label: 'Good (0-50)', color: '#10B981' },
            { label: 'Moderate (51-100)', color: '#F59E0B' },
            { label: 'Sensitive (101-150)', color: '#F97316' },
            { label: 'Unhealthy (151-200)', color: '#EF4444' },
            { label: 'Hazardous (200+)', color: '#881337' }
          ].map((item) => (
            <span
              key={item.label}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 font-medium"
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="hidden sm:inline">{item.label}</span>
              <span className="sm:hidden">{item.label.split(' ')[0]}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
