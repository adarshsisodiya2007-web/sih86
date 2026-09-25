#!/usr/bin/env python3
"""
VARSHANET — Standalone Official MOSDAC Ingestion Runner
Downloads the latest official ISRO SAC Level-2B Geophysical precipitation product (3RIMG_L2B_IMC)
into backend/data/satellite/insat_incoming/ using the official MOSDAC mdapi protocol.

Usage:
    python scripts/run_mosdac_acquisition.py [--date YYYY-MM-DD] [--status]

Environment:
    MOSDAC_USERNAME: Set in backend/.env
    MOSDAC_PASSWORD: Set in backend/.env
"""

import sys
import os
import argparse
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv
load_dotenv(backend_dir / ".env")

from app.services.mosdac_acquisition_service import mosdac_acquisition_service


def main():
    parser = argparse.ArgumentParser(description="VARSHANET Official MOSDAC Automated Data Acquisition")
    parser.add_argument("--date", type=str, default=None, help="Specific target date (YYYY-MM-DD)")
    parser.add_argument("--status", action="store_true", help="Print current acquisition service telemetry status and exit")

    args = parser.parse_args()

    print("=" * 70)
    print("VARSHANET — OFFICIAL MOSDAC SATELLITE DATA ACQUISITION")
    print("=" * 70)

    if args.status:
        status_info = mosdac_acquisition_service.get_status_info()
        print(f"Status:             {status_info['status']}")
        print(f"Configured:         {status_info['is_configured']}")
        print(f"Dataset ID:         {status_info['dataset_id']}")
        print(f"Download Directory: {status_info['download_directory']}")
        print(f"Active Granule:     {status_info['active_granule_in_pipeline']}")
        print(f"Parser Status:      {status_info['parser_status']}")
        print(f"Last Downloaded:    {status_info['last_downloaded_filename']}")
        print("=" * 70)
        sys.exit(0)

    if not mosdac_acquisition_service.is_configured():
        print("\n[CONFIGURATION REQUIRED]")
        print("MOSDAC credentials are not configured in backend/.env.")
        print("\nTo enable automated MOSDAC downloads, add to backend/.env:")
        print("    MOSDAC_USERNAME=your_email@domain.com")
        print("    MOSDAC_PASSWORD=your_password")
        print("\nDo not paste credentials into public chats or commit them to Git.")
        print("Existing local granules in backend/data/satellite/insat_incoming/ remain fully active.")
        print("=" * 70)
        sys.exit(1)

    print(f"\n[INITIATING ACQUISITION] Dataset: {mosdac_acquisition_service.dataset_id}...")
    res = mosdac_acquisition_service.acquire_latest_granule(specific_date=args.date)

    if res.get("success"):
        print(f"[SUCCESS] Downloaded & Verified Granule: {res.get('filename')}")
        print(f"  Location:           {res.get('file_path')}")
        print(f"  Parser Status:      {res.get('adapter_status')}")
        print(f"  Max Rain:           {res.get('parsed_max_rain_mmh')} mm/hr")
        print(f"  Acquisition Time:   {res.get('acquisition_start_time')}")
        sys.exit(0)
    else:
        print(f"[ERROR] Acquisition failed: {res.get('error')}")
        print(f"  Status: {res.get('status')}")
        sys.exit(1)


if __name__ == "__main__":
    main()
