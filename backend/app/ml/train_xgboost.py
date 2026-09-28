import os
import sys
import json
import joblib
import pandas as pd
import numpy as np
from datetime import datetime, timezone

# Add backend root to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

try:
    from xgboost import XGBRegressor
    HAS_XGBOOST = True
except ImportError:
    from sklearn.ensemble import GradientBoostingRegressor as XGBRegressor
    HAS_XGBOOST = False

from app.ml.preprocess import prepare_train_test_split, FEATURE_COLUMNS
from app.ml.evaluate import evaluate_model_performance

def train_aqi_model(data_path: str, model_output_dir: str):
    print(f"Loading training data from {data_path}...")
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset file not found: {data_path}")
        
    df = pd.read_csv(data_path)
    print(f"Dataset loaded successfully with {len(df)} total rows across cities: {df['city'].unique().tolist()}")

    # We will train model on primary city data (e.g. New Delhi) or combined city dataset
    X_train, X_test, y_train, y_test = prepare_train_test_split(df, train_ratio=0.8)
    
    print(f"Training set shape: {X_train.shape}, Test set shape: {X_test.shape}")
    print(f"Using algorithm: {'XGBoost (XGBRegressor)' if HAS_XGBOOST else 'GradientBoostingRegressor (scikit-learn fallback)'}")

    if HAS_XGBOOST:
        model = XGBRegressor(
            n_estimators=150,
            learning_rate=0.05,
            max_depth=6,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42
        )
    else:
        model = XGBRegressor(
            n_estimators=150,
            learning_rate=0.05,
            max_depth=6,
            random_state=42
        )

    model.fit(X_train, y_train)
    
    # Predict on test set
    y_pred = model.predict(X_test)
    
    # Evaluate metrics
    metrics = evaluate_model_performance(y_test, y_pred)
    print("--- Model Evaluation Results (Chronological Split Test Set) ---")
    print(f"MAE  : {metrics['mae']} AQI points")
    print(f"RMSE : {metrics['rmse']} AQI points")
    print(f"R²   : {metrics['r2']}")

    os.makedirs(model_output_dir, exist_ok=True)
    model_path = os.path.join(model_output_dir, "xgboost_aqi_model.pkl")
    metadata_path = os.path.join(model_output_dir, "metrics.json")

    joblib.dump(model, model_path)
    
    metadata = {
        "model_name": "XGBoost AQI Predictor",
        "has_native_xgboost": HAS_XGBOOST,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "feature_columns": FEATURE_COLUMNS,
        "metrics": metrics,
        "num_training_samples": len(X_train),
        "num_test_samples": len(X_test)
    }

    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"Saved model artifact to: {model_path}")
    print(f"Saved metadata to: {metadata_path}")
    return metadata

if __name__ == "__main__":
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
    csv_file = os.path.join(project_root, "data", "sample_aqi_data.csv")
    models_dir = os.path.join(os.path.dirname(__file__), "models")
    train_aqi_model(csv_file, models_dir)
