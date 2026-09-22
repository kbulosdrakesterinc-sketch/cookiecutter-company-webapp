from django.urls import include, path

from apps.accounts.api.views import user_directory_view

app_name = "v1"

urlpatterns = [
    path(
        "",
        include("apps.core.api.urls"),
    ),
    path(
        "auth/",
        include("apps.accounts.api.urls"),
    ),
    path(
        "users/",
        user_directory_view,
        name="user-directory",
    ),
]
