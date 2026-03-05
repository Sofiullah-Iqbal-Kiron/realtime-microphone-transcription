"""create users table

Revision ID: 0002
Revises: 0001
Create Date: 2025-01-02 00:00:00.000000

"""
# python
from typing import Sequence, Union

# alembic / sqlalchemy
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False, comment="Unique, auto-incrementing identifier for the user."),
        sa.Column("email", sa.String(255), nullable=False, comment="User's email address."),
        sa.Column("hashed_password", sa.String(255), nullable=False, comment="Hashed password of the user."),
        sa.Column("is_email_verified", sa.Boolean(), nullable=False, server_default="false", comment="True if user has verified email."),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="false", comment="False until email is verified."),
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default="false", comment="Admin privileges flag."),
        sa.Column("first_name", sa.String(128), nullable=True, comment="User's first name."),
        sa.Column("last_name", sa.String(128), nullable=True, comment="User's last name."),
        sa.Column("profile_picture", sa.String(500), nullable=True, comment="URL to user's profile picture."),
        sa.Column("created_by_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, comment="Admin who created this account."),
        sa.Column("last_login", sa.DateTime(timezone=True), nullable=True, comment="Last successful login timestamp."),
        sa.Column("date_joined", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now(), comment="Account creation timestamp."),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_created_by_id", "users", ["created_by_id"])


def downgrade() -> None:
    op.drop_index("ix_users_created_by_id", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_id", table_name="users")
    op.drop_table("users")
