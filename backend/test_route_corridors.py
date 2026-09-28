import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.services.route_service import RouteService

class TestAdvancedRoutePlanner(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_karur_to_coimbatore(self):
        # Karur -> Coimbatore
        res = RouteService.compare_routes(10.9601, 78.0766, 11.0168, 76.9558, "Karur", "Coimbatore")
        self.assertTrue(res.get("available"))
        self.assertIn("fastest_route", res)
        self.assertIn("cleaner_route", res)
        self.assertGreater(res["fastest_route"]["distance_km"], 100)
        self.assertGreater(res["fastest_route"]["duration_min"], 60)
        print(f"\n[PASS] Karur -> Coimbatore: Distance={res['fastest_route']['distance_km']}km, Duration={res['fastest_route']['duration_min']}m, Exposure={res['fastest_route']['exposure_score']} AQI, Cleaner Exposure={res['cleaner_route']['exposure_score']} AQI")

    def test_02_karur_to_chennai(self):
        # Karur -> Chennai
        res = RouteService.compare_routes(10.9601, 78.0766, 13.0827, 80.2707, "Karur", "Chennai")
        self.assertTrue(res.get("available"))
        self.assertIn("fastest_route", res)
        self.assertIn("cleaner_route", res)
        self.assertGreater(res["fastest_route"]["distance_km"], 300)
        print(f"\n[PASS] Karur -> Chennai: Distance={res['fastest_route']['distance_km']}km, Duration={res['fastest_route']['duration_min']}m, Exposure={res['fastest_route']['exposure_score']} AQI, Cleaner Exposure={res['cleaner_route']['exposure_score']} AQI")

    def test_03_karur_to_salem(self):
        # Karur -> Salem
        res = RouteService.compare_routes(10.9601, 78.0766, 11.6643, 78.1460, "Karur", "Salem")
        self.assertTrue(res.get("available"))
        self.assertIn("fastest_route", res)
        self.assertIn("cleaner_route", res)
        self.assertGreater(res["fastest_route"]["distance_km"], 70)
        print(f"\n[PASS] Karur -> Salem: Distance={res['fastest_route']['distance_km']}km, Duration={res['fastest_route']['duration_min']}m, Exposure={res['fastest_route']['exposure_score']} AQI, Alternatives={res.get('has_alternatives')}")

    def test_04_karur_to_namakkal(self):
        # Karur -> Namakkal
        res = RouteService.compare_routes(10.9601, 78.0766, 11.2189, 78.1674, "Karur", "Namakkal")
        self.assertTrue(res.get("available"))
        self.assertIn("fastest_route", res)
        self.assertIn("cleaner_route", res)
        self.assertGreater(res["fastest_route"]["distance_km"], 35)
        print(f"\n[PASS] Karur -> Namakkal: Distance={res['fastest_route']['distance_km']}km, Duration={res['fastest_route']['duration_min']}m, Exposure={res['fastest_route']['exposure_score']} AQI, Alternatives={res.get('has_alternatives')}")

    def test_05_invalid_destination_no_drivable_route(self):
        # Point in Atlantic Ocean (0.0, 0.0) -> No route possible
        res = RouteService.compare_routes(10.9601, 78.0766, 0.0, 0.0, "Karur", "Null Island")
        self.assertFalse(res.get("available"))
        self.assertIn("error_message", res)
        print(f"\n[PASS] Invalid destination handled gracefully: {res.get('error_message')}")

    def test_06_duplicate_city_name_geocoding(self):
        # Searching "Salem" should return multiple distinct locations (e.g. Salem TN India, Salem OR USA)
        response = self.client.get("/api/aqi/locations/search?q=Salem&limit=5")
        self.assertEqual(response.status_code, 200)
        results = response.json()
        self.assertGreater(len(results), 1)
        # Verify region / country are populated to allow user disambiguation
        for r in results:
            self.assertIn("city", r)
            self.assertIn("region", r)
            self.assertIn("country", r)
        print(f"\n[PASS] Duplicate city search disambiguation: {[(r['city'], r['region'], r['country']) for r in results[:3]]}")

    def test_07_insufficient_aqi_coverage_handling(self):
        # When waypoints have no AQI coverage, route navigation still works without inventing numbers
        res = RouteService.compare_routes(10.9601, 78.0766, 11.2189, 78.1674, "Karur", "Namakkal")
        # Check schema contract
        self.assertIn("has_pollution_data", res)
        if not res.get("has_pollution_data"):
            self.assertIsNone(res["savings"]["exposure_reduction_pct"])
            self.assertIn("insufficient", res["pollution_message"].lower())
            print(f"\n[PASS] Insufficient AQI coverage message: {res['pollution_message']}")
        else:
            self.assertIsNotNone(res["cleaner_route"]["exposure_score"])
            print(f"\n[PASS] Real AQI data present: Exposure={res['cleaner_route']['exposure_score']} AQI")

    def test_08_changing_destination_flow(self):
        # User changes destination from Salem to Namakkal
        res_salem = RouteService.compare_routes(10.9601, 78.0766, 11.6643, 78.1460, "Karur", "Salem")
        res_namakkal = RouteService.compare_routes(10.9601, 78.0766, 11.2189, 78.1674, "Karur", "Namakkal")
        self.assertTrue(res_salem["available"])
        self.assertTrue(res_namakkal["available"])
        self.assertNotEqual(res_salem["fastest_route"]["distance_km"], res_namakkal["fastest_route"]["distance_km"])
        print(f"\n[PASS] Changing destination flow verified: Salem ({res_salem['fastest_route']['distance_km']}km) -> Namakkal ({res_namakkal['fastest_route']['distance_km']}km)")

    def test_09_routing_failure_handling(self):
        # Coordinates that fail road graph (e.g. into the Arabian sea or invalid points)
        res = RouteService.compare_routes(10.9601, 78.0766, -15.0, 70.0, "Karur", "Ocean Middle")
        self.assertFalse(res["available"])
        self.assertIn("error_message", res)
        print(f"\n[PASS] Routing failure handled with clear user message: {res['error_message']}")

    def test_10_exact_insufficient_data_string_contract(self):
        expected_msg = "Navigation available. Pollution comparison unavailable due to insufficient environmental data."
        # Verify schema message formatting contract
        dummy_res = RouteService.compare_routes(10.9601, 78.0766, 11.0168, 76.9558, "Karur", "Coimbatore")
        # RouteService has pollution_message field
        self.assertIn("pollution_message", dummy_res)
        # Verify the exact wording when pollution coverage is False
        from unittest.mock import patch
        with patch.object(RouteService, 'sample_air_quality_along_route', return_value=[]):
            res_no_aqi = RouteService.compare_routes(10.9601, 78.0766, 11.0168, 76.9558, "Karur", "Coimbatore")
            self.assertTrue(res_no_aqi["available"])
            self.assertFalse(res_no_aqi["has_pollution_data"])
            self.assertEqual(res_no_aqi["pollution_message"], expected_msg)
            print(f"\n[PASS] Exact required message verified: '{res_no_aqi['pollution_message']}'")

if __name__ == "__main__":
    unittest.main()
