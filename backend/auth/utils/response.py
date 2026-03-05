# local
from core.config import settings
from auth.utils.jwt import create_access_token, create_refresh_token
from auth.models import User
from auth.schemas import SigninResponse


def create_signin_response(user: User) -> SigninResponse:
    return SigninResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        expires_in=settings.ACCESS_TOKEN_LIFETIME,
        user=user,
    )
