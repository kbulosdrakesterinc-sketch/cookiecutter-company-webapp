from typing import cast

from django.db import IntegrityError, transaction

from apps.accounts.managers import UserManager
from apps.accounts.models import User
from apps.audit.services import AuditAction, AuditTarget, record_audit_event


class UserAlreadyExistsError(ValueError):
    pass


def provision_user(
    *,
    actor: User,
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
            user = user_manager.create_user(
                email=normalized_email,
                password=None,
                first_name=first_name.strip(),
                last_name=last_name.strip(),
                is_active=True,
                is_staff=False,
                is_superuser=False,
            )
            _ = record_audit_event(
                actor=actor,
                action=AuditAction.USER_PROVISIONED,
                target_type=AuditTarget.USER,
                target_id=str(user.pk),
                target_display=user.email,
                changes={
                    "fields": {
                        "email": {"to": user.email},
                        "first_name": {"to": user.first_name},
                        "last_name": {"to": user.last_name},
                        "is_active": {"to": user.is_active},
                    }
                },
            )
            return user
    except IntegrityError as error:
        if user_manager.filter(
            email=normalized_email,
        ).exists():
            raise UserAlreadyExistsError(
                "A user with this email already exists.",
            ) from error

        raise
