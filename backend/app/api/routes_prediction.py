from typing import Optional
from fastapi import APIRouter, Query
from app.services.prediction_service import PredictionService
from app.services.aqi_fetcher import AQIFetcher
from app.config import settings

router = APIRouter(prefix="/prediction", tags=["ML Predictions"])

@router.get("/{location_id}")
def get_prediction_for_location(
    location_id: str,
    horizon: str = Query("24h", description="Forecast horizon, default 24h"),
    lat: Optional[float] = Query(None, description="Optional latitude for dynamic location"),
    lng: Optional[float] = Query(None, description="Optional longitude for dynamic location"),
    city_name: Optional[str] = Query(None, description="Optional display name for city")
):
    """Retrieve 24-hour XGBoost machine learning AQI forecast with confidence bounds."""
    if lat is not None and lng is not None:
        display_name = city_name or location_id
        current_reading = AQIFetcher.get_reading_for_location(lat, lng, location_name=display_name)
    else:
        city_info = settings.BENCHMARK_CITIES.get(location_id.lower())
        if city_info:
            display_name = city_info["name"]
        else:
            display_name = city_name or location_id.capitalize()
        current_reading = AQIFetcher.get_reading_for_city(location_id)

    return PredictionService.predict_24h_forecast(location_id, display_name, current_reading)
