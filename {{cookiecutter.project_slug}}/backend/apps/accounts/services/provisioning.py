from typing import cast

from django.db import IntegrityError, transaction

from apps.accounts.managers import UserManager
from apps.accounts.models import User


class UserAlreadyExistsError(ValueError):
    pass


def provision_user(
    *,
    email: str,
    first_name: str = "",
    last_name: str = "",
) -> User:
    """Create an active account that must complete the activation flow."""

    user_manager = cast(
        UserManager[User],
        cast(object, User.objects),
    )

    normalized_email = user_manager.normalize_email(
        email.strip(),
    )

    try:
        with transaction.atomic():
            return user_manager.create_user(
                email=normalized_email,
                password=None,
                first_name=first_name.strip(),
                last_name=last_name.strip(),
                is_active=True,
                is_staff=False,
                is_superuser=False,
            )
    except IntegrityError as error:
        if user_manager.filter(
            email=normalized_email,
        ).exists():
            raise UserAlreadyExistsError(
                "A user with this email already exists.",
            ) from error

        raise
