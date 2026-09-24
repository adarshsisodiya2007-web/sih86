import logging
import urllib.request
import urllib.error
import json
import time
import os
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from app.models.schemas import (
    NormalizedObservation,
    NormalizedLocation,
    NormalizedSourceStatus
)

logger = logging.getLogger("varshanet.live_service")

# Regional coordinate mapping for India (with nearest ICAO airport code for real METAR AWS observations)
REGION_METADATA = {
    "Nagpur Sector (Vidarbha)": {
        "lat": 21.1458,
        "lon": 79.0882,
        "elev": 310,
        "icao": "VANP",
        "station_name": "Dr. Babasaheb Ambedkar Intl Airport, Nagpur"
    },
    "Mumbai-Pune Gateway": {
        "lat": 18.9220,
        "lon": 73.4500,
        "elev": 560,
        "icao": "VABB",
        "station_name": "Chhatrapati Shivaji Maharaj Intl Airport, Mumbai"
    },
    "Kolkata & Gangetic Delta": {
        "lat": 22.5726,
        "lon": 88.3639,
        "elev": 9,
        "icao": "VECC",
        "station_name": "Netaji Subhash Chandra Bose Intl Airport, Kolkata"
    },
    "Dehradun & Foothills": {
        "lat": 30.3165,
        "lon": 78.0322,
        "elev": 640,
        "icao": "VIDN",
        "station_name": "Jolly Grant Airport, Dehradun"
    },
    "Siliguri & NE Basin": {
        "lat": 26.7271,
        "lon": 88.3953,
        "elev": 122,
        "icao": "VEBD",
        "station_name": "Bagdogra Airport, Siliguri"
    },
    "Hyderabad-Deccan": {
        "lat": 17.3850,
        "lon": 78.4867,
        "elev": 542,
        "icao": "VOHS",
        "station_name": "Rajiv Gandhi Intl Airport, Hyderabad"
    },
    "Ranchi & Chota Nagpur": {
        "lat": 23.3441,
        "lon": 85.3096,
        "elev": 651,
        "icao": "VERC",
        "station_name": "Birsa Munda Airport, Ranchi"
    },
    "Jaipur-Eastern Rajasthan": {
        "lat": 26.9124,
        "lon": 75.7873,
        "elev": 431,
        "icao": "VIJP",
        "station_name": "Jaipur Intl Airport, Jaipur"
    }
}

class LiveWeatherService:
    """
    Live Meteorological Data Ingestion Service.
    Integrates genuine, publicly accessible, unauthenticated meteorological APIs:
    1. Open-Meteo Atmospheric Dynamics API (Numerical model forecast: ECMWF / GFS / ICON)
    2. RainViewer Global Doppler Radar Tile API (Global composite radar mosaic)
    3. NOAA / WMO Aviation Weather Center METAR API (Real physical airport surface weather stations)
    """
    def __init__(self):
        self._om_cache: Dict[str, Dict[str, Any]] = {}
        self._om_cache_time: Dict[str, float] = {}
        self._radar_cache: Optional[Dict[str, Any]] = None
        self._radar_cache_time: float = 0
        self._metar_cache: Dict[str, Dict[str, Any]] = {}
        self._metar_cache_time: Dict[str, float] = {}
        
        self.last_open_meteo_latency_sec: float = 0.8
        self.last_rainviewer_latency_sec: float = 1.1
        self.last_metar_latency_sec: float = 0.9

    # --------------------------------------------------------------------------
    # 1. OPEN-METEO (Atmospheric NWP / Sounding Model Forecast)
    # --------------------------------------------------------------------------
    def fetch_open_meteo_live(self, region_name: str) -> Dict[str, Any]:
        """
        Fetches real atmospheric dynamics and sounding parameters from Open-Meteo.
        Data Type: Model / Forecast (ECMWF IFS / GFS Seamless)
        """
        meta = REGION_METADATA.get(region_name, REGION_METADATA["Nagpur Sector (Vidarbha)"])
        lat, lon = meta["lat"], meta["lon"]
        now = time.time()

        # Cache for 90 seconds to respect rate limits
        if region_name in self._om_cache and (now - self._om_cache_time.get(region_name, 0) < 90):
            return self._om_cache[region_name]

        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={lat}&longitude={lon}&"
            f"current=temperature_2m,relative_humidity_2m,dew_point_2m,surface_pressure,wind_speed_10m,wind_gusts_10m,precipitation,weather_code,cloud_cover&"
            f"hourly=cape,precipitation,wind_gusts_10m,surface_pressure,relative_humidity_2m,dew_point_2m,temperature_2m&"
            f"forecast_days=1"
        )

        t0 = time.time()
        for attempt in range(2):
            try:
                req = urllib.request.Request(
                    url,
                    headers={"User-Agent": "VARSHANET-SIH86/2.5 (DisasterManagementResearch)"}
                )
                with urllib.request.urlopen(req, timeout=4) as response:
                    if response.status == 200:
                        latency = round(time.time() - t0, 3)
                        self.last_open_meteo_latency_sec = latency
                        data = json.loads(response.read().decode('utf-8'))
                        current = data.get("current", {})
                        hourly = data.get("hourly", {})

                        cape_vals = hourly.get("cape", [0.0])
                        live_cape = float(cape_vals[0] if cape_vals else 0.0)
                        hourly_precip = hourly.get("precipitation", [0.0])[:6]

                        temp = float(current.get("temperature_2m", 25.0))
                        dew = float(current.get("dew_point_2m", 18.0))
                        dew_dep = round(temp - dew, 1)

                        result = {
                            "source": "Open-Meteo",
                            "provider": "Open-Meteo (ECMWF / GFS Seamless)",
                            "data_type": "MODEL / FORECAST",
                            "status": "LIVE",
                            "connection_state": "ONLINE",
                            "is_live_external": True,
                            "latitude": lat,
                            "longitude": lon,
                            "elevation_m": meta["elev"],
                            "temperature_c": temp,
                            "relative_humidity_pct": float(current.get("relative_humidity_2m", 60.0)),
                            "dewpoint_c": dew,
                            "dewpoint_depression_c": dew_dep,
                            "surface_pressure_hpa": float(current.get("surface_pressure", 1010.0)),
                            "surface_wind_kmh": float(current.get("wind_speed_10m", 10.0)),
                            "peak_gust_kmh": float(current.get("wind_gusts_10m", 20.0)),
                            "instant_precipitation_mmh": float(current.get("precipitation", 0.0)),
                            "live_cape_jkg": live_cape,
                            "cloud_cover_pct": float(current.get("cloud_cover", 30.0)),
                            "weather_code": int(current.get("weather_code", 0)),
                            "hourly_precipitation_forecast_mm": hourly_precip,
                            "latency_sec": latency,
                            "data_freshness": "FRESH (LIVE FETCH)",
                            "coverage": f"India Regional Grid ({region_name})",
                            "retrieved_at": datetime.now(timezone.utc).isoformat(),
                            "valid_time": current.get("time", datetime.now(timezone.utc).isoformat()),
                            "attribution": "Real external gridded NWP model data via Open-Meteo (WMO / ECMWF / GFS). NOT VARSHANET AI PREDICTION. NOT physical surface station sensor."
                        }
                        self._om_cache[region_name] = result
                        self._om_cache_time[region_name] = now
                        return result
            except Exception as e:
                logger.warning(f"Open-Meteo attempt {attempt + 1} failed for {region_name}: {e}")
                time.sleep(0.3)

        # Explicit failure report (never disguise as live)
        if region_name in self._om_cache:
            stale = self._om_cache[region_name].copy()
            stale["status"] = "STALE_CACHE"
            stale["data_freshness"] = "CACHED / REFRESH FAILED"
            return stale

        return {
            "source": "Open-Meteo",
            "provider": "Open-Meteo",
            "data_type": "MODEL / FORECAST",
            "status": "SOURCE UNAVAILABLE",
            "connection_state": "OFFLINE",
            "is_live_external": False,
            "latitude": lat,
            "longitude": lon,
            "elevation_m": meta["elev"],
            "temperature_c": None,
            "relative_humidity_pct": None,
            "dewpoint_c": None,
            "dewpoint_depression_c": None,
            "surface_pressure_hpa": None,
            "surface_wind_kmh": None,
            "peak_gust_kmh": None,
            "instant_precipitation_mmh": None,
            "live_cape_jkg": None,
            "cloud_cover_pct": None,
            "weather_code": None,
            "hourly_precipitation_forecast_mm": [],
            "latency_sec": round(time.time() - t0, 3),
            "data_freshness": "UNAVAILABLE",
            "coverage": f"India Regional Grid ({region_name})",
            "retrieved_at": datetime.now(timezone.utc).isoformat(),
            "valid_time": None,
            "attribution": "Open-Meteo endpoint unreachable. Source marked UNAVAILABLE."
        }

    # --------------------------------------------------------------------------
    # 2. RAINVIEWER (Real Global Radar Tile Composite - NOT Indian DWR)
    # --------------------------------------------------------------------------
    def fetch_rainviewer_radar(self) -> Dict[str, Any]:
        """
        Fetches live Doppler radar reflectivity tiles from RainViewer Open API.
        NOTE: This is a global radar mosaic for visualization only. It is NOT Indian DWR.
        """
        now = time.time()
        if self._radar_cache and (now - self._radar_cache_time < 90):
            return self._radar_cache

        url = "https://api.rainviewer.com/public/weather-maps.json"
        t0 = time.time()
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "VARSHANET-SIH86/2.5 (DisasterManagementResearch)"}
            )
            with urllib.request.urlopen(req, timeout=4) as response:
                if response.status == 200:
                    latency = round(time.time() - t0, 3)
                    self.last_rainviewer_latency_sec = latency
                    data = json.loads(response.read().decode('utf-8'))
                    host = data.get("host", "https://tilecache.rainviewer.com")
                    radar_past = data.get("radar", {}).get("past", [])
                    radar_nowcast = data.get("radar", {}).get("nowcast", [])

                    latest_frame = radar_past[-1] if radar_past else None
                    previous_frames = radar_past[-12:] if len(radar_past) >= 12 else radar_past

                    tile_path = latest_frame.get("path") if latest_frame else None
                    tile_url_template = f"{host}{tile_path}/256/{{z}}/{{x}}/{{y}}/2/1_1.png" if tile_path else None

                    frames_catalog = []
                    for f in previous_frames:
                        f_path = f.get("path")
                        frames_catalog.append({
                            "time": f.get("time"),
                            "path": f_path,
                            "tile_url": f"{host}{f_path}/256/{{z}}/{{x}}/{{y}}/2/1_1.png" if f_path else None
                        })

                    result = {
                        "source": "RainViewer Radar",
                        "provider": "RainViewer Global Mosaic",
                        "data_type": "REAL EXTERNAL RADAR (GLOBAL COMPOSITE - NOT INDIAN DWR)",
                        "status": "LIVE",
                        "connection_state": "ONLINE",
                        "is_live_external": True,
                        "host": host,
                        "latest_timestamp": latest_frame.get("time") if latest_frame else int(now),
                        "total_frames_available": len(radar_past),
                        "total_nowcast_frames": len(radar_nowcast),
                        "tile_url_template": tile_url_template,
                        "latest_frame_path": tile_path,
                        "previous_frames": frames_catalog,
                        "latency_sec": latency,
                        "data_freshness": "FRESH",
                        "coverage": "Global Radar Tiles & Indian Sector Composites",
                        "generated_at": datetime.now(timezone.utc).isoformat(),
                        "attribution": "RainViewer Global Doppler Radar Tile Composite. Real imagery for visualization. NOT Indian DWR radar scans."
                    }
                    self._radar_cache = result
                    self._radar_cache_time = now
                    return result
        except Exception as e:
            logger.warning(f"RainViewer fetch failed: {e}")

        return {
            "source": "RainViewer Radar",
            "provider": "RainViewer Global Mosaic",
            "data_type": "REAL EXTERNAL RADAR (GLOBAL COMPOSITE)",
            "status": "SOURCE UNAVAILABLE",
            "connection_state": "OFFLINE",
            "is_live_external": False,
            "host": "https://tilecache.rainviewer.com",
            "latest_timestamp": None,
            "total_frames_available": 0,
            "total_nowcast_frames": 0,
            "tile_url_template": None,
            "latest_frame_path": None,
            "previous_frames": [],
            "latency_sec": round(time.time() - t0, 3),
            "data_freshness": "UNAVAILABLE",
            "coverage": "Global Radar Tiles",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "attribution": "RainViewer endpoint unreachable. Source marked UNAVAILABLE."
        }

    # --------------------------------------------------------------------------
    # 3. NOAA / WMO METAR (Real Physical Surface Weather Stations / AWS)
    # --------------------------------------------------------------------------
    def fetch_metar_surface_observation(self, region_name: str) -> Dict[str, Any]:
        """
        Fetches real physical airport Automated Weather Station (AWS/ASOS) observations
        via public NOAA Aviation Weather Center METAR service.
        """
        meta = REGION_METADATA.get(region_name, REGION_METADATA["Nagpur Sector (Vidarbha)"])
        icao = meta["icao"]
        now = time.time()

        if icao in self._metar_cache and (now - self._metar_cache_time.get(icao, 0) < 180):
            return self._metar_cache[icao]

        url = f"https://aviationweather.gov/api/data/metar?ids={icao}&format=json"
        t0 = time.time()
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "VARSHANET-SIH86/2.5 (DisasterManagementResearch)"}
            )
            with urllib.request.urlopen(req, timeout=4) as response:
                if response.status == 200:
                    latency = round(time.time() - t0, 3)
                    self.last_metar_latency_sec = latency
                    raw_data = json.loads(response.read().decode('utf-8'))
                    if isinstance(raw_data, list) and len(raw_data) > 0:
                        ob = raw_data[0]
                        temp = float(ob.get("temp", 26.0)) if ob.get("temp") is not None else None
                        dewp = float(ob.get("dewp", 20.0)) if ob.get("dewp") is not None else None
                        wspd_kt = float(ob.get("wspd", 5.0)) if ob.get("wspd") is not None else 0.0
                        wspd_kmh = round(wspd_kt * 1.852, 1)
                        altim_hpa = float(ob.get("altim", 1010.0)) if ob.get("altim") is not None else None

                        result = {
                            "source": "WMO / NOAA METAR Surface Network",
                            "station_icao": icao,
                            "station_name": meta["station_name"],
                            "data_type": "PHYSICAL SURFACE OBSERVATION (AIRPORT AWS)",
                            "status": "LIVE",
                            "connection_state": "ONLINE",
                            "is_live_external": True,
                            "latitude": float(ob.get("lat", meta["lat"])),
                            "longitude": float(ob.get("lon", meta["lon"])),
                            "elevation_m": float(ob.get("elev", meta["elev"])),
                            "temperature_c": temp,
                            "dewpoint_c": dewp,
                            "dewpoint_depression_c": round(temp - dewp, 1) if (temp is not None and dewp is not None) else None,
                            "wind_speed_kmh": wspd_kmh,
                            "wind_dir_deg": ob.get("wdir"),
                            "altimeter_pressure_hpa": altim_hpa,
                            "visibility_miles": ob.get("visib"),
                            "cloud_cover": ob.get("cover"),
                            "flight_category": ob.get("fltCat"),
                            "raw_metar": ob.get("rawOb"),
                            "observation_time": ob.get("reportTime"),
                            "latency_sec": latency,
                            "data_freshness": "FRESH (PHYSICAL OBSERVATION)",
                            "attribution": f"Real physical surface observation from {meta['station_name']} ({icao}) via NOAA/WMO METAR network."
                        }
                        self._metar_cache[icao] = result
                        self._metar_cache_time[icao] = now
                        return result
        except Exception as e:
            logger.warning(f"METAR fetch failed for {icao} ({region_name}): {e}")

        return {
            "source": "WMO / NOAA METAR Surface Network",
            "station_icao": icao,
            "station_name": meta["station_name"],
            "data_type": "PHYSICAL SURFACE OBSERVATION (AIRPORT AWS)",
            "status": "SOURCE UNAVAILABLE",
            "connection_state": "OFFLINE",
            "is_live_external": False,
            "latitude": meta["lat"],
            "longitude": meta["lon"],
            "elevation_m": meta["elev"],
            "temperature_c": None,
            "dewpoint_c": None,
            "dewpoint_depression_c": None,
            "wind_speed_kmh": None,
            "wind_dir_deg": None,
            "altimeter_pressure_hpa": None,
            "raw_metar": None,
            "latency_sec": round(time.time() - t0, 3),
            "data_freshness": "UNAVAILABLE",
            "attribution": f"METAR observation for {icao} unreachable. Marked UNAVAILABLE."
        }

    # --------------------------------------------------------------------------
    # Comprehensive Data Sources Audit Table
    # --------------------------------------------------------------------------
    def get_all_sources_audit_table(self, region_name: str) -> List[Dict[str, Any]]:
        om = self.fetch_open_meteo_live(region_name)
        rv = self.fetch_rainviewer_radar()
        metar = self.fetch_metar_surface_observation(region_name)

        # Check environment variables for authentication status
        has_mosdac_key = bool(os.getenv("MOSDAC_API_KEY"))
        has_dwr_token = bool(os.getenv("DWR_AUTH_TOKEN"))
        has_lightning_feed = bool(os.getenv("LIGHTNING_FEED_URL"))
        has_gauge_stream = bool(os.getenv("RAIN_GAUGE_STREAM_URL"))

        return [
            {
                "source": "Open-Meteo",
                "type": "Atmospheric Dynamics & Sounding",
                "status": om.get("status", "LIVE"),
                "auth_status": "PUBLIC OPEN DATA (NO AUTH REQUIRED)",
                "last_update": om.get("valid_time") or "Just now",
                "latency": f"{om.get('latency_sec', 0.8)}s",
                "data_freshness": om.get("data_freshness", "FRESH"),
                "coverage": om.get("coverage", f"India Regional Grid ({region_name})"),
                "mode": "LIVE DATA",
                "is_live_external": om.get("is_live_external", False),
                "data_type": "REAL EXTERNAL MODEL / FORECAST",
                "model_usage": "Feeds Thermodynamic Instability (CAPE), Moisture (Td depression), Surface Gusts, Instant Precip",
                "variables": "CAPE, 2m Temperature, Dewpoint, Surface Pressure, 10m Wind Speed, Gusts, Precip Rate",
                "note": "Real external gridded NWP model data. NOT VARSHANET AI PREDICTION. NOT physical station observations."
            },
            {
                "source": "RainViewer Radar",
                "type": "Doppler Radar Tile Composite",
                "status": rv.get("status", "LIVE"),
                "auth_status": "PUBLIC OPEN API (NO AUTH REQUIRED)",
                "last_update": datetime.fromtimestamp(rv.get("latest_timestamp", int(time.time())), timezone.utc).strftime("%H:%M:%S UTC") if rv.get("latest_timestamp") else "—",
                "latency": f"{rv.get('latency_sec', 1.1)}s",
                "data_freshness": rv.get("data_freshness", "FRESH"),
                "coverage": rv.get("coverage", "Global Radar Mosaic Composite"),
                "mode": "LIVE DATA",
                "is_live_external": rv.get("is_live_external", False),
                "data_type": "REAL EXTERNAL RADAR (GLOBAL COMPOSITE)",
                "model_usage": "Radar Tile Map Visualization & Scan Timestamps ONLY. dBZ/VIL is NOT fabricated from tiles.",
                "variables": "Tile URL templates, Scan Timestamps, Multi-Frame Progression",
                "note": "Real external Doppler radar tile mosaic. NOT Indian DWR."
            },
            {
                "source": "Doppler Weather Radar (DWR)",
                "type": "Doppler Weather Radar",
                "status": "AUTH REQUIRED" if not has_dwr_token else "CONNECTED",
                "auth_status": "AUTHENTICATION REQUIRED (MoES / IMD Secure Gateway)",
                "last_update": "—",
                "latency": "—",
                "data_freshness": "NOT CONFIGURED",
                "coverage": "Target: 38 Indian DWR Sectors (WMO BUFR / ODIM H5)",
                "mode": "NOT CONNECTED",
                "is_live_external": False,
                "data_type": "OPERATIONAL S/C-BAND DWR SCANS",
                "model_usage": "Target input for Reflectivity (dBZ), VIL Density, Echo Top (km), Radial Velocity",
                "variables": "dBZ, VIL, Echo Top, Velocity",
                "note": "Adapter ready (dwr_adapter.py). MoES authenticated gateway required. Synthetic data in SIMULATION MODE only."
            },
            {
                "source": "INSAT-3D/3DR Satellite",
                "type": "Geostationary Satellite Radiance",
                "status": "AUTH REQUIRED" if not has_mosdac_key else "CONNECTED",
                "auth_status": "AUTHENTICATION REQUIRED (ISRO / MOSDAC API Key)",
                "last_update": "—",
                "latency": "—",
                "data_freshness": "NOT CONFIGURED",
                "coverage": "Target: All-India 4km Grid (TIR1 10.8µm, WV 6.7µm)",
                "mode": "NOT CONNECTED",
                "is_live_external": False,
                "data_type": "ISRO / MOSDAC SATELLITE RADIANCE",
                "model_usage": "Target input for Cloud-Top Temperature (°C) and 15-min Cooling Rate (°C/15m)",
                "variables": "TIR1 Cloud-Top Temp, Water Vapor Radiance, Convective Mask",
                "note": "Adapter ready (insat_adapter.py). MOSDAC credentials required. Values are NOT hardcoded in LIVE DATA mode."
            },
            {
                "source": "Ground Lightning Detection (GLDN)",
                "type": "Lightning Detection Network",
                "status": "AUTH REQUIRED" if not has_lightning_feed else "CONNECTED",
                "auth_status": "AUTHENTICATION / BROKER REQUIRED (IITM / Institutional TOA)",
                "last_update": "—",
                "latency": "—",
                "data_freshness": "NOT CONFIGURED",
                "coverage": "Target: Sub-continental TOA Grid",
                "mode": "NOT CONNECTED",
                "is_live_external": False,
                "data_type": "GROUND TOA LIGHTNING STROKES",
                "model_usage": "Target input for Flash Rate (/min) and Flash Density",
                "variables": "Flash Rate, Peak Current (kA), Stroke Polarity",
                "note": "Adapter ready (lightning_adapter.py). Institutional ground lightning stream required."
            },
            {
                "source": "Surface Auto Weather Stations (AWS)",
                "type": "Surface Weather Observations",
                "status": metar.get("status", "LIVE"),
                "auth_status": "PUBLIC OPEN SERVICE (Airport AWS active; State Mesonet requires VPN)",
                "last_update": metar.get("observation_time") or "Just now",
                "latency": f"{metar.get('latency_sec', 0.9)}s",
                "data_freshness": metar.get("data_freshness", "FRESH"),
                "coverage": f"{metar.get('station_name')} ({metar.get('station_icao')}) + Target 1,420 Mesonet Nodes",
                "mode": "LIVE DATA",
                "is_live_external": metar.get("is_live_external", False),
                "data_type": "PHYSICAL SURFACE OBSERVATION (AIRPORT AWS & MESONET)",
                "model_usage": "Ground truth surface validation for temperature, dewpoint, pressure altimeter, and surface wind",
                "variables": "Temperature, Dewpoint, Wind Speed, Direction, Altimeter Pressure, Raw METAR string",
                "note": "Real physical airport automated weather station observations via WMO/NOAA METAR service. State mesonet requires private VPN."
            },
            {
                "source": "Disdrometers & Rain Gauges",
                "type": "Rainfall Observations",
                "status": "AUTH REQUIRED" if not has_gauge_stream else "CONNECTED",
                "auth_status": "REGIONAL HYDROLOGICAL NETWORK REQUIRED",
                "last_update": "—",
                "latency": "—",
                "data_freshness": "NOT CONFIGURED",
                "coverage": "Target: River Basins & Urban Catchment Nodes",
                "mode": "NOT CONNECTED",
                "is_live_external": False,
                "data_type": "TIPPING-BUCKET / OPTICAL DISDROMETER",
                "model_usage": "Target input for physical Rain Rate (mm/h) and Drop Size Distribution",
                "variables": "Rain Rate (mm/h), 15-min Accumulation, DSD",
                "note": "Adapter ready (rain_gauge_adapter.py). Open-Meteo precipitation forecast is NOT physical gauge data."
            },
            {
                "source": "NWP Ensemble / WRF 3km Mesoscale",
                "type": "Numerical Prediction",
                "status": om.get("status", "LIVE"),
                "auth_status": "PUBLIC OPEN ACCESS (Via Open-Meteo)",
                "last_update": om.get("valid_time") or "Just now",
                "latency": f"{om.get('latency_sec', 0.8)}s",
                "data_freshness": om.get("data_freshness", "FRESH"),
                "coverage": "Regional 0.1° / 0.25° NWP Grid",
                "mode": "LIVE DATA",
                "is_live_external": om.get("is_live_external", False),
                "data_type": "NUMERICAL WEATHER PREDICTION",
                "model_usage": "Background instability indices (CAPE, CIN, 6-hour precipitation trajectory)",
                "variables": "CAPE (J/kg), Surface Pressure (hPa), Hourly Precip Forecast",
                "note": "Real NWP gridded forecast via Open-Meteo. Local standalone WRF 3km is NOT HOSTED."
            },
            {
                "source": "Digital Elevation Model (SRTM 90m)",
                "type": "Terrain Orography Reference",
                "status": "REAL STATIC GEOSPATIAL DATA",
                "auth_status": "STATIC GEOSPATIAL (NO AUTH REQUIRED)",
                "last_update": "Permanent Reference Dataset",
                "latency": "<1 ms (In-Memory)",
                "data_freshness": "PERMANENT STATIC",
                "coverage": "All-India Subcontinental Topography (90m Resolution)",
                "mode": "REFERENCE",
                "is_live_external": False,
                "data_type": "STATIC GEOSPATIAL TOPOGRAPHY",
                "model_usage": "Elevation (m) and Orographic Convective Lift Factor (1.0–2.5x)",
                "variables": "Elevation ASL, Slope Factor, Orographic Exposure Index",
                "note": "Real static geospatial topography dataset (SRTM v4.1). NOT a live atmospheric sensor."
            }
        ]

live_weather_service = LiveWeatherService()
