import uuid

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="AuditEvent",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "occurred_at",
                    models.DateTimeField(auto_now_add=True),
                ),
                (
                    "actor_identifier",
                    models.CharField(blank=True, max_length=254),
                ),
                (
                    "action",
                    models.CharField(max_length=128),
                ),
                (
                    "target_type",
                    models.CharField(max_length=100),
                ),
                (
                    "target_id",
                    models.CharField(max_length=255),
                ),
                (
                    "target_display",
                    models.CharField(blank=True, max_length=255),
                ),
                (
                    "changes",
                    models.JSONField(default=dict),
                ),
                (
                    "context",
                    models.JSONField(default=dict),
                ),
                (
                    "actor",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ("-occurred_at", "-id"),
                "indexes": [
                    models.Index(
                        fields=["action", "-occurred_at"],
                        name="audit_action_time_idx",
                    ),
                    models.Index(
                        fields=["target_type", "target_id", "-occurred_at"],
                        name="audit_target_time_idx",
                    ),
                ],
            },
        ),
    ]
