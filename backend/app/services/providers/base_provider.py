from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List

class BaseAirQualityProvider(ABC):
    """Abstract base class for global and local air quality data providers."""
    
    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @abstractmethod
    def get_current_air_quality(
        self, 
        lat: float, 
        lng: float, 
        location_name: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Fetch real-time air quality telemetry for coordinates.
        Expected return dictionary schema:
        {
            "aqi": float,
            "category": str,
            "color": str,
            "standard": str,  # e.g. "US AQI Standard"
            "pollutants": {
                "pm25": float,
                "pm10": float,
                "no2": float,
                "so2": float,
                "co": float,
                "o3": float
            },
            "source": str,
            "last_updated": str,
            "timestamp": str,
            "is_fallback": bool
        }
        """
        pass

    @abstractmethod
    def get_hourly_air_quality(
        self, 
        lat: float, 
        lng: float, 
        hours: int = 24
    ) -> Optional[List[Dict[str, Any]]]:
        """Fetch hourly air quality observations / forecasts for coordinates."""
        pass
