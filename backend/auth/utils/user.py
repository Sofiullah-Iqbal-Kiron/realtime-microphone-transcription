# python
from datetime import datetime, timezone

# sqlalchemy
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# local
from auth.models import User
from auth.utils.password import hash_password


async def get_user_by_id(db: AsyncSession, user_id: int) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email.lower()))
    return result.scalar_one_or_none()


async def create_user(
    db: AsyncSession,
    email: str,
    password: str,
    first_name: str | None = None,
    last_name: str | None = None,
) -> User:
    user = User(
        email=email.lower().strip(),
        hashed_password=hash_password(password),
        first_name=first_name,
        last_name=last_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return user


async def activate_user(db: AsyncSession, user: User) -> User:
    """Mark a user's email as verified and activate the account."""

    user.is_email_verified = True
    user.is_active = True
    await db.commit()
    await db.refresh(user)

    return user


async def update_password(db: AsyncSession, user: User, new_password: str) -> User:
    user.hashed_password = hash_password(new_password)
    await db.commit()
    await db.refresh(user)

    return user


async def update_last_login(db: AsyncSession, user: User) -> None:
    user.last_login = datetime.now(timezone.utc)
    await db.commit()
