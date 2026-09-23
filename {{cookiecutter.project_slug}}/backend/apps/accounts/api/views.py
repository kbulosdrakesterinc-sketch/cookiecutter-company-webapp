from typing import NotRequired, TypedDict, cast
from uuid import UUID

from django.contrib.auth import authenticate, login, logout
from django.core.exceptions import ValidationError
from django.http import Http404
from django.middleware.csrf import get_token
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework import status
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from apps.accounts.models import User
from apps.accounts.services import (
    UserAlreadyExistsError,
    UserEmailAlreadyExistsError,
    get_current_user_profile,
    get_user_directory_queryset,
    provision_user,
    update_user,
)
from apps.accounts.services.activation import (
    AccountActivationInvalidError,
    AccountAlreadyActivatedError,
    activate_account,
    get_user_from_activation_credentials,
)

from .authentication import CsrfEnforcedSessionAuthentication
from .pagination import UserDirectoryPagination
from .permissions import CanManageUser, UserDirectoryPermission
from .serializers import (
    AccountActivationSerializer,
    CurrentUserSerializer,
    LoginSerializer,
    UserDirectorySerializer,
    UserManagementSerializer,
    UserProvisionSerializer,
)


class LoginData(TypedDict):
    email: str
    password: str


class AccountActivationData(TypedDict):
    password: str
    password_confirmation: str


class UserProvisionData(TypedDict):
    email: str
    first_name: NotRequired[str]
    last_name: NotRequired[str]


class UserManagementData(TypedDict):
    email: NotRequired[str]
    first_name: NotRequired[str]
    last_name: NotRequired[str]
    is_active: NotRequired[bool]


@ensure_csrf_cookie
@api_view(["GET"])
@permission_classes([AllowAny])
def csrf_view(request: Request) -> Response:
    """
    Create or retrive the Django CSRF token.

    The BFF calls this endpoint sending login credentials.
    """

    return Response(
        {
            "csrfToken": get_token(request),
        }
    )


@csrf_protect
@api_view(["POST"])
@authentication_classes([CsrfEnforcedSessionAuthentication])
@permission_classes([AllowAny])
def login_view(request: Request) -> Response:
    """
    Authenticate the submitted credentials and create a Django session.
    """

    serializer = LoginSerializer(data=request.data)
    _ = serializer.is_valid(raise_exception=True)

    validated_data = cast(
        LoginData,
        serializer.validated_data,
    )

    user = authenticate(
        request=request,
        email=validated_data["email"],
        password=validated_data["password"],
    )

    if user is None:
        return Response(
            {
                "detail": "Invalid email or password.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not user.is_active:
        return Response(
            {
                "detail": "This account is inactive.",
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    login(request, user)

    authenticated_user = cast(
        User,
        cast(
            object,
            request.user,
        ),
    )

    current_user_profile = get_current_user_profile(
        user=authenticated_user,
    )

    return Response(
        {
            "user": CurrentUserSerializer(
                current_user_profile,
            ).data,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request: Request) -> Response:
    """
    Delete the current Django session.
    """

    logout(request)

    return Response(
        status=status.HTTP_204_NO_CONTENT,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user_view(request: Request) -> Response:
    """
    Return the current authenticated user.
    """

    current_user = cast(
        User,
        cast(
            object,
            request.user,
        ),
    )

    current_user_profile = get_current_user_profile(
        user=current_user,
    )

    return Response(
        {
            "user": CurrentUserSerializer(
                current_user_profile,
            ).data,
        }
    )


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated, UserDirectoryPermission])
def user_directory_view(request: Request) -> Response:
    """List users or provision a new account."""

    if request.method == "POST":
        serializer = UserProvisionSerializer(
            data=request.data,
        )
        _ = serializer.is_valid(
            raise_exception=True,
        )

        data = cast(
            UserProvisionData,
            serializer.validated_data,
        )

        try:
            user = provision_user(
                email=data["email"],
                first_name=data.get("first_name", ""),
                last_name=data.get("last_name", ""),
            )
        except UserAlreadyExistsError as error:
            return Response(
                {
                    "email": [
                        str(error),
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            UserDirectorySerializer(user).data,
            status=status.HTTP_201_CREATED,
        )

    search = request.query_params.get("search", "")

    queryset = get_user_directory_queryset(
        search=search,
    )

    paginator = UserDirectoryPagination()
    page = paginator.paginate_queryset(
        queryset,
        request,
    )

    serializer = UserDirectorySerializer(
        page,
        many=True,
    )

    return paginator.get_paginated_response(
        list(serializer.data),
    )


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated, CanManageUser])
def user_detail_view(
    request: Request,
    user_id: UUID,
) -> Response:
    """Return or update one existing user account."""

    user = get_object_or_404(
        User,
        pk=user_id,
    )

    if request.method == "GET":
        return Response(
            UserDirectorySerializer(user).data,
        )

    serializer = UserManagementSerializer(
        instance=user,
        data=request.data,
        partial=True,
    )
    _ = serializer.is_valid(
        raise_exception=True,
    )

    data = cast(
        UserManagementData,
        serializer.validated_data,
    )

    try:
        updated_user = update_user(
            user_id=user.id,
            email=data.get("email"),
            first_name=data.get("first_name"),
            last_name=data.get("last_name"),
            is_active=data.get("is_active"),
        )
    except User.DoesNotExist as error:
        raise Http404 from error
    except UserEmailAlreadyExistsError as error:
        return Response(
            {
                "email": [
                    str(error),
                ]
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(
        UserDirectorySerializer(updated_user).data,
        status=status.HTTP_200_OK,
    )


@csrf_protect
@api_view(["GET", "POST"])
@authentication_classes([CsrfEnforcedSessionAuthentication])
@permission_classes([AllowAny])
def account_activation_view(
    request: Request,
    uid: str,
    token: str,
) -> Response:
    if request.method == "GET":
        try:
            user = get_user_from_activation_credentials(
                uid=uid,
                token=token,
            )
        except AccountAlreadyActivatedError as error:
            return Response(
                {
                    "detail": str(error),
                },
                status=status.HTTP_409_CONFLICT,
            )
        except AccountActivationInvalidError as error:
            return Response(
                {
                    "detail": str(error),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "email": user.email,
            },
            status=status.HTTP_200_OK,
        )

    serializer = AccountActivationSerializer(
        data=request.data,
    )
    _ = serializer.is_valid(
        raise_exception=True,
    )

    data = cast(
        AccountActivationData,
        serializer.validated_data,
    )

    try:
        _ = activate_account(
            uid=uid,
            token=token,
            password=data["password"],
        )
    except AccountAlreadyActivatedError as error:
        return Response(
            {
                "detail": str(error),
            },
            status=status.HTTP_409_CONFLICT,
        )
    except AccountActivationInvalidError as error:
        return Response(
            {
                "detail": str(error),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except ValidationError as error:
        return Response(
            {
                "password": list(
                    error.messages,
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(
        {
            "detail": "Your account has been activated.",
        },
        status=status.HTTP_200_OK,
    )
