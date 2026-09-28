import os
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

import logging
from typing import List

logger = logging.getLogger("airsense_ai.config")

class Settings:
    PROJECT_NAME: str = "AirSense AI"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "airsense_ai_super_secret_jwt_key_2026_dev")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # CORS origins list
    _raw_cors = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
    )
    if _raw_cors.strip().startswith("[") and _raw_cors.strip().endswith("]"):
        import json
        try:
            CORS_ORIGINS: List[str] = json.loads(_raw_cors)
        except Exception:
            CORS_ORIGINS: List[str] = [o.strip(" []\"'") for o in _raw_cors.split(",") if o.strip(" []\"'")]
    else:
        CORS_ORIGINS: List[str] = [
            origin.strip()
            for origin in _raw_cors.split(",")
            if origin.strip()
        ]

    MONGODB_URL: str = os.getenv("MONGODB_URL") or os.getenv("MONGO_URI") or "mongodb://localhost:27017"
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "airsense_ai")

    WAQI_API_TOKEN: str = os.getenv("WAQI_API_TOKEN", "demo")
    OPENWEATHER_API_KEY: str = os.getenv("OPENWEATHER_API_KEY", "")
    OSRM_BASE_URL: str = os.getenv("OSRM_BASE_URL", "https://router.project-osrm.org")

    def __init__(self):
        if self.ENVIRONMENT == "production" and "dev" in self.SECRET_KEY:
            logger.warning("SECURITY WARNING: Using default dev SECRET_KEY in production! Set SECRET_KEY in .env")

    # Key benchmark cities
    BENCHMARK_CITIES = {
        "delhi": {"name": "New Delhi", "lat": 28.6139, "lng": 77.2090, "state": "Delhi", "country": "India"},
        "mumbai": {"name": "Mumbai", "lat": 19.0760, "lng": 72.8777, "state": "Maharashtra", "country": "India"},
        "bengaluru": {"name": "Bengaluru", "lat": 12.9716, "lng": 77.5946, "state": "Karnataka", "country": "India"},
        "newyork": {"name": "New York", "lat": 40.7128, "lng": -74.0060, "state": "NY", "country": "USA"},
        "london": {"name": "London", "lat": 51.5074, "lng": -0.1278, "state": "England", "country": "UK"},
        "tokyo": {"name": "Tokyo", "lat": 35.6762, "lng": 139.6503, "state": "Tokyo", "country": "Japan"}
    }

settings = Settings()

def get_aqi_category(aqi: float) -> dict:
    aqi_val = int(aqi)
    if aqi_val <= 50:
        return {"category": "Good", "color": "#10B981", "level": 1, "advice": "Air quality is satisfactory, and air pollution poses little or no risk."}
    elif aqi_val <= 100:
        return {"category": "Moderate", "color": "#F59E0B", "level": 2, "advice": "Air quality is acceptable. Sensitive individuals may experience mild irritation."}
    elif aqi_val <= 150:
        return {"category": "Unhealthy for Sensitive Groups", "color": "#F97316", "level": 3, "advice": "Members of sensitive groups may experience health effects."}
    elif aqi_val <= 200:
        return {"category": "Unhealthy", "color": "#EF4444", "level": 4, "advice": "Everyone may begin to experience health effects; sensitive groups may experience more serious health effects."}
    elif aqi_val <= 300:
        return {"category": "Very Unhealthy", "color": "#8B5CF6", "level": 5, "advice": "Health alert: everyone may experience more serious health effects."}
    else:
        return {"category": "Hazardous", "color": "#881337", "level": 6, "advice": "Health warning of emergency conditions. The entire population is likely to be affected."}
