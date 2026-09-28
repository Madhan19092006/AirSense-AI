from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from app.services.aqi_fetcher import AQIFetcher
from app.db.mongo_client import get_db

class IngestionService:
    @staticmethod
    def ingest_current_city(city_key: str) -> Dict[str, Any]:
        reading = AQIFetcher.get_reading_for_city(city_key)
        db = get_db()
        db.insert_reading(reading)
        return reading

    @staticmethod
    def get_history(location_id: str, city_name: str, hours: int = 24, lat: float = None, lng: float = None) -> List[Dict[str, Any]]:
        db = get_db()
        existing = db.get_readings_history(location_id, limit=hours)
        
        if len(existing) >= 6:
            return existing

        # Fetch real hourly atmospheric observations from Open-Meteo
        target_lat = lat
        target_lng = lng

        if target_lat is None or target_lng is None:
            from app.config import settings
            city_info = settings.BENCHMARK_CITIES.get(location_id.lower())
            if city_info:
                target_lat = city_info["lat"]
                target_lng = city_info["lng"]

        if target_lat is not None and target_lng is not None:
            try:
                from app.services.providers.open_meteo_provider import OpenMeteoAirQualityProvider
                om = OpenMeteoAirQualityProvider()
                hourly_data = om.get_hourly_air_quality(target_lat, target_lng, hours=hours)
                if hourly_data:
                    return hourly_data
            except Exception:
                pass

        # Return empty list if real historical readings are unavailable without inventing fake data
        return []
