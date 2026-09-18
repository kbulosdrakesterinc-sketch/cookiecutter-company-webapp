from apps.accounts.services import CurrentUserProfile
from rest_framework import serializers


class LoginSerializer(serializers.Serializer[dict[str, object]]):
    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )


class CurrentUserSerializer(
    serializers.Serializer[CurrentUserProfile],
):
    id = serializers.UUIDField(
        read_only=True,
    )

    email = serializers.EmailField(
        read_only=True,
    )

    first_name = serializers.CharField(
        read_only=True,
    )

    last_name = serializers.CharField(
        read_only=True,
    )

    is_staff = serializers.BooleanField(
        read_only=True,
    )

    is_superuser = serializers.BooleanField(
        read_only=True,
    )

    roles = serializers.ListField(
        child=serializers.CharField(),
        read_only=True,
    )

    permissions = serializers.ListField(
        child=serializers.CharField(),
        read_only=True,
    )


class AccountActivationSerializer(
    serializers.Serializer[dict[str, object]],
):
    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        min_length=1,
    )

    password_confirmation = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        min_length=1,
    )

    def validate(
        self,
        attrs: dict[str, object],
    ) -> dict[str, object]:
        password = attrs.get("password")
        password_confirmation = attrs.get(
            "password_confirmation",
        )

        if password != password_confirmation:
            raise serializers.ValidationError(
                {
                    "password_confirmation": [
                        "The passwords do not match.",
                    ]
                }
            )

        return attrs
