from uuid import UUID

from django.db import IntegrityError, transaction

from apps.accounts.models import User
from apps.audit.services import AuditAction, AuditTarget, record_audit_event

from .models import ReferenceDataSet, ReferenceDataValue


class ReferenceDataSetCodeAlreadyExistsError(ValueError):
    pass


class ReferenceDataValueCodeAlreadyExistsError(ValueError):
    pass


def _normalize_code(value: str) -> str:
    return value.strip().upper()


def _set_display(reference_set: ReferenceDataSet) -> str:
    return f"{reference_set.code} — {reference_set.name}"


def _value_display(value: ReferenceDataValue) -> str:
    return f"{value.reference_set.code}/{value.code} — {value.name}"


def create_reference_data_set(
    *,
    actor: User,
    code: str,
    name: str,
    description: str = "",
    is_active: bool = True,
) -> ReferenceDataSet:
    normalized_code = _normalize_code(code)

    try:
        with transaction.atomic():
            reference_set = ReferenceDataSet.objects.create(
                code=normalized_code,
                name=name.strip(),
                description=description.strip(),
                is_active=is_active,
            )
            _ = record_audit_event(
                actor=actor,
                action=AuditAction.REFERENCE_DATA_SET_CREATED,
                target_type=AuditTarget.REFERENCE_DATA_SET,
                target_id=str(reference_set.pk),
                target_display=_set_display(reference_set),
                changes={
                    "fields": {
                        "code": {"to": reference_set.code},
                        "name": {"to": reference_set.name},
                        "description": {"to": reference_set.description},
                        "is_active": {"to": reference_set.is_active},
                    }
                },
            )
            return reference_set
    except IntegrityError as error:
        if ReferenceDataSet.objects.filter(code=normalized_code).exists():
            raise ReferenceDataSetCodeAlreadyExistsError(
                "A reference-data set with this code already exists.",
            ) from error

        raise


def update_reference_data_set(
    *,
    actor: User,
    reference_set_id: UUID,
    name: str | None = None,
    description: str | None = None,
    is_active: bool | None = None,
) -> ReferenceDataSet:
    with transaction.atomic():
        reference_set = ReferenceDataSet.objects.select_for_update().get(
            pk=reference_set_id,
        )
        update_fields: list[str] = []
        field_changes: dict[str, object] = {}
        active_change: dict[str, object] | None = None

        normalized_name = name.strip() if name is not None else None
        if normalized_name is not None and normalized_name != reference_set.name:
            field_changes["name"] = {
                "from": reference_set.name,
                "to": normalized_name,
            }
            reference_set.name = normalized_name
            update_fields.append("name")

        normalized_description = (
            description.strip() if description is not None else None
        )
        if (
            normalized_description is not None
            and normalized_description != reference_set.description
        ):
            field_changes["description"] = {
                "from": reference_set.description,
                "to": normalized_description,
            }
            reference_set.description = normalized_description
            update_fields.append("description")

        if is_active is not None and is_active != reference_set.is_active:
            active_change = {
                "from": reference_set.is_active,
                "to": is_active,
            }
            reference_set.is_active = is_active
            update_fields.append("is_active")

        if update_fields:
            reference_set.save(
                update_fields=[*update_fields, "updated_at"],
            )

        if field_changes:
            _ = record_audit_event(
                actor=actor,
                action=AuditAction.REFERENCE_DATA_SET_UPDATED,
                target_type=AuditTarget.REFERENCE_DATA_SET,
                target_id=str(reference_set.pk),
                target_display=_set_display(reference_set),
                changes={"fields": field_changes},
            )

        if active_change is not None:
            _ = record_audit_event(
                actor=actor,
                action=(
                    AuditAction.REFERENCE_DATA_SET_ACTIVATED
                    if reference_set.is_active
                    else AuditAction.REFERENCE_DATA_SET_DEACTIVATED
                ),
                target_type=AuditTarget.REFERENCE_DATA_SET,
                target_id=str(reference_set.pk),
                target_display=_set_display(reference_set),
                changes={
                    "fields": {
                        "is_active": active_change,
                    }
                },
            )

        return reference_set


def create_reference_data_value(
    *,
    actor: User,
    reference_set_id: UUID,
    code: str,
    name: str,
    description: str = "",
    sort_order: int = 0,
    is_active: bool = True,
) -> ReferenceDataValue:
    normalized_code = _normalize_code(code)

    try:
        with transaction.atomic():
            reference_set = ReferenceDataSet.objects.select_for_update().get(
                pk=reference_set_id,
            )
            value = ReferenceDataValue.objects.create(
                reference_set=reference_set,
                code=normalized_code,
                name=name.strip(),
                description=description.strip(),
                sort_order=sort_order,
                is_active=is_active,
            )
            _ = record_audit_event(
                actor=actor,
                action=AuditAction.REFERENCE_DATA_VALUE_CREATED,
                target_type=AuditTarget.REFERENCE_DATA_VALUE,
                target_id=str(value.pk),
                target_display=_value_display(value),
                changes={
                    "fields": {
                        "reference_set_id": {"to": str(reference_set.pk)},
                        "code": {"to": value.code},
                        "name": {"to": value.name},
                        "description": {"to": value.description},
                        "sort_order": {"to": value.sort_order},
                        "is_active": {"to": value.is_active},
                    }
                },
            )
            return value
    except IntegrityError as error:
        if ReferenceDataValue.objects.filter(
            reference_set_id=reference_set_id,
            code=normalized_code,
        ).exists():
            raise ReferenceDataValueCodeAlreadyExistsError(
                "A value with this code already exists in this reference-data set.",
            ) from error

        raise


def update_reference_data_value(
    *,
    actor: User,
    reference_set_id: UUID,
    value_id: UUID,
    name: str | None = None,
    description: str | None = None,
    sort_order: int | None = None,
    is_active: bool | None = None,
) -> ReferenceDataValue:
    with transaction.atomic():
        value = (
            ReferenceDataValue.objects.select_for_update()
            .select_related("reference_set")
            .get(
                pk=value_id,
                reference_set_id=reference_set_id,
            )
        )
        update_fields: list[str] = []
        field_changes: dict[str, object] = {}
        active_change: dict[str, object] | None = None

        normalized_name = name.strip() if name is not None else None
        if normalized_name is not None and normalized_name != value.name:
            field_changes["name"] = {
                "from": value.name,
                "to": normalized_name,
            }
            value.name = normalized_name
            update_fields.append("name")

        normalized_description = (
            description.strip() if description is not None else None
        )
        if (
            normalized_description is not None
            and normalized_description != value.description
        ):
            field_changes["description"] = {
                "from": value.description,
                "to": normalized_description,
            }
            value.description = normalized_description
            update_fields.append("description")

        if sort_order is not None and sort_order != value.sort_order:
            field_changes["sort_order"] = {
                "from": value.sort_order,
                "to": sort_order,
            }
            value.sort_order = sort_order
            update_fields.append("sort_order")

        if is_active is not None and is_active != value.is_active:
            active_change = {
                "from": value.is_active,
                "to": is_active,
            }
            value.is_active = is_active
            update_fields.append("is_active")

        if update_fields:
            value.save(
                update_fields=[*update_fields, "updated_at"],
            )

        if field_changes:
            _ = record_audit_event(
                actor=actor,
                action=AuditAction.REFERENCE_DATA_VALUE_UPDATED,
                target_type=AuditTarget.REFERENCE_DATA_VALUE,
                target_id=str(value.pk),
                target_display=_value_display(value),
                changes={"fields": field_changes},
            )

        if active_change is not None:
            _ = record_audit_event(
                actor=actor,
                action=(
                    AuditAction.REFERENCE_DATA_VALUE_ACTIVATED
                    if value.is_active
                    else AuditAction.REFERENCE_DATA_VALUE_DEACTIVATED
                ),
                target_type=AuditTarget.REFERENCE_DATA_VALUE,
                target_id=str(value.pk),
                target_display=_value_display(value),
                changes={
                    "fields": {
                        "is_active": active_change,
                    }
                },
            )

        return value
