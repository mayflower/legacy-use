"""add archive_reason and last_job_time columns

Revision ID: add_archive_reason_column
Revises: add_is_archived_column
Create Date: 2023-03-13 12:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = 'add_archive_reason_column'
down_revision = 'add_is_archived_column'
branch_labels = None
depends_on = None


def upgrade():
    # Check if columns exist before adding
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    sessions_columns = [column['name'] for column in inspector.get_columns('sessions')]

    # Add archive_reason column to sessions table if it doesn't exist
    if 'archive_reason' not in sessions_columns:
        op.add_column(
            'sessions', sa.Column('archive_reason', sa.String(), nullable=True)
        )

    # Add last_job_time column to sessions table if it doesn't exist
    if 'last_job_time' not in sessions_columns:
        op.add_column(
            'sessions', sa.Column('last_job_time', sa.DateTime(), nullable=True)
        )


def downgrade():
    # Remove archive_reason column from sessions table
    op.drop_column('sessions', 'archive_reason')

    # Remove last_job_time column from sessions table
    op.drop_column('sessions', 'last_job_time')
