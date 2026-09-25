import math
import random
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional
from app.models.schemas import (
    StormCell,
    SeverityLevel,
    HazardType,
    LightningFlash,
    TimelineHourForecast,
    Alert,
    RadarSiteObservation,
    SatelliteObservation,
    WeatherObservation,
    DataSourceStatus,
    DataSourceType,
    SystemHealthStatus,
    ConvectiveRiskAssessment,
    SystemEvent
)
from app.services.meteorology import (
    calculate_posh,
    calculate_cloudburst_risk,
    calculate_downburst_risk,
    evaluate_convective_risk
)

# Geographic sector seed centers across India
INDIAN_SECTORS = {
    "Nagpur Sector (Vidarbha)": {"lat": 21.1458, "lon": 79.0882, "elev": 310},
    "Mumbai-Pune Gateway": {"lat": 18.9220, "lon": 73.4500, "elev": 560},
    "Kolkata & Gangetic Delta": {"lat": 22.5726, "lon": 88.3639, "elev": 9},
    "Dehradun & Foothills": {"lat": 30.3165, "lon": 78.0322, "elev": 640},
    "Siliguri & NE Basin": {"lat": 26.7271, "lon": 88.3953, "elev": 122},
    "Hyderabad-Deccan": {"lat": 17.3850, "lon": 78.4867, "elev": 542},
    "Ranchi & Chota Nagpur": {"lat": 23.3441, "lon": 85.3096, "elev": 651},
    "Jaipur-Eastern Rajasthan": {"lat": 26.9124, "lon": 75.7873, "elev": 431}
}

class SimulationEngine:
    def __init__(self):
        self.tick_count = 0
        self.simulation_mode = True
        self.system_mode = "SIMULATION"  # "LIVE_DATA" or "SIMULATION"
        self.active_cells: Dict[str, StormCell] = {}
        self.alerts: List[Alert] = []
        self.lightning_flashes: List[LightningFlash] = []
        self.radar_sites: List[RadarSiteObservation] = []
        self.satellite_obs: SatelliteObservation = None
        self.data_sources: List[DataSourceStatus] = []
        self.selected_region: str = "Nagpur Sector (Vidarbha)"
        self.system_events: List[SystemEvent] = []
        self._initialize_world()

    def add_system_event(
        self,
        event_type: str,
        description: str,
        severity: str = "normal",
        status: Optional[str] = None,
        region: Optional[str] = None
    ) -> SystemEvent:
        now_str = datetime.now(timezone.utc).strftime("%H:%M UTC")
        event = SystemEvent(
            id=f"EVT-{int(datetime.now(timezone.utc).timestamp())}-{len(self.system_events)+1}",
            timestamp=now_str,
            event_type=event_type,
            description=description,
            severity=severity,
            status=status,
            region=region or self.selected_region
        )
        self.system_events.insert(0, event)
        if len(self.system_events) > 50:
            self.system_events = self.system_events[:50]
        return event

    def _generate_polygon(self, lat: float, lon: float, radius_km: float = 18.0) -> List[List[float]]:
        """Generates a polygon around lat/lon with realistic irregular convective cell envelope."""
        coords = []
        num_points = 8
        deg_lat = radius_km / 110.574
        deg_lon = radius_km / (111.320 * math.cos(math.radians(lat)))
        for i in range(num_points):
            angle = (i * (360 / num_points)) + random.uniform(-10, 10)
            rad = math.radians(angle)
            jitter = random.uniform(0.75, 1.25)
            plat = lat + (deg_lat * math.sin(rad) * jitter)
            plon = lon + (deg_lon * math.cos(rad) * jitter)
            coords.append([round(plat, 4), round(plon, 4)])
        # close the polygon loop
        coords.append(coords[0])
        return coords

    def _generate_trajectory(self, lat: float, lon: float, speed_kmh: float, bearing_deg: float) -> List[List[float]]:
        """Projects cell center positions for +1h, +2h, +3h, +4h, +5h, +6h."""
        points = [[round(lat, 4), round(lon, 4)]]
        rad_bearing = math.radians(bearing_deg)
        curr_lat, curr_lon = lat, lon
        for h in range(1, 7):
            dist_km = speed_kmh * h
            d_lat = (dist_km * math.cos(rad_bearing)) / 110.574
            d_lon = (dist_km * math.sin(rad_bearing)) / (111.320 * math.cos(math.radians(curr_lat)))
            points.append([round(lat + d_lat, 4), round(lon + d_lon, 4)])
        return points

    def _initialize_world(self):
        # 1. Initialize Realistic Storm Cells across India
        cells_data = [
            {
                "cell_id": "C-1042",
                "name": "Supercell Alpha (Nagpur NE)",
                "lat": 21.28, "lon": 79.25,
                "intensity": SeverityLevel.SEVERE,
                "movement_deg": 65.0, "speed_kmh": 38.0,
                "dbz_max": 62.5, "vil": 48.0, "echo_top": 15.2, "cape": 2850,
                "rain_rate": 84.0, "eta": 32, "confidence": 91
            },
            {
                "cell_id": "C-1048",
                "name": "Multicell Cluster (Western Ghats - Pune)",
                "lat": 18.72, "lon": 73.68,
                "intensity": SeverityLevel.HIGH,
                "movement_deg": 80.0, "speed_kmh": 28.0,
                "dbz_max": 54.0, "vil": 36.0, "echo_top": 13.4, "cape": 2200,
                "rain_rate": 62.0, "eta": 45, "confidence": 85
            },
            {
                "cell_id": "C-1055",
                "name": "Nor'wester (Kolkata Delta Line)",
                "lat": 22.84, "lon": 88.22,
                "intensity": SeverityLevel.SEVERE,
                "movement_deg": 135.0, "speed_kmh": 46.0,
                "dbz_max": 64.0, "vil": 52.0, "echo_top": 16.5, "cape": 3100,
                "rain_rate": 92.0, "eta": 24, "confidence": 94
            },
            {
                "cell_id": "C-1061",
                "name": "Orographic Squall (Dehradun Ridge)",
                "lat": 30.45, "lon": 78.18,
                "intensity": SeverityLevel.ELEVATED,
                "movement_deg": 110.0, "speed_kmh": 22.0,
                "dbz_max": 48.5, "vil": 28.0, "echo_top": 11.8, "cape": 1750,
                "rain_rate": 45.0, "eta": 58, "confidence": 78
            },
            {
                "cell_id": "C-1070",
                "name": "Convective Cell (Ranchi Plateau)",
                "lat": 23.42, "lon": 85.45,
                "intensity": SeverityLevel.MODERATE,
                "movement_deg": 75.0, "speed_kmh": 32.0,
                "dbz_max": 44.0, "vil": 21.0, "echo_top": 10.2, "cape": 1400,
                "rain_rate": 30.0, "eta": 75, "confidence": 72
            }
        ]

        now_str = datetime.now(timezone.utc).strftime("%H:%M:%S UTC")

        for c in cells_data:
            hail_prob, _ = calculate_posh(c["vil"], c["echo_top"], c["dbz_max"], c["cape"])
            cb_risk, _ = calculate_cloudburst_risk(c["rain_rate"], c["vil"], -62.0, c["echo_top"])
            down_prob, wind_gust = calculate_downburst_risk(c["dbz_max"], c["vil"], 10.5)

            hazards = [HazardType.THUNDERSTORM, HazardType.LIGHTNING]
            if hail_prob > 50:
                hazards.append(HazardType.HAIL)
            if cb_risk > 50:
                hazards.append(HazardType.CLOUDBURST)
            if wind_gust > 70:
                hazards.append(HazardType.DOWNBURST)

            poly = self._generate_polygon(c["lat"], c["lon"])
            traj = self._generate_trajectory(c["lat"], c["lon"], c["speed_kmh"], c["movement_deg"])

            self.active_cells[c["cell_id"]] = StormCell(
                cell_id=c["cell_id"],
                name=c["name"],
                latitude=c["lat"],
                longitude=c["lon"],
                intensity=c["intensity"],
                movement_deg=c["movement_deg"],
                speed_kmh=c["speed_kmh"],
                detected_at=now_str,
                eta_minutes=c["eta"],
                hazards=hazards,
                confidence=c["confidence"],
                dbz_max=c["dbz_max"],
                vil_kgm2=c["vil"],
                echo_top_km=c["echo_top"],
                cape_jkg=c["cape"],
                hail_prob=hail_prob,
                cloudburst_risk=cb_risk,
                wind_gust_kmh=wind_gust,
                rain_rate_mmh=c["rain_rate"],
                polygon_coords=poly,
                trajectory_points=traj
            )

        # 2. Doppler Weather Radars
        self.radar_sites = [
            RadarSiteObservation(radar_id="DWR-NGP", site_name="Nagpur S-Band Doppler", latitude=21.1458, longitude=79.0882, max_dbz=62.5, vil_kgm2=48.0, echo_top_km=15.2, scan_time=now_str),
            RadarSiteObservation(radar_id="DWR-MUM", site_name="Mumbai S-Band Doppler", latitude=18.9220, longitude=72.8347, max_dbz=54.0, vil_kgm2=36.0, echo_top_km=13.4, scan_time=now_str),
            RadarSiteObservation(radar_id="DWR-KOL", site_name="Kolkata S-Band Doppler", latitude=22.5726, longitude=88.3639, max_dbz=64.0, vil_kgm2=52.0, echo_top_km=16.5, scan_time=now_str),
            RadarSiteObservation(radar_id="DWR-DLI", site_name="New Delhi C-Band Doppler", latitude=28.6139, longitude=77.2090, max_dbz=38.0, vil_kgm2=15.0, echo_top_km=8.5, scan_time=now_str),
            RadarSiteObservation(radar_id="DWR-PAT", site_name="Patna C-Band Doppler", latitude=25.5941, longitude=85.1376, max_dbz=46.0, vil_kgm2=24.0, echo_top_km=11.2, scan_time=now_str),
        ]

        # 3. Satellite Observation
        self.satellite_obs = SatelliteObservation(
            satellite_name="INSAT-3D Imager & Sounder (Simulated)",
            channel="TIR1 10.8 µm & WV 6.7 µm High-Res Split",
            cloud_top_temp_c=-66.4,
            cooling_rate_c_15min=-5.2,  # Rapid cooling threshold met!
            olr_wm2=124.0,
            scan_time=now_str,
            convective_cloud_mask=True
        )

        # 4. Data Source Ingestion Status (Simulated Layer Ready for Live API)
        self.data_sources = [
            DataSourceStatus(name="Doppler Weather Radar (DWR)", source_type=DataSourceType.RADAR, status="SIMULATED FEED", last_update="18s ago (simulated)", coverage="Target coverage: 38 DWR Sectors", data_quality="Synthetic Dual-Pol Filtered", latency_sec=18, confidence_pct=96, note="Simulation layer modeled after S/C-band Doppler volume scan parameters"),
            DataSourceStatus(name="INSAT-3D/3DR Satellite", source_type=DataSourceType.SATELLITE, status="SIMULATED FEED", last_update="42s ago (simulated)", coverage="Target coverage: All-India 4km Grid", data_quality="Synthetic Radiance Corrected", latency_sec=42, confidence_pct=92, note="Simulation layer modeled after TIR1 (10.8µm) and WV (6.7µm) cooling rates"),
            DataSourceStatus(name="Ground Lightning Detection (GLDN)", source_type=DataSourceType.LIGHTNING, status="SIMULATED FEED", last_update="4s ago (simulated)", coverage="Target coverage: Sub-continental Network", data_quality="Synthetic TOA Coherence", latency_sec=8, confidence_pct=98, note="Simulation layer generating realistic flash clusters based on cell reflectivity"),
            DataSourceStatus(name="Surface Auto Weather Stations (AWS)", source_type=DataSourceType.SURFACE_AWS, status="SIMULATED FEED", last_update="55s ago (simulated)", coverage="Target coverage: Regional Mesonet", data_quality="Automated Spike QC Filter", latency_sec=55, confidence_pct=90, note="Simulated surface boundary observations for temperature, dewpoint, and pressure"),
            DataSourceStatus(name="Tipping-Bucket & Disdrometer Feeds", source_type=DataSourceType.RAINFALL_OBS, status="SIMULATED FEED", last_update="1m ago (simulated)", coverage="Target coverage: River Basins", data_quality="Simulated Dual-Gauge Redundancy", latency_sec=60, confidence_pct=94, note="Simulated short-duration rain rate accumulation observations"),
            DataSourceStatus(name="NWP Ensemble / WRF 3km Mesoscale", source_type=DataSourceType.NWP, status="SIMULATED FEED", last_update="4m ago (simulated)", coverage="Target coverage: Regional Mesoscale Grid", data_quality="Prototype Boundary Conformal", latency_sec=120, confidence_pct=88, note="Simulated thermodynamic background indices (CAPE, CIN, bulk shear)"),
            DataSourceStatus(name="Historical Extreme Event Archive", source_type=DataSourceType.HISTORICAL, status="BENCHMARK ARCHIVE", last_update="Reference Data", coverage="15-Year Convective Case Studies", data_quality="Peer-Reviewed Ground Truth", latency_sec=0, confidence_pct=99, note="Demonstration reference cases for comparative analog demonstration")
        ]

        now_dt = datetime.now(timezone.utc)
        # 5. Populate Initial Alerts with full lifecycle
        self.alerts = [
            Alert(
                alert_id="ALT-2026-0841",
                title="SEVERE CONVECTIVE STORM WARNING",
                region="Nagpur Sector (Vidarbha)",
                severity=SeverityLevel.SEVERE,
                hazards=[HazardType.THUNDERSTORM, HazardType.HAIL, HazardType.LIGHTNING],
                probability=88,
                onset_minutes=32,
                confidence=91,
                recommended_action="Take immediate indoor shelter. Disconnect electrical appliances. Move vehicles away from trees.",
                issued_at=now_str,
                expires_at=(now_dt + timedelta(hours=3)).strftime("%H:%M:%S UTC"),
                status="PUBLISHED",
                lifecycle_status="PUBLISHED",
                risk_score=88,
                reviewed_by="IMD-RADAR-OP-84",
                reviewed_at=(now_dt - timedelta(minutes=6)).strftime("%H:%M UTC"),
                published_at=(now_dt - timedelta(minutes=4)).strftime("%H:%M UTC")
            ),
            Alert(
                alert_id="ALT-2026-0842",
                title="CLOUDBURST & FLASH FLOOD WATCH",
                region="Kolkata & Gangetic Delta",
                severity=SeverityLevel.HIGH,
                hazards=[HazardType.CLOUDBURST, HazardType.DOWNBURST],
                probability=82,
                onset_minutes=24,
                confidence=89,
                recommended_action="Evacuate natural drainage corridors. Municipal authorities activate stormwater pumping stations.",
                issued_at=now_str,
                expires_at=(now_dt + timedelta(hours=2)).strftime("%H:%M:%S UTC"),
                status="PENDING REVIEW",
                lifecycle_status="PENDING REVIEW",
                risk_score=82
            ),
            Alert(
                alert_id="ALT-2026-0843",
                title="SQUALL LINE & DOWNBURST ADVISORY",
                region="Mumbai-Pune Gateway",
                severity=SeverityLevel.ELEVATED,
                hazards=[HazardType.DOWNBURST, HazardType.THUNDERSTORM],
                probability=68,
                onset_minutes=45,
                confidence=84,
                recommended_action="High-profile vehicles caution on expressways. Secure loose roofing and hoardings.",
                issued_at=now_str,
                expires_at=(now_dt + timedelta(hours=4)).strftime("%H:%M:%S UTC"),
                status="DRAFT",
                lifecycle_status="DRAFT",
                risk_score=68
            )
        ]

        # Initial System Events Log (Chronological order, newest first)
        self.system_events = [
            SystemEvent(
                id="EVT-1005",
                timestamp=(now_dt - timedelta(minutes=4)).strftime("%H:%M UTC"),
                event_type="ALERT_LIFECYCLE",
                description="Citizen alert PUBLISHED via NDMA SACHET Cell Broadcast (Nagpur Sector)",
                severity="severe",
                status="PUBLISHED",
                region="Nagpur Sector (Vidarbha)"
            ),
            SystemEvent(
                id="EVT-1004",
                timestamp=(now_dt - timedelta(minutes=6)).strftime("%H:%M UTC"),
                event_type="OFFICER_ACTION",
                description="Officer reviewed & APPROVED alert ALT-2026-0841",
                severity="elevated",
                status="APPROVED",
                region="Nagpur Sector (Vidarbha)"
            ),
            SystemEvent(
                id="EVT-1003",
                timestamp=(now_dt - timedelta(minutes=10)).strftime("%H:%M UTC"),
                event_type="DETECTION",
                description="System generated alert ALT-2026-0841 (Severe Thunderstorm + Hail)",
                severity="elevated",
                status="PENDING REVIEW",
                region="Nagpur Sector (Vidarbha)"
            ),
            SystemEvent(
                id="EVT-1002",
                timestamp=(now_dt - timedelta(minutes=16)).strftime("%H:%M UTC"),
                event_type="RISK_EVALUATION",
                description="Convective risk index escalated to 88/100 (High Hail & Microburst probability)",
                severity="high",
                status="EVALUATED",
                region="Nagpur Sector (Vidarbha)"
            ),
            SystemEvent(
                id="EVT-1001",
                timestamp=(now_dt - timedelta(minutes=24)).strftime("%H:%M UTC"),
                event_type="DETECTION",
                description="Atmospheric instability spike detected (CAPE > 2800 J/kg, deep tropospheric moisture)",
                severity="normal",
                status="DETECTED",
                region="Nagpur Sector (Vidarbha)"
            )
        ]

        self._regenerate_lightning()

    def _regenerate_lightning(self):
        """Simulates real-time lightning strikes concentrated around active cells."""
        now_str = datetime.now(timezone.utc).strftime("%H:%M:%S")
        flashes = []
        fid = 1001
        for cell in self.active_cells.values():
            num_strikes = int(cell.dbz_max * 0.4) + random.randint(2, 8)
            for _ in range(num_strikes):
                lat = cell.latitude + random.uniform(-0.18, 0.18)
                lon = cell.longitude + random.uniform(-0.18, 0.18)
                flashes.append(LightningFlash(
                    flash_id=f"LTG-{fid}",
                    latitude=round(lat, 4),
                    longitude=round(lon, 4),
                    timestamp=now_str,
                    peak_current_ka=round(random.uniform(18.0, 115.0), 1),
                    flash_type=random.choice(["CG", "CG", "IC"]),
                    strike_rate_min=int(cell.dbz_max * 1.2)
                ))
                fid += 1
        self.lightning_flashes = flashes

    def tick(self):
        """Advances the simulation by one step: moves cells, pulses intensities, flashes lightning."""
        self.tick_count += 1
        now_str = datetime.now(timezone.utc).strftime("%H:%M:%S UTC")

        # Step cells along velocity vectors
        for cell_id, cell in list(self.active_cells.items()):
            # Advection: small step (equivalent to 1 minute movement)
            dist_km = (cell.speed_kmh / 60.0) * 0.5  # scaled for visible smooth step
            rad_bearing = math.radians(cell.movement_deg)
            d_lat = (dist_km * math.cos(rad_bearing)) / 110.574
            d_lon = (dist_km * math.sin(rad_bearing)) / (111.320 * math.cos(math.radians(cell.latitude)))
            
            cell.latitude = round(cell.latitude + d_lat, 4)
            cell.longitude = round(cell.longitude + d_lon, 4)

            # Intensity fluctuation (breathing storm core)
            jitter_dbz = random.uniform(-0.4, 0.4)
            cell.dbz_max = round(max(35.0, min(68.0, cell.dbz_max + jitter_dbz)), 1)
            cell.vil_kgm2 = round(max(15.0, min(65.0, cell.vil_kgm2 + (jitter_dbz * 0.8))), 1)
            cell.rain_rate_mmh = round(max(10.0, min(120.0, cell.rain_rate_mmh + (jitter_dbz * 1.2))), 1)

            # Recalculate physical indices
            hail_prob, _ = calculate_posh(cell.vil_kgm2, cell.echo_top_km, cell.dbz_max, cell.cape_jkg)
            cb_risk, _ = calculate_cloudburst_risk(cell.rain_rate_mmh, cell.vil_kgm2, -64.0, cell.echo_top_km)
            down_prob, wind_gust = calculate_downburst_risk(cell.dbz_max, cell.vil_kgm2, 10.0)
            
            cell.hail_prob = hail_prob
            cell.cloudburst_risk = cb_risk
            cell.wind_gust_kmh = wind_gust

            # Update polygon and trajectory
            cell.polygon_coords = self._generate_polygon(cell.latitude, cell.longitude)
            cell.trajectory_points = self._generate_trajectory(cell.latitude, cell.longitude, cell.speed_kmh, cell.movement_deg)

            # Update ETA
            cell.eta_minutes = max(5, cell.eta_minutes - 1 if cell.eta_minutes > 5 else random.randint(30, 60))

        # Refresh lightning
        self._regenerate_lightning()

    def get_timeline_forecast(self, region_name: str) -> List[TimelineHourForecast]:
        """Produces an explainable 0 to 6 hour nowcast timeline for the requested region."""
        # Find closest storm cell or baseline sector
        coords = INDIAN_SECTORS.get(region_name, {"lat": 21.1458, "lon": 79.0882})
        base_lat, base_lon = coords["lat"], coords["lon"]

        # Find closest active storm cell
        min_dist = 999.0
        active_cell = None
        for c in self.active_cells.values():
            dist = math.hypot(c.latitude - base_lat, c.longitude - base_lon)
            if dist < min_dist:
                min_dist = dist
                active_cell = c

        forecasts = []
        base_time = datetime.now(timezone.utc)

        # Baseline storm properties
        base_dbz = active_cell.dbz_max if active_cell else 52.0
        base_hail = active_cell.hail_prob if active_cell else 45
        base_cb = active_cell.cloudburst_risk if active_cell else 38
        base_rain = active_cell.rain_rate_mmh if active_cell else 40.0
        base_wind = active_cell.wind_gust_kmh if active_cell else 65.0

        # Physical trajectory evolution: Convective cells typically initiate, peak within 1-2 hours, and then decay into stratiform
        for h in range(7):
            t = base_time + timedelta(hours=h)
            label = "NOW" if h == 0 else f"+{h}H"
            
            # Bell-curve progression for convective lifecycle
            lifecycle_factor = 1.0 + (0.35 * math.sin(h * 0.85)) if h <= 2 else max(0.2, 1.25 - ((h - 2) * 0.28))
            
            p_ts = min(98, max(5, int((base_dbz * 1.3) * lifecycle_factor)))
            p_hail = min(95, max(0, int(base_hail * (lifecycle_factor if h <= 2 else lifecycle_factor * 0.7))))
            p_cb = min(96, max(0, int(base_cb * lifecycle_factor)))
            rain_rate = round(max(0.0, base_rain * lifecycle_factor), 1)
            wind_risk = round(max(15.0, base_wind * lifecycle_factor), 1)
            ltg_density = int(max(0, 45 * lifecycle_factor))

            composite = int((p_ts * 0.35) + (p_hail * 0.25) + (p_cb * 0.25) + (p_ts * 0.15))

            if composite >= 75:
                sev = SeverityLevel.SEVERE
            elif composite >= 55:
                sev = SeverityLevel.HIGH
            elif composite >= 35:
                sev = SeverityLevel.ELEVATED
            elif composite >= 20:
                sev = SeverityLevel.MODERATE
            else:
                sev = SeverityLevel.LOW

            forecasts.append(TimelineHourForecast(
                hour_offset=h,
                label=label,
                timestamp=t.strftime("%H:%M UTC"),
                thunderstorm_prob=p_ts,
                hail_prob=p_hail,
                cloudburst_prob=p_cb,
                lightning_density=ltg_density,
                rain_intensity_mmh=rain_rate,
                wind_risk_kmh=wind_risk,
                composite_risk=composite,
                severity=sev
            ))

        return forecasts

    def get_risk_assessment(self, region_name: str) -> ConvectiveRiskAssessment:
        from app.services.live_weather_service import live_weather_service
        from app.adapters import terrain_adapter, dwr_adapter, insat_adapter, lightning_adapter

        coords = INDIAN_SECTORS.get(region_name, {"lat": 21.1458, "lon": 79.0882, "elev": 310})
        is_live = (self.system_mode == "LIVE_DATA")

        if is_live:
            om = live_weather_service.fetch_open_meteo_live(region_name)
            elev = terrain_adapter.get_elevation_m(coords["lat"], coords["lon"], fallback_m=coords["elev"])

            radar_dbz = None if not dwr_adapter.is_connected else 55.0
            cloud_top_temp = None if not insat_adapter.is_connected else -60.0
            lightning_rate = None if not lightning_adapter.is_connected else 40

            return evaluate_convective_risk(
                region=region_name,
                dbz=radar_dbz,
                rain_rate=om.get("instant_precipitation_mmh"),
                cloud_top_temp=cloud_top_temp,
                lightning_rate=lightning_rate,
                cape=om.get("live_cape_jkg", 1400.0),
                cin=30.0,
                wind_shear_proxy=16.0,
                dewpoint_dep=om.get("dewpoint_depression_c", 8.0),
                elevation_m=elev,
                is_live_mode=True
            )
        else:
            # Look for matching active cell
            cell = list(self.active_cells.values())[0]
            for c in self.active_cells.values():
                if math.hypot(c.latitude - coords["lat"], c.longitude - coords["lon"]) < 1.5:
                    cell = c
                    break

            return evaluate_convective_risk(
                region=region_name,
                dbz=cell.dbz_max,
                rain_rate=cell.rain_rate_mmh,
                cloud_top_temp=-66.0,
                lightning_rate=int(cell.dbz_max * 1.1),
                cape=cell.cape_jkg,
                cin=28.0,
                wind_shear_proxy=18.5,
                dewpoint_dep=9.2,
                elevation_m=coords["elev"],
                is_live_mode=False
            )

    def get_system_health(self) -> SystemHealthStatus:
        from app.services.live_weather_service import live_weather_service
        now_str = datetime.now(timezone.utc).strftime("%H:%M:%S UTC")
        return SystemHealthStatus(
            timestamp=now_str,
            is_simulation_mode=self.simulation_mode,
            system_mode=self.system_mode,
            active_cells_count=len(self.active_cells),
            active_alerts_count=len([a for a in self.alerts if a.status == "active"]),
            open_meteo_status="LIVE",
            open_meteo_latency_sec=live_weather_service.last_open_meteo_latency_sec,
            rainviewer_status="LIVE",
            rainviewer_latency_sec=live_weather_service.last_rainviewer_latency_sec,
            radar_feed_status="SIMULATED FEED (ADAPTER READY / NOT CONNECTED)",
            satellite_feed_status="SIMULATED FEED (ADAPTER READY / NOT CONNECTED)",
            lightning_feed_status="SIMULATED FEED (ADAPTER READY / NOT CONNECTED)",
            stations_feed_status="SIMULATED FEED (ADAPTER READY / NOT CONNECTED)",
            forecast_engine_status="ONLINE (PROTOTYPE)",
            database_status="READY (POSTGIS SCHEMA)",
            websocket_status="ONLINE",
            api_status="ONLINE",
            radar_latency_sec=18,
            satellite_latency_sec=42,
            lightning_latency_sec=8,
            nwp_latency_sec=120,
            ws_connections=1,
            telemetry_notice="Live providers (Open-Meteo, RainViewer) report real measured HTTP latencies. DWR, INSAT, and GLDN feeds operate in SIMULATION / ADAPTER-READY mode."
        )

# Global singleton simulation engine instance
sim_engine = SimulationEngine()
