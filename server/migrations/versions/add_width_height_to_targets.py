"""add width and height columns to targets

Revision ID: add_width_height_to_targets
Revises: fcfc272b8ede
Create Date: 2023-05-23 12:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = 'add_width_height_to_targets'
down_revision = 'fcfc272b8ede'
branch_labels = None
depends_on = None


def upgrade():
    # Add width and height columns to targets table with default values
    # SQLite doesn't support ALTER COLUMN for making columns NOT NULL after they've been added
    # So we'll just add the columns with default values
    op.add_column(
        'targets', sa.Column('width', sa.String(), nullable=True, server_default='1024')
    )
    op.add_column(
        'targets', sa.Column('height', sa.String(), nullable=True, server_default='768')
    )

    # Update existing records to set width and height to the default values
    op.execute("UPDATE targets SET width = '1024' WHERE width IS NULL")
    op.execute("UPDATE targets SET height = '768' WHERE height IS NULL")

    # SQLite doesn't support ALTER COLUMN for changing column constraints
    # So we'll rely on the model definition to enforce the NOT NULL constraint


def downgrade():
    # Remove width and height columns from targets table
    op.drop_column('targets', 'width')
    op.drop_column('targets', 'height')
