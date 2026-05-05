import base64
from unittest.mock import patch

import pytest
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec

from apps.ads.services import admob_ssv
from apps.ads.services.admob_ssv import (
    SIGNED_PARAM_ORDER,
    SsvVerificationError,
    verify_ssv,
)


def _sign(private_key, params):
    pairs = [(k, params[k]) for k in SIGNED_PARAM_ORDER if k in params]
    from urllib.parse import urlencode

    message = urlencode(pairs).encode("utf-8")
    sig = private_key.sign(message, ec.ECDSA(hashes.SHA256()))
    return base64.urlsafe_b64encode(sig).rstrip(b"=").decode("ascii")


@pytest.fixture
def keypair():
    priv = ec.generate_private_key(ec.SECP256R1())
    pub = priv.public_key()
    pem = pub.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode("ascii")
    return priv, pem


@pytest.fixture
def patch_keys(keypair):
    _, pem = keypair
    with patch.object(admob_ssv, "_fetch_verifier_keys", return_value={"42": pem}):
        yield


@pytest.fixture
def base_params():
    return {
        "ad_network": "5450213213286189855",
        "ad_unit": "1234567890",
        "reward_amount": "10",
        "reward_item": "credits",
        "timestamp": "1700000000000",
        "transaction_id": "tx-abc-123",
        "user_id": "1",
        "custom_data": "1:rewarded_credits",
    }


def test_ssv_valid_signature(keypair, patch_keys, base_params):
    priv, _ = keypair
    sig = _sign(priv, base_params)
    params = {**base_params, "key_id": "42", "signature": sig}

    payload = verify_ssv(params)

    assert payload.transaction_id == "tx-abc-123"
    assert payload.reward_amount == 10
    assert payload.custom_data == "1:rewarded_credits"


def test_ssv_tampered_payload(keypair, patch_keys, base_params):
    priv, _ = keypair
    sig = _sign(priv, base_params)
    tampered = {**base_params, "reward_amount": "9999"}
    params = {**tampered, "key_id": "42", "signature": sig}

    with pytest.raises(SsvVerificationError):
        verify_ssv(params)


def test_ssv_unknown_key_id(keypair, patch_keys, base_params):
    priv, _ = keypair
    sig = _sign(priv, base_params)
    params = {**base_params, "key_id": "9999", "signature": sig}

    with pytest.raises(SsvVerificationError):
        verify_ssv(params)


def test_ssv_missing_signature(base_params):
    with pytest.raises(SsvVerificationError):
        verify_ssv(base_params)


def test_ssv_valid_signature_with_raw_query_string(keypair, patch_keys, base_params):
    priv, _ = keypair
    sig = _sign(priv, base_params)
    params = {**base_params, "key_id": "42", "signature": sig}
    raw_qs = (
        "ad_network=5450213213286189855"
        "&ad_unit=1234567890"
        "&reward_amount=10"
        "&reward_item=credits"
        "&timestamp=1700000000000"
        "&transaction_id=tx-abc-123"
        "&user_id=1"
        "&custom_data=1%3Arewarded_credits"
        f"&signature={sig}"
        "&key_id=42"
    )

    payload = verify_ssv(params, raw_query_string=raw_qs)

    assert payload.transaction_id == "tx-abc-123"


def test_ssv_valid_signature_with_raw_query_signature_first(keypair, patch_keys, base_params):
    priv, _ = keypair
    sig = _sign(priv, base_params)
    params = {**base_params, "key_id": "42", "signature": sig}
    raw_qs = (
        f"signature={sig}"
        "&key_id=42"
        "&ad_network=5450213213286189855"
        "&ad_unit=1234567890"
        "&reward_amount=10"
        "&reward_item=credits"
        "&timestamp=1700000000000"
        "&transaction_id=tx-abc-123"
        "&user_id=1"
        "&custom_data=1%3Arewarded_credits"
    )

    payload = verify_ssv(params, raw_query_string=raw_qs)

    assert payload.transaction_id == "tx-abc-123"
