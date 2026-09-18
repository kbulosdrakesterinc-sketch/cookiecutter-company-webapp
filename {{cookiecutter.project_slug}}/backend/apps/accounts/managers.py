from typing import Any, TypeVar

from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import UserManager as DjangoUserManager

UserType = TypeVar(
    "UserType",
    bound=AbstractUser,
)


class UserManager(DjangoUserManager[UserType]):
    use_in_migrations = True

    def _create_user(
        self,
        username: str | None,
        email: str | None,
        password: str | None,
        **extra_fields: Any,
    ) -> UserType:
        del username

        if not email:
            raise ValueError("Users must have an email address.")

        normalized_email = self.normalize_email(
            email,
        )

        user = self.model(
            email=normalized_email,
            **extra_fields,
        )

        if password is None:
            user.set_unusable_password()
        else:
            user.set_password(
                password,
            )

        user.save(
            using=self._db,
        )

        return user

    def create_user(
        self,
        username: str | None = None,
        email: str | None = None,
        password: str | None = None,
        **extra_fields: Any,
    ) -> UserType:
        extra_fields.setdefault(
            "is_staff",
            False,
        )
        extra_fields.setdefault(
            "is_superuser",
            False,
        )

        return self._create_user(
            username=username,
            email=email,
            password=password,
            **extra_fields,
        )

    def create_superuser(
        self,
        username: str | None = None,
        email: str | None = None,
        password: str | None = None,
        **extra_fields: Any,
    ) -> UserType:
        extra_fields.setdefault(
            "is_staff",
            True,
        )
        extra_fields.setdefault(
            "is_superuser",
            True,
        )

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superusers must have is_staff=True.")

        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superusers must have is_superuser=True.")

        return self._create_user(
            username=username,
            email=email,
            password=password,
            **extra_fields,
        )
