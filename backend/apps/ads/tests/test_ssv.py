import base64
from unittest.mock import patch

import pytest
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec

from apps.ads.services import admob_ssv
from apps.ads.services.admob_ssv import SsvVerificationError, verify_ssv


def _sign_raw(private_key, message: bytes) -> str:
    sig = private_key.sign(message, ec.ECDSA(hashes.SHA256()))
    return base64.urlsafe_b64encode(sig).rstrip(b"=").decode("ascii")


def _build_raw_query(signed_query: str, signature: str, key_id: str = "42") -> str:
    return f"{signed_query}&signature={signature}&key_id={key_id}"


@pytest.fixture
def keypair():
    private_key = ec.generate_private_key(ec.SECP256R1())
    public_key = private_key.public_key()
    pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode("ascii")
    return private_key, pem


@pytest.fixture
def patch_keys(keypair):
    _, pem = keypair
    with patch.object(admob_ssv, "_fetch_verifier_keys", return_value={"42": pem}):
        yield


@pytest.fixture
def signed_query():
    return (
        "ad_network=5450213213286189855"
        "&ad_unit=1234567890"
        "&custom_data=1%3Arewarded_ai_slot"
        "&reward_amount=1"
        "&reward_item=rewarded_ai_slot"
        "&timestamp=1777993762749"
        "&transaction_id=123456789"
        "&user_id=1"
    )


@pytest.fixture
def base_params():
    return {
        "ad_network": "5450213213286189855",
        "ad_unit": "1234567890",
        "custom_data": "1:rewarded_ai_slot",
        "reward_amount": "1",
        "reward_item": "rewarded_ai_slot",
        "timestamp": "1777993762749",
        "transaction_id": "123456789",
        "user_id": "1",
    }


def test_valid_callback_verifies(keypair, patch_keys, signed_query, base_params):
    private_key, _ = keypair
    signature = _sign_raw(private_key, signed_query.encode("utf-8"))
    raw_query = "?" + _build_raw_query(signed_query, signature)
    params = {**base_params, "signature": signature, "key_id": "42"}

    payload = verify_ssv(params, raw_query_string=raw_query)

    assert payload.transaction_id == "123456789"
    assert payload.custom_data == "1:rewarded_ai_slot"


def test_modified_query_parameter_fails(keypair, patch_keys, signed_query, base_params):
    private_key, _ = keypair
    signature = _sign_raw(private_key, signed_query.encode("utf-8"))
    tampered_signed_query = signed_query.replace("reward_amount=1", "reward_amount=2")
    raw_query = _build_raw_query(tampered_signed_query, signature)
    params = {
        **base_params,
        "signature": signature,
        "key_id": "42",
        "reward_amount": "2",
    }

    with pytest.raises(SsvVerificationError, match="Signature did not verify"):
        verify_ssv(params, raw_query_string=raw_query)


def test_reordered_query_fails(keypair, patch_keys, signed_query, base_params):
    private_key, _ = keypair
    signature = _sign_raw(private_key, signed_query.encode("utf-8"))
    reordered = (
        "ad_unit=1234567890"
        "&ad_network=5450213213286189855"
        "&custom_data=1%3Arewarded_ai_slot"
        "&reward_amount=1"
        "&reward_item=rewarded_ai_slot"
        "&timestamp=1777993762749"
        "&transaction_id=123456789"
        "&user_id=1"
    )
    raw_query = _build_raw_query(reordered, signature)
    params = {**base_params, "signature": signature, "key_id": "42"}

    with pytest.raises(SsvVerificationError, match="Signature did not verify"):
        verify_ssv(params, raw_query_string=raw_query)


def test_reencoded_query_fails(keypair, patch_keys, base_params):
    private_key, _ = keypair
    originally_signed_query = (
        "ad_network=5450213213286189855"
        "&ad_unit=1234567890"
        "&custom_data=1%3Arewarded%20ai_slot"
        "&reward_amount=1"
        "&reward_item=rewarded_ai_slot"
        "&timestamp=1777993762749"
        "&transaction_id=123456789"
        "&user_id=1"
    )
    signature = _sign_raw(private_key, originally_signed_query.encode("utf-8"))
    reencoded_query = originally_signed_query.replace("%20", "+")
    raw_query = _build_raw_query(reencoded_query, signature)
    params = {
        **base_params,
        "custom_data": "1:rewarded ai_slot",
        "signature": signature,
        "key_id": "42",
    }

    with pytest.raises(SsvVerificationError, match="Signature did not verify"):
        verify_ssv(params, raw_query_string=raw_query)


def test_missing_signature_fails(patch_keys, signed_query, base_params):
    raw_query = f"{signed_query}&key_id=42"
    params = {**base_params, "key_id": "42"}

    with pytest.raises(SsvVerificationError, match="missing '&signature='"):
        verify_ssv(params, raw_query_string=raw_query)


def test_missing_key_id_fails(keypair, patch_keys, signed_query, base_params):
    private_key, _ = keypair
    signature = _sign_raw(private_key, signed_query.encode("utf-8"))
    raw_query = f"{signed_query}&signature={signature}"
    params = {**base_params, "signature": signature}

    with pytest.raises(SsvVerificationError, match="must be final two parameters"):
        verify_ssv(params, raw_query_string=raw_query)


def test_unknown_key_id_fails(keypair, patch_keys, signed_query, base_params):
    private_key, _ = keypair
    signature = _sign_raw(private_key, signed_query.encode("utf-8"))
    raw_query = _build_raw_query(signed_query, signature, key_id="9999")
    params = {**base_params, "signature": signature, "key_id": "9999"}

    with pytest.raises(SsvVerificationError, match="Unknown key_id"):
        verify_ssv(params, raw_query_string=raw_query)


def test_duplicate_transaction_id_rejected_by_business_logic(
    keypair, patch_keys, signed_query, base_params
):
    private_key, _ = keypair
    signature = _sign_raw(private_key, signed_query.encode("utf-8"))
    raw_query = _build_raw_query(signed_query, signature)
    params = {**base_params, "signature": signature, "key_id": "42"}

    with pytest.raises(SsvVerificationError, match="Duplicate transaction_id"):
        verify_ssv(
            params,
            raw_query_string=raw_query,
            is_duplicate_transaction=lambda tx_id: tx_id == "123456789",
        )


def test_extra_params_after_key_id_fails(
    keypair, patch_keys, signed_query, base_params
):
    private_key, _ = keypair
    signature = _sign_raw(private_key, signed_query.encode("utf-8"))
    raw_query = _build_raw_query(signed_query, signature) + "&foo=bar"
    params = {**base_params, "signature": signature, "key_id": "42"}

    with pytest.raises(SsvVerificationError, match="must be final two parameters"):
        verify_ssv(params, raw_query_string=raw_query)


def test_signature_candidate_variants_are_not_accepted(
    keypair, patch_keys, signed_query, base_params
):
    private_key, _ = keypair
    signed_with_key_id = f"{signed_query}&key_id=42"
    signature = _sign_raw(private_key, signed_with_key_id.encode("utf-8"))
    raw_query = _build_raw_query(signed_query, signature)
    params = {**base_params, "signature": signature, "key_id": "42"}

    with pytest.raises(SsvVerificationError, match="Signature did not verify"):
        verify_ssv(params, raw_query_string=raw_query)
