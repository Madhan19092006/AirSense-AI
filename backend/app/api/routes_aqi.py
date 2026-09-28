from fastapi import APIRouter, Query
from typing import Optional, List
from app.services.aqi_fetcher import AQIFetcher
from app.services.ingestion_service import IngestionService
from app.services.providers.geocoding_service import GeocodingService
from app.config import settings

router = APIRouter(prefix="/aqi", tags=["AQI Data"])

@router.get("/locations/search")
def search_locations(
    q: str = Query(..., min_length=1, description="Search query string"),
    limit: int = Query(8, ge=1, le=20, description="Max results")
):
    """Global geocoding location search backed by GeocodingService."""
    return GeocodingService.search_locations(q, limit=limit)

@router.get("/current")
def get_current_aqi(
    city: Optional[str] = Query(None, description="City key or name"),
    lat: Optional[float] = Query(None, description="Latitude"),
    lng: Optional[float] = Query(None, description="Longitude")
):
    """Retrieve current AQI, category, color coding, and detailed pollutant levels."""
    if lat is not None and lng is not None:
        return AQIFetcher.get_reading_for_location(lat, lng, location_name=city)
    elif city:
        return AQIFetcher.get_reading_for_city(city)
    else:
        return AQIFetcher.get_reading_for_city("delhi")

@router.get("/cities")
def get_benchmark_cities():
    """List available benchmark cities with coordinates."""
    return list(settings.BENCHMARK_CITIES.values())

@router.get("/history")
def get_aqi_history(
    location_id: str = Query("delhi", description="City key or location ID"),
    hours: int = Query(24, ge=6, le=168, description="History window in hours"),
    lat: Optional[float] = Query(None, description="Optional latitude"),
    lng: Optional[float] = Query(None, description="Optional longitude")
):
    """Retrieve historical time-series readings for a location."""
    city_name = settings.BENCHMARK_CITIES.get(location_id.lower(), {}).get("name", location_id)
    return IngestionService.get_history(location_id, city_name, hours=hours, lat=lat, lng=lng)
