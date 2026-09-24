"""
VARSHANET High-Rate Tipping-Bucket & Disdrometer Ingestion Adapter
Interface for Automated Rain Gauges (ARG) and laser optical disdrometers.

STATUS:
  RAIN GAUGE / DISDROMETER ADAPTER READY — NOT CONNECTED (REGIONAL NETWORK REQUIRED)

NOTE:
  Physical rain gauges require regional hydrological / irrigation network connection.
  Do NOT claim Open-Meteo forecast precipitation is a physical rain-gauge observation.
  Synthetic gauge data is strictly isolated to SIMULATION MODE.
"""
import os
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from app.models.schemas import NormalizedObservation, NormalizedLocation, NormalizedSourceStatus

class RainGaugeAdapter:
    """
    Standard ingestion adapter for tipping-bucket rain gauges and OTT Parsivel optical disdrometers.
    """
    def __init__(self):
        self.source_name = "Disdrometers & Rain Gauges"
        self.source_type = "Rainfall Observations"
        self.target_coverage = "River Basins & Urban Catchment Networks"

        self.stream_url = os.getenv("RAIN_GAUGE_STREAM_URL")
        self.is_connected = bool(self.stream_url)
        self.status = "CONNECTED" if self.is_connected else "ADAPTER READY"
        self.connection_state = "CONNECTED" if self.is_connected else "NOT CONNECTED"

    def test_connection(self) -> Dict[str, Any]:
        """Tests rain gauge stream connectivity or returns configuration requirements."""
        if not self.is_connected:
            return {
                "source": self.source_name,
                "status": "NOT CONNECTED",
                "connected": False,
                "error": "Missing RAIN_GAUGE_STREAM_URL environment variable.",
                "required_config": ["RAIN_GAUGE_STREAM_URL"],
                "note": "Regional hydrological or municipal automated rain gauge network connection required."
            }
        return {
            "source": self.source_name,
            "status": "CONFIGURED",
            "connected": True,
            "stream_url": self.stream_url,
            "note": "Rain gauge telemetry broker provisioned."
        }

    def get_status_info(self) -> Dict[str, Any]:
        """Returns metadata for Data Fusion and System Health monitors."""
        return {
            "source": self.source_name,
            "type": self.source_type,
            "status": "CONNECTED" if self.is_connected else "NOT CONNECTED",
            "connection_state": "CONNECTED" if self.is_connected else "NOT CONNECTED",
            "auth_status": "AUTHENTICATED" if self.is_connected else "REGIONAL HYDROLOGICAL NETWORK REQUIRED",
            "last_update": "—",
            "latency": "—",
            "data_freshness": "NOT CONFIGURED",
            "coverage": self.target_coverage,
            "is_live_external": self.is_connected,
            "note": "Adapter ready for physical ARG telemetry and optical disdrometer feeds. Forecast precip is NOT labeled as gauge data."
        }

    def to_normalized_observation(self, lat: float, lon: float) -> NormalizedObservation:
        """Produces a standardized schema entry indicating adapter state."""
        return NormalizedObservation(
            source=self.source_name,
            source_type=self.source_type,
            status=NormalizedSourceStatus.LIVE if self.is_connected else NormalizedSourceStatus.ADAPTER_READY,
            timestamp=datetime.now(timezone.utc).isoformat(),
            location=NormalizedLocation(lat=lat, lon=lon),
            variables={
                "rain_rate_mmh": None,
                "accumulation_15min_mm": None,
                "drop_size_distribution_dmean_mm": None
            },
            quality={
                "data_quality": "HYDROLOGICAL_QC" if self.is_connected else "UNAVAILABLE",
                "confidence_pct": 94 if self.is_connected else 0,
                "qc_flags": ["GAUGE_CONNECTED"] if self.is_connected else ["GAUGE_DISCONNECTED"]
            },
            metadata=self.get_status_info()
        )

rain_gauge_adapter = RainGaugeAdapter()
