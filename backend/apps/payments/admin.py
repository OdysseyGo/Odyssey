from django.contrib import admin

from .models import CreditPack, Subscription, TourPurchase, Transaction


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "plan",
        "status",
        "apple_environment",
        "current_period_end",
        "cancel_at_period_end",
    )
    list_filter = ("plan", "status", "apple_environment", "cancel_at_period_end")
    search_fields = ("user__username", "apple_original_transaction_id")
    readonly_fields = (
        "apple_original_transaction_id",
        "apple_product_id",
        "apple_environment",
        "created_at",
        "updated_at",
    )


@admin.register(CreditPack)
class CreditPackAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "credits",
        "price_cents",
        "currency",
        "apple_product_id",
        "is_active",
    )
    list_filter = ("is_active", "currency")
    search_fields = ("name", "apple_product_id")


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ("user", "transaction_type", "amount", "balance_after", "created_at")
    list_filter = ("transaction_type", "created_at")
    search_fields = ("user__username", "description", "apple_transaction_id")
    readonly_fields = ("created_at", "apple_transaction_id")


@admin.register(TourPurchase)
class TourPurchaseAdmin(admin.ModelAdmin):
    list_display = ("user", "tour", "credits_spent", "purchased_at")
    search_fields = ("user__username", "tour__title")
    readonly_fields = ("purchased_at",)
