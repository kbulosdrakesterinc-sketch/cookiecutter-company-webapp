from unittest.mock import patch

from django.db.utils import OperationalError
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class HealthAPITests(APITestCase):
    def test_health_endpoint_returns_healthy_status(self) -> None:
        response = self.client.get(
            reverse("v1:core_api:health"),
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.json(),
            {
                "status": "healthy",
                "service": "{{ cookiecutter.project_slug }}-backend",
            },
        )

    def test_health_endpoint_does_not_require_authentication(self) -> None:
        response = self.client.get(
            reverse("v1:core_api:health"),
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )


class ReadinessAPITests(APITestCase):
    def test_readiness_endpoint_returns_ready_when_database_is_available(
        self,
    ) -> None:
        response = self.client.get(
            reverse("v1:core_api:readiness"),
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.json(),
            {
                "status": "ready",
                "service": "{{ cookiecutter.project_slug }}-backend",
                "database": "available",
            },
        )

    @patch(
        "apps.core.api.views.connection.cursor",
        side_effect=OperationalError,
    )
    def test_readiness_endpoint_returns_503_when_database_is_unavailable(
        self,
        mocked_cursor,
    ) -> None:
        response = self.client.get(
            reverse("v1:core_api:readiness"),
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_503_SERVICE_UNAVAILABLE,
        )

        self.assertEqual(
            response.json(),
            {
                "status": "not_ready",
                "service": "{{ cookiecutter.project_slug }}-backend",
                "database": "unavailable",
            },
        )
