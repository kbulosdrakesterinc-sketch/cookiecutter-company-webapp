from collections.abc import Mapping
from typing import cast

from django.contrib.auth.models import Group, Permission
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


class RoleDirectorySerializer(serializers.ModelSerializer[Group]):
    user_count = serializers.IntegerField(
        read_only=True,
    )
    permission_count = serializers.IntegerField(
        read_only=True,
    )

    class Meta:  # pyright: ignore[reportIncompatibleVariableOverride]
        model = Group
        fields = (
            "id",
            "name",
            "user_count",
            "permission_count",
        )
        read_only_fields = fields


class RoleDetailUserSerializer(serializers.ModelSerializer[User]):
    class Meta:  # pyright: ignore[reportIncompatibleVariableOverride]
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "is_active",
        )
        read_only_fields = fields


class RolePermissionSerializer(serializers.ModelSerializer[Permission]):
    app_label = serializers.CharField(
        source="content_type.app_label",
        read_only=True,
    )
    model = serializers.CharField(
        source="content_type.model",
        read_only=True,
    )
    permission = serializers.SerializerMethodField()

    class Meta:  # pyright: ignore[reportIncompatibleVariableOverride]
        model = Permission
        fields = (
            "id",
            "name",
            "codename",
            "app_label",
            "model",
            "permission",
        )
        read_only_fields = fields

    def get_permission(self, permission: Permission) -> str:
        return f"{permission.content_type.app_label}.{permission.codename}"


class RoleDetailSerializer(serializers.ModelSerializer[Group]):
    users = RoleDetailUserSerializer(
        source="direct_users",
        many=True,
        read_only=True,
    )
    permissions = RolePermissionSerializer(
        source="direct_permissions",
        many=True,
        read_only=True,
    )

    class Meta:  # pyright: ignore[reportIncompatibleVariableOverride]
        model = Group
        fields = (
            "id",
            "name",
            "users",
            "permissions",
        )
        read_only_fields = fields


class RoleManagementSerializer(
    serializers.Serializer[dict[str, object]],
):
    writable_fields = frozenset({"name", "permission_ids"})

    name = serializers.CharField(
        max_length=150,
        required=False,
        trim_whitespace=True,
    )
    permission_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        required=False,
    )

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

        return attrs


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


class UserManagementSerializer(
    serializers.Serializer[User],
):
    writable_fields = frozenset(
        {
            "email",
            "first_name",
            "last_name",
            "is_active",
        }
    )

    email = serializers.EmailField(
        max_length=254,
        required=False,
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
    is_active = serializers.BooleanField(
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

        instance = cast(
            User | None,
            self.instance,
        )
        queryset = user_manager.all()

        if instance is not None:
            queryset = queryset.exclude(pk=instance.pk)

        if queryset.filter(email=normalized_email).exists():
            raise serializers.ValidationError(
                "A user with this email already exists.",
            )

        return normalized_email

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

        return attrs


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
