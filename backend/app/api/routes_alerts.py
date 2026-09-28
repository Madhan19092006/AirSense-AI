from fastapi import APIRouter, Query, Body
from app.services.alert_service import AlertService

router = APIRouter(prefix="/alerts", tags=["User AQI Alerts"])

@router.get("/{user_id}")
def get_user_alerts(user_id: str):
    """Retrieve active and past AQI threshold alerts for a user."""
    return AlertService.get_user_alerts(user_id)

@router.post("/subscribe")
def subscribe_alert(
    user_id: str = Body(..., embed=True),
    location_id: str = Body(..., embed=True),
    city: str = Body(..., embed=True),
    threshold_aqi: float = Body(..., embed=True)
):
    """Subscribe to threshold alerts for a specific location."""
    return AlertService.create_alert_subscription(user_id, location_id, city, threshold_aqi)
