import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 25000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT authorization token if available
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('airsense_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth Helpers
export const setAuthSession = (token, user) => {
  localStorage.setItem('airsense_token', token);
  localStorage.setItem('airsense_user', JSON.stringify(user));
};

export const getAuthSession = () => {
  const token = localStorage.getItem('airsense_token');
  const userStr = localStorage.getItem('airsense_user');
  let user = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    user = null;
  }
  return { token, user };
};

export const clearAuthSession = () => {
  localStorage.removeItem('airsense_token');
  localStorage.removeItem('airsense_user');
};

export const loginUser = async (email, password) => {
  const response = await API.post('/auth/login', { email, password });
  return response.data;
};

export const registerUser = async (name, email, password) => {
  const response = await API.post('/auth/register', { name, email, password });
  return response.data;
};

// Core API endpoints
export const searchLocations = async (query, limit = 8) => {
  const cleaned = (query || '').trim();
  if (!cleaned) return [];

  try {
    const response = await API.get(`/aqi/locations/search?q=${encodeURIComponent(cleaned)}&limit=${limit}`);
    if (Array.isArray(response.data) && response.data.length > 0) {
      return response.data.map((item) => ({
        id: item.id || `loc_${item.latitude}_${item.longitude}`,
        name: item.name || item.city || cleaned,
        city: item.city || item.name || cleaned,
        region: item.region || item.admin1 || '',
        country: item.country || '',
        latitude: item.latitude,
        longitude: item.longitude,
        timezone: item.timezone || 'UTC'
      }));
    }
  } catch (err) {
    console.warn('Backend geocoding search failed, falling back to direct geocoding API:', err);
  }

  // Direct Open-Meteo Geocoding API fallback
  try {
    const directUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleaned)}&count=${limit}&language=en&format=json`;
    const res = await fetch(directUrl);
    if (res.ok) {
      const data = await res.json();
      const results = data.results || [];
      return results.map((r) => ({
        id: `loc_${r.id}_${r.latitude}_${r.longitude}`,
        name: r.name,
        city: r.name,
        region: r.admin1 || r.admin2 || '',
        country: r.country || '',
        latitude: r.latitude,
        longitude: r.longitude,
        timezone: r.timezone || 'UTC'
      }));
    }
  } catch (directErr) {
    console.error('Direct geocoding API call failed:', directErr);
  }
  return [];
};

export const fetchCurrentAQI = async (cityKey = 'delhi', lat, lng, cityName) => {
  const params = new URLSearchParams();
  if (lat !== undefined && lat !== null && lng !== undefined && lng !== null) {
    params.append('lat', lat);
    params.append('lng', lng);
    if (cityName) params.append('city', cityName);
  } else if (cityKey) {
    params.append('city', cityKey);
  }

  const queryStr = params.toString();
  const url = queryStr ? `/aqi/current?${queryStr}` : '/aqi/current';
  const response = await API.get(url);
  return response.data;
};

export const fetchAQIHistory = async (locationId = 'delhi', hours = 24, lat, lng) => {
  const params = new URLSearchParams();
  params.append('location_id', locationId);
  params.append('hours', hours);
  if (lat !== undefined && lat !== null && lng !== undefined && lng !== null) {
    params.append('lat', lat);
    params.append('lng', lng);
  }
  const response = await API.get(`/aqi/history?${params.toString()}`);
  return response.data;
};

export const fetchPrediction = async (locationId = 'delhi', lat, lng, cityName) => {
  const params = new URLSearchParams();
  if (lat !== undefined && lat !== null && lng !== undefined && lng !== null) {
    params.append('lat', lat);
    params.append('lng', lng);
  }
  if (cityName) {
    params.append('city_name', cityName);
  }
  const queryStr = params.toString();
  const url = queryStr ? `/prediction/${encodeURIComponent(locationId)}?${queryStr}` : `/prediction/${encodeURIComponent(locationId)}`;
  const response = await API.get(url);
  return response.data;
};

export const fetchHeatmapPoints = async (lat = 28.6139, lng = 77.2090) => {
  const response = await API.get(`/map/heatmap?center_lat=${lat}&center_lng=${lng}`);
  return response.data;
};

export const compareRoutes = async (payload) => {
  const response = await API.post('/route/compare', payload);
  return response.data;
};

export const fetchUserAlerts = async (userId = 'demo_user') => {
  const response = await API.get(`/alerts/${userId}`);
  return response.data;
};

export const subscribeAlert = async (payload) => {
  const response = await API.post('/alerts/subscribe', payload);
  return response.data;
};

export default API;
