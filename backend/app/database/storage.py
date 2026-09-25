import sqlite3
import os
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional

logger = logging.getLogger("varshanet.storage")

DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
DB_PATH = os.path.join(DB_DIR, "varshanet.db")

def get_db_connection() -> sqlite3.Connection:
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Alerts Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        region TEXT NOT NULL,
        severity TEXT NOT NULL,
        hazards TEXT NOT NULL,
        probability INTEGER NOT NULL,
        onset_minutes INTEGER NOT NULL,
        confidence INTEGER NOT NULL,
        recommended_action TEXT NOT NULL,
        road_status TEXT,
        safety_instructions TEXT,
        latitude REAL,
        longitude REAL,
        issued_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        status TEXT NOT NULL,
        lifecycle_status TEXT NOT NULL,
        risk_score INTEGER,
        reviewed_by TEXT,
        reviewed_at TEXT,
        published_at TEXT,
        rejection_reason TEXT,
        source TEXT DEFAULT 'Officer'
    );
    """)

    # Citizen Updates / Bulletins Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS citizen_updates (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        summary TEXT NOT NULL,
        severity TEXT NOT NULL,
        location TEXT NOT NULL,
        source TEXT DEFAULT 'IMD Duty Officer'
    );
    """)

    # Notification Subscriptions Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notification_subscriptions (
        id TEXT PRIMARY KEY,
        endpoint TEXT NOT NULL,
        device_info TEXT,
        created_at TEXT NOT NULL
    );
    """)

    conn.commit()

    # Seed initial alerts if empty
    cursor.execute("SELECT COUNT(*) as cnt FROM alerts")
    if cursor.fetchone()["cnt"] == 0:
        seed_initial_data(cursor)
        conn.commit()

    conn.close()
    logger.info(f"Persistent database initialized at {DB_PATH}")

def seed_initial_data(cursor):
    now_dt = datetime.now(timezone.utc)
    now_str = now_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    exp_3h = (now_dt + timedelta(hours=3)).strftime("%Y-%m-%dT%H:%M:%SZ")
    exp_2h = (now_dt + timedelta(hours=2)).strftime("%Y-%m-%dT%H:%M:%SZ")
    exp_4h = (now_dt + timedelta(hours=4)).strftime("%Y-%m-%dT%H:%M:%SZ")

    initial_alerts = [
        {
            "id": "ALT-2026-0841",
            "title": "Severe Convective Storm & Hail Warning",
            "region": "Nagpur Sector (Vidarbha)",
            "severity": "CRITICAL",
            "hazards": json.dumps(["thunderstorm", "hail", "lightning"]),
            "probability": 88,
            "onset_minutes": 32,
            "confidence": 91,
            "recommended_action": "Take immediate indoor shelter. Disconnect electrical appliances. Move vehicles away from trees.",
            "road_status": "CAUTION: Heavy water accumulation near Wardha Road & Kamptee underpasses; drive below 30 km/h.",
            "safety_instructions": json.dumps([
                "Stay indoors and away from glass windows and tin roofs",
                "Unplug computers, TVs, and air conditioning units",
                "Do not park under trees or temporary overhead hoardings",
                "Avoid driving through inundated road dips and low water bridges"
            ]),
            "latitude": 21.1458,
            "longitude": 79.0882,
            "issued_at": now_str,
            "updated_at": now_str,
            "expires_at": exp_3h,
            "status": "PUBLISHED",
            "lifecycle_status": "PUBLISHED",
            "risk_score": 88,
            "reviewed_by": "IMD-RADAR-OP-84",
            "reviewed_at": (now_dt - timedelta(minutes=6)).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "published_at": (now_dt - timedelta(minutes=4)).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "rejection_reason": None,
            "source": "Duty Officer (IMD Nagpur)"
        },
        {
            "id": "ALT-2026-0842",
            "title": "Cloudburst & Flash Flood Watch",
            "region": "Kolkata & Gangetic Delta",
            "severity": "HIGH",
            "hazards": json.dumps(["cloudburst", "downburst"]),
            "probability": 82,
            "onset_minutes": 24,
            "confidence": 89,
            "recommended_action": "Evacuate natural drainage corridors. Municipal authorities activate stormwater pumping stations.",
            "road_status": "RESTRICTED: VIP Road & EM Bypass experiencing heavy surface water runoff; expect 20-30 min traffic delays.",
            "safety_instructions": json.dumps([
                "Stay on higher ground away from canals and overflowing culverts",
                "Do not touch fallen wires or walk through submerged electric posts",
                "Keep emergency battery lights and power banks charged"
            ]),
            "latitude": 22.5726,
            "longitude": 88.3639,
            "issued_at": now_str,
            "updated_at": now_str,
            "expires_at": exp_2h,
            "status": "PUBLISHED",
            "lifecycle_status": "PUBLISHED",
            "risk_score": 82,
            "reviewed_by": "IMD-KOL-OP-12",
            "reviewed_at": (now_dt - timedelta(minutes=10)).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "published_at": (now_dt - timedelta(minutes=8)).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "rejection_reason": None,
            "source": "Duty Officer (IMD Kolkata)"
        },
        {
            "id": "ALT-2026-0843",
            "title": "Squall Line & Downburst Advisory",
            "region": "Mumbai-Pune Gateway",
            "severity": "WATCH",
            "hazards": json.dumps(["downburst", "thunderstorm"]),
            "probability": 68,
            "onset_minutes": 45,
            "confidence": 84,
            "recommended_action": "High-profile vehicles caution on expressways. Secure loose roofing and hoardings.",
            "road_status": "NORMAL FLOW: Wet asphalt on Mumbai-Pune Expressway ghat sections. Visibility normal, crosswinds elevated.",
            "safety_instructions": json.dumps([
                "Slow down when driving over bridges or open highway stretches",
                "Secure tin sheds and balcony planters against sudden gusts"
            ]),
            "latitude": 18.9220,
            "longitude": 73.4500,
            "issued_at": now_str,
            "updated_at": now_str,
            "expires_at": exp_4h,
            "status": "PUBLISHED",
            "lifecycle_status": "PUBLISHED",
            "risk_score": 68,
            "reviewed_by": "IMD-MUM-OP-03",
            "reviewed_at": (now_dt - timedelta(minutes=15)).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "published_at": (now_dt - timedelta(minutes=12)).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "rejection_reason": None,
            "source": "Duty Officer (IMD Mumbai)"
        }
    ]

    for a in initial_alerts:
        cursor.execute("""
        INSERT INTO alerts (
            id, title, region, severity, hazards, probability, onset_minutes,
            confidence, recommended_action, road_status, safety_instructions,
            latitude, longitude, issued_at, updated_at, expires_at, status,
            lifecycle_status, risk_score, reviewed_by, reviewed_at,
            published_at, rejection_reason, source
        ) VALUES (
            :id, :title, :region, :severity, :hazards, :probability, :onset_minutes,
            :confidence, :recommended_action, :road_status, :safety_instructions,
            :latitude, :longitude, :issued_at, :updated_at, :expires_at, :status,
            :lifecycle_status, :risk_score, :reviewed_by, :reviewed_at,
            :published_at, :rejection_reason, :source
        )
        """, a)

    # Initial Updates
    initial_updates = [
        {
            "id": "UPD-101",
            "timestamp": "10 mins ago",
            "title": "Doppler Radar Detects Intense Echo over Wardha-Nagpur Corridor",
            "category": "BULLETIN",
            "summary": "Dual-polarization radar reflectivity reaches 58 dBZ. Citizens advised to take shelter as rain intensifies.",
            "severity": "CRITICAL",
            "location": "Nagpur Sector (Vidarbha)",
            "source": "IMD Radar Center"
        },
        {
            "id": "UPD-102",
            "timestamp": "25 mins ago",
            "title": "Road Advisory: Kamptee Road Underpass Diverted",
            "category": "ROAD_UPDATE",
            "summary": "Traffic police diverting low-clearance vehicles to Ring Road due to 1.5 ft water accumulation.",
            "severity": "HIGH",
            "location": "Nagpur Sector (Vidarbha)",
            "source": "Traffic Control Cell"
        },
        {
            "id": "UPD-103",
            "timestamp": "42 mins ago",
            "title": "Ghat Section Crosswinds Advisory",
            "category": "SAFETY",
            "summary": "High wind gusts recorded on Bhor Ghat corridor. Speed limit restricted to 40 km/h.",
            "severity": "WATCH",
            "location": "Mumbai-Pune Gateway",
            "source": "Highway Safety Patrol"
        }
    ]

    for u in initial_updates:
        cursor.execute("""
        INSERT INTO citizen_updates (
            id, timestamp, title, category, summary, severity, location, source
        ) VALUES (
            :id, :timestamp, :title, :category, :summary, :severity, :location, :source
        )
        """, u)

def is_expired(expires_at_str: str) -> bool:
    try:
        now_utc = datetime.now(timezone.utc)
        if "T" in expires_at_str:
            clean_str = expires_at_str.replace("Z", "+00:00")
            exp_dt = datetime.fromisoformat(clean_str)
            if exp_dt.tzinfo is None:
                exp_dt = exp_dt.replace(tzinfo=timezone.utc)
            return now_utc > exp_dt
        # Simple HH:MM or format
        return False
    except Exception:
        return False

def map_severity_to_citizen(sev: str) -> str:
    s = (sev or "").upper()
    if s in ["SEVERE", "CRITICAL"]:
        return "CRITICAL"
    if s in ["HIGH", "ELEVATED"]:
        return "HIGH"
    if s in ["MODERATE", "WATCH"]:
        return "WATCH"
    return "NORMAL"

def get_all_alerts(
    location: Optional[str] = None,
    include_expired: bool = False,
    published_only: bool = False
) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM alerts"
    params = []
    conditions = []

    if location:
        conditions.append("(LOWER(region) LIKE ? OR LOWER(?) LIKE '%' || LOWER(region) || '%')")
        loc_param = f"%{location.lower()}%"
        params.extend([loc_param, location.lower()])

    if published_only:
        conditions.append("(lifecycle_status IN ('PUBLISHED', 'APPROVED', 'EXPIRED') OR status IN ('PUBLISHED', 'APPROVED', 'EXPIRED', 'active'))")

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    query += " ORDER BY issued_at DESC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    results = []

    for r in rows:
        d = dict(r)
        # Parse JSON fields
        try:
            d["hazards"] = json.loads(d["hazards"]) if isinstance(d["hazards"], str) else d["hazards"]
        except Exception:
            d["hazards"] = ["thunderstorm"]

        try:
            d["safety_instructions"] = json.loads(d["safety_instructions"]) if isinstance(d["safety_instructions"], str) else d["safety_instructions"]
        except Exception:
            d["safety_instructions"] = [d["recommended_action"]] if d["recommended_action"] else ["Take immediate shelter."]

        # Check expiration
        expired = is_expired(d["expires_at"])
        if expired:
            d["status"] = "EXPIRED"
            d["lifecycle_status"] = "EXPIRED"

        if expired and not include_expired:
            continue

        results.append(d)

    conn.close()
    return results

def get_alert_by_id(alert_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    d = dict(row)
    try:
        d["hazards"] = json.loads(d["hazards"]) if isinstance(d["hazards"], str) else d["hazards"]
    except Exception:
        d["hazards"] = ["thunderstorm"]

    try:
        d["safety_instructions"] = json.loads(d["safety_instructions"]) if isinstance(d["safety_instructions"], str) else d["safety_instructions"]
    except Exception:
        d["safety_instructions"] = [d["recommended_action"]] if d["recommended_action"] else ["Take shelter."]

    if is_expired(d["expires_at"]):
        d["status"] = "EXPIRED"
        d["lifecycle_status"] = "EXPIRED"

    return d

def save_alert(alert_data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()

    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    
    # Prepare fields
    hazards_json = json.dumps(alert_data.get("hazards", ["thunderstorm"]))
    safety_json = json.dumps(alert_data.get("safety_instructions", [alert_data.get("recommended_action", "Take shelter.")]))

    cursor.execute("""
    INSERT OR REPLACE INTO alerts (
        id, title, region, severity, hazards, probability, onset_minutes,
        confidence, recommended_action, road_status, safety_instructions,
        latitude, longitude, issued_at, updated_at, expires_at, status,
        lifecycle_status, risk_score, reviewed_by, reviewed_at,
        published_at, rejection_reason, source
    ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?
    )
    """, (
        alert_data["id"],
        alert_data["title"],
        alert_data["region"],
        alert_data.get("severity", "HIGH"),
        hazards_json,
        alert_data.get("probability", 85),
        alert_data.get("onset_minutes", 30),
        alert_data.get("confidence", 90),
        alert_data.get("recommended_action", "Take indoor shelter immediately."),
        alert_data.get("road_status", "Waterlogging caution on low-lying roads"),
        safety_json,
        alert_data.get("latitude", 21.1458),
        alert_data.get("longitude", 79.0882),
        alert_data.get("issued_at", now_str),
        alert_data.get("updated_at", now_str),
        alert_data.get("expires_at", (datetime.now(timezone.utc) + timedelta(hours=3)).strftime("%Y-%m-%dT%H:%M:%SZ")),
        alert_data.get("status", "PUBLISHED"),
        alert_data.get("lifecycle_status", "PUBLISHED"),
        alert_data.get("risk_score", alert_data.get("probability", 85)),
        alert_data.get("reviewed_by", "Duty Officer"),
        alert_data.get("reviewed_at", now_str),
        alert_data.get("published_at", now_str),
        alert_data.get("rejection_reason"),
        alert_data.get("source", "Officer")
    ))

    # Also automatically record a public update bulletin
    update_id = f"UPD-{alert_data['id'][-4:]}-{int(datetime.now().timestamp()) % 1000}"
    cursor.execute("""
    INSERT OR REPLACE INTO citizen_updates (
        id, timestamp, title, category, summary, severity, location, source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        update_id,
        "Just now",
        f"Alert Issued: {alert_data['title']}",
        "ALERT",
        alert_data.get("recommended_action", "Severe weather alert active."),
        alert_data.get("severity", "HIGH"),
        alert_data["region"],
        alert_data.get("source", "Officer")
    ))

    conn.commit()
    conn.close()

    return get_alert_by_id(alert_data["id"])

def update_alert(alert_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    existing = get_alert_by_id(alert_id)
    if not existing:
        try:
            from app.services.simulation import sim_engine
            match = next((a for a in sim_engine.alerts if a.alert_id == alert_id), None)
            if match:
                d = match.model_dump()
                d["id"] = d.get("alert_id", alert_id)
                save_alert(d)
                existing = get_alert_by_id(alert_id)
        except Exception:
            pass
    if not existing:
        return None

    conn = get_db_connection()
    cursor = conn.cursor()

    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    updates["updated_at"] = now_str

    set_clauses = []
    params = []
    for k, v in updates.items():
        if k in ["hazards", "safety_instructions"] and isinstance(v, (list, dict)):
            v = json.dumps(v)
        set_clauses.append(f"{k} = ?")
        params.append(v)

    params.append(alert_id)
    query = f"UPDATE alerts SET {', '.join(set_clauses)} WHERE id = ?"
    cursor.execute(query, params)

    # Record update entry
    update_id = f"UPD-MOD-{alert_id[-4:]}-{int(datetime.now().timestamp()) % 1000}"
    cursor.execute("""
    INSERT OR REPLACE INTO citizen_updates (
        id, timestamp, title, category, summary, severity, location, source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        update_id,
        "Just now",
        f"Alert Updated: {updates.get('title', existing['title'])}",
        "ALERT",
        updates.get("recommended_action", existing["recommended_action"]),
        updates.get("severity", existing["severity"]),
        existing["region"],
        "Officer"
    ))

    conn.commit()
    conn.close()

    return get_alert_by_id(alert_id)

def get_updates(location: Optional[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM citizen_updates"
    params = []
    if location:
        query += " WHERE (LOWER(location) LIKE ? OR LOWER(?) LIKE '%' || LOWER(location) || '%')"
        loc_param = f"%{location.lower()}%"
        params.extend([loc_param, location.lower()])

    query += " ORDER BY id DESC LIMIT ?"
    params.append(limit)

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return [dict(r) for r in rows]

def save_notification_subscription(sub: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    sub_id = sub.get("id") or f"SUB-{int(datetime.now().timestamp() * 1000)}"
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    cursor.execute("""
    INSERT OR REPLACE INTO notification_subscriptions (id, endpoint, device_info, created_at)
    VALUES (?, ?, ?, ?)
    """, (
        sub_id,
        sub.get("endpoint", "web-push-client"),
        json.dumps(sub.get("device_info", {})),
        now_str
    ))
    conn.commit()
    conn.close()
    return {"status": "subscribed", "subscription_id": sub_id}

# Initialize on module import
init_db()
