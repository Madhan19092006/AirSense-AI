from fastapi import APIRouter, Query
from typing import List, Dict, Any
from app.config import settings
from app.services.aqi_fetcher import AQIFetcher
from app.services.route_service import calculate_haversine_distance

router = APIRouter(prefix="/map", tags=["Spatial Map & Heatmap"])

@router.get("/heatmap")
def get_heatmap_points(
    center_lat: float = Query(28.6139, description="Center latitude"),
    center_lng: float = Query(77.2090, description="Center longitude"),
    radius_km: float = Query(150.0, description="Sampling radius in kilometers")
) -> List[Dict[str, Any]]:
    """Returns real observation nodes for heatmap layer without fabricating fake points."""
    points = []

    # 1. Fetch real observation at selected center
    center_reading = AQIFetcher.get_reading_for_location(center_lat, center_lng)
    if not center_reading or center_reading.get("available") is False or center_reading.get("aqi") is None:
        # Insufficient nearby real observations
        return []

    points.append({
        "lat": center_lat,
        "lng": center_lng,
        "aqi": center_reading["aqi"],
        "city": center_reading["city"],
        "category": center_reading["category"],
        "color": center_reading["color"],
        "is_center": True
    })

    # 2. Add real benchmark stations within radius if they have real readings
    for key, city_data in settings.BENCHMARK_CITIES.items():
        dist = calculate_haversine_distance(center_lat, center_lng, city_data["lat"], city_data["lng"])
        if 0.5 < dist <= radius_km:
            reading = AQIFetcher.get_reading_for_city(key)
            if reading and reading.get("available") is not False and reading.get("aqi") is not None:
                points.append({
                    "lat": city_data["lat"],
                    "lng": city_data["lng"],
                    "aqi": reading["aqi"],
                    "city": city_data["name"],
                    "category": reading["category"],
                    "color": reading["color"],
                    "is_center": False
                })

    return points
