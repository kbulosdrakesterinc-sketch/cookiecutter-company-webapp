from dataclasses import dataclass

from django.conf import settings
from django.contrib.auth import password_validation
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode

from apps.accounts.models import User


class AccountActivationError(ValueError):
    pass


class AccountActivationInvalidError(AccountActivationError):
    pass


class AccountAlreadyActivatedError(AccountActivationError):
    pass


@dataclass(frozen=True, slots=True)
class AccountActivationLink:
    uid: str
    token: str
    url: str


def build_account_activation_link(
    *,
    user: User,
) -> AccountActivationLink:
    if user.has_usable_password():
        raise AccountAlreadyActivatedError(
            "This account already has password credentials.",
        )

    uid = urlsafe_base64_encode(
        force_bytes(user.pk),
    )

    token = default_token_generator.make_token(
        user,
    )

    url = f"{settings.FRONTEND_PUBLIC_URL}" f"/activate-account/{uid}/{token}"

    return AccountActivationLink(
        uid=uid,
        token=token,
        url=url,
    )


def send_account_activation_email(
    *,
    user: User,
) -> None:
    activation = build_account_activation_link(
        user=user,
    )

    send_mail(
        subject=f"Activate your {settings.APP_NAME} account",
        message=(
            f"Hello {user.first_name or 'there'},\n\n"
            f"Your {settings.APP_NAME} account has been created.\n\n"
            "Set your password using the link below:\n\n"
            f"{activation.url}\n\n"
            "This link is time-limited and becomes invalid after "
            "your password has been established."
        ),
        from_email=None,
        recipient_list=[
            user.email,
        ],
        fail_silently=False,
    )


def get_user_from_activation_credentials(
    *,
    uid: str,
    token: str,
) -> User:
    try:
        user_id = force_str(
            urlsafe_base64_decode(uid),
        )
    except (ValueError, TypeError, UnicodeDecodeError) as error:
        raise AccountActivationInvalidError(
            "The account activation link is invalid or has expired.",
        ) from error

    user = User._default_manager.filter(
        pk=user_id,
    ).first()

    if user is None:
        raise AccountAlreadyActivatedError(
            "This account has already been activated.",
        )

    if not default_token_generator.check_token(
        user,
        token,
    ):
        raise AccountActivationInvalidError(
            "The account activation link is invalid or has expired.",
        )

    return user


def activate_account(
    *,
    uid: str,
    token: str,
    password: str,
) -> User:
    user = get_user_from_activation_credentials(
        uid=uid,
        token=token,
    )

    password_validation.validate_password(
        password,
        user=user,
    )

    user.set_password(
        password,
    )

    user.save(
        update_fields=[
            "password",
        ]
    )

    return user
