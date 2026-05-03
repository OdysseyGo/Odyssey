from django.urls import path

from .views import (
    AdConfigView,
    AdImpressionView,
    AdMobSsvView,
    ConsumeGrantView,
    DevRewardGrantView,
)

urlpatterns = [
    path("config/", AdConfigView.as_view(), name="ad-config"),
    path("impressions/", AdImpressionView.as_view(), name="ad-impressions"),
    path("rewards/ssv/", AdMobSsvView.as_view(), name="ad-rewards-ssv"),
    path(
        "rewards/dev-grant/", DevRewardGrantView.as_view(), name="ad-rewards-dev-grant"
    ),
    path(
        "rewards/<int:grant_id>/consume/",
        ConsumeGrantView.as_view(),
        name="ad-rewards-consume",
    ),
]
