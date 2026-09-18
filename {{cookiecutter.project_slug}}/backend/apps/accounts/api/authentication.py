from rest_framework.authentication import SessionAuthentication
from rest_framework.request import Request


class CsrfEnforcedSessionAuthentication(SessionAuthentication):
    """
    Enforce CSRF before checking whether the request has a session user.

    DRF's standard SessionAuthentication skips CSRF validation for
    anonymous requests, which is unsuitable for a session login endpoint.
    """

    def authenticate(self, request: Request):
        self.enforce_csrf(request)

        user = getattr(request._request, "user", None)

        if not user or not user.is_active:
            return None

        return user, None
