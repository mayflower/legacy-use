"""add clerk_creation_id to tenants

Revision ID: 358ad974bbed
Revises: 6d173f57c620
Create Date: 2025-09-22 11:38:03.857546

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '358ad974bbed'
down_revision: Union[str, None] = '6d173f57c620'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add clerk_creation_id column to the tenants table in the shared schema
    op.add_column(
        'tenants',
        sa.Column('clerk_creation_id', sa.String(length=256), nullable=True),
        schema='shared',
    )


def downgrade() -> None:
    # Remove clerk_creation_id column from the tenants table in the shared schema
    op.drop_column('tenants', 'clerk_creation_id', schema='shared')
