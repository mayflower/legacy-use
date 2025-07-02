"""add is_archived column

Revision ID: add_is_archived_column
Revises: d5caf322be5f
Create Date: 2023-03-12 12:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = 'add_is_archived_column'
down_revision = 'd5caf322be5f'
branch_labels = None
depends_on = None


def upgrade():
    # Add is_archived column to targets table
    # Check if column exists before adding
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    targets_columns = [column['name'] for column in inspector.get_columns('targets')]
    sessions_columns = [column['name'] for column in inspector.get_columns('sessions')]

    # Add is_archived column to targets table if it doesn't exist
    if 'is_archived' not in targets_columns:
        op.add_column(
            'targets',
            sa.Column('is_archived', sa.Boolean(), nullable=True, server_default='0'),
        )

    # Add is_archived column to sessions table if it doesn't exist
    if 'is_archived' not in sessions_columns:
        op.add_column(
            'sessions',
            sa.Column('is_archived', sa.Boolean(), nullable=True, server_default='0'),
        )

    # Update existing records to set is_archived to False
    op.execute("UPDATE targets SET is_archived = '0' WHERE is_archived IS NULL")
    op.execute("UPDATE sessions SET is_archived = '0' WHERE is_archived IS NULL")


def downgrade():
    # Remove is_archived column from targets table
    op.drop_column('targets', 'is_archived')

    # Remove is_archived column from sessions table
    op.drop_column('sessions', 'is_archived')
