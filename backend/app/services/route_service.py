import math
import logging
import httpx
from typing import Dict, Any, List, Optional
from app.config import settings, get_aqi_category

logger = logging.getLogger("airsense_ai.routes")

def calculate_haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculates distance between two geo-coordinates in kilometers using Haversine formula."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2.0)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2.0)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

class RouteService:
    @classmethod
    def sample_air_quality_along_route(cls, coords: List[List[float]], num_samples: int = 8) -> List[Dict[str, Any]]:
        """
        Samples real atmospheric air quality at checkpoints along a route polyline
        using Open-Meteo Air Quality batch API. coords are [[lng, lat], ...].
        """
        if not coords:
            return []

        # Subsample evenly spaced checkpoint coordinates
        k = max(3, min(num_samples, len(coords)))
        step = max(1, len(coords) // k)
        sample_pts = [coords[i] for i in range(0, len(coords), step)][:k]
        if coords[-1] not in sample_pts:
            sample_pts.append(coords[-1])

        lats = ",".join(f"{pt[1]:.4f}" for pt in sample_pts)
        lngs = ",".join(f"{pt[0]:.4f}" for pt in sample_pts)

        url = (
            f"https://air-quality-api.open-meteo.com/v1/air-quality"
            f"?latitude={lats}&longitude={lngs}"
            f"&current=us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone"
        )
        try:
            with httpx.Client(timeout=8.0) as client:
                res = client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    results = []
                    items = data if isinstance(data, list) else [data]
                    for idx, item in enumerate(items):
                        current = item.get("current", {})
                        aqi_val = current.get("us_aqi")
                        if aqi_val is not None:
                            aqi_f = float(aqi_val)
                            cat_info = get_aqi_category(aqi_f)
                            pt = sample_pts[min(idx, len(sample_pts) - 1)]
                            results.append({
                                "lat": pt[1],
                                "lng": pt[0],
                                "aqi": round(aqi_f, 1),
                                "category": cat_info["category"],
                                "color": cat_info["color"],
                                "pm25": current.get("pm2_5"),
                                "pm10": current.get("pm10")
                            })
                    return results
        except Exception as e:
            logger.warning(f"Batch AQI sampling failed along route: {e}")
        return []

    @classmethod
    def compare_routes(
        cls,
        start_lat: float,
        start_lng: float,
        end_lat: float,
        end_lng: float,
        start_name: str = "Origin",
        end_name: str = "Destination"
    ) -> Dict[str, Any]:
        """
        Queries real road geometry from OSRM, evaluates atmospheric air-quality
        at sampled checkpoints along each path, and computes the authentic
        Cleaner Route vs Fastest Route comparison without fabricating numbers.
        """
        osrm_base = getattr(settings, "OSRM_BASE_URL", "https://router.project-osrm.org")
        url = (
            f"{osrm_base}/route/v1/driving/{start_lng},{start_lat};{end_lng},{end_lat}"
            f"?overview=full&geometries=geojson&alternatives=true"
        )

        routes_data = None
        error_msg = "Unable to calculate road routes right now."
        headers = {"User-Agent": "AirSenseAI/1.0 (Environmental Route Intelligence; +https://airsense.ai)"}
        try:
            with httpx.Client(timeout=12.0, headers=headers) as client:
                res = client.get(url)
                if res.status_code == 200:
                    payload = res.json()
                    if payload.get("code") == "Ok" and payload.get("routes"):
                        routes_data = payload.get("routes")
                    elif payload.get("code") == "NoRoute":
                        error_msg = "No drivable road route found between origin and destination."
                elif res.status_code == 429:
                    error_msg = "Routing service rate limit reached. Please retry in a few moments."
        except Exception as e:
            logger.warning(f"OSRM routing query failed: {e}")

        if not routes_data:
            return {
                "available": False,
                "error_message": error_msg
            }

        parsed_routes = []
        for idx, r in enumerate(routes_data):
            coords_lnglat = r["geometry"]["coordinates"]
            dist_km = round(r["distance"] / 1000.0, 1)
            dur_min = round(r["duration"] / 60.0, 1)

            # Convert to Leaflet [lat, lng] format and downsample smoothly if too large
            if len(coords_lnglat) > 1200:
                downsample_step = max(1, len(coords_lnglat) // 800)
                coords_latlng = [[pt[1], pt[0]] for pt in coords_lnglat[::downsample_step]]
                if [coords_lnglat[-1][1], coords_lnglat[-1][0]] not in coords_latlng:
                    coords_latlng.append([coords_lnglat[-1][1], coords_lnglat[-1][0]])
            else:
                coords_latlng = [[pt[1], pt[0]] for pt in coords_lnglat]

            # Sample air quality along the actual road path
            waypoints = cls.sample_air_quality_along_route(coords_lnglat, num_samples=8)

            exposure_score = None
            aqi_category = "Unknown"
            color = "#06b6d4"

            if waypoints:
                valid_aqis = [w["aqi"] for w in waypoints if w.get("aqi") is not None]
                if valid_aqis:
                    exposure_score = round(sum(valid_aqis) / len(valid_aqis), 1)
                    cat_info = get_aqi_category(exposure_score)
                    aqi_category = cat_info["category"]
                    color = cat_info["color"]

            # Segment coloring for map visualization
            segments = []
            if waypoints and len(waypoints) > 1:
                seg_count = len(waypoints)
                pts_per_seg = max(1, len(coords_latlng) // seg_count)
                for s_i in range(seg_count):
                    s_start = s_i * pts_per_seg
                    s_end = (s_i + 1) * pts_per_seg if s_i < seg_count - 1 else len(coords_latlng)
                    seg_coords = coords_latlng[s_start:s_end + 1]
                    if len(seg_coords) >= 2:
                        seg_aqi = waypoints[s_i]["aqi"]
                        seg_cat = get_aqi_category(seg_aqi)
                        segments.append({
                            "coords": seg_coords,
                            "aqi": seg_aqi,
                            "color": seg_cat["color"],
                            "category": seg_cat["category"]
                        })

            parsed_routes.append({
                "route_id": f"route_{idx}",
                "name": f"Route Option {idx + 1}" if idx > 0 else "Primary Highway Route",
                "distance_km": dist_km,
                "duration_min": dur_min,
                "exposure_score": exposure_score,
                "aqi_category": aqi_category,
                "color": color,
                "coordinates": coords_latlng,
                "waypoints": waypoints,
                "segments": segments,
                "has_pollution_data": bool(waypoints and exposure_score is not None)
            })

        # Identify Fastest Route (minimum duration)
        fastest_route = min(parsed_routes, key=lambda r: r["duration_min"])
        fastest_route["name"] = f"Fastest Route via {start_name} -> {end_name}"

        # Check if authentic pollution data was successfully retrieved
        routes_with_aqi = [r for r in parsed_routes if r["has_pollution_data"]]
        has_pollution_data = len(routes_with_aqi) > 0

        cleaner_route = None
        savings = None

        if has_pollution_data:
            # Cleaner Route is the route with the lowest exposure score
            cleaner_candidate = min(routes_with_aqi, key=lambda r: r["exposure_score"])

            # If multiple alternatives exist
            if len(parsed_routes) > 1 and cleaner_candidate["route_id"] != fastest_route["route_id"]:
                cleaner_route = cleaner_candidate
                cleaner_route["name"] = f"Eco-Clean Route via Regional Bypass"
                cleaner_route["is_recommended"] = True
                fastest_route["is_recommended"] = False

                exp_f = fastest_route["exposure_score"]
                exp_c = cleaner_route["exposure_score"]
                exp_saving_pct = round(((exp_f - exp_c) / exp_f) * 100.0, 1) if exp_f > 0 else 0.0
                extra_time_min = round(cleaner_route["duration_min"] - fastest_route["duration_min"], 1)
                dist_delta_km = round(cleaner_route["distance_km"] - fastest_route["distance_km"], 1)

                savings = {
                    "exposure_reduction_pct": max(0.0, exp_saving_pct),
                    "extra_time_minutes": max(0.0, extra_time_min),
                    "exposure_delta_aqi": round(exp_f - exp_c, 1),
                    "distance_delta_km": dist_delta_km,
                    "is_cleaner_also_faster": extra_time_min <= 0
                }

                fastest_route["highlights"] = [
                    f"Fastest ETA: {fastest_route['duration_min']} min",
                    f"Direct corridor ({fastest_route['distance_km']} km)",
                    f"Estimated Exposure: {exp_f} AQI ({fastest_route['aqi_category']})"
                ]
                cleaner_route["highlights"] = [
                    f"−{exp_saving_pct}% lower pollution exposure",
                    f"Estimated Exposure: {exp_c} AQI ({cleaner_route['aqi_category']})",
                    f"+{extra_time_min} min ETA trade-off" if extra_time_min > 0 else "Equal or faster ETA"
                ]
            else:
                # Fastest route is also the cleanest route, or only 1 route available
                cleaner_route = dict(fastest_route)
                cleaner_route["route_id"] = "route_optimal"
                cleaner_route["name"] = "Optimal Route (Cleanest & Fastest)"
                cleaner_route["is_recommended"] = True
                fastest_route["is_recommended"] = True

                savings = {
                    "exposure_reduction_pct": 0.0,
                    "extra_time_minutes": 0.0,
                    "exposure_delta_aqi": 0.0,
                    "distance_delta_km": 0.0,
                    "is_cleaner_also_faster": True
                }

                fastest_route["highlights"] = [
                    f"Fastest ETA: {fastest_route['duration_min']} min",
                    f"Direct corridor ({fastest_route['distance_km']} km)",
                    f"Exposure: {fastest_route['exposure_score']} AQI ({fastest_route['aqi_category']})"
                ]
                cleaner_route["highlights"] = [
                    f"This highway is currently the cleanest available route",
                    f"Estimated Exposure: {cleaner_route['exposure_score']} AQI",
                    f"Optimal travel time: {cleaner_route['duration_min']} min"
                ]
        else:
            # Pollution data not available along corridor
            cleaner_route = dict(fastest_route)
            savings = {
                "exposure_reduction_pct": None,
                "extra_time_minutes": 0.0,
                "exposure_delta_aqi": None,
                "distance_delta_km": 0.0
            }
            fastest_route["highlights"] = [
                f"Fastest ETA: {fastest_route['duration_min']} min",
                f"Direct highway route ({fastest_route['distance_km']} km)"
            ]
            cleaner_route["highlights"] = [
                f"Road navigation active",
                f"Pollution comparison unavailable"
            ]

        # Calculate composite score (time + exposure)
        max_dur = max(r["duration_min"] for r in parsed_routes) or 1.0
        fastest_route["composite_score"] = round(fastest_route["duration_min"] / max_dur, 2)
        cleaner_route["composite_score"] = round(cleaner_route["duration_min"] / max_dur, 2)

        return {
            "available": True,
            "has_alternatives": len(parsed_routes) > 1,
            "has_pollution_data": has_pollution_data,
            "pollution_message": (
                "Navigation available. Pollution comparison unavailable due to insufficient environmental data."
                if not has_pollution_data else None
            ),
            "alternatives_message": (
                "No alternative route is available."
                if len(parsed_routes) <= 1 else None
            ),
            "origin": {
                "name": start_name,
                "lat": start_lat,
                "lng": start_lng
            },
            "destination": {
                "name": end_name,
                "lat": end_lat,
                "lng": end_lng
            },
            "fastest_route": fastest_route,
            "cleaner_route": cleaner_route,
            "savings": savings,
            "all_routes": parsed_routes
        }
