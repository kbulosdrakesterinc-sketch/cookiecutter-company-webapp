from typing import cast

from rest_framework import serializers

from apps.accounts.managers import UserManager
from apps.accounts.models import User
from apps.accounts.services import CurrentUserProfile


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


class UserDirectorySerializer(serializers.ModelSerializer[User]):
    account_state = serializers.SerializerMethodField()

    class Meta:  # pyright: ignore[reportIncompatibleVariableOverride]
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "account_state",
            "date_joined",
        )
        read_only_fields = fields

    def get_account_state(self, user: User) -> str:
        if not user.is_active:
            return "inactive"

        if not user.has_usable_password():
            return "pending_activation"

        return "active"


class UserProvisionSerializer(
    serializers.Serializer[dict[str, object]],
):
    email = serializers.EmailField(
        max_length=254,
    )
    first_name = serializers.CharField(
        allow_blank=True,
        max_length=150,
        required=False,
    )
    last_name = serializers.CharField(
        allow_blank=True,
        max_length=150,
        required=False,
    )

    def validate_email(self, value: str) -> str:
        user_manager = cast(
            UserManager[User],
            cast(object, User.objects),
        )

        normalized_email = user_manager.normalize_email(
            value.strip(),
        )

        if user_manager.filter(
            email=normalized_email,
        ).exists():
            raise serializers.ValidationError(
                "A user with this email already exists.",
            )

        return normalized_email


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
