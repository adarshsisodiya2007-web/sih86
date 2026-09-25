import {
  StormCell,
  TimelineHourForecast,
  Alert,
  LightningFlash,
  RegionInfo,
  ConvectiveRiskAssessment,
  SystemHealthStatus,
  SeverityLevel,
  HazardType,
  HistoricalEvent,
  CitizenGroundReport,
  ShelterInfo
} from '../types';

export const INITIAL_REGIONS: RegionInfo[] = [
  { name: "Nagpur Sector (Vidarbha)", latitude: 21.1458, longitude: 79.0882, elevation_m: 310 },
  { name: "Mumbai-Pune Gateway", latitude: 18.9220, longitude: 73.4500, elevation_m: 560 },
  { name: "Kolkata & Gangetic Delta", latitude: 22.5726, longitude: 88.3639, elevation_m: 9 },
  { name: "Dehradun & Foothills", latitude: 30.3165, longitude: 78.0322, elevation_m: 640 },
  { name: "Siliguri & NE Basin", latitude: 26.7271, longitude: 88.3953, elevation_m: 122 },
  { name: "Hyderabad-Deccan", latitude: 17.3850, longitude: 78.4867, elevation_m: 542 },
  { name: "Ranchi & Chota Nagpur", latitude: 23.3441, longitude: 85.3096, elevation_m: 651 },
  { name: "Jaipur-Eastern Rajasthan", latitude: 26.9124, longitude: 75.7873, elevation_m: 431 }
];

function generatePolygon(lat: number = 21.28, lon: number = 79.25, radiusKm: number = 18.0): [number, number][] {
  const coords: [number, number][] = [];
  const numPoints = 8;
  const degLat = radiusKm / 110.574;
  const degLon = radiusKm / (111.320 * Math.cos((lat * Math.PI) / 180));

  for (let i = 0; i < numPoints; i++) {
    const angle = (i * (360 / numPoints)) + ((Math.random() - 0.5) * 16);
    const rad = (angle * Math.PI) / 180;
    const jitter = 0.85 + Math.random() * 0.3;
    const plat = lat + degLat * Math.sin(rad) * jitter;
    const plon = lon + degLon * Math.cos(rad) * jitter;
    coords.push([parseFloat(plat.toFixed(4)), parseFloat(plon.toFixed(4))]);
  }
  coords.push(coords[0]); // close polygon
  return coords;
}

function generateTrajectory(lat: number, lon: number, speedKmh: number, bearingDeg: number): [number, number][] {
  const points: [number, number][] = [[parseFloat(lat.toFixed(4)), parseFloat(lon.toFixed(4))]];
  const radBearing = (bearingDeg * Math.PI) / 180;

  for (let h = 1; h <= 6; h++) {
    const distKm = (speedKmh * h) * 0.7;
    const dLat = (distKm * Math.cos(radBearing)) / 110.574;
    const dLon = (distKm * Math.sin(radBearing)) / (111.320 * Math.cos((lat * Math.PI) / 180));
    points.push([parseFloat((lat + dLat).toFixed(4)), parseFloat((lon + dLon).toFixed(4))]);
  }
  return points;
}

export const INITIAL_STORM_CELLS: StormCell[] = [
  {
    cell_id: 'C-1042',
    name: 'Supercell Alpha (Nagpur NE)',
    latitude: 21.28,
    longitude: 79.25,
    intensity: 'severe' as SeverityLevel,
    movement_deg: 65.0,
    speed_kmh: 38.0,
    detected_at: 'LIVE NOW',
    eta_minutes: 28,
    hazards: ['thunderstorm', 'hail', 'lightning', 'cloudburst', 'downburst'] as HazardType[],
    confidence: 94,
    dbz_max: 63.5,
    vil_kgm2: 49.0,
    echo_top_km: 15.6,
    cape_jkg: 2950,
    hail_prob: 82,
    cloudburst_risk: 76,
    wind_gust_kmh: 92,
    rain_rate_mmh: 88.0,
    polygon_coords: generatePolygon(21.28, 79.25, 22),
    trajectory_points: generateTrajectory(21.28, 79.25, 38, 65)
  },
  {
    cell_id: 'C-1048',
    name: 'Multicell Cluster (Western Ghats - Pune)',
    latitude: 18.72,
    longitude: 73.68,
    intensity: 'high' as SeverityLevel,
    movement_deg: 80.0,
    speed_kmh: 28.0,
    detected_at: 'LIVE NOW',
    eta_minutes: 42,
    hazards: ['thunderstorm', 'hail', 'lightning'] as HazardType[],
    confidence: 88,
    dbz_max: 55.0,
    vil_kgm2: 38.0,
    echo_top_km: 13.8,
    cape_jkg: 2250,
    hail_prob: 64,
    cloudburst_risk: 54,
    wind_gust_kmh: 74,
    rain_rate_mmh: 62.0,
    polygon_coords: generatePolygon(18.72, 73.68, 19),
    trajectory_points: generateTrajectory(18.72, 73.68, 28, 80)
  },
  {
    cell_id: 'C-1055',
    name: "Nor'wester Squall (Kolkata Delta Line)",
    latitude: 22.84,
    longitude: 88.22,
    intensity: 'severe' as SeverityLevel,
    movement_deg: 135.0,
    speed_kmh: 46.0,
    detected_at: 'LIVE NOW',
    eta_minutes: 20,
    hazards: ['thunderstorm', 'lightning', 'cloudburst', 'downburst'] as HazardType[],
    confidence: 96,
    dbz_max: 65.0,
    vil_kgm2: 54.0,
    echo_top_km: 16.8,
    cape_jkg: 3200,
    hail_prob: 74,
    cloudburst_risk: 88,
    wind_gust_kmh: 98,
    rain_rate_mmh: 96.0,
    polygon_coords: generatePolygon(22.84, 88.22, 26),
    trajectory_points: generateTrajectory(22.84, 88.22, 46, 135)
  },
  {
    cell_id: 'C-1061',
    name: 'Orographic Squall (Dehradun Foothills)',
    latitude: 30.45,
    longitude: 78.18,
    intensity: 'elevated' as SeverityLevel,
    movement_deg: 110.0,
    speed_kmh: 22.0,
    detected_at: 'LIVE NOW',
    eta_minutes: 52,
    hazards: ['thunderstorm', 'lightning'] as HazardType[],
    confidence: 82,
    dbz_max: 49.0,
    vil_kgm2: 29.0,
    echo_top_km: 12.0,
    cape_jkg: 1800,
    hail_prob: 45,
    cloudburst_risk: 42,
    wind_gust_kmh: 58,
    rain_rate_mmh: 45.0,
    polygon_coords: generatePolygon(30.45, 78.18, 16),
    trajectory_points: generateTrajectory(30.45, 78.18, 22, 110)
  },
  {
    cell_id: 'C-1070',
    name: 'Convective Cell (Ranchi Plateau)',
    latitude: 23.42,
    longitude: 85.45,
    intensity: 'moderate' as SeverityLevel,
    movement_deg: 75.0,
    speed_kmh: 32.0,
    detected_at: 'LIVE NOW',
    eta_minutes: 68,
    hazards: ['thunderstorm'] as HazardType[],
    confidence: 76,
    dbz_max: 45.5,
    vil_kgm2: 22.0,
    echo_top_km: 10.5,
    cape_jkg: 1450,
    hail_prob: 32,
    cloudburst_risk: 30,
    wind_gust_kmh: 52,
    rain_rate_mmh: 32.0,
    polygon_coords: generatePolygon(23.42, 85.45, 14),
    trajectory_points: generateTrajectory(23.42, 85.45, 32, 75)
  }
];

export const INITIAL_ALERTS: Alert[] = [
  {
    alert_id: 'ALT-2026-0841',
    title: 'SEVERE CONVECTIVE STORM WARNING',
    region: 'Nagpur Sector (Vidarbha)',
    severity: 'severe' as SeverityLevel,
    hazards: ['thunderstorm', 'hail', 'lightning'] as HazardType[],
    probability: 91,
    onset_minutes: 28,
    confidence: 94,
    recommended_action: 'Take immediate indoor shelter. Disconnect electrical appliances. Move vehicles away from trees.',
    issued_at: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
    expires_at: '+3 Hours',
    status: 'active',
    affected_population_est: 1250000
  },
  {
    alert_id: 'ALT-2026-0842',
    title: 'FLASH FLOOD & CLOUDBURST WATCH',
    region: 'Kolkata & Gangetic Delta',
    severity: 'severe' as SeverityLevel,
    hazards: ['cloudburst', 'downburst', 'lightning'] as HazardType[],
    probability: 88,
    onset_minutes: 20,
    confidence: 96,
    recommended_action: 'Clear urban drain inlets immediately. Cease low-lying terminal tarmac activities.',
    issued_at: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
    expires_at: '+2 Hours',
    status: 'active',
    affected_population_est: 850000
  },
  {
    alert_id: 'ALT-2026-0843',
    title: 'SEVERE WIND GUST ADVISORY',
    region: 'Mumbai-Pune Gateway',
    severity: 'high' as SeverityLevel,
    hazards: ['downburst', 'thunderstorm'] as HazardType[],
    probability: 74,
    onset_minutes: 42,
    confidence: 88,
    recommended_action: 'Secure loose outdoor structures, construction cranes, and commercial signboards.',
    issued_at: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
    expires_at: '+4 Hours',
    status: 'active',
    affected_population_est: 620000
  }
];

export function generateMockForecast(region: string): TimelineHourForecast[] {
  const isHighRisk = region.includes('Nagpur') || region.includes('Kolkata');
  const baseRisk = isHighRisk ? 82 : 65;

  const hours = [
    { label: 'NOW', offset: 0, mult: 1.0 },
    { label: '+1H', offset: 1, mult: 1.05 },
    { label: '+2H', offset: 2, mult: 0.95 },
    { label: '+3H', offset: 3, mult: 0.85 },
    { label: '+4H', offset: 4, mult: 0.70 },
    { label: '+5H', offset: 5, mult: 0.55 },
    { label: '+6H', offset: 6, mult: 0.35 }
  ];

  const now = new Date();

  return hours.map((h) => {
    const time = new Date(now.getTime() + h.offset * 3600 * 1000);
    const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' IST';
    const risk = Math.min(99, Math.max(10, Math.round(baseRisk * h.mult)));

    return {
      hour_offset: h.offset,
      label: h.label,
      timestamp: timeStr,
      composite_risk: risk,
      severity: (risk >= 80 ? 'severe' : risk >= 65 ? 'high' : risk >= 45 ? 'elevated' : 'moderate') as SeverityLevel,
      thunderstorm_prob: Math.min(98, Math.round(risk * 1.02)),
      hail_prob: Math.min(92, Math.max(0, Math.round(risk * 0.82))),
      cloudburst_prob: Math.min(90, Math.max(0, Math.round(risk * 0.78))),
      lightning_density: Math.min(95, Math.max(5, Math.round(risk * 0.65))),
      wind_risk_kmh: Math.min(110, Math.max(35, Math.round(45 + (risk * 0.55)))),
      rain_intensity_mmh: Math.min(120, Math.max(10, Math.round(risk * 0.9)))
    };
  });
}

export function generateMockLightning(cells: StormCell[]): LightningFlash[] {
  const flashes: LightningFlash[] = [];
  let flashIdCounter = 1;

  cells.forEach((cell) => {
    const count = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distDeg = (Math.random() * 0.16);
      const fLat = cell.latitude + Math.sin(angle) * distDeg;
      const fLon = cell.longitude + Math.cos(angle) * distDeg;
      const isCG = Math.random() > 0.35;

      flashes.push({
        flash_id: `FL-${cell.cell_id}-${flashIdCounter++}`,
        latitude: parseFloat(fLat.toFixed(4)),
        longitude: parseFloat(fLon.toFixed(4)),
        timestamp: new Date().toISOString(),
        peak_current_ka: Math.round(25 + Math.random() * 85),
        flash_type: isCG ? 'CG' : 'IC',
        strike_rate_min: Math.round(15 + Math.random() * 65)
      });
    }
  });

  return flashes;
}

export function stepMockSimulation(currentCells: StormCell[]): {
  updatedCells: StormCell[];
  flashes: LightningFlash[];
} {
  const dtHours = 0.008;

  const updatedCells = currentCells.map((cell) => {
    const rad = (cell.movement_deg * Math.PI) / 180;
    const distKm = cell.speed_kmh * dtHours;
    const dLat = (distKm * Math.cos(rad)) / 110.574;
    const dLon = (distKm * Math.sin(rad)) / (111.320 * Math.cos((cell.latitude * Math.PI) / 180));

    const newLat = parseFloat((cell.latitude + dLat).toFixed(4));
    const newLon = parseFloat((cell.longitude + dLon).toFixed(4));

    const dbzJitter = (Math.random() - 0.49) * 0.8;
    const newDbz = Math.min(68, Math.max(38, parseFloat((cell.dbz_max + dbzJitter).toFixed(1))));
    const newRainRate = Math.min(115, Math.max(15, parseFloat((cell.rain_rate_mmh + (dbzJitter * 1.5)).toFixed(1))));
    const newEta = cell.eta_minutes > 5 ? cell.eta_minutes - 1 : 45 + Math.floor(Math.random() * 15);

    return {
      ...cell,
      latitude: newLat,
      longitude: newLon,
      dbz_max: newDbz,
      rain_rate_mmh: newRainRate,
      eta_minutes: newEta,
      detected_at: 'LIVE NOW (TRACKED)',
      polygon_coords: generatePolygon(newLat, newLon, 18),
      trajectory_points: generateTrajectory(newLat, newLon, cell.speed_kmh, cell.movement_deg)
    };
  });

  const flashes = generateMockLightning(updatedCells);

  return {
    updatedCells,
    flashes
  };
}

export function getMockRiskAssessment(region: string): ConvectiveRiskAssessment {
  const isHighRisk = region.includes('Nagpur') || region.includes('Kolkata');
  const score = isHighRisk ? 82 : 68;

  return {
    region,
    composite_score: score,
    risk_category: (score >= 80 ? 'severe' : score >= 60 ? 'high' : 'elevated') as SeverityLevel,
    confidence: 95,
    explanation: `${region} exhibits severe convective instability with elevated radar reflectivity, rapid cloud top cooling, and strong thermodynamic shear.`,
    factors: [
      {
        factor_name: 'Radar Max Reflectivity (dBZ)',
        contribution_score: 88,
        description: 'Deep convective storm core exceeding 60 dBZ threshold',
        physical_value: '63.5 dBZ',
        impact_level: 'CRITICAL'
      },
      {
        factor_name: 'Thermodynamic CAPE',
        contribution_score: 82,
        description: 'Severe boundary layer buoyant energy available for convection',
        physical_value: '2950 J/kg',
        impact_level: 'HIGH'
      },
      {
        factor_name: 'Vertically Integrated Liquid (VIL)',
        contribution_score: 76,
        description: 'High water equivalent density indicating large hail aloft',
        physical_value: '49.0 kg/m²',
        impact_level: 'HIGH'
      }
    ],
    recommended_actions: [
      'Issue immediate terminal aerodrome hazard warning',
      'Alert regional state disaster management command center',
      'Engage Doppler scanning rapid-cycle interval (2-min volume scans)'
    ],
    timestamp: new Date().toISOString()
  };
}

export function getMockSystemHealth(): SystemHealthStatus {
  return {
    timestamp: new Date().toISOString(),
    is_simulation_mode: true,
    active_cells_count: 5,
    active_alerts_count: 3,
    radar_feed_status: 'ACTIVE_SIMULATED',
    satellite_feed_status: 'ACTIVE_SIMULATED',
    lightning_feed_status: 'ACTIVE_SIMULATED',
    stations_feed_status: 'ONLINE',
    forecast_engine_status: 'ONLINE',
    database_status: 'ONLINE',
    websocket_status: 'SIMULATED_LOCAL',
    api_status: 'ONLINE',
    radar_latency_sec: 14,
    satellite_latency_sec: 38,
    lightning_latency_sec: 4,
    nwp_latency_sec: 110,
    ws_connections: 1
  };
}

export const INITIAL_HISTORICAL_EVENTS: HistoricalEvent[] = [
  {
    event_id: "HIST-2023-HP",
    name: "2023 Beas Basin Mesoscale Cloudburst Outbreak",
    date: "July 9-10, 2023",
    region: "Mandi & Kullu Valley, Himachal Pradesh",
    duration_hours: 4.5,
    max_rainfall_mm: 248.5,
    peak_lightning_rate: 64,
    observed_hazards: ["cloudburst", "downburst", "thunderstorm", "lightning"],
    damage_severity: "severe",
    key_indicators: {
      "Radar Echo Top": "16.8 km (Overshooting Dome)",
      "Satellite Cloud-Top Temp": "-74.2 °C (Extreme Cooling)",
      "CAPE": "3,400 J/kg with strong orographic funneling",
      "VIL Loading": "58.4 kg/m² prior to collapse"
    },
    synoptic_summary: "Intense interaction of an active Western Disturbance with monsoonal southerly surges locked against Pir Panjal topography, triggering rapid convective cell regeneration.",
    latitude: 31.7087,
    longitude: 76.9320
  },
  {
    event_id: "HIST-2022-MH",
    name: "2022 Vidarbha Severe Multicell Hailstorm",
    date: "March 23, 2022",
    region: "Nagpur & Wardha, Maharashtra",
    duration_hours: 3.0,
    max_rainfall_mm: 86.0,
    peak_lightning_rate: 88,
    observed_hazards: ["hail", "thunderstorm", "downburst", "lightning"],
    damage_severity: "severe",
    key_indicators: {
      "POSH (Severe Hail Prob)": "94% (Observed 4-6 cm hail stones)",
      "Radar Max Reflectivity": "68.5 dBZ core with bounded weak echo region (BWER)",
      "0-6 km Bulk Shear": "24 m/s (High Supercellular Organization)",
      "Wet-Bulb Zero Height": "3.1 km AGL"
    },
    synoptic_summary: "Pre-monsoon dryline boundary between dry continental northwesterlies and humid Bay of Bengal southeasterlies causing explosive supercell formation.",
    latitude: 21.1458,
    longitude: 79.0882
  },
  {
    event_id: "HIST-2021-WB",
    name: "2021 Kolkata Severe Kalbaishakhi (Nor'wester)",
    date: "April 30, 2021",
    region: "Gangetic West Bengal & Kolkata",
    duration_hours: 2.2,
    max_rainfall_mm: 112.0,
    peak_lightning_rate: 112,
    observed_hazards: ["thunderstorm", "downburst", "lightning", "hail"],
    damage_severity: "severe",
    key_indicators: {
      "Max Surface Wind Gust": "104 km/h (Microburst signature)",
      "Surface Pressure Drop": "6.8 hPa in 15 minutes",
      "Total Totals Index": "56 °C",
      "K-Index": "42 °C"
    },
    synoptic_summary: "Classic Chota Nagpur convective initiation propagating southeastward along low-level moisture boundary with intense gust front generation.",
    latitude: 22.5726,
    longitude: 88.3639
  },
  {
    event_id: "HIST-2020-MUM",
    name: "2020 Mumbai August Convective Deluge",
    date: "August 5, 2020",
    region: "Mumbai Metropolitan Region",
    duration_hours: 6.0,
    max_rainfall_mm: 331.0,
    peak_lightning_rate: 42,
    observed_hazards: ["cloudburst", "thunderstorm", "downburst"],
    damage_severity: "severe",
    key_indicators: {
      "Rainfall Rate Peak": "106 mm/h at Colaba",
      "Doppler Reflectivity": "58 dBZ persistent squall training",
      "VIL Core": "52 kg/m²",
      "Offshore Vorticity": "18 x 10⁻⁵ s⁻¹"
    },
    synoptic_summary: "Offshore vortex formation locked between Arabian Sea low-level jet and Western Ghats escarpment producing stationary convective band training.",
    latitude: 18.9220,
    longitude: 72.8347
  },
  {
    event_id: "HIST-2019-OD",
    name: "2019 Cyclone Fani Outer Convective Rainband",
    date: "May 3, 2019",
    region: "Puri & Coastal Odisha",
    duration_hours: 5.0,
    max_rainfall_mm: 185.0,
    peak_lightning_rate: 96,
    observed_hazards: ["thunderstorm", "downburst", "lightning", "cloudburst"],
    damage_severity: "severe",
    key_indicators: {
      "Surface Wind Gust": "185 km/h",
      "Radar Spiral Band Echo": "62 dBZ embedded mini-supercells",
      "CAPE Surge": "4,100 J/kg maritime feed",
      "Storm Surge Coincidence": "1.5 m above tide"
    },
    synoptic_summary: "Extremely severe cyclonic vortex spiral rainband displaying intense convective updrafts with embedded mesovortices.",
    latitude: 19.8135,
    longitude: 85.8312
  }
];

export const INITIAL_CITIZEN_REPORTS: CitizenGroundReport[] = [
  {
    id: "REP-2026-081",
    timestamp: "2 mins ago",
    region: "Delhi-NCR / Haryana",
    location_name: "Rewari Rural Tehsil, Haryana",
    latitude: 28.18,
    longitude: 76.62,
    hazard_type: "hail",
    severity: "severe",
    user_note: "Heavy hail falling since 5 minutes, stones around 2-3 cm size. High wind damaging shed roofs.",
    reporter_name: "Kisan Ramesh Yadav",
    verified: true,
    upvotes: 18
  },
  {
    id: "REP-2026-082",
    timestamp: "8 mins ago",
    region: "Delhi-NCR / Haryana",
    location_name: "Bhiwadi Industrial Border",
    latitude: 28.21,
    longitude: 76.84,
    hazard_type: "downburst",
    severity: "high",
    user_note: "Violent dust gale and downburst. Visibility dropped under 100 meters, tin sheets blown away.",
    reporter_name: "Anil Kumar (Transport Nagar)",
    verified: true,
    upvotes: 12
  },
  {
    id: "REP-2026-083",
    timestamp: "14 mins ago",
    region: "Nagpur Sector (Vidarbha)",
    location_name: "Umred Cotton Belt, Nagpur",
    latitude: 20.85,
    longitude: 79.32,
    hazard_type: "lightning",
    severity: "severe",
    user_note: "Continuous loud cloud-to-ground thunderclaps every 20 seconds. Cattle moved to concrete shed.",
    reporter_name: "Sunil Patil (Sarpanch)",
    verified: true,
    upvotes: 24
  },
  {
    id: "REP-2026-084",
    timestamp: "21 mins ago",
    region: "Nagpur Sector (Vidarbha)",
    location_name: "Kalmeshwar Mandi Area",
    latitude: 21.23,
    longitude: 78.91,
    hazard_type: "waterlogging",
    severity: "high",
    user_note: "Torrential downpour with street flash water accumulation of 2 feet near railway underpass.",
    reporter_name: "Pooja Sharma",
    verified: false,
    upvotes: 7
  },
  {
    id: "REP-2026-085",
    timestamp: "32 mins ago",
    region: "Kolkata / Gangetic WB",
    location_name: "Barasat Rural North 24 Parganas",
    latitude: 22.72,
    longitude: 88.48,
    hazard_type: "cloudburst",
    severity: "severe",
    user_note: "Extremely intense rain wall. Sudden water rush in agricultural ditches.",
    reporter_name: "Dipankar Roy",
    verified: true,
    upvotes: 31
  }
];

export const MOCK_SHELTERS: ShelterInfo[] = [
  {
    id: "SHL-01",
    name: "Government Senior Secondary School (Safe Shelter)",
    type: "school",
    distance_m: 450,
    address: "Circular Road, Near Block Development Office",
    capacity: 350,
    current_occupancy: 42,
    has_power_backup: true,
    has_drinking_water: true,
    contact_phone: "01274-224102",
    lat: 28.185,
    lon: 76.625
  },
  {
    id: "SHL-02",
    name: "Gram Panchayat Community Bhawan",
    type: "panchayat",
    distance_m: 850,
    address: "Village Main Square, Behind Co-op Bank",
    capacity: 200,
    current_occupancy: 28,
    has_power_backup: true,
    has_drinking_water: true,
    contact_phone: "98120-44910",
    lat: 28.181,
    lon: 76.618
  },
  {
    id: "SHL-03",
    name: "Sub-District Civil Hospital & Emergency Ward",
    type: "hospital",
    distance_m: 1200,
    address: "Civil Lines, Hospital Chowk",
    capacity: 150,
    current_occupancy: 65,
    has_power_backup: true,
    has_drinking_water: true,
    contact_phone: "108",
    lat: 28.192,
    lon: 76.631
  }
];

