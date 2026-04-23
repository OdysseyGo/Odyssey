from django.urls import path

from . import views

urlpatterns = [
    path("plans/", views.PlansView.as_view(), name="payment-plans"),
    path(
        "subscription/",
        views.SubscriptionDetailView.as_view(),
        name="subscription-detail",
    ),
    path(
        "subscription/manage/",
        views.ManageSubscriptionView.as_view(),
        name="subscription-manage",
    ),
    path("credit-packs/", views.CreditPackListView.as_view(), name="credit-packs"),
    path("credits/balance/", views.CreditBalanceView.as_view(), name="credit-balance"),
    path(
        "tours/<int:tour_id>/unlock/",
        views.TourUnlockView.as_view(),
        name="tour-unlock",
    ),
    path(
        "tours/<int:tour_id>/access/",
        views.TourAccessView.as_view(),
        name="tour-access",
    ),
    path(
        "ai-allowance/", views.AIGenerationAllowanceView.as_view(), name="ai-allowance"
    ),
    path(
        "creator/earnings/",
        views.CreatorEarningsView.as_view(),
        name="creator-earnings",
    ),
    path("iap/verify/", views.IapVerifyView.as_view(), name="iap-verify"),
    path(
        "iap/notifications/",
        views.IapNotificationsView.as_view(),
        name="iap-notifications",
    ),
]
