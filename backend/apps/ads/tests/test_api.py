import uuid
from unittest.mock import patch

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.ads.models import AdImpression, AdPlacement, RewardedAdGrant
from apps.ads.services import reward_service
from apps.ads.services.admob_ssv import SsvVerificationError

User = get_user_model()


@pytest.fixture
def user(db):
    return User.objects.create_user(username="rider", password="pw12345")


@pytest.fixture
def client(user):
    c = APIClient()
    c.force_authenticate(user=user)
    return c


@pytest.fixture
def banner(db):
    return AdPlacement.objects.create(
        key="profile_banner",
        ad_format=AdPlacement.BANNER,
        reward_type=AdPlacement.NONE,
        ad_unit_id_ios="ca-app-pub-3940256099942544/2934735716",
        enabled=True,
        frequency_cap_per_day=2,
    )


@pytest.fixture
def rewarded_credits(db):
    return AdPlacement.objects.create(
        key="rewarded_credits",
        ad_format=AdPlacement.REWARDED,
        reward_type=AdPlacement.CREDITS,
        reward_amount=10,
        enabled=True,
    )


@pytest.fixture
def rewarded_hint(db):
    return AdPlacement.objects.create(
        key="rewarded_hint",
        ad_format=AdPlacement.REWARDED,
        reward_type=AdPlacement.HINT,
        reward_amount=1,
        enabled=True,
    )


def test_config_returns_enabled_placements(client, banner, rewarded_credits):
    resp = client.get("/api/ads/config/?platform=ios")
    assert resp.status_code == 200
    body = resp.json()
    assert "is_ad_free" not in body
    assert all("remaining_today" in placement for placement in body["placements"])
    keys = {p["key"] for p in body["placements"]}
    assert keys == {"profile_banner", "rewarded_credits"}


def test_config_hides_disabled_placements(client, banner):
    banner.enabled = False
    banner.save()
    resp = client.get("/api/ads/config/?platform=ios")
    assert resp.json()["placements"] == []


def test_impression_logged(client, user, banner):
    payload = {
        "placement_key": "profile_banner",
        "platform": "ios",
        "client_request_id": str(uuid.uuid4()),
    }
    resp = client.post("/api/ads/impressions/", payload, format="json")
    assert resp.status_code == 201
    assert AdImpression.objects.filter(user=user, placement=banner).count() == 1


def test_impression_frequency_capped(client, user, banner):
    for _ in range(banner.frequency_cap_per_day):
        client.post(
            "/api/ads/impressions/",
            {
                "placement_key": "profile_banner",
                "platform": "ios",
                "client_request_id": str(uuid.uuid4()),
            },
            format="json",
        )

    resp = client.post(
        "/api/ads/impressions/",
        {
            "placement_key": "profile_banner",
            "platform": "ios",
            "client_request_id": str(uuid.uuid4()),
        },
        format="json",
    )
    assert resp.status_code == 429
    assert resp.json()["code"] == "frequency_capped"


def test_reward_service_grant_credits_idempotent(user, rewarded_credits):
    starting = user.credit
    first, created1 = reward_service.grant(
        user=user,
        placement=rewarded_credits,
        admob_transaction_id="tx-1",
    )
    assert created1 is True
    user.refresh_from_db()
    assert user.credit == starting + rewarded_credits.reward_amount

    second, created2 = reward_service.grant(
        user=user,
        placement=rewarded_credits,
        admob_transaction_id="tx-1",
    )
    assert created2 is False
    assert second.id == first.id
    user.refresh_from_db()
    assert user.credit == starting + rewarded_credits.reward_amount  # no double-credit


def test_reward_service_hint_unconsumed(user, rewarded_hint):
    grant_row, created = reward_service.grant(
        user=user,
        placement=rewarded_hint,
        admob_transaction_id="tx-hint-1",
    )
    assert created
    assert grant_row.consumed_at is None
    assert grant_row.reward_type == RewardedAdGrant.HINT


def test_consume_endpoint_marks_consumed_then_409(client, user, rewarded_hint):
    grant_row, _ = reward_service.grant(
        user=user, placement=rewarded_hint, admob_transaction_id="tx-h"
    )

    url = f"/api/ads/rewards/{grant_row.id}/consume/"
    r1 = client.post(url, {"context": {"tour_id": 7, "step_id": 3}}, format="json")
    assert r1.status_code == 200
    assert r1.json()["is_consumed"] is True

    r2 = client.post(url, {"context": {}}, format="json")
    assert r2.status_code == 409
    assert r2.json()["code"] == "already_consumed"


def test_consume_endpoint_rejects_credits_grant(client, user, rewarded_credits):
    grant_row, _ = reward_service.grant(
        user=user, placement=rewarded_credits, admob_transaction_id="tx-c"
    )

    resp = client.post(
        f"/api/ads/rewards/{grant_row.id}/consume/", {"context": {}}, format="json"
    )
    assert resp.status_code == 400


def test_admob_setup_probe_returns_200_and_does_not_grant(user):
    client = APIClient()
    params = {
        "ad_network": "5450213213286189855",
        "ad_unit": "1234567890",
        "reward_amount": "1",
        "reward_item": "rewarded_ai_slot",
        "timestamp": "1777993762749",
        "transaction_id": "123456789",
        "user_id": "1",
        "custom_data": "1:rewarded_ai_slot",
        "signature": "invalid-signature",
        "key_id": "3335741209",
    }
    with (
        patch("apps.ads.api.views.verify_ssv") as verify_mock,
        patch("apps.ads.api.views.reward_service.grant") as grant_mock,
    ):
        resp = client.get("/api/ads/rewards/ssv/", params)

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert resp.json()["probe"] is True
    verify_mock.assert_not_called()
    grant_mock.assert_not_called()
    assert RewardedAdGrant.objects.count() == 0


def test_admob_non_probe_invalid_signature_still_400():
    client = APIClient()
    params = {
        "ad_network": "5450213213286189855",
        "ad_unit": "ca-app-pub-1356436834325874/5652847196",
        "reward_amount": "1",
        "reward_item": "rewarded_ai_slot",
        "timestamp": "1777993762749",
        "transaction_id": "real-tx-123",
        "user_id": "1",
        "custom_data": "1:rewarded_ai_slot",
        "signature": "invalid-signature",
        "key_id": "3335741209",
    }
    with patch(
        "apps.ads.api.views.verify_ssv",
        side_effect=SsvVerificationError("Signature did not verify."),
    ):
        resp = client.get("/api/ads/rewards/ssv/", params)

    assert resp.status_code == 400
