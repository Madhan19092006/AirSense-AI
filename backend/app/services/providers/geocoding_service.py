import time
import re
import logging
import httpx
from typing import List, Dict, Any, Optional

logger = logging.getLogger("airsense_ai.geocoding")

POPULAR_LOCATIONS = [
  {"id": "delhi", "name": "New Delhi", "city": "New Delhi", "admin1": "Delhi", "region": "Delhi", "country": "India", "latitude": 28.6139, "longitude": 77.2090, "timezone": "Asia/Kolkata"},
  {"id": "mumbai", "name": "Mumbai", "city": "Mumbai", "admin1": "Maharashtra", "region": "Maharashtra", "country": "India", "latitude": 19.0760, "longitude": 72.8777, "timezone": "Asia/Kolkata"},
  {"id": "bengaluru", "name": "Bengaluru", "city": "Bengaluru", "admin1": "Karnataka", "region": "Karnataka", "country": "India", "latitude": 12.9716, "longitude": 77.5946, "timezone": "Asia/Kolkata"},
  {"id": "chennai", "name": "Chennai", "city": "Chennai", "admin1": "Tamil Nadu", "region": "Tamil Nadu", "country": "India", "latitude": 13.0827, "longitude": 80.2707, "timezone": "Asia/Kolkata"},
  {"id": "karur", "name": "Karur", "city": "Karur", "admin1": "Tamil Nadu", "region": "Tamil Nadu", "country": "India", "latitude": 10.9577, "longitude": 78.0809, "timezone": "Asia/Kolkata"},
  {"id": "newyork", "name": "New York", "city": "New York", "admin1": "New York", "region": "New York", "country": "United States", "latitude": 40.7128, "longitude": -74.0060, "timezone": "America/New_York"},
  {"id": "london", "name": "London", "city": "London", "admin1": "England", "region": "England", "country": "United Kingdom", "latitude": 51.5074, "longitude": -0.1278, "timezone": "Europe/London"},
  {"id": "tokyo", "name": "Tokyo", "city": "Tokyo", "admin1": "Tokyo", "region": "Tokyo", "country": "Japan", "latitude": 35.6762, "longitude": 139.6503, "timezone": "Asia/Tokyo"},
  {"id": "singapore", "name": "Singapore", "city": "Singapore", "admin1": "Central Community Development Council", "region": "Central Community Development Council", "country": "Singapore", "latitude": 1.2897, "longitude": 103.8501, "timezone": "Asia/Singapore"},
  {"id": "dubai", "name": "Dubai", "city": "Dubai", "admin1": "Dubai", "region": "Dubai", "country": "United Arab Emirates", "latitude": 25.2048, "longitude": 55.2708, "timezone": "Asia/Dubai"},
  {"id": "paris", "name": "Paris", "city": "Paris", "admin1": "Île-de-France", "region": "Île-de-France", "country": "France", "latitude": 48.8566, "longitude": 2.3522, "timezone": "Europe/Paris"}
]

class GeocodingService:
    """
    Global geocoding service backed by Open-Meteo Geocoding API with TTL in-memory caching.
    Supports search by city, town, administrative region, country, or raw latitude/longitude coordinates.
    """
    _cache: Dict[str, Any] = {}
    CACHE_TTL_SECONDS = 86400  # 24 hours

    @classmethod
    def get_popular_suggestions(cls) -> List[Dict[str, Any]]:
        return POPULAR_LOCATIONS

    @classmethod
    def search_locations(cls, query: str, limit: int = 8) -> List[Dict[str, Any]]:
        cleaned_query = query.strip()
        if not cleaned_query:
            return cls.get_popular_suggestions()[:limit]

        # 1. Check if user typed direct latitude, longitude (e.g. "10.95, 78.08" or "10.9577, 78.0809")
        coord_match = re.match(r"^([+-]?\d+(?:\.\d+)?)[,\s]+([+-]?\d+(?:\.\d+)?)$", cleaned_query)
        if coord_match:
            try:
                lat = float(coord_match.group(1))
                lng = float(coord_match.group(2))
                if -90.0 <= lat <= 90.0 and -180.0 <= lng <= 180.0:
                    return [{
                        "id": f"coord_{lat:.4f}_{lng:.4f}",
                        "name": f"Coordinates ({lat:.4f}, {lng:.4f})",
                        "city": f"Coordinates ({lat:.4f}, {lng:.4f})",
                        "admin1": "Custom Location",
                        "region": "Custom Location",
                        "country": "Global",
                        "latitude": round(lat, 5),
                        "longitude": round(lng, 5),
                        "timezone": "UTC"
                    }]
            except ValueError:
                pass

        # 2. Check in-memory cache
        cache_key = cleaned_query.lower()
        now = time.time()
        if cache_key in cls._cache:
            entry = cls._cache[cache_key]
            if now - entry["cached_at"] < cls.CACHE_TTL_SECONDS:
                return entry["data"]

        # 3. Query Open-Meteo Geocoding API
        url = (
            f"https://geocoding-api.open-meteo.com/v1/search"
            f"?name={httpx.URL('', params={'q': cleaned_query}).params['q']}"
            f"&count={limit}&language=en&format=json"
        )
        try:
            with httpx.Client(timeout=8.0) as client:
                res = client.get(url)
                if res.status_code == 200:
                    payload = res.json()
                    results = payload.get("results", [])
                    formatted_results = []

                    for r in results:
                        formatted_results.append({
                            "id": f"loc_{r.get('id', '')}_{round(r.get('latitude', 0.0), 3)}_{round(r.get('longitude', 0.0), 3)}",
                            "name": r.get("name", ""),
                            "city": r.get("name", ""),
                            "admin1": r.get("admin1") or r.get("admin2") or "",
                            "region": r.get("admin1") or r.get("admin2") or "",
                            "country": r.get("country", ""),
                            "country_code": r.get("country_code", ""),
                            "latitude": float(r.get("latitude", 0.0)),
                            "longitude": float(r.get("longitude", 0.0)),
                            "timezone": r.get("timezone", "UTC"),
                            "elevation": r.get("elevation")
                        })

                    cls._cache[cache_key] = {"data": formatted_results, "cached_at": now}
                    return formatted_results
        except Exception as e:
            logger.warning(f"Geocoding query failed for '{cleaned_query}': {e}")

        # Fallback to local search in popular locations if external network times out
        matches = [
            loc for loc in POPULAR_LOCATIONS 
            if cleaned_query.lower() in loc["name"].lower() or cleaned_query.lower() in loc["country"].lower()
        ]
        return matches[:limit]
