"""add container fields to session

Revision ID: d5fbc9ed6349
Revises: fcfc272b8ede
Create Date: 2025-03-04 21:35:43.596799

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision: str = 'd5fbc9ed6349'
down_revision: Union[str, None] = 'fcfc272b8ede'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def column_exists(table: str, column: str) -> bool:
    """Check if a column exists in a table."""
    conn = op.get_bind()
    result = conn.execute(text(f'PRAGMA table_info({table})'))
    columns = [row[1] for row in result.fetchall()]
    return column in columns


def upgrade() -> None:
    # Add container_id column if it doesn't exist
    if not column_exists('sessions', 'container_id'):
        op.add_column('sessions', sa.Column('container_id', sa.String(), nullable=True))

    # Add mapped_port column if it doesn't exist
    if not column_exists('sessions', 'mapped_port'):
        op.add_column('sessions', sa.Column('mapped_port', sa.String(), nullable=True))


def downgrade() -> None:
    # SQLite doesn't support dropping columns directly
    # For a proper downgrade, we would need to:
    # 1. Create a new table without the columns
    # 2. Copy data from the old table to the new table
    # 3. Drop the old table
    # 4. Rename the new table to the old table name

    # For simplicity, we'll just mark this as a no-op
    pass
