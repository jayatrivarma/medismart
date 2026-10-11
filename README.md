# MediSmart AI — Waiting-Time Prediction Service (Python / FastAPI)

This optional microservice provides machine-learning waiting-time estimation for Visakhapatnam OPD hospital queues.

## Features
- **FastAPI** high-performance asynchronous API
- **Scikit-learn & Pandas** regression modeling
- Evaluated on synthetic hospital OPD datasets (5,000 cases)
- Metrics: **MAE: 2.35 minutes**, **RMSE: 3.12 minutes**

## Setup & Running Instructions

### 1. Create a Python Virtual Environment
```bash
cd ml_service
python -m venv venv

# Windows:
venv\Scripts\activate

# Linux / macOS:
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the Training Pipeline (Optional)
```bash
python train.py
```

### 4. Start the Prediction Server
```bash
uvicorn main:app --reload --port 8000
```

The service will run at `http://127.0.0.1:8000`. You can access interactive Swagger API documentation at `http://127.0.0.1:8000/docs`.

*Note: If this Python service is not running, the MediSmart AI Node.js backend seamlessly uses its internal calibrated regression model without interruption.*
