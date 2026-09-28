from fastapi import APIRouter
from app.db.schemas import RouteCompareRequestSchema
from app.services.route_service import RouteService

router = APIRouter(prefix="/route", tags=["Cleaner Route Planner"])

@router.post("/compare")
def compare_routes(payload: RouteCompareRequestSchema):
    """Compare Fastest Route vs Cleaner Route with distance-weighted pollution exposure score."""
    return RouteService.compare_routes(
        payload.start_lat,
        payload.start_lng,
        payload.end_lat,
        payload.end_lng,
        start_name=payload.start_name or "Origin",
        end_name=payload.end_name or "Destination"
    )
