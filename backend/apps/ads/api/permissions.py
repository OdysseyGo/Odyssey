def is_user_ad_free(user) -> bool:
    """Return True if the user holds an active ad-free entitlement.

    Ad-free is bundled into the Premium subscription (KAN-58). On branches
    without the payments app, this returns False.
    """
    if not user or not user.is_authenticated:
        return False

    try:
        from apps.payments.models import Subscription
    except ImportError:
        return False

    sub = Subscription.objects.filter(user=user).first()
    if sub is None:
        return False
    return sub.status == Subscription.ACTIVE
