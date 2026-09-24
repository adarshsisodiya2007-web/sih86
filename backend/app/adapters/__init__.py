"""
VARSHANET Data Ingestion Adapters Module
Defines standard interfaces for operational meteorological data feeds.
"""
from .dwr_adapter import DWRRadarAdapter, dwr_adapter
from .insat_adapter import INSATAdapter, insat_adapter
from .lightning_adapter import LightningAdapter, lightning_adapter
from .aws_adapter import SurfaceAWSAdapter, aws_adapter
from .rain_gauge_adapter import RainGaugeAdapter, rain_gauge_adapter
from .nwp_adapter import NWPAdapter, nwp_adapter
from .terrain_adapter import TerrainDEMAdapter, terrain_adapter

__all__ = [
    "DWRRadarAdapter", "dwr_adapter",
    "INSATAdapter", "insat_adapter",
    "LightningAdapter", "lightning_adapter",
    "SurfaceAWSAdapter", "aws_adapter",
    "RainGaugeAdapter", "rain_gauge_adapter",
    "NWPAdapter", "nwp_adapter",
    "TerrainDEMAdapter", "terrain_adapter"
]
