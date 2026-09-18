from django.urls import path

from apps.core.api.views import health, readiness

app_name = "core_api"

urlpatterns = [
    path(
        "health/",
        health,
        name="health",
    ),
    path(
        "readiness/",
        readiness,
        name="readiness",
    ),
]
