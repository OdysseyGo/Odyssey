from django.conf import settings
from django.db import models


class Subscription(models.Model):
    MONTHLY = "MONTHLY"
    YEARLY = "YEARLY"
    PLAN_CHOICES = [
        (MONTHLY, "Monthly"),
        (YEARLY, "Yearly"),
    ]

    ACTIVE = "ACTIVE"
    CANCELED = "CANCELED"
    EXPIRED = "EXPIRED"
    PAST_DUE = "PAST_DUE"
    STATUS_CHOICES = [
        (ACTIVE, "Active"),
        (CANCELED, "Canceled"),
        (EXPIRED, "Expired"),
        (PAST_DUE, "Past Due"),
    ]

    SANDBOX = "Sandbox"
    PRODUCTION = "Production"
    ENVIRONMENT_CHOICES = [
        (SANDBOX, "Sandbox"),
        (PRODUCTION, "Production"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subscription",
    )
    apple_original_transaction_id = models.CharField(max_length=255, unique=True)
    apple_product_id = models.CharField(max_length=255)
    apple_environment = models.CharField(
        max_length=20, choices=ENVIRONMENT_CHOICES, default=PRODUCTION
    )
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=ACTIVE)
    current_period_start = models.DateTimeField()
    current_period_end = models.DateTimeField()
    cancel_at_period_end = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "subscription"

    def __str__(self):
        return f"{self.user.username} - {self.plan} ({self.status})"


class CreditPack(models.Model):
    name = models.CharField(max_length=100)
    credits = models.PositiveIntegerField()
    price_cents = models.PositiveIntegerField(
        help_text="Price in cents (e.g. 499 = $4.99)"
    )
    currency = models.CharField(max_length=3, default="usd")
    apple_product_id = models.CharField(max_length=255, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "credit_pack"

    def __str__(self):
        return f"{self.name} ({self.credits} credits - ${self.price_cents / 100:.2f})"


class Transaction(models.Model):
    PURCHASE = "PURCHASE"
    TOUR_UNLOCK = "TOUR_UNLOCK"
    CREATOR_EARNING = "CREATOR_EARNING"
    SUBSCRIPTION_GRANT = "SUBSCRIPTION_GRANT"
    REFUND = "REFUND"
    ADMIN_ADJUSTMENT = "ADMIN_ADJUSTMENT"

    TYPE_CHOICES = [
        (PURCHASE, "Credit Purchase"),
        (TOUR_UNLOCK, "Tour Unlock"),
        (CREATOR_EARNING, "Creator Earning"),
        (SUBSCRIPTION_GRANT, "Subscription Grant"),
        (REFUND, "Refund"),
        (ADMIN_ADJUSTMENT, "Admin Adjustment"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="transactions",
    )
    transaction_type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    amount = models.IntegerField(help_text="Positive = credit, negative = debit")
    balance_after = models.IntegerField(
        help_text="Snapshot of user.credit after this transaction"
    )
    description = models.CharField(max_length=255)
    tour = models.ForeignKey(
        "tours.Tour",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="transactions",
    )
    apple_transaction_id = models.CharField(max_length=255, blank=True, db_index=True)
    related_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="related_transactions",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "transaction"
        ordering = ["-created_at"]

    def __str__(self):
        sign = "+" if self.amount >= 0 else ""
        return f"{self.user.username}: {sign}{self.amount} ({self.transaction_type})"


class TourPurchase(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tour_purchases",
    )
    tour = models.ForeignKey(
        "tours.Tour",
        on_delete=models.CASCADE,
        related_name="purchases",
    )
    credits_spent = models.PositiveIntegerField()
    purchased_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "tour_purchase"
        unique_together = ("user", "tour")

    def __str__(self):
        return f"{self.user.username} unlocked {self.tour.title}"
