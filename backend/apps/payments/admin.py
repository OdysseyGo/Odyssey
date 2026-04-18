from django.contrib import admin

from .models import CreditPack, Subscription, TourPurchase, Transaction


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "plan",
        "status",
        "current_period_end",
        "cancel_at_period_end",
    )
    list_filter = ("plan", "status", "cancel_at_period_end")
    search_fields = ("user__username", "stripe_subscription_id")
    readonly_fields = (
        "stripe_customer_id",
        "stripe_subscription_id",
        "created_at",
        "updated_at",
    )


@admin.register(CreditPack)
class CreditPackAdmin(admin.ModelAdmin):
    list_display = ("name", "credits", "price_cents", "currency", "is_active")
    list_filter = ("is_active", "currency")


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ("user", "transaction_type", "amount", "balance_after", "created_at")
    list_filter = ("transaction_type", "created_at")
    search_fields = ("user__username", "description")
    readonly_fields = ("created_at",)


@admin.register(TourPurchase)
class TourPurchaseAdmin(admin.ModelAdmin):
    list_display = ("user", "tour", "credits_spent", "purchased_at")
    search_fields = ("user__username", "tour__title")
    readonly_fields = ("purchased_at",)
