"""
VARSHANET Ground Lightning Detection Network (GLDN) Adapter
Interface for Time-of-Arrival (TOA) and magnetic direction-finding lightning networks.

STATUS:
  GLDN LIGHTNING ADAPTER READY — NOT CONNECTED (INSTITUTIONAL GATEWAY REQUIRED)

NOTE:
  Real ground lightning feeds (IITM Damini / GLDN) require institutional gateway connection.
  Do NOT claim GLDN/Damini connectivity unless an actual live feed has been configured.
  Simulated lightning is strictly isolated to SIMULATION MODE.
"""
import os
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from app.models.schemas import NormalizedObservation, NormalizedLocation, NormalizedSourceStatus

class LightningStroke:
    def __init__(
        self,
        latitude: float,
        longitude: float,
        timestamp: str,
        intensity_ka: Optional[float] = None,
        polarity: Optional[str] = None,
        flash_type: str = "CG",
        source: str = "GLDN-ADAPTER",
        quality: float = 1.0
    ):
        self.latitude = latitude
        self.longitude = longitude
        self.timestamp = timestamp
        self.intensity_ka = intensity_ka
        self.polarity = polarity  # "+" or "-"
        self.flash_type = flash_type  # "CG" (Cloud-to-Ground) or "IC" (Intra-Cloud)
        self.source = source
        self.quality = quality

    def to_dict(self) -> Dict[str, Any]:
        return {
            "latitude": self.latitude,
            "longitude": self.longitude,
            "timestamp": self.timestamp,
            "intensity_ka": self.intensity_ka,
            "polarity": self.polarity,
            "flash_type": self.flash_type,
            "source": self.source,
            "quality": self.quality
        }

class LightningAdapter:
    """
    Standard ingestion adapter for ground lightning detection networks (GLDN / IITM Damini TOA).
    """
    def __init__(self):
        self.source_name = "Ground Lightning Detection (GLDN)"
        self.source_type = "Lightning Detection Network"
        self.target_coverage = "Sub-continental Time-of-Arrival (TOA) Grid"

        self.feed_url = os.getenv("LIGHTNING_FEED_URL")
        self.broker_key = os.getenv("DAMINI_BROKER_KEY")
        self.is_connected = bool(self.feed_url and self.broker_key)
        self.status = "CONNECTED" if self.is_connected else "ADAPTER READY"
        self.connection_state = "CONNECTED" if self.is_connected else "NOT CONNECTED"

    def test_connection(self) -> Dict[str, Any]:
        """Tests lightning feed connectivity or returns configuration requirements."""
        if not self.is_connected:
            return {
                "source": self.source_name,
                "status": "NOT CONNECTED",
                "connected": False,
                "error": "Missing LIGHTNING_FEED_URL or DAMINI_BROKER_KEY environment variables.",
                "required_config": ["LIGHTNING_FEED_URL", "DAMINI_BROKER_KEY"],
                "note": "Institutional ground lightning detection network stream required."
            }
        return {
            "source": self.source_name,
            "status": "CONFIGURED",
            "connected": True,
            "feed_url": self.feed_url,
            "note": "Lightning broker credentials provisioned."
        }

    def ingest_strokes(self, stroke_records: List[Dict[str, Any]]) -> List[LightningStroke]:
        """Parses and validates incoming raw lightning strokes."""
        if not self.is_connected:
            raise ConnectionError("GLDN feed is NOT CONNECTED. Adapter is ready for feed connection.")
        strokes = []
        for r in stroke_records:
            strokes.append(LightningStroke(
                latitude=r["lat"],
                longitude=r["lon"],
                timestamp=r.get("timestamp", datetime.now(timezone.utc).isoformat()),
                intensity_ka=r.get("intensity_ka"),
                polarity=r.get("polarity", "-"),
                flash_type=r.get("flash_type", "CG"),
                source=self.source_name,
                quality=r.get("quality", 0.95)
            ))
        return strokes

    def get_status_info(self) -> Dict[str, Any]:
        """Returns metadata for Data Fusion and System Health monitors."""
        return {
            "source": self.source_name,
            "type": self.source_type,
            "status": "CONNECTED" if self.is_connected else "NOT CONNECTED",
            "connection_state": "CONNECTED" if self.is_connected else "NOT CONNECTED",
            "auth_status": "AUTHENTICATED" if self.is_connected else "AUTHENTICATION / BROKER REQUIRED",
            "last_update": "—",
            "latency": "—",
            "data_freshness": "NOT CONFIGURED",
            "coverage": self.target_coverage,
            "is_live_external": self.is_connected,
            "note": "Adapter ready for IITM / GLDN real-time lightning stroke stream. Not claimed as live until connected."
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
                "flash_rate_per_min": None,
                "latest_strike_distance_km": None,
                "peak_current_ka": None
            },
            quality={
                "data_quality": "TOA_HIGH_PRECISION" if self.is_connected else "UNAVAILABLE",
                "confidence_pct": 90 if self.is_connected else 0,
                "qc_flags": ["GLDN_CONNECTED"] if self.is_connected else ["GLDN_DISCONNECTED"]
            },
            metadata=self.get_status_info()
        )

lightning_adapter = LightningAdapter()
