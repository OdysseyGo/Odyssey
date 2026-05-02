from rest_framework.throttling import ScopedRateThrottle


class PasswordResetRequestThrottle(ScopedRateThrottle):
    scope = "password_reset_request"


class PasswordResetConfirmThrottle(ScopedRateThrottle):
    scope = "password_reset_confirm"
