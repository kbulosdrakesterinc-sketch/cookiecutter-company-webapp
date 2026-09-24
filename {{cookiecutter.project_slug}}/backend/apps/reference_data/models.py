import uuid

from django.db import models


class ReferenceDataSet(models.Model):
    """A named, fixed-schema lookup collection."""

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    code = models.CharField(
        max_length=64,
        unique=True,
    )
    name = models.CharField(
        max_length=150,
    )
    description = models.TextField(
        blank=True,
    )
    is_active = models.BooleanField(
        default=True,
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
    )
    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = (
            "name",
            "code",
            "id",
        )

    def __str__(self) -> str:
        return f"{self.code} — {self.name}"


class ReferenceDataValue(models.Model):
    """One controlled value belonging to a reference-data set."""

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    reference_set = models.ForeignKey(
        ReferenceDataSet,
        on_delete=models.PROTECT,
        related_name="values",
    )
    code = models.CharField(
        max_length=64,
    )
    name = models.CharField(
        max_length=150,
    )
    description = models.TextField(
        blank=True,
    )
    sort_order = models.PositiveIntegerField(
        default=0,
    )
    is_active = models.BooleanField(
        default=True,
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
    )
    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = (
            "sort_order",
            "name",
            "code",
            "id",
        )
        constraints = [
            models.UniqueConstraint(
                fields=("reference_set", "code"),
                name="reference_value_set_code_uniq",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.reference_set.code}/{self.code} — {self.name}"
