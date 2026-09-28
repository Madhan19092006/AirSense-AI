from datetime import datetime, timezone
from typing import List, Dict, Any
from app.config import get_aqi_category

class AlertService:
    _alerts: List[Dict[str, Any]] = [
        {
            "id": "alt_101",
            "user_id": "demo_user",
            "location_id": "delhi",
            "city": "New Delhi",
            "threshold_aqi": 150.0,
            "current_aqi": 215.4,
            "level": "Unhealthy",
            "message": "AQI in New Delhi exceeded safety threshold (215.4 > 150.0). Consider wearing an N95 mask outdoors.",
            "triggered_at": datetime.now(timezone.utc).isoformat(),
            "is_read": False
        },
        {
            "id": "alt_102",
            "user_id": "demo_user",
            "location_id": "mumbai",
            "city": "Mumbai",
            "threshold_aqi": 100.0,
            "current_aqi": 128.0,
            "level": "Unhealthy for Sensitive Groups",
            "message": "AQI in Mumbai reached 128.0. Sensitive individuals should limit prolonged outdoor exertion.",
            "triggered_at": datetime.now(timezone.utc).isoformat(),
            "is_read": False
        }
    ]

    @classmethod
    def get_user_alerts(cls, user_id: str) -> List[Dict[str, Any]]:
        return [a for a in cls._alerts if a["user_id"] == user_id]

    @classmethod
    def create_alert_subscription(cls, user_id: str, location_id: str, city_name: str, threshold: float) -> Dict[str, Any]:
        alert = {
            "id": f"alt_{len(cls._alerts) + 101}",
            "user_id": user_id,
            "location_id": location_id,
            "city": city_name,
            "threshold_aqi": threshold,
            "current_aqi": threshold * 0.9,
            "level": get_aqi_category(threshold)["category"],
            "message": f"Subscribed to AQI alerts for {city_name} at threshold > {threshold} AQI.",
            "triggered_at": datetime.now(timezone.utc).isoformat(),
            "is_read": False
        }
        cls._alerts.append(alert)
        return alert
