"""
VARSHANET Telegram Emergency Early-Warning Gateway
Dispatches 100% free, instant convective weather storm warnings,
cloudburst alerts, and safety instructions to Telegram channels, groups, and citizens.
"""
import os
import json
import logging
import urllib.request
import urllib.error
from typing import Dict, Any, Optional

import ssl

logger = logging.getLogger("varshanet.telegram")

DEFAULT_BOT_TOKEN = "8651215993:AAGwN5FUJYkF6DEL-rFAMTiYU7KociS-_S8"
DEFAULT_CHAT_ID = "@Adarshsingh099"

class TelegramAlertService:
    def __init__(self):
        self.bot_token = os.getenv("TELEGRAM_BOT_TOKEN", DEFAULT_BOT_TOKEN).strip() or DEFAULT_BOT_TOKEN
        self.default_chat_id = os.getenv("TELEGRAM_CHAT_ID", DEFAULT_CHAT_ID).strip() or DEFAULT_CHAT_ID
        self.api_base = "https://api.telegram.org"
        try:
            self.ssl_context = ssl._create_unverified_context()
        except Exception:
            self.ssl_context = None

    def is_configured(self) -> bool:
        return bool(self.bot_token and self.default_chat_id)

    def _resolve_numeric_chat_id(self, token: str, chat_identifier: str) -> str:
        """
        If chat_identifier is a username (e.g. @Adarshsingh099), Telegram API requires the numeric chat_id.
        This queries getUpdates to automatically resolve the user's numeric chat ID from recent bot interactions.
        """
        clean_name = chat_identifier.lstrip("@").lower()
        try:
            url = f"{self.api_base}/bot{token}/getUpdates"
            req = urllib.request.Request(url, headers={"User-Agent": "VARSHANET-Disaster-Gateway/2.4"})
            with urllib.request.urlopen(req, timeout=6, context=self.ssl_context) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                results = data.get("result", [])
                for item in reversed(results):
                    msg = item.get("message") or item.get("channel_post") or item.get("my_chat_member") or {}
                    chat = msg.get("chat") or {}
                    sender = msg.get("from") or {}
                    # Check matching username
                    if (chat.get("username", "").lower() == clean_name or
                        sender.get("username", "").lower() == clean_name):
                        return str(chat.get("id"))
                    # If this is the only active user in updates, auto-link
                    if chat.get("id"):
                        return str(chat.get("id"))
        except Exception as e:
            logger.warning(f"Could not auto-resolve chat id: {e}")
        return chat_identifier

    def send_alert(
        self,
        alert_title: str,
        region: str,
        severity: str,
        action: str,
        onset_minutes: Optional[int] = 25,
        road_status: Optional[str] = None,
        custom_chat_id: Optional[str] = None,
        custom_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Sends formatted emergency warning message to specified Telegram chat / channel.
        """
        token = (custom_token or self.bot_token).strip()
        chat_id = (custom_chat_id or self.default_chat_id).strip()

        # Severity theme indicator
        sev_upper = severity.upper()
        if sev_upper in ["CRITICAL", "SEVERE"]:
            sev_emoji = "🔴"
            status_text = "EMERGENCY WARNING IN EFFECT"
        elif sev_upper in ["HIGH", "ELEVATED"]:
            sev_emoji = "🟠"
            status_text = "HIGH PRIORITY WARNING"
        else:
            sev_emoji = "🟡"
            status_text = "WEATHER WATCH / ADVISORY"

        # Format Telegram MarkdownV2 or standard Markdown message
        message_lines = [
            f"🚨 *VARSHANET EMERGENCY EARLY WARNING*",
            f"{sev_emoji} *Severity:* {sev_upper} ({status_text})",
            f"📍 *Location:* {region}",
            f"⏱ *Onset ETA:* ~{onset_minutes or 25} minutes",
            f"",
            f"⚠️ *Warning:* {alert_title}",
            f"",
            f"🛡 *Safety Directives:*",
            f"• {action}",
        ]

        if road_status and road_status != "Normal operations":
            message_lines.extend([
                f"",
                f"🚧 *Road & Traffic Status:*",
                f"{road_status}"
            ])

        message_lines.extend([
            f"",
            f"📡 _National Convective Storm Nowcasting Terminal (MoES / NDMA)_",
            f"🌐 [Citizen Portal Live](https://frontend-azure-theta-33.vercel.app/)"
        ])

        formatted_text = "\n".join(message_lines)

        if not token or not chat_id:
            logger.info("Telegram not configured. Returning simulated payload.")
            return {
                "success": True,
                "status": "SIMULATED_BROADCAST",
                "message": "Telegram Bot Token or Chat ID not configured. Generated message preview ready.",
                "preview": formatted_text,
                "chat_id": chat_id or "NOT_SET",
                "instructions": "Add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in backend/.env to send real messages to Telegram."
            }

        # If chat_id is a username like @Adarshsingh099, resolve to numeric chat ID
        if chat_id.startswith("@"):
            resolved = self._resolve_numeric_chat_id(token, chat_id)
            if resolved:
                chat_id = resolved

        url = f"{self.api_base}/bot{token}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": formatted_text,
            "parse_mode": "Markdown",
            "disable_web_page_preview": False
        }

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "User-Agent": "VARSHANET-Disaster-Gateway/2.4"
                }
            )
            with urllib.request.urlopen(req, timeout=8, context=self.ssl_context) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                ok = data.get("ok", False)
                return {
                    "success": ok,
                    "status": "DELIVERED" if ok else "DISPATCH_FAILED",
                    "message": "Emergency alert transmitted to Telegram channel/group successfully.",
                    "chat_id": chat_id,
                    "telegram_message_id": data.get("result", {}).get("message_id"),
                    "preview": formatted_text
                }
        except urllib.error.HTTPError as he:
            err_body = he.read().decode("utf-8", errors="ignore")
            logger.warning(f"Telegram HTTP Error ({he.code}): {err_body}")
            try:
                err_json = json.loads(err_body)
                desc = err_json.get("description", err_body)
            except Exception:
                desc = err_body
            return {
                "success": False,
                "status": "TELEGRAM_API_ERROR",
                "http_code": he.code,
                "message": f"Telegram API Error: {desc}",
                "preview": formatted_text
            }
        except Exception as e:
            logger.error(f"Telegram dispatch error: {e}")
            return {
                "success": False,
                "status": "DISPATCH_FAILED",
                "message": str(e),
                "preview": formatted_text
            }

telegram_service = TelegramAlertService()
