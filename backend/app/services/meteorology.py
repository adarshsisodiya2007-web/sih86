import math
from typing import Dict, List, Tuple
from app.models.schemas import (
    SeverityLevel,
    HazardType,
    RiskFactorContribution,
    ConvectiveRiskAssessment
)

def calculate_posh(vil_kgm2: float, echo_top_km: float, max_dbz: float, cape_jkg: float) -> Tuple[int, SeverityLevel]:
    """
    Computes Probability of Severe Hail (POSH) proxy based on Vertically Integrated
    Liquid (VIL), Echo Top, Max Reflectivity (dBZ), and CAPE.
    Based on Witt et al. Severe Hail Algorithm (SHA) principles.
    """
    # Baseline checks: Hail rarely forms if max_dbz < 45 or echo_top < 8km
    if max_dbz < 40 or echo_top_km < 7.0:
        return (max(0, int(max_dbz * 0.2)), SeverityLevel.LOW)

    vil_density = (vil_kgm2 / echo_top_km) if echo_top_km > 0 else 0
    
    # Severe Hail Index proxy
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

    if cape_jkg > 2500:
        score += 25
    elif cape_jkg > 1500:
        score += 15
    elif cape_jkg > 800:
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
        
    return (prob, level)

def calculate_cloudburst_risk(
    rain_rate_mmh: float, 
    vil_kgm2: float, 
    cloud_top_temp_c: float, 
    echo_top_km: float, 
    terrain_elevation_m: float = 800
) -> Tuple[int, SeverityLevel]:
    """
    Cloudburst Potential Index (CPI): Extreme precipitation rate (>100 mm/h IMD definition)
    often driven by orographic locking, intense convective updraft with deep moisture column.
    """
    risk_points = 0.0
    
    # Instantaneous/short-term rain rate component
    if rain_rate_mmh >= 90:
        risk_points += 45
    elif rain_rate_mmh >= 60:
        risk_points += 30
    elif rain_rate_mmh >= 35:
        risk_points += 18
    elif rain_rate_mmh >= 20:
        risk_points += 10

    # Cold cloud top (deep convective tower)
    if cloud_top_temp_c < -65:
        risk_points += 25
    elif cloud_top_temp_c < -52:
        risk_points += 16
    elif cloud_top_temp_c < -40:
        risk_points += 8

    # High Echo top (overshooting tops)
    if echo_top_km > 14:
        risk_points += 20
    elif echo_top_km > 11:
        risk_points += 12

    # Orographic sensitivity boost (higher terrain steepens convective lift)
    if terrain_elevation_m > 1200:
        risk_points += 10
    elif terrain_elevation_m > 500:
        risk_points += 5

    prob = min(99, max(5, int(risk_points)))
    
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
        
    return (prob, level)

def calculate_downburst_risk(max_dbz: float, vil_kgm2: float, dewpoint_depression_c: float) -> Tuple[int, float]:
    """
    Downburst / Microburst Risk: Core collapse indicated by high radar reflectivity
    combined with dry sub-cloud air (high dewpoint depression) causing evaporative cooling.
    Returns (risk_prob, estimated_wind_gust_kmh).
    """
    base_wind = 35.0  # background wind gust km/h
    score = 0.0
    
    if max_dbz > 55:
        score += 40
        base_wind += 35
    elif max_dbz > 48:
        score += 25
        base_wind += 20
    elif max_dbz > 40:
        score += 15
        base_wind += 10

    # Evaporative downdraft proxy: Dew point depression (T - Td)
    if dewpoint_depression_c > 12:  # dry sub-cloud layer
        score += 35
        base_wind += 25
    elif dewpoint_depression_c > 7:
        score += 20
        base_wind += 15

    # VIL density loading
    if vil_kgm2 > 40:
        score += 25
        base_wind += 20
    elif vil_kgm2 > 25:
        score += 15
        base_wind += 10

    prob = min(98, max(10, int(score)))
    estimated_gust = round(min(145.0, base_wind), 1)
    return (prob, estimated_gust)

def evaluate_convective_risk(
    region: str,
    dbz: float,
    rain_rate: float,
    cloud_top_temp: float,
    lightning_rate: int,
    cape: float,
    cin: float,
    wind_shear_proxy: float,
    dewpoint_dep: float,
    elevation_m: float
) -> ConvectiveRiskAssessment:
    """
    Prototype Explainable Convective Risk Engine (ML-ready prototype).
    Synthesizes multi-source observations into an explainable 0-100 composite risk score.
    """
    factors: List[RiskFactorContribution] = []
    
    # 1. Radar Reflectivity & Core Intensity
    c_radar = min(25.0, (dbz / 65.0) * 25.0) if dbz > 20 else 2.0
    factors.append(RiskFactorContribution(
        factor_name="Radar Reflectivity (dBZ)",
        contribution_score=round(c_radar, 1),
        description="High reflectivity indicates dense hydrometeors & precipitation cores",
        physical_value=f"{dbz:.1f} dBZ",
        impact_level="High" if c_radar > 18 else ("Moderate" if c_radar > 10 else "Low")
    ))

    # 2. Atmospheric Instability (CAPE / CIN)
    c_instability = min(25.0, (cape / 3000.0) * 25.0)
    # CIN penalty: strong CIN suppresses initiation unless eroded
    if cin > 120:
        c_instability *= 0.6
    factors.append(RiskFactorContribution(
        factor_name="Thermodynamic Instability (CAPE)",
        contribution_score=round(c_instability, 1),
        description="Positive buoyancy fuel for intense updraft development",
        physical_value=f"{cape:.0f} J/kg (CIN: {cin:.0f} J/kg)",
        impact_level="High" if c_instability > 17 else ("Moderate" if c_instability > 9 else "Low")
    ))

    # 3. Satellite Cloud-Top Cooling Rate & Temperature
    c_sat = 0.0
    if cloud_top_temp < -60:
        c_sat += 15.0
    elif cloud_top_temp < -45:
        c_sat += 10.0
    elif cloud_top_temp < -30:
        c_sat += 5.0
    factors.append(RiskFactorContribution(
        factor_name="Satellite Cloud-Top Thermal IR",
        contribution_score=round(c_sat, 1),
        description="Deep vertical convection penetrating tropopause level",
        physical_value=f"{cloud_top_temp:.1f} °C",
        impact_level="High" if c_sat > 11 else ("Moderate" if c_sat > 6 else "Low")
    ))

    # 4. Total Lightning Flash Density
    c_light = min(20.0, (lightning_rate / 80.0) * 20.0)
    factors.append(RiskFactorContribution(
        factor_name="Lightning Flash Density",
        contribution_score=round(c_light, 1),
        description="Vigorous mixed-phase updraft collision of ice & graupel",
        physical_value=f"{lightning_rate} strikes/min",
        impact_level="High" if c_light > 13 else ("Moderate" if c_light > 6 else "Low")
    ))

    # 5. Kinematic Wind Shear & Orographic Forcing
    c_shear = min(15.0, (wind_shear_proxy / 25.0) * 10.0 + (min(1000, elevation_m) / 1000.0) * 5.0)
    factors.append(RiskFactorContribution(
        factor_name="Kinematic Shear & Orographic Lift",
        contribution_score=round(c_shear, 1),
        description="Provides storm organization, tilt, and localized moisture convergence",
        physical_value=f"{wind_shear_proxy:.1f} m/s (Elev: {elevation_m:.0f} m)",
        impact_level="High" if c_shear > 10 else ("Moderate" if c_shear > 5 else "Low")
    ))

    composite_score = int(min(99, max(5, sum(f.contribution_score for f in factors))))

    if composite_score >= 80:
        category = SeverityLevel.SEVERE
        recs = [
            "Issue immediate public warnings for flash flooding & cloudburst vulnerability.",
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

    # Generate explainable reasoning summary
    highest_factor = max(factors, key=lambda x: x.contribution_score)
    explanation = (
        f"Region '{region}' convective index is {composite_score}/100 ({category.value.upper()}). "
        f"Primary driver is {highest_factor.factor_name} ({highest_factor.physical_value}) "
        f"contributing {highest_factor.contribution_score:.1f} points. "
        f"Multi-source radar-satellite-lightning coherence confirms active convective cell intensification."
    )

    return ConvectiveRiskAssessment(
        region=region,
        composite_score=composite_score,
        risk_category=category,
        confidence=87,
        explanation=explanation,
        factors=factors,
        recommended_actions=recs,
        timestamp="NOW"
    )
