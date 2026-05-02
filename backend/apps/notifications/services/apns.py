import logging
from datetime import datetime, timezone
import os
from pathlib import Path

import httpx
import jwt
from django.conf import settings

logger = logging.getLogger(__name__)


class APNsService:
    """Service for sending push notifications via Apple Push Notification service"""

    def __init__(self):
        self.team_id = settings.APPLE_TEAM_ID
        self.key_id = settings.APPLE_KEY_ID
        self.bundle_id = settings.APNS_BUNDLE_ID
        self.use_sandbox = settings.APNS_USE_SANDBOX

        current_dir = Path(__file__).parent.resolve()
        self.certificate_path = current_dir / f"keys/AuthKey_{self.key_id}.p8"

        # APNs server URLs
        self.sandbox_url = "https://api.sandbox.push.apple.com"
        self.production_url = "https://api.push.apple.com"
        self.base_url = self.sandbox_url if self.use_sandbox else self.production_url

    def _generate_jwt_token(self):
        """Generate JWT token for APNs authentication"""
        headers = {"kid": self.key_id}

        payload = {"iss": self.team_id, "iat": datetime.now(timezone.utc)}

        # Read your private key file
        with open(self.certificate_path, "r") as f:
            private_key = f.read()

        token = jwt.encode(payload, private_key, algorithm="ES256", headers=headers)
        return token

    def send_notification(
        self,
        device_token: str,
        alert_dict: dict,
        badge: int = None,
        sound: str = "default",
        extra_data: dict = None,
    ) -> bool:
        """
        Send push notification to a device

        Args:
            device_token: Device token from mobile app
            alert_dict: {'title': '...', 'body': '...'}
            badge: Badge number
            sound: Sound file name
            extra_data: Additional custom data

        Returns:
            bool: Success status
        """
        try:
            # Prepare payload
            payload = {
                "aps": {
                    "alert": alert_dict,
                    "sound": sound,
                }
            }

            if badge:
                payload["aps"]["badge"] = badge

            # Add custom data if provided
            if extra_data:
                payload.update(extra_data)

            # Prepare request
            headers = {
                "apns-topic": self.bundle_id,
                "authorization": f"bearer {self._generate_jwt_token()}",
            }

            url = f"{self.base_url}/3/device/{device_token}"

            with httpx.Client(http2=True) as client:
                response = client.post(url, json=payload, headers=headers, timeout=10)

            if response.status_code == 200:
                logger.info(f"Notification sent successfully to {device_token}")
                return True
            else:
                logger.error(
                    f"Failed to send notification: {response.status_code} - {response.text}"
                )
                return False

        except Exception as e:
            logger.error(f"Error sending APNs notification: {str(e)}")
            return False
