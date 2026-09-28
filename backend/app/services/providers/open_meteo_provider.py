import logging
import httpx
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from app.config import get_aqi_category
from app.services.providers.base_provider import BaseAirQualityProvider

logger = logging.getLogger("airsense_ai.provider.open_meteo")

class OpenMeteoAirQualityProvider(BaseAirQualityProvider):
    """
    Real global air quality data provider powered by Open-Meteo Air Quality API
    (integrating Copernicus Atmosphere Monitoring Service / CAMS, ECMWF chemical transport models).
    Provides worldwide hourly and real-time coverage for any coordinates.
    """

    @property
    def provider_name(self) -> str:
        return "Open-Meteo Global Atmospheric Model (CAMS/ECMWF)"

    def get_current_air_quality(
        self, 
        lat: float, 
        lng: float, 
        location_name: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        url = (
            f"https://air-quality-api.open-meteo.com/v1/air-quality"
            f"?latitude={lat}&longitude={lng}"
            f"&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi"
            f"&timezone=auto"
        )
        try:
            with httpx.Client(timeout=8.0) as client:
                res = client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    current = data.get("current", {})
                    
                    raw_aqi = current.get("us_aqi")
                    if raw_aqi is None:
                        # Estimate from PM2.5 if us_aqi is missing
                        pm25 = float(current.get("pm2_5", 15.0))
                        raw_aqi = round(pm25 * 2.1)
                    else:
                        raw_aqi = float(raw_aqi)

                    cat_info = get_aqi_category(raw_aqi)

                    # Extract pollutants
                    pm25_val = float(current.get("pm2_5", 0.0) or 0.0)
                    pm10_val = float(current.get("pm10", 0.0) or 0.0)
                    
                    # Convert gas concentrations
                    co_raw = float(current.get("carbon_monoxide", 0.0) or 0.0)
                    co_ppm = round(co_raw / 1145.0, 2)  # ug/m3 to ppm

                    no2_raw = float(current.get("nitrogen_dioxide", 0.0) or 0.0)
                    no2_ppb = round(no2_raw * 0.531, 1)  # ug/m3 to ppb

                    so2_raw = float(current.get("sulphur_dioxide", 0.0) or 0.0)
                    so2_ppb = round(so2_raw * 0.382, 1)  # ug/m3 to ppb

                    o3_raw = float(current.get("ozone", 0.0) or 0.0)
                    o3_ppb = round(o3_raw * 0.509, 1)    # ug/m3 to ppb

                    obs_time = current.get("time") or datetime.now(timezone.utc).isoformat()
                    now_iso = datetime.now(timezone.utc).isoformat()

                    return {
                        "aqi": raw_aqi,
                        "category": cat_info["category"],
                        "color": cat_info["color"],
                        "standard": "US AQI Standard",
                        "pollutants": {
                            "pm25": round(pm25_val, 1),
                            "pm10": round(pm10_val, 1),
                            "no2": no2_ppb,
                            "so2": so2_ppb,
                            "co": co_ppm,
                            "o3": o3_ppb
                        },
                        "source": self.provider_name,
                        "last_updated": obs_time,
                        "timestamp": now_iso,
                        "is_fallback": False
                    }
        except Exception as e:
            logger.warning(f"Open-Meteo Air Quality fetch failed for ({lat}, {lng}): {e}")
        return None

    def get_hourly_air_quality(
        self, 
        lat: float, 
        lng: float, 
        hours: int = 24
    ) -> Optional[List[Dict[str, Any]]]:
        url = (
            f"https://air-quality-api.open-meteo.com/v1/air-quality"
            f"?latitude={lat}&longitude={lng}"
            f"&hourly=us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone"
            f"&past_days=1&forecast_days=1"
            f"&timezone=auto"
        )
        try:
            with httpx.Client(timeout=8.0) as client:
                res = client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    hourly = data.get("hourly", {})
                    times = hourly.get("time", [])
                    aqis = hourly.get("us_aqi", [])
                    pm25s = hourly.get("pm2_5", [])
                    pm10s = hourly.get("pm10", [])

                    results = []
                    # Get recent observations up to requested hours
                    total_pts = len(times)
                    start_idx = max(0, total_pts - hours)

                    for i in range(start_idx, total_pts):
                        t_str = times[i]
                        aqi_v = float(aqis[i]) if (i < len(aqis) and aqis[i] is not None) else 50.0
                        cat_info = get_aqi_category(aqi_v)

                        results.append({
                            "timestamp": t_str,
                            "aqi": aqi_v,
                            "category": cat_info["category"],
                            "color": cat_info["color"],
                            "pollutants": {
                                "pm25": float(pm25s[i]) if (i < len(pm25s) and pm25s[i] is not None) else round(aqi_v * 0.42, 1),
                                "pm10": float(pm10s[i]) if (i < len(pm10s) and pm10s[i] is not None) else round(aqi_v * 0.85, 1)
                            }
                        })
                    return results
        except Exception as e:
            logger.warning(f"Open-Meteo hourly air quality fetch failed for ({lat}, {lng}): {e}")
        return None
