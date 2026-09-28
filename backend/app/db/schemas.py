from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone

class LocationSchema(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    city: str
    state: Optional[str] = None
    country: Optional[str] = "India"

class PollutantsSchema(BaseModel):
    pm25: float = Field(..., description="PM2.5 concentration in ug/m3")
    pm10: float = Field(..., description="PM10 concentration in ug/m3")
    no2: float = Field(..., description="NO2 concentration in ppb")
    so2: float = Field(..., description="SO2 concentration in ppb")
    co: float = Field(..., description="CO concentration in ppm")
    o3: float = Field(..., description="O3 concentration in ppb")

class ReadingSchema(BaseModel):
    id: Optional[str] = None
    location_id: str
    city: str
    lat: float
    lng: float
    aqi: float
    category: str
    color: str
    pollutants: PollutantsSchema
    temperature: float
    humidity: float
    source: str = "WAQI/OpenWeather"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ForecastHourSchema(BaseModel):
    timestamp: str
    hour_ahead: int
    predicted_aqi: float
    category: str
    color: str
    confidence_lower: float
    confidence_upper: float

class PredictionResponseSchema(BaseModel):
    location_id: str
    city: str
    generated_at: str
    model_used: str
    mae: float
    rmse: float
    r2: float
    current_aqi: float
    forecast: List[ForecastHourSchema]

class BoundingBoxSchema(BaseModel):
    min_lat: float
    min_lng: float
    max_lat: float
    max_lng: float

class HeatmapPointSchema(BaseModel):
    lat: float
    lng: float
    aqi: float
    city: str
    category: str
    color: str

class RouteWaypointSchema(BaseModel):
    lat: float
    lng: float
    aqi: float

class RouteOptionSchema(BaseModel):
    route_id: str
    name: str
    distance_km: float
    duration_min: float
    exposure_score: float
    composite_score: float
    aqi_category: str
    color: str
    waypoints: List[RouteWaypointSchema]
    is_recommended: bool = False
    highlights: List[str]

class RouteCompareRequestSchema(BaseModel):
    start_lat: float = Field(..., ge=-90.0, le=90.0, description="Start latitude (-90 to 90)")
    start_lng: float = Field(..., ge=-180.0, le=180.0, description="Start longitude (-180 to 180)")
    end_lat: float = Field(..., ge=-90.0, le=90.0, description="End latitude (-90 to 90)")
    end_lng: float = Field(..., ge=-180.0, le=180.0, description="End longitude (-180 to 180)")
    start_name: Optional[str] = "Origin"
    end_name: Optional[str] = "Destination"

class RouteCompareResponseSchema(BaseModel):
    fastest_route: RouteOptionSchema
    cleaner_route: RouteOptionSchema
    savings: dict

class AlertSchema(BaseModel):
    id: Optional[str] = None
    user_id: str = "demo_user"
    location_id: str
    city: str
    threshold_aqi: float = Field(..., ge=0.0, le=500.0)
    current_aqi: float
    level: str
    message: str
    triggered_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_read: bool = False

class UserCreateSchema(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=150)
    password: str = Field(..., min_length=6, max_length=100)

class UserLoginSchema(BaseModel):
    email: str = Field(..., min_length=3, max_length=150)
    password: str = Field(..., min_length=1)

class UserResponseSchema(BaseModel):
    id: str
    name: str
    email: str
    saved_locations: List[str] = []
    created_at: str

class TokenSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponseSchema
