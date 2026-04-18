from django.urls import path

from apps.payments.webhooks import stripe_webhook

from . import views

urlpatterns = [
    # Subscription
    path("plans/", views.PlansView.as_view(), name="payment-plans"),
    path("subscribe/", views.SubscribeView.as_view(), name="subscribe"),
    path(
        "subscription/",
        views.SubscriptionDetailView.as_view(),
        name="subscription-detail",
    ),
    path(
        "subscription/cancel/",
        views.CancelSubscriptionView.as_view(),
        name="subscription-cancel",
    ),
    path(
        "subscription/reactivate/",
        views.ReactivateSubscriptionView.as_view(),
        name="subscription-reactivate",
    ),
    # Credits
    path("credit-packs/", views.CreditPackListView.as_view(), name="credit-packs"),
    path(
        "credits/purchase/", views.CreditPurchaseView.as_view(), name="credit-purchase"
    ),
    path("credits/balance/", views.CreditBalanceView.as_view(), name="credit-balance"),
    # Tour access
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
    # AI generation
    path(
        "ai-allowance/", views.AIGenerationAllowanceView.as_view(), name="ai-allowance"
    ),
    # Creator
    path(
        "creator/earnings/",
        views.CreatorEarningsView.as_view(),
        name="creator-earnings",
    ),
    # Webhook
    path("webhook/", stripe_webhook, name="stripe-webhook"),
]
