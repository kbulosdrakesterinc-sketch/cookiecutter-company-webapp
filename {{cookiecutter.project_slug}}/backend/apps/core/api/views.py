from django.db import connection
from django.db.utils import DatabaseError
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

SERVICE_NAME = "{{ cookiecutter.project_slug }}-backend"


@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    return Response(
        {
            "status": "healthy",
            "service": SERVICE_NAME,
        }
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def readiness(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
    except DatabaseError:
        return Response(
            {
                "status": "not_ready",
                "service": SERVICE_NAME,
                "database": "unavailable",
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    return Response(
        {
            "status": "ready",
            "service": SERVICE_NAME,
            "database": "available",
        }
    )
