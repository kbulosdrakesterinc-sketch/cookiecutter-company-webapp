from typing import cast
from uuid import UUID

from django.db import IntegrityError, transaction

from apps.accounts.managers import UserManager
from apps.accounts.models import User


class UserEmailAlreadyExistsError(ValueError):
    pass


def update_user(
    *,
    user_id: UUID,
    email: str | None = None,
    first_name: str | None = None,
    last_name: str | None = None,
    is_active: bool | None = None,
) -> User:
    """Update the supported account-management fields for one user."""

    user_manager = cast(
        UserManager[User],
        cast(object, User.objects),
    )

    normalized_email = (
        user_manager.normalize_email(email.strip()) if email is not None else None
    )

    try:
        with transaction.atomic():
            user = user_manager.select_for_update().get(pk=user_id)
            update_fields: list[str] = []

            if normalized_email is not None:
                user.email = normalized_email
                update_fields.append("email")

            if first_name is not None:
                user.first_name = first_name.strip()
                update_fields.append("first_name")

            if last_name is not None:
                user.last_name = last_name.strip()
                update_fields.append("last_name")

            if is_active is not None:
                user.is_active = is_active
                update_fields.append("is_active")

            if update_fields:
                user.save(update_fields=update_fields)

            return user
    except IntegrityError as error:
        if (
            normalized_email is not None
            and user_manager.exclude(pk=user_id)
            .filter(email=normalized_email)
            .exists()
        ):
            raise UserEmailAlreadyExistsError(
                "A user with this email already exists.",
            ) from error

        raise
