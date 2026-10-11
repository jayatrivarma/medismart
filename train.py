"""
MediSmart AI - Waiting-Time Prediction Model Training Pipeline
Visakhapatnam (Vizag) OPD Clinic Simulation Dataset

This script trains a regression model predicting patient waiting time (in minutes)
based on queue size, average doctor consultation time, peak clinic hour, day of week,
and recent delays.

Features:
- patients_ahead (integer: 0 to 25)
- avg_consultation_time (float: 8 to 20 minutes)
- hour_of_day (integer: 8 to 20)
- day_of_week (integer: 0=Mon to 6=Sun)
- queue_delay_factor (float: 0.8 to 1.5)

Target:
- wait_time_minutes (float: actual waiting time experienced)
"""

import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

def generate_synthetic_opd_data(n_samples=5000, random_seed=42):
    np.random.seed(random_seed)
    
    patients_ahead = np.random.randint(0, 26, size=n_samples)
    avg_consultation_time = np.random.uniform(8.0, 18.0, size=n_samples)
    hour_of_day = np.random.randint(8, 20, size=n_samples)
    day_of_week = np.random.randint(0, 7, size=n_samples)
    
    # Peak hour surge (10 AM to 1 PM, 5 PM to 7 PM)
    peak_rush = np.where((hour_of_day >= 10) & (hour_of_day <= 13), 1.2, 1.0)
    peak_rush = np.where((hour_of_day >= 17) & (hour_of_day <= 19), 1.15, peak_rush)
    
    # Monday post-weekend surge
    day_surge = np.where(day_of_week == 0, 1.12, 1.0)
    day_surge = np.where(day_of_week == 5, 1.08, day_surge)
    
    # Noise for clinical variation
    noise = np.random.normal(0, 2.5, size=n_samples)
    
    # Target wait time calculation
    wait_time_minutes = np.maximum(
        0.0,
        (patients_ahead * avg_consultation_time * peak_rush * day_surge * 0.95) + noise
    )
    
    df = pd.DataFrame({
        'patients_ahead': patients_ahead,
        'avg_consultation_time': np.round(avg_consultation_time, 1),
        'hour_of_day': hour_of_day,
        'day_of_week': day_of_week,
        'peak_rush': peak_rush,
        'day_surge': day_surge,
        'wait_time_minutes': np.round(wait_time_minutes, 1)
    })
    
    return df

def train_and_evaluate():
    print("Generating synthetic Vizag OPD healthcare training data (5,000 samples)...")
    df = generate_synthetic_opd_data(n_samples=5000)
    
    X = df[['patients_ahead', 'avg_consultation_time', 'hour_of_day', 'day_of_week']]
    y = df['wait_time_minutes']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train Linear Regression model for fast, explainable baseline
    lr_model = LinearRegression()
    lr_model.fit(X_train, y_train)
    lr_preds = lr_model.predict(X_test)
    
    lr_mae = mean_absolute_error(y_test, lr_preds)
    lr_rmse = np.sqrt(mean_squared_error(y_test, lr_preds))
    lr_r2 = r2_score(y_test, lr_preds)
    
    # Train Random Forest Regressor
    rf_model = RandomForestRegressor(n_estimators=50, max_depth=8, random_state=42)
    rf_model.fit(X_train, y_train)
    rf_preds = rf_model.predict(X_test)
    
    rf_mae = mean_absolute_error(y_test, rf_preds)
    rf_rmse = np.sqrt(mean_squared_error(y_test, rf_preds))
    rf_r2 = r2_score(y_test, rf_preds)
    
    print("\n--- Model Evaluation Results ---")
    print(f"Linear Regression: MAE={lr_mae:.2f} mins | RMSE={lr_rmse:.2f} mins | R²={lr_r2:.4f}")
    print(f"Random Forest:     MAE={rf_mae:.2f} mins | RMSE={rf_rmse:.2f} mins | R²={rf_r2:.4f}")
    
    # Save model weights & metadata to json for interoperability
    metadata = {
        'model_type': 'RandomForestRegressor & LinearRegression',
        'training_dataset': 'Synthetic Visakhapatnam OPD Clinic Flow (5,000 cases)',
        'metrics': {
            'linear_regression': {
                'mae': round(lr_mae, 2),
                'rmse': round(lr_rmse, 2),
                'r2': round(lr_r2, 4),
                'intercept': float(lr_model.intercept_),
                'coefficients': {col: float(coef) for col, coef in zip(X.columns, lr_model.coef_)}
            },
            'random_forest': {
                'mae': round(rf_mae, 2),
                'rmse': round(rf_rmse, 2),
                'r2': round(rf_r2, 4)
            }
        }
    }
    
    with open('model_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)
    print("\nModel metadata saved to model_metadata.json")

if __name__ == '__main__':
    train_and_evaluate()
