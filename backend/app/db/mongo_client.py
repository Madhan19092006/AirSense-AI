import os
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional

from app.config import settings

logger = logging.getLogger("airsense_ai.db")

class InMemoryDatabase:
    """In-memory fallback database for development and test execution without MongoDB."""
    def __init__(self):
        self.mode = "in_memory"
        self.readings: List[Dict[str, Any]] = []
        self.locations: Dict[str, Dict[str, Any]] = {}
        self.predictions: List[Dict[str, Any]] = []
        self.alerts: List[Dict[str, Any]] = []
        self.users: Dict[str, Dict[str, Any]] = {}

    def insert_reading(self, reading: dict):
        self.readings.append(reading)
        if len(self.readings) > 5000:
            self.readings = self.readings[-5000:]

    def get_latest_reading(self, location_id: str) -> Optional[dict]:
        loc_readings = [r for r in self.readings if r.get("location_id") == location_id]
        if loc_readings:
            return sorted(loc_readings, key=lambda x: str(x.get("timestamp")), reverse=True)[0]
        return None

    def get_readings_history(self, location_id: str, limit: int = 48) -> List[dict]:
        loc_readings = [r for r in self.readings if r.get("location_id") == location_id]
        sorted_readings = sorted(loc_readings, key=lambda x: str(x.get("timestamp")))
        return sorted_readings[-limit:]

    def get_user_by_email(self, email: str) -> Optional[dict]:
        return self.users.get(email.lower())

    def create_user(self, user_dict: dict) -> dict:
        self.users[user_dict["email"].lower()] = user_dict
        return user_dict


class MongoDatabase:
    """Production MongoDB persistence adapter."""
    def __init__(self, client, db_name: str):
        self.mode = "mongodb"
        self.client = client
        self.db = client[db_name]
        self.readings = self.db["readings"]
        self.users = self.db["users"]
        self.alerts = self.db["alerts"]
        self._ensure_indexes()

    def _ensure_indexes(self):
        try:
            self.readings.create_index([("location_id", 1), ("timestamp", -1)])
            self.users.create_index([("email", 1)], unique=True)
            self.alerts.create_index([("user_id", 1)])
        except Exception as e:
            logger.warning(f"Index creation warning: {e}")

    def insert_reading(self, reading: dict):
        doc = reading.copy()
        doc.pop("_id", None)
        self.readings.insert_one(doc)

    def get_latest_reading(self, location_id: str) -> Optional[dict]:
        doc = self.readings.find_one({"location_id": location_id}, sort=[("timestamp", -1)])
        if doc and "_id" in doc:
            doc["_id"] = str(doc["_id"])
        return doc

    def get_readings_history(self, location_id: str, limit: int = 48) -> List[dict]:
        cursor = self.readings.find({"location_id": location_id}, sort=[("timestamp", 1)]).limit(limit)
        results = []
        for doc in cursor:
            if "_id" in doc:
                doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    def get_user_by_email(self, email: str) -> Optional[dict]:
        doc = self.users.find_one({"email": email.lower()})
        if doc and "_id" in doc:
            doc["_id"] = str(doc["_id"])
        return doc

    def create_user(self, user_dict: dict) -> dict:
        doc = user_dict.copy()
        doc["email"] = doc["email"].lower()
        res = self.users.insert_one(doc)
        doc["_id"] = str(res.inserted_id)
        return doc


_db_instance = None

def get_db():
    global _db_instance
    if _db_instance is not None:
        return _db_instance

    # Attempt connection to MongoDB if URL provided
    mongo_url = settings.MONGODB_URL
    if mongo_url:
        try:
            from pymongo import MongoClient
            client = MongoClient(mongo_url, serverSelectionTimeoutMS=5000)
            client.admin.command('ping')
            logger.info("Connected to MongoDB successfully.")
            _db_instance = MongoDatabase(client, settings.DATABASE_NAME)
            return _db_instance
        except Exception as e:
            logger.info(f"MongoDB not reachable ({type(e).__name__}). Gracefully falling back to in-memory store.")

    _db_instance = InMemoryDatabase()
    return _db_instance
