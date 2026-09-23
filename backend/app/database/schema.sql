-- ==============================================================================
-- VARSHANET: Convective Weather Intelligence & 0-6 Hour Nowcasting System
-- Production PostgreSQL / PostGIS Spatial Database Schema
-- Ready for operational Doppler Radar, INSAT-3D, and Ground Lightning Ingestion
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types for hazard classifications and alert levels
DO $$ BEGIN
    CREATE TYPE hazard_type AS ENUM ('thunderstorm', 'hail', 'cloudburst', 'downburst', 'lightning');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE severity_level AS ENUM ('low', 'moderate', 'elevated', 'high', 'severe');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE alert_status AS ENUM ('active', 'acknowledged', 'expired', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Automatic Weather Station (AWS) Surface Observations
CREATE TABLE IF NOT EXISTS weather_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id VARCHAR(32) NOT NULL,
    station_name VARCHAR(128) NOT NULL,
    geom GEOMETRY(Point, 4326) NOT NULL,
    temperature_c NUMERIC(4, 1) NOT NULL,
    dew_point_c NUMERIC(4, 1) NOT NULL,
    relative_humidity_pct NUMERIC(4, 1) NOT NULL,
    pressure_hpa NUMERIC(6, 1) NOT NULL,
    wind_speed_kmh NUMERIC(5, 1) NOT NULL,
    wind_dir_deg NUMERIC(4, 1) NOT NULL,
    rain_rate_mmh NUMERIC(6, 2) NOT NULL DEFAULT 0.0,
    cape_proxy NUMERIC(6, 1),
    cin_proxy NUMERIC(6, 1),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_weather_obs_geom ON weather_observations USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_weather_obs_time ON weather_observations(recorded_at DESC);

-- 2. Doppler Weather Radar (DWR) Volume Scan Summaries
CREATE TABLE IF NOT EXISTS radar_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    radar_id VARCHAR(32) NOT NULL,
    site_name VARCHAR(128) NOT NULL,
    geom GEOMETRY(Point, 4326) NOT NULL,
    scan_elevation_angle_deg NUMERIC(3, 1) NOT NULL,
    max_reflectivity_dbz NUMERIC(4, 1) NOT NULL,
    vil_kgm2 NUMERIC(5, 2) NOT NULL,
    echo_top_km NUMERIC(4, 1) NOT NULL,
    velocity_azimuth_shear NUMERIC(5, 3),
    volume_scan_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(16) DEFAULT 'ONLINE'
);
CREATE INDEX IF NOT EXISTS idx_radar_obs_geom ON radar_observations USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_radar_obs_time ON radar_observations(volume_scan_time DESC);

-- 3. Satellite Observations (INSAT-3D / 3DR Imager & Sounder)
CREATE TABLE IF NOT EXISTS satellite_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    satellite_name VARCHAR(64) NOT NULL,
    channel VARCHAR(64) NOT NULL,
    coverage_envelope GEOMETRY(Polygon, 4326),
    cloud_top_temperature_c NUMERIC(4, 1) NOT NULL,
    cooling_rate_15min_c NUMERIC(4, 1) NOT NULL,
    outgoing_longwave_radiation_wm2 NUMERIC(6, 1) NOT NULL,
    convective_cloud_mask BOOLEAN DEFAULT TRUE,
    scan_timestamp TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sat_time ON satellite_observations(scan_timestamp DESC);

-- 4. Ground Lightning Network Observations
CREATE TABLE IF NOT EXISTS lightning_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flash_id VARCHAR(64) NOT NULL,
    geom GEOMETRY(Point, 4326) NOT NULL,
    flash_type VARCHAR(16) NOT NULL, -- 'CG' (Cloud-to-Ground) or 'IC' (Intra-Cloud)
    peak_current_ka NUMERIC(5, 1) NOT NULL,
    stroke_multiplicity INT DEFAULT 1,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lightning_geom ON lightning_observations USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_lightning_time ON lightning_observations(detected_at DESC);

-- 5. Tracked Storm Cells (TITAN / SCIT Equivalent Objects)
CREATE TABLE IF NOT EXISTS storm_cells (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cell_id VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    centroid GEOMETRY(Point, 4326) NOT NULL,
    cell_boundary GEOMETRY(Polygon, 4326) NOT NULL,
    intensity severity_level NOT NULL,
    movement_bearing_deg NUMERIC(5, 2) NOT NULL,
    movement_speed_kmh NUMERIC(5, 2) NOT NULL,
    max_reflectivity_dbz NUMERIC(4, 1) NOT NULL,
    vertically_integrated_liquid_kgm2 NUMERIC(5, 2) NOT NULL,
    echo_top_km NUMERIC(4, 1) NOT NULL,
    cape_jkg NUMERIC(6, 1) NOT NULL,
    hail_probability_pct INT NOT NULL,
    cloudburst_risk_pct INT NOT NULL,
    wind_gust_kmh NUMERIC(5, 1) NOT NULL,
    primary_hazards hazard_type[] NOT NULL,
    forecast_confidence_pct INT NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_storm_cells_centroid ON storm_cells USING GIST(centroid);
CREATE INDEX IF NOT EXISTS idx_storm_cells_boundary ON storm_cells USING GIST(cell_boundary);

-- 6. Hyper-Local 0-6 Hour Forecast Grids & Points
CREATE TABLE IF NOT EXISTS forecast_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cell_id VARCHAR(32) REFERENCES storm_cells(cell_id) ON DELETE CASCADE,
    forecast_horizon_hours INT NOT NULL CHECK (forecast_horizon_hours BETWEEN 0 AND 6),
    valid_time TIMESTAMPTZ NOT NULL,
    projected_geom GEOMETRY(Point, 4326) NOT NULL,
    thunderstorm_prob_pct INT NOT NULL,
    hail_prob_pct INT NOT NULL,
    cloudburst_risk_pct INT NOT NULL,
    wind_gust_kmh NUMERIC(5, 1) NOT NULL,
    rain_rate_mmh NUMERIC(6, 2) NOT NULL,
    composite_risk_score INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_forecast_geom ON forecast_results USING GIST(projected_geom);
CREATE INDEX IF NOT EXISTS idx_forecast_valid ON forecast_results(valid_time);

-- 7. Multi-Tier Alert Management System (Common Alerting Protocol CAP compatible)
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_code VARCHAR(32) NOT NULL UNIQUE,
    headline VARCHAR(256) NOT NULL,
    target_region VARCHAR(128) NOT NULL,
    target_geometry GEOMETRY(Polygon, 4326),
    severity severity_level NOT NULL,
    hazards hazard_type[] NOT NULL,
    event_probability_pct INT NOT NULL,
    estimated_onset_minutes INT NOT NULL,
    confidence_pct INT NOT NULL,
    instruction TEXT NOT NULL,
    status alert_status NOT NULL DEFAULT 'active',
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_alerts_geom ON alerts USING GIST(target_geometry);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status, severity);

-- 8. Historical Convective Extreme Event Archive
CREATE TABLE IF NOT EXISTS historical_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_code VARCHAR(32) NOT NULL UNIQUE,
    event_name VARCHAR(128) NOT NULL,
    event_date DATE NOT NULL,
    region VARCHAR(128) NOT NULL,
    epicenter GEOMETRY(Point, 4326) NOT NULL,
    duration_hours NUMERIC(4, 1) NOT NULL,
    peak_rainfall_mm NUMERIC(6, 1) NOT NULL,
    peak_lightning_strokes_per_min INT NOT NULL,
    damage_severity severity_level NOT NULL,
    observed_hazards hazard_type[] NOT NULL,
    synoptic_meteorological_summary TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hist_geom ON historical_events USING GIST(epicenter);
