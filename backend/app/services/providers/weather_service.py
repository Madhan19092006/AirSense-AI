import time
import logging
import httpx
from datetime import datetime, timezone
from typing import Dict, Any, Optional

logger = logging.getLogger("airsense_ai.provider.weather")

class WeatherService:
    """
    Global weather provider using Open-Meteo Weather Forecast API.
    Provides temperature, humidity, wind speed, surface pressure, and precipitation worldwide.
    Includes in-memory TTL caching to optimize throughput and performance.
    """
    _cache: Dict[str, Any] = {}
    CACHE_TTL_SECONDS = 600  # 10 minutes

    @classmethod
    def get_weather_for_coordinates(cls, lat: float, lng: float) -> Dict[str, Any]:
        cache_key = f"{round(lat, 2)}_{round(lng, 2)}"
        now = time.time()

        if cache_key in cls._cache:
            entry = cls._cache[cache_key]
            if now - entry["cached_at"] < cls.CACHE_TTL_SECONDS:
                return entry["data"]

        url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lng}"
            f"&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,precipitation"
            f"&timezone=auto"
        )
        try:
            with httpx.Client(timeout=8.0) as client:
                res = client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    current = data.get("current", {})
                    
                    temp = float(current.get("temperature_2m", 25.0) or 25.0)
                    humidity = float(current.get("relative_humidity_2m", 50.0) or 50.0)
                    pressure = float(current.get("surface_pressure", 1013.25) or 1013.25)
                    wind_speed = float(current.get("wind_speed_10m", 10.0) or 10.0)
                    precip = float(current.get("precipitation", 0.0) or 0.0)

                    result = {
                        "temperature": round(temp, 1),
                        "humidity": round(humidity, 1),
                        "pressure": round(pressure, 1),
                        "wind_speed": round(wind_speed, 1),
                        "precipitation": round(precip, 2),
                        "source": "Open-Meteo Global Weather Model (ECMWF/GFS)",
                        "last_updated": current.get("time") or datetime.now(timezone.utc).isoformat()
                    }

                    cls._cache[cache_key] = {"data": result, "cached_at": now}
                    return result
        except Exception as e:
            logger.warning(f"Live Open-Meteo weather query failed for ({lat}, {lng}): {e}")

        # Deterministic fallback based on geographical coordinates if external service is offline
        now_utc = datetime.now(timezone.utc)
        hour = now_utc.hour
        temp = round(24.0 + (lat % 5) + (hour % 4 - 2), 1)
        humidity = round(max(20.0, min(95.0, 55.0 - (lat % 8))), 1)
        
        fallback_result = {
            "temperature": temp,
            "humidity": humidity,
            "pressure": 1013.2,
            "wind_speed": 12.5,
            "precipitation": 0.0,
            "source": "AirSense Standard Meteorological Estimation (Fallback)",
            "last_updated": now_utc.isoformat()
        }
        return fallback_result
