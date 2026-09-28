import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_hourly_data(city_name: str, base_aqi: float, output_path: str):
    np.random.seed(42)
    start_time = datetime(2026, 3, 1, 0, 0, 0)
    hours = 180 * 24  # 180 days of hourly data (4320 points)

    records = []
    current_time = start_time
    
    current_aqi = base_aqi

    for h in range(hours):
        hour_of_day = current_time.hour
        day_of_year = current_time.timetuple().tm_yday
        
        # Diurnal pattern (rush hours higher AQI)
        diurnal_factor = 1.0 + 0.3 * np.sin(2 * np.pi * (hour_of_day - 7) / 24.0)
        seasonal_factor = 1.0 + 0.25 * np.cos(2 * np.pi * (day_of_year - 30) / 365.0)
        
        # Random walk drift
        noise = np.random.normal(0, 4.0)
        current_aqi = max(15.0, min(480.0, current_aqi * 0.96 + (base_aqi * diurnal_factor * seasonal_factor) * 0.04 + noise))

        # Pollutant correlations
        pm25 = max(5.0, current_aqi * 0.45 + np.random.normal(0, 3.0))
        pm10 = max(10.0, pm25 * 1.8 + np.random.normal(0, 5.0))
        no2 = max(8.0, current_aqi * 0.2 + np.random.normal(0, 2.0))
        so2 = max(2.0, current_aqi * 0.08 + np.random.normal(0, 1.0))
        co = max(0.2, current_aqi * 0.015 + np.random.normal(0, 0.1))
        o3 = max(5.0, current_aqi * 0.25 + np.random.normal(0, 3.0))
        
        temp = 25.0 + 7.0 * np.sin(2 * np.pi * (hour_of_day - 14) / 24.0) + np.random.normal(0, 1.0)
        humidity = max(20.0, min(95.0, 60.0 - 15.0 * np.sin(2 * np.pi * (hour_of_day - 14) / 24.0) + np.random.normal(0, 3.0)))

        records.append({
            "timestamp": current_time.strftime("%Y-%m-%d %H:%M:%S"),
            "city": city_name,
            "aqi": round(current_aqi, 1),
            "pm25": round(pm25, 1),
            "pm10": round(pm10, 1),
            "no2": round(no2, 1),
            "so2": round(so2, 1),
            "co": round(co, 2),
            "o3": round(o3, 1),
            "temperature": round(temp, 1),
            "humidity": round(humidity, 1)
        })

        current_time += timedelta(hours=1)

    return pd.DataFrame(records)

if __name__ == "__main__":
    cities = [
        ("New Delhi", 185.0),
        ("Mumbai", 110.0),
        ("Bengaluru", 65.0),
        ("New York", 42.0),
        ("London", 38.0),
        ("Tokyo", 30.0)
    ]
    
    all_dfs = []
    for name, base_aqi in cities:
        df = generate_hourly_data(name, base_aqi, "")
        all_dfs.append(df)
        
    final_df = pd.concat(all_dfs, ignore_index=True)
    os.makedirs("data", exist_ok=True)
    csv_path = os.path.join("data", "sample_aqi_data.csv")
    final_df.to_csv(csv_path, index=False)
    print(f"Generated {len(final_df)} rows of synthetic AQI historical dataset at {csv_path}")
