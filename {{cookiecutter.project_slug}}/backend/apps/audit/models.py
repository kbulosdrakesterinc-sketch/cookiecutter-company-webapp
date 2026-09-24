import uuid

from django.conf import settings
from django.db import models


class AuditEvent(models.Model):
    """Immutable-by-application-convention record of a meaningful mutation."""

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    occurred_at = models.DateTimeField(
        auto_now_add=True,
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    actor_identifier = models.CharField(
        max_length=254,
        blank=True,
    )
    action = models.CharField(
        max_length=128,
    )
    target_type = models.CharField(
        max_length=100,
    )
    target_id = models.CharField(
        max_length=255,
    )
    target_display = models.CharField(
        max_length=255,
        blank=True,
    )
    changes = models.JSONField(
        default=dict,
    )
    context = models.JSONField(
        default=dict,
    )

    class Meta:
        ordering = (
            "-occurred_at",
            "-id",
        )
        indexes = [
            models.Index(
                fields=("action", "-occurred_at"),
                name="audit_action_time_idx",
            ),
            models.Index(
                fields=("target_type", "target_id", "-occurred_at"),
                name="audit_target_time_idx",
            ),
        ]
