"""
VARSHANET MOSDAC Automated Data Acquisition Service
Implements automated programmatic acquisition of official ISRO SAC Level-2B
geophysical precipitation products (3RIMG_L2B_IMC) via the official MOSDAC mdapi protocol.

Official MOSDAC Download API Reference:
  - Tool: ISRO SAC MOSDAC Data Download API (mdapi.py / config.json)
  - Distribution URL: https://www.mosdac.gov.in/software/mdapi.zip
  - Authentication: POST https://mosdac.gov.in/download_api/gettoken
  - Search Catalog: GET https://mosdac.gov.in/apios/datasets.json
  - Download Stream: GET https://mosdac.gov.in/download_api/download
  - Refresh Token: POST https://mosdac.gov.in/download_api/refresh-token
  - Logout: POST https://mosdac.gov.in/download_api/logout

Security & Isolation:
  - Credentials read from backend/.env only (MOSDAC_USERNAME, MOSDAC_PASSWORD).
  - Credentials NEVER exposed in logs, responses, git, or client frontend.
  - Zero synthetic satellite data generated.
"""

import os
import time
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Tuple, List
import requests

from app.adapters.insat_adapter import insat_adapter

logger = logging.getLogger("varshanet.mosdac_acquisition")


class MOSDACAcquisitionService:
    """
    Automated acquisition runner conforming to the official ISRO SAC MOSDAC API.
    Downloads the latest Level-2B Geophysical IMC HDF5 granules directly into
    backend/data/satellite/insat_incoming/ for seamless processing by INSATAdapter.
    """

    TOKEN_URL = "https://mosdac.gov.in/download_api/gettoken"
    SEARCH_URL = "https://mosdac.gov.in/apios/datasets.json"
    CHECK_INTERNET_URL = "https://mosdac.gov.in/download_api/check-internet"
    DOWNLOAD_URL = "https://mosdac.gov.in/download_api/download"
    REFRESH_URL = "https://mosdac.gov.in/download_api/refresh-token"
    LOGOUT_URL = "https://mosdac.gov.in/download_api/logout"

    def __init__(self):
        self.dataset_id = os.getenv("MOSDAC_DATASET_ID", "3RIMG_L2B_IMC")
        self.auto_download = os.getenv("MOSDAC_AUTO_DOWNLOAD", "false").lower() in ("true", "1", "yes")

        default_dir = Path(__file__).resolve().parent.parent.parent / "data" / "satellite" / "insat_incoming"
        custom_dir = os.getenv("INSAT_INGESTION_DIR")
        self.download_dir = Path(custom_dir).resolve() if custom_dir else default_dir
        self.download_dir.mkdir(parents=True, exist_ok=True)

        # Operational Telemetry State
        self.status = "IDLE"
        self.last_run_time: Optional[str] = None
        self.last_successful_download: Optional[str] = None
        self.last_downloaded_filename: Optional[str] = None
        self.last_error: Optional[str] = None
        self.last_search_count: int = 0

    # --------------------------------------------------------------------------
    # Credentials & Configuration
    # --------------------------------------------------------------------------
    @property
    def username(self) -> str:
        return (os.getenv("MOSDAC_USERNAME") or "").strip()

    @property
    def password(self) -> str:
        return (os.getenv("MOSDAC_PASSWORD") or "").strip()

    def is_configured(self) -> bool:
        """True only if valid username and password are provided in environment."""
        return bool(self.username and self.password)

    # --------------------------------------------------------------------------
    # Official MOSDAC API Operations
    # --------------------------------------------------------------------------
    def authenticate(self) -> Tuple[Optional[str], Optional[str], Optional[str]]:
        """
        Authenticates against the official MOSDAC token endpoint.
        Returns (access_token, refresh_token, error_message).
        """
        if not self.is_configured():
            return None, None, "MOSDAC_USERNAME and MOSDAC_PASSWORD must be configured in backend/.env"

        payload = {
            "username": self.username,
            "password": self.password
        }

        try:
            resp = requests.post(self.TOKEN_URL, json=payload, timeout=12)

            if resp.status_code == 200:
                data = resp.json()
                access_token = data.get("access_token")
                refresh_token = data.get("refresh_token")
                if access_token:
                    return access_token, refresh_token, None
                return None, None, "MOSDAC response did not contain access_token"

            if resp.status_code == 400:
                err = resp.json().get("error", "Bad Request")
                return None, None, f"MOSDAC Validation Error: {err}"

            if resp.status_code == 401:
                return None, None, "MOSDAC Authentication Failed: Invalid username or password"

            if resp.status_code == 503:
                return None, None, "MOSDAC Service Unavailable (Server Maintenance)"

            return None, None, f"Unexpected response from MOSDAC: HTTP {resp.status_code}"

        except requests.exceptions.Timeout:
            return None, None, "MOSDAC Token Endpoint timed out"
        except requests.exceptions.ConnectionError:
            return None, None, "Network connection error while reaching MOSDAC token server"
        except Exception as e:
            return None, None, f"Authentication error: {str(e)}"

    def search_catalog(
        self,
        date_str: Optional[str] = None,
        count: int = 5
    ) -> Tuple[List[Dict[str, Any]], Optional[str]]:
        """
        Queries the official MOSDAC catalog endpoint for available granules.
        Returns (entries_list, error_message).
        """
        params = {
            "datasetId": self.dataset_id,
            "count": count
        }
        if date_str:
            params["startTime"] = date_str
            params["endTime"] = date_str

        try:
            resp = requests.get(self.SEARCH_URL, params=params, timeout=12)
            if resp.status_code == 200:
                data = resp.json()
                entries = data.get("entries", [])
                self.last_search_count = len(entries)
                return entries, None

            return [], f"Search endpoint returned HTTP {resp.status_code}"

        except Exception as e:
            return [], f"Catalog search failed: {str(e)}"

    def download_granule(
        self,
        access_token: str,
        record_id: str,
        identifier: str
    ) -> Tuple[Optional[str], Optional[str]]:
        """
        Streams binary HDF5 granule using authenticated bearer token and record ID.
        Saves into backend/data/satellite/insat_incoming/ using atomic .part renaming.
        """
        dest_path = self.download_dir / identifier
        if dest_path.exists():
            return str(dest_path), "File already exists in ingestion directory"

        tmp_part_path = self.download_dir / f"{identifier}.part"
        headers = {"Authorization": f"Bearer {access_token}"}
        params = {"id": record_id}

        try:
            with requests.get(self.DOWNLOAD_URL, headers=headers, params=params, stream=True, timeout=15) as resp:
                if resp.status_code != 200:
                    return None, f"MOSDAC download failed with HTTP {resp.status_code}"

                # Stream to temporary file
                with open(tmp_part_path, "wb") as f:
                    for chunk in resp.iter_content(chunk_size=1048576):
                        if chunk:
                            f.write(chunk)

                # Ensure non-empty file
                if tmp_part_path.stat().st_size == 0:
                    tmp_part_path.unlink(missing_ok=True)
                    return None, "Downloaded file was 0 bytes"

                # Atomic rename upon verified completion
                tmp_part_path.rename(dest_path)
                return str(dest_path), None

        except Exception as e:
            tmp_part_path.unlink(missing_ok=True)
            return None, f"Stream download failed: {str(e)}"

    def logout(self) -> None:
        """Invokes official MOSDAC logout endpoint."""
        if not self.username:
            return
        try:
            requests.post(self.LOGOUT_URL, json={"username": self.username}, timeout=5)
        except Exception:
            pass

    # --------------------------------------------------------------------------
    # Main Acquisition Orchestrator
    # --------------------------------------------------------------------------
    def acquire_latest_granule(self, specific_date: Optional[str] = None) -> Dict[str, Any]:
        """
        Executes the full automated acquisition lifecycle:
        1. Validates backend/.env credentials
        2. Authenticates with MOSDAC SSO
        3. Queries latest 3RIMG_L2B_IMC granule
        4. Downloads directly to backend/data/satellite/insat_incoming/
        5. Triggers INSATAdapter cache reload
        6. Logs out cleanly
        """
        now_str = datetime.now(timezone.utc).isoformat()
        self.last_run_time = now_str

        # 1. Credentials Check
        if not self.is_configured():
            self.status = "CREDENTIALS_REQUIRED"
            self.last_error = "MOSDAC_USERNAME and MOSDAC_PASSWORD are required in backend/.env"
            return {
                "success": False,
                "status": self.status,
                "timestamp": now_str,
                "error": self.last_error,
                "instructions": (
                    "Please add your official MOSDAC credentials to backend/.env:\n"
                    "MOSDAC_USERNAME=your_email\n"
                    "MOSDAC_PASSWORD=your_password\n"
                    "Never paste passwords in chat. Credentials will be read securely by the backend."
                ),
                "dataset_id": self.dataset_id,
                "destination": str(self.download_dir)
            }

        self.status = "AUTHENTICATING"
        # 2. Authenticate
        token, _, auth_err = self.authenticate()
        if not token or auth_err:
            self.status = "AUTH_FAILED"
            self.last_error = auth_err
            return {
                "success": False,
                "status": self.status,
                "timestamp": now_str,
                "error": auth_err,
                "dataset_id": self.dataset_id
            }

        try:
            # 3. Search Catalog
            self.status = "SEARCHING"
            entries, search_err = self.search_catalog(date_str=specific_date, count=5)
            if search_err or not entries:
                self.status = "NO_ENTRIES_FOUND"
                self.last_error = search_err or "No entries returned from MOSDAC search"
                return {
                    "success": False,
                    "status": self.status,
                    "timestamp": now_str,
                    "error": self.last_error,
                    "dataset_id": self.dataset_id
                }

            # Select latest granule entry
            latest_entry = entries[-1]  # or newest by updated
            record_id = latest_entry.get("id")
            identifier = latest_entry.get("identifier")

            if not record_id or not identifier:
                self.status = "INVALID_METADATA"
                self.last_error = "MOSDAC entry missing id or identifier"
                return {
                    "success": False,
                    "status": self.status,
                    "timestamp": now_str,
                    "error": self.last_error
                }

            # 4. Download
            self.status = "DOWNLOADING"
            dest_file, dl_err = self.download_granule(token, record_id, identifier)
            if dl_err and "already exists" not in dl_err:
                self.status = "DOWNLOAD_FAILED"
                self.last_error = dl_err
                return {
                    "success": False,
                    "status": self.status,
                    "timestamp": now_str,
                    "error": dl_err,
                    "identifier": identifier
                }

            # 5. Success: Reload INSATAdapter cache
            self.status = "SUCCESS"
            self.last_error = None
            self.last_successful_download = now_str
            self.last_downloaded_filename = identifier

            # Force INSATAdapter to load new granule
            insat_adapter._try_load_latest_granule(force_reload=True)
            adapter_info = insat_adapter.get_latest_granule_info()

            return {
                "success": True,
                "status": self.status,
                "timestamp": now_str,
                "dataset_id": self.dataset_id,
                "file_path": dest_file,
                "filename": identifier,
                "already_existed": bool(dl_err and "already exists" in dl_err),
                "adapter_status": insat_adapter.status,
                "parsed_max_rain_mmh": adapter_info.get("max_rain_mmh"),
                "acquisition_start_time": adapter_info.get("acquisition_start_time"),
                "destination_dir": str(self.download_dir)
            }

        finally:
            # 6. Clean Logout
            self.logout()

    def get_status_info(self) -> Dict[str, Any]:
        """Provides status diagnostics for API and telemetry endpoints."""
        configured = self.is_configured()
        current_status = self.status
        if not configured:
            current_status = "CREDENTIALS_REQUIRED"
        elif current_status == "IDLE":
            current_status = "CONFIGURED (STANDBY)"

        granule_meta = insat_adapter.get_latest_granule_info()

        return {
            "service_name": "MOSDAC Automated Data Acquisition Service",
            "official_tool": "ISRO SAC MOSDAC mdapi Protocol",
            "dataset_id": self.dataset_id,
            "status": current_status,
            "is_configured": configured,
            "auto_download_enabled": self.auto_download,
            "download_directory": str(self.download_dir),
            "last_run_time": self.last_run_time,
            "last_successful_download": self.last_successful_download,
            "last_downloaded_filename": self.last_downloaded_filename,
            "active_granule_in_pipeline": granule_meta.get("file_name"),
            "parser_status": insat_adapter.status,
            "parser_active_cells": granule_meta.get("active_precip_cells", 0),
            "parser_max_rain_mmh": granule_meta.get("max_rain_mmh", 0.0),
            "last_error": self.last_error,
            "official_access_url": "https://www.mosdac.gov.in"
        }


mosdac_acquisition_service = MOSDACAcquisitionService()
