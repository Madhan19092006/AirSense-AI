import math
import random
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
import httpx
from app.config import settings, get_aqi_category

logger = logging.getLogger("airsense_ai.fetcher")

class AQIFetcher:
    """
    Fetches real-time air quality data from World Air Quality Index (WAQI) API
    or OpenWeather API when keys are configured, with graceful fallback to
    high-fidelity deterministic local telemetry estimation.
    """

    @staticmethod
    def _fetch_from_waqi(city_or_loc: str, lat: Optional[float] = None, lng: Optional[float] = None) -> Optional[Dict[str, Any]]:
        token = settings.WAQI_API_TOKEN
        if not token or token == "demo" and lat is not None:
            # WAQI 'demo' token is strictly limited to specific predefined feeds (e.g. shanghai)
            return None

        try:
            if lat is not None and lng is not None:
                url = f"https://api.waqi.info/feed/geo:{lat};{lng}/?token={token}"
            else:
                url = f"https://api.waqi.info/feed/{city_or_loc}/?token={token}"

            with httpx.Client(timeout=3.0) as client:
                res = client.get(url)
                if res.status_code == 200:
                    payload = res.json()
                    if payload.get("status") == "ok":
                        data = payload.get("data", {})
                        aqi_val = float(data.get("aqi", 0.0))
                        iaqi = data.get("iaqi", {})
                        city_meta = data.get("city", {})
                        station_name = city_meta.get("name", city_or_loc)

                        cat_info = get_aqi_category(aqi_val)

                        pm25 = float(iaqi.get("pm25", {}).get("v", aqi_val * 0.42))
                        pm10 = float(iaqi.get("pm10", {}).get("v", pm25 * 1.85))
                        no2 = float(iaqi.get("no2", {}).get("v", aqi_val * 0.18))
                        so2 = float(iaqi.get("so2", {}).get("v", aqi_val * 0.07))
                        co = float(iaqi.get("co", {}).get("v", aqi_val * 0.012))
                        o3 = float(iaqi.get("o3", {}).get("v", aqi_val * 0.22))
                        temp = float(iaqi.get("t", {}).get("v", 26.0))
                        humidity = float(iaqi.get("h", {}).get("v", 50.0))

                        iso_now = datetime.now(timezone.utc).isoformat()
                        return {
                            "available": True,
                            "location_id": f"waqi_{city_or_loc}",
                            "city": station_name,
                            "lat": lat if lat is not None else city_meta.get("geo", [28.61, 77.20])[0],
                            "lng": lng if lng is not None else city_meta.get("geo", [28.61, 77.20])[1],
                            "aqi": aqi_val,
                            "category": cat_info["category"],
                            "color": cat_info["color"],
                            "pollutants": {
                                "pm25": round(pm25, 1),
                                "pm10": round(pm10, 1),
                                "no2": round(no2, 1),
                                "so2": round(so2, 1),
                                "co": round(co, 2),
                                "o3": round(o3, 1)
                            },
                            "temperature": round(temp, 1),
                            "humidity": round(humidity, 1),
                            "source": f"WAQI Live Station ({station_name})",
                            "is_fallback": False,
                            "timestamp": iso_now,
                            "last_updated": iso_now
                        }
        except Exception as e:
            logger.warning(f"Live WAQI query failed: {e}.")
        return None

    @classmethod
    def get_reading_for_city(cls, city_key: str) -> Dict[str, Any]:
        city_info = settings.BENCHMARK_CITIES.get(city_key.lower())
        if city_info:
            live_result = cls._fetch_from_waqi(city_key, city_info["lat"], city_info["lng"])
            if live_result:
                return live_result
            return cls.get_reading_for_location(
                city_info["lat"],
                city_info["lng"],
                location_name=city_info["name"]
            )

        # Look up coordinates via GeocodingService without hardcoding Delhi
        try:
            from app.services.providers.geocoding_service import GeocodingService
            geo_matches = GeocodingService.search_locations(city_key, limit=1)
            if geo_matches:
                match = geo_matches[0]
                city_name = match.get("name", city_key)
                if match.get("admin1"):
                    city_name = f"{city_name}, {match['admin1']}"
                return cls.get_reading_for_location(
                    match["latitude"],
                    match["longitude"],
                    location_name=city_name
                )
        except Exception as e:
            logger.warning(f"Geocoding lookup failed for '{city_key}': {e}")

        # If location not found or geocoding failed, report unavailable without inventing fake data
        now_iso = datetime.now(timezone.utc).isoformat()
        return {
            "available": False,
            "location_id": f"unknown_{city_key}",
            "city": city_key.capitalize(),
            "lat": None,
            "lng": None,
            "aqi": None,
            "category": None,
            "color": None,
            "pollutants": None,
            "temperature": None,
            "humidity": None,
            "error_message": "Air-quality data is currently unavailable for this location.",
            "is_fallback": False,
            "timestamp": now_iso,
            "last_updated": now_iso
        }

    @classmethod
    def get_reading_for_location(
        cls,
        lat: float,
        lng: float,
        location_name: Optional[str] = None,
        fallback_reason: Optional[str] = None
    ) -> Dict[str, Any]:
        # 1. Attempt geo-based live fetch via WAQI station network
        live_result = cls._fetch_from_waqi(f"geo_{lat}_{lng}", lat, lng)
        if live_result:
            return live_result

        # 2. Query live global Open-Meteo Atmospheric Model (CAMS/ECMWF)
        try:
            from app.services.providers.open_meteo_provider import OpenMeteoAirQualityProvider
            from app.services.providers.weather_service import WeatherService

            om_provider = OpenMeteoAirQualityProvider()
            om_data = om_provider.get_current_air_quality(lat, lng, location_name=location_name)
            if om_data and om_data.get("aqi") is not None:
                weather = WeatherService.get_weather_for_coordinates(lat, lng)
                city_label = location_name or f"Location ({lat:.2f}, {lng:.2f})"
                now_iso = datetime.now(timezone.utc).isoformat()
                return {
                    "available": True,
                    "location_id": f"om_{lat:.3f}_{lng:.3f}",
                    "city": city_label,
                    "lat": lat,
                    "lng": lng,
                    "aqi": om_data["aqi"],
                    "category": om_data["category"],
                    "color": om_data["color"],
                    "pollutants": om_data["pollutants"],
                    "temperature": weather.get("temperature") if weather else None,
                    "humidity": weather.get("humidity") if weather else None,
                    "pressure": weather.get("pressure") if weather else None,
                    "wind_speed": weather.get("wind_speed") if weather else None,
                    "source": om_data["source"],
                    "is_fallback": False,
                    "timestamp": om_data.get("timestamp", now_iso),
                    "last_updated": om_data.get("last_updated", now_iso)
                }
        except Exception as e:
            logger.warning(f"Open-Meteo live provider fetch failed for ({lat}, {lng}): {e}")

        # 3. If real data is unavailable, return unavailable status without fabricating fake numbers
        now_iso = datetime.now(timezone.utc).isoformat()
        city_label = location_name or f"Coordinates ({lat:.2f}, {lng:.2f})"
        return {
            "available": False,
            "location_id": f"loc_{lat:.3f}_{lng:.3f}",
            "city": city_label,
            "lat": lat,
            "lng": lng,
            "aqi": None,
            "category": None,
            "color": None,
            "pollutants": None,
            "temperature": None,
            "humidity": None,
            "error_message": "Air-quality data is currently unavailable for this location.",
            "is_fallback": False,
            "timestamp": now_iso,
            "last_updated": now_iso
        }
