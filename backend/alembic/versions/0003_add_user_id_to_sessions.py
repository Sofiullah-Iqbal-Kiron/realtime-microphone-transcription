"""add user_id to transcription_sessions

Revision ID: 0003
Revises: 0002
Create Date: 2025-01-03 00:00:00.000000

"""
# python
from typing import Sequence, Union

# alembic / sqlalchemy
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "transcription_sessions",
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            comment="Owner of this transcription session.",
        ),
    )
    op.create_index(
        "ix_transcription_sessions_user_id",
        "transcription_sessions",
        ["user_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_transcription_sessions_user_id", table_name="transcription_sessions")
    op.drop_column("transcription_sessions", "user_id")
