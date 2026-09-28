import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.db.mongo_client import get_db

class TestBackendValidation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db = get_db()

    def test_01_health_and_mongodb_connection(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("status"), "healthy")
        self.assertEqual(data.get("database_mode"), "mongodb")

    def test_02_mongodb_persistence(self):
        test_payload = {
            "location_id": "test_verification_sensor_002",
            "city": "Unit Test Station",
            "lat": 28.61,
            "lng": 77.20,
            "aqi": 95.0,
            "category": "Moderate",
            "color": "#F59E0B",
            "pollutants": {"pm25": 40.0, "pm10": 80.0, "no2": 20.0, "so2": 6.0, "co": 0.9, "o3": 25.0},
            "temperature": 27.0,
            "humidity": 45.0,
            "source": "UnitTest Suite",
            "timestamp": "2026-09-24T13:45:00Z"
        }
        self.db.insert_reading(test_payload)
        doc = self.db.get_latest_reading("test_verification_sensor_002")
        self.assertIsNotNone(doc)
        self.assertEqual(doc["location_id"], "test_verification_sensor_002")
        self.assertEqual(doc["aqi"], 95.0)

    def test_03_current_aqi_endpoint(self):
        response = self.client.get("/api/aqi/current?city=delhi")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("aqi", data)
        self.assertIn("category", data)
        self.assertIn("pollutants", data)
        self.assertIn("pm25", data["pollutants"])

    def test_04_benchmark_cities_endpoint(self):
        response = self.client.get("/api/aqi/cities")
        self.assertEqual(response.status_code, 200)
        cities = response.json()
        self.assertIsInstance(cities, list)
        self.assertGreaterEqual(len(cities), 6)

    def test_05_aqi_history_endpoint(self):
        response = self.client.get("/api/aqi/history?location_id=delhi&hours=24")
        self.assertEqual(response.status_code, 200)
        history = response.json()
        self.assertIsInstance(history, list)
        self.assertGreaterEqual(len(history), 6)

    def test_06_xgboost_prediction_endpoint(self):
        response = self.client.get("/api/prediction/delhi")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("model_used"), "XGBoost Regressor (Temporal Feature Matrix)")
        self.assertAlmostEqual(data.get("mae"), 34.53, places=2)
        self.assertAlmostEqual(data.get("rmse"), 40.42, places=2)
        self.assertAlmostEqual(data.get("r2"), 0.0078, places=4)
        self.assertEqual(len(data.get("forecast", [])), 24)

    def test_07_route_comparison_endpoint(self):
        payload = {
            "start_lat": 28.6139,
            "start_lng": 77.2090,
            "end_lat": 28.4595,
            "end_lng": 77.0266,
            "start_name": "Connaught Place",
            "end_name": "Cyber City"
        }
        response = self.client.post("/api/route/compare", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("fastest_route", data)
        self.assertIn("cleaner_route", data)
        self.assertIn("savings", data)

    def test_08_map_heatmap_endpoint(self):
        response = self.client.get("/api/map/heatmap")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)

if __name__ == "__main__":
    unittest.main()
