import pandas as pd
import numpy as np
from typing import Tuple

FEATURE_COLUMNS = [
    'pm25', 'pm10', 'no2', 'so2', 'co', 'o3', 'temperature', 'humidity',
    'sin_hour', 'cos_hour', 'day_of_week', 'sin_month', 'cos_month',
    'aqi_lag_1', 'aqi_lag_3', 'aqi_lag_6', 'aqi_lag_24',
    'rolling_mean_3h', 'rolling_mean_6h', 'rolling_mean_24h'
]

TARGET_COLUMN = 'target_aqi_24h'

def create_features(df: pd.DataFrame) -> pd.DataFrame:
    """Engineers time-series features (lags, rolling stats, cyclical time features) for AQI prediction."""
    data = df.copy()
    
    # Ensure timestamp is datetime and sorted
    if 'timestamp' in data.columns:
        data['timestamp'] = pd.to_datetime(data['timestamp'])
        data = data.sort_values('timestamp').reset_index(drop=True)
    
    # Calculate base AQI if not provided
    if 'aqi' not in data.columns and 'pm25' in data.columns:
        # Simple proxy AQI formula based on PM2.5 standard scale
        data['aqi'] = data['pm25'].apply(lambda p: min(500, p * 2.1))
    
    # Extract time features
    if 'timestamp' in data.columns:
        hour = data['timestamp'].dt.hour
        month = data['timestamp'].dt.month
        data['day_of_week'] = data['timestamp'].dt.dayofweek
        
        # Cyclical transformations
        data['sin_hour'] = np.sin(2 * np.pi * hour / 24.0)
        data['cos_hour'] = np.cos(2 * np.pi * hour / 24.0)
        data['sin_month'] = np.sin(2 * np.pi * month / 12.0)
        data['cos_month'] = np.cos(2 * np.pi * month / 12.0)
    else:
        data['sin_hour'] = 0.0
        data['cos_hour'] = 1.0
        data['day_of_week'] = 0
        data['sin_month'] = 0.0
        data['cos_month'] = 1.0

    # Lag features
    data['aqi_lag_1'] = data['aqi'].shift(1)
    data['aqi_lag_3'] = data['aqi'].shift(3)
    data['aqi_lag_6'] = data['aqi'].shift(6)
    data['aqi_lag_24'] = data['aqi'].shift(24)

    # Rolling window averages
    data['rolling_mean_3h'] = data['aqi'].rolling(window=3, min_periods=1).mean()
    data['rolling_mean_6h'] = data['aqi'].rolling(window=6, min_periods=1).mean()
    data['rolling_mean_24h'] = data['aqi'].rolling(window=24, min_periods=1).mean()

    # Target variable: AQI 24 hours ahead (or +1h for short term)
    data[TARGET_COLUMN] = data['aqi'].shift(-24)

    # Forward fill small missing values created by shifting
    data = data.bfill().ffill()
    
    return data

def prepare_train_test_split(df: pd.DataFrame, train_ratio: float = 0.8) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    """Chronological split (not random) to prevent future data leakage in time-series validation."""
    data = create_features(df)
    
    # Drop rows where target is NaN (at the very end of sequence)
    data = data.dropna(subset=[TARGET_COLUMN])
    
    split_idx = int(len(data) * train_ratio)
    
    X = data[FEATURE_COLUMNS]
    y = data[TARGET_COLUMN]
    
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]
    
    return X_train, X_test, y_train, y_test
