import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from typing import Dict

def evaluate_model_performance(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    """Calculates regression metrics: MAE, RMSE, and R2 score."""
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2 = r2_score(y_true, y_pred)
    
    return {
        "mae": round(float(mae), 2),
        "rmse": round(float(rmse), 2),
        "r2": round(float(r2), 4)
    }
