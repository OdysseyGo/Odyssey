"""AdMob Server-Side Verification (SSV) signature verification.

Reference: https://developers.google.com/admob/android/ssv
"""

import base64
import logging
from dataclasses import dataclass
from typing import Callable

import requests
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from django.core.cache import cache

logger = logging.getLogger(__name__)

VERIFIER_KEYS_URL = "https://www.gstatic.com/admob/reward/verifier-keys.json"
KEYS_CACHE_KEY = "admob:ssv:verifier_keys"
KEYS_CACHE_TTL = 60 * 60 * 24  # 24 hours
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


def _build_signed_message_from_raw_query(raw_query_string: str) -> bytes:
    """Build the exact signed AdMob message from the raw query string.

    AdMob signs byte-exact query content before the trailing `&signature=...`
    parameter. The final two params must be exactly `signature` then `key_id`.
    """
    if not raw_query_string:
        raise SsvVerificationError("Missing raw query string.")

    query = raw_query_string[1:] if raw_query_string.startswith("?") else raw_query_string
    if not query:
        raise SsvVerificationError("Empty raw query string.")

    signature_marker = "&signature="
    signature_idx = query.find(signature_marker)
    if signature_idx == -1:
        raise SsvVerificationError("Malformed raw query: missing '&signature='.")

    signed_query = query[:signature_idx]
    if not signed_query:
        raise SsvVerificationError("Malformed raw query: missing signed parameters.")

    tail = query[signature_idx + 1 :]  # `signature=...&key_id=...`
    tail_parts = tail.split("&")
    if len(tail_parts) != 2:
        raise SsvVerificationError(
            "Malformed raw query: signature and key_id must be final two parameters."
        )

    if not tail_parts[0].startswith("signature="):
        raise SsvVerificationError("Malformed raw query: expected signature parameter.")
    if not tail_parts[1].startswith("key_id="):
        raise SsvVerificationError(
            "Malformed raw query: expected key_id parameter after signature."
        )

    signature_value = tail_parts[0].split("=", 1)[1]
    key_id_value = tail_parts[1].split("=", 1)[1]
    if not signature_value:
        raise SsvVerificationError("Malformed raw query: empty signature parameter.")
    if not key_id_value:
        raise SsvVerificationError("Malformed raw query: empty key_id parameter.")

    return signed_query.encode("utf-8")


def _validate_business_rules(
    payload: SsvPayload,
    *,
    is_duplicate_transaction: Callable[[str], bool] | None = None,
    business_validator: Callable[[SsvPayload], None] | None = None,
):
    """Business validation hook-point after signature verification.

    TODO: enforce timestamp freshness (reject stale/future callbacks).
    TODO: enforce expected AdMob ad unit id(s) for this environment.
    TODO: enforce expected reward_item/reward_amount per placement mapping.
    TODO: bind callback to trusted user/session mapping from user_id/custom_data.
    """
    if is_duplicate_transaction and is_duplicate_transaction(payload.transaction_id):
        raise SsvVerificationError("Duplicate transaction_id.")

    if business_validator:
        try:
            business_validator(payload)
        except SsvVerificationError:
            raise
        except Exception as e:
            raise SsvVerificationError(f"Business validation failed: {e}") from e


def verify_ssv(
    query_params: dict,
    raw_query_string: str = "",
    *,
    is_duplicate_transaction: Callable[[str], bool] | None = None,
    business_validator: Callable[[SsvPayload], None] | None = None,
) -> SsvPayload:
    """Verify an AdMob SSV callback. Raises SsvVerificationError on failure."""
    signed_message = _build_signed_message_from_raw_query(raw_query_string)

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

    try:
        padded = signature_b64 + ("=" * (-len(signature_b64) % 4))
        signature = base64.urlsafe_b64decode(padded)
    except Exception as e:
        raise SsvVerificationError(f"Malformed signature: {e}")

    try:
        public_key.verify(signature, signed_message, ec.ECDSA(hashes.SHA256()))
    except InvalidSignature:
        raise SsvVerificationError("Signature did not verify.")

    try:
        payload = SsvPayload(
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

    _validate_business_rules(
        payload,
        is_duplicate_transaction=is_duplicate_transaction,
        business_validator=business_validator,
    )

    return payload
