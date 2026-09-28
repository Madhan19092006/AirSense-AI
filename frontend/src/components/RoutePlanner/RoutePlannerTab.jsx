import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Navigation,
  Clock,
  ShieldCheck,
  Zap,
  ArrowRight,
  ArrowLeftRight,
  CheckCircle2,
  AlertTriangle,
  Route,
  Layers,
  Eye,
  Compass,
  Sparkles,
  RefreshCw,
  MapPin,
  Search,
  X,
  Crosshair,
  LocateFixed,
  Info,
  Check,
  Plus,
  RotateCcw,
  Maximize2
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { compareRoutes, searchLocations } from '../../services/api';
import Card3DTilt from '../3D/Card3DTilt';

export default function RoutePlannerTab({ selectedLocation }) {
  // Origin State: Defaults strictly to currently selected location from header/global state
  const [origin, setOrigin] = useState(() => ({
    name: selectedLocation?.city || 'Karur',
    city: selectedLocation?.city || 'Karur',
    region: selectedLocation?.region || 'Tamil Nadu',
    country: selectedLocation?.country || 'India',
    latitude: selectedLocation?.latitude || 10.9601,
    longitude: selectedLocation?.longitude || 78.0766,
    timezone: selectedLocation?.timezone || 'Asia/Kolkata'
  }));

  // Sync origin whenever user switches global city in navbar
  useEffect(() => {
    if (selectedLocation?.latitude && selectedLocation?.longitude) {
      setOrigin({
        name: selectedLocation.city || 'Selected Location',
        city: selectedLocation.city || 'Selected Location',
        region: selectedLocation.region || '',
        country: selectedLocation.country || '',
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        timezone: selectedLocation.timezone || 'UTC'
      });
    }
  }, [selectedLocation]);

  // Destination State — Explicitly selected by user (NO hardcoded/random demo destinations)
  const [destination, setDestination] = useState(null);
  const [destInputText, setDestInputText] = useState('');
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [isSearchingDest, setIsSearchingDest] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [isEditingDestination, setIsEditingDestination] = useState(false);

  // Origin Customization State (Allows changing starting point or using GPS)
  const [isEditingOrigin, setIsEditingOrigin] = useState(false);
  const [originInputText, setOriginInputText] = useState('');
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);

  // Loading States:
  // 1 = Finding destination...
  // 2 = Finding road routes...
  // 3 = Analysing environmental data...
  // 4 = Comparing routes...
  // 5 = ✓ Route comparison ready
  const [loadingStep, setLoadingStep] = useState(null);
  const [loadingError, setLoadingError] = useState(null);

  // Calculated Route Results
  const [routeResult, setRouteResult] = useState(null);
  const [selectedRouteType, setSelectedRouteType] = useState('both'); // 'both' | 'cleaner' | 'fastest'
  const [showWaypoints, setShowWaypoints] = useState(true);

  // Leaflet map refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeLayersGroupRef = useRef(null);
  const destDropdownRef = useRef(null);
  const originDropdownRef = useRef(null);
  const destInputRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (destDropdownRef.current && !destDropdownRef.current.contains(e.target)) {
        setShowDestDropdown(false);
      }
      if (originDropdownRef.current && !originDropdownRef.current.contains(e.target)) {
        setShowOriginDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search for Destination worldwide
  useEffect(() => {
    const query = destInputText.trim();
    if (!isEditingDestination && destination) {
      return;
    }
    if (query.length < 2) {
      setDestSuggestions([]);
      setIsSearchingDest(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingDest(true);
      try {
        const results = await searchLocations(query, 8);
        setDestSuggestions(results || []);
        setShowDestDropdown(true);
      } catch (err) {
        console.warn('Destination search failed:', err);
        setDestSuggestions([]);
      } finally {
        setIsSearchingDest(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [destInputText, isEditingDestination, destination]);

  // Debounced search for Origin worldwide (if user changes origin)
  useEffect(() => {
    const query = originInputText.trim();
    if (!isEditingOrigin) {
      return;
    }
    if (query.length < 2) {
      setOriginSuggestions([]);
      setIsSearchingOrigin(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingOrigin(true);
      try {
        const results = await searchLocations(query, 8);
        setOriginSuggestions(results || []);
        setShowOriginDropdown(true);
      } catch (err) {
        console.warn('Origin search failed:', err);
        setOriginSuggestions([]);
      } finally {
        setIsSearchingOrigin(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [originInputText, isEditingOrigin]);

  // GPS Geolocation Handler
  const handleUseGPSLocation = () => {
    if (!navigator.geolocation) {
      setLoadingError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocatingGPS(true);
    setLoadingError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const res = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${lat.toFixed(2)},${lng.toFixed(2)}&count=1&language=en&format=json`
          );
          let detectedName = 'My Location';
          if (res.ok) {
            const data = await res.json();
            if (data.results && data.results[0]) {
              detectedName = data.results[0].name;
            }
          }
          const userOrigin = {
            name: detectedName || 'Current Location',
            city: detectedName || 'Current Location',
            region: 'GPS Coordinates',
            country: '',
            latitude: lat,
            longitude: lng,
            timezone: 'UTC'
          };
          setOrigin(userOrigin);
          setIsEditingOrigin(false);
          setOriginInputText('');
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([lat, lng], 13, { duration: 1.2 });
          }
        } catch {
          setOrigin({
            name: 'Current Location',
            city: 'Current Location',
            region: 'GPS Coordinates',
            country: '',
            latitude: lat,
            longitude: lng,
            timezone: 'UTC'
          });
          setIsEditingOrigin(false);
        } finally {
          setIsLocatingGPS(false);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsLocatingGPS(false);
        setLoadingError('Unable to access device GPS location. Please check browser permissions.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Reset origin to currently selected AirSense location
  const handleResetToSelectedLocation = () => {
    if (selectedLocation?.latitude && selectedLocation?.longitude) {
      const resetLoc = {
        name: selectedLocation.city || 'Selected Location',
        city: selectedLocation.city || 'Selected Location',
        region: selectedLocation.region || '',
        country: selectedLocation.country || '',
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        timezone: selectedLocation.timezone || 'UTC'
      };
      setOrigin(resetLoc);
      setIsEditingOrigin(false);
      setOriginInputText('');
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([resetLoc.latitude, resetLoc.longitude], 12, { duration: 1.0 });
      }
    }
  };

  // Swap Origin and Destination
  const handleSwapLocations = () => {
    if (!destination) return;
    const prevOrigin = { ...origin };
    const prevDest = { ...destination };
    setOrigin(prevDest);
    setDestination(prevOrigin);
    setDestInputText(`${prevOrigin.city}${prevOrigin.region ? ', ' + prevOrigin.region : ''}`);
    setIsEditingDestination(false);
    setRouteResult(null);
  };

  // Select Destination from search dropdown
  const handleSelectDestination = (item) => {
    // Store: name, region, country, latitude, longitude, timezone
    const destData = {
      name: item.name || item.city,
      city: item.city || item.name,
      region: item.region || item.admin1 || '',
      country: item.country || '',
      latitude: item.latitude,
      longitude: item.longitude,
      timezone: item.timezone || 'UTC'
    };
    setDestination(destData);
    setDestInputText(`${destData.city}${destData.region ? ', ' + destData.region : ''}${destData.country ? ', ' + destData.country : ''}`);
    setShowDestDropdown(false);
    setIsEditingDestination(false);
    setLoadingError(null);
    setRouteResult(null);

    // Smoothly fly map to frame origin and new destination
    if (mapInstanceRef.current && origin?.latitude && origin?.longitude) {
      const bounds = L.latLngBounds([
        [origin.latitude, origin.longitude],
        [destData.latitude, destData.longitude]
      ]);
      mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
    }
  };

  // Select Origin from search dropdown
  const handleSelectOrigin = (item) => {
    const originData = {
      name: item.name || item.city,
      city: item.city || item.name,
      region: item.region || item.admin1 || '',
      country: item.country || '',
      latitude: item.latitude,
      longitude: item.longitude,
      timezone: item.timezone || 'UTC'
    };
    setOrigin(originData);
    setIsEditingOrigin(false);
    setShowOriginDropdown(false);
    setOriginInputText('');
    setLoadingError(null);
    setRouteResult(null);

    if (mapInstanceRef.current) {
      if (destination?.latitude && destination?.longitude) {
        const bounds = L.latLngBounds([
          [originData.latitude, originData.longitude],
          [destination.latitude, destination.longitude]
        ]);
        mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
      } else {
        mapInstanceRef.current.flyTo([originData.latitude, originData.longitude], 12, { duration: 1.0 });
      }
    }
  };

  // Clear Destination Action
  const handleClearDestination = () => {
    setDestination(null);
    setDestInputText('');
    setDestSuggestions([]);
    setShowDestDropdown(false);
    setIsEditingDestination(false);
    setRouteResult(null);
    setLoadingError(null);
    if (mapInstanceRef.current && origin?.latitude && origin?.longitude) {
      mapInstanceRef.current.flyTo([origin.latitude, origin.longitude], 12, { duration: 1.0 });
    }
  };

  // Add Destination Action (focuses search or selects first suggestion)
  const handleAddDestinationAction = () => {
    if (destSuggestions.length > 0) {
      handleSelectDestination(destSuggestions[0]);
    } else {
      setIsEditingDestination(true);
      setTimeout(() => {
        if (destInputRef.current) {
          destInputRef.current.focus();
        }
      }, 50);
    }
  };

  // Fit Route Bounds Helper
  const handleFitRouteBounds = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routeResult && routeResult.available !== false) {
      const allCoords = [
        ...(routeResult.fastest_route?.coordinates || []),
        ...(routeResult.cleaner_route?.coordinates || [])
      ];
      if (allCoords.length > 0) {
        const bounds = L.latLngBounds(allCoords);
        map.fitBounds(bounds, { padding: [60, 60] });
        return;
      }
    }

    if (origin?.latitude && destination?.latitude) {
      const bounds = L.latLngBounds([
        [origin.latitude, origin.longitude],
        [destination.latitude, destination.longitude]
      ]);
      map.fitBounds(bounds, { padding: [60, 60] });
    } else if (origin?.latitude) {
      map.flyTo([origin.latitude, origin.longitude], 12, { duration: 1.0 });
    }
  };

  // Main Action: Find Cleaner Route with Exact 4 Sequential Loading Stages
  const handleFindCleanerRoute = async () => {
    if (!origin?.latitude || !origin?.longitude) {
      setLoadingError('Starting location is missing valid coordinates.');
      return;
    }
    if (!destination?.latitude || !destination?.longitude) {
      setLoadingError('Please search and select a destination first.');
      return;
    }

    setLoadingError(null);
    setRouteResult(null);

    try {
      // Stage 1: Finding destination...
      setLoadingStep(1);
      await new Promise((r) => setTimeout(r, 400));

      // Stage 2: Finding road routes...
      setLoadingStep(2);
      await new Promise((r) => setTimeout(r, 450));

      // Stage 3: Analysing environmental data...
      setLoadingStep(3);

      const payload = {
        start_lat: origin.latitude,
        start_lng: origin.longitude,
        end_lat: destination.latitude,
        end_lng: destination.longitude,
        start_name: origin.city || origin.name || 'Origin',
        end_name: destination.city || destination.name || 'Destination'
      };

      // Stage 4: Comparing routes...
      setLoadingStep(4);
      const data = await compareRoutes(payload);

      if (!data || data.available === false) {
        setLoadingError(data?.error_message || 'Unable to calculate road routes between these locations.');
        setLoadingStep(null);
        return;
      }

      // Stage 5: ✓ Route comparison ready
      setLoadingStep(5);
      setRouteResult(data);
      setSelectedRouteType('both');
      setTimeout(() => setLoadingStep(null), 1200);
    } catch (err) {
      console.error('Route calculation error:', err);
      setLoadingError('Route calculation service is currently unavailable. Please verify connectivity or try another corridor.');
      setLoadingStep(null);
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialLat = origin?.latitude || 10.9601;
    const initialLng = origin?.longitude || 78.0766;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 12,
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" class="text-slate-400">OpenStreetMap</a>'
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    const layersGroup = L.layerGroup().addTo(map);
    routeLayersGroupRef.current = layersGroup;
    mapInstanceRef.current = map;

    const resizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(resizeTimer);
      map.remove();
      mapInstanceRef.current = null;
      routeLayersGroupRef.current = null;
    };
  }, []);

  // Update Leaflet map layers when routeResult, markers, or selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = routeLayersGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // Custom Map Markers
    const createOriginIcon = (label) =>
      L.divIcon({
        className: 'airsense-custom-pin',
        html: `
          <div style="display: flex; align-items: center; gap: 6px; background: rgba(16, 185, 129, 0.95); color: #022c22; font-weight: 800; font-size: 11px; padding: 4px 10px; border-radius: 9999px; border: 2px solid #ffffff; box-shadow: 0 0 16px rgba(16, 185, 129, 0.85); white-space: nowrap; transform: translate(-50%, -50%);">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: #ffffff; box-shadow: 0 0 6px #fff;"></span>
            <span>📍 ${label}</span>
          </div>
        `,
        iconSize: [60, 24],
        iconAnchor: [30, 12]
      });

    const createDestIcon = (label) =>
      L.divIcon({
        className: 'airsense-custom-pin',
        html: `
          <div style="display: flex; align-items: center; gap: 6px; background: rgba(6, 182, 212, 0.95); color: #083344; font-weight: 800; font-size: 11px; padding: 4px 10px; border-radius: 9999px; border: 2px solid #ffffff; box-shadow: 0 0 16px rgba(6, 182, 212, 0.85); white-space: nowrap; transform: translate(-50%, -50%);">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: #ffffff; box-shadow: 0 0 6px #fff;"></span>
            <span>🏁 ${label}</span>
          </div>
        `,
        iconSize: [60, 24],
        iconAnchor: [30, 12]
      });

    // 1. IF NO CALCULATED ROUTE YET: Render simple markers for Origin and Destination
    if (!routeResult || routeResult.available === false) {
      if (origin?.latitude && origin?.longitude) {
        const startMarker = L.marker([origin.latitude, origin.longitude], {
          icon: createOriginIcon(origin.city || 'Starting Point')
        }).bindPopup(`<b>Starting Point</b><br/>${origin.city}, ${origin.region || ''} ${origin.country || ''}`);
        layerGroup.addLayer(startMarker);
      }

      if (destination?.latitude && destination?.longitude) {
        const destMarker = L.marker([destination.latitude, destination.longitude], {
          icon: createDestIcon(destination.city || 'Destination')
        }).bindPopup(`<b>Destination</b><br/>${destination.city}, ${destination.region || ''} ${destination.country || ''}`);
        layerGroup.addLayer(destMarker);

        if (origin?.latitude && origin?.longitude) {
          const bounds = L.latLngBounds([
            [origin.latitude, origin.longitude],
            [destination.latitude, destination.longitude]
          ]);
          map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
        }
      }
      return;
    }

    // 2. RENDER REAL ROAD ROUTE RESULTS
    const { fastest_route, cleaner_route } = routeResult;
    const coordsFastest = fastest_route?.coordinates || [];
    const coordsCleaner = cleaner_route?.coordinates || [];

    if (coordsFastest.length === 0 && coordsCleaner.length === 0) return;

    // Start & Destination Markers
    const startPt = coordsFastest[0] || coordsCleaner[0];
    const endPt = coordsFastest[coordsFastest.length - 1] || coordsCleaner[coordsCleaner.length - 1];

    if (startPt) {
      const startMarker = L.marker(startPt, {
        icon: createOriginIcon(origin.city || 'Starting Point')
      }).bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #fff;">
          <div style="font-weight: 800; color: #10B981; margin-bottom: 2px;">📍 Starting Point</div>
          <div>${origin.city}, ${origin.region || ''} ${origin.country || ''}</div>
        </div>
      `);
      layerGroup.addLayer(startMarker);
    }

    if (endPt) {
      const endMarker = L.marker(endPt, {
        icon: createDestIcon(destination?.city || 'Destination')
      }).bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #fff;">
          <div style="font-weight: 800; color: #06b6d4; margin-bottom: 2px;">🏁 Trip Destination</div>
          <div>${destination?.city || ''}, ${destination?.region || ''} ${destination?.country || ''}</div>
        </div>
      `);
      layerGroup.addLayer(endMarker);
    }

    const isFastestVisible = selectedRouteType === 'both' || selectedRouteType === 'fastest';
    const isFastestHighlighted = selectedRouteType === 'fastest';
    const isCleanerVisible = selectedRouteType === 'both' || selectedRouteType === 'cleaner';
    const isCleanerHighlighted = selectedRouteType === 'cleaner';

    // DRAW FASTEST ROUTE (🟡 Amber)
    if (isFastestVisible && coordsFastest.length > 1) {
      const fastestPolyline = L.polyline(coordsFastest, {
        color: '#F59E0B',
        weight: isFastestHighlighted ? 8 : 4.5,
        opacity: isFastestHighlighted ? 1.0 : selectedRouteType === 'both' ? 0.75 : 0.25,
        dashArray: isFastestHighlighted ? null : '6, 6',
        lineCap: 'round',
        lineJoin: 'round'
      });

      fastestPolyline.on('click', () => {
        setSelectedRouteType(selectedRouteType === 'fastest' ? 'both' : 'fastest');
      });

      fastestPolyline.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #fff; padding: 2px;">
          <div style="font-weight: 800; color: #F59E0B; margin-bottom: 4px;">🟡 Fastest Route</div>
          <div>⏱ <b>${fastest_route.duration_min} min</b> · 📏 <b>${fastest_route.distance_km} km</b></div>
          ${
            fastest_route.exposure_score !== null
              ? `<div style="margin-top: 4px;">Pollution Exposure: <b style="color: #F59E0B;">${fastest_route.exposure_score} AQI</b></div>`
              : `<div style="margin-top: 4px; color: #94a3b8;">Pollution data coverage insufficient</div>`
          }
          <div style="font-size: 10px; color: #cbd5e1; margin-top: 4px;">Click route to highlight</div>
        </div>
      `);
      layerGroup.addLayer(fastestPolyline);
    }

    // DRAW CLEANER ROUTE (🟢 Emerald)
    if (isCleanerVisible && coordsCleaner.length > 1) {
      if (cleaner_route.segments && cleaner_route.segments.length > 0) {
        cleaner_route.segments.forEach((seg, sIdx) => {
          const segColor =
            seg.aqi <= 50 ? '#10B981' : seg.aqi <= 100 ? '#F59E0B' : '#EF4444';
          const segPolyline = L.polyline(seg.coords, {
            color: segColor,
            weight: isCleanerHighlighted ? 9 : 6,
            opacity: isCleanerHighlighted ? 1.0 : selectedRouteType === 'both' ? 0.95 : 0.3,
            lineCap: 'round',
            lineJoin: 'round'
          });

          segPolyline.on('click', () => {
            setSelectedRouteType(selectedRouteType === 'cleaner' ? 'both' : 'cleaner');
          });

          segPolyline.bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; color: #fff; padding: 2px;">
              <div style="font-weight: 800; color: ${segColor}; margin-bottom: 4px;">🟢 Cleaner Route · Segment ${sIdx + 1}</div>
              <div>Measured AQI: <b style="color: ${segColor};">${seg.aqi} AQI</b> (${seg.category})</div>
              <div>Route Total: <b>${cleaner_route.duration_min} min</b> · <b>${cleaner_route.distance_km} km</b></div>
            </div>
          `);
          layerGroup.addLayer(segPolyline);
        });
      } else {
        const cleanerPolyline = L.polyline(coordsCleaner, {
          color: '#10B981',
          weight: isCleanerHighlighted ? 9 : 6,
          opacity: isCleanerHighlighted ? 1.0 : selectedRouteType === 'both' ? 0.95 : 0.3,
          lineCap: 'round',
          lineJoin: 'round'
        });

        cleanerPolyline.on('click', () => {
          setSelectedRouteType(selectedRouteType === 'cleaner' ? 'both' : 'cleaner');
        });

        cleanerPolyline.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #fff; padding: 2px;">
            <div style="font-weight: 800; color: #10B981; margin-bottom: 4px;">🟢 Cleaner Route</div>
            <div>⏱ <b>${cleaner_route.duration_min} min</b> · 📏 <b>${cleaner_route.distance_km} km</b></div>
            ${
              cleaner_route.exposure_score !== null
                ? `<div style="margin-top: 4px;">Pollution Exposure: <b style="color: #10B981;">${cleaner_route.exposure_score} AQI</b></div>`
                : ''
            }
            <div style="font-size: 10px; color: #cbd5e1; margin-top: 4px;">Click route to highlight</div>
          </div>
        `);
        layerGroup.addLayer(cleanerPolyline);
      }
    }

    // DRAW CHECKPOINT WAYPOINT SAMPLING DOTS
    if (showWaypoints) {
      if (isCleanerVisible && cleaner_route.waypoints) {
        cleaner_route.waypoints.forEach((wp, idx) => {
          const wpColor =
            wp.aqi <= 50 ? '#10B981' : wp.aqi <= 100 ? '#F59E0B' : '#EF4444';
          const wpMarker = L.circleMarker([wp.lat, wp.lng], {
            radius: 5,
            fillColor: wpColor,
            color: '#ffffff',
            weight: 1.5,
            fillOpacity: 0.95
          }).bindTooltip(`Cleaner Pt #${idx + 1}: ${wp.aqi} AQI`, { direction: 'top', offset: [0, -6] });
          layerGroup.addLayer(wpMarker);
        });
      }

      if (isFastestVisible && fastest_route.waypoints) {
        fastest_route.waypoints.forEach((wp, idx) => {
          const wpColor =
            wp.aqi <= 50 ? '#10B981' : wp.aqi <= 100 ? '#F59E0B' : '#EF4444';
          const wpMarker = L.circleMarker([wp.lat, wp.lng], {
            radius: 4,
            fillColor: wpColor,
            color: '#F59E0B',
            weight: 1.2,
            fillOpacity: 0.85
          }).bindTooltip(`Fastest Pt #${idx + 1}: ${wp.aqi} AQI`, { direction: 'top', offset: [0, -5] });
          layerGroup.addLayer(wpMarker);
        });
      }
    }

    // Auto-fit bounds of all road coordinates
    const allCoords = [...coordsFastest, ...coordsCleaner];
    if (allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [routeResult, origin, destination, selectedRouteType, showWaypoints]);

  const hasRouteResult = Boolean(routeResult && routeResult.available !== false && routeResult.fastest_route);
  const hasPollutionCoverage = Boolean(routeResult && routeResult.has_pollution_data);
  const isCleanerAlsoFastest = Boolean(routeResult?.savings?.is_cleaner_also_faster);

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP CONTROLS PANEL: Exact Layout requested                             */}
      {/* ┌──────────────────────────────────────────┐                             */}
      {/* │ 📍 From                                  │                             */}
      {/* │ Karur, Tamil Nadu, India                 │                             */}
      {/* │                                          │                             */}
      {/* │ 🔍 To                                    │                             */}
      {/* │ Search destination...                    │                             */}
      {/* │                                          │                             */}
      {/* │        [ Find Cleaner Route ]             │                             */}
      {/* └──────────────────────────────────────────┘                             */}
      {/* ========================================================================= */}
      <div className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Ambient atmospheric glow */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header Description */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold text-white font-['Outfit'] flex items-center gap-2">
                <Navigation className="w-5 h-5 text-emerald-400" />
                SMART ROUTE INTELLIGENCE
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Find a route with lower estimated pollution exposure.
              </p>
            </div>

            {/* Quick helper controls */}
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={handleResetToSelectedLocation}
                title={`Reset to active app city (${selectedLocation?.city || 'Karur'})`}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Use app city</span>
              </button>
              <button
                onClick={handleUseGPSLocation}
                disabled={isLocatingGPS}
                title="Use device GPS coordinates"
                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <LocateFixed className={`w-3.5 h-3.5 ${isLocatingGPS ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isLocatingGPS ? 'Locating...' : 'GPS'}</span>
              </button>
            </div>
          </div>

          {/* 📍 FROM: Origin Block */}
          <div className="space-y-1.5" ref={originDropdownRef}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5 tracking-wide">
                <MapPin className="w-3.5 h-3.5" /> From
              </span>
              {!isEditingOrigin && (
                <button
                  onClick={() => {
                    setIsEditingOrigin(true);
                    setOriginInputText('');
                  }}
                  className="text-[11px] text-slate-400 hover:text-emerald-400 font-medium transition-colors"
                >
                  Change origin
                </button>
              )}
            </div>

            {!isEditingOrigin ? (
              <div
                onClick={() => {
                  setIsEditingOrigin(true);
                  setOriginInputText('');
                }}
                className="w-full bg-slate-900/90 hover:bg-slate-900 border border-slate-700/80 hover:border-emerald-500/50 rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer transition-colors group shadow-inner"
              >
                <div className="flex items-center gap-3 truncate">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 shadow-sm shadow-emerald-400" />
                  <div className="truncate">
                    <span className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {origin.city}
                    </span>
                    {(origin.region || origin.country) && (
                      <span className="text-xs text-slate-400 ml-2">
                        {[origin.region, origin.country].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-slate-500 group-hover:text-slate-300 font-medium shrink-0 ml-2">
                  Edit
                </span>
              </div>
            ) : (
              <div className="relative">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    autoFocus
                    value={originInputText}
                    onChange={(e) => setOriginInputText(e.target.value)}
                    placeholder="Search origin city or region worldwide..."
                    className="w-full bg-slate-900 border border-emerald-500/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 shadow-inner pr-16"
                  />
                  {isSearchingOrigin && (
                    <div className="absolute right-9 w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  )}
                  <button
                    onClick={() => {
                      setIsEditingOrigin(false);
                      setOriginInputText('');
                    }}
                    className="absolute right-3 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Origin Autocomplete Dropdown */}
                {showOriginDropdown && originSuggestions.length > 0 && (
                  <div className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-slate-800/80">
                    {originSuggestions.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectOrigin(item)}
                        className="px-4 py-2.5 hover:bg-slate-800 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <div>
                            <span className="text-xs font-bold text-white mr-1.5">{item.city}</span>
                            <span className="text-[11px] text-slate-400">
                              {[item.region, item.country].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] text-emerald-400 font-semibold shrink-0">Select</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 🔍 TO: Destination Block */}
          <div className="space-y-1.5" ref={destDropdownRef}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-cyan-400 flex items-center gap-1.5 tracking-wide">
                <Search className="w-3.5 h-3.5" /> To
              </span>
              {destination && (
                <button
                  onClick={handleClearDestination}
                  className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear destination
                </button>
              )}
            </div>

            {destination && !isEditingDestination ? (
              <div className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-3 truncate">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0 shadow-sm shadow-cyan-400" />
                  <div className="truncate">
                    <span className="text-sm font-bold text-white">
                      {destination.city}
                    </span>
                    {(destination.region || destination.country) && (
                      <span className="text-xs text-slate-400 ml-2">
                        {[destination.region, destination.country].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <button
                    onClick={() => {
                      setIsEditingDestination(true);
                      setDestInputText(destination.city);
                      setTimeout(() => {
                        if (destInputRef.current) destInputRef.current.focus();
                      }, 50);
                    }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                  >
                    Change
                  </button>
                  <button
                    onClick={handleClearDestination}
                    className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold transition-colors"
                  >
                    Clear destination
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="relative flex items-center">
                  <input
                    ref={destInputRef}
                    type="text"
                    value={destInputText}
                    onChange={(e) => {
                      setDestInputText(e.target.value);
                      if (!e.target.value) {
                        setDestination(null);
                      }
                    }}
                    onFocus={() => {
                      if (destSuggestions.length > 0) setShowDestDropdown(true);
                    }}
                    placeholder="Search destination..."
                    className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500/80 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 shadow-inner pr-36"
                  />

                  <div className="absolute right-2.5 flex items-center gap-1.5">
                    {isSearchingDest ? (
                      <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mr-1" />
                    ) : null}

                    {destInputText.trim() && (
                      <button
                        onClick={handleAddDestinationAction}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Add destination</span>
                      </button>
                    )}

                    {destination && (
                      <button
                        onClick={handleClearDestination}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Clear destination"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Destination Autocomplete Suggestions: Shows City, Region/State, Country */}
                {showDestDropdown && destSuggestions.length > 0 && (
                  <div className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto divide-y divide-slate-800/80">
                    <div className="px-3.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/80">
                      Worldwide Search Results
                    </div>
                    {destSuggestions.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectDestination(item)}
                        className="px-4 py-2.5 hover:bg-slate-800 cursor-pointer flex items-center justify-between transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <div className="truncate">
                            <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors mr-2">
                              {item.city}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {[item.region, item.country].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] text-cyan-400 font-semibold shrink-0 ml-2 group-hover:underline">
                          Select
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Swap or Clear Shortcuts Row */}
          <div className="flex items-center justify-between text-xs pt-1">
            <button
              onClick={handleSwapLocations}
              disabled={!destination}
              className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Swap Origin & Destination</span>
            </button>

            {destination && (
              <button
                onClick={handleClearDestination}
                className="text-slate-400 hover:text-rose-400 transition-colors"
              >
                Clear destination
              </button>
            )}
          </div>

          {/* [ Find Cleaner Route ] Action Button */}
          <div className="pt-2">
            <button
              onClick={handleFindCleanerRoute}
              disabled={!destination || loadingStep !== null}
              className={`w-full py-4 rounded-xl font-black text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2.5 shadow-xl ${
                destination && loadingStep === null
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/25 ring-1 ring-emerald-400 cursor-pointer active:scale-[0.99]'
                  : 'bg-slate-800 text-slate-500 border border-slate-700/80 cursor-not-allowed'
              }`}
            >
              <Navigation className="w-5 h-5" />
              <span>{loadingStep !== null ? 'Analysing Road Routes...' : 'FIND CLEANER ROUTE'}</span>
            </button>

            {!destination && (
              <p className="text-center text-[11px] text-slate-500 mt-2">
                Search and select any destination worldwide to enable route comparison.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SEQUENTIAL LOADING STATES: Exact 4 Steps + Ready                      */}
      {/* Finding destination...                                                    */}
      {/* Finding road routes...                                                    */}
      {/* Analysing environmental data...                                           */}
      {/* Comparing routes...                                                       */}
      {/* Then: ✓ Route comparison ready                                            */}
      {/* ========================================================================= */}
      {loadingStep !== null && (
        <div className="glass-card p-5 rounded-2xl border border-teal-500/40 bg-teal-950/20 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Real-Road Environmental Routing Engine
            </span>
            <span className="text-xs font-mono text-slate-400">
              {loadingStep <= 4 ? `Step ${loadingStep} of 4` : 'Ready'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            {[
              { num: 1, label: '🔍 Finding destination...', done: loadingStep > 1, active: loadingStep === 1 },
              { num: 2, label: '🛣️ Finding road routes...', done: loadingStep > 2, active: loadingStep === 2 },
              { num: 3, label: '🌫️ Analysing environmental data...', done: loadingStep > 3, active: loadingStep === 3 },
              { num: 4, label: '⚖️ Comparing routes...', done: loadingStep > 4, active: loadingStep === 4 }
            ].map((st) => (
              <div
                key={st.num}
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                  st.done
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : st.active
                    ? 'bg-teal-500/25 border-teal-400 text-white shadow-md ring-1 ring-teal-400/50 animate-pulse'
                    : 'bg-slate-900/60 border-slate-800 text-slate-500'
                }`}
              >
                <span>{st.label}</span>
              </div>
            ))}
          </div>

          {loadingStep === 5 && (
            <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-center text-xs font-bold text-emerald-300 flex items-center justify-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>✓ Route comparison ready</span>
            </div>
          )}
        </div>
      )}

      {/* Error / Alert Display */}
      {loadingError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{loadingError}</span>
          </div>
          <button
            onClick={handleFindCleanerRoute}
            disabled={!destination}
            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-lg text-xs font-bold transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Notice Banner: Insufficient Air Quality Coverage */}
      {routeResult && routeResult.available !== false && routeResult.has_pollution_data === false && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-300 flex items-start gap-3 shadow-lg">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-amber-200">
              Navigation available. Pollution comparison unavailable due to insufficient environmental data.
            </h4>
            <p className="text-slate-300 leading-relaxed">
              Real road navigation is displayed below with authentic distance and duration geometry. AirSense AI strictly adheres to verified atmospheric sensors and never fabricates or invents synthetic pollution scores.
            </p>
          </div>
        </div>
      )}

      {/* Single Route Corridor Notification (when OSRM returns 1 path) */}
      {routeResult && routeResult.available !== false && routeResult.has_alternatives === false && (
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center gap-2">
          <Info className="w-4 h-4 text-teal-400 shrink-0" />
          <span>No alternative road corridor exists between these locations. Displaying the primary verified road route.</span>
        </div>
      )}

      {/* Trade-off / Savings Achievement Banner (Authentic Calculated Savings Only) */}
      {routeResult &&
        routeResult.available !== false &&
        routeResult.savings &&
        routeResult.savings.exposure_reduction_pct !== null &&
        routeResult.savings.exposure_reduction_pct > 0 && (
          <div className="bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 p-5 rounded-2xl border border-emerald-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase text-emerald-400 tracking-wider">
                  Pollution Exposure Reduction Identified
                </span>
                <h3 className="text-xl font-extrabold text-white font-['Outfit']">
                  −{routeResult.savings.exposure_reduction_pct}% Estimated Exposure Reduction
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Taking the Cleaner Eco corridor exposes you to {routeResult.savings.exposure_delta_aqi} lower AQI on average.
                </p>
                <p className="text-[11px] text-slate-400/80 mt-1">
                  Based on available atmospheric AQI data along the route.
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right bg-slate-900/60 sm:bg-transparent px-3.5 py-2 sm:p-0 rounded-xl border border-slate-800 sm:border-0">
              <span className="text-xs text-slate-400 block font-medium">Time trade-off</span>
              <span className="text-base font-bold text-amber-400">
                {routeResult.savings.extra_time_minutes > 0
                  ? `+${Math.round(routeResult.savings.extra_time_minutes)} min`
                  : 'Equal or faster ETA'}
              </span>
            </div>
          </div>
        )}

      {/* Fastest is also Cleanest Banner */}
      {routeResult &&
        routeResult.available !== false &&
        hasPollutionCoverage &&
        isCleanerAlsoFastest &&
        routeResult.has_alternatives && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-white">Optimal Route: </span>
              <span>The fastest route is also the cleanest available route along this corridor. No trade-off needed.</span>
            </div>
          </div>
        )}

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE LEAFLET ROUTE MAP                                          */}
      {/* Shows: 📍 Origin, 📍 Destination, 🟢 Cleaner Route, 🟡 Fastest Route     */}
      {/* Controls: Zoom, Pan, Fit Route, Route Selection                           */}
      {/* ========================================================================= */}
      <div className="glass-card p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col space-y-3 shadow-xl">
        {/* Map Top Bar Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Route Selection Toggles: Highlight Selected, Dim Others */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setSelectedRouteType('both')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                selectedRouteType === 'both'
                  ? 'bg-slate-700/80 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Show Both
            </button>
            <button
              onClick={() => setSelectedRouteType('cleaner')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                selectedRouteType === 'cleaner'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              🟢 Cleaner Route
            </button>
            <button
              onClick={() => setSelectedRouteType('fastest')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                selectedRouteType === 'fastest'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              🟡 Fastest Route
            </button>
          </div>

          {/* Action Buttons: Fit Route, Checkpoints Toggle, Legend */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleFitRouteBounds}
              title="Fit map to full route corridor"
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-medium flex items-center gap-1.5 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5 text-teal-400" />
              <span>Fit Route</span>
            </button>

            <button
              onClick={() => setShowWaypoints(!showWaypoints)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold border transition-all ${
                showWaypoints
                  ? 'bg-teal-500/10 text-teal-400 border-teal-500/30'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Checkpoints {showWaypoints ? 'ON' : 'OFF'}
            </button>

            {/* AQI Exposure Legend */}
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <span className="font-semibold text-slate-300">AQI:</span>
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> ≤50
              </span>
              <span className="flex items-center gap-1 text-amber-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> 51–100
              </span>
              <span className="flex items-center gap-1 text-rose-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> &gt;100
              </span>
            </div>
          </div>
        </div>

        {/* Leaflet Map Canvas */}
        <div className="w-full h-[440px] sm:h-[500px] rounded-xl overflow-hidden border border-slate-800/80 relative shadow-inner bg-slate-950">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Floating Route Information Badge on Map */}
          {hasRouteResult && (
            <div className="absolute top-3 left-3 z-[400] pointer-events-auto">
              <div className="bg-slate-950/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-800 text-xs text-slate-200 shadow-2xl space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-white">
                  <Compass className="w-3.5 h-3.5 text-teal-400" />
                  <span>{origin.city} ➔ {destination?.city || 'Destination'}</span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-3">
                  {selectedRouteType === 'cleaner' && routeResult.cleaner_route && (
                    <span className="text-emerald-400 font-bold">
                      🟢 Selected: Cleaner ({routeResult.cleaner_route.duration_min} min, {routeResult.cleaner_route.distance_km} km)
                    </span>
                  )}
                  {selectedRouteType === 'fastest' && routeResult.fastest_route && (
                    <span className="text-amber-400 font-bold">
                      🟡 Selected: Fastest ({routeResult.fastest_route.duration_min} min, {routeResult.fastest_route.distance_km} km)
                    </span>
                  )}
                  {selectedRouteType === 'both' && (
                    <span>Click on either route polyline to isolate & highlight</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Empty state overlay before route is computed */}
          {!hasRouteResult && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[400] w-[92%] max-w-md pointer-events-auto">
              <div className="bg-slate-950/90 backdrop-blur-md p-4 rounded-2xl border border-teal-500/30 text-center shadow-2xl">
                <h4 className="text-sm font-bold text-white mb-1">
                  {destination
                    ? `Ready to compare routes to ${destination.city}`
                    : 'Search any destination worldwide'}
                </h4>
                <p className="text-xs text-slate-400">
                  {destination
                    ? 'Click [ Find Cleaner Route ] above to query real road geometry and environmental telemetry.'
                    : 'Type a destination in the "To" box above to begin.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span>Click routes or checkpoint dots on the map to inspect localized air quality.</span>
          <span className="text-teal-400 font-medium">OSRM Turn-by-Turn Road Engine + Open-Meteo Air Quality</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. ROUTE COMPARISON CARDS                                                 */}
      {/* 🟢 CLEANER ROUTE                                                          */}
      {/* 48 min · 20.1 km                                                          */}
      {/* Pollution exposure: actual calculated value                               */}
      {/*                                                                           */}
      {/* 🟡 FASTEST ROUTE                                                          */}
      {/* 42 min · 18.4 km                                                          */}
      {/* Pollution exposure: actual calculated value                               */}
      {/*                                                                           */}
      {/* Time trade-off: +6 min                                                    */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 4. VISUAL EXPOSURE COMPARISON BARS & ROUTE CARDS                          */}
      {/* ========================================================================= */}
      {hasRouteResult && (
        <div className="space-y-6">
          {/* Visual Route Exposure Comparison Bars */}
          {hasPollutionCoverage && (
            <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
                    <Route className="w-4 h-4 text-emerald-400" />
                    <span>Estimated Exposure Comparison</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Relative atmospheric exposure index along each corridor.
                  </p>
                </div>
                {routeResult.savings?.exposure_reduction_pct > 0 && (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black text-xs">
                    −{routeResult.savings.exposure_reduction_pct}% Estimated Reduction
                  </span>
                )}
              </div>

              <div className="space-y-4 my-2">
                {/* Fastest Route Bar */}
                {routeResult.fastest_route && (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-amber-400 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        FASTEST ROUTE
                      </span>
                      <span className="font-mono font-bold text-slate-200">
                        {routeResult.fastest_route.exposure_score !== null 
                          ? `${routeResult.fastest_route.exposure_score} AQI`
                          : 'Insufficient data'}
                      </span>
                    </div>
                    <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-700"
                        style={{ 
                          width: `${Math.min(100, Math.max(20, ((routeResult.fastest_route.exposure_score || 80) / Math.max(routeResult.fastest_route.exposure_score || 80, routeResult.cleaner_route?.exposure_score || 80)) * 100))}%` 
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Cleaner Route Bar */}
                {routeResult.cleaner_route && (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        CLEANER ROUTE
                      </span>
                      <span className="font-mono font-bold text-slate-200">
                        {routeResult.cleaner_route.exposure_score !== null 
                          ? `${routeResult.cleaner_route.exposure_score} AQI`
                          : 'Insufficient data'}
                      </span>
                    </div>
                    <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
                        style={{ 
                          width: `${Math.min(100, Math.max(20, ((routeResult.cleaner_route.exposure_score || 60) / Math.max(routeResult.fastest_route?.exposure_score || 80, routeResult.cleaner_route.exposure_score || 60)) * 100))}%` 
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-400">
                <span>Estimated Exposure Reduction: <strong className="text-emerald-400 font-bold">{routeResult.savings?.exposure_reduction_pct > 0 ? `−${routeResult.savings.exposure_reduction_pct}%` : 'Optimal'}</strong></span>
                <span className="italic text-slate-500">Based on available atmospheric AQI data along the route.</span>
              </div>
            </div>
          )}

          {/* Cards Grid: FASTEST ROUTE vs CLEANER ROUTE */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* FASTEST ROUTE CARD */}
            {routeResult.fastest_route && (
              <Card3DTilt maxTilt={5} scale={1.01} glowColor="rgba(245, 158, 11, 0.2)">
                <div
                  onClick={() => setSelectedRouteType(selectedRouteType === 'fastest' ? 'both' : 'fastest')}
                  className={`glass-panel p-6 sm:p-7 rounded-3xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-full ${
                    selectedRouteType === 'fastest'
                      ? 'border-amber-400/90 shadow-2xl shadow-amber-500/20 ring-1 ring-amber-400/50'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                        <Zap className="w-4 h-4" />
                        FASTEST ROUTE
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        Direct Corridor
                      </span>
                    </div>

                    {/* Metrics: Distance · Duration */}
                    <div className="my-3 space-y-1">
                      <div className="text-3xl font-black text-white font-['Outfit']">
                        {routeResult.fastest_route.distance_km} km
                      </div>
                      <div className="text-base font-semibold text-slate-300">
                        {Math.floor(routeResult.fastest_route.duration_min / 60) > 0 
                          ? `${Math.floor(routeResult.fastest_route.duration_min / 60)}h ${Math.round(routeResult.fastest_route.duration_min % 60)}m` 
                          : `${routeResult.fastest_route.duration_min} min`}
                      </div>
                    </div>

                    {/* Exposure Metric */}
                    <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 my-4 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-medium">Estimated exposure AQI:</span>
                      <span className="text-xl font-black text-amber-400 font-['Outfit']">
                        {routeResult.fastest_route.exposure_score !== null
                          ? routeResult.fastest_route.exposure_score
                          : 'N/A'}
                      </span>
                    </div>

                    {/* Highlights */}
                    <div className="space-y-2 text-xs text-slate-300 my-3">
                      {(routeResult.fastest_route.highlights || []).map((h, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs flex items-center justify-between mt-3">
                    <span className="text-slate-400">Selected route status:</span>
                    <span className="font-mono font-bold text-amber-400">
                      {selectedRouteType === 'fastest' ? 'Highlighted on map' : 'Click to highlight'}
                    </span>
                  </div>
                </div>
              </Card3DTilt>
            )}

            {/* CLEANER ROUTE CARD */}
            {routeResult.cleaner_route && (
              <Card3DTilt maxTilt={5} scale={1.01} glowColor="rgba(16, 185, 129, 0.25)">
                <div
                  onClick={() => setSelectedRouteType(selectedRouteType === 'cleaner' ? 'both' : 'cleaner')}
                  className={`glass-panel p-6 sm:p-7 rounded-3xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-full ${
                    selectedRouteType === 'cleaner'
                      ? 'border-emerald-400/90 shadow-2xl shadow-emerald-500/20 ring-1 ring-emerald-400/50'
                      : 'border-emerald-500/40 hover:border-emerald-400/80 shadow-lg'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        CLEANER ROUTE
                      </span>
                      <span className="text-xs font-bold text-emerald-400">
                        {routeResult.has_alternatives && !isCleanerAlsoFastest
                          ? 'Recommended Eco Corridor'
                          : 'Optimal Route'}
                      </span>
                    </div>

                    {/* Metrics: Distance · Duration */}
                    <div className="my-3 space-y-1">
                      <div className="text-3xl font-black text-white font-['Outfit']">
                        {routeResult.cleaner_route.distance_km} km
                      </div>
                      <div className="text-base font-semibold text-slate-300">
                        {Math.floor(routeResult.cleaner_route.duration_min / 60) > 0 
                          ? `${Math.floor(routeResult.cleaner_route.duration_min / 60)}h ${Math.round(routeResult.cleaner_route.duration_min % 60)}m` 
                          : `${routeResult.cleaner_route.duration_min} min`}
                      </div>
                    </div>

                    {/* Exposure Metric */}
                    <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 my-4 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-medium">Estimated exposure AQI:</span>
                      <span className="text-xl font-black text-emerald-400 font-['Outfit']">
                        {routeResult.cleaner_route.exposure_score !== null
                          ? routeResult.cleaner_route.exposure_score
                          : 'N/A'}
                      </span>
                    </div>

                    {/* Highlights */}
                    <div className="space-y-2 text-xs text-slate-300 my-3">
                      {(routeResult.cleaner_route.highlights || []).map((h, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30 text-xs flex items-center justify-between text-emerald-300 mt-3">
                    <span>Selected route status:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {selectedRouteType === 'cleaner' ? 'Highlighted on map' : 'Click to highlight'}
                    </span>
                  </div>
                </div>
              </Card3DTilt>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. CHECKPOINT AQI EXPOSURE PROFILE (Along Road Coordinates)               */}
      {/* ========================================================================= */}
      {hasRouteResult && hasPollutionCoverage && routeResult.cleaner_route?.waypoints && (
        <div className="glass-card p-6 rounded-2xl border border-slate-800 shadow-xl">
          <h3 className="text-base font-bold text-slate-200 mb-1 flex items-center gap-2">
            <Route className="w-4 h-4 text-emerald-400" />
            Measured AQI Profile Along Actual Road Curves
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Authentic atmospheric samples retrieved from Open-Meteo at equidistant checkpoints along real road geometry.
          </p>

          <div className="space-y-5">
            {/* Cleaner Route Waypoints */}
            <div>
              <span className="text-xs font-semibold text-emerald-400 block mb-2">
                🟢 Cleaner Route Checkpoints
              </span>
              <div className="flex gap-2.5 overflow-x-auto py-2">
                {routeResult.cleaner_route.waypoints.map((wp, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 shrink-0">
                    <span className="text-[10px] font-mono font-bold text-slate-300">{wp.aqi}</span>
                    <div
                      className="w-9 h-14 rounded-lg bg-slate-900 border border-slate-800 flex items-end justify-center p-1"
                      title={`Point #${i + 1}: Lat ${wp.lat.toFixed(3)}, Lng ${wp.lng.toFixed(3)}, AQI ${wp.aqi}`}
                    >
                      <div
                        className="w-full rounded-sm transition-all"
                        style={{
                          height: `${Math.min(100, Math.max(16, (wp.aqi / 200) * 100))}%`,
                          backgroundColor: wp.aqi <= 50 ? '#10B981' : wp.aqi <= 100 ? '#F59E0B' : '#EF4444'
                        }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-500">#{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fastest Route Waypoints */}
            {routeResult.fastest_route?.waypoints && (
              <div>
                <span className="text-xs font-semibold text-amber-400 block mb-2">
                  🟡 Fastest Route Checkpoints
                </span>
                <div className="flex gap-2.5 overflow-x-auto py-2">
                  {routeResult.fastest_route.waypoints.map((wp, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 shrink-0">
                      <span className="text-[10px] font-mono font-bold text-slate-300">{wp.aqi}</span>
                      <div
                        className="w-9 h-14 rounded-lg bg-slate-900 border border-slate-800 flex items-end justify-center p-1"
                        title={`Point #${i + 1}: Lat ${wp.lat.toFixed(3)}, Lng ${wp.lng.toFixed(3)}, AQI ${wp.aqi}`}
                      >
                        <div
                          className="w-full rounded-sm transition-all"
                          style={{
                            height: `${Math.min(100, Math.max(16, (wp.aqi / 200) * 100))}%`,
                            backgroundColor: wp.aqi <= 50 ? '#10B981' : wp.aqi <= 100 ? '#F59E0B' : '#EF4444'
                          }}
                        />
                      </div>
                      <span className="text-[9px] text-slate-500">#{i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
