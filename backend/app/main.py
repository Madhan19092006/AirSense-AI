import os
import sys
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# Ensure app package root is accessible
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.config import settings
from app.api.routes_aqi import router as aqi_router
from app.api.routes_prediction import router as prediction_router
from app.api.routes_map import router as map_router
from app.api.routes_route import router as route_router
from app.api.routes_alerts import router as alert_router
from app.api.routes_auth import router as auth_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="AirSense AI — High-Performance Air Quality Monitoring, XGBoost ML Forecasting, Leaflet Spatial Heatmap & Cleaner Route Engine"
)

# Configure CORS with explicit origin security
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global unhandled exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import logging
    logging.getLogger("airsense_ai.server").error(f"Unhandled error on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "detail": "An internal server error occurred.",
            "path": str(request.url.path)
        }
    )

# Mount API routers under /api
app.include_router(aqi_router, prefix=settings.API_V1_STR)
app.include_router(prediction_router, prefix=settings.API_V1_STR)
app.include_router(map_router, prefix=settings.API_V1_STR)
app.include_router(route_router, prefix=settings.API_V1_STR)
app.include_router(alert_router, prefix=settings.API_V1_STR)
app.include_router(auth_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "docs": "/docs",
        "openapi": "/openapi.json"
    }

@app.get("/health")
def health_check():
    from datetime import datetime, timezone
    from app.db.mongo_client import get_db
    db = get_db()
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database_mode": getattr(db, "mode", "in_memory"),
        "environment": settings.ENVIRONMENT
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
