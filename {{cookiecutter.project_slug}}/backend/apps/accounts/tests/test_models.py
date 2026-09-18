from typing import cast
from uuid import UUID

from django.test import TestCase

from apps.accounts.managers import UserManager
from apps.accounts.models import User


class UserModelTests(TestCase):
    def get_user_manager(self) -> UserManager[User]:
        return cast(
            UserManager[User],
            cast(
                object,
                User.objects,
            ),
        )

    def test_user_uses_uuid_primary_key(self):
        user_manager = self.get_user_manager()

        user = user_manager.create_user(
            email="user@example.com",
            password="strong-test-password",
        )

        self.assertIsInstance(user.id, UUID)

    def test_string_representation_returns_email(self):
        user_manager = self.get_user_manager()

        user = user_manager.create_user(
            email="user@example.com",
            password="strong-test-password",
        )

        self.assertEqual(str(user), "user@example.com")

    def test_full_name_returns_first_and_last_name(self):
        user_manager = self.get_user_manager()

        user = user_manager.create_user(
            email="user@example.com",
            password="strong-test-password",
            first_name="Test",
            last_name="User",
        )

        self.assertEqual(user.full_name, "Test User")

    def test_full_name_strips_surrounding_whitespace(self):
        user_manager = self.get_user_manager()

        user = user_manager.create_user(
            email="user@example.com",
            password="strong-test-password",
            first_name="Test",
        )

        self.assertEqual(user.full_name, "Test")
