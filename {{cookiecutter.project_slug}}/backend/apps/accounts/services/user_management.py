from typing import cast
from uuid import UUID

from django.db import IntegrityError, transaction

from apps.accounts.managers import UserManager
from apps.accounts.models import User
from apps.audit.services import AuditAction, AuditTarget, record_audit_event


class UserEmailAlreadyExistsError(ValueError):
    pass


def update_user(
    *,
    actor: User,
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
            profile_changes: dict[str, object] = {}
            active_change: dict[str, object] | None = None

            if normalized_email is not None and normalized_email != user.email:
                profile_changes["email"] = {
                    "from": user.email,
                    "to": normalized_email,
                }
                user.email = normalized_email
                update_fields.append("email")

            normalized_first_name = (
                first_name.strip() if first_name is not None else None
            )
            if (
                normalized_first_name is not None
                and normalized_first_name != user.first_name
            ):
                profile_changes["first_name"] = {
                    "from": user.first_name,
                    "to": normalized_first_name,
                }
                user.first_name = normalized_first_name
                update_fields.append("first_name")

            normalized_last_name = (
                last_name.strip() if last_name is not None else None
            )
            if (
                normalized_last_name is not None
                and normalized_last_name != user.last_name
            ):
                profile_changes["last_name"] = {
                    "from": user.last_name,
                    "to": normalized_last_name,
                }
                user.last_name = normalized_last_name
                update_fields.append("last_name")

            if is_active is not None and is_active != user.is_active:
                active_change = {
                    "from": user.is_active,
                    "to": is_active,
                }
                user.is_active = is_active
                update_fields.append("is_active")

            if update_fields:
                user.save(update_fields=update_fields)

            if profile_changes:
                _ = record_audit_event(
                    actor=actor,
                    action=AuditAction.USER_UPDATED,
                    target_type=AuditTarget.USER,
                    target_id=str(user.pk),
                    target_display=user.email,
                    changes={"fields": profile_changes},
                )

            if active_change is not None:
                _ = record_audit_event(
                    actor=actor,
                    action=(
                        AuditAction.USER_ACTIVATED
                        if user.is_active
                        else AuditAction.USER_DEACTIVATED
                    ),
                    target_type=AuditTarget.USER,
                    target_id=str(user.pk),
                    target_display=user.email,
                    changes={
                        "fields": {
                            "is_active": active_change,
                        }
                    },
                )

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
