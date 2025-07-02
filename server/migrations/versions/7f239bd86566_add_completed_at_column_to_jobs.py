"""add completed_at column to jobs

Revision ID: 7f239bd86566
Revises: 94d336251c2d
Create Date: 2024-03-25 13:30:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = '7f239bd86566'
down_revision = '94d336251c2d'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Check if column exists before adding
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    jobs_columns = [column['name'] for column in inspector.get_columns('jobs')]

    # Add completed_at column to jobs table if it doesn't exist
    if 'completed_at' not in jobs_columns:
        op.add_column('jobs', sa.Column('completed_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    # Remove completed_at column from jobs table
    op.drop_column('jobs', 'completed_at')
