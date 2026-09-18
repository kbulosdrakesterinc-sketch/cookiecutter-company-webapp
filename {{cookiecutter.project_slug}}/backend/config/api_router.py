from django.urls import include, path

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
]
