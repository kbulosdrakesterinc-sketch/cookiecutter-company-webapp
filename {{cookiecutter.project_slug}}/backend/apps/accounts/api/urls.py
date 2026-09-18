from django.urls import path

from apps.accounts.api.views import (
    account_activation_view,
    csrf_view,
    current_user_view,
    login_view,
    logout_view,
)

app_name = "accounts_api"

urlpatterns = [
    path(
        "csrf/",
        csrf_view,
        name="csrf",
    ),
    path(
        "login/",
        login_view,
        name="login",
    ),
    path(
        "logout/",
        logout_view,
        name="logout",
    ),
    path(
        "me/",
        current_user_view,
        name="current-user",
    ),
    path(
        "activate/<str:uid>/<str:token>/",
        account_activation_view,
        name="activate-account",
    ),
]
