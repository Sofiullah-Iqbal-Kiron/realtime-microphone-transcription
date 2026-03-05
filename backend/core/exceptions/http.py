# fastapi
from fastapi import HTTPException, status


class BadRequestException(HTTPException):
    """Exception raised for bad requests (HTTP 400)."""

    def __init__(self, detail: str = "Bad request."):
        self.detail = detail
        self.status_code = status.HTTP_400_BAD_REQUEST

        super().__init__(detail=self.detail, status_code=self.status_code)


class UnauthorizedException(HTTPException):
    """Exception raised for unauthorized access (HTTP 401)."""

    def __init__(self, detail: str = "Invalid credentials or expired token!"):
        self.detail = detail
        self.status_code = status.HTTP_401_UNAUTHORIZED
        self.headers = {"WWW-Authenticate": "Bearer"}

        super().__init__(detail=self.detail, status_code=self.status_code, headers=self.headers)


class ForbiddenException(HTTPException):
    """Exception raised for forbidden access (HTTP 403)."""

    def __init__(self, detail: str = "You do not have permission to access this resource."):
        self.detail = detail
        self.status_code = status.HTTP_403_FORBIDDEN

        super().__init__(detail=self.detail, status_code=self.status_code)


class NotFoundException(HTTPException):
    """Exception raised when a resource is not found (HTTP 404)."""

    def __init__(self, detail: str = "The requested resource was not found."):
        self.detail = detail
        self.status_code = status.HTTP_404_NOT_FOUND

        super().__init__(detail=self.detail, status_code=self.status_code)


class ConflictException(HTTPException):
    """Exception raised when a request conflicts with current state (HTTP 409)."""

    def __init__(self, detail: str = "A conflict occurred with the current state of the resource."):
        self.detail = detail
        self.status_code = status.HTTP_409_CONFLICT

        super().__init__(detail=self.detail, status_code=self.status_code)


class ResourceGoneException(HTTPException):
    """Exception raised when a resource is no longer available (HTTP 410)."""

    def __init__(self, detail: str = "The requested resource is no longer available."):
        self.detail = detail
        self.status_code = status.HTTP_410_GONE

        super().__init__(detail=self.detail, status_code=self.status_code)
