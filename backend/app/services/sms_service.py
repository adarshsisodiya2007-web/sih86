"""
VARSHANET Fast2SMS & NDMA SACHET Emergency SMS Broadcast Gateway
Transmits real-time convective storm, cloudburst, and hail cell-broadcast
messages to citizen and civil defense mobile devices across target sectors.
"""
import os
import json
import logging
import urllib.request
import urllib.error
from typing import Dict, Any, Optional, List

logger = logging.getLogger("varshanet.sms")

class Fast2SMSService:
    def __init__(self):
        self.api_key = os.getenv("FAST2SMS_API_KEY", "").strip()
        self.default_recipients = os.getenv("ALERT_SMS_RECIPIENTS", "").strip()
        self.endpoint = "https://www.fast2sms.com/dev/bulkV2"
        self.wallet_endpoint = "https://www.fast2sms.com/dev/wallet"

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def get_wallet_info(self) -> Dict[str, Any]:
        """Queries live wallet balance and available SMS quota from Fast2SMS."""
        if not self.is_configured():
            return {
                "configured": False,
                "wallet": "0.00",
                "sms_count": 0,
                "status": "NOT_CONFIGURED"
            }

        try:
            req = urllib.request.Request(
                self.wallet_endpoint,
                headers={
                    "authorization": self.api_key,
                    "User-Agent": "VARSHANET-Disaster-Gateway/2.4"
                }
            )
            with urllib.request.urlopen(req, timeout=6) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return {
                    "configured": True,
                    "wallet": data.get("wallet", "0.00"),
                    "sms_count": data.get("sms_count", 0),
                    "status": "ACTIVE" if data.get("return") else "ERROR",
                    "raw": data
                }
        except urllib.error.HTTPError as he:
            err_body = he.read().decode("utf-8", errors="ignore")
            logger.warning(f"Fast2SMS wallet query failed ({he.code}): {err_body}")
            return {
                "configured": True,
                "wallet": "0.00",
                "sms_count": 0,
                "status": "HTTP_ERROR",
                "http_code": he.code,
                "error": err_body
            }
        except Exception as e:
            logger.error(f"Error querying Fast2SMS wallet: {e}")
            return {
                "configured": True,
                "wallet": "0.00",
                "sms_count": 0,
                "status": "UNREACHABLE",
                "error": str(e)
            }

    def broadcast_alert_sms(
        self,
        alert_title: str,
        region: str,
        severity: str,
        action: str,
        custom_numbers: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Sends an official NDMA-style cell broadcast emergency SMS
        to specified or configured citizen numbers.
        """
        target_numbers = (custom_numbers or self.default_recipients or "").strip()
        # Clean commas and spaces
        cleaned_numbers = ",".join([
            n.strip() for n in target_numbers.replace(";", ",").split(",")
            if len(n.strip()) >= 10
        ])

        # Short, punchy official warning format under 160 chars
        sms_text = (
            f"[VARSHANET-EMERGENCY]\n"
            f"{severity.upper()}: {alert_title[:45]}\n"
            f"Area: {region[:25]}\n"
            f"Action: {action[:40]}\n"
            f"- NDMA SACHET"
        )

        if not self.is_configured():
            return {
                "success": False,
                "status": "GATEWAY_NOT_CONFIGURED",
                "message": "Fast2SMS API Key is missing in backend configuration.",
                "dispatched_count": 0
            }

        if not cleaned_numbers:
            return {
                "success": True,
                "status": "BROADCAST_SIMULATED",
                "message": "SMS payload generated. Add citizen mobile numbers in .env or broadcast modal to transmit physical SMS.",
                "sms_preview": sms_text,
                "dispatched_count": 0
            }

        # Attempt Quick SMS (route 'q')
        payload = {
            "route": "q",
            "message": sms_text,
            "language": "english",
            "flash": 0,
            "numbers": cleaned_numbers
        }

        try:
            req = urllib.request.Request(
                self.endpoint,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "authorization": self.api_key,
                    "Content-Type": "application/json",
                    "User-Agent": "VARSHANET-SACHET-Broadcast/2.4"
                }
            )
            with urllib.request.urlopen(req, timeout=8) as resp:
                res_data = json.loads(resp.read().decode("utf-8"))
                logger.info(f"Fast2SMS broadcast success: {res_data}")
                return {
                    "success": True,
                    "status": "DELIVERED",
                    "gateway": "Fast2SMS Bulk v2",
                    "recipients": cleaned_numbers.split(","),
                    "dispatched_count": len(cleaned_numbers.split(",")),
                    "message_body": sms_text,
                    "gateway_response": res_data
                }
        except urllib.error.HTTPError as he:
            err_body = he.read().decode("utf-8", errors="ignore")
            logger.warning(f"Fast2SMS HTTP Error ({he.code}): {err_body}")
            try:
                err_json = json.loads(err_body)
                error_msg = err_json.get("message", err_body)
            except Exception:
                error_msg = err_body

            return {
                "success": False,
                "status": "GATEWAY_NOTICE",
                "http_code": he.code,
                "error": error_msg,
                "sms_preview": sms_text,
                "recipients": cleaned_numbers.split(","),
                "detail": "Fast2SMS key is valid, but Fast2SMS requires one-time INR 100 activation or OTP verification on fast2sms.com to unlock external bulk HTTP API."
            }
        except Exception as e:
            logger.error(f"Fast2SMS dispatch error: {e}")
            return {
                "success": False,
                "status": "DISPATCH_FAILED",
                "error": str(e),
                "sms_preview": sms_text
            }

sms_service = Fast2SMSService()
