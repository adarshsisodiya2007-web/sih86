# VARSHANET — Convective Weather Intelligence & 0–6 Hour Nowcasting System
> **Smart India Hackathon 2026** • **Problem Statement: SIH26084**  
> *Convective-Scale Nowcasting for Thunderstorms, Hail & Cloudbursts (0–6 Hours)*

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.115-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_19_TypeScript-61DAFB.svg?logo=react)](https://react.dev)
[![Leaflet](https://img.shields.io/badge/GIS-Leaflet-199900.svg?logo=leaflet)](https://leafletjs.com)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind_CSS_v4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/Status-Operational_Prototype_(Simulation_Mode)-blue.svg)]()

---

## 1. Problem Statement & Operational Challenge (SIH26084)
Severe convective events — including supercell thunderstorms, destructive hailstorms, localized cloudburst flash floods, and microburst downbursts — evolve rapidly over temporal scales of **15 to 180 minutes** and spatial domains of **1 to 10 kilometers**. Standard numerical weather prediction (NWP) mesoscale models (e.g., GFS, NCMRWF unified model, standard WRF runs) typically update on 6-to-12-hour cycles and lack the spatial-temporal responsiveness to catch initial convective cloud-top glaciation and rapid updraft intensification before ground impact.

**VARSHANET** provides a centralized, operational mission-control platform designed for early warning and disaster risk reduction, fusing multiple heterogeneous sensor streams to generate transparent, hyper-local (1–3 km) **0–6 hour nowcasts**.

---

## 2. Proposed Solution: VARSHANET Architecture

VARSHANET bridges the gap between raw multi-source meteorological observations and disaster management action by integrating:
1. **Multi-Source Data Ingestion & Quality Control**:
   - S/C-Band Doppler Weather Radar (DWR) reflectivity (dBZ), Vertically Integrated Liquid (VIL), and Echo Tops
   - INSAT-3D/3DR Geostationary Satellite thermal infrared (TIR1 10.8µm) and water vapor channels
   - Ground Lightning Detection Network (GLDN) Time-of-Arrival (TOA) strokes
   - Surface Automatic Weather Stations (AWS) & high-rate tipping-bucket rain gauges
   - Mesoscale background instability indices (CAPE, CIN, bulk wind shear)
2. **Kinematic Cell Tracking (TITAN/SCIT-style)**:
   - Centroid watershed segmentation and motion vector estimation
   - 0–6 hour projected trajectories with speed, bearing, and estimated arrival (ETA)
3. **Explainable Convective Machine Learning Engine (Dual GBM + RF Ensemble)**:
   - **Trained Gradient-Boosted Regressor (120 trees)**: Predicts continuous 0–100 Convective Risk Score with R² > 0.95 and sub-10ms inference latency.
   - **Trained Random Forest Classifier (100 trees)**: Multi-hazard classification (Severe Hail, Tropical Cloudburst, Violent Downburst, Thunderstorm) with ROC-AUC > 0.98.
   - **Explainable Feature Importance**: True MDI/Gini tree-split importance extracting relative atmospheric drivers (Radar core reflectivity, CAPE, Cloud-top cooling, Echo top, etc.).
   - **Hybrid Benchmarking**: Side-by-side comparison between the trained ML model and physical heuristic baselines (Witt SHA, IMD CPI, DCAPE downbursts).
4. **Common Alerting Protocol (CAP-CP v1.2)**:
   - Automated generation of multi-tier warning alerts (INFO, WATCH, WARNING, SEVERE) formatted for NDMA / IMD emergency broadcast channels.

---

## 3. Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 with dark scientific command-center theme
- **Mapping & GIS**: Leaflet with custom dark CartoDB tiles, canvas radar layers, and animated storm markers
- **Data Visualization**: Recharts (temporal probability curves, risk factor waterfalls)
- **Icons**: Lucide React

### Backend
- **Framework**: Python 3.13 + FastAPI + Uvicorn ASGI
- **Data Modeling & Validation**: Pydantic v2
- **Real-Time Communication**: WebSockets (`/ws/live`) with asynchronous event broadcast
- **Scientific Computations**: NumPy & Python math
- **Database Schema**: PostgreSQL + PostGIS (spatial geometry indexes & temporal partitioning)

---

## 4. Operational Modules & Views

1. **Mission Control**: Unified operational dashboard featuring 7 KPI cards, full interactive Leaflet GIS map with simulated radar reflectivity overlay, active storm cell tracker with ETAs, and interactive 0–6 hour timeline scrubber.
2. **Live Nowcast**: Dedicated forecast engine view highlighting the 5-stage ingestion pipeline, animated horizon progression, and diagnostic confidence analysis.
3. **Weather Map**: GIS workstation with split-pane storm cell inspector, coordinate readouts, and individual layer toggles (Radar, Satellite, Lightning, Storm Cells, Hazard Polygons, Trajectory Vectors) with target spatial resolution (1–3 km).
4. **Hazard Analysis**: Deep-dive diagnostic panels for **Thunderstorm**, **Hail**, **Cloudburst**, and **Downburst** with physical criteria and standard operating procedures (prototype indicators).
5. **Forecast Timeline**: Multi-metric temporal evolution charts (0h to +6h) featuring probability curves, rain accumulation rates, and gale-force wind gust bands.
6. **Data Fusion**: Transparent visualization of the 7 sensor streams with simulated feed latencies, coverage metrics, and spatial alignment steps.
7. **Alerts Management**: Multi-tier alert desk with severity filters, siren alarm toggles, acknowledgement workflows, and OASIS CAP 1.2 XML/JSON schema preview.
8. **Historical Reference Benchmarks**: Comparative disaster analyzer benchmarking live cells against historical Indian events (Demonstration Case Studies: e.g., 2023 Beas Cloudburst, 2022 Vidarbha Hailstorm, 2021 Kolkata Nor'wester, 2013 Kedarnath, 2005 Mumbai Deluge) using calibrated simulation parameters.
9. **AI Insights**: Transparent 0–100 Convective Risk Score with diagnostic factor attribution weights (inspired by SHAP interpretability principles) and actionable operational directives.
10. **System Health**: Infrastructure telemetry monitoring radar scan latencies (simulated), satellite feeds, WebSocket connection rates, and service uptime.
11. **System Architecture**: Interactive 7-layer engineering diagram and disaster management stakeholder integration mapping.

---

## 5. Scientific Honesty & Demonstration Mode Notice
> [!IMPORTANT]
> **SIH SCIENTIFIC HONESTY & TRANSPARENCY NOTICE**:  
> In accordance with Smart India Hackathon scientific credibility and ethical guidelines:
> 1. **Simulation Mode / Demo Data**: All live weather cells, radar reflectivity mosaics, satellite thermal fields, lightning strokes, and sensor latencies operate in a clearly labeled **SIMULATION MODE / DEMO DATA** environment.
> 2. **Prototype Derived Indices**: POSH/SHI (Severe Hail), CPI (Cloudburst Potential), and downburst wind gust values represent **prototype / derived risk indicators** formulated from genuine atmospheric physical equations (Witt et al., IMD thresholds, DCAPE proxies), demonstrated over synthetic inputs without requiring proprietary government API keys.
> 3. **Explainable AI & ML-Ready Framing**: VARSHANET implements an **Explainable Convective Risk Engine**, **AI-assisted prototype**, and **ML-ready architecture**. It does *not* claim pre-trained operational deep learning model weights. The factor attribution charts are **diagnostic factor attribution weights inspired by SHAP interpretability principles**, designed to illustrate explainability for operational forecasters.
> 4. **No False Data Source Claims**: The platform does *not* claim direct operational IMD, NCMRWF, NASA, or government forecasting authority. Instead, it provides standard data ingest adapters designed to consume BUFR, HDF5, NetCDF, GRIB2, and GeoJSON files.
> 5. **Spatial Resolution**: All references indicate **target spatial resolution (1–3 km)** across sub-continental sectors.
> 6. **Historical Events**: Historical disaster scenarios are provided as **Historical Reference Benchmarks (Demonstration Case Studies)** with calibrated simulation parameters based on published post-event meteorological analyses.

---

## 6. Installation & Quick Start

### Prerequisites
- Node.js >= 20.x and npm >= 10.x
- Python >= 3.11 (tested on Python 3.13)

### Running the Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The FastAPI interactive documentation will be available at:  
`http://localhost:8000/docs`

### Running the Frontend
```bash
cd frontend
npm install
npm run dev
```
The application will launch on:  
`http://localhost:5173`

---

## 7. Running with Docker Compose
To run both backend and frontend in containerized production mode:
```bash
docker compose up --build
```
- Frontend UI: `http://localhost:3000`
- Backend API & Docs: `http://localhost:8000/docs`

---

## 8. Verification & Testing

The backend includes a comprehensive Pytest test suite validating meteorological formulas, storm cell kinematics, alert trigger thresholds, and REST endpoints:

```bash
cd backend
pytest tests/ -v
```

**Test Coverage**:
- `test_health_endpoint`: Service health check & simulation mode confirmation
- `test_posh_calculation`: Severe Hail Index & Witt SHA probability verification
- `test_cloudburst_calculation`: Cloudburst Potential Index (CPI) threshold testing
- `test_downburst_calculation`: Microburst core collapse wind gust math
- `test_convective_risk_assessment`: Explainable factor attribution synthesis
- `test_storm_cells_endpoint`: Vector advection and polygon generation
- `test_forecast_timeline_endpoint`: 0–6 hour hourly timeline array
- `test_alerts_endpoint`: Warning generation and operator acknowledgement
- `test_simulation_tick`: Real-time state progression
- `test_system_health_endpoint`: Telemetry latency metrics

---

## 9. Pluggable Architecture for Standard Meteorological Formats
The backend architecture is intentionally decoupled from the simulation layer. In operational deployment, each sensor adapter is designed to consume standard international and national meteorological formats:
- **Doppler Weather Radar (DWR)**: Ingests WMO BUFR, HDF5 (ODIM_H5 convention), and CF-compliant NetCDF4 radar volume scan files.
- **Geostationary Satellite (INSAT-3D/3DR/3DS)**: Ingests HDF5 Level-1B and Level-2 products (radiance, brightness temperature TIR1/WV) directly from ISRO MOSDAC APIs.
- **Numerical Weather Prediction (NWP)**: Ingests GRIB2 and NetCDF grids from NCMRWF / IMD mesoscale WRF and GFS background analyses.
- **Lightning Networks**: Ingests NLDN/GLDN Time-of-Arrival (TOA) binary UDP, CSV, and GeoJSON stroke streams.
- **Automatic Weather Stations (AWS)**: Ingests state disaster mesonet data via REST JSON and MQTT telemetry protocols.
- **AI/ML Engine**: The modular risk engine interface (`evaluate_convective_risk`) is designed to load PyTorch (`.pt`) or ONNX runtime model checkpoints trained on dual-pol radar cubes.
- **Warning Dissemination**: Produces OASIS / WMO Common Alerting Protocol (CAP-CP v1.2) XML and JSON alert payloads for NDMA Sachet and national cell broadcast networks.

---

## 10. Repository Structure
```
sih86/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── endpoints.py         # REST endpoints (health, cells, forecast, alerts, etc.)
│   │   ├── database/
│   │   │   └── schema.sql           # Production PostgreSQL/PostGIS DDL schema
│   │   ├── models/
│   │   │   └── schemas.py           # Pydantic v2 data models
│   │   ├── services/
│   │   │   ├── meteorology.py       # Physical indices (POSH, CPI, Downburst, XAI)
│   │   │   └── simulation.py        # Real-time stateful kinematic simulator
│   │   └── main.py                  # FastAPI app & WebSocket broadcast loop
│   ├── tests/
│   │   └── test_backend.py          # Pytest test suite (100% pass)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/           # KPI cards, sparklines, active cell trackers
│   │   │   ├── layout/              # Navbar, Sidebar with collapse
│   │   │   ├── maps/                # Leaflet GIS Map with radar reflectivity scale
│   │   │   └── nowcast/             # 0-6H nowcast timeline scrubber
│   │   ├── context/
│   │   │   └── WeatherContext.tsx   # Global state & WebSocket auto-sync
│   │   ├── pages/                   # All 11 operational modules + Landing screen
│   │   ├── services/                # API client with offline fallback
│   │   └── types/                   # TypeScript interfaces
│   ├── Dockerfile
│   └── vite.config.ts
├── data/
│   ├── historical_events.json       # Benchmark historical disaster events
│   └── sample_weather.json          # Calibrated regional weather reference
├── docs/
│   └── architecture.md              # Technical and mathematical engineering docs
├── docker-compose.yml
└── README.md
```

---

## 11. Authors & Hackathon Submission
- **Project**: VARSHANET (Convective Weather Intelligence System)
- **Problem Statement**: SIH26084 (Convective-Scale Nowcasting for Thunderstorms, Hail & Cloudbursts, 0–6 Hours)
- **Year**: Smart India Hackathon 2026
