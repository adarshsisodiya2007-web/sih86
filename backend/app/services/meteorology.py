import math
from typing import Dict, List, Tuple, Optional, Any
from app.models.schemas import (
    SeverityLevel,
    HazardType,
    RiskFactorContribution,
    ConvectiveRiskAssessment,
    FeatureProvenanceEntry
)

def calculate_posh(
    vil_kgm2: Optional[float],
    echo_top_km: Optional[float],
    max_dbz: Optional[float],
    cape_jkg: Optional[float],
    return_status: bool = False
) -> Any:
    """
    Computes Probability of Severe Hail (POSH) proxy based on Vertically Integrated
    Liquid (VIL), Echo Top, Max Reflectivity (dBZ), and CAPE.
    Based on Witt et al. Severe Hail Algorithm (SHA) principles.
    Returns: (probability, SeverityLevel) or (probability, SeverityLevel, availability_status) if return_status=True.
    """
    if max_dbz is None or echo_top_km is None or vil_kgm2 is None:
        if cape_jkg is not None and cape_jkg > 0:
            thermo_prob = min(65, max(5, int((cape_jkg / 3500.0) * 55.0)))
            sev = SeverityLevel.HIGH if thermo_prob >= 55 else (SeverityLevel.ELEVATED if thermo_prob >= 35 else SeverityLevel.LOW)
            if return_status:
                return (thermo_prob, sev, "PARTIALLY AVAILABLE (THERMODYNAMIC BASELINE — DWR UNAVAILABLE)")
            return (thermo_prob, sev)
        if return_status:
            return (0, SeverityLevel.LOW, "UNAVAILABLE (NO RADAR OR CAPE DATA)")
        return (0, SeverityLevel.LOW)

    if max_dbz < 40 or echo_top_km < 7.0:
        if return_status:
            return (max(0, int(max_dbz * 0.2)), SeverityLevel.LOW, "FULL")
        return (max(0, int(max_dbz * 0.2)), SeverityLevel.LOW)

    vil_density = (vil_kgm2 / echo_top_km) if echo_top_km > 0 else 0
    
    score = 0.0
    if max_dbz >= 60:
        score += 40
    elif max_dbz >= 52:
        score += 25
    elif max_dbz >= 45:
        score += 12

    if vil_density > 3.5:
        score += 35
    elif vil_density > 2.5:
        score += 20
    elif vil_density > 1.5:
        score += 10

    cape_val = cape_jkg if cape_jkg is not None else 1000.0
    if cape_val > 2500:
        score += 25
    elif cape_val > 1500:
        score += 15
    elif cape_val > 800:
        score += 5

    prob = min(99, max(5, int(score)))
    
    if prob >= 75:
        level = SeverityLevel.SEVERE
    elif prob >= 55:
        level = SeverityLevel.HIGH
    elif prob >= 35:
        level = SeverityLevel.ELEVATED
    elif prob >= 20:
        level = SeverityLevel.MODERATE
    else:
        level = SeverityLevel.LOW
        
    if return_status:
        return (prob, level, "FULL")
    return (prob, level)

def calculate_cloudburst_risk(
    rain_rate_mmh: Optional[float], 
    vil_kgm2: Optional[float], 
    cloud_top_temp_c: Optional[float], 
    echo_top_km: Optional[float], 
    terrain_elevation_m: float = 800.0,
    return_status: bool = False
) -> Any:
    """
    Cloudburst Potential Index (CPI): Extreme precipitation rate (>100 mm/h IMD definition)
    driven by orographic locking, intense convective updraft with deep moisture column.
    Returns: (probability, SeverityLevel) or (probability, SeverityLevel, availability_status) if return_status=True.
    """
    has_satellite = cloud_top_temp_c is not None
    has_radar = echo_top_km is not None and vil_kgm2 is not None
    has_rain = rain_rate_mmh is not None

    if not has_satellite and not has_radar and not has_rain:
        if return_status:
            return (0, SeverityLevel.LOW, "UNAVAILABLE (NO OBSERVATIONS)")
        return (0, SeverityLevel.LOW)

    risk_points = 0.0
    
    # 1. Rain rate component
    if has_rain:
        rate = rain_rate_mmh or 0.0
        if rate >= 90:
            risk_points += 45
        elif rate >= 60:
            risk_points += 30
        elif rate >= 35:
            risk_points += 18
        elif rate >= 20:
            risk_points += 10

    # 2. Satellite cloud top (if genuinely available)
    if has_satellite:
        temp = cloud_top_temp_c or 0.0
        if temp < -65:
            risk_points += 25
        elif temp < -52:
            risk_points += 16
        elif temp < -40:
            risk_points += 8

    # 3. Echo top (if genuinely available)
    if has_radar:
        echo = echo_top_km or 0.0
        if echo > 14:
            risk_points += 20
        elif echo > 11:
            risk_points += 12

    # 4. Orographic lift sensitivity
    if terrain_elevation_m > 1200:
        risk_points += 10
    elif terrain_elevation_m > 500:
        risk_points += 5

    scaling = 1.0
    availability = "FULL"
    if not has_satellite or not has_radar:
        scaling = 1.35 if (has_rain or has_satellite) else 1.0
        availability = "PARTIALLY AVAILABLE (SATELLITE/RADAR ADAPTER UNCONNECTED)"

    prob = min(99, max(5, int(risk_points * scaling)))
    
    if prob >= 75:
        level = SeverityLevel.SEVERE
    elif prob >= 55:
        level = SeverityLevel.HIGH
    elif prob >= 35:
        level = SeverityLevel.ELEVATED
    elif prob >= 20:
        level = SeverityLevel.MODERATE
    else:
        level = SeverityLevel.LOW
        
    if return_status:
        return (prob, level, availability)
    return (prob, level)

def calculate_downburst_risk(
    max_dbz: Optional[float], 
    vil_kgm2: Optional[float], 
    dewpoint_depression_c: Optional[float],
    return_status: bool = False
) -> Any:
    """
    Downburst / Microburst Risk: Core collapse indicated by high radar reflectivity
    combined with dry sub-cloud air (high dewpoint depression) causing evaporative cooling.
    Returns: (risk_prob, estimated_wind_gust_kmh) or (risk_prob, estimated_wind_gust_kmh, availability_status) if return_status=True.
    """
    has_radar = max_dbz is not None and vil_kgm2 is not None
    has_dew = dewpoint_depression_c is not None

    if not has_radar and not has_dew:
        if return_status:
            return (0, 30.0, "UNAVAILABLE")
        return (0, 30.0)

    base_wind = 35.0
    score = 0.0
    
    if has_radar:
        dbz = max_dbz or 0.0
        vil = vil_kgm2 or 0.0
        if dbz > 55:
            score += 40
            base_wind += 35
        elif dbz > 48:
            score += 25
            base_wind += 20
        elif dbz > 40:
            score += 15
            base_wind += 10

        if vil > 40:
            score += 25
            base_wind += 20
        elif vil > 25:
            score += 15
            base_wind += 10

    if has_dew:
        dep = dewpoint_depression_c or 0.0
        if dep > 12:
            score += 35
            base_wind += 25
        elif dep > 7:
            score += 20
            base_wind += 15

    availability = "FULL" if (has_radar and has_dew) else "PARTIALLY AVAILABLE (DWR UNCONNECTED)"
    if not has_radar and has_dew:
        score *= 1.6

    prob = min(98, max(10, int(score)))
    estimated_gust = round(min(145.0, base_wind), 1)
    if return_status:
        return (prob, estimated_gust, availability)
    return (prob, estimated_gust)

def evaluate_convective_risk(
    region: str,
    dbz: Optional[float],
    rain_rate: Optional[float],
    cloud_top_temp: Optional[float],
    lightning_rate: Optional[int],
    cape: Optional[float],
    cin: Optional[float],
    wind_shear_proxy: Optional[float],
    dewpoint_dep: Optional[float],
    elevation_m: float,
    is_live_mode: bool = False
) -> ConvectiveRiskAssessment:
    """
    Explainable Convective Risk Engine with Full Feature Provenance.
    Synthesizes genuine observations and tracks the status of every feature.
    """
    factors: List[RiskFactorContribution] = []
    provenance: List[FeatureProvenanceEntry] = []
    
    # 1. Radar Reflectivity
    if dbz is not None:
        c_radar = min(25.0, (dbz / 65.0) * 25.0) if dbz > 20 else 2.0
        factors.append(RiskFactorContribution(
            factor_name="Radar Reflectivity (dBZ)",
            contribution_score=round(c_radar, 1),
            description="Core hydrometeor reflectivity",
            physical_value=f"{dbz:.1f} dBZ",
            impact_level="High" if c_radar > 18 else ("Moderate" if c_radar > 10 else "Low")
        ))
        provenance.append(FeatureProvenanceEntry(
            feature="Radar Max Reflectivity",
            value=f"{dbz:.1f} dBZ",
            source="Doppler Weather Radar (Simulated)" if not is_live_mode else "DWR",
            status="SIMULATED" if not is_live_mode else "REAL",
            unit="dBZ"
        ))
    else:
        c_radar = 0.0
        factors.append(RiskFactorContribution(
            factor_name="Radar Reflectivity (dBZ)",
            contribution_score=0.0,
            description="Radar data currently UNAVAILABLE (MoES DWR Auth Required)",
            physical_value="N/A (Auth Required)",
            impact_level="Low"
        ))
        provenance.append(FeatureProvenanceEntry(
            feature="Radar Max Reflectivity",
            value="N/A",
            source="Doppler Weather Radar (Indian DWR)",
            status="UNAVAILABLE (AUTH REQUIRED)",
            unit="dBZ",
            note="Operational DWR gateway connection required"
        ))

    # 2. Atmospheric Instability (CAPE / CIN)
    cape_val = cape if cape is not None else 0.0
    cin_val = cin if cin is not None else 0.0
    c_instability = min(25.0, (cape_val / 3000.0) * 25.0)
    if cin_val > 120:
        c_instability *= 0.6
    factors.append(RiskFactorContribution(
        factor_name="Thermodynamic Instability (CAPE)",
        contribution_score=round(c_instability, 1),
        description="Positive buoyancy fuel for updraft development",
        physical_value=f"{cape_val:.0f} J/kg (CIN: {cin_val:.0f} J/kg)",
        impact_level="High" if c_instability > 17 else ("Moderate" if c_instability > 9 else "Low")
    ))
    provenance.append(FeatureProvenanceEntry(
        feature="Convective Available Potential Energy (CAPE)",
        value=f"{cape_val:.0f} J/kg",
        source="Open-Meteo (ECMWF / GFS Seamless NWP)",
        status="REAL" if is_live_mode else "SIMULATED",
        unit="J/kg"
    ))

    # 3. Satellite Cloud-Top Temperature
    if cloud_top_temp is not None:
        c_sat = 0.0
        if cloud_top_temp < -60: c_sat += 15.0
        elif cloud_top_temp < -45: c_sat += 10.0
        elif cloud_top_temp < -30: c_sat += 5.0
        factors.append(RiskFactorContribution(
            factor_name="Satellite Cloud-Top Thermal IR",
            contribution_score=round(c_sat, 1),
            description="Convective tower penetration depth",
            physical_value=f"{cloud_top_temp:.1f} °C",
            impact_level="High" if c_sat > 11 else ("Moderate" if c_sat > 6 else "Low")
        ))
        provenance.append(FeatureProvenanceEntry(
            feature="Satellite Cloud-Top Temp (TIR1)",
            value=f"{cloud_top_temp:.1f} °C",
            source="INSAT-3D/3DR Satellite (Simulated)" if not is_live_mode else "INSAT-3D/3DR",
            status="SIMULATED" if not is_live_mode else "REAL",
            unit="°C"
        ))
    else:
        c_sat = 0.0
        factors.append(RiskFactorContribution(
            factor_name="Satellite Cloud-Top Thermal IR",
            contribution_score=0.0,
            description="INSAT-3D/3DR data UNAVAILABLE (MOSDAC API Key Required)",
            physical_value="N/A (Auth Required)",
            impact_level="Low"
        ))
        provenance.append(FeatureProvenanceEntry(
            feature="Satellite Cloud-Top Temp (TIR1)",
            value="N/A",
            source="INSAT-3D/3DR Satellite",
            status="UNAVAILABLE (AUTH REQUIRED)",
            unit="°C",
            note="ISRO MOSDAC API credentials required"
        ))

    # 4. Total Lightning Flash Density
    if lightning_rate is not None:
        c_light = min(20.0, (lightning_rate / 80.0) * 20.0)
        factors.append(RiskFactorContribution(
            factor_name="Lightning Flash Density",
            contribution_score=round(c_light, 1),
            description="Mixed-phase graupel & ice collision rate",
            physical_value=f"{lightning_rate} strikes/min",
            impact_level="High" if c_light > 13 else ("Moderate" if c_light > 6 else "Low")
        ))
        provenance.append(FeatureProvenanceEntry(
            feature="Total Lightning Flash Density",
            value=f"{lightning_rate} /min",
            source="GLDN Lightning (Simulated)" if not is_live_mode else "GLDN",
            status="SIMULATED" if not is_live_mode else "REAL",
            unit="/min"
        ))
    else:
        c_light = 0.0
        factors.append(RiskFactorContribution(
            factor_name="Lightning Flash Density",
            contribution_score=0.0,
            description="Ground lightning stroke broker NOT CONNECTED",
            physical_value="N/A (Not Connected)",
            impact_level="Low"
        ))
        provenance.append(FeatureProvenanceEntry(
            feature="Total Lightning Flash Density",
            value="N/A",
            source="Ground Lightning Detection (GLDN)",
            status="UNAVAILABLE (NOT CONNECTED)",
            unit="/min",
            note="Institutional ground lightning feed required"
        ))

    # 5. Kinematic Wind Shear & Orographic Forcing
    shear_val = wind_shear_proxy if wind_shear_proxy is not None else 12.0
    c_shear = min(15.0, (shear_val / 25.0) * 10.0 + (min(1000, elevation_m) / 1000.0) * 5.0)
    factors.append(RiskFactorContribution(
        factor_name="Kinematic Shear & Orographic Lift",
        contribution_score=round(c_shear, 1),
        description="Storm organization and terrain-induced moisture convergence",
        physical_value=f"{shear_val:.1f} m/s (Elev: {elevation_m:.0f} m)",
        impact_level="High" if c_shear > 10 else ("Moderate" if c_shear > 5 else "Low")
    ))
    provenance.append(FeatureProvenanceEntry(
        feature="Terrain Elevation (DEM)",
        value=f"{elevation_m:.0f} m",
        source="SRTM 90m Digital Elevation Model",
        status="REAL STATIC",
        unit="m",
        note="Static geospatial elevation dataset"
    ))

    # Calculate composite score (scaled if missing components in LIVE_DATA mode)
    raw_sum = sum(f.contribution_score for f in factors)
    if is_live_mode and (dbz is None or cloud_top_temp is None):
        # Thermodynamic & surface driven score scaling
        composite_score = int(min(99, max(5, raw_sum * 1.6)))
        avail_status = "PARTIALLY AVAILABLE (THERMODYNAMIC BASELINE — DWR/INSAT AUTH REQUIRED)"
    else:
        composite_score = int(min(99, max(5, raw_sum)))
        avail_status = "FULL"

    if composite_score >= 80:
        category = SeverityLevel.SEVERE
        recs = [
            "Issue immediate public warnings for flash flooding & severe convection.",
            "Suspend outdoor aviation, construction, and power transmission line maintenance.",
            "Alert district disaster response teams (NDRF/SDRF) for localized urban waterlogging."
        ]
    elif composite_score >= 60:
        category = SeverityLevel.HIGH
        recs = [
            "Advise communities to remain indoors and avoid sheltering under isolated trees.",
            "Pre-position drainage pumps in low-lying depression sectors.",
            "Monitor Doppler radar velocity azimuth display (VAD) for sudden microburst wind shifts."
        ]
    elif composite_score >= 40:
        category = SeverityLevel.ELEVATED
        recs = [
            "Keep weather observation stations on heightened 5-minute sampling interval.",
            "Advise farmers to secure standing crops and protect harvested grains from hail."
        ]
    elif composite_score >= 20:
        category = SeverityLevel.MODERATE
        recs = [
            "Routine meteorological surveillance active. Convective cells monitoring in progress."
        ]
    else:
        category = SeverityLevel.LOW
        recs = [
            "Atmospheric conditions stable. Low probability of severe convective development."
        ]

    explanation = (
        f"Region '{region}' convective index is {composite_score}/100 ({category.value.upper()}). "
        f"Status: {avail_status}. "
        f"Thermodynamic fuel (CAPE: {cape_val:.0f} J/kg) with orographic lift factor at {elevation_m:.0f}m elevation."
    )

    return ConvectiveRiskAssessment(
        region=region,
        composite_score=composite_score,
        risk_category=category,
        confidence=88 if avail_status == "FULL" else 72,
        explanation=explanation,
        factors=factors,
        feature_provenance=provenance,
        availability_status=avail_status,
        recommended_actions=recs,
        timestamp="NOW"
    )
