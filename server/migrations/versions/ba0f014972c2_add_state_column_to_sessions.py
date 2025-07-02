"""add_state_column_to_sessions

Revision ID: ba0f014972c2
Revises: add_is_archived_column
Create Date: 2025-03-12 11:46:53.545227

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.engine.reflection import Inspector

# revision identifiers, used by Alembic.
revision: str = 'ba0f014972c2'
down_revision: Union[str, None] = 'add_is_archived_column'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check if the state column already exists
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    columns = [column['name'] for column in inspector.get_columns('sessions')]

    # Only add the column if it doesn't already exist
    if 'state' not in columns:
        op.add_column(
            'sessions',
            sa.Column(
                'state', sa.String(), nullable=False, server_default='initializing'
            ),
        )
        print("Added 'state' column to sessions table")
    else:
        print("Column 'state' already exists in sessions table, skipping")


def downgrade() -> None:
    # Check if the state column exists before trying to drop it
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    columns = [column['name'] for column in inspector.get_columns('sessions')]

    # Only drop the column if it exists
    if 'state' in columns:
        op.drop_column('sessions', 'state')
        print("Dropped 'state' column from sessions table")
    else:
        print("Column 'state' does not exist in sessions table, skipping")
