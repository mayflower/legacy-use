"""add_clerk_user_id

Revision ID: 2478611410c3
Revises: 6d173f57c620
Create Date: 2025-09-23 12:43:27.697355

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from server.migrations.tenant import for_each_tenant_schema

# revision identifiers, used by Alembic.
revision: str = '2478611410c3'
down_revision: Union[str, None] = '6d173f57c620'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


@for_each_tenant_schema
def upgrade(schema: str) -> None:
    op.add_column(
        'tenants',
        sa.Column('clerk_user_id', sa.String(length=256), nullable=True),
        schema='shared',
    )
    op.create_unique_constraint(
        'unique_clerk_user_id', 'tenants', ['clerk_user_id'], schema='shared'
    )


@for_each_tenant_schema
def downgrade(schema: str) -> None:
    op.drop_constraint(
        'unique_clerk_user_id', 'tenants', schema='shared', type_='unique'
    )
    op.drop_column('tenants', 'clerk_user_id', schema='shared')
