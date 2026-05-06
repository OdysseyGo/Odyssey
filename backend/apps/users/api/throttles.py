from rest_framework.throttling import ScopedRateThrottle, SimpleRateThrottle


class PasswordResetRequestThrottle(ScopedRateThrottle):
    scope = "password_reset_request"


class PasswordResetConfirmThrottle(ScopedRateThrottle):
    scope = "password_reset_confirm"


class LoginAttemptThrottle(SimpleRateThrottle):
    scope = "login_attempt"

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        return self.cache_format % {"scope": self.scope, "ident": ident}
