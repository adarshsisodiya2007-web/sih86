# VARSHANET Architecture & Meteorological Engineering Specification

## 1. Executive Summary
**VARSHANET** ("Convective Weather Intelligence & 0–6 Hour Nowcasting System") is an operational-grade prototype designed for the Smart India Hackathon (SIH26084). It solves the critical operational challenge of detecting rapid convective initiation and predicting localized extreme weather phenomena (severe thunderstorms, damaging hail, cloudbursts, and microburst downbursts) within a 0–6 hour lead time.

```
+----------------------------------------------------------------------------------------------------+
|                                    VARSHANET DATA FUSION ENGINE                                    |
|                                                                                                    |
|  [Doppler Radar]   [INSAT-3D/3DR]   [Lightning TOA]   [Surface AWS]   [Rainfall]   [NWP Background] |
|        |                  |                |                |             |               |        |
|        +------------------+----------------+----------------+-------------+---------------+        |
|                                                    |                                               |
|                                        [1. Quality Control & AP Gating]                            |
|                                                    |                                               |
|                                        [2. Spatial-Temporal Alignment]                             |
|                                           (1-3 km Cartesian Grid)                                  |
|                                                    |                                               |
|                                        [3. Convective Feature Inversion]                           |
|                                       (VIL, Echo Tops, ΔT/Δt, CAPE, DCAPE)                         |
|                                                    |                                               |
|                         +--------------------------+--------------------------+                    |
|                         |                                                     |                    |
|             [4. TITAN Centroid Tracking]                          [5. Explainable Risk Score]      |
|             (Kinematic Motion Vectors)                            (POSH, CPI, Factor Attribution)  |
|                         |                                                     |                    |
|                         +--------------------------+--------------------------+                    |
|                                                    |                                               |
|                                     [6. 0-6 Hour Nowcast Synthesis]                                |
|                                                    |                                               |
|                                        [7. CAP Alert Dissemination]                                |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Mathematical & Meteorological Formulations

### 2.1 Probability of Severe Hail (POSH)
Based on the Severe Hail Algorithm (SHA; Witt et al.):
$$\text{VIL Density} = \frac{\text{VIL}}{\text{Echo Top}}$$
$$\text{SHI} = 0.1 \int_{H_0}^{H_T} W(Z) \cdot E \cdot dh$$
Where \(W(Z)\) is reflectivity weighting starting at \(45\text{ dBZ}\), and \(E\) is thermodynamic buoyancy. Hail probability increases exponentially when \(\text{VIL Density} > 3.0\text{ g/m}^3\) and maximum reflectivity exceeds \(55\text{ dBZ}\).

### 2.2 Cloudburst Potential Index (CPI)
IMD defines a cloudburst as rainfall exceeding \(100\text{ mm/hour}\) over a localized area. In VARSHANET, CPI is derived through:
$$\text{CPI} = f(R_{\text{rate}}, \text{VIL}, \Delta T_{\text{cloud-top}}, \nabla z_{\text{terrain}})$$
Where rapid cloud-top cooling (\(\Delta T / \Delta t < -4^\circ\text{C}/15\text{min}\)), overshooting tops (\(>14\text{ km}\)), and orographic slope locking multiply the short-term precipitation risk.

### 2.3 Downburst / Microburst Outflow Wind Estimation
Peak microburst surface gust potential is determined by combining radar core collapse with sub-cloud evaporation:
$$V_{\text{gust}} = V_{\text{ambient}} + \sqrt{2 \cdot \text{DCAPE}} + k \cdot (\Delta \text{dBZ} / \Delta t)$$
Where \(\text{DCAPE}\) (Downdraft Available Potential Energy) is triggered by high dewpoint depression (\(T - T_d > 10^\circ\text{C}\)) in the lowest 2 km.

---

## 3. Scientific Honesty & Demonstration Modes
1. **Simulation Mode Transparency**: All live weather cells, radar reflectivity mosaics, satellite thermal fields, lightning strokes, and sensor latencies operate in a clearly labeled **SIMULATION MODE / DEMO DATA** environment.
2. **Prototype / Derived Hazard Indicators**: POSH/SHI (Severe Hail), CPI (Cloudburst Potential), and downburst wind gust values represent **prototype / derived risk indicators** formulated from genuine atmospheric physical equations (Witt et al., IMD thresholds, DCAPE proxies), demonstrated over synthetic inputs without requiring proprietary government API keys.
3. **Explainable AI & ML-Ready Framing**: VARSHANET implements an **Explainable Convective Risk Engine**, **AI-assisted prototype**, and **ML-ready architecture**. It does *not* claim pre-trained operational deep learning model weights. The factor attribution charts are **diagnostic factor attribution weights inspired by SHAP interpretability principles**, designed to illustrate explainability for operational forecasters.
4. **No False Data Source Claims**: The platform does *not* claim direct operational IMD, NCMRWF, NASA, or government forecasting authority. Instead, it provides standard data ingest adapters designed to consume BUFR, HDF5, NetCDF, GRIB2, and GeoJSON files.
5. **Spatial Resolution**: All references specify **target spatial resolution (1–3 km)** across sub-continental sectors.
6. **Historical Events**: Historical disaster scenarios are provided as **Historical Reference Benchmarks (Demonstration Case Studies)** with calibrated simulation parameters based on published post-event meteorological analyses.
7. **Simulated Telemetry**: Sensor latencies (e.g., Radar 18s, Satellite 42s, Lightning 1.2s) are explicitly labeled as **simulated feed / simulated telemetry**.
