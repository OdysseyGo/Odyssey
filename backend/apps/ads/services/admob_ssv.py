"""AdMob Server-Side Verification (SSV) signature verification.

Reference: https://developers.google.com/admob/android/ssv

AdMob signs each rewarded-ad SSV callback with an ECDSA-P256 signature over a
canonical message derived from the original query string. Public keys are
published at:

    https://www.gstatic.com/admob/reward/verifier-keys.json

The signed message is the raw query string with the trailing `signature` and
`key_id` parameters removed (everything before `&signature=...`).
"""

import base64
import logging
from dataclasses import dataclass
from urllib.parse import urlencode

import requests
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from django.core.cache import cache

logger = logging.getLogger(__name__)

VERIFIER_KEYS_URL = "https://www.gstatic.com/admob/reward/verifier-keys.json"
KEYS_CACHE_KEY = "admob:ssv:verifier_keys"
KEYS_CACHE_TTL = 60 * 60 * 24  # 24 hours
SIGNED_PARAM_ORDER = (
    "ad_network",
    "ad_unit",
    "reward_amount",
    "reward_item",
    "timestamp",
    "transaction_id",
    "user_id",
    "custom_data",
)


class SsvVerificationError(Exception):
    pass


@dataclass
class SsvPayload:
    ad_network: str
    ad_unit: str
    reward_amount: int
    reward_item: str
    timestamp: int
    transaction_id: str
    user_id: str
    custom_data: str


def _fetch_verifier_keys():
    cached = cache.get(KEYS_CACHE_KEY)
    if cached:
        return cached
    resp = requests.get(VERIFIER_KEYS_URL, timeout=5)
    resp.raise_for_status()
    keys = {str(k["keyId"]): k["pem"] for k in resp.json().get("keys", [])}
    cache.set(KEYS_CACHE_KEY, keys, KEYS_CACHE_TTL)
    return keys


def _load_public_key(pem: str):
    return serialization.load_pem_public_key(pem.encode("utf-8"))


def _build_signed_message(params: dict) -> bytes:
    pairs = [(k, params[k]) for k in SIGNED_PARAM_ORDER if k in params]
    return urlencode(pairs).encode("utf-8")


def _build_signed_message_from_raw_query(raw_query_string: str) -> bytes:
    """Build signed bytes from AdMob's original callback query string.

    AdMob signs the original query string bytes up to (but excluding)
    `&signature=...` and `&key_id=...`, which are appended at the end.
    """
    if not raw_query_string:
        return b""

    query = raw_query_string[1:] if raw_query_string.startswith("?") else raw_query_string
    parts = [p for p in query.split("&") if p]
    if not parts:
        return b""

    filtered = [
        part
        for part in parts
        if not part.startswith("signature=") and not part.startswith("key_id=")
    ]
    if len(filtered) == len(parts):
        return b""

    return "&".join(filtered).encode("utf-8")


def verify_ssv(query_params: dict, raw_query_string: str = "") -> SsvPayload:
    """Verify an AdMob SSV callback. Raises SsvVerificationError on failure."""
    signature_b64 = query_params.get("signature")
    key_id = query_params.get("key_id")
    if not signature_b64 or not key_id:
        raise SsvVerificationError("Missing signature or key_id.")

    try:
        keys = _fetch_verifier_keys()
    except Exception as e:
        logger.exception("Failed to fetch AdMob verifier keys.")
        raise SsvVerificationError(f"Could not fetch verifier keys: {e}")

    pem = keys.get(str(key_id))
    if not pem:
        raise SsvVerificationError(f"Unknown key_id: {key_id}")

    try:
        public_key = _load_public_key(pem)
    except Exception as e:
        raise SsvVerificationError(f"Failed to load public key: {e}")

    if not isinstance(public_key, ec.EllipticCurvePublicKey):
        raise SsvVerificationError("Verifier key is not ECDSA.")

    message = _build_signed_message_from_raw_query(raw_query_string)
    if not message:
        # Fallback for tests and non-standard intermediaries that may not
        # provide the untouched raw query string.
        message = _build_signed_message(query_params)
    try:
        signature = base64.urlsafe_b64decode(signature_b64 + "==")
    except Exception as e:
        raise SsvVerificationError(f"Malformed signature: {e}")

    try:
        public_key.verify(signature, message, ec.ECDSA(hashes.SHA256()))
    except InvalidSignature:
        raise SsvVerificationError("Signature did not verify.")

    try:
        return SsvPayload(
            ad_network=query_params.get("ad_network", ""),
            ad_unit=query_params.get("ad_unit", ""),
            reward_amount=int(query_params.get("reward_amount", "0")),
            reward_item=query_params.get("reward_item", ""),
            timestamp=int(query_params.get("timestamp", "0")),
            transaction_id=query_params["transaction_id"],
            user_id=query_params.get("user_id", ""),
            custom_data=query_params.get("custom_data", ""),
        )
    except (KeyError, ValueError) as e:
        raise SsvVerificationError(f"Malformed SSV payload: {e}")
