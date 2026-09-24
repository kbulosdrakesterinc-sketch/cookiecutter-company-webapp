from collections.abc import Mapping
import re
from typing import cast

from rest_framework import serializers

from apps.reference_data.models import ReferenceDataSet, ReferenceDataValue

REFERENCE_CODE_PATTERN = re.compile(r"^[A-Za-z][A-Za-z0-9_]*$")


class ReferenceDataSetSerializer(serializers.ModelSerializer[ReferenceDataSet]):
    value_count = serializers.IntegerField(
        read_only=True,
    )

    class Meta:  # pyright: ignore[reportIncompatibleVariableOverride]
        model = ReferenceDataSet
        fields = (
            "id",
            "code",
            "name",
            "description",
            "is_active",
            "value_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class ReferenceDataValueSerializer(
    serializers.ModelSerializer[ReferenceDataValue],
):
    class Meta:  # pyright: ignore[reportIncompatibleVariableOverride]
        model = ReferenceDataValue
        fields = (
            "id",
            "code",
            "name",
            "description",
            "sort_order",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class ReferenceDataSetManagementSerializer(
    serializers.Serializer[dict[str, object]],
):
    writable_fields = frozenset(
        {
            "code",
            "name",
            "description",
            "is_active",
        }
    )

    code = serializers.RegexField(
        regex=REFERENCE_CODE_PATTERN,
        max_length=64,
        required=False,
        trim_whitespace=True,
        error_messages={
            "invalid": (
                "Use letters, numbers, and underscores only, starting with a letter."
            ),
        },
    )
    name = serializers.CharField(
        max_length=150,
        required=False,
        trim_whitespace=True,
    )
    description = serializers.CharField(
        allow_blank=True,
        required=False,
        trim_whitespace=True,
    )
    is_active = serializers.BooleanField(
        required=False,
    )

    def validate_code(self, value: str) -> str:
        return value.strip().upper()

    def validate(
        self,
        attrs: dict[str, object],
    ) -> dict[str, object]:
        initial_data = self.initial_data

        if isinstance(initial_data, Mapping):
            unsupported_fields = sorted(
                str(field)
                for field in initial_data.keys()
                if field not in self.writable_fields
            )

            if unsupported_fields:
                raise serializers.ValidationError(
                    {
                        field: ["This field cannot be modified."]
                        for field in unsupported_fields
                    }
                )

            if self.partial and "code" in initial_data:
                raise serializers.ValidationError(
                    {
                        "code": [
                            "Reference-data set codes are immutable after creation."
                        ]
                    }
                )

        return attrs


class ReferenceDataValueManagementSerializer(
    serializers.Serializer[dict[str, object]],
):
    writable_fields = frozenset(
        {
            "code",
            "name",
            "description",
            "sort_order",
            "is_active",
        }
    )

    code = serializers.RegexField(
        regex=REFERENCE_CODE_PATTERN,
        max_length=64,
        required=False,
        trim_whitespace=True,
        error_messages={
            "invalid": (
                "Use letters, numbers, and underscores only, starting with a letter."
            ),
        },
    )
    name = serializers.CharField(
        max_length=150,
        required=False,
        trim_whitespace=True,
    )
    description = serializers.CharField(
        allow_blank=True,
        required=False,
        trim_whitespace=True,
    )
    sort_order = serializers.IntegerField(
        min_value=0,
        required=False,
    )
    is_active = serializers.BooleanField(
        required=False,
    )

    def validate_code(self, value: str) -> str:
        return value.strip().upper()

    def validate(
        self,
        attrs: dict[str, object],
    ) -> dict[str, object]:
        initial_data = self.initial_data

        if isinstance(initial_data, Mapping):
            unsupported_fields = sorted(
                str(field)
                for field in initial_data.keys()
                if field not in self.writable_fields
            )

            if unsupported_fields:
                raise serializers.ValidationError(
                    {
                        field: ["This field cannot be modified."]
                        for field in unsupported_fields
                    }
                )

            if self.partial and "code" in initial_data:
                raise serializers.ValidationError(
                    {
                        "code": [
                            "Reference-data value codes are immutable after creation."
                        ]
                    }
                )

        sort_order = cast(
            int | None,
            attrs.get("sort_order"),
        )
        if sort_order is not None and sort_order < 0:
            raise serializers.ValidationError(
                {"sort_order": ["Ensure this value is greater than or equal to 0."]}
            )

        return attrs
