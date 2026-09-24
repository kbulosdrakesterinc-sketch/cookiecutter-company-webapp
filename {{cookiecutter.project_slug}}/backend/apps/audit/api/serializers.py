from datetime import datetime
from typing import cast, override

from rest_framework import serializers

from apps.audit.models import AuditEvent


class AuditEventDirectorySerializer(serializers.ModelSerializer[AuditEvent]):
    class Meta:  # pyright: ignore[reportIncompatibleVariableOverride]
        model = AuditEvent
        fields = (
            "id",
            "occurred_at",
            "actor_identifier",
            "action",
            "target_type",
            "target_id",
            "target_display",
            "changes",
            "context",
        )
        read_only_fields = fields


class AuditEventFilterSerializer(
    serializers.Serializer[dict[str, object]],
):
    action = serializers.CharField(
        required=False,
        allow_blank=False,
        max_length=128,
        trim_whitespace=True,
    )
    target_type = serializers.CharField(
        required=False,
        allow_blank=False,
        max_length=100,
        trim_whitespace=True,
    )
    actor = serializers.CharField(
        required=False,
        allow_blank=False,
        max_length=254,
        trim_whitespace=True,
    )
    occurred_after = serializers.DateTimeField(required=False)
    occurred_before = serializers.DateTimeField(required=False)

    @override
    def validate(self, attrs: dict[str, object]) -> dict[str, object]:
        occurred_after = cast(
            datetime | None,
            attrs.get("occurred_after"),
        )
        occurred_before = cast(
            datetime | None,
            attrs.get("occurred_before"),
        )

        if (
            occurred_after is not None
            and occurred_before is not None
            and occurred_after > occurred_before
        ):
            raise serializers.ValidationError(
                {
                    "occurred_before": (
                        "Must be at or after occurred_after."
                    )
                }
            )

        return attrs
