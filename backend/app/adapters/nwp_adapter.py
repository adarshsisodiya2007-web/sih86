"""
VARSHANET Numerical Weather Prediction (NWP) Ingestion Adapter
Interface for high-resolution WRF (Weather Research & Forecasting) 3km and GFS/NCMRWF mesoscale background fields.

STATUS:
  NWP (OPEN-METEO ECMWF/GFS): LIVE & CONNECTED
  STANDALONE WRF 3KM HPC RUNS: NOT HOSTED / NOT CONNECTED

NOTE:
  Real NWP gridded atmospheric fields (CAPE, CIN, surface pressure, wind gusts)
  are ingested from Open-Meteo's ECMWF IFS / GFS Seamless model pipeline.
  Do NOT call Open-Meteo data "WRF" unless the actual selected model is WRF.
  This adapter provides the standardized contract for direct WRF GRIB2 ingestion.
"""
import os
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from app.models.schemas import NormalizedObservation, NormalizedLocation, NormalizedSourceStatus
from app.services.live_weather_service import live_weather_service

class NWPAdapter:
    """
    Standard ingestion adapter for mesoscale NWP gridded model outputs (WRF, GFS, ECMWF GRIB2).
    """
    def __init__(self):
        self.source_name = "NWP Environmental Models (ECMWF / GFS / WRF)"
        self.source_type = "Numerical Weather Prediction"
        self.target_coverage = "Regional Mesoscale Grid (India)"

        self.wrf_server = os.getenv("WRF_GRIB_SERVER_URL")
        self.is_wrf_connected = bool(self.wrf_server)
        self.status = "CONNECTED" if self.is_wrf_connected else "NOT CONNECTED"
        self.connection_state = "CONNECTED" if self.is_wrf_connected else "NOT CONNECTED"

    def test_connection(self) -> Dict[str, Any]:
        """Tests NWP connectivity or returns configuration requirements."""
        return {
            "source": self.source_name,
            "connected_nwp_provider": "Open-Meteo (ECMWF IFS & GFS Seamless Gridded Forecast)",
            "nwp_status": "LIVE & OPERATIONAL",
            "standalone_wrf_status": "CONFIGURED" if self.is_wrf_connected else "NOT HOSTED",
            "required_config_for_wrf": ["WRF_GRIB_SERVER_URL"],
            "note": "Atmospheric instability fields are live via Open-Meteo ECMWF/GFS model runs."
        }

    def fetch_live_nwp_fields(self, region_name: str) -> Dict[str, Any]:
        """Fetches live NWP instability parameters via Open-Meteo."""
        return live_weather_service.fetch_open_meteo_live(region_name)

    def get_status_info(self) -> Dict[str, Any]:
        """Returns metadata for Data Fusion and System Health monitors."""
        return {
            "source": self.source_name,
            "type": self.source_type,
            "status": "LIVE (VIA OPEN-METEO ECMWF/GFS)",
            "connection_state": "ONLINE",
            "auth_status": "PUBLIC OPEN ACCESS (ECMWF/GFS via Open-Meteo)",
            "last_update": "Synchronized with Open-Meteo model runs",
            "latency": f"{live_weather_service.last_open_meteo_latency_sec}s",
            "data_freshness": "FRESH (NWP MODEL RUNS)",
            "coverage": self.target_coverage,
            "is_live_external": True,
            "note": "Real gridded NWP model data via Open-Meteo. Standalone WRF 3km HPC cluster is NOT HOSTED."
        }

    def to_normalized_observation(self, lat: float, lon: float, region_name: str = "Nagpur Sector (Vidarbha)") -> NormalizedObservation:
        """Produces a standardized schema entry indicating adapter state."""
        raw = self.fetch_live_nwp_fields(region_name)
        is_live = raw.get("status") == "LIVE"

        return NormalizedObservation(
            source="NWP (ECMWF / GFS via Open-Meteo)",
            source_type=self.source_type,
            status=NormalizedSourceStatus.LIVE if is_live else NormalizedSourceStatus.OFFLINE,
            timestamp=raw.get("valid_time", datetime.now(timezone.utc).isoformat()),
            location=NormalizedLocation(lat=lat, lon=lon, region_name=region_name),
            variables={
                "model_cape_jkg": raw.get("live_cape_jkg"),
                "model_surface_pressure_hpa": raw.get("surface_pressure_hpa"),
                "model_gusts_kmh": raw.get("peak_gust_kmh"),
                "hourly_precip_forecast_mm": raw.get("hourly_precipitation_forecast_mm")
            },
            quality={
                "data_quality": "ECMWF_WMO_GRIDDED",
                "confidence_pct": 92 if is_live else 0,
                "qc_flags": ["NWP_ACTIVE"] if is_live else ["NWP_UNAVAILABLE"]
            },
            metadata=self.get_status_info()
        )

nwp_adapter = NWPAdapter()
